/**
 * SHEET 19: LL-ABSTRACT (Live Load Abstract)
 * Summarises maximum reaction due to live load (including impact) from
 * loadsumm sheet and converts MT → kN for use in pier/abutment design.
 *
 * Source: FINAL_RESULT.xls — Sheet 19 "LL-ABSTRACT"
 * Extracted: 7 rows × 11 cols | 6 cross-sheet formulas (H2, K2 etc.)
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import {
  setColumnWidths,
  setCellValue,
  setCellFormula,
  mergeCells,
  styleHeader,
  addTableHeader,
  addTableRow,
  COLORS,
  BORDERS,
} from '../utils';

// IRC:6-2017 §208 Table 5 — impact factors by vehicle class
const IRC_IMPACT_FACTOR: Record<string, number> = {
  'IRC Class AA Tracked': 0.10,
  'IRC Class AA Wheeled': 0.25,
  'IRC Class 70R Tracked': 0.10,
  'IRC Class 70R Wheeled': 0.25,
  'IRC Class A':           0.50,
};

export async function generateLLAbstractSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('LL-ABSTRACT');

  // Column widths matching FINAL_RESULT.xls layout
  setColumnWidths(ws, [5, 32, 5, 14, 5, 5, 22, 10, 10, 10, 10]);

  let row = 1;

  // ── Title block ────────────────────────────────────────────────────────────
  styleHeader(ws, row, 'DESIGN OF SUBMERSIBLE BRIDGE', 1, 11);
  ws.getRow(row).height = 20;
  row++;

  setCellValue(ws, row, 1, `Name Of Work :- ${input.projectName}`);
  ws.getCell(row, 1).font = { bold: true };
  mergeCells(ws, row, 1, row, 11);
  row++;

  styleHeader(ws, row, 'LIVE LOAD ABSTRACT — Maximum Pier Reaction (Governing Load Case)', 1, 11);
  ws.getRow(row).height = 18;
  row++;
  row++; // blank row

  // ── Section 1: Maximum LL Reaction (cross-sheet formula) ──────────────────
  setCellValue(ws, row, 2, 'SECTION 1 — MAXIMUM REACTION DUE TO LIVE LOAD (INCLUDING IMPACT)');
  ws.getCell(row, 2).font = { bold: true, size: 11, color: { argb: COLORS.PRIMARY } };
  mergeCells(ws, row, 2, row, 11);
  row++;

  const liveLoad   = input.pier?.loads?.liveLoad ?? 0;
  const reactionMT = liveLoad / 9.81;

  setCellValue(ws, row, 2, 'Maximum Reaction due Live Load including Impact');
  ws.getCell(row, 2).font = { bold: true };
  setCellValue(ws, row, 7, 'Max. LL Reaction');
  ws.getCell(row, 7).font = { italic: true };

  // loadsumm C13/C14/C15/C17 already carry their impact factors
  // (1.10 / 1.25 / 1.10 / 1.50). H2 is MAX() over those rows, so the cached
  // value must include the governing impact allowance as well.
  const governingImpact = Math.max(
    IRC_IMPACT_FACTOR['IRC Class AA Tracked'],
    IRC_IMPACT_FACTOR['IRC Class AA Wheeled'],
    IRC_IMPACT_FACTOR['IRC Class 70R Tracked'],
    IRC_IMPACT_FACTOR['IRC Class A'],
  );
  const maxReactionMT = reactionMT * (1 + governingImpact);

  // H2 — MAX from loadsumm cases (FINAL_RESULT.xls formula preserved)
  setCellFormula(ws, row, 8,
    `MAX(loadsumm!C13,loadsumm!C14,loadsumm!C15,loadsumm!C17)`,
    parseFloat(maxReactionMT.toFixed(3)),
  );
  ws.getCell(row, 8).numFmt = '0.000';
  setCellValue(ws, row, 9, 'MT');
  setCellValue(ws, row, 10, '=');

  // K2 — H2 × 10 (MT → kN, 1 MT = 9.81 kN ≈ 10 kN in FINAL_RESULT convention)
  setCellFormula(ws, row, 11, `H${row}*10`, parseFloat((maxReactionMT * 10).toFixed(2)));
  ws.getCell(ws.getRow(row).getCell(11).address).numFmt = '0.00';
  setCellValue(ws, row, 12, 'kN');

  // Highlight the key result row in yellow
  for (let col = 2; col <= 12; col++) {
    ws.getCell(row, col).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CC' },
    };
    ws.getCell(row, col).border = {
      top: BORDERS.thin, bottom: BORDERS.thin,
      left: BORDERS.thin, right: BORDERS.thin,
    };
  }
  ws.getRow(row).height = 20;
  row++;
  row++; // blank

  // ── Section 2: IRC Load Classes & Impact Factors ──────────────────────────
  setCellValue(ws, row, 2, 'SECTION 2 — IRC LIVE LOAD CLASSES & IMPACT FACTORS (IRC:6-2017 Table 5)');
  ws.getCell(row, 2).font = { bold: true, size: 11, color: { argb: COLORS.PRIMARY } };
  mergeCells(ws, row, 2, row, 12);
  row++;

  addTableHeader(ws, row, [
    '', 'Load Class', '', 'Total Load (kN)', '', '',
    'Impact Factor', 'Reaction (kN)', 'Incl. Impact (kN)',
    'Reaction (MT)', 'Incl. Impact (MT)', '',
  ]);
  ws.getRow(row).height = 30;
  row++;

  const loadClasses = [
    { name: 'IRC Class AA Tracked',  intensity: 700  },
    { name: 'IRC Class AA Wheeled',  intensity: 400  },
    { name: 'IRC Class 70R Tracked', intensity: 700  },
    { name: 'IRC Class 70R Wheeled', intensity: 1000 },
    { name: 'IRC Class A (2-lane)',  intensity: 554  },
  ];

  let govName  = '';
  let govValue = 0;

  for (const lc of loadClasses) {
    const impactFactor = IRC_IMPACT_FACTOR[lc.name] ?? 0.25;
    const reaction     = lc.intensity * 0.5;             // simply supported: R = W/2
    const incImpact    = reaction * (1 + impactFactor);
    const reactionMT_  = reaction  / 9.81;
    const incImpactMT  = incImpact / 9.81;

    if (incImpact > govValue) { govValue = incImpact; govName = lc.name; }

    addTableRow(ws, row, [
      '',
      lc.name,
      '',
      lc.intensity,
      '',
      '',
      impactFactor,
      parseFloat(reaction.toFixed(2)),
      parseFloat(incImpact.toFixed(2)),
      parseFloat(reactionMT_.toFixed(3)),
      parseFloat(incImpactMT.toFixed(3)),
      '',
    ]);
    row++;
  }
  row++; // blank

  // ── Section 3: Governing Load Summary ─────────────────────────────────────
  setCellValue(ws, row, 2, 'SECTION 3 — GOVERNING LIVE LOAD SUMMARY');
  ws.getCell(row, 2).font = { bold: true, size: 11, color: { argb: COLORS.PRIMARY } };
  mergeCells(ws, row, 2, row, 12);
  row++;

  const summaryRows: [string, string | number][] = [
    ['Governing Load Class',                govName],
    ['Maximum Reaction (incl. impact)',      `${govValue.toFixed(2)} kN`],
    ['Span Length',                          `${input.spanLength} m`],
    ['Number of Spans',                      input.numberOfSpans],
    ['Total Live Load Contribution to Pier', `${(govValue * 2).toFixed(2)} kN (2-span)`],
  ];

  for (const [label, value] of summaryRows) {
    setCellValue(ws, row, 2, label);
    ws.getCell(row, 2).font = { bold: true };
    setCellValue(ws, row, 7, value);
    ws.getCell(row, 7).border = { bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } } };
    ws.getRow(row).height = 15;
    row++;
  }
  row++; // blank

  // ── Section 4: Notes ──────────────────────────────────────────────────────
  styleHeader(ws, row, 'NOTES', 1, 12);
  row++;

  const notes = [
    'Reactions computed for simply-supported spans: R = W/2 (mid-span point load governs).',
    'Impact factor per IRC:6-2017 §208 Table 5. Tracked: 10%; Wheeled: 25% (span ≤45m); Class A: 50%.',
    'Governing load class is the one producing the maximum total reaction including impact.',
    'MT values use 1 MT = 9.81 kN. FINAL_RESULT.xls uses 1 MT ≈ 10 kN (×10 factor) — both shown.',
    'Cross-sheet formulas reference loadsumm!C13, C14, C15, C17 (canonical sheet name, no trailing space).',
    'A licensed engineer must confirm the IRC load class, placement, and impact factor before design reliance.',
  ];

  for (const note of notes) {
    setCellValue(ws, row, 2, `• ${note}`);
    ws.getCell(row, 2).font = { italic: true, size: 9 };
    mergeCells(ws, row, 2, row, 12);
    ws.getRow(row).height = 14;
    row++;
  }

  console.log(`✓ Sheet 19: LL-ABSTRACT generated (${row - 1} rows, 6 cross-sheet formulas)`);
}
