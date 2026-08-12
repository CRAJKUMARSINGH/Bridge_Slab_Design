/**
 * Sheet 9: STABILITY CHECK FOR PIER
 * Full 5-case stability analysis — all values from design engine.
 * Columns: Description | DL | LL | Buoyancy | Horizontal | Moment | Sliding FOS | OT FOS | Bearing FOS | Status
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import {
  setColumnWidths, setCellValue, setCellFormula,
  addTitle, addProjectHeader, styleHeader, addTableHeader, addTableRow,
  addSectionDivider, COLORS, BORDERS,
} from '../utils';

// ── Helpers ────────────────────────────────────────────────────────────────

function r3(v: number | undefined): number { return parseFloat((v ?? 0).toFixed(3)); }
function safe(v: number | undefined, thr: number): string { return (v ?? 0) >= thr ? 'SAFE' : 'CHECK'; }

function writeCaseBlock(
  ws: ExcelJS.Worksheet,
  startRow: number,
  caseNum: number,
  description: string,
  input: EnhancedProjectInput,
): number {
  const pier = input.pier;
  const lc   = pier?.loadCases?.[caseNum - 1];
  const hyd  = input.hydraulics;
  let row    = startRow;

  // ── Case header ──────────────────────────────────────────────────────────
  styleHeader(ws, row, `CASE ${caseNum}: ${description.toUpperCase()}`, 1, 17);
  ws.getRow(row).height = 22;
  row++;

  // ── Sub-section A: Dead Load ─────────────────────────────────────────────
  setCellValue(ws, row, 1, 'A'); ws.getCell(row, 1).font = { bold: true };
  setCellValue(ws, row, 2, 'DEAD LOAD CALCULATION'); ws.getCell(row, 2).font = { bold: true };
  row++;

  const dlHeaders = ['Description', '', 'Load (kN)', '', 'Lever Arm (m)', '', 'Moment (kN·m)'];
  dlHeaders.forEach((h, i) => {
    const cell = ws.getCell(row, 2 + i);
    cell.value = h; cell.font = { bold: true };
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GRAY } };
  });
  row++;

  const pG   = pier?.geometry;
  const rho  = 25;                    // kN/m³ concrete unit weight
  const capV = (pG?.length ?? 0 + 0.5) * (pG?.width ?? 0 + 0.5) * (pier?.pierCap?.thickness ?? 0.8);
  const bdyV = (pG?.length ?? 0) * (pG?.width ?? 0) * (pG?.depth ?? 0);
  const ftgV = (pier?.footing?.length ?? 0) * (pier?.footing?.width ?? 0) * (pier?.footing?.thickness ?? 1.0);

  const dlItems = [
    { desc: 'Superstructure DL', load: r3(pier?.loads?.deadLoad), la: 0 },
    { desc: 'Pier Cap',          load: r3(capV * rho),             la: 0 },
    { desc: 'Pier Body',         load: r3(bdyV * rho),             la: 0 },
    { desc: 'Footing',           load: r3(ftgV * rho),             la: 0 },
    { desc: 'Buoyancy (upward)', load: -r3((lc?.buoyancyFactor ?? 0) * (pier?.loads?.buoyancy ?? 0)), la: 0 },
  ];

  dlItems.forEach(item => {
    setCellValue(ws, row, 2, item.desc);
    setCellFormula(ws, row, 4, `${item.load}`, item.load);   // Load
    setCellFormula(ws, row, 6, `${item.la}`, item.la);        // LA
    setCellFormula(ws, row, 8, `${item.load * item.la}`, item.load * item.la); // Moment
    row++;
  });

  const totalDL   = dlItems.reduce((s, x) => s + x.load, 0);
  setCellValue(ws, row, 2, 'TOTAL DEAD LOAD');
  ws.getCell(row, 2).font = { bold: true };
  setCellFormula(ws, row, 4, `${r3(totalDL)}`, r3(totalDL));
  row += 2;

  // ── Sub-section B: Live Load ──────────────────────────────────────────────
  setCellValue(ws, row, 1, 'B'); ws.getCell(row, 1).font = { bold: true };
  setCellValue(ws, row, 2, 'LIVE LOAD CALCULATION'); ws.getCell(row, 2).font = { bold: true };
  row++;

  const llFactor = lc?.liveLoadFactor ?? 0;
  const llVal    = r3(llFactor * (pier?.loads?.liveLoad ?? 0));
  setCellValue(ws, row, 2, 'IRC Class 70R / AA Live Load (factored)');
  setCellFormula(ws, row, 4, `${llVal}`, llVal);
  setCellValue(ws, row, 5, 'kN');
  row++;
  setCellValue(ws, row, 2, `Live Load Factor = ${llFactor}`);
  row += 2;

  // ── Sub-section C: Horizontal Forces ─────────────────────────────────────
  setCellValue(ws, row, 1, 'C'); ws.getCell(row, 1).font = { bold: true };
  setCellValue(ws, row, 2, 'HORIZONTAL FORCES'); ws.getCell(row, 2).font = { bold: true };
  row++;

  const drag  = r3(pier?.loads?.dragForce ?? 0);
  const hydro = r3(pier?.loads?.hydrostaticForce ?? 0);
  const wind  = r3((pier?.loads?.windForce ?? 0) * (lc?.windLoadFactor ?? 0));
  const totalH = r3(lc?.horizontalForce ?? drag + hydro);

  const hItems = [
    { desc: 'Drag Force',           val: drag },
    { desc: 'Hydrostatic Pressure', val: hydro },
    { desc: 'Wind Force (factored)',val: wind },
  ];
  hItems.forEach(h => {
    setCellValue(ws, row, 2, h.desc);
    setCellFormula(ws, row, 4, `${h.val}`, h.val);
    setCellValue(ws, row, 5, 'kN');
    row++;
  });
  setCellValue(ws, row, 2, 'TOTAL HORIZONTAL FORCE');
  ws.getCell(row, 2).font = { bold: true };
  setCellFormula(ws, row, 4, `${totalH}`, totalH);
  row += 2;

  // ── Sub-section D: Stability Analysis ────────────────────────────────────
  setCellValue(ws, row, 1, 'D'); ws.getCell(row, 1).font = { bold: true };
  setCellValue(ws, row, 2, 'STABILITY ANALYSIS'); ws.getCell(row, 2).font = { bold: true };
  row++;

  const Vf     = r3(lc?.verticalForce   ?? totalDL + llVal);
  const Hf     = r3(lc?.horizontalForce ?? totalH);
  const Mf     = r3(lc?.moment ?? 0);
  const slidFOS = r3(lc?.slidingFOS    ?? 0);
  const otFOS   = r3(lc?.overturningFOS ?? 0);
  const berFOS  = r3(lc?.bearingFOS    ?? 0);
  const BL      = pier?.footing?.length ?? 1;
  const BW      = pier?.footing?.width  ?? 1;
  const sbc     = input.sbc;

  const stabilityRows = [
    ['Net Vertical Force P',          `${Vf}`, Vf,  'kN'],
    ['Horizontal Force H',            `${Hf}`, Hf,  'kN'],
    ['Overturning Moment M',          `${Mf}`, Mf,  'kN·m'],
    ['Footing Length BL',             `${BL}`, BL,  'm'],
    ['Footing Width BW',              `${BW}`, BW,  'm'],
    ['SBC of Soil',                   `${sbc}`,sbc, 'kPa'],
    ['Resisting Moment Mr = P × BL/2',`${r3(Vf * BL / 2)}`, r3(Vf * BL / 2), 'kN·m'],
    ['FOS Overturning (≥ 1.8)',       `${otFOS}`, otFOS, safe(lc?.overturningFOS, 1.8)],
    ['Resisting Force Fr = μP (μ=0.5)',`${r3(0.5 * Vf)}`, r3(0.5 * Vf), 'kN'],
    ['FOS Sliding (≥ 1.5)',           `${slidFOS}`, slidFOS, safe(lc?.slidingFOS, 1.5)],
    ['Base Pressure q = P/(BL×BW)',   `${r3(Vf / (BL * BW))}`, r3(Vf / (BL * BW)), 'kPa'],
    ['FOS Bearing (≥ 2.5)',           `${berFOS}`, berFOS, safe(lc?.bearingFOS, 2.5)],
  ];

  stabilityRows.forEach(([lbl, fml, res, unit]) => {
    setCellValue(ws, row, 2, lbl);
    setCellFormula(ws, row, 4, fml as string, res as number);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  // ── Status banner ────────────────────────────────────────────────────────
  row++;
  const overallStatus = lc?.status ?? 'CHECK';
  const cell = ws.getCell(row, 2);
  cell.value = `▶ CASE ${caseNum} OVERALL STATUS: ${overallStatus}`;
  cell.font  = { bold: true, size: 12, color: { argb: overallStatus === 'SAFE' ? 'FF1A7A3A' : 'FFB20000' } };
  ws.mergeCells(row, 2, row, 12);
  row += 3;

  return row;
}

// ── Main generator ─────────────────────────────────────────────────────────

export async function generateStabilityCheckPierSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws  = workbook.addWorksheet('STABILITY CHECK FOR PIER');
  const pier = input.pier;

  // 17 columns matching original FINAL_RESULT.xls layout
  setColumnWidths(ws, [4, 38, 4, 12, 6, 12, 6, 12, 6, 12, 6, 12, 6, 12, 6, 12, 6]);

  let row = 1;

  // ── Master title ────────────────────────────────────────────────────────
  styleHeader(ws, row, 'DESIGN OF PIER AND CHECK FOR STABILITY — SUBMERSIBLE BRIDGE', 1, 17);
  ws.getRow(row).height = 28;
  row++;
  setCellValue(ws, row, 1, `Name Of Work :- ${input.projectName}`);
  ws.mergeCells(row, 1, row, 17);
  row += 2;

  // ── Design data block ────────────────────────────────────────────────────
  addSectionDivider(ws, row, 'DESIGN DATA');
  row++;

  const designData = [
    ['Effective Span',                  pier?.geometry?.spacing        ?? input.spanLength,  'm'],
    ['Span c/c of Piers',               pier?.geometry?.spacing        ?? input.spanLength,  'm'],
    ['Pier Width (across flow)',         pier?.geometry?.width          ?? input.pierWidth,   'm'],
    ['Pier Length (along bridge)',       pier?.geometry?.length         ?? input.pierLength,  'm'],
    ['Pier Depth (bed to cap soffit)',   pier?.geometry?.depth          ?? input.pierDepth,   'm'],
    ['Footing Length',                   pier?.footing?.length          ?? input.pierBaseLength, 'm'],
    ['Footing Width',                    pier?.footing?.width           ?? input.pierBaseWidth,  'm'],
    ['Footing Thickness',                pier?.footing?.thickness       ?? 1.0,               'm'],
    ['HFL',                              input.hfl,                                            'm MSL'],
    ['Design Water Level (HFL+Afflux)', input.hydraulics?.designWaterLevel ?? input.hfl,      'm MSL'],
    ['Bed Level',                        input.bedLevel,                                       'm MSL'],
    ['Foundation Level',                 input.foundationLevel,                                'm MSL'],
    ['Design Discharge Q',               input.hydraulics?.discharge    ?? input.discharge,    'm³/s'],
    ['Velocity V',                       input.hydraulics?.velocity     ?? 0,                  'm/s'],
    ['Drag Coefficient Cd',              0.66,                                                 '—'],
    ['Safe Bearing Capacity SBC',        input.sbc,                                            'kPa'],
    ['Friction Coefficient μ',           0.5,                                                  '—'],
    ['Concrete Unit Weight',             25,                                                   'kN/m³'],
    ['Concrete Grade',                   input.concreteGrade,                                  ''],
    ['Steel Grade',                      input.steelGrade,                                     ''],
  ];

  designData.forEach(([lbl, val, unit]) => {
    setCellValue(ws, row, 2, lbl);
    setCellValue(ws, row, 4, val as string | number);
    setCellValue(ws, row, 5, unit);
    row++;
  });
  row += 2;

  // ── Load combinations summary table ──────────────────────────────────────
  addSectionDivider(ws, row, 'LOAD COMBINATION SUMMARY — ALL 5 CASES');
  row++;

  addTableHeader(ws, row, [
    'Case', 'Description', 'DL Factor', 'LL Factor', 'Wind Factor', 'Buoy Factor',
    'Vert. Force (kN)', 'Horiz. Force (kN)', 'Moment (kN·m)',
    'FOS Sliding', 'FOS O/T', 'FOS Bearing', 'Status',
  ]);
  row++;

  (pier?.loadCases ?? []).forEach(lc => {
    const cells = [
      lc.caseNumber, lc.description,
      lc.deadLoadFactor, lc.liveLoadFactor, lc.windLoadFactor, lc.buoyancyFactor,
      r3(lc.verticalForce), r3(lc.horizontalForce), r3(lc.moment),
      r3(lc.slidingFOS), r3(lc.overturningFOS), r3(lc.bearingFOS),
      lc.status,
    ];
    addTableRow(ws, row, cells);
    // Colour status cell
    const statusCell = ws.getCell(row, 13);
    statusCell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: lc.status === 'SAFE' ? 'FFCCFFCC' : 'FFFFCCCC' },
    };
    row++;
  });
  row += 2;

  // ── Detailed workings for each case ──────────────────────────────────────
  const caseNames = [
    'Service Condition',
    'Construction Stage',
    'Flood Condition (HFL)',
    'Seismic Condition',
    'Ultimate Limit State',
  ];

  for (let c = 0; c < 5; c++) {
    row = writeCaseBlock(ws, row, c + 1, caseNames[c], input);
  }

  // ── Code references ───────────────────────────────────────────────────────
  row++;
  addSectionDivider(ws, row, 'CODE REFERENCES');
  row++;
  [
    'IRC:6-2017 — Section II: Loads and Stresses — partial load factors for 5 cases',
    'IRC:78-2014 — Foundation and Substructure — stability check criteria',
    'FOS Sliding ≥ 1.5 | FOS Overturning ≥ 1.8 | FOS Bearing ≥ 2.5 (service)',
    'IRC:112-2015 — Concrete Bridge Code — material and resistance factors',
    'Drag coefficient Cd = 0.66 for rectangular pier section (IRC:6 Cl. 213)',
    'Buoyancy = 9.81 × submerged volume (IRC:6 Cl. 214)',
  ].forEach(line => {
    setCellValue(ws, row, 2, line);
    ws.getCell(row, 2).font = { italic: true, size: 9 };
    ws.mergeCells(row, 2, row, 17);
    row++;
  });
}
