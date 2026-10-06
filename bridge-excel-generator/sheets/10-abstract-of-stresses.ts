/**
 * Sheet 10: abstract of stresses.
 *
 * Linked view: vertical forces and moments are retrieved by cross-sheet
 * formula from STABILITY CHECK FOR PIER's live case table; area, section
 * modulus and pressures are computed here by formula.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';
import { PIER_STABILITY_ROWS } from './09-stability-check-pier';

const PS = `'${PIER_STABILITY_ROWS.sheet}'`;

export async function generateAbstractOfStressesSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('abstract of stresses');
  setColumnWidths(ws, [6, 36, 16, 16, 18, 18, 16, 16, 16]);
  setCellValue(ws, 1, 1, 'ABSTRACT OF STRESSES IN PIER');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, `Project: ${input.projectName}`);

  const pier = input.pier;
  if (!pier) {
    setCellValue(ws, 4, 1, 'CHECK: calculated pier result unavailable.');
    ws.getCell(4, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
    return;
  }

  // Geometry block — base dimensions retrieved from sheet 9 source cells.
  setCellValue(ws, 4, 1, 'Footing dimensions (linked from STABILITY CHECK FOR PIER)');
  ws.getCell(4, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  setCellValue(ws, 5, 1, 'Base width B');
  ws.getCell(5, 2).value = { formula: `=${PS}!B${PIER_STABILITY_ROWS.baseW}`, result: input.pierBaseWidth };
  setCellValue(ws, 5, 3, 'm');
  setCellValue(ws, 6, 1, 'Base length L');
  ws.getCell(6, 2).value = { formula: `=${PS}!B${PIER_STABILITY_ROWS.baseL}`, result: input.pierBaseLength };
  setCellValue(ws, 6, 3, 'm');
  setCellValue(ws, 7, 1, 'Area A = B·L');
  ws.getCell(7, 2).value = {
    formula: '=B5*B6',
    result: Number((input.pierBaseWidth * input.pierBaseLength).toFixed(3)),
  };
  setCellValue(ws, 7, 3, 'm²');
  setCellValue(ws, 8, 1, 'Section modulus Z = L·B²/6');
  ws.getCell(8, 2).value = {
    formula: '=B6*B5^2/6',
    result: Number((input.pierBaseLength * input.pierBaseWidth ** 2 / 6).toFixed(3)),
  };
  setCellValue(ws, 8, 3, 'm³');
  setCellValue(ws, 9, 1, 'SBC');
  ws.getCell(9, 2).value = { formula: `=${PS}!B${PIER_STABILITY_ROWS.sbc}`, result: input.sbc };
  setCellValue(ws, 9, 3, 'kN/m²');

  addTableHeader(ws, 11, [
    'Case',
    'Load case',
    'P (kN)',
    'M (kN-m)',
    'P/A (kN/m²)',
    'M/Z (kN/m²)',
    'p max (kN/m²)',
    'SBC',
    'Status',
  ]);

  const area = input.pierBaseWidth * input.pierBaseLength;
  const sectionModulus = input.pierBaseLength * input.pierBaseWidth ** 2 / 6;

  pier.loadCases.forEach((loadCase, index) => {
    const row = 12 + index;
    const pOverA = area > 0 ? loadCase.verticalForce / area : Number.NaN;
    const mOverZ = sectionModulus > 0 ? loadCase.moment / sectionModulus : Number.NaN;
    const pMax = pOverA + Math.abs(mOverZ);
    const caseRow = PIER_STABILITY_ROWS.firstCaseRow + index;

    const values: (string | number | { formula: string; result?: number | string })[] = [
      { formula: `=${PS}!A${caseRow}`, result: loadCase.caseNumber },
      loadCase.description,
      { formula: `=${PS}!${PIER_STABILITY_ROWS.colV}${caseRow}`, result: Number(loadCase.verticalForce.toFixed(3)) },
      { formula: `=${PS}!${PIER_STABILITY_ROWS.colM}${caseRow}`, result: Number(loadCase.moment.toFixed(3)) },
      { formula: `=C${row}/$B$7`, result: Number(pOverA.toFixed(3)) },
      { formula: `=D${row}/$B$8`, result: Number(mOverZ.toFixed(3)) },
      { formula: `=E${row}+ABS(F${row})`, result: Number(pMax.toFixed(3)) },
      { formula: `=$B$9`, result: input.sbc },
      {
        formula: `=IF(G${row}<=H${row},${PS}!N${caseRow},"UNSAFE")`,
        result: pMax <= input.sbc ? loadCase.status : 'UNSAFE',
      },
    ];
    addTableRow(ws, row, values);
  });

  const distRow = 12 + pier.loadCases.length + 1;
  setCellValue(ws, distRow, 1, 'Service trapezoid (governing case 1, computed by formula)');
  ws.getCell(distRow, 1).font = { bold: true };
  const govV = pier.loadCases[0].verticalForce;
  const govM = pier.loadCases[0].moment;
  const pMaxGov = govV / area + govM / sectionModulus;
  const pMinGov = govV / area - govM / sectionModulus;
  setCellValue(ws, distRow + 1, 1, 'p max');
  ws.getCell(distRow + 1, 2).value = {
    formula: `=C12/$B$7+D12/$B$8`,
    result: Number(pMaxGov.toFixed(3)),
  };
  setCellValue(ws, distRow + 2, 1, 'p min');
  ws.getCell(distRow + 2, 2).value = {
    formula: `=C12/$B$7-D12/$B$8`,
    result: Number(pMinGov.toFixed(3)),
  };
  setCellValue(ws, distRow + 3, 1, 'Note: one-axis moment envelope. Two-axis Mx/My requires additional approved result fields.');
  ws.getCell(distRow + 3, 1).alignment = { wrapText: true };
}
