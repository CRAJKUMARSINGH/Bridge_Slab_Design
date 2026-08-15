/**
 * SHEET 2: INSERT- HYDRAULICS
 * Section divider sheet (empty in original)
 * Structure: 0 rows, 0 columns (just a placeholder sheet)
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';

export async function generateInsertHydraulicsSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  // Create empty sheet (section divider)
  const ws = workbook.addWorksheet('INSERT- HYDRAULICS');
  
  // Add minimal content (sheet name serves as divider)
  ws.getCell('A1').value = 'HYDRAULICS SECTION';
  ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF365070' } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  
  ws.getRow(1).height = 30;
  ws.getColumn(1).width = 50;
  
  console.log('✓ Sheet 2: INSERT- HYDRAULICS generated');
}
