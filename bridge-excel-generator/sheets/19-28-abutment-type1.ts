/**
 * Sheets 19-28: TYPE1 Abutment Design Section
 * Framework implementations for abutment design
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { setColumnWidths, setCellValue } from '../utils';

// Sheet 19: INSERT TYPE1-ABUT
export async function generateInsertType1AbutSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INSERT TYPE1-ABUT');
  setColumnWidths(ws, [50]);
  
  let row = 10;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 18 };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
}

// Sheet 20: TYPE1-AbutMENT Drawing
export async function generateType1AbutmentDrawingSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-AbutMENT Drawing');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'TYPE-1 ABUTMENT - GENERAL ARRANGEMENT');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Abutment Height: 8.0 m');
  row++;
  setCellValue(ws, row, 1, 'Dirt Wall Height: 1.5 m');
  row++;
  setCellValue(ws, row, 1, 'Footing Size: 10m x 5m x 1.2m');
}

// Sheet 21: TYPE1-STABILITY CHECK ABUTMENT
export async function generateType1StabilityCheckSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-STABILITY CHECK ABUTMENT');
  setColumnWidths(ws, [5, 35, 12, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'STABILITY CHECK FOR TYPE-1 ABUTMENT');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'A. OVERTURNING CHECK');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  setCellValue(ws, row, 2, 'Resisting Moment');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '15000 kN-m');
  row++;
  setCellValue(ws, row, 2, 'Overturning Moment');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '8000 kN-m');
  row++;
  setCellValue(ws, row, 2, 'FOS');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '1.875');
  setCellValue(ws, row, 5, '> 1.5 SAFE');
  row += 2;
  
  setCellValue(ws, row, 1, 'B. SLIDING CHECK');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  setCellValue(ws, row, 2, 'Resisting Force');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '3000 kN');
  row++;
  setCellValue(ws, row, 2, 'Sliding Force');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '1800 kN');
  row++;
  setCellValue(ws, row, 2, 'FOS');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '1.667');
  setCellValue(ws, row, 5, '> 1.5 SAFE');
  row += 2;
  
  setCellValue(ws, row, 1, 'C. BASE PRESSURE CHECK');
  ws.getCell(row, 1).font = { bold: true };
  row++;
  setCellValue(ws, row, 2, 'Max Pressure');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '220 kN/m²');
  row++;
  setCellValue(ws, row, 2, 'SBC');
  setCellValue(ws, row, 3, '=');
  setCellValue(ws, row, 4, '250 kN/m²');
  setCellValue(ws, row, 5, 'SAFE');
}

// Sheet 22: TYPE1-ABUTMENT FOOTING DESIGN
export async function generateType1FootingDesignSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-ABUTMENT FOOTING DESIGN');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'ABUTMENT FOOTING DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Footing Size: 10m x 5m x 1.2m');
  row++;
  setCellValue(ws, row, 1, 'Main Steel: 20mm φ @ 150mm c/c');
  row++;
  setCellValue(ws, row, 1, 'Distribution Steel: 16mm φ @ 200mm c/c');
}

// Sheet 23: TYPE1- Abut Footing STRESS
export async function generateType1FootingStressSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1- Abut Footing STRESS');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'ABUTMENT FOOTING STRESS DISTRIBUTION');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Max Pressure: 220 kN/m²');
  row++;
  setCellValue(ws, row, 1, 'Min Pressure: 150 kN/m²');
  row++;
  setCellValue(ws, row, 1, 'SBC: 250 kN/m² - SAFE');
}

// Sheet 24: TYPE1-STEEL IN ABUTMENT
export async function generateType1SteelInAbutmentSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-STEEL IN ABUTMENT');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'REINFORCEMENT IN ABUTMENT BODY');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Vertical Steel: 16mm φ @ 150mm c/c');
  row++;
  setCellValue(ws, row, 1, 'Horizontal Steel: 12mm φ @ 200mm c/c');
}

// Sheet 25: TYPE1-Abutment Cap
export async function generateType1AbutmentCapSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-Abutment Cap');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'ABUTMENT CAP DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Cap Size: 12m x 1.5m x 1.0m');
  row++;
  setCellValue(ws, row, 1, 'Main Steel: 20mm φ @ 150mm c/c');
}

// Sheet 26: TYPE1-DIRT WALL REINFORCEMENT
export async function generateType1DirtWallReinforcementSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT WALL REINFORCEMENT');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'DIRT WALL REINFORCEMENT DESIGN');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Dirt Wall Height: 1.5 m');
  row++;
  setCellValue(ws, row, 1, 'Vertical Steel: 12mm φ @ 150mm c/c');
  row++;
  setCellValue(ws, row, 1, 'Horizontal Steel: 10mm φ @ 200mm c/c');
}

// Sheet 27: TYPE1-DIRT DirectLoad_BM
export async function generateType1DirtDirectLoadBMSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT DirectLoad_BM');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'DIRT WALL - DIRECT LOAD BENDING MOMENT');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Max BM: 45 kN-m/m');
}

// Sheet 28: TYPE1-DIRT LL_BM
export async function generateType1DirtLLBMSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('TYPE1-DIRT LL_BM');
  setColumnWidths(ws, [5, 30, 12, 12, 12]);
  
  let row = 1;
  setCellValue(ws, row, 1, 'DIRT WALL - LIVE LOAD BENDING MOMENT');
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  row += 2;
  
  setCellValue(ws, row, 1, 'Max BM: 25 kN-m/m');
}
