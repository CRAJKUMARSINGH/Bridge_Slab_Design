/**
 * Sheet 19: LL-ABSTRACT
 *
 * This is a summary of the live-load values that are actually present in the
 * current calculation result. It deliberately does not invent an influence
 * line or tracked-vehicle envelope that is not part of ProjectInput yet.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';

export async function generateLLAbstractSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('LL-ABSTRACT');
  setColumnWidths(ws, [6, 34, 18, 18, 18, 18]);

  setCellValue(ws, 1, 1, 'LIVE LOAD ABSTRACT');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, `Project: ${input.projectName}`);
  setCellValue(ws, 3, 1, 'Source: calculated pier load cases; detailed influence-line data is not in the current input contract.');
  ws.getCell(3, 1).font = { italic: true, color: { argb: 'FF9C6500' } };

  let row = 5;
  addTableHeader(ws, row, ['S.No.', 'Load case', 'Live-load factor', 'Live load (kN)', 'Vertical force (kN)', 'Status']);
  row += 1;

  const pier = input.pier;
  if (!pier) {
    addTableRow(ws, row, [1, 'Calculation result unavailable', '', '', '', 'CHECK']);
    return;
  }

  for (const loadCase of pier.loadCases) {
    addTableRow(ws, row, [
      loadCase.caseNumber,
      loadCase.description,
      loadCase.liveLoadFactor,
      pier.loads.liveLoad * loadCase.liveLoadFactor,
      loadCase.verticalForce,
      loadCase.status,
    ]);
    row += 1;
  }

  row += 1;
  setCellValue(ws, row, 1, 'Review note');
  ws.getCell(row, 1).font = { bold: true };
  setCellValue(ws, row + 1, 1, 'A licensed engineer must confirm the adopted IRC live-load model, vehicle class, placement, impact factor, and influence-line envelope before this summary is used for design reliance.');
  ws.getCell(row + 1, 1).alignment = { wrapText: true, vertical: 'top' };
}
