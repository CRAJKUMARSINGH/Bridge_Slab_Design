/**
 * Excel Upload Parser
 * Reads uploaded Excel workbooks and extracts ProjectInput
 * Reverse-engineers the bridge design from existing Excel files
 */

import ExcelJS from 'exceljs';
import type { ProjectInput, CrossSectionPoint } from '../bridge-excel-generator/types';

export const MAX_UPLOAD_XLSX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_WORKSHEETS_SCANNED = 80;
const MAX_ROWS_SCANNED_PER_SHEET = 1000;
const MAX_COLS_SCANNED_PER_ROW = 200;
const MAX_METADATA_ENTRIES = 20000;

interface ParsedExcelResult {
  input: Partial<ProjectInput>;
  metadata: {
    sheetNames: string[];
    formulas: { sheet: string; cell: string; formula: string }[];
    values: { sheet: string; cell: string; value: unknown }[];
  };
}

export function isLikelyXlsxZip(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // ZIP signatures accepted by XLSX containers.
  const sig0 = buffer[0];
  const sig1 = buffer[1];
  const sig2 = buffer[2];
  const sig3 = buffer[3];
  const isZip =
    sig0 === 0x50 &&
    sig1 === 0x4b &&
    ((sig2 === 0x03 && sig3 === 0x04) ||
      (sig2 === 0x05 && sig3 === 0x06) ||
      (sig2 === 0x07 && sig3 === 0x08));
  return isZip;
}

/**
 * Parse uploaded Excel file into ProjectInput
 */
export async function parseExcelToProjectInput(buffer: Buffer): Promise<ParsedExcelResult> {
  if (buffer.length === 0) {
    throw new Error('Uploaded workbook is empty');
  }
  if (buffer.length > MAX_UPLOAD_XLSX_BYTES) {
    throw new Error(`Uploaded workbook exceeds ${MAX_UPLOAD_XLSX_BYTES} byte limit`);
  }
  if (!isLikelyXlsxZip(buffer)) {
    throw new Error('Uploaded file is not a valid XLSX container');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const sheetNames = workbook.worksheets.map(ws => ws.name);
  const formulas: ParsedExcelResult['metadata']['formulas'] = [];
  const values: ParsedExcelResult['metadata']['values'] = [];
  
  // Extract from HYDRAULICS sheet
  const hydraulicsSheet = workbook.getWorksheet('HYDRAULICS');
  const affluxSheet = workbook.getWorksheet('afflux calculation');
  const indexSheet = workbook.getWorksheet('INDEX');
  
  const result: Partial<ProjectInput> = {
    crossSectionData: []
  };
  
  // Try to extract project name from various sheets
  if (indexSheet) {
    const projectCell = indexSheet.getCell('B2');
    if (projectCell.value) {
      result.projectName = String(projectCell.value).replace('Name Of Work :- ', '').trim();
    }
  }
  
  if (hydraulicsSheet && !result.projectName) {
    const titleCell = hydraulicsSheet.getCell('A2');
    if (titleCell.value) {
      const title = String(titleCell.value);
      const match = title.match(/Name Of Work :- (.+?),/);
      if (match) result.projectName = match[1].trim();
    }
  }
  
  // Extract HFL from HYDRAULICS sheet
  if (hydraulicsSheet) {
    // HFL is typically in F4
    const hflCell = hydraulicsSheet.getCell('F4');
    if (hflCell.value && typeof hflCell.value === 'number') {
      result.hfl = hflCell.value;
    }
    
    // Extract cross-section data
    let row = 6; // Data typically starts at row 6
    while (row < 50) {
      const chainageCell = hydraulicsSheet.getCell(row, 1);
      const glCell = hydraulicsSheet.getCell(row, 2);
      
      if (!chainageCell.value || chainageCell.value === 'TOTAL') break;
      
      const chainage = typeof chainageCell.value === 'number' 
        ? chainageCell.value 
        : parseFloat(String(chainageCell.value));
      
      const gl = typeof glCell.value === 'number' 
        ? glCell.value 
        : parseFloat(String(glCell.value));
      
      if (!isNaN(chainage) && !isNaN(gl)) {
        result.crossSectionData!.push({ chainage, gl });
      }
      
      row++;
    }
    
    // Extract Manning's n
    for (let r = 1; r < 50; r++) {
      const cell = hydraulicsSheet.getCell(r, 2);
      if (cell.value === 'N' || cell.value === "Manning's n") {
        const nCell = hydraulicsSheet.getCell(r, 3);
        if (typeof nCell.value === 'number') {
          result.manningN = nCell.value;
        }
      }
    }
    
    // Extract bed slope
    for (let r = 1; r < 50; r++) {
      const cell = hydraulicsSheet.getCell(r, 2);
      if (cell.value && String(cell.value).includes('S')) {
        const sCell = hydraulicsSheet.getCell(r, 3);
        if (typeof sCell.value === 'number') {
          result.bedSlope = sCell.value;
        }
      }
    }
  }
  
  // Extract from afflux calculation sheet
  if (affluxSheet) {
    // Look for design discharge
    for (let r = 1; r < 100; r++) {
      for (let c = 1; c < 10; c++) {
        const cell = affluxSheet.getCell(r, c);
        if (cell.value && String(cell.value).toLowerCase().includes('discharge')) {
          const valCell = affluxSheet.getCell(r, c + 1);
          if (typeof valCell.value === 'number') {
            result.discharge = valCell.value;
          }
        }
      }
    }
  }
  
  // Collect all formulas and values for analysis
  const worksheets = workbook.worksheets.slice(0, MAX_WORKSHEETS_SCANNED);
  for (const ws of worksheets) {
    let rowCounter = 0;
    ws.eachRow((row, rowNumber) => {
      if (rowCounter >= MAX_ROWS_SCANNED_PER_SHEET) return;
      rowCounter++;
      let colCounter = 0;
      row.eachCell((cell, colNumber) => {
        if (colCounter >= MAX_COLS_SCANNED_PER_ROW) return;
        colCounter++;
        const colLetter = String.fromCharCode(64 + colNumber);
        const cellRef = `${colLetter}${rowNumber}`;
        
        if (cell.formula && formulas.length < MAX_METADATA_ENTRIES) {
          formulas.push({
            sheet: ws.name,
            cell: cellRef,
            formula: cell.formula
          });
        }
        
        if (
          cell.value !== undefined &&
          cell.value !== null &&
          values.length < MAX_METADATA_ENTRIES
        ) {
          values.push({
            sheet: ws.name,
            cell: cellRef,
            value: cell.value
          });
        }
      });
    });
  }
  
  return {
    input: result,
    metadata: {
      sheetNames,
      formulas,
      values
    }
  };
}

/**
 * Validate that extracted input can be used for design
 */
export function validateParsedInput(input: Partial<ProjectInput>): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    'projectName', 'hfl', 'bedLevel', 'spanLength', 
    'numberOfSpans', 'crossSectionData'
  ];
  
  const missing: string[] = [];
  const warnings: string[] = [];
  
  if (!input.projectName) missing.push('projectName');
  if (!input.hfl) missing.push('hfl (Highest Flood Level)');
  if (!input.crossSectionData || input.crossSectionData.length < 2) {
    missing.push('crossSectionData (minimum 2 points)');
  }
  
  if (!input.spanLength) warnings.push('spanLength not found, will use default');
  if (!input.numberOfSpans) warnings.push('numberOfSpans not found, will use default');
  if (!input.manningN) warnings.push('manningN not found, will use default (0.033)');
  if (!input.bedSlope) warnings.push('bedSlope not found, will use default');
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}
