/**
 * Sheet 11: STEEL IN FLARED PIER BASE.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue } from '../utils';

export async function generateSteelFlaredPierSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN FLARED PIER BASE');
  setColumnWidths(ws, [6, 36, 22, 18]);
  setCellValue(ws, 1, 1, 'REINFORCEMENT DESIGN - FLARED PIER BASE');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = input.pier;
  if (!pier) {
    setCellValue(ws, 3, 1, 'CHECK: calculated pier result unavailable.');
    ws.getCell(3, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
    return;
  }
  const steel = pier.reinforcement.flaredBase;
  setCellValue(ws, 3, 1, 'Provided reinforcement');
  setCellValue(ws, 3, 2, `${steel.numberOfBars} nos ${steel.diameter} mm dia @ ${steel.spacing} mm c/c`);
  setCellValue(ws, 4, 1, 'Steel area');
  setCellValue(ws, 4, 2, steel.area);
  setCellValue(ws, 4, 3, 'mm²');
  setCellValue(ws, 5, 1, 'Steel weight');
  setCellValue(ws, 5, 2, steel.weight);
  setCellValue(ws, 5, 3, 'kg');
  setCellValue(ws, 7, 1, 'Detailed flared-base bending/shear design is not separately represented in the current result contract; engineering review required.');
  ws.getCell(7, 1).alignment = { wrapText: true };
}
