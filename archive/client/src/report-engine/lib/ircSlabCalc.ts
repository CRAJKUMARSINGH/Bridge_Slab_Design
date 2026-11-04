// IRC 21:2000 Deck Strip Method for RCC Slab Bridges
// References: IRC 21:2000, IRC 112:2011, ASTRA Pro methodology
// Working Stress Design (permissible stress method)

export type ConcreteGrade = "M15" | "M20" | "M25" | "M30" | "M35" | "M40";
export type SteelGrade = "Fe250" | "Fe415" | "Fe500" | "Fe550";

export interface IRCSlabInputs {
  slabName: string;
  concreteGrade: ConcreteGrade;
  steelGrade: SteelGrade;
  // Geometry
  clearSpan: number; // clear span L (m)
  supportWidth: number; // width of end support/bearing (m)
  slabThickness: number; // total slab thickness D (mm)
  wearingCoatThickness: number; // wearing course WC (mm)
  carriagewayWidth: number; // CW (m)
  footpathWidth: number; // FP (m)
  cover: number; // clear cover to reinforcement (mm)
  barDia: number; // main bar diameter (mm)
  // Live load dimensions (IRC Class A train)
  a1: number; // length of load (m)
  b1: number; // width of load (m)
  b2: number; // axle spacing (m)
  totalLiveLoad: number; // W1 (kN)
  // Unit weights
  concreteUW: number; // kN/m³ (default 24)
  wearingCoatUW: number; // kN/m³ (default 22)
  // Impact factor method
  impactMethod: "irc6" | "astra_linear"; // IRC:6 formula vs ASTRA linear
}

export interface IRCSlabResult {
  inputs: IRCSlabInputs;
  // Effective span
  effectiveDepth: number; // deff (mm)
  effectiveSpan: number; // leff (m)
  // Dead load
  slabSelfWeight: number; // kN/m²
  wearingCoatWeight: number; // kN/m²
  totalDL: number; // kN/m²
  deadLoadMoment: number; // M1 (kN·m)
  // Live load
  impactFactor: number; // %
  dispersedLength: number; // ld (m)
  dispersedWidthBw: number; // bw (m)
  Kfactor: number; // from IRC 21:2000 table
  effectiveWidthBe: number; // be (m)
  totalWidthWd: number; // wd (m)
  totalLiveLoadWithImpact: number; // TLL (kN)
  liveLoadPerUnitArea: number; // LLUA (kN/m²)
  liveLoadMoment: number; // M2 (kN·m)
  // Design moment
  designMoment: number; // M (kN·m)
  // Steel design (working stress)
  fck: number;
  fy: number;
  sigmaCb: number; // permissible concrete stress (N/mm²)
  sigmaSt: number; // permissible steel stress (N/mm²)
  m: number; // modular ratio
  Q: number; // lever arm factor
  requiredDepth: number; // d (mm)
  leverArmJ: number; // j
  requiredSteel: number; // Ast (mm²/m)
  barSpacing: number; // mm
  providedSteel: number; // Ast_prov (mm²/m)
  // Distribution steel
  distributionMoment: number; // M_dist (kN·m)
  distributionSteel: number; // Ast_dist (mm²/m)
  distributionSpacing: number; // mm
  // Shear
  shearForce: number; // V (kN)
  shearStress: number; // τ (N/mm²)
  K1: number;
  K2: number;
  tauCo: number; // permissible shear stress (N/mm²)
  tauC: number; // design shear stress (N/mm²)
  shearStatus: "OK" | "FAIL";
  warnings: string[];
}

// ─── Permissible Stresses (Working Stress) ─────────────────────────────────────
function getSigmaCb(grade: ConcreteGrade): number {
  // Permissible bending stress in concrete (N/mm²) per IS 456
  const map: Record<ConcreteGrade, number> = {
    M15: 5.0,
    M20: 7.0,
    M25: 8.33,
    M30: 10.0,
    M35: 11.0,
    M40: 12.0,
  };
  return map[grade];
}

function getSigmaSt(grade: SteelGrade): number {
  // Permissible tensile stress in steel (N/mm²) per IS 456
  const map: Record<SteelGrade, number> = {
    Fe250: 140,
    Fe415: 200,
    Fe500: 230,
    Fe550: 250,
  };
  return map[grade];
}

export function getFck(grade: ConcreteGrade): number {
  return { M15: 15, M20: 20, M25: 25, M30: 30, M35: 35, M40: 40 }[grade];
}

export function getFy(grade: SteelGrade): number {
  return { Fe250: 250, Fe415: 415, Fe500: 500, Fe550: 550 }[grade];
}

// ─── IRC 21:2000 K Factor Table (Simply Supported Slabs) ─────────────────────
// B/l ratio to K factor interpolation
const K_TABLE: [number, number][] = [
  [0.5, 1.80],
  [0.6, 1.85],
  [0.7, 1.90],
  [0.8, 1.93],
  [0.9, 1.96],
  [1.0, 1.98],
  [1.1, 2.00],
  [1.2, 2.02],
  [1.3, 2.03],
  [1.4, 2.04],
  [1.5, 2.05],
  [1.6, 2.06],
  [1.7, 2.07],
  [1.8, 2.08],
  [1.9, 2.09],
  [2.0, 2.10],
];

function interpolateK(BlRatio: number): number {
  if (BlRatio <= K_TABLE[0][0]) return K_TABLE[0][1];
  if (BlRatio >= K_TABLE[K_TABLE.length - 1][0])
    return K_TABLE[K_TABLE.length - 1][1];

  for (let i = 0; i < K_TABLE.length - 1; i++) {
    const [x1, y1] = K_TABLE[i];
    const [x2, y2] = K_TABLE[i + 1];
    if (BlRatio >= x1 && BlRatio <= x2) {
      const t = (BlRatio - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return K_TABLE[K_TABLE.length - 1][1];
}

// ─── Impact Factor Calculations ───────────────────────────────────────────────
function impactFactorIRC6(L: number): number {
  // IRC:6 Cl.208
  if (L <= 3) return 50; // 50%
  if (L <= 45) return (1 + 4.5 / (6 + L)) * 100;
  return 10; // 10%
}

function impactFactorAstra(L: number): number {
  // ASTRA linear interpolation: 25% at 5m → 10% at 9m
  if (L <= 5) return 25;
  if (L >= 9) return 10;
  return 25 - ((25 - 10) / (9 - 5)) * (L - 5);
}

// ─── Main IRC Slab Design Function ───────────────────────────────────────────
export function designIRCSlab(inp: IRCSlabInputs): IRCSlabResult {
  const warnings: string[] = [];
  const fck = getFck(inp.concreteGrade);
  const fy = getFy(inp.steelGrade);
  const sigmaCb = getSigmaCb(inp.concreteGrade);
  const sigmaSt = getSigmaSt(inp.steelGrade);
  const m = 10; // modular ratio (working stress)
  const Q = 1.11; // lever arm factor

  // ── Effective depth
  const effectiveDepth = inp.slabThickness - inp.cover - inp.barDia / 2;

  // ── Effective span (IRC 21:2000)
  const option1 = inp.clearSpan + effectiveDepth / 1000; // clear span + effective depth
  const option2 = inp.clearSpan + inp.supportWidth; // centre-to-centre supports
  const effectiveSpan = Math.min(option1, option2);

  // ── Dead load
  const slabSelfWeight = (inp.slabThickness / 1000) * inp.concreteUW;
  const wearingCoatWeight = (inp.wearingCoatThickness / 1000) * inp.wearingCoatUW;
  const totalDL = slabSelfWeight + wearingCoatWeight;
  const deadLoadMoment = (totalDL * effectiveSpan * effectiveSpan) / 8;

  // ── Impact factor
  const impactFactor =
    inp.impactMethod === "astra_linear"
      ? impactFactorAstra(effectiveSpan)
      : impactFactorIRC6(effectiveSpan);

  // ── Live load dispersion (45° through slab + wearing course)
  const dispersedLength =
    inp.a1 + 2 * ((inp.slabThickness + inp.wearingCoatThickness) / 1000);
  const dispersedWidthBw = inp.b1 + 2 * (inp.wearingCoatThickness / 1000);

  // ── Effective width (IRC 21:2000)
  // For maximum moment, place load at midspan: x = l/2
  const x = effectiveSpan / 2;
  const B = inp.carriagewayWidth + 2 * inp.footpathWidth;
  const BlRatio = B / effectiveSpan;
  const Kfactor = interpolateK(BlRatio);
  const effectiveWidthBe = Kfactor * x * (1 - x / effectiveSpan) + dispersedWidthBw;

  // ── Total width with 45° dispersal
  const totalWidthWd = effectiveWidthBe + inp.b2;

  // ── Total live load with impact
  const totalLiveLoadWithImpact = inp.totalLiveLoad * (1 + impactFactor / 100);
  const liveLoadPerUnitArea =
    totalLiveLoadWithImpact / (dispersedLength * totalWidthWd);

  // ── Live load moment
  const liveLoadMoment =
    ((liveLoadPerUnitArea * dispersedLength) / 2) * (effectiveSpan / 2) -
    ((liveLoadPerUnitArea * dispersedLength) / 2) * (dispersedLength / 4);

  // ── Design moment
  const designMoment = deadLoadMoment + liveLoadMoment;

  // ── Required effective depth (working stress)
  const requiredDepth = Math.sqrt(
    (designMoment * 1e6) / (Q * 1000),
  );

  // ── Lever arm
  const leverArmJ =
    0.5 +
    Math.sqrt(
      0.25 -
        (designMoment * 1e6) / (0.87 * fck * 1000 * effectiveDepth * effectiveDepth),
    );

  // ── Required steel (working stress)
  const requiredSteel = (designMoment * 1e6) / (sigmaSt * leverArmJ * effectiveDepth);

  // ── Bar spacing
  const barArea = (Math.PI * inp.barDia * inp.barDia) / 4;
  let spacing = Math.floor((barArea * 1000) / requiredSteel / 5) * 5;
  spacing = Math.max(75, Math.min(300, spacing));
  const providedSteel = (barArea * 1000) / spacing;

  if (effectiveDepth < requiredDepth) {
    warnings.push(
      `Provided effective depth (${effectiveDepth.toFixed(0)} mm) less than required (${requiredDepth.toFixed(0)} mm)`,
    );
  }

  // ── Distribution steel (0.2×M1 + 0.3×M2)
  const distributionMoment = 0.2 * deadLoadMoment + 0.3 * liveLoadMoment;
  const distributionEffectiveDepth = effectiveDepth - inp.barDia;
  const distributionSteel =
    (distributionMoment * 1e6) /
    (sigmaSt * leverArmJ * distributionEffectiveDepth);
  let distSpacing = Math.floor((barArea * 1000) / distributionSteel / 5) * 5;
  distSpacing = Math.max(75, Math.min(300, distSpacing));

  // ── Shear force
  // For maximum shear, place load at support
  const xShear = dispersedLength / 2;
  const effectiveWidthShear =
    Kfactor * xShear * (1 - xShear / effectiveSpan) + dispersedWidthBw;
  const totalWidthShear = effectiveWidthShear + inp.b2;
  const liveLoadShear =
    (liveLoadPerUnitArea * dispersedLength * 2 * dispersedWidthBw) / effectiveSpan;
  const deadLoadShear = (totalDL * effectiveSpan) / 2;
  const totalShear = liveLoadShear + deadLoadShear;

  // ── Shear stress
  const shearStress = (totalShear * 100) / (1000 * effectiveDepth); // N/mm²
  const K1 = Math.max(0.5, 1.14 - 0.7 * (effectiveDepth / 1000));
  const percentageSteel = (providedSteel * 100) / (1000 * effectiveDepth);
  const K2 = Math.min(1.0, 0.5 + 0.25 * percentageSteel);
  const tauCoMap: Record<ConcreteGrade, number> = {
    M15: 0.28,
    M20: 0.34,
    M25: 0.40,
    M30: 0.45,
    M35: 0.50,
    M40: 0.50,
  };
  const tauCo = tauCoMap[inp.concreteGrade];
  const tauC = K1 * K2 * tauCo;
  const shearStatus = tauC >= shearStress ? "OK" : "FAIL";

  return {
    inputs: inp,
    effectiveDepth,
    effectiveSpan,
    slabSelfWeight,
    wearingCoatWeight,
    totalDL,
    deadLoadMoment,
    impactFactor,
    dispersedLength,
    dispersedWidthBw,
    Kfactor,
    effectiveWidthBe,
    totalWidthWd,
    totalLiveLoadWithImpact,
    liveLoadPerUnitArea,
    liveLoadMoment,
    designMoment,
    fck,
    fy,
    sigmaCb,
    sigmaSt,
    m,
    Q,
    requiredDepth,
    leverArmJ,
    requiredSteel,
    barSpacing: spacing,
    providedSteel,
    distributionMoment,
    distributionSteel,
    distributionSpacing: distSpacing,
    shearForce: totalShear,
    shearStress,
    K1,
    K2,
    tauCo,
    tauC,
    shearStatus,
    warnings,
  };
}

// ─── Default Inputs (from ASTRA example) ───────────────────────────────────────
export const DEFAULT_IRC_SLAB: IRCSlabInputs = {
  slabName: "IRC Slab Bridge - ASTRA Example",
  concreteGrade: "M25",
  steelGrade: "Fe415",
  clearSpan: 8.25,
  supportWidth: 0.45,
  slabThickness: 800,
  wearingCoatThickness: 80,
  carriagewayWidth: 4.57,
  footpathWidth: 0,
  cover: 30,
  barDia: 20,
  a1: 3.6,
  b1: 0.85,
  b2: 1.2,
  totalLiveLoad: 700,
  concreteUW: 24,
  wearingCoatUW: 22,
  impactMethod: "astra_linear",
};
