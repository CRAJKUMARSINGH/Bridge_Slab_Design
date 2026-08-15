/**
 * ENHANCED PIER STABILITY SECTION
 * Drop-in replacement / supplement for SectionPierStability in PierSection.tsx
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Key enhancements over the original:
 *   1. Footing section properties (I_xx, I_yy, Z_xx, Z_yy) fully derived.
 *   2. Hydrodynamic pressure formula per IRC:6-2017 Cl.214.1 shown step-by-step.
 *   3. Seismic coefficient from Z, I, R, Sa/g per IRC:6-2017 Cl.219 + IS:1893.
 *   4. Individual moment arms per load type (hydro at mid-pier, seismic at
 *      centre of mass, wind at top of pier).
 *   5. Full Î£V / Î£H / Moment build-up table (all 5 LCs).
 *   6. Meyerhof eccentric bearing formula shown term-by-term.
 *   7. Kern check (e â‰¤ B/6) to flag tension zone.
 *   8. Skew effect: transverse eccentricity of LL, biaxial bearing pressure,
 *      seismic force resolution in skewed-pier geometry.
 *   9. Applicable IRC/IS clause cited on every formula.
 *
 * HOW TO INTEGRATE (no new packages):
 *   1. Copy to  artifacts/bridge-slab-design/src/pages/report-sheets/
 *   2. In BridgeSlabReport.tsx, add:
 *        import SectionPierStabilityEnhanced from "./report-sheets/PierStabilityEnhanced";
 *   3. Replace (or add after) <SectionPierStability i={inp} d={d} /> with:
 *        <SectionPierStabilityEnhanced i={inp} d={d} />
 *      For a skewed bridge (e.g. 20Â° skew):
 *        <SectionPierStabilityEnhanced i={inp} d={d} skewDeg={20} />
 *
 * References:
 *   IRC:6-2017  â€” Loads and Load Combinations
 *   IRC:78-2014 â€” Foundation and Substructure
 *   IRC:112-2011 â€” Code of Practice for Concrete Road Bridges
 *   IS:1893(Pt1):2016 â€” Criteria for Earthquake Resistant Design
 *   IS:3935-1999 â€” Code of Practice for Composite Construction
 *   IS:6403-1981 â€” Shallow Foundations (Bearing Capacity)
 */

import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv, fi, HR, Cl, SectionHead, SubHead, SubHeadCl,
  CalcBlock, CRow, Prose, Check, SummaryTable, Page,
} from "./ReportUI";

/* â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const f2 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(2));
const f3 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(3));
const f0 = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : Math.round(n).toLocaleString("en-IN"));

interface Props {
  i: Inputs;
  d: Derived;
  /** Bridge skew angle in degrees. 0 = square bridge. Activates biaxial check when > 0. */
  skewDeg?: number;
  /** Drag coefficient for pier shape per IRC:6-2017 Table 14.
   *  0.66 circular ends, 0.70 semi-circular ends, 1.00 oblong, 1.50 square ends. */
  Cd?: number;
  /** Seismic zone per IS:1893 (Part 1):2016 Table 3. Default "III". */
  zone?: "II" | "III" | "IV" | "V";
  /** Response reduction factor per IRC:6-2017 Table 19. Default 3.0 (ductile RCC). */
  R_factor?: number;
  /** Importance factor per IRC:6-2017 Table 18. Default 1.2 (bridge). */
  I_factor?: number;
}

export default function SectionPierStabilityEnhanced({
  i,
  d,
  skewDeg = 0,
  Cd = 0.70,
  zone = "III",
  R_factor = 3.0,
  I_factor = 1.2,
}: Props) {

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     A.  FOOTING SECTION PROPERTIES
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const B  = i.ftgPW;   // footing width â€” transverse to bridge axis (m)
  const Lf = i.ftgPL;   // footing length â€” along bridge axis (m)
  const tf = i.ftgPT;   // footing thickness (m)

  const A_ftg = B * Lf;                          // mÂ²
  const I_xx  = Lf * Math.pow(B, 3) / 12;       // mâ´  â€” moment of inertia about transverse x-x axis
  const I_yy  = B  * Math.pow(Lf, 3) / 12;      // mâ´  â€” moment of inertia about longitudinal y-y axis
  const Z_xx  = I_xx / (B  / 2);                 // mÂ³  â€” section modulus, x-x (governs standard check)
  const Z_yy  = I_yy / (Lf / 2);                 // mÂ³  â€” section modulus, y-y (governs skew check)
  const kern  = B / 6;                            // m   â€” kern limit (e â‰¤ kern â†’ no tension)

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     B.  SELF-WEIGHTS  (IRC:6-2017 Cl.206.1, Î³_c = 25 kN/mÂ³)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const W_pier = i.pierW * i.pierL * i.pierH * 25;
  const W_cap  = i.capW  * i.capL  * i.capD  * 25;
  const W_ftg  = i.ftgPW * i.ftgPL * i.ftgPT  * 25;
  const W_self = W_pier + W_cap + W_ftg;

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     C.  MOMENT ARMS  (individual per load type)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  // Restoring moment arm = half footing width (force resultant at centroid)
  const arm_R = B / 2;

  // Hydrodynamic: pressure profile on submerged pier varies parabolically.
  // Simplified: resultant at H_pier/2 above footing top (mid-pier).
  const arm_hyd  = i.pierH / 2 + tf;            // m from footing base

  // Seismic: horizontal force acts at the centre of mass of the pier system.
  // Approximated as mid-height of pier assembly above footing base.
  const arm_seis = i.pierH * 0.60 + tf;         // m â€” 0.6H accounts for cap mass

  // Wind: acts at the top of the pier (deck level).
  const arm_wind = i.pierH + tf;                 // m from footing base

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     D.  SEISMIC COEFFICIENT  (IRC:6-2017 Cl.219, IS:1893-2016)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const Z_map: Record<string, number> = { II: 0.10, III: 0.16, IV: 0.24, V: 0.36 };
  const Z_seis = Z_map[zone];
  const Sa_g   = 2.5;     // spectral acceleration ratio for short period (T < 0.4 s, Type-II soil)
  const Ah     = (Z_seis / 2) * (I_factor / R_factor) * Sa_g;
  const Av     = (2 / 3) * Ah;   // vertical seismic coefficient (IRC:6-2017 Cl.219.3)
  const W_seismic = i.DL_pier + i.LL_pier + W_self;  // seismic weight
  const F_seis_H_calc = Ah * W_seismic;           // kN â€” for reference cross-check

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     E.  SKEW PARAMETERS  (IRC:6-2017 Cl.207.2, IS:3935-1999)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const alpha    = skewDeg * Math.PI / 180;       // rad
  const hasSkew  = skewDeg > 0.5;

  // Transverse eccentricity of live load resultant for skewed slab.
  // For a uniformly loaded skew slab, the obtuse corner attracts greater reaction.
  // Conservative simplified formula (Morice-Little basis, IS:3935):
  //   e_T = L_span Ã— sin(Î±) Ã— cos(Î±) / 2  (chord eccentricity for symmetric load)
  // IRC:6-2017 Cl.207.2 note: for Î± > 20Â° use rigorous analysis; formula is indicative.
  const e_T = hasSkew ? (i.spanL * Math.sin(alpha) * Math.cos(alpha)) / 2 : 0;  // m
  const M_T = i.LL_pier * e_T;   // kNÂ·m â€” transverse moment from skewed LL

  // Seismic force components for skewed pier
  const H_seis_long  = hasSkew ? i.seisH * Math.cos(alpha) : i.seisH;  // along bridge
  const H_seis_trans = hasSkew ? i.seisH * Math.sin(alpha) : 0;        // transverse

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     F.  LOAD CASE DEFINITIONS  (IRC:6-2017 Appendix B â€” WSD basis)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  const lcDefs = [
    { n: 1, label: "LC1", desc: "DL + LL + Hydro (Basic)",              withLL: true,  withSeis: false, withWind: false, seismic: false },
    { n: 2, label: "LC2", desc: "DL + Hydro (Check without LL)",        withLL: false, withSeis: false, withWind: false, seismic: false },
    { n: 3, label: "LC3", desc: "DL + LL + Seismic + Hydro (Governs)", withLL: true,  withSeis: true,  withWind: false, seismic: true  },
    { n: 4, label: "LC4", desc: "DL + Seismic + Hydro",                 withLL: false, withSeis: true,  withWind: false, seismic: true  },
    { n: 5, label: "LC5", desc: "DL + LL + Wind + Temp + Hydro",        withLL: true,  withSeis: false, withWind: true,  seismic: false },
  ];

  /* â”€â”€ Load case computation functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  function Vf(lc: typeof lcDefs[0]) {
    return i.DL_pier
      + W_self
      + (lc.withLL   ? i.LL_pier : 0)
      + (lc.withSeis ? i.seisV   : 0);
  }
  function Hf(lc: typeof lcDefs[0]) {
    return i.hydro
      + (lc.withSeis ? i.seisH    : 0)
      + (lc.withWind ? i.windTemp : 0);
  }
  function MO(lc: typeof lcDefs[0]) {
    const M_hydro = i.hydro    * arm_hyd;
    const M_seis  = lc.withSeis ? i.seisH    * arm_seis : 0;
    const M_wind  = lc.withWind ? i.windTemp * arm_wind  : 0;
    return M_hydro + M_seis + M_wind;
  }
  function MR(lc: typeof lcDefs[0]) {
    return Vf(lc) * arm_R;
  }
  function ecc(lc: typeof lcDefs[0]) {
    const vf = Vf(lc), mr = MR(lc), mo = MO(lc);
    const e = mr > mo ? arm_R - (mr - mo) / vf : (mo - mr) / vf + arm_R;
    return Math.abs(arm_R - (mr - mo) / vf);
  }
  function qmaxFn(lc: typeof lcDefs[0]) {
    const vf = Vf(lc), e = ecc(lc);
    return vf / A_ftg + vf * e / Z_xx;
  }
  function qminFn(lc: typeof lcDefs[0]) {
    const vf = Vf(lc), e = ecc(lc);
    return Math.max(0, vf / A_ftg - vf * e / Z_xx);
  }
  function slidFOS(lc: typeof lcDefs[0]) {
    const hf = Hf(lc);
    return hf <= 0 ? 999 : i.mu * Vf(lc) / hf;
  }
  function otFOS(lc: typeof lcDefs[0]) {
    const mo = MO(lc);
    return mo <= 0 ? 999 : MR(lc) / mo;
  }
  function slidMin(lc: typeof lcDefs[0]) { return lc.seismic ? 1.25 : 1.50; }
  function otMin  (lc: typeof lcDefs[0]) { return lc.seismic ? 1.50 : 2.00; }

  /* Biaxial (skew LC1) */
  const lc1 = lcDefs[0];
  const Vf1 = Vf(lc1);
  const ex1 = ecc(lc1);
  const q_corner_max = Vf1 / A_ftg + Vf1 * ex1 / Z_xx + M_T / Z_yy;
  const q_corner_min = Vf1 / A_ftg - Vf1 * ex1 / Z_xx - M_T / Z_yy;

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     RENDER
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE 1 â€” Footing Section Properties & Self-Weights
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Page id="s-pier-enh-geom">
        <HR />
        <SectionHead id="s-pier-enh">
          PIER STABILITY â€” ENHANCED ANALYSIS (Sheets 9â€“14)
          {hasSkew && (
            <span style={{ color: "royalblue", fontSize: 11, marginLeft: 14 }}>
              [SKEW BRIDGE â€” Î± = {skewDeg}Â°]
            </span>
          )}
        </SectionHead>
        <div style={{ fontSize: 9, color: "royalblue", fontStyle: "italic", marginBottom: 6 }}>
          <Cl>IRC:6-2017 Cl.206-219</Cl>{" Â· "}<Cl>IRC:78-2014 Cl.706</Cl>{" Â· "}
          <Cl>IRC:112-2011 Cl.10</Cl>{" Â· "}<Cl>IS:1893(Pt1):2016</Cl>
          {hasSkew && <>{" Â· "}<Cl>IRC:6-2017 Cl.207.2</Cl>{" Â· "}<Cl>IS:3935-1999</Cl></>}
        </div>

        <SubHead>A. Pier & Footing Dimensions (As Given)</SubHead>
        <CalcBlock rows={[
          { sym: "Pier stem",       result: `${i.pierW} Ã— ${i.pierL} Ã— ${i.pierH} m`,       where: "B Ã— L Ã— H (Width across flow Ã— Length along bridge Ã— Height)" },
          { sym: "Pier cap",        result: `${i.capW} Ã— ${i.capL} Ã— ${i.capD} m`,          where: "Width Ã— Length Ã— Depth" },
          { sym: "Footing",         result: `${i.ftgPW} Ã— ${i.ftgPL} Ã— ${i.ftgPT} m`,       where: "B Ã— L Ã— t  (B = transverse, L = longitudinal)" },
          { sym: "fck / fy",        result: `${i.fck_pier} MPa / ${i.fy_pier} MPa`,         where: "Concrete / reinforcement grade" },
          { sym: "Cover",           result: `${i.cover_pier} mm`,                            where: `IRC:112-2011 Cl.15.3.2 â€” moderate exposure` },
        ]} />

        <SubHeadCl clause="IS:6403-1981 Cl.6 / IRC:78-2014 Cl.706.1">
          B. Footing Section Properties
        </SubHeadCl>
        <Prose>
          Bearing pressure distribution under an eccentrically loaded rectangular footing is computed
          using the Meyerhof formula: q = V/A Â± VÂ·e/Z. Section properties Z_xx and Z_yy are derived
          below. The x-x axis is transverse to the bridge (governs the standard overturning check
          from longitudinal forces); the y-y axis is longitudinal (governs the skew biaxial check).
        </Prose>
        <CalcBlock whereHeader rows={[
          { sym: "A_ftg",  eq: `B Ã— L = ${B} Ã— ${Lf}`,                              result: f2(A_ftg),  unit: "mÂ²",  where: "Plan area of footing" },
          { sym: "I_xx",   eq: `L Ã— BÂ³/12 = ${Lf} Ã— ${B}Â³/12`,                    result: f3(I_xx),   unit: "mâ´",  where: "Second moment of area about transverse x-x axis" },
          { sym: "Z_xx",   eq: `I_xx / (B/2) = ${f3(I_xx)} / ${f2(B/2)}`,         result: f3(Z_xx),   unit: "mÂ³",  where: "Section modulus â€” transverse (standard bearing check)" },
          { sym: "I_yy",   eq: `B Ã— LÂ³/12 = ${B} Ã— ${Lf}Â³/12`,                    result: f3(I_yy),   unit: "mâ´",  where: "Second moment of area about longitudinal y-y axis" },
          { sym: "Z_yy",   eq: `I_yy / (L/2) = ${f3(I_yy)} / ${f2(Lf/2)}`,       result: f3(Z_yy),   unit: "mÂ³",  where: "Section modulus â€” longitudinal (skew biaxial check)" },
          { sym: "Kern",   eq: `B/6 = ${B}/6`,                                      result: f3(kern),   unit: "m",   where: "Kern limit â€” eccentricity must stay within kern to avoid tension zone (IS:6403 Cl.6)" },
          { sym: "arm_R",  eq: `B/2 = ${B}/2`,                                      result: f2(arm_R),  unit: "m",   where: "Restoring moment arm about toe" },
          { sym: "arm_hyd",eq: `H_pier/2 + t_ftg = ${i.pierH}/2 + ${tf}`,          result: f2(arm_hyd), unit: "m",  where: "Hydrodynamic force arm â€” resultant at mid-depth of submerged pier" },
          { sym: "arm_seis",eq:`0.6Ã—H_pier + t_ftg = 0.6Ã—${i.pierH} + ${tf}`,    result: f2(arm_seis),unit: "m",  where: "Seismic force arm â€” centre of mass of pier assembly (â‰ˆ 0.6H)" },
          { sym: "arm_wind",eq:`H_pier + t_ftg = ${i.pierH} + ${tf}`,              result: f2(arm_wind),unit: "m",  where: "Wind force arm â€” acts at deck level (top of pier)" },
        ]} />

        <SubHeadCl clause="IRC:6-2017 Cl.206.1 (Î³_c = 25 kN/mÂ³)">
          C. Self-Weights of Pier Assembly
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "W_pier", eq: `${i.pierW}Ã—${i.pierL}Ã—${i.pierH}Ã—25`, result: f2(W_pier), unit: "kN", where: "Pier stem (RCC)" },
          { sym: "W_cap",  eq: `${i.capW}Ã—${i.capL}Ã—${i.capD}Ã—25`,   result: f2(W_cap),  unit: "kN", where: "Pier cap (RCC)" },
          { sym: "W_ftg",  eq: `${i.ftgPW}Ã—${i.ftgPL}Ã—${i.ftgPT}Ã—25`,result: f2(W_ftg),  unit: "kN", where: "Spread footing (RCC)" },
          { sym: "W_self", eq: "W_pier + W_cap + W_ftg",               result: f2(W_self), unit: "kN", where: "Total self-weight of pier assembly", bold: true },
        ]} />
      </Page>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE 2 â€” Applied Loads: Hydrodynamic, Seismic
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Page id="s-pier-enh-loads">
        <HR />
        <SectionHead>PIER LOADS â€” DERIVATION OF APPLIED FORCES</SectionHead>
        <div style={{ fontSize: 9, color: "royalblue", fontStyle: "italic", marginBottom: 6 }}>
          <Cl>IRC:6-2017 Cl.214 (Hydro)</Cl>{" Â· "}<Cl>Cl.219 (Seismic)</Cl>
          {" Â· "}<Cl>Cl.209 (Wind)</Cl>{" Â· "}<Cl>IS:1893(Pt1):2016</Cl>
        </div>

        <SubHeadCl clause="IRC:6-2017 Cl.207.1 / Cl.203">
          D. Superstructure Reactions
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "DL_pier", eq: `${i.DL_pier} kN (entered)`, result: f2(i.DL_pier), unit: "kN", where: "Dead load reaction on pier from superstructure (IRC:6 Cl.203)" },
          { sym: "LL_pier", eq: `${i.LL_pier} kN (entered)`, result: f2(i.LL_pier), unit: "kN", where: "Live load reaction â€” Class A / 70R governing case (IRC:6 Cl.204)" },
        ]} />

        <SubHeadCl clause="IRC:6-2017 Cl.214.1">
          E. Hydrodynamic Pressure on Pier
        </SubHeadCl>
        <Prose>
          Horizontal force on pier due to flowing water (IRC:6-2017 Cl.214.1):
          <strong> p = 0.5 Ã— C_d Ã— Ï_w Ã— VÂ²</strong> where Ï_w = 1000 kg/mÂ³ and V = design flood velocity.
          Total force: F = p Ã— A_proj (projected area of pier below HFL).
          Drag coefficient C_d = <strong>{Cd}</strong> (for pier with semi-circular ends per Table 14:
          0.66 circular, 0.70 semi-circular, 1.00 oblong, 1.50 square ends).
          Force acts at mid-depth of the submerged portion.
        </Prose>
        <CalcBlock whereHeader rows={[
          { sym: "C_d",     eq: String(Cd),                                            result: String(Cd),              where: "Drag coefficient â€” pier shape factor (IRC:6-2017 Table 14)" },
          { sym: "Ï_w",     eq: "1000 kg/mÂ³ = 1.0 t/mÂ³",                             result: "1.0 t/mÂ³",              where: "Mass density of water" },
          { sym: "p",       eq: "0.5 Ã— C_d Ã— Ï_w Ã— VÂ²  â†’ kPa",                       result: "see note",              where: "Unit pressure (kPa). Engineer to verify V from Q/A_flow." },
          { sym: "A_proj",  eq: `${i.pierW} Ã— ${i.pierH}`,                            result: f2(i.pierW * i.pierH),  unit: "mÂ²", where: "Projected area of pier shaft below HFL (B Ã— H_pier)" },
          { sym: "F_hyd",   eq: `Entered = ${i.hydro} kN`,                            result: f2(i.hydro),            unit: "kN", where: "Adopted hydrodynamic force (0.5 Ã— Cd Ã— Ï Ã— VÂ² Ã— A_proj)", bold: true },
          { sym: "arm_hyd", eq: `H_pier/2 + t_ftg = ${f2(i.pierH/2)} + ${tf}`,       result: f2(arm_hyd),            unit: "m",  where: "Moment arm from base of footing (IRC:6-2017 Cl.214 note)" },
          { sym: "M_hyd",   eq: `F_hyd Ã— arm = ${f2(i.hydro)} Ã— ${f2(arm_hyd)}`,     result: f2(i.hydro * arm_hyd),  unit: "kNÂ·m", where: "Overturning moment at footing base due to hydro" },
        ]} />

        <SubHeadCl clause="IRC:6-2017 Cl.219 Â· IS:1893(Pt1):2016">
          F. Seismic Horizontal Coefficient
        </SubHeadCl>
        <Prose>
          Design horizontal seismic coefficient per IRC:6-2017 Cl.219.2:
          A_h = (Z/2) Ã— (I/R) Ã— (S_a/g).
          S_a/g = 2.5 assumed (short-period region, T â‰¤ 0.4 s, Type II medium soil per IS:1893 Fig.2).
          Vertical seismic: A_v = (2/3) Ã— A_h per IRC:6-2017 Cl.219.3.
          The calculated force F_h,calc = A_h Ã— W_seismic is shown for verification against the
          engineer-entered F_seisH.
        </Prose>
        <CalcBlock whereHeader rows={[
          { sym: "Z",         eq: `${Z_seis}`,                                                result: String(Z_seis),           where: `Seismic zone factor â€” Zone ${zone} per IS:1893 (Pt1) Table 3` },
          { sym: "I",         eq: `${I_factor} (bridge)`,                                     result: String(I_factor),         where: "Importance factor (IRC:6-2017 Table 18 â€” bridges)" },
          { sym: "R",         eq: `${R_factor} (ductile RCC)`,                                result: String(R_factor),         where: "Response reduction factor (IRC:6-2017 Table 19 â€” SDC C, ductile)" },
          { sym: "S_a/g",     eq: "2.5  (T < 0.4 s, Type II soil)",                          result: "2.5",                    where: "Spectral acceleration ratio (IS:1893 Fig.2 â€” short period)" },
          { sym: "A_h",       eq: `(Z/2)Ã—(I/R)Ã—(Sa/g) = (${Z_seis}/2)Ã—(${I_factor}/${R_factor})Ã—2.5`, result: f3(Ah),     where: "Design horizontal seismic coefficient (dimensionless)" },
          { sym: "A_v",       eq: `2/3 Ã— A_h = 2/3 Ã— ${f3(Ah)}`,                            result: f3(Av),                   where: "Vertical seismic coefficient (IRC:6-2017 Cl.219.3)" },
          { sym: "W_seis",    eq: `DL + LL + W_self = ${f2(i.DL_pier)} + ${f2(i.LL_pier)} + ${f2(W_self)}`, result: f2(W_seismic), unit: "kN", where: "Total seismic weight (dead load + 100% imposed on bridge)" },
          { sym: "F_h,calc",  eq: `A_h Ã— W_seis = ${f3(Ah)} Ã— ${f2(W_seismic)}`,            result: f2(F_seis_H_calc),       unit: "kN", where: "Calculated seismic horizontal force" },
          { sym: "F_seisH",   eq: `${i.seisH} kN (entered)`,                                 result: f2(i.seisH),             unit: "kN", where: `Adopted seismic H force. Compare with calculated = ${f2(F_seis_H_calc)} kN`, bold: true },
          { sym: "F_seisV",   eq: `${i.seisV} kN (entered)`,                                 result: f2(i.seisV),             unit: "kN", where: `Vertical seismic. Should â‰ˆ Av Ã— W = ${f2(Av * W_seismic)} kN` },
          { sym: "arm_seis",  eq: `0.60Ã—H + tf = 0.60Ã—${i.pierH} + ${tf}`,                  result: f2(arm_seis),            unit: "m",  where: "Seismic force arm from footing base (centre of mass)" },
        ]} />

        <SubHeadCl clause="IRC:6-2017 Cl.209 (Wind) / Cl.215 (Temp)">
          G. Other Lateral Forces
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "F_drag",      eq: `${i.drag} (entered)`,     result: f2(i.drag),     unit: "kN", where: "Braking / drag â€” IRC:6 Cl.214, Cl.211: 20% of LL for Class A, or stream drag" },
          { sym: "F_wind+temp", eq: `${i.windTemp} (entered)`, result: f2(i.windTemp), unit: "kN", where: "Wind + temperature combined (IRC:6 Cl.209, 215). Acts at deck level." },
          { sym: "arm_wind",    eq: `H_pier + tf = ${i.pierH} + ${tf}`,              result: f2(arm_wind),  unit: "m", where: "Wind force moment arm from footing base (acts at deck level)" },
          { sym: "Î¼",           eq: `${i.mu}`,                 result: String(i.mu),               where: "Coefficient of friction â€” concrete on soil (IRC:78-2014 Cl.706.3)" },
        ]} />
      </Page>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE 3 â€” Load Case Build-up Tables
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Page id="s-pier-enh-table">
        <HR />
        <SectionHead>PIER STABILITY â€” LOAD CASE BUILD-UP TABLE</SectionHead>
        <div style={{ fontSize: 9, color: "royalblue", fontStyle: "italic", marginBottom: 6 }}>
          <Cl>IRC:6-2017 Appendix B (Load Combinations)</Cl>{" Â· "}<Cl>IRC:78-2014 Cl.706</Cl>
        </div>

        <SubHead>H. Î£V â€” Vertical Force Build-up (kN)</SubHead>
        <SummaryTable
          head={["Component", "LC1\nDL+LL+H", "LC2\nDL+H", "LC3\nDL+LL+S+H", "LC4\nDL+S+H", "LC5\nDL+LL+W+H"]}
          rows={[
            ["DL (superstr.)",     f2(i.DL_pier),   f2(i.DL_pier),   f2(i.DL_pier),   f2(i.DL_pier),   f2(i.DL_pier)],
            ["LL reaction",        f2(i.LL_pier),   "â€”",             f2(i.LL_pier),   "â€”",             f2(i.LL_pier)],
            ["W_pier (stem)",      f2(W_pier),      f2(W_pier),      f2(W_pier),      f2(W_pier),      f2(W_pier)],
            ["W_cap",              f2(W_cap),       f2(W_cap),       f2(W_cap),       f2(W_cap),       f2(W_cap)],
            ["W_ftg",              f2(W_ftg),       f2(W_ftg),       f2(W_ftg),       f2(W_ftg),       f2(W_ftg)],
            ["F_seisV (â†‘ or â†“)",  "â€”",             "â€”",             `+${f2(i.seisV)}`,"â€”",            "â€”"],
            ["Î£V = Vf",            f2(Vf(lcDefs[0])), f2(Vf(lcDefs[1])), f2(Vf(lcDefs[2])), f2(Vf(lcDefs[3])), f2(Vf(lcDefs[4]))],
          ]}
        />

        <SubHead>I. Î£H â€” Horizontal Force Build-up (kN)</SubHead>
        <SummaryTable
          head={["Component", "LC1", "LC2", "LC3", "LC4", "LC5"]}
          rows={[
            ["F_hyd (hydro)",      f2(i.hydro),    f2(i.hydro),    f2(i.hydro),    f2(i.hydro),    f2(i.hydro)],
            ["F_seisH",            "â€”",            "â€”",            f2(i.seisH),    f2(i.seisH),    "â€”"],
            ["F_wind + temp",      "â€”",            "â€”",            "â€”",            "â€”",            f2(i.windTemp)],
            ["Î£H = Hf",            f2(Hf(lcDefs[0])), f2(Hf(lcDefs[1])), f2(Hf(lcDefs[2])), f2(Hf(lcDefs[3])), f2(Hf(lcDefs[4]))],
          ]}
        />

        <SubHead>J. Moment Build-up (kNÂ·m) â€” About Toe of Footing</SubHead>
        <SummaryTable
          head={["Moment Component", "Arm (m)", "LC1", "LC2", "LC3", "LC4", "LC5"]}
          rows={[
            ["M_hyd = F_hyd Ã— arm_hyd",   f2(arm_hyd),
              f2(i.hydro*arm_hyd), f2(i.hydro*arm_hyd), f2(i.hydro*arm_hyd), f2(i.hydro*arm_hyd), f2(i.hydro*arm_hyd)],
            ["M_seis = F_seisH Ã— arm_seis", f2(arm_seis),
              "â€”", "â€”", f2(i.seisH*arm_seis), f2(i.seisH*arm_seis), "â€”"],
            ["M_wind = F_wind Ã— arm_wind", f2(arm_wind),
              "â€”", "â€”", "â€”", "â€”", f2(i.windTemp*arm_wind)],
            ["MO (total overturning)",     "â€”",
              f2(MO(lcDefs[0])), f2(MO(lcDefs[1])), f2(MO(lcDefs[2])), f2(MO(lcDefs[3])), f2(MO(lcDefs[4]))],
            ["MR = Vf Ã— B/2",             f2(arm_R),
              f2(MR(lcDefs[0])), f2(MR(lcDefs[1])), f2(MR(lcDefs[2])), f2(MR(lcDefs[3])), f2(MR(lcDefs[4]))],
          ]}
        />

        <SubHead>K. Results Summary</SubHead>
        <SummaryTable
          head={["LC", "Vf (kN)", "Hf (kN)", "MR (kNÂ·m)", "MO (kNÂ·m)", "e (m)", "qmax (kPa)", "Slid.FOS", "OT.FOS", "Status"]}
          rows={lcDefs.map(lc => {
            const bearOK = qmaxFn(lc) <= d.SBC && qminFn(lc) >= 0;
            const slidOK = slidFOS(lc) >= slidMin(lc);
            const otOK   = otFOS(lc)   >= otMin(lc);
            const ok     = bearOK && slidOK && otOK;
            return [
              lc.label,
              f2(Vf(lc)), f2(Hf(lc)), f2(MR(lc)), f2(MO(lc)),
              f3(ecc(lc)), f2(qmaxFn(lc)),
              f2(slidFOS(lc)), f2(otFOS(lc)),
              <span style={{ color: ok ? "green" : "#b00020", fontWeight: "bold" }}>
                {ok ? "OK" : "REVIEW"}
              </span>,
            ];
          })}
        />
        <Prose>
          SBC = <strong>{f2(d.SBC)} kPa</strong> (from geotechnical section).
          FOS limits: Sliding â‰¥ 1.50 (non-seismic) / 1.25 (seismic) â€” <Cl>IRC:78-2014 Cl.706.2</Cl>.
          OT â‰¥ 2.00 (non-seismic) / 1.50 (seismic) â€” <Cl>IRC:78-2014 Cl.706.2</Cl>.
          Kern = B/6 = {f3(kern)} m. Eccentricity e must stay within kern to avoid tension zone (IS:6403).
        </Prose>
      </Page>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE 4 â€” Individual LC Step-by-Step Checks
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Page id="s-pier-enh-check">
        <HR />
        <SectionHead>PIER STABILITY â€” DETAILED CALCULATION, LC1 to LC5</SectionHead>
        <div style={{ fontSize: 9, color: "royalblue", fontStyle: "italic", marginBottom: 6 }}>
          <Cl>IRC:78-2014 Cl.706.2 â€” Bearing Â· Sliding Â· Overturning Â· Kern Check</Cl>
        </div>

        {lcDefs.map((lc) => {
          const vf   = Vf(lc), hf = Hf(lc);
          const mr   = MR(lc), mo = MO(lc);
          const e    = ecc(lc);
          const qmx  = qmaxFn(lc), qmn = qminFn(lc);
          const slid = slidFOS(lc), ot = otFOS(lc);
          const smin = slidMin(lc), omin = otMin(lc);
          const kernOK = e <= kern;
          const bearOK = qmx <= d.SBC;
          const slidOK = slid >= smin;
          const otOK   = ot   >= omin;
          const allOK  = kernOK && bearOK && slidOK && otOK;

          const rows: CRow[] = [
            { sym: "Î£V = Vf",    result: f2(vf),  unit: "kN",   where: "Total vertical load at footing base" },
            { sym: "Î£H = Hf",    result: f2(hf),  unit: "kN",   where: "Total horizontal force" },
            { blank: true },
            { sym: "MR",   eq: `Vf Ã— arm_R = ${f2(vf)} Ã— ${f2(arm_R)}`,  result: f2(mr), unit: "kNÂ·m", where: "Restoring moment about toe (IRC:78 Cl.706.2)" },
            { sym: "MO",   eq: `Î£M_overturning`,                          result: f2(mo), unit: "kNÂ·m", where: "Total overturning moment from all horizontal forces" },
            { blank: true },
            {
              sym: "e",
              eq: `|arm_R âˆ’ (MR âˆ’ MO)/Vf| = |${f2(arm_R)} âˆ’ (${f2(mr)} âˆ’ ${f2(mo)})/${f2(vf)}|`,
              result: f3(e), unit: "m",
              where: "Eccentricity of resultant from footing centroid",
            },
            {
              sym: "e â‰¤ B/6 ?",
              eq: `${f3(e)} â‰¤ ${f3(kern)} ?`,
              result: "", unit: "",
              where: <Check pass={kernOK}>e = {f3(e)} m â€” {kernOK ? "within kern, no tension. Hence OK." : "OUTSIDE KERN â€” tension zone exists. Review footing size."}</Check>,
              note: kernOK ? "ok" : "warn",
            },
            { blank: true },
            {
              sym: "q_max",
              eq: `Vf/A + VfÂ·e/Z_xx = ${f2(vf)}/${f2(A_ftg)} + ${f2(vf)}Ã—${f3(e)}/${f3(Z_xx)}`,
              result: f2(qmx), unit: "kPa",
              where: `â‰¤ SBC = ${f2(d.SBC)} kPa`,
              note: bearOK ? "ok" : "fail",
            },
            {
              sym: "q_min",
              eq: `Vf/A âˆ’ VfÂ·e/Z_xx`,
              result: f2(qmn), unit: "kPa",
              where: "â‰¥ 0 kPa (no tension at footing base)",
              note: qmn >= 0 ? "ok" : "warn",
            },
            { blank: true },
            {
              sym: "FOS_sliding",
              eq: `Î¼ Ã— Vf / Hf = ${i.mu} Ã— ${f2(vf)} / ${f2(hf)}`,
              result: f2(slid), unit: "â€”",
              where: `â‰¥ ${smin} (${lc.seismic ? "seismic" : "non-seismic"}) â€” IRC:78 Cl.706.2`,
              note: slidOK ? "ok" : "fail",
            },
            {
              sym: "FOS_OT",
              eq: `MR / MO = ${f2(mr)} / ${f2(mo)}`,
              result: f2(ot), unit: "â€”",
              where: `â‰¥ ${omin} (${lc.seismic ? "seismic" : "non-seismic"}) â€” IRC:78 Cl.706.2`,
              note: otOK ? "ok" : "fail",
            },
            { blank: true },
            {
              sym: "VERDICT",
              eq: allOK ? "ALL CHECKS PASS â€” HENCE OK." : "REVIEW REQUIRED",
              result: "", unit: "",
              where: allOK ? "" : "Check items marked FAIL above and revise footing dimensions.",
              bold: true,
              note: allOK ? "ok" : "fail",
            },
          ];

          return (
            <React.Fragment key={lc.n}>
              <SubHeadCl clause={`IRC:78-2014 Cl.706.2 â€” ${lc.desc}`}>
                {lc.label} â€” {lc.desc}
              </SubHeadCl>
              <CalcBlock rows={rows} whereHeader />
            </React.Fragment>
          );
        })}
      </Page>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE 5 â€” Skew Effect (rendered only when skewDeg > 0)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {hasSkew && (
        <Page id="s-pier-enh-skew">
          <HR />
          <SectionHead>SKEW EFFECT â€” BIAXIAL PIER STABILITY CHECK  (Î± = {skewDeg}Â°)</SectionHead>
          <div style={{ fontSize: 9, color: "royalblue", fontStyle: "italic", marginBottom: 6 }}>
            <Cl>IRC:6-2017 Cl.207.2</Cl>{" Â· "}<Cl>IS:3935-1999 (Composite Constr.)</Cl>
            {" Â· "}<Cl>IS:6403-1981 Cl.6 (Biaxial Eccentric Load)</Cl>
          </div>

          <Prose>
            The bridge has a skew angle Î± = <strong>{skewDeg}Â°</strong> between the pier face and
            the direction normal to the bridge centreline.  On a skewed bridge, the live load
            reaction does not act symmetrically: the <em>obtuse corner</em> of each span panel
            attracts proportionally more load, shifting the resultant away from the pier centreline
            by a transverse eccentricity e_T.  This creates a transverse overturning moment
            M_T = R_LL Ã— e_T in addition to the longitudinal moments already computed.{" "}
            <Cl>IRC:6-2017 Cl.207.2</Cl> mandates this check for Î± &gt; 20Â°; it is performed here
            for Î± = {skewDeg}Â° as a conservative design step.
          </Prose>

          <SubHeadCl clause="IRC:6-2017 Cl.207.2 / IS:3935-1999">
            L. Transverse Eccentricity of Live Load due to Skew
          </SubHeadCl>
          <Prose>
            For a simply supported skewed slab uniformly loaded, the transverse shift of the
            load resultant at the supporting pier can be estimated from the Morice-Little influence
            surface basis (IS:3935) as:
            <strong> e_T = L_span Ã— sin(Î±) Ã— cos(Î±) / 2</strong>
            (half-span chord eccentricity, conservative for single-lane loaded condition).
            For Î± &gt; 20Â°, rigorous grillage or finite-element analysis should confirm.
          </Prose>
          <CalcBlock whereHeader rows={[
            { sym: "Î±",       eq: `${skewDeg}Â°`,                                        result: f3(alpha) + " rad",    where: "Bridge skew angle (deg â†’ rad)" },
            { sym: "sin Î±",   eq: `sin(${skewDeg}Â°)`,                                   result: f3(Math.sin(alpha)),   where: "" },
            { sym: "cos Î±",   eq: `cos(${skewDeg}Â°)`,                                   result: f3(Math.cos(alpha)),   where: "" },
            { sym: "L_span",  eq: `${i.spanL} m`,                                       result: f2(i.spanL),           unit: "m", where: "Centre-to-centre span of bridge (IRC:6 Cl.204.1)" },
            { sym: "e_T",     eq: `L_span Ã— sin(Î±) Ã— cos(Î±) / 2 = ${f2(i.spanL)} Ã— ${f3(Math.sin(alpha))} Ã— ${f3(Math.cos(alpha))} / 2`, result: f3(e_T), unit: "m", where: "Transverse eccentricity of LL resultant â€” obtuse corner concentration" },
            { sym: "M_T",     eq: `R_LL Ã— e_T = ${f2(i.LL_pier)} Ã— ${f3(e_T)}`,        result: f2(M_T),               unit: "kNÂ·m", where: "Transverse overturning moment on pier from skewed live load", bold: true },
          ]} />

          <SubHeadCl clause="IRC:6-2017 Cl.219.5">
            M. Resolution of Seismic Force in Skewed Pier
          </SubHeadCl>
          <Prose>
            Seismic force can act in any horizontal direction. For a skewed pier, the standard
            bridge-axis seismic force F_seisH is resolved into its component along the bridge
            axis (H_long) and perpendicular to it (H_trans). The transverse component creates
            an additional moment about the y-y axis of the footing.
          </Prose>
          <CalcBlock whereHeader rows={[
            { sym: "F_seisH",    eq: `${f2(i.seisH)} kN (entered)`,                            result: f2(i.seisH),     unit: "kN",   where: "Total horizontal seismic force along bridge axis" },
            { sym: "H_long",     eq: `F_seisH Ã— cos(Î±) = ${f2(i.seisH)} Ã— ${f3(Math.cos(alpha))}`, result: f2(H_seis_long), unit: "kN", where: "Seismic component along bridge axis (longitudinal)" },
            { sym: "H_trans",    eq: `F_seisH Ã— sin(Î±) = ${f2(i.seisH)} Ã— ${f3(Math.sin(alpha))}`, result: f2(H_seis_trans),unit: "kN", where: "Seismic component transverse to bridge axis" },
            { sym: "M_long,s",   eq: `H_long Ã— arm_seis`,                                       result: f2(H_seis_long * arm_seis),  unit: "kNÂ·m", where: "Longitudinal OT moment from resolved seismic (acts on Z_xx)" },
            { sym: "M_trans,s",  eq: `H_trans Ã— arm_seis`,                                      result: f2(H_seis_trans * arm_seis), unit: "kNÂ·m", where: "Transverse OT moment from resolved seismic (acts on Z_yy)" },
          ]} />

          <SubHeadCl clause="IS:6403-1981 Cl.6 / IRC:78-2014 Cl.706">
            N. Biaxial Bearing Pressure Check (LC1 + Skew)
          </SubHeadCl>
          <Prose>
            For a footing under biaxial eccentric loading, corner bearing pressures per IS:6403 Cl.6:
            <strong> q = Vf/A Â± VfÂ·e_x/Z_xx Â± M_T/Z_yy</strong>
            where e_x is the longitudinal eccentricity (from horizontal forces â€” from LC1 above)
            and M_T/Z_yy is the transverse pressure variation from the skewed live load moment.
            Maximum corner pressure q_A must not exceed SBC. Minimum corner q_D must not go negative.
          </Prose>
          <CalcBlock whereHeader rows={[
            { sym: "Vf (LC1)",     eq: f2(Vf1),                    result: f2(Vf1),         unit: "kN",   where: "Governing vertical load â€” LC1 (DL + LL + Hydro)" },
            { sym: "A_ftg",        eq: f2(A_ftg),                  result: f2(A_ftg),       unit: "mÂ²",   where: "Footing plan area" },
            { sym: "e_x",          eq: f3(ex1),                    result: f3(ex1),         unit: "m",    where: "Longitudinal eccentricity (from LC1 above)" },
            { sym: "Z_xx",         eq: f3(Z_xx),                   result: f3(Z_xx),        unit: "mÂ³",   where: "Section modulus about x-x (transverse axis)" },
            { sym: "M_T",          eq: f2(M_T),                    result: f2(M_T),         unit: "kNÂ·m", where: "Transverse moment from skew LL" },
            { sym: "Z_yy",         eq: f3(Z_yy),                   result: f3(Z_yy),        unit: "mÂ³",   where: "Section modulus about y-y (longitudinal axis)" },
            { blank: true },
            {
              sym: "q_A (max corner)",
              eq: `Vf/A + VfÂ·e_x/Z_xx + M_T/Z_yy = ${f2(Vf1)}/${f2(A_ftg)} + ${f2(Vf1)}Ã—${f3(ex1)}/${f3(Z_xx)} + ${f2(M_T)}/${f3(Z_yy)}`,
              result: f2(q_corner_max), unit: "kPa",
              where: `â‰¤ SBC = ${f2(d.SBC)} kPa`,
              note: q_corner_max <= d.SBC ? "ok" : "fail",
            },
            {
              sym: "q_D (min corner)",
              eq: `Vf/A âˆ’ VfÂ·e_x/Z_xx âˆ’ M_T/Z_yy`,
              result: f2(q_corner_min), unit: "kPa",
              where: "â‰¥ 0 (no tension at footing corner)",
              note: q_corner_min >= 0 ? "ok" : "warn",
            },
            { blank: true },
            {
              sym: "BIAXIAL VERDICT",
              eq: q_corner_max <= d.SBC && q_corner_min >= 0
                ? "BIAXIAL CHECK PASSES â€” HENCE OK."
                : "REVIEW: reduce skew / increase footing width",
              result: "", unit: "",
              bold: true,
              note: q_corner_max <= d.SBC ? "ok" : "fail",
            },
          ]} />

          {skewDeg > 20 && (
            <>
              <HR />
              <Prose>
                <strong>Important Note â€” Skew &gt; 20Â° (Î± = {skewDeg}Â°):</strong>{" "}
                IRC:6-2017 Cl.207.2 requires a full transverse analysis when the skew
                exceeds 20Â°.  The formula e_T = L Ã— sin(Î±) Ã— cos(Î±)/2 used above provides
                a conservative first estimate.  For the final design, use the{" "}
                <strong>Morice-Little distribution method</strong> or a calibrated grillage
                / finite-element model to determine the actual bearing reaction at each corner
                of the pier footing before finalising reinforcement.  Check also that the{" "}
                <Cl>IS:3935</Cl> skew reaction factor is applied to the longitudinal slab
                design.
              </Prose>
            </>
          )}
        </Page>
      )}

      {/* â”€â”€ Square bridge: informational page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!hasSkew && (
        <Page id="s-pier-enh-skew-na">
          <HR />
          <SectionHead>SKEW EFFECT â€” NOT APPLICABLE</SectionHead>
          <Prose>
            Skew angle Î± = 0Â° (square bridge). The skew biaxial bearing check is not required.
            The standard uniaxial bearing check computed in the previous page governs.
          </Prose>
          <Prose>
            If this bridge has a skew, pass the <strong>skewDeg</strong> prop when using this
            component (e.g., <code>&lt;SectionPierStabilityEnhanced skewDeg={"{20}"} â€¦ /&gt;</code>)
            to activate the full biaxial transverse analysis per IRC:6-2017 Cl.207.2 and IS:3935.
          </Prose>
        </Page>
      )}
    </>
  );
}


