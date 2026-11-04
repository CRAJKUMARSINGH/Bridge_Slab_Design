/**
 * BIFF8 (.xls) -> sheet/cell matrix.
 *
 * Why this exists
 * ---------------
 * Every legacy workbook in this repository is `.xls` (BIFF8): one OLE2/CFB compound
 * file whose `Workbook` stream is a sequence of BIFF records. The Phase-2 oracle is
 * keyed to those bytes, so the reader must (a) prove it is really looking at BIFF8,
 * (b) preserve the sheet/cell address of every value, and (c) never throw on a broken
 * formula cell — `#REF!` / `#NAME?` (and the source's textual `#ERR:*` variants) must
 * collapse to a partial row plus a REVIEW flag (see T2A.7).
 *
 * Why the record decoder is injected
 * ----------------------------------
 * `scripts/check-audit-threshold.mjs` permits the `xlsx` package to be imported from
 * `scripts/**` only; importing it from `lib/**` fails `pnpm run audit:policy`, which is
 * part of `pnpm run gate`. SheetJS is nevertheless the only reader in this tree that
 * opens BIFF8 (ExcelJS cannot), so this module owns everything that is dependency-free —
 * byte read, LFS-pointer rejection, BIFF8 magic-byte assertion, sha256, A1 addressing and
 * the REVIEW semantics — and receives the record decoder through `XlsDecoderPort`. The
 * pinned SheetJS implementation lives in `scripts/assimilate/sheetjs-xls-decoder.ts`.
 *
 * See docs/phase-2/week-02A/XLS-STRATEGY.md for the P2-W04 T4.1 interaction.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/** OLE2 / Compound File Binary signature — the container every BIFF8 `.xls` uses. */
export const OLE2_CFB_MAGIC = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
]);

/** ZIP signature — an OOXML `.xlsx` is a zip, so seeing this here is a caller error. */
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const LFS_POINTER_PREFIX = "version https://git-lfs";

export const MATRIX_SCHEMA_VERSION = "xls-matrix.v1";

/** Spreadsheet alphabet: 26 letters starting at the character code for `A`. */
const ALPHABET_SIZE = 26;
const CODE_A = 65;

export type XlsCellKind =
  | "number"
  | "text"
  | "boolean"
  | "date"
  | "error"
  | "blank";

export interface XlsCell {
  /** 1-based row number, as printed by Excel. */
  row: number;
  /** 1-based column number. */
  col: number;
  /** A1 address, e.g. `B7`. */
  address: string;
  kind: XlsCellKind;
  /** Decoded value; `null` for blanks and for genuine BIFF error cells. */
  value: number | string | boolean | null;
  /** The cell's formatted display text, when the source carried one. */
  text?: string;
  /** The A1 formula, when the cell is a formula. */
  formula?: string;
  /** Excel error literal for `kind === "error"`, e.g. `#REF!` or `#ERR:Ref`. */
  errorCode?: string;
}

export interface XlsRow {
  /** 1-based row number. */
  row: number;
  /** Cells up to the last non-blank column; interior gaps are `kind: "blank"`. */
  cells: XlsCell[];
}

export interface XlsSheet {
  name: string;
  index: number;
  rows: XlsRow[];
  maxRow: number;
  maxCol: number;
  /** True when this sheet contains at least one error cell. */
  hasErrors: boolean;
}

export interface XlsReview {
  /** True when the workbook needs a human look — e.g. it contains error cells. */
  flag: boolean;
  reasons: string[];
  /** `<sheet>!<A1>` locations of every error cell. */
  errorCells: string[];
}

export interface XlsWorkbookMatrix {
  schemaVersion: typeof MATRIX_SCHEMA_VERSION;
  /** The path the bytes were read from. */
  sourcePath: string;
  /** sha256 of the exact bytes read (lowercase hex) — the source provenance. */
  sha256: string;
  bytes: number;
  sheetCount: number;
  sheets: XlsSheet[];
  review: XlsReview;
}

/**
 * The contract with the pinned BIFF8 decoder. Implementations must be positional: the
 * index of a `RawCell` inside `rows[row][col]` is the zero-based absolute (row, col) of
 * the cell in the sheet, so `matrixFromDecoded()` can restore the A1 address.
 */
export interface RawCell {
  kind: XlsCellKind;
  value: number | string | boolean | null;
  text?: string;
  formula?: string;
  errorCode?: string;
}

export interface RawSheet {
  name: string;
  rows: (RawCell | null)[][];
}

export interface RawDecodedWorkbook {
  sheets: RawSheet[];
}

export interface XlsDecoderPort {
  /**
   * Decode BIFF8 workbook bytes into positional raw cells. Must not throw on error
   * cells — an unreadable formula becomes `kind: "error"`, never an exception.
   */
  decode(bytes: Buffer, sourcePath: string): RawDecodedWorkbook;
}

export class XlsFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XlsFormatError";
  }
}

export class LfsPointerError extends Error {
  constructor(filePath: string, oidSize: number | null) {
    super(
      `${filePath} is a Git LFS pointer, not the workbook (expected ${
        oidSize === null ? "the binary file" : `${oidSize} bytes`
      }).\n` +
        `    Fetch the real content first:\n` +
        `      git lfs pull --include="${filePath}"`,
    );
    this.name = "LfsPointerError";
  }
}

/** Throw if `buf` is LFS pointer text rather than workbook bytes. */
export function assertNotLfsPointer(buf: Buffer, sourcePath: string): void {
  const head = buf.subarray(0, LFS_POINTER_PREFIX.length).toString("utf8");
  if (head !== LFS_POINTER_PREFIX) return;
  const sizeMatch = /\bsize (\d+)/.exec(
    buf.subarray(0, 512).toString("utf8"),
  );
  throw new LfsPointerError(sourcePath, sizeMatch ? Number(sizeMatch[1]) : null);
}

/**
 * Assert that `buf` is a BIFF8 `.xls` (OLE2/CFB) and not an LFS stub or an OOXML
 * `.xlsx`. Named errors here are the whole point: a silent pass on the wrong container
 * is how the corpus would end up keyed to an empty reference.
 */
export function assertBiff8(buf: Buffer, sourcePath: string): void {
  assertNotLfsPointer(buf, sourcePath);
  if (buf.length === 0) {
    throw new XlsFormatError(`${sourcePath} is empty (0 bytes).`);
  }
  if (buf.subarray(0, OLE2_CFB_MAGIC.length).equals(OLE2_CFB_MAGIC)) return;
  if (buf.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    throw new XlsFormatError(
      `${sourcePath} is OOXML (.xlsx), not BIFF8 (.xls). Route .xlsx through the OOXML ` +
        `path, not through readXlsMatrix().`,
    );
  }
  const leading = buf.subarray(0, OLE2_CFB_MAGIC.length).toString("hex");
  throw new XlsFormatError(
    `${sourcePath} is not a BIFF8 (.xls) workbook (leading bytes ${leading}).`,
  );
}

/** 1-based column number -> spreadsheet letters (`1 -> A`, `27 -> AA`). */
export function columnLetter(col: number): string {
  let remaining = Math.trunc(col);
  let out = "";
  while (remaining > 0) {
    const offset = (remaining - 1) % ALPHABET_SIZE;
    out = String.fromCharCode(CODE_A + offset) + out;
    remaining = Math.floor((remaining - 1) / ALPHABET_SIZE);
  }
  return out;
}

function isPresent(cell: RawCell | null): boolean {
  return cell !== null && cell.kind !== "blank";
}

function toCell(source: RawCell | null, row: number, col: number): XlsCell {
  const address = `${columnLetter(col)}${row}`;
  if (!source || source.kind === "blank") {
    return { row, col, address, kind: "blank", value: null };
  }
  const cell: XlsCell = {
    row,
    col,
    address,
    kind: source.kind,
    value: source.value,
  };
  if (source.text !== undefined) cell.text = source.text;
  if (source.formula !== undefined) cell.formula = source.formula;
  if (source.errorCode !== undefined) cell.errorCode = source.errorCode;
  return cell;
}

/**
 * Normalise decoded raw cells into an addressed matrix. Fully blank rows are dropped
 * and trailing blank columns are trimmed, so the matrix stays positional without
 * carrying a sheet's whole formatted extent. Error cells are preserved in place and
 * also collected into `review.errorCells`.
 */
export function matrixFromDecoded(
  raw: RawDecodedWorkbook,
  sourcePath: string,
  sha256: string,
  bytes: number,
): XlsWorkbookMatrix {
  const sheets: XlsSheet[] = [];
  const errorCells: string[] = [];

  raw.sheets.forEach((sheet, sheetIndex) => {
    const rows: XlsRow[] = [];
    let maxCol = 0;

    sheet.rows.forEach((rawRow, rowIndex) => {
      const row = rowIndex + 1;
      let lastNonBlank = -1;
      rawRow.forEach((cell, colIndex) => {
        if (isPresent(cell)) lastNonBlank = colIndex;
      });
      if (lastNonBlank < 0) return; // entirely blank row: nothing to address

      const cells: XlsCell[] = [];
      for (let colIndex = 0; colIndex <= lastNonBlank; colIndex++) {
        const cell = toCell(rawRow[colIndex] ?? null, row, colIndex + 1);
        if (cell.kind === "error") {
          errorCells.push(`${sheet.name}!${cell.address}`);
        }
        cells.push(cell);
      }
      if (lastNonBlank + 1 > maxCol) maxCol = lastNonBlank + 1;
      rows.push({ row, cells });
    });

    sheets.push({
      name: sheet.name,
      index: sheetIndex,
      rows,
      maxRow: rows.length > 0 ? rows[rows.length - 1].row : 0,
      maxCol,
      hasErrors: rows.some((r) => r.cells.some((c) => c.kind === "error")),
    });
  });

  const reasons =
    errorCells.length > 0
      ? [
          `${errorCells.length} error cell(s) decoded as partial values; the affected ` +
            `rows are retained and the workbook is flagged for review. First: ` +
            `${errorCells.slice(0, 5).join(", ")}`,
        ]
      : [];

  return {
    schemaVersion: MATRIX_SCHEMA_VERSION,
    sourcePath,
    sha256,
    bytes,
    sheetCount: sheets.length,
    sheets,
    review: { flag: errorCells.length > 0, reasons, errorCells },
  };
}

/** Read a BIFF8 `.xls` from disk and return its addressed sheet/cell matrix. */
export function readXlsMatrix(
  filePath: string,
  decoder: XlsDecoderPort,
): XlsWorkbookMatrix {
  const bytes = readFileSync(filePath);
  assertBiff8(bytes, filePath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const raw = decoder.decode(bytes, filePath);
  return matrixFromDecoded(raw, filePath, sha256, bytes.length);
}
