/**
 * ABUTMENT OPTIMISER â€” Gravity & Cantilever Abutment Dimension Finder
 * Drop-in panel for Bridge_Slab_Design_Replit
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Searches the optimal footing base width (Bbase) for an abutment by
 * stepping toe and heel dimensions in a 1:2 ratio:
 *   â€¢ Toe   Â± 25 mm steps
 *   â€¢ Heel  Â± 50 mm steps
 *   â†’ Bbase changes by 75 mm per step
 *
 * Stability checks for each trial Bbase:
 *   1. Overturning FOS  = Î£MR / Î£MO  â‰¥ 2.00  (about toe)
 *   2. Sliding FOS      = Î¼ Ã— Î£V / Î£H â‰¥ 1.50
 *   3. Bearing:  qmax   = Î£V/B Ã— (1 + 6e/B) â‰¤ SBC
 *                qmin   = Î£V/B Ã— (1 âˆ’ 6e/B) â‰¥ 0
 *      where e = B/2 âˆ’ Î£Mnet/Î£V  (eccentricity from centre)
 *
 * Earth pressure (Rankine active, c = 0):
 *   Ka = tanÂ²(45 âˆ’ Ï†/2)
 *   Pa = 0.5 Ã— Ka Ã— Î³ Ã— HÂ²       [resultant at H/3 from base]
 *   Ph = Pa Ã— cos(Î´)  (Î´ = wall friction, default = 2Ï†/3)
 *   Pv = Pa Ã— sin(Î´)
 *
 * Weight contributions:
 *   W_stem  = abt_tstem Ã— abt_H Ã— spanL Ã— Î³_c
 *   W_base  = Bbase Ã— abt_tftg Ã— spanL Ã— Î³_c
 *   W_fill  = heel Ã— abt_H Ã— spanL Ã— Î³_s       [backfill on heel]
 *   W_super = DL_super_abt + LL_super_abt (from i.DL_pier, i.LL_pier Ã— 0.5)
 *
 * HOW TO INTEGRATE:
 *   1. Copy to: src/pages/report-sheets/AbutmentOptimiser.tsx
 *   2. In BridgeSlabReport.tsx, import:
 *        import AbutmentOptimiser from "./report-sheets/AbutmentOptimiser";
 *   3. Inside {computed && (...)} ABOVE <SectionAbutment />:
 *        <AbutmentOptimiser
 *          i={inp} d={d}
 *          mu={0.50}
 *          onApply={(Bbase) => setInp(p => ({ ...p, abt_Bbase: Bbase }))}
 *        />
 *   No new packages.
 *
 * References:
 *   IS:6403 â€” Bearing capacity Â· IS:14458 Pt.1 â€” Retaining wall stability
 *   IRC:78-2000 Cl.710.3 â€” Abutment base pressure
 *   IRC:6-2017 Cl.214 â€” Earth pressure
 */

import React, { useState } from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";

const f2 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(2));
const f3 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(3));

const DEG = Math.PI / 180;

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

interface TrialResult {
  Bbase: number;      // footing base width (m)
  toe: number;        // toe length (m)
  heel: number;       // heel length (m)
  isCurrent: boolean;
  // Force components
  W_stem: number; W_base: number; W_fill: number; W_super: number;
  Pa: number; Ph: number; Pv: number;
  sumV: number; sumH: number;
  // Moments about toe (clockwise positive = stabilising)
  MR: number; MO: number;
  // Outputs
  otFOS: number; slidFOS: number;
  e: number; qmax: number; qmin: number;
  // Status
  otOK: boolean; slidOK: boolean; bearOK: boolean; qOK: boolean;
  allOK: boolean;
}

interface Props {
  i: Inputs;
  d: Derived;
  /** Coefficient of friction at base. Default 0.50 (rough stone / concrete-on-soil). */
  mu?: number;
  /** Wall friction angle Î´ = wall_friction Ã— Ï†. Default 2/3 per IS:14458. */
  wall_friction?: number;
  /** Minimum FOS for overturning. Default 2.0. */
  fos_ot_min?: number;
  /** Minimum FOS for sliding. Default 1.5. */
  fos_sl_min?: number;
  /** Min steps to try each direction. Default 8 (= 8 Ã— 75mm = Â±600mm range). */
  nSteps?: number;
  /** Called with the recommended Bbase (m), toe (m), heel (m) when user clicks Apply. */
  onApply?: (Bbase: number, toe: number, heel: number) => void;
}

function computeTrial(
  Bbase: number, i: Inputs, d: Derived,
  mu: number, delta_frac: number,
  fos_ot_min: number, fos_sl_min: number,
): TrialResult {
  const phi_r  = i.abt_phi * DEG;
  const delta_r = delta_frac * i.abt_phi * DEG;   // wall friction

  const Ka    = Math.tan(Math.PI / 4 - phi_r / 2) ** 2;
  const H     = i.abt_H;

  // Earth pressure resultant
  const Pa    = 0.5 * Ka * i.abt_gamma * H * H;
  const Ph    = Pa * Math.cos(delta_r);   // horizontal component
  const Pv    = Pa * Math.sin(delta_r);   // vertical component (acts on back face of stem)

  // Stem dimensions
  const tstem = i.abt_tstem;             // stem thickness (m)
  const tftg  = i.abt_tftg;             // footing thickness (m)

  // User specified: Toe Â± 25mm, Heel Â± 50mm (1:2 ratio)
  // We assume the caller provides toe/heel props or we derive from current Bbase
  const toe   = i.abt_toe ? i.abt_toe + ( (Bbase - i.abt_Bbase) / 0.075 ) * 0.025 : 0.30 * Bbase;
  const heel  = i.abt_heel ? i.abt_heel + ( (Bbase - i.abt_Bbase) / 0.075 ) * 0.050 : Bbase - toe - tstem;

  if (heel <= 0.10) {
    const nan = NaN;
    return { Bbase, toe, heel: nan, isCurrent: false,
      W_stem: nan, W_base: nan, W_fill: nan, W_super: nan,
      Pa, Ph, Pv, sumV: nan, sumH: nan, MR: nan, MO: nan,
      otFOS: nan, slidFOS: nan, e: nan, qmax: nan, qmin: nan,
      otOK: false, slidOK: false, bearOK: false, qOK: false, allOK: false };
  }

  const spanL  = i.spanL;               // bridge width (for per-bridge weights)
  const SBC    = d.SBC;

  // Weights (full bridge width unit â€” for consistent comparison)
  const W_stem  = tstem  * H   * spanL * 24;     // kN â€” stem concrete
  const W_base  = Bbase  * tftg * spanL * 24;    // kN â€” footing concrete
  const W_fill  = heel   * H   * spanL * i.abt_gamma; // kN â€” backfill on heel
  const W_super = (i.DL_pier + i.LL_pier) * 0.5; // kN â€” from superstructure (half per abutment)
  const sumV    = W_stem + W_base + W_fill + Pv + W_super;
  const sumH    = Ph;

  /* â”€â”€ Moments about TOE (restoring = CW, overturning = CCW) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  // Arms measured from toe:
  const arm_stem  = toe + tstem / 2;               // centroid of stem from toe
  const arm_base  = Bbase / 2;                     // centroid of footing from toe
  const arm_fill  = Bbase - heel / 2;              // centroid of fill on heel from toe
  const arm_Pv    = Bbase;                         // vertical component of Pa acts at back face
  const arm_super = Bbase / 2;                     // super-structure reaction (central)

  const MR  = W_stem * arm_stem + W_base * arm_base + W_fill * arm_fill
            + Pv * arm_Pv + W_super * arm_super;
  const MO  = Ph * H / 3;                          // active thrust at H/3 from base

  const otFOS    = MO > 0 ? MR / MO : Infinity;
  const slidFOS  = sumH > 0 ? mu * sumV / sumH : Infinity;

  // Eccentricity from centre of footing
  const Mnet = MR - MO;
  const e    = Bbase / 2 - Mnet / sumV;

  // Bearing pressures (trapezoidal distribution)
  const qmax = (sumV / Bbase) * (1 + 6 * e / Bbase);
  const qmin = (sumV / Bbase) * (1 - 6 * e / Bbase);

  const otOK   = otFOS  >= fos_ot_min;
  const slidOK = slidFOS >= fos_sl_min;
  const bearOK = qmax   <= SBC;
  const qOK    = qmin   >= 0;
  const allOK  = otOK && slidOK && bearOK && qOK && e < Bbase / 6;

  const isCurrent = Math.abs(Bbase - i.abt_Bbase) < 0.001;

  return { Bbase, toe, heel, isCurrent,
    W_stem, W_base, W_fill, W_super, Pa, Ph, Pv,
    sumV, sumH, MR, MO, otFOS, slidFOS,
    e, qmax, qmin, otOK, slidOK, bearOK, qOK, allOK };
}

export default function AbutmentOptimiser({
  i, d,
  mu = 0.50,
  wall_friction = 2 / 3,
  fos_ot_min = 2.00,
  fos_sl_min = 1.50,
  nSteps = 10,
  onApply,
}: Props) {
  const [showDetail, setShowDetail] = useState(false);

  const SBC  = d.SBC;
  const step = 0.075;   // 75 mm total = 25mm toe + 50mm heel per step

  // Build trial grid: current Bbase Â± nSteps
  const Bbase_current = i.abt_Bbase;
  const trialBases = Array.from({ length: nSteps * 2 + 1 }, (_, k) =>
    +(Bbase_current + (k - nSteps) * step).toFixed(3),
  ).filter(b => b >= i.abt_tstem + 0.15);   // min feasible footing

  const trials = trialBases.map(B =>
    computeTrial(B, i, d, mu, wall_friction, fos_ot_min, fos_sl_min),
  );

  const current  = trials.find(t => t.isCurrent);
  const passing  = trials.filter(t => t.allOK);
  const optimum  = passing[0];  // smallest feasible Bbase

  function rowBg(t: TrialResult) {
    if (t.isCurrent) return C.bgCurrent;
    if (t.allOK) return C.bgGreen;
    if (!t.otOK) return C.bgRed;
    return C.bgAmber;
  }

  function fosCell(fos: number, min: number, ok: boolean): React.ReactNode {
    return (
      <span style={{ color: ok ? C.green : C.red, fontWeight: "bold" }}>
        {f2(fos)} {ok ? "âœ“" : "âœ—"}
      </span>
    );
  }

  return (
    <div className="no-print" style={{
      margin: "0 auto 16px", maxWidth: 1100,
      border: `2px solid ${current?.allOK ? C.green : C.amber}`,
      borderRadius: 3, background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)", overflow: "hidden",
      fontFamily: "Verdana,sans-serif",
    }}>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ background: C.header, color: C.headerText,
        padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: "bold" }}>
            â–¶  Abutment Optimiser â€” Footing Base Width (Bbase)
          </div>
          <div style={{ fontSize: 9, color: "#9bbfd8", marginTop: 2 }}>
            Toe Â± 25 mm Â· Heel Â± 50 mm per step (1 : 2) Â· IS:6403 Â· IS:14458 Â· IRC:78-2000
            &nbsp;Â· SBC = {f2(SBC)} kN/mÂ² Â· Î¼ = {mu} Â· Ï† = {i.abt_phi}Â° Â· H = {f2(i.abt_H)} m
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#9bbfd8" }}>
          FOS<sub>OT</sub> â‰¥ {fos_ot_min} &nbsp;|&nbsp; FOS<sub>SL</sub> â‰¥ {fos_sl_min}<br />
          qmax â‰¤ SBC &nbsp;|&nbsp; qmin â‰¥ 0 &nbsp;|&nbsp; e &lt; B/6
        </div>
      </div>

      {/* â”€â”€ Key summary bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ background: "#0d2b4a", borderBottom: `2px solid ${C.royal}`,
        padding: "5px 14px", display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
        {[
          { label: "Current Bbase",  val: `${f2(Bbase_current)} m` },
          { label: "Optimum Bbase",  val: optimum ? `${f2(optimum.Bbase)} m` : "N/A" },
          { label: "Ka (Rankine)",   val: f3(Math.tan(Math.PI/4 - i.abt_phi*DEG/2)**2) },
          { label: "Stem t",         val: `${f2(i.abt_tstem)} m` },
          { label: "H_wall",         val: `${f2(i.abt_H)} m` },
          { label: "Î³_soil",         val: `${f2(i.abt_gamma)} kN/mÂ³` },
        ].map(({ label, val }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#6a9ec0", textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#fff", fontFamily: "Consolas,'Courier New',monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* â”€â”€ Current status card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {current && (
        <div style={{ padding: "6px 14px", background: current.allOK ? C.bgGreen : C.bgAmber,
          borderBottom: `1px solid ${C.border}`, fontSize: 9.5 }}>
          <strong>Current (Bbase = {f2(current.Bbase)} m):</strong>&nbsp;
          Toe = {f2(current.toe)} m, Heel = {f2(current.heel)} m
          &nbsp;â†’&nbsp;
          <span style={{ color: current.otOK   ? C.green : C.red }}>OT FOS = {f2(current.otFOS)} {current.otOK ? "âœ“" : "âœ—"}</span>
          &nbsp;|&nbsp;
          <span style={{ color: current.slidOK ? C.green : C.red }}>SL FOS = {f2(current.slidFOS)} {current.slidOK ? "âœ“" : "âœ—"}</span>
          &nbsp;|&nbsp;
          <span style={{ color: current.bearOK ? C.green : C.red }}>qmax = {f2(current.qmax)} kN/mÂ² {current.bearOK ? "âœ“" : "âœ—"}</span>
          &nbsp;|&nbsp;
          <span style={{ color: current.qOK   ? C.green : C.red }}>qmin = {f2(current.qmin)} {current.qOK ? "â‰¥ 0 âœ“" : "< 0 âœ—"}</span>
          &nbsp;|&nbsp;
          <span style={{ color: current.allOK ? C.green : C.red, fontWeight: "bold" }}>
            {current.allOK ? "ALL PASS" : "REVIEW"}
          </span>
        </div>
      )}

      {/* â”€â”€ Toggle detail formula â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ padding: "4px 14px", borderBottom: `1px solid ${C.border}`,
        background: "#f5f8fc", fontSize: 9, cursor: "pointer",
        color: C.royal, userSelect: "none" }}
        onClick={() => setShowDetail(v => !v)}>
        {showDetail ? "â–¼ " : "â–¶ "} Show / Hide Earth Pressure Formulae
      </div>
      {showDetail && (
        <div style={{ padding: "6px 14px", background: "#fafcff",
          borderBottom: `1px solid ${C.border}`, fontSize: 9,
          fontFamily: "Consolas,'Courier New',monospace", lineHeight: 1.7 }}>
          <strong>Rankine Active:</strong>&nbsp;
          Ka = tanÂ²(45Â° âˆ’ Ï†/2) = tanÂ²(45Â° âˆ’ {i.abt_phi/2}Â°) = {f3(Math.tan(Math.PI/4-i.abt_phi*DEG/2)**2)}<br />
          Pa = 0.5 Ã— Ka Ã— Î³ Ã— HÂ² = 0.5 Ã— {f3(Math.tan(Math.PI/4-i.abt_phi*DEG/2)**2)} Ã— {f2(i.abt_gamma)} Ã— {f2(i.abt_H)}Â² = {f2(0.5*Math.tan(Math.PI/4-i.abt_phi*DEG/2)**2*i.abt_gamma*i.abt_H**2)} kN/m (per m width)<br />
          Ph = Pa Ã— cos Î´, Pv = Pa Ã— sin Î´ &nbsp;(Î´ = {Math.round(wall_friction*i.abt_phi)}Â° = â…”Ï† per IS:14458)<br />
          <strong>Overturning FOS</strong> = Î£MR / Î£MO â‰¥ {fos_ot_min} &nbsp;(moments about toe, MO = Ph Ã— H/3)<br />
          <strong>Sliding FOS</strong> = Î¼ Ã— Î£V / Î£H â‰¥ {fos_sl_min} &nbsp;(Î¼ = {mu})<br />
          <strong>Eccentricity</strong> e = B/2 âˆ’ (Î£MR âˆ’ Î£MO)/Î£V &nbsp;â†’&nbsp; must &lt; B/6 (no tension)<br />
          <strong>Bearing</strong>: qmax = Î£V/B Ã— (1 + 6e/B) â‰¤ SBC; qmin = Î£V/B Ã— (1 âˆ’ 6e/B) â‰¥ 0<br />
          <strong>Weight arms from toe</strong>: stem = toe + tstem/2; base = B/2; fill = B âˆ’ heel/2; Pa_v = B<br />
          Toe = 0.30 Ã— Bbase (standard gravity abutment proportion per IRC:78)
        </div>
      )}

      {/* â”€â”€ Main results table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Bbase (m)", "Toe (m)", "Heel (m)",
                "Î£V (kN)", "Ph (kN)", `OT FOS â‰¥${fos_ot_min}`,
                `SL FOS â‰¥${fos_sl_min}`, "e (m)", "e < B/6?",
                "qmax (kN/mÂ²)", "qmin (kN/mÂ²)", "Status",
                onApply ? "Action" : null,
              ].filter(Boolean).map(h => <th key={String(h)} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {trials.filter(t => !isNaN(t.sumV)).map((t, idx) => {
              const isBest = optimum && Math.abs(t.Bbase - optimum.Bbase) < 0.001;
              const bg = isBest && !t.isCurrent ? C.bgGreen : rowBg(t);
              return (
                <tr key={idx} style={{ background: bg, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ ...cell, fontWeight: t.isCurrent || isBest ? "bold" : undefined }}>
                    {f2(t.Bbase)}{t.isCurrent ? " â—€" : ""}
                  </td>
                  <td style={cell}>{f2(t.toe)}</td>
                  <td style={cell}>{f2(t.heel)}</td>
                  <td style={cell}>{f2(t.sumV)}</td>
                  <td style={cell}>{f2(t.Ph)}</td>
                  <td style={{ ...cell }}>
                    {fosCell(t.otFOS, fos_ot_min, t.otOK)}
                  </td>
                  <td style={{ ...cell }}>
                    {fosCell(t.slidFOS, fos_sl_min, t.slidOK)}
                  </td>
                  <td style={{
                    ...cell,
                    color: t.e < t.Bbase / 6 ? C.green : t.e < t.Bbase / 4 ? C.amber : C.red,
                  }}>
                    {f3(t.e)}
                  </td>
                  <td style={{
                    ...cell, textAlign: "center",
                    color: t.e < t.Bbase / 6 ? C.green : C.red,
                  }}>
                    {t.e < t.Bbase / 6 ? "âœ“" : "âœ—"}
                  </td>
                  <td style={{
                    ...cell,
                    color: t.bearOK ? C.green : C.red,
                    fontWeight: "bold",
                  }}>
                    {f2(t.qmax)} {t.bearOK ? "âœ“" : "âœ—"}
                  </td>
                  <td style={{
                    ...cell,
                    color: t.qOK ? C.green : C.red,
                    fontWeight: "bold",
                  }}>
                    {f2(t.qmin)} {t.qOK ? "âœ“" : "âœ—"}
                  </td>
                  <td style={{
                    ...cell, textAlign: "center", fontWeight: "bold",
                    color: t.allOK ? C.green : C.red,
                    background: isBest && !t.isCurrent ? "#c6f0d8" : undefined,
                  }}>
                    {isBest && !t.isCurrent ? "â˜… BEST" : t.allOK ? "PASS" : "FAIL"}
                  </td>
                  {onApply && (
                    <td style={{ ...cell, textAlign: "center" }}>
                      {t.allOK && (
                        <button onClick={() => onApply(t.Bbase, t.toe, t.heel)} style={{
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
            })}
          </tbody>
        </table>
      </div>

      {/* â”€â”€ Optimum recommendation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {optimum ? (
        <div style={{ padding: "6px 14px", background: "#e4f5ed",
          borderTop: `2px solid ${C.green}`, fontSize: 9.5 }}>
          <strong style={{ color: C.green }}>â˜… Minimum safe Bbase:</strong>&nbsp;
          <span style={{ fontFamily: "Consolas,'Courier New',monospace" }}>
            {f2(optimum.Bbase)} m
          </span>
          &nbsp;(Toe = {f2(optimum.toe)} m, Heel = {f2(optimum.heel)} m,
          stem = {f2(i.abt_tstem)} m)
          &nbsp;â†’&nbsp;OT FOS = {f2(optimum.otFOS)} &nbsp;|&nbsp; SL FOS = {f2(optimum.slidFOS)}
          &nbsp;|&nbsp; qmax = {f2(optimum.qmax)} kN/mÂ² &nbsp;|&nbsp; qmin = {f2(optimum.qmin)} kN/mÂ²
          &nbsp;|&nbsp; e = {f3(optimum.e)} m (&lt; B/6 = {f2(optimum.Bbase/6)} m)
          {onApply && (
            <button onClick={() => onApply(optimum.Bbase, optimum.toe, optimum.heel)} style={{
              marginLeft: 16, background: C.green, color: "#fff",
              border: "none", padding: "3px 12px", borderRadius: 2,
              cursor: "pointer", fontSize: 9.5,
              fontFamily: "Verdana,sans-serif", fontWeight: "bold",
            }}>
              Apply Best â–¸
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: "6px 14px", background: C.bgRed,
          borderTop: `2px solid ${C.red}`, fontSize: 9.5 }}>
          <strong style={{ color: C.red }}>No configuration in the current search range passes all checks.</strong>&nbsp;
          Increase nSteps prop (currently {nSteps}) or check input parameters (Ï†, Î³, H, SBC).
        </div>
      )}

      {/* â”€â”€ Weight breakdown for current â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {current && (
        <div style={{ padding: "6px 14px 2px", borderTop: `1px solid ${C.border}`,
          background: "#f9f6fd" }}>
          <div style={{ fontSize: 9.5, fontWeight: "bold", color: C.royal, marginBottom: 3 }}>
            Weight breakdown for current Bbase = {f2(current.Bbase)} m
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, fontSize: 9,
            fontFamily: "Consolas,'Courier New',monospace" }}>
            {[
              { label: "W_stem",  val: current.W_stem,  where: `${f2(i.abt_tstem)}Ã—${f2(i.abt_H)}Ã—${f2(i.spanL)}Ã—24` },
              { label: "W_base",  val: current.W_base,  where: `${f2(current.Bbase)}Ã—${f2(i.abt_tftg)}Ã—${f2(i.spanL)}Ã—24` },
              { label: "W_fill",  val: current.W_fill,  where: `${f2(current.heel)}Ã—${f2(i.abt_H)}Ã—${f2(i.spanL)}Ã—${f2(i.abt_gamma)}` },
              { label: "W_super", val: current.W_super, where: "(DL+LL)/2 from superstructure" },
              { label: "Pa (resultant)", val: current.Pa, where: `0.5Ã—KaÃ—Î³Ã—HÂ² = 0.5Ã—${f3(Math.tan(Math.PI/4-i.abt_phi*DEG/2)**2)}Ã—${f2(i.abt_gamma)}Ã—${f2(i.abt_H)}Â²` },
            ].map(({ label, val, where }) => (
              <div key={label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 2, padding: "4px 6px" }}>
                <div style={{ color: "#666", fontSize: 8 }}>{label}</div>
                <div style={{ fontWeight: "bold", fontSize: 11 }}>{f2(val)} kN</div>
                <div style={{ color: "#888", fontSize: 7.5 }}>{where}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€ Footer note â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ padding: "4px 14px", fontSize: 8.5, color: "#666",
        borderTop: `1px solid ${C.border}`, background: "#f9f6fd" }}>
        Toe set at 30% Bbase (standard gravity abutment per IRC:78). For cantilever abutment, adjust
        toe fraction by passing a custom <code>toeFrac</code> prop. Step = 75 mm (25mm toe + 50mm heel).
        IS:6403 bearing capacity check Â· IS:14458-1 sliding/overturning check Â· IRC:78-2000 Cl.710.3.
      </div>
    </div>
  );
}


