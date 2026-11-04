/**
 * Stability — pier and abutment stability models.
 *
 * PROVENANCE: this module is a faithful port of the stability arithmetic in
 * `bridge-excel-generator/design-engine.ts` (`calculatePierDesign` load-case
 * block + footing bearing pressures, and `calculateAbutmentDesign`), including
 * the helpers `designWindPressure`, `seismicCoefficient`, `skewMomentProjection`
 * and the coefficient registries `DESIGN_CONSTANTS` / `STABILITY_ACCEPTANCE`.
 *
 * It is copied rather than imported for two reasons:
 *   1. `lib/engine` has a hard constraint of ZERO outward dependencies — it must
 *      not import from `bridge-excel-generator/` (or `client/`, or `server/`).
 *   2. `bridge-excel-generator/design-engine.ts` is the ADR-0013-locked
 *      `authoritativeEngine`; importing from it would couple this package to a
 *      byte-locked artefact and force a `lock:engine` update on every edit here.
 *
 * The locked engine bytes are untouched by this file. Drift risk is therefore
 * accepted until the consolidation move completes; PARITY-DIFF records it.
 *
 * References: IRC:6-2016 (loads, current force, retaining-structure factoring),
 * IRC:6-2017 §209 (wind), IRC:78-2000 §706 (passive resistance), IS:1893:2002
 * (seismic zone factor and horizontal coefficient).
 */

// ---------------------------------------------------------------------------
// Coefficient registries
// ---------------------------------------------------------------------------

/** IS:1893:2002 Table 2 zone factors. */
export const SEISMIC_ZONE_FACTOR: Record<number, number> = {
  2: 0.1, // Zone II  — Low
  3: 0.16, // Zone III — Moderate
  4: 0.24, // Zone IV  — Severe
  5: 0.36, // Zone V   — Very Severe
};

/** Subset of `DESIGN_CONSTANTS` used by the stability model. */
export const STABILITY_CONSTANTS = {
  /** μ — IRC:6-2016 Annex B, Table B.1, medium gravel, lower bound of 0.45…0.60. */
  BASE_FRICTION_COEFFICIENT: 0.5,
  /** Passive earth resistance cap as a fraction of the friction term — IRC:78-2000 §706. */
  PASSIVE_RESISTANCE_CAP_FRACTION: 0.5,
} as const;

/** IRC:6 stability acceptance limits. A sole source in the engine. */
export const STABILITY_ACCEPTANCE = {
  slidingFosMin: 1.5,
  overturningFosMin: 1.8,
  /** bearingFosMin: 1.0 — plain pressure ≤ SBC check. */
  bearingFosMin: 1.0,
} as const;

/** Design vehicle load taken per running metre of pier width — IRC:6 lane idealisation. */
export const LIVE_LOAD_PER_METRE_KN_PER_M = 50;
/** Deck reaction delivered to each abutment head in this hand model. */
export const ABUTMENT_DECK_LIVE_LOAD_KN = 100;
/** Retained surcharge behind the abutment — IRC:6 traffic surcharge, kN/m². */
export const ABUTMENT_SURCHARGE_KN_PER_M2 = 10;
/** Concrete unit weight for self-weight of RC substructures, kN/m³. */
export const CONCRETE_UNIT_WEIGHT_KN_PER_M3 = 25;
/** Water unit weight, kN/m³, as used throughout the generator. */
export const WATER_UNIT_WEIGHT_KN_PER_M3 = 9.81;
/** Drag coefficient for a rectangular pier — IRC:6-2016 Table 5. */
export const PIER_DRAG_COEFFICIENT = 0.66;
/** Wind force coefficient for a bluff body — IRC:6-2017 §209. */
export const WIND_FORCE_COEFFICIENT = 1.3;

export type StabilityStatus = "SAFE" | "UNSAFE" | "CHECK";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface SkewProjection {
  skewDeg: number;
  momentFactor: number; // de-rated multiplier applied to the global resultant moment
  level: "OK" | "WARNING" | "ENGINEER_REVIEW";
  rationale: string;
}

/**
 * Bounded cos / cos² / cos³ projection of the horizontal resultant onto the
 * pier's strong axis for a given skew angle.
 */
export function skewMomentProjection(skewDeg: number): SkewProjection {
  const a = Math.max(0, Math.min(59.9, skewDeg ?? 0));
  const r = (a * Math.PI) / 180;
  if (a < 30) {
    return {
      skewDeg: a,
      momentFactor: Math.cos(r),
      level: "OK",
      rationale: `α = ${a.toFixed(1)}° < 30°; M_strong = M_total · cos(α)`,
    };
  }
  if (a < 45) {
    return {
      skewDeg: a,
      momentFactor: Math.cos(r) ** 2,
      level: "WARNING",
      rationale:
        `α = ${a.toFixed(1)}° ∈ [30, 45)°; M_strong = M_total · cos²(α) ` +
        `(MORTH band B — weak-axis shear & torsion not modelled)`,
    };
  }
  return {
    skewDeg: a,
    momentFactor: Math.cos(r) ** 3,
    level: "ENGINEER_REVIEW",
    rationale:
      `α = ${a.toFixed(1)}° ∈ [45, 60)°; M_strong = M_total · cos³(α) ` +
      `— EXPLICIT ENGINEER SIGN-OFF required (IRC SP:13 Appendix C)`,
  };
}

/**
 * IRC:6-2017 §209 / IS:875 Part-3 wind pressure. Returns Pz in kN/m².
 */
export function designWindPressure(Vb: number, k1 = 1.0, k2 = 0.91, k3 = 1.0): number {
  const Vz = Vb * k1 * k2 * k3; // design wind speed (m/s)
  return (0.6 * Vz * Vz) / 1000; // kN/m² (0.6·Vz² Pa → ÷1000)
}

/**
 * IS:1893:2002 horizontal seismic coefficient Ah for bridges.
 */
export function seismicCoefficient(zone: number, R = 3, I = 1.5): number {
  const Z = SEISMIC_ZONE_FACTOR[zone] ?? SEISMIC_ZONE_FACTOR[3];
  const Sa_g = 2.5;
  return (Z / 2) * Sa_g / (R / I);
}

// ---------------------------------------------------------------------------
// PIER STABILITY
// ---------------------------------------------------------------------------

export interface PierStabilityInputs {
  pierWidth: number; // m
  pierLength: number; // m
  pierDepth: number; // m
  pierBaseWidth: number; // m
  pierBaseLength: number; // m
  spanLength: number; // m
  bedLevel: number; // m MSL
  rtl: number; // m MSL — road top level
  sbc: number; // kN/m²
  designWaterLevel: number; // m MSL (from hydraulics)
  velocity: number; // m/s (from hydraulics)
  designWindSpeed?: number;
  seismicZone?: number;
  phi?: number; // ° — passive resistance soil friction angle
  gamma?: number; // kN/m³ — passive resistance soil unit weight
  skew?: number; // °
}

export interface LoadCase {
  caseNumber: number;
  description: string;
  deadLoadFactor: number;
  liveLoadFactor: number;
  windLoadFactor: number;
  buoyancyFactor: number;
  seismicLoadFactor: number;
  verticalForce: number;
  horizontalForce: number;
  moment: number;
  slidingFOS: number;
  overturningFOS: number;
  bearingFOS: number;
  passiveResistance: number;
  status: StabilityStatus;
}

export interface PierStabilityResult {
  geometry: {
    width: number;
    length: number;
    depth: number;
    baseWidth: number;
    baseLength: number;
    spacing: number;
  };
  loads: {
    deadLoad: number;
    liveLoad: number;
    waterPressure: number;
    hydrostaticForce: number;
    dragForce: number;
    buoyancy: number;
    windForce: number;
    seismicForce: number;
    totalHorizontalForce: number;
  };
  loadCases: LoadCase[];
  footing: {
    basePressure: { max: number; min: number; distribution: number[] };
  };
  stabilityAcceptance: typeof STABILITY_ACCEPTANCE;
}

const PIER_LOAD_COMBINATIONS = [
  // desc                                     dl    ll    wind  seis  buoy
  { desc: "Service Condition (DL+LL)", dl: 1.0, ll: 1.0, wind: 0.0, seis: 0.0, buoy: 1.0 },
  { desc: "Construction Stage (DL+Wind)", dl: 1.0, ll: 0.0, wind: 1.0, seis: 0.0, buoy: 0.0 },
  { desc: "Flood Condition (DL+Hydro)", dl: 1.0, ll: 0.0, wind: 0.0, seis: 0.0, buoy: 1.0 },
  { desc: "Seismic Condition (DL+LL+Seismic)", dl: 1.0, ll: 0.25, wind: 0.0, seis: 1.0, buoy: 1.0 },
  { desc: "Ultimate Limit State (ULS)", dl: 1.35, ll: 1.5, wind: 0.9, seis: 0.0, buoy: 1.0 },
];

export function computePierStability(input: PierStabilityInputs): PierStabilityResult {
  const geometry = {
    width: input.pierWidth,
    length: input.pierLength,
    depth: input.pierDepth,
    baseWidth: input.pierBaseWidth,
    baseLength: input.pierBaseLength,
    spacing: input.spanLength,
  };

  // ── Loads ─────────────────────────────────────────────────────────────────
  const concreteDensity = CONCRETE_UNIT_WEIGHT_KN_PER_M3;
  const pierVolume = input.pierWidth * input.pierLength * input.pierDepth;
  const deadLoad = pierVolume * concreteDensity;
  const liveLoad = LIVE_LOAD_PER_METRE_KN_PER_M * input.spanLength;

  const waterDepth = input.designWaterLevel - input.bedLevel;

  const waterPressure = WATER_UNIT_WEIGHT_KN_PER_M3 * waterDepth;
  const hydrostaticForce = 0.5 * waterPressure * waterDepth * input.pierLength;

  const dragCoeff = PIER_DRAG_COEFFICIENT;
  const dragForce =
    0.5 * dragCoeff * WATER_UNIT_WEIGHT_KN_PER_M3 * input.velocity ** 2 * waterDepth * input.pierLength;

  const submergedVolume = input.pierWidth * input.pierLength * waterDepth;
  const buoyancy = WATER_UNIT_WEIGHT_KN_PER_M3 * submergedVolume;

  const Vb = input.designWindSpeed ?? 33;
  const Pz = designWindPressure(Vb);
  const Cf = WIND_FORCE_COEFFICIENT;
  const pierExposedHeight = Math.max(0, input.rtl - input.bedLevel - waterDepth);
  const AePier = input.pierWidth * Math.max(waterDepth + pierExposedHeight, input.pierDepth);
  const windForce = Pz * Cf * AePier;

  const zone = input.seismicZone ?? 3;
  const Ah = seismicCoefficient(zone);
  const totalWeight = deadLoad + liveLoad;
  const seismicForce = Ah * totalWeight;

  const totalHorizontalForce = hydrostaticForce + dragForce + windForce;

  const pierSkew = skewMomentProjection(input.skew ?? 0);

  // ── Load cases ────────────────────────────────────────────────────────────
  const loadCases: LoadCase[] = [];
  const frictionCoeff = STABILITY_CONSTANTS.BASE_FRICTION_COEFFICIENT;
  const phi = input.phi ?? 30;
  const gamma = input.gamma ?? 18;
  const Kp = Math.tan((45 + phi / 2) * Math.PI / 180) ** 2;

  PIER_LOAD_COMBINATIONS.forEach((combo, idx) => {
    const verticalForce = combo.dl * deadLoad + combo.ll * liveLoad - combo.buoy * buoyancy;
    const horizontalForce =
      hydrostaticForce + dragForce + combo.wind * windForce + combo.seis * seismicForce;
    const moment = horizontalForce * (waterDepth / 3) * pierSkew.momentFactor;

    const passiveResistance = Math.min(
      0.5 * Kp * gamma * input.pierDepth ** 2 * input.pierBaseLength,
      STABILITY_CONSTANTS.PASSIVE_RESISTANCE_CAP_FRACTION * frictionCoeff * Math.abs(verticalForce),
    );
    const slidingFOS =
      (frictionCoeff * Math.abs(verticalForce) + passiveResistance) / Math.max(horizontalForce, 1);
    const leverArm = input.pierBaseLength / 2;
    const restoreMoment = Math.abs(verticalForce) * leverArm;
    const overturningFOS = restoreMoment / Math.max(moment, 1);
    const baseArea = input.pierBaseWidth * input.pierBaseLength;
    const basePressure = Math.abs(verticalForce) / baseArea;
    const bearingFOS = input.sbc / Math.max(basePressure, 1);

    const status: StabilityStatus =
      slidingFOS >= STABILITY_ACCEPTANCE.slidingFosMin &&
      overturningFOS >= STABILITY_ACCEPTANCE.overturningFosMin &&
      bearingFOS >= STABILITY_ACCEPTANCE.bearingFosMin
        ? "SAFE"
        : "UNSAFE";

    loadCases.push({
      caseNumber: idx + 1,
      description: combo.desc,
      deadLoadFactor: combo.dl,
      liveLoadFactor: combo.ll,
      windLoadFactor: combo.wind,
      buoyancyFactor: combo.buoy,
      seismicLoadFactor: combo.seis,
      verticalForce,
      horizontalForce,
      moment,
      slidingFOS,
      overturningFOS,
      bearingFOS,
      passiveResistance,
      status,
    });
  });

  // ── Footing bearing pressures (trapezoidal distribution) ──────────────────
  const govCase = loadCases[0]; // Service condition governs bearing
  const baseArea = input.pierBaseWidth * input.pierBaseLength;
  const Sx = (input.pierBaseLength * input.pierBaseWidth ** 2) / 6;
  const pMax = govCase.verticalForce / baseArea + govCase.moment / Sx;
  const pMin = govCase.verticalForce / baseArea - govCase.moment / Sx;
  const distribution = Array.from({ length: 7 }, (_, i) => pMin + ((pMax - pMin) * i) / 6);

  return {
    geometry,
    loads: {
      deadLoad,
      liveLoad,
      waterPressure,
      hydrostaticForce,
      dragForce,
      buoyancy,
      windForce,
      seismicForce,
      totalHorizontalForce,
    },
    loadCases,
    footing: { basePressure: { max: pMax, min: pMin, distribution } },
    stabilityAcceptance: STABILITY_ACCEPTANCE,
  };
}

// ---------------------------------------------------------------------------
// ABUTMENT STABILITY
// ---------------------------------------------------------------------------

export interface AbutmentStabilityInputs {
  abutmentWidth: number; // m
  abutmentDepth: number; // m
  abutmentHeight: number; // m
  dirtWallHeight: number; // m
  returnWallLength: number; // m
  phi: number; // ° — soil friction angle
  gamma: number; // kN/m³ — soil unit weight
  sbc: number; // kN/m²
  designWindSpeed?: number;
  seismicZone?: number;
  skew?: number; // °
}

export interface AbutmentLoadCase extends LoadCase {
  earthPressureFactor: number;
  surchargeFactor: number;
}

export interface AbutmentStabilityResult {
  geometry: {
    height: number;
    width: number;
    depth: number;
    baseWidth: number;
    baseLength: number;
    dirtWallHeight: number;
    returnWallLength: number;
  };
  earthPressure: { ka: number; pa: number; location: number };
  loads: {
    deadLoad: number;
    liveLoad: number;
    earthPressure: number;
    soilSurcharge: number;
    waterPressure: number;
  };
  additionalActions: {
    surchargeIntensity: number;
    surchargeThrust: number;
    basicWindSpeed: number;
    designWindPressure: number;
    windForce: number;
    seismicZoneFactor: number;
    seismicCoefficient: number;
    seismicForce: number;
    earthResultantHeight: number;
    lateralResultantHeight: number;
  };
  loadCases: AbutmentLoadCase[];
  stabilityAcceptance: typeof STABILITY_ACCEPTANCE;
}

const ABUTMENT_LOAD_COMBINATIONS = [
  { desc: "Service Condition (DL+LL+EP×1.0+Surcharge)", dl: 1.0, ll: 1.0, earth: 1.0, surch: 1.0, wind: 0.0, seis: 0.0 },
  { desc: "Construction Stage (DL+EP×1.0+Wind, no LL)", dl: 1.0, ll: 0.0, earth: 1.0, surch: 0.0, wind: 1.0, seis: 0.0 },
  { desc: "Flood Condition (DL+EP×1.5, no LL — submerged backfill, hydro uplift)", dl: 1.0, ll: 0.0, earth: 1.5, surch: 0.0, wind: 0.0, seis: 0.0 },
  { desc: "Seismic Condition (DL+0.25LL+EP×1.0+Seismic)", dl: 1.0, ll: 0.25, earth: 1.0, surch: 1.0, wind: 0.0, seis: 1.0 },
  { desc: "Ultimate Limit State (1.35DL+1.5LL+EP×1.5+0.9Wind)", dl: 1.35, ll: 1.5, earth: 1.5, surch: 1.0, wind: 0.9, seis: 0.0 },
];

export function computeAbutmentStability(input: AbutmentStabilityInputs): AbutmentStabilityResult {
  const geometry = {
    height: input.abutmentHeight,
    width: input.abutmentWidth,
    depth: input.abutmentDepth,
    baseWidth: input.abutmentWidth + 1.5,
    baseLength: input.abutmentDepth + 1.0,
    dirtWallHeight: input.dirtWallHeight,
    returnWallLength: input.returnWallLength,
  };

  // Earth pressure (Rankine's theory)
  const phiRad = (input.phi * Math.PI) / 180;
  const ka = Math.tan(Math.PI / 4 - phiRad / 2) ** 2;
  const pa = 0.5 * ka * input.gamma * input.abutmentHeight ** 2;
  const location = input.abutmentHeight / 3;

  // Loads
  const abutmentVolume = input.abutmentWidth * input.abutmentDepth * input.abutmentHeight;
  const deadLoad = abutmentVolume * CONCRETE_UNIT_WEIGHT_KN_PER_M3;
  const liveLoad = ABUTMENT_DECK_LIVE_LOAD_KN;
  const earthPressure = pa;
  const soilSurcharge = ABUTMENT_SURCHARGE_KN_PER_M2 * input.abutmentHeight;
  const waterPressure = 0;

  const Vb = input.designWindSpeed ?? 33;
  const pz = designWindPressure(Vb);
  const windForce = pz * WIND_FORCE_COEFFICIENT * geometry.width * geometry.height;

  const zone = input.seismicZone ?? 3;
  const zoneFactor = SEISMIC_ZONE_FACTOR[zone] ?? SEISMIC_ZONE_FACTOR[3];
  const ah = seismicCoefficient(zone);
  const seismicForce = ah * (deadLoad + liveLoad);

  const surchargeThrust = ka * soilSurcharge;

  const abutSkew = skewMomentProjection(input.skew ?? 0);

  const loadCases: AbutmentLoadCase[] = [];
  const frictionCoeff = STABILITY_CONSTANTS.BASE_FRICTION_COEFFICIENT;

  ABUTMENT_LOAD_COMBINATIONS.forEach((combo, idx) => {
    const verticalForce = combo.dl * deadLoad + combo.ll * liveLoad;
    const horizontalForce =
      combo.earth * earthPressure +
      combo.surch * surchargeThrust +
      combo.wind * windForce +
      combo.seis * seismicForce;
    const moment =
      ((combo.earth * earthPressure + combo.surch * surchargeThrust) * location +
        (combo.wind * windForce + combo.seis * seismicForce) * (geometry.height / 2)) *
      abutSkew.momentFactor;

    const slidingFOS = (frictionCoeff * Math.abs(verticalForce)) / Math.max(horizontalForce, 1);
    const restoreMoment = Math.abs(verticalForce) * (geometry.baseWidth / 2);
    const overturningFOS = restoreMoment / Math.max(moment, 1);
    const basePressure = Math.abs(verticalForce) / (geometry.baseWidth * geometry.baseLength);
    const bearingFOS = input.sbc / Math.max(basePressure, 1);

    const status: StabilityStatus =
      slidingFOS >= STABILITY_ACCEPTANCE.slidingFosMin &&
      overturningFOS >= STABILITY_ACCEPTANCE.overturningFosMin &&
      bearingFOS >= STABILITY_ACCEPTANCE.bearingFosMin
        ? "SAFE"
        : "UNSAFE";

    loadCases.push({
      caseNumber: idx + 1,
      description: combo.desc,
      deadLoadFactor: combo.dl,
      liveLoadFactor: combo.ll,
      windLoadFactor: combo.wind,
      buoyancyFactor: 0.0,
      seismicLoadFactor: combo.seis,
      earthPressureFactor: combo.earth,
      surchargeFactor: combo.surch,
      verticalForce,
      horizontalForce,
      moment,
      slidingFOS,
      overturningFOS,
      bearingFOS,
      passiveResistance: 0,
      status,
    });
  });

  return {
    geometry,
    earthPressure: { ka, pa, location },
    loads: { deadLoad, liveLoad, earthPressure, soilSurcharge, waterPressure },
    additionalActions: {
      surchargeIntensity: ABUTMENT_SURCHARGE_KN_PER_M2,
      surchargeThrust,
      basicWindSpeed: Vb,
      designWindPressure: pz,
      windForce,
      seismicZoneFactor: zoneFactor,
      seismicCoefficient: ah,
      seismicForce,
      earthResultantHeight: location,
      lateralResultantHeight: geometry.height / 2,
    },
    loadCases,
    stabilityAcceptance: STABILITY_ACCEPTANCE,
  };
}
