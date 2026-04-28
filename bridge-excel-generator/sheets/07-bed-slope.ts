/**
 * SHEET 7: Bed Slope
 * Longitudinal bed profile
 * Structure: 24 rows, 10 columns
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, addTableHeader, addProjectHeader } from '../utils';

export async function generateBedSlopeSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Bed Slope');
  
  setColumnWidths(ws, [12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  
  let row = addProjectHeader(ws, input.projectName);
  
  setCellValue(ws, row, 1, 'BED SLOPE PROFILE');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;
  
  const headers = ['CHAINAGE', 'R.L.', 'SLOPE'];
  addTableHeader(ws, row, headers);
  row++;
  
  for (let i = 0; i < 20; i++) {
    setCellValue(ws, row, 1, i * 10);
    setCellValue(ws, row, 2, input.bedLevel - (i * 0.05));
    setCellValue(ws, row, 3, `1 in ${input.bedSlope}`);
    row++;
  }
  
  console.log('✓ Sheet 7: Bed Slope complete');
}
