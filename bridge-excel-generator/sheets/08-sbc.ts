/**
 * SHEET 8: SBC
 * Safe Bearing Capacity data
 * Structure: 78 rows, 6 columns
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, addProjectHeader, addCalcRow } from '../utils';

export async function generateSBCSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('SBC');
  
  setColumnWidths(ws, [35, 8, 15, 15, 15, 15]);
  
  let row = addProjectHeader(ws, input.projectName);
  
  setCellValue(ws, row, 1, 'SAFE BEARING CAPACITY');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;
  
  row = addCalcRow(ws, row, 'Soil Type', 'Hard Rock', '');
  row = addCalcRow(ws, row, 'SBC', input.sbc, 'kPa');
  row = addCalcRow(ws, row, 'Angle of Internal Friction (φ)', input.phi, '°');
  row = addCalcRow(ws, row, 'Unit Weight of Soil (γ)', input.gamma, 'kN/m³');
  row = addCalcRow(ws, row, 'Cohesion (c)', 0, 'kPa');
  row = addCalcRow(ws, row, 'Foundation Type', 'Spread Footing', '');
  row = addCalcRow(ws, row, 'Foundation Depth', input.foundationLevel, 'm MSL');
  
  console.log('✓ Sheet 8: SBC complete');
}
