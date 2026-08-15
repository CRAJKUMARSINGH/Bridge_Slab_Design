/**
 * UTILITY FUNCTIONS FOR EXCEL GENERATION
 * Common patterns and helpers
 */

import ExcelJS from 'exceljs';

// ==================== COLORS ====================
export const COLORS = {
  PRIMARY: 'FF365070',      // Dark blue
  HEADER: 'FF1F496B',       // Darker blue
  SUBHEADER: 'FF4472C4',    // Blue
  LIGHT_BG: 'FFECF0F1',     // Light gray
  LIGHT_BLUE: 'FFDDE8F5',   // Very light blue
  WHITE: 'FFFFFFFF',
  SUCCESS: 'FF27AE60',      // Green
  WARNING: 'FFF39C12',      // Orange
  GRAY: 'FFD3D3D3'          // Gray for headers
};

// ==================== BORDERS ====================
export const BORDERS = {
  thin: {
    style: 'thin' as const,
    color: { argb: 'FF000000' }
  },
  medium: {
    style: 'medium' as const,
    color: { argb: 'FF365070' }
  }
};

// ==================== CELL FORMATTING ====================

/**
 * Set cell value with formula
 */
export function setCellFormula(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  formula: string,
  result?: number | string
) {
  const cell = ws.getCell(row, col);
  cell.value = { formula, result };
}

/**
 * Set cell value (static)
 */
export function setCellValue(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: any
) {
  ws.getCell(row, col).value = value;
}

/**
 * Merge cells
 */
export function mergeCells(
  ws: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
) {
  const startCell = columnToLetter(startCol) + startRow;
  const endCell = columnToLetter(endCol) + endRow;
  ws.mergeCells(`${startCell}:${endCell}`);
}

/**
 * Convert column number to letter (1 = A, 2 = B, etc.)
 */
export function columnToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Style header row
 */
export function styleHeader(
  ws: ExcelJS.Worksheet,
  row: number,
  text: string,
  startCol: number = 1,
  endCol: number = 8
) {
  const cell = ws.getCell(row, startCol);
  cell.value = text;
  cell.font = { bold: true, size: 12, color: { argb: COLORS.WHITE } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.PRIMARY }
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Apply to all cells in range
  for (let col = startCol; col <= endCol; col++) {
    const c = ws.getCell(row, col);
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.PRIMARY }
    };
    c.font = { bold: true, size: 12, color: { argb: COLORS.WHITE } };
    c.border = {
      top: BORDERS.thin,
      bottom: BORDERS.thin,
      left: BORDERS.thin,
      right: BORDERS.thin
    };
  }
  
  mergeCells(ws, row, startCol, row, endCol);
}

/**
 * Style subheader
 */
export function styleSubheader(
  ws: ExcelJS.Worksheet,
  row: number,
  text: string,
  startCol: number = 1,
  endCol: number = 4
) {
  const cell = ws.getCell(row, startCol);
  cell.value = text;
  cell.font = { bold: true, size: 11, color: { argb: COLORS.PRIMARY } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
  
  mergeCells(ws, row, startCol, row, endCol);
}

/**
 * Add calculation row (label = value unit)
 */
export function addCalcRow(
  ws: ExcelJS.Worksheet,
  row: number,
  label: string,
  value: string | number | { formula: string; result?: any },
  unit: string = '',
  highlighted: boolean = false
): number {
  // Column A: Empty
  ws.getCell(row, 1).value = '';
  
  // Column B: Label (bold)
  ws.getCell(row, 2).value = label;
  ws.getCell(row, 2).font = { bold: true };
  
  // Column C: Equals sign
  ws.getCell(row, 3).value = '=';
  
  // Column D: Value (formula or static)
  if (typeof value === 'object' && 'formula' in value) {
    ws.getCell(row, 4).value = value;
  } else {
    ws.getCell(row, 4).value = value;
  }
  
  // Column E: Unit
  ws.getCell(row, 5).value = unit;
  
  // Apply borders and alignment
  for (let col = 1; col <= 5; col++) {
    const cell = ws.getCell(row, col);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    
    if (highlighted) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.LIGHT_BLUE }
      };
    }
  }
  
  return row + 1;
}

/**
 * Add table header row
 */
export function addTableHeader(
  ws: ExcelJS.Worksheet,
  row: number,
  headers: string[]
) {
  headers.forEach((header, idx) => {
    const cell = ws.getCell(row, idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.GRAY }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: BORDERS.thin,
      bottom: BORDERS.thin,
      left: BORDERS.thin,
      right: BORDERS.thin
    };
  });
}

/**
 * Add table data row
 */
export function addTableRow(
  ws: ExcelJS.Worksheet,
  row: number,
  values: (string | number | { formula: string; result?: any })[]
) {
  values.forEach((value, idx) => {
    const cell = ws.getCell(row, idx + 1);
    
    if (typeof value === 'object' && 'formula' in value) {
      cell.value = value;
    } else {
      cell.value = value;
    }
    
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

/**
 * Set column widths
 */
export function setColumnWidths(
  ws: ExcelJS.Worksheet,
  widths: number[]
) {
  widths.forEach((width, idx) => {
    ws.getColumn(idx + 1).width = width;
  });
}

/**
 * Set row height
 */
export function setRowHeight(
  ws: ExcelJS.Worksheet,
  row: number,
  height: number
) {
  ws.getRow(row).height = height;
}

/**
 * Add title
 */
export function addTitle(
  ws: ExcelJS.Worksheet,
  row: number,
  text: string,
  size: number = 14,
  startCol: number = 1,
  endCol: number = 8
) {
  const cell = ws.getCell(row, startCol);
  cell.value = text;
  cell.font = { bold: true, size, color: { argb: COLORS.PRIMARY } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  if (endCol > startCol) {
    mergeCells(ws, row, startCol, row, endCol);
  }
}

/**
 * Add project header (common to many sheets)
 */
export function addProjectHeader(
  ws: ExcelJS.Worksheet,
  projectName: string,
  startRow: number = 1
): number {
  let row = startRow;
  
  // Row 1: Main title
  addTitle(ws, row, 'DESIGN OF SUBMERSIBLE BRIDGE', 14);
  row++;
  
  // Row 2: Project name
  ws.getCell(row, 1).value = `Name Of Work :- ${projectName}`;
  mergeCells(ws, row, 1, row, 8);
  row++;
  
  return row;
}

/**
 * Format number to fixed decimals
 */
export function formatNumber(value: number, decimals: number = 2): number {
  return parseFloat(value.toFixed(decimals));
}

/**
 * Create cell reference (e.g., "A1", "B5")
 */
export function cellRef(row: number, col: number): string {
  return `${columnToLetter(col)}${row}`;
}

/**
 * Create range reference (e.g., "A1:B5")
 */
export function rangeRef(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): string {
  return `${cellRef(startRow, startCol)}:${cellRef(endRow, endCol)}`;
}

/**
 * Add empty rows
 */
export function addEmptyRows(
  ws: ExcelJS.Worksheet,
  startRow: number,
  count: number
): number {
  for (let i = 0; i < count; i++) {
    setRowHeight(ws, startRow + i, 15);
  }
  return startRow + count;
}

/**
 * Add section divider
 */
export function addSectionDivider(
  ws: ExcelJS.Worksheet,
  row: number,
  text: string
): number {
  ws.getCell(row, 1).value = text;
  ws.getCell(row, 1).font = { bold: true, size: 11, color: { argb: COLORS.PRIMARY } };
  ws.getCell(row, 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.LIGHT_BG }
  };
  mergeCells(ws, row, 1, row, 8);
  return row + 1;
}

// Export all utilities
export default {
  COLORS,
  BORDERS,
  setCellFormula,
  setCellValue,
  mergeCells,
  columnToLetter,
  styleHeader,
  styleSubheader,
  addCalcRow,
  addTableHeader,
  addTableRow,
  setColumnWidths,
  setRowHeight,
  addTitle,
  addProjectHeader,
  formatNumber,
  cellRef,
  rangeRef,
  addEmptyRows,
  addSectionDivider
};
