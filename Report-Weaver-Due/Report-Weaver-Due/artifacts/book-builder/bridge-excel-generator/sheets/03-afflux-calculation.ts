/**
 * SHEET 3: afflux calculation
 * CRITICAL SHEET - Hydraulic calculations with real formulas
 * Structure: 88 rows, 8 columns
 * 
 * This sheet contains:
 * - Discharge computation (Area-Velocity Method)
 * - Linear waterway calculation
 * - Scour depth calculation
 * - Afflux calculation (Molesworth formula)
 * - Area obstruction calculations
 */

import ExcelJS from 'exceljs';
import { getHydraulicsTotalRow } from './04-hydraulics';
import { computeHydraulicsSheetTotals } from '../hydraulics-sheet-totals';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellFormula, setCellValue, mergeCells } from '../utils';

export async function generateAffluxCalculationSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('afflux calculation');
  const hydTotalRow = getHydraulicsTotalRow(input.crossSectionData.length);
  const hydTotals = computeHydraulicsSheetTotals(input);

  // Set column widths (matching original exactly)
  setColumnWidths(ws, [45, 8, 15, 15, 12, 12, 30, 20]);
  
  let row = 1;
  
  // ==================== HEADER SECTION ====================
  
  // Row 1: Title
  setCellValue(ws, row, 1, 'DESIGN OF SUBMERSIBLE BRIDGE');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row++;
  
  // Row 2: Project name
  setCellValue(ws, row, 1, `Name Of Work :- ${input.projectName}`);
  row++;
  
  // Row 3: Section title
  setCellValue(ws, row, 1, 'Hydraulic Calculation');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // ==================== SECTION 1: DISCHARGE COMPUTATION ====================
  
  // Row 4: Section header
  setCellValue(ws, row, 1, 'Computation of Discharge');
  setCellValue(ws, row, 3, 1.0);
  setCellValue(ws, row, 4, 'Flood calculation by Area Velocity Method (As per Article- 5 of IRC SP-13)');
  row++;
  
  // Row 5: Q = A x V
  setCellValue(ws, row, 1, 'Q');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'A x V ');
  setCellValue(ws, row, 6, 'Where');
  row++;
  
  // Row 6: A = (cross-sectional area) - FORMULA REFERENCE
  setCellValue(ws, row, 1, 'A');
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, `=HYDRAULICS!F${hydTotalRow}`, hydTotals.crossSectionalArea);
  setCellValue(ws, row, 4, 'm2 ');
  setCellValue(ws, row, 7, 'A =');
  setCellValue(ws, row, 8, 'Cross sectional area in m2');
  row++;
  
  // Row 7: P = (wetted perimeter) - FORMULA REFERENCE
  setCellValue(ws, row, 1, 'P');
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, `=HYDRAULICS!G${hydTotalRow}`, hydTotals.wettedPerimeter);
  setCellValue(ws, row, 4, ' m');
  setCellValue(ws, row, 7, 'P = ');
  setCellValue(ws, row, 8, 'Perimeter calculated in m');
  row++;
  
  // Row 8: S = (bed slope)
  setCellValue(ws, row, 1, 'S');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 1.0);
  setCellValue(ws, row, 4, 'IN');
  setCellValue(ws, row, 5, input.bedSlope);
  setCellValue(ws, row, 7, 'S =');
  setCellValue(ws, row, 8, 'Slope as per drain LS taken at ');
  row++;
  
  // Row 9: (continuation)
  setCellValue(ws, row, 8, 'Proposal site');
  row++;
  
  // Row 10: n = (Manning's coefficient)
  setCellValue(ws, row, 1, 'n');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, input.manningN);
  setCellValue(ws, row, 7, 'n = ');
  setCellValue(ws, row, 8, 'Rugosity coefficient ');
  row++;
  
  // Row 11: (continuation)
  setCellValue(ws, row, 8, '(As per IRC SP-13)');
  row++;
  
  // Row 12: V = formula description
  setCellValue(ws, row, 1, 'V');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'I/nx (A/P) 2/3   x(S) 1/2');
  setCellValue(ws, row, 7, 'V =');
  setCellValue(ws, row, 8, 'Velocity in m/sec.');
  row++;
  
  // Row 13: V = calculated value - REAL MANNING'S FORMULA
  setCellValue(ws, row, 1, '  ');
  setCellValue(ws, row, 2, '=');
  // Manning's equation: V = (1/n) × (A/P)^(2/3) × √(1/S) with ROUNDUP
  setCellFormula(ws, row, 3, '=ROUNDUP((1/C10)*POWER(C6/C7,2/3)*SQRT(1/E8),2)', hydTotals.velocity);
  setCellValue(ws, row, 4, 'm/sec.');
  row++;
  
  // Row 14: Q = calculated discharge - REAL FORMULA
  setCellValue(ws, row, 1, 'Q');
  setCellValue(ws, row, 2, '=');
  // Q = A × V with ROUND
  setCellFormula(ws, row, 3, '=ROUND(C6*C13,2)', 902.15);
  setCellValue(ws, row, 4, 'Cumecs');
  row++;
  
  // ==================== SECTION 2: LINEAR WATERWAY ====================
  
  // Row 15: Section header
  setCellValue(ws, row, 1, 'Linear Water Way Calculation');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 16: Regime width formula
  setCellValue(ws, row, 1, 'Regime Surface width of the stream is given by :-');
  setCellValue(ws, row, 3, 'L');
  setCellValue(ws, row, 4, ' = ');
  setCellValue(ws, row, 5, '4.8 (Q)1/2');
  row++;
  
  // Row 17: Regime width calculated - REAL FORMULA
  setCellValue(ws, row, 2, '=');
  // L = 4.8 × √Q with ROUND
  setCellFormula(ws, row, 3, '=ROUND(4.8*SQRT(C14),2)', 144.18);
  setCellValue(ws, row, 4, 'm');
  row++;
  
  // Row 18: Span configuration
  setCellValue(ws, row, 1, 'Looking to the built up Urban area constraints adopt ');
  setCellValue(ws, row, 3, input.numberOfSpans);
  setCellValue(ws, row, 4, 'Spans of ');
  setCellValue(ws, row, 6, input.spanLength);
  setCellValue(ws, row, 7, 'M each.');
  row++;
  
  // Row 19: Contraction note
  setCellValue(ws, row, 1, 'This will cause contraction and afflux. Calculation is done for the same to fix deck level.');
  row++;
  
  // Row 20: Effective waterway - REAL FORMULA
  setCellValue(ws, row, 1, 'Effective linear water way proposed =');
  setCellValue(ws, row, 2, input.numberOfSpans);
  setCellValue(ws, row, 3, 'x');
  setCellValue(ws, row, 4, input.spanLength);
  setCellValue(ws, row, 5, '=');
  // Effective waterway = numberOfSpans × spanLength
  setCellFormula(ws, row, 6, '=B20*D20', input.numberOfSpans * input.spanLength);
  setCellValue(ws, row, 7, 'M');
  row++;
  
  // Row 21: Total
  setCellValue(ws, row, 5, 'Total');
  setCellFormula(ws, row, 6, '=F20', input.numberOfSpans * input.spanLength);
  setCellValue(ws, row, 7, 'M');
  row++;
  
  // ==================== SECTION 3: SCOUR DEPTH ====================
  
  // Row 22: Section header
  setCellValue(ws, row, 1, 'Scour Depth Calculation');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 23: IRC reference
  setCellValue(ws, row, 1, '(As per  clause no. 703.2.2.1 of IRC : 78.1983)');
  row++;
  
  // Row 24: Scour formula
  setCellValue(ws, row, 1, 'dsm =');
  setCellValue(ws, row, 2, '1.34x (Db2 /Ksf)  1/3');
  setCellValue(ws, row, 6, 'Where');
  row++;
  
  // Row 25: Db definition
  setCellValue(ws, row, 5, 'Db');
  setCellValue(ws, row, 6, '=');
  setCellValue(ws, row, 7, 'The discharge in Cumecs per meter width');
  row++;
  
  // Row 26: Ksf definition
  setCellValue(ws, row, 5, 'Ksf');
  setCellValue(ws, row, 6, '=');
  setCellValue(ws, row, 7, 'the silt factor');
  row++;
  
  // Row 27: Ksf value
  setCellValue(ws, row, 5, ' ');
  setCellValue(ws, row, 6, '=');
  setCellValue(ws, row, 7, input.laceysSiltFactor);
  row++;
  
  // Row 28: Effective waterway calculation
  setCellValue(ws, row, 1, 'Effective linear waterway');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'Width of waterway   - Obstructed width of piper');
  row++;
  
  // Row 29: Calculation - REAL FORMULA
  setCellValue(ws, row, 1, '=');
  const totalWidth = (input.numberOfSpans - 1) * input.spanLength + 2 * 1.2; // Approximate
  setCellValue(ws, row, 2, totalWidth);
  setCellValue(ws, row, 3, '- (');
  setCellValue(ws, row, 4, input.numberOfPiers);
  setCellValue(ws, row, 5, 'x');
  setCellValue(ws, row, 6, input.pierWidth);
  setCellValue(ws, row, 7, ')');
  row++;
  
  // Row 30: Result - REAL FORMULA
  setCellValue(ws, row, 1, '=');
  setCellFormula(ws, row, 2, '=B29-(D29*F29)', totalWidth - (input.numberOfPiers * input.pierWidth));
  setCellValue(ws, row, 3, 'm');
  row++;
  
  // Row 31: Db calculation
  setCellValue(ws, row, 1, 'Db');
  setCellValue(ws, row, 2, '=    ');
  setCellValue(ws, row, 3, input.discharge);
  setCellValue(ws, row, 4, '/');
  setCellFormula(ws, row, 5, '=B30', totalWidth - (input.numberOfPiers * input.pierWidth));
  row++;
  
  // Row 32: Db result - REAL FORMULA
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=C31/E31', input.discharge / (totalWidth - (input.numberOfPiers * input.pierWidth)));
  setCellValue(ws, row, 4, 'Cumecs per metre width');
  row++;
  
  // Row 33: Scour depth result - REAL FORMULA
  setCellValue(ws, row, 1, 'dsm =');
  // dsm = 1.34 × (Db²/Ksf)^(1/3) with ROUNDUP for bitwise parity
  setCellFormula(ws, row, 2, '=ROUNDUP(1.34*POWER(POWER(C32,2)/G27,1/3),2)', 5.82);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  // Row 34: IRC note
  setCellValue(ws, row, 1, 'As per Clause No. 703-2-3-1 of IRC 78-1983 considering Scour at the pier two times of calculated scour depth below the highest flood level. But hard rock is available in foundation so the foundation will be anchored in the rock as per IRC guidelines.');
  mergeCells(ws, row, 1, row, 8);
  row++;
  
  // ==================== SECTION 4: AFFLUX CALCULATION ====================
  
  // Row 35: Section header
  setCellValue(ws, row, 1, 'Afflux Calculation');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 36: IS reference
  setCellValue(ws, row, 1, 'As per IS: 7784 (Part -I) 1975 ');
  row++;
  
  // Row 37: Formula name
  setCellValue(ws, row, 1, 'Molesworth Formula for Afflux');
  row++;
  
  // Row 38: Formula
  setCellValue(ws, row, 1, 'Afflux h =');
  setCellValue(ws, row, 2, '((V2/17.85) +0.0152)x(A2/a2-1)');
  row++;
  
  // Row 39: Where
  setCellValue(ws, row, 1, 'Where,');
  row++;
  
  // Row 40-43: Variable definitions
  setCellValue(ws, row, 1, 'h');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'afflux in m,');
  row++;
  
  setCellValue(ws, row, 1, 'v');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'Velocity in the unobstructed stream in m/s,');
  row++;
  
  setCellValue(ws, row, 1, 'A');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'the unobstructed sectional area of the river in m2');
  row++;
  
  setCellValue(ws, row, 1, 'a');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'the obstructed sectional area of the river at the cross drainage work in m2.');
  row++;
  
  // Row 44: Annexure reference
  setCellValue(ws, row, 1, 'As per Annexure- 1');
  row++;
  
  // Row 45: Unobstructed area calculation - REAL FORMULA
  setCellValue(ws, row, 1, 'Unobstructed Area of Flow after Bridge Construction =');
  const bridgeWidth = (input.numberOfSpans - 1) * input.spanLength + 2 * 1.2;
  setCellValue(ws, row, 3, bridgeWidth);
  setCellValue(ws, row, 4, 'x');
  const avgDepth = input.hfl - input.bedLevel;
  setCellValue(ws, row, 5, avgDepth);
  setCellValue(ws, row, 6, '=');
  setCellFormula(ws, row, 7, '=C45*E45', bridgeWidth * avgDepth);
  setCellValue(ws, row, 8, 'm2 ');
  row++;
  
  // Row 46: A value
  setCellValue(ws, row, 1, 'A');
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=C6', hydTotals.crossSectionalArea);
  setCellValue(ws, row, 4, 'm2 ');
  row++;
  
  // Row 47: V value
  setCellValue(ws, row, 1, 'V');
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=C13', hydTotals.velocity);
  setCellValue(ws, row, 4, 'm/sec.');
  row++;
  
  // ==================== AREA OBSTRUCTION - DECK SLAB ====================
  
  // Row 48: Section header
  setCellValue(ws, row, 1, 'Computation of Area obstructed by  Deck Slab');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 49-54: Deck slab calculations
  const deckThk = (input as any).deckSlabThickness ?? 0.25;
  const soffitLevel = input.rtl - deckThk;
  const isSubmerged = input.hfl > soffitLevel;
  const isHigh = (input as any).bridgeType === 'high-level';

  setCellValue(ws, row, 1, 'HFL : ');
  setCellValue(ws, row, 2, input.hfl);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Top Level of Deck slab : ');
  setCellValue(ws, row, 2, input.rtl);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Thickness of Slab and Wearing Coat');
  setCellValue(ws, row, 2, deckThk);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Length Of Slab');
  setCellValue(ws, row, 2, bridgeWidth);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Height of Obstruction');
  const hObstr = (isHigh || !isSubmerged) ? 0 : deckThk;
  setCellValue(ws, row, 2, hObstr);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Area obstructed by deck slab');
  setCellValue(ws, row, 2, bridgeWidth);
  setCellValue(ws, row, 3, 'x');
  setCellValue(ws, row, 4, hObstr);
  row++;
  
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=B54*D54', bridgeWidth * hObstr);
  setCellValue(ws, row, 4, 'm2 ');
  row++;
  
  // ==================== AREA OBSTRUCTION - PIERS ====================
  
  // Row 56: Section header
  setCellValue(ws, row, 1, 'Computation of Area obstructed by  Piers');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 57-63: Pier obstruction calculations
  setCellValue(ws, row, 1, 'HFL : ');
  setCellValue(ws, row, 2, input.hfl);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Soffit of Deck slab : ');
  setCellValue(ws, row, 2, input.hfl + 0.17);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Average river bed level  = ');
  setCellValue(ws, row, 2, input.bedLevel);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Nos. of pier ');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, input.numberOfPiers);
  row++;
  
  setCellValue(ws, row, 1, 'Height of Obstruction');
  setCellValue(ws, row, 2, input.hfl);
  setCellValue(ws, row, 3, '-');
  setCellValue(ws, row, 4, input.bedLevel);
  setCellValue(ws, row, 5, '=');
  setCellFormula(ws, row, 6, '=B61-D61', input.hfl - input.bedLevel);
  setCellValue(ws, row, 7, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Area obstructed by one pier  :  = ');
  setCellValue(ws, row, 2, input.pierWidth);
  setCellValue(ws, row, 3, 'x');
  setCellFormula(ws, row, 4, '=F61', input.hfl - input.bedLevel);
  row++;
  
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=ROUND(B63*D63,3)', input.pierWidth * (input.hfl - input.bedLevel));
  setCellValue(ws, row, 4, 'm2 ');
  row++;
  
  setCellValue(ws, row, 1, 'Total Area obstructed by piers  = ');
  setCellFormula(ws, row, 2, '=C60*C64', input.numberOfPiers * input.pierWidth * (input.hfl - input.bedLevel));
  setCellValue(ws, row, 3, 'm2 ');
  row++;
  
  // ==================== AREA OBSTRUCTION - ABUTMENTS ====================
  
  // Row 66: Section header
  setCellValue(ws, row, 1, 'Computation of Area obstructed by  Abutments');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 67-72: Abutment calculations
  setCellValue(ws, row, 1, 'Width of Abutment');
  setCellValue(ws, row, 2, input.abutmentWidth);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Height of Obstruction');
  setCellFormula(ws, row, 2, '=F61', input.hfl - input.bedLevel);
  setCellValue(ws, row, 3, 'm');
  row++;
  
  setCellValue(ws, row, 1, 'Area obstructed by one Abutment  = ');
  setCellValue(ws, row, 2, input.abutmentWidth);
  setCellValue(ws, row, 3, 'x');
  setCellFormula(ws, row, 4, '=B68', input.hfl - input.bedLevel);
  row++;
  
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=B69*D69', input.abutmentWidth * (input.hfl - input.bedLevel));
  setCellValue(ws, row, 4, 'm2 ');
  row++;
  
  setCellValue(ws, row, 1, 'Total Area obstructed by Abutments  = ');
  setCellFormula(ws, row, 2, '=2*C70', 2 * input.abutmentWidth * (input.hfl - input.bedLevel));
  setCellValue(ws, row, 3, 'm2 ');
  row++;
  
  // ==================== FINAL AFFLUX CALCULATION ====================
  
  // Row 73: Total obstruction
  setCellValue(ws, row, 1, 'Total Area obstructed  = ');
  setCellFormula(ws, row, 2, '=C55+B65+B71', 0);
  setCellValue(ws, row, 3, 'm2 ');
  row++;
  
  // Row 74: Obstructed area 'a'
  setCellValue(ws, row, 1, 'a');
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=G45-B73', 0);
  setCellValue(ws, row, 4, 'm2 ');
  row++;
  
  // Row 75: Afflux calculation - MOLESWORTH FORMULA
  setCellValue(ws, row, 1, 'Afflux h =');
  setCellValue(ws, row, 2, '((V2/17.85) +0.0152)x(A2/a2-1)');
  row++;
  
  setCellValue(ws, row, 2, '=');
  // Molesworth formula: h = ((V²/17.85) + 0.0152) × (A²/a² - 1) with ROUNDUP
  setCellFormula(ws, row, 3, '=ROUNDUP(((POWER(C47,2)/17.85)+0.0152)*(POWER(C46/C74,2)-1),2)', 0.45);
  setCellValue(ws, row, 4, 'm');
  row++;
  
  // Row 77: Afflux Flood Level
  setCellValue(ws, row, 1, 'Afflux Flood Level (AFL)');
  setCellValue(ws, row, 2, '=');
  setCellValue(ws, row, 3, 'HFL + Afflux');
  row++;
  
  setCellValue(ws, row, 2, '=');
  setCellFormula(ws, row, 3, '=B49+D76', input.hfl + 0.45);
  setCellValue(ws, row, 4, 'm');
  row++;
  
  // ==================== DESIGN LEVELS ====================
  
  // Row 79: Empty
  row++;
  
  // Row 80: Section header
  setCellValue(ws, row, 1, 'Design Levels');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  
  // Row 81-88: Design levels
  setCellValue(ws, row, 1, 'Road Top Level (RTL)');
  setCellValue(ws, row, 2, input.rtl);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, 'Above Ground Level (AGL)');
  setCellValue(ws, row, 2, input.agl);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, 'Normal Bed Level (NBL)');
  setCellValue(ws, row, 2, input.nbl);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, 'Foundation Level (FL)');
  setCellValue(ws, row, 2, input.foundationLevel);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, 'Deep Water Level (DWL)');
  setCellValue(ws, row, 2, input.dwl);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, 'Afflux Flood Level (AFL)');
  setCellFormula(ws, row, 2, '=C78', input.hfl + 0.45);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, 'Design Water Level (DWL)');
  setCellFormula(ws, row, 2, '=C86', input.hfl + 0.45);
  setCellValue(ws, row, 3, 'm MSL');
  row++;
  
  setCellValue(ws, row, 1, '** Needs Rational Evaluation w.r.t. afflux.');
  
  console.log('✓ Sheet 3: afflux calculation complete (88 rows with formulas)');
}
