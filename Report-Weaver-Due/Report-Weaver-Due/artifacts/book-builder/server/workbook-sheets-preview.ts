/**
 * Build JSON grid previews for every worksheet in the generated design workbook (for online display).
 */

import ExcelJS from 'exceljs';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { generateCompleteExcel } from '../bridge-excel-generator/index';

export type WorkbookSheetPreview = {
  name: string;
  rowCount: number;
  colCount: number;
  rows: string[][];
};

const MAX_ROWS = 140;
const MAX_COLS = 18;

/** Same worksheet name as `bridge-excel-generator/sheets/09-stability-check-pier.ts`. */
export const STABILITY_CHECK_PIER_SHEET_NAME = 'STABILITY CHECK FOR PIER';

/** Pier sheet in the generator is ~400 rows × 36 cols; single-sheet preview uses full extent. */
const SINGLE_SHEET_MAX_ROWS = 500;
const SINGLE_SHEET_MAX_COLS = 36;

function cellDisplay(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) {
    const n = v;
    if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-4 && n !== 0)) return n.toExponential(4);
    return Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(12)));
  }
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'object' && v !== null && 'formula' in v) {
    const f = (v as { formula?: string; result?: unknown }).formula;
    const r = (v as { result?: unknown }).result;
    if (r != null && r !== '') return String(r);
    if (f) return `=${f}`;
  }
  if (typeof v === 'object' && v !== null && 'richText' in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((x) => x.text).join('');
  }
  if (typeof v === 'object' && v !== null && 'text' in v) {
    return String((v as { text: string }).text);
  }
  return String(v);
}

export async function buildWorkbookSheetPreviews(
  input: ProjectInput,
  options: { model?: 'model-a' | 'model-b' } = {}
): Promise<WorkbookSheetPreview[]> {
  const buffer = await generateCompleteExcel(input, options);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);

  const out: WorkbookSheetPreview[] = [];

  for (const ws of wb.worksheets) {
    const rowEnd = Math.min(ws.rowCount || 1, MAX_ROWS);
    const rows: string[][] = [];
    let maxCol = 1;

    for (let r = 1; r <= rowEnd; r++) {
      const row = ws.getRow(r);
      const line: string[] = [];
      for (let c = 1; c <= MAX_COLS; c++) {
        const s = cellDisplay(row.getCell(c));
        line.push(s);
        if (s) maxCol = Math.max(maxCol, c);
      }
      rows.push(line);
    }

    while (rows.length > 0 && rows[rows.length - 1].every((c) => !c)) {
      rows.pop();
    }

    out.push({
      name: ws.name,
      rowCount: rows.length,
      colCount: maxCol,
      rows: rows.map((line) => line.slice(0, maxCol)),
    });
  }

  return out;
}

/**
 * One worksheet, full row/column span (for online “same as Excel” view — e.g. pier stability).
 */
export async function buildSingleWorkbookSheetPreview(
  input: ProjectInput,
  sheetName: string,
  options?: { maxRows?: number; maxCols?: number; model?: 'model-a' | 'model-b' }
): Promise<WorkbookSheetPreview | null> {
  const maxRows = options?.maxRows ?? SINGLE_SHEET_MAX_ROWS;
  const maxCols = options?.maxCols ?? SINGLE_SHEET_MAX_COLS;
  const buffer = await generateCompleteExcel(input, { model: options?.model });
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return null;

  const rowEnd = Math.min(ws.rowCount || 1, maxRows);
  const rows: string[][] = [];
  let maxCol = 1;

  for (let r = 1; r <= rowEnd; r++) {
    const row = ws.getRow(r);
    const line: string[] = [];
    for (let c = 1; c <= maxCols; c++) {
      const s = cellDisplay(row.getCell(c));
      line.push(s);
      if (s) maxCol = Math.max(maxCol, c);
    }
    rows.push(line);
  }

  while (rows.length > 0 && rows[rows.length - 1].every((c) => !c)) {
    rows.pop();
  }

  return {
    name: sheetName,
    rowCount: rows.length,
    colCount: maxCol,
    rows: rows.map((line) => line.slice(0, maxCol)),
  };
}
