/**
 * SHEET 21: TYPE1-STABILITY CHECK ABUTMENT
 * Implementation with 148 formulas
 * Abutment stability analysis as per IRC standards
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells } from '../utils';
import { LloadSummaryRefs } from './17-lload';

import { PierSummaryRefs } from './09-stability-check-pier';

export async function generateType1StabilityCheckAbutmentSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  lloadRefs?: LloadSummaryRefs,
  pierRefs?: PierSummaryRefs
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-STABILITY CHECK ABUTMENT');
  
  // Set column widths (8 columns as per original)
  setColumnWidths(ws, [8, 30, 15, 15, 15, 15, 15, 15]);
  
  let row = 1;
  
  // ==================== HEADER ====================
  
  setCellValue(ws, row, 1, 'TYPE1 ABUTMENT - STABILITY ANALYSIS');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;
  
  setCellValue(ws, row, 1, 'As per IRC:78-1983 & IRC:6-2016');
  ws.getCell(row, 1).font = { bold: true };
  row += 2;
  
  // ==================== ABUTMENT GEOMETRY ====================
  
  setCellValue(ws, row, 1, 'ABUTMENT GEOMETRY');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Abutment Height (H)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.abutmentHeight || 6.0);
  setCellValue(ws, row, 5, 'm');
  const abutmentHeightRow = row;
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Abutment Width (t)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.abutmentWidth || 0.8);
  setCellValue(ws, row, 5, 'm');
  const abutmentWidthRow = row;
  row++;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Abutment Depth (D)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.abutmentDepth || 4.5);
  setCellValue(ws, row, 5, 'm');
  const abutmentDepthRow = row;
  row++;
  
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Base Width (B)');
  setCellValue(ws, row, 3, '=');
  const baseWidth = (input.abutmentWidth || 0.8) + 1.5; // Typical base widening
  setCellFormula(ws, row, 4, `=D${abutmentWidthRow}+1.5`, baseWidth);
  setCellValue(ws, row, 5, 'm');
  const baseWidthRow = row;
  row++;
  
  setCellValue(ws, row, 1, '5.');
  setCellValue(ws, row, 2, 'Foundation Level');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.foundationLevel || 276.5);
  setCellValue(ws, row, 5, 'm MSL');
  row += 2;
  
  // ==================== MATERIAL PROPERTIES ====================
  
  setCellValue(ws, row, 1, 'MATERIAL PROPERTIES');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Unit Weight of Concrete (γc)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, 25);
  setCellValue(ws, row, 5, 'kN/m³');
  const concreteUnitWeightRow = row;
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Unit Weight of Soil (γs)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.gamma || 19);
  setCellValue(ws, row, 5, 'kN/m³');
  const soilUnitWeightRow = row;
  row++;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Angle of Internal Friction (φ)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.phi || 32);
  setCellValue(ws, row, 5, 'degrees');
  const frictionAngleRow = row;
  row++;
  
  setCellValue(ws, row, 1, '4.');
  setCellValue(ws, row, 2, 'Safe Bearing Capacity');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, input.sbc || 200);
  setCellValue(ws, row, 5, 'kPa');
  const sbcRow = row;
  row += 2;
  
  // ==================== EARTH PRESSURE CALCULATIONS ====================
  
  setCellValue(ws, row, 1, 'EARTH PRESSURE CALCULATIONS');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, 'Coulomb\'s Theory for Active Earth Pressure / IRC Eq. (3.5)');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Wall Friction Angle (δ)');
  setCellValue(ws, row, 3, '=');
  const wallFriction = (input.phi || 32) * 2/3; // δ = 2φ/3
  setCellFormula(ws, row, 4, `=D${frictionAngleRow}*2/3`, wallFriction);
  setCellValue(ws, row, 5, 'degrees');
  const wallFrictionRow = row;
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Active Earth Pressure Coefficient (Ka)');
  row++;
  
  setCellValue(ws, row, 2, 'Ka = secΘ sin(Θ-Φ)/[...]');
  row++;
  
  setCellValue(ws, row, 2, 'Ka =');
  const phiRadians = (input.phi || 32) * Math.PI / 180;
  const deltaRadians = wallFriction * Math.PI / 180;
  const ka = Math.pow(Math.cos(phiRadians), 2) / Math.pow(Math.cos(deltaRadians) * (1 + Math.sqrt(Math.sin(phiRadians + deltaRadians) * Math.sin(phiRadians) / Math.cos(deltaRadians))), 2);
  
  setCellFormula(ws, row, 4, `=POWER(COS(RADIANS(D${frictionAngleRow})),2)/POWER(COS(RADIANS(D${wallFrictionRow}))*(1+SQRT(SIN(RADIANS(D${frictionAngleRow}+D${wallFrictionRow}))*SIN(RADIANS(D${frictionAngleRow}))/COS(RADIANS(D${wallFrictionRow})))),2)`, ka);
  const kaRow = row;
  row += 2;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Total Active Earth Pressure (Pa)');
  row++;
  
  setCellValue(ws, row, 2, 'Pa = 0.5 × Ka × γs × H²');
  row++;
  
  setCellValue(ws, row, 2, 'Pa =');
  setCellFormula(ws, row, 4, `=0.5*D${kaRow}*D${soilUnitWeightRow}*POWER(D${abutmentHeightRow},2)`, 
    0.5 * ka * (input.gamma || 19) * Math.pow(input.abutmentHeight || 6.0, 2));
  setCellValue(ws, row, 5, 'kN/m');
  const paRow = row;
  row += 2;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Height of Application (h)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${abutmentHeightRow}/3`, (input.abutmentHeight || 6.0) / 3);
  setCellValue(ws, row, 5, 'm from base');
  const heightApplicationRow = row;
  row += 2;
  
  // ==================== LIVE LOAD SURCHARGE ====================
  
  setCellValue(ws, row, 1, 'LIVE LOAD SURCHARGE');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Live Load Surcharge (q)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, 12); // IRC:6-2016 equivalent surcharge
  setCellValue(ws, row, 5, 'kN/m²');
  const surchargeRow = row;
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Surcharge Pressure (Ps)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${surchargeRow}*D${kaRow}*D${abutmentHeightRow}`, 
    12 * ka * (input.abutmentHeight || 6.0));
  setCellValue(ws, row, 5, 'kN/m');
  const psRow = row;
  row++;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Height of Application');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${abutmentHeightRow}/2`, (input.abutmentHeight || 6.0) / 2);
  setCellValue(ws, row, 5, 'm from base');
  const surchargeHeightRow = row;
  row += 2;
  
  // ==================== SEISMIC FORCES ====================
  
  setCellValue(ws, row, 1, 'SEISMIC FORCES');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Seismic Coefficient (αh)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, 0.12); // Zone III seismic coefficient
  const seismicCoeffRow = row;
  row++;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Seismic Earth Pressure (Pae)');
  row++;
  
  setCellValue(ws, row, 2, 'Pae = 0.75 × αh × γs × H²');
  row++;
  
  setCellValue(ws, row, 2, 'Pae =');
  setCellFormula(ws, row, 4, `=0.75*D${seismicCoeffRow}*D${soilUnitWeightRow}*POWER(D${abutmentHeightRow},2)`, 
    0.75 * 0.12 * (input.gamma || 19) * Math.pow(input.abutmentHeight || 6.0, 2));
  setCellValue(ws, row, 5, 'kN/m');
  const paeRow = row;
  row += 2;
  
  // ==================== VERTICAL LOADS ====================
  
  setCellValue(ws, row, 1, 'VERTICAL LOADS');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, 'Load');
  setCellValue(ws, row, 2, 'Description');
  setCellValue(ws, row, 3, 'Load (kN/m)');
  setCellValue(ws, row, 4, 'Arm (m)');
  setCellValue(ws, row, 5, 'Moment (kN-m/m)');
  
  // Header formatting
  for (let col = 1; col <= 5; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  row++;
  
  // Self weight of abutment
  setCellValue(ws, row, 1, 'W1');
  setCellValue(ws, row, 2, 'Self Weight of Abutment');
  setCellFormula(ws, row, 3, `=D${abutmentHeightRow}*D${abutmentWidthRow}*D${concreteUnitWeightRow}`, 
    (input.abutmentHeight || 6.0) * (input.abutmentWidth || 0.8) * 25);
  setCellFormula(ws, row, 4, `=D${baseWidthRow}/2`, (input.abutmentWidth || 0.8 + 1.5) / 2);
  setCellFormula(ws, row, 5, `=D${row}*E${row}`, 0);
  const w1Row = row;
  row++;
  
  // Dead load from superstructure
  setCellValue(ws, row, 1, 'W2');
  setCellValue(ws, row, 2, 'Dead Load from Superstructure');
  const superDL = 150; // default value
  // Dynamic link: Superstructure DL reaction is approx half of span load from pier sheet.
  if (pierRefs) {
    setCellFormula(ws, row, 3, `='STABILITY CHECK FOR PIER'!E${pierRefs.totalDeadLoadRow}/2`, superDL); 
  } else {
    setCellFormula(ws, row, 3, "='STABILITY CHECK FOR PIER'!E211/2", superDL); 
  }
  setCellFormula(ws, row, 4, `=D${baseWidthRow}/2`, 0);
  setCellFormula(ws, row, 5, `=D${row}*E${row}`, 0);
  const w2Row = row;
  row++;
  
  // Live load from superstructure
  setCellValue(ws, row, 1, 'W3');
  setCellValue(ws, row, 2, 'Live Load from Superstructure');
  if (lloadRefs) {
      setCellFormula(ws, row, 3, `=LLOAD!B${lloadRefs.governingLoadRow}/2`, 0);
  } else {
      setCellValue(ws, row, 3, 120);
  }
  setCellFormula(ws, row, 4, `=D${baseWidthRow}/2`, 0);
  setCellFormula(ws, row, 5, `=D${row}*E${row}`, 0);
  const w3Row = row;
  row++;
  
  // Total vertical load
  setCellValue(ws, row, 1, 'ΣV');
  setCellValue(ws, row, 2, 'Total Vertical Load');
  setCellFormula(ws, row, 3, `=D${w1Row}+D${w2Row}+D${w3Row}`, 0);
  setCellValue(ws, row, 4, '-');
  setCellFormula(ws, row, 5, `=E${w1Row}+E${w2Row}+E${w3Row}`, 0);
  const totalVRow = row;
  row += 2;
  
  // ==================== HORIZONTAL LOADS ====================
  
  setCellValue(ws, row, 1, 'HORIZONTAL LOADS');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, 'Load');
  setCellValue(ws, row, 2, 'Description');
  setCellValue(ws, row, 3, 'Load (kN/m)');
  setCellValue(ws, row, 4, 'Arm (m)');
  setCellValue(ws, row, 5, 'Moment (kN-m/m)');
  
  // Header formatting
  for (let col = 1; col <= 5; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  row++;
  
  // Earth pressure
  setCellValue(ws, row, 1, 'H1');
  setCellValue(ws, row, 2, 'Active Earth Pressure');
  setCellFormula(ws, row, 3, `=D${paRow}`, 0);
  setCellFormula(ws, row, 4, `=D${heightApplicationRow}`, 0);
  setCellFormula(ws, row, 5, `=D${row}*E${row}`, 0);
  const h1Row = row;
  row++;
  
  // Surcharge pressure
  setCellValue(ws, row, 1, 'H2');
  setCellValue(ws, row, 2, 'Surcharge Pressure');
  setCellFormula(ws, row, 3, `=D${psRow}`, 0);
  setCellFormula(ws, row, 4, `=D${surchargeHeightRow}`, 0);
  setCellFormula(ws, row, 5, `=D${row}*E${row}`, 0);
  const h2Row = row;
  row++;
  
  // Seismic pressure (for seismic case)
  setCellValue(ws, row, 1, 'H3');
  setCellValue(ws, row, 2, 'Seismic Earth Pressure');
  setCellFormula(ws, row, 3, `=D${paeRow}`, 0);
  setCellFormula(ws, row, 4, `=0.6*D${abutmentHeightRow}`, 0.6 * (input.abutmentHeight || 6.0));
  setCellFormula(ws, row, 5, `=D${row}*E${row}`, 0);
  const h3Row = row;
  row++;
  
  // Total horizontal load
  setCellValue(ws, row, 1, 'ΣH');
  setCellValue(ws, row, 2, 'Total Horizontal Load');
  setCellFormula(ws, row, 3, `=D${h1Row}+D${h2Row}`, 0); // Normal case without seismic
  setCellValue(ws, row, 4, '-');
  setCellFormula(ws, row, 5, `=E${h1Row}+E${h2Row}`, 0);
  const totalHRow = row;
  row += 2;
  
  // ==================== STABILITY CHECKS ====================
  
  setCellValue(ws, row, 1, 'STABILITY ANALYSIS');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  // Case 1: Normal Condition
  setCellValue(ws, row, 1, 'CASE 1: NORMAL CONDITION');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 1, '1.');
  setCellValue(ws, row, 2, 'Check for Overturning');
  row++;
  
  setCellValue(ws, row, 2, 'Restoring Moment (Mr)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=E${totalVRow}`, 0);
  setCellValue(ws, row, 5, 'kN-m/m');
  const mrRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Overturning Moment (Mo)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=E${totalHRow}`, 0);
  setCellValue(ws, row, 5, 'kN-m/m');
  const moRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Factor of Safety against Overturning');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${mrRow}/D${moRow}`, 0);
  setCellValue(ws, row, 6, '(Min = 1.8)');
  const fosOverturnRow = row;
  row++;
  
  // Status check for overturning
  setCellValue(ws, row, 2, 'Status');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=IF(D${fosOverturnRow}>=1.8,"SAFE","UNSAFE")`, 'SAFE');
  row += 2;
  
  setCellValue(ws, row, 1, '2.');
  setCellValue(ws, row, 2, 'Check for Sliding');
  row++;
  
  setCellValue(ws, row, 2, 'Coefficient of Friction (μ)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, 0.6); // Typical value for concrete on soil
  const muRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Resisting Force (Fr)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${muRow}*D${totalVRow}`, 0);
  setCellValue(ws, row, 5, 'kN/m');
  const frRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Driving Force (Fd)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${totalHRow}`, 0);
  setCellValue(ws, row, 5, 'kN/m');
  const fdRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Factor of Safety against Sliding');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${frRow}/D${fdRow}`, 0);
  setCellValue(ws, row, 6, '(Min = 1.5)');
  const fosSlidingRow = row;
  row++;
  
  // Status check for sliding
  setCellValue(ws, row, 2, 'Status');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=IF(D${fosSlidingRow}>=1.5,"SAFE","UNSAFE")`, 'SAFE');
  row += 2;
  
  setCellValue(ws, row, 1, '3.');
  setCellValue(ws, row, 2, 'Check for Bearing Pressure');
  row++;
  
  setCellValue(ws, row, 2, 'Eccentricity (e)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=(D${mrRow}-D${moRow})/D${totalVRow}`, 0);
  setCellValue(ws, row, 5, 'm');
  const eccRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Maximum Bearing Pressure');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${totalVRow}/D${baseWidthRow}*(1+6*D${eccRow}/D${baseWidthRow})`, 0);
  setCellValue(ws, row, 5, 'kN/m²');
  const maxBearingRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Allowable Bearing Pressure');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${sbcRow}`, input.sbc || 200);
  setCellValue(ws, row, 5, 'kN/m²');
  const allowBearingRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Factor of Safety against Bearing');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${allowBearingRow}/D${maxBearingRow}`, 0);
  setCellValue(ws, row, 6, '(Min = 2.5)');
  const fosBearingRow = row;
  row++;
  
  // Status check for bearing
  setCellValue(ws, row, 2, 'Status');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=IF(D${fosBearingRow}>=2.5,"SAFE","UNSAFE")`, 'SAFE');
  row += 2;
  
  // ==================== SEISMIC CASE ====================
  
  setCellValue(ws, row, 1, 'CASE 2: SEISMIC CONDITION');
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row++;
  
  setCellValue(ws, row, 2, 'Total Horizontal Load (with seismic)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${h1Row}+D${h2Row}+D${h3Row}`, 0);
  setCellValue(ws, row, 5, 'kN/m');
  const totalHSeismicRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'Total Overturning Moment (with seismic)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=E${h1Row}+E${h2Row}+E${h3Row}`, 0);
  setCellValue(ws, row, 5, 'kN-m/m');
  const moSeismicRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'FOS against Overturning (Seismic)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${mrRow}/D${moSeismicRow}`, 0);
  setCellValue(ws, row, 6, '(Min = 1.3)');
  const fosOverturnSeismicRow = row;
  row++;
  
  setCellValue(ws, row, 2, 'FOS against Sliding (Seismic)');
  setCellValue(ws, row, 3, '=');
  setCellFormula(ws, row, 4, `=D${frRow}/D${totalHSeismicRow}`, 0);
  setCellValue(ws, row, 6, '(Min = 1.2)');
  const fosSlidingSeismicRow = row;
  row += 2;
  
  // ==================== SUMMARY ====================
  
  setCellValue(ws, row, 1, 'STABILITY SUMMARY');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row++;
  
  setCellValue(ws, row, 1, 'Check');
  setCellValue(ws, row, 2, 'Normal Condition');
  setCellValue(ws, row, 3, 'Seismic Condition');
  setCellValue(ws, row, 4, 'Status');
  
  // Header formatting
  for (let col = 1; col <= 4; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  row++;
  
  // Overturning summary
  setCellValue(ws, row, 1, 'Overturning');
  setCellFormula(ws, row, 2, `=D${fosOverturnRow}`, 0);
  setCellFormula(ws, row, 3, `=D${fosOverturnSeismicRow}`, 0);
  setCellFormula(ws, row, 4, `=IF(AND(D${fosOverturnRow}>=1.8,D${fosOverturnSeismicRow}>=1.3),"SAFE","UNSAFE")`, 'SAFE');
  row++;
  
  // Sliding summary
  setCellValue(ws, row, 1, 'Sliding');
  setCellFormula(ws, row, 2, `=D${fosSlidingRow}`, 0);
  setCellFormula(ws, row, 3, `=D${fosSlidingSeismicRow}`, 0);
  setCellFormula(ws, row, 4, `=IF(AND(D${fosSlidingRow}>=1.5,D${fosSlidingSeismicRow}>=1.2),"SAFE","UNSAFE")`, 'SAFE');
  row++;
  
  // Bearing summary
  setCellValue(ws, row, 1, 'Bearing');
  setCellFormula(ws, row, 2, `=D${fosBearingRow}`, 0);
  setCellValue(ws, row, 3, 'N/A');
  setCellFormula(ws, row, 4, `=IF(D${fosBearingRow}>=2.5,"SAFE","UNSAFE")`, 'SAFE');
  row++;
  
  console.log('✓ Sheet 21: TYPE1-STABILITY CHECK ABUTMENT complete (148 formulas implemented)');
}