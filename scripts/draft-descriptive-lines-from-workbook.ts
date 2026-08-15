/**
 * Draft: line-by-line "descriptive design" text from a workbook — **static wording only**.
 *
 * - Walks each sheet (SheetJS: .xls / .xlsx).
 * - Emits one line per cell: `SheetName!A1<TAB>text`
 * - Skips: empty cells, **formulas** (`.f`), **numeric** cells (data), optional **column D** on INPUT-* (input values).
 *
 * This is how you get word-for-word parity with the Excel **except data**: you define "data" as
 * numbers, formula results, and (here) column D on INPUT sheets — tighten the rules to match your office.
 *
 * Run:
 *   npx tsx scripts/draft-descriptive-lines-from-workbook.ts [path-to.xls|.xlsx]
 * Default reference:
 *   Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const DEFAULT_REF = path.resolve(
  'Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls',
);

const MAX_ROWS = 600;
const MAX_COLS = 26;

function encodeA1(r0: number, c0: number): string {
  return XLSX.utils.encode_cell({ r: r0, c: c0 });
}

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

function isDataCell(sheetName: string, c0: number): boolean {
  if (sheetName.startsWith('INPUT-') && c0 === 3) return true;
  return false;
}

function cellStaticText(sheet: XLSX.WorkSheet, r0: number, c0: number): string | null {
  const addr = encodeA1(r0, c0);
  const cell = sheet[addr] as XLSX.CellObject | undefined;
  if (!cell) return null;
  if (cell.f != null && String(cell.f).length > 0) return null;
  if (cell.t === 'n') return null;
  if (cell.t === 'b') return null;
  const raw = (cell.w ?? (cell.v == null ? '' : String(cell.v))).trim();
  if (!raw) return null;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/i.test(raw)) return null;
  return raw.replace(/\s+/g, ' ').trim();
}

function emitLines(filePath: string, outPath?: string): void {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const lines: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet?.['!ref']) continue;
    const range = XLSX.utils.decode_range(sheet['!ref'] as string);
    const rEnd = Math.min(range.e.r, range.s.r + MAX_ROWS);
    const cEnd = Math.min(range.e.c, range.s.c + MAX_COLS);

    for (let r0 = range.s.r; r0 <= rEnd; r0++) {
      for (let c0 = range.s.c; c0 <= cEnd; c0++) {
        if (isDataCell(sheetName, c0)) continue;
        const t = cellStaticText(sheet, r0, c0);
        if (!t) continue;
        const a1 = `${colIndexToLetter(c0)}${r0 + 1}`;
        lines.push(`${sheetName}!${a1}\t${t}`);
      }
    }
  }

  const body = lines.join('\n');
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, body, 'utf8');
    console.log(`Wrote ${lines.length} lines → ${outPath}`);
  } else {
    process.stdout.write(body);
  }
}

const ref = process.argv[2] || (fs.existsSync(DEFAULT_REF) ? DEFAULT_REF : null);
if (!ref || !fs.existsSync(ref)) {
  console.error('Usage: npx tsx scripts/draft-descriptive-lines-from-workbook.ts [workbook.xls|.xlsx]');
  console.error('Missing file:', ref);
  process.exit(1);
}

const outDefault = path.resolve('archive/test-outputs/descriptive-static-lines.txt');
emitLines(ref, outDefault);
