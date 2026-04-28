import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { buildWorkbookSheetPreviews } from './workbook-sheets-preview';

/**
 * Generates an Elegant A4 Landscape PDF containing all 55 generated sheets.
 * Includes a Cover Page, File Topic Index Page, Design Reports Section, and Drawing Section.
 * Enforces "Separate sheet on separate page".
 */
export async function generateLandscapeBookPDF(input: ProjectInput): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Pull all raw Excel sheet data via our existing preview generator
  const sheets = await buildWorkbookSheetPreviews(input);

  // Constants
  const PAGE_WIDTH = 297; // Landscape A4
  const PAGE_HEIGHT = 210;
  const MARGIN = 15;

  const COLORS = {
    header: [31, 73, 107] as [number, number, number],
    text: [44, 62, 80] as [number, number, number],
    accent: [40, 80, 150] as [number, number, number],
  };

  // 1. Cover Page
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

  // 2. File Topic Index Page
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  
  doc.setTextColor(...COLORS.header);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('FILE TOPIC INDEX PAGE', MARGIN, 30);
  
  doc.setLineWidth(1);
  doc.setDrawColor(...COLORS.header);
  doc.line(MARGIN, 35, PAGE_WIDTH - MARGIN, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.text);

  let yCursor = 50;
  const TOC_ITEMS = [
    { title: 'Section 1: Design Reports Section', page: 'Starts Page 3' },
    ...sheets.slice(0, 45).map((s, i) => ({ title: `  • ${s.name}`, page: `Page ${i + 3}` })),
    { title: 'Section 2: Drawing & Schematic Section', page: 'Starts Page 48' },
    ...sheets.slice(45).map((s, i) => ({ title: `  • ${s.name}`, page: `Page ${i + 48}` }))
  ];

  for (const item of TOC_ITEMS) {
    if (yCursor > PAGE_HEIGHT - 20) {
      doc.addPage();
      yCursor = 30;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...COLORS.header);
      doc.text('FILE TOPIC INDEX PAGE (CONT.)', MARGIN, yCursor);
      doc.line(MARGIN, yCursor + 5, PAGE_WIDTH - MARGIN, yCursor + 5);
      yCursor += 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.text);
    }
    
    if (item.title.startsWith('Section')) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.header);
      doc.text(item.title, MARGIN, yCursor);
      doc.text(item.page, PAGE_WIDTH - MARGIN, yCursor, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
    } else {
      // For topics, limit length so they fit in 2 columns
      doc.text(item.title.substring(0, 100), MARGIN + 10, yCursor);
      doc.text(item.page, PAGE_WIDTH - MARGIN - 10, yCursor, { align: 'right' });
    }
    
    yCursor += 8; // tighter spacing for landscape A4 index
  }

  // 3. Iterate Sheets (Separate Sheet on Separate Page)
  let pageNumber = doc.getNumberOfPages();
  
  for (let idx = 0; idx < sheets.length; idx++) {
    const sheet = sheets[idx];
    doc.addPage();
    pageNumber++;

    // Section Dividers Logic
    if (idx === 0) {
      doc.setFontSize(30);
      doc.setTextColor(...COLORS.header);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 1: DESIGN REPORTS', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center' });
      doc.addPage();
      pageNumber++;
    } else if (sheet.name.toLowerCase().includes('drawing') || sheet.name.toLowerCase().includes('sketch')) {
      // Naive catch for drawing section start if it exists
      doc.setFontSize(30);
      doc.setTextColor(...COLORS.header);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 2: DRAWING SECTION', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center' });
      doc.addPage();
      pageNumber++;
    }

    // Sheet Heading
    doc.setFillColor(...COLORS.header);
    doc.rect(0, 0, PAGE_WIDTH, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`SHEET: ${sheet.name.toUpperCase()}`, MARGIN, 14);
    doc.setFontSize(10);
    doc.text(`Page ${pageNumber}`, PAGE_WIDTH - MARGIN, 14, { align: 'right' });

    if (sheet.rows.length === 0) {
      doc.setTextColor(...COLORS.text);
      doc.text('No data populated in this sheet.', MARGIN, 40);
      continue;
    }

    // Prepare table data for jspdf-autotable
    const maxColsToPrint = Math.min(sheet.colCount, 15); // Print max 15 columns nicely on landscape
    const head = [Array.from({ length: maxColsToPrint }).map((_, i) => `Col ${i+1}`)];
    const body = sheet.rows.map(row => row.slice(0, maxColsToPrint).map(cell => cell || ''));

    // Draw the Elegant Table
    autoTable(doc, {
      startY: 30,
      head: head,
      body: body,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1,
        textColor: [50, 50, 50],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLORS.header,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { top: 30, right: MARGIN, bottom: 20, left: MARGIN }
    });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
