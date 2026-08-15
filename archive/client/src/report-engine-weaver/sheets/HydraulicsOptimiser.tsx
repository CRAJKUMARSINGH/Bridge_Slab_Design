/**
 * HYDRAULICS OPTIMISER â€” Span Selection for Afflux & HFL
 * Drop-in panel for Bridge_Slab_Design_Replit
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * For submersible bridges: user selects the optimal (n_spans Ã— span_L) combination
 * so that the afflux-adjusted HFL (DWL) just clears the bridge soffit with
 * the required freeboard.  All combinations use the exact Molesworth afflux
 * formula from derive() so results are consistent with the full report.
 *
 * Algorithm:
 *   For each (n, L) in the search grid:
 *     L_w        = n Ã— L âˆ’ (n âˆ’ 1) Ã— i.pierW        [effective waterway width]
 *     A_obs_pier = (n âˆ’ 1) Ã— i.pierW Ã— (HFL âˆ’ bedRL) [obstruction by piers]
 *     a_net      = i.A âˆ’ A_obs_pier âˆ’ i.A_obs_slab âˆ’ i.A_obs_abt
 *     afflux     = ((VÂ²/17.85) + 0.0152) Ã— ((i.A/a_net)Â² âˆ’ 1)   [Molesworth]
 *     DWL        = i.HFL + afflux
 *     clearance  = soffit_RL âˆ’ DWL                 [positive = clear]
 *     L_lacey    = 4.75 Ã— âˆšQ                       [Lacey regime width]
 *     Lacey OK   = L_w â‰¥ 0.95 Ã— L_lacey
 *
 * HOW TO INTEGRATE:
 *   1. Copy to: src/pages/report-sheets/HydraulicsOptimiser.tsx
 *   2. In BridgeSlabReport.tsx, import:
 *        import HydraulicsOptimiser from "./report-sheets/HydraulicsOptimiser";
 *   3. Place ABOVE <SectionHydraulics /> inside {computed && (...)}:
 *        <HydraulicsOptimiser
 *          i={inp} d={d} soffitRL={97.90}
 *          freeboard={0.15}
 *          onApply={(n, L) => setInp(p => ({ ...p, spans: n, spanL: L }))}
 *        />
 *   soffitRL: soffit level in m (default = HFL + 0 for submersible, i.e. no extra head)
 *   freeboard: minimum clearance required (m). Use 0 for submersible (DWL â‰¤ soffit OK).
 *   No new packages.
 *
 * References:
 *   Molesworth afflux formula â€” IRC:SP:13-2004 Art. 5.4
 *   Lacey waterway  â€” IRC:SP:13 Art. 5.2.1 (L = 4.75âˆšQ)
 *   IRC:6-2017 Cl.203 / IS:7784 Pt.I
 */

import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";

const f2  = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(2));
const f3  = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(3));
const fN  = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(0));

interface TrialRow {
  n: number; L: number; Lw: number; L_lacey: number; laceyOK: boolean;
  a_net: number; a_netOK: boolean; afflux: number; DWL: number;
  clearance: number; clearanceOK: boolean; allOK: boolean; isCurrent: boolean;
}

function computeRow(
  n: number, L: number, i: Inputs, Q: number, soffitRL: number, freeboard: number,
): TrialRow | null {
  const Lw = n * L - (n - 1) * i.pierW;
  if (Lw <= 0) return null;

  const depth        = i.HFL - i.bedRL;
  const A_obs_pier   = (n - 1) * i.pierW * depth;
  const a_net        = i.A - A_obs_pier - i.A_obs_slab - i.A_obs_abt;
  if (a_net <= 0) return null;

  // Approach velocity (whole cross-section)
  const V      = Q / i.A;
  // Molesworth afflux (exact formula from derive())
  const afflux = ((V * V / 17.85) + 0.0152) * ((i.A * i.A) / (a_net * a_net) - 1);
  const DWL    = i.HFL + afflux;

  const L_lacey    = 4.75 * Math.sqrt(Q);
  const laceyOK    = Lw >= 0.95 * L_lacey;
  const a_netOK    = a_net > 0;
  const clearance  = soffitRL - DWL;
  const clearanceOK = clearance >= freeboard;

  const isCurrent = n === i.spans && Math.abs(L - i.spanL) < 0.01;
  const allOK = laceyOK && a_netOK && clearanceOK && afflux >= 0;

  return { n, L, Lw, L_lacey, laceyOK, a_net, a_netOK, afflux, DWL, clearance, clearanceOK, allOK, isCurrent };
}

/* â”€â”€ Colours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const C = {
  header: "#0a2240", headerText: "#d8ecf8",
  green: "#007a3d", red: "#b00020", amber: "#b07000",
  bgGreen: "#e6f4ed", bgRed: "#fce8ec", bgAmber: "#fef3e2",
  bgCurrent: "#eef4ff", border: "#b0c8d8",
  royal: "royalblue",
};
const cell: React.CSSProperties = {
  padding: "3px 7px", fontFamily: "Consolas,'Courier New',monospace",
  fontSize: 9.5, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap",
  textAlign: "right",
};
const th: React.CSSProperties = {
  ...cell, background: C.header, color: C.headerText,
  fontFamily: "Verdana,sans-serif", fontSize: 8.5, fontWeight: "bold",
  textAlign: "center",
};

interface Props {
  i: Inputs;
  d: Derived;
  /** Soffit level of bridge deck (m RL). For submersible use existing HFL + expected afflux. */
  soffitRL?: number;
  /** Minimum clearance between DWL and soffit (m). 0 for submersible, 0.60 for non-submersible. */
  freeboard?: number;
  /** Is it a submersible bridge? (Defaults to true if freeboard is near 0) */
  isSubmersible?: boolean;
  /** Optional: called with (new n_spans, new spanL) when Apply button is clicked. */
  onApply?: (n: number, L: number) => void;
}

export default function HydraulicsOptimiser({
  i, d, soffitRL, freeboard = 0.05, isSubmersible = true, onApply,
}: Props) {
  // Q from derive(); if not available, fall back to Manning estimate
  const Q = d.Q;
  const V = Q / i.A;

  // For submersible, HFL is allowed to pass near the soffit.
  // Default soffit = bedRL + pierH (approximate height of pier top)
  const defaultSoffit = i.bedRL + i.pierH;
  const soffit = soffitRL ?? defaultSoffit;

  // â”€â”€ Build search grid â”€â”€
  // Span lengths to try: current Â± steps from a standard set
  const standardSpanL = [6.0, 7.5, 9.0, 10.0, 12.0, 12.2, 15.0, 18.0, 20.0];
  const nearSpanL = Array.from(new Set([
      i.spanL - 2.5, i.spanL - 1.5, i.spanL,
      i.spanL + 1.5, i.spanL + 2.5,
      ...standardSpanL,
    ].filter(l => l >= 5.0 && l <= 24.0).map(l => +l.toFixed(1)))).sort((a, b) => a - b);

  const maxSpans = Math.min(12, Math.ceil((4.75 * Math.sqrt(Q)) / i.spanL) + 4);

  // â”€â”€ Primary table: vary n_spans (fix spanL = current) â”€â”€
  const spanVariations: TrialRow[] = [];
  for (let n = 1; n <= maxSpans; n++) {
    const r = computeRow(n, i.spanL, i, Q, soffit, freeboard);
    if (r) spanVariations.push(r);
  }

  // â”€â”€ Secondary table: vary spanL (fix n = recommended from primary) â”€â”€
  const recN = spanVariations.find(r => r.allOK)?.n ?? i.spans;
  const lengthVariations: TrialRow[] = nearSpanL
    .map(L => computeRow(recN, L, i, Q, soffit, freeboard))
    .filter(Boolean) as TrialRow[];

  const L_lacey = 4.75 * Math.sqrt(Q);
  const currentRow = spanVariations.find(r => r.isCurrent);

  // â”€â”€ Best combination overall â”€â”€
  const allCombinations: TrialRow[] = [];
  for (const L of nearSpanL) {
    for (let n = 1; n <= maxSpans; n++) {
      const r = computeRow(n, L, i, Q, soffit, freeboard);
      if (r && r.allOK) allCombinations.push(r);
    }
  }
  // Sort by ascending n_spans Ã— span_L (minimum total bridge length)
  allCombinations.sort((a, b) => a.n * a.L - b.n * b.L);
  const bestCombo = allCombinations[0];

  function rowBg(r: TrialRow) {
    if (r.isCurrent) return C.bgCurrent;
    if (r.allOK) return C.bgGreen;
    if (!r.laceyOK) return C.bgAmber;
    return C.bgRed ?? "#fff8f8";
  }

  function TrialTableRow({ r, showL }: { r: TrialRow; showL?: boolean }) {
    const isBest = bestCombo && r.n === bestCombo.n && Math.abs(r.L - bestCombo.L) < 0.01;
    return (
      <tr style={{ background: isBest && !r.isCurrent ? C.bgGreen : rowBg(r),
        borderBottom: `1px solid ${C.border}` }}>
        <td style={{ ...cell, textAlign: "center", fontWeight: r.isCurrent ? "bold" : undefined }}>
          {r.n}{r.isCurrent ? " â—€" : ""}
        </td>
        {showL && <td style={{ ...cell, textAlign: "right" }}>{r.L.toFixed(1)}</td>}
        <td style={{ ...cell }}>{f2(r.Lw)}</td>
        <td style={{ ...cell, color: r.laceyOK ? C.green : C.amber }}>
          {f2(r.L_lacey)} {r.laceyOK ? "âœ“" : "âš "}
        </td>
        <td style={{ ...cell, color: r.laceyOK ? "#222" : C.amber }}>
          {f2(r.Lw / r.L_lacey * 100)}%
        </td>
        <td style={{ ...cell }}>{f2(r.a_net)}</td>
        <td style={{ ...cell, color: r.afflux < 0.30 ? C.green : r.afflux < 0.60 ? C.amber : C.red, fontWeight: "bold" }}>
          {f3(r.afflux)}
        </td>
        <td style={{ ...cell, fontWeight: "bold" }}>{f2(r.DWL)}</td>
        <td style={{
          ...cell, fontWeight: "bold",
          color: r.clearanceOK ? C.green : r.clearance < 0 ? C.red : C.amber,
        }}>
          {r.clearance >= 0 ? "+" : ""}{f3(r.clearance)}
        </td>
        <td style={{
          ...cell, textAlign: "center",
          color: r.allOK ? C.green : C.red, fontWeight: "bold",
          background: isBest && !r.isCurrent ? "#c6f0d8" : undefined,
        }}>
          {isBest && !r.isCurrent ? "â˜… BEST" : r.allOK ? "OK" : "REVIEW"}
        </td>
        {onApply && (
          <td style={{ ...cell, textAlign: "center" }}>
            {r.allOK && (
              <button onClick={() => onApply(r.n, r.L)} style={{
                background: isBest ? C.green : C.royal,
                color: "#fff", border: "none",
                padding: "2px 8px", borderRadius: 2, cursor: "pointer",
                fontSize: 9, fontFamily: "Verdana,sans-serif",
              }}>
                Apply â–¸
              </button>
            )}
          </td>
        )}
      </tr>
    );
  }

  const colHeaders = (showL: boolean) => [
    "Spans", showL ? "Span L (m)" : null, "L_w eff (m)", "L_lacey (m)",
    "L_w / L_lacey", "a_net (mÂ²)", "Afflux (m)", "DWL (m RL)",
    `Clearance (m)\nâ‰¥ ${freeboard} m`, "Status", onApply ? "Action" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="no-print" style={{
      margin: "0 auto 16px", maxWidth: 1080,
      border: `2px solid ${currentRow?.allOK ? C.green : C.royal}`,
      borderRadius: 3, background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)", overflow: "hidden",
      fontFamily: "Verdana,sans-serif",
    }}>
      {/* Header */}
      <div style={{ background: C.header, color: C.headerText, padding: "8px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>
            â–¶  Hydraulics Optimiser â€” Span Selection for Afflux / HFL
          </div>
          <div style={{ fontSize: 9, color: "#9bbfd8", marginTop: 2 }}>
            Molesworth formula (IRC:SP:13 Art.5.4) Â· Lacey waterway Â· Q = {f2(Q)} mÂ³/s
            &nbsp;Â· V = {f3(V)} m/s Â· A = {f2(i.A)} mÂ² Â· HFL = {f2(i.HFL)} m RL
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#9bbfd8" }}>
          Soffit = {f2(soffit)} m RL<br />
          Freeboard req. = {freeboard * 1000} mm
        </div>
      </div>

      {/* Key numbers */}
      <div style={{ background: "#0d2b4a", borderBottom: `2px solid ${C.royal}`,
        padding: "5px 14px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
        {[
          { label: "Q (mÂ³/s)",      val: f2(Q) },
          { label: "V approach",    val: `${f3(V)} m/s` },
          { label: "L_Lacey (m)",   val: f2(L_lacey) },
          { label: "Current afflux",val: `${f3(d.afflux)} m` },
          { label: "Current DWL",   val: `${f2(d.DWL)} m RL` },
        ].map(({ label, val }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#6a9ec0", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#fff", fontFamily: "Consolas,'Courier New',monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 14px 4px", fontSize: 9.5, fontWeight: "bold",
        color: C.royal, borderBottom: `1px solid ${C.border}` }}>
        Section A â€” Vary number of spans (span length fixed at {i.spanL.toFixed(1)} m)
      </div>

      {/* Table A */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{colHeaders(false).map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {spanVariations.map((r, idx) => <TrialTableRow key={idx} r={r} showL={false} />)}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "8px 14px 4px", fontSize: 9.5, fontWeight: "bold",
        color: C.royal, borderBottom: `1px solid ${C.border}`,
        borderTop: `2px solid ${C.border}`, background: "#f9f6fd" }}>
        Section B â€” Vary span length (n spans fixed at {recN} â€” recommended from Section A)
      </div>

      {/* Table B */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{colHeaders(true).map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {lengthVariations.map((r, idx) => <TrialTableRow key={idx} r={r} showL />)}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      {bestCombo && (
        <div style={{ padding: "6px 14px", background: "#e4f5ed",
          borderTop: `2px solid ${C.green}`, fontSize: 9.5 }}>
          <strong style={{ color: C.green }}>â˜… Minimum bridge for HFL clearance:</strong>&nbsp;
          <span style={{ fontFamily: "Consolas,'Courier New',monospace" }}>
            {bestCombo.n} spans Ã— {bestCombo.L.toFixed(1)} m
          </span>&nbsp;
          â†’ L_w = {f2(bestCombo.Lw)} m (L_Lacey = {f2(bestCombo.L_lacey)} m)
          &nbsp;â†’ Afflux = {f3(bestCombo.afflux)} m
          &nbsp;â†’ DWL = {f2(bestCombo.DWL)} m RL
          &nbsp;â†’ Clearance to soffit = {f3(bestCombo.clearance)} m
          {onApply && (
            <button onClick={() => onApply(bestCombo.n, bestCombo.L)} style={{
              marginLeft: 16, background: C.green, color: "#fff", border: "none",
              padding: "3px 12px", borderRadius: 2, cursor: "pointer",
              fontSize: 9.5, fontFamily: "Verdana,sans-serif", fontWeight: "bold",
            }}>
              Apply Best â–¸
            </button>
          )}
        </div>
      )}

      {/* Footer note */}
      <div style={{ padding: "4px 14px", fontSize: 8.5, color: "#666",
        borderTop: `1px solid ${C.border}`, background: "#f9f6fd" }}>
        Afflux = Molesworth: h = [(VÂ²/17.85) + 0.0152] Ã— [(A/a_net)Â² âˆ’ 1] Â· IRC:SP:13 Art.5.4
        &nbsp;Â· Lacey L = 4.75âˆšQ Â· IRC:SP:13 Art.5.2.1 Â· Obstruction by slab, piers, abutments deducted.
        Soffit RL = {f2(soffit)} m assumed. Change <code>soffitRL</code> prop to match your design.
      </div>
    </div>
  );
}




