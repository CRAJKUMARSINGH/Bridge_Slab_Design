/**
 * PDF Export — generates a professional design report using jsPDF
 * All data from EnhancedProjectInput (engine results)
 */

import { jsPDF } from 'jspdf';
import type { EnhancedProjectInput, ProjectInput } from '../bridge-excel-generator/types';
import { buildHydraulicsPreviewRows } from '../shared/hydraulics-sheet-preview';
import { drawWbInputTemplateSheets } from './pdf-input-template-sheets';
import { getFullTechnicalComputationNarrativeChunks } from '../bridge-excel-generator/narrative-engine';
import { deckSlabThicknessOf } from '../bridge-excel-generator/input-contract';

const DARK_BLUE: [number, number, number] = [31, 73, 107];
const MID_BLUE:  [number, number, number] = [40, 80, 150];
const ROW_ALT:   [number, number, number] = [240, 245, 250];
const WHITE:     [number, number, number] = [255, 255, 255];
const DARK_TEXT: [number, number, number] = [50, 50, 50];

export async function generateDesignPDF(input: EnhancedProjectInput): Promise<Buffer> {
  const bridgeTypeLabel = input.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge';
  const deckSlabThickness = deckSlabThicknessOf(input);
  const deckSoffitLevel = input.deckSoffitLevel ?? (input.rtl - deckSlabThickness);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M  = 15;
  const CW = PW - 2 * M;
  let y = M;

  const newPage = () => { doc.addPage(); y = M; };
  const checkY  = (need: number) => { if (y + need > PH - 15) newPage(); };

  const heading = (text: string, size = 14) => {
    checkY(size / 2 + 4);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_BLUE);
    doc.text(text, M, y);
    y += size / 2.5 + 2;
  };

  const subheading = (text: string) => {
    checkY(8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MID_BLUE);
    doc.text(text, M, y);
    y += 6;
  };

  const kv = (key: string, value: string | number, unit = '') => {
    checkY(6);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.text(`${key}:`, M + 2, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 160);
    doc.text(`${value}${unit ? ' ' + unit : ''}`, M + 65, y);
    y += 5.5;
  };

  const table = (headers: string[], rows: (string | number)[][], colW?: number[]) => {
    const widths = colW ?? Array(headers.length).fill(CW / headers.length);
    checkY(8);
    doc.setFillColor(...DARK_BLUE);
    doc.rect(M, y - 4, CW, 6, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    let x = M;
    headers.forEach((h, i) => { doc.text(h, x + 1, y); x += widths[i]; });
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(8);
    rows.forEach((row, idx) => {
      checkY(6);
      if (idx % 2 === 0) { doc.setFillColor(...ROW_ALT); doc.rect(M, y - 4, CW, 6, 'F'); }
      x = M;
      row.forEach((cell, i) => { doc.text(String(cell ?? '—'), x + 1, y, { maxWidth: widths[i] - 2 }); x += widths[i]; });
      y += 5.5;
    });
    y += 3;
  };

  const paragraphs = (title: string, lines: string[]) => {
    subheading(title);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK_TEXT);
    for (const line of lines) {
      const wrapped = doc.splitTextToSize(line, CW - 4);
      checkY(wrapped.length * 4 + 2);
      doc.text(wrapped, M + 2, y);
      y += wrapped.length * 4 + 1;
    }
    y += 2;
  };

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, PW, 60, 'F');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('BRIDGE DESIGN REPORT', PW / 2, 30, { align: 'center' });
  doc.setFontSize(11);
  doc.text('IRC:6-2016 & IRC:112-2015 Compliant', PW / 2, 42, { align: 'center' });

  y = 75;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_BLUE);
  doc.text(`Project: ${input.projectName}`, PW / 2, y, { align: 'center' }); y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DARK_TEXT);
  doc.text(`Location: ${input.location}`, PW / 2, y, { align: 'center' }); y += 7;
  doc.text(`River: ${input.riverName}`, PW / 2, y, { align: 'center' }); y += 7;
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, PW / 2, y, { align: 'center' }); y += 7;
  doc.text(`Concrete: ${input.concreteGrade}  |  Steel: ${input.steelGrade}`, PW / 2, y, { align: 'center' });

  // ── PAGE 2: INPUT PARAMETERS ───────────────────────────────────────────────
  newPage();
  heading('INPUT PARAMETERS', 16);
  y += 2;

  subheading('Project Information');
  kv('Project Name', input.projectName);
  kv('Location', input.location);
  kv('River Name', input.riverName);
  y += 2;

  subheading('Bridge Geometry');
  kv('Bridge Type', bridgeTypeLabel);
  kv('Number of Spans', input.numberOfSpans);
  kv('Span Length', input.spanLength, 'm');
  kv('Total Length', input.totalLength, 'm');
  kv('Carriageway Width', input.carriageWidth, 'm');
  kv('Number of Lanes', input.numberOfLanes ?? '—');
  y += 2;

  subheading('Hydraulic Data');
  kv('Design Discharge', input.discharge, 'm³/s');
  kv('HFL', input.hfl, 'm MSL');
  kv('Bed Level', input.bedLevel, 'm MSL');
  kv('Foundation Level', input.foundationLevel, 'm MSL');
  kv("Manning's n", input.manningN);
  kv('Bed Slope', `1 in ${input.bedSlope}`);
  kv("Lacey's Silt Factor", input.laceysSiltFactor);
  kv('Deck Soffit Level', deckSoffitLevel, 'm MSL');
  if (input.bridgeType === 'high-level') {
    kv('IRC min. freeboard above HFL (from Q)', input.hydraulics?.ircMinimumFreeboardAboveHfl ?? '—', 'm');
    kv('Project min. freeboard above HFL', input.freeboardAboveHfl ?? 0, 'm');
    kv('Governing required freeboard above HFL', input.hydraulics?.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2), 'm');
  } else {
    kv('Freeboard above HFL', input.freeboardAboveHfl ?? 1.2, 'm');
  }
  y += 2;

  subheading('Materials');
  kv('Concrete Grade', input.concreteGrade);
  kv('fck', input.fck, 'MPa');
  kv('Steel Grade', input.steelGrade);
  kv('fy', input.fy, 'MPa');
  kv('SBC', input.sbc, 'kN/m²');
  kv('Phi (φ)', input.phi, '°');
  kv('Gamma (γ)', input.gamma, 'kN/m³');
  y += 2;
  heading('FULL TECHNICAL COMPUTATION TRACE', 14);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...DARK_TEXT);
  const traceLead =
    'Workbook-aligned narrative (hydraulics → pier → Type1 → C1 → structural → closure → verification → estimation), same chain as the HTML design report.';
  const traceLeadLines = doc.splitTextToSize(traceLead, CW - 4);
  for (const ln of traceLeadLines) {
    checkY(5);
    doc.text(ln, M + 2, y);
    y += 4;
  }
  y += 2;
  doc.setFont('helvetica', 'normal');
  for (const chunk of getFullTechnicalComputationNarrativeChunks(input)) {
    paragraphs(chunk.title, chunk.paragraphs);
  }

  // ── INPUT template sheets (same row order as Excel 00-input-template-*) ───
  drawWbInputTemplateSheets(doc, input as ProjectInput, M, PW, PH);

  // ── HYDRAULICS calculation sheet (workbook line order, columns A–H) ────────
  doc.addPage();
  y = M;
  y = drawHydraulicsWorkbookSheet(doc, input as ProjectInput, M, PW, PH, y);

  // ── PAGE 4: PIER STABILITY ─────────────────────────────────────────────────
  newPage();
  heading('PIER STABILITY SUMMARY', 16);
  const pier = input.pier;
  if (pier) {
    subheading('Pier Geometry & Loads');
    kv('Pier Width', pier.geometry.width, 'm');
    kv('Pier Length', pier.geometry.length, 'm');
    kv('Pier Depth', pier.geometry.depth, 'm');
    kv('Base Width', pier.geometry.baseWidth, 'm');
    kv('Dead Load', pier.loads.deadLoad.toFixed(1), 'kN');
    kv('Live Load', pier.loads.liveLoad.toFixed(1), 'kN');
    kv('Buoyancy', pier.loads.buoyancy.toFixed(1), 'kN');
    kv('Hydrostatic (horizontal)', pier.loads.hydrostaticForce.toFixed(1), 'kN');
    kv('Drag / current', pier.loads.dragForce.toFixed(1), 'kN');
    if (input.bridgeType === 'high-level' && typeof pier.loads.windForce === 'number' && pier.loads.windForce > 0) {
      kv('Wind on pier (screening)', pier.loads.windForce.toFixed(1), 'kN');
    }
    kv('Total horizontal (model)', pier.loads.totalHorizontalForce.toFixed(1), 'kN');
    y += 3;

    subheading('Load Case Summary');
    table(
      ['Case', 'Description', 'Sliding FOS', 'Overturning FOS', 'Bearing FOS', 'Status'],
      pier.loadCases.map(lc => [
        lc.caseNumber,
        lc.description,
        lc.slidingFOS.toFixed(2),
        lc.overturningFOS.toFixed(2),
        lc.bearingFOS.toFixed(2),
        lc.status,
      ]),
      [12, 45, 25, 30, 25, 20]
    );
  }

  // ── PAGE 5: ABUTMENT STABILITY ─────────────────────────────────────────────
  newPage();
  heading('ABUTMENT STABILITY SUMMARY', 16);

  for (const [label, abt] of [['TYPE-1', input.abutmentType1], ['C1 (Cantilever)', input.abutmentC1]] as const) {
    if (!abt) continue;
    subheading(`${label} Abutment`);
    kv('Height', abt.geometry.height, 'm');
    kv('Width', abt.geometry.width, 'm');
    kv('Base Width', abt.geometry.baseWidth, 'm');
    kv('Ka', abt.earthPressure.ka.toFixed(4));
    kv('Active EP (Pa)', abt.earthPressure.pa.toFixed(2), 'kN/m');
    y += 2;

    table(
      ['Case', 'Sliding FOS', 'Overturning FOS', 'Bearing FOS', 'Status'],
      abt.loadCases.slice(0, 3).map(lc => [
        lc.caseNumber,
        lc.slidingFOS.toFixed(2),
        lc.overturningFOS.toFixed(2),
        lc.bearingFOS.toFixed(2),
        lc.status,
      ]),
      [15, 35, 40, 35, 25]
    );
    y += 3;
  }

  // ── PAGE 6: ESTIMATION BOQ ─────────────────────────────────────────────────
  /**
   * BSR particulars run to several lines, so rows size themselves to their
   * tallest wrapped cell instead of overwriting the next row. A `strong` row is
   * a section banner spanning the table.
   */
  type WrappedRow = { cells: string[]; strong?: boolean };
  const tableWrapped = (headers: string[], rows: WrappedRow[], colW: number[]) => {
    const lineH = 4.1;
    const wrapRow = (cells: string[]) =>
      cells.map((cell, i) => doc.splitTextToSize(String(cell ?? ''), colW[i] - 2) as string[]);
    const rowHeight = (cells: string[][]) => Math.max(...cells.map((c) => c.length)) * lineH + 1.6;

    doc.setFontSize(8);
    const drawHeader = () => {
      const lines = wrapRow(headers);
      const height = rowHeight(lines) + 0.6;
      if (y + height > PH - 15) newPage();
      doc.setFillColor(...DARK_BLUE);
      doc.rect(M, y - 3.4, CW, height, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      let x = M;
      lines.forEach((cell, i) => { doc.text(cell, x + 1, y); x += colW[i]; });
      y += height;
    };

    drawHeader();
    rows.forEach((row, idx) => {
      const cells = wrapRow(row.cells);
      const height = rowHeight(cells);
      if (y + height > PH - 15) drawHeader();
      doc.setFont('helvetica', row.strong ? 'bold' : 'normal');
      doc.setTextColor(...(row.strong ? MID_BLUE : DARK_TEXT));
      if (row.strong) {
        doc.setFillColor(232, 238, 246);
        doc.rect(M, y - 3.4, CW, height, 'F');
        doc.text(row.cells[0], M + 2, y);
      } else {
        if (idx % 2 === 0) {
          doc.setFillColor(...ROW_ALT);
          doc.rect(M, y - 3.4, CW, height, 'F');
        }
        let x = M;
        cells.forEach((cell, i) => { doc.text(cell, x + 1, y); x += colW[i]; });
      }
      y += height;
    });
    y += 3;
  };

  newPage();
  heading('BILL OF QUANTITIES', 16);
  const est = input.estimation;
  if (est) {
    const sectionByItem = new Map(est.measurements.map((m) => [m.item, m.section]));
    let currentSection = '';
    const boqRows: WrappedRow[] = [];
    est.boq.forEach((b) => {
      const section = sectionByItem.get(b.itemNo) ?? 'ESTIMATE';
      if (section !== currentSection) {
        currentSection = section;
        boqRows.push({ cells: [section], strong: true });
      }
      boqRows.push({
        cells: [
          b.itemNo,
          b.description,
          b.unit,
          b.quantity.toFixed(3),
          b.rate.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
          b.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        ],
      });
    });
    tableWrapped(
      ['Item', 'Particulars', 'Unit', 'Quantity', 'Rate (₹)', 'Amount (₹)'],
      boqRows,
      [10, 88, 12, 20, 25, 25]
    );

    y += 2;
    subheading('ABSTRACT — PWD OVERHEAD LADDER');
    const rupee = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const ladder: WrappedRow[] = [
      { cells: ['Subtotal (A)', rupee(est.cost.subtotal)] },
      { cells: ['Add: Quality Control @ 1.00 %', rupee(est.cost.qualityControl)] },
      { cells: ['Add: Contingency provision @ 3.00 % (booked nil)', rupee(est.cost.contingencyProvision)] },
      { cells: ['Add: Contingencies @ 1.50 %', rupee(est.cost.contingencies)] },
      { cells: ['G.TOTAL (B)', rupee(est.cost.gTotal)], strong: true },
      { cells: ['Add: Prorata Overheads & Profit @ 13.00 %', rupee(est.cost.prorataOverheads)] },
      { cells: ['GRAND TOTAL (₹)', rupee(est.cost.total)], strong: true },
      { cells: ['SAY (₹ Lakh)', est.cost.totalInLacs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })], strong: true },
      { cells: ['Cost per Running Metre (₹/m)', est.cost.ratePerMeter.toLocaleString('en-IN', { maximumFractionDigits: 0 })] },
    ];
    tableWrapped(['Description', 'Amount (₹)'], ladder, [130, 50]);
  }

  // ── PAGE 7: QUANTITY SUMMARY ───────────────────────────────────────────────
  newPage();
  heading('QUANTITY SUMMARY', 16);
  if (est) {
    const q = est.quantities;
    const qty = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 3 });
    tableWrapped(
      ['Material', 'Quantity', 'Unit'],
      [
        { cells: ['PCC / RCC M-15 (blinding, levelling)', qty(q.concrete.m15), 'm³'] },
        { cells: ['RCC M-20', qty(q.concrete.m20), 'm³'] },
        { cells: ['RCC / DM M-25', qty(q.concrete.m25), 'm³'] },
        { cells: ['DM M-30 (deck, wearing coat, approach slabs)', qty(q.concrete.m30), 'm³'] },
        { cells: ['RCC M-35', qty(q.concrete.m35), 'm³'] },
        { cells: ['Total structural concrete', qty(q.concrete.total), 'm³'], strong: true },
        { cells: ['TMT steel reinforcement', qty(q.steel.total), 'MT'] },
        { cells: ['Formwork area (priced inside the concrete rates)', qty(q.formwork), 'm²'] },
        { cells: ['Earthwork in soil up to 3 m', qty(q.excavation.soilUpto3m), 'm³'] },
        { cells: ['Earthwork in soil deeper than 3 m', qty(q.excavation.soil3to6m), 'm³'] },
        { cells: ['Earthwork in soft rock (no blasting)', qty(q.excavation.softRock), 'm³'] },
        { cells: ['Earthwork in hard rock (blasting)', qty(q.excavation.hardRock), 'm³'] },
        { cells: ['Total excavation', qty(q.excavation.total), 'm³'], strong: true },
        { cells: ['Gravelly backfill behind walls', qty(q.backfill), 'm³'] },
      ],
      [120, 35, 25]
    );
    paragraphs('RATE BASIS', [
      'Rates are the location-specific PWD/BSR items of the Rajasthan BSR 2022 register: structural concrete rates include formwork and scaffolding, and reinforcement is billed as a percentage of the RCC volume it reinforces.',
      'The cost build-up follows the PWD overhead ladder — Quality Control, contingency provision, Contingencies, G.Total, then prorata overheads and profit. GST is not added: this is a departmental (non-GST) abstract.',
    ]);
  }

  const buffer = doc.output('arraybuffer');
  return Buffer.from(buffer);
}

/** HYDRAULICS tab as a bordered grid: one row per workbook line, columns A–H (+ row index). */
function drawHydraulicsWorkbookSheet(
  doc: jsPDF,
  input: ProjectInput,
  M: number,
  PW: number,
  PH: number,
  startY: number,
): number {
  let y = startY;
  const CW = PW - 2 * M;
  const RN = 6;
  const W8 = (CW - RN) / 8;
  const rowH = 3.9;
  const model = buildHydraulicsPreviewRows(input);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const ensureSpace = (need: number) => {
    if (y + need > PH - 12) {
      doc.addPage();
      y = M;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(130, 130, 130);
      doc.text('HYDRAULICS (continued)', M, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK_TEXT);
    }
  };

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_BLUE);
  doc.text('HYDRAULICS — workbook layout (line order = Excel tab)', M, y);
  y += 7;

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
  doc.setFont('helvetica', 'normal');

  for (const row of model) {
    ensureSpace(rowH + 1);

    if (row.type === 'merged') {
      if (row.text === '') {
        doc.setFillColor(252, 252, 252);
        doc.rect(M, y, CW, 1.8, 'FD');
        y += 1.8;
        lineNo++;
        continue;
      }
      doc.setFillColor(245, 248, 250);
      doc.setDrawColor(191, 191, 191);
      doc.rect(M, y, RN, rowH, 'FD');
      doc.rect(M + RN, y, CW - RN, rowH, 'FD');
      doc.setFontSize(6.5);
      doc.setTextColor(...DARK_TEXT);
      doc.text(String(lineNo), M + RN - 0.5, y + 2.7, { align: 'right' });
      const t = row.text.length > 110 ? `${row.text.slice(0, 108)}…` : row.text;
      doc.text(t, M + RN + 1, y + 2.6, { maxWidth: CW - RN - 2 });
      y += rowH;
      lineNo++;
      continue;
    }

    x = M;
    doc.setDrawColor(191, 191, 191);
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, RN, rowH, 'S');
    doc.setFontSize(6);
    doc.text(String(lineNo), x + RN - 0.5, y + 2.6, { align: 'right' });
    x += RN;

    for (let ci = 0; ci < 8; ci++) {
      const cell = row.cells[ci];
      doc.rect(x, y, W8, rowH, 'S');
      const isFormula = ci === 7 && Boolean(cell.formula);
      const raw = isFormula ? String(cell.formula) : String(cell.display);
      const chunk = raw.length > 52 ? `${raw.slice(0, 50)}…` : raw;
      doc.setFontSize(isFormula ? 4.8 : 6);
      doc.setTextColor(...(isFormula ? ([0, 85, 35] as [number, number, number]) : DARK_TEXT));
      doc.text(chunk, x + (cell.numeric && !isFormula ? W8 - 0.5 : 0.5), y + 2.5, {
        align: cell.numeric && !isFormula ? 'right' : 'left',
        maxWidth: W8 - 1,
      });
      x += W8;
    }
    doc.setTextColor(...DARK_TEXT);
    y += rowH;
    lineNo++;
  }

  return y + 4;
}
