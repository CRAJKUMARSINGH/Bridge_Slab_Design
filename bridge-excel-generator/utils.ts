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
 * Read a cell's value with its TRUE cached formula result.
 *
 * ExcelJS rebuilds formula cells through `_copyModel`, whose `if (value)` guard
 * drops falsy keys — so a cached result of 0 or FALSE vanishes from `cell.value`
 * and `cell.text` renders empty, even though the .xlsx stores `<v>0</v>`.
 * Anything reading a generated workbook (previews, reports, auditors) must go
 * through this helper or it will show a raw formula string where a number is.
 */
export function readCellValue(cell: ExcelJS.Cell): any {
  const v = cell.value;
  if (v && typeof v === 'object' && 'formula' in v && (v as any).result === undefined) {
    const raw = (cell as any).model?.result;
    if (raw !== undefined) return { ...(v as object), formula: (v as any).formula, result: raw };
  }
  return v;
}

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

/** Alias kept for 56-sheet book generators — same signature as styleSubheader. */
export const addSubheader = styleSubheader;

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

// ---------------------------------------------------------------------------
// Excel dropdown (data-validation list) helper — comma-safe.
//
// The naive pattern `formula1 = '"a,b,c"'` silently breaks when any option
// itself contains a comma, double-quote or equals sign:
//   • commas in values get misinterpreted by Excel as list separators
//   • unescaped quotes cause ExcelJS / Excel to write the option as blank
//   • leading '=' are treated as a formula and #NAME? appears
//
// This helper:
//   1. Escapes any embedded `"` → `""` inside each option
//   2. Refuses to inline options where ANY option contains ',' or exceeds
//      255 chars — instead it writes the options to a hidden scratch sheet
//      (one per workbook, lazily created) and returns a range reference.
//      This is the OOXML standard's preferred approach for complex lists.
//   3. Prefix-strips a leading '=' / '@' / '+' so a text option can never
//      be reinterpreted as a formula when the user clicks the dropdown.
// ---------------------------------------------------------------------------

const DROPDOWN_SHEET_NAME = '__BridgeCAD_Dropdowns';

export interface DropdownOptions {
  /** Allow inline comma-containing options by forcing a range-backed list. */
  forceRange?: boolean;
  /** Optional prefix for the scratch-sheet column name (keeps columns grouped). */
  group?: string;
}

export interface DropdownResult {
  formula1: string;
  /** True when options were persisted to the scratch sheet instead of inlined. */
  usedRange: boolean;
  /** Sheet-qualified address if usedRange, else empty string. */
  rangeAddress: string;
}

function sanitizeDropdownToken(token: string): string {
  const t = String(token ?? '');
  const escaped = t.replace(/"/g, '""');
  if (/^[=+@-]/.test(escaped)) return `'${escaped}`;
  return escaped;
}

export function addDropdownList(
  workbook: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  address: string,
  options: readonly string[],
  opts: DropdownOptions = {},
): DropdownResult {
  const sanitized = options.map(sanitizeDropdownToken);
  const anyComma = sanitized.some((s) => s.includes(','));
  const anyLong = sanitized.some((s) => s.length > 255);
  const totalInlinable = sanitized.reduce((n, s) => n + s.length + 1, 0);
  const useRange = Boolean(opts.forceRange) || anyComma || anyLong || totalInlinable > 220;

  let formula1: string;
  let usedRange = false;
  let rangeAddress = '';

  if (!useRange) {
    formula1 = `"${sanitized.join(',')}"`;
  } else {
    let scratch = workbook.getWorksheet(DROPDOWN_SHEET_NAME);
    if (!scratch) {
      scratch = workbook.addWorksheet(DROPDOWN_SHEET_NAME, { properties: { tabColor: { argb: 'FF999999' } } });
      scratch.state = 'veryHidden';
    }
    const prefix = opts.group ? `${opts.group}_` : '';
    const headerValue = prefix + 'options_index';
    let col = -1;
    // Scan header row 1 to see if this group already has a home column; reuse if so.
    const headerRow = scratch.getRow(1);
    const lastCol = scratch.lastColumn?.number ?? 0;
    for (let c = 1; c <= lastCol; c += 1) {
      if (String(headerRow.getCell(c).value ?? '') === headerValue) {
        col = c;
        break;
      }
    }
    if (col < 0) {
      col = lastCol + 2; // leave 1 blank column between groups for readability
      scratch.getCell(1, col).value = headerValue;
    }
    let row = 2;
    for (const opt of sanitized) {
      scratch.getCell(row, col).value = opt;
      row += 1;
    }
    const top = `${columnToLetter(col)}2`;
    const bot = `${columnToLetter(col)}${Math.max(row - 1, 2)}`;
    rangeAddress = `'${DROPDOWN_SHEET_NAME}'!${top}:${bot}`;
    formula1 = rangeAddress;
    usedRange = true;
  }

  ws.getCell(address).dataValidation = {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: 'BridgeCAD — Invalid selection',
    error: 'Please select a value from the dropdown list.',
    formulae: [formula1],
  } as any;

  return { formula1, usedRange, rangeAddress };
}

// ---------------------------------------------------------------------------
// Excel Named Range helpers.
//
// A workbook built with raw `'PIER STABILITY'!B16` references will silently
// break if someone inserts a row above B16. Excel's "Defined Names" are the
// canonical fix — a name points at a `Sheet!$A$1` address and Excel updates
// the address automatically on insert/delete. This module provides:
//
//   • defineName(workbook, name, ref) — register a global name
//   • nameRef(name)                   — returns the `=NAME` formula string
//
// Naming convention (BridgeCAD local standard):
//   Sheet-level stable outputs: `<SHEET_CODE>_<FIELD>` e.g. PS__DWL for
//     Pier Stability DWL, AB1_PIERW for Type1 Abutment pier width
//   Shared input parameters: `IN_<FIELD>` e.g. IN_PROJECT_CODE
//   Scratch / lookup columns: `LOOKUP_<SCOPE>_<KEY>`
//
// Callers should call defineName *right after* writing the value to a cell so
// the address is known at the moment of definition.
// ---------------------------------------------------------------------------

export interface NameDefinition {
  name: string;
  ref: string;
  comment?: string;
}

/**
 * ExcelJS 4.4 `workbook.definedNames` is positional (`add(ref, name)`), not the
 * `{name, formula}` object this helper used to pass, and it has no `find`.
 * A re-`add` of an existing name *extends* its range list instead of replacing it,
 * so every prior range has to be removed first or the name stops being scalar.
 * ExcelJS also cannot attach a comment to a defined name; `opts.comment` documents
 * the name for readers of this source only.
 */
function replaceName(
  workbook: ExcelJS.Workbook,
  name: string,
  ref: string,
): void {
  const dn = workbook.definedNames;
  for (const previous of dn.getRanges(name).ranges) {
    dn.remove(previous, name);
  }
  dn.add(ref, name);
}

export function defineName(
  workbook: ExcelJS.Workbook,
  name: string,
  sheetName: string,
  row: number,
  col: number,
  opts: { comment?: string; sheetLocal?: boolean } = {},
): string {
  const ref = `'${sheetName}'!$${columnToLetter(col)}$${row}`;
  replaceName(workbook, name, ref);
  return ref;
}

export function defineNameRange(
  workbook: ExcelJS.Workbook,
  name: string,
  sheetName: string,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  opts: { comment?: string } = {},
): string {
  const ref =
    `'${sheetName}'!$${columnToLetter(startCol)}$${startRow}:$${columnToLetter(endCol)}$${endRow}`;
  replaceName(workbook, name, ref);
  return ref;
}

/** Escape token that downstream formulae can rely on. */
export function nameRef(name: string): string {
  return name;
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
  addSectionDivider,
  addDropdownList,
  defineName,
  defineNameRange,
  nameRef,
};
