/**
 * SHEET 6: CROSS SECTION
 * River cross-section survey data
 * Structure: 29 rows, 7 columns
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, addTableHeader, addProjectHeader } from '../utils';

export async function generateCrossSectionSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('CROSS SECTION');
  
  setColumnWidths(ws, [12, 12, 15, 15, 15, 15, 15]);
  
  let row = addProjectHeader(ws, input.projectName);
  
  setCellValue(ws, row, 1, 'RIVER CROSS SECTION DATA');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;
  
  const headers = ['CHAINAGE', 'R.L.', 'REMARKS'];
  addTableHeader(ws, row, headers);
  row++;
  
  input.crossSectionData.forEach(point => {
    setCellValue(ws, row, 1, point.chainage);
    setCellValue(ws, row, 2, point.gl);
    setCellValue(ws, row, 3, '');
    row++;
  });
  
  console.log('✓ Sheet 6: CROSS SECTION complete');
}
