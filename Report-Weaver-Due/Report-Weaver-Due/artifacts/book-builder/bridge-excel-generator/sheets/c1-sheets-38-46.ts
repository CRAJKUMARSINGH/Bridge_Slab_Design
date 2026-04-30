import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells, COLORS } from '../utils';
import { addSketchPlaceholderBlock } from '../sketch-placeholders';

import { LloadSummaryRefs } from './17-lload';

// ── Sheet 38: C1-ABUTMENT FOOTING DESIGN ─────────────────────────────────────
export async function generateC1FootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  lloadRefs?: LloadSummaryRefs
): Promise<void> {
  const ws = workbook.addWorksheet('C1-ABUTMENT FOOTING DESIGN');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt  = input.abutmentC1;
  const H    = abt?.geometry.height    ?? input.abutmentHeight;
  const t    = abt?.geometry.width     ?? input.abutmentWidth;
  const B    = abt?.geometry.baseWidth ?? (t + 1.5);
  const Lb   = abt?.geometry.baseLength ?? (input.abutmentDepth + 1.0);
  const fy   = input.fy;
  const sbc  = input.sbc;

  const baseSlab  = Math.max(0.8, H * 0.15);
  const cover     = 75;
  const effDepth  = baseSlab * 1000 - cover - 10;
  const heelL     = B * 0.6;
  const toe       = B - heelL - t;

  const V   = abt?.loads.deadLoad ?? (H * t * input.abutmentDepth * 25);
  const Pa  = abt?.loads.earthPressure ?? 0;
  const Mo  = Pa * (H / 3);
  const e   = Mo / Math.max(V, 1);
  const qMax = (V / (B * Lb)) * (1 + 6 * e / B);
  const qMin = (V / (B * Lb)) * (1 - 6 * e / B);
  const Mu   = qMax * heelL * heelL / 2;
  const AstReq = (Mu * 1e6) / (0.87 * fy * 0.9 * effDepth);
  const AstMin = 0.12 * 1000 * baseSlab * 1000 / 100;

  let row = 1;
  setCellValue(ws, row, 1, 'C1 CANTILEVER ABUTMENT — FOOTING DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const sections: [string, string, number, string][] = [
    ['1.',  'Base Width (B)',                    B,                   'm'],
    ['2.',  'Base Length (Lb)',                  Lb,                  'm'],
    ['3.',  'Base Slab Thickness',               +baseSlab.toFixed(3),'m'],
    ['4.',  'Clear Cover',                       cover,               'mm'],
    ['5.',  'Effective Depth (d)',               +effDepth.toFixed(0),'mm'],
    ['6.',  'Heel Length',                       +heelL.toFixed(3),   'm'],
    ['7.',  'Toe Length',                        +toe.toFixed(3),     'm'],
    ['8.',  'Total Vertical Load (V)',           +V.toFixed(1),       'kN/m'],
    ['9.',  'Overturning Moment (Mo)',           +Mo.toFixed(1),      'kN-m/m'],
    ['10.', 'Eccentricity (e)',                  +e.toFixed(3),       'm'],
    ['11.', 'Max Bearing Pressure (qmax)',       +qMax.toFixed(2),    'kN/m²'],
    ['12.', 'Min Bearing Pressure (qmin)',       +qMin.toFixed(2),    'kN/m²'],
    ['13.', 'Allowable Bearing Pressure (SBC)',  sbc,                 'kN/m²'],
    ['14.', 'Design BM at stem face (Mu)',       +Mu.toFixed(2),      'kN-m/m'],
    ['15.', 'Ast Required',                      +AstReq.toFixed(0),  'mm²/m'],
    ['16.', 'Ast Minimum (0.12%)',               +AstMin.toFixed(0),  'mm²/m'],
    ['17.', 'Provided: 20φ@150 main steel',      2094,                'mm²/m'],
    ['18.', 'Distribution: 12φ@200',             565,                 'mm²/m'],
  ];

  sections.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    if (no === '11.') setCellValue(ws, row, 6, qMax <= sbc ? 'SAFE' : 'UNSAFE');
    row++;
  });

  console.log('✓ Sheet 38: C1-ABUTMENT FOOTING DESIGN complete');
}

// ── Sheet 39: C1-Abut Footing STRESS DIAGRAM ─────────────────────────────────
export async function generateC1FootingStressSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('C1-Abut Footing STRESS DIAGRAM');
  setColumnWidths(ws, [8, 25, 15, 15, 15, 15, 15]);

  const abt  = input.abutmentC1;
  const H    = abt?.geometry.height    ?? input.abutmentHeight;
  const t    = abt?.geometry.width     ?? input.abutmentWidth;
  const B    = abt?.geometry.baseWidth ?? (t + 1.5);
  const Lb   = abt?.geometry.baseLength ?? (input.abutmentDepth + 1.0);
  const V    = abt?.loads.deadLoad ?? (H * t * input.abutmentDepth * 25);
  const Pa   = abt?.loads.earthPressure ?? 0;
  const Mo   = Pa * (H / 3);
  const e    = Mo / Math.max(V, 1);
  const qMax = (V / (B * Lb)) * (1 + 6 * e / B);
  const qMin = (V / (B * Lb)) * (1 - 6 * e / B);

  const pts = Array.from({ length: 11 }, (_, i) => {
    const x = (i / 10) * B;
    const q = qMin + (qMax - qMin) * (x / B);
    return { x: +x.toFixed(3), q: +q.toFixed(2) };
  });

  let row = 1;
  setCellValue(ws, row, 1, 'C1 ABUTMENT — FOOTING STRESS DISTRIBUTION');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 7);
  row += 2;

  row = addSketchPlaceholderBlock(ws, row, 7);

  const params: [string, number, string][] = [
    ['Total Vertical Load (V)',    +V.toFixed(1),    'kN/m'],
    ['Overturning Moment (Mo)',    +Mo.toFixed(1),   'kN-m/m'],
    ['Eccentricity (e)',           +e.toFixed(3),    'm'],
    ['Base Width (B)',             B,                'm'],
    ['Max Pressure (qmax)',        +qMax.toFixed(2), 'kN/m²'],
    ['Min Pressure (qmin)',        +qMin.toFixed(2), 'kN/m²'],
    ['SBC',                        input.sbc,        'kN/m²'],
  ];

  setCellValue(ws, row, 1, 'Parameter'); setCellValue(ws, row, 2, 'Value'); setCellValue(ws, row, 3, 'Unit');
  ws.getRow(row).font = { bold: true }; row++;
  params.forEach(([label, val, unit]) => {
    setCellValue(ws, row, 1, label); setCellValue(ws, row, 2, val); setCellValue(ws, row, 3, unit); row++;
  });

  row += 2;
  setCellValue(ws, row, 1, 'PRESSURE DISTRIBUTION (11 points)');
  ws.getCell(row, 1).font = { bold: true }; mergeCells(ws, row, 1, row, 4); row++;
  setCellValue(ws, row, 1, 'Point'); setCellValue(ws, row, 2, 'Distance from Toe (m)');
  setCellValue(ws, row, 3, 'Pressure (kN/m²)'); setCellValue(ws, row, 4, 'Status');
  ws.getRow(row).font = { bold: true }; row++;

  pts.forEach((pt, i) => {
    setCellValue(ws, row, 1, i + 1);
    setCellValue(ws, row, 2, pt.x);
    setCellValue(ws, row, 3, pt.q);
    setCellValue(ws, row, 4, pt.q <= input.sbc ? 'OK' : 'EXCEED');
    row++;
  });

  console.log('✓ Sheet 39: C1-Abut Footing STRESS DIAGRAM complete');
}

// ── Sheet 40: CAN-RETURN FOOTING DESIGN ──────────────────────────────────────
export async function generateCanReturnFootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('CAN-RETURN FOOTING DESIGN');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentC1;
  const H     = abt?.geometry.returnWallLength ?? input.returnWallLength;
  const t     = 0.4;
  const phi   = input.phi;
  const gamma = input.gamma;
  const fy    = input.fy;
  const sbc   = input.sbc;
  const cover = 50;
  const effD  = t * 1000 - cover - 8;

  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa     = 0.5 * Ka * gamma * H * H;
  const Mu     = Pa * H / 3;
  const AstReq = (Mu * 1e6) / (0.87 * fy * 0.9 * effD);
  const AstMin = 0.12 * 1000 * t * 1000 / 100;

  let row = 1;
  setCellValue(ws, row, 1, 'CANTILEVER RETURN WALL — FOOTING DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, number, string][] = [
    ['1.',  'Return Wall Height (H)',          H,                   'm'],
    ['2.',  'Wall Thickness (t)',              t,                   'm'],
    ['3.',  'Effective Depth (d)',             +effD.toFixed(0),    'mm'],
    ['4.',  'Ka (Rankine)',                    +Ka.toFixed(4),      ''],
    ['5.',  'Active Earth Pressure (Pa)',      +Pa.toFixed(2),      'kN/m'],
    ['6.',  'Design BM (Mu = Pa*H/3)',         +Mu.toFixed(2),      'kN-m/m'],
    ['7.',  'Ast Required',                    +AstReq.toFixed(0),  'mm²/m'],
    ['8.',  'Ast Minimum (0.12%)',             +AstMin.toFixed(0),  'mm²/m'],
    ['9.',  'Provided: 16φ@150 main',          1340,                'mm²/m'],
    ['10.', 'Distribution: 10φ@200',           393,                 'mm²/m'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 40: CAN-RETURN FOOTING DESIGN complete');
}

// ── Sheet 41: STEEL IN CANT-ABUTMENT ─────────────────────────────────────────
export async function generateSteelInCantAbutmentSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN CANT-ABUTMENT');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentC1;
  const H     = abt?.geometry.height ?? input.abutmentHeight;
  const t     = abt?.geometry.width  ?? input.abutmentWidth;
  const phi   = input.phi;
  const gamma = input.gamma;
  const fy    = input.fy;
  const cover = 50;
  const effD  = t * 1000 - cover - 8;

  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa     = 0.5 * Ka * gamma * H * H;
  const Mu     = Pa * H / 6;
  const AstReq = Math.max((Mu * 1e6) / (0.87 * fy * 0.9 * effD), 0.12 * 1000 * t * 1000 / 100);
  const AstHoriz = 0.12 * 1000 * t * 1000 / 100 / 2;

  let row = 1;
  setCellValue(ws, row, 1, 'CANTILEVER ABUTMENT — BODY STEEL DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  setCellValue(ws, row, 1, 'A. VERTICAL STEEL (MAIN)');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true }; row++;

  const vertRows: [string, string, number, string][] = [
    ['1.', 'Abutment Height (H)',          H,                    'm'],
    ['2.', 'Stem Thickness (t)',            t,                    'm'],
    ['3.', 'Effective Depth (d)',           +effD.toFixed(0),     'mm'],
    ['4.', 'Ka',                            +Ka.toFixed(4),       ''],
    ['5.', 'Active Earth Pressure (Pa)',    +Pa.toFixed(2),       'kN/m'],
    ['6.', 'Design BM (Pa*H/6)',            +Mu.toFixed(2),       'kN-m/m'],
    ['7.', 'Ast Required',                  +AstReq.toFixed(0),   'mm²/m'],
    ['8.', 'Provided: 16φ@150 vertical',    1340,                 'mm²/m'],
  ];

  vertRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 1, 'B. HORIZONTAL STEEL (0.12% each face)');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true }; row++;

  const horizRows: [string, string, number, string][] = [
    ['1.', 'Ast Min each face (0.06%)',  +AstHoriz.toFixed(0), 'mm²/m'],
    ['2.', 'Provided: 12φ@200',          565,                  'mm²/m'],
  ];

  horizRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 41: STEEL IN CANT-ABUTMENT complete');
}

// ── Sheet 42: STEEL IN CANT-RETURNS ──────────────────────────────────────────
export async function generateSteelInCantReturnsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN CANT-RETURNS');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const H     = input.returnWallLength;
  const t     = 0.4;
  const phi   = input.phi;
  const gamma = input.gamma;
  const fy    = input.fy;
  const cover = 40;
  const effD  = t * 1000 - cover - 6;

  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa     = 0.5 * Ka * gamma * H * H;
  const Mu     = Pa * H / 3;
  const AstReq = Math.max((Mu * 1e6) / (0.87 * fy * 0.9 * effD), 0.12 * 1000 * t * 1000 / 100);

  let row = 1;
  setCellValue(ws, row, 1, 'CANTILEVER RETURN WALL — STEEL DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, number, string][] = [
    ['1.',  'Return Wall Height (H)',          H,                   'm'],
    ['2.',  'Wall Thickness (t)',              t,                   'm'],
    ['3.',  'Effective Depth (d)',             +effD.toFixed(0),    'mm'],
    ['4.',  'Ka (Rankine)',                    +Ka.toFixed(4),      ''],
    ['5.',  'Active Earth Pressure (Pa)',      +Pa.toFixed(2),      'kN/m'],
    ['6.',  'Design BM (Mu = Pa*H/3)',         +Mu.toFixed(2),      'kN-m/m'],
    ['7.',  'Ast Required',                    +AstReq.toFixed(0),  'mm²/m'],
    ['8.',  'Ast Minimum (0.12%)',             +(0.12*1000*t*1000/100).toFixed(0), 'mm²/m'],
    ['9.',  'Provided: 12φ@150 main',          754,                 'mm²/m'],
    ['10.', 'Distribution: 10φ@200',           393,                 'mm²/m'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 42: STEEL IN CANT-RETURNS complete');
}

// ── Sheet 43: C1-Abutment Cap ─────────────────────────────────────────────────
export async function generateC1AbutmentCapSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  lloadRefs?: LloadSummaryRefs
): Promise<void> {
  const ws = workbook.addWorksheet('C1-Abutment Cap');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const capW  = input.carriageWidth;
  const capD  = 1.5;
  const capH  = 0.8;
  const fy    = input.fy;
  const cover = 40;
  const effD  = capH * 1000 - cover - 10;

  const deckDL = input.totalLength * input.carriageWidth * 0.25 * 25 / (2 * input.numberOfSpans);
  const deckLL = 70 * input.carriageWidth / 2;
  const Vu     = (deckDL + deckLL) / capW;
  const Mu     = Vu * capD / 2;
  const AstReq = Math.max((Mu * 1e6) / (0.87 * fy * 0.9 * effD), 0.12 * 1000 * capH * 1000 / 100);

  let row = 1;
  setCellValue(ws, row, 1, 'C1 ABUTMENT CAP DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, any, string][] = [
    ['1.',  'Cap Width (= carriageway width)',  capW,              'm'],
    ['2.',  'Cap Depth',                        capD,              'm'],
    ['3.',  'Cap Height',                       capH,              'm'],
    ['4.',  'Effective Depth (d)',              +effD.toFixed(0),  'mm'],
    ['5.',  'Dead Load Reaction (DL)',          { f: "='STABILITY CHECK FOR PIER'!E211/2", v: +deckDL.toFixed(1) }, 'kN/m'],
    ['6.',  'Live Load Reaction (LL)',          lloadRefs ? { f: `=LLOAD!B${lloadRefs.governingLoadRow}/2`, v: +deckLL.toFixed(1) } : { v: +deckLL.toFixed(1) }, 'kN/m'],
    ['7.',  'Design Shear (Vu)',               +Vu.toFixed(1),    'kN/m'],
    ['8.',  'Design Moment (Mu)',              +Mu.toFixed(2),    'kN-m/m'],
    ['9.',  'Ast Required',                    +AstReq.toFixed(0),'mm²/m'],
    ['10.', 'Provided: 20φ@150 main',          2094,              'mm²/m'],
    ['11.', 'Stirrups: 10φ@200',               393,               'mm²/m'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    if (typeof val === 'object' && val !== null && 'f' in val) {
        setCellFormula(ws, row, 4, val.f, val.v);
    } else {
        setCellValue(ws, row, 4, val);
    }
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 43: C1-Abutment Cap complete');
}

// ── Sheet 44: C1-DIRT WALL REINFORCEMENT ─────────────────────────────────────
export async function generateC1DirtWallReinforcementSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('C1-DIRT WALL REINFORCEMENT');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentC1;
  const Hdw   = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const tdw   = 0.3;
  const phi   = input.phi;
  const gamma = input.gamma;
  const fy    = input.fy;
  const cover = 40;
  const effD  = tdw * 1000 - cover - 8;

  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa_dw  = 0.5 * Ka * gamma * Hdw * Hdw;
  const Mu_dw  = Pa_dw * Hdw / 3;
  const q_sur  = 12;
  const Ps_dw  = Ka * q_sur * Hdw;
  const Mu_sur = Ps_dw * Hdw / 2;
  const Mu_tot = Mu_dw + Mu_sur;
  const AstReq = Math.max((Mu_tot * 1e6) / (0.87 * fy * 0.9 * effD), 0.12 * 1000 * tdw * 1000 / 100);

  let row = 1;
  setCellValue(ws, row, 1, 'C1 DIRT WALL — REINFORCEMENT DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, any, string][] = [
    ['1.',  'Dirt Wall Height (Hdw)',          Hdw,              'm'],
    ['2.',  'Dirt Wall Thickness (tdw)',        tdw,              'm'],
    ['3.',  'Effective Depth (d)',              +effD.toFixed(0), 'mm'],
    ['4.',  'Ka (Rankine)',                     +Ka.toFixed(4),   ''],
    ['5.',  'Active Earth Pressure (Pa)',       +Pa_dw.toFixed(2),'kN/m'],
    ['6.',  'BM from Earth Pressure',          +Mu_dw.toFixed(2),'kN-m/m'],
    ['7.',  'Surcharge (q)',                    q_sur,            'kN/m²'],
    ['8.',  'Surcharge Pressure (Ps)',          +Ps_dw.toFixed(2),'kN/m'],
    ['9.',  'BM from Surcharge',               +Mu_sur.toFixed(2),'kN-m/m'],
    ['10.', 'Total Design BM (Mu)',             { f: "='C1-DIRT DirectLoad_BM'!C481 + 'C1-DIRT LL_BM'!D561", v: +Mu_tot.toFixed(2) }, 'kN-m/m'],
    ['11.', 'Ast Required',                     +AstReq.toFixed(0),'mm²/m'],
    ['12.', 'Ast Minimum (0.12%)',              +(0.12*1000*tdw*1000/100).toFixed(0),'mm²/m'],
    ['13.', 'Provided: 12φ@150 main',           754,              'mm²/m'],
    ['14.', 'Distribution: 10φ@200',            393,              'mm²/m'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    if (typeof val === 'object' && val !== null && 'f' in val) {
        setCellFormula(ws, row, 4, val.f, val.v);
    } else {
        setCellValue(ws, row, 4, val);
    }
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 44: C1-DIRT WALL REINFORCEMENT complete');
}

// ── Sheet 45: C1-DIRT DirectLoad_BM ──────────────────────────────────────────
export async function generateC1DirtDirectLoadBMSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('C1-DIRT DirectLoad_BM');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentC1;
  const Hdw   = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const phi   = input.phi;
  const gamma = input.gamma;
  const phiRad = phi * Math.PI / 180;
  const Ka    = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);

  const approachSlabDL = 0.25 * 25 * input.carriageWidth;
  const Mu_DL = approachSlabDL * Hdw / 2;

  const heights = [0, 0.25, 0.5, 0.75, 1.0].map(f => f * Hdw);
  const bmAtHeight = heights.map(h => {
    const pa = 0.5 * Ka * gamma * h * h;
    return { h: +h.toFixed(2), pa: +pa.toFixed(2), bm: +(pa * h / 3).toFixed(2) };
  });

  let row = 1;
  setCellValue(ws, row, 1, 'C1 DIRT WALL — DIRECT LOAD BENDING MOMENT');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const params: [string, string, number, string][] = [
    ['1.', 'Dirt Wall Height',              Hdw,              'm'],
    ['2.', 'Ka',                            +Ka.toFixed(4),   ''],
    ['3.', 'Approach Slab DL',             +approachSlabDL.toFixed(1), 'kN/m'],
    ['4.', 'BM from Direct Load (Mu_DL)',  +Mu_DL.toFixed(2), 'kN-m/m'],
  ];

  params.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 1, 'BM VARIATION WITH HEIGHT');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true }; row++;
  setCellValue(ws, row, 1, 'Height (m)'); setCellValue(ws, row, 2, 'Earth Pressure (kN/m)');
  setCellValue(ws, row, 3, 'BM (kN-m/m)'); ws.getRow(row).font = { bold: true }; row++;

  bmAtHeight.forEach(pt => {
    setCellValue(ws, row, 1, pt.h); setCellValue(ws, row, 2, pt.pa); setCellValue(ws, row, 3, pt.bm); row++;
  });

  row++;
  setCellValue(ws, row, 2, 'Max BM at base');
  setCellValue(ws, row, 3, +bmAtHeight[bmAtHeight.length - 1].bm.toFixed(2));
  setCellValue(ws, row, 4, 'kN-m/m');
  ws.getRow(row).font = { bold: true };

  console.log('✓ Sheet 45: C1-DIRT DirectLoad_BM complete');
}

// ── Sheet 46: C1-DIRT LL_BM ───────────────────────────────────────────────────
export async function generateC1DirtLLBMSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('C1-DIRT LL_BM');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentC1;
  const Hdw   = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const phi   = input.phi;
  const gamma = input.gamma;
  const phiRad = phi * Math.PI / 180;
  const Ka    = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);

  const q_sur  = 12;
  const Ps_dw  = Ka * q_sur * Hdw;
  const Mu_LL  = Ps_dw * Hdw / 2;

  const wheelLoad = 350;
  const contactL  = 3.6;
  const contactW  = 0.84;
  const dispL     = contactL + 2 * Hdw;
  const dispW     = contactW + 2 * Hdw;
  const pressure  = wheelLoad / (dispL * dispW);
  const Mu_wheel  = pressure * Hdw * Hdw / 2;
  const Mu_design = Math.max(Mu_LL, Mu_wheel);

  let row = 1;
  setCellValue(ws, row, 1, 'C1 DIRT WALL — LIVE LOAD BENDING MOMENT');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  setCellValue(ws, row, 1, 'A. SURCHARGE LIVE LOAD'); ws.getCell(ws.getCell(row, 1).address).font = { bold: true }; row++;

  const surRows: [string, string, number, string][] = [
    ['1.', 'Dirt Wall Height (Hdw)',    Hdw,              'm'],
    ['2.', 'Ka',                        +Ka.toFixed(4),   ''],
    ['3.', 'Surcharge (q)',             q_sur,            'kN/m²'],
    ['4.', 'Surcharge Pressure (Ps)',   +Ps_dw.toFixed(2),'kN/m'],
    ['5.', 'BM from Surcharge (Mu_LL)', +Mu_LL.toFixed(2),'kN-m/m'],
  ];

  surRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 1, 'B. IRC CLASS AA WHEEL LOAD'); ws.getCell(ws.getCell(row, 1).address).font = { bold: true }; row++;

  const wheelRows: [string, string, number, string][] = [
    ['1.', 'Wheel Load (half track)',   wheelLoad,        'kN'],
    ['2.', 'Contact Length',            contactL,         'm'],
    ['3.', 'Contact Width',             contactW,         'm'],
    ['4.', 'Dispersed Length at base',  +dispL.toFixed(2),'m'],
    ['5.', 'Dispersed Width at base',   +dispW.toFixed(2),'m'],
    ['6.', 'Dispersed Pressure',        +pressure.toFixed(2),'kN/m²'],
    ['7.', 'BM from Wheel Load',        +Mu_wheel.toFixed(2),'kN-m/m'],
  ];

  wheelRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no); setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, val); setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 2, 'DESIGN BM (Max of A and B)');
  ws.getCell(ws.getCell(row, 2).address).font = { bold: true }; row++;
  setCellValue(ws, row, 2, 'Design BM (Mu)');
  setCellValue(ws, row, 3, '='); setCellValue(ws, row, 4, +Mu_design.toFixed(2)); setCellValue(ws, row, 5, 'kN-m/m');
  ws.getRow(row).font = { bold: true };

  console.log('✓ Sheet 46: C1-DIRT LL_BM complete');
}
