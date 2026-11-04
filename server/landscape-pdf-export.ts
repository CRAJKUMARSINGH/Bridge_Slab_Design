import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { EXPECTED_SHEET_NAMES, isLandscapeSheet } from '../bridge-excel-generator/sheet-contract';
import { buildWorkbookSheetPreviews } from './workbook-sheets-preview';

/**
 * Generates an A4 PDF book containing all workbook sheets (cover, topic index,
 * design reports, drawings). Enforces "Separate sheet on separate page" and
 * honours the owner-confirmed orientation table (sheet-contract §isLandscapeSheet):
 * listed sheets print landscape, everything else portrait — 15 mm margins.
 *
 * A sheet paginates to as many pages as its rows need, so its page number is not its
 * position in the list. The topic index therefore cites pages measured from a real
 * render: index placeholders are created up front (their count depends only on the sheet
 * list, never on the numbers they print, so every pass has the same geometry), the sheets
 * render behind them, and the index is then redrawn in place with the measured starting
 * pages. Long sheets get a continuation band on the pages autoTable adds, so no page
 * ships without its identity.
 */
export async function generateLandscapeBookPDF(input: ProjectInput): Promise<Buffer> {
  let measured: number[] | null = null;
  for (let pass = 0; pass < 3; pass++) {
    const rendered = await renderLandscapeBook(input, measured);
    if (measured !== null && samePages(measured, rendered.firstPages)) return rendered.buffer;
    measured = rendered.firstPages;
  }
  throw new Error(`Sheet-book pagination did not settle in 3 passes (last: ${measured?.join(', ')})`);
}

function samePages(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

type BookRender = {
  buffer: Buffer;
  /** Real first table page of each sheet, indexed in workbook order. */
  firstPages: number[];
};

const PAGE_WIDTH = 297; // Landscape A4
const PAGE_HEIGHT = 210;
const MARGIN = 15;
const BAND_HEIGHT = 20;
/** Body starts under the band; a sheet whose source is longer than this gets a printed warning. */
const PRINT_MAX_ROWS = 400;
const PRINT_MAX_COLS = 18;
/** Last row lands at 40 + (n-1)*8 mm, which keeps the 15 mm bottom margin on landscape A4. */
const INDEX_ITEMS_PER_PAGE = 19;

const COLORS = {
  header: [31, 73, 107] as [number, number, number],
  text: [44, 62, 80] as [number, number, number],
};

async function renderLandscapeBook(input: ProjectInput, measured: number[] | null): Promise<BookRender> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Pull all raw Excel sheet data via our existing preview generator. The book prints the whole
  // sheet, so it asks for a wider window than the web viewer uses; anything still outside it is
  // declared on the page rather than silently dropped.
  const sheets = await buildWorkbookSheetPreviews(input, { maxRows: PRINT_MAX_ROWS, maxCols: PRINT_MAX_COLS });
  const drawingIndex = sheets.findIndex((s) => /drawing|sketch/i.test(s.name));

  drawCover(doc, input);

  const indexItems = buildIndexItems(sheets, measured, drawingIndex);
  for (let i = 0; i < indexPageCount(indexItems.length); i++) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'landscape');

  const firstPages: number[] = [];
  const pageWidths: number[] = [];
  const dividers: Array<{ page: number; width: number }> = [];

  for (let idx = 0; idx < sheets.length; idx++) {
    const sheet = sheets[idx]!;

    // Per-sheet A4 orientation from the owner-confirmed contract table.
    const knownSheet = (EXPECTED_SHEET_NAMES as readonly string[]).includes(sheet.name);
    const landscape = !knownSheet || isLandscapeSheet(sheet.name); // unknown extras stay landscape
    const pageW = landscape ? PAGE_WIDTH : 210; // A4 swap: 297x210 <-> 210x297
    const pageH = landscape ? PAGE_HEIGHT : 297;

    doc.addPage([pageW, pageH], landscape ? 'landscape' : 'portrait');

    const section = idx === 0 ? 'SECTION 1: DESIGN REPORTS' : idx === drawingIndex ? 'SECTION 2: DRAWING SECTION' : null;
    if (section) {
      drawSectionDivider(doc, section, pageW, pageH);
      dividers.push({ page: doc.getNumberOfPages(), width: pageW });
      doc.addPage([pageW, pageH], landscape ? 'landscape' : 'portrait');
    }

    firstPages.push(doc.getNumberOfPages());
    pageWidths.push(pageW);

    if (sheet.rows.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.text);
      doc.text('No data populated in this sheet.', MARGIN, 40);
    } else {
      drawSheetTable(doc, sheet, printCoverageWarning(doc, sheet), pageW);
    }
    // The head band is drawn in the final pass, once the document length is known: drawing it
    // here too would paint a second, shorter stamp over the same baseline.
  }

  const pageCount = doc.getNumberOfPages();

  // The index, the section dividers and every "of N" stamp can only be written once the real
  // length is known, so they are drawn over the measuring render's output.
  for (let ordinal = 0; ordinal < indexPageCount(indexItems.length); ordinal++) {
    doc.setPage(2 + ordinal);
    drawIndexPage(doc, indexItems, ordinal);
    stampBand(doc, `FILE TOPIC INDEX${ordinal === 0 ? '' : ' (CONT.)'}`, PAGE_WIDTH, 2 + ordinal, pageCount);
  }

  firstPages.forEach((page, idx) => stampBand(doc, `SHEET: ${sheets[idx]!.name.toUpperCase()}`, pageWidths[idx]!, page, pageCount));

  dividers.forEach((divider) => stampBand(doc, 'SECTION DIVIDER', divider.width, divider.page, pageCount));

  // Continuation bands: the pages autoTable added inside a sheet carry that sheet's identity.
  const dividerSet = new Set(dividers.map((divider) => divider.page));
  for (let idx = 0; idx < firstPages.length; idx++) {
    const end = idx + 1 < firstPages.length ? firstPages[idx + 1]! - 1 : pageCount;
    for (let page = firstPages[idx]! + 1; page <= end; page++) {
      if (dividerSet.has(page)) continue;
      stampBand(doc, `SHEET: ${sheets[idx]!.name.toUpperCase()} (CONT.)`, pageWidths[idx]!, page, pageCount);
    }
  }

  return { buffer: Buffer.from(doc.output('arraybuffer')), firstPages };
}

/** Navy head band: page identity plus its page stamp. */
function stampBand(doc: jsPDF, label: string, width: number, page: number, totalPages = 0): void {
  const last = doc.getNumberOfPages();
  doc.setPage(page);
  doc.setFillColor(...COLORS.header);
  doc.rect(0, 0, width, BAND_HEIGHT, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(label, MARGIN, 14);
  doc.setFontSize(10);
  doc.text(totalPages ? `Page ${page} of ${totalPages}` : `Page ${page}`, width - MARGIN, 14, { align: 'right' });
  doc.setPage(last);
}

function drawCover(doc: jsPDF, input: ProjectInput): void {
  doc.setFillColor(...COLORS.header);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.text('EXECUTIVE ENGINEERING BOOK', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 20, { align: 'center' });

  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.text(input.projectName || 'Bridge Slab Design Dossier', PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 10, { align: 'center' });

  doc.setFontSize(14);
  const bridgeLabel = input.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge';
  doc.text(`Type: ${bridgeLabel} | Generated: ${new Date().toLocaleDateString()}`, PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 30, { align: 'center' });
}

function drawSectionDivider(doc: jsPDF, section: string, width: number, height: number): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...COLORS.header);
  doc.text(section, width / 2, height / 2, { align: 'center' });
}

function indexPageCount(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / INDEX_ITEMS_PER_PAGE));
}

type IndexItem = { title: string; page: string; section: boolean };

function buildIndexItems(sheets: Array<{ name: string }>, measured: number[] | null, drawingIndex: number): IndexItem[] {
  // The index prints the sheet's first table page; its section divider sits one page earlier.
  const pageOf = (sheetIndex: number): string => {
    const real = measured?.[sheetIndex];
    return real ? `Page ${real}` : 'Page -';
  };
  const startsPage = (sheetIndex: number): string => {
    const real = measured?.[sheetIndex];
    return real ? `Starts Page ${real - 1}` : 'Starts Page -';
  };

  const items: IndexItem[] = [
    { title: 'Section 1: Design Reports Section', page: startsPage(0), section: true },
  ];
  const section2 = drawingIndex === -1 ? sheets.length : drawingIndex;
  sheets.slice(0, section2).forEach((s, i) => items.push({ title: `  - ${s.name}`, page: pageOf(i), section: false }));
  if (drawingIndex !== -1) {
    items.push({ title: 'Section 2: Drawing & Schematic Section', page: startsPage(drawingIndex), section: true });
    sheets.slice(drawingIndex).forEach((s, i) => items.push({ title: `  - ${s.name}`, page: pageOf(drawingIndex + i), section: false }));
  }
  return items;
}

function drawIndexPage(doc: jsPDF, items: IndexItem[], ordinal: number): void {
  const slice = items.slice(ordinal * INDEX_ITEMS_PER_PAGE, (ordinal + 1) * INDEX_ITEMS_PER_PAGE);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  doc.setLineWidth(0.5);
  doc.setDrawColor(...COLORS.header);
  doc.line(MARGIN, 32, PAGE_WIDTH - MARGIN, 32);

  let y = 40;
  for (const item of slice) {
    doc.setFont('helvetica', item.section ? 'bold' : 'normal');
    doc.setFontSize(item.section ? 12 : 10);
    doc.setTextColor(...(item.section ? COLORS.header : COLORS.text));
    doc.text(item.title.substring(0, 100), MARGIN + (item.section ? 0 : 6), y);
    doc.text(item.page, PAGE_WIDTH - MARGIN - (item.section ? 0 : 6), y, { align: 'right' });
    y += 8;
  }
}

function drawSheetTable(doc: jsPDF, sheet: { colCount: number; rows: string[][] }, startY: number, pageW: number): void {
  const head = [Array.from({ length: sheet.colCount }).map((_, i) => `Col ${excelColumnLabel(i)}`)];
  const body = sheet.rows.map((row) => row.slice(0, sheet.colCount).map((cell) => cell || ''));
  const contentW = pageW - 2 * MARGIN;

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    // autoTable sizes columns from content, which lets a long narrative cell run past the page
    // edge. Explicit widths make every cell wrap inside its own column instead.
    tableWidth: contentW,
    columnStyles: Object.fromEntries(
      columnWidths(sheet, contentW).map((width, i) => [i, { cellWidth: width }])
    ),
    styles: { fontSize: 7, cellPadding: 1, textColor: [50, 50, 50], lineColor: [200, 200, 200], lineWidth: 0.1, overflow: 'linebreak' },
    headStyles: { fillColor: COLORS.header, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: startY, right: MARGIN, bottom: 20, left: MARGIN }
  });
}

/**
 * Column widths share the printable width by content length, clamped so a one-character
 * index column does not collapse and a paragraph column does not swallow the page. Each
 * column keeps a floor wide enough to print its own header without breaking the word.
 */
function columnWidths(sheet: { colCount: number; rows: string[][] }, contentW: number): number[] {
  const weightOf = (col: number): number => {
    let longest = 4;
    for (const row of sheet.rows) longest = Math.max(longest, (row[col] ?? '').length);
    return Math.min(Math.max(longest, 6), 46);
  };
  const weights = Array.from({ length: sheet.colCount }, (_, c) => weightOf(c));
  const total = weights.reduce((a, b) => a + b, 0);
  const minW = Math.min(10, contentW / sheet.colCount / 2);
  const widths = weights.map((w) => Math.max((contentW * w) / total, minW));
  const overflow = widths.reduce((a, b) => a + b, 0) - contentW;
  if (overflow <= 0) return widths;
  const slack = widths.map((w) => Math.max(w - minW, 0));
  const slackTotal = slack.reduce((a, b) => a + b, 0) || 1;
  return widths.map((w, i) => w - (overflow * slack[i]!) / slackTotal);
}

/** 0-based column index as the Excel letter the reader sees in design-workbook.xlsx. */
function excelColumnLabel(index: number): string {
  let label = '';
  for (let n = index; n >= 0; n = Math.floor(n / 26) - 1) label = String.fromCharCode(65 + (n % 26)) + label;
  return label;
}

/**
 * A worksheet longer than the print window must not look complete. Prints the shortfall on the
 * sheet's first page and returns the y the table may start at.
 */
function printCoverageWarning(doc: jsPDF, sheet: { rowCount: number; sourceRowCount: number }): number {
  if (sheet.sourceRowCount <= sheet.rowCount) return BAND_HEIGHT + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(155, 34, 38);
  doc.text(
    `!! PRINT CLIPPED: this worksheet holds ${sheet.sourceRowCount} rows. Rows ${sheet.rowCount + 1}-${sheet.sourceRowCount} do not print here; read them in design-workbook.xlsx.`,
    MARGIN,
    27
  );
  return 33;
}
