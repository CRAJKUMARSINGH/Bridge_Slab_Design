/**
 * DRAWINGS-SLOTS — register for Bridge GAD multi-sheet exports (DXF/PDF/SVG) and future drawing revisions.
 * Slot layout follows the tested Ultimate Bridge GAD Generator drawing package (4 primary sheets + expansion rows).
 */

import ExcelJS from 'exceljs';
import type { ProjectInput } from '../types';
import { COLORS, mergeCells, setColumnWidths, setCellValue } from '../utils';
import { BRIDGE_GAD_REFERENCE_REPO } from './00-cover-page';

type SlotRow = { slot: string; title: string; format: string; status: string; notes: string };

const PRIMARY_SLOTS: SlotRow[] = [
  {
    slot: 'GAD-1',
    title: 'General arrangement / key plan (Sheet 1)',
    format: 'DXF / PDF / SVG',
    status: 'Pending',
    notes: 'Generate in Bridge GAD — Drawing Generation tab'
  },
  {
    slot: 'GAD-2',
    title: 'Pier & substructure details (Sheet 2)',
    format: 'DXF / PDF / SVG',
    status: 'Pending',
    notes: 'Link export path here when issued'
  },
  {
    slot: 'GAD-3',
    title: 'Abutment & deck details (Sheet 3)',
    format: 'DXF / PDF / SVG',
    status: 'Pending',
    notes: 'Link export path here when issued'
  },
  {
    slot: 'GAD-4',
    title: 'Returns / dirt wall / supplementary (Sheet 4)',
    format: 'DXF / PDF / SVG',
    status: 'Pending',
    notes: 'Link export path here when issued'
  }
];

const EXPANSION_SLOTS: SlotRow[] = Array.from({ length: 4 }, (_, i) => ({
  slot: `EXP-${i + 1}`,
  title: '',
  format: '',
  status: 'Reserved',
  notes: 'Future expansion — additional GAD sheets or office CAD'
}));

export async function generateDrawingsSlotsSheet(workbook: ExcelJS.Workbook, _input: ProjectInput): Promise<void> {
  const ws = workbook.addWorksheet('DRAWINGS-SLOTS');
  setColumnWidths(ws, [10, 40, 16, 14, 36]);

  let row = 1;
  mergeCells(ws, row, 1, row, 5);
  const h = ws.getCell(row, 1);
  h.value = 'DRAWING PACKAGE REGISTER (Bridge GAD workflow)';
  h.font = { bold: true, size: 14 };
  h.alignment = { horizontal: 'center', vertical: 'middle' };
  row += 2;

  mergeCells(ws, row, 1, row, 5);
  const ref = ws.getCell(row, 1);
  ref.value = `Reference app (tested): ${BRIDGE_GAD_REFERENCE_REPO}`;
  ref.font = { size: 10, italic: true };
  ref.alignment = { wrapText: true, vertical: 'top' };
  row += 2;

  const headers = ['Slot', 'Drawing title', 'Format', 'Status', 'Notes / file path'];
  headers.forEach((text, i) => {
    const c = ws.getCell(row, i + 1);
    c.value = text;
    c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GRAY } };
    c.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  row++;

  const allRows = [...PRIMARY_SLOTS, ...EXPANSION_SLOTS];
  for (const s of allRows) {
    setCellValue(ws, row, 1, s.slot);
    setCellValue(ws, row, 2, s.title);
    setCellValue(ws, row, 3, s.format);
    setCellValue(ws, row, 4, s.status);
    setCellValue(ws, row, 5, s.notes);
    for (let col = 1; col <= 5; col++) {
      const cell = ws.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.alignment = { vertical: 'top', wrapText: true };
    }
    row++;
  }

  row += 1;
  mergeCells(ws, row, 1, row + 1, 5);
  const foot = ws.getCell(row, 1);
  foot.value =
    'Phase 1: calculation workbook + sketch placeholders on design sheets. Phase 2: embed or hyperlink CAD/PDF when client instructs. ' +
    'Use Export Manager in Bridge GAD for batch DXF/PDF/SVG.';
  foot.font = { italic: true, size: 10 };
  foot.alignment = { wrapText: true, vertical: 'top' };
}
