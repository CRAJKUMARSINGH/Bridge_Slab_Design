/**
 * Sheet 10: abstract of stresses.
 *
 * Base pressure is derived from the same load-case result used by the
 * stability sheet. No independent sample cases are permitted here.
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import { addTableHeader, addTableRow, setColumnWidths, setCellValue } from '../utils';

export async function generateAbstractOfStressesSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('abstract of stresses');
  setColumnWidths(ws, [6, 32, 18, 18, 18, 18, 16]);
  setCellValue(ws, 1, 1, 'ABSTRACT OF STRESSES IN PIER');
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  setCellValue(ws, 2, 1, `Project: ${input.projectName}`);
  const pier = input.pier;
  if (!pier) {
    setCellValue(ws, 4, 1, 'CHECK: calculated pier result unavailable.');
    ws.getCell(4, 1).font = { bold: true, color: { argb: 'FF9C0006' } };
    return;
  }

  addTableHeader(ws, 4, ['Case', 'Load case', 'P (kN)', 'Moment (kN-m)', 'Derived pressure (kN/m²)', 'SBC (kN/m²)', 'Status']);
  pier.loadCases.forEach((loadCase, index) => {
    const row = 5 + index;
    const pressure = loadCase.bearingFOS > 0 ? input.sbc / loadCase.bearingFOS : Number.NaN;
    addTableRow(ws, row, [
      loadCase.caseNumber,
      loadCase.description,
      loadCase.verticalForce,
      loadCase.moment,
      pressure,
      input.sbc,
      pressure <= input.sbc ? loadCase.status : 'UNSAFE',
    ]);
  });

  setCellValue(ws, 12, 1, 'Note: the current result model exposes a one-axis stability moment and bearing FOS; a two-axis stress envelope requires additional approved input/result fields.');
  ws.getCell(12, 1).alignment = { wrapText: true };
}
