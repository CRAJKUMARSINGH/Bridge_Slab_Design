/**
 * Pinned SheetJS implementation of the `XlsDecoderPort` declared by
 * `@workspace/engine/io/xls`.
 *
 * This is the only place `xlsx` touches the BIFF8 path, and it lives under `scripts/**`
 * because `scripts/check-audit-threshold.mjs` forbids importing `xlsx` from `lib/**`
 * (doing so fails `audit:policy`, which is part of `pnpm run gate`). See
 * docs/phase-2/week-02A/XLS-STRATEGY.md for the full decision and its P2-W04 T4.1
 * interaction.
 *
 * Contract: decode only, never throw. A cell whose formula failed must come back as
 * `kind: "error"` with its source text preserved — the matrix layer turns that into a
 * partial row plus a REVIEW flag.
 */
import * as XLSX from "xlsx";
import type {
  RawCell,
  RawDecodedWorkbook,
  RawSheet,
  XlsDecoderPort,
} from "@workspace/engine/io/xls";

/** BIFF error codes -> the literal Excel prints. */
const BIFF_ERRORS: Record<number, string> = {
  0x00: "#NULL!",
  0x07: "#DIV/0!",
  0x0f: "#VALUE!",
  0x17: "#REF!",
  0x1d: "#NAME?",
  0x24: "#NUM!",
  0x2a: "#N/A",
};

/**
 * The legacy corpus also carries *text* cells whose content is an unresolved reference
 * token (`#ERR:Ref`, `#ERR:Name`) left behind by an older converter. Those are not BIFF
 * error cells, so they have to be recognised by their literal.
 */
const ERROR_LITERAL = /^#(ERR:|REF!|NAME\?|DIV\/0!|VALUE!|NUM!|NULL!|N\/A\b)/;

function toRawCell(cell: XLSX.CellObject): RawCell {
  const text = typeof cell.w === "string" ? cell.w : undefined;
  const formula = typeof cell.f === "string" ? cell.f : undefined;
  const base: Pick<RawCell, "text" | "formula"> = {};
  if (text !== undefined) base.text = text;
  if (formula !== undefined) base.formula = formula;

  if (cell.t === "e") {
    const literal =
      typeof cell.v === "number"
        ? (BIFF_ERRORS[cell.v] ?? `#ERR:${cell.v}`)
        : String(cell.v ?? "#ERR");
    return { kind: "error", value: null, errorCode: literal, ...base };
  }

  if (cell.t === "z" || cell.v === undefined || cell.v === null) {
    return { kind: "blank", value: null, ...base };
  }

  if (cell.t === "n") {
    return { kind: "number", value: Number(cell.v), ...base };
  }

  if (cell.t === "b") {
    return { kind: "boolean", value: Boolean(cell.v), ...base };
  }

  if (cell.t === "d") {
    const iso = cell.v instanceof Date ? cell.v.toISOString() : String(cell.v);
    return { kind: "date", value: iso, ...base };
  }

  const value = String(cell.v);
  if (ERROR_LITERAL.test(value.trim())) {
    return { kind: "error", value, errorCode: value.trim(), ...base };
  }
  return { kind: "text", value, ...base };
}

function decodeSheet(name: string, sheet: XLSX.WorkSheet): RawSheet {
  const ref = sheet["!ref"];
  if (!ref) return { name, rows: [] };

  const range = XLSX.utils.decode_range(ref);
  const rows: (RawCell | null)[][] = [];

  for (let row = range.s.r; row <= range.e.r; row++) {
    const cells: (RawCell | null)[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[address];
      cells[col] = cell ? toRawCell(cell) : null;
    }
    rows[row] = cells;
  }

  return { name, rows };
}

export const sheetJsXlsDecoder: XlsDecoderPort = {
  decode(bytes: Buffer): RawDecodedWorkbook {
    const workbook = XLSX.read(bytes, {
      type: "buffer",
      cellFormula: true,
      cellDates: true,
    });
    return {
      sheets: workbook.SheetNames.map((name) =>
        decodeSheet(name, workbook.Sheets[name]),
      ),
    };
  },
};

export default sheetJsXlsDecoder;
