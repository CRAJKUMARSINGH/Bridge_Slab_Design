/**
 * Sheets 19-28: TYPE1 Abutment Design Section
 * Full implementation — all quantities from EnhancedProjectInput engine results
 * Covers: Insert, Drawing, Stability, Footing Design, Footing Stress,
 *         Steel in Abutment, Abutment Cap, Dirt Wall Reinf, Dirt DirectLoad BM, Dirt LL BM
 */

import ExcelJS from 'exceljs';
import { EnhancedProjectInput } from '../types';
import { setColumnWidths, setCellValue, setCellFormula, mergeCells, COLORS } from '../utils';
import { addSketchPlaceholderBlock } from '../sketch-placeholders';

// Sheet 19: INSERT TYPE1-ABUT
export async function generateInsertType1AbutSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INSERT TYPE1-ABUT');
  setColumnWidths(ws, [8, 35, 15, 15, 10, 15]);

  let row = 1;
  setCellValue(ws, row, 1, 'DESIGN OF SUBMERSIBLE BRIDGE');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  mergeCells(ws, row, 1, row, 6);
  row++;
  setCellValue(ws, row, 1, `Name Of Work :- ${input.projectName}`);
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT — INPUT DATA');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  ws.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PRIMARY } };
  ws.getCell(row, 1).font = { bold: true, size: 13, color: { argb: COLORS.WHITE } };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const abt = input.abutmentType1;
  const rows: [string, string, number | string, string][] = [
    ['1.', 'Abutment Height (H)',          abt?.geometry.height      ?? input.abutmentHeight,  'm'],
    ['2.', 'Stem Width (t)',                abt?.geometry.width       ?? input.abutmentWidth,   'm'],
    ['3.', 'Abutment Depth (D)',            abt?.geometry.depth       ?? input.abutmentDepth,   'm'],
    ['4.', 'Base Width (B)',                abt?.geometry.baseWidth   ?? (input.abutmentWidth + 1.5), 'm'],
    ['5.', 'Base Length',                   abt?.geometry.baseLength  ?? (input.abutmentDepth + 1.0), 'm'],
    ['6.', 'Dirt Wall Height',              abt?.geometry.dirtWallHeight ?? input.dirtWallHeight, 'm'],
    ['7.', 'Return Wall Length',            abt?.geometry.returnWallLength ?? input.returnWallLength, 'm'],
    ['8.', 'Foundation Level',              input.foundationLevel,    'm MSL'],
    ['9.', 'H.F.L.',                        input.hfl,                'm MSL'],
    ['10.', 'Safe Bearing Capacity (SBC)', input.sbc,                'kN/m²'],
    ['11.', 'Angle of Friction (φ)',        input.phi,                'degrees'],
    ['12.', 'Unit Weight of Soil (γ)',      input.gamma,              'kN/m³'],
    ['13.', 'Concrete Grade',               input.concreteGrade,      ''],
    ['14.', 'Steel Grade',                  input.steelGrade,         ''],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 19: INSERT TYPE1-ABUT complete');
}

// Sheet 20: TYPE1-AbutMENT Drawing
export async function generateType1AbutmentDrawingSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-AbutMENT Drawing');
  setColumnWidths(ws, [8, 35, 15, 15, 10, 15]);

  const abt = input.abutmentType1;
  const H  = abt?.geometry.height      ?? input.abutmentHeight;
  const t  = abt?.geometry.width       ?? input.abutmentWidth;
  const D  = abt?.geometry.depth       ?? input.abutmentDepth;
  const B  = abt?.geometry.baseWidth   ?? (t + 1.5);
  const Lb = abt?.geometry.baseLength  ?? (D + 1.0);
  const Dw = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const Rw = abt?.geometry.returnWallLength ?? input.returnWallLength;

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT — GENERAL ARRANGEMENT DIMENSIONS');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  row = addSketchPlaceholderBlock(ws, row, 6);

  const dims: [string, string, number, string][] = [
    ['A', 'Total Abutment Height (H)',          H,   'm'],
    ['B', 'Stem Thickness (t)',                  t,   'm'],
    ['C', 'Abutment Depth (D)',                  D,   'm'],
    ['D', 'Base Width (B)',                      B,   'm'],
    ['E', 'Base Length',                         Lb,  'm'],
    ['F', 'Dirt Wall Height',                    Dw,  'm'],
    ['G', 'Return Wall Length (each side)',      Rw,  'm'],
    ['H', 'Return Wall Thickness',               0.4, 'm'],
    ['I', 'Abutment Cap Width',                  input.carriageWidth, 'm'],
    ['J', 'Abutment Cap Depth',                  1.5, 'm'],
    ['K', 'Abutment Cap Height',                 0.8, 'm'],
    ['L', 'Wing Wall Length',                    Rw,  'm'],
    ['M', 'Wing Wall Height (at junction)',      H,   'm'],
    ['N', 'Wing Wall Height (at free end)',      Dw,  'm'],
    ['O', 'Wing Wall Thickness',                 0.4, 'm'],
  ];

  setCellValue(ws, row, 1, 'Ref');
  setCellValue(ws, row, 2, 'Component');
  setCellValue(ws, row, 3, 'Dimension');
  setCellValue(ws, row, 4, 'Unit');
  ws.getRow(row).font = { bold: true };
  row++;

  dims.forEach(([ref, label, val, unit]) => {
    setCellValue(ws, row, 1, ref);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, val);
    setCellValue(ws, row, 4, unit);
    row++;
  });

  row += 2;
  setCellValue(ws, row, 1, 'NOTES:');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  setCellValue(ws, row, 1, '1. All dimensions in metres unless stated otherwise.');
  row++;
  setCellValue(ws, row, 1, '2. Refer IRC:78-1983 for foundation design.');
  row++;
  setCellValue(ws, row, 1, '3. Dirt wall designed as cantilever slab.');
  row++;
  setCellValue(ws, row, 1, '4. Return walls designed as cantilever retaining walls.');

  console.log('✓ Sheet 20: TYPE1-AbutMENT Drawing complete');
}

// Sheet 21: TYPE1-STABILITY CHECK ABUTMENT (re-export from dedicated file)
export async function generateType1StabilityCheckSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const { generateType1StabilityCheckAbutmentSheet } = await import('./21-type1-stability-check-abutment');
  await generateType1StabilityCheckAbutmentSheet(workbook, input);
}

import { LloadSummaryRefs } from './17-lload';

// Sheet 19: INSERT TYPE1-ABUT
// ... code ...

// Sheet 22: TYPE1-ABUTMENT FOOTING DESIGN
export async function generateType1FootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  lloadRefs?: LloadSummaryRefs
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-ABUTMENT FOOTING DESIGN');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt  = input.abutmentType1;
  const H    = abt?.geometry.height    ?? input.abutmentHeight;
  const B    = abt?.geometry.baseWidth ?? (input.abutmentWidth + 1.5);
  const Lb   = abt?.geometry.baseLength ?? (input.abutmentDepth + 1.0);
  const fck  = input.fck;
  const fy   = input.fy;
  const sbc  = input.sbc;

  // Footing design parameters
  const footingThk = Math.max(1.2, Math.round((H * 0.15 * 20)) / 20); // Rounded to 50mm
  const cover      = 75;                           // mm
  const effDepth   = footingThk * 1000 - cover - 10; // mm

  // Loads on footing
  const V  = abt?.loads.deadLoad ?? (H * input.abutmentWidth * input.abutmentDepth * 25);
  const Pa = abt?.loads.earthPressure ?? 0;
  const Mo = Pa * (H / 3);
  const e  = Mo / Math.max(V, 1);
  const qMax = (V / (B * Lb)) * (1 + 6 * e / B);
  const qMin = (V / (B * Lb)) * (1 - 6 * e / B);

  // Bending moment at face of stem (cantilever heel)
  const heelL = B * 0.6;
  const Mu    = qMax * heelL * heelL / 2;          // kN-m/m

  // Steel area required (simplified lever arm method)
  function astApprox(M: number, d: number) {
    return (M * 1e6) / (0.87 * fy * 0.9 * d);
  }
  const AstReq = astApprox(Mu, effDepth);
  const AstMin = 0.12 * 1000 * footingThk * 1000 / 100; // 0.12% of gross area

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT — FOOTING DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const sections: [string, string, number, string][] = [
    ['1.', 'Footing Length (B)',                B,           'm'],
    ['2.', 'Footing Width (Lb)',                Lb,          'm'],
    ['3.', 'Footing Thickness',                 footingThk,  'm'],
    ['4.', 'Clear Cover',                       cover,       'mm'],
    ['5.', 'Effective Depth (d)',               effDepth,    'mm'],
    ['6.', 'Total Vertical Load (V)',           +V.toFixed(1), 'kN/m'],
    ['7.', 'Overturning Moment (Mo)',           +Mo.toFixed(1), 'kN-m/m'],
    ['8.', 'Eccentricity (e)',                  +e.toFixed(3), 'm'],
    ['9.', 'Max Bearing Pressure (qmax)',       +qMax.toFixed(2), 'kN/m²'],
    ['10.', 'Min Bearing Pressure (qmin)',      +qMin.toFixed(2), 'kN/m²'],
    ['11.', 'Allowable Bearing Pressure (SBC)', sbc,         'kN/m²'],
    ['12.', 'Heel Length',                      +heelL.toFixed(2), 'm'],
    ['13.', 'Design BM at stem face (Mu)',      +Mu.toFixed(2), 'kN-m/m'],
    ['14.', 'Ast Required',                     +AstReq.toFixed(0), 'mm²/m'],
    ['15.', 'Ast Minimum (0.12%)',              +AstMin.toFixed(0), 'mm²/m'],
    ['16.', 'Ast Provided (20φ@150)',           Math.round(20 * 20 * Math.PI / 4 * (1000/150)), 'mm²/m'],
    ['17.', 'Distribution Steel (12φ@200)',     Math.round(12 * 12 * Math.PI / 4 * (1000/200)), 'mm²/m'],
  ];

  sections.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    const status = no === '9.' ? (qMax <= sbc ? 'SAFE' : 'UNSAFE') : '';
    if (status) setCellValue(ws, row, 6, status);
    row++;
  });

  row++;
  setCellValue(ws, row, 2, 'Bearing Pressure Check');
  setCellFormula(ws, row, 4, `=IF(D${row-8}<=${sbc},"SAFE","UNSAFE")`, qMax <= sbc ? 'SAFE' : 'UNSAFE');

  console.log('✓ Sheet 22: TYPE1-ABUTMENT FOOTING DESIGN complete');
}

// Sheet 23: TYPE1- Abut Footing STRESS
export async function generateType1FootingStressSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1- Abut Footing STRESS');
  setColumnWidths(ws, [8, 20, 15, 15, 15, 15, 15]);

  const abt  = input.abutmentType1;
  const H    = abt?.geometry.height    ?? input.abutmentHeight;
  const B    = abt?.geometry.baseWidth ?? (input.abutmentWidth + 1.5);
  const Lb   = abt?.geometry.baseLength ?? (input.abutmentDepth + 1.0);
  const V    = abt?.loads.deadLoad ?? (H * input.abutmentWidth * input.abutmentDepth * 25);
  const Pa   = abt?.loads.earthPressure ?? 0;
  const Mo   = Pa * (H / 3);
  const e    = Mo / Math.max(V, 1);
  const qMax = (V / (B * Lb)) * (1 + 6 * e / B);
  const qMin = (V / (B * Lb)) * (1 - 6 * e / B);

  // 11-point pressure distribution
  const pts = Array.from({ length: 11 }, (_, i) => {
    const x = (i / 10) * B;
    const q = qMin + (qMax - qMin) * (x / B);
    return { x: +x.toFixed(3), q: +q.toFixed(2) };
  });

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT — FOOTING STRESS DISTRIBUTION');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 7);
  row += 2;

  row = addSketchPlaceholderBlock(ws, row, 7);

  setCellValue(ws, row, 1, 'Parameter');
  setCellValue(ws, row, 2, 'Value');
  setCellValue(ws, row, 3, 'Unit');
  ws.getRow(row).font = { bold: true };
  row++;

  const params: [string, number, string][] = [
    ['Total Vertical Load (V)',    +V.toFixed(1),    'kN/m'],
    ['Overturning Moment (Mo)',    +Mo.toFixed(1),   'kN-m/m'],
    ['Eccentricity (e)',           +e.toFixed(3),    'm'],
    ['Base Width (B)',             B,                'm'],
    ['Max Pressure (qmax)',        +qMax.toFixed(2), 'kN/m²'],
    ['Min Pressure (qmin)',        +qMin.toFixed(2), 'kN/m²'],
    ['SBC',                        input.sbc,        'kN/m²'],
    ['Status',                     qMax <= input.sbc ? 1 : 0, qMax <= input.sbc ? 'SAFE' : 'UNSAFE'],
  ];

  params.forEach(([label, val, unit]) => {
    setCellValue(ws, row, 1, label);
    setCellValue(ws, row, 2, val);
    setCellValue(ws, row, 3, unit);
    row++;
  });

  row += 2;
  setCellValue(ws, row, 1, 'PRESSURE DISTRIBUTION (11 points across base)');
  ws.getCell(row, 1).font = { bold: true };
  mergeCells(ws, row, 1, row, 4);
  row++;

  setCellValue(ws, row, 1, 'Point');
  setCellValue(ws, row, 2, 'Distance from Toe (m)');
  setCellValue(ws, row, 3, 'Pressure (kN/m²)');
  setCellValue(ws, row, 4, 'Status');
  ws.getRow(row).font = { bold: true };
  row++;

  pts.forEach((pt, i) => {
    setCellValue(ws, row, 1, i + 1);
    setCellValue(ws, row, 2, pt.x);
    setCellValue(ws, row, 3, pt.q);
    setCellValue(ws, row, 4, pt.q <= input.sbc ? 'OK' : 'EXCEED');
    row++;
  });

  console.log('✓ Sheet 23: TYPE1- Abut Footing STRESS complete');
}

// Sheet 24: TYPE1-STEEL IN ABUTMENT
export async function generateType1SteelInAbutmentSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-STEEL IN ABUTMENT');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15, 15]);

  const abt  = input.abutmentType1;
  const H    = abt?.geometry.height ?? input.abutmentHeight;
  const t    = abt?.geometry.width  ?? input.abutmentWidth;
  const D    = abt?.geometry.depth  ?? input.abutmentDepth;
  const fck  = input.fck;
  const fy   = input.fy;

  // Abutment body — vertical steel (main)
  const cover   = 50;   // mm
  const effD    = t * 1000 - cover - 10;
  const Pa      = abt?.loads.earthPressure ?? 0;
  const Mu_body = Pa * H / 6;   // Simplified cantilever BM at base

  function astReq(M: number, d: number) {
    return (M * 1e6) / (0.87 * fy * 0.9 * d);
  }

  const AstBody  = Math.max(astReq(Mu_body, effD), 0.12 * 1000 * t * 1000 / 100);
  const AstHoriz = 0.12 * 1000 * t * 1000 / 100 / 2; // Half on each face

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT — STEEL IN ABUTMENT BODY');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 7);
  row += 2;

  // Section A: Abutment body vertical steel
  setCellValue(ws, row, 1, 'A. VERTICAL STEEL (MAIN REINFORCEMENT)');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  const vertRows: [string, string, number, string][] = [
    ['1.', 'Abutment Height (H)',          H,                    'm'],
    ['2.', 'Stem Thickness (t)',            t,                    'm'],
    ['3.', 'Effective Depth (d)',           effD,                 'mm'],
    ['4.', 'Design BM at base (Mu)',        +Mu_body.toFixed(2),  'kN-m/m'],
    ['5.', 'Ast Required',                  +AstBody.toFixed(0),  'mm²/m'],
    ['6.', 'Ast Minimum (0.12%)',           +(0.12*1000*t*1000/100).toFixed(0), 'mm²/m'],
    ['7.', 'Provided: 16φ @ 150 c/c',      Math.round(16 * 16 * Math.PI / 4 * (1000/150)), 'mm²/m'],
    ['8.', 'Distribution: 12φ @ 200 c/c',  Math.round(12 * 12 * Math.PI / 4 * (1000/200)), 'mm²/m'],
  ];

  vertRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  // Section B: Horizontal steel
  setCellValue(ws, row, 1, 'B. HORIZONTAL STEEL (TEMPERATURE & SHRINKAGE)');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  const horizRows: [string, string, number, string][] = [
    ['1.', 'Ast Minimum (0.06% each face)', +AstHoriz.toFixed(0), 'mm²/m'],
    ['2.', 'Provided: 12φ @ 200 c/c',       565,                  'mm²/m'],
    ['3.', 'Spacing',                        200,                  'mm'],
  ];

  horizRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  // Section C: Abutment cap steel
  setCellValue(ws, row, 1, 'C. ABUTMENT CAP STEEL');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  const capRows: [string, string, number, string][] = [
    ['1.', 'Cap Width',                     input.carriageWidth,  'm'],
    ['2.', 'Cap Depth',                     1.5,                  'm'],
    ['3.', 'Cap Height',                    0.8,                  'm'],
    ['4.', 'Main Steel: 20φ @ 150 c/c',    2094,                 'mm²/m'],
    ['5.', 'Stirrups: 10φ @ 200 c/c',      393,                  'mm²/m'],
  ];

  capRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 24: TYPE1-STEEL IN ABUTMENT complete');
}

// Sheet 25: TYPE1-Abutment Cap
export async function generateType1AbutmentCapSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
  lloadRefs?: LloadSummaryRefs
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-Abutment Cap');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const capW  = input.carriageWidth;
  const capD  = 1.5;   // m
  const capH  = 0.8;   // m
  const fck   = input.fck;
  const fy    = input.fy;
  const cover = 40;    // mm
  const effD  = capH * 1000 - cover - 10;

  // Dead load reaction from deck - pulling from LLOAD if possible
  const deckDL = input.totalLength * input.carriageWidth * 0.25 * 25 / (2 * input.numberOfSpans);
  const deckLL = 70 * input.carriageWidth / 2; // IRC Class AA
  const Vu     = (deckDL + deckLL) / capW;     // kN/m
  const Mu     = Vu * capD / 2;                // kN-m/m (simply supported)

  function astReq(M: number, d: number) {
    return (M * 1e6) / (0.87 * fy * 0.9 * d);
  }
  const AstReq = Math.max(astReq(Mu, effD), 0.12 * 1000 * capH * 1000 / 100);

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT CAP DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, any, string][] = [
    ['1.', 'Cap Width (= carriageway width)',  capW,              'm'],
    ['2.', 'Cap Depth',                        capD,              'm'],
    ['3.', 'Cap Height',                       capH,              'm'],
    ['4.', 'Effective Depth (d)',              effD,              'mm'],
    ['5.', 'Dead Load Reaction (DL)',          { f: "='STABILITY CHECK FOR PIER'!E211/2", v: +deckDL.toFixed(1) }, 'kN/m'],
    ['6.', 'Live Load Reaction (LL)',          lloadRefs ? { f: `=LLOAD!B${lloadRefs.governingLoadRow}/2`, v: +deckLL.toFixed(1) } : { v: +deckLL.toFixed(1) }, 'kN/m'],
    ['7.', 'Design Shear (Vu)',               +Vu.toFixed(1),    'kN/m'],
    ['8.', 'Design Moment (Mu)',              +Mu.toFixed(2),    'kN-m/m'],
    ['9.', 'Ast Required',                    +AstReq.toFixed(0), 'mm²/m'],
    ['10.', 'Provided: 20φ @ 150 c/c',        2094,              'mm²/m'],
    ['11.', 'Stirrups: 10φ @ 200 c/c',        393,               'mm²/m'],
    ['12.', 'Bearing Pad Size',                0,                 '300×400 mm'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    if (typeof val === 'object' && val !== null && 'f' in val) {
        setCellFormula(ws, row, 4, val.f, val.v);
    } else {
        setCellValue(ws, row, 4, val === 0 ? '300×400 mm' : val);
    }
    setCellValue(ws, row, 5, val === 0 ? '' : unit);
    row++;
  });

  console.log('✓ Sheet 25: TYPE1-Abutment Cap complete');
}

// Sheet 26: TYPE1-DIRT WALL REINFORCEMENT
export async function generateType1DirtWallReinforcementSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT WALL REINFORCEMENT');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt  = input.abutmentType1;
  const Hdw  = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const tdw  = 0.3;    // m — typical dirt wall thickness
  const fck  = input.fck;
  const fy   = input.fy;
  const phi  = input.phi;
  const gamma = input.gamma;
  const cover = 40;   // mm
  const effD  = tdw * 1000 - cover - 8;

  // Active earth pressure on dirt wall (Rankine)
  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa_dw  = 0.5 * Ka * gamma * Hdw * Hdw;   // kN/m
  const Mu_dw  = Pa_dw * Hdw / 3;                 // kN-m/m (cantilever)

  // Surcharge on dirt wall
  const q_sur  = 12;   // kN/m² IRC:6
  const Ps_dw  = Ka * q_sur * Hdw;
  const Mu_sur = Ps_dw * Hdw / 2;
  const Mu_tot = Mu_dw + Mu_sur;

  function astReq(M: number, d: number) {
    return (M * 1e6) / (0.87 * fy * 0.9 * d);
  }
  const AstReq = Math.max(astReq(Mu_tot, effD), 0.12 * 1000 * tdw * 1000 / 100);

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 DIRT WALL — REINFORCEMENT DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, any, string][] = [
    ['1.', 'Dirt Wall Height (Hdw)',          Hdw,              'm'],
    ['2.', 'Dirt Wall Thickness (tdw)',        tdw,              'm'],
    ['3.', 'Effective Depth (d)',              effD,             'mm'],
    ['4.', 'Ka (Rankine)',                     +Ka.toFixed(4),   ''],
    ['5.', 'Active Earth Pressure (Pa)',       +Pa_dw.toFixed(2), 'kN/m'],
    ['6.', 'BM from Earth Pressure',          +Mu_dw.toFixed(2), 'kN-m/m'],
    ['7.', 'Surcharge (q)',                    q_sur,            'kN/m²'],
    ['8.', 'Surcharge Pressure (Ps)',          +Ps_dw.toFixed(2), 'kN/m'],
    ['9.', 'BM from Surcharge',               +Mu_sur.toFixed(2), 'kN-m/m'],
    ['10.', 'Total Design BM (Mu)',            { f: "='TYPE1-DIRT DirectLoad_BM'!C623 + 'TYPE1-DIRT LL_BM'!D719", v: +Mu_tot.toFixed(2) }, 'kN-m/m'],
    ['11.', 'Ast Required',                    +AstReq.toFixed(0), 'mm²/m'],
    ['12.', 'Ast Minimum (0.12%)',             +(0.12*1000*tdw*1000/100).toFixed(0), 'mm²/m'],
    ['13.', 'Provided: 12φ @ 150 c/c',        754,              'mm²/m'],
    ['14.', 'Distribution: 10φ @ 200 c/c',    393,              'mm²/m'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    if (typeof val === 'object' && val !== null && 'f' in val) {
        setCellFormula(ws, row, 4, val.f, val.v);
    } else {
        setCellValue(ws, row, 4, val);
    }
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 26: TYPE1-DIRT WALL REINFORCEMENT complete');
}

// Sheet 27: TYPE1-DIRT DirectLoad_BM
export async function generateType1DirtDirectLoadBMSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT DirectLoad_BM');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentType1;
  const Hdw   = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const phi   = input.phi;
  const gamma = input.gamma;
  const phiRad = phi * Math.PI / 180;
  const Ka    = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);

  // Direct load BM — dead load from approach slab on dirt wall
  const approachSlabDL = 0.25 * 25 * input.carriageWidth; // kN/m (250mm slab)
  const Mu_DL = approachSlabDL * Hdw / 2;                 // kN-m/m

  // Earth pressure BM at various heights
  const heights = [0, 0.25, 0.5, 0.75, 1.0].map(f => f * Hdw);
  const bmAtHeight = heights.map(h => {
    const pa = 0.5 * Ka * gamma * h * h;
    return { h: +h.toFixed(2), pa: +pa.toFixed(2), bm: +(pa * h / 3).toFixed(2) };
  });

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 DIRT WALL — DIRECT LOAD BENDING MOMENT');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  setCellValue(ws, row, 1, 'DESIGN PARAMETERS');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  const params: [string, string, number, string][] = [
    ['1.', 'Dirt Wall Height',              Hdw,              'm'],
    ['2.', 'Ka',                            +Ka.toFixed(4),   ''],
    ['3.', 'Approach Slab DL',             +approachSlabDL.toFixed(1), 'kN/m'],
    ['4.', 'BM from Direct Load (Mu_DL)',  +Mu_DL.toFixed(2), 'kN-m/m'],
  ];

  params.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 1, 'BM VARIATION WITH HEIGHT');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  setCellValue(ws, row, 1, 'Height (m)');
  setCellValue(ws, row, 2, 'Earth Pressure (kN/m)');
  setCellValue(ws, row, 3, 'BM (kN-m/m)');
  ws.getRow(row).font = { bold: true };
  row++;

  bmAtHeight.forEach(pt => {
    setCellValue(ws, row, 1, pt.h);
    setCellValue(ws, row, 2, pt.pa);
    setCellValue(ws, row, 3, pt.bm);
    row++;
  });

  row++;
  setCellValue(ws, row, 2, 'Max BM at base');
  setCellValue(ws, row, 3, +bmAtHeight[bmAtHeight.length - 1].bm.toFixed(2));
  setCellValue(ws, row, 4, 'kN-m/m');
  ws.getRow(row).font = { bold: true };

  console.log('✓ Sheet 27: TYPE1-DIRT DirectLoad_BM complete');
}

// Sheet 28: TYPE1-DIRT LL_BM
export async function generateType1DirtLLBMSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT LL_BM');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const abt   = input.abutmentType1;
  const Hdw   = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const phi   = input.phi;
  const gamma = input.gamma;
  const phiRad = phi * Math.PI / 180;
  const Ka    = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);

  // Live load surcharge BM
  const q_sur  = 12;   // kN/m² IRC:6-2016
  const Ps_dw  = Ka * q_sur * Hdw;
  const Mu_LL  = Ps_dw * Hdw / 2;   // kN-m/m

  // IRC Class AA tracked vehicle — wheel load on dirt wall
  const wheelLoad = 350;   // kN (half of 700 kN)
  const contactL  = 3.6;   // m
  const contactW  = 0.84;  // m
  const dispAngle = 45;    // degrees
  const dispL     = contactL + 2 * Hdw * Math.tan(dispAngle * Math.PI / 180);
  const dispW     = contactW + 2 * Hdw * Math.tan(dispAngle * Math.PI / 180);
  const pressure  = wheelLoad / (dispL * dispW);
  const Mu_wheel  = pressure * Hdw * Hdw / 2;

  const Mu_design = Math.max(Mu_LL, Mu_wheel);

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 DIRT WALL — LIVE LOAD BENDING MOMENT');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  setCellValue(ws, row, 1, 'A. SURCHARGE LIVE LOAD');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  const surRows: [string, string, number, string][] = [
    ['1.', 'Dirt Wall Height (Hdw)',    Hdw,              'm'],
    ['2.', 'Ka',                        +Ka.toFixed(4),   ''],
    ['3.', 'Surcharge (q)',             q_sur,            'kN/m²'],
    ['4.', 'Surcharge Pressure (Ps)',   +Ps_dw.toFixed(2), 'kN/m'],
    ['5.', 'BM from Surcharge (Mu_LL)', +Mu_LL.toFixed(2), 'kN-m/m'],
  ];

  surRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 1, 'B. IRC CLASS AA WHEEL LOAD');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;

  const wheelRows: [string, string, number, string][] = [
    ['1.', 'Wheel Load (half track)',   wheelLoad,        'kN'],
    ['2.', 'Contact Length',            contactL,         'm'],
    ['3.', 'Contact Width',             contactW,         'm'],
    ['4.', 'Dispersed Length at base',  +dispL.toFixed(2), 'm'],
    ['5.', 'Dispersed Width at base',   +dispW.toFixed(2), 'm'],
    ['6.', 'Dispersed Pressure',        +pressure.toFixed(2), 'kN/m²'],
    ['7.', 'BM from Wheel Load',        +Mu_wheel.toFixed(2), 'kN-m/m'],
  ];

  wheelRows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  row++;
  setCellValue(ws, row, 1, 'DESIGN BM (Max of A and B)');
  ws.getCell(ws.getCell(row, 1).address).font = { bold: true };
  row++;
  setCellValue(ws, row, 2, 'Design BM (Mu)');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, +Mu_design.toFixed(2));
  setCellValue(ws, row, 5, 'kN-m/m');
  ws.getRow(row).font = { bold: true };

  console.log('✓ Sheet 28: TYPE1-DIRT LL_BM complete');
}

// Sheet 29: TYPE1-RETURN WALL STABILITY
export async function generateType1ReturnWallStabilitySheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-RETURN WALL STABILITY');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const RwL = input.returnWallLength;
  const H   = input.abutmentHeight;
  const t   = 0.45; // m
  const gamma = input.gamma;
  const phi   = input.phi;
  const sbc   = input.sbc;

  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa     = 0.5 * Ka * gamma * H * H;
  const W      = t * H * 25; // Self weight
  const Mo     = Pa * H / 3;
  const Mr     = W * t / 2;
  const FOS_O  = Mr / Math.max(Mo, 1);
  const FOS_S  = (W * Math.tan(0.66 * phiRad)) / Math.max(Pa, 1);

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 RETURN WALL — STABILITY CHECK');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, any, string][] = [
    ['1.', 'Return Wall Height (H)', H, 'm'],
    ['2.', 'Wall Thickness (t)', t, 'm'],
    ['3.', 'Unit Weight of Conc.', 25, 'kN/m³'],
    ['4.', 'Active Earth Pressure (Pa)', +Pa.toFixed(2), 'kN/m'],
    ['5.', 'Self Weight (W)', +W.toFixed(2), 'kN/m'],
    ['6.', 'Overturning Moment (Mo)', +Mo.toFixed(2), 'kN-m/m'],
    ['7.', 'Restoring Moment (Mr)', +Mr.toFixed(2), 'kN-m/m'],
    ['8.', 'F.O.S. Against Overturning', +FOS_O.toFixed(2), ''],
    ['9.', 'F.O.S. Against Sliding', +FOS_S.toFixed(2), ''],
    ['10.', 'Status (Overturning > 2.0)', FOS_O >= 2.0 ? 'SAFE' : 'UNSAFE', ''],
    ['11.', 'Status (Sliding > 1.5)', FOS_S >= 1.5 ? 'SAFE' : 'UNSAFE', ''],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 29: TYPE1-RETURN WALL STABILITY complete');
}

// Sheet 30: TYPE1-RETURN WALL REINFORCEMENT
export async function generateType1ReturnWallReinforcementSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-RETURN WALL REINFORCEMENT');
  setColumnWidths(ws, [8, 38, 15, 15, 10, 15]);

  const H   = input.abutmentHeight;
  const t   = 0.45;
  const fy  = input.fy;
  const gamma = input.gamma;
  const phi   = input.phi;
  const cover = 40;
  const effD  = t * 1000 - cover - 10;

  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Pa     = 0.5 * Ka * gamma * H * H;
  const Mu     = Pa * H / 3;
  const AstReq = Math.max((Mu * 1e6) / (0.87 * fy * 0.9 * effD), 0.12 * 1000 * t * 1000 / 100);

  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 RETURN WALL — REINFORCEMENT DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 13 };
  mergeCells(ws, row, 1, row, 6);
  row += 2;

  const rows: [string, string, any, string][] = [
    ['1.', 'Return Wall Height (H)', H, 'm'],
    ['2.', 'Wall Thickness (t)', t, 'm'],
    ['3.', 'Effective Depth (d)', effD, 'mm'],
    ['4.', 'Design BM (Mu)', +Mu.toFixed(2), 'kN-m/m'],
    ['5.', 'Ast Required', +AstReq.toFixed(0), 'mm²/m'],
    ['6.', 'Ast Minimum (0.12%)', +(0.12*1000*t*1000/100).toFixed(0), 'mm²/m'],
    ['7.', 'Provided: 16φ @ 150 c/c', Math.round(16 * 16 * Math.PI / 4 * (1000/150)), 'mm²/m'],
    ['8.', 'Distribution: 10φ @ 200 c/c', Math.round(10 * 10 * Math.PI / 4 * (1000/200)), 'mm²/m'],
  ];

  rows.forEach(([no, label, val, unit]) => {
    setCellValue(ws, row, 1, no);
    setCellValue(ws, row, 2, label);
    setCellValue(ws, row, 3, '=');
    setCellValue(ws, row, 4, val);
    setCellValue(ws, row, 5, unit);
    row++;
  });

  console.log('✓ Sheet 30: TYPE1-RETURN WALL REINFORCEMENT complete');
}
