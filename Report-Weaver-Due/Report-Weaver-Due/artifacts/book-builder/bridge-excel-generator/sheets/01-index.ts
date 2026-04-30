/**
 * SHEET 1: INDEX
 * Table of contents for the design workbook sheets
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
  
  // Row 4: Title (project-specific; legacy default if name empty)
  const indexTitle =
    input.projectName?.trim() ||
    'DESIGN OF SUBMERSIBLE SKEW BRIDGE ACROSS BEDACH RIVER';
  ws.getCell(row, 1).value = indexTitle;
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
  
  // Index entries (legacy list + workbook front matter + GAD drawing register)
  const entries: { label: string; page?: string }[] = [
    { label: 'Cover sheet (title block)', page: 'COVER' },
    { label: 'Drawing package register — GAD export slots (DXF/PDF/SVG)', page: 'DRAWINGS-SLOTS' },
    { label: 'Preamble' },
    { label: 'Hydraulic Design' },
    { label: 'Stability Check for Pier in Different Load Cases' },
    { label: 'Computation of Reinforcement in Pier' },
    { label: 'Design of Pier Footing' },
    { label: 'Design of Pier Footing Cap' },
    { label: 'Stability Check for Abutment in Different Load Cases' },
    { label: 'Design of Abutment Footing' },
    { label: 'Cross Sections & L Section of the River' },
    { label: 'Geotechnical Investigation Report' },
    { label: 'General Arrangement Drawing' },
    { label: 'Details of Pier Complete Drawing' },
    { label: 'Details of Abutment Complete Drawing' },
    { label: 'Details of Return Wall' },
    { label: 'Details of Dirt Wall' },
    { label: 'Bar Bending Schedule' },
    { label: 'Estimation & BOQ' },
    { label: 'Technical Notes' }
  ];
  
  entries.forEach((entry, idx) => {
    ws.getCell(row, 1).value = (idx + 1).toFixed(1);
    ws.getCell(row, 2).value = entry.label;
    ws.getCell(row, 3).value = entry.page ?? '';
    
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
