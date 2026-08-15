/**
 * Sheets 12-18: data-driven pier design views.
 *
 * These sheets intentionally consume the calculated PierDesignResult. They do
 * not contain representative dimensions, loads, or reinforcement values.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput, PierDesignResult, SteelDetails } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';

function pierOrReview(input: EnhancedProjectInput): PierDesignResult | undefined {
  return input.pier;
}

function steelText(steel: SteelDetails | undefined): string {
  if (!steel) return 'CHECK: calculated reinforcement unavailable';
  return `${steel.numberOfBars} nos ${steel.diameter} mm dia @ ${steel.spacing} mm c/c; Ast ${steel.area} mm²; ${steel.weight} kg`;
}

function addMissingResultNote(ws: ExcelJS.Worksheet, row: number): void {
  setCellValue(ws, row, 1, 'CHECK: this sheet requires the calculated pier result and cannot be issued independently.');
  ws.getCell(row, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
  ws.getCell(row, 1).alignment = { wrapText: true };
}

export async function generateSteelInPierSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN PIER');
  setColumnWidths(ws, [6, 34, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'REINFORCEMENT DESIGN - PIER BODY');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Main reinforcement');
  setCellValue(ws, 3, 2, steelText(pier.reinforcement.mainSteel));
  setCellValue(ws, 4, 1, 'Links / ties');
  setCellValue(ws, 4, 2, steelText(pier.reinforcement.linkSteel));
  setCellValue(ws, 5, 1, 'Pier geometry');
  setCellValue(ws, 5, 2, `${pier.geometry.width} m × ${pier.geometry.length} m × ${pier.geometry.depth} m`);
}

export async function generateFootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('FOOTING DESIGN');
  setColumnWidths(ws, [6, 34, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER FOOTING DESIGN');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Footing length');
  setCellValue(ws, 3, 2, pier.footing.length);
  setCellValue(ws, 3, 3, 'm');
  setCellValue(ws, 4, 1, 'Footing width');
  setCellValue(ws, 4, 2, pier.footing.width);
  setCellValue(ws, 4, 3, 'm');
  setCellValue(ws, 5, 1, 'Footing thickness');
  setCellValue(ws, 5, 2, pier.footing.thickness);
  setCellValue(ws, 5, 3, 'm');
  setCellValue(ws, 6, 1, 'Reinforcement');
  setCellValue(ws, 6, 2, steelText(pier.footing.reinforcement));
}

export async function generateFootingStressDiagramSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Footing STRESS DIAGRAM');
  setColumnWidths(ws, [6, 24, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER FOOTING STRESS DISTRIBUTION');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'S.No.');
  setCellValue(ws, 3, 2, 'Position');
  setCellValue(ws, 3, 3, 'Pressure (kN/m²)');
  setCellValue(ws, 3, 4, 'SBC (kN/m²)');
  setCellValue(ws, 3, 5, 'Status');
  for (let i = 0; i < pier.footing.basePressure.distribution.length; i += 1) {
    const row = 4 + i;
    const pressure = pier.footing.basePressure.distribution[i];
    addTableRow(ws, row, [
      i + 1,
      i === 0 ? 'Max edge' : i === pier.footing.basePressure.distribution.length - 1 ? 'Min edge' : 'Base section',
      pressure,
      input.sbc,
      pressure <= input.sbc ? 'SAFE' : 'UNSAFE',
    ]);
  }
}

export async function generatePierCapLLSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Pier Cap LL tracked vehicle');
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER CAP - LIVE LOAD SUMMARY');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Live load carried by calculated pier model');
  setCellValue(ws, 3, 2, pier.loads.liveLoad);
  setCellValue(ws, 3, 3, 'kN');
  setCellValue(ws, 5, 1, 'Vehicle class / placement');
  setCellValue(ws, 5, 2, 'Not supplied in ProjectInput; engineering review required');
  ws.getCell(5, 2).font = { color: { argb: 'FF9C6500' } };
}

export async function generatePierCapSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('Pier Cap');
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'PIER CAP DESIGN');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Cap length');
  setCellValue(ws, 3, 2, pier.pierCap.length);
  setCellValue(ws, 3, 3, 'm');
  setCellValue(ws, 4, 1, 'Cap width');
  setCellValue(ws, 4, 2, pier.pierCap.width);
  setCellValue(ws, 4, 3, 'm');
  setCellValue(ws, 5, 1, 'Cap thickness');
  setCellValue(ws, 5, 2, pier.pierCap.thickness);
  setCellValue(ws, 5, 3, 'm');
  setCellValue(ws, 6, 1, 'Reinforcement');
  setCellValue(ws, 6, 2, steelText(pier.pierCap.reinforcement));
}

export async function generateLLOADSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('LLOAD');
  setColumnWidths(ws, [6, 34, 18, 18, 18]);
  setCellValue(ws, 1, 1, 'LIVE LOAD ANALYSIS');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  addTableHeader(ws, 3, ['S.No.', 'Load case', 'Live-load factor', 'Live load (kN)', 'Status']);
  pier.loadCases.forEach((loadCase, index) => {
    addTableRow(ws, 4 + index, [
      loadCase.caseNumber,
      loadCase.description,
      loadCase.liveLoadFactor,
      pier.loads.liveLoad * loadCase.liveLoadFactor,
      loadCase.status,
    ]);
  });
}

export async function generateLoadSummSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('loadsumm');
  setColumnWidths(ws, [6, 34, 18, 18]);
  setCellValue(ws, 1, 1, 'LOAD SUMMARY');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  const pier = pierOrReview(input);
  if (!pier) return addMissingResultNote(ws, 3);
  setCellValue(ws, 3, 1, 'Dead load');
  setCellValue(ws, 3, 2, pier.loads.deadLoad);
  setCellValue(ws, 3, 3, 'kN');
  setCellValue(ws, 4, 1, 'Live load');
  setCellValue(ws, 4, 2, pier.loads.liveLoad);
  setCellValue(ws, 4, 3, 'kN');
  setCellValue(ws, 5, 1, 'Hydrostatic force');
  setCellValue(ws, 5, 2, pier.loads.hydrostaticForce);
  setCellValue(ws, 5, 3, 'kN');
  setCellValue(ws, 6, 1, 'Drag force');
  setCellValue(ws, 6, 2, pier.loads.dragForce);
  setCellValue(ws, 6, 3, 'kN');
  setCellValue(ws, 7, 1, 'Buoyancy');
  setCellValue(ws, 7, 2, pier.loads.buoyancy);
  setCellValue(ws, 7, 3, 'kN');
}
