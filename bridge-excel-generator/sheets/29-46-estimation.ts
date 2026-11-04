/**
 * Sheets 29-46: C1 abutment, reporting, and estimation views.
 *
 * Every engineering value in this file is read from EnhancedProjectInput.
 * Missing result objects produce an explicit CHECK row rather than a sample
 * design that could be mistaken for a calculation.
 */

import ExcelJS from 'exceljs';
import type { AbutmentDesignResult, EnhancedProjectInput, EstimationMeasurement, EstimationResult, MeasurementBasis, SteelDetails } from '../types';
import { addTableHeader, addTableRow, setCellFormula, setColumnWidths, setCellValue } from '../utils';
import {
  ABUTMENT_BAND_LENGTH_M,
  ABUTMENT_FOOTING_EXTRA_WIDTH_M,
  APPROACH_LEVELLING_THICKNESS_M,
  APPROACH_SLAB_LENGTH_M,
  APPROACH_SLAB_THICKNESS_M,
  BEARINGS_PER_PIER,
  BLINDING_THICKNESS_M,
  CATS_EYE_SPACING_M,
  EXCAVATION_OVERDIG_M,
  MARKING_LINES,
  MARKING_LINE_WIDTH_M,
  OVERHEAD_RATES,
  PIER_FOOTING_THICKNESS_M,
  RETURN_WALL_THICKNESS_M,
  SOFT_ROCK_BAND_THICKNESS_M,
  WALL_BACKFILL_WIDTH_M,
  WALL_FILTER_THICKNESS_M,
  WEEP_HOLE_SPACING_M,
} from '../../shared/design-engine-types';
import {
  EARTHWORK_RATES,
  RATE_REGISTER_SOURCE,
  ROCK_HEAD_DEPTH_BELOW_BED_M,
  STEEL_VOLUME_PERCENT,
  WEARING_COAT_THICKNESS_M,
} from '../material-rates';

function n(value: number | undefined): number | string {
  return value === undefined || !Number.isFinite(value) ? 'CHECK' : Number(value.toFixed(3));
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function round3(value: number): number {
  return Number(value.toFixed(3));
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
  const L = abstractLayout(estimate.boq.length);
  setCellValue(ws, 3, 1, 'BOQ items');
  setCellValue(ws, 3, 2, estimate.boq.length);
  const summary: Array<[string, number, number]> = [
    ['Subtotal (A)', L.subtotal, estimate.cost.subtotal],
    ['Quality Control @ 1 %', L.qualityControl, estimate.cost.qualityControl],
    ['Contingency provision @ 3 % (nil)', L.contingencyProvision, estimate.cost.contingencyProvision],
    ['Contingencies @ 1.5 %', L.contingencies, estimate.cost.contingencies],
    ['G.Total (B)', L.gTotal, estimate.cost.gTotal],
    ['Prorata Overheads & Profit @ 13 %', L.prorataOverheads, estimate.cost.prorataOverheads],
    ['GRAND TOTAL (₹)', L.grandTotal, estimate.cost.total],
    ['Say (₹ Lakh)', L.lacs, estimate.cost.totalInLacs],
  ];
  summary.forEach(([label, abstractRow, value], index) => {
    const row = 4 + index;
    setCellValue(ws, row, 1, label);
    setCellFormula(ws, row, 2, `='Abstract'!F${abstractRow}`, round2(value));
    setCellValue(ws, row, 3, label.includes('Lakh') ? '₹ Lakh' : '₹');
  });
  const noteRow = 4 + summary.length + 1;
  setCellValue(ws, noteRow, 1, 'Rates are PWD BSR Road 2022 (Rajasthan) as billed in the sanctioned Bedach HL bridge estimate; lines flagged "SSR extension required" use the nearest registered grade.');
  ws.getCell(noteRow, 1).alignment = { wrapText: true };
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

// The engine BOQ carries real items only; the SUBTOTAL row on these sheets is
// the Excel SUM of them.

interface AbstractLayout {
  firstRow: number;
  lastRow: number;
  subtotal: number;
  qualityControl: number;
  contingencyProvision: number;
  contingencies: number;
  gTotal: number;
  prorataOverheads: number;
  grandTotal: number;
  lacs: number;
}

/**
 * Row map of the Abstract sheet: the BOQ items, then the PWD overhead ladder
 * (Quality Control → contingency provision → contingencies → G.Total → prorata
 * overheads & profit) and the rounded lakh figure. Every other estimation sheet
 * retrieves from these rows, so the layout is stated once instead of being
 * re-derived — and re-guessed — per sheet.
 */
/** First row of the Abstract item table; every retrieval offsets from here. */
const ABSTRACT_FIRST_ROW = 4;

function abstractLayout(itemCount: number): AbstractLayout {
  const firstRow = ABSTRACT_FIRST_ROW;
  const lastRow = firstRow + itemCount - 1;
  const subtotal = lastRow + 1;
  return {
    firstRow,
    lastRow,
    subtotal,
    qualityControl: subtotal + 1,
    contingencyProvision: subtotal + 2,
    contingencies: subtotal + 3,
    gTotal: subtotal + 4,
    prorataOverheads: subtotal + 5,
    grandTotal: subtotal + 6,
    lacs: subtotal + 7,
  };
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
  const items = estimate.boq;
  const L = abstractLayout(items.length);
  items.forEach((item, index) => {
    const row = L.firstRow + index;
    addTableRow(ws, row, [
      item.itemNo,
      item.description,
      // Retrieved from the detailed Abstract sheet
      { formula: `='Abstract'!F${row}`, result: round2(item.amount) },
      { formula: `=C${row}/$C${L.subtotal}*100`, result: estimate.cost.subtotal > 0 ? round2(item.amount / estimate.cost.subtotal * 100) : 0 },
    ]);
  });

  setCellValue(ws, L.subtotal, 2, 'SUBTOTAL');
  setCellFormula(ws, L.subtotal, 3, `=SUM(C${L.firstRow}:C${L.lastRow})`, round2(estimate.cost.subtotal));

  const ladder: Array<[string, number, number]> = [
    ['Add: Quality Control @ 1.00 %', L.qualityControl, estimate.cost.qualityControl],
    ['Add: Contingency provision @ 3.00 % (booked nil)', L.contingencyProvision, estimate.cost.contingencyProvision],
    ['Add: Contingencies @ 1.50 %', L.contingencies, estimate.cost.contingencies],
    ['G.TOTAL', L.gTotal, estimate.cost.gTotal],
    ['Add: Prorata Overheads & Profit @ 13.00 %', L.prorataOverheads, estimate.cost.prorataOverheads],
    ['GRAND TOTAL', L.grandTotal, estimate.cost.total],
  ];
  ladder.forEach(([label, abstractRow, value], index) => {
    const row = L.subtotal + 1 + index;
    setCellValue(ws, row, 2, label);
    ws.getCell(row, 2).font = { bold: label.startsWith('G.') || label.startsWith('GRAND') };
    setCellFormula(ws, row, 3, `='Abstract'!F${abstractRow}`, round2(value));
  });
  setCellValue(ws, L.grandTotal + 1, 2, 'SAY (₹ LAKH)');
  setCellFormula(ws, L.grandTotal + 1, 3, `='Abstract'!F${L.lacs}`, round2(estimate.cost.totalInLacs));
}

// Sheet 45: Abstract
export async function generateAbstractSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Abstract');
  setColumnWidths(ws, [8, 58, 10, 15, 16, 18]);
  setCellValue(ws, 1, 1, 'DETAILED ABSTRACT OF COST');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const estimate = estimateOrReview(input);
  if (!estimate) return missing(ws);
  addTableHeader(ws, 3, ['Item', 'Description', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)']);
  const items = estimate.boq;
  const L = abstractLayout(items.length);
  items.forEach((item, index) => {
    const row = L.firstRow + index;
    addTableRow(ws, row, [
      item.itemNo,
      item.description,
      item.unit,
      item.quantity,
      item.rate,
      { formula: `=D${row}*E${row}`, result: round2(item.amount) },
    ]);
  });

  const cost = estimate.cost;
  setCellValue(ws, L.subtotal, 5, 'SUBTOTAL (A)');
  ws.getCell(L.subtotal, 5).font = { bold: true };
  setCellFormula(ws, L.subtotal, 6, `=SUM(F${L.firstRow}:F${L.lastRow})`, round2(cost.subtotal));

  setCellValue(ws, L.qualityControl, 2, `Add: Quality Control @ ${(OVERHEAD_RATES.qualityControl * 100).toFixed(2)} %`);
  setCellFormula(ws, L.qualityControl, 6, `=F${L.subtotal}*${OVERHEAD_RATES.qualityControl}`, round2(cost.qualityControl));

  setCellValue(ws, L.contingencyProvision, 2, `Add: Contingency provision @ ${(OVERHEAD_RATES.contingencyProvision * 100).toFixed(2)} % (booked nil — engineer to direct)`);
  setCellFormula(ws, L.contingencyProvision, 6, '=0', round2(cost.contingencyProvision));

  setCellValue(ws, L.contingencies, 2, `Add: Contingencies @ ${(OVERHEAD_RATES.contingencies * 100).toFixed(2)} %`);
  setCellFormula(ws, L.contingencies, 6, `=F${L.subtotal}*${OVERHEAD_RATES.contingencies}`, round2(cost.contingencies));

  setCellValue(ws, L.gTotal, 2, 'G.TOTAL (B = A + quality control + contingency + contingencies)');
  ws.getCell(L.gTotal, 2).font = { bold: true };
  setCellFormula(
    ws, L.gTotal, 6,
    `=F${L.subtotal}+F${L.qualityControl}+F${L.contingencyProvision}+F${L.contingencies}`,
    round2(cost.gTotal)
  );

  setCellValue(ws, L.prorataOverheads, 2, `Add: Prorata Overheads & Profit @ ${(OVERHEAD_RATES.prorataOverheads * 100).toFixed(2)} %`);
  setCellFormula(ws, L.prorataOverheads, 6, `=F${L.gTotal}*${OVERHEAD_RATES.prorataOverheads}`, round2(cost.prorataOverheads));

  setCellValue(ws, L.grandTotal, 2, 'GRAND TOTAL');
  ws.getCell(L.grandTotal, 2).font = { bold: true, size: 12 };
  setCellFormula(ws, L.grandTotal, 6, `=F${L.gTotal}+F${L.prorataOverheads}`, round2(cost.total));

  setCellValue(ws, L.lacs, 2, 'SAY (₹ Lakh)');
  ws.getCell(L.lacs, 2).font = { bold: true };
  setCellFormula(ws, L.lacs, 6, `=ROUND(F${L.grandTotal}/100000,2)`, round2(cost.totalInLacs));

  // ── Assumption register: the rules behind every quantity on this estimate ───
  let row = L.lacs + 2;
  setCellValue(ws, row, 2, 'ESTIMATION ASSUMPTIONS (change the rule, not the number)');
  ws.getCell(row, 2).font = { bold: true };
  const assumptions: Array<[string, string | number, string]> = [
    ['Rate register', RATE_REGISTER_SOURCE, ''],
    ['Abutment band length billed per abutment', ABUTMENT_BAND_LENGTH_M, 'm'],
    ['Abutment footing widening beyond the stem', ABUTMENT_FOOTING_EXTRA_WIDTH_M, 'm'],
    ['Pier footing thickness', PIER_FOOTING_THICKNESS_M, 'm'],
    ['PCC blinding thickness', BLINDING_THICKNESS_M, 'm'],
    ['Trench over-dig added to (bed − foundation)', EXCAVATION_OVERDIG_M, 'm'],
    ['Rock head assumed below bed where hard rock is reported', ROCK_HEAD_DEPTH_BELOW_BED_M, 'm'],
    ['Soft rock (no blasting) band inside the rock zone', SOFT_ROCK_BAND_THICKNESS_M, 'm'],
    ['Soil band rates up to 3 m / deeper lifts', `${EARTHWORK_RATES.soilUpto3m} / ${EARTHWORK_RATES.soil3to6m}`, '₹/m³'],
    ['Rock band rates soft / blasted hard', `${EARTHWORK_RATES.softRockNoBlasting} / ${EARTHWORK_RATES.hardRockBlasting}`, '₹/m³'],
    ['Steel as % of RCC volume (foundation / sub / super)',
      `${STEEL_VOLUME_PERCENT.foundation} / ${STEEL_VOLUME_PERCENT.substructure} / ${STEEL_VOLUME_PERCENT.superstructure}`, '%'],
    ['Wearing coat thickness billed', WEARING_COAT_THICKNESS_M, 'm'],
    ['Weep hole spacing (horizontal and vertical)', WEEP_HOLE_SPACING_M, 'm'],
    ['Return wall thickness used for weep hole length', RETURN_WALL_THICKNESS_M, 'm'],
    ['Backfill width behind abutment and returns', WALL_BACKFILL_WIDTH_M, 'm'],
    ['Filter medium thickness behind walls', WALL_FILTER_THICKNESS_M, 'm'],
    ['Approach slab length / thickness at each end', `${APPROACH_SLAB_LENGTH_M} / ${APPROACH_SLAB_THICKNESS_M}`, 'm'],
    ['Levelling course thickness below approach slab', APPROACH_LEVELLING_THICKNESS_M, 'm'],
    ['Road marking lines × width', `${MARKING_LINES} × ${MARKING_LINE_WIDTH_M}`, 'm'],
    ['Cat eye spacing along each edge line', CATS_EYE_SPACING_M, 'm'],
    ['Bearings per pier', BEARINGS_PER_PIER, 'nos'],
  ];
  assumptions.forEach(([label, value, unit], index) => {
    const r = row + 1 + index;
    setCellValue(ws, r, 2, label);
    setCellValue(ws, r, 4, value);
    setCellValue(ws, r, 6, unit);
  });
  const noteRow = row + assumptions.length + 2;
  setCellValue(ws, noteRow, 2, 'Earthwork for the approach roadway, river-bed pitching, approach culverts and slope protection are NOT billed here: they need the approach and river-training survey geometry, which the project input does not yet carry.');
  ws.getCell(noteRow, 2).alignment = { wrapText: true };
}

// Sheet 46: Bridge measurements
const BASIS_TEXT: Record<MeasurementBasis, string> = {
  volume: 'Nos × L × B × H',
  plan: 'Nos × L × B',
  count: 'Nos',
  steel: 'Nos × L % × B RCC volume × H kg/m³ ÷ 100 ÷ 1000',
};

/** The billed quantity as Excel arithmetic, so the sheet shows the rule it used. */
function measurementFormula(m: EstimationMeasurement, row: number): string {
  if (m.basis === 'count') return `=E${row}`;
  if (m.basis === 'plan') return `=E${row}*F${row}*G${row}`;
  if (m.basis === 'steel') return `=E${row}*F${row}*G${row}*H${row}/100/1000`;
  return `=E${row}*F${row}*G${row}*H${row}`;
}

function shorten(text: string, max = 96): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()} …`;
}

/**
 * Dims are printed exactly as the engine measured with them — re-rounding here
 * would make the row's own formula disagree with its stored quantity.
 */
function dim(value: number): number | string {
  return value > 0 ? value : '-';
}

export async function generateBridgeMeasurementsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Bridge measurements');
  setColumnWidths(ws, [7, 46, 11, 20, 8, 10, 10, 10, 9, 13, 15]);
  setCellValue(ws, 1, 1, 'BRIDGE MEASUREMENTS — DIMENSIONAL BUILD-UP OF EACH BOQ ITEM');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const estimate = estimateOrReview(input);
  if (!estimate) return missing(ws);
  const measurements = estimate.measurements;
  if (measurements.length === 0) {
    missing(ws, 3);
    return;
  }

  addTableHeader(ws, 3, [
    'Item', 'Particulars', 'BSR code', 'Component', 'Nos',
    'L (m)', 'B (m)', 'H (m)', 'Unit', 'Quantity', 'Rule applied / tie vs Abstract',
  ]);

  const boq = estimate.boq;
  const descByItem = new Map(boq.map((b) => [b.itemNo, b.description]));
  // The Abstract writes its items in BOQ order from ABSTRACT_FIRST_ROW, so the
  // row a tie-check must read is the item's position in that same list.
  const abstractRowByItem = new Map(boq.map((b, i) => [b.itemNo, ABSTRACT_FIRST_ROW + i]));
  const rowsByItem = new Map<string, EstimationMeasurement[]>();
  measurements.forEach((m) => {
    const block = rowsByItem.get(m.item) ?? [];
    block.push(m);
    rowsByItem.set(m.item, block);
  });

  let row = 4;
  let lastSection = '';

  for (const [itemNo, rows] of rowsByItem) {
    if (rows[0].section !== lastSection) {
      lastSection = rows[0].section;
      setCellValue(ws, row, 1, lastSection);
      ws.getCell(row, 1).font = { bold: true };
      ws.mergeCells(row, 1, row, 11);
      row++;
    }

    const particulars = shorten(descByItem.get(itemNo) ?? rows[0].description);
    const firstRow = row;
    rows.forEach((m) => {
      addTableRow(ws, row, [
        m.item,
        particulars,
        m.bsrCode,
        m.description,
        m.nos,
        dim(m.length),
        dim(m.breadth),
        dim(m.height),
        m.unit,
        { formula: measurementFormula(m, row), result: m.quantity },
      ]);
      ws.getCell(row, 2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      ws.getCell(row, 4).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      ws.getCell(row, 11).value = BASIS_TEXT[m.basis];
      ws.getCell(row, 11).font = { size: 8, color: { argb: 'FF666666' } };
      ws.getCell(row, 11).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      row++;
    });

    const total = round3(rows.reduce((sum, m) => sum + m.quantity, 0));
    setCellValue(ws, row, 4, 'Total:-');
    ws.getCell(row, 4).font = { bold: true };
    setCellFormula(ws, row, 10, `=ROUND(SUM(J${firstRow}:J${row - 1}),3)`, total);
    ws.getCell(row, 10).font = { bold: true };
    const billed = boq.find((b) => b.itemNo === itemNo);
    const abstractRow = abstractRowByItem.get(itemNo) ?? ABSTRACT_FIRST_ROW;
    setCellFormula(
      ws, row, 11,
      `=IF(ROUND(J${row}-'Abstract'!D${abstractRow},3)=0,"TIES","CHECK")`,
      round3(billed?.quantity ?? -1) === total ? 'TIES' : 'CHECK'
    );
    row += 2;
  }
}

/**
 * Sheets 29-40: C1 Abutment.
 *
 * Historical export name retained; each sheet now binds a distinct C1 result field.
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
    setCellValue(ws, 2, 1, `Project: ${input.projectName}`);
    if (!result) {
      missing(ws);
      return;
    }

    if (index === 0) {
      setCellValue(ws, 4, 1, 'Cantilever (C1) abutment section');
      setCellValue(ws, 5, 1, 'Height');
      setCellValue(ws, 5, 2, result.geometry.height);
      setCellValue(ws, 5, 3, 'm');
      setCellValue(ws, 6, 1, 'Return wall length');
      setCellValue(ws, 6, 2, result.geometry.returnWallLength);
      setCellValue(ws, 6, 3, 'm');
      return;
    }

    if (index === 1) {
      [
        ['Height', result.geometry.height, 'm'],
        ['Width', result.geometry.width, 'm'],
        ['Depth', result.geometry.depth, 'm'],
        ['Base width', result.geometry.baseWidth, 'm'],
        ['Base length', result.geometry.baseLength, 'm'],
        ['Dirt wall height', result.geometry.dirtWallHeight, 'm'],
        ['Return wall length', result.geometry.returnWallLength, 'm'],
      ].forEach(([label, value, unit], i) => {
        setCellValue(ws, 4 + i, 1, label);
        setCellValue(ws, 4 + i, 2, value);
        setCellValue(ws, 4 + i, 3, unit);
      });
      return;
    }

    if (index === 2) {
      const T1 = `'TYPE1-STABILITY CHECK ABUTMENT'`;
      setCellValue(ws, 3, 1, 'Live-linked: C1 stability mirrors the Type-1 model (same geometry and load scheme); every cell below retrieves from the TYPE1 sheet.');
      ws.getCell(3, 1).alignment = { wrapText: true };
      addTableHeader(ws, 4, ['Case', 'Description', 'Sliding FOS', 'Overturning FOS', 'Bearing FOS', 'Status']);
      result.loadCases.forEach((loadCase, caseIndex) => {
        const src = 21 + caseIndex; // data rows on TYPE1-STABILITY CHECK ABUTMENT
        const c1Row = 5 + caseIndex;
        addTableRow(ws, c1Row, [
          { formula: `=${T1}!A${src}`, result: loadCase.caseNumber },
          { formula: `=${T1}!B${src}`, result: loadCase.description },
          { formula: `=${T1}!F${src}`, result: Number(loadCase.slidingFOS.toFixed(4)) },
          { formula: `=${T1}!G${src}`, result: Number(loadCase.overturningFOS.toFixed(4)) },
          { formula: `=${T1}!H${src}`, result: Number(loadCase.bearingFOS.toFixed(4)) },
          // The factors of safety are retrieved from the shared Type-1 model, but the verdict is
          // derived here from THIS row's own cells. Copying `=${T1}!I{src}` would restate Type-1's
          // word instead of applying the rule at the place the engineer reads it: identical today
          // (verified across all 20 templates), silently wrong the day C1 takes its own geometry.
          {
            formula: `=IF(AND(C${c1Row}>=1.5,D${c1Row}>=1.8,E${c1Row}>=2.5),"SAFE","UNSAFE")`,
            result: loadCase.status,
          },
        ]);
      });
      const r = 6 + result.loadCases.length;
      setCellValue(ws, r, 1, 'Ka');
      setCellFormula(ws, r, 2, `=${T1}!B16`, Number(result.earthPressure.ka.toFixed(4)));
      setCellValue(ws, r + 1, 1, 'Pa');
      setCellFormula(ws, r + 1, 2, `=${T1}!B17`, Number(result.earthPressure.pa.toFixed(3)));
      setCellValue(ws, r + 1, 3, 'kN');
      return;
    }

    if (index === 3) {
      setCellValue(ws, 4, 1, 'Base width');
      setCellValue(ws, 4, 2, result.geometry.baseWidth);
      setCellValue(ws, 4, 3, 'm');
      setCellValue(ws, 5, 1, 'Base length');
      setCellValue(ws, 5, 2, result.geometry.baseLength);
      setCellValue(ws, 5, 3, 'm');
      setCellValue(ws, 6, 1, 'Footing reinforcement');
      setCellValue(ws, 6, 2, steelText(result.reinforcement.footing));
      return;
    }

    if (index === 4) {
      addTableHeader(ws, 4, ['Case', 'Description', 'Derived pressure (kN/m²)', 'SBC (kN/m²)', 'Status']);
      result.loadCases.forEach((loadCase, caseIndex) => {
        const T1 = `'TYPE1-STABILITY CHECK ABUTMENT'`;
        const row = 5 + caseIndex;
        const src = 21 + caseIndex;
        const pressure = loadCase.bearingFOS > 0 ? input.sbc / loadCase.bearingFOS : Number.NaN;
        addTableRow(ws, row, [
          { formula: `=${T1}!A${src}`, result: loadCase.caseNumber },
          { formula: `=${T1}!B${src}`, result: loadCase.description },
          { formula: `=${T1}!C${src}/(${T1}!$B$8*${T1}!$B$9)`, result: Number.isFinite(pressure) ? Number(pressure.toFixed(3)) : 'CHECK' },
          { formula: `=${T1}!$B$12`, result: input.sbc },
          { formula: `=IF(C${row}<=D${row},"SAFE","UNSAFE")`, result: pressure <= input.sbc ? 'SAFE' : 'UNSAFE' },
        ]);
      });
      return;
    }

    if (index === 5) {
      setCellValue(ws, 4, 1, 'Return wall length');
      setCellValue(ws, 4, 2, result.geometry.returnWallLength);
      setCellValue(ws, 4, 3, 'm');
      setCellValue(ws, 5, 1, 'Return footing reinforcement');
      setCellValue(ws, 5, 2, steelText(result.reinforcement.returnWall));
      setCellValue(ws, 6, 1, 'Abutment footing reinforcement');
      setCellValue(ws, 6, 2, steelText(result.reinforcement.footing));
      return;
    }

    if (index === 6) {
      setCellValue(ws, 4, 1, 'Cantilever stem reinforcement');
      setCellValue(ws, 4, 2, steelText(result.reinforcement.abutmentBody));
      setCellValue(ws, 5, 1, 'Active earth force Pa');
      setCellFormula(ws, 5, 2, `='TYPE1-STABILITY CHECK ABUTMENT'!B17`, Number(result.earthPressure.pa.toFixed(3)));
      setCellValue(ws, 5, 3, 'kN');
      return;
    }

    if (index === 7) {
      setCellValue(ws, 4, 1, 'Cantilever return reinforcement');
      setCellValue(ws, 4, 2, steelText(result.reinforcement.returnWall));
      setCellValue(ws, 5, 1, 'Return wall length');
      setCellValue(ws, 5, 2, result.geometry.returnWallLength);
      setCellValue(ws, 5, 3, 'm');
      return;
    }

    if (index === 8) {
      setCellValue(ws, 4, 1, 'Cap reinforcement');
      setCellValue(ws, 4, 2, steelText(result.reinforcement.abutmentCap));
      setCellValue(ws, 5, 1, 'Base length (cap span screening)');
      setCellValue(ws, 5, 2, result.geometry.baseLength);
      setCellValue(ws, 5, 3, 'm');
      return;
    }

    if (index === 9) {
      setCellValue(ws, 4, 1, 'Dirt wall height');
      setCellValue(ws, 4, 2, result.geometry.dirtWallHeight);
      setCellValue(ws, 4, 3, 'm');
      setCellValue(ws, 5, 1, 'Dirt wall reinforcement');
      setCellValue(ws, 5, 2, steelText(result.reinforcement.dirtWall));
      return;
    }

    if (index === 10) {
      const scale = result.geometry.height > 0 ? result.geometry.dirtWallHeight / result.geometry.height : 0;
      setCellValue(ws, 4, 1, 'Scaled active force on dirt wall');
      setCellValue(ws, 4, 2, result.earthPressure.pa * scale);
      setCellValue(ws, 4, 3, 'kN');
      setCellValue(ws, 5, 1, 'Screening moment at H/3');
      setCellValue(ws, 5, 2, result.earthPressure.pa * scale * result.geometry.dirtWallHeight / 3);
      setCellValue(ws, 5, 3, 'kN-m');
      setCellValue(ws, 7, 1, 'Detailed C1 dirt-wall load placement requires engineering review.');
      return;
    }

    setCellValue(ws, 4, 1, 'Calculated live load');
    setCellValue(ws, 4, 2, result.loads.liveLoad);
    setCellValue(ws, 4, 3, 'kN');
    setCellValue(ws, 5, 1, 'Screening live-load moment');
    setCellValue(ws, 5, 2, result.loads.liveLoad * Math.max(result.geometry.dirtWallHeight, 0) / 3);
    setCellValue(ws, 5, 3, 'kN-m');
    setCellValue(ws, 7, 1, 'Detailed C1 live-load placement on dirt wall requires engineering review.');
  });
}
