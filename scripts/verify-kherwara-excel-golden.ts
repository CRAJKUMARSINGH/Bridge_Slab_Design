/**
 * Current-workbook regression verifier.
 * Validates the active 46-sheet generator contract used in this repository.
 *
 * Run: npm run verify:excel
 */

import ExcelJS from 'exceljs';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';
import { LARATHI_STABIL_REFERENCE_INPUT } from './fixtures/larathi-stabil-project-input';
import { MINIMAL_CHANNEL_PROJECT_INPUT } from './fixtures/minimal-channel-project-input';

const REQUIRED_SHEETS = [
  'INDEX',
  'INSERT- HYDRAULICS',
  'afflux calculation',
  'HYDRAULICS',
  'Deck Anchorage',
  'CROSS SECTION',
  'Bed Slope',
  'SBC',
  'STABILITY CHECK FOR PIER',
  'abstract of stresses',
  'LLOAD',
  'loadsumm',
  'TYPE1-STABILITY CHECK ABUTMENT',
  'TYPE1-ABUTMENT FOOTING DESIGN',
  'TYPE1-STEEL IN ABUTMENT',
  'TechNote',
  'Tech Report',
  'General Abs.',
  'Abstract',
  'Bridge measurements',
] as const;

function getFormula(cell: ExcelJS.Cell): string | undefined {
  const v = cell.value as { formula?: string; sharedFormula?: string } | null | undefined;
  if (v && typeof v === 'object') {
    if (typeof v.formula === 'string') return v.formula;
    if (typeof v.sharedFormula === 'string') return v.sharedFormula;
  }
  if (typeof cell.value === 'string' && cell.value.startsWith('=')) return cell.value;
  return undefined;
}

function normalizeFormula(f: string): string {
  return f.replace(/\s+/g, '').toUpperCase().replace(/'HYDRAULICS'!/g, 'HYDRAULICS!');
}

function findLabelRow(ws: ExcelJS.Worksheet, label: string, col = 2, maxRow = 120): number {
  const want = label.trim().toUpperCase();
  for (let r = 1; r <= maxRow; r++) {
    const got = String(ws.getRow(r).getCell(col).value ?? '').trim().toUpperCase();
    if (got === want) return r;
  }
  return -1;
}

function assertCondition(cond: boolean, msg: string, failedRef: { v: boolean }): void {
  if (!cond) {
    console.error(msg);
    failedRef.v = true;
  }
}

function verifyWorkbook(tag: string, wb: ExcelJS.Workbook, failedRef: { v: boolean }) {
  assertCondition(
    wb.worksheets.length === 46,
    `${tag}: expected 46 worksheets, got ${wb.worksheets.length}`,
    failedRef
  );

  for (const name of REQUIRED_SHEETS) {
    assertCondition(Boolean(wb.getWorksheet(name)), `${tag}: missing worksheet "${name}"`, failedRef);
  }

  const hyd = wb.getWorksheet('HYDRAULICS');
  const afflux = wb.getWorksheet('afflux calculation');
  if (!hyd || !afflux) return;

  // HYDRAULICS totals and summary block should remain formula-driven.
  const totalRow = findLabelRow(hyd, 'TOTAL', 3, 80);
  assertCondition(totalRow > 0, `${tag}: HYDRAULICS TOTAL row not found`, failedRef);
  if (totalRow > 0) {
    const fTotArea = getFormula(hyd.getRow(totalRow).getCell(6));
    const fTotPeri = getFormula(hyd.getRow(totalRow).getCell(7));
    assertCondition(
      Boolean(fTotArea && normalizeFormula(fTotArea).startsWith('=SUM(F')),
      `${tag}: HYDRAULICS F${totalRow} expected SUM(F...) formula`,
      failedRef
    );
    assertCondition(
      Boolean(fTotPeri && normalizeFormula(fTotPeri).startsWith('=SUM(G')),
      `${tag}: HYDRAULICS G${totalRow} expected SUM(G...) formula`,
      failedRef
    );
  }

  // afflux sheet should reference HYDRAULICS values in key hydraulic inputs.
  const a6 = getFormula(afflux.getRow(6).getCell(3));
  const a7 = getFormula(afflux.getRow(7).getCell(3));
  assertCondition(
    Boolean(a6 && normalizeFormula(a6).includes('HYDRAULICS!')),
    `${tag}: afflux C6 expected reference to HYDRAULICS`,
    failedRef
  );
  assertCondition(
    Boolean(a7 && normalizeFormula(a7).includes('HYDRAULICS!')),
    `${tag}: afflux C7 expected reference to HYDRAULICS`,
    failedRef
  );
}

async function verifyInput(tag: string, input: ProjectInput, failedRef: { v: boolean }) {
  const buffer = await generateCompleteExcel(input);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  verifyWorkbook(tag, wb, failedRef);
}

async function main(): Promise<void> {
  const failedRef = { v: false };

  await verifyInput('Kherwara', KHERWARA_REFERENCE_PROJECT_INPUT, failedRef);
  await verifyInput('Larathi', LARATHI_STABIL_REFERENCE_INPUT, failedRef);
  await verifyInput('MinimalChannel', MINIMAL_CHANNEL_PROJECT_INPUT, failedRef);

  if (failedRef.v) {
    console.error('verify-kherwara-excel-golden: FAILED');
    process.exit(1);
  }

  console.log('verify-kherwara-excel-golden: OK (current 46-sheet contract validated)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

