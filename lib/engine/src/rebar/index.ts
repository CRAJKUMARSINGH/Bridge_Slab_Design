/**
 * Rebar — flexural steel design and bar-layout selection.
 *
 * PROVENANCE: this module is a faithful port of:
 *   • `client/src/report-engine/lib/slabCalc.ts` — `calcAst` (IS 456:2000 Cl. G-1)
 *     and `barSpacing` (round down to 5 mm, clamp 75–300 mm);
 *   • `client/src/report-engine/lib/ircSlabCalc.ts` — `getFck` / `getFy` /
 *     `getSigmaSt` and the working-stress-design steel block inside
 *     `designIRCSlab` (Q, lever arm j, required/provided steel, distribution
 *     steel and their bar spacings);
 *   • `client/src/report-engine/lib/pierCalc.ts` — the pier body, footing and
 *     cap reinforcement selection at the tail of `calcPier`;
 *   • `bridge-excel-generator/design-engine.ts` — the substructure bar
 *     proportioning used by `calculatePierDesign` / `calculateAbutmentDesign`.
 *
 * Copied rather than imported because `lib/engine` must have ZERO outward
 * dependencies, and `bridge-excel-generator/design-engine.ts` is the
 * ADR-0013-locked `authoritativeEngine`. The locked bytes are untouched.
 *
 * References: IS 456:2000 (Cl. G-1, Cl. B-1.3, Table 21, §26.5.3.1),
 * IRC:112-2015 §9.3.2, IRC:21:2000.
 */

// ---------------------------------------------------------------------------
// Material helpers
// ---------------------------------------------------------------------------

export type ConcreteGrade = "M15" | "M20" | "M25" | "M30" | "M35" | "M40";
export type SteelGrade = "Fe250" | "Fe415" | "Fe500" | "Fe550";

export function getFck(grade: ConcreteGrade): number {
  return { M15: 15, M20: 20, M25: 25, M30: 30, M35: 35, M40: 40 }[grade];
}

export function getFy(grade: SteelGrade): number {
  return { Fe250: 250, Fe415: 415, Fe500: 500, Fe550: 550 }[grade];
}

/** IS 456:2000 Table 21 permissible bending stress in concrete, N/mm². */
export function getSigmaCb(grade: ConcreteGrade): number {
  const map: Record<ConcreteGrade, number> = {
    M15: 5.0,
    M20: 7.0,
    M25: 8.5,
    M30: 10.0,
    M35: 11.5,
    M40: 12.5,
  };
  return map[grade];
}

/** IS 456:2000 Table 21 permissible tensile stress in steel, N/mm². */
export function getSigmaSt(grade: SteelGrade, barDia = 12): number {
  const base: Record<SteelGrade, number> = {
    Fe250: 140,
    Fe415: 200, // ≤12 mm dia
    Fe500: 230,
    Fe550: 250,
  };
  let sigma = base[grade];
  // IS 456:2000 Table 21 footnote: Fe415 bars > 12 mm → 190 N/mm²
  if (grade === "Fe415" && barDia > 12) {
    sigma = 190;
  }
  return sigma;
}

// ---------------------------------------------------------------------------
// IS 456 Cl. G-1 — required steel from Mu
// ---------------------------------------------------------------------------

/**
 * Required steel area from Mu (kN·m), per IS 456:2000 Clause G-1.
 * Throws when the section cannot carry Mu (negative discriminant, DEV-004).
 */
export function calcAst(MuKNm: number, fck: number, fy: number, d: number): number {
  if (MuKNm <= 0) return 0;
  const Mu = MuKNm * 1e6; // N·mm
  const b = 1000;
  // Mu = 0.87·fy·Ast·d·[1 − (Ast·fy)/(b·d·fck)]
  // Rearranged quadratic: A·x² + B·x + C = 0, x = Ast
  const A = (fy * fy) / (fck * b);
  const B = -(fy * d);
  const C = Mu / 0.87;
  const disc = B * B - 4 * A * C;
  if (disc < 0) {
    throw new Error(
      `calcAst: section under-sized — discriminant negative at Mu=${MuKNm.toFixed(2)} kN·m ` +
        `(fck=${fck} MPa, fy=${fy} MPa, d=${d.toFixed(1)} mm). ` +
        `Increase slab thickness or reduce span/load. [DEV-004]`,
    );
  }
  return (-B - Math.sqrt(disc)) / (2 * A);
}

/** Choose bar spacing (round down to nearest 5 mm, clamp 75–300 mm). */
export function barSpacing(
  astReq: number,
  dia: number,
): { spacing: number; astPrv: number; clamped: boolean; clampReason: string } {
  const abar = (Math.PI * dia * dia) / 4;
  if (astReq <= 0) {
    return { spacing: 300, astPrv: (abar * 1000) / 300, clamped: false, clampReason: "" };
  }
  const raw = (abar * 1000) / astReq;
  let s = Math.floor(raw / 5) * 5;
  let clamped = false;
  let clampReason = "";
  if (s < 75) {
    clamped = true;
    clampReason = `computed spacing ${s} mm < 75 mm minimum — slab needs thicker bars or denser layout`;
    s = 75;
  } else if (s > 300) {
    clamped = true;
    clampReason = `computed spacing ${s} mm > 300 mm maximum — governs minimum-steel rule`;
    s = 300;
  }
  return { spacing: s, astPrv: (abar * 1000) / s, clamped, clampReason };
}

// ---------------------------------------------------------------------------
// IRC working-stress-design steel (from designIRCSlab)
// ---------------------------------------------------------------------------

export interface WsdSectionInputs {
  /** Design moment Md, kN·m */
  designMoment: number;
  /** Dead-load moment component, kN·m */
  deadLoadMoment: number;
  /** Live-load moment component, kN·m */
  liveLoadMoment: number;
  /** Concrete grade — supplies σcbc and fck. */
  concreteGrade: ConcreteGrade;
  /** Steel grade — supplies σst. */
  steelGrade: SteelGrade;
  /** Effective depth d, mm */
  effectiveDepth: number;
  /** Main bar diameter, mm */
  barDia: number;
}

export interface WsdSectionResult {
  /** Moment-of-resistance coefficient Q = ½·σcb·k·j */
  Q: number;
  /** Lever arm factor j */
  leverArmJ: number;
  /** Required effective depth, mm */
  requiredDepth: number;
  /** Required main steel, mm²/m */
  requiredSteel: number;
  /** Adopted main bar spacing, mm */
  barSpacing: number;
  /** Provided main steel, mm²/m */
  providedSteel: number;
  /** Distribution steel, mm²/m */
  distributionSteel: number;
  /** Adopted distribution bar spacing, mm */
  distributionBarSpacing: number;
}

/**
 * Working-stress-design steel for an IRC slab section. Derives m, k, j, Q from
 * the concrete and steel grades exactly as `designIRCSlab` does.
 */
export function wsdSectionSteel(input: WsdSectionInputs): WsdSectionResult {
  const { designMoment, deadLoadMoment, liveLoadMoment, concreteGrade, steelGrade, effectiveDepth, barDia } =
    input;
  const fck = getFck(concreteGrade);
  const sigmaCb = getSigmaCb(concreteGrade);
  const sigmaSt = getSigmaSt(steelGrade, barDia);

  // m = 280/(3·σcbc) per IS 456:2000 Cl. B-1.3
  const m = 280 / (3 * sigmaCb);
  const k = (m * sigmaCb) / (m * sigmaCb + sigmaSt);
  // Q is the moment-of-resistance coefficient used as d = √(M/Q) below, so it must be the full
  // ½·σcb·k·j.
  const j = 1 - k / 3;
  const Q = 0.5 * sigmaCb * k * j;

  const requiredDepth = Math.sqrt((designMoment * 1e6) / (Q * 1000));

  const leverArmJ =
    0.5 +
    Math.sqrt(
      0.25 - (designMoment * 1e6) / (0.87 * fck * 1000 * effectiveDepth * effectiveDepth),
    );

  const requiredSteel = (designMoment * 1e6) / (sigmaSt * leverArmJ * effectiveDepth);

  const barArea = (Math.PI * barDia * barDia) / 4;
  let spacing = Math.floor((barArea * 1000) / requiredSteel / 5) * 5;
  spacing = Math.max(75, Math.min(300, spacing));
  const providedSteel = (barArea * 1000) / spacing;

  // ── Distribution steel (0.2×M1 + 0.3×M2)
  const distributionMoment = 0.2 * deadLoadMoment + 0.3 * liveLoadMoment;
  const distributionEffectiveDepth = effectiveDepth - barDia;
  const distributionSteel =
    (distributionMoment * 1e6) / (sigmaSt * leverArmJ * distributionEffectiveDepth);
  let distSpacing = Math.floor((barArea * 1000) / distributionSteel / 5) * 5;
  distSpacing = Math.max(75, Math.min(300, distSpacing));

  return {
    Q,
    leverArmJ,
    requiredDepth,
    requiredSteel,
    barSpacing: spacing,
    providedSteel,
    distributionSteel,
    distributionBarSpacing: distSpacing,
  };
}

// ---------------------------------------------------------------------------
// Pier / footing / cap reinforcement (from pierCalc.ts)
// ---------------------------------------------------------------------------

export interface PierRebarInputs {
  // Geometry
  pierW: number; // m
  pierL: number; // m
  ftgW: number; // m
  ftgL: number; // m
  ftgT: number; // m
  capL: number; // m
  capD: number; // m
  // Materials
  fy: number; // MPa
  cover: number; // mm
  // Governing load-case values (from the stability/load-case results)
  gcMO: number; // kN·m governing bending moment
  gcSumH: number; // kN governing shear
  gcSumV: number; // kN governing axial
  gcQmax: number; // kN/m² governing max bearing pressure
  gcQmin: number; // kN/m² governing min bearing pressure
  LL: number; // kN live-load reaction per pier
}

export interface PierRebarResult {
  Mu: number;
  Vu: number;
  N_gov: number;
  d: number;
  xu: number;
  xu_lim: number;
  Ast_req: number;
  Ast_prov: number;
  bars_main: string;
  dia_link: number;
  spacing_link: number;
  pct: number;
  ftg_qmax: number;
  ftg_qmin: number;
  ftg_d: number;
  ftg_Mu_s: number;
  ftg_Mu_l: number;
  ftg_Ast_s: number;
  ftg_Ast_l: number;
  cap_LL_reaction: number;
  cap_Mu: number;
  cap_Ast: number;
  cap_bars: string;
}

export function designPierRebar(i: PierRebarInputs): PierRebarResult {
  // Pier body steel design (pier as column under combined axial + moment)
  const Mu = i.gcMO; // kN·m governing BM
  const Vu = i.gcSumH; // kN governing SF
  const N_gov = i.gcSumV;
  const d = i.pierW * 1000 - i.cover - 10; // mm effective depth
  const xu_lim = (700 / (1400 + i.fy)) * d;
  const xu = Math.min(d * 0.4, xu_lim); // assume moderate reinf
  const Ast_req = Math.ceil((Mu * 1e6) / (0.87 * i.fy * (d - 0.42 * xu)));
  const Ast_prov = Math.ceil((Ast_req * 1.15) / 100) * 100 + 200;
  const dia_main = 20; // mm
  const nos_main = Math.ceil(Ast_prov / ((Math.PI / 4) * dia_main * dia_main));
  const bars_main = `${nos_main} – Φ${dia_main}`;
  const dia_link = 10;
  const spacing_link = 200;
  const pct = (Ast_prov / (i.pierW * 1000 * d)) * 100;

  // Footing design
  const ftg_d = (i.ftgT - 0.08) * 1000; // mm (cover 80 mm)
  const proj_s = (i.ftgW - i.pierW) / 2; // m projection short direction
  const proj_l = (i.ftgL - i.pierL) / 2;
  const q_avg_s = (i.gcQmax + i.gcQmax * 0.6) / 2;
  const ftg_Mu_s = (q_avg_s * proj_s * proj_s) / 2; // kN·m/m
  const ftg_Mu_l = (i.gcQmax * 0.6 * proj_l * proj_l) / 2;
  const ftg_Ast_s = Math.ceil((ftg_Mu_s * 1e6) / (0.87 * i.fy * (ftg_d - 50)));
  const ftg_Ast_l = Math.ceil((ftg_Mu_l * 1e6) / (0.87 * i.fy * (ftg_d - 50)));

  // Cap design
  const cap_LL_reaction = i.LL * 0.58;
  const cap_Mu = cap_LL_reaction * i.capL * 0.15; // kN·m approx
  const cap_d = (i.capD - 0.06) * 1000;
  const cap_Ast = Math.ceil((cap_Mu * 1e6) / (0.87 * i.fy * (cap_d - 50)));
  const cap_nos = Math.ceil(cap_Ast / ((Math.PI / 4) * 16 * 16));
  const cap_bars = `${cap_nos}–Φ16`;

  return {
    Mu,
    Vu,
    N_gov,
    d,
    xu,
    xu_lim,
    Ast_req,
    Ast_prov,
    bars_main,
    dia_link,
    spacing_link,
    pct,
    ftg_qmax: i.gcQmax,
    ftg_qmin: Math.max(i.gcQmin, 0),
    ftg_d,
    ftg_Mu_s,
    ftg_Mu_l,
    ftg_Ast_s,
    ftg_Ast_l,
    cap_LL_reaction,
    cap_Mu,
    cap_Ast,
    cap_bars,
  };
}

// ---------------------------------------------------------------------------
// Substructure bar proportioning (from the generator's design-engine.ts)
// ---------------------------------------------------------------------------

/** Bar diameters (mm) and spacings the generator proportions against. */
export const SUBSTRUCTURE_BAR_RULES = {
  PIER_MAIN_BAR_DIAMETER_MM: 25,
  PIER_LINK_BAR_DIAMETER_MM: 10,
  ABUTMENT_MAIN_BAR_DIAMETER_MM: 20,
  DEFAULT_BAR_SPACING_MM: 150,
  MIN_MAIN_BAR_COUNT: 8,
} as const;

export interface ProportionedBars {
  diameter: number;
  spacing: number;
  numberOfBars: number;
  /** Net steel area, mm² */
  area: number;
  /** Steel weight, kg */
  weight: number;
}

/**
 * Main longitudinal bar cage for a rectangular substructure element: count is
 * derived from the cage perimeter and clamped to the minimum main-bar count.
 */
export function proportionMainBars(
  perimeterM: number,
  runLengthM: number,
  diameterMm: number,
): ProportionedBars {
  const barArea = (Math.PI / 4) * diameterMm ** 2; // mm² per bar
  const spacingM = SUBSTRUCTURE_BAR_RULES.DEFAULT_BAR_SPACING_MM / 1000;
  const numberOfBars = Math.max(SUBSTRUCTURE_BAR_RULES.MIN_MAIN_BAR_COUNT, Math.round(perimeterM / spacingM));
  return {
    diameter: diameterMm,
    spacing: SUBSTRUCTURE_BAR_RULES.DEFAULT_BAR_SPACING_MM,
    numberOfBars,
    area: numberOfBars * barArea,
    weight: (numberOfBars * barArea * runLengthM * 7850) / 1e6, // kg
  };
}

/**
 * Transverse links for a substructure element: count from the run length at the
 * default spacing, weight from the closed-link perimeter.
 */
export function proportionLinkBars(
  runLengthM: number,
  linkPerimeterM: number,
  diameterMm: number,
): ProportionedBars {
  const barArea = (Math.PI / 4) * diameterMm ** 2; // mm² per link bar
  const spacingM = SUBSTRUCTURE_BAR_RULES.DEFAULT_BAR_SPACING_MM / 1000;
  const numberOfBars = Math.ceil(runLengthM / spacingM);
  return {
    diameter: diameterMm,
    spacing: SUBSTRUCTURE_BAR_RULES.DEFAULT_BAR_SPACING_MM,
    numberOfBars,
    area: numberOfBars * barArea,
    weight: (numberOfBars * linkPerimeterM * barArea * 7850) / 1e6, // kg
  };
}
