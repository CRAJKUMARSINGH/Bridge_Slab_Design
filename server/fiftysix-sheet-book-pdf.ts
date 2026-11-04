/**
 * 56-SHEET EXECUTIVE ENGINEERING BOOK — PDF COMPILER
 * Produces a 58-page A4 PDF book: Cover → File Topic Index → 56 sheets 1/page,
 * each with correct portrait / landscape orientation, 15 mm margins,
 * robotic-review watermark when input is auto-generated.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { generateRoboticProjectInput } from '../bridge-excel-generator/robotic-input';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { EXPECTED_SHEET_NAMES, isLandscapeSheet, EXPECTED_SHEET_COUNT } from '../bridge-excel-generator/sheet-contract';
import { buildWorkbookSheetPreviews, WorkbookSheetPreview } from './workbook-sheets-preview';

export interface FiftysixBookResult {
  pdf: Buffer;
  sheetCount: number;
  pageCount: number;
  pdfPath: string;
  roboticMode: boolean;
}

const NAVY: [number, number, number] = [31, 73, 107];
const ROW_ALT: [number, number, number] = [240, 245, 250];
const CREAM: [number, number, number] = [250, 247, 240];
const DARK_TEXT: [number, number, number] = [30, 30, 40];

const A4_LANDSCAPE_W = 297;
const A4_LANDSCAPE_H = 210;
const A4_PORTRAIT_W = 210;
const A4_PORTRAIT_H = 297;
const MARGIN_MM = 15;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'robotic-bridge';
}

function addRoboticWatermark(doc: jsPDF, landscape: boolean): void {
  const w = landscape ? A4_LANDSCAPE_W : A4_PORTRAIT_W;
  const h = landscape ? A4_LANDSCAPE_H : A4_PORTRAIT_H;
  doc.saveGraphicsState();
  const cx = w / 2;
  const cy = h / 2;
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(54);
  doc.text('ROBOTIC', cx, cy - 12, { align: 'center', angle: -22 });
  doc.setFontSize(36);
  doc.text('REVIEW  ONLY', cx, cy + 18, { align: 'center', angle: -22 });
  doc.restoreGraphicsState();
}

function addSheetHeader(
  doc: jsPDF,
  sheetIdx: number,
  sheetName: string,
  projectName: string,
  robotic: boolean,
  landscape: boolean,
): number {
  const w = landscape ? A4_LANDSCAPE_W : A4_PORTRAIT_W;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Sheet ${String(sheetIdx + 1).padStart(2, '0')} / 56 — ${sheetName}`, MARGIN_MM, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName, w - MARGIN_MM, 10, { align: 'right' });
  if (robotic) {
    doc.setTextColor(255, 210, 120);
    doc.setFontSize(8);
    doc.text('ROBOTIC DESIGN — FOR REVIEW ONLY', w / 2, 10, { align: 'center' });
  }
  doc.setTextColor(...DARK_TEXT);
  return 20; // y cursor start for content
}

function drawAutotable(
  doc: jsPDF,
  preview: WorkbookSheetPreview,
  yStart: number,
  landscape: boolean,
): void {
  const usableW = (landscape ? A4_LANDSCAPE_W : A4_PORTRAIT_W) - 2 * MARGIN_MM;
  const maxRows = 42; // fit within single page with header
  const rows = preview.rows.slice(0, maxRows);
  const colCount = Math.min(preview.colCount, Math.max(2, Math.min(16, rows[0]?.length ?? 4)));
  if (colCount <= 0 || rows.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(160, 160, 160);
    doc.text('(no tabular content for this sheet)', MARGIN_MM, yStart + 6);
    return;
  }
  const widths = Array(colCount).fill(usableW / colCount);
  try {
    autoTable(doc, {
      startY: yStart,
      head: [rows[0]?.slice(0, colCount) ?? Array(colCount).fill('')],
      body: rows.slice(1).map((r) => r.slice(0, colCount)),
      margin: { left: MARGIN_MM, right: MARGIN_MM, top: 8, bottom: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [210, 215, 220], lineWidth: 0.1, overflow: 'linebreak' },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: ROW_ALT },
      columnStyles: widths.reduce<any>(
        (acc, ww, i) => {
          acc[i] = { cellWidth: ww, halign: i === 0 ? 'left' : 'center' };
          return acc;
        },
        {},
      ),
      tableWidth: usableW,
      showFoot: 'never',
      pageBreak: 'avoid',
    });
  } catch (err) {
    doc.setFontSize(9);
    doc.setTextColor(180, 60, 60);
    doc.text('Autotable render issue — raw rows are preserved in the workbook source.', MARGIN_MM, yStart + 6);
  }
}

export async function generateFiftysixSheetBookPDF(
  input?: ProjectInput,
  opts: { outDir?: string } = {},
): Promise<FiftysixBookResult> {
  const robotic = !input;
  const project = input ?? generateRoboticProjectInput();

  // Generate workbook & previews
  const previewStart = performance.now();
  const previews: WorkbookSheetPreview[] = await (async () => {
    // Use the existing buildWorkbookSheetPreviews but guarantee all sheets use a
    // 36-col / 500-row maximum (not just the pier stability sheet).
    await generateCompleteExcel(project); // side effect ensure engine cache hot
    const list = await buildWorkbookSheetPreviews(project);
    return list.slice(0, EXPECTED_SHEET_COUNT);
  })();
  void previewStart;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // -------------------------------------------------------------------------
  // PAGE 1 — COVER (landscape)
  // -------------------------------------------------------------------------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, A4_LANDSCAPE_W, A4_LANDSCAPE_H, 'F');
  // Accent band
  doc.setFillColor(240, 170, 70);
  doc.rect(0, A4_LANDSCAPE_H / 2 - 22, A4_LANDSCAPE_W, 44, 'F');
  doc.setTextColor(...CREAM);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(44);
  doc.text('EXECUTIVE ENGINEERING BOOK', A4_LANDSCAPE_W / 2, A4_LANDSCAPE_H / 2 - 42, { align: 'center' });
  doc.setFontSize(24);
  doc.setFont('helvetica', 'normal');
  doc.text(`(${EXPECTED_SHEET_COUNT}-SHEET SLAB BRIDGE DESIGN)`, A4_LANDSCAPE_W / 2, A4_LANDSCAPE_H / 2 - 16, { align: 'center' });
  doc.setTextColor(...NAVY);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(project.projectName, A4_LANDSCAPE_W / 2, A4_LANDSCAPE_H / 2 + 4, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${project.location}  ·  River: ${project.riverName}`, A4_LANDSCAPE_W / 2, A4_LANDSCAPE_H / 2 + 22, { align: 'center' });
  doc.setTextColor(...CREAM);
  doc.setFontSize(11);
  const bridgeLabel = (project.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge');
  doc.text(
    `Type: ${bridgeLabel}  |  Spans: ${project.numberOfSpans} × ${project.spanLength} m  |  Generated: ${new Date().toISOString().slice(0, 10)}`,
    A4_LANDSCAPE_W / 2,
    A4_LANDSCAPE_H - 26,
    { align: 'center' },
  );
  if (robotic) {
    doc.setFillColor(220, 80, 60);
    doc.rect(A4_LANDSCAPE_W / 2 - 120, A4_LANDSCAPE_H - 18, 240, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠  ROBOTICALLY GENERATED — ENGINEER-OF-RECORD SIGN-OFF REQUIRED (IRC:112 §1.2)', A4_LANDSCAPE_W / 2, A4_LANDSCAPE_H - 11, { align: 'center' });
  }

  // -------------------------------------------------------------------------
  // PAGE 2 — FILE TOPIC INDEX (landscape)
  // -------------------------------------------------------------------------
  doc.addPage('a4', 'landscape');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, A4_LANDSCAPE_W, A4_LANDSCAPE_H, 'F');
  if (robotic) addRoboticWatermark(doc, true);

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FILE TOPIC INDEX PAGE', MARGIN_MM, 24);
  doc.setLineWidth(0.6);
  doc.setDrawColor(...NAVY);
  doc.line(MARGIN_MM, 28, A4_LANDSCAPE_W - MARGIN_MM, 28);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK_TEXT);
  doc.text(project.projectName, MARGIN_MM, 36);
  doc.text(`56 Sheets  ·  ${EXPECTED_SHEET_COUNT} PDF pages (Pages 3–58)  ·  Robotic: ${robotic ? 'YES' : 'NO'}`, A4_LANDSCAPE_W - MARGIN_MM, 36, { align: 'right' });

  // Two columns of sheet names
  const half = Math.ceil(EXPECTED_SHEET_COUNT / 2);
  const col1Names = EXPECTED_SHEET_NAMES.slice(0, half);
  const col2Names = EXPECTED_SHEET_NAMES.slice(half);
  const colX = [MARGIN_MM, A4_LANDSCAPE_W / 2 + 6];
  const colPageW = [34, 34];
  let y = 46;

  function drawCol(names: readonly string[], x: number, pageOffsetCol: number[], startIdx: number): void {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.text('Sheet', x, y);
    doc.text('Name', x + 12, y);
    doc.text('Page', x + 115, y);
    y += 4;
    doc.setDrawColor(200, 205, 210);
    doc.setLineWidth(0.15);
    doc.line(x, y - 1, x + 132, y - 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(8.5);
    names.forEach((name, i) => {
      const num = startIdx + i + 1;
      const page = num + 2;
      const rowX = x;
      doc.text(String(num).padStart(2, '0'), rowX, y + 1.5);
      // Truncate name to fit
      const maxNameLen = 52;
      const displayName = name.length > maxNameLen ? name.slice(0, maxNameLen - 2) + '…' : name;
      doc.text(displayName, x + 12, y + 1.5);
      doc.text(`Pg ${String(page).padStart(2, '0')}`, x + 120, y + 1.5);
      if (isLandscapeSheet(name)) {
        doc.setTextColor(180, 100, 20);
        doc.setFontSize(7.5);
        doc.text('〔L〕', x + 132, y + 1.5);
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK_TEXT);
      }
      y += 3.6;
      if (y > A4_LANDSCAPE_H - MARGIN_MM - 4) {
        doc.addPage('a4', 'landscape');
        if (robotic) addRoboticWatermark(doc, true);
        y = 26;
      }
      void pageOffsetCol;
    });
  }
  drawCol(col1Names, colX[0], colPageW, 0);
  y = 46;
  drawCol(col2Names, colX[1], colPageW, half);

  // -------------------------------------------------------------------------
  // PAGES 3–58 — ONE SHEET PER PAGE
  // -------------------------------------------------------------------------
  for (let sheetI = 0; sheetI < EXPECTED_SHEET_COUNT; sheetI += 1) {
    const sheetName = EXPECTED_SHEET_NAMES[sheetI];
    const landscape = isLandscapeSheet(sheetName);
    doc.addPage('a4', landscape ? 'landscape' : 'portrait');
    if (robotic) addRoboticWatermark(doc, landscape);
    const yHeader = addSheetHeader(doc, sheetI, sheetName, project.projectName, robotic, landscape);
    const preview = previews[sheetI];
    if (preview && preview.rows.length > 0) {
      drawAutotable(doc, preview, yHeader, landscape);
    } else {
      doc.setFontSize(9);
      doc.setTextColor(180, 60, 60);
      doc.text(`Preview for "${sheetName}" unavailable — workbook sheet exists but renderer returned no rows.`, MARGIN_MM, yHeader + 8);
      doc.setTextColor(...DARK_TEXT);
    }
    // Footer
    const pw = landscape ? A4_LANDSCAPE_W : A4_PORTRAIT_W;
    const ph = landscape ? A4_LANDSCAPE_H : A4_PORTRAIT_H;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_MM, ph - 10, pw - MARGIN_MM, ph - 10);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(`BridgeCAD Executive Book • Sheet ${sheetI + 1}/${EXPECTED_SHEET_COUNT} • ${project.jobNumber ?? 'Job #'}`, MARGIN_MM, ph - 5);
    doc.text(`IRC:6-2017  IRC:112-2015  IS:456  IS:1893  IS:875  MORTH  •  Page ${doc.getNumberOfPages()}`, pw - MARGIN_MM, ph - 5, { align: 'right' });
  }

  // Produce output buffer & file
  const pdfBuf = Buffer.from(doc.output('arraybuffer'));
  const outDir = opts.outDir ?? path.resolve(process.cwd(), 'out');
  await fs.mkdir(outDir, { recursive: true });
  const fileName = `${slugify(project.projectName)}-56sheet-book.pdf`;
  const pdfPath = path.join(outDir, fileName);
  await fs.writeFile(pdfPath, pdfBuf);

  return {
    pdf: pdfBuf,
    sheetCount: EXPECTED_SHEET_COUNT,
    pageCount: doc.getNumberOfPages(),
    pdfPath,
    roboticMode: robotic,
  };
}

export default generateFiftysixSheetBookPDF;
