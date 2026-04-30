/**
 * Assimilate reference workbook(s) **sheet by sheet** with console progress.
 *
 * - Uses `workbook-standards-config.ts`: first standard is `stabil*.xls` (LARATHI SOM RIVER).
 * - More standards: add to WORKBOOK_STANDARDS and re-run.
 * - Per sheet: counts static text cells (same rules as draft-descriptive-lines: skip formulas, numbers, INPUT-* col D).
 * - Writes `archive/test-outputs/assimilation-report.json`.
 *
 * Run: npx tsx scripts/assimilate-sheet-by-sheet.ts
 *      npm run assimilate:standards
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { listResolvedStandards, type WorkbookStandardDef } from './workbook-standards-config';

const OUT_DIR = path.resolve('archive/test-outputs');
const REPORT_JSON = path.join(OUT_DIR, 'assimilation-report.json');
const LINES_DIR = path.join(OUT_DIR, 'assimilation-lines');

const MAX_ROWS = 600;
const MAX_COLS = 26;

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

function isDataColumn(sheetName: string, c0: number): boolean {
  return sheetName.startsWith('INPUT-') && c0 === 3;
}

function cellStaticText(sheet: XLSX.WorkSheet, r0: number, c0: number): string | null {
  const addr = XLSX.utils.encode_cell({ r: r0, c: c0 });
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

type SheetResult = {
  sheetName: string;
  index: number;
  totalSheets: number;
  staticTextCells: number;
  usedRange: string | null;
};

function assimilateOneStandard(
  def: WorkbookStandardDef,
  filePath: string,
  standardOrdinal: number,
  standardCount: number,
): {
  id: string;
  label: string;
  filePath: string;
  sheets: SheetResult[];
  totalStaticCells: number;
} {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const names = wb.SheetNames;
  const sheets: SheetResult[] = [];
  let totalStaticCells = 0;

  console.log('');
  console.log(`━━━━━━━━ Standard ${standardOrdinal}/${standardCount}: ${def.id}`);
  console.log(`   ${def.label}`);
  console.log(`   File: ${filePath}`);
  console.log(`   Sheets: ${names.length}`);
  console.log('');

  let idx = 0;
  for (const sheetName of names) {
    idx += 1;
    const sheet = wb.Sheets[sheetName];
    const pct = ((idx / names.length) * 100).toFixed(1);
    process.stdout.write(`   [${idx}/${names.length}] (${pct}%) ${sheetName} … `);

    let staticTextCells = 0;
    let usedRange: string | null = null;
    if (sheet?.['!ref']) {
      usedRange = sheet['!ref'] as string;
      const range = XLSX.utils.decode_range(usedRange);
      const rEnd = Math.min(range.e.r, range.s.r + MAX_ROWS);
      const cEnd = Math.min(range.e.c, range.s.c + MAX_COLS);
      for (let r0 = range.s.r; r0 <= rEnd; r0++) {
        for (let c0 = range.s.c; c0 <= cEnd; c0++) {
          if (isDataColumn(sheetName, c0)) continue;
          if (cellStaticText(sheet, r0, c0)) staticTextCells++;
        }
      }
    }

    totalStaticCells += staticTextCells;
    sheets.push({
      sheetName,
      index: idx,
      totalSheets: names.length,
      staticTextCells,
      usedRange,
    });

    console.log(`✓ static cells: ${staticTextCells}`);
  }

  console.log('');
  console.log(`   Done. Total static text cells (this standard): ${totalStaticCells}`);
  console.log('');

  return {
    id: def.id,
    label: def.label,
    filePath,
    sheets,
    totalStaticCells,
  };
}

function writePerSheetLines(filePath: string, standardId: string): void {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  fs.mkdirSync(LINES_DIR, { recursive: true });

  let si = 0;
  for (const sheetName of wb.SheetNames) {
    si += 1;
    process.stdout.write(`      lines [${si}/${wb.SheetNames.length}] ${sheetName} … `);
    const sheet = wb.Sheets[sheetName];
    if (!sheet?.['!ref']) {
      console.log('(skip empty)');
      continue;
    }
    const lines: string[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] as string);
    const rEnd = Math.min(range.e.r, range.s.r + MAX_ROWS);
    const cEnd = Math.min(range.e.c, range.s.c + MAX_COLS);
    for (let r0 = range.s.r; r0 <= rEnd; r0++) {
      for (let c0 = range.s.c; c0 <= cEnd; c0++) {
        if (isDataColumn(sheetName, c0)) continue;
        const t = cellStaticText(sheet, r0, c0);
        if (!t) continue;
        const a1 = `${colIndexToLetter(c0)}${r0 + 1}`;
        lines.push(`${sheetName}!${a1}\t${t}`);
      }
    }
    const safe = sheetName.replace(/[^\w\-]+/g, '_').slice(0, 80);
    const outFile = path.join(LINES_DIR, `${standardId}__${safe}.txt`);
    fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
    console.log(`✓ ${lines.length} lines`);
  }
}

async function main(): Promise<void> {
  const resolved = listResolvedStandards();
  if (resolved.length === 0) {
    console.error('No workbook standards resolved. Place stabil*.xls in Attached_Assets or set paths in workbook-standards-config.ts');
    process.exit(1);
  }

  console.log('══════════════════════════════════════════════════════════════');
  console.log('  Assimilate workbook standards — sheet by sheet');
  console.log('══════════════════════════════════════════════════════════════');

  const results: ReturnType<typeof assimilateOneStandard>[] = [];
  let sOrd = 0;
  const stdCount = resolved.length;

  for (const { def, filePath } of resolved) {
    sOrd += 1;
    results.push(assimilateOneStandard(def, filePath, sOrd, stdCount));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    standardsConfigured: resolved.length,
    note: 'First standard is stabil*.xls (LARATHI). Add WORKBOOK_STANDARDS entries for more.',
    results,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Report: ${REPORT_JSON}`);

  // Optional: per-sheet line dumps for first standard only (keeps disk smaller)
  const first = resolved[0];
  if (first) {
    console.log(`Writing per-sheet static lines → ${LINES_DIR} (${first.def.id}) …`);
    writePerSheetLines(first.filePath, first.def.id);
    console.log('Done.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
