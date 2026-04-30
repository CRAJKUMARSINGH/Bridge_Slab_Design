// Hydraulic Design Calculations for Submersible Bridge
// References: IRC SP-13, IRC:78-1983 (cl. 703.2.2.1), IS:7784 Part-I, ASTRA Pro methodology

export interface CrossSectionPoint {
  chainage: number; // distance from reference point (m)
  bedLevel: number; // river bed level (m)
}

export interface HydraulicInputs {
  workName: string;
  // Cross-Section Integration (ASTRA methodology)
  crossSectionPoints?: CrossSectionPoint[]; // array of {chainage, bedLevel}
  // Legacy single-point inputs (fallback if crossSectionPoints not provided)
  crossSectionalArea?: number; // A  m²
  perimeter?: number; // P  m
  // Area-Velocity Method (IRC SP-13, Article 5)
  slope: number; // S  e.g. 1/926 → enter 926 → stored as 1/926
  rugosity: number; // n  Manning's coefficient
  observedVelocity?: number; // V1 m/s (observed velocity for dual discharge check)
  dischargeMethod: "manning" | "observed" | "max" | "user"; // which Q to adopt
  userDischarge?: number; // Q_user cumecs (if method = "user")
  // Waterway
  numSpans: number;
  spanLength: number; // m
  // Pier / Abutment geometry
  numPiers: number;
  pierWidth: number; // m
  numAbutments: number;
  abutTopWidth: number; // m (top of abutment)
  abutBottomWidth: number; // m (bottom of abutment)
  // Levels
  hfl: number; // HFL m
  avgRiverBedLevel: number; // average river bed level m
  lwl: number; // LWL m (low water level)
  lbl: number; // LBL m (lowest bed level)
  sofitLevel: number; // soffit of deck slab m
  topOfDeck: number; // top of deck slab m
  deckThickness: number; // total slab + wearing coat m
  // Scour
  siltFactor: number; // Ksf
  // ASTRA factors
  F1?: number; // foundation discharge factor (default 1.3)
  F2?: number; // foundation depth factor (default 1.33)
}

export interface HydraulicResult {
  // Cross-section (if computed from points)
  computedArea?: number; // A from cross-section integration m²
  computedPerimeter?: number; // P from cross-section integration m
  waterSpread?: number; // water spread at HFL between banks m
  // Discharge
  velocityManning: number; // V2 m/s (Manning velocity)
  velocityObserved?: number; // V1 m/s (observed velocity)
  dischargeManning: number; // Q_manning cumecs
  dischargeObserved?: number; // Q_observed cumecs
  discharge: number; // Q_adopted cumecs
  dischargeMethod: string; // method used
  // Waterway
  regimeWidth: number; // Regime surface width m
  effectiveWaterway: number; // m
  // Scour
  dischargePerMetre: number; // Db
  meanScourDepth: number; // d2 m
  maxScourDepth: number; // D_max m
  foundationDepth?: number; // below HFL m
  foundationLevel?: number; // m
  depthFromLWL?: number; // m
  depthFromLBL?: number; // m
  // Afflux – obstruction areas
  areaObstrSlab: number;
  areaObstrPiers: number;
  areaObstrAbutments: number;
  totalObstruction: number;
  actualFlowArea: number;
  afflux: number; // h m
  affluxFloodLevel: number; // m
  obstructedVelocity: number; // m/s
  deckClearance: number; // top of deck – afflux flood level
  status: "OK" | "FAIL";
  inputs: HydraulicInputs;
}

function computeCrossSection(
  points: CrossSectionPoint[],
  hfl: number,
): { area: number; perimeter: number; waterSpread: number } {
  if (points.length < 2) {
    return { area: 0, perimeter: 0, waterSpread: 0 };
  }

  let totalArea = 0;
  let totalPerimeter = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const depth1 = Math.max(0, hfl - p1.bedLevel);
    const depth2 = Math.max(0, hfl - p2.bedLevel);
    const meanDepth = depth1 > 0 ? (depth1 + depth2) / 2 : 0;

    const deltaX = p2.chainage - p1.chainage;
    const deltaY = p1.bedLevel - p2.bedLevel;

    const trapezoidArea = deltaX * meanDepth;
    const segmentPerimeter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    totalArea += trapezoidArea;
    totalPerimeter += segmentPerimeter;
  }

  const waterSpread = points[points.length - 1].chainage - points[0].chainage;

  return { area: totalArea, perimeter: totalPerimeter, waterSpread };
}

export function computeHydraulics(inp: HydraulicInputs): HydraulicResult {
  // ── Cross-section integration (ASTRA methodology)
  let A: number, P: number, waterSpread: number;
  if (inp.crossSectionPoints && inp.crossSectionPoints.length >= 2) {
    const cs = computeCrossSection(inp.crossSectionPoints, inp.hfl);
    A = cs.area;
    P = cs.perimeter;
    waterSpread = cs.waterSpread;
  } else {
    // Fallback to legacy single-point inputs
    A = inp.crossSectionalArea ?? 0;
    P = inp.perimeter ?? 0;
    waterSpread = 0;
  }

  // ── Manning's formula: V = (1/n)·(A/P)^(2/3)·S^(1/2)
  const S = 1 / inp.slope; // actual slope fraction
  const hydraulicRadius = A / P;
  const velocityManning =
    (1 / inp.rugosity) * Math.pow(hydraulicRadius, 2 / 3) * Math.sqrt(S);
  const dischargeManning = A * velocityManning;

  // ── Observed velocity method (ASTRA dual discharge check)
  let dischargeObserved: number | undefined;
  if (inp.observedVelocity) {
    dischargeObserved = A * inp.observedVelocity;
  }

  // ── Adopt discharge based on method selection
  let discharge: number;
  let methodStr: string;
  switch (inp.dischargeMethod) {
    case "observed":
      discharge = dischargeObserved ?? dischargeManning;
      methodStr = "Observed Velocity";
      break;
    case "max":
      discharge = dischargeObserved
        ? Math.max(dischargeObserved, dischargeManning)
        : dischargeManning;
      methodStr = "Maximum (Observed vs Manning)";
      break;
    case "user":
      discharge = inp.userDischarge ?? dischargeManning;
      methodStr = "User Specified";
      break;
    case "manning":
    default:
      discharge = dischargeManning;
      methodStr = "Manning's Formula";
      break;
  }

  // ── Regime waterway: L = 4.8 × Q^0.5
  const regimeWidth = 4.8 * Math.sqrt(discharge);

  // ── Proposed waterway
  const effectiveWaterway = inp.numSpans * inp.spanLength;

  // ── ASTRA factors
  const F1 = inp.F1 ?? 1.0; // discharge scaling factor — applied to total adopted discharge (default 1.0; set 1.3 for ASTRA foundation check)
  const F2 = inp.F2 ?? 1.33; // foundation depth factor

  // ── Scale adopted discharge by F1 (applied to total discharge per engineering decision)
  const scaledDischarge = F1 * discharge;

  // ── Scour: net waterway (subtract pier widths)
  const netWaterway = effectiveWaterway - inp.numPiers * inp.pierWidth;
  const dischargePerMetre = scaledDischarge / netWaterway;
  // Mean scour: d2 = 1.34 × (Db² / Ksf)^(1/3)   [IRC:78-1983 Cl. 703.2.2.1]
  const meanScourDepth =
    1.34 *
    Math.pow((dischargePerMetre * dischargePerMetre) / inp.siltFactor, 1 / 3);
  // Maximum scour: D = 2.0 × d2   [IRC:78-1983 — 2× for pier scour]
  const maxScourDepth = 2.0 * meanScourDepth;

  // ── Foundation depth (ASTRA: F2 × D below HFL)
  const foundationDepth = F2 * maxScourDepth;
  const foundationLevel = inp.hfl - foundationDepth;
  const depthFromLWL = inp.lwl - foundationLevel;
  const depthFromLBL = inp.lbl - foundationLevel;

  // ── Afflux obstruction areas
  const isSubmerged = inp.hfl > inp.sofitLevel;
  const areaObstrSlab = isSubmerged ? (effectiveWaterway * inp.deckThickness) : 0;

  const pierHeight = inp.hfl - inp.avgRiverBedLevel;
  const areaObstrPiers = inp.numPiers * inp.pierWidth * pierHeight;

  const abutHeight = inp.hfl - inp.avgRiverBedLevel;
  const areaOneAbutment =
    ((inp.abutTopWidth + inp.abutBottomWidth) / 2) * abutHeight;
  const areaObstrAbutments = inp.numAbutments * areaOneAbutment;

  const totalObstruction = areaObstrSlab + areaObstrPiers + areaObstrAbutments;
  const actualFlowArea = A - totalObstruction;

  // ── Molesworth formula [IS:7784 Part-I]:
  // h = (V²/17.85 + 0.0152) × (A²/a² − 1)
  const V = velocityManning;
  const a = actualFlowArea;
  const afflux = ((V * V) / 17.85 + 0.0152) * ((A * A) / (a * a) - 1);

  const affluxFloodLevel = inp.hfl + afflux;
  const obstructedVelocity = discharge / actualFlowArea;
  const deckClearance = inp.topOfDeck - affluxFloodLevel;

  return {
    computedArea: inp.crossSectionPoints ? A : undefined,
    computedPerimeter: inp.crossSectionPoints ? P : undefined,
    waterSpread: inp.crossSectionPoints ? waterSpread : undefined,
    velocityManning,
    velocityObserved: inp.observedVelocity,
    dischargeManning,
    dischargeObserved,
    discharge,
    dischargeMethod: methodStr,
    regimeWidth,
    effectiveWaterway,
    dischargePerMetre,
    meanScourDepth,
    maxScourDepth,
    foundationDepth,
    foundationLevel,
    depthFromLWL,
    depthFromLBL,
    areaObstrSlab,
    areaObstrPiers,
    areaObstrAbutments,
    totalObstruction,
    actualFlowArea,
    afflux,
    affluxFloodLevel,
    obstructedVelocity,
    deckClearance,
    status: deckClearance >= 0 ? "OK" : "FAIL",
    inputs: inp,
  };
}

export const DEFAULT_HYDRAULIC: HydraulicInputs = {
  workName:
    'Construction of Submersible Bridge on Larathi to Larathi "B" Road, across Som River',
  // Legacy single-point inputs (for backward compatibility)
  crossSectionalArea: 440.83,
  perimeter: 117.02,
  slope: 926,
  rugosity: 0.033,
  observedVelocity: 2.2,
  dischargeMethod: "max",
  numSpans: 12,
  spanLength: 8,
  numPiers: 10,
  pierWidth: 1.2,
  numAbutments: 2,
  abutTopWidth: 0.4,
  abutBottomWidth: 0.75,
  hfl: 99.5,
  avgRiverBedLevel: 95.0,
  lwl: 94.5,
  lbl: 93.5,
  sofitLevel: 99.12,
  topOfDeck: 99.95,
  deckThickness: 0.83,
  siltFactor: 1.5,
  F1: 1.3,
  F2: 1.33,
};
