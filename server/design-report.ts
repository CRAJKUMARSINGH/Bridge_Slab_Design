/**
 * HTML Design Report Generator
 *
 * Visual structure and typography follow the STRUDS-style export in
 * `Attached_Assets/DETAILED SLAB DESIGN.htm` (darkorchid project banner, royalblue
 * design heading, magenta section titles, blue code/clause references, bordered
 * tables, formula lines). Bridge content uses IRC clauses instead of IS 456.
 */

import type { BOQItem, EnhancedProjectInput } from '../bridge-excel-generator/types';
import { WORKBOOK_LINE_REPORT_CSS, buildHydraulicsWorkbookHtmlFragment } from './workbook-line-report';

/** @see Attached_Assets/DETAILED SLAB DESIGN.htm */
const REF_STRUDS_SLAB_SAMPLE = 'Attached_Assets/DETAILED SLAB DESIGN.htm';

interface ReportCell {
  value: string | number;
  formula?: string;
  colSpan?: number;
  bold?: boolean;
  note?: string;
  /** When true, value is shown in blue as a code / clause line (STRUDS-style). */
  clause?: boolean;
}

interface ReportSection {
  title: string;
  sheetName: string;
  columns: { header: string; width: string; align?: string }[];
  rows: { cells: ReportCell[] }[];
}

/**
 * Generate HTML report with STRUDS-style layout (see {@link REF_STRUDS_SLAB_SAMPLE}).
 */
export function generateHTMLDesignReport(input: EnhancedProjectInput): string {
  const bridgeType = input.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge';
  const deckSlabThickness = input.deckSlabThickness ?? 0.25;
  const deckSoffitLevel = input.deckSoffitLevel ?? (input.rtl - deckSlabThickness);
  const governingFreeboardAboveHfl =
    input.bridgeType === 'high-level'
      ? (input.hydraulics?.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2))
      : (input.freeboardAboveHfl ?? 1.2);
  const requiredSoffit = input.hfl + governingFreeboardAboveHfl;
  const clearanceVerdict =
    input.bridgeType === 'high-level'
      ? input.hydraulics?.isFreeboardSafe
        ? 'OK'
        : 'CHECK'
      : 'N/A (submersible)';
  const hydraulicsWorkbookHtml = buildHydraulicsWorkbookHtmlFragment(input);
  const sections: ReportSection[] = [
    generateHydraulicsSummarySection(input),
    generatePierStabilitySection(input),
    generateAbutmentSection(input),
    generateEstimationSection(input),
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bridge Design Report - ${escapeHtml(input.projectName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Verdana, Geneva, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      margin: 0;
      padding: 16px;
      background: #f0f0f0;
    }
    .report {
      max-width: 900px;
      margin: 0 auto;
      background: #fff;
      padding: 12px 16px 24px;
      border: 1px solid #ccc;
    }
    /* STRUDS-style project strip — DETAILED SLAB DESIGN.htm */
    .struds-meta { margin-bottom: 4px; font-size: 11px; }
    .struds-meta td { padding: 2px 8px 2px 0; vertical-align: top; }
    .struds-meta .k { font-weight: bold; color: darkorchid; }
    .struds-meta .v { font-weight: bold; color: darkorchid; }
    .struds-hr {
      border: 0;
      border-top: 2px solid orchid;
      max-width: 850px;
      margin: 10px 0 14px 0;
    }
    .struds-design-title {
      font-family: Verdana, Geneva, sans-serif;
      color: royalblue;
      font-size: 1.05rem;
      margin: 0 0 6px 0;
      text-decoration: underline;
      font-weight: bold;
    }
    .struds-method {
      font-size: 11px;
      margin: 0 0 14px 0;
    }
    .struds-clause { color: blue; }
    .struds-section-title {
      display: block;
      font-family: Verdana, Geneva, sans-serif;
      font-size: 11px;
      font-weight: bold;
      color: #fe00cc;
      text-decoration: underline;
      margin: 14px 0 6px 0;
    }
    .struds-sheet-tag {
      font-size: 10px;
      color: #444;
      margin-bottom: 6px;
    }
    .section {
      page-break-inside: avoid;
      margin-bottom: 22px;
    }
    .struds-calc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      border-spacing: 0;
    }
    .struds-calc-table th,
    .struds-calc-table td {
      border: 1px solid #000;
      padding: 5px 7px;
      vertical-align: top;
    }
    .struds-calc-table thead th {
      background: #e8e8e8;
      color: #000;
      font-weight: bold;
      font-family: Verdana, Geneva, sans-serif;
    }
    .struds-calc-table tbody tr:nth-child(even) td { background: #fafafa; }
    .formula {
      font-family: Consolas, 'Courier New', monospace;
      font-size: 9pt;
      color: #006400;
      margin-top: 4px;
      display: block;
    }
    .value-bold { font-weight: 700; }
    .note {
      font-size: 9pt;
      color: #b00020;
      font-style: italic;
      margin-top: 3px;
    }
    .struds-footer {
      border-top: 1px solid #ccc;
      margin-top: 20px;
      padding-top: 12px;
      font-size: 9px;
      color: #555;
      text-align: center;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .report { border: 0; }
    }
    ${WORKBOOK_LINE_REPORT_CSS}
  </style>
  <!-- Reference layout: ${REF_STRUDS_SLAB_SAMPLE} -->
</head>
<body>
  <div class="report">
    ${generateStrudsProjectBanner(input)}
    <hr class="struds-hr" />
    <h3 class="struds-design-title">Design Of Bridge — Hydraulics, Pier &amp; Abutment (Summary)</h3>
    <p class="struds-method">
      Bridge type : <span class="struds-clause">${escapeHtml(bridgeType)}</span><br />
      Design approach : Limit state principles per IRC suite<br />
      Design codes : <span class="struds-clause">IRC:6-2016</span> (loads)${input.bridgeType === 'high-level' ? ', <span class="struds-clause">IRC:5-2015</span> (freeboard / clearance)' : ''},
      <span class="struds-clause">IRC:112-2015</span> (concrete),
      <span class="struds-clause">IRC SP 13</span> (hydraulics),
      <span class="struds-clause">IRC:78-1983</span> (foundations) — see clause notes in tables.
      <br />Deck soffit policy : ${input.bridgeType === 'high-level' ? `soffit ${escapeHtml(deckSoffitLevel.toFixed(2))} m vs required ${escapeHtml(requiredSoffit.toFixed(2))} m (${escapeHtml(clearanceVerdict)}); clearance above DWL ${escapeHtml(formatNum(input.hydraulics?.freeboard))} m` : `${escapeHtml(clearanceVerdict)} — soffit ${escapeHtml(deckSoffitLevel.toFixed(2))} m (reference only)`}
      ${input.bridgeType === 'high-level' && typeof input.pier?.loads?.windForce === 'number' && input.pier.loads.windForce > 0 ? `<br />Wind (pier screening) : ${escapeHtml(input.pier.loads.windForce.toFixed(1))} kN horizontal — IRC:6 / IS:875 to be confirmed for site` : ''}
    </p>
    ${hydraulicsWorkbookHtml}
    ${sections.map((s) => generateSection(s)).join('')}
    ${generateFooter(input)}
  </div>
</body>
</html>`;
}

function generateStrudsProjectBanner(input: EnhancedProjectInput): string {
  const now = new Date();
  const job = input.jobNumber?.trim() || '—';
  const refNo = input.issuingAuthority?.trim() || '—';
  return `
<table class="struds-meta" role="presentation">
  <tbody>
    <tr><td class="k">PROJECT</td><td class="v">: ${escapeHtml(input.projectName)}</td></tr>
    <tr><td class="k">PLAN / LOCATION</td><td class="v">: ${escapeHtml(input.location || '—')}</td></tr>
    <tr><td class="k">RIVER</td><td class="v">: ${escapeHtml(input.riverName || '—')}</td></tr>
  </tbody>
</table>
<table class="struds-meta" role="presentation">
  <tbody>
    <tr>
      <td class="k">JOB NO.</td><td class="v">: ${escapeHtml(job)}</td>
      <td class="k">REF. NO.</td><td class="v">: ${escapeHtml(refNo)}</td>
    </tr>
    <tr>
      <td class="k">DATE</td><td class="v">: ${escapeHtml(now.toLocaleDateString('en-IN'))}</td>
      <td class="k">TIME</td><td class="v">: ${escapeHtml(now.toLocaleTimeString('en-IN'))}</td>
    </tr>
    <tr>
      <td class="k">Report</td><td class="v">: Bridge Design System</td>
      <td class="k">Layout ref.</td><td class="v">: STRUDS-style (${escapeHtml(REF_STRUDS_SLAB_SAMPLE)})</td>
    </tr>
  </tbody>
</table>`;
}

function generateHydraulicsSummarySection(input: EnhancedProjectInput): ReportSection {
  const h = input.hydraulics;
  const rows: ReportSection['rows'] = [
    {
      cells: [
        { value: 'Hydraulic summary', bold: true, colSpan: 4 },
      ],
    },
    {
      cells: [
        { value: 'Cross-sectional area A' },
        { value: formatNum(h?.crossSectionalArea), bold: true },
        { value: 'm²' },
        { value: 'IRC SP 13 — area–velocity reach', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Wetted perimeter P' },
        { value: formatNum(h?.wettedPerimeter), bold: true },
        { value: 'm' },
        { value: 'Summed along wetted segments', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Hydraulic radius R = A/P' },
        { value: formatNum(h?.hydraulicRadius), bold: true },
        { value: 'm' },
        { value: '—' },
      ],
    },
    {
      cells: [
        { value: 'Velocity V' },
        { value: formatNum(h?.velocity), bold: true },
        { value: 'm/s' },
        { value: 'Manning / continuity', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Discharge Q = A×V' },
        { value: formatNum(h?.discharge), bold: true },
        { value: 'm³/s' },
        { value: 'IRC SP 13', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Regime width L = 4.8√Q' },
        { value: formatNum(h?.regimeWidth), bold: true },
        { value: 'm' },
        { value: 'Lacey-type indicator', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Scour depth d_sm' },
        { value: formatNum(h?.scourDepth), bold: true },
        { value: 'm' },
        { value: 'IRC:78-1983', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Afflux h' },
        { value: formatNum(h?.afflux), bold: true },
        { value: 'm' },
        { value: 'Molesworth-type afflux check', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Design water level (HFL + afflux)' },
        { value: formatNum(h?.designWaterLevel), bold: true },
        { value: 'm MSL' },
        { value: '—' },
      ],
    },
    {
      cells: [
        { value: 'Froude number Fr' },
        { value: formatNum(h?.froudeNumber), bold: true },
        { value: '—' },
        { value: 'V/√(gD)', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Flow regime' },
        { value: h?.flowType ?? '—', bold: true },
        { value: '' },
        { value: 'Subcritical / supercritical', clause: true },
      ],
    },
  ];

  if (input.bridgeType === 'high-level') {
    rows.push(
      {
        cells: [
          { value: 'Deck soffit level' },
          { value: formatNum(h?.soffitLevel), bold: true },
          { value: 'm MSL' },
          { value: 'RTL − thickness or explicit', clause: true },
        ],
      },
      {
        cells: [
          { value: 'Clearance above HFL (soffit − HFL)' },
          { value: formatNum(h?.freeboardAboveHfl), bold: true },
          { value: 'm' },
          { value: 'As-built clearance above HFL', clause: true },
        ],
      },
      {
        cells: [
          { value: 'IRC min. freeboard above HFL (from design Q)' },
          { value: formatNum(h?.ircMinimumFreeboardAboveHfl), bold: true },
          { value: 'm' },
          { value: 'Discharge-tier screening (IRC:5 practice)', clause: true },
        ],
      },
      {
        cells: [
          { value: 'Project min. freeboard above HFL (input)' },
          { value: formatNum(input.freeboardAboveHfl), bold: true },
          { value: 'm' },
          { value: 'Additional project criterion if any', clause: true },
        ],
      },
      {
        cells: [
          { value: 'Governing required freeboard above HFL' },
          { value: formatNum(h?.requiredFreeboardAboveHfl), bold: true },
          { value: 'm' },
          { value: 'max(IRC Q-based, project); engine clearance check', clause: true },
        ],
      },
      {
        cells: [
          { value: 'Clearance above DWL (soffit − DWL)' },
          { value: formatNum(h?.freeboard), bold: true },
          { value: 'm' },
          { value: '—' },
        ],
      },
    );
  }

  return {
    title: 'HYDRAULICS — DERIVED VALUES',
    sheetName: 'HYDRAULICS (engine summary)',
    columns: [
      { header: 'Parameter', width: '34%' },
      { header: 'Value', width: '18%', align: 'right' },
      { header: 'Unit', width: '12%' },
      { header: 'Reference / note', width: '36%' },
    ],
    rows,
  };
}

function generateSection(section: ReportSection): string {
  return `
    <div class="section section-wbline">
      <span class="struds-section-title">${escapeHtml(section.title)}</span>
      <div class="struds-sheet-tag">Workbook / sheet context: ${escapeHtml(section.sheetName)}</div>
      <table class="struds-calc-table">
        <thead>
          <tr>
            ${section.columns
              .map(
                (c) => `
              <th style="width: ${c.width}; text-align: ${c.align || 'left'};">
                ${escapeHtml(c.header)}
              </th>`,
              )
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${section.rows
            .map(
              (r) => `
            <tr>
              ${r.cells
                .map((c) => {
                  const inner = c.clause
                    ? `<span class="struds-clause">${escapeHtml(String(c.value))}</span>`
                    : formatValue(c.value);
                  return `
                <td colspan="${c.colSpan || 1}" class="${c.bold ? 'value-bold' : ''}">
                  ${inner}
                  ${c.formula ? `<span class="formula">${escapeHtml(c.formula)}</span>` : ''}
                  ${c.note ? `<div class="note">${escapeHtml(c.note)}</div>` : ''}
                </td>`;
                })
                .join('')}
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function generatePierStabilitySection(input: EnhancedProjectInput): ReportSection {
  const p = input.pier;
  const rows: ReportSection['rows'] = [];

  rows.push({ cells: [{ value: 'PIER GEOMETRY', bold: true, colSpan: 4 }] });
  rows.push({
    cells: [
      { value: 'Width (across flow)' },
      { value: formatNum(p?.geometry?.width) },
      { value: 'm' },
      { value: 'INPUT', clause: true },
    ],
  });
  rows.push({
    cells: [
      { value: 'Length (along bridge)' },
      { value: formatNum(p?.geometry?.length) },
      { value: 'm' },
      { value: 'INPUT', clause: true },
    ],
  });
  rows.push({
    cells: [
      { value: 'Depth (below bed)' },
      { value: formatNum(p?.geometry?.depth) },
      { value: 'm' },
      { value: 'INPUT', clause: true },
    ],
  });

  rows.push({ cells: [{ value: 'LOADS', bold: true, colSpan: 4 }] });
  rows.push({
    cells: [
      { value: 'Dead load (self-weight)' },
      { value: formatNum(p?.loads?.deadLoad) },
      { value: 'kN' },
      { value: 'IRC:6-2016 DL', clause: true },
    ],
  });
  rows.push({
    cells: [
      { value: 'Live load (characteristic)' },
      { value: formatNum(p?.loads?.liveLoad) },
      { value: 'kN' },
      { value: 'IRC:6-2016 LL', clause: true },
    ],
  });
  rows.push({
    cells: [
      { value: 'Hydrostatic force' },
      { value: formatNum(p?.loads?.hydrostaticForce) },
      { value: 'kN' },
      { value: 'Fluid pressure on pier', clause: true },
    ],
  });
  rows.push({
    cells: [
      { value: 'Drag / stream force' },
      { value: formatNum(p?.loads?.dragForce) },
      { value: 'kN' },
      { value: 'IRC SP 13', clause: true },
    ],
  });

  if (p?.loadCases?.length) {
    p.loadCases.forEach((lc) => {
      rows.push({
        cells: [{ value: `LOAD CASE ${lc.caseNumber}: ${lc.description}`, bold: true, colSpan: 4 }],
      });
      rows.push({
        cells: [
          { value: 'Vertical force' },
          { value: formatNum(lc.verticalForce) },
          { value: 'kN' },
          { value: 'ULS combination', clause: true },
        ],
      });
      rows.push({
        cells: [
          { value: 'Horizontal force' },
          { value: formatNum(lc.horizontalForce) },
          { value: 'kN' },
          { value: '—' },
        ],
      });
      rows.push({
        cells: [
          { value: 'Sliding FOS' },
          { value: formatNum(lc.slidingFOS), bold: true },
          { value: '—' },
          {
            value: '≥ 1.5 typical',
            clause: true,
            note: lc.slidingFOS >= 1.5 ? 'OK' : 'CHECK',
          },
        ],
      });
      rows.push({
        cells: [
          { value: 'Overturning FOS' },
          { value: formatNum(lc.overturningFOS), bold: true },
          { value: '—' },
          {
            value: '≥ 1.8 typical',
            clause: true,
            note: lc.overturningFOS >= 1.8 ? 'OK' : 'CHECK',
          },
        ],
      });
      rows.push({
        cells: [
          { value: 'Bearing FOS' },
          { value: formatNum(lc.bearingFOS), bold: true },
          { value: '—' },
          {
            value: '≥ 2.5 typical',
            clause: true,
            note: lc.bearingFOS >= 2.5 ? 'OK' : 'CHECK',
          },
        ],
      });
    });
  }

  return {
    title: 'PIER DESIGN & STABILITY',
    sheetName: 'STABILITY CHECK FOR PIER',
    columns: [
      { header: 'Parameter / check', width: '34%' },
      { header: 'Value', width: '18%', align: 'right' },
      { header: 'Unit', width: '12%' },
      { header: 'Reference / formula', width: '36%' },
    ],
    rows,
  };
}

function generateAbutmentSection(input: EnhancedProjectInput): ReportSection {
  const t1 = input.abutmentType1;
  const c1 = input.abutmentC1;
  const ka1 = t1?.earthPressure?.ka;
  const kaC = c1?.earthPressure?.ka;

  const rows: ReportSection['rows'] = [
    { cells: [{ value: 'Geometry & earth pressure (summary)', bold: true, colSpan: 4 }] },
    {
      cells: [
        { value: 'Abutment height' },
        { value: formatNum(t1?.geometry?.height ?? input.abutmentHeight) },
        { value: formatNum(c1?.geometry?.height ?? input.abutmentHeight) },
        { value: 'm — Type1 / C1', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Active K_a' },
        { value: formatNum(ka1) },
        { value: formatNum(kaC) },
        { value: 'Earth pressure coeff.', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Total active thrust P_a' },
        { value: formatNum(t1?.earthPressure?.pa) },
        { value: formatNum(c1?.earthPressure?.pa) },
        { value: 'kN (characteristic)', clause: true },
      ],
    },
    {
      cells: [
        { value: 'Dirt wall height' },
        { value: formatNum(t1?.geometry?.dirtWallHeight ?? input.dirtWallHeight) },
        { value: formatNum(c1?.geometry?.dirtWallHeight ?? input.dirtWallHeight) },
        { value: 'm' },
      ],
    },
  ];

  return {
    title: 'ABUTMENT — TYPE1 vs C1 (SUMMARY)',
    sheetName: 'TYPE1 & C1 stability sheets',
    columns: [
      { header: 'Parameter', width: '34%' },
      { header: 'Type 1 (gravity)', width: '18%', align: 'right' },
      { header: 'Cantilever (C1)', width: '18%', align: 'right' },
      { header: 'Notes / IRC', width: '30%' },
    ],
    rows,
  };
}

function generateEstimationSection(input: EnhancedProjectInput): ReportSection {
  const e = input.estimation;
  const rows: ReportSection['rows'] = [];

  if (e?.boq?.length) {
    rows.push({ cells: [{ value: 'BILL OF QUANTITIES', bold: true, colSpan: 5 }] });
    rows.push({
      cells: [
        { value: 'Item No', bold: true },
        { value: 'Description', bold: true },
        { value: 'Quantity', bold: true },
        { value: 'Unit', bold: true },
        { value: 'Rate (₹)', bold: true },
      ],
    });

    e.boq.forEach((item: BOQItem, idx: number) => {
      rows.push({
        cells: [
          { value: item.itemNo || String(idx + 1) },
          { value: item.description },
          { value: formatNum(item.quantity), bold: true },
          { value: item.unit },
          { value: formatNum(item.rate) },
        ],
      });
    });

    rows.push({
      cells: [
        { value: 'TOTAL COST', bold: true, colSpan: 2 },
        { value: `₹${formatNum(e.cost?.total)}`, bold: true, colSpan: 3 },
      ],
    });
  } else {
    rows.push({
      cells: [{ value: 'No bill of quantities in current run.', colSpan: 5 }],
    });
  }

  return {
    title: 'ESTIMATION & BOQ',
    sheetName: 'ESTIMATION',
    columns: [
      { header: 'Item', width: '10%' },
      { header: 'Description', width: '40%' },
      { header: 'Quantity', width: '14%', align: 'right' },
      { header: 'Unit', width: '12%' },
      { header: 'Rate', width: '24%', align: 'right' },
    ],
    rows,
  };
}

function generateFooter(input: EnhancedProjectInput): string {
  const extra = input.bridgeType === 'high-level' ? ', :5 (clearance)' : '';
  return `
    <div class="struds-footer">
      <p>Generated by Bridge Design System · Layout reference: ${escapeHtml(REF_STRUDS_SLAB_SAMPLE)}</p>
      <p>IRC: SP-13 (hydraulics), :6 (loads), :112 (concrete), :78 (foundations)${extra}</p>
      <p>${escapeHtml(new Date().toLocaleString('en-IN'))}</p>
    </div>`;
}

function escapeHtml(text: string | number | undefined): string {
  if (text === undefined || text === null) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNum(n: number | undefined): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatValue(v: string | number): string {
  if (typeof v === 'number') return formatNum(v);
  return escapeHtml(v);
}
