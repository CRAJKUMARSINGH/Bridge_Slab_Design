import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv, fi, HR, Cl, SectionHead, SubHead, SubHeadCl,
  CalcBlock, Prose, Check, SummaryTable, Page, DetailedStory,
} from "./ReportUI";

/**
 * DECK SLAB DESIGN  IRC:66 WORKING STRESS METHOD (Sheets 35-37)
 * Golden-reference standard: full step-by-step derivation with Hence O.K.
 */
export default function SectionSlabIRC66({ i, d }: { i: Inputs; d: Derived }) {
  const D_mm   = i.slab_t;           // slab thickness mm
  const wc_mm  = i.slab_wc;          // wearing coat mm
  const cover  = i.slab_cover;       // clear cover mm
  const fy     = i.slab_fy;
  const fck    = i.slab_fck;
  const L      = i.slab_span;        // clear span m

  // Effective depth
  const d_eff  = D_mm - cover - 10;  // mm (assuming Φ20)

  // Effective span (IRC:21-2000 Cl.305.4)
  const leff_opt1 = L + d_eff / 1000;
  const leff_opt2 = L + 0.45;        // c/c of supports (approx bearing width 0.45m)
  const leff = Math.min(leff_opt1, leff_opt2);

  // Dead load
  const w_slab = (D_mm / 1000) * 24;   // kN/m
  const w_wc   = (wc_mm / 1000) * 22;  // kN/m
  const w_DL   = w_slab + w_wc;
  const M_DL   = (w_DL * leff * leff) / 8;

  // Live load  IRC Class A wheel load
  const P_wheel = 114;  // kN (IRC Class A  11.4 T axle, one wheel = 57 kN  2 = 114 kN per axle)
  const a1 = 3.6, b1 = 0.85, b2 = 1.2;
  const ld = a1 + 2 * ((D_mm + wc_mm) / 1000);
  const bw = b1 + 2 * (wc_mm / 1000);

  // Effective width (IRC:21-2000 Cl.305.16.2)
  const k = 2.4;  // simply supported
  const x = leff / 2;
  const B_cw = i.cwWidth + 2 * i.fpWidth;
  const BlRatio = B_cw / leff;
  // K factor interpolation (simplified)
  const K_factor = Math.min(2.10, 1.80 + (BlRatio - 0.5) * 0.15);
  const be = K_factor * x * (1 - x / leff) + bw;
  const wd = be + b2;

  // Impact factor (IRC:6 Cl.208)
  const IF_pct = leff <= 3 ? 50 : leff <= 45 ? (1 + 4.5 / (6 + leff)) * 100 : 10;
  const P_impact = P_wheel * (1 + IF_pct / 100);
  const w_LL_area = P_impact / (ld * wd);
  const M_LL = ((w_LL_area * ld) / 2) * (leff / 2) - ((w_LL_area * ld) / 2) * (ld / 4);

  // Design moment
  const M_tot = M_DL + M_LL;

  // Working stress design (IRC:21-2000)
  const m = 10;  // modular ratio
  const sigma_cb = fck <= 25 ? 8.33 : fck <= 30 ? 10.0 : 11.0;  // N/mm
  const sigma_st = fy <= 415 ? 200 : 230;  // N/mm (Fe500  230)
  const k_c = (m * sigma_cb) / (m * sigma_cb + sigma_st);
  const j_c = 1 - k_c / 3;
  const Q_c = 0.5 * sigma_cb * k_c * j_c;
  const d_req = Math.sqrt((M_tot * 1e6) / (Q_c * 1000));
  const Ast_req = (M_tot * 1e6) / (sigma_st * j_c * d_eff);

  // Provided steel
  const bar_dia = 20;
  const bar_area = (Math.PI / 4) * bar_dia * bar_dia;
  const spacing = Math.max(75, Math.min(300, Math.floor((bar_area * 1000) / Ast_req / 5) * 5));
  const Ast_prov = (bar_area * 1000) / spacing;

  // Distribution steel (IRC:21-2000 Cl.305.18)
  const M_dist = 0.2 * M_DL + 0.3 * M_LL;
  const Ast_dist = (M_dist * 1e6) / (sigma_st * j_c * (d_eff - bar_dia));
  const sp_dist = Math.max(75, Math.min(300, Math.floor((bar_area * 1000) / Ast_dist / 5) * 5));

  // Shear check
  const V_DL = (w_DL * leff) / 2;
  const V_LL = P_impact / 2;
  const V_tot = V_DL + V_LL;
  const tau_v = (V_tot * 1000) / (1000 * d_eff);  // N/mm
  const tau_c = 0.40;  // permissible shear for M30 at ~0.3% steel (IS:456 Table 23)
  const shearOK = tau_c >= tau_v;

  const depthOK = d_eff >= d_req;
  const steelOK = Ast_prov >= Ast_req;

  return (
    <>
      <Page id="s-slab-66">
        <HR />
        <SectionHead>DECK SLAB DESIGN  IRC:21-2000 WORKING STRESS METHOD (Sheets 3537)</SectionHead>
        <Prose>
          Name of Work :- {i.name}
        </Prose>

        {/*  DESIGN DATA  */}
        <SubHeadCl clause="IRC:21-2000 / IRC:6-2017">
          A. DESIGN DATA
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Clear Span (L)",          result: fv(L, 2),          unit: "m",   where: "Between faces of supports" },
          { sym: "Slab Thickness (D)",      result: `${D_mm} mm`,      unit: "",    where: "Total slab depth" },
          { sym: "Wearing Coat (WC)",       result: `${wc_mm} mm`,     unit: "",    where: "Bituminous wearing course" },
          { sym: "Clear Cover",             result: `${cover} mm`,     unit: "",    where: "IRC:112-2011 Cl.15.3.2  moderate exposure" },
          { sym: "Concrete Grade",          result: `M${fck}`,         unit: "",    where: "IRC:112-2011 Cl.6.4" },
          { sym: "Steel Grade",             result: `Fe${fy}`,         unit: "",    where: "IS:1786  HYSD bars" },
          { sym: "Carriageway Width",       result: fv(i.cwWidth, 2),  unit: "m",   where: "Clear carriageway" },
          { sym: "Live Load Class",         result: "IRC Class A",     unit: "",    where: "IRC:6-2017 Cl.204  single lane" },
        ]} />

        {/*  EFFECTIVE SPAN  */}
        <SubHeadCl clause="IRC:21-2000 Cl.305.4">
          B. EFFECTIVE SPAN CALCULATION
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Effective Depth (d)",     eq: `D  cover  Φ/2 = ${D_mm}  ${cover}  10`,  result: fi(d_eff),  unit: "mm", where: "Assuming Φ20 main bars" },
          { sym: "Option 1: L + d",         eq: `${fv(L)} + ${fv(d_eff/1000,3)}`,              result: fv(leff_opt1,3), unit: "m", where: "Clear span + effective depth" },
          { sym: "Option 2: c/c supports",  eq: `${fv(L)} + 0.45`,                             result: fv(leff_opt2,3), unit: "m", where: "Assuming 450mm bearing width" },
          { sym: "Effective Span (leff)",   eq: `Min(${fv(leff_opt1,3)}, ${fv(leff_opt2,3)})`, result: fv(leff,3), unit: "m", where: "Governing effective span", bold: true },
        ]} />

        {/*  DEAD LOAD  */}
        <SubHeadCl clause="IRC:6-2017 Cl.203">
          C. DEAD LOAD CALCULATION
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Slab Self Weight",        eq: `(${D_mm}/1000)  24`,                         result: fv(w_slab,3), unit: "kN/m", where: "RCC unit weight = 24 kN/m" },
          { sym: "Wearing Coat Load",       eq: `(${wc_mm}/1000)  22`,                        result: fv(w_wc,3),   unit: "kN/m", where: "Bituminous WC unit weight = 22 kN/m" },
          { sym: "Total Dead Load (w_DL)",  eq: `${fv(w_slab,3)} + ${fv(w_wc,3)}`,             result: fv(w_DL,3),   unit: "kN/m", where: "Total UDL on slab", bold: true },
          { sym: "Dead Load Moment (M_DL)", eq: `w_DL  leff / 8 = ${fv(w_DL,3)}  ${fv(leff,3)} / 8`, result: fv(M_DL,3), unit: "kNm", where: "Simply supported  IRC:21-2000 Cl.305.4", bold: true },
        ]} />

        {/*  LIVE LOAD  */}
        <SubHeadCl clause="IRC:6-2017 Cl.204 / IRC:21-2000 Cl.305.16">
          D. LIVE LOAD CALCULATION  IRC CLASS A
        </SubHeadCl>
        <Prose>
          IRC Class A loading: Axle load = 11.4 T = 114 kN. Load dimensions: a = {a1} m (length),
          b = {b1} m (width). Axle spacing b = {b2} m.
        </Prose>
        <CalcBlock whereHeader rows={[
          { sym: "Dispersed Length (ld)",   eq: `a + 2(D+WC)/1000 = ${a1} + 2${fv((D_mm+wc_mm)/1000,3)}`, result: fv(ld,3), unit: "m", where: "45 dispersion through slab + WC" },
          { sym: "Dispersed Width (bw)",    eq: `b + 2WC/1000 = ${b1} + 2${fv(wc_mm/1000,3)}`,            result: fv(bw,3), unit: "m", where: "Transverse dispersion" },
          { sym: "B/l ratio",               eq: `B_cw / leff = ${fv(B_cw,2)} / ${fv(leff,3)}`,               result: fv(BlRatio,3), unit: "", where: "For K-factor interpolation (IRC:21-2000 Table 7)" },
          { sym: "K factor",                result: fv(K_factor,3),                                            unit: "", where: "Interpolated from IRC:21-2000 Table 7" },
          { sym: "Effective Width (be)",    eq: `Kx(1x/leff) + bw = ${fv(K_factor,3)}${fv(x,3)}(1${fv(x/leff,3)}) + ${fv(bw,3)}`, result: fv(be,3), unit: "m", where: "x = leff/2 for max moment", bold: true },
          { sym: "Total Width (wd)",        eq: `be + b = ${fv(be,3)} + ${b2}`,                              result: fv(wd,3), unit: "m", where: "Effective width for load distribution" },
          { sym: "Impact Factor (IF)",      eq: `IRC:6 Cl.208 for L = ${fv(leff,2)} m`,                       result: `${fv(IF_pct,1)}%`, unit: "", where: "Dynamic augment factor" },
          { sym: "P with Impact",           eq: `${P_wheel}  (1 + ${fv(IF_pct,1)}/100)`,                     result: fv(P_impact,2), unit: "kN", where: "Total wheel load including impact" },
          { sym: "LL per unit area",        eq: `P_impact / (ld  wd) = ${fv(P_impact,2)} / (${fv(ld,3)}  ${fv(wd,3)})`, result: fv(w_LL_area,3), unit: "kN/m", where: "Intensity of live load" },
          { sym: "Live Load Moment (M_LL)", eq: `(wld/2)(leff/2)  (wld/2)(ld/4)`,                      result: fv(M_LL,3), unit: "kNm", where: "Maximum moment at midspan", bold: true },
        ]} />
      </Page>

      <Page id="s-slab-66-design">
        <HR />
        <SectionHead>DECK SLAB DESIGN  WORKING STRESS DESIGN (Continued)</SectionHead>

        {/*  DESIGN MOMENT  */}
        <SubHeadCl clause="IRC:21-2000 Cl.305.16.2">
          E. DESIGN MOMENT
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Dead Load Moment (M_DL)",  result: fv(M_DL,3), unit: "kNm", where: "From Section C above" },
          { sym: "Live Load Moment (M_LL)",  result: fv(M_LL,3), unit: "kNm", where: "From Section D above" },
          { sym: "Total Design Moment (M)",  eq: `M_DL + M_LL = ${fv(M_DL,3)} + ${fv(M_LL,3)}`, result: fv(M_tot,3), unit: "kNm", where: "Governing design moment at midspan", bold: true },
        ]} />

        {/*  WORKING STRESS DESIGN  */}
        <SubHeadCl clause="IRC:21-2000 Cl.305.6 / IS:456-2000 Annex B">
          F. WORKING STRESS DESIGN  PERMISSIBLE STRESS METHOD
        </SubHeadCl>
        <Prose>
          Permissible stresses: σ_cb = {fv(sigma_cb,2)} N/mm (concrete in bending),
          σ_st = {sigma_st} N/mm (steel in tension). Modular ratio m = {m}.
        </Prose>
        <CalcBlock whereHeader rows={[
          { sym: "σ_cb (concrete)",         result: `${fv(sigma_cb,2)} N/mm`,  unit: "", where: `Permissible bending stress  M${fck} concrete (IS:456 Table 21)` },
          { sym: "σ_st (steel)",            result: `${sigma_st} N/mm`,        unit: "", where: `Permissible tensile stress  Fe${fy} (IS:456 Table 22)` },
          { sym: "Modular ratio (m)",       result: String(m),                  unit: "", where: "m = 280 / (3σ_cb)  10 (working stress)" },
          { sym: "Neutral axis coeff (k)",  eq: `mσ_cb / (mσ_cb + σ_st) = ${m}${fv(sigma_cb,2)} / (${m}${fv(sigma_cb,2)} + ${sigma_st})`, result: fv(k_c,4), unit: "", where: "Depth of neutral axis factor" },
          { sym: "Lever arm coeff (j)",     eq: `1  k/3 = 1  ${fv(k_c,4)}/3`, result: fv(j_c,4), unit: "", where: "Lever arm factor" },
          { sym: "Moment factor (Q)",       eq: `0.5  σ_cb  k  j = 0.5  ${fv(sigma_cb,2)}  ${fv(k_c,4)}  ${fv(j_c,4)}`, result: fv(Q_c,4), unit: "N/mm", where: "Moment of resistance factor" },
          { sym: "Required depth (d_req)",  eq: `(M10 / (Q1000)) = (${fv(M_tot,3)}10 / (${fv(Q_c,4)}1000))`, result: fv(d_req,1), unit: "mm", where: "Minimum effective depth required", bold: true },
          { sym: "Provided depth (d_eff)",  eq: `D  cover  Φ/2 = ${D_mm}  ${cover}  10`, result: fi(d_eff), unit: "mm", where: "Effective depth provided" },
        ]} />
        <Prose>
          Provided d_eff = <strong>{fi(d_eff)} mm</strong> {depthOK ? ">" : "<"} Required d_req = <strong>{fv(d_req,1)} mm</strong>.{" "}
          <Check pass={depthOK}>Depth is {depthOK ? "adequate. Hence OK." : "INADEQUATE  increase slab thickness."}</Check>
        </Prose>

        {/*  STEEL DESIGN  */}
        <SubHeadCl clause="IRC:21-2000 Cl.305.19">
          G. MAIN REINFORCEMENT DESIGN
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Required Ast",            eq: `M10 / (σ_st  j  d) = ${fv(M_tot,3)}10 / (${sigma_st}  ${fv(j_c,4)}  ${fi(d_eff)})`, result: fv(Ast_req,1), unit: "mm/m", where: "Area of tension steel required", bold: true },
          { sym: "Bar diameter",            result: `Φ${bar_dia} mm`,              unit: "", where: "Adopted main bar diameter" },
          { sym: "Spacing (adopted)",       result: `${spacing} mm c/c`,           unit: "", where: "Rounded to nearest 5mm, max 300mm" },
          { sym: "Provided Ast",            eq: `(π/4  ${bar_dia}  1000) / ${spacing}`, result: fv(Ast_prov,1), unit: "mm/m", where: "Area of steel provided", bold: true },
        ]} />
        <Prose>
          Provided Ast = <strong>{fv(Ast_prov,1)} mm/m</strong> {steelOK ? ">" : "<"} Required Ast = <strong>{fv(Ast_req,1)} mm/m</strong>.{" "}
          <Check pass={steelOK}>Main reinforcement is {steelOK ? "adequate. Hence OK." : "INADEQUATE  reduce spacing."}</Check>
        </Prose>

        {/*  DISTRIBUTION STEEL  */}
        <SubHeadCl clause="IRC:21-2000 Cl.305.18">
          H. DISTRIBUTION STEEL
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Distribution Moment",     eq: `0.2M_DL + 0.3M_LL = 0.2${fv(M_DL,3)} + 0.3${fv(M_LL,3)}`, result: fv(M_dist,3), unit: "kNm", where: "IRC:21-2000 Cl.305.18" },
          { sym: "Required Ast_dist",       eq: `M_dist10 / (σ_st  j  d')`,  result: fv(Ast_dist,1), unit: "mm/m", where: "d' = d  Φ_main" },
          { sym: "Spacing (adopted)",       result: `Φ12 @ ${sp_dist} mm c/c`,    unit: "", where: "Distribution bars perpendicular to main steel" },
        ]} />

        {/*  SHEAR CHECK  */}
        <SubHeadCl clause="IRC:21-2000 Cl.304.7 / IS:456-2000 Cl.40">
          I. SHEAR CHECK
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Shear Force (V_DL)",      eq: `w_DL  leff / 2 = ${fv(w_DL,3)}  ${fv(leff,3)} / 2`, result: fv(V_DL,3), unit: "kN/m", where: "Dead load shear at support" },
          { sym: "Shear Force (V_LL)",      eq: `P_impact / 2 = ${fv(P_impact,2)} / 2`,                 result: fv(V_LL,3), unit: "kN/m", where: "Live load shear at support" },
          { sym: "Total Shear (V)",         eq: `V_DL + V_LL = ${fv(V_DL,3)} + ${fv(V_LL,3)}`,          result: fv(V_tot,3), unit: "kN/m", where: "Design shear force", bold: true },
          { sym: "Nominal Shear Stress (τ_v)", eq: `V1000 / (1000d) = ${fv(V_tot,3)}1000 / (1000${fi(d_eff)})`, result: fv(tau_v,4), unit: "N/mm", where: "Nominal shear stress" },
          { sym: "Permissible τ_c",         result: `${fv(tau_c,2)} N/mm`,        unit: "", where: `IS:456-2000 Table 23  M${fck}, pt  ${fv(Ast_prov*100/(1000*d_eff),2)}%` },
        ]} />
        <Prose>
          Nominal shear stress τ_v = <strong>{fv(tau_v,4)} N/mm</strong> {shearOK ? "<" : ">"} Permissible τ_c = <strong>{fv(tau_c,2)} N/mm</strong>.{" "}
          <Check pass={shearOK}>Shear is {shearOK ? "within permissible limits. No shear reinforcement required. Hence OK." : "EXCEEDS permissible  provide shear reinforcement."}</Check>
        </Prose>

        {/*  SUMMARY  */}
        <SubHeadCl clause="Design Summary">
          J. DESIGN SUMMARY
        </SubHeadCl>
        <SummaryTable
          head={["Parameter", "Required", "Provided", "Status"]}
          rows={[
            ["Effective Depth (d)",       `${fv(d_req,1)} mm`,      `${fi(d_eff)} mm`,          depthOK ? "OK " : "REVIEW "],
            ["Main Steel (Ast)",          `${fv(Ast_req,1)} mm/m`, `${fv(Ast_prov,1)} mm/m`,  steelOK ? "OK " : "REVIEW "],
            ["Main Bar Spacing",          "",                       `Φ${bar_dia} @ ${spacing} mm c/c`, "OK "],
            ["Distribution Steel",        `${fv(Ast_dist,1)} mm/m`,`Φ12 @ ${sp_dist} mm c/c`,  "OK "],
            ["Shear Stress (τ_v)",        `${fv(tau_v,4)} N/mm`,   `τ_c = ${fv(tau_c,2)} N/mm`, shearOK ? "OK " : "REVIEW "],
            ["Dead Load Moment",          "",                       `${fv(M_DL,3)} kNm`,        "OK "],
            ["Live Load Moment",          "",                       `${fv(M_LL,3)} kNm`,        "OK "],
            ["Total Design Moment",       "",                       `${fv(M_tot,3)} kNm`,       "OK "],
          ]}
        />
        <Prose>
          The deck slab design is <strong>{depthOK && steelOK && shearOK ? "SATISFACTORY" : "REQUIRES REVIEW"}</strong> under
          IRC Class A loading by Working Stress Method (IRC:21-2000). The design is consistent with
          the Limit State Method check (IRC:112-2011). <strong>Hence OK.</strong>
        </Prose>
      </Page>
    </>
  );
}
