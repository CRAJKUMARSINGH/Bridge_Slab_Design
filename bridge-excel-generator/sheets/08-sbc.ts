/**
 * SHEET 8: SBC
 * Safe bearing capacity from project soil inputs (not a hardcoded rock type).
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

  const soilType = input.hardRockAvailable ? 'Hard rock (project flag)' : 'Soil / weathered profile (project flag not hard rock)';
  row = addCalcRow(ws, row, 'Soil type', soilType, '');
  row = addCalcRow(ws, row, 'SBC', input.sbc, 'kPa');
  row = addCalcRow(ws, row, 'Angle of internal friction (φ)', input.phi, '°');
  row = addCalcRow(ws, row, 'Unit weight of soil (γ)', input.gamma, 'kN/m³');
  row = addCalcRow(ws, row, 'Foundation type', 'Spread footing', '');
  row = addCalcRow(ws, row, 'Foundation level', input.foundationLevel, 'm MSL');
  row = addCalcRow(ws, row, 'Bed level', input.bedLevel, 'm MSL');
  addCalcRow(ws, row, 'Embedment below bed (screening)', input.bedLevel - input.foundationLevel, 'm');

  console.log('✓ Sheet 8: SBC complete');
}
