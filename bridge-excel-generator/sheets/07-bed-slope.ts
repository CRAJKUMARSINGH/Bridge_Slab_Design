/**
 * SHEET 7: Bed Slope
 * Longitudinal profile from survey points when available; otherwise 1-in-N from input.bedSlope.
 * Derived columns (Δ chainage, Δ R.L., local slope, profile RL) are live formulas.
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, addTableHeader, addTableRow, addProjectHeader } from '../utils';

export async function generateBedSlopeSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Bed Slope');

  setColumnWidths(ws, [14, 16, 16, 18, 22]);

  let row = addProjectHeader(ws, input.projectName);

  setCellValue(ws, row, 1, 'BED SLOPE PROFILE');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 1;
  setCellValue(ws, row, 1, `Design bed slope input: 1 in ${input.bedSlope}`);
  const bsRow = row;
  setCellValue(ws, row, 4, '1 in N');
  setCellValue(ws, row, 5, input.bedSlope);
  row += 1;
  setCellValue(ws, row, 1, 'Bed level (m MSL)');
  const bdRow = row;
  setCellValue(ws, row, 5, input.bedLevel);
  row += 2;

  addTableHeader(ws, row, ['CHAINAGE (m)', 'R.L. (m MSL)', 'Δ chainage (m)', 'Δ R.L. (m)', 'Local slope (1 in N)']);
  row++;

  const survey = [...(input.crossSectionData ?? [])].sort((a, b) => a.chainage - b.chainage);
  const useSurvey = survey.length >= 2;

  if (useSurvey) {
    const firstDataRow = row;
    survey.forEach((point, index) => {
      const prev = index > 0 ? survey[index - 1] : undefined;
      const dChain = prev ? point.chainage - prev.chainage : 0;
      const dRl = prev ? point.gl - prev.gl : 0;
      const localN = prev && Math.abs(dRl) > 1e-9 ? Math.abs(dChain / dRl) : input.bedSlope;
      const r = firstDataRow + index;
      addTableRow(ws, r, [
        point.chainage,
        point.gl,
        prev ? { formula: `=A${r}-A${r - 1}`, result: dChain } : 0,
        prev ? { formula: `=B${r}-B${r - 1}`, result: dRl } : 0,
        prev
          ? { formula: `=IF(ABS(D${r})<0.000000001,$E$${bsRow},ABS(C${r}/D${r}))`, result: Number(localN.toFixed(4)) }
          : '—',
      ]);
      if (prev) ws.getCell(r, 5).numFmt = '0.0';
      row++;
    });
    const first = survey[0];
    const last = survey[survey.length - 1];
    const span = last.chainage - first.chainage;
    const fall = first.gl - last.gl;
    const overallN = Math.abs(fall) > 1e-9 ? Math.abs(span / fall) : input.bedSlope;
    setCellValue(ws, row, 1, 'Overall survey slope');
    const lastRow = firstDataRow + survey.length - 1;
    addTableRow(ws, row, [
      '',
      '',
      { formula: `=A${lastRow}-A${firstDataRow}`, result: span },
      { formula: `=B${firstDataRow}-B${lastRow}`, result: fall },
      { formula: `=IF(ABS(D${row})<0.000000001,$E$${bsRow},ABS(C${row}/D${row}))`, result: Number(overallN.toFixed(4)) },
    ]);
    ws.getCell(row, 5).numFmt = '0.0';
    setCellValue(ws, row + 1, 1, 'Overall slope in “1 in N” form:');
    setCellValue(ws, row + 1, 5, `1 in ${overallN.toFixed(1)}`);
  } else {
    const firstDataRow = row;
    for (let i = 0; i < 20; i++) {
      const chainage = i * 10;
      const rl = input.bedLevel - (chainage / Math.max(input.bedSlope, 1));
      const r = firstDataRow + i;
      addTableRow(ws, r, [
        chainage,
        { formula: `=$E$${bdRow}-A${r}/$E$${bsRow}`, result: Number(rl.toFixed(3)) },
        i === 0 ? 0 : { formula: `=A${r}-A${r - 1}`, result: 10 },
        i === 0 ? 0 : { formula: `=B${r}-B${r - 1}`, result: Number((-10 / Math.max(input.bedSlope, 1)).toFixed(4)) },
        { formula: `=IF(ABS(D${r})<0.000000001,$E$${bsRow},ABS(C${r}/D${r}))`, result: input.bedSlope },
      ]);
      row++;
    }
    setCellValue(ws, row, 1, 'CHECK: no survey polyline supplied; profile is generated from input.bedSlope only.');
    ws.getCell(row, 1).font = { italic: true, color: { argb: 'FF9C6500' } };
  }

  console.log('✓ Sheet 7: Bed Slope complete');
}
