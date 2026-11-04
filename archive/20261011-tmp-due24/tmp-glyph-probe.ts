import { jsPDF } from 'jspdf';
import { writeFileSync } from 'node:fs';

const samples: [string, string][] = [
  ['phi', 'Phi (φ) 30'],
  ['gamma', 'Gamma (γ) 18 kN/m'],
  ['mu', 'mu 0.35 MPa'],
  ['ge', 'Sliding >= vs ≥ 1.4'],
  ['le', 'Bearing ≤ 200'],
  ['minus', 'Delta − 12.5'],
  ['arrow', 'input -> output → verdict'],
  ['rupee', 'Cost ₹ 1,65,80,143'],
  ['lrarrow', 'span ↔ length'],
  ['warn', '⚠ ROBOTIC'],
  ['tortoise', '〔L〕 landscape'],
  ['box', '──── rule'],
];

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
doc.setFontSize(11);
samples.forEach(([name, text], i) => {
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`${i + 1}. ${name}: ${text}`, 15, 20 + i * 10);
});
writeFileSync('archive/20261011-tmp-due24/tmp-glyph.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('written');
