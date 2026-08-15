import XLSX from 'xlsx';
import fs from 'fs';
import { jsPDF } from 'jspdf';

async function generatePDFFromExcel() {
  // Read the Excel file
  const buffer = fs.readFileSync('attached_assets/for replit FINAL_RESULT_1763885256922.xls');
  const workbook = XLSX.read(buffer);
  
  console.log('Found', workbook.SheetNames.length, 'sheets');
  
  // Create PDF
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210, pageHeight = 297, margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let pageNum = 1;
  let yPos = margin;
  
  const colors = { 
    primary: [54, 96, 146],
    dark: [44, 62, 80],
    light: [236, 240, 241]
  };
  
  function addPage() {
    doc.addPage();
    yPos = margin;
  }
  
  function addHeader() {
    doc.setFontSize(9);
    doc.setTextColor(...colors.dark);
    doc.text('SUBMERSIBLE SKEW BRIDGE - FINAL DESIGN REPORT', margin, margin - 5);
    doc.text(`Page ${pageNum}`, pageWidth - margin - 20, margin - 5);
    doc.setDrawColor(...colors.primary);
    doc.line(margin, margin - 2, pageWidth - margin, margin - 2);
  }
  
  function addFooter() {
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(...colors.primary);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.text('SUBMERSIBLE BRIDGE DESIGN', margin, pageHeight - 5);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin - 40, pageHeight - 5);
  }
  
  // Cover page
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('SUBMERSIBLE SKEW BRIDGE DESIGN', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(...colors.dark);
  doc.text('Comprehensive Engineering Report with Detailed Calculations', pageWidth / 2, 80, { align: 'center' });
  
  yPos = 120;
  doc.setFontSize(11);
  doc.text('Project: Design of Submersible Skew Bridge', margin, yPos);
  yPos += 10;
  doc.text('Location: Kherwara - Jawas - Suveri Road, Across River Som', margin, yPos);
  
  pageNum = 2;
  addPage();
  
  // Extract and display each sheet
  let sheetCount = 0;
  for (const sheetName of workbook.SheetNames) {
    if (sheetCount > 25) break; // Limit to avoid huge PDF
    
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    
    // Filter out empty rows
    const filteredData = data.filter(row => row.some(cell => String(cell).trim()));
    
    if (filteredData.length === 0) continue;
    
    // Check if we need a new page
    const rowsNeeded = Math.min(filteredData.length, 15);
    if (yPos + rowsNeeded * 4 > pageHeight - margin - 15) {
      addFooter();
      addPage();
      addHeader();
    }
    
    // Sheet title
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.primary);
    doc.setFillColor(...colors.light);
    doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
    doc.text(sheetName, margin + 2, yPos + 1);
    yPos += 12;
    
    // Sheet data (first 12 rows)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...colors.dark);
    
    filteredData.slice(0, 12).forEach((row, idx) => {
      if (yPos > pageHeight - margin - 10) {
        addFooter();
        addPage();
        addHeader();
      }
      
      const rowText = row.slice(0, 3).map(v => String(v || '').substring(0, 50)).join(' | ');
      const lines = doc.splitTextToSize(rowText, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 3 + 1;
    });
    
    yPos += 8;
    sheetCount++;
  }
  
  addFooter();
  
  // Save PDF
  const pdfPath = 'attached_assets/BRIDGE_DESIGN_REPORT.pdf';
  doc.save(pdfPath);
  console.log('PDF created:', pdfPath);
}

generatePDFFromExcel();
