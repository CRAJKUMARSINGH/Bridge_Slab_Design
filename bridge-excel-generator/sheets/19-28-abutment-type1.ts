/**
 * Sheets 20-28: TYPE1 abutment design views.
 *
 * Values come from AbutmentDesignResult. When a detailed result is absent the
 * sheet reports CHECK instead of emitting a representative sample design.
 */

import ExcelJS from 'exceljs';
import type { AbutmentDesignResult, EnhancedProjectInput, SteelDetails } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';

function abutmentOrReview(input: EnhancedProjectInput): AbutmentDesignResult | undefined {
  return input.abutmentType1;
}

function steelText(steel: SteelDetails | undefined): string {
  if (!steel) return 'CHECK: calculated reinforcement unavailable';
  return `${steel.numberOfBars} nos ${steel.diameter} mm dia @ ${steel.spacing} mm c/c; Ast ${steel.area} mm²; ${steel.weight} kg`;
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
  setColumnWidths(ws, [6, 34, 16, 16, 16, 16]);
  setCellValue(ws, 1, 1, 'STABILITY CHECK FOR TYPE-1 ABUTMENT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const result = abutmentOrReview(input);
  if (!result) return note(ws, 3);
  addTableHeader(ws, 3, ['Case', 'Description', 'Sliding FOS', 'Overturning FOS', 'Bearing FOS', 'Status']);
  result.loadCases.forEach((loadCase, index) => {
    addTableRow(ws, 4 + index, [
      loadCase.caseNumber,
      loadCase.description,
      loadCase.slidingFOS,
      loadCase.overturningFOS,
      loadCase.bearingFOS,
      loadCase.status,
    ]);
  });
  const row = 6 + result.loadCases.length;
  setCellValue(ws, row, 1, 'Earth pressure coefficient Ka');
  setCellValue(ws, row, 2, result.earthPressure.ka);
  setCellValue(ws, row + 1, 1, 'Active earth force Pa');
  setCellValue(ws, row + 1, 2, result.earthPressure.pa);
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
  addTableHeader(ws, 3, ['Case', 'Description', 'Derived pressure (kN/m²)', 'SBC (kN/m²)', 'Status']);
  result.loadCases.forEach((loadCase, index) => {
    const pressure = loadCase.bearingFOS > 0 ? input.sbc / loadCase.bearingFOS : Number.NaN;
    addTableRow(ws, 4 + index, [
      loadCase.caseNumber,
      loadCase.description,
      pressure,
      input.sbc,
      pressure <= input.sbc ? 'SAFE' : 'UNSAFE',
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
