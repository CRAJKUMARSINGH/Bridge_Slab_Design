/**
 * Dump .xls / .xlsx to JSONL-per-sheet + summary JSON using SheetJS (reads legacy xls).
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import type { ExtractedCell, SheetSummary, WorkbookExtractSummary } from './types';

function colIndexToLetter(c0: number): string {
  let n = c0 + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function addr(r0: number, c0: number): string {
  return `${colIndexToLetter(c0)}${r0 + 1}`;
}

export type ExcelExtractOptions = {
  maxRows: number;
  maxCols: number;
};

/**
 * @param maxRows 0 = no row cap (use full range)
 * @param maxCols 0 = no col cap
 */
export function extractWorkbookToDir(
  absoluteFilePath: string,
  relativePathForMeta: string,
  outDir: string,
  opts: ExcelExtractOptions,
): WorkbookExtractSummary {
  const buf = fs.readFileSync(absoluteFilePath);
  const wb = XLSX.read(buf, {
    type: 'buffer',
    cellDates: true,
    cellFormula: true,
    cellNF: false,
    cellStyles: false,
  });

  const sheetNames = wb.SheetNames;
  const sheetsDir = path.join(outDir, 'sheets');
  fs.mkdirSync(sheetsDir, { recursive: true });

  const summaries: SheetSummary[] = [];
  let truncated = false;

  for (const name of sheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet || !sheet['!ref']) {
      summaries.push({
        name,
        ref: null,
        rowCount: 0,
        colCount: 0,
        formulaCellCount: 0,
        nonEmptyCellCount: 0,
        merges: [],
      });
      const emptyPath = path.join(sheetsDir, `${safeSheetFileName(name)}.jsonl`);
      fs.writeFileSync(emptyPath, '', 'utf8');
      continue;
    }

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const rEndFull = range.e.r;
    const cEndFull = range.e.c;
    let rEnd = rEndFull;
    let cEnd = cEndFull;
    if (opts.maxRows > 0 && rEnd - range.s.r + 1 > opts.maxRows) {
      rEnd = range.s.r + opts.maxRows - 1;
      truncated = true;
    }
    if (opts.maxCols > 0 && cEnd - range.s.c + 1 > opts.maxCols) {
      cEnd = range.s.c + opts.maxCols - 1;
      truncated = true;
    }

    const mergesRaw = (sheet['!merges'] ?? []) as Array<{
      s: { r: number; c: number };
      e: { r: number; c: number };
    }>;
    const merges = mergesRaw.map((m) => ({
      s: { r: m.s.r, c: m.s.c },
      e: { r: m.e.r, c: m.e.c },
    }));

    let formulaCellCount = 0;
    let nonEmptyCellCount = 0;
    const lines: string[] = [];

    for (let r0 = range.s.r; r0 <= rEnd; r0++) {
      for (let c0 = range.s.c; c0 <= cEnd; c0++) {
        const a = addr(r0, c0);
        const cell = sheet[a] as XLSX.CellObject | undefined;
        if (!cell) continue;
        const hasF = cell.f != null && String(cell.f).length > 0;
        const hasV = cell.v !== undefined && cell.v !== null && cell.v !== '';
        if (!hasF && !hasV && !(cell.w != null && String(cell.w).trim())) continue;

        nonEmptyCellCount++;
        if (hasF) formulaCellCount++;

        const rec: ExtractedCell = {
          a,
          r: r0 + 1,
          c: c0 + 1,
          t: cell.t,
          v: cell.v instanceof Date ? cell.v.toISOString() : cell.v,
        };
        if (cell.w != null && String(cell.w).length) rec.w = String(cell.w);
        if (hasF) rec.f = String(cell.f);
        lines.push(JSON.stringify(rec));
      }
    }

    const sheetFile = path.join(sheetsDir, `${safeSheetFileName(name)}.jsonl`);
    fs.writeFileSync(sheetFile, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');

    summaries.push({
      name,
      ref: sheet['!ref'] as string,
      rowCount: rEnd - range.s.r + 1,
      colCount: cEnd - range.s.c + 1,
      formulaCellCount,
      nonEmptyCellCount,
      merges,
    });
  }

  const summary: WorkbookExtractSummary = {
    fileName: path.basename(absoluteFilePath),
    relativePath: relativePathForMeta,
    sheetNames,
    sheets: summaries,
    truncated,
    maxRowsApplied: opts.maxRows > 0 ? opts.maxRows : null,
    maxColsApplied: opts.maxCols > 0 ? opts.maxCols : null,
  };

  fs.writeFileSync(path.join(outDir, 'workbook-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}

/** Safe file stem for sheet names (Windows + odd characters). */
export function safeSheetFileName(name: string): string {
  const s = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/\s+/g, ' ').trim();
  const base = s.length ? s : 'sheet';
  return base.length > 120 ? base.slice(0, 120) : base;
}
