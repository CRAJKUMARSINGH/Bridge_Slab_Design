/**
 * Sheets 20-28: TYPE1 abutment design views.
 *
 * Values come from AbutmentDesignResult. When a detailed result is absent the
 * sheet reports CHECK instead of emitting a representative sample design.
 */

import ExcelJS from 'exceljs';
import type { AbutmentDesignResult, EnhancedProjectInput, SteelDetails } from '../types';
import { addTableHeader, addTableRow, setCellFormula, setColumnWidths, setCellValue } from '../utils';

function abutmentOrReview(input: EnhancedProjectInput): AbutmentDesignResult | undefined {
  return input.abutmentType1;
}

function steelText(steel: SteelDetails | undefined): string {
  if (!steel) return 'CHECK: calculated reinforcement unavailable';
  return `${steel.numberOfBars} nos ${steel.diameter} mm dia @ ${steel.spacing} mm c/c; Ast ${Number(steel.area.toFixed(1))} mm²; ${Number(steel.weight.toFixed(2))} kg`;
}

function note(ws: ExcelJS.Worksheet, row: number): void {
  setCellValue(ws, row, 1, 'CHECK: calculated TYPE1 abutment result unavailable.');
  ws.getCell(row, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
}

export async function generateType1AbutmentDrawingSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-AbutMENT Drawing');
  setColumnWidths(ws, [6, 36, 18, 18]);
  setCellValue(ws, 1, 1, 'TYPE-1 ABUTMENT - GENERAL ARRANGEMENT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  const rows = [
    ['Abutment height', result.geometry.height, 'm'],
    ['Abutment width', result.geometry.width, 'm'],
    ['Abutment depth', result.geometry.depth, 'm'],
    ['Base width', result.geometry.baseWidth, 'm'],
    ['Base length', result.geometry.baseLength, 'm'],
    ['Dirt wall height', result.geometry.dirtWallHeight, 'm'],
    ['Return wall length', result.geometry.returnWallLength, 'm'],
  ];
  rows.forEach(([label, value, unit], index) => {
    setCellValue(ws, 3 + index, 1, label);
    setCellValue(ws, 3 + index, 2, value);
    setCellValue(ws, 3 + index, 3, unit);
  });
}

export async function generateType1StabilityCheckSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-STABILITY CHECK ABUTMENT');
  setColumnWidths(ws, [7, 30, 13, 13, 13, 12, 15, 12, 11, 9, 9, 9, 9, 9, 9]);
  setCellValue(ws, 1, 1, 'STABILITY CHECK FOR TYPE-1 ABUTMENT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, 'Rankine earth pressure; stability limits: sliding ≥ 1.5, overturning ≥ 1.8, bearing ≥ 2.5. All derived cells are live formulas.');
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 4);

  const r3 = (v: number): number => Number(v.toFixed(3));
  const actions = result.additionalActions;

  // A) Design parameters (inputs; everything derived links to these)
  setCellValue(ws, 4, 1, 'A) DESIGN PARAMETERS');
  ws.getCell(4, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  const param = (row: number, label: string, value: number | { formula: string; result: number }, unit: string): void => {
    setCellValue(ws, row, 1, label);
    setCellValue(ws, row, 2, value);
    setCellValue(ws, row, 3, unit);
  };
  param(5, 'Abutment width w', input.abutmentWidth, 'm');
  param(6, 'Abutment depth d', input.abutmentDepth, 'm');
  param(7, 'Abutment height H', input.abutmentHeight, 'm');
  param(8, 'Base width Bw', { formula: '=B5+1.5', result: r3(result.geometry.baseWidth) }, 'm');
  param(9, 'Base length Bl', { formula: '=B6+1', result: r3(result.geometry.baseLength) }, 'm');
  param(10, 'Soil friction angle φ', input.phi, 'deg');
  param(11, 'Soil unit weight γ', input.gamma, 'kN/m³');
  param(12, 'Safe bearing capacity SBC', input.sbc, 'kN/m²');
  param(13, 'Concrete volume', { formula: '=B5*B6*B7', result: r3(input.abutmentWidth * input.abutmentDepth * input.abutmentHeight) }, 'm³');
  param(14, 'Dead load DL (25 kN/m³)', { formula: '=B13*25', result: r3(input.abutmentWidth * input.abutmentDepth * input.abutmentHeight * 25) }, 'kN');
  param(15, 'Live load LL (deck reaction)', result.loads.liveLoad, 'kN');
  param(16, 'Earth pressure Ka', { formula: '=TAN((45-B10/2)*PI()/180)^2', result: Number(result.earthPressure.ka.toFixed(4)) }, '');
  param(17, 'Active force Pa', { formula: '=0.5*B16*B11*B7^2', result: r3(result.earthPressure.pa) }, 'kN');

  // C) Lateral actions (placed before the case table references are resolved by Excel
  // at read time; rows 30-38 sit under the table and feed columns L-O).
  setCellValue(ws, 30, 1, 'C) RETAINING & ENVIRONMENTAL ACTIONS');
  ws.getCell(30, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  param(31, 'Surcharge intensity q', actions.surchargeIntensity, 'kN/m²');
  param(32, 'Surcharge thrust = ka·q·H', { formula: '=B16*B31*B7', result: r3(actions.surchargeThrust) }, 'kN');
  param(33, 'Basic wind speed Vb', actions.basicWindSpeed, 'm/s');
  param(34, 'Design wind pressure Pz (k1k2k3 = 0.91)', { formula: '=0.6*(0.91*B33)^2/1000', result: Number(actions.designWindPressure.toFixed(4)) }, 'kN/m²');
  param(35, 'Wind force = Pz × Cf 1.3 × w × H', { formula: '=B34*1.3*B5*B7', result: r3(actions.windForce) }, 'kN');
  param(36, 'Seismic zone factor Z (IS:1893)', actions.seismicZoneFactor, '');
  param(37, 'Seismic coefficient Ah = (Z/2)×2.5/(R/I)', { formula: '=(B36/2)*2.5/(3/1.5)', result: Number(actions.seismicCoefficient.toFixed(4)) }, '');
  param(38, 'Seismic force = Ah × (DL + LL)', { formula: '=B37*(B14+B15)', result: r3(actions.seismicForce) }, 'kN');

  // B) Load cases — every numeric cell is a live formula
  setCellValue(ws, 19, 1, 'B) LOAD CASES');
  ws.getCell(19, 1).font = { bold: true, size: 11, color: { argb: 'FF1F496B' } };
  addTableHeader(ws, 20, [
    'Case',
    'Description',
    'V (kN)',
    'H (kN)',
    'M (kN-m)',
    'Sliding',
    'Overturning',
    'Bearing',
    'Status',
    'γ DL',
    'γ LL',
    'γ Ea',
    'γ Qs',
    'γ Wind',
    'γ Seis',
  ]);
  result.loadCases.forEach((loadCase, index) => {
    const row = 21 + index;
    addTableRow(ws, row, [
      loadCase.caseNumber,
      loadCase.description,
      { formula: `=J${row}*$B$14+K${row}*$B$15`, result: r3(loadCase.verticalForce) },
      { formula: `=L${row}*$B$17+M${row}*$B$32+N${row}*$B$35+O${row}*$B$38`, result: r3(loadCase.horizontalForce) },
      { formula: `=(L${row}*$B$17+M${row}*$B$32)*$B$7/3+(N${row}*$B$35+O${row}*$B$38)*$B$7/2`, result: r3(loadCase.moment) },
      { formula: `=0.5*C${row}/D${row}`, result: Number(loadCase.slidingFOS.toFixed(4)) },
      { formula: `=C${row}*B8/2/E${row}`, result: Number(loadCase.overturningFOS.toFixed(4)) },
      { formula: `=B12/(C${row}/(B8*B9))`, result: Number(loadCase.bearingFOS.toFixed(4)) },
      { formula: `=IF(AND(F${row}>=1.5,G${row}>=1.8,H${row}>=2.5),"SAFE","UNSAFE")`, result: loadCase.status },
      loadCase.deadLoadFactor,
      loadCase.liveLoadFactor,
      loadCase.earthPressureFactor ?? 0,
      loadCase.surchargeFactor ?? 0,
      loadCase.windLoadFactor,
      loadCase.seismicLoadFactor ?? 0,
    ]);
  });

  const row = 22 + result.loadCases.length;
  setCellValue(ws, row, 1, 'Earth pressure coefficient Ka');
  setCellFormula(ws, row, 2, '=B16', Number(result.earthPressure.ka.toFixed(4)));
  setCellValue(ws, row + 1, 1, 'Active earth force Pa');
  setCellFormula(ws, row + 1, 2, '=B17', r3(result.earthPressure.pa));
  setCellValue(ws, row + 1, 3, 'kN');
}

export async function generateType1FootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-ABUTMENT FOOTING DESIGN');
  setColumnWidths(ws, [6, 36, 18, 18]);
  setCellValue(ws, 1, 1, 'TYPE-1 ABUTMENT FOOTING DESIGN');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  setCellValue(ws, 3, 1, 'Base width');
  setCellValue(ws, 3, 2, result.geometry.baseWidth);
  setCellValue(ws, 3, 3, 'm');
  setCellValue(ws, 4, 1, 'Base length');
  setCellValue(ws, 4, 2, result.geometry.baseLength);
  setCellValue(ws, 4, 3, 'm');
  setCellValue(ws, 5, 1, 'Footing reinforcement');
  setCellValue(ws, 5, 2, steelText(result.reinforcement.footing));
}

export async function generateType1FootingStressSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1- Abut Footing STRESS');
  setColumnWidths(ws, [6, 34, 18, 18, 16]);
  setCellValue(ws, 1, 1, 'TYPE-1 ABUTMENT FOOTING STRESS');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  const T1 = `'TYPE1-STABILITY CHECK ABUTMENT'`;
  setCellValue(ws, 2, 1, 'Live-linked: vertical forces, base geometry and SBC are retrieved from the TYPE1 stability sheet; pressure = V / (Bw × Bl).');
  ws.getCell(2, 1).alignment = { wrapText: true };
  addTableHeader(ws, 4, ['Case', 'Description', 'Derived pressure (kN/m²)', 'SBC (kN/m²)', 'Status']);
  result.loadCases.forEach((loadCase, index) => {
    const row = 4 + index;
    const src = 21 + index;
    const pressure = loadCase.bearingFOS > 0 ? input.sbc / loadCase.bearingFOS : Number.NaN;
    addTableRow(ws, row, [
      { formula: `=${T1}!A${src}`, result: loadCase.caseNumber },
      { formula: `=${T1}!B${src}`, result: loadCase.description },
      { formula: `=${T1}!C${src}/(${T1}!$B$8*${T1}!$B$9)`, result: Number.isFinite(pressure) ? Number(pressure.toFixed(3)) : 'CHECK' },
      { formula: `=${T1}!$B$12`, result: input.sbc },
      { formula: `=IF(C${row}<=D${row},"SAFE","UNSAFE")`, result: pressure <= input.sbc ? 'SAFE' : 'UNSAFE' },
    ]);
  });
  setCellValue(ws, 11, 1, 'Note: pressure is derived from the calculated bearing FOS because a separate stress diagram result is not yet in the input contract.');
  ws.getCell(11, 1).alignment = { wrapText: true };
}

export async function generateType1SteelInAbutmentSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-STEEL IN ABUTMENT');
  setColumnWidths(ws, [6, 34, 18]);
  setCellValue(ws, 1, 1, 'REINFORCEMENT IN TYPE-1 ABUTMENT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  const steel = result.reinforcement;
  [
    ['Abutment body', steel.abutmentBody],
    ['Dirt wall', steel.dirtWall],
    ['Return wall', steel.returnWall],
    ['Footing', steel.footing],
    ['Abutment cap', steel.abutmentCap],
  ].forEach(([label, details], index) => {
    setCellValue(ws, 3 + index, 1, label);
    setCellValue(ws, 3 + index, 2, steelText(details as SteelDetails));
  });
}

export async function generateType1AbutmentCapSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-Abutment Cap');
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'TYPE-1 ABUTMENT CAP DESIGN');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  setCellValue(ws, 3, 1, 'Cap reinforcement');
  setCellValue(ws, 3, 2, steelText(result.reinforcement.abutmentCap));
  setCellValue(ws, 4, 1, 'Source geometry');
  setCellValue(ws, 4, 2, `${result.geometry.baseLength} m base length; detailed cap geometry review required`);
}

export async function generateType1DirtWallReinforcementSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT WALL REINFORCEMENT');
  setColumnWidths(ws, [6, 34, 18]);
  setCellValue(ws, 1, 1, 'TYPE-1 DIRT WALL REINFORCEMENT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  setCellValue(ws, 3, 1, 'Dirt wall height');
  setCellValue(ws, 3, 2, result.geometry.dirtWallHeight);
  setCellValue(ws, 3, 3, 'm');
  setCellValue(ws, 4, 1, 'Dirt wall reinforcement');
  setCellValue(ws, 4, 2, steelText(result.reinforcement.dirtWall));
}

export async function generateType1DirtDirectLoadBMSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT DirectLoad_BM');
  setColumnWidths(ws, [6, 40, 18, 18]);
  setCellValue(ws, 1, 1, 'TYPE-1 DIRT WALL - DIRECT LOAD SCREENING');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  const scale = result.geometry.height > 0 ? result.geometry.dirtWallHeight / result.geometry.height : 0;
  setCellValue(ws, 3, 1, 'Active earth force');
  setCellValue(ws, 3, 2, result.earthPressure.pa * scale);
  setCellValue(ws, 3, 3, 'kN');
  setCellValue(ws, 4, 1, 'Screening moment at H/3');
  setCellValue(ws, 4, 2, result.earthPressure.pa * scale * result.geometry.dirtWallHeight / 3);
  setCellValue(ws, 4, 3, 'kN-m');
  setCellValue(ws, 6, 1, 'Detailed dirt-wall load model is not yet represented in ProjectInput; engineer review required.');
  ws.getCell(6, 1).alignment = { wrapText: true };
}

export async function generateType1DirtLLBMSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT LL_BM');
  setColumnWidths(ws, [6, 40, 18, 18]);
  setCellValue(ws, 1, 1, 'TYPE-1 DIRT WALL - LIVE LOAD SCREENING');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  const liveLoad = result.loads.liveLoad;
  setCellValue(ws, 3, 1, 'Calculated live load');
  setCellValue(ws, 3, 2, liveLoad);
  setCellValue(ws, 3, 3, 'kN');
  setCellValue(ws, 4, 1, 'Screening live-load moment');
  setCellValue(ws, 4, 2, liveLoad * Math.max(result.geometry.dirtWallHeight, 0) / 3);
  setCellValue(ws, 4, 3, 'kN-m');
  setCellValue(ws, 6, 1, 'Detailed surcharge/load-placement model is not yet represented in ProjectInput; engineer review required.');
  ws.getCell(6, 1).alignment = { wrapText: true };
}
