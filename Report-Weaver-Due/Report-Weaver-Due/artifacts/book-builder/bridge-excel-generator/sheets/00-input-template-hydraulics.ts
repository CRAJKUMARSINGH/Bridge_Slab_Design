/**
 * INPUT TEMPLATE: HYDRAULICS & AFFLUX PARAMETERS
 * User-friendly input sheet for hydraulic design parameters
 * Links directly to afflux calculation and hydraulics sheets
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput, InputHydraulicsTemplateRefs } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells } from '../utils';

export async function generateInputTemplateHydraulicsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<InputHydraulicsTemplateRefs> {
  const ws = workbook.addWorksheet('INPUT-HYDRAULICS');
  
  // Set column widths for better presentation
  setColumnWidths(ws, [5, 35, 15, 15, 15, 20, 15, 15]);
  
  let row = 1;
  
  // ==================== HEADER ====================
  
  setCellValue(ws, row, 1, 'HYDRAULIC DESIGN INPUT PARAMETERS');
  ws.getCell(row, 1).font = { bold: true, size: 16, color: { argb: 'FF0066CC' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F3FF' }
  };
  mergeCells(ws, row, 1, row, 7);
  row += 2;
  
  setCellValue(ws, row, 1, 'Instructions: Enter your project-specific hydraulic parameters below.');
  setCellValue(ws, row, 2, 'These values will automatically update all hydraulic calculations.');
  ws.getCell(row, 1).font = { italic: true, color: { argb: 'FF666666' } };
  ws.getCell(row, 2).font = { italic: true, color: { argb: 'FF666666' } };
  row += 2;
  
  // ==================== PROJECT INFORMATION ====================
  
  setCellValue(ws, row, 1, 'PROJECT INFORMATION');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Project Name
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Project Name');
  setCellValue(ws, row, 4, input.projectName || 'Enter Project Name');
  setCellValue(ws, row, 6, 'Used in: All sheets');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const projectNameCell = `D${row}`;
  row++;
  
  // River Name
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'River Name');
  setCellValue(ws, row, 4, input.riverName || 'Enter River Name');
  setCellValue(ws, row, 6, 'Used in: Hydraulics, Afflux');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const riverNameCell = `D${row}`;
  row++;
  
  // Location
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Location');
  setCellValue(ws, row, 4, input.location || 'Enter Location');
  setCellValue(ws, row, 6, 'Used in: All sheets');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const locationCell = `D${row}`;
  row++;

  // ==================== BRIDGE GEOMETRY (stable refs for ESTIMATION / reports) ====================

  setCellValue(ws, row, 1, 'BRIDGE GEOMETRY');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;

  setCellValue(ws, row, 1, '3a.');
  setCellValue(ws, row, 2, 'Span Length (m)');
  setCellValue(ws, row, 4, input.spanLength ?? 12);
  setCellValue(ws, row, 6, 'Linked: ESTIMATION, LLOAD');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const spanLengthRow = row;
  row++;

  setCellValue(ws, row, 1, '3b.');
  setCellValue(ws, row, 2, 'Number of Spans');
  setCellValue(ws, row, 4, input.numberOfSpans ?? 1);
  setCellValue(ws, row, 6, 'Linked: ESTIMATION');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const numberOfSpansRow = row;
  row++;

  setCellValue(ws, row, 1, '3c.');
  setCellValue(ws, row, 2, 'Carriageway Width (m)');
  setCellValue(ws, row, 4, input.carriageWidth ?? 7.5);
  setCellValue(ws, row, 6, 'Linked: ESTIMATION');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const carriageWidthRow = row;
  row++;

  setCellValue(ws, row, 1, '3d.');
  setCellValue(ws, row, 2, 'Total Bridge Length (m)');
  setCellValue(
    ws,
    row,
    4,
    input.totalLength ?? (input.spanLength ?? 12) * (input.numberOfSpans ?? 1)
  );
  setCellValue(ws, row, 6, 'Linked: ESTIMATION, BOQ');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const totalLengthRow = row;
  row += 2;

  // ==================== HYDRAULIC LEVELS ====================
  
  setCellValue(ws, row, 1, 'HYDRAULIC LEVELS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // HFL
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Highest Flood Level (HFL)');
  setCellValue(ws, row, 4, input.hfl || 285.5);
  setCellValue(ws, row, 5, 'm MSL');
  setCellValue(ws, row, 6, 'Critical for afflux calculation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const hflCell = `D${row}`;
  row++;
  
  // Bed Level
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Average Bed Level');
  setCellValue(ws, row, 4, input.bedLevel || 280.2);
  setCellValue(ws, row, 5, 'm MSL');
  setCellValue(ws, row, 6, 'Used in: Scour, Hydraulics');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const bedLevelCell = `D${row}`;
  row++;
  
  // Foundation Level
  setCellValue(ws, row, 1, '6.');
  setCellValue(ws, row, 2, 'Foundation Level');
  setCellValue(ws, row, 4, input.foundationLevel || 276.5);
  setCellValue(ws, row, 5, 'm MSL');
  setCellValue(ws, row, 6, 'Used in: Pier, Abutment design');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const foundationLevelCell = `D${row}`;
  row += 2;
  
  // ==================== DISCHARGE PARAMETERS ====================
  
  setCellValue(ws, row, 1, 'DISCHARGE & FLOW PARAMETERS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Design Discharge
  setCellValue(ws, row, 1, '7.');
  setCellValue(ws, row, 2, 'Design Discharge');
  setCellValue(ws, row, 4, input.discharge || 1250.75);
  setCellValue(ws, row, 5, 'cumecs');
  setCellValue(ws, row, 6, 'Critical for afflux & velocity');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const dischargeCell = `D${row}`;
  row++;
  
  // Manning's n
  setCellValue(ws, row, 1, '8.');
  setCellValue(ws, row, 2, 'Manning\'s Roughness Coefficient (n)');
  setCellValue(ws, row, 4, input.manningN || 0.035);
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'Affects velocity calculation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const manningNCell = `D${row}`;
  row++;
  
  // Bed Slope
  setCellValue(ws, row, 1, '9.');
  setCellValue(ws, row, 2, 'Bed Slope');
  setCellValue(ws, row, 4, input.bedSlope || 1200);
  setCellValue(ws, row, 5, '1 in n');
  setCellValue(ws, row, 6, 'Used in: Manning\'s equation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const bedSlopeCell = `D${row}`;
  row++;
  
  // Lacey's Silt Factor
  setCellValue(ws, row, 1, '10.');
  setCellValue(ws, row, 2, 'Lacey\'s Silt Factor (f)');
  setCellValue(ws, row, 4, input.laceysSiltFactor || 1.8);
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'Used in: Scour depth calculation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const laceysSiltFactorCell = `D${row}`;
  row += 2;
  
  // ==================== CROSS SECTION DATA ====================
  
  setCellValue(ws, row, 1, 'RIVER CROSS SECTION DATA');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F8FF' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  setCellValue(ws, row, 1, 'Chainage (m)');
  setCellValue(ws, row, 2, 'Ground Level (m MSL)');
  setCellValue(ws, row, 3, 'Chainage (m)');
  setCellValue(ws, row, 4, 'Ground Level (m MSL)');
  setCellValue(ws, row, 5, 'Chainage (m)');
  setCellValue(ws, row, 6, 'Ground Level (m MSL)');
  
  // Header formatting
  for (let col = 1; col <= 6; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  row++;
  
  // Cross section data (3 columns of data)
  const crossSectionData = input.crossSectionData || [
    { chainage: 0, gl: 287.5 },
    { chainage: 15, gl: 284.2 },
    { chainage: 25, gl: 281.8 },
    { chainage: 35, gl: 280.2 },
    { chainage: 45, gl: 280.5 },
    { chainage: 55, gl: 280.8 },
    { chainage: 65, gl: 282.1 },
    { chainage: 75, gl: 284.8 },
    { chainage: 90, gl: 287.8 }
  ];
  
  const crossSectionStartRow = row;
  for (let i = 0; i < Math.ceil(crossSectionData.length / 3); i++) {
    for (let j = 0; j < 3; j++) {
      const dataIndex = i * 3 + j;
      if (dataIndex < crossSectionData.length) {
        const data = crossSectionData[dataIndex];
        setCellValue(ws, row, j * 2 + 1, data.chainage);
        setCellValue(ws, row, j * 2 + 2, data.gl);
        
        // Highlight input cells
        ws.getCell(row, j * 2 + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
        ws.getCell(row, j * 2 + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
      }
    }
    row++;
  }
  row += 2;
  
  // ==================== CALCULATED VALUES ====================
  
  setCellValue(ws, row, 1, 'CALCULATED HYDRAULIC VALUES');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF009900' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Water Depth
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Water Depth');
  setCellFormula(ws, row, 4, `=${hflCell}-${bedLevelCell}`, (input.hfl || 285.5) - (input.bedLevel || 280.2));
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Auto-calculated');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Velocity (Manning's equation approximation)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Approximate Velocity');
  setCellFormula(ws, row, 4, `=POWER((${dischargeCell}/100),0.6)*0.8`, Math.pow((input.discharge || 1250.75) / 100, 0.6) * 0.8);
  setCellValue(ws, row, 5, 'm/s');
  setCellValue(ws, row, 6, 'Estimated from discharge');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Scour Depth (Lacey's formula)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Normal Scour Depth');
  setCellFormula(ws, row, 4, `=0.473*POWER(${dischargeCell}/${laceysSiltFactorCell},1/3)`, 
    0.473 * Math.pow((input.discharge || 1250.75) / (input.laceysSiltFactor || 1.8), 1/3));
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Lacey\'s formula');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row += 2;
  
  // ==================== VALIDATION CHECKS ====================
  
  setCellValue(ws, row, 1, 'VALIDATION CHECKS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FFCC6600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF0E6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Check 1: Reasonable discharge
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Discharge Range Check');
  setCellFormula(ws, row, 4, `=IF(AND(${dischargeCell}>100,${dischargeCell}<10000),"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, '100-10000 cumecs typical');
  row++;
  
  // Check 2: Manning's n range
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Manning\'s n Range Check');
  setCellFormula(ws, row, 4, `=IF(AND(${manningNCell}>0.02,${manningNCell}<0.1),"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, '0.02-0.1 typical range');
  row++;
  
  // Check 3: Water depth reasonableness
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Water Depth Check');
  setCellFormula(ws, row, 4, `=IF(AND((${hflCell}-${bedLevelCell})>2,(${hflCell}-${bedLevelCell})<20),"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, '2-20m typical depth');
  row += 2;
  
  // ==================== USAGE INSTRUCTIONS ====================
  
  setCellValue(ws, row, 1, 'USAGE INSTRUCTIONS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF6600CC' } };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Modify YELLOW cells with your project data');
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'RED cells are critical hydraulic parameters');
  row++;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'GREEN cells show calculated values');
  row++;
  
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'All changes automatically update linked sheets');
  row++;
  
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Check validation results before proceeding');
  row++;
  
  const q = (r: number) => `'INPUT-HYDRAULICS'!D${r}`;

  console.log('✓ INPUT-HYDRAULICS template sheet generated');

  return {
    spanLengthRef: q(spanLengthRow),
    numberOfSpansRef: q(numberOfSpansRow),
    carriageWidthRef: q(carriageWidthRow),
    totalLengthRef: q(totalLengthRow),
  };
}