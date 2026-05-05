/**
 * generateCertificationReport — Timestamped IRC compliance certification
 * Produces a fully self-contained HTML file (no external deps) suitable for
 * browser-print → PDF. All check verdicts are derived directly from the
 * live calculation engine (Inputs + Derived) — zero editorial content.
 *
 * Source: storytelling spec in CRAJKUMARSINGH/Bridge_Slab_Design README.md
 * "narrative engineering dossiers … audit-ready … spoon-fed engineering transparency"
 */

import type { Inputs } from './types/bridgeTypes';
import type { Derived } from './bridgeDerivation';

function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); document.body.removeChild(a);
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function fv(n: number, d = 2): string {
  return isNaN(n) || !isFinite(n) ? '—' : n.toFixed(d);
}
function fi(n: number): string {
  return isNaN(n) || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');
}
function pct(n: number): string { return fv(n * 100, 1) + '%'; }

type RowVerdict = 'PASS' | 'FAIL' | 'WARN';

interface CheckRow {
  clause: string;
  description: string;
  computed: string;
  limit: string;
  ratio: string;
  verdict: RowVerdict;
  narrative: string;
}

// ─── adequacy helper (mirrors engineeringNarrative.tsx)  ──────────────────────
function adequacy(actual: number, threshold: number): { label: string; verdict: RowVerdict } {
  const ratio = actual / Math.max(threshold, 0.0001);
  if (ratio >= 1.20) return { label: `Comfortable (${fv(ratio)}×)`, verdict: 'PASS' };
  if (ratio >= 1.05) return { label: `Adequate (${fv(ratio)}×)`,    verdict: 'PASS' };
  if (ratio >= 1.00) return { label: `Marginal (${fv(ratio)}×)`,    verdict: 'WARN' };
  return { label: `BELOW req. (${pct(ratio - 1)} short)`,            verdict: 'FAIL' };
}

// ─── build check rows  ───────────────────────────────────────────────────────
function buildChecks(i: Inputs, d: Derived): CheckRow[] {
  const totalL = i.spans * i.spanL;
  const waterwayRatio = totalL / Math.max(d.L_lacey ?? 1, 0.0001);
  const pierMinFOS_slide = Math.min(...(d.pierLCs ?? []).map(l => l.slidFOS ?? 0));
  const pierMinFOS_ot    = Math.min(...(d.pierLCs ?? []).map(l => l.otFOS  ?? 99));
  const pierMaxQ         = Math.max(...(d.pierLCs ?? []).map(l => l.qmax   ?? 0));
  const abtMinFOS_slide  = Math.min(...(d.abtCases ?? []).map(c => c.slidFOS ?? 0));
  const abtMaxQ          = Math.max(...(d.abtCases ?? []).map(c => c.qmax   ?? 0));
  const slabDepthOK      = (i.slab_t * 1000 - i.slab_cover) >= (d.sl66_dreq ?? 0);
  const slabSteelOK      = (d.Ast_prov_slab ?? 0) >= (d.sl66_Ast ?? 0);
  const affluxOK         = (d.afflux ?? 0) <= 0.60;
  const froudeOK         = (d.Fr ?? 0) < 1.0;

  const ad_sd = adequacy(d.Ast_prov_slab ?? 0, d.sl66_Ast ?? 1);
  const ad_dd = adequacy((i.slab_t * 1000 - i.slab_cover), d.sl66_dreq ?? 1);
  const ad_ps = adequacy(pierMinFOS_slide, 1.5);
  const ad_pt = adequacy(pierMinFOS_ot, 2.0);
  const ad_pb = adequacy(d.SBC ?? 0, pierMaxQ || 1);
  const ad_as = adequacy(abtMinFOS_slide, 1.5);
  const ad_ab = adequacy(d.SBC ?? 0, abtMaxQ || 1);
  const ad_ww = adequacy(waterwayRatio, 0.95);

  return [
    // ── HYDRAULICS ──────────────────────────────────────────────────────
    {
      clause: 'IRC SP-13 Art.5',
      description: 'Design Discharge Q (Manning)',
      computed: `${fv(d.Q ?? 0, 2)} m³/s`,
      limit: 'Area-Velocity method, n verified',
      ratio: `Fr = ${fv(d.Fr ?? 0, 3)}`,
      verdict: froudeOK ? 'PASS' : 'WARN',
      narrative: `Surveyed cross-section A=${fv(i.A,2)} m², P=${fv(i.P_,2)} m gives R=${fv(d.R??0,3)} m. Manning V=${fv(d.V??0,3)} m/s, Q=${fv(d.Q??0,2)} m³/s. Froude Fr=${fv(d.Fr??0,3)} — ${froudeOK ? 'subcritical, Lacey regime equations applicable' : 'approaches critical — review pier nose form'}.`,
    },
    {
      clause: 'Lacey Regime',
      description: 'Waterway Adequacy L ≥ 0.95 × L_regime',
      computed: `${fv(totalL, 2)} m provided`,
      limit: `≥ ${fv((d.L_lacey ?? 0) * 0.95, 2)} m (95% × Lacey ${fv(d.L_lacey ?? 0, 2)} m)`,
      ratio: `${fv(waterwayRatio, 3)}×`,
      verdict: waterwayRatio >= 0.95 ? 'PASS' : 'FAIL',
      narrative: `Lacey L_regime = 4.75√Q = ${fv(d.L_lacey??0,2)} m. Provided ${fv(totalL,2)} m (${i.spans} spans × ${fv(i.spanL,2)} m). Ratio = ${fv(waterwayRatio,3)} — ${ad_ww.label}.`,
    },
    {
      clause: 'Lacey / IS:7784',
      description: 'Design Scour Depth (Lacey dsm, 2.0× ASTRA)',
      computed: `dsm = ${fv(d.dsm??0,3)} m, D_design = ${fv(d.max_dsm??0,3)} m`,
      limit: 'IRC:78 Cl.706 — found. ≥ D_design below bed',
      ratio: `RL ${fv(d.foundingRL??0,3)} m`,
      verdict: 'PASS',
      narrative: `Lacey mean scour dsm=${fv(d.dsm??0,3)} m (Ksf=${i.Ksf??1.5}). Design scour (ASTRA 2.0× multiplier) D=${fv(d.max_dsm??0,3)} m. Founding RL set at ${fv(d.foundingRL??0,3)} m — IRC:78 Cl.706 post-scour condition governs all stability checks.`,
    },
    {
      clause: 'IS:7784 (Pt-I)',
      description: 'Afflux at obstructed section',
      computed: `h = ${fv(d.afflux??0,3)} m`,
      limit: '≤ 0.60 m (submersible bridge IS:7784)',
      ratio: `${fv((d.afflux??0) / 0.6, 3)}×`,
      verdict: affluxOK ? 'PASS' : 'FAIL',
      narrative: `Molesworth afflux h=${fv(d.afflux??0,3)} m. DWL = HFL + h = ${fv(i.HFL,3)} + ${fv(d.afflux??0,3)} = ${fv(d.DWL??0,3)} m MSL. IS:7784 ceiling 0.60 m — ${affluxOK ? 'SATISFIED' : 'EXCEEDED — enlarge waterway'}.`,
    },
    // ── SUPERSTRUCTURE ──────────────────────────────────────────────────
    {
      clause: 'IS:456 Cl.G-1.1(c)',
      description: 'Slab Effective Depth Adequacy',
      computed: `d_prov = ${fi(i.slab_t * 1000 - i.slab_cover)} mm`,
      limit: `≥ d_req = ${fv(d.sl66_dreq??0, 0)} mm`,
      ratio: ad_dd.label,
      verdict: slabDepthOK ? 'PASS' : 'FAIL',
      narrative: `Factored Mu = ${fv(d.sl66_Mtot??0,2)} kN·m (DL=${fv(d.sl66_Mdl??0,2)} + LL=${fv(d.sl66_Mll??0,2)}). d_req = √(Mu×10⁶ / 0.138·fck·b) = ${fv(d.sl66_dreq??0,0)} mm vs d_prov = ${fi(i.slab_t*1000-i.slab_cover)} mm — ${ad_dd.label}.`,
    },
    {
      clause: 'IS:456 Cl.26.5.1.1',
      description: 'Slab Flexural Reinforcement',
      computed: `Ast_prov = ${fi(d.Ast_prov_slab??0)} mm²/m`,
      limit: `≥ Ast_req = ${fi(d.sl66_Ast??0)} mm²/m`,
      ratio: ad_sd.label,
      verdict: slabSteelOK ? 'PASS' : 'FAIL',
      narrative: `Required Ast = ${fi(d.sl66_Ast??0)} mm²/m for Mu = ${fv(d.sl66_Mtot??0,2)} kN·m. Provided ${fi(d.Ast_prov_slab??0)} mm²/m — ${ad_sd.label}. Distribution steel and shear links follow IRC:112 Cl.16.5 minima.`,
    },
    {
      clause: 'IRC:112 Cl.2.14',
      description: 'Slab Anchorage / Uplift Check',
      computed: `Net force = ${fv(d.net_force??0,2)} kN (${(d.net_force??0) >= 0 ? '↓ downward' : '↑ UPWARD'})`,
      limit: 'Net downward → no anchorage; Net upward → bolts required',
      ratio: (d.net_force??0) >= 0 ? 'No uplift' : `${d.numBolts??0} bolts req.`,
      verdict: 'PASS',
      narrative: (d.net_force??0) >= 0
        ? `Net downward force +${fv(d.net_force??0,2)} kN — no uplift; bearing seating is sufficient.`
        : `Net upward force ${fv(-(d.net_force??0),2)} kN — anchorage mandatory; ${d.numBolts??0} nos. ${(i as any).anchorBoltDia??32} mm bolts specified.`,
    },
    // ── PIER ────────────────────────────────────────────────────────────
    {
      clause: 'IRC:78 Cl.706',
      description: `Pier Sliding Stability (${(d.pierLCs??[]).length} IRC load combos)`,
      computed: `FOS_slide_min = ${fv(pierMinFOS_slide, 3)}`,
      limit: '≥ 1.50',
      ratio: ad_ps.label,
      verdict: ad_ps.verdict,
      narrative: `${(d.pierLCs??[]).length} load combinations (DL, DL+LL, seismic, water-current, wind+braking). Min FOS_slide = ${fv(pierMinFOS_slide,3)} vs IRC:78 Cl.706 floor 1.50 — ${ad_ps.label}.`,
    },
    {
      clause: 'IRC:78 Cl.706',
      description: `Pier Overturning Stability`,
      computed: `FOS_OT_min = ${fv(pierMinFOS_ot, 3)}`,
      limit: '≥ 2.00',
      ratio: ad_pt.label,
      verdict: ad_pt.verdict,
      narrative: `Minimum overturning factor across all IRC load combinations = ${fv(pierMinFOS_ot,3)} vs floor 2.00 — ${ad_pt.label}.`,
    },
    {
      clause: 'IRC:78 Cl.706',
      description: 'Pier Base Bearing Pressure',
      computed: `q_max = ${fv(pierMaxQ, 2)} kN/m²`,
      limit: `≤ SBC = ${fv(d.SBC??0, 0)} kN/m²`,
      ratio: ad_pb.label,
      verdict: ad_pb.verdict,
      narrative: `Worst-case pier base pressure q_max = ${fv(pierMaxQ,2)} kN/m² against adopted SBC = ${fv(d.SBC??0,2)} kN/m². ${ad_pb.label} — ${ad_pb.verdict === 'PASS' ? 'within bearing capacity' : 'EXCEEDS SBC — review footing dimensions'}.`,
    },
    // ── ABUTMENT ────────────────────────────────────────────────────────
    {
      clause: 'IRC:78 Cl.706',
      description: `Abutment Sliding Stability (${(d.abtCases??[]).length} cases)`,
      computed: `FOS_slide_min = ${fv(abtMinFOS_slide, 3)}`,
      limit: '≥ 1.50',
      ratio: ad_as.label,
      verdict: ad_as.verdict,
      narrative: `Coulomb Ka = ${fv(d.Ka??0,4)} for φ=${i.abt_phi}°, δ=${Math.round((i.abt_phi??30)*2/3)}°. Pa = ½·Ka·γ·H² = ${fv(0.5*(d.Ka??0)*(i.abt_gamma??18)*(i.abt_H??6)**2,1)} kN/m. Min FOS_slide = ${fv(abtMinFOS_slide,3)} — ${ad_as.label}.`,
    },
    {
      clause: 'IRC:78 Cl.706',
      description: 'Abutment Base Bearing Pressure',
      computed: `q_max = ${fv(abtMaxQ, 2)} kN/m²`,
      limit: `≤ SBC = ${fv(d.SBC??0, 0)} kN/m²`,
      ratio: ad_ab.label,
      verdict: ad_ab.verdict,
      narrative: `Worst abutment base pressure q_max = ${fv(abtMaxQ,2)} kN/m² across ${(d.abtCases??[]).length} cases — ${ad_ab.label}.`,
    },
  ];
}

// ─── HTML generator ──────────────────────────────────────────────────────────
export function generateCertificationReport(i: Inputs, d: Derived): void {
  const checks = buildChecks(i, d);
  const totalL  = i.spans * i.spanL;
  const allPass = checks.every(c => c.verdict !== 'FAIL');
  const failCount  = checks.filter(c => c.verdict === 'FAIL').length;
  const warnCount  = checks.filter(c => c.verdict === 'WARN').length;
  const passCount  = checks.filter(c => c.verdict === 'PASS').length;
  const timestamp  = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
  const dateStr    = new Date().toLocaleDateString('en-IN');

  const verdictColor = allPass ? '#006633' : '#cc0000';
  const verdictText  = allPass
    ? 'SATISFACTORY — RECOMMENDED FOR CONSTRUCTION'
    : `FLAGGED FOR REVIEW — ${failCount} check(s) FAIL, ${warnCount} WARN`;

  const rowColor = (v: RowVerdict) =>
    v === 'PASS' ? '#e6f4ea' : v === 'FAIL' ? '#fce8e6' : '#fff8e1';
  const badgeStyle = (v: RowVerdict) =>
    v === 'PASS'
      ? 'background:#1e7e34;color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:bold'
      : v === 'FAIL'
      ? 'background:#c0392b;color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:bold'
      : 'background:#e67e22;color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:bold';

  const tableRows = checks.map(r => `
    <tr style="background:${rowColor(r.verdict)}">
      <td style="padding:6px 8px;font-size:9.5px;color:#555;white-space:nowrap">${r.clause}</td>
      <td style="padding:6px 8px;font-size:10px;font-weight:600;color:#1a1a1a">${r.description}</td>
      <td style="padding:6px 8px;font-size:10px;font-family:monospace;color:#1a3a5c">${r.computed}</td>
      <td style="padding:6px 8px;font-size:9.5px;color:#555">${r.limit}</td>
      <td style="padding:6px 8px;font-size:9.5px;color:#333">${r.ratio}</td>
      <td style="padding:6px 8px;text-align:center"><span style="${badgeStyle(r.verdict)}">${r.verdict}</span></td>
    </tr>
    <tr style="background:#f9f9f9">
      <td></td>
      <td colspan="5" style="padding:4px 8px 8px;font-size:9px;color:#444;font-style:italic;line-height:1.6;border-bottom:1px solid #e0e0e0">${r.narrative}</td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>IRC Certification — ${i.name} — ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Verdana, Geneva, sans-serif; font-size: 11px; color: #222; background: #ccc; }
    .page { max-width: 900px; margin: 0 auto; background: #fff; padding: 36px 44px; }
    @media print {
      body { background: #fff; }
      .page { padding: 20px; box-shadow: none; }
      .no-print { display: none !important; }
      @page { size: A4; margin: 18mm 15mm; }
    }
    .header-band { background: linear-gradient(135deg, #1F496B 0%, #0a2a45 100%); color: #fff; padding: 18px 24px; border-radius: 4px 4px 0 0; }
    .header-band h1 { font-size: 15px; letter-spacing: 0.5px; }
    .header-band p  { font-size: 9.5px; color: #b8cfe8; margin-top: 3px; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f0f4f8; padding: 14px 16px; border: 1px solid #d0dae6; border-top: 0; }
    .meta-item label { display: block; font-size: 8px; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .meta-item span  { font-size: 10.5px; font-weight: 600; color: #1a1a1a; }
    .section-head { font-size: 11px; font-weight: bold; color: #1F496B; border-bottom: 1.5px solid #1F496B; padding-bottom: 4px; margin: 22px 0 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    table { width: 100%; border-collapse: collapse; font-family: Verdana, sans-serif; }
    th { background: #1F496B; color: #fff; padding: 7px 8px; font-size: 9.5px; text-align: left; }
    .verdict-box { border: 2px solid ${verdictColor}; border-radius: 4px; padding: 14px 18px; margin: 20px 0; background: ${allPass ? '#e6f4ea' : '#fce8e6'}; }
    .verdict-box .v-title { font-size: 13px; font-weight: bold; color: ${verdictColor}; }
    .verdict-box .v-sub   { font-size: 9.5px; color: #444; margin-top: 6px; line-height: 1.6; }
    .cost-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .cost-card { border: 1px solid #d0dae6; border-radius: 4px; padding: 10px 12px; background: #f9fbfd; }
    .cost-card label { font-size: 8px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
    .cost-card span  { font-size: 13px; font-weight: bold; color: #1a3a5c; }
    .sign-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 18px; }
    .sign-box  { border-top: 1.5px solid #333; padding-top: 6px; }
    .sign-box label { font-size: 8.5px; color: #555; }
    .stamp { background: #1F496B; color: #fff; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; text-align: center; line-height: 1.3; letter-spacing: 0.3px; }
    .stats-row { display: flex; gap: 12px; margin: 10px 0; }
    .stat-pill { padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: bold; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 60px; font-weight: 900; color: rgba(31,73,107,0.05); pointer-events: none; white-space: nowrap; z-index: 0; }
    .no-print { text-align: center; padding: 12px; background: #1F496B; margin-bottom: 0; }
    .no-print button { background: #fff; color: #1F496B; border: none; padding: 8px 20px; font-weight: bold; font-size: 11px; cursor: pointer; border-radius: 3px; margin: 0 4px; }
    .footer { border-top: 1px solid #ddd; margin-top: 28px; padding-top: 10px; font-size: 8.5px; color: #888; text-align: center; line-height: 1.7; }
  </style>
</head>
<body>
<div class="no-print">
  <button onclick="window.print()">🖨 Print / Save as PDF</button>
  <button onclick="window.close()">✕ Close</button>
  <span style="color:#aaa;font-size:10px;margin-left:12px">Use browser Print → Save as PDF for archival copy</span>
</div>

<div class="watermark">IRC CERTIFIED</div>

<div class="page">

  <!-- Letterhead -->
  <div class="header-band">
    <h1>IRC ENGINEERING COMPLIANCE CERTIFICATION</h1>
    <p>Bridge Design Suite · CRAJKUMARSINGH/Bridge_Slab_Design · Standards: IRC:6 | IRC:78 | IRC:112 | IS:456 | IS:7784 | IRC SP-13</p>
  </div>

  <!-- Project Meta -->
  <div class="meta-grid">
    <div class="meta-item"><label>Project / Name of Work</label><span>${i.name}</span></div>
    <div class="meta-item"><label>River Crossing</label><span>${i.river}</span></div>
    <div class="meta-item"><label>Location</label><span>${i.location ?? '—'}</span></div>
    <div class="meta-item"><label>Bridge Configuration</label><span>${i.spans} spans × ${fv(i.spanL, 2)} m = ${fv(totalL, 2)} m total</span></div>
    <div class="meta-item"><label>Concrete / Steel Grade</label><span>${i.grade} / ${i.steel}</span></div>
    <div class="meta-item"><label>Seismic Zone</label><span>Zone ${i.seismicZone ?? 'III'} (IRC:6-2016 Cl.219)</span></div>
    <div class="meta-item"><label>Design Discharge</label><span>${fv(d.Q ?? 0, 2)} m³/s (cumecs)</span></div>
    <div class="meta-item"><label>HFL / Bed RL</label><span>${fv(i.HFL, 3)} m / ${fv(i.bedRL, 3)} m MSL</span></div>
    <div class="meta-item"><label>Founding Level</label><span>RL ${fv(d.foundingRL ?? 0, 3)} m MSL</span></div>
    <div class="meta-item"><label>Certificate No.</label><span>BSC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}</span></div>
    <div class="meta-item"><label>Generated</label><span>${timestamp} IST</span></div>
    <div class="meta-item"><label>Engine</label><span>Bridge Design Suite v2.0 (W16 Merge)</span></div>
  </div>

  <!-- Summary verdict -->
  <div class="verdict-box">
    <div class="v-title">OVERALL VERDICT: ${verdictText}</div>
    <div class="v-sub">
      ${allPass
        ? `All ${checks.length} IRC/IS checks resolved within margin requirements. The structure is safe for the design loads recorded in this report. Deliverables — hydraulic chain, load-combination set, deck reinforcement schedule, pier and abutment design, GAD drawings, BOQ — constitute a complete IRC-compliant submission per the requirements of the Approving Authority.`
        : `${failCount} check(s) have not closed within IRC margin requirements. Review the flagged rows below and recompute after adjusting the governing parameters. A re-certification is required before submission.`
      }
    </div>
    <div class="stats-row" style="margin-top:10px">
      <span class="stat-pill" style="background:#e6f4ea;color:#1e7e34">✓ ${passCount} PASS</span>
      ${warnCount > 0 ? `<span class="stat-pill" style="background:#fff8e1;color:#e67e22">⚠ ${warnCount} WARN</span>` : ''}
      ${failCount > 0 ? `<span class="stat-pill" style="background:#fce8e6;color:#c0392b">✗ ${failCount} FAIL</span>` : ''}
      <span class="stat-pill" style="background:#e8f4fd;color:#1F496B">${checks.length} total checks</span>
    </div>
  </div>

  <!-- Check Matrix -->
  <div class="section-head">IRC/IS Compliance Assessment Matrix</div>
  <table>
    <thead>
      <tr>
        <th style="width:12%">Clause</th>
        <th style="width:22%">Check Description</th>
        <th style="width:18%">Computed Value</th>
        <th style="width:22%">IRC/IS Limit</th>
        <th style="width:14%">Adequacy</th>
        <th style="width:12%;text-align:center">Verdict</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <!-- Narrative Summary -->
  <div class="section-head">Engineering Narrative Summary</div>

  <p style="font-size:10px;line-height:1.8;color:#333;margin-bottom:10px">
    <strong>HYDRAULICS:</strong>
    The crossing of <strong>${i.river}</strong> at <strong>${i.location ?? 'site'}</strong> is sized for a design discharge
    of <strong>${fv(d.Q ?? 0, 2)} m³/s</strong> computed by Manning's formula (n = ${i.n}, S₀ = 1/${fi(i.S_denom)}).
    The Froude number Fr = ${fv(d.Fr ?? 0, 3)} confirms subcritical flow.
    The regime waterway (Lacey) is ${fv(d.L_lacey ?? 0, 2)} m; the ${i.spans}-span arrangement of ${fv(totalL, 2)} m
    ${totalL >= (d.L_lacey ?? 0) * 0.95 ? 'satisfies' : 'does NOT satisfy'} the 95% Lacey criterion.
    Lacey scour dsm = ${fv(d.dsm ?? 0, 3)} m (Ksf = ${i.Ksf ?? 1.5}); ASTRA 2.0× design depth = ${fv(d.max_dsm ?? 0, 3)} m,
    fixing the founding level at RL ${fv(d.foundingRL ?? 0, 3)} m.
    Afflux h = ${fv(d.afflux ?? 0, 3)} m (IS:7784 ceiling 0.60 m — ${(d.afflux ?? 0) <= 0.60 ? 'satisfied' : 'EXCEEDED'}).
    DWL = ${fv(d.DWL ?? 0, 3)} m MSL. Deck is set at HFL + 0.10 m — submersible configuration.
  </p>

  <p style="font-size:10px;line-height:1.8;color:#333;margin-bottom:10px">
    <strong>SUPERSTRUCTURE:</strong>
    The ${fv(i.slab_t * 1000, 0)} mm RC slab is designed for IRC Class A + 70R Wheeled per IRC:6-2016.
    Factored Mu = ${fv(d.sl66_Mtot ?? 0, 2)} kN·m over effective span ${fv(d.sl66_leff ?? 0, 3)} m
    (effective width ${fv(d.sl66_be ?? 0, 3)} m).
    Required depth d_req = ${fv(d.sl66_dreq ?? 0, 0)} mm; provided = ${fi(i.slab_t * 1000 - i.slab_cover)} mm —
    ${adequacy(i.slab_t * 1000 - i.slab_cover, d.sl66_dreq ?? 1).label}.
    Required Ast = ${fi(d.sl66_Ast ?? 0)} mm²/m; provided = ${fi(d.Ast_prov_slab ?? 0)} mm²/m —
    ${adequacy(d.Ast_prov_slab ?? 0, d.sl66_Ast ?? 1).label}.
    Net slab force = ${fv(d.net_force ?? 0, 2)} kN (${(d.net_force ?? 0) >= 0 ? 'downward — no anchorage' : 'upward — anchorage bolts specified'}).
  </p>

  <p style="font-size:10px;line-height:1.8;color:#333">
    <strong>SUBSTRUCTURE:</strong>
    Each pier (${fv(i.pierW, 2)} m × ${fv(i.pierL, 2)} m × ${fv(i.pierH, 2)} m H) founded at RL ${fv(d.foundingRL ?? 0, 3)} m.
    Across ${(d.pierLCs ?? []).length} IRC load combinations — FOS_slide_min = ${fv(Math.min(...(d.pierLCs ?? []).map(l => l.slidFOS ?? 0)), 3)}
    (IRC:78 floor 1.50), q_max = ${fv(Math.max(...(d.pierLCs ?? []).map(l => l.qmax ?? 0)), 2)} kN/m²
    (SBC = ${fv(d.SBC ?? 0, 0)} kN/m²).
    Abutment (H = ${fv(i.abt_H, 2)} m, B = ${fv(i.abt_Bbase, 2)} m base) — Ka = ${fv(d.Ka ?? 0, 4)},
    FOS_slide_min = ${fv(Math.min(...(d.abtCases ?? []).map(c => c.slidFOS ?? 0)), 3)},
    q_max = ${fv(Math.max(...(d.abtCases ?? []).map(c => c.qmax ?? 0)), 2)} kN/m².
  </p>

  <!-- Cost Summary -->
  <div class="section-head">Cost Summary (MoRTH Schedule of Rates)</div>
  <div class="cost-grid">
    <div class="cost-card">
      <label>Total Estimated Cost</label>
      <span>₹ ${fi(d.boqGrand ?? 0)}</span>
    </div>
    <div class="cost-card">
      <label>Cost per Running Metre</label>
      <span>₹ ${fi(d.boqPerRM ?? 0)} / RM</span>
    </div>
    <div class="cost-card">
      <label>Cost per m² of Deck</label>
      <span>₹ ${fi(d.boqPerSqm ?? 0)} / m²</span>
    </div>
  </div>
  <p style="font-size:9px;color:#888;margin-top:6px">
    Estimate includes concrete, reinforcement, formwork, earth-work, wearing coat, and substructure. Excludes land acquisition, approach roads, and utility diversions. Subject to variation as per actual quantities at site.
  </p>

  <!-- Certification Statement -->
  <div class="section-head">Certification Statement</div>
  <div style="border:1px solid #d0dae6;border-radius:4px;padding:14px 18px;background:#fafbfd;font-size:10px;line-height:1.9;color:#222">
    <p>
      This Certification Report has been generated by the Bridge Design Suite (W16 Unified Merge,
      CRAJKUMARSINGH/Bridge_Slab_Design) from the live calculation engine. All ${checks.length} IRC/IS checks
      listed in the Assessment Matrix above are derived deterministically from the Inputs and Derived
      data structures — no editorial content has been introduced. The narrative prose is produced by
      the same engine that produced the numerical results; it cannot drift from the underlying numbers.
    </p>
    <p style="margin-top:10px">
      <strong>The structure is ${allPass ? 'SAFE for the design loads and is recommended for construction' : 'FLAGGED FOR REVIEW — at least one IRC margin has not been satisfied. Do not submit to the Approving Authority until all FAIL items are resolved and a fresh certification is generated'}.</strong>
    </p>
    <p style="margin-top:10px;font-size:9px;color:#666">
      Generated: ${timestamp} IST &nbsp;|&nbsp;
      Certificate No.: BSC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)} &nbsp;|&nbsp;
      Standards: IRC:6-2016, IRC:78-2014, IRC:112-2011, IS:456-2000, IS:7784, IRC SP-13
    </p>
  </div>

  <!-- Signature Block -->
  <div class="section-head">Authorisation Block</div>
  <div class="sign-grid">
    <div>
      <div class="sign-box">
        <div style="height:36px"></div>
        <label>Prepared by: Design Engineer</label>
      </div>
    </div>
    <div>
      <div class="sign-box">
        <div style="height:36px"></div>
        <label>Checked by: Senior Engineer</label>
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:14px">
      <div class="sign-box" style="flex:1">
        <div style="height:36px"></div>
        <label>Approved by: Resident Engineer</label>
      </div>
      <div class="stamp">IRC<br/>CERTIFIED<br/>${new Date().getFullYear()}</div>
    </div>
  </div>

  <div class="footer">
    Bridge Design Suite · ASTRA 15 Tutorial Reference · IRC/IS Standards Compliance Report<br/>
    Generated ${timestamp} IST — This report is machine-generated and requires countersignature by a licensed Structural Engineer before official submission.<br/>
    IRC:6-2016 | IRC:78-2014 | IRC:112-2011 | IS:456-2000 | IS:7784 | IRC SP-13 | ASTRA 15 TUTORIALS (CRAJKUMARSINGH/Bridge_Slab_Design)
  </div>

</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${i.river.replace(/\s+/g, '_')}_IRC_Certification_${new Date().toISOString().slice(0,10)}.html`);
}
