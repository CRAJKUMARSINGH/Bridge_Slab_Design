/**
 * SHEET 6: CROSS SECTION
 * Survey chainage/GL plus depth below HFL and strip area for flow screening.
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, addTableHeader, addTableRow, addProjectHeader } from '../utils';

export async function generateCrossSectionSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('CROSS SECTION');

  setColumnWidths(ws, [12, 12, 16, 16, 16, 18, 18]);

  let row = addProjectHeader(ws, input.projectName);

  setCellValue(ws, row, 1, 'RIVER CROSS SECTION DATA');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 1;
  setCellValue(ws, row, 1, `HFL = ${input.hfl} m MSL; bed level input = ${input.bedLevel} m MSL`);
  const hflRow = row;
  setCellValue(ws, row, 4, 'HFL (m MSL)');
  setCellValue(ws, row, 5, input.hfl);
  row += 2;

  addTableHeader(ws, row, [
    'CHAINAGE (m)',
    'R.L. (m MSL)',
    'Depth below HFL (m)',
    'Δ chainage (m)',
    'Mean depth (m)',
    'Strip area (m²)',
    'In flow?',
  ]);
  row++;

  const points = input.crossSectionData ?? [];
  const firstDataRow = row;
  let totalArea = 0;
  points.forEach((point, index) => {
    const depth = Math.max(0, input.hfl - point.gl);
    const prev = index > 0 ? points[index - 1] : undefined;
    const dChain = prev ? point.chainage - prev.chainage : 0;
    const prevDepth = prev ? Math.max(0, input.hfl - prev.gl) : depth;
    const meanDepth = prev ? (depth + prevDepth) / 2 : 0;
    const stripArea = prev ? meanDepth * dChain : 0;
    totalArea += stripArea;
    const r = firstDataRow + index;
    addTableRow(ws, r, [
      point.chainage,
      point.gl,
      { formula: `=MAX(0,$E$${hflRow}-B${r})`, result: Number(depth.toFixed(3)) },
      prev ? { formula: `=A${r}-A${r - 1}`, result: dChain } : 0,
      prev ? { formula: `=(C${r}+C${r - 1})/2`, result: Number(meanDepth.toFixed(3)) } : 0,
      prev ? { formula: `=E${r}*D${r}`, result: Number(stripArea.toFixed(3)) } : 0,
      { formula: `=IF(C${r}>0,"YES","NO")`, result: depth > 0 ? 'YES' : 'NO' },
    ]);
    row++;
  });

  setCellValue(ws, row, 5, 'TOTAL AREA');
  ws.getCell(row, 5).font = { bold: true };
  if (points.length > 0) {
    setCellFormula(ws, row, 6, `=SUM(F${firstDataRow}:F${row - 1})`, Number(totalArea.toFixed(3)));
  } else {
    setCellValue(ws, row, 6, 0);
  }
  setCellValue(ws, row, 7, 'm²');

  console.log('✓ Sheet 6: CROSS SECTION complete');
}
