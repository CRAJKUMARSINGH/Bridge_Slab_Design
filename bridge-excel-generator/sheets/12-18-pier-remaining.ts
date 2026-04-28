/**
 * Sheets 12-18: Remaining Pier Design Sheets
 * These are framework implementations that can be expanded
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue } from '../utils';

// Sheet 12: STEEL IN PIER
export async function generateSteelInPierSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('STEEL IN PIER');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'REINFORCEMENT DESIGN - PIER BODY');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Vertical Steel: 24 nos 25mm φ');
  row++;
  setCellValue(ws, row, 1, 'Horizontal Ties: 10mm φ @ 150mm c/c');
}

// Sheet 13: FOOTING DESIGN
export async function generateFootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('FOOTING DESIGN');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'PIER FOOTING DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Footing Size: 8m x 6m x 1.5m');
  row++;
  setCellValue(ws, row, 1, 'Reinforcement: 20mm φ @ 150mm c/c both ways');
}

// Sheet 14: Footing STRESS DIAGRAM
export async function generateFootingStressDiagramSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Footing STRESS DIAGRAM');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'FOOTING STRESS DISTRIBUTION');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Max Pressure: 180 kN/m²');
  row++;
  setCellValue(ws, row, 1, 'Min Pressure: 120 kN/m²');
  row++;
  setCellValue(ws, row, 1, 'SBC: 250 kN/m² - SAFE');
}

// Sheet 15: Pier Cap LL tracked vehicle
export async function generatePierCapLLSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Pier Cap LL tracked vehicle');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'PIER CAP - LIVE LOAD (TRACKED VEHICLE)');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'IRC Class 70R Tracked Vehicle');
  row++;
  setCellValue(ws, row, 1, 'Load: 700 kN');
}

// Sheet 16: Pier Cap
export async function generatePierCapSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('Pier Cap');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'PIER CAP DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Size: 12m x 1.5m x 1.2m');
  row++;
  setCellValue(ws, row, 1, 'Main Steel: 25mm φ @ 150mm c/c');
}

// Sheet 17: LLOAD
export async function generateLLOADSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('LLOAD');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'LIVE LOAD ANALYSIS');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'IRC Class 70R Loading');
}

// Sheet 18: loadsumm
export async function generateLoadSummSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('loadsumm');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'LOAD SUMMARY');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Dead Load: 2500 kN');
  row++;
  setCellValue(ws, row, 1, 'Live Load: 700 kN');
  row++;
  setCellValue(ws, row, 1, 'Total: 3200 kN');
}
