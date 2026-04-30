/**
 * Sheet 11: STEEL IN FLARED PIER BASE
 * Reinforcement design for flared pier base
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue } from '../utils';

export async function generateSteelFlaredPierSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN FLARED PIER BASE');
  
  setColumnWidths(ws, [5, 30, 12, 12, 12, 12, 12]);
  
  let row = 1;
  
  setCellValue(ws, row, 1, 'REINFORCEMENT DESIGN - FLARED PIER BASE');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Design as per IRC:112-2015');
  row += 2;
  
  // Vertical reinforcement
  setCellValue(ws, row, 1, 'A. VERTICAL REINFORCEMENT');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  setCellValue(ws, row, 2, 'Required Ast');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '0.8% of gross area');
  row++;
  
  setCellValue(ws, row, 2, 'Provide');
  setCellValue(ws, row, 3, '32 nos 25mm φ bars');
  row += 2;
  
  // Horizontal ties
  setCellValue(ws, row, 1, 'B. HORIZONTAL TIES');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  setCellValue(ws, row, 2, 'Provide');
  setCellValue(ws, row, 3, '10mm φ @ 150mm c/c');
  row += 2;
  
  setCellValue(ws, row, 1, 'NOTE: Reinforcement details as per standard drawings');
}
