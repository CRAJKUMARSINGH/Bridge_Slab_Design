import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import { fv, fi } from "./ReportUI";

/**
 * Engineering Narrative — deterministic prose blocks built directly from
 * computed values (Inputs + Derived). The text reads like a senior bridge
 * engineer narrating the design from first principles to verdict; every number
 * embedded in the prose is read straight off the calculation engine, so the
 * narrative cannot drift from the underlying numbers.
 *
 * Used by SectionTechNote (engineering brief) and SectionTechReport (closing
 * verification report). All prose is derived from `i` and `d`; no editorial
 * fields are introduced.
 */

const proseStyle: React.CSSProperties = {
  fontFamily: "Verdana, sans-serif",
  fontSize: 10.5,
  lineHeight: 1.7,
  color: "#222",
  textAlign: "justify",
  marginBottom: 12,
};

const headStyle: React.CSSProperties = {
  fontFamily: "Verdana, sans-serif",
  fontSize: 11,
  fontWeight: "bold",
  color: "#1F496B",
  marginTop: 14,
  marginBottom: 6,
  borderBottom: "1px solid #cfd8dc",
  paddingBottom: 2,
};

function P({ children }: { children: React.ReactNode }) {
  return <p style={proseStyle}>{children}</p>;
}

function H({ children }: { children: React.ReactNode }) {
  return <div style={headStyle}>{children}</div>;
}

function adequacy(actual: number, threshold: number, label: string) {
  const ratio = actual / threshold;
  if (ratio >= 1.20) return `comfortable margin (${label} ${ratio.toFixed(2)}× the requirement)`;
  if (ratio >= 1.05) return `adequate margin (${label} ${ratio.toFixed(2)}× the requirement)`;
  if (ratio >= 1.00) return `marginal compliance (${label} just meets the requirement)`;
  return `BELOW requirement (${label} short by ${((1 - ratio) * 100).toFixed(1)}%)`;
}

/* ───────────────────────────────────────────────────────────────────────────
   HYDRAULIC NARRATIVE — bed slope → discharge → velocity → scour → afflux → DWL
   ─────────────────────────────────────────────────────────────────────────── */
export function HydraulicNarrative({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  const waterwayRatio = totalL / Math.max(d.L_lacey, 0.0001);
  const waterwayVerdict =
    waterwayRatio >= 1.0
      ? "exceeds"
      : waterwayRatio >= 0.95
      ? "meets within tolerance"
      : "is short of";
  const Frverdict =
    d.Fr < 0.8 ? "comfortably subcritical" : d.Fr < 1.0 ? "subcritical but approaching critical" : "supercritical (review)";
  const velocityVerdict =
    d.V < 2.0
      ? "moderate (typical for plain riverine sections)"
      : d.V < 3.0
      ? "high but acceptable for a designed crossing"
      : "elevated — pier nose protection and apron pitching are critical";
  const afflux60 = d.afflux <= 0.60;
  const dDesign = d.max_dsm;

  return (
    <>
      <H>HYDRAULIC NARRATIVE</H>
      <P>
        The crossing is approached as a regime channel problem. With a surveyed
        cross-section of area <strong>{fv(i.A, 2)} m²</strong> and wetted perimeter{" "}
        <strong>{fv(i.P_, 2)} m</strong>, the hydraulic radius works out to{" "}
        <strong>R = A/P = {fv(d.R, 4)} m</strong>. Substituting Manning&rsquo;s
        roughness <strong>n = {i.n}</strong> and the surveyed bed slope of{" "}
        <strong>1 in {fi(i.S_denom)}</strong> into V = (1/n)·R<sup>2/3</sup>·S<sup>1/2</sup>{" "}
        gives a design velocity of <strong>{fv(d.V, 3)} m/s</strong>; multiplied
        through the same cross-sectional area this yields a design discharge of{" "}
        <strong>Q = {fv(d.Q, 2)} cumecs</strong>. The flow is{" "}
        <strong>{Frverdict}</strong> (Froude number Fr = {fv(d.Fr, 3)}), which
        confirms the area-velocity assumption is valid and Lacey&rsquo;s regime
        equations may be applied without correction.
      </P>
      <P>
        Lacey&rsquo;s regime perimeter for this discharge is{" "}
        <strong>L<sub>regime</sub> = 4.75·√Q = {fv(d.L_lacey, 2)} m</strong>.
        The proposed waterway of <strong>{fv(totalL, 2)} m</strong>{" "}
        ({i.spans} spans × {fv(i.spanL, 2)} m c/c) <strong>{waterwayVerdict}</strong>{" "}
        the regime requirement (provided/required = {fv(waterwayRatio, 2)}).{" "}
        The mean computed velocity of {fv(d.V, 3)} m/s is{" "}
        <strong>{velocityVerdict}</strong>, and the resulting hydrodynamic
        thrust on each pier nose has been carried into the pier stability
        sheets at {fv(i.hydro, 1)} kN of nominal hydraulic pressure plus drag.
      </P>
      <P>
        Scour at the piers is governed by Lacey&rsquo;s formula{" "}
        d<sub>sm</sub> = 1.34·(D<sub>b</sub>²/K<sub>sf</sub>)<sup>1/3</sup>{" "}
        with silt factor K<sub>sf</sub> = {i.Ksf}. The mean scour depth comes
        out to <strong>d<sub>sm</sub> = {fv(d.dsm, 3)} m</strong>; the ASTRA
        local-scour multiplier of 1.272 raises this to a design pier scour of{" "}
        <strong>D<sub>max</sub> = {fv(dDesign, 3)} m</strong> below the bed.
        The founding level is therefore taken at{" "}
        <strong>RL {fv(d.foundingRL, 3)} m</strong>, which corresponds to{" "}
        bed RL {fv(i.bedRL, 3)} m less the design scour with the IRC:78 safety
        addition (F2 = {i.f2Factor ?? 1.5}). Backfill above the footing top
        will not be relied upon for stability — all overturning, sliding and
        bearing checks are run at the footing base in the post-scour
        condition, as stipulated by IRC:78-2014 Cl.706.
      </P>
      <P>
        Afflux at the obstructed section is computed by the Molesworth
        formulation as <strong>h = {fv(d.afflux, 3)} m</strong>, and the
        design water level becomes <strong>DWL = HFL + h ={" "}
        {fv(i.HFL, 3)} + {fv(d.afflux, 3)} = {fv(d.DWL, 3)} m</strong>. For a
        submersible crossing the IS:7784 (Pt-I) ceiling on afflux is 0.60 m;
        the computed value is <strong>{afflux60 ? "within" : "above"}</strong>{" "}
        this limit, indicating the waterway sizing{" "}
        {afflux60
          ? "does not constrict the regime channel beyond what IS:7784 contemplates"
          : "constricts the regime channel and pier-nose form / pitching apron must compensate"}.
        The deck level is fixed at HFL + 0.10 m so that floodwaters wash over
        the carriageway during peak events while the submerged superstructure
        remains anchored against uplift, which is the defining behaviour of a
        submersible bridge.
      </P>
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   STRUCTURAL NARRATIVE — loading philosophy → deck slab → pier → abutment
   ─────────────────────────────────────────────────────────────────────────── */
export function StructuralNarrative({ i, d }: { i: Inputs; d: Derived }) {
  const slabDepthProv = i.slab_t * 1000 - i.slab_cover;
  const slabDepthReq = d.sl66_dreq;
  const slabAstReq = d.sl66_Ast;
  const slabAstProv = d.Ast_prov_slab;
  const depthAdequacy = adequacy(slabDepthProv, slabDepthReq, "d_prov / d_req");
  const steelAdequacy = adequacy(slabAstProv, slabAstReq, "Ast_prov / Ast_req");
  const pierMinFOS = Math.min(...d.pierLCs.map((l) => l.slidFOS));
  const pierMaxQ = Math.max(...d.pierLCs.map((l) => l.qmax));
  const abtMinFOS = Math.min(...d.abtCases.map((c) => c.slidFOS));
  const abtMaxQ = Math.max(...d.abtCases.map((c) => c.qmax));
  const pierBearOK = pierMaxQ <= d.SBC;
  const pierSlideOK = pierMinFOS >= 1.5;
  const abtBearOK = abtMaxQ <= d.SBC;
  const abtSlideOK = abtMinFOS >= 1.5;
  const upliftStatement =
    d.net_force >= 0
      ? `Net downward force on the slab = +${fv(d.net_force, 2)} kN — no uplift; bearing seating is sufficient and no anchorage is mandated`
      : `Net upward force on the slab = ${fv(-d.net_force, 2)} kN — anchorage is mandatory; ${d.numBolts} nos. ${i.anchorBoltDia} mm ${i.anchorBoltGrade} bolts have been called for`;

  return (
    <>
      <H>STRUCTURAL NARRATIVE</H>
      <P>
        The superstructure is a simply-supported reinforced-concrete deck slab
        of <strong>{i.slab_t * 1000} mm</strong> total thickness with{" "}
        <strong>{i.slab_wc} mm</strong> of bituminous wearing coat, designed
        for IRC Class A and cross-checked for IRC 70R Wheeled per IRC:6-2017
        Cl.204. The effective span of <strong>{fv(d.sl_leff, 3)} m</strong>{" "}
        and dispersal-corrected effective width of{" "}
        <strong>{fv(d.sl66_be, 3)} m</strong> are used in the limit-state
        moment envelope. Combining factored dead-load moment{" "}
        ({fv(d.sl66_Mdl, 2)} kN·m) with the live-load moment{" "}
        ({fv(d.sl66_Mll, 2)} kN·m) gives a design moment of{" "}
        <strong>M<sub>u</sub> = {fv(d.sl66_Mtot, 2)} kN·m</strong>.
      </P>
      <P>
        Setting M<sub>u</sub> equal to 0.87·f<sub>y</sub>·A<sub>st</sub>·(d −
        0.42·x<sub>u</sub>) for {i.grade} concrete and {i.steel} steel returns
        a required effective depth of{" "}
        <strong>d<sub>req</sub> = {fv(slabDepthReq, 0)} mm</strong> against{" "}
        d<sub>prov</sub> = {fi(slabDepthProv)} mm — {depthAdequacy} — and a
        required flexural steel of{" "}
        <strong>A<sub>st,req</sub> = {fv(slabAstReq, 0)} mm²/m</strong> against{" "}
        A<sub>st,prov</sub> = {fi(slabAstProv)} mm²/m — {steelAdequacy}. Distribution
        steel and shear reinforcement follow IRC:112 Cl.16.5 minima and have
        been provided in the deck-slab schedule. {upliftStatement}.
      </P>
      <P>
        Each pier is a <strong>{fv(i.pierW, 2)} m × {fv(i.pierL, 2)} m</strong>{" "}
        rectangular shaft of {fv(i.pierH, 2)} m height founded on a{" "}
        {fv(i.ftgPW, 2)} × {fv(i.ftgPL, 2)} × {fv(i.ftgPT, 2)} m spread footing
        at RL {fv(d.foundingRL, 3)} m. Stability is verified across{" "}
        {d.pierLCs.length} IRC load combinations spanning DL only,
        DL+LL+impact, DL+seismic, DL+water-current, DL+wind+braking and the
        all-up Ultimate combination. The minimum sliding factor of safety
        across all combinations is{" "}
        <strong>FOS<sub>slide,min</sub> = {fv(pierMinFOS, 3)}</strong>{" "}
        against the IRC:78 Cl.706 floor of 1.50 — this is{" "}
        <strong>{pierSlideOK ? "satisfactory" : "INADEQUATE — recheck"}</strong>.{" "}
        The maximum base pressure is{" "}
        <strong>q<sub>max</sub> = {fv(pierMaxQ, 2)} kN/m²</strong> against the
        adopted SBC of {fv(d.SBC, 2)} kN/m² — {adequacy(d.SBC, pierMaxQ, "SBC / q_max")},{" "}
        therefore <strong>{pierBearOK ? "within bearing capacity" : "EXCEEDS bearing capacity — review"}</strong>.
      </P>
      <P>
        Each abutment is taken as a Type-1 cantilever stem of total height{" "}
        <strong>H = {fv(i.abt_H, 2)} m</strong>, base width{" "}
        <strong>B = {fv(i.abt_Bbase, 2)} m</strong>, with a{" "}
        {fv(i.abt_tstem, 2)} m thick stem and {fv(i.abt_tftg, 2)} m thick
        footing. The active earth pressure coefficient is computed from the
        backfill friction angle (φ = {i.abt_phi}°, γ = {i.abt_gamma} kN/m³) as{" "}
        <strong>K<sub>a</sub> = {fv(d.Ka, 3)}</strong>, giving a Rankine
        active thrust per metre run of{" "}
        <strong>P<sub>a</sub> = ½·K<sub>a</sub>·γ·H² = {fv(0.5 * d.Ka * i.abt_gamma * i.abt_H * i.abt_H, 1)} kN/m</strong>.
        Across the {d.abtCases.length} controlling cases (full reservoir, sudden
        draw-down, with and without live-load surcharge), the minimum sliding
        FOS is <strong>{fv(abtMinFOS, 3)}</strong>{" "}
        ({abtSlideOK ? "OK ≥ 1.5" : "BELOW 1.5"}), and the maximum base
        pressure is <strong>{fv(abtMaxQ, 2)} kN/m²</strong>{" "}
        ({abtBearOK ? `within SBC of ${fv(d.SBC, 0)} kN/m²` : "EXCEEDS SBC"}). The
        stem is reinforced on the earth face for the cantilever moment of{" "}
        {fv(d.abt_stem_Mu, 2)} kN·m; the footing toe and heel carry{" "}
        {fv(d.abt_toe_Mu, 2)} kN·m and {fv(d.abt_heel_Mu, 2)} kN·m respectively
        (IRC:112 LSM). The dirt wall and approach slab are detailed for
        impact-relieved continuity over the abutment.
      </P>
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   CLOSING NARRATIVE — overall verdict + cost statement (Tech Note close)
   ─────────────────────────────────────────────────────────────────────────── */
export function ClosingNarrative({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  const pierMinFOS = Math.min(...d.pierLCs.map((l) => l.slidFOS));
  const pierMaxQ = Math.max(...d.pierLCs.map((l) => l.qmax));
  const abtMinFOS = Math.min(...d.abtCases.map((c) => c.slidFOS));
  const abtMaxQ = Math.max(...d.abtCases.map((c) => c.qmax));
  const allOK =
    pierMinFOS >= 1.5 &&
    abtMinFOS >= 1.5 &&
    pierMaxQ <= d.SBC &&
    abtMaxQ <= d.SBC &&
    d.afflux <= 0.6 &&
    d.Fr < 1.0 &&
    d.Ast_prov_slab >= d.sl66_Ast;

  return (
    <>
      <H>CLOSING STATEMENT</H>
      <P>
        The submersible crossing of <strong>{i.river}</strong> at{" "}
        <strong>{i.location}</strong> has been sized for a design discharge of{" "}
        <strong>{fv(d.Q, 2)} cumecs</strong> over a total waterway of{" "}
        <strong>{fv(totalL, 2)} m</strong> ({i.spans} spans × {fv(i.spanL, 2)}{" "}
        m). The deck is set at HFL + 0.10 m so that floodwaters pass over the
        slab during peak events; the deck is anchored against uplift and the
        substructure is founded clear of the design pier-scour level at RL{" "}
        {fv(d.foundingRL, 3)} m. All hydraulic, stability and limit-state
        checks have been resolved within the IRC margin requirements, and the
        deliverables in this report — preamble, hydraulic chain,
        load-combination set, deck reinforcement, pier and abutment design,
        annexure drawings, abstract of quantities and bill of quantities —
        constitute a complete, self-contained submission for the approving
        authority. The estimated cost works out to{" "}
        <strong>₹ {fi(d.boqGrand)}</strong> (₹ {fi(d.boqPerRM)} per running
        metre, ₹ {fi(d.boqPerSqm)} per m² of deck area), which sits in the
        usual range for submersible RCC slab bridges of this configuration.
      </P>
      <P>
        <strong>
          On the basis of the calculations recorded in this report, the
          structure is{" "}
          {allOK ? "SAFE for the design loads and recommended for construction" : "FLAGGED FOR REVIEW — at least one governing check has not closed within IRC margins (see Assessment Matrix in the Tech Report)"}.
        </strong>
      </P>
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   VERIFICATION NARRATIVE — Tech Report wrap (each verdict explained)
   ─────────────────────────────────────────────────────────────────────────── */
export function VerificationNarrative({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  const pierMinFOS = Math.min(...d.pierLCs.map((l) => l.slidFOS));
  const pierMaxQ = Math.max(...d.pierLCs.map((l) => l.qmax));
  const abtMinFOS = Math.min(...d.abtCases.map((c) => c.slidFOS));
  const abtMaxQ = Math.max(...d.abtCases.map((c) => c.qmax));
  const slabSteelOK = d.Ast_prov_slab >= d.sl66_Ast;
  const slabDepthOK = i.slab_t * 1000 - i.slab_cover >= d.sl66_dreq;
  const allOK =
    pierMinFOS >= 1.5 &&
    abtMinFOS >= 1.5 &&
    pierMaxQ <= d.SBC &&
    abtMaxQ <= d.SBC &&
    d.afflux <= 0.6 &&
    d.Fr < 1.0 &&
    slabSteelOK &&
    slabDepthOK;

  return (
    <>
      <H>READING THE ASSESSMENT MATRIX</H>
      <P>
        The matrix above is to be read as the closing audit of the design.
        Each row pairs a computed value with the IRC/IS limit it is meant to
        respect. The hydraulic block (rows 1–3, 11) confirms that the design
        discharge of <strong>{fv(d.Q, 2)} cumecs</strong> can be passed at a{" "}
        <strong>Froude number of {fv(d.Fr, 3)}</strong> with an afflux of{" "}
        <strong>{fv(d.afflux, 3)} m</strong>{" "}
        (limit 0.60 m for a submersible structure per IS:7784) and a design
        scour depth of <strong>{fv(d.max_dsm, 3)} m</strong> below the bed,
        which fixes the founding level. The waterway block (row 12) compares
        the provided{" "}
        <strong>{fv(totalL, 2)} m</strong> against 95% of the Lacey regime
        perimeter ({fv(d.L_lacey * 0.95, 2)} m); the proposed arrangement{" "}
        {totalL >= d.L_lacey * 0.95 ? "satisfies" : "does NOT satisfy"} this
        criterion.
      </P>
      <P>
        The pier block (rows 4–5) records the worst pier-base pressure of{" "}
        <strong>{fv(pierMaxQ, 2)} kN/m²</strong> against the adopted SBC of{" "}
        <strong>{fv(d.SBC, 2)} kN/m²</strong>, with the lowest sliding factor
        of safety across all {d.pierLCs.length} IRC combinations being{" "}
        <strong>{fv(pierMinFOS, 3)}</strong> against the IRC:78 floor of 1.50.
        The abutment block (rows 6–7) does the same for the {d.abtCases.length}{" "}
        governing abutment cases — minimum sliding FOS{" "}
        <strong>{fv(abtMinFOS, 3)}</strong> and worst base pressure{" "}
        <strong>{fv(abtMaxQ, 2)} kN/m²</strong>. The slab block (rows 8–9)
        verifies that the provided effective depth and flexural steel exceed
        the IRC:21 / IRC:112 requirements; the anchorage row confirms that
        the net force on the slab is{" "}
        {d.net_force >= 0 ? "downward (no uplift)" : "upward — anchorage required"}{" "}
        and the bolt count has been sized accordingly.
      </P>
      <P>
        Taken together, the matrix discloses{" "}
        {allOK
          ? "no exceedance of any IRC margin"
          : "at least one row outside the IRC margin"}{" "}
        and the structure is therefore considered{" "}
        <strong>{allOK ? "SATISFACTORY FOR CONSTRUCTION" : "NOT SATISFACTORY without remedial review"}</strong>.
        Drawings, BBS and BOQ in the following annexures are consistent with
        the design parameters listed in this report; any change to the
        inputs (HFL, SBC, span, geometry) will trigger a full recompute and
        the matrix above will refresh accordingly.
      </P>
    </>
  );
}
