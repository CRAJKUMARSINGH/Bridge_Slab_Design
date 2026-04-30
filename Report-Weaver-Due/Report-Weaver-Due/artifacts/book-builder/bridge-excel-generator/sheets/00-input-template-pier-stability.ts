/**
 * INPUT TEMPLATE: PIER STABILITY PARAMETERS
 * User-friendly input sheet for pier design and stability parameters
 * Links directly to pier stability check and design sheets
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells } from '../utils';

export async function generateInputTemplatePierStabilitySheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INPUT-PIER-STABILITY');
  
  // Set column widths for better presentation
  setColumnWidths(ws, [5, 35, 15, 15, 15, 20, 15, 15]);
  
  let row = 1;
  
  // ==================== HEADER ====================
  
  setCellValue(ws, row, 1, 'PIER STABILITY DESIGN INPUT PARAMETERS');
  ws.getCell(row, 1).font = { bold: true, size: 16, color: { argb: 'FFCC0000' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE6E6' }
  };
  mergeCells(ws, row, 1, row, 7);
  row += 2;
  
  setCellValue(ws, row, 1, 'Instructions: Enter pier geometry and loading parameters below.');
  setCellValue(ws, row, 2, 'These values control pier stability analysis and design.');
  ws.getCell(row, 1).font = { italic: true, color: { argb: 'FF666666' } };
  ws.getCell(row, 2).font = { italic: true, color: { argb: 'FF666666' } };
  row += 2;
  
  // ==================== BRIDGE GEOMETRY ====================
  
  setCellValue(ws, row, 1, 'BRIDGE GEOMETRY');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FFCC0000' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF0F0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Span Length
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Span Length');
  setCellValue(ws, row, 4, input.spanLength || 10);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Critical for live load distribution');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const spanLengthCell = `D${row}`;
  row++;
  
  // Number of Spans
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Number of Spans');
  setCellValue(ws, row, 4, input.numberOfSpans || 8);
  setCellValue(ws, row, 5, 'nos');
  setCellValue(ws, row, 6, 'Determines number of piers');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const numberOfSpansCell = `D${row}`;
  row++;
  
  // Carriageway Width
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Carriageway Width');
  setCellValue(ws, row, 4, input.carriageWidth || 7.5);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Affects live load magnitude');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const carriageWidthCell = `D${row}`;
  row++;
  
  // Total Length
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Total Bridge Length');
  setCellFormula(ws, row, 4, `=${numberOfSpansCell}*${spanLengthCell}`, (input.numberOfSpans || 8) * (input.spanLength || 10));
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Auto-calculated');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  const totalLengthCell = `D${row}`;
  row += 2;
  
  // ==================== PIER DIMENSIONS ====================
  
  setCellValue(ws, row, 1, 'PIER DIMENSIONS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FFCC0000' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF0F0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Pier Width (across flow)
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Pier Width (across flow)');
  setCellValue(ws, row, 4, input.pierWidth || 1.5);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Critical for water flow obstruction');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const pierWidthCell = `D${row}`;
  row++;
  
  // Pier Length (along bridge)
  setCellValue(ws, row, 1, '6.');
  setCellValue(ws, row, 2, 'Pier Length (along bridge)');
  setCellValue(ws, row, 4, input.pierLength || 4.0);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Affects lateral stability');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const pierLengthCell = `D${row}`;
  row++;
  
  // Pier Height
  setCellValue(ws, row, 1, '7.');
  setCellValue(ws, row, 2, 'Pier Height (from bed)');
  setCellValue(ws, row, 4, input.pierDepth || 5.5);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Affects overturning moment');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const pierHeightCell = `D${row}`;
  row++;
  
  // Pier Base Width
  setCellValue(ws, row, 1, '8.');
  setCellValue(ws, row, 2, 'Pier Base Width (flared)');
  setCellValue(ws, row, 4, input.pierBaseWidth || 3.0);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Foundation bearing area');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const pierBaseWidthCell = `D${row}`;
  row++;
  
  // Pier Base Length
  setCellValue(ws, row, 1, '9.');
  setCellValue(ws, row, 2, 'Pier Base Length (flared)');
  setCellValue(ws, row, 4, input.pierBaseLength || 5.0);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Foundation bearing area');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const pierBaseLengthCell = `D${row}`;
  row += 2;
  
  // ==================== MATERIAL PROPERTIES ====================
  
  setCellValue(ws, row, 1, 'MATERIAL PROPERTIES');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FFCC0000' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF0F0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Concrete Grade
  setCellValue(ws, row, 1, '10.');
  setCellValue(ws, row, 2, 'Concrete Grade');
  setCellValue(ws, row, 4, input.concreteGrade || 'M30');
  setCellValue(ws, row, 6, 'Affects design strength');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const concreteGradeCell = `D${row}`;
  row++;
  
  // fck
  setCellValue(ws, row, 1, '11.');
  setCellValue(ws, row, 2, 'Characteristic Strength (fck)');
  setCellValue(ws, row, 4, input.fck || 30);
  setCellValue(ws, row, 5, 'MPa');
  setCellValue(ws, row, 6, 'Concrete compressive strength');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const fckCell = `D${row}`;
  row++;
  
  // Steel Grade
  setCellValue(ws, row, 1, '12.');
  setCellValue(ws, row, 2, 'Steel Grade');
  setCellValue(ws, row, 4, input.steelGrade || 'Fe500');
  setCellValue(ws, row, 6, 'Reinforcement steel type');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const steelGradeCell = `D${row}`;
  row++;
  
  // fy
  setCellValue(ws, row, 1, '13.');
  setCellValue(ws, row, 2, 'Yield Strength (fy)');
  setCellValue(ws, row, 4, input.fy || 500);
  setCellValue(ws, row, 5, 'MPa');
  setCellValue(ws, row, 6, 'Steel yield strength');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const fyCell = `D${row}`;
  row += 2;
  
  // ==================== SOIL PROPERTIES ====================
  
  setCellValue(ws, row, 1, 'SOIL PROPERTIES');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FFCC0000' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF0F0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Safe Bearing Capacity
  setCellValue(ws, row, 1, '14.');
  setCellValue(ws, row, 2, 'Safe Bearing Capacity (SBC)');
  setCellValue(ws, row, 4, input.sbc || 200);
  setCellValue(ws, row, 5, 'kPa');
  setCellValue(ws, row, 6, 'Critical for foundation design');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const sbcCell = `D${row}`;
  row++;
  
  // Angle of Internal Friction
  setCellValue(ws, row, 1, '15.');
  setCellValue(ws, row, 2, 'Angle of Internal Friction (φ)');
  setCellValue(ws, row, 4, input.phi || 32);
  setCellValue(ws, row, 5, 'degrees');
  setCellValue(ws, row, 6, 'Affects lateral earth pressure');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const phiCell = `D${row}`;
  row++;
  
  // Unit Weight of Soil
  setCellValue(ws, row, 1, '16.');
  setCellValue(ws, row, 2, 'Unit Weight of Soil (γ)');
  setCellValue(ws, row, 4, input.gamma || 19);
  setCellValue(ws, row, 5, 'kN/m³');
  setCellValue(ws, row, 6, 'Soil density for calculations');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const gammaCell = `D${row}`;
  row += 2;
  
  // ==================== CALCULATED PIER PROPERTIES ====================
  
  setCellValue(ws, row, 1, 'CALCULATED PIER PROPERTIES');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF009900' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Number of Piers
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Number of Piers');
  setCellFormula(ws, row, 4, `=${numberOfSpansCell}-1`, (input.numberOfSpans || 8) - 1);
  setCellValue(ws, row, 5, 'nos');
  setCellValue(ws, row, 6, 'Auto-calculated');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Pier Volume
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Pier Volume (per pier)');
  setCellFormula(ws, row, 4, `=${pierWidthCell}*${pierLengthCell}*${pierHeightCell}`, 
    (input.pierWidth || 1.5) * (input.pierLength || 4.0) * (input.pierDepth || 5.5));
  setCellValue(ws, row, 5, 'm³');
  setCellValue(ws, row, 6, 'For self-weight calculation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  const pierVolumeCell = `D${row}`;
  row++;
  
  // Pier Self Weight
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Pier Self Weight');
  setCellFormula(ws, row, 4, `=${pierVolumeCell}*25`, (input.pierWidth || 1.5) * (input.pierLength || 4.0) * (input.pierDepth || 5.5) * 25);
  setCellValue(ws, row, 5, 'kN');
  setCellValue(ws, row, 6, 'Concrete unit weight = 25 kN/m³');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Base Area
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Foundation Base Area');
  setCellFormula(ws, row, 4, `=${pierBaseWidthCell}*${pierBaseLengthCell}`, 
    (input.pierBaseWidth || 3.0) * (input.pierBaseLength || 5.0));
  setCellValue(ws, row, 5, 'm²');
  setCellValue(ws, row, 6, 'For bearing pressure calculation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Impact Factor
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Impact Factor (IRC:6-2016)');
  setCellFormula(ws, row, 4, `=4.5/(6+${spanLengthCell})`, 4.5 / (6 + (input.spanLength || 10)));
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'For live load amplification');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row += 2;
  
  // ==================== LOAD CALCULATIONS ====================
  
  setCellValue(ws, row, 1, 'ESTIMATED LOADS ON PIER');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF009900' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Dead Load from Superstructure
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Dead Load from Superstructure');
  setCellFormula(ws, row, 4, `=${spanLengthCell}*${carriageWidthCell}*6`, 
    (input.spanLength || 10) * (input.carriageWidth || 7.5) * 6); // 6 kN/m² typical
  setCellValue(ws, row, 5, 'kN');
  setCellValue(ws, row, 6, 'Deck slab + wearing coat');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Live Load (IRC Class A)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Live Load (IRC Class A)');
  setCellFormula(ws, row, 4, `=${carriageWidthCell}*5.7*${spanLengthCell}*0.5`, 
    (input.carriageWidth || 7.5) * 5.7 * (input.spanLength || 10) * 0.5); // 5.7 kN/m² for Class A
  setCellValue(ws, row, 5, 'kN');
  setCellValue(ws, row, 6, 'IRC:6-2016 Class A loading');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Water Pressure (hydrostatic)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Hydrostatic Pressure');
  setCellFormula(ws, row, 4, `=0.5*9.81*POWER(5.3,2)*${pierLengthCell}`, 
    0.5 * 9.81 * Math.pow(5.3, 2) * (input.pierLength || 4.0)); // Assuming 5.3m water depth
  setCellValue(ws, row, 5, 'kN');
  setCellValue(ws, row, 6, 'Triangular water pressure');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row += 2;
  
  // ==================== STABILITY CHECKS ====================
  
  setCellValue(ws, row, 1, 'PRELIMINARY STABILITY CHECKS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FFCC6600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF0E6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Check 1: Bearing pressure
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Bearing Pressure Check');
  setCellFormula(ws, row, 4, `=IF((${pierVolumeCell}*25)/(${pierBaseWidthCell}*${pierBaseLengthCell})<${sbcCell},"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, 'Self weight vs SBC');
  row++;
  
  // Check 2: Slenderness
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Slenderness Check');
  setCellFormula(ws, row, 4, `=IF(${pierHeightCell}/${pierWidthCell}<12,"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, 'Height/Width < 12');
  row++;
  
  // Check 3: Base dimensions
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Base Dimension Check');
  setCellFormula(ws, row, 4, `=IF(${pierBaseWidthCell}>${pierWidthCell}*1.5,"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, 'Base > 1.5 × pier width');
  row += 2;
  
  // ==================== USAGE INSTRUCTIONS ====================
  
  setCellValue(ws, row, 1, 'USAGE INSTRUCTIONS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF6600CC' } };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Modify YELLOW cells with bridge geometry');
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Adjust RED cells for pier dimensions & materials');
  row++;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'GREEN cells show calculated values');
  row++;
  
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Check preliminary stability results');
  row++;
  
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Values link to STABILITY CHECK FOR PIER sheet');
  row++;
  
  console.log('✓ INPUT-PIER-STABILITY template sheet generated');
}