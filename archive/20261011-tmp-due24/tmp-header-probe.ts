import { jsPDF } from 'jspdf';
import { writeFileSync } from 'node:fs';

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const COLORS = { tableHeader: [31, 56, 86] as [number, number, number], border: [160, 160, 160] as [number, number, number] };
doc.setFillColor(...COLORS.tableHeader);
doc.setDrawColor(...COLORS.border);
doc.setLineWidth(0.3);
let x = 15;
const y = 55;
const widths = [63, 22.5, 18, 31.5, 45];
const labels = ['Item Description', 'Qty', 'Unit', 'Rate', 'Amount'];
widths.forEach((w, i) => {
  doc.rect(x, y, w, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(labels[i]!, x + 2, y + 4);
  x += w;
});
writeFileSync('archive/20261011-tmp-due24/tmp-header.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('ok');
