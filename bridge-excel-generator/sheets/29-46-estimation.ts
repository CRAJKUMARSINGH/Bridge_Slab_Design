/**
 * Sheets 29-46: C1 abutment, reporting, and estimation views.
 *
 * Every engineering value in this file is read from EnhancedProjectInput.
 * Missing result objects produce an explicit CHECK row rather than a sample
 * design that could be mistaken for a calculation.
 */

import ExcelJS from 'exceljs';
import type { AbutmentDesignResult, EnhancedProjectInput, EstimationResult, SteelDetails } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';

function n(value: number | undefined): number | string {
  return value === undefined || !Number.isFinite(value) ? 'CHECK' : value;
}

function steelText(steel: SteelDetails | undefined): string {
  if (!steel) return 'CHECK';
  return `${steel.numberOfBars} nos ${steel.diameter} mm dia @ ${steel.spacing} mm c/c`;
}

function c1(input: EnhancedProjectInput): AbutmentDesignResult | undefined {
  return input.abutmentC1;
}

function missing(ws: ExcelJS.Worksheet, row = 3): void {
  setCellValue(ws, row, 1, 'CHECK: calculated C1/estimation result unavailable.');
  ws.getCell(row, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
}

// Sheet 41: TechNote
export async function generateTechNoteSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TechNote');
  setColumnWidths(ws, [52, 20]);
  setCellValue(ws, 1, 1, 'TECHNICAL NOTE');
  ws.getCell(1, 1).font = { bold: true, size: 15 };
  const h = input.hydraulics;
  const lines = [
    `Project: ${input.projectName}`,
    `Bridge length: ${input.totalLength} m; spans: ${input.numberOfSpans} × ${input.spanLength} m; carriageway: ${input.carriageWidth} m.`,
    `Hydraulic result: Q ${n(h?.discharge)} m³/s; velocity ${n(h?.velocity)} m/s; afflux ${n(h?.afflux)} m; design scour ${n(h?.designScourDepth)} m.`,
    `Levels: HFL ${input.hfl} m MSL; bed ${input.bedLevel} m MSL; foundation ${input.foundationLevel} m MSL; RTL ${input.rtl} m MSL.`,
    `Materials: concrete ${input.concreteGrade} (fck ${input.fck} MPa); steel ${input.steelGrade} (fy ${input.fy} MPa).`,
    'This workbook is a draft/review build. Standards interpretation, load models, assumptions, and all CHECK/UNSAFE outcomes require engineering review.',
  ];
  lines.forEach((line, index) => {
    setCellValue(ws, 3 + index * 2, 1, line);
    ws.getCell(3 + index * 2, 1).alignment = { wrapText: true, vertical: 'top' };
  });
}

// Sheet 42: INSERT ESTIMATE
export async function generateInsertEstimateSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('INSERT ESTIMATE');
  setColumnWidths(ws, [42, 18, 18]);
  setCellValue(ws, 1, 1, 'ESTIMATION & BOQ');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const estimate = input.estimation;
  if (!estimate) return missing(ws);
  setCellValue(ws, 3, 1, 'BOQ items');
  setCellValue(ws, 3, 2, estimate.boq.length);
  setCellValue(ws, 4, 1, 'Subtotal');
  setCellValue(ws, 4, 2, estimate.cost.subtotal);
  setCellValue(ws, 4, 3, '₹');
  setCellValue(ws, 5, 1, 'GST');
  setCellValue(ws, 5, 2, estimate.cost.gst);
  setCellValue(ws, 5, 3, '₹');
  setCellValue(ws, 6, 1, 'Total');
  setCellValue(ws, 6, 2, estimate.cost.total);
  setCellValue(ws, 6, 3, '₹');
  setCellValue(ws, 8, 1, 'Rates are provisional unless backed by the approved project SSR/DSR register.');
  ws.getCell(8, 1).alignment = { wrapText: true };
}

// Sheet 43: Tech Report
export async function generateTechReportSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Tech Report');
  setColumnWidths(ws, [5, 44, 18, 18]);
  setCellValue(ws, 1, 1, 'TECHNICAL REPORT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const h = input.hydraulics;
  const lines = [
    ['Project Name', input.projectName],
    ['Location', input.location],
    ['Bridge Type', input.bridgeType ?? 'Not specified'],
    ['Total Length', `${input.totalLength} m`],
    ['Width', `${input.bridgeWidth ?? input.carriageWidth} m`],
    ['No. of Spans', input.numberOfSpans],
    ['Discharge', `${n(h?.discharge ?? input.discharge)} m³/s`],
    ['Velocity', `${n(h?.velocity)} m/s`],
    ['Afflux', `${n(h?.afflux)} m`],
    ['Design Scour', `${n(h?.designScourDepth)} m`],
    ['Flow Type', h?.flowType ?? 'CHECK'],
  ];
  lines.forEach(([label, value], index) => {
    setCellValue(ws, 3 + index, 1, label);
    setCellValue(ws, 3 + index, 2, value);
  });
  setCellValue(ws, 16, 1, 'Draft/review status');
  setCellValue(ws, 16, 2, 'Engineering sign-off not obtained');
}

function estimateOrReview(input: EnhancedProjectInput): EstimationResult | undefined {
  return input.estimation;
}

// Sheet 44: General Abs.
export async function generateGeneralAbsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('General Abs.');
  setColumnWidths(ws, [8, 48, 18, 18]);
  setCellValue(ws, 1, 1, 'GENERAL ABSTRACT OF COST');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const estimate = estimateOrReview(input);
  if (!estimate) return missing(ws);
  addTableHeader(ws, 3, ['S.No.', 'Category / item', 'Amount (₹)', '% of subtotal']);
  const subtotal = estimate.cost.subtotal;
  estimate.boq.forEach((item, index) => {
    addTableRow(ws, 4 + index, [
      item.itemNo,
      item.description,
      item.amount,
      subtotal > 0 ? item.amount / subtotal * 100 : 0,
    ]);
  });
  const totalRow = 5 + estimate.boq.length;
  setCellValue(ws, totalRow, 2, 'SUBTOTAL');
  setCellValue(ws, totalRow, 3, estimate.cost.subtotal);
  setCellValue(ws, totalRow + 1, 2, 'GST');
  setCellValue(ws, totalRow + 1, 3, estimate.cost.gst);
  setCellValue(ws, totalRow + 2, 2, 'TOTAL');
  setCellValue(ws, totalRow + 2, 3, estimate.cost.total);
}

// Sheet 45: Abstract
export async function generateAbstractSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Abstract');
  setColumnWidths(ws, [8, 52, 12, 16, 16, 18]);
  setCellValue(ws, 1, 1, 'DETAILED ABSTRACT OF COST');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const estimate = estimateOrReview(input);
  if (!estimate) return missing(ws);
  addTableHeader(ws, 3, ['Item', 'Description', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)']);
  estimate.boq.forEach((item, index) => {
    addTableRow(ws, 4 + index, [
      item.itemNo,
      item.description,
      item.unit,
      item.quantity,
      item.rate,
      item.amount,
    ]);
  });
  const row = 5 + estimate.boq.length;
  setCellValue(ws, row, 5, 'SUBTOTAL');
  setCellValue(ws, row, 6, estimate.cost.subtotal);
  setCellValue(ws, row + 1, 5, 'GST');
  setCellValue(ws, row + 1, 6, estimate.cost.gst);
  setCellValue(ws, row + 2, 5, 'GRAND TOTAL');
  setCellValue(ws, row + 2, 6, estimate.cost.total);
}

// Sheet 46: Bridge measurements
export async function generateBridgeMeasurementsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Bridge measurements');
  setColumnWidths(ws, [8, 38, 14, 14, 14, 10, 18]);
  setCellValue(ws, 1, 1, 'BRIDGE MEASUREMENTS');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = input.pier;
  const type1 = input.abutmentType1;
  if (!pier || !type1) return missing(ws);
  addTableHeader(ws, 3, ['Item', 'Description', 'L (m)', 'B (m)', 'H (m)', 'Nos', 'Quantity']);
  const rows = [
    ['1', 'Pier footing', pier.footing.length, pier.footing.width, pier.footing.thickness, input.numberOfPiers, pier.footing.length * pier.footing.width * pier.footing.thickness * input.numberOfPiers],
    ['2', 'Pier body', pier.geometry.length, pier.geometry.width, pier.geometry.depth, input.numberOfPiers, pier.geometry.length * pier.geometry.width * pier.geometry.depth * input.numberOfPiers],
    ['3', 'Pier cap', pier.pierCap.length, pier.pierCap.width, pier.pierCap.thickness, input.numberOfPiers, pier.pierCap.length * pier.pierCap.width * pier.pierCap.thickness * input.numberOfPiers],
    ['4', 'TYPE1 abutment envelope', type1.geometry.baseLength, type1.geometry.baseWidth, type1.geometry.height, 2, type1.geometry.baseLength * type1.geometry.baseWidth * type1.geometry.height * 2],
  ];
  rows.forEach((row, index) => addTableRow(ws, 4 + index, row));
  const total = rows.reduce((sum, row) => sum + Number(row[6]), 0);
  setCellValue(ws, 9, 6, 'TOTAL');
  setCellValue(ws, 9, 7, total);
}

/**
 * Sheets 29-40: C1 Abutment.
 *
 * The historical function name is retained for API compatibility, but these
 * are now result-backed sheets, not placeholders.
 */
export async function generateC1AbutmentPlaceholderSheets(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const result = c1(input);
  const names = [
    'INSERT C1-ABUT',
    'C1-AbutMENT Drawing',
    'C1-STABILITY CHECK ABUTMENT',
    'C1-ABUTMENT FOOTING DESIGN',
    'C1-Abut Footing STRESS DIAGRAM',
    'CAN-RETURN FOOTING DESIGN',
    'STEEL IN CANT-ABUTMENT',
    'STEEL IN CANT-RETURNS',
    'C1-Abutment Cap',
    'C1-DIRT WALL REINFORCEMENT',
    'C1-DIRT DirectLoad_BM',
    'C1-DIRT LL_BM',
  ];
  names.forEach((name, index) => {
    const ws = workbook.addWorksheet(name);
    setColumnWidths(ws, [6, 42, 18, 18, 18, 16]);
    setCellValue(ws, 1, 1, name);
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    if (!result) return missing(ws);
    if (index === 0 || index === 1) {
      setCellValue(ws, 3, 1, 'Height');
      setCellValue(ws, 3, 2, result.geometry.height);
      setCellValue(ws, 3, 3, 'm');
      setCellValue(ws, 4, 1, 'Base envelope');
      setCellValue(ws, 4, 2, `${result.geometry.baseLength} m × ${result.geometry.baseWidth} m`);
    } else if (index === 2 || index === 4) {
      addTableHeader(ws, 3, ['Case', 'Description', 'Sliding FOS', 'Overturning FOS', 'Bearing FOS', 'Status']);
      result.loadCases.forEach((loadCase, caseIndex) => {
        addTableRow(ws, 4 + caseIndex, [
          loadCase.caseNumber,
          loadCase.description,
          loadCase.slidingFOS,
          loadCase.overturningFOS,
          loadCase.bearingFOS,
          loadCase.status,
        ]);
      });
    } else if (index === 3 || index === 5) {
      setCellValue(ws, 3, 1, 'Base width');
      setCellValue(ws, 3, 2, result.geometry.baseWidth);
      setCellValue(ws, 3, 3, 'm');
      setCellValue(ws, 4, 1, 'Base length');
      setCellValue(ws, 4, 2, result.geometry.baseLength);
      setCellValue(ws, 5, 1, 'Reinforcement');
      setCellValue(ws, 5, 2, steelText(result.reinforcement.footing));
    } else if (index === 6 || index === 7 || index === 8 || index === 9) {
      setCellValue(ws, 3, 1, 'Reinforcement');
      setCellValue(ws, 3, 2, steelText(result.reinforcement.abutmentBody));
      setCellValue(ws, 4, 1, 'Active earth pressure');
      setCellValue(ws, 4, 2, result.earthPressure.pa);
      setCellValue(ws, 4, 3, 'kN');
    } else {
      setCellValue(ws, 3, 1, 'Calculated live load');
      setCellValue(ws, 3, 2, result.loads.liveLoad);
      setCellValue(ws, 3, 3, 'kN');
      setCellValue(ws, 4, 1, 'Screening moment');
      setCellValue(ws, 4, 2, result.loads.liveLoad * result.geometry.height / 3);
      setCellValue(ws, 4, 3, 'kN-m');
      setCellValue(ws, 6, 1, 'Detailed C1 dirt-wall load placement requires engineering review.');
    }
  });
}
