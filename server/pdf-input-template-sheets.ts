/**
 * Renders the three Excel INPUT template tabs (A–H) into jsPDF — shared by the short design PDF
 * and the comprehensive PDF so “workbook sample” parity stays in one place.
 */

import { jsPDF } from 'jspdf';
import type { ProjectInput } from '../bridge-excel-generator/types';
import {
  buildInputHydraulicsSheet,
  buildInputPierSheet,
  buildInputAbutmentSheet,
  type WbCellStyle,
  type WbRow,
} from '../shared/input-workbook-previews';

const DARK_BLUE: [number, number, number] = [31, 73, 107];
const DARK_TEXT: [number, number, number] = [50, 50, 50];
const INPUT_WB_BLUE: [number, number, number] = [0, 102, 204];

function wbMergedFill(style: WbCellStyle): [number, number, number] {
  switch (style) {
    case 'title':
      return [230, 243, 255];
    case 'section':
      return [240, 248, 255];
    case 'instr':
      return [248, 248, 248];
    case 'plain':
      return [252, 252, 252];
    default:
      return [255, 255, 255];
  }
}

function wbDataCellFill(style: WbCellStyle | undefined): [number, number, number] {
  switch (style) {
    case 'in-yellow':
      return [255, 255, 153];
    case 'in-red':
      return [255, 230, 230];
    case 'calc':
      return [230, 255, 230];
    case 'hdr-grey':
      return [224, 224, 224];
    default:
      return [255, 255, 255];
  }
}

function drawInputWorkbookSheetModel(
  doc: jsPDF,
  model: { tab: string; rows: WbRow[] },
  M: number,
  PW: number,
  PH: number,
  startY: number,
): void {
  const CW = PW - 2 * M;
  const RN = 6;
  const W8 = (CW - RN) / 8;
  const rowH = 3.9;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  let y = startY;

  const ensureSpace = (need: number) => {
    if (y + need > PH - 12) {
      doc.addPage();
      y = M;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(130, 130, 130);
      doc.text(`${model.tab} (continued)`, M, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_TEXT);
    }
  };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_BLUE);
  doc.text(`${model.tab} — INPUT workbook sample (A–H)`, M, y);
  y += 6;

  ensureSpace(6);
  doc.setFillColor(217, 217, 217);
  doc.setDrawColor(191, 191, 191);
  let x = M;
  doc.rect(x, y, RN, 4.5, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text('#', x + RN - 0.5, y + 3, { align: 'right' });
  x += RN;
  for (let i = 0; i < 8; i++) {
    doc.rect(x, y, W8, 4.5, 'FD');
    doc.text(letters[i], x + W8 / 2, y + 3, { align: 'center' });
    x += W8;
  }
  y += 4.5;

  let lineNo = 1;

  for (const row of model.rows) {
    if (row.kind === 'merged') {
      if (row.text === '') {
        ensureSpace(2.2);
        doc.setFillColor(252, 252, 252);
        doc.setDrawColor(191, 191, 191);
        doc.rect(M, y, CW, 1.8, 'FD');
        y += 1.8;
        lineNo++;
        continue;
      }
      const maxW = CW - RN - 2;
      const isTitle = row.style === 'title';
      const isSection = row.style === 'section';
      const isInstr = row.style === 'instr';
      doc.setFontSize(isTitle ? 7.5 : isInstr ? 5.5 : 6.5);
      doc.setFont('helvetica', isTitle || isSection ? 'bold' : isInstr ? 'italic' : 'normal');
      const chunks = doc.splitTextToSize(row.text, maxW);
      const textH = isInstr ? 2.05 : 2.45;
      const blockH = Math.max(rowH, 1.2 + chunks.length * textH);
      ensureSpace(blockH + 1);
      const [fr, fg, fb] = wbMergedFill(row.style);
      doc.setFillColor(fr, fg, fb);
      doc.setDrawColor(191, 191, 191);
      doc.rect(M, y, RN, blockH, 'FD');
      doc.rect(M + RN, y, CW - RN, blockH, 'FD');
      if (isTitle || isSection) doc.setTextColor(...INPUT_WB_BLUE);
      else if (isInstr) doc.setTextColor(80, 80, 80);
      else doc.setTextColor(...DARK_TEXT);
      doc.setFontSize(6);
      doc.text(String(lineNo), M + RN - 0.5, y + rowH - 1.0, { align: 'right' });
      let ty = y + 2.3;
      doc.setFontSize(isTitle ? 7.5 : isInstr ? 5.5 : 6.5);
      doc.setFont('helvetica', isTitle || isSection ? 'bold' : isInstr ? 'italic' : 'normal');
      for (const ln of chunks) {
        if (isTitle || isSection) doc.setTextColor(...INPUT_WB_BLUE);
        else if (isInstr) doc.setTextColor(80, 80, 80);
        else doc.setTextColor(...DARK_TEXT);
        doc.text(ln, M + RN + 1, ty);
        ty += textH;
      }
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_TEXT);
      y += blockH;
      lineNo++;
      continue;
    }

    ensureSpace(rowH + 1);
    x = M;
    doc.setDrawColor(191, 191, 191);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, RN, rowH, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(...DARK_TEXT);
    doc.text(String(lineNo), x + RN - 0.5, y + 2.6, { align: 'right' });
    x += RN;

    for (let ci = 0; ci < 8; ci++) {
      const txt = row.cells[ci];
      const st = row.styles?.[ci];
      const [r, g, b] = wbDataCellFill(st);
      doc.setFillColor(r, g, b);
      doc.rect(x, y, W8, rowH, 'FD');
      const chunk = txt.length > 36 ? `${txt.slice(0, 34)}…` : txt;
      const isHdr = st === 'hdr-grey';
      const isCalc = st === 'calc';
      doc.setFontSize(isHdr ? 5.8 : isCalc ? 5.5 : 6);
      if (isCalc) doc.setTextColor(0, 85, 35);
      else doc.setTextColor(...DARK_TEXT);
      const numericLike = /^-?[\d.]+([eE][+-]?\d+)?$/.test(txt.trim());
      doc.text(chunk, x + (numericLike ? W8 - 0.5 : 0.5), y + 2.5, {
        align: numericLike ? 'right' : 'left',
        maxWidth: W8 - 1,
      });
      x += W8;
    }
    doc.setTextColor(...DARK_TEXT);
    y += rowH;
    lineNo++;
  }
}

/** @returns Number of PDF pages added (each INPUT tab starts on a new page; continuations count). */
export function drawWbInputTemplateSheets(
  doc: jsPDF,
  projectInput: ProjectInput,
  M: number,
  PW: number,
  PH: number,
): number {
  const startPages = doc.getNumberOfPages();
  const models = [
    buildInputHydraulicsSheet(projectInput),
    buildInputPierSheet(projectInput),
    buildInputAbutmentSheet(projectInput),
  ];
  for (const model of models) {
    doc.addPage();
    drawInputWorkbookSheetModel(doc, model, M, PW, PH, M);
  }
  return doc.getNumberOfPages() - startPages;
}
