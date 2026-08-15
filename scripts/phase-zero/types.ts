/**
 * Phase Zero — structured extract types (Excel + Word) for assessment / AI review.
 */

export type ExtractedCell = {
  /** A1-style address */
  a: string;
  r: number;
  c: number;
  /** SheetJS cell type: b, n, e, s, str, d, z (or undefined) */
  t?: string;
  /** Raw value (number, string, boolean, Date serial) */
  v: unknown;
  /** Formatted display string when present */
  w?: string;
  /** Formula string when present */
  f?: string;
};

export type SheetSummary = {
  name: string;
  ref: string | null;
  rowCount: number;
  colCount: number;
  formulaCellCount: number;
  nonEmptyCellCount: number;
  merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>;
};

export type WorkbookExtractSummary = {
  fileName: string;
  relativePath: string;
  sheetNames: string[];
  sheets: SheetSummary[];
  truncated: boolean;
  maxRowsApplied: number | null;
  maxColsApplied: number | null;
};

export type WordExtractSummary = {
  fileName: string;
  relativePath: string;
  charCount: number;
  paragraphCount: number;
};

export type ManifestFileEntry = {
  inputPath: string;
  relativePath: string;
  kind: 'excel' | 'word' | 'skipped';
  outputSubdir: string | null;
  ok: boolean;
  error?: string;
  durationMs: number;
  summary?: WorkbookExtractSummary | WordExtractSummary;
};

export type PhaseZeroManifest = {
  generatedAt: string;
  toolVersion: string;
  argv: string[];
  rootDirs: string[];
  outDir: string;
  options: {
    maxRows: number;
    maxCols: number;
    excel: boolean;
    word: boolean;
  };
  files: ManifestFileEntry[];
};
