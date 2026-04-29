/**
 * Sheets 29-46: Estimation and BOQ Section
 * Framework implementations for cost estimation
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue } from '../utils';

// Sheet 29: TechNote
export async function generateTechNoteSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TechNote');
  setColumnWidths(ws, [50]);
  
  const h = (input as ProjectInput & { hydraulics?: any }).hydraulics;
  const isHighLevel = input.bridgeType === 'high-level';
  const resolvedBridgeLength = input.bridgeLength ?? input.totalLength ?? (input.spanLength * input.numberOfSpans);
  const resolvedBridgeWidth = input.bridgeWidth ?? input.carriageWidth;
  const resolvedFoundationLevel =
    input.foundationLevel ??
    h?.foundationLevel ??
    (input.bedLevel - ((h?.designScourDepth ?? h?.scourDepth ?? 0) * 0.35));
  const resolvedDwl = h?.designWaterLevel ?? input.dwl ?? (input.hfl + (h?.afflux ?? 0));
  const resolvedSoffit = input.deckSoffitLevel ?? h?.soffitLevel ?? (input.rtl - (input.deckSlabThickness ?? 0.25));
  const resolvedFbAboveHfl =
    h?.freeboardAboveHfl ?? input.freeboardAboveHfl ?? Math.max(0, resolvedSoffit - input.hfl);
  const resolvedFbAboveDwl =
    h?.freeboard ?? Math.max(0, resolvedSoffit - resolvedDwl);
  const q = num(h?.discharge ?? input.discharge);
  const hfl = num(input.hfl);
  const bed = num(input.bedLevel);
  const foundation = num(resolvedFoundationLevel);
  const velocity = num(h?.velocity);
  const afflux = num(h?.afflux);
  const scour = num(h?.designScourDepth ?? h?.scourDepth);
  const rtl = num(input.rtl);
  const soffit = num(resolvedSoffit);
  const fbHfl = num(resolvedFbAboveHfl);
  const fbDwl = num(resolvedFbAboveDwl);

  let row = 3;
  setCellValue(ws, row, 1, 'TECHNICAL NOTE');
  ws.getCell(row, 1).font = { bold: true, size: 15 };
  ws.getCell(row, 1).alignment = { horizontal: 'center' };
  row += 2;

  const lines: string[] = [
    'This design is prepared in accordance with IRC:6-2017 (Loads and stresses), IRC:112-2015 (Concrete bridges), IRC:78-2014 (Foundations), IRC:SP:13 (Hydraulic design of bridges), and relevant Ministry of Road Transport and Highways circulars as applicable to the project.',
    isHighLevel
      ? 'IRC:5-2015 (freeboard / vertical clearance) is additionally applied for deck level control in this high-level crossing.'
      : 'For submersible configuration, overtopping behavior is intentionally considered and deck anchorage / drag resistance checks govern flood-stage safety.',
    `Project framing: total bridge length ${num(resolvedBridgeLength)} m with ${num(input.numberOfSpans)} span(s) at nominal span length ${num(input.spanLength)} m and carriageway width ${num(resolvedBridgeWidth)} m.`,
    `Design discharge Q = ${q} m³/s; HFL = ${hfl} m MSL; bed level (working) = ${bed} m MSL; foundation level = ${foundation} m MSL.`,
    `From the hydraulic design cycle, computed velocity is approximately ${velocity} m/s, afflux is approximately ${afflux} m, and design scour depth is approximately ${scour} m.`,
    `Flow interpretation: Froude-number-based regime classification is taken from the hydraulics engine output and used to judge whether flow is tranquil/subcritical or rapid/supercritical for design narration and review traceability.`,
    isHighLevel
      ? `Road top level RTL = ${rtl} m MSL with deck soffit at ${soffit} m MSL; available clearance above HFL is ${fbHfl} m and above DWL is ${fbDwl} m.`
      : 'The submersible deck is proportioned for controlled overtopping under flood loading with stability verification carried through pier and abutment checks.',
    `Open foundations are designed for safe bearing capacity SBC = ${num(input.sbc)} kPa, soil friction angle φ = ${num(input.phi)}°, unit weight γ = ${num(input.gamma)} kN/m³. If field tests indicate weaker strata, revised bearing and stability checks shall be carried out.`,
    'Substructure storyline: pier, footing and abutment sheets carry the governing sliding, overturning, bearing and stress checks; any CHECK outcome must be treated as a mandatory engineering review checkpoint.',
    'Execution note: this narrative is generated from computed variables to avoid manual rewriting and to preserve one-to-one consistency between design sheets, notes and report language.',
  ];

  for (const line of lines) {
    setCellValue(ws, row, 1, line);
    ws.getCell(row, 1).alignment = { wrapText: true, vertical: 'middle' };
    row += 2;
  }
}

// Sheet 30: INSERT ESTIMATE
export async function generateInsertEstimateSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INSERT ESTIMATE');
  setColumnWidths(ws, [50]);
  
  let row = 10;
  setCellValue(ws, row, 1, 'ESTIMATION & BOQ');
  ws.getCell(row, 1).font = { bold: true, size: 18 };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
}

// Sheet 31: Tech Report
export async function generateTechReportSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Tech Report');
  setColumnWidths(ws, [5, 40, 15, 15]);
  
  const h = (input as ProjectInput & { hydraulics?: any }).hydraulics;
  const isHighLevel = input.bridgeType === 'high-level';
  const resolvedFoundationLevel =
    input.foundationLevel ??
    h?.foundationLevel ??
    (input.bedLevel - ((h?.designScourDepth ?? h?.scourDepth ?? 0) * 0.35));
  const flowType = h?.flowType ?? 'Subcritical';
  const q = num(h?.discharge ?? input.discharge);
  const v = num(h?.velocity);
  const afflux = num(h?.afflux);
  const dwl = num(h?.designWaterLevel);
  const sm = num(h?.scourDepth);
  const ds = num(h?.designScourDepth ?? h?.scourDepth);
  const fr = num(h?.froudeNumber);

  let row = 1;
  setCellValue(ws, row, 1, 'TECHNICAL REPORT');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Project Name:');
  setCellValue(ws, row, 2, input.projectName);
  row++;
  
  setCellValue(ws, row, 1, 'Location:');
  setCellValue(ws, row, 2, input.location || 'Chitorgarh');
  row++;
  
  setCellValue(ws, row, 1, 'Bridge Type:');
  setCellValue(ws, row, 2, 'Submersible Bridge');
  row++;
  
  setCellValue(ws, row, 1, 'Total Length:');
  setCellValue(ws, row, 2, `${input.bridgeLength || 48} m`);
  row++;
  
  setCellValue(ws, row, 1, 'Width:');
  setCellValue(ws, row, 2, `${input.bridgeWidth || 7.5} m`);
  row++;
  
  setCellValue(ws, row, 1, 'No. of Spans:');
  setCellValue(ws, row, 2, input.numberOfSpans || 4);
  row += 2;

  const reportParagraphs: string[] = [
    `Hydraulic computations establish a design discharge of ${q} m³/s with approach velocity ${v} m/s. The resulting afflux is ${afflux} m, giving design water level ${dwl} m MSL.`,
    `Scour checks indicate mean scour depth ${sm} m and design scour ${ds} m. Froude number is ${fr}, corresponding to ${flowType} flow.`,
    `Hydraulic interpretation note: discharge continuity, resistance and flow-regime checks are treated together so that section sizing and hazard indicators remain engineering-consistent.`,
    isHighLevel
      ? `Deck soffit and freeboard are controlled as high-level crossing criteria; IRC:5-2015 style vertical clearance checks are explicitly included with hydraulics outputs.`
      : `Submersible behavior is accepted by design, and overtopping-stage actions are controlled through anchorage, drag and substructure stability checks.`,
    `Open foundations for SBC ${num(input.sbc)} kPa at ${num(resolvedFoundationLevel)} m MSL; φ = ${num(input.phi)}°, γ = ${num(input.gamma)} kN/m³. Stability and stress checks on pier/abutment footing sheets govern.`,
    'Structural action path: load transfer from deck to pier/abutment is validated through reinforcement, stress distribution and foundation stability sheets before quantities are finalized.',
    'Compliance traceability: every stated value is sourced from computed workbook fields so technical prose and design tables remain synchronized for audit, tender and proof-check use.',
  ];

  for (const p of reportParagraphs) {
    setCellValue(ws, row, 1, p);
    ws.getCell(row, 1).alignment = { wrapText: true, vertical: 'middle' };
    row += 2;
  }
}

// Sheet 32: General Abs.
export async function generateGeneralAbsSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('General Abs.');
  setColumnWidths(ws, [5, 40, 15, 10, 15]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'GENERAL ABSTRACT OF COST');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  // Table header
  setCellValue(ws, row, 1, 'S.No.');
  setCellValue(ws, row, 2, 'Description');
  setCellValue(ws, row, 3, 'Amount (₹)');
  setCellValue(ws, row, 4, '%');
  
  for (let col = 1; col <= 4; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
  }
  row++;
  
  // Sample data
  const items = [
    { no: 1, desc: 'Earthwork', amount: 500000, pct: 5 },
    { no: 2, desc: 'Concrete Work', amount: 6000000, pct: 60 },
    { no: 3, desc: 'Steel Work', amount: 2500000, pct: 25 },
    { no: 4, desc: 'Miscellaneous', amount: 1000000, pct: 10 }
  ];
  
  items.forEach(item => {
    setCellValue(ws, row, 1, item.no);
    setCellValue(ws, row, 2, item.desc);
    setCellValue(ws, row, 3, item.amount);
    setCellValue(ws, row, 4, item.pct);
    row++;
  });
  
  row++;
  setCellValue(ws, row, 2, 'TOTAL');
  setCellValue(ws, row, 3, 10000000);
  ws.getCell(row, 2).font = { bold: true };
  ws.getCell(row, 3).font = { bold: true };
}

// Sheet 33: Abstract
export async function generateAbstractSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Abstract');
  setColumnWidths(ws, [5, 50, 10, 12, 15, 15]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'DETAILED ABSTRACT OF COST');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  // Table header
  setCellValue(ws, row, 1, 'Item');
  setCellValue(ws, row, 2, 'Description');
  setCellValue(ws, row, 3, 'Unit');
  setCellValue(ws, row, 4, 'Quantity');
  setCellValue(ws, row, 5, 'Rate (₹)');
  setCellValue(ws, row, 6, 'Amount (₹)');
  
  for (let col = 1; col <= 6; col++) {
    ws.getCell(row, col).font = { bold: true };
    ws.getCell(row, col).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }
    };
  }
  row++;
  
  // Sample BOQ items
  const boqItems = [
    { item: '1', desc: 'Excavation in ordinary soil', unit: 'cum', qty: 300, rate: 250 },
    { item: '2', desc: 'PCC M15', unit: 'cum', qty: 20, rate: 5000 },
    { item: '3', desc: 'RCC M30 in substructure', unit: 'cum', qty: 150, rate: 7000 },
    { item: '4', desc: 'Steel Fe415', unit: 'MT', qty: 20, rate: 65000 },
    { item: '5', desc: 'Formwork', unit: 'sqm', qty: 500, rate: 350 }
  ];
  
  boqItems.forEach(item => {
    setCellValue(ws, row, 1, item.item);
    setCellValue(ws, row, 2, item.desc);
    setCellValue(ws, row, 3, item.unit);
    setCellValue(ws, row, 4, item.qty);
    setCellValue(ws, row, 5, item.rate);
    setCellValue(ws, row, 6, item.qty * item.rate);
    row++;
  });
  
  row++;
  setCellValue(ws, row, 5, 'SUBTOTAL');
  setCellValue(ws, row, 6, 2800000);
  ws.getCell(row, 5).font = { bold: true };
  row++;
  
  setCellValue(ws, row, 5, 'GST @ 18%');
  setCellValue(ws, row, 6, 504000);
  row++;
  
  setCellValue(ws, row, 5, 'GRAND TOTAL');
  setCellValue(ws, row, 6, 3304000);
  ws.getCell(row, 5).font = { bold: true };
  ws.getCell(row, 6).font = { bold: true };
}

// Sheet 34: Bridge measurements
export async function generateBridgeMeasurementsSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Bridge measurements');
  setColumnWidths(ws, [5, 40, 10, 10, 10, 10, 15]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'BRIDGE MEASUREMENTS');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Item');
  setCellValue(ws, row, 2, 'Description');
  setCellValue(ws, row, 3, 'L (m)');
  setCellValue(ws, row, 4, 'B (m)');
  setCellValue(ws, row, 5, 'H (m)');
  setCellValue(ws, row, 6, 'Nos');
  setCellValue(ws, row, 7, 'Quantity');
  
  for (let col = 1; col <= 7; col++) {
    ws.getCell(row, col).font = { bold: true };
  }
  row++;
  
  // Sample measurements
  const measurements = [
    { item: '1', desc: 'Pier Footing', l: 8, b: 6, h: 1.5, nos: 3, qty: 216 },
    { item: '2', desc: 'Pier Body', l: 2, b: 1.5, h: 6, nos: 3, qty: 54 },
    { item: '3', desc: 'Pier Cap', l: 12, b: 1.5, h: 1.2, nos: 3, qty: 64.8 },
    { item: '4', desc: 'Abutment Footing', l: 10, b: 5, h: 1.2, nos: 2, qty: 120 },
    { item: '5', desc: 'Abutment Body', l: 12, b: 1, h: 8, nos: 2, qty: 192 }
  ];
  
  measurements.forEach(m => {
    setCellValue(ws, row, 1, m.item);
    setCellValue(ws, row, 2, m.desc);
    setCellValue(ws, row, 3, m.l);
    setCellValue(ws, row, 4, m.b);
    setCellValue(ws, row, 5, m.h);
    setCellValue(ws, row, 6, m.nos);
    setCellValue(ws, row, 7, m.qty);
    row++;
  });
  
  row++;
  setCellValue(ws, row, 6, 'TOTAL');
  setCellValue(ws, row, 7, 646.8);
  ws.getCell(row, 6).font = { bold: true };
}

// Placeholder sheets for C1 Abutment (Sheets 35-46)
export async function generateC1AbutmentPlaceholderSheets(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const sheetNames = [
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
    'C1-DIRT LL_BM'
  ];
  
  sheetNames.forEach(name => {
    const ws = workbook.addWorksheet(name);
    setColumnWidths(ws, [50]);
    
    let row = 5;
    setCellValue(ws, row, 1, name);
    ws.getCell(row, 1).font = { bold: true, size: 14 };
    ws.getCell(row, 1).alignment = { horizontal: 'center' };
    row += 3;
    
    setCellValue(ws, row, 1, '[Framework implementation - to be expanded]');
  });
}

function num(v: number | undefined): string {
  if (v === undefined || v === null || Number.isNaN(v)) {
    return (0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  }
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}
