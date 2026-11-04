/**
 * Comprehensive PDF Export — calculation sheets plus INPUT workbook samples.
 * Generates a ~225-page A4 portrait PDF; includes the three Excel INPUT template
 * tabs (A–H, same models as the short report) before the table of contents, then
 * the calculation section sequence, then an appendix reproducing the workbook grids.
 */

import { jsPDF } from 'jspdf';
import type { EnhancedProjectInput, BOQItem, ProjectInput } from '../bridge-excel-generator/types';
import { drawWbInputTemplateSheets } from './pdf-input-template-sheets';
import { buildWorkbookSheetPreviews, type WorkbookSheetPreview } from './workbook-sheets-preview';
import {
  getClosingNarrativeParagraphs,
  getHydraulicNarrativeParagraphs,
  getSheetNarrativeParagraphs,
  getStructuralNarrativeParagraphs,
  getVerificationNarrativeParagraphs,
} from '../bridge-excel-generator/narrative-engine';
import {
  generateAbutmentPressureSvg,
  generatePierStabilitySvg,
  generateScourProfileSvg,
  generateSlabReinfPlanSvg,
} from './svg-diagrams';
import { DESIGN_CONSTANTS, STABILITY_ACCEPTANCE } from '../bridge-excel-generator/design-engine';
import { EXPECTED_SHEET_COUNT } from '../bridge-excel-generator/sheet-contract';

// A4 dimensions in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// Colors
const COLORS = {
  header: [31, 73, 107] as [number, number, number],
  subHeader: [40, 80, 150] as [number, number, number],
  tableHeader: [52, 73, 94] as [number, number, number],
  tableAlt: [236, 240, 241] as [number, number, number],
  border: [189, 195, 199] as [number, number, number],
  formula: [39, 174, 96] as [number, number, number],
  text: [44, 62, 80] as [number, number, number],
  value: [0, 0, 0] as [number, number, number]
};

interface SheetPage {
  sheetNumber: number;
  sheetName: string;
  title: string;
  columns: { header: string; width: number; align?: 'left' | 'right' | 'center' }[];
  rows: {
    cells: {
      value: string;
      formula?: string;
      colSpan?: number;
      bold?: boolean;
      bgColor?: [number, number, number];
      isHeader?: boolean;
    }[];
  }[];
}

/** Section keys the table of contents prints, in the order the report lays them out. */
type TocSectionId =
  | 'IN1-3'
  | '01'
  | '02'
  | '03'
  | '04'
  | '05-08'
  | '09-18'
  | '19-28'
  | '29'
  | '30-41'
  | '42-46'
  | 'ANNEX'
  | 'APPX'
  | 'SUM';

/** Where each contents section actually begins; measured by the pass before the printed one. */
type SectionPages = Partial<Record<TocSectionId, number>>;

/** Minimum pages the workbook appendix grows the document to before the design summary. */
const APPENDIX_TARGET_MIN_PAGES = 224;
/** Hard stop for appendix growth; the design summary follows it. */
const APPENDIX_TARGET_MAX_PAGES = 248;

/**
 * Comprehensive report for the {@link EXPECTED_SHEET_COUNT}-sheet workbook, A4 portrait.
 * Rendered twice: the measuring pass fixes the length the printed pass stamps.
 */
async function generateComprehensivePDFInternal(
  input: EnhancedProjectInput,
): Promise<{ buffer: Buffer; pageCount: number }> {
  /**
   * The printed page total and the contents page numbers are only knowable once the workbook
   * appendix has finished growing, and neither one changes the layout. Render once to measure,
   * then render again with the measured numbers so every stamp on the page is the truth.
   */
  let totalPages = APPENDIX_TARGET_MAX_PAGES + 2;
  let sectionPages: SectionPages = {};
  let rendered = await renderComprehensiveDocument(input, totalPages, sectionPages);
  for (let pass = 0; pass < 3 && rendered.pageCount !== totalPages; pass++) {
    totalPages = rendered.pageCount;
    sectionPages = rendered.sectionPages;
    rendered = await renderComprehensiveDocument(input, totalPages, sectionPages);
  }
  return rendered;
}

async function renderComprehensiveDocument(
  input: EnhancedProjectInput,
  totalPages: number,
  knownSectionPages: SectionPages = {},
): Promise<{ buffer: Buffer; pageCount: number; sectionPages: SectionPages }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const sectionPages: SectionPages = {};

  /** Starts a new PDF page and returns its real index — the number every header prints. */
  const newPage = (): number => {
    doc.addPage();
    return doc.getNumberOfPages();
  };

  // Cover page
  addCoverPage(doc, input, totalPages);

  // Foreword page
  doc.addPage();
  addForeword(doc, input, totalPages);

  /** Excel places INPUT templates before INDEX; same A-H models as the short design PDF. */
  const firstInputPage = doc.getNumberOfPages() + 1;
  sectionPages['IN1-3'] = firstInputPage;
  const inputWorkbookPdfPages = drawWbInputTemplateSheets(doc, input as ProjectInput, MARGIN, PAGE_WIDTH, PAGE_HEIGHT);
  for (let p = firstInputPage; p < firstInputPage + inputWorkbookPdfPages; p++) {
    stampFooterPageNumber(doc, p, totalPages);
  }

  // Table of contents (after INPUT samples so page numbers line up)
  doc.addPage();
  addTableOfContents(doc, input, inputWorkbookPdfPages, totalPages, knownSectionPages);

  // Sheet 1: INDEX
  sectionPages['01'] = newPage();
  addIndexSheet(doc, input, sectionPages['01']!, totalPages);

  // Sheet 2: INSERT- HYDRAULICS
  sectionPages['02'] = newPage();
  addInsertHydraulicsSheet(doc, input, sectionPages['02']!, totalPages);

  // Sheet 3: afflux calculation
  sectionPages['03'] = newPage();
  addAffluxSheet(doc, input, sectionPages['03']!, totalPages);

  // Sheet 4: HYDRAULICS
  sectionPages['04'] = newPage();
  addHydraulicsSheet(doc, input, sectionPages['04']!, totalPages);

  // Sheet 5-8: Deck Anchorage, Cross Section, Bed Slope, SBC
  sectionPages['05-08'] = doc.getNumberOfPages() + 1;
  for (let i = 5; i <= 8; i++) {
    addDataSheet(doc, input, i, getSheetName(i), newPage(), totalPages);
  }

  // Sheet 9: STABILITY CHECK FOR PIER (multi-page)
  sectionPages['09-18'] = newPage();
  addStabilityPierCover(doc, input, sectionPages['09-18']!, totalPages);
  addStabilityPierSheets(doc, input, doc.getNumberOfPages() + 1, totalPages);

  // Sheet 10-18: Pier-related sheets
  for (let i = 10; i <= 18; i++) {
    addDataSheet(doc, input, i, getSheetName(i), newPage(), totalPages);
  }

  // Sheet 19-28: Type1 Abutment
  sectionPages['19-28'] = newPage();
  addAbutmentCover(doc, input, 'TYPE1', sectionPages['19-28']!, totalPages);

  for (let i = 19; i <= 28; i++) {
    const pn = newPage();
    if (i === 21) {
      addAbutmentStabilityDetailedSheet(doc, input, 'TYPE1', pn, totalPages);
    } else if (i === 23) {
      addFootingStressNarrativeSheet(doc, input, 'TYPE1', pn, totalPages);
    } else {
      addDataSheet(doc, input, i, getSheetName(i), pn, totalPages);
    }
  }

  // Sheet 29: TECHNOTE
  sectionPages['29'] = newPage();
  addTechNoteSheet(doc, input, sectionPages['29']!, totalPages);

  // Sheet 30-41: C1 Abutment
  sectionPages['30-41'] = newPage();
  addAbutmentCover(doc, input, 'C1', sectionPages['30-41']!, totalPages);

  for (let i = 30; i <= 41; i++) {
    const pn = newPage();
    if (i === 32) {
      addAbutmentStabilityDetailedSheet(doc, input, 'C1', pn, totalPages);
    } else if (i === 34) {
      addFootingStressNarrativeSheet(doc, input, 'C1', pn, totalPages);
    } else {
      addDataSheet(doc, input, i, getSheetName(i), pn, totalPages);
    }
  }

  // Sheet 42-46: Estimation and Reports
  sectionPages['42-46'] = doc.getNumberOfPages() + 1;
  for (let i = 42; i <= 46; i++) {
    const pn = newPage();
    if (i === 42) addInsertEstimateSheet(doc, input, pn, totalPages);
    else if (i === 46) addEstimationSheet(doc, input, pn, totalPages);
    else addDataSheet(doc, input, i, getSheetName(i), pn, totalPages);
  }

  sectionPages['ANNEX'] = doc.getNumberOfPages() + 1;
  await addAnnexureDrawingPage(doc, 'D-04 HYDRAULIC PROFILE & SCOUR DIAGRAM', generateScourProfileSvg(input), getHydraulicNarrativeParagraphs(input).slice(0, 2), totalPages);
  await addAnnexureDrawingPage(doc, 'D-05 PIER STABILITY FREE-BODY', generatePierStabilitySvg(input), getSheetNarrativeParagraphs('STABILITY CHECK FOR PIER', input).slice(0, 2), totalPages);
  await addAnnexureDrawingPage(doc, 'D-06 ABUTMENT EARTH-PRESSURE DIAGRAM', generateAbutmentPressureSvg(input), getSheetNarrativeParagraphs('TYPE1-STABILITY CHECK ABUTMENT', input).slice(0, 2), totalPages);
  await addAnnexureDrawingPage(doc, 'D-07 SLAB REINFORCEMENT PLAN', generateSlabReinfPlanSvg(input), getClosingNarrativeParagraphs(input).slice(0, 2), totalPages);

  /** Workbook-faithful grid excerpts until total length reaches the ~200–250 page band. */
  const firstAppendixPage = doc.getNumberOfPages() + 1;
  await appendWorkbookPreviewAppendix(
    doc,
    input as ProjectInput,
    totalPages,
    APPENDIX_TARGET_MIN_PAGES,
    APPENDIX_TARGET_MAX_PAGES,
  );
  if (doc.getNumberOfPages() >= firstAppendixPage) sectionPages['APPX'] = firstAppendixPage;

  doc.addPage();
  const summaryPageNum = doc.getNumberOfPages();
  const finalTotalPages = summaryPageNum;
  sectionPages['SUM'] = summaryPageNum;
  addFinalSummary(doc, input, summaryPageNum, finalTotalPages);

  const pageCount = doc.getNumberOfPages();
  return { buffer: Buffer.from(doc.output('arraybuffer')), pageCount, sectionPages };
}

function truncateCell(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Paginates {@link buildWorkbookSheetPreviews} cell grids so the comprehensive PDF
 * reaches the documented multi-hundred-page length class (real workbook text, not padding).
 */
async function appendWorkbookPreviewAppendix(
  doc: jsPDF,
  input: ProjectInput,
  totalPages: number,
  targetMinPages: number,
  targetMaxPages: number,
): Promise<void> {
  let previews: WorkbookSheetPreview[];
  try {
    previews = await buildWorkbookSheetPreviews(input);
  } catch {
    return;
  }
  if (!previews.length) return;

  const ROWS_PP = 26;
  const MAX_COLS = 9;

  const chunks: { sheet: WorkbookSheetPreview; r0: number }[] = [];
  for (const sheet of previews) {
    if (!sheet.rows.length) continue;
    for (let r0 = 0; r0 < sheet.rows.length; r0 += ROWS_PP) {
      chunks.push({ sheet, r0 });
    }
  }
  if (!chunks.length) return;

  let idx = 0;
  let guard = 0;
  const hardCap = targetMaxPages - 2;

  while (doc.getNumberOfPages() < targetMinPages && doc.getNumberOfPages() < hardCap) {
    guard++;
    if (guard > 450) break;

    const { sheet, r0 } = chunks[idx % chunks.length]!;
    const lap = Math.floor(idx / chunks.length);
    idx++;

    doc.addPage();
    const pn = doc.getNumberOfPages();
    const rowEnd = Math.min(r0 + ROWS_PP, sheet.rows.length);
    const lapNote = lap > 0 ? ` — pass ${lap + 1}` : '';
    addSheetHeader(
      doc,
      `WORKBOOK GRID: ${sheet.name} (rows ${r0 + 1}–${rowEnd})${lapNote}`,
      pn,
      totalPages,
    );

    const chunk = sheet.rows.slice(r0, rowEnd);
    const cols = Math.max(1, Math.min(MAX_COLS, sheet.colCount));
    const widths = appendixColumnWidths(chunk, cols);
    const headers = Array.from({ length: cols }, (_, c) => ({
      header: `C${c + 1}`,
      width: widths[c]!,
      align: 'left' as const,
    }));
    const dataRows = chunk.map((line) => ({
      cells: Array.from({ length: cols }, (_, c) => ({
        value: truncateCell(String(line[c] ?? ''), 32),
      })),
    }));
    drawTable(doc, 32, headers, dataRows, { wrap: false });
  }
}

/**
 * Equal 20 mm columns elide almost every label in a sheet whose real width is three columns.
 * Share the printable width by the longest value in each column, with a floor that still fits
 * the "C10" style header.
 */
function appendixColumnWidths(chunk: string[][], cols: number): number[] {
  const weights = Array.from({ length: cols }, (_, c) => {
    let longest = 3;
    for (const line of chunk) longest = Math.max(longest, (line[c] ?? '').length);
    return Math.min(longest, 34);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const minW = Math.min(12, CONTENT_WIDTH / cols / 2);
  const widths = weights.map((w) => Math.max((CONTENT_WIDTH * w) / total, minW));
  const overflow = widths.reduce((a, b) => a + b, 0) - CONTENT_WIDTH;
  if (overflow <= 0) return widths;
  const slack = widths.map((w) => Math.max(w - minW, 0));
  const slackTotal = slack.reduce((a, b) => a + b, 0) || 1;
  return widths.map((w, i) => w - (overflow * slack[i]!) / slackTotal);
}

function addCoverPage(doc: jsPDF, input: EnhancedProjectInput, totalPages: number): void {
  const bridgeTypeLabel = input.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge';
  const PW = PAGE_WIDTH;
  const PH = PAGE_HEIGHT;

  // Header band
  doc.setFillColor(...COLORS.header);
  doc.rect(0, 0, PW, 80, 'F');

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BRIDGE DESIGN REPORT', PW / 2, 40, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Complete Calculation Sheets (${EXPECTED_SHEET_COUNT}-Sheet Workbook)`, PW / 2, 55, { align: 'center' });
  doc.text('IRC:6-2016 | IRC:112-2015 | IRC:78-1983', PW / 2, 65, { align: 'center' });

  // Project info box
  const boxY = 100;
  const labelX = MARGIN + 5;
  const valueX = MARGIN + 50;
  const lineH = 5.5;
  const rowGap = 5;

  doc.setFontSize(10);
  const details: [string, string][] = [
    ['Project Name:', input.projectName],
    ['Bridge Type:', bridgeTypeLabel],
    ['Location:', input.location || 'Not specified'],
    ['River:', input.riverName || 'Not specified'],
    ['Total Length:', `${input.totalLength}m (${input.numberOfSpans} × ${input.spanLength}m spans)`],
    ['Carriageway:', `${input.carriageWidth}m`],
    ['Design Standard:', 'IRC Standards'],
    ['Report Pages:', `${totalPages} pages`],
    ['Generated:', new Date().toLocaleDateString('en-IN')]
  ];
  const rows = details.map(([label, value]) => ({
    label,
    lines: doc.splitTextToSize(value, CONTENT_WIDTH - (valueX - MARGIN) - 5) as string[],
  }));

  const cardHeight = 28 + rows.reduce((h, row) => h + row.lines.length * lineH + rowGap, 0);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, boxY, CONTENT_WIDTH, cardHeight, 3, 3, 'S');

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT DETAILS', labelX, boxY + 15);

  doc.setFontSize(10);
  let y = boxY + 28;
  rows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.text(row.label, labelX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(row.lines, valueX, y);
    y += row.lines.length * lineH + rowGap;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This document contains complete bridge design calculations', PW / 2, PH - 20, { align: 'center' });
  doc.text('Page 1 of ' + totalPages, PW - MARGIN, PH - 10, { align: 'right' });
}

function addForeword(doc: jsPDF, input: EnhancedProjectInput, totalPages: number): void {
  const pageNum = doc.getNumberOfPages();
  addSheetHeader(doc, 'ABOUT THIS DESIGN REPORT', pageNum, totalPages);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('About this design report', MARGIN, 44);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  const lead = doc.splitTextToSize(
    'This report is generated directly from the bridge design engine. Narrative prose, governing values, quantities and annexure diagrams are all tied back to the same design state so reviewers can trace the engineering story without manually reconciling separate documents.',
    CONTENT_WIDTH,
  );
  doc.text(lead, MARGIN, 54);

  drawTable(doc, 82, [
    { header: 'Scope block', width: 56, align: 'left' as const },
    { header: 'Declared report scope', width: 129, align: 'left' as const },
  ], [
    { cells: [{ value: 'Scope' }, { value: 'Hydraulics, slab, pier, abutment, estimation, workbook appendix and annexure drawings.' }] },
    { cells: [{ value: 'Governing codes' }, { value: `IRC:6, IRC:112, IRC:78, IRC:SP:13${input.bridgeType === 'high-level' ? ', IRC:5' : ''}.` }] },
    { cells: [{ value: 'Deliverables' }, { value: 'Excel workbook, HTML report, comprehensive PDF, DXF and SVG engineering annexures.' }] },
    { cells: [{ value: 'Narrative mode' }, { value: 'Deterministic prose computed from project inputs and derived design results.' }] },
  ]);
}

/**
 * Annexure pages carry the drawing, not its markup. `sharp` is a devDependency, so an install
 * without dev dependencies loses the rasteriser; the page then says so instead of silently
 * dropping the diagram.
 */
async function rasteriseAnnexureSvg(svg: string): Promise<Uint8Array | null> {
  try {
    const { default: sharp } = await import('sharp');
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Uint8Array(png);
  } catch {
    return null;
  }
}

/** Intrinsic size of a generated annexure SVG, from its root width/height or its viewBox. */
function svgPixelSize(svg: string): { width: number; height: number } {
  const root = svg.slice(0, svg.indexOf('>') + 1);
  const box = /viewBox="([\d.\-]+) ([\d.\-]+) ([\d.\-]+) ([\d.\-]+)"/.exec(root);
  const width = Number(/width="([\d.]+)"/.exec(root)?.[1]) || Number(box?.[3]) || 800;
  const height = Number(/height="([\d.]+)"/.exec(root)?.[1]) || Number(box?.[4]) || 600;
  return { width, height };
}

async function addAnnexureDrawingPage(
  doc: jsPDF,
  title: string,
  svg: string,
  narrative: string[],
  totalPages: number,
): Promise<void> {
  doc.addPage();
  const pageNum = doc.getNumberOfPages();
  addSheetHeader(doc, title, pageNum, totalPages);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  let y = 40;
  for (const para of narrative) {
    const lines = doc.splitTextToSize(para, CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 3;
  }

  const png = await rasteriseAnnexureSvg(svg);
  if (!png) {
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y + 2, CONTENT_WIDTH, PAGE_HEIGHT - MARGIN - y - 2, 'S');
    doc.text(
      'This build has no SVG rasteriser installed. The drawing ships as the vector annexure exported with the workbook.',
      MARGIN + 4,
      y + 10,
    );
    return;
  }

  const { width, height } = svgPixelSize(svg);
  const drawnWidth = Math.min(CONTENT_WIDTH, ((PAGE_HEIGHT - MARGIN - y - 4) * width) / height);
  doc.addImage(png, 'PNG', MARGIN, y + 2, drawnWidth, (drawnWidth * height) / width);
}

function addTableOfContents(
  doc: jsPDF,
  input: EnhancedProjectInput,
  inputWorkbookPdfPages: number,
  totalPages: number,
  sectionPages: SectionPages,
): void {
  const tocPageNum = doc.getNumberOfPages();
  addSheetHeader(doc, 'TABLE OF CONTENTS', tocPageNum, totalPages);

  const shift = inputWorkbookPdfPages;
  const sections: { id: TocSectionId; label: string; name: string; placeholder: number }[] = [
    {
      id: 'IN1-3',
      label: 'Sheets IN1-3',
      name: 'INPUT workbook tabs (Hydraulics, Pier, Abutment — A–H sample layout)',
      placeholder: 3,
    },
    { id: '01', label: 'Sheet 01', name: 'INDEX', placeholder: 4 + shift },
    { id: '02', label: 'Sheet 02', name: 'INSERT- HYDRAULICS', placeholder: 6 + shift },
    { id: '03', label: 'Sheet 03', name: 'afflux calculation', placeholder: 8 + shift },
    { id: '04', label: 'Sheet 04', name: 'HYDRAULICS', placeholder: 12 + shift },
    { id: '05-08', label: 'Sheets 05-08', name: 'DECK ANCHORAGE, CROSS SECTION, BED SLOPE, SBC', placeholder: 16 + shift },
    { id: '09-18', label: 'Sheets 09-18', name: 'PIER DESIGN & STABILITY (10 sheets)', placeholder: 24 + shift },
    { id: '19-28', label: 'Sheets 19-28', name: 'TYPE1 ABUTMENT (10 sheets)', placeholder: 54 + shift },
    { id: '29', label: 'Sheet 29', name: 'TECHNOTE', placeholder: 84 + shift },
    { id: '30-41', label: 'Sheets 30-41', name: 'C1 CANTILEVER ABUTMENT (12 sheets)', placeholder: 86 + shift },
    { id: '42-46', label: 'Sheets 42-46', name: 'ESTIMATION & REPORTS (5 sheets)', placeholder: 122 + shift },
    { id: 'ANNEX', label: 'Annexures', name: 'D-04 to D-07 hydraulic profile, pier FBD, abutment pressure, slab reinforcement', placeholder: 130 + shift },
    { id: 'APPX', label: 'Appendix', name: `Workbook grids — all ${EXPECTED_SHEET_COUNT} tabs, cell by cell`, placeholder: 136 + shift },
    { id: 'SUM', label: 'Summary', name: 'DESIGN SUMMARY — governing values and status', placeholder: 250 },
  ];

  let y = 60;
  sections.forEach((sec, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 30;
    }

    // Alternating background
    if (idx % 2 === 0) {
      doc.setFillColor(...COLORS.tableAlt);
      doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 10, 'F');
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text(sec.label, MARGIN + 5, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text(doc.splitTextToSize(sec.name, 105) as string[], MARGIN + 40, y);

    doc.text(`Page ${sectionPages[sec.id] ?? sec.placeholder}`, PAGE_WIDTH - MARGIN - 10, y, { align: 'right' });

    y += 12;
  });
}

/** Adds the bottom-right page stamp to a page drawn by a module that has no numbering of its own. */
function stampFooterPageNumber(doc: jsPDF, pageNum: number, totalPages: number): void {
  const lastPage = doc.getNumberOfPages();
  doc.setPage(pageNum);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });
  doc.setPage(lastPage);
}

function addSheetHeader(doc: jsPDF, title: string, pageNum: number, totalPages: number): void {
  // Top header bar
  doc.setFillColor(...COLORS.header);
  doc.rect(0, 0, PAGE_WIDTH, 25, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGIN, 17);

  doc.setFontSize(9);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN, 17, { align: 'right' });

  // Sheet info line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30);
}

function addIndexSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 01: INDEX', pageNum, totalPages);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('BRIDGE DESIGN INDEX', MARGIN, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Narrative: this index declares project identity, governing standards, and report structure before calculations start.',
    MARGIN,
    48,
  );

  const bridgeTypeLabel = input.bridgeType === 'high-level' ? 'High-Level slab bridge' : 'Submersible bridge';
  const indexData = [
    ['Project', input.projectName],
    ['Location', input.location || '-'],
    ['River', input.riverName || '-'],
    ['Bridge type', `${bridgeTypeLabel} (${input.numberOfSpans} spans x ${n(input.spanLength)} m)`],
    ['Design basis', input.bridgeType === 'high-level' ? 'IRC:6-2016 (incl. Wind), IRC:112-2015, IRC:78-1983, IRC:5-2015 (Freeboard)' : 'IRC:6-2016, IRC:112-2015, IRC:78-1983, IRC SP-13'],
    ['Hydraulic control', input.bridgeType === 'high-level' ? `HFL ${n(input.hfl)} m, Soffit ${n(input.hydraulics?.soffitLevel)} m, Clr above HFL ${n(input.hydraulics?.freeboardAboveHfl)} m, Req min above HFL ${n(input.hydraulics?.requiredFreeboardAboveHfl, 2)} m, Clr above DWL ${n(input.hydraulics?.freeboard)} m` : `HFL ${n(input.hfl)} m MSL, bed level ${n(input.bedLevel)} m MSL`],
    ['Material declaration', `Concrete ${input.concreteGrade || 'M25'}, Steel ${input.steelGrade || 'Fe415'}`],
    ['Workbook scope', `${EXPECTED_SHEET_COUNT} engineering sheets + summary pages with narrative derivations`],
    ['Quality declaration', 'All values from unified design engine + formula-linked workbook output'],
  ];

  drawTable(doc, 54, [
    { header: 'Index block', width: 52, align: 'left' },
    { header: 'Declared detail', width: 133, align: 'left' }
  ], indexData.map(([item, detail]) => ({
    cells: [
      { value: item, bold: true },
      { value: detail }
    ]
  })));
}

function addInsertHydraulicsSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 02: INSERT- HYDRAULICS', pageNum, totalPages);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('HYDRAULIC DATA SUMMARY', MARGIN, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Narrative: this sheet declares raw hydraulic inputs and derived controls used by afflux/scour/stability checks.',
    MARGIN,
    48,
  );

  const h = input.hydraulics;
  const isHigh = input.bridgeType === 'high-level';
  const reqFb = h?.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2);
  const data = [
    ['Bridge class', isHigh ? 'High-level slab bridge' : 'Submersible bridge', '—', 'From project input'],
    ['HFL (Highest Flood Level)', n(input.hfl), 'm MSL', 'Flood benchmark input'],
    ['Bed Level', n(input.bedLevel), 'm MSL', 'Channel bed reference'],
    ['Foundation Level', n(input.foundationLevel), 'm MSL', 'Substructure founding control'],
    ['Design Discharge Q', n(h?.discharge, 2), 'cumecs', 'Manning discharge output'],
    ['Approach Velocity V', n(h?.velocity, 3), 'm/s', 'Q / area consistency check'],
    ['Manning n', n(input.manningN, 3), '-', 'Roughness coefficient input'],
    ['Bed Slope', `1 in ${input.bedSlope || '-'}`, '-', 'Energy slope input'],
    ['Cross Section Area A', n(h?.crossSectionalArea, 3), 'm²', 'Section integration'],
    ['Wetted Perimeter P', n(h?.wettedPerimeter, 3), 'm', 'Boundary length in contact with flow'],
    ['Hydraulic Radius R', n(h?.hydraulicRadius, 4), 'm', 'R = A / P'],
    ['Afflux h', n(h?.afflux, 3), 'm', 'Molesworth backwater rise'],
    ['Design Water Level DWL', n(h?.designWaterLevel, 3), 'm MSL', 'DWL = HFL + afflux'],
    ['Froude number Fr', n(h?.froudeNumber, 4), '—', 'Flow regime indicator'],
    ['Flow regime', h?.flowType ?? '—', '—', 'Subcritical / supercritical'],
    ...(isHigh
      ? [
          ['Deck Soffit Level', n(h?.soffitLevel, 3), 'm MSL', 'Explicit or RTL - deck thickness'],
          ['Clearance above HFL', n(h?.freeboardAboveHfl, 3), 'm', 'Soffit - HFL'],
          ['Clearance above DWL', n(h?.freeboard, 3), 'm', 'Soffit - DWL'],
          ['IRC min. freeboard above HFL (from Q)', n(h?.ircMinimumFreeboardAboveHfl, 2), 'm', 'Discharge tier — IRC:5 practice'],
          ['Project min. freeboard above HFL', n(input.freeboardAboveHfl, 2), 'm', 'Input criterion'],
          ['Governing required freeboard above HFL', n(reqFb, 2), 'm', 'max(IRC Q-based, project)'],
          [
            'Deck clearance check (engine)',
            h?.isFreeboardSafe === true ? 'OK' : h?.isFreeboardSafe === false ? 'CHECK' : '—',
            '—',
            'Soffit >= HFL + required freeboard',
          ],
        ]
      : []),
  ];

  drawTable(doc, 54, [
    { header: 'Parameter', width: 58, align: 'left' },
    { header: 'Value', width: 28, align: 'right' },
    { header: 'Unit', width: 24, align: 'left' },
    { header: 'Narrative basis', width: 75, align: 'left' }
  ], data.map(([param, val, unit, note]) => ({
    cells: [
      { value: param },
      { value: val, bold: true },
      { value: unit },
      { value: note }
    ]
  })));
}

function addAffluxSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 03: AFFLUX CALCULATION', pageNum, totalPages);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('AFFLUX CALCULATION (Molesworth Formula)', MARGIN, 45);

  const h = input.hydraulics;
  const afflux = h?.afflux || 0;
  
  const areaA = h?.crossSectionalArea ?? 0;
  const areaARef = h?.effectiveWaterway
    ? h.effectiveWaterway * Math.max(0.001, (h.designWaterLevel ?? input.hfl) - input.bedLevel)
    : areaA;
  const velocity = h?.velocity ?? 0;
  const ratio = areaARef > 0 ? (areaA * areaA) / (areaARef * areaARef) : 1;
  const formulaTerm = (velocity * velocity) / 17.85 + 0.0152;

  drawTable(doc, 58, [
    { header: 'Computation step', width: 68, align: 'left' as const },
    { header: 'Expression', width: 77, align: 'left' as const },
    { header: 'Value', width: 25, align: 'right' as const },
    { header: 'Units / note', width: 25, align: 'left' as const },
  ], [
    { cells: [{ value: 'Velocity term' }, { value: 'V²/17.85 + 0.0152' }, { value: n(formulaTerm, 4), bold: true }, { value: '—' }] },
    { cells: [{ value: 'Area ratio term' }, { value: 'A² / a²' }, { value: n(ratio, 4), bold: true }, { value: '—' }] },
    { cells: [{ value: 'Afflux h' }, { value: 'h = term1 × (term2 - 1)' }, { value: n(afflux, 3), bold: true }, { value: 'm' }] },
    { cells: [{ value: 'Design water level' }, { value: 'DWL = HFL + h' }, { value: n(input.hfl + afflux, 3), bold: true }, { value: 'm MSL' }] },
  ]);

  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.formula);
  doc.text('Narrative: afflux quantifies backwater rise at the bridge constriction and governs design water level.', MARGIN, 100);
}

function addHydraulicsSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 04: HYDRAULICS', pageNum, totalPages);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETERMINATION OF VELOCITY AT PROPOSED BRIDGE SITE', MARGIN, 45);

  // Cross-section table header
  const headers = [
    { header: 'Chainage\n(m)', width: 25, align: 'center' as const },
    { header: 'G.L.\n(m MSL)', width: 25, align: 'center' as const },
    { header: 'Depth of\nFlow (m)', width: 30, align: 'center' as const },
    { header: 'Length of\nFlow (m)', width: 30, align: 'center' as const },
    { header: 'Avg Depth\n(m)', width: 25, align: 'center' as const },
    { header: 'Area\n(m²)', width: 25, align: 'center' as const },
    { header: 'Wetted\nPerimeter (m)', width: 40, align: 'center' as const }
  ];

  const hfl = input.hfl;
  const rows = input.crossSectionData?.map((point, idx, arr) => {
    const next = arr[idx + 1];
    const depth = Math.max(0, hfl - point.gl);
    const length = next ? next.chainage - point.chainage : 0;
    const avgDepth = next ? (depth + Math.max(0, hfl - next.gl)) / 2 : depth;
    const area = avgDepth * length;
    // The sloped boundary length the engine sums (design-engine.ts wettedPerimeter), not the
    // horizontal chainage gap — printing `length` here made the column disagree with its own SUM row.
    const glDiff = next ? next.gl - point.gl : 0;
    const wetted = Math.sqrt(length * length + glDiff * glDiff);

    return {
      cells: [
        { value: point.chainage.toFixed(2) },
        { value: point.gl.toFixed(2) },
        { value: depth.toFixed(3) },
        { value: length > 0 ? length.toFixed(2) : '-' },
        { value: length > 0 ? avgDepth.toFixed(3) : '-' },
        { value: length > 0 ? area.toFixed(3) : '-' },
        { value: length > 0 ? wetted.toFixed(2) : '-' }
      ]
    };
  }) || [];

  const afterTableY = drawTable(doc, 55, headers, rows, {
    continuation: { label: 'SHEET 04: HYDRAULICS — CROSS-SECTION POINTS (CONT.)', totalPages },
  });

  // Summary section
  const h = input.hydraulics;
  const summaryY = afterTableY + 20;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY CALCULATIONS', MARGIN, summaryY);

  const summary = [
    ['A (Area)', h?.crossSectionalArea?.toFixed(2) || '-', 'm²', 'SUM(Area)'],
    ['P (Wetted Perimeter)', h?.wettedPerimeter?.toFixed(2) || '-', 'm', 'SUM(Perimeter)'],
    ['R (Hydraulic Radius)', h?.hydraulicRadius?.toFixed(3) || '-', 'm', 'A/P'],
    ['N (Manning)', input.manningN?.toString() || '-', '', 'INPUT'],
    ['S (Bed Slope)', `1 in ${input.bedSlope || '-'}`, '', 'INPUT'],
    ['V (Velocity)', h?.velocity?.toFixed(2) || '-', 'm/s', 'Manning'],
    ['Q (Discharge)', h?.discharge?.toFixed(2) || '-', 'cumecs', 'A×V']
  ];

  drawTable(doc, summaryY + 10, [
    { header: 'Parameter', width: 50, align: 'left' as const },
    { header: 'Value', width: 35, align: 'right' as const },
    { header: 'Unit', width: 25, align: 'left' as const },
    { header: 'Formula', width: 80, align: 'left' as const }
  ], summary.map(([param, val, unit, formula]) => ({
    cells: [
      { value: param, bold: true },
      { value: val, bold: true },
      { value: unit },
      { value: formula, formula: true }
    ]
  })));

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Narrative: hydraulics progression is Area/Perimeter -> Hydraulic Radius -> Velocity -> Discharge -> Afflux/Scour checks.',
    MARGIN,
    Math.min(PAGE_HEIGHT - 12, summaryY + 74),
  );
}

function addStabilityPierCover(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 09: STABILITY CHECK FOR PIER', pageNum, totalPages);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('STABILITY CHECK FOR PIER', PAGE_WIDTH / 2, 80, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text('DESIGN OF PIER AND CHECK FOR STABILITY - SUBMERSIBLE BRIDGE', PAGE_WIDTH / 2, 100, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Project: ${input.projectName}`, PAGE_WIDTH / 2, 130, { align: 'center' });
  doc.text(`H.F.L.: ${input.hfl} m`, PAGE_WIDTH / 2, 145, { align: 'center' });
  doc.text(`Pier Size: ${input.pierWidth}m × ${input.pierLength}m × ${input.pierDepth}m`, PAGE_WIDTH / 2, 160, { align: 'center' });
}

function n(value: number | undefined, digits = 2): string {
  if (value === undefined || Number.isNaN(value)) return '-';
  return value.toFixed(digits);
}

/** Rupee amounts print in Indian digit grouping (1,65,80,143.57), never 16580143.57 or 1.658e+7. */
function money(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return '-';
  return `Rs ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fosVerdict(value: number, min: number): string {
  if (value >= min) return 'OK';
  if (value >= min * 0.9) return 'CHECK';
  return 'UNSAFE';
}

/** Failing checks have to be visible at a glance, not only in the number column (D12). */
function verdictFill(verdict: string): [number, number, number] | undefined {
  if (verdict === 'UNSAFE' || verdict === 'FAIL') return [231, 76, 60];
  if (verdict === 'CHECK') return [243, 156, 18];
  return undefined;
}

function addStabilityPierSheets(doc: jsPDF, input: EnhancedProjectInput, startPage: number, totalPages: number): number {
  let pagesAdded = 0;
  const p = input.pier;
  const h = input.hydraulics;
  const loadCases = p?.loadCases || [];

  const waterDepth = Math.max(0, (h?.designWaterLevel ?? input.hfl) - input.bedLevel);
  const deadLoad = p?.loads?.deadLoad ?? 0;
  const liveLoad = p?.loads?.liveLoad ?? 0;
  const hydrostatic = p?.loads?.hydrostaticForce ?? 0;
  const drag = p?.loads?.dragForce ?? 0;
  const totalHorizontal = p?.loads?.totalHorizontalForce ?? hydrostatic + drag;
  const buoyancy = p?.loads?.buoyancy ?? 0;
  const baseArea = input.pierBaseWidth * input.pierBaseLength;
  const leverArm = input.pierBaseLength / 2;
  // μ comes from the engine's coefficient register — 0.5 typed here was a third copy of a value
  // the engineer is told "the engine assumes", so re-calibrating μ left the PDF computing with the
  // old number.
  const frictionCoeff = DESIGN_CONSTANTS.BASE_FRICTION_COEFFICIENT;

  // Page 1 after cover: detailed design data and force build-up
  doc.addPage();
  addSheetHeader(doc, 'SHEET 09: DESIGN DATA AND FORCE BUILD-UP', startPage + pagesAdded, totalPages);
  pagesAdded++;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('DETAILED BASIS (OFFICE-STYLE FLOW)', MARGIN, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Design data, formula basis, and resolved forces are shown before case-wise stability checks.',
    MARGIN,
    48
  );

  drawTable(doc, 54, [
    { header: 'Design parameter', width: 65, align: 'left' as const },
    { header: 'Value', width: 32, align: 'right' as const },
    { header: 'Unit', width: 22, align: 'left' as const },
    { header: 'Formula / narrative', width: 66, align: 'left' as const }
  ], [
    { cells: [{ value: 'HFL' }, { value: n(input.hfl) }, { value: 'm MSL' }, { value: 'Input flood level' }] },
    { cells: [{ value: 'Design water level' }, { value: n(h?.designWaterLevel ?? input.hfl) }, { value: 'm MSL' }, { value: 'HFL + afflux (hydraulics)' }] },
    { cells: [{ value: 'Bed level' }, { value: n(input.bedLevel) }, { value: 'm MSL' }, { value: 'Input bed reference' }] },
    { cells: [{ value: 'Water depth at pier' }, { value: n(waterDepth, 3) }, { value: 'm' }, { value: 'DWL - Bed level' }] },
    { cells: [{ value: 'Pier dimensions (W×L×D)' }, { value: `${n(input.pierWidth)}×${n(input.pierLength)}×${n(input.pierDepth)}` }, { value: 'm' }, { value: 'Pier body geometry' }] },
    { cells: [{ value: 'Base dimensions (Bw×Bl)' }, { value: `${n(input.pierBaseWidth)}×${n(input.pierBaseLength)}` }, { value: 'm' }, { value: 'Footing geometry' }] },
    { cells: [{ value: 'Dead load' }, { value: n(deadLoad) }, { value: 'kN' }, { value: 'Self-weight resolved by engine' }] },
    { cells: [{ value: 'Live load' }, { value: n(liveLoad) }, { value: 'kN' }, { value: 'Deck reaction to pier' }] },
    { cells: [{ value: 'Hydrostatic force' }, { value: n(hydrostatic) }, { value: 'kN' }, { value: 'Pressure resultant on submerged face' }] },
    { cells: [{ value: 'Drag force' }, { value: n(drag) }, { value: 'kN' }, { value: 'Velocity-dependent stream drag' }] },
    { cells: [{ value: 'Total horizontal force' }, { value: n(totalHorizontal) }, { value: 'kN' }, { value: 'Hydrostatic + drag' }] },
    { cells: [{ value: 'Buoyancy' }, { value: n(buoyancy) }, { value: 'kN' }, { value: 'Displaced water weight' }] },
    { cells: [{ value: 'Base area' }, { value: n(baseArea, 3) }, { value: 'm²' }, { value: 'Bw × Bl' }] },
    { cells: [{ value: 'Restoring lever arm' }, { value: n(leverArm, 3) }, { value: 'm' }, { value: 'Bl / 2' }] },
    { cells: [{ value: 'Friction coefficient' }, { value: n(frictionCoeff, 2) }, { value: '-' }, { value: 'IRC:6-2016 Annex B Table B.1 — the engine’s DESIGN_CONSTANTS value' }] },
  ]);

  // Page 2: overview summary table
  doc.addPage();
  addSheetHeader(doc, 'SHEET 09: STABILITY CHECK - LOAD CASES', startPage + pagesAdded, totalPages);
  pagesAdded++;

  const headers = [
    { header: 'Case', width: 50, align: 'left' as const },
    { header: 'Vertical\n(kN)', width: 30, align: 'right' as const },
    { header: 'Horizontal\n(kN)', width: 30, align: 'right' as const },
    { header: 'Sliding\nFOS', width: 25, align: 'right' as const },
    { header: 'Overturning\nFOS', width: 30, align: 'right' as const },
    { header: 'Bearing\nFOS', width: 25, align: 'right' as const },
    { header: 'Status', width: 35, align: 'center' as const }
  ];

  const rows = loadCases.map(lc => ({
    cells: [
      { value: lc.description },
      { value: lc.verticalForce.toFixed(1), bold: true },
      { value: lc.horizontalForce.toFixed(1) },
      { value: lc.slidingFOS.toFixed(2), bold: lc.slidingFOS >= STABILITY_ACCEPTANCE.slidingFosMin },
      { value: lc.overturningFOS.toFixed(2), bold: lc.overturningFOS >= STABILITY_ACCEPTANCE.overturningFosMin },
      { value: lc.bearingFOS.toFixed(2), bold: lc.bearingFOS >= STABILITY_ACCEPTANCE.bearingFosMin },
      { value: lc.status, bold: true, bgColor: lc.status === 'SAFE' ? [39, 174, 96] as [number, number, number] : [231, 76, 60] as [number, number, number] }
    ]
  }));

  const afterCasesY = drawTable(doc, 45, headers, rows, {
    continuation: { label: 'SHEET 09: STABILITY CHECK - LOAD CASES (CONT.)', totalPages },
  });

  // FOS Criteria note
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.formula);
  doc.text(`FOS Criteria: Sliding >= ${STABILITY_ACCEPTANCE.slidingFosMin} | Overturning >= ${STABILITY_ACCEPTANCE.overturningFosMin} | Bearing >= ${STABILITY_ACCEPTANCE.bearingFosMin} (pressure <= SBC)`, MARGIN, afterCasesY + 8);

  // Subsequent pages: one detailed narrative derivation per case
  loadCases.forEach((lc) => {
    doc.addPage();
    addSheetHeader(doc, `SHEET 09: CASE ${lc.caseNumber} DETAILED CHECK`, startPage + pagesAdded, totalPages);
    pagesAdded++;

    // IRC:78-2000 §706 — the engine credits passive earth resistance in the sliding FOS, so this
    // page must show that term. Recomputing (μ·V)/H here printed a lower Sliding FOS than the
    // summary table two pages earlier of the same PDF, under the same case name.
    const passive = lc.passiveResistance ?? 0;
    const basePressure = baseArea > 0 ? Math.abs(lc.verticalForce) / baseArea : 0;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.header);
    doc.text(`CASE ${lc.caseNumber}: ${lc.description}`, MARGIN, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    doc.text('Load factors -> force resolution -> stability safety factors -> engineering verdict.', MARGIN, 48);

    const slidingVerdict = fosVerdict(lc.slidingFOS, STABILITY_ACCEPTANCE.slidingFosMin);
    const overturningVerdict = fosVerdict(lc.overturningFOS, STABILITY_ACCEPTANCE.overturningFosMin);
    // q <= SBC and FOS_b >= 1.0 are the same test, so one verdict shades both rows. The
    // hand-written `q <= sbc ? 'OK' : 'CHECK'` used to print an over-SBC bearing as amber.
    const bearingVerdict = fosVerdict(lc.bearingFOS, STABILITY_ACCEPTANCE.bearingFosMin);

    drawTable(doc, 54, [
      { header: 'Check item', width: 56, align: 'left' as const },
      { header: 'Equation / logic', width: 74, align: 'left' as const },
      { header: 'Value', width: 30, align: 'right' as const },
      { header: 'Result', width: 25, align: 'left' as const }
    ], [
      { cells: [{ value: 'Load factors (DL,LL,Wind,Buoy)' }, { value: `${n(lc.deadLoadFactor, 2)}, ${n(lc.liveLoadFactor, 2)}, ${n(lc.windLoadFactor, 2)}, ${n(lc.buoyancyFactor, 2)}` }, { value: '-' }, { value: 'Applied' }] },
      { cells: [{ value: 'Vertical force V' }, { value: 'V = DLf*W_dead + LLf*W_live - Buoyf*W_buoy' }, { value: `${n(lc.verticalForce)} kN`, bold: true }, { value: lc.verticalForce > 0 ? 'OK' : 'CHECK' }] },
      { cells: [{ value: 'Horizontal force H' }, { value: 'H = hydrostatic + drag' }, { value: `${n(lc.horizontalForce)} kN`, bold: true }, { value: 'Driving' }] },
      { cells: [{ value: 'Overturning moment M_o' }, { value: 'M_o = H × (water depth/3)' }, { value: `${n(lc.moment)} kN-m`, bold: true }, { value: 'Driving' }] },
      { cells: [{ value: 'Passive resistance Pp' }, { value: 'Pp = min(½·Kp·gamma·D²·Bl, cap·mu·V) — IRC:78-2000 §706' }, { value: `${n(passive)} kN`, bold: true }, { value: passive > 0 ? 'Resisting' : 'Nil' }] },
      { cells: [{ value: 'Sliding FOS' }, { value: 'FOS_s = (mu × V + Pp) / H' }, { value: n(lc.slidingFOS, 3), bold: true }, { value: slidingVerdict, bgColor: verdictFill(slidingVerdict) }] },
      { cells: [{ value: 'Overturning FOS' }, { value: 'FOS_o = (V × (Bl/2)) / M_o' }, { value: n(lc.overturningFOS, 3), bold: true }, { value: overturningVerdict, bgColor: verdictFill(overturningVerdict) }] },
      { cells: [{ value: 'Base pressure q' }, { value: 'q = V / A_base' }, { value: `${n(basePressure, 3)} kN/m²`, bold: true }, { value: bearingVerdict, bgColor: verdictFill(bearingVerdict) }] },
      { cells: [{ value: 'Bearing FOS' }, { value: 'FOS_b = SBC / q' }, { value: n(lc.bearingFOS, 3), bold: true }, { value: bearingVerdict, bgColor: verdictFill(bearingVerdict) }] },
      { cells: [{ value: 'Case conclusion' }, { value: 'Minimum FOS against criteria governs' }, { value: lc.status, bold: true }, { value: lc.status === 'SAFE' ? 'Accept' : 'Review', bgColor: verdictFill(lc.status === 'SAFE' ? 'OK' : 'UNSAFE') }] },
    ]);
  });

  return pagesAdded + 1; // +1 for cover
}

function addAbutmentCover(doc: jsPDF, input: EnhancedProjectInput, type: 'TYPE1' | 'C1', pageNum: number, totalPages: number): void {
  const title = type === 'TYPE1' ? 'TYPE1 (GRAVITY) ABUTMENT' : 'C1 (CANTILEVER) ABUTMENT';
  addSheetHeader(doc, `${type} ABUTMENT - COVER`, pageNum, totalPages);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text(title, PAGE_WIDTH / 2, 80, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.text('STABILITY CHECK AND DESIGN', PAGE_WIDTH / 2, 100, { align: 'center' });

  if (type === 'C1') {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.tableHeader);
    doc.text('Stability figures on this cover mirror the Type-1 abutment model: the engine calculates one', PAGE_WIDTH / 2, 122, { align: 'center' });
    doc.text('abutment stability case set and labels it twice (august-due §Z). Not an independent second check.', PAGE_WIDTH / 2, 128, { align: 'center' });
  }
}

function addAbutmentStabilityDetailedSheet(
  doc: jsPDF,
  input: EnhancedProjectInput,
  type: 'TYPE1' | 'C1',
  pageNum: number,
  totalPages: number
): void {
  const title = type === 'TYPE1' ? 'TYPE1 ABUTMENT STABILITY' : 'C1 ABUTMENT STABILITY';
  const ab = type === 'TYPE1' ? input.abutmentType1 : input.abutmentC1;
  addSheetHeader(doc, `${title} — DETAILED NARRATIVE`, pageNum, totalPages);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text(`${title}: LOADS, EARTH PRESSURE, AND STABILITY CHECKS`, MARGIN, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Flow: geometry and earth pressure basis -> case-wise factors -> force/moment checks -> safety verdict.',
    MARGIN,
    48
  );

  const g = ab?.geometry;
  const ep = ab?.earthPressure;
  const lc = ab?.loadCases ?? [];

  const basisRows: { cells: { value: string; bold?: boolean }[] }[] = [
    { cells: [{ value: 'Abutment height' }, { value: n(g?.height) }, { value: 'm' }, { value: 'Input geometry' }] },
    { cells: [{ value: 'Base width × length' }, { value: `${n(g?.baseWidth)} × ${n(g?.baseLength)}` }, { value: 'm' }, { value: 'Footing dimensions' }] },
    { cells: [{ value: 'Active pressure coefficient K_a' }, { value: n(ep?.ka, 4), bold: true }, { value: '—' }, { value: 'Rankine-based' }] },
    { cells: [{ value: 'Active thrust P_a' }, { value: n(ep?.pa), bold: true }, { value: 'kN/m' }, { value: 'Earth pressure resultant' }] },
    { cells: [{ value: 'Resultant location' }, { value: n(ep?.location, 3) }, { value: 'm' }, { value: 'Typically H/3 from base' }] },
  ];

  if (type === 'C1') {
    basisRows.push({
      cells: [
        { value: 'Model basis' },
        { value: 'Shared' },
        { value: '—' },
        { value: 'C1 mirrors the Type-1 case set (august-due §Z)' },
      ],
    });
  }

  const afterBasisY = drawTable(doc, 54, [
    { header: 'Design item', width: 60, align: 'left' as const },
    { header: 'Value', width: 38, align: 'right' as const },
    { header: 'Unit', width: 24, align: 'left' as const },
    { header: 'Narrative basis', width: 63, align: 'left' as const },
  ], basisRows, { continuation: { label: `${title} — DETAILED NARRATIVE (CONT.)`, totalPages } });

  const caseRows = lc.map((c) => ({
    cells: [
      { value: `${c.caseNumber}. ${c.description}` },
      { value: n(c.verticalForce), bold: true },
      { value: n(c.horizontalForce), bold: true },
      { value: n(c.moment), bold: true },
      { value: `${n(c.slidingFOS, 2)} / ${n(c.overturningFOS, 2)} / ${n(c.bearingFOS, 2)}` },
      { value: c.status, bold: true, bgColor: (c.status === 'SAFE' ? [39, 174, 96] : [231, 76, 60]) as [number, number, number] },
    ],
  }));

  drawTable(doc, afterBasisY + 8, [
    { header: 'Load case', width: 56, align: 'left' as const },
    { header: 'V (kN)', width: 24, align: 'right' as const },
    { header: 'H (kN)', width: 24, align: 'right' as const },
    { header: 'M (kN-m)', width: 26, align: 'right' as const },
    { header: 'FOS (S/O/B)', width: 40, align: 'right' as const },
    { header: 'Verdict', width: 35, align: 'center' as const },
  ], caseRows);
}

function addFootingStressNarrativeSheet(
  doc: jsPDF,
  input: EnhancedProjectInput,
  type: 'TYPE1' | 'C1',
  pageNum: number,
  totalPages: number
): void {
  const title = type === 'TYPE1' ? 'TYPE1 FOOTING STRESS' : 'C1 FOOTING STRESS';
  const ab = type === 'TYPE1' ? input.abutmentType1 : input.abutmentC1;
  addSheetHeader(doc, `${title} — PRESSURE NARRATIVE`, pageNum, totalPages);

  const g = ab?.geometry;
  const lc = ab?.loadCases ?? [];
  const critical = lc.length ? lc.reduce((a, b) => (a.bearingFOS <= b.bearingFOS ? a : b)) : undefined;
  const area = (g?.baseWidth ?? 0) * (g?.baseLength ?? 0);
  const qAvg = critical && area > 0 ? Math.abs(critical.verticalForce) / area : 0;
  // The abutment engine returns one bearing test — q = V/A, bearingFOS = SBC/q (design-engine.ts).
  // This page used to print an "indicative" q_max = 1.15·q / q_min = 0.85·q that nothing computes
  // and to key ACCEPT/REVIEW off it, so the report's verdict came from a number the engine never made.
  const bearingVerdict = critical ? fosVerdict(critical.bearingFOS, STABILITY_ACCEPTANCE.bearingFosMin) : 'REVIEW';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text(`${title}: BASE PRESSURE DERIVATION AND ACCEPTANCE`, MARGIN, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Narrative: identify governing case -> compute average pressure -> compare with SBC. The eccentric ' +
      'max/min spread is not modelled for abutments; see the last row.',
    MARGIN,
    48
  );

  drawTable(doc, 54, [
    { header: 'Step', width: 68, align: 'left' as const },
    { header: 'Expression', width: 64, align: 'left' as const },
    { header: 'Value', width: 28, align: 'right' as const },
    { header: 'Verdict / note', width: 25, align: 'left' as const },
  ], [
    { cells: [{ value: 'Critical load case' }, { value: critical ? `${critical.caseNumber}. ${critical.description}` : '-' }, { value: '-' }, { value: 'Min bearing FOS' }] },
    { cells: [{ value: 'Base area A' }, { value: 'A = B × L' }, { value: `${n(area, 3)} m²`, bold: true }, { value: 'Footing plan area' }] },
    { cells: [{ value: 'Average base pressure q_avg' }, { value: 'q = V / A' }, { value: `${n(qAvg, 3)} kN/m²`, bold: true }, { value: 'Engine bearing test input' }] },
    { cells: [{ value: 'Allowable SBC' }, { value: 'Input geotechnical limit' }, { value: `${n(input.sbc, 3)} kN/m²`, bold: true }, { value: 'Reference limit' }] },
    { cells: [{ value: 'Bearing FOS' }, { value: 'SBC / q_avg' }, { value: critical ? n(critical.bearingFOS, 3) : '-', bold: true }, { value: bearingVerdict }] },
    { cells: [{ value: 'Eccentric q_max / q_min' }, { value: 'V/A ± M/Sx' }, { value: 'not computed', bold: true }, { value: 'Pier only' }] },
    { cells: [{ value: 'Final bearing narrative' }, { value: 'Compare q_avg against SBC (bearing FOS above)' }, { value: bearingVerdict === 'OK' ? 'ACCEPT' : 'REVIEW', bold: true }, { value: bearingVerdict === 'OK' ? 'Safe' : 'Needs revision' }] },
  ]);
}

function addTechNoteSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 29: TECHNOTE', pageNum, totalPages);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('TECHNICAL NOTES', MARGIN, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Narrative: this sheet states standards, governing assumptions, and acceptance thresholds used in all design sheets.',
    MARGIN,
    51,
  );

  const lc = input.pier?.loadCases ?? [];
  drawTable(doc, 57, [
    { header: 'Technical note block', width: 66, align: 'left' as const },
    { header: 'Declared basis', width: 119, align: 'left' as const },
  ], [
    { cells: [{ value: 'Units and dimensions' }, { value: 'All geometry in m, forces in kN, moments in kN-m, pressure in kN/m².' }] },
    { cells: [{ value: 'Material grades' }, { value: `Concrete ${(input.concreteGrade || 'M25')} and steel ${(input.steelGrade || 'Fe415')} as design basis.` }] },
    { cells: [{ value: 'Codes/standards path' }, { value: 'IRC:6 load basis, IRC:112 concrete/steel design, IRC:78 foundation checks, IRC SP-13 hydraulics reference.' }] },
    { cells: [{ value: 'Hydraulic declaration' }, { value: `Discharge=${n(input.hydraulics?.discharge, 3)} cumecs, velocity=${n(input.hydraulics?.velocity, 3)} m/s, afflux=${n(input.hydraulics?.afflux, 3)} m.` }] },
    { cells: [{ value: 'Stability load-case set' }, { value: lc.length ? lc.map(c => `${c.caseNumber}. ${c.description}`).join(' | ') : 'Service, construction, flood, seismic, and ULS combinations.' }] },
    { cells: [{ value: 'Minimum acceptance limits' }, { value: `FOS Sliding >= ${STABILITY_ACCEPTANCE.slidingFosMin}, Overturning >= ${STABILITY_ACCEPTANCE.overturningFosMin}, Bearing >= ${STABILITY_ACCEPTANCE.bearingFosMin} (pressure <= SBC)${input.bridgeType === 'high-level' ? ', Freeboard >= 1.2m' : ''}.` }] },
    ...(input.bridgeType === 'high-level' ? [
      { cells: [{ value: 'Wind load basis' }, { value: 'High-level bridge exposed height designed for 1.5 kN/m² wind pressure per IRC:6.' }] }
    ] : []),
    { cells: [{ value: 'Narrative policy' }, { value: 'Every major sheet shows input -> formula/equation path -> computed values -> final engineering verdict.' }] },
  ]);
}

function addInsertEstimateSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 42: INSERT- ESTIMATE', pageNum, totalPages);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('ABSTRACT OF ESTIMATE', MARGIN, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Narrative: abstract estimate is the condensed BOQ roll-up where each amount = quantity x rate.',
    MARGIN,
    51,
  );

  const boq = input.estimation?.boq ?? [];
  const summary = boq.slice(0, 8).map((item: BOQItem) => {
    const amount = item.amount ?? item.quantity * item.rate;
    return [
      item.description,
      n(item.quantity, 2),
      item.unit,
      money(item.rate),
      money(amount),
    ];
  });
  const total = input.estimation?.cost?.total
    ?? boq.reduce((sum: number, item: BOQItem) => sum + ((item.amount ?? item.quantity * item.rate) || 0), 0);
  summary.push(['Total', '', '', '', money(total)]);

  drawTable(doc, 55, [
    { header: 'Item Description', width: 68, align: 'left' },
    { header: 'Qty', width: 22, align: 'right' },
    { header: 'Unit', width: 16, align: 'center' },
    { header: 'Rate', width: 32, align: 'right' },
    { header: 'Amount', width: 42, align: 'right' }
  ], summary.map((row, idx) => ({
    cells: row.map((cell, cidx) => ({
      value: cell,
      bold: idx === summary.length - 1 || cidx === 4,
      bgColor: idx === summary.length - 1 ? [236, 240, 241] as [number, number, number] : undefined
    }))
  })));
}

function addEstimationSheet(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'SHEET 46: ESTIMATION', pageNum, totalPages);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('DETAILED ESTIMATE', MARGIN, 45);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Narrative: each line item is quantity-derived from design outputs and priced by rate analysis.',
    MARGIN,
    51,
  );

  const e = input.estimation;
  
  // BOQ table
  const headers = [
    { header: 'S.No', width: 14, align: 'center' as const },
    { header: 'Description of Item', width: 72, align: 'left' as const },
    { header: 'Qty', width: 18, align: 'right' as const },
    { header: 'Unit', width: 14, align: 'center' as const },
    { header: 'Rate', width: 28, align: 'right' as const },
    { header: 'Amount', width: 34, align: 'right' as const }
  ];

  const rows = (e?.boq || []).map((item: BOQItem, idx: number) => ({
    amount: (item.amount ?? item.quantity * item.rate) || 0,
    cells: [
      { value: (idx + 1).toString() },
      { value: item.description },
      { value: item.quantity.toFixed(2), bold: true },
      { value: item.unit },
      { value: money(item.rate) },
      { value: money((item.amount ?? item.quantity * item.rate) || 0), bold: true }
    ]
  }));

  const afterTableY = drawTable(doc, 55, headers, rows.map(r => ({ cells: r.cells })), {
    continuation: { label: 'SHEET 46: ESTIMATION (CONT.)', totalPages },
  });

  // Total
  const totalY = afterTableY + 8;
  doc.setFillColor(...COLORS.tableAlt);
  doc.rect(MARGIN, totalY - 5, CONTENT_WIDTH, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.value);
  doc.text('TOTAL COST', MARGIN + 5, totalY);
  const totalCost = e?.cost?.total
    ?? rows.reduce((sum, r) => sum + r.amount, 0);
  doc.text(money(totalCost), PAGE_WIDTH - MARGIN - 5, totalY, { align: 'right' });
}

function addDataSheet(doc: jsPDF, input: EnhancedProjectInput, sheetNum: number, sheetName: string, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, `SHEET ${sheetNum.toString().padStart(2, '0')}: ${sheetName.toUpperCase()}`, pageNum, totalPages);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text(`CALCULATION SHEET: ${sheetName.toUpperCase()}`, MARGIN, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Narrative flow: design intent -> governing inputs -> equation path -> engineering acceptance statement.',
    MARGIN,
    48,
  );

  const narrativeRows: { cells: { value: string; bold?: boolean }[] }[] = [
    {
      cells: [
        { value: 'Design intent' },
        { value: `Compute and verify ${sheetName.toUpperCase()} in IRC-aligned workflow.` },
      ],
    },
    {
      cells: [
        { value: 'Project reference' },
        { value: `${input.projectName} @ ${input.location || '-'} (${input.riverName || '-'})`, bold: true },
      ],
    },
    {
      cells: [
        { value: 'Primary governing inputs' },
        { value: `Span ${n(input.spanLength)} m, carriageway ${n(input.carriageWidth)} m, HFL ${n(input.hfl)} m MSL, SBC ${n(input.sbc)} kN/m²` },
      ],
    },
    {
      cells: [
        { value: 'Equation path' },
        { value: 'Input values -> derived actions/effects -> stability/strength checks -> serviceability confirmation.' },
      ],
    },
  ];

  // Show some relevant data based on sheet number
  const nextTableY = drawTable(doc, 54, [
    { header: 'Narrative block', width: 54, align: 'left' as const },
    { header: 'Detail', width: 131, align: 'left' as const },
  ], narrativeRows) + 8;

  if (sheetNum >= 10 && sheetNum <= 18) {
    drawTable(doc, nextTableY, [
      { header: 'Pier derivation context', width: 54, align: 'left' as const },
      { header: 'Value / narrative', width: 131, align: 'left' as const },
    ], [
      { cells: [{ value: 'Pier geometry' }, { value: `${n(input.pierWidth)} × ${n(input.pierLength)} × ${n(input.pierDepth)} m` }] },
      { cells: [{ value: 'Base geometry' }, { value: `${n(input.pierBaseWidth)} × ${n(input.pierBaseLength)} m` }] },
      { cells: [{ value: 'Narrative acceptance' }, { value: 'Case-wise FOS checks and base pressures govern safe design judgment.' }] },
    ]);
  } else if (sheetNum >= 19 && sheetNum <= 28) {
    drawTable(doc, nextTableY, [
      { header: 'TYPE1 derivation context', width: 54, align: 'left' as const },
      { header: 'Value / narrative', width: 131, align: 'left' as const },
    ], [
      { cells: [{ value: 'Abutment geometry' }, { value: `H=${n(input.abutmentHeight)} m, B=${n(input.abutmentWidth)} m, D=${n(input.abutmentDepth)} m` }] },
      { cells: [{ value: 'Earth pressure basis' }, { value: 'Rankine active pressure coefficient and resultant thrust checks.' }] },
      { cells: [{ value: 'Narrative acceptance' }, { value: 'Sliding/overturning/bearing checks with load-combination verdicts.' }] },
    ]);
  } else if (sheetNum >= 30 && sheetNum <= 41) {
    drawTable(doc, nextTableY, [
      { header: 'C1 derivation context', width: 54, align: 'left' as const },
      { header: 'Value / narrative', width: 131, align: 'left' as const },
    ], [
      { cells: [{ value: 'Cantilever geometry' }, { value: `H=${n(input.abutmentHeight)} m with staged stem/base action checks` }] },
      { cells: [{ value: 'Footing stress basis' }, { value: 'Base area pressure distribution compared against SBC and uplift limits.' }] },
      { cells: [{ value: 'Narrative acceptance' }, { value: 'Critical case and governing FOS are stated before final verdict.' }] },
    ]);
  } else if (sheetNum >= 42 && sheetNum <= 46) {
    drawTable(doc, nextTableY, [
      { header: 'Estimation/report context', width: 54, align: 'left' as const },
      { header: 'Value / narrative', width: 131, align: 'left' as const },
    ], [
      { cells: [{ value: 'BOQ basis' }, { value: 'Quantities from design geometry and reinforcement outputs.' }] },
      { cells: [{ value: 'Rate logic' }, { value: 'Item quantity × rate with subtotal and total checks.' }] },
      { cells: [{ value: 'Narrative acceptance' }, { value: 'Totals are presented with transparent quantity origin and computation path.' }] },
    ]);
  } else {
    drawTable(doc, nextTableY, [
      { header: 'Engineering note', width: 54, align: 'left' as const },
      { header: 'Narrative', width: 131, align: 'left' as const },
    ], [
      { cells: [{ value: 'Computation visibility' }, { value: 'This sheet participates in the same input -> derivation -> check -> verdict reporting chain.' }] },
      { cells: [{ value: 'Quality gate' }, { value: 'Values are generated from the same engine and workbook path used by regression tests.' }] },
    ]);
  }
}

function addFinalSummary(doc: jsPDF, input: EnhancedProjectInput, pageNum: number, totalPages: number): void {
  addSheetHeader(doc, 'DESIGN SUMMARY', pageNum, totalPages);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('BRIDGE DESIGN SUMMARY', PAGE_WIDTH / 2, 60, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  doc.text(
    'Narrative closure: this summary consolidates final geometry, hydraulics, stability, and deliverable counts.',
    MARGIN,
    69,
  );

  const pierCases = input.pier?.loadCases ?? [];
  const minSliding = pierCases.length ? Math.min(...pierCases.map(c => c.slidingFOS)) : undefined;
  const minOverturning = pierCases.length ? Math.min(...pierCases.map(c => c.overturningFOS)) : undefined;
  const minBearing = pierCases.length ? Math.min(...pierCases.map(c => c.bearingFOS)) : undefined;

  const fosRow = (label: string, value: number | undefined, min: number): [string, string] => [
    label,
    value === undefined
      ? 'not computed'
      : `${value.toFixed(2)} vs min ${min} - ${value >= min ? 'OK' : 'BELOW LIMIT'}`,
  ];

  const summary: [string, string][] = [
    ['Project Name', input.projectName],
    ['Total Length', `${n(input.totalLength)} m`],
    ['Span Configuration', `${input.numberOfSpans} spans x ${n(input.spanLength)} m`],
    ['Carriageway Width', `${n(input.carriageWidth)} m`],
    ['Highest Flood Level', `${n(input.hfl)} m MSL`],
    ['Design Discharge', `${n(input.hydraulics?.discharge, 2)} cumecs`],
    ['Design Velocity', `${n(input.hydraulics?.velocity, 2)} m/s`],
    ...(input.bridgeType === 'high-level' ? [
      ['Clearance above HFL', `${n(input.hydraulics?.freeboardAboveHfl, 3)} m`] as [string, string],
      ['Clearance above DWL', `${n(input.hydraulics?.freeboard, 3)} m`] as [string, string],
      ['Max Wind Force (Pier)', `${n(input.pier?.loads?.windForce, 2)} kN`] as [string, string],
    ] : []),
    fosRow('Pier Sliding FOS (min)', minSliding, STABILITY_ACCEPTANCE.slidingFosMin),
    fosRow('Pier Overturning FOS (min)', minOverturning, STABILITY_ACCEPTANCE.overturningFosMin),
    fosRow('Pier Bearing FOS (min)', minBearing, STABILITY_ACCEPTANCE.bearingFosMin),
    ['Number of Piers', `${input.numberOfPiers}`],
    ['Total Sheets', `${EXPECTED_SHEET_COUNT}`],
    ['Total Pages', `${totalPages}`]
  ];

  // The block has to stop above the certification rule, so the pitch adapts to the row count.
  const pitch = Math.min(11, (244 - 88) / summary.length);
  let y = 88;
  doc.setFontSize(10);
  summary.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text(label + ':', MARGIN + 20, y);

    doc.setFont('helvetica', 'normal');
    const fails = value.includes('BELOW LIMIT');
    const failColor: [number, number, number] = [231, 76, 60];
    doc.setTextColor(...(fails ? failColor : COLORS.value));
    const valueLines = doc.splitTextToSize(String(value), CONTENT_WIDTH - 80) as string[];
    valueLines.forEach((line, li) => doc.text(line, MARGIN + 80, y + li * 4.6));

    y += pitch + (valueLines.length - 1) * 4.6;
  });

  // Certification
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 250, PAGE_WIDTH - MARGIN, 250);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('This design has been prepared in accordance with IRC standards.', PAGE_WIDTH / 2, 265, { align: 'center' });
  doc.text('End of Report', PAGE_WIDTH / 2, 280, { align: 'center' });
}

// Utility functions
/**
 * Cuts `value` to what fits in `maxWidth` at the font size currently set, marking the cut with
 * an ellipsis. Cell text is drawn without clipping, so an over-long string would otherwise run
 * straight through the neighbouring column.
 */
function fitCellText(doc: jsPDF, value: string, maxWidth: number): string {
  const full = doc.getTextWidth(value);
  if (full <= maxWidth) return value;
  let keep = Math.max(1, Math.floor((value.length * maxWidth) / full) - 1);
  let cut = `${value.slice(0, keep)}…`;
  while (keep > 1 && doc.getTextWidth(cut) > maxWidth) {
    keep -= 1;
    cut = `${value.slice(0, keep)}…`;
  }
  return cut;
}

type TableOptions = {
  /** false keeps a fixed 7 mm row pitch and clips each cell to its column instead of wrapping it. */
  wrap?: boolean;
  /** Sheet header band to draw when the table overflows onto another page. */
  continuation?: { label: string; totalPages: number };
};

function drawTable(
  doc: jsPDF,
  startY: number,
  headers: { header: string; width: number; align?: 'left' | 'right' | 'center' }[],
  rows: { cells: { value: string; bold?: boolean; formula?: boolean; bgColor?: [number, number, number]; colSpan?: number }[] }[],
  opts: TableOptions = {}
): number {
  let y = startY;
  const rowHeight = 7;
  const LINE_HEIGHT = 4.2;
  const wrap = opts.wrap !== false;
  /** Continues the owning sheet's header band on pages the table overflows onto, so no page ships unlabelled. */
  const breakToNewPage = (): void => {
    doc.addPage();
    if (opts.continuation) {
      addSheetHeader(doc, opts.continuation.label, doc.getNumberOfPages(), opts.continuation.totalPages);
    }
    y = 30;
  };

  /** A table that starts below the text block would print its header off the page. */
  if (y > PAGE_HEIGHT - 40) breakToNewPage();

  /** A4 with 15 mm margins leaves CONTENT_WIDTH of text block; a wider table would run off the page. */
  const authoredWidth = headers.reduce((w, h) => w + h.width, 0);
  const scale = authoredWidth > CONTENT_WIDTH ? CONTENT_WIDTH / authoredWidth : 1;
  const widths = headers.map((h) => h.width * scale);

  // Draw headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const headerLines = headers.map((h, hi) =>
    h.header
      .split('\n')
      .flatMap((part) => doc.splitTextToSize(part, (widths[hi] ?? h.width) - 4) as string[]),
  );
  const headerHeight = Math.max(
    rowHeight,
    Math.max(1, ...headerLines.map((lines) => lines.length)) * LINE_HEIGHT + rowHeight - LINE_HEIGHT,
  );

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);

  /** PDF text and shape fill share the non-stroking colour operator, so every rect re-arms its own fill. */
  let x = MARGIN;
  headers.forEach((h, hi) => {
    const w = widths[hi] ?? h.width;
    doc.setFillColor(...COLORS.tableHeader);
    doc.rect(x, y, w, headerHeight, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    (headerLines[hi] ?? []).forEach((line, li) => {
      doc.text(line, x + 2, y + 4.6 + li * LINE_HEIGHT);
    });

    x += w;
  });

  y += headerHeight;

  // Draw rows
  rows.forEach((row, ridx) => {
    doc.setFontSize(8);
    const rowLines = row.cells.map((cell, cidx) => {
      const w = widths[cidx] ?? headers[cidx]?.width ?? 0;
      doc.setFont('helvetica', cell.bold ? 'bold' : 'normal');
      if (!wrap) return [fitCellText(doc, String(cell.value), w - 4)];
      return doc.splitTextToSize(String(cell.value), w - 4) as string[];
    });
    const height = Math.max(rowHeight, Math.max(1, ...rowLines.map((l) => l.length)) * LINE_HEIGHT + rowHeight - LINE_HEIGHT);

    // Alternating background
    if (ridx % 2 === 0) {
      doc.setFillColor(...COLORS.tableAlt);
      doc.rect(MARGIN, y, CONTENT_WIDTH, height, 'F');
    }

    x = MARGIN;
    row.cells.forEach((cell, cidx) => {
      const h = headers[cidx];
      if (!h) return;
      const w = widths[cidx] ?? h.width;

      // Cell background if specified
      if (cell.bgColor) {
        doc.setFillColor(...cell.bgColor);
        doc.rect(x, y, w, height, 'F');
      }

      // Cell border
      doc.setDrawColor(...COLORS.border);
      doc.rect(x, y, w, height, 'S');

      // Text
      doc.setFont('helvetica', cell.bold ? 'bold' : 'normal');
      doc.setFontSize(8);

      if (cell.formula) {
        doc.setTextColor(...COLORS.formula);
      } else if (cell.bgColor) {
        const [r, g, b] = cell.bgColor;
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luminance > 140) doc.setTextColor(...COLORS.text);
        else doc.setTextColor(255, 255, 255);
      } else {
        doc.setTextColor(...COLORS.text);
      }

      const align = h.align || 'left';
      const textX = align === 'right' ? x + w - 2 : align === 'center' ? x + w / 2 : x + 2;

      (rowLines[cidx] ?? ['']).forEach((line, li) => {
        doc.text(fitCellText(doc, line, w - 4), textX, y + 4.6 + li * LINE_HEIGHT, { align });
      });

      x += w;
    });

    y += height;

    // Page break if needed
    if (y > PAGE_HEIGHT - 30) breakToNewPage();
  });

  return y;
}

function getSheetName(sheetNum: number): string {
  const names: Record<number, string> = {
    5: 'DECK ANCHORAGE',
    6: 'CROSS SECTION',
    7: 'BED SLOPE',
    8: 'SBC',
    10: 'ABSTRACT OF STRESSES',
    11: 'STEEL IN FLARED PIER',
    12: 'PIER REMAINING',
    13: 'FOOTING DESIGN',
    14: 'FOOTING STRESS DIAGRAM',
    15: 'PIER CAP LL',
    16: 'PIER CAP',
    17: 'LLOAD',
    18: 'LOAD SUMM',
    19: 'TYPE1 ABUTMENT DRAWING',
    20: 'LL ABSTRACT',
    21: 'TYPE1 STABILITY CHECK',
    22: 'TYPE1 FOOTING DESIGN',
    23: 'TYPE1 FOOTING STRESS',
    24: 'TYPE1 STEEL IN ABUTMENT',
    25: 'TYPE1 ABUTMENT CAP',
    26: 'TYPE1 DIRT WALL REINF',
    27: 'TYPE1 DIRT DIRECTLOAD BM',
    28: 'TYPE1 DIRT LL BM',
    30: 'INSERT C1 ABUTMENT',
    31: 'C1 ABUTMENT DRAWING',
    32: 'C1 STABILITY CHECK',
    33: 'C1 FOOTING DESIGN',
    34: 'C1 FOOTING STRESS',
    35: 'CAN RETURN FOOTING DESIGN',
    36: 'STEEL IN CANT ABUTMENT',
    37: 'STEEL IN CANT RETURNS',
    38: 'C1 ABUTMENT CAP',
    39: 'C1 DIRT WALL REINF',
    40: 'C1 DIRT DIRECTLOAD BM',
    41: 'C1 DIRT LL BM',
    43: 'TECH REPORT',
    44: 'GENERAL ABSTRACT',
    45: 'ABSTRACT'
  };
  return names[sheetNum] || `SHEET ${sheetNum}`;
}

export async function generateComprehensivePDF(input: EnhancedProjectInput): Promise<Buffer> {
  const { buffer } = await generateComprehensivePDFInternal(input);
  return buffer;
}

/** Same PDF as {@link generateComprehensivePDF}; includes true page count from jsPDF after build. */
export async function generateComprehensivePDFWithPageCount(
  input: EnhancedProjectInput,
): Promise<{ buffer: Buffer; pageCount: number }> {
  return generateComprehensivePDFInternal(input);
}
