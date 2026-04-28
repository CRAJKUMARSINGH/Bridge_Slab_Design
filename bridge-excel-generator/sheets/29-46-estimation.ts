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
  
  let row = 5;
  setCellValue(ws, row, 1, 'TECHNICAL NOTE');
  ws.getCell(row, 1).font = { bold: true, size: 16 };
  ws.getCell(row, 1).alignment = { horizontal: 'center' };
  row += 3;
  
  setCellValue(ws, row, 1, 'This bridge design has been prepared as per:');
  row++;
  setCellValue(ws, row, 1, '• IRC:6-2017 (Loads and Stresses)');
  row++;
  setCellValue(ws, row, 1, '• IRC:112-2015 (Concrete Bridge Code)');
  row++;
  setCellValue(ws, row, 1, '• IRC:78-1983 (Foundation Design)');
  row++;
  setCellValue(ws, row, 1, '• IRC:SP-13 (Hydraulic Design)');
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
