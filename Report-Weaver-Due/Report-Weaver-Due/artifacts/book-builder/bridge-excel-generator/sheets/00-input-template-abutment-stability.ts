/**
 * INPUT TEMPLATE: ABUTMENT STABILITY PARAMETERS
 * User-friendly input sheet for abutment design and stability parameters
 * Links directly to abutment stability check and design sheets
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells } from '../utils';

export async function generateInputTemplateAbutmentStabilitySheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INPUT-ABUTMENT-STABILITY');
  
  // Set column widths for better presentation
  setColumnWidths(ws, [5, 35, 15, 15, 15, 20, 15, 15]);
  
  let row = 1;
  
  // ==================== HEADER ====================
  
  setCellValue(ws, row, 1, 'ABUTMENT STABILITY DESIGN INPUT PARAMETERS');
  ws.getCell(row, 1).font = { bold: true, size: 16, color: { argb: 'FF006600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
  mergeCells(ws, row, 1, row, 7);
  row += 2;
  
  setCellValue(ws, row, 1, 'Instructions: Enter abutment geometry and soil parameters below.');
  setCellValue(ws, row, 2, 'These values control abutment stability analysis for both TYPE1 and C1 designs.');
  ws.getCell(row, 1).font = { italic: true, color: { argb: 'FF666666' } };
  ws.getCell(row, 2).font = { italic: true, color: { argb: 'FF666666' } };
  row += 2;
  
  // ==================== ABUTMENT TYPE SELECTION ====================
  
  setCellValue(ws, row, 1, 'ABUTMENT TYPE SELECTION');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF006600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FFF0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Abutment Type
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Primary Abutment Type');
  setCellValue(ws, row, 4, 'TYPE1');
  setCellValue(ws, row, 6, 'TYPE1 (Gravity) or C1 (Cantilever)');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const abutmentTypeCell = `D${row}`;
  row++;
  
  // Design both types
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Design Both Types');
  setCellValue(ws, row, 4, 'YES');
  setCellValue(ws, row, 6, 'YES to compare both designs');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const designBothCell = `D${row}`;
  row += 2;
  
  // ==================== GENERAL ABUTMENT DIMENSIONS ====================
  
  setCellValue(ws, row, 1, 'GENERAL ABUTMENT DIMENSIONS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF006600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FFF0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Abutment Height
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Abutment Height');
  setCellValue(ws, row, 4, input.abutmentHeight || 6.0);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'From foundation to deck level');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const abutmentHeightCell = `D${row}`;
  row++;
  
  // Abutment Width/Thickness
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Abutment Thickness');
  setCellValue(ws, row, 4, input.abutmentWidth || 0.8);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Stem thickness for both types');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const abutmentThicknessCell = `D${row}`;
  row++;
  
  // Abutment Depth
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Abutment Depth (perpendicular to road)');
  setCellValue(ws, row, 4, input.abutmentDepth || 4.5);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Length along bridge axis');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const abutmentDepthCell = `D${row}`;
  row++;
  
  // Foundation Level
  setCellValue(ws, row, 1, '6.');
  setCellValue(ws, row, 2, 'Foundation Level');
  setCellValue(ws, row, 4, input.foundationLevel || 276.5);
  setCellValue(ws, row, 5, 'm MSL');
  setCellValue(ws, row, 6, 'Bottom of foundation');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const foundationLevelCell = `D${row}`;
  row += 2;
  
  // ==================== APPROACH DETAILS ====================
  
  setCellValue(ws, row, 1, 'APPROACH & RETURN WALL DETAILS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF006600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FFF0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Dirt Wall Height
  setCellValue(ws, row, 1, '7.');
  setCellValue(ws, row, 2, 'Dirt Wall Height');
  setCellValue(ws, row, 4, input.dirtWallHeight || 4.0);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Height of approach embankment');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const dirtWallHeightCell = `D${row}`;
  row++;
  
  // Return Wall Length
  setCellValue(ws, row, 1, '8.');
  setCellValue(ws, row, 2, 'Return Wall Length');
  setCellValue(ws, row, 4, input.returnWallLength || 8.0);
  setCellValue(ws, row, 5, 'm');
  setCellValue(ws, row, 6, 'Length of wing walls');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const returnWallLengthCell = `D${row}`;
  row += 2;
  
  // ==================== SOIL PROPERTIES ====================
  
  setCellValue(ws, row, 1, 'SOIL PROPERTIES');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF006600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FFF0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Angle of Internal Friction
  setCellValue(ws, row, 1, '9.');
  setCellValue(ws, row, 2, 'Angle of Internal Friction (φ)');
  setCellValue(ws, row, 4, input.phi || 32);
  setCellValue(ws, row, 5, 'degrees');
  setCellValue(ws, row, 6, 'Critical for earth pressure');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const phiCell = `D${row}`;
  row++;
  
  // Unit Weight of Soil
  setCellValue(ws, row, 1, '10.');
  setCellValue(ws, row, 2, 'Unit Weight of Soil (γ)');
  setCellValue(ws, row, 4, input.gamma || 19);
  setCellValue(ws, row, 5, 'kN/m³');
  setCellValue(ws, row, 6, 'Backfill soil density');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const gammaCell = `D${row}`;
  row++;
  
  // Safe Bearing Capacity
  setCellValue(ws, row, 1, '11.');
  setCellValue(ws, row, 2, 'Safe Bearing Capacity (SBC)');
  setCellValue(ws, row, 4, input.sbc || 200);
  setCellValue(ws, row, 5, 'kPa');
  setCellValue(ws, row, 6, 'Foundation bearing capacity');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const sbcCell = `D${row}`;
  row++;
  
  // Coefficient of Friction
  setCellValue(ws, row, 1, '12.');
  setCellValue(ws, row, 2, 'Coefficient of Friction (μ)');
  setCellValue(ws, row, 4, 0.6);
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'Concrete on soil friction');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const muCell = `D${row}`;
  row += 2;
  
  // ==================== SEISMIC PARAMETERS ====================
  
  setCellValue(ws, row, 1, 'SEISMIC PARAMETERS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF006600' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0FFF0' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Seismic Zone
  setCellValue(ws, row, 1, '13.');
  setCellValue(ws, row, 2, 'Seismic Zone');
  setCellValue(ws, row, 4, 'III');
  setCellValue(ws, row, 6, 'As per IS:1893');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
  const seismicZoneCell = `D${row}`;
  row++;
  
  // Seismic Coefficient
  setCellValue(ws, row, 1, '14.');
  setCellValue(ws, row, 2, 'Horizontal Seismic Coefficient (αh)');
  setCellValue(ws, row, 4, 0.12);
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'Zone III coefficient');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
  const seismicCoeffCell = `D${row}`;
  row += 2;
  
  // ==================== CALCULATED EARTH PRESSURE VALUES ====================
  
  setCellValue(ws, row, 1, 'CALCULATED EARTH PRESSURE VALUES');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF009900' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  // Rankine's Ka (for TYPE1)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Rankine\'s Ka (TYPE1)');
  setCellFormula(ws, row, 4, `=POWER(TAN(RADIANS(45-${phiCell}/2)),2)`, 
    Math.pow(Math.tan((45 - (input.phi || 32) / 2) * Math.PI / 180), 2));
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'Active earth pressure coefficient');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  const kaRankineCell = `D${row}`;
  row++;
  
  // Coulomb's Ka (for C1)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Coulomb\'s Ka (C1)');
  setCellFormula(ws, row, 4, `=POWER(COS(RADIANS(${phiCell})),2)/POWER(COS(RADIANS(${phiCell}*2/3))*(1+SQRT(SIN(RADIANS(${phiCell}+${phiCell}*2/3))*SIN(RADIANS(${phiCell}))/COS(RADIANS(${phiCell}*2/3)))),2)`, 
    Math.pow(Math.cos((input.phi || 32) * Math.PI / 180), 2) / Math.pow(Math.cos((input.phi || 32) * 2/3 * Math.PI / 180) * (1 + Math.sqrt(Math.sin(((input.phi || 32) + (input.phi || 32) * 2/3) * Math.PI / 180) * Math.sin((input.phi || 32) * Math.PI / 180) / Math.cos((input.phi || 32) * 2/3 * Math.PI / 180))), 2));
  setCellValue(ws, row, 5, '-');
  setCellValue(ws, row, 6, 'With wall friction');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  const kaCoulombCell = `D${row}`;
  row++;
  
  // Total Active Earth Pressure (TYPE1)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Total Active Pressure (TYPE1)');
  setCellFormula(ws, row, 4, `=0.5*${kaRankineCell}*${gammaCell}*POWER(${abutmentHeightCell},2)`, 
    0.5 * Math.pow(Math.tan((45 - (input.phi || 32) / 2) * Math.PI / 180), 2) * (input.gamma || 19) * Math.pow(input.abutmentHeight || 6.0, 2));
  setCellValue(ws, row, 5, 'kN/m');
  setCellValue(ws, row, 6, 'Rankine theory');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Total Active Earth Pressure (C1)
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Total Active Pressure (C1)');
  setCellFormula(ws, row, 4, `=0.5*${kaCoulombCell}*${gammaCell}*POWER(${abutmentHeightCell},2)`, 
    0.5 * Math.pow(Math.cos((input.phi || 32) * Math.PI / 180), 2) / Math.pow(Math.cos((input.phi || 32) * 2/3 * Math.PI / 180) * (1 + Math.sqrt(Math.sin(((input.phi || 32) + (input.phi || 32) * 2/3) * Math.PI / 180) * Math.sin((input.phi || 32) * Math.PI / 180) / Math.cos((input.phi || 32) * 2/3 * Math.PI / 180))), 2) * (input.gamma || 19) * Math.pow(input.abutmentHeight || 6.0, 2));
  setCellValue(ws, row, 5, 'kN/m');
  setCellValue(ws, row, 6, 'Coulomb theory');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row++;
  
  // Live Load Surcharge Pressure
  setCellValue(ws, row, 1, '→');
  setCellValue(ws, row, 2, 'Live Load Surcharge Pressure');
  setCellFormula(ws, row, 4, `=12*${kaRankineCell}*${abutmentHeightCell}`, 
    12 * Math.pow(Math.tan((45 - (input.phi || 32) / 2) * Math.PI / 180), 2) * (input.abutmentHeight || 6.0));
  setCellValue(ws, row, 5, 'kN/m');
  setCellValue(ws, row, 6, '12 kN/m² surcharge');
  ws.getCell(row, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
  row += 2;
  
  // ==================== ABUTMENT COMPARISON ====================
  
  setCellValue(ws, row, 1, 'ABUTMENT TYPE COMPARISON');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF009900' } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6FFE6' }
  };
  mergeCells(ws, row, 1, row, 4);
  row++;
  
  setCellValue(ws, row, 1, 'Parameter');
  setCellValue(ws, row, 2, 'TYPE1 (Gravity)');
  setCellValue(ws, row, 3, 'C1 (Cantilever)');
  setCellValue(ws, row, 4, 'Recommendation');
  
  // Header formatting
  for (let col = 1; col <= 4; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  row++;
  
  // Base Width
  setCellValue(ws, row, 1, 'Base Width');
  setCellFormula(ws, row, 2, `=${abutmentThicknessCell}+1.5`, (input.abutmentWidth || 0.8) + 1.5);
  setCellFormula(ws, row, 3, `=${abutmentHeightCell}*0.7`, (input.abutmentHeight || 6.0) * 0.7);
  setCellValue(ws, row, 4, 'Cantilever more economical');
  row++;
  
  // Concrete Volume
  setCellValue(ws, row, 1, 'Concrete Volume');
  setCellFormula(ws, row, 2, `=${abutmentHeightCell}*${abutmentThicknessCell}*${abutmentDepthCell}`, 
    (input.abutmentHeight || 6.0) * (input.abutmentWidth || 0.8) * (input.abutmentDepth || 4.5));
  setCellFormula(ws, row, 3, `=(${abutmentHeightCell}*${abutmentThicknessCell}+${abutmentHeightCell}*0.7*0.8)*${abutmentDepthCell}`, 
    ((input.abutmentHeight || 6.0) * (input.abutmentWidth || 0.8) + (input.abutmentHeight || 6.0) * 0.7 * 0.8) * (input.abutmentDepth || 4.5));
  setCellValue(ws, row, 4, 'Compare volumes');
  row++;
  
  // Stability
  setCellValue(ws, row, 1, 'Stability');
  setCellValue(ws, row, 2, 'Good (mass)');
  setCellValue(ws, row, 3, 'Good (leverage)');
  setCellValue(ws, row, 4, 'Both adequate');
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
  
  // Check 1: Height to thickness ratio
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Height/Thickness Ratio');
  setCellFormula(ws, row, 4, `=IF(${abutmentHeightCell}/${abutmentThicknessCell}<10,"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, 'Should be < 10');
  row++;
  
  // Check 2: Soil friction angle
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Soil Friction Angle');
  setCellFormula(ws, row, 4, `=IF(AND(${phiCell}>25,${phiCell}<45),"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, '25-45° typical range');
  row++;
  
  // Check 3: Bearing capacity
  setCellValue(ws, row, 1, '✓');
  setCellValue(ws, row, 2, 'Bearing Capacity');
  setCellFormula(ws, row, 4, `=IF(${sbcCell}>150,"PASS","CHECK")`, 'PASS');
  setCellValue(ws, row, 6, 'Should be > 150 kPa');
  row += 2;
  
  // ==================== USAGE INSTRUCTIONS ====================
  
  setCellValue(ws, row, 1, 'USAGE INSTRUCTIONS');
  ws.getCell(row, 1).font = { bold: true, size: 14, color: { argb: 'FF6600CC' } };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Modify YELLOW cells for abutment type selection');
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Adjust RED cells for dimensions & soil properties');
  row++;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'GREEN cells show calculated earth pressures');
  row++;
  
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Compare TYPE1 vs C1 recommendations');
  row++;
  
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Values link to both abutment stability sheets');
  row++;
  
  console.log('✓ INPUT-ABUTMENT-STABILITY template sheet generated');
}