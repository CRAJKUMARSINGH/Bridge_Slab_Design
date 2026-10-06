/**
 * SHEET 1: INDEX
 * Table of contents for all 46 sheets — bound to project input, not a sample river.
 */

import ExcelJS from 'exceljs';
import { ProjectInput } from '../types';
import { EXPECTED_SHEET_NAMES } from '../sheet-contract';
import { COLORS, setColumnWidths, mergeCells } from '../utils';

export async function generateIndexSheet(
  workbook: ExcelJS.Workbook,
  input: ProjectInput
): Promise<void> {
  const ws = workbook.addWorksheet('INDEX');

  setColumnWidths(ws, [8, 50, 10]);

  let row = 4;

  const river = input.riverName?.trim() || 'the project river';
  ws.getCell(row, 1).value = `DESIGN OF ${String(input.bridgeType ?? 'SUBMERSIBLE').toUpperCase()} BRIDGE ACROSS ${river.toUpperCase()}`;
  ws.getCell(row, 1).font = { bold: true, size: 14 };
  ws.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  mergeCells(ws, row, 1, row, 3);
  row += 2;

  ws.getCell(row, 1).value = `Name of work :- ${input.projectName}`;
  ws.getCell(row, 1).font = { bold: true, size: 11 };
  mergeCells(ws, row, 1, row, 3);
  row += 2;

  ws.getCell(row, 1).value = 'INDEX';
  ws.getCell(row, 1).font = { bold: true, size: 12 };
  row += 2;

  ws.getCell(row, 1).value = 'S.No';
  ws.getCell(row, 2).value = 'Particulars (workbook sheet)';
  ws.getCell(row, 3).value = 'Sheet';

  for (let col = 1; col <= 3; col++) {
    const cell = ws.getCell(row, col);
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.GRAY }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  row++;

  EXPECTED_SHEET_NAMES.forEach((entry, idx) => {
    ws.getCell(row, 1).value = idx + 1;
    ws.getCell(row, 2).value = entry;
    ws.getCell(row, 3).value = idx + 1;

    for (let col = 1; col <= 3; col++) {
      const cell = ws.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.alignment = {
        horizontal: col === 2 ? 'left' : 'center',
        vertical: 'middle'
      };
    }

    row++;
  });

  console.log('✓ Sheet 1: INDEX generated');
}
