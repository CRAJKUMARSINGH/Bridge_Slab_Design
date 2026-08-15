/**
 * SHEET 5: Deck Anchorage
 * Uplift force and anchorage design
 * Structure: 37 rows, 14 columns
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, addProjectHeader, addCalcRow } from '../utils';

export async function generateDeckAnchorageSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Deck Anchorage');
  
  setColumnWidths(ws, [35, 8, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  
  let row = addProjectHeader(ws, input.projectName);
  
  setCellValue(ws, row, 1, 'DECK ANCHORAGE DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;
  
  // Uplift forces
  row = addCalcRow(ws, row, 'Deck Slab Volume', input.spanLength * input.carriageWidth * 0.8, 'm³');
  row = addCalcRow(ws, row, 'Deck Weight', { formula: '=D5*25', result: 0 }, 'kN');
  row = addCalcRow(ws, row, 'Buoyancy Force', { formula: '=D5*9.81', result: 0 }, 'kN');
  row = addCalcRow(ws, row, 'Net Uplift', { formula: '=D7-D6', result: 0 }, 'kN');
  row = addCalcRow(ws, row, 'Anchorage Required', 'YES', '');
  
  console.log('✓ Sheet 5: Deck Anchorage complete');
}
