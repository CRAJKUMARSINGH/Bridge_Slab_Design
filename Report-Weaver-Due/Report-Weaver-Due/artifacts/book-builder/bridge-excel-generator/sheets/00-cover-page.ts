/**
 * COVER — workbook title block (first tab). Drawing exports align with Bridge GAD workflow (see DRAWINGS-SLOTS).
 */

import ExcelJS from 'exceljs';
import type { ProjectInput } from '../types';
import { COLORS, mergeCells, setColumnWidths, setCellValue } from '../utils';

export const BRIDGE_GAD_REFERENCE_REPO = 'https://github.com/CRAJKUMARSINGH/Bridge_GAD_Yogendra_Borse';

export async function generateCoverPageSheet(workbook: ExcelJS.Workbook, input: ProjectInput): Promise<void> {
  const ws = workbook.addWorksheet('COVER');
  setColumnWidths(ws, [6, 44, 44]);

  let row = 2;
  mergeCells(ws, row, 1, row, 3);
  const title = ws.getCell(row, 1);
  title.value = 'SUBMERSIBLE BRIDGE DESIGN WORKBOOK';
  title.font = { bold: true, size: 16 };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  row += 2;

  mergeCells(ws, row, 1, row, 3);
  const sub = ws.getCell(row, 1);
  sub.value = input.projectName?.trim() || 'Project title';
  sub.font = { bold: true, size: 12 };
  sub.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  row += 3;

  const lines: [string, string][] = [
    ['Location', input.location ?? '—'],
    ['River / waterway', input.riverName ?? '—'],
    ['Job / file no.', input.jobNumber?.trim() || '—'],
    ['Issuing authority / client', input.issuingAuthority?.trim() || '—'],
    ['Workbook generated', new Date().toISOString().slice(0, 10)]
  ];

  for (const [label, value] of lines) {
    setCellValue(ws, row, 1, label);
    ws.getCell(row, 1).font = { bold: true };
    mergeCells(ws, row, 2, row, 3);
    setCellValue(ws, row, 2, value);
    ws.getCell(row, 2).alignment = { wrapText: true, vertical: 'top' };
    row++;
  }

  row += 2;
  mergeCells(ws, row, 1, row + 3, 3);
  const note = ws.getCell(row, 1);
  note.value = [
    'Drawing package (GA, pier, abutment, supplementary): this Excel build carries calculation sheets and Phase-1 sketch placeholders.',
    `Production CAD exports (DXF / PDF / SVG) and multi-sheet GAD packages are produced in the tested Bridge GAD app — ${BRIDGE_GAD_REFERENCE_REPO}`,
    'Use sheet DRAWINGS-SLOTS to record filenames and revision status when linking workbook to external drawings.'
  ].join('\n\n');
  note.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  note.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.LIGHT_BG }
  };
}
