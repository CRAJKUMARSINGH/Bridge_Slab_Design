/**
 * Workbook-faithful fragments for HTML / PDF reports:
 * HYDRAULICS tab rendered line-by-line in Excel column order (A–H), matching the generator preview.
 */

import type { ProjectInput } from '../bridge-excel-generator/types';
import {
  buildHydraulicsPreviewRows,
  HYDRAULICS_PREVIEW_COLUMN_WIDTHS_CH,
} from '../shared/hydraulics-sheet-preview';

function escapeHtml(text: string | number | undefined): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

/** Inline CSS used by HTML design report for workbook-style blocks */
export const WORKBOOK_LINE_REPORT_CSS = `
  /* HYDRAULICS block: workbook grid; section title colour matches STRUDS magenta strip
     in Attached_Assets/DETAILED SLAB DESIGN.htm */
  .wb-hyd-wrap { margin: 0 0 28px 0; border: 1px solid #000; background: #fff; }
  .wb-hyd-head {
    background: #fff; color: #fe00cc; font-size: 11px; font-weight: 700;
    padding: 6px 10px; letter-spacing: 0.02em;
    font-family: Verdana, Geneva, sans-serif;
    text-decoration: underline;
    border-bottom: 1px solid #000;
  }
  .wb-hyd-note {
    font-size: 9px; color: #4a5568; padding: 8px 10px; background: #f7fafc;
    border-bottom: 1px solid #cbd5e0; line-height: 1.45;
  }
  .wb-hyd-table {
    width: 100%; border-collapse: collapse; table-layout: fixed;
    font-family: "Segoe UI", Calibri, Arial, sans-serif; font-size: 11px;
    line-height: 1.2;
  }
  .wb-hyd-table thead th {
    background: #e8e8e8; color: #000; font-weight: 600; border: 1px solid #000;
    padding: 3px 5px; text-align: center; font-size: 10px;
    font-family: Verdana, Geneva, sans-serif;
  }
  .wb-hyd-table .wb-rn {
    width: 2.6em; background: #f3f3f3; color: #595959; text-align: right;
    font-size: 9px; padding: 2px 4px; border: 1px solid #000; font-variant-numeric: tabular-nums;
  }
  .wb-hyd-table td {
    border: 1px solid #000; padding: 2px 6px; vertical-align: middle;
    overflow: hidden; text-overflow: ellipsis;
  }
  .wb-hyd-table td.wb-num { text-align: right; font-variant-numeric: tabular-nums; font-family: Consolas, "Courier New", monospace; }
  .wb-hyd-table td.wb-formula-cell { font-size: 9px; color: #006400; font-family: Consolas, monospace; white-space: pre-wrap; word-break: break-word; }
  .wb-hyd-table tr.wb-merged td { background: #f8f9fa; font-weight: 600; }
  .wb-hyd-table tr.wb-merged .wb-merged-title { text-align: center; font-size: 10px; }
  .wb-hyd-table tr.wb-spacer td { height: 4px; padding: 0; border-color: #e2e8f0; background: #fafafa; }
  .section-wbline table { border-collapse: collapse; width: 100%; font-size: 10px; line-height: 1.25; }
  .section-wbline th, .section-wbline td { border: 1px solid #bfbfbf; padding: 5px 7px; vertical-align: top; }
  .section-wbline th { background: #d9e1f2; color: #1f4e79; font-weight: 600; }
  .section-wbline tr:nth-child(even) td { background: #fafafa; }
`;

/**
 * HYDRAULICS sheet as an HTML table: one &lt;tr&gt; per workbook row, columns A–H + Excel row index.
 */
export function buildHydraulicsWorkbookHtmlFragment(input: ProjectInput): string {
  const model = buildHydraulicsPreviewRows(input);
  const widths = [...HYDRAULICS_PREVIEW_COLUMN_WIDTHS_CH];

  let thead =
    '<thead><tr><th class="wb-rn" scope="col">#</th>' +
    COL_LETTERS.map((L, i) => `<th scope="col" style="width:${widths[i]}ch">${L}</th>`).join('') +
    '</tr></thead>';

  let body = '<tbody>';
  let rowNum = 1;

  for (const row of model) {
    if (row.type === 'merged') {
      if (row.text === '') {
        body += `<tr class="wb-spacer"><td class="wb-rn">${rowNum}</td><td colspan="8"></td></tr>`;
      } else {
        body += `<tr class="wb-merged"><td class="wb-rn">${rowNum}</td><td colspan="8" class="wb-merged-title">${escapeHtml(row.text)}</td></tr>`;
      }
      rowNum++;
      continue;
    }

    body += '<tr>';
    body += `<td class="wb-rn">${rowNum}</td>`;
    for (let ci = 0; ci < 8; ci++) {
      const cell = row.cells[ci];
      const isFormulaCol = ci === 7 && cell.formula;
      const inner = isFormulaCol
        ? `<span class="wb-formula-text">${escapeHtml(cell.formula ?? '')}</span>`
        : escapeHtml(cell.display);
      const cls = [
        cell.numeric ? 'wb-num' : '',
        isFormulaCol ? 'wb-formula-cell' : '',
      ]
        .filter(Boolean)
        .join(' ');
      body += `<td class="${cls}">${inner}</td>`;
    }
    body += '</tr>';
    rowNum++;
  }

  body += '</tbody>';

  return `
  <div class="wb-hyd-wrap">
    <div class="wb-hyd-head">HYDRAULICS — workbook page (line order matches Excel tab)</div>
    <div class="wb-hyd-note">
      Rows follow the same sequence as the <strong>HYDRAULICS</strong> sheet in the generated workbook.
      Columns <strong>A–H</strong> align with the Excel layout; the # column is a readable row index (not necessarily Excel’s row number).
      Formula text in column H matches the preview column for cross-checking.
    </div>
    <div style="overflow-x:auto;">
      <table class="wb-hyd-table" role="grid" aria-label="HYDRAULICS sheet workbook layout">${thead}${body}</table>
    </div>
  </div>`;
}
