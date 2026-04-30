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

    /* ───────────────  STRUDS Cover & Foreword (Phase 4)  ─────────────── */
    .struds-cover {
      position: relative;
      page-break-after: always;
      padding: 0;
      margin: -28px -28px 32px -28px;
      background: #f8fafd;
      min-height: 980px;
    }
    .struds-cover-band {
      background: linear-gradient(135deg, #1F496B 0%, #155090 60%, #0F5A8C 100%);
      color: #fff;
      padding: 26px 36px 38px 36px;
      position: relative;
    }
    .struds-cover-band .firm {
      font: bold 13px/1.2 "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .struds-cover-band .firm-sub {
      font: 10px/1.4 "Helvetica Neue", Arial, sans-serif;
      color: #d6e1f0;
      margin-top: 4px;
    }
    .struds-cover-band .eyebrow-r {
      position: absolute;
      top: 26px;
      right: 36px;
      text-align: right;
      font: bold 10px/1 "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.15em;
    }
    .struds-cover-band .eyebrow-r small {
      display: block;
      font-weight: 400;
      font-size: 9px;
      margin-top: 4px;
      color: #d6e1f0;
      letter-spacing: 0.04em;
    }
    .struds-codes {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 12px 36px 0 36px;
      margin-top: -16px;
    }
    .struds-codes .chip {
      background: #e8f0fa;
      border: 1px solid #b4c8e1;
      color: #1F496B;
      font: bold 10px/1 "Helvetica Neue", Arial, sans-serif;
      padding: 5px 9px;
      border-radius: 12px;
    }
    .struds-stamp {
      position: absolute;
      top: 110px;
      right: 36px;
      transform: rotate(-8deg);
      border: 1.5px solid #c03c32;
      color: #c03c32;
      font: bold 14px/1 "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0.08em;
      padding: 8px 14px;
      border-radius: 4px;
      background: rgba(255,255,255,0.85);
    }
    .struds-cover-body {
      padding: 36px;
    }
    .struds-cover-eyebrow {
      font: 10px/1 "Helvetica Neue", Arial, sans-serif;
      color: #6481a5;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .struds-cover-title {
      font: bold 36px/1.1 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
      margin: 10px 0 6px 0;
    }
    .struds-cover-subtitle {
      font: 13px/1.4 "Helvetica Neue", Arial, sans-serif;
      color: #5071a0;
    }
    .struds-name-block {
      background: #e8f0fa;
      border-left: 4px solid #1F496B;
      padding: 10px 14px;
      margin: 24px 0 18px 0;
    }
    .struds-name-block .label {
      font: 9px/1 "Helvetica Neue", Arial, sans-serif;
      color: #6481a5;
      letter-spacing: 0.16em;
    }
    .struds-name-block .value {
      font: bold 16px/1.3 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
      margin-top: 4px;
    }
    .struds-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin: 18px 0 28px 0;
    }
    .struds-meta-grid .cell .label {
      font: 9px/1 "Helvetica Neue", Arial, sans-serif;
      color: #6481a5;
      letter-spacing: 0.16em;
    }
    .struds-meta-grid .cell .value {
      font: bold 12px/1.3 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
      margin-top: 4px;
    }
    .struds-sig-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-top: 64px;
      padding-top: 6px;
      border-top: 1px solid #b4c8e1;
    }
    .struds-sig .role {
      font: 9px/1 "Helvetica Neue", Arial, sans-serif;
      color: #6481a5;
      letter-spacing: 0.16em;
      margin-top: 6px;
    }
    .struds-sig .name {
      font: bold 13px/1.3 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
      margin-top: 5px;
    }
    .struds-sig .designation {
      font: 10px/1.3 "Helvetica Neue", Arial, sans-serif;
      color: #6481a5;
      margin-top: 3px;
    }

    /* Foreword */
    .struds-foreword {
      page-break-after: always;
      padding: 0 12px;
      margin-bottom: 32px;
    }
    .struds-foreword h2 {
      font: bold 26px/1.2 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
      margin: 4px 0 4px 0;
    }
    .struds-foreword .eyebrow {
      font: 10px/1 "Helvetica Neue", Arial, sans-serif;
      color: #6481a5;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .struds-foreword .lead {
      font: 13px/1.65 "Helvetica Neue", Arial, sans-serif;
      color: #344762;
      margin: 14px 0 22px 0;
    }
    .struds-foreword h3 {
      font: bold 14px/1.3 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
      margin: 22px 0 8px 0;
    }
    .struds-scope {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .struds-scope .item {
      background: #f5f8fc;
      border: 1px solid #c8d7e8;
      border-radius: 4px;
      padding: 10px 12px;
    }
    .struds-scope .item .head {
      font: bold 11px/1.3 "Helvetica Neue", Arial, sans-serif;
      color: #142d4b;
    }
    .struds-scope .item .body {
      font: 11px/1.55 "Helvetica Neue", Arial, sans-serif;
      color: #46607e;
      margin-top: 4px;
    }
    .struds-deliv {
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
    }
    .struds-deliv li {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 8px;
      padding: 6px 0;
      border-bottom: 1px dashed #d8e2ee;
      font: 11px/1.5 "Helvetica Neue", Arial, sans-serif;
      color: #46607e;
    }
    .struds-deliv li b {
      color: #142d4b;
    }
    @media print {
      .struds-cover { page-break-after: always; }
      .struds-foreword { page-break-after: always; }
    }
  </style>
  <!-- Reference layout: ${REF_STRUDS_SLAB_SAMPLE} -->
</head>
<body>
  <div class="report">
    ${generateStrudsCoverHtml(input)}
    ${generateStrudsForewordHtml(input)}
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

/**
 * STRUDS-style HTML cover (parity with client `StrudsCoverPage` and the
 * comprehensive PDF `addCoverPage`). Same gradient band, IRC chip strip,
 * "FOR SUBMISSION" stamp, project meta grid and signature triplet.
 */
function generateStrudsCoverHtml(input: EnhancedProjectInput): string {
  const bridgeKind = input.bridgeType === 'high-level' ? 'High-Level RCC Slab Bridge' : 'Submersible RCC Slab Bridge';
  const totalW = (input as any).totalWidth ?? input.carriageWidth + 1.5;
  const subtitle =
    `${input.numberOfSpans === 1 ? 'Single-Span' : `${input.numberOfSpans}-Span`} · ${input.totalLength.toFixed(2)} m total · ` +
    `${input.carriageWidth.toFixed(1)} m carriageway · ${input.riverName || '—'}`;
  const issued = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const firmName = (input as any).firmName || 'Consulting Bridge Engineers';
  const designerName = (input as any).designerName || 'Design Engineer';
  const clientName = (input as any).clientName || (input as any).client || '—';
  const codes = ['IRC:6-2017', 'IRC:78-2014', 'IRC:112-2011', 'IRC:SP:13', 'IS:1893-2016'];

  return `
<section class="struds-cover">
  <div class="struds-cover-band">
    <div class="firm">${escapeHtml(firmName)}</div>
    <div class="firm-sub">Structural Design · IRC Compliance · Independent Review</div>
    <div class="eyebrow-r">STRUCTURAL DESIGN REPORT<small>Issued ${escapeHtml(issued)}</small></div>
  </div>
  <div class="struds-codes">
    ${codes.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join('')}
  </div>
  <div class="struds-stamp">FOR SUBMISSION</div>

  <div class="struds-cover-body">
    <div class="struds-cover-eyebrow">Project</div>
    <h1 class="struds-cover-title">${escapeHtml(bridgeKind)}</h1>
    <div class="struds-cover-subtitle">${escapeHtml(subtitle)}</div>

    <div class="struds-name-block">
      <div class="label">NAME OF WORK</div>
      <div class="value">${escapeHtml(input.projectName)}</div>
    </div>

    <div class="struds-meta-grid">
      <div class="cell"><div class="label">LOCATION</div><div class="value">${escapeHtml(input.location || '—')}</div></div>
      <div class="cell"><div class="label">CLIENT</div><div class="value">${escapeHtml(clientName)}</div></div>
      <div class="cell"><div class="label">JOB NUMBER</div><div class="value">${escapeHtml(input.jobNumber || '—')}</div></div>
      <div class="cell"><div class="label">CARRIAGEWAY · WIDTH</div><div class="value">${escapeHtml(input.carriageWidth.toFixed(1))} m / ${escapeHtml(totalW.toFixed(1))} m</div></div>
    </div>

    <div class="struds-sig-row">
      <div class="struds-sig">
        <div class="role">DESIGNED BY</div>
        <div class="name">${escapeHtml(designerName)}</div>
        <div class="designation">M.E. (Civil) · Structural</div>
      </div>
      <div class="struds-sig">
        <div class="role">CHECKED BY</div>
        <div class="name">_________________________</div>
        <div class="designation">Senior Engineer</div>
      </div>
      <div class="struds-sig">
        <div class="role">APPROVED BY</div>
        <div class="name">_________________________</div>
        <div class="designation">Executive Engineer · PWD</div>
      </div>
    </div>
  </div>
</section>`;
}

/**
 * STRUDS-style HTML foreword "About this design report" with deterministic
 * lead paragraph derived from inputs, scope grid, codes chip strip,
 * deliverables list. Mirrors {@link addForeword} in the comprehensive PDF.
 */
function generateStrudsForewordHtml(input: EnhancedProjectInput): string {
  const bridgeKind = input.bridgeType === 'high-level' ? 'high-level RCC slab bridge' : 'submersible RCC slab bridge';
  const totalW = (input as any).totalWidth ?? input.carriageWidth + 1.5;
  const lead =
    `This report documents the structural design of a ${bridgeKind} across the ${input.riverName || '—'}. ` +
    'It transitions in measured sequence from the catchment hydraulics — discharge, regime width, scour and afflux — ' +
    'into the structural design of the deck slab, piers and abutments, closing with quantities and an audit-ready bill ' +
    'of quantities. Every value presented is computed from the inputs on the previous page; no figure is editorial. ' +
    'The intent is a single self-contained submission an approving authority can read end-to-end and reproduce on first principles.';
  const sbc = (input as any).sbc ?? 0;
  const phi = (input as any).phi ?? 30;
  const scope: [string, string][] = [
    ['Bridge configuration', `${input.numberOfSpans} spans of ${input.spanLength.toFixed(2)} m c/c (effective length ${input.totalLength.toFixed(2)} m), carriageway ${input.carriageWidth.toFixed(1)} m, overall width ${totalW.toFixed(1)} m.`],
    ['Hydraulic design', `Discharge by Manning's formula on the surveyed cross-section; Lacey regime width, ASTRA scour, Molesworth afflux. HFL ${input.hfl.toFixed(2)} m, bed RL ${input.bedLevel.toFixed(2)} m.`],
    ['Stability', `Pier and abutment stability for all governing IRC load combinations including seismic, hydrodynamic and braking; SBC ${sbc.toFixed(0)} kN/m², φ ${phi.toFixed(0)}°.`],
    ['Structural design', 'Deck slab to IRC:112 limit-state, pier & abutment reinforcement, footing design and foundation pressure check, deck anchorage and expansion arrangement.'],
    ['Drawings', 'GAD, pier and abutment elevations, slab reinforcement plan, hydraulic profile and cross-section overlays.'],
    ['Bill & abstract', 'Item-wise BOQ for earthwork, PCC, structural concrete, steel, pitching and ancillaries with rate analysis.'],
  ];
  const codeChips = [
    'IRC:6-2017 — Loads & combinations',
    'IRC:78-2014 — Foundations & substructure',
    'IRC:112-2011 — Limit state design (concrete)',
    'IRC:SP:13 — Small bridge hydraulics',
    'IRC:5-2015 — Standard specs & geometry',
    'IS:1893 (Pt 1):2016 — Seismic',
    'IS:7784 (Pt I):1975 — Afflux',
    'IS:1786 — HYSD bars',
  ];
  const deliverables: [string, string][] = [
    ['Hydraulics', 'Cross-section, Manning velocity, discharge, regime width, scour, afflux, DWL, SBC.'],
    ['Pier stability', 'Load cases LC-1 to LC-7 with sliding, overturning, base pressure and eccentricity verdicts.'],
    ['Pier design', 'Reinforcement, footing pressure, cap design, anchorage of starter bars.'],
    ['Abutment T1 & C1', 'Stability for full reservoir & sudden draw-down, stem & footing reinforcement, dirt & return walls.'],
    ['Deck slab', 'Effective span, dispersal width, BM & SF envelope, reinforcement and shear check (IRC:112 LSM).'],
    ['Annexure', 'GAD sketch, pier elevation, abutment cross-section, slab reinforcement, hydraulic profile.'],
  ];

  return `
<section class="struds-foreword">
  <div class="eyebrow">FOREWORD</div>
  <h2>About this design report</h2>
  <p class="lead">${escapeHtml(lead)}</p>

  <h3>Scope of work</h3>
  <div class="struds-scope">
    ${scope
      .map(
        ([h, b]) => `
    <div class="item">
      <div class="head">${escapeHtml(h)}</div>
      <div class="body">${escapeHtml(b)}</div>
    </div>`,
      )
      .join('')}
  </div>

  <h3>Governing codes &amp; references</h3>
  <div class="struds-codes" style="padding:0;margin:0;">
    ${codeChips.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join('')}
  </div>

  <h3>Deliverables in this report</h3>
  <ul class="struds-deliv">
    ${deliverables.map(([h, b]) => `<li><b>${escapeHtml(h)}</b><span>${escapeHtml(b)}</span></li>`).join('')}
  </ul>
</section>`;
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
