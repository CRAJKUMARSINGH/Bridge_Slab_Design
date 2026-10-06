/**
 * PIER FOOTING OPTIMISER
 * Drop-in optimisation panel for Bridge_Slab_Design_Replit
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Automatically steps footing width (Â±250 mm) and length (Â±500 mm)
 * keeping the 1:2 ratio, recomputes all 5 IRC load cases, and presents
 * the full result table so the engineer can pick the optimal dimensions
 * at a glance â€” without scrolling through 20 pages per trial.
 *
 * Algorithm:
 *   1. From current ftgPW Ã— ftgPL, try steps âˆ’4 to +6.
 *   2. Each step: B += Î” Ã— 0.25 m, L += Î” Ã— 0.50 m.
 *   3. All 5 LCs recomputed identically to derive() in BridgeSlabReport.tsx.
 *   4. Governing q_max, worst sliding FOS, worst OT FOS shown per row.
 *   5. Recommend the SMALLEST footing where all checks pass.
 *   6. If onApply is provided, "Apply â–¸" buttons let the host component
 *      update its state directly.
 *
 * HOW TO INTEGRATE:
 *   1. Copy to: src/pages/report-sheets/PierOptimiser.tsx
 *   2. In BridgeSlabReport.tsx, import:
 *        import PierOptimiser from "./report-sheets/PierOptimiser";
 *   3. Place ABOVE <SectionPierStability /> inside {computed && (...)}:
 *        <PierOptimiser
 *          i={inp} d={d}
 *          onApply={(B, L) => setInp(p => ({ ...p, ftgPW: B, ftgPL: L }))}
 *        />
 *   No new packages.
 *
 * References: IRC:6-2017, IRC:78-2014 Cl.706
 */

import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";

const f2 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(2));
const f3 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(3));

/* â”€â”€ Replicated from derive() for self-contained optimisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface LCResult {
  qmax: number; qmin: number; slidFOS: number; otFOS: number;
  bearOK: boolean; slidOK: boolean; otOK: boolean;
}
function computeLC(
  Vf: number, Hf: number,
  B_ftg: number, L_ftg: number, ftgPT: number,
  pierH: number, mu: number, SBC: number,
  seismic: boolean,
): LCResult {
  const A_ftg   = B_ftg * L_ftg;
  const Z_ftg   = (B_ftg * B_ftg * L_ftg) / 6;   // same as derive()
  const MR_arm  = B_ftg / 2;
  const MO_arm  = pierH / 2 + ftgPT;              // single arm â€” same as derive()
  const MR      = Vf * MR_arm;
  const MO      = Hf * MO_arm;
  const e       = Math.abs(MR_arm - (MR - MO) / Vf);
  const qmax    = Vf / A_ftg + (Vf * e) / Z_ftg;
  const qmin    = Math.max(0, Vf / A_ftg - (Vf * e) / Z_ftg);
  const slidFOS = Hf > 0 ? mu * Vf / Hf : 999;
  const otFOS   = MO > 0 ? MR / MO : 999;
  const slidMin = seismic ? 1.25 : 1.50;
  const otMin   = seismic ? 1.50 : 2.00;
  return {
    qmax, qmin, slidFOS, otFOS,
    bearOK: qmax <= SBC && qmin >= 0,
    slidOK: slidFOS >= slidMin,
    otOK:   otFOS   >= otMin,
  };
}

interface TrialRow {
  step: number;
  B: number; L: number;
  Wftg: number;
  govQmax: number;
  worstSlid: number;
  worstOT: number;
  allOK: boolean;
  lcRes: LCResult[];
}

function runOptimisation(i: Inputs, SBC: number): TrialRow[] {
  const wt_pier = i.pierW * i.pierL * i.pierH * 25;
  const wt_cap  = i.capW  * i.capL  * i.capD  * 25;
  const rows: TrialRow[] = [];

  for (let step = -8; step <= 10; step++) {
    const B = +(i.ftgPW + step * 0.025).toFixed(3);   // 25 mm per step
    const L = +(i.ftgPL + step * 0.050).toFixed(3);   // 50 mm per step (1:2 ratio)
    if (B < 0.50 || L < 0.50) continue;

    const wt_ftg = B * L * i.ftgPT * 25;
    const Wself  = wt_pier + wt_cap + wt_ftg;

    const lcDefs = [
      { Vf: i.DL_pier + i.LL_pier + Wself,          Hf: i.hydro,                   seismic: false },
      { Vf: i.DL_pier + Wself,                       Hf: i.hydro,                   seismic: false },
      { Vf: i.DL_pier + i.LL_pier + Wself + i.seisV, Hf: i.hydro + i.seisH,        seismic: true  },
      { Vf: i.DL_pier + Wself + i.seisV,             Hf: i.hydro + i.seisH,        seismic: true  },
      { Vf: i.DL_pier + i.LL_pier + Wself,           Hf: i.hydro + i.windTemp,     seismic: false },
    ];

    const lcRes = lcDefs.map(lc =>
      computeLC(lc.Vf, lc.Hf, B, L, i.ftgPT, i.pierH, i.mu, SBC, lc.seismic)
    );

    const allOK     = lcRes.every(r => r.bearOK && r.slidOK && r.otOK);
    const govQmax   = Math.max(...lcRes.map(r => r.qmax));
    const worstSlid = Math.min(...lcRes.map(r => r.slidFOS));
    const worstOT   = Math.min(...lcRes.map(r => r.otFOS));

    rows.push({ step, B, L, Wftg: wt_ftg, govQmax, worstSlid, worstOT, allOK, lcRes });
  }
  return rows;
}

/* â”€â”€ Colour palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const C = {
  header: "#1e1a2e", headerText: "#e8d8f8",
  orchid: "darkorchid", royal: "royalblue",
  green: "#007a3d", red: "#b00020", amber: "#b07000",
  bgGreen: "#e6f4ed", bgRed: "#fce8ec", bgAmber: "#fef3e2",
  bgCurrent: "#f0ecfc", border: "#c8b8d8",
};
const cell: React.CSSProperties = {
  padding: "3px 8px", fontFamily: "Consolas,'Courier New',monospace",
  fontSize: 9.5, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap",
};
const th: React.CSSProperties = {
  ...cell, background: C.header, color: C.headerText,
  fontFamily: "Verdana,sans-serif", fontSize: 9, fontWeight: "bold",
  textAlign: "center",
};

interface Props {
  i: Inputs;
  d: Derived;
  /** Optional callback: called with (newFtgPW, newFtgPL) when engineer clicks Apply. */
  onApply?: (B: number, L: number) => void;
}

export default function PierOptimiser({ i, d, onApply }: Props) {
  const rows   = runOptimisation(i, d.SBC);
  const current = rows.find(r => r.step === 0);
  // First step where allOK is true
  const optimal = rows.find(r => r.allOK);
  const isOptimal = (r: TrialRow) =>
    optimal && Math.abs(r.B - optimal.B) < 0.001 && Math.abs(r.L - optimal.L) < 0.001;
  const isCurrent = (r: TrialRow) => r.step === 0;

  const overallStatus = current?.allOK ? "PASSES AS-IS" : optimal ? "AUTO-SIZED BELOW" : "CANNOT SIZE IN RANGE";

  return (
    <div className="no-print" style={{
      margin: "0 auto 16px", maxWidth: 1060,
      border: `2px solid ${current?.allOK ? C.green : C.orchid}`,
      borderRadius: 3, background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)", overflow: "hidden",
      fontFamily: "Verdana,sans-serif",
    }}>
      {/* Header */}
      <div style={{ background: C.header, color: C.headerText, padding: "8px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>
            â–¶  Pier Footing Optimiser â€” Â±25 mm (Width) Ã— Â±50 mm (Length) Steps Â· 1:2 Ratio
          </div>
          <div style={{ fontSize: 9, color: "#b090d0", marginTop: 2 }}>
            IRC:6-2017 Â· IRC:78-2014 Cl.706 Â· SBC = {f2(d.SBC)} kPa Â· Î¼ = {i.mu} Â· Step: B Â±25 mm, L Â±50 mm
          </div>
        </div>
        <div style={{
          background: current?.allOK ? C.green : "#7b0018",
          border: `1.5px solid ${current?.allOK ? "#55d48b" : "#f48080"}`,
          borderRadius: 2, padding: "3px 12px", fontSize: 10, fontWeight: "bold",
          color: "#fff", letterSpacing: 0.5,
        }}>
          {overallStatus}
        </div>
      </div>

      {/* Current dimensions strip */}
      <div style={{ background: C.bgCurrent, borderBottom: `1px solid ${C.border}`,
        padding: "4px 14px", fontSize: 9.5 }}>
        <strong>Current footing:</strong>&nbsp;
        <span style={{ fontFamily: "Consolas,'Courier New',monospace" }}>
          {i.ftgPW.toFixed(2)} m Ã— {i.ftgPL.toFixed(2)} m Ã— {i.ftgPT.toFixed(2)} m
        </span>
        &nbsp;(B Ã— L Ã— t). Pier: {i.pierW.toFixed(2)} m Ã— {i.pierL.toFixed(2)} m Ã— {i.pierH.toFixed(2)} m H.
        {optimal && !current?.allOK && (
          <span style={{ color: C.orchid, fontWeight: "bold", marginLeft: 10 }}>
            â†’ Recommend:&nbsp;
            {optimal.B.toFixed(2)} m Ã— {optimal.L.toFixed(2)} m
          </span>
        )}
        {current?.allOK && (
          <span style={{ color: C.green, fontWeight: "bold", marginLeft: 10 }}>
            â†’ Current passes all checks. Smaller footings shown â€” pick the minimum safe.
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: `1px solid ${C.border}` }}>
          <thead>
            <tr>
              {["Step", "B_ftg (m)", "L_ftg (m)", "W_ftg (kN)", "q_max gov. (kPa)", "vs SBC",
                "Worst Slid.FOS", "Worst OT.FOS", "Verdict", onApply ? "Action" : ""].filter(Boolean).map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const isCur = isCurrent(r);
              const isOpt = isOptimal(r);
              const rowBg = isOpt && !isCur
                ? C.bgGreen
                : isCur
                  ? C.bgCurrent
                  : r.allOK ? "#f9fef9" : r.step > 0 ? "#fff8f8" : undefined;
              const qColor = r.govQmax > d.SBC ? C.red : r.govQmax > d.SBC * 0.90 ? C.amber : C.green;
              const slidColor = r.worstSlid < 1.25 ? C.red : r.worstSlid < 1.50 ? C.amber : C.green;
              const otColor   = r.worstOT   < 1.50 ? C.red : r.worstOT   < 2.00 ? C.amber : C.green;

              return (
                <tr key={idx} style={{ background: rowBg, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...cell, textAlign: "center", fontWeight: isCur ? "bold" : undefined }}>
                    {r.step > 0 ? `+${r.step}` : r.step === 0 ? "0 â—€" : r.step}
                  </td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: "bold" }}>{r.B.toFixed(2)}</td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: "bold" }}>{r.L.toFixed(2)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{r.Wftg.toFixed(1)}</td>
                  <td style={{ ...cell, textAlign: "right", color: qColor, fontWeight: "bold" }}>
                    {f2(r.govQmax)}
                  </td>
                  <td style={{ ...cell, textAlign: "center", fontSize: 9, color: r.govQmax <= d.SBC ? C.green : C.red }}>
                    {r.govQmax <= d.SBC ? "â‰¤ OK" : `+${f2(r.govQmax - d.SBC)} OVER`}
                  </td>
                  <td style={{ ...cell, textAlign: "right", color: slidColor, fontWeight: "bold" }}>
                    {f2(r.worstSlid)}
                    <span style={{ color: "#888", fontWeight: "normal", fontSize: 8.5 }}>
                      &nbsp;â‰¥{r.lcRes.some(lc => !lc.slidOK) ? (r.lcRes[2].slidOK ? "1.50" : "1.25") : "1.50"}
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: "right", color: otColor, fontWeight: "bold" }}>
                    {f2(r.worstOT)}
                    <span style={{ color: "#888", fontWeight: "normal", fontSize: 8.5 }}>
                      &nbsp;â‰¥{r.lcRes.some(lc => !lc.otOK) ? (r.lcRes[2].otOK ? "2.00" : "1.50") : "2.00"}
                    </span>
                  </td>
                  <td style={{
                    ...cell, textAlign: "center",
                    color: r.allOK ? C.green : C.red, fontWeight: "bold",
                    background: isOpt && !isCur ? "#c6f0d8" : rowBg,
                  }}>
                    {isOpt && !isCur ? "â˜… OPTIMAL" : r.allOK ? "OK" : "FAIL"}
                  </td>
                  {onApply && (
                    <td style={{ ...cell, textAlign: "center" }}>
                      {r.allOK && (
                        <button
                          onClick={() => onApply(r.B, r.L)}
                          style={{
                            background: isOpt ? C.green : C.royal,
                            color: "#fff", border: "none",
                            padding: "2px 8px", borderRadius: 2, cursor: "pointer",
                            fontSize: 9, fontFamily: "Verdana,sans-serif",
                          }}
                        >
                          Apply â–¸
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* LC detail for current and optimal */}
      <div style={{ padding: "6px 14px 8px", fontSize: 9, color: "#555", fontFamily: "Verdana,sans-serif",
        borderTop: `1px solid ${C.border}`, background: "#faf7fd" }}>
        <strong>LC labels:</strong>&nbsp;
        LC1 DL+LL+Hyd Â· LC2 DL+Hyd Â· LC3 DL+LL+Seismic+Hyd (governs) Â· LC4 DL+Seismic+Hyd Â· LC5 DL+LL+Wind+Hyd &nbsp;|&nbsp;
        Step = 0 is current dimensions. Negative steps are smaller (economy). Positive steps are larger (needed when FAIL).&nbsp;
        Footing thickness t = {i.ftgPT.toFixed(2)} m held constant. Pier body unchanged.
      </div>
    </div>
  );
}


