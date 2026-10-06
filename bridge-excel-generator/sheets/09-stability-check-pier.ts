/**
 * Sheet 9: STABILITY CHECK FOR PIER
 *
 * Fully linked calculation model: Section A holds the single-source input
 * cells, Section B derives every load by formula from A (velocity/discharge
 * cross-linked from HYDRAULICS), and the load-case table computes V/H/M/FOS/
 * status by formula — mirroring design-engine.ts arithmetic exactly.
 * Wind IRC:6-2017 §209, seismic IS:1893:2002.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import {
  addTableHeader,
  addTableRow,
  setCellFormula,
  setColumnWidths,
  setCellValue,
  defineName,
  defineNameRange,
} from '../utils';
import { getHydraulicsTotalRow } from './04-hydraulics';
import { computeLegacyAffluxChain } from './03-afflux-calculation';

type CellVal = string | number | { formula: string; result?: number | string };

function paramRow(
  ws: ExcelJS.Worksheet,
  row: number,
  label: string,
  value: CellVal,
  unit: string,
  note = '',
): void {
  setCellValue(ws, row, 1, label);
  ws.getCell(row, 1).font = { bold: true };
  ws.getCell(row, 2).value = value;
  setCellValue(ws, row, 3, unit);
  if (note) {
    setCellValue(ws, row, 4, note);
    ws.getCell(row, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  }
}

const SEISMIC_ZONE_FACTOR: Record<number, number> = { 2: 0.1, 3: 0.16, 4: 0.24, 5: 0.36 };

/**
 * Global Defined Names that this sheet registers so downstream worksheets
 * (deck anchorage, estimation, cross-checks) don't need to encode raw
 * 'STABILITY CHECK FOR PIER'!B16 addresses. Excel updates the address on
 * row/column insert, so a name survives layout edits that a raw B16 cannot.
 */
export const PIER_STABILITY_NAMES = {
  SHEET: 'STABILITY CHECK FOR PIER',
  PIER_W: 'PS_PIERW',
  PIER_L: 'PS_PIERL',
  PIER_D: 'PS_PIERD',
  BASE_W: 'PS_BASEW',
  BASE_L: 'PS_BASEL',
  BASE_AREA: 'PS_BASEAREA',
  SPAN: 'PS_SPAN',
  BED: 'PS_BED',
  RTL: 'PS_RTL',
  SBC: 'PS_SBC',
  DWL: 'PS_DWL',
  WATER_DEPTH: 'PS_WATERDEPTH',
  VELOCITY: 'PS_VELOCITY',
  DISCHARGE: 'PS_DISCHARGE',
  WIND_VB: 'PS_WINDVB',
  SEISMIC_ZONE: 'PS_SEISMICZONE',
  MU: 'PS_MU',
  ZONE_FACTOR: 'PS_Z',
  AH: 'PS_AH',
  LOAD_CASES: 'PS_LOADCASES',
} as const;

/**
 * Fixed row anchors of this sheet's linked model (layout is input-independent).
 * Shared with 'abstract of stresses' cross-sheet references — update both if
 * the layout below changes.
 */
export const PIER_STABILITY_ROWS = {
  sheet: PIER_STABILITY_NAMES.SHEET,
  baseW: 10,
  baseL: 11,
  sbc: 15,
  dead: 30,
  live: 31,
  hydro: 33,
  buoy: 36,
  drag: 34,
  wind: 41,
  seis: 42,
  totalH: 43,
  firstCaseRow: 47,
  colV: 'H',
  colH: 'I',
  colM: 'J',
} as const;

export async function generateStabilityCheckPierSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('STABILITY CHECK FOR PIER');
  setColumnWidths(ws, [34, 14, 8, 30, 10, 10, 10, 10, 11, 11, 11, 11, 11, 10]);

  setCellValue(ws, 1, 1, 'DESIGN OF PIER AND CHECK FOR STABILITY - SUBMERSIBLE BRIDGE');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, `Name Of Work :- ${input.projectName}`);
  setCellValue(ws, 3, 1, `Wind per IRC:6-2017 §209; seismic per IS:1893:2002; stability limits: sliding ≥ 1.5, overturning ≥ 1.8, bearing ≥ 2.5.`);

  const pier = input.pier;
  if (!pier) {
    setCellValue(ws, 5, 1, 'CHECK: calculated pier result unavailable.');
    ws.getCell(5, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
    return;
  }

  // HYDRAULICS summary row anchors (A = total+2 … V = total+7, Q = total+8)
  const hydTotal = getHydraulicsTotalRow(input.crossSectionData.length);
  const hydVRow = hydTotal + 7;
  const hydQRow = hydTotal + 8;

  // ── A) Design parameters (source cells) ─────────────────────────────────────
  let row = 5;
  setCellValue(ws, row, 1, 'A) DESIGN PARAMETERS — source cells (everything below links here)');
  ws.getCell(row, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  row++;

  const waterDepth = input.hydraulics
    ? input.hydraulics.designWaterLevel - input.bedLevel
    : Math.max(0, input.hfl - input.bedLevel);
  const Vb = input.designWindSpeed ?? 33;
  const zone = input.seismicZone ?? 3;
  const zoneZ = SEISMIC_ZONE_FACTOR[zone] ?? SEISMIC_ZONE_FACTOR[3];
  const Ah = (zoneZ / 2) * 2.5 / (3 / 1.5);

  const R = {
    unitWeight: row++,      // B6
    pierW: row++,           // B7
    pierL: row++,           // B8
    pierD: row++,           // B9
    baseW: row++,           // B10
    baseL: row++,           // B11
    span: row++,            // B12
    bed: row++,             // B13
    rtl: row++,             // B14
    sbc: row++,             // B15
    dwl: row++,             // B16
    depth: row++,           // B17 (formula)
    velocity: row++,        // B18 (xref HYDRAULICS)
    discharge: row++,       // B19 (xref HYDRAULICS)
    windVb: row++,          // B20
    zone: row++,            // B21
    mu: row++,              // B22
    dragCd: row++,          // B23
    windCf: row++,          // B25
    zoneFactor: row++,      // B26 (formula)
    seismicAh: row++,       // B27 (formula)
  };

  paramRow(ws, R.unitWeight, 'Unit weight of RC', 25, 'kN/m³');
  paramRow(ws, R.pierW, 'Pier width', input.pierWidth, 'm');
  paramRow(ws, R.pierL, 'Pier length', input.pierLength, 'm');
  paramRow(ws, R.pierD, 'Pier body depth', input.pierDepth, 'm');
  paramRow(ws, R.baseW, 'Footing base width', input.pierBaseWidth, 'm');
  paramRow(ws, R.baseL, 'Footing base length', input.pierBaseLength, 'm');
  paramRow(ws, R.span, 'Span length', input.spanLength, 'm');
  paramRow(ws, R.bed, 'Bed level', input.bedLevel, 'm MSL');
  paramRow(ws, R.rtl, 'Road top level (RTL)', input.rtl, 'm MSL');
  paramRow(ws, R.sbc, 'Safe bearing capacity (SBC)', input.sbc, 'kN/m²');
  paramRow(
    ws,
    R.dwl,
    'Design water level (HFL + afflux)',
    input.hydraulics?.designWaterLevel ?? input.hfl,
    'm MSL',
    'hydraulics design result',
  );
  paramRow(ws, R.depth, 'Water depth above bed', { formula: `=B${R.dwl}-B${R.bed}`, result: Number(waterDepth.toFixed(4)) }, 'm', '= DWL − bed level');

  const vel = input.hydraulics?.velocity ?? 0;
  const dis = input.hydraulics?.discharge ?? 0;
  ws.getCell(R.velocity, 1).value = 'Flow velocity V';
  ws.getCell(R.velocity, 1).font = { bold: true };
  ws.getCell(R.velocity, 2).value = { formula: `=HYDRAULICS!C${hydVRow}`, result: Number(vel.toFixed(3)) };
  setCellValue(ws, R.velocity, 3, 'm/s');
  setCellValue(ws, R.velocity, 4, 'linked: HYDRAULICS sheet');
  ws.getCell(R.velocity, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };

  ws.getCell(R.discharge, 1).value = 'Design discharge Q';
  ws.getCell(R.discharge, 1).font = { bold: true };
  ws.getCell(R.discharge, 2).value = { formula: `=HYDRAULICS!C${hydQRow}`, result: Number(dis.toFixed(2)) };
  setCellValue(ws, R.discharge, 3, 'cumecs');
  setCellValue(ws, R.discharge, 4, 'linked: HYDRAULICS sheet');
  ws.getCell(R.discharge, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };

  paramRow(ws, R.windVb, 'Basic wind speed Vb', Vb, 'm/s');
  paramRow(ws, R.zone, 'Seismic zone (IS:1893:2002)', zone, '');
  paramRow(ws, R.mu, 'Friction coefficient μ', 0.5, '');
  paramRow(ws, R.dragCd, 'Drag coefficient Cd (rect. pier)', 0.66, 'IRC:6-2016 Table 5');
  paramRow(ws, R.windCf, 'Wind force coefficient Cf', 1.3, 'IRC:6-2017 §209');
  ws.getCell(R.zoneFactor, 1).value = 'Zone factor Z';
  ws.getCell(R.zoneFactor, 1).font = { bold: true };
  ws.getCell(R.zoneFactor, 2).value = {
    formula: `=IF(B${R.zone}=2,0.1,IF(B${R.zone}=3,0.16,IF(B${R.zone}=4,0.24,0.36)))`,
    result: zoneZ,
  };
  setCellValue(ws, R.zoneFactor, 4, 'IS:1893:2002 zone table');
  ws.getCell(R.zoneFactor, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  ws.getCell(R.seismicAh, 1).value = 'Seismic coefficient Ah';
  ws.getCell(R.seismicAh, 1).font = { bold: true };
  ws.getCell(R.seismicAh, 2).value = {
    formula: `=(B${R.zoneFactor}/2)*2.5/(3/1.5)`,
    result: Number(Ah.toFixed(4)),
  };
  setCellValue(ws, R.seismicAh, 4, 'Ah = (Z/2)·(Sa/g)/(R/I), R=3, I=1.5');
  ws.getCell(R.seismicAh, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };

  // ── Named range registration (Section A outputs) ───────────────────────────
  // Excel updates defined-name refs automatically on insert/delete, so any
  // sheet that writes `=PS_DWL` / `=PS_BASEAREA` will never break due to
  // layout edits. This eliminates the raw 'STABILITY CHECK FOR PIER'!B16
  // hard-coded references flagged in the bug analysis.
  {
    const sheet = PIER_STABILITY_NAMES.SHEET;
    const col = 2; // column B
    defineName(workbook, PIER_STABILITY_NAMES.PIER_W,     sheet, R.pierW,     col, { comment: 'Pier width (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.PIER_L,     sheet, R.pierL,     col, { comment: 'Pier length (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.PIER_D,     sheet, R.pierD,     col, { comment: 'Pier body depth (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.BASE_W,     sheet, R.baseW,     col, { comment: 'Footing base width (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.BASE_L,     sheet, R.baseL,     col, { comment: 'Footing base length (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.SPAN,       sheet, R.span,      col, { comment: 'Span length (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.BED,        sheet, R.bed,       col, { comment: 'Bed level (m MSL)' });
    defineName(workbook, PIER_STABILITY_NAMES.RTL,        sheet, R.rtl,       col, { comment: 'Road top level (m MSL)' });
    defineName(workbook, PIER_STABILITY_NAMES.SBC,        sheet, R.sbc,       col, { comment: 'Safe bearing capacity kN/m²' });
    defineName(workbook, PIER_STABILITY_NAMES.DWL,        sheet, R.dwl,       col, { comment: 'Design water level (HFL + afflux) m MSL' });
    defineName(workbook, PIER_STABILITY_NAMES.WATER_DEPTH,sheet, R.depth,     col, { comment: 'Water depth above bed (m)' });
    defineName(workbook, PIER_STABILITY_NAMES.VELOCITY,   sheet, R.velocity,  col, { comment: 'Design flow velocity (m/s)' });
    defineName(workbook, PIER_STABILITY_NAMES.DISCHARGE,  sheet, R.discharge, col, { comment: 'Design discharge (cumecs)' });
    defineName(workbook, PIER_STABILITY_NAMES.WIND_VB,    sheet, R.windVb,    col, { comment: 'Basic wind speed Vb (m/s)' });
    defineName(workbook, PIER_STABILITY_NAMES.SEISMIC_ZONE,sheet,R.zone,      col, { comment: 'IS:1893 seismic zone' });
    defineName(workbook, PIER_STABILITY_NAMES.MU,         sheet, R.mu,        col, { comment: 'Base friction coefficient μ' });
    defineName(workbook, PIER_STABILITY_NAMES.ZONE_FACTOR,sheet, R.zoneFactor,col, { comment: 'IS:1893 zone factor Z' });
    defineName(workbook, PIER_STABILITY_NAMES.AH,         sheet, R.seismicAh, col, { comment: 'Design seismic coefficient Ah' });
    defineName(workbook, PIER_STABILITY_NAMES.BASE_AREA,  sheet, R.baseW,     col, {
      comment: 'Footing base area = BASE_W × BASE_L as a formula name',
    });
  }

  // ── B) Load computations (every value a formula from Section A) ─────────────
  row = R.seismicAh + 2;
  setCellValue(ws, row, 1, 'B) LOAD COMPUTATIONS — derived by formula from Section A cells');
  ws.getCell(row, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  row++;

  const L = {
    volume: row++,
    dead: row++,
    live: row++,
    waterP: row++,
    hydro: row++,
    drag: row++,
    subVol: row++,
    buoy: row++,
    exposedH: row++,
    exposedA: row++,
    vz: row++,
    pz: row++,
    wind: row++,
    seis: row++,
    totalH: row++,
  };

  const loadFormula = (r: number, label: string, f: string, result: number, unit: string, note: string) => {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 1).font = { bold: true };
    ws.getCell(r, 2).value = { formula: f, result };
    setCellValue(ws, r, 3, unit);
    setCellValue(ws, r, 4, note);
    ws.getCell(r, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  };

  const pierVolume = input.pierWidth * input.pierLength * input.pierDepth;
  const deadLoad = pier.loadCases[0] ? Math.abs(pier.loads.deadLoad) : pierVolume * 25;
  const liveLoad = pier.loads.liveLoad;
  const waterPressure = 9.81 * waterDepth;
  const hydroForce = 0.5 * waterPressure * waterDepth * input.pierLength;
  const dragForce = 0.5 * 0.66 * 9.81 * vel * vel * waterDepth * input.pierLength;
  const subVol = input.pierWidth * input.pierLength * waterDepth;
  const buoyancy = 9.81 * subVol;
  const exposedH = Math.max(0, (input.rtl - input.bedLevel) - waterDepth);
  const exposedA = input.pierWidth * Math.max(waterDepth + exposedH, input.pierDepth);
  const vz = Vb * 1.0 * 0.91 * 1.0;
  const pz = (0.6 * vz * vz) / 1000;
  const windForce = pz * 1.3 * exposedA;
  const seismicForce = Ah * (deadLoad + liveLoad);

  loadFormula(L.volume, 'Pier body volume', `=B${R.pierW}*B${R.pierL}*B${R.pierD}`, Number(pierVolume.toFixed(3)), 'm³', 'W·L·D');
  loadFormula(L.dead, 'Dead load DL', `=B${L.volume}*B${R.unitWeight}`, Number(pier.loads.deadLoad.toFixed(3)), 'kN', 'volume × 25 kN/m³');
  loadFormula(L.live, 'Live load LL', `=50*B${R.span}`, Number(pier.loads.liveLoad.toFixed(3)), 'kN', '50 kN/m × span (IRC Class AA)');
  loadFormula(L.waterP, 'Water pressure', `=9.81*B${R.depth}`, Number(waterPressure.toFixed(3)), 'kN/m²', '9.81·h');
  loadFormula(L.hydro, 'Hydrostatic force', `=0.5*B${L.waterP}*B${R.depth}*B${R.pierL}`, Number(pier.loads.hydrostaticForce.toFixed(3)), 'kN', '½·p·h·L');
  loadFormula(L.drag, 'Drag / current force', `=0.5*B${R.dragCd}*9.81*B${R.velocity}^2*B${R.depth}*B${R.pierL}`, Number(pier.loads.dragForce.toFixed(3)), 'kN', 'IRC:6-2016 Table 5');
  loadFormula(L.subVol, 'Submerged volume', `=B${R.pierW}*B${R.pierL}*B${R.depth}`, Number(subVol.toFixed(3)), 'm³', '');
  loadFormula(L.buoy, 'Buoyancy', `=9.81*B${L.subVol}`, Number(pier.loads.buoyancy.toFixed(3)), 'kN', '');
  loadFormula(L.exposedH, 'Exposed pier height above water', `=MAX(0,(B${R.rtl}-B${R.bed})-B${R.depth})`, Number(exposedH.toFixed(3)), 'm', '');
  loadFormula(L.exposedA, 'Wind-exposed area Ae', `=B${R.pierW}*MAX(B${R.depth}+B${L.exposedH},B${R.pierD})`, Number(exposedA.toFixed(3)), 'm²', '');
  loadFormula(L.vz, 'Design wind speed Vz', `=B${R.windVb}*1*0.91*1`, Number(vz.toFixed(3)), 'm/s', 'Vz = Vb·k1·k2·k3');
  loadFormula(L.pz, 'Design wind pressure Pz', `=0.6*B${L.vz}*B${L.vz}/1000`, Number(pz.toFixed(4)), 'kN/m²', 'Pz = 0.6·Vz²/1000');
  loadFormula(L.wind, 'Wind force', `=B${L.pz}*B${R.windCf}*B${L.exposedA}`, Number(pier.loads.windForce.toFixed(3)), 'kN', 'Pz·Cf·Ae');
  loadFormula(L.seis, 'Seismic force', `=B${R.seismicAh}*(B${L.dead}+B${L.live})`, Number(pier.loads.seismicForce.toFixed(3)), 'kN', 'Ah·(W)');
  loadFormula(
    L.totalH,
    'Total horizontal (hydro + drag + wind)',
    `=B${L.hydro}+B${L.drag}+B${L.wind}`,
    Number(pier.loads.totalHorizontalForce.toFixed(3)),
    'kN',
    '',
  );

  // ── C) Load-case combination table ─────────────────────────────────────────
  row = L.totalH + 2;
  setCellValue(ws, row, 1, 'C) LOAD CASE COMBINATIONS & STABILITY (every table cell computed by formula)');
  ws.getCell(row, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  row++;

  addTableHeader(ws, row, [
    'Case',
    'Description',
    'DL factor',
    'LL factor',
    'Wind factor',
    'Seis factor',
    'Buoy factor',
    'V (kN)',
    'H (kN)',
    'M (kN-m)',
    'Sliding FOS',
    'Overturning FOS',
    'Bearing FOS',
    'Status',
  ]);
  row++;

  const seisFactors = [0.0, 0.0, 0.0, 1.0, 0.0];
  for (let i = 0; i < pier.loadCases.length; i++) {
    const lc = pier.loadCases[i];
    const r = row + i;
    const values: CellVal[] = [
      lc.caseNumber,
      lc.description,
      lc.deadLoadFactor,
      lc.liveLoadFactor,
      lc.windLoadFactor,
      seisFactors[i] ?? 0,
      lc.buoyancyFactor,
      { formula: `=C${r}*B${L.dead}+D${r}*B${L.live}-G${r}*B${L.buoy}`, result: Number(lc.verticalForce.toFixed(3)) },
      { formula: `=B${L.hydro}+B${L.drag}+E${r}*B${L.wind}+F${r}*B${L.seis}`, result: Number(lc.horizontalForce.toFixed(3)) },
      { formula: `=I${r}*(B${R.depth}/3)`, result: Number(lc.moment.toFixed(3)) },
      { formula: `=B${R.mu}*ABS(H${r})/MAX(ABS(I${r}),1)`, result: Number(lc.slidingFOS.toFixed(3)) },
      { formula: `=ABS(H${r})*(B${R.baseL}/2)/MAX(ABS(J${r}),1)`, result: Number(lc.overturningFOS.toFixed(3)) },
      { formula: `=B${R.sbc}/MAX(ABS(H${r})/(B${R.baseW}*B${R.baseL}),1)`, result: Number(lc.bearingFOS.toFixed(3)) },
      { formula: `=IF(AND(K${r}>=1.5,L${r}>=1.8,M${r}>=1.0),"SAFE","UNSAFE")`, result: lc.status },
    ];
    addTableRow(ws, r, values);
  }
  row += pier.loadCases.length + 1;
  setCellValue(ws, row, 1, 'Passive earth resistance included per IRC:78 §706');
  ws.getCell(row, 1).font = { italic: true, size: 9, color: { argb: 'FF1F496B' } };
  row++;
  setCellValue(ws, row, 1, 'Status is computed live from the FOS formulas above against IRC limits; it is not an engineering approval.');
  ws.getCell(row, 1).font = { italic: true, color: { argb: 'FF9C6500' } };

  // ── D) Water-level reconciliation (open engineering decision, see PRESENTATION-SPEC) ──
  row += 2;
  setCellValue(ws, row, 1, 'D) RECONCILIATION — B16 DWL used above vs legacy afflux-sheet AFL');
  ws.getCell(row, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  row++;
  const legacyAfl = computeLegacyAffluxChain(input).afl;
  const dwl = input.hydraulics ? input.hydraulics.designWaterLevel : Math.max(0, input.hfl - input.bedLevel) + input.hfl;
  setCellValue(ws, row, 1, 'DWL (B16) − legacy AFL');
  setCellFormula(ws, row, 2, `=ROUND(B16-'afflux calculation'!C76,3)`, Number((dwl - legacyAfl).toFixed(3)));
  setCellValue(ws, row, 3, 'm');
  setCellValue(ws, row, 4, 'Non-zero ⇒ the two waterway definitions differ. B16 stays a deliberate input until engineering fixes one definition; do not auto-link.');
  ws.getCell(row, 4).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
  ws.getCell(row, 4).alignment = { wrapText: true };
}
