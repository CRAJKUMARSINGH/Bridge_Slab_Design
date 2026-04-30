/**
 * SHEET 2: INSERT- HYDRAULICS
 * Hydraulic data summary — aligns with comprehensive PDF Sheet 02 and local validation wording.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, mergeCells, COLORS } from '../utils';

function fmt(n: number | undefined, decimals: number): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export async function generateInsertHydraulicsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('INSERT- HYDRAULICS');
  setColumnWidths(ws, [44, 16, 12, 48]);

  const h = input.hydraulics;
  const isHigh = input.bridgeType === 'high-level';
  const reqFb = h?.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2);

  let row = 1;
  mergeCells(ws, row, 1, row, 4);
  setCellValue(ws, row, 1, 'HYDRAULIC DATA SUMMARY');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: COLORS.PRIMARY } };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  row++;

  mergeCells(ws, row, 1, row, 4);
  setCellValue(
    ws,
    row,
    1,
    'Declares hydraulic inputs and derived controls for afflux, scour, and stability. High-level rows add deck clearance policy (IRC:5) consistent with the design engine and validation report.',
  );
  ws.getCell(row, 1).alignment = { wrapText: true, vertical: 'top' };
  ws.getRow(row).height = 36;
  row += 2;

  const headers = ['Parameter', 'Value', 'Unit', 'Narrative basis'];
  headers.forEach((text, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = text;
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BLUE } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  row++;

  type RowDef = [string, string | number, string, string];
  const rows: RowDef[] = [
    [
      'Bridge class',
      isHigh ? 'High-level slab bridge' : 'Submersible bridge',
      '—',
      'From project input (dual-mode workbook)',
    ],
    ['HFL (Highest Flood Level)', fmt(input.hfl, 3), 'm MSL', 'Flood benchmark input'],
    ['Bed Level', fmt(input.bedLevel, 3), 'm MSL', 'Channel bed reference'],
    ['Foundation Level', fmt(input.foundationLevel, 3), 'm MSL', 'Substructure founding control'],
    ['Design Discharge Q', fmt(h?.discharge, 2), 'cumecs', 'Area–velocity / Manning output'],
    ['Approach Velocity V', fmt(h?.velocity, 3), 'm/s', 'Consistency with Q and section A'],
    ['Manning n', fmt(input.manningN, 3), '—', 'Roughness coefficient input'],
    ['Bed Slope', `1 in ${input.bedSlope ?? '—'}`, '—', 'Energy slope input'],
    ['Cross Section Area A', fmt(h?.crossSectionalArea, 3), 'm²', 'Section integration'],
    ['Wetted Perimeter P', fmt(h?.wettedPerimeter, 3), 'm', 'Wetted boundary length'],
    ['Hydraulic Radius R', fmt(h?.hydraulicRadius, 4), 'm', 'R = A / P'],
    ['Afflux h', fmt(h?.afflux, 3), 'm', 'Molesworth backwater rise'],
    ['Design Water Level DWL', fmt(h?.designWaterLevel, 3), 'm MSL', 'DWL = HFL + afflux'],
    ['Froude number Fr', fmt(h?.froudeNumber, 4), '—', 'Flow regime indicator'],
    ['Flow regime', h?.flowType ?? '—', '—', 'Subcritical / supercritical'],
  ];

  if (isHigh) {
    rows.push(
      ['Deck Soffit Level', fmt(h?.soffitLevel, 3), 'm MSL', 'Explicit or RTL − deck thickness'],
      ['Clearance above HFL (soffit − HFL)', fmt(h?.freeboardAboveHfl, 3), 'm', 'As-built clearance above HFL'],
      ['Clearance above DWL (soffit − DWL)', fmt(h?.freeboard, 3), 'm', 'Relative to design flood level'],
      [
        'IRC min. freeboard above HFL (from design Q)',
        fmt(h?.ircMinimumFreeboardAboveHfl, 2),
        'm',
        'Discharge-tier minimum (IRC:5 practice — verify against office extract)',
      ],
      [
        'Project min. freeboard above HFL (input)',
        fmt(input.freeboardAboveHfl, 2),
        'm',
        'Additional project criterion',
      ],
      ['Governing required freeboard above HFL', fmt(reqFb, 2), 'm', 'max(IRC Q-based, project); used in engine check'],
      [
        'Deck clearance check (engine)',
        h?.isFreeboardSafe === true ? 'OK' : h?.isFreeboardSafe === false ? 'CHECK' : '—',
        '—',
        'Soffit ≥ HFL + governing required freeboard (same rule as validation report)',
      ],
    );
  }

  for (const [param, val, unit, note] of rows) {
    setCellValue(ws, row, 1, param);
    setCellValue(ws, row, 2, val);
    setCellValue(ws, row, 3, unit);
    setCellValue(ws, row, 4, note);
    for (let c = 1; c <= 4; c++) {
      ws.getCell(row, c).border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
    row++;
  }

  console.log('✓ Sheet 2: INSERT- HYDRAULICS generated');
}
