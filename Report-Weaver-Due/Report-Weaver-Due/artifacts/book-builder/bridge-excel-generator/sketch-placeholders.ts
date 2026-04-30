/**
 * Phase 1 sketch sheets: merged placeholder text (instruction 5i). Phase 2 graphics only when client instructs.
 */

import ExcelJS from 'exceljs';
import { mergeCells } from './utils';

export const SKETCH_MANUAL_PLACEHOLDER =
  'Drawing to be inserted manually — ref Drawing D-01 / D-03 / D-05';

/** Merges a visible placeholder block; returns the next free row below the block. */
export function addSketchPlaceholderBlock(
  ws: ExcelJS.Worksheet,
  startRow: number,
  endCol: number,
  rowSpan = 2
): number {
  const endRow = startRow + rowSpan;
  mergeCells(ws, startRow, 1, endRow, endCol);
  const cell = ws.getCell(startRow, 1);
  cell.value = SKETCH_MANUAL_PLACEHOLDER;
  cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
  cell.font = { italic: true, size: 11 };
  return endRow + 2;
}
