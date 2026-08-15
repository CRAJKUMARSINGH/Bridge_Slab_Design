/**
 * SHEET 1: INDEX
 * Table of contents for all 46 sheets
 * Structure: 27 rows, 3 columns
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { COLORS, setColumnWidths, mergeCells } from '../utils';

export async function generateIndexSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INDEX');
  
  // Set column widths (matching original)
  setColumnWidths(ws, [8, 50, 10]);
  
  let row = 1;
  
  // Rows 1-3: Empty
  ws.getRow(1).height = 15;
  ws.getRow(2).height = 15;
  ws.getRow(3).height = 15;
  row = 4;
  
  // Row 4: Title
  ws.getCell(row, 1).value = 'DESIGN OF SUBMERSIBLE SKEW BRIDGE ACROSS BEDACH RIVER';
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  mergeCells(ws, row, 1, row, 3);
  row++;
  
  // Row 5: Empty
  ws.getRow(5).height = 15;
  row++;
  
  // Row 6: INDEX
  ws.getCell(row, 1).value = 'INDEX';
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  // Row 7: Empty
  ws.getRow(7).height = 15;
  row++;
  
  // Row 8: Headers
  ws.getCell(row, 1).value = 'S.No';
  ws.getCell(row, 2).value = 'Particulars';
  ws.getCell(row, 3).value = 'Page';
  
  // Style headers
  for (let col = 1; col <= 3; col++) {
    const cell = ws.getCell(row, col);
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.GRAY }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  row++;
  
  // Index entries (matching original exactly)
  const entries = [
    'Preamble',
    'Hydraulic Design',
    'Stability Check for Pier in Different Load Cases',
    'Computation of Reinforcement in Pier',
    'Design of Pier Footing',
    'Design of Pier Footing Cap',
    'Stability Check for Abutment in Different Load Cases',
    'Design of Abutment Footing',
    'Cross Sections & L Section of the River',
    'Geotechnical Investigation Report',
    'General Arrangement Drawing',
    'Details of Pier Complete Drawing',
    'Details of Abutment Complete Drawing',
    'Details of Return Wall',
    'Details of Dirt Wall',
    'Bar Bending Schedule',
    'Estimation & BOQ',
    'Technical Notes'
  ];
  
  entries.forEach((entry, idx) => {
    ws.getCell(row, 1).value = (idx + 1).toFixed(1);
    ws.getCell(row, 2).value = entry;
    ws.getCell(row, 3).value = '';
    
    // Add borders
    for (let col = 1; col <= 3; col++) {
      const cell = ws.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.alignment = { 
        horizontal: col === 1 ? 'center' : 'left', 
        vertical: 'middle' 
      };
    }
    
    row++;
  });
  
  console.log('✓ Sheet 1: INDEX generated');
}
