/**
 * P2-W02A T2A.3 — corpus/oracle/<bridge>.json extractor.
 *
 * What it does
 * ------------
 * Reads the frozen corpus manifest (`corpus/raw/manifest.json`), opens each copied
 * workbook and writes one JSON file per bridge into `corpus/oracle/`, capturing
 * **every value** from every sheet with its provenance: sheet name, A1 address,
 * row/col, cell kind, decoded value, display text, formula and any error literal.
 *
 * Why it reads through the matrix layer
 * ------------------------------------
 * `@workspace/engine/io/xls` is the frozen `.xls` contract (see
 * docs/phase-2/week-02A/XLS-STRATEGY.md). Using it here means every emitted value
 * carries the same container proof, sha256 provenance and error-cell → REVIEW
 * semantics that the parity gates will later rely on. This script owns no decoding
 * of its own.
 *
 * The one branching case: `BED-SUB` is the single OOXML `.xlsx` in the corpus.
 * `readXlsMatrix()` rejects `.xlsx` by design (`assertBiff8`), so the `.xlsx` path
 * decodes directly through the same pinned decoder and reuses `matrixFromDecoded()`
 * — identical matrix contract, minus only the BIFF8 container assertion that does
 * not apply to an OOXML zip.
 *
 * Determinism
 * -----------
 * The emitted files carry **no wall-clock timestamp**. Provenance is the source
 * sha256, which is stable across runs, so re-emitting an unchanged corpus produces
 * byte-identical files (project rule: byte-reproducible artefacts).
 *
 * Run
 * ---
 *   node --import tsx scripts/assimilate/emit-oracle.ts
 *   node --import tsx scripts/assimilate/emit-oracle.ts --only=SOM-KHW,BED-HL
 *   node --import tsx scripts/assimilate/emit-oracle.ts --out=tmp/oracle-preview
 *
 * Exit codes: 0 = every requested bridge emitted and its sha256 matched the manifest
 *             1 = at least one bridge failed (printed; the others still emit)
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNotLfsPointer,
  matrixFromDecoded,
  readXlsMatrix,
  type XlsCell,
  type XlsReview,
  type XlsWorkbookMatrix,
} from "@workspace/engine/io/xls";
import { sheetJsXlsDecoder } from "./sheetjs-xls-decoder.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_MANIFEST = "corpus/raw/manifest.json";
const DEFAULT_OUT_DIR = "corpus/oracle";
const ORACLE_SCHEMA_VERSION = "oracle-bridge.v1";

interface ManifestEntry {
  bridgeCode: string;
  bridgeClass: string;
  description: string;
  fileName: string;
  relativePath: string;
  sourcePath: string;
  format: string;
  bytes: number;
  sha256: string;
}

interface CorpusManifest {
  entries: ManifestEntry[];
}

interface OracleCell {
  address: string;
  row: number;
  col: number;
  kind: XlsCell["kind"];
  value: XlsCell["value"];
  text?: string;
  formula?: string;
  errorCode?: string;
}

interface OracleSheet {
  name: string;
  index: number;
  maxRow: number;
  maxCol: number;
  hasErrors: boolean;
  cells: OracleCell[];
}

interface OracleBridgeFile {
  schemaVersion: typeof ORACLE_SCHEMA_VERSION;
  bridgeCode: string;
  bridgeClass: string;
  description: string;
  source: {
    fileName: string;
    relativePath: string;
    sourcePath: string;
    format: string;
    sha256: string;
    bytes: number;
    manifestSha256: string;
  };
  sheetCount: number;
  cellCount: number;
  errorCellCount: number;
  review: XlsReview;
  sheets: OracleSheet[];
}

function parseArgs(argv: string[]): {
  manifest: string;
  outDir: string;
  only: Set<string> | null;
} {
  const opts = { manifest: DEFAULT_MANIFEST, outDir: DEFAULT_OUT_DIR, only: null as Set<string> | null };
  for (const arg of argv) {
    if (arg.startsWith("--manifest=")) opts.manifest = arg.slice("--manifest=".length);
    else if (arg.startsWith("--out=")) opts.outDir = arg.slice("--out=".length);
    else if (arg.startsWith("--only=")) {
      const codes = arg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean);
      opts.only = new Set(codes);
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "emit-oracle.ts [--manifest=corpus/raw/manifest.json] [--out=corpus/oracle] [--only=CODE,CODE]",
      );
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg} (see --help)`);
    }
  }
  return opts;
}

/**
 * Read one workbook into the frozen matrix shape. `label` is the repo-relative path
 * written into the artefact; `absPath` is what actually gets opened, so the script is
 * correct regardless of the process' working directory.
 */
function readMatrix(entry: ManifestEntry, label: string, absPath: string): XlsWorkbookMatrix {
  if (entry.format === "biff8") {
    // readXlsMatrix proves the OLE2/CFB container; the label replaces the absolute
    // path so the emitted provenance stays portable and hash-stable.
    return { ...readXlsMatrix(absPath, sheetJsXlsDecoder), sourcePath: label };
  }
  if (entry.format === "xlsx") {
    const bytes = readFileSync(absPath);
    assertNotLfsPointer(bytes, label);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const raw = sheetJsXlsDecoder.decode(bytes, label);
    return matrixFromDecoded(raw, label, sha256, bytes.length);
  }
  throw new Error(`unsupported corpus format "${entry.format}" for ${entry.bridgeCode}`);
}

function toOracleCells(matrix: XlsWorkbookMatrix): { sheets: OracleSheet[]; cellCount: number } {
  let cellCount = 0;
  const sheets = matrix.sheets.map((sheet) => {
    const cells: OracleCell[] = [];
    for (const row of sheet.rows) {
      for (const cell of row.cells) {
        if (cell.kind === "blank") continue; // a blank cell carries no value
        const out: OracleCell = {
          address: cell.address,
          row: cell.row,
          col: cell.col,
          kind: cell.kind,
          value: cell.value,
        };
        if (cell.text !== undefined) out.text = cell.text;
        if (cell.formula !== undefined) out.formula = cell.formula;
        if (cell.errorCode !== undefined) out.errorCode = cell.errorCode;
        cells.push(out);
        cellCount++;
      }
    }
    return {
      name: sheet.name,
      index: sheet.index,
      maxRow: sheet.maxRow,
      maxCol: sheet.maxCol,
      hasErrors: sheet.hasErrors,
      cells,
    };
  });
  return { sheets, cellCount };
}

function emitOne(entry: ManifestEntry, outDir: string): { file: string; cellCount: number; errorCellCount: number } {
  const label = `corpus/raw/${entry.relativePath.replace(/\\/g, "/")}`;
  const absPath = join(REPO_ROOT, label);
  const matrix = readMatrix(entry, label, absPath);

  // Provenance is not optional: a matrix whose bytes differ from the frozen manifest
  // means the corpus moved under the oracle, and that must fail loudly, not emit.
  if (matrix.sha256 !== entry.sha256) {
    throw new Error(
      `sha256 mismatch for ${entry.bridgeCode}: corpus/raw/manifest.json records ` +
        `${entry.sha256} but the bytes on disk hash to ${matrix.sha256}`,
    );
  }

  const { sheets, cellCount } = toOracleCells(matrix);
  const artifact: OracleBridgeFile = {
    schemaVersion: ORACLE_SCHEMA_VERSION,
    bridgeCode: entry.bridgeCode,
    bridgeClass: entry.bridgeClass,
    description: entry.description,
    source: {
      fileName: entry.fileName,
      relativePath: label,
      sourcePath: entry.sourcePath,
      format: entry.format,
      sha256: matrix.sha256,
      bytes: matrix.bytes,
      manifestSha256: entry.sha256,
    },
    sheetCount: matrix.sheetCount,
    cellCount,
    errorCellCount: matrix.review.errorCells.length,
    review: matrix.review,
    sheets,
  };

  const file = join(outDir, `${entry.bridgeCode}.json`);
  writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return { file, cellCount, errorCellCount: matrix.review.errorCells.length };
}

function main(): void {
  const { manifest, outDir, only } = parseArgs(process.argv.slice(2));
  const manifestPath = join(REPO_ROOT, manifest);
  const corpus = JSON.parse(readFileSync(manifestPath, "utf8")) as CorpusManifest;

  const selected = corpus.entries.filter((e) => !only || only.has(e.bridgeCode));
  if (only) {
    const known = new Set(corpus.entries.map((e) => e.bridgeCode));
    const unknown = [...only].filter((c) => !known.has(c));
    if (unknown.length > 0) throw new Error(`--only names no corpus bridge: ${unknown.join(", ")}`);
  }
  if (selected.length === 0) throw new Error(`no corpus entries selected from ${manifest}`);

  const resolvedOutDir = join(REPO_ROOT, outDir);
  mkdirSync(resolvedOutDir, { recursive: true });

  console.log(`emit-oracle: ${selected.length} bridge(s) -> ${outDir}`);
  const failures: string[] = [];
  let totalCells = 0;
  let reviewCount = 0;

  for (const entry of selected) {
    try {
      const { file, cellCount, errorCellCount } = emitOne(entry, resolvedOutDir);
      totalCells += cellCount;
      if (errorCellCount > 0) reviewCount += 1;
      console.log(
        `  OK   ${entry.bridgeCode.padEnd(14)} cells:${String(cellCount).padStart(6)}` +
          `${errorCellCount > 0 ? ` review:${errorCellCount}` : ""}  -> ${file}`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push(`${entry.bridgeCode}: ${reason}`);
      console.error(`  FAIL ${entry.bridgeCode.padEnd(14)} ${reason}`);
    }
  }

  console.log(
    `emit-oracle: ${selected.length - failures.length}/${selected.length} emitted, ` +
      `${totalCells} cells, ${reviewCount} workbooks flagged for review`,
  );

  if (failures.length > 0) {
    console.error(`emit-oracle: ${failures.length} failure(s)`);
    process.exit(1);
  }
}

main();
