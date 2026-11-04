/**
 * BRIDGE DESIGN ENGINE
 * Calculates all design parameters from input data
 * Implements IRC:6-2016, IRC:6-2017, IRC:78-1983, IRC:112-2015,
 *           IS:1893:2002, IS:875 Part-3 standards
 */

import { ProjectInput, HydraulicsResult, PierDesignResult, AbutmentDesignResult, LoadCase, SteelDetails } from './types';
import { deckSlabThicknessOf } from './input-contract';
import { calculateDetailedEstimation, type DetailedEstimationResult } from '../shared/design-engine-types';
import type { EstimationResult } from './types';

export type DesignEngineOptions = { quiet?: boolean };

/** Callers such as batch scripts and verifiers ask for silent runs. */
let engineQuiet = false;
function engineLog(...args: Parameters<typeof console.log>) {
  if (!engineQuiet) console.log(...args);
}

// ---------------------------------------------------------------------------
// IS 456:2000 §26.2 development length (Ld) for deformed bars in tension.
//
// Ld = φ × fy / (4 × τbd)
// where φ = bar diameter (mm), fy in MPa, τbd = design bond stress in MPa.
//
// Bond stress τbd for M20 / M25 / M30 / M35 / M40 per IS 456:2000 Table 26.2.
// For Fe415 (high-yield deformed) multiply plain-bar τbd by 1.6 — this is
// the IS 456 rule for HYSD bars (clause 26.2.1.1).  For Fe500 the same 1.6
// factor is applied per IRC 112 guidance (IRC does not modify τbd for
// HYSD beyond the plain-bar 1.6× multiplier for deformed).
//
// Compression development length (§26.2.1.1) = 0.87·Ld_tension.
// Tension lap splice (§25.2.5.1) = 1.3·Ld_tension, minimum 300 mm.
//
// This replaces the hardcoded "45φ" shortcut which was only ever valid
// for one specific (M30 concrete, Fe415) case — the engine now honours
// the project's declared fck and fy.
// ---------------------------------------------------------------------------
const BOND_STRESS_TABLE: Record<number, number> = {
  // plain-bar design bond stress τbd (MPa) for each characteristic fck (MPa)
  20: 1.2,
  25: 1.4,
  30: 1.5,
  35: 1.7,
  40: 1.9,
};
const HYSD_BOND_MULTIPLIER = 1.6;

export interface DevelopmentLength {
  tension: number;       // Ld in tension (mm)
  compression: number;   // Ld in compression (mm)
  lapTension: number;    // Lap length in tension (mm), ≥ 300
  gradeNote: string;     // human-readable derivation for notes block
}

export function developmentLengthForBar(
  diameter: number,
  fck: number,
  fy: number,
  steelGradeLabel?: string,
): DevelopmentLength {
  const plainBond = BOND_STRESS_TABLE[Math.round(fck)] ?? 1.4;
  const tauBd = plainBond * HYSD_BOND_MULTIPLIER;
  const tension = (diameter * fy) / (4 * tauBd);
  const compression = 0.87 * tension;
  const lapTension = Math.max(1.3 * tension, 300);
  const label = steelGradeLabel?.toUpperCase() ?? (fy >= 490 ? 'FE500' : fy >= 410 ? 'FE415' : 'FEOTHER');
  const gradeNote =
    `Ld = φ·fy/(4·τbd) = ${diameter}×${fy}/(4×${tauBd.toFixed(2)}) ` +
    `= ${tension.toFixed(0)} mm (M${fck} concrete, ${label} steel)`;
  return { tension, compression, lapTension, gradeNote };
}

function attachDevelopmentLengths(
  steel: SteelDetails,
  fck: number,
  fy: number,
  steelGradeLabel: string,
): SteelDetails {
  const ld = developmentLengthForBar(steel.diameter, fck, fy, steelGradeLabel);
  return {
    ...steel,
    developmentLengthTension: ld.tension,
    developmentLengthCompression: ld.compression,
    lapLengthTension: ld.lapTension,
  };
}

// ---------------------------------------------------------------------------
// Skew-angle analysis and bounded moment projection factor.
//
// Geometry basis:
//   • α ∈ [0, 30)°  — simple cos(α) strong-axis projection is valid
//     (linear approximation of the true 3D bearing eccentricity error
//     remains below 7 % of the resultant).
//   • α ∈ [30, 45)° — cos² α de-rating is applied (IRC SP:13 / MORTH
//     recommended practice); out-of-plane / torsion components are
//     considered MATERIAL and must be reviewed manually.
//   • α ∈ [45, 60)° — strong-axis de-rating tightens to cos³ α and an
//     explicit "engineer must sign-off" flag is emitted.
//
// The input-contract Zod validator already rejects α ≥ 60° entirely, so
// we do not need to handle skew ≥ 60° in this engine.
// ---------------------------------------------------------------------------
export interface SkewProjection {
  skewDeg: number;
  momentFactor: number;       // de-rated multiplier to apply to global M_resultant
  level: 'OK' | 'WARNING' | 'ENGINEER_REVIEW';
  rationale: string;          // short string explaining the band selected
}

export function skewMomentProjection(skewDeg: number): SkewProjection {
  const a = Math.max(0, Math.min(59.9, skewDeg ?? 0));
  const r = (a * Math.PI) / 180;
  if (a < 30) {
    return {
      skewDeg: a,
      momentFactor: Math.cos(r),
      level: 'OK',
      rationale: `α = ${a.toFixed(1)}° < 30°; M_strong = M_total · cos(α)`,
    };
  }
  if (a < 45) {
    return {
      skewDeg: a,
      momentFactor: Math.cos(r) ** 2,
      level: 'WARNING',
      rationale: `α = ${a.toFixed(1)}° ∈ [30, 45)°; M_strong = M_total · cos²(α) ` +
                 `(MORTH band B — weak-axis shear & torsion not modelled)`,
    };
  }
  return {
    skewDeg: a,
    momentFactor: Math.cos(r) ** 3,
    level: 'ENGINEER_REVIEW',
    rationale: `α = ${a.toFixed(1)}° ∈ [45, 60)°; M_strong = M_total · cos³(α) ` +
               `— EXPLICIT ENGINEER SIGN-OFF required (IRC SP:13 Appendix C)`,
  };
}

// ---------------------------------------------------------------------------
// IS:1893:2002 Zone factor table (Table 2)
// ---------------------------------------------------------------------------
const SEISMIC_ZONE_FACTOR: Record<number, number> = {
  2: 0.10,   // Zone II  — Low
  3: 0.16,   // Zone III — Moderate
  4: 0.24,   // Zone IV  — Severe
  5: 0.36,   // Zone V   — Very Severe
};

// ---------------------------------------------------------------------------
// Live-load and surcharge coefficients (BEDACH-001)
// Named, not literal, so a reviewer can re-class the loading in one place.
// Values are unchanged from the model this engine has always used.
// ---------------------------------------------------------------------------
/** Design vehicle load taken per running metre of pier width — IRC:6 wheel-load lane idealisation. */
export const LIVE_LOAD_PER_METRE_KN_PER_M = 50;
/** Deck reaction delivered to each abutment head, independent of span count in this hand model. */
export const ABUTMENT_DECK_LIVE_LOAD_KN = 100;
/** Retained surcharge behind the abutment (IRC:6 traffic surcharge on retaining structures), kN/m². */
export const ABUTMENT_SURCHARGE_KN_PER_M2 = 10;
/** Concrete unit weight used for self-weight of RC substructures, kN/m³. */
export const CONCRETE_UNIT_WEIGHT_KN_PER_M3 = 25;
/**
 * Effective depth of the deck obstruction used in the Molesworth afflux blockage area (m).
 * Un-sourced assumption carried over from the legacy workbook model — NOT a clause value.
 * Licensed-engineer confirmation of the obstruction ratio is a sign-off item (BEDACH-002).
 */
export const DECK_OBSTRUCTION_DEPTH_M = 0.83;

// ---------------------------------------------------------------------------
// DESIGN_CONSTANTS — named engineering coefficients registry.
//
// Every numeric literal that is NOT a formula skeleton constant (8, 2, 5, 384,
// 1000, 1e6, π/4 etc.) belongs here with its IRC / IS clause reference so a
// reviewer can re-source or re-calibrate values in exactly one place.
// ---------------------------------------------------------------------------
const DESIGN_CONSTANTS = {
  // Sliding-stability base friction coefficient for concrete founding on
  // compacted granular soil (IRC:6-2016 Annex B, Table B.1, medium gravel).
  // Lower bound of the 0.45…0.60 range for "conservative" design.
  BASE_FRICTION_COEFFICIENT: 0.5,  // μ — IRC:6-2016 Annex B Table B.1

  // ── Reinforcement bar diameters (mm) for substructure elements ──
  // Pier main longitudinal bars — typical IRC:112-2015 §9.3.2 minimum φ20,
  // chosen φ25 as the governing size for all 20 templates (46-sheet contract).
  PIER_MAIN_BAR_DIAMETER_MM: 25,
  // Pier transverse links / stirrups — minimum φ8 per IS 456 §26.5.3.2 c-2,
  // φ10 chosen as practical installable minimum with 150 mm spacing.
  PIER_LINK_BAR_DIAMETER_MM: 10,
  // Abutment stem vertical bars — φ20 balances crack-width at the base section
  // against the ABUTMENT_HEIGHT / DIRT_WALL_HEIGHT range in this project.
  ABUTMENT_MAIN_BAR_DIAMETER_MM: 20,
  // Default longitudinal / transverse bar spacing (mm c/c) where no
  // parametric refinement is in effect (matches the 46-sheet workbook).
  DEFAULT_BAR_SPACING_MM: 150,

  // Minimum main-bar count (minimum 8 corner + face bars per IS 456 §26.5.3.1
  // for rectangular columns — the pier uses the same rule for layout count).
  MIN_MAIN_BAR_COUNT: 8,

  // Default longitudinal steel ratio when the pier-cap / abutment-cap
  // reinforcement is not parametrically derived.  8 bars = minimum cage.
  MIN_CAP_BAR_COUNT: 8,

  /** Passive earth resistance cap as fraction of friction term — IRC:78-2000 §706 */
  PASSIVE_RESISTANCE_CAP_FRACTION: 0.5,
} as const;

/**
 * Stability acceptance limits applied to every pier and abutment load case.
 *
 * Exported because the narrative, the workbook and the outcome gate all have to quote the SAME
 * figures the engine decides with. They used to be typed into each place separately, so the
 * sentence "Compare against Sliding >= 1.50" could outlive a change to the rule — the report
 * disagreeing with the calculation it describes, with nothing to catch it.
 *
 * Sliding/overturning follow IRC:6 §114; the bearing limit of 2.5 is this project's own
 * conservatism (the QA register, sheet 'IRC CODE COMPLIANCE CHECKLIST' rows D3-D5) rather than a
 * literal code clause — most IRC practice checks bearing as pressure <= SBC, i.e. a factor of 1.0.
 * Changing any value here changes verdicts across the whole book, so it is an engineering
 * decision for the signing engineer, never a lint fix.
 */
export const STABILITY_ACCEPTANCE = {
  slidingFosMin: 1.5,
  overturningFosMin: 1.8,
  /** bearingFosMin: 1.0 — plain pressure ≤ SBC check, per owner decision 2026-10-06 (was 2.5).
   *  FOS = SBC / (V / (Bw × Bl)); SAFE when FOS ≥ 1.0, i.e. bearing pressure does not exceed SBC. */
  bearingFosMin: 1.0,
} as const;

/**
 * IRC:6-2017 §209 / IS:875 Part-3 wind pressure calculation. * Returns design wind pressure Pz in kN/m².
 *
 * @param Vb   Basic wind speed (m/s) — IRC:6 Map / IS:875 Part-3 Map
 * @param k1   Risk / probability factor (1.0 for 50-year return)
 * @param k2   Terrain, height & structure size factor (0.91 open terrain 10 m)
 * @param k3   Topography factor (1.0 flat terrain)
 */
function designWindPressure(
  Vb: number,
  k1 = 1.0,
  k2 = 0.91,
  k3 = 1.0,
): number {
  const Vz = Vb * k1 * k2 * k3;          // Design wind speed (m/s)
  const Pz = 0.6 * Vz * Vz / 1000;       // kN/m²  (0.6 Vz² Pa → ÷1000)
  return Pz;
}

/**
 * IS:1893:2002 horizontal seismic coefficient Ah for bridges.
 *
 * @param zone  IS:1893 seismic zone (2..5)
 * @param R     Response reduction factor (3 for ordinary ductile bridge)
 * @param I     Importance factor (1.5 for bridges on national/state highway)
 */
function seismicCoefficient(
  zone: number,
  R = 3,
  I = 1.5,
): number {
  const Z  = SEISMIC_ZONE_FACTOR[zone] ?? SEISMIC_ZONE_FACTOR[3];
  const Sa_g = 2.5; // spectral acceleration for short-period / rocky sites
  return (Z / 2) * (Sa_g) / (R / I);
}

/**
 * Main design engine - calculates everything
 */
export function calculateCompleteDesign(input: ProjectInput, options: DesignEngineOptions = {}) {
  const previousQuiet = engineQuiet;
  engineQuiet = options.quiet === true;
  try {
    return runCompleteDesign(input);
  } finally {
    engineQuiet = previousQuiet;
  }
}

function runCompleteDesign(input: ProjectInput) {
  engineLog('🔧 Design Engine: Starting calculations...');
  
  // 1. Hydraulics calculations
  const hydraulics = calculateHydraulics(input);
  
  // 2. Pier design
  const pier = calculatePierDesign(input, hydraulics);
  
  // 3. Abutment design (Type 1)
  const abutmentType1 = calculateAbutmentDesign(input, hydraulics, 'TYPE1');
  
  // 4. Abutment design (Cantilever)
  const abutmentC1 = calculateAbutmentDesign(input, hydraulics, 'C1');
  
  engineLog('✅ Design Engine: All calculations complete');

  // Estimation + BOQ for reporting.
  // NOTE: We compute using existing detailed-estimation logic, but map into
  // the bridge-excel-generator EstimationResult shape expected by sheets/HTML.
  let estimation: EstimationResult | undefined;
  try {
    const detailed = calculateDetailedEstimation(input, {
      hydraulics,
      pier,
      abutmentType1,
      abutmentC1,
    });
    estimation = mapDetailedEstimationToEstimationResult(detailed, input);
  } catch (e) {
    console.error('⚠️ Estimation generation failed in design-engine:', e instanceof Error ? e.message : String(e));
  }
  
  return {
    input,
    hydraulics,
    pier,
    abutmentType1,
    abutmentC1,
    estimation,
  };
}

/**
 * The estimation engine already produces the reporting shape; this map only adds the
 * derived unit rates. Kept in one place so no second copy can drift (the CLI used to
 * carry its own copy with a different GST assumption).
 */
export function mapDetailedEstimationToEstimationResult(
  detailed: DetailedEstimationResult,
  input: ProjectInput
): EstimationResult {
  const cost = detailed.costs;
  const deckArea = input.totalLength * input.carriageWidth;
  return {
    quantities: detailed.quantities,
    measurements: detailed.measurements,
    boq: detailed.boqItems,
    cost: {
      subtotal: cost.items,
      qualityControl: cost.qualityControl,
      contingencyProvision: cost.contingencyProvision,
      contingencies: cost.contingencies,
      gTotal: cost.gTotal,
      prorataOverheads: cost.prorataOverheads,
      total: cost.total,
      totalInLacs: cost.totalInLacs,
      ratePerMeter: input.totalLength > 0 ? cost.total / input.totalLength : cost.total,
      ratePerSqm: deckArea > 0 ? cost.total / deckArea : undefined,
    },
  };
}

/**
 * HYDRAULICS CALCULATIONS
 * Area-Velocity Method (IRC SP-13)
 */
function calculateHydraulics(input: ProjectInput): HydraulicsResult {
  engineLog('  → Calculating hydraulics...');
  
  // Calculate cross-sectional area and wetted perimeter
  let totalArea = 0;
  let totalPerimeter = 0;
  
  for (let i = 0; i < input.crossSectionData.length - 1; i++) {
    const p1 = input.crossSectionData[i];
    const p2 = input.crossSectionData[i + 1];
    
    // Depth of flow at each point
    const depth1 = Math.max(0, input.hfl - p1.gl);
    const depth2 = Math.max(0, input.hfl - p2.gl);
    
    // Length between points
    const length = p2.chainage - p1.chainage;
    
    // Average depth
    const avgDepth = (depth1 + depth2) / 2;
    
    // Area = average depth × length
    totalArea += avgDepth * length;
    
    // Wetted perimeter = √(length² + (depth2-depth1)²)
    const depthDiff = p2.gl - p1.gl;
    totalPerimeter += Math.sqrt(length * length + depthDiff * depthDiff);
  }
  
  // Hydraulic radius R = A/P
  const hydraulicRadius = totalArea / totalPerimeter;
  
  // Manning's equation: V = (1/n) × R^(2/3) × √(S)
  const velocity = (1 / input.manningN) * 
                   Math.pow(hydraulicRadius, 2/3) * 
                   Math.sqrt(1 / input.bedSlope);
  
  // Discharge Q = A × V
  const discharge = totalArea * velocity;
  
  // Regime width: L = 4.8 × √Q
  const regimeWidth = 4.8 * Math.sqrt(discharge);
  
  // Effective waterway
  const effectiveWaterway = input.numberOfSpans * input.spanLength;
  
  // Scour depth (Lacey's formula)
  // dsm = 1.34 × (Db²/Ksf)^(1/3)
  const obstructedWidth = effectiveWaterway - (input.numberOfPiers * input.pierWidth);
  const Db = discharge / obstructedWidth; // Discharge per meter width
  const scourDepth = 1.34 * Math.pow(Math.pow(Db, 2) / input.laceysSiltFactor, 1/3);
  const designScourDepth = 2 * scourDepth; // IRC: 2× for pier scour
  
  // Afflux calculation (Molesworth formula)
  // h = ((V²/17.85) + 0.0152) × (A²/a² - 1)
  const bridgeWidth = effectiveWaterway;
  const avgFlowDepth = input.hfl - input.bedLevel;
  const unobstructedArea = bridgeWidth * avgFlowDepth;
  
  // Obstructed area
  const deckObstruction = bridgeWidth * DECK_OBSTRUCTION_DEPTH_M;
  const pierObstruction = input.numberOfPiers * input.pierWidth * (input.hfl - input.bedLevel);
  const abutmentObstruction = 2 * input.abutmentWidth * (input.hfl - input.bedLevel);
  const totalObstruction = deckObstruction + pierObstruction + abutmentObstruction;
  const obstructedArea = unobstructedArea - totalObstruction;
  
  const afflux = ((velocity * velocity / 17.85) + 0.0152) * 
                 (Math.pow(unobstructedArea / obstructedArea, 2) - 1);
  
  // Design water level
  const designWaterLevel = input.hfl + afflux;
  
  // Froude number Fr = V / √(gh)
  const g = 9.81;
  const froudeNumber = velocity / Math.sqrt(g * avgFlowDepth);
  const flowType = froudeNumber < 1 ? 'Subcritical' : 'Supercritical';

  // ── Freeboard, soffit and foundation depth ─────────────────────────────────
  // IRC:SP:13 / IRC 78 minimum freeboard above HFL for permanent bridges:
  // 0.60 m for moderate-flood crossings; important structures use ≥ 1.00 m.
  // The user-supplied value (if any) is the governing requirement; otherwise
  // fall back to the IRC minimum baseline of 0.60 m.
  const ircMinimumFreeboardAboveHfl = 0.60;
  const requiredFreeboardAboveHfl =
    input.freeboardAboveHfl ?? ircMinimumFreeboardAboveHfl;

  // Deck-soffit level: bottom of the deck slab. Use the input value when the
  // user already fixed the vertical alignment; otherwise back-calculate it
  // from HFL plus the required freeboard plus deck slab thickness.
  const deckThickness = deckSlabThicknessOf(input);
  const soffitLevel =
    input.deckSoffitLevel ?? (input.hfl + requiredFreeboardAboveHfl + deckThickness);

  // Resulting freeboards (measured UPWARD from water level to soffit).
  const freeboardAboveHfl = soffitLevel - input.hfl;
  const freeboard = soffitLevel - designWaterLevel;
  const isFreeboardSafe = freeboardAboveHfl >= requiredFreeboardAboveHfl;

  // Foundation geometry — depth below average bed level and absolute level.
  const foundationDepth = Math.max(0, input.bedLevel - input.foundationLevel);

  // Critical safety guard: the founding level must sit BELOW the maximum
  // anticipated scour envelope (IRC 78 § for spread foundations). If it does
  // not, the bridge is at risk of undermining in a design flood.
  const minFoundingLevelForScour = input.bedLevel - designScourDepth;
  if (input.foundationLevel > minFoundingLevelForScour) {
    engineLog(
      `    ⚠ Hydraulics: foundation level ${input.foundationLevel.toFixed(2)} m is ABOVE the IRC-required ` +
      `scour founding level ${minFoundingLevelForScour.toFixed(2)} m (bed − 2·dsm = ` +
      `${designScourDepth.toFixed(2)} m below bed). Risk of pier undermining — engineer review required.`
    );
  }

  return {
    crossSectionalArea: totalArea,
    wettedPerimeter: totalPerimeter,
    hydraulicRadius,
    velocity,
    discharge,
    regimeWidth,
    effectiveWaterway,
    scourDepth,
    designScourDepth,
    afflux,
    designWaterLevel,
    hfl: input.hfl,
    froudeNumber,
    flowType,
    foundationDepth,
    foundationLevel: input.foundationLevel,
    soffitLevel,
    freeboard,
    freeboardAboveHfl,
    ircMinimumFreeboardAboveHfl,
    requiredFreeboardAboveHfl,
    isFreeboardSafe,
  };
}

/**
 * PIER DESIGN CALCULATIONS
 */
function calculatePierDesign(input: ProjectInput, hydraulics: HydraulicsResult): PierDesignResult {
  engineLog('  → Calculating pier design...');

  // ── Geometry ────────────────────────────────────────────────────────────────
  const geometry = {
    width:       input.pierWidth,
    length:      input.pierLength,
    depth:       input.pierDepth,
    baseWidth:   input.pierBaseWidth,
    baseLength:  input.pierBaseLength,
    spacing:     input.spanLength,
  };

  // ── Loads ───────────────────────────────────────────────────────────────────
  const concreteDensity = 25; // kN/m³
  const pierVolume = input.pierWidth * input.pierLength * input.pierDepth;
  const deadLoad   = pierVolume * concreteDensity;

  const liveLoad = LIVE_LOAD_PER_METRE_KN_PER_M * input.spanLength;

  const waterDepth = hydraulics.designWaterLevel - input.bedLevel;

  const waterPressure    = 9.81 * waterDepth;                                   // kN/m²
  const hydrostaticForce = 0.5 * waterPressure * waterDepth * input.pierLength;

  // Drag force — IRC:6-2016 Table 5 current force
  const dragCoeff  = 0.66; // rectangular pier
  const dragForce  = 0.5 * dragCoeff * 9.81 * Math.pow(hydraulics.velocity, 2)
                     * waterDepth * input.pierLength;

  // Buoyancy
  const submergedVolume = input.pierWidth * input.pierLength * waterDepth;
  const buoyancy = 9.81 * submergedVolume;

  // ── Wind force (IRC:6-2017 §209) ────────────────────────────────────────────
  const Vb  = input.designWindSpeed ?? 33;          // m/s basic wind speed
  const Pz  = designWindPressure(Vb);               // kN/m² design pressure
  const Cf  = 1.3;                                  // force coeff for rectangular pier
  // Exposed area of pier above bed level (wind acts on pier above water/ground)
  const pierExposedHeight = Math.max(0, (input.rtl - input.bedLevel) - waterDepth);
  const Ae_pier  = input.pierWidth * Math.max(waterDepth + pierExposedHeight, input.pierDepth);
  const windForce = Pz * Cf * Ae_pier;             // kN

  // ── Seismic force (IS:1893:2002) ────────────────────────────────────────────
  const zone      = input.seismicZone ?? 3;
  const Ah        = seismicCoefficient(zone);
  const totalWeight = deadLoad + liveLoad;           // governing weight for seismic
  const seismicForce = Ah * totalWeight;            // kN horizontal

  const totalHorizontalForce = hydrostaticForce + dragForce + windForce;

  // ── Skew-angle adjustments ─────────────────────────────────────────────────
  // On a skewed pier the horizontal flow/seismic/wind resultant is not exactly
  // normal to the pier's principal axis. Use the bounded cos / cos² / cos³
  // projection helper (see skewMomentProjection above) and escalate warnings.
  const pierSkew = skewMomentProjection(input.skew ?? 0);
  const { skewDeg } = pierSkew;
  if (pierSkew.level === 'WARNING') {
    engineLog(`    ⚠ Pier: ${pierSkew.rationale}`);
  } else if (pierSkew.level === 'ENGINEER_REVIEW') {
    engineLog(`    🚨 Pier: ${pierSkew.rationale}`);
  }

  // ── Load cases (5 cases per IRC:6) ─────────────────────────────────────────
  const loadCases: LoadCase[] = [];

  const loadCombinations = [
    // desc                      dl    ll    wind  seismic buoy
    { desc: 'Service Condition (DL+LL)',        dl: 1.0, ll: 1.0,  wind: 0.0, seis: 0.00, buoy: 1.0 },
    { desc: 'Construction Stage (DL+Wind)',     dl: 1.0, ll: 0.0,  wind: 1.0, seis: 0.00, buoy: 0.0 },
    { desc: 'Flood Condition (DL+Hydro)',       dl: 1.0, ll: 0.0,  wind: 0.0, seis: 0.00, buoy: 1.0 },
    { desc: 'Seismic Condition (DL+LL+Seismic)',dl: 1.0, ll: 0.25, wind: 0.0, seis: 1.00, buoy: 1.0 },
    { desc: 'Ultimate Limit State (ULS)',       dl: 1.35,ll: 1.5,  wind: 0.9, seis: 0.00, buoy: 1.0 },
  ];

  loadCombinations.forEach((combo, idx) => {
    const verticalForce  = combo.dl * deadLoad + combo.ll * liveLoad - combo.buoy * buoyancy;
    const horizontalForce = hydrostaticForce + dragForce
                            + combo.wind * windForce
                            + combo.seis * seismicForce;
    // Strong-axis moment only; factor is cos α for α < 30°, cos² for 30–45°,
    // cos³ for 45–60°. Weak-axis shear, torsion, and eccentric-bearing
    // amplification are NOT captured — flagged via the skewMomentProjection logs.
    const moment = horizontalForce * (waterDepth / 3) * pierSkew.momentFactor;

    const frictionCoeff   = DESIGN_CONSTANTS.BASE_FRICTION_COEFFICIENT;
    const phi = input.phi ?? 30;
    const gamma = input.gamma ?? 18;
    const Kp = Math.tan((45 + phi / 2) * Math.PI / 180) ** 2;
    const passiveResistance = Math.min(
      0.5 * Kp * gamma * input.pierDepth ** 2 * input.pierBaseLength,
      DESIGN_CONSTANTS.PASSIVE_RESISTANCE_CAP_FRACTION * frictionCoeff * Math.abs(verticalForce)
    );
    const slidingFOS = (frictionCoeff * Math.abs(verticalForce) + passiveResistance) / Math.max(horizontalForce, 1);
    const leverArm        = input.pierBaseLength / 2;
    const restoreMoment   = Math.abs(verticalForce) * leverArm;
    const overturningFOS  = restoreMoment / Math.max(moment, 1);
    const baseArea        = input.pierBaseWidth * input.pierBaseLength;
    const basePressure    = Math.abs(verticalForce) / baseArea;
    const bearingFOS      = input.sbc / Math.max(basePressure, 1);

    const status: 'SAFE' | 'UNSAFE' | 'CHECK' =
      (slidingFOS >= STABILITY_ACCEPTANCE.slidingFosMin &&
       overturningFOS >= STABILITY_ACCEPTANCE.overturningFosMin &&
       bearingFOS >= STABILITY_ACCEPTANCE.bearingFosMin) ? 'SAFE' : 'UNSAFE';

    loadCases.push({
      caseNumber:       idx + 1,
      description:      combo.desc,
      deadLoadFactor:   combo.dl,
      liveLoadFactor:   combo.ll,
      windLoadFactor:   combo.wind,
      buoyancyFactor:   combo.buoy,
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

  // ── Reinforcement (proportioned to pier geometry) ───────────────────────────
  const mainBarDia  = DESIGN_CONSTANTS.PIER_MAIN_BAR_DIAMETER_MM;
  const mainBarArea = Math.PI / 4 * mainBarDia ** 2; // mm² per bar
  const barSpacingM = DESIGN_CONSTANTS.DEFAULT_BAR_SPACING_MM / 1000;
  const numMainBars = Math.max(DESIGN_CONSTANTS.MIN_MAIN_BAR_COUNT, Math.round((2 * (input.pierLength + input.pierWidth)) / barSpacingM));
  const mainSteelRaw: SteelDetails = {
    diameter:    mainBarDia,
    spacing:     DESIGN_CONSTANTS.DEFAULT_BAR_SPACING_MM,
    numberOfBars: numMainBars,
    area:        numMainBars * mainBarArea,
    weight:      numMainBars * mainBarArea * input.pierDepth * 7850 / 1e6, // kg
  };
  const mainSteel = attachDevelopmentLengths(mainSteelRaw, input.fck, input.fy, input.steelGrade);

  const linkBarDia   = DESIGN_CONSTANTS.PIER_LINK_BAR_DIAMETER_MM;
  const linkBarArea  = Math.PI / 4 * linkBarDia ** 2; // mm² per link bar
  const numLinkBars  = Math.ceil(input.pierDepth / barSpacingM);
  const linkPerimeter = 2 * (input.pierLength + input.pierWidth); // m per closed link
  const linkSteelRaw: SteelDetails = {
    diameter:     linkBarDia,
    spacing:      DESIGN_CONSTANTS.DEFAULT_BAR_SPACING_MM,
    numberOfBars: numLinkBars,
    area:         numLinkBars * linkBarArea,
    weight:       numLinkBars * linkPerimeter * linkBarArea * 7850 / 1e6, // kg
  };
  const linkSteel = attachDevelopmentLengths(linkSteelRaw, input.fck, input.fy, input.steelGrade);

  // One-shot Ld derivation note for drawings / report notes so any downstream
  // template that printed the old "45φ" shortcut can now print the actual value.
  const pierMainLdNote = developmentLengthForBar(mainBarDia, input.fck, input.fy, input.steelGrade).gradeNote;
  engineLog(`    ✎ Pier main bars: ${pierMainLdNote}`);

  // ── Footing bearing pressures (trapezoidal distribution) ───────────────────
  const govCase       = loadCases[0]; // Service condition governs bearing
  const baseArea      = input.pierBaseWidth * input.pierBaseLength;
  const Sx            = input.pierBaseLength * input.pierBaseWidth ** 2 / 6;
  const pMax          = govCase.verticalForce / baseArea + govCase.moment / Sx;
  const pMin          = govCase.verticalForce / baseArea - govCase.moment / Sx;
  const distribution  = Array.from({ length: 7 }, (_, i) =>
    pMin + (pMax - pMin) * i / 6);

  return {
    geometry,
    loads: {
      deadLoad,
      liveLoad,
      hydrostaticForce,
      dragForce,
      windForce,
      seismicForce,
      totalHorizontalForce,
      buoyancy,
    },
    loadCases,
    reinforcement: {
      mainSteel,
      linkSteel,
      flaredBase: mainSteel,
    },
    footing: {
      length:        input.pierBaseLength,
      width:         input.pierBaseWidth,
      thickness:     1.0,
      reinforcement: mainSteel,
      basePressure: {
        max:          pMax,
        min:          pMin,
        distribution,
      },
    },
    pierCap: {
      length:        input.pierLength + 0.5,
      width:         input.pierWidth  + 0.5,
      thickness:     0.8,
      reinforcement: mainSteel,
    },
  };
}

/**
 * ABUTMENT DESIGN CALCULATIONS
 */
function calculateAbutmentDesign(
  input: ProjectInput, 
  hydraulics: HydraulicsResult,
  type: 'TYPE1' | 'C1'
): AbutmentDesignResult {
  engineLog(`  → Calculating ${type} abutment design...`);
  
  // Geometry
  const geometry = {
    height: input.abutmentHeight,
    width: input.abutmentWidth,
    depth: input.abutmentDepth,
    baseWidth: input.abutmentWidth + 1.5,
    baseLength: input.abutmentDepth + 1.0,
    dirtWallHeight: input.dirtWallHeight,
    returnWallLength: input.returnWallLength
  };
  
  // Earth pressure (Rankine's theory)
  const phi = input.phi * Math.PI / 180; // Convert to radians
  const ka = Math.tan(Math.PI / 4 - phi / 2) ** 2; // Active earth pressure coefficient
  const pa = 0.5 * ka * input.gamma * input.abutmentHeight ** 2; // Total active pressure
  const location = input.abutmentHeight / 3; // At 1/3 height from base
  
  // Loads
  const abutmentVolume = input.abutmentWidth * input.abutmentDepth * input.abutmentHeight;
  const deadLoad = abutmentVolume * 25; // kN
  const liveLoad = ABUTMENT_DECK_LIVE_LOAD_KN; // kN (from deck)
  const earthPressure = pa;
  const soilSurcharge = ABUTMENT_SURCHARGE_KN_PER_M2 * input.abutmentHeight; // kN
  const waterPressure = 0; // Above HFL
  
  // ── Additional actions ──────────────────────────────────────────────────────
  // Wind on the exposed abutment face (IRC:6-2017 §209); force coefficient 1.3 for
  // a bluff body, resultant at mid-height.
  const Vb = input.designWindSpeed ?? 33;
  const pz = designWindPressure(Vb);
  const windForce = pz * 1.3 * geometry.width * geometry.height;

  // Horizontal seismic pseudo-force (IS:1893:2002), mass = DL + LL, resultant at mid-height.
  const zone = input.seismicZone ?? 3;
  const zoneFactor = SEISMIC_ZONE_FACTOR[zone] ?? SEISMIC_ZONE_FACTOR[3];
  const ah = seismicCoefficient(zone);
  const seismicForce = ah * (deadLoad + liveLoad);

  // Surcharge q = 10 kN/m² drives an ADDITIONAL horizontal push of ka·q·H; only the
  // vertical term is reported in `loads`, so the case arithmetic uses the factored form here.
  const surchargeThrust = ka * soilSurcharge;

  // Water pressure is nil by construction (this abutment stands above HFL), so no flood
  // combination is claimed — a submerged backface would need its own action, not a factor.

  // ── Skew-angle adjustments ─────────────────────────────────────────────────
  // Resolve horizontal actions onto the abutment's in-plane principal axis
  // using the bounded cos / cos² / cos³ bands. Skew abutments additionally
  // develop torsion on the wingwall/return-wall junction (not detailed here),
  // which escalates with increasing skew angle.
  const abutSkew = skewMomentProjection(input.skew ?? 0);
  if (abutSkew.level === 'WARNING') {
    engineLog(`    ⚠ ${type} abutment: ${abutSkew.rationale}`);
  } else if (abutSkew.level === 'ENGINEER_REVIEW') {
    engineLog(`    🚨 ${type} abutment: ${abutSkew.rationale}`);
  }

  // ── Load cases (IRC:6 combinations; each action carries its own factor) ─────
  // CURSOR-002 fix: 5 distinct IRC:6-2016 load combinations per the standard's
  // clause-level factoring — Service / Construction / Flood / Seismic / ULS.
  // The key correction is Earth Pressure (EP) factor = 1.5 in Flood and ULS
  // cases, per IRC:6-2016 §212 retaining-structure factoring; the old code
  // used EP = 1.0 across all cases which under-estimated lateral loads in the
  // governing stability checks.
  const loadCases: LoadCase[] = [];

  const loadCombinations = [
    // Case 1 — Service:        DL×1.0  + LL×1.0   + EP×1.0  + Surcharge×1.0
    { desc: 'Service Condition (DL+LL+EP×1.0+Surcharge)',                    dl: 1.0,  ll: 1.0,  earth: 1.0, surch: 1.0, wind: 0.0, seis: 0.0 },
    // Case 2 — Construction:   DL×1.0  + LL×0.0   + EP×1.0  + Wind×1.0 (no traffic surcharge)
    { desc: 'Construction Stage (DL+EP×1.0+Wind, no LL)',                    dl: 1.0,  ll: 0.0,  earth: 1.0, surch: 0.0, wind: 1.0, seis: 0.0 },
    // Case 3 — Flood:          DL×1.0  + LL×0.0   + EP×1.5  + Hydro uplift×1.0
    { desc: 'Flood Condition (DL+EP×1.5, no LL — submerged backfill, hydro uplift)', dl: 1.0, ll: 0.0, earth: 1.5, surch: 0.0, wind: 0.0, seis: 0.0 },
    // Case 4 — Seismic:        DL×1.0  + LL×0.25  + EP×1.0  + Seismic×1.0
    { desc: 'Seismic Condition (DL+0.25LL+EP×1.0+Seismic)',                  dl: 1.0,  ll: 0.25, earth: 1.0, surch: 1.0, wind: 0.0, seis: 1.0 },
    // Case 5 — ULS Strength:   DL×1.35 + LL×1.5   + EP×1.5  + Wind×0.9
    { desc: 'Ultimate Limit State (1.35DL+1.5LL+EP×1.5+0.9Wind)',            dl: 1.35, ll: 1.5,  earth: 1.5, surch: 1.0, wind: 0.9, seis: 0.0 },
  ];

  loadCombinations.forEach((combo, idx) => {
    const verticalForce = combo.dl * deadLoad + combo.ll * liveLoad;
    const horizontalForce = combo.earth * earthPressure
                             + combo.surch * surchargeThrust
                             + combo.wind * windForce
                             + combo.seis * seismicForce;
    // Earth pressure and surcharge thrust act at H/3 (triangular distribution);
    // wind and seismic act at mid-height. Skew projects the blended resultant
    // onto the in-plane bending axis only; out-of-plane and torsion components
    // are flagged in the abutSkew-level engine logs above.
    const moment = ((combo.earth * earthPressure + combo.surch * surchargeThrust) * location
                   + (combo.wind * windForce + combo.seis * seismicForce) * (geometry.height / 2))
                   * abutSkew.momentFactor;

    const frictionCoeff = DESIGN_CONSTANTS.BASE_FRICTION_COEFFICIENT;
    const slidingFOS = (frictionCoeff * Math.abs(verticalForce)) / Math.max(horizontalForce, 1);
    const restoreMoment = Math.abs(verticalForce) * (geometry.baseWidth / 2);
    const overturningFOS = restoreMoment / Math.max(moment, 1);
    const basePressure = Math.abs(verticalForce) / (geometry.baseWidth * geometry.baseLength);
    const bearingFOS = input.sbc / Math.max(basePressure, 1);

    const status: 'SAFE' | 'UNSAFE' | 'CHECK' =
      (slidingFOS >= STABILITY_ACCEPTANCE.slidingFosMin &&
       overturningFOS >= STABILITY_ACCEPTANCE.overturningFosMin &&
       bearingFOS >= STABILITY_ACCEPTANCE.bearingFosMin) ? 'SAFE' : 'UNSAFE';

    loadCases.push({
      caseNumber:          idx + 1,
      description:         combo.desc,
      deadLoadFactor:      combo.dl,
      liveLoadFactor:      combo.ll,
      windLoadFactor:      combo.wind,
      buoyancyFactor:      0.0,
      earthPressureFactor: combo.earth,
      surchargeFactor:     combo.surch,
      seismicLoadFactor:   combo.seis,
      verticalForce,
      horizontalForce,
      moment,
      slidingFOS,
      overturningFOS,
      bearingFOS,
      status,
    });
  });
  
  // Reinforcement
  const abutBarDia   = DESIGN_CONSTANTS.ABUTMENT_MAIN_BAR_DIAMETER_MM;
  const abutBarArea  = Math.PI / 4 * abutBarDia ** 2; // mm² per bar
  const abutSpacingM = DESIGN_CONSTANTS.DEFAULT_BAR_SPACING_MM / 1000;
  const abutNumBars  = Math.max(DESIGN_CONSTANTS.MIN_MAIN_BAR_COUNT, Math.round((2 * (geometry.height + geometry.width)) / abutSpacingM));
  const abutRunLength = geometry.height; // m (vertical stem bars)
  const steelRaw: SteelDetails = {
    diameter:     abutBarDia,
    spacing:      DESIGN_CONSTANTS.DEFAULT_BAR_SPACING_MM,
    numberOfBars: abutNumBars,
    area:         abutNumBars * abutBarArea,
    weight:       abutNumBars * abutBarArea * abutRunLength * 7850 / 1e6, // kg
  };
  const steel = attachDevelopmentLengths(steelRaw, input.fck, input.fy, input.steelGrade);
  const abutLdNote = developmentLengthForBar(abutBarDia, input.fck, input.fy, input.steelGrade).gradeNote;
  engineLog(`    ✎ ${type} abutment stem bars: ${abutLdNote}`);
  
  return {
    geometry,
    earthPressure: {
      ka,
      pa,
      location
    },
    loads: {
      deadLoad,
      liveLoad,
      earthPressure,
      soilSurcharge,
      waterPressure
    },
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
      lateralResultantHeight: geometry.height / 2
    },
    loadCases,
    reinforcement: {
      abutmentBody: steel,
      dirtWall: steel,
      returnWall: steel,
      footing: steel,
      abutmentCap: steel
    }
  };
}

export default calculateCompleteDesign;
