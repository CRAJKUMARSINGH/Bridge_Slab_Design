// Load Calculations — Dead Load, Live Load IRC Class A, 70R, Impact, Braking, Wind, Seismic, Water Current

// ── DEAD LOAD ─────────────────────────────────────────────────────────────
export interface DeadLoadInputs {
  workName: string;
  spanLength: number; // clear span m
  slabThickness: number; // mm
  wearingCoatThickness: number; // mm (bituminous)
  footpathWidth: number; // m (0 if none)
  railingLoad: number; // kN/m (per side) - self weight of railing
  numSpans: number;
  spanWidth: number; // carriageway width m
  concreteUW: number; // kN/m³ (default 24)
  bituminousUW: number; // kN/m³ (default 22)
}

export interface DeadLoadResult {
  inputs: DeadLoadInputs;
  slabSelfWeight: number; // kN/m²
  wcLoad: number; // kN/m²
  railingLoadPerM: number; // kN/m (both sides per m of span)
  totalDL: number; // kN/m²
  reactionPerSupport: number; // kN/m
}

export function calcDeadLoad(i: DeadLoadInputs): DeadLoadResult {
  const slabSelfWeight = (i.slabThickness / 1000) * i.concreteUW;
  const wcLoad = (i.wearingCoatThickness / 1000) * i.bituminousUW;
  const railingLoadPerM = (i.railingLoad * 2) / i.spanWidth; // kN/m²
  const totalDL = slabSelfWeight + wcLoad + railingLoadPerM;
  const reactionPerSupport = (totalDL * i.spanLength) / 2;
  return {
    inputs: i,
    slabSelfWeight,
    wcLoad,
    railingLoadPerM,
    totalDL,
    reactionPerSupport,
  };
}

export const DEFAULT_DEAD_LOAD: DeadLoadInputs = {
  workName: "Submersible Bridge — Som River",
  spanLength: 8.0,
  slabThickness: 450,
  wearingCoatThickness: 75,
  footpathWidth: 0,
  railingLoad: 1.0,
  numSpans: 12,
  spanWidth: 7.5,
  concreteUW: 24,
  bituminousUW: 22,
};

// ── LIVE LOAD: IRC Vehicle Types (from ASTRA LL.TXT) ───────────────────────
export type VehicleType =
  | "ClassA"
  | "ClassB"
  | "70RTrack"
  | "70RWheel"
  | "ClassAATrack"
  | "24RTrack"
  | "LRFD_HTL57"
  | "LRFD_HL93_HS20"
  | "LRFD_HL93_H20"
  | "BG_Rail_1"
  | "BG_Rail_2"
  | "MG_Rail_1"
  | "MG_Rail_2"
  | "70RW40TBM"
  | "70RW40TBL"
  | "40RWheel";

export interface VehicleGeometry {
  axleLoads: number[]; // kN
  spacings: number[]; // m (between axles)
  trackWidth?: number; // m (for tracked vehicles)
  totalLoad: number; // kN
}

// Vehicle geometries from ASTRA LL.TXT
export const VEHICLE_GEOMETRIES: Record<VehicleType, VehicleGeometry> = {
  ClassA: {
    axleLoads: [27, 27, 114, 114, 68, 68, 68, 68],
    spacings: [1.10, 3.20, 1.20, 4.30, 3.00, 3.00, 3.00],
    totalLoad: 554,
  },
  ClassB: {
    axleLoads: [16, 16, 68, 68, 41, 41, 41, 41],
    spacings: [1.10, 3.20, 1.20, 4.30, 3.00, 3.00, 3.00],
    totalLoad: 332,
  },
  "70RTrack": {
    axleLoads: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70],
    spacings: [0.457, 0.457, 0.457, 0.457, 0.457, 0.457, 0.457, 0.457, 0.457],
    trackWidth: 2.9,
    totalLoad: 700,
  },
  "70RWheel": {
    axleLoads: [170, 170, 170, 170, 120, 120, 80],
    spacings: [1.37, 3.05, 1.37, 2.13, 1.52, 3.96],
    totalLoad: 700,
  },
  "ClassAATrack": {
    axleLoads: [70, 70, 70, 70, 70, 70, 70, 70, 70, 70],
    spacings: [0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36, 0.36],
    trackWidth: 2.9,
    totalLoad: 700,
  },
  "24RTrack": {
    axleLoads: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    spacings: [0.366, 0.366, 0.366, 0.366, 0.366, 0.366, 0.366, 0.366, 0.366],
    trackWidth: 2.9,
    totalLoad: 250,
  },
  "LRFD_HTL57": {
    axleLoads: [105, 105, 105, 105, 105, 45],
    spacings: [1.6, 4.572, 4.572, 1.6, 4.572],
    totalLoad: 570,
  },
  "LRFD_HL93_HS20": {
    axleLoads: [40, 160, 160],
    spacings: [4.2672, 4.2672],
    totalLoad: 360,
  },
  "LRFD_HL93_H20": {
    axleLoads: [40, 160],
    spacings: [4.2672],
    totalLoad: 200,
  },
  "BG_Rail_1": {
    axleLoads: [245.2, 245.2, 245.2, 245.2, 245.2, 245.2, 245.2, 245.2, 245.2, 245.2, 245.2, 245.2],
    spacings: [2.05, 1.95, 5.56, 1.95, 2.05, 5.94, 2.05, 1.95, 5.56, 1.95, 2.05],
    totalLoad: 2942.4,
  },
  "BG_Rail_2": {
    axleLoads: [220.6, 220.6, 220.6, 220.6, 220.6, 220.6, 220.6, 220.6, 220.6, 220.6, 220.6, 220.6],
    spacings: [1.65, 1.65, 6.4, 1.65, 1.65, 3.0, 1.65, 1.65, 6.4, 1.65, 1.65],
    totalLoad: 2647.2,
  },
  "MG_Rail_1": {
    axleLoads: [118.7, 118.7, 118.7, 118.7, 112.8, 129.4, 129.4, 129.4, 129.4, 79.4],
    spacings: [1.372, 2.286, 1.372, 2.68, 2.133, 1.346, 1.346, 1.397, 2.197],
    totalLoad: 1187,
  },
  "MG_Rail_2": {
    axleLoads: [96.1, 96.1, 96.1, 96.1, 91.2, 104.9, 104.9, 104.9, 104.9, 64.7],
    spacings: [1.372, 1.372, 1.372, 2.806, 1.829, 1.346, 1.346, 1.397, 2.197],
    totalLoad: 961,
  },
  "70RW40TBM": {
    axleLoads: [50, 50, 50, 50],
    spacings: [0.795, 0.38, 0.795],
    totalLoad: 200,
  },
  "70RW40TBL": {
    axleLoads: [100, 100],
    spacings: [1.93],
    totalLoad: 200,
  },
  "40RWheel": {
    axleLoads: [120, 120, 120, 70, 70, 50],
    spacings: [1.07, 4.27, 3.05, 1.22, 3.66],
    totalLoad: 550,
  },
};

export interface LiveLoadInputs {
  workName: string;
  spanLength: number; // m (effective span)
  slabWidth: number; // m (carriageway)
  vehicleType: VehicleType;
  numLanes: number;
}

export interface LiveLoadResult {
  inputs: LiveLoadInputs;
  axleLoads: number[]; // kN
  maxMoment: number; // kN·m per m
  maxShear: number; // kN per m
  impactFactor: number;
  designMoment: number; // kN·m per m (with impact)
  designShear: number; // kN per m (with impact)
}

export function calcLiveLoad(i: LiveLoadInputs): LiveLoadResult {
  const L = i.spanLength;
  const geom = VEHICLE_GEOMETRIES[i.vehicleType];
  const axleLoads = geom.axleLoads;

  // Impact factor IRC:6 Cl.208 (simplified for all vehicle types)
  let IF = 1.0;
  if (L <= 3) IF = 1.5;
  else if (L <= 45) IF = 1 + 4.5 / (6 + L);
  else IF = 1.1;

  // Simplified: max moment (equivalent UDL approach)
  // For detailed load placement, use IRC slab method or influence lines
  const totalW = geom.totalLoad;
  const laneW = totalW / i.numLanes;
  // Moment per metre width (simplified)
  const Mmid = (laneW * L) / 8 / i.slabWidth;
  const Vmid = laneW / 2 / i.slabWidth;

  return {
    inputs: i,
    axleLoads,
    maxMoment: Mmid,
    maxShear: Vmid,
    impactFactor: IF,
    designMoment: Mmid * IF,
    designShear: Vmid * IF,
  };
}

export const DEFAULT_LIVE_LOAD: LiveLoadInputs = {
  workName: "Submersible Bridge — Som River",
  spanLength: 8.0,
  slabWidth: 7.5,
  vehicleType: "ClassA",
  numLanes: 2,
};

// ─── Load Calculation Methodology Documentation ───────────────────────────────
/*
 * SIMPLIFICATIONS VS ASTRA TRANSVERSE APPROACH
 * =============================================
 * 
 * Current Implementation:
 * - Longitudinal strip method with simplified equivalent UDL
 * - Single load position for maximum moment/shear
 * - No transverse distribution analysis
 * - No SIDL breakdown (kerb, footpath, utilities, railings combined)
 * 
 * ASTRA Example 18 Approach:
 * - FE-style deck modelling with grillage analysis
 * - Detailed SIDL breakdown: railing, railing kerb, utilities, water supply,
 *   road kerb, footpath slab, wearing course as separate loads
 * - Multiple live load positions:
 *   * 1-lane Class A (symmetric and eccentric)
 *   * 2-lane Class A (symmetric)
 *   * 40T bogie (symmetric and eccentric)
 *   * 70R tracked (symmetric and eccentric)
 * - Transverse moment distribution analysis
 * - Export to structural analysis software (SAP/STAAD)
 * 
 * When Simplified Approach is Acceptable:
 * - Preliminary design and sizing
 * - Standard simply supported slab bridges
 * - When span/width ratio < 2 (one-way behavior dominant)
 * - When conservative estimates are acceptable
 * 
 * When Detailed Analysis Required:
 * - Final design submission
 * - Skewed bridges
 * - Wide bridges with complex load distribution
 * - Bridges with significant footpath/utility loads
 * - High importance structures (railway, major highways)
 * - When transverse behavior is critical
 * 
 * For detailed analysis, consider:
 * - Use ircSlabCalc.ts for IRC 21:2000 deck strip method
 * - Export to FEM software (SAP/STAAD/MIDAS)
 * - Perform grillage analysis
 * - Use influence lines for accurate load placement
 */

// ── WIND LOAD ──────────────────────────────────────────────────────────────
export interface WindLoadInputs {
  workName: string;
  bridgeHeight: number; // m above ground (to top of deck)
  exposureCategory: "A" | "B" | "C";
  deckWidth: number; // m
  deckDepth: number; // m (exposed face depth)
  spanLength: number; // m
  pierHeight: number; // m
  pierWidth: number; // m
  numPiers: number;
  basicWindSpeed: number; // m/s (from IS:875 map, default 44)
}

export interface WindLoadResult {
  inputs: WindLoadInputs;
  designWindSpeed: number; // Vz m/s
  windPressure: number; // pz kN/m²
  deckWindForce: number; // kN/m per unit span
  pierWindForce: number; // kN per pier
  totalDeckWind: number; // kN (total on superstructure)
  totalPierWind: number; // kN (total all piers)
}

export function calcWindLoad(i: WindLoadInputs): WindLoadResult {
  // IS 875 Part-3
  const k1 = 1.0; // risk coefficient (50-yr)
  const k2 =
    i.exposureCategory === "A"
      ? 1.05
      : i.exposureCategory === "B"
        ? 0.97
        : 0.91;
  const k3 = 1.0; // topography
  const Vz = i.basicWindSpeed * k1 * k2 * k3;
  const pz = (0.6 * Vz * Vz) / 1000; // kN/m²

  const Cd_deck = 1.3; // drag coeff for slab bridge
  const Cd_pier = 1.3; // drag coeff for pier

  const deckWindForce = pz * Cd_deck * i.deckDepth; // kN/m of span
  const pierWindForce = pz * Cd_pier * i.pierWidth * i.pierHeight; // kN per pier

  return {
    inputs: i,
    designWindSpeed: Vz,
    windPressure: pz,
    deckWindForce,
    pierWindForce,
    totalDeckWind: deckWindForce * i.spanLength,
    totalPierWind: pierWindForce * i.numPiers,
  };
}

export const DEFAULT_WIND: WindLoadInputs = {
  workName: "Submersible Bridge — Som River",
  bridgeHeight: 6.0,
  exposureCategory: "B",
  deckWidth: 7.5,
  deckDepth: 0.83,
  spanLength: 8.0,
  pierHeight: 3.5,
  pierWidth: 1.2,
  numPiers: 10,
  basicWindSpeed: 44,
};

// ── SEISMIC FORCE ──────────────────────────────────────────────────────────
export interface SeismicInputs {
  workName: string;
  seismicZone: "II" | "III" | "IV" | "V";
  soilType: "I" | "II" | "III"; // Hard / Medium / Soft
  importanceFactor: number; // 1.0 normal, 1.5 important
  responseFactor: number; // R (3.0 bridges)
  deckDL: number; // kN (total superstructure DL)
  pierSelfWeight: number; // kN per pier
  numPiers: number;
  Sa_g?: number; // override Sa/g
}

export interface SeismicResult {
  inputs: SeismicInputs;
  zoneCoeff: number; // Z
  Sa_g: number; // spectral acceleration
  Ah: number; // horizontal seismic coefficient
  seismicForceDeck: number; // kN (horizontal)
  seismicForcePier: number; // kN per pier
  totalSeismic: number; // kN
}

export function calcSeismic(i: SeismicInputs): SeismicResult {
  const zoneMap: Record<string, number> = {
    II: 0.1,
    III: 0.16,
    IV: 0.24,
    V: 0.36,
  };
  const Z = zoneMap[i.seismicZone] ?? 0.16;
  // Sa/g — use 2.5 for typical bridge (medium period range)
  const Sa_g = i.Sa_g ?? 2.5;
  const Ah = (Z / 2) * (i.importanceFactor / i.responseFactor) * Sa_g;

  const seismicForceDeck = Ah * i.deckDL;
  const seismicForcePier = Ah * i.pierSelfWeight;

  return {
    inputs: i,
    zoneCoeff: Z,
    Sa_g,
    Ah,
    seismicForceDeck,
    seismicForcePier,
    totalSeismic: seismicForceDeck + seismicForcePier * i.numPiers,
  };
}

export const DEFAULT_SEISMIC: SeismicInputs = {
  workName: "Submersible Bridge — Som River",
  seismicZone: "III",
  soilType: "II",
  importanceFactor: 1.5,
  responseFactor: 3.0,
  deckDL: 12000,
  pierSelfWeight: 800,
  numPiers: 10,
};

// ── WATER CURRENT FORCE ────────────────────────────────────────────────────
export interface WaterCurrentInputs {
  workName: string;
  velocity: number; // design velocity m/s
  numPiers: number;
  pierWidth: number; // m (plan dimension normal to flow)
  pierHeight: number; // m (submerged height)
  pierShape: "rectangular" | "circular" | "semicircular";
  angle: number; // skew angle degrees
}

export interface WaterCurrentResult {
  inputs: WaterCurrentInputs;
  K: number; // shape factor
  pressure: number; // kN/m²
  forcePerPier: number; // kN
  totalForce: number; // kN
  moment: number; // kN·m at base per pier
}

export function calcWaterCurrent(i: WaterCurrentInputs): WaterCurrentResult {
  // IRC:6 Cl.213 — P = 52KV²
  const shapeK =
    i.pierShape === "circular"
      ? 0.66
      : i.pierShape === "semicircular"
        ? 0.9
        : 1.5;
  const P = (52 * shapeK * i.velocity * i.velocity) / 1000; // kN/m²
  const forcePerPier = P * i.pierWidth * i.pierHeight;
  const moment = (forcePerPier * i.pierHeight) / 2; // at base

  return {
    inputs: i,
    K: shapeK,
    pressure: P,
    forcePerPier,
    totalForce: forcePerPier * i.numPiers,
    moment,
  };
}

export const DEFAULT_WATER_CURRENT: WaterCurrentInputs = {
  workName: "Submersible Bridge — Som River",
  velocity: 3.36,
  numPiers: 10,
  pierWidth: 1.2,
  pierHeight: 3.33,
  pierShape: "semicircular",
  angle: 0,
};

// ── BRAKING FORCE ──────────────────────────────────────────────────────────
export interface BrakingInputs {
  workName: string;
  spanLength: number; // m
  liveLoadClass: "ClassA" | "70R";
  numLanes: number;
  pierHeight: number; // m (for moment calc)
}

export interface BrakingResult {
  inputs: BrakingInputs;
  totalLiveLoad: number; // kN
  brakingForce: number; // kN (20% of LL per IRC:6 Cl.214)
  brakingPerLane: number; // kN per lane
  momentAtBase: number; // kN·m at pier base
}

export function calcBraking(i: BrakingInputs): BrakingResult {
  const totalLL =
    i.liveLoadClass === "ClassA" ? 554 * i.numLanes : 700 * i.numLanes; // kN
  const brakingForce = 0.2 * totalLL; // IRC:6 Cl.214 — 20% of LL
  const brakingPerLane = brakingForce / i.numLanes;
  const momentAtBase = brakingForce * (i.pierHeight + 0.83); // moment at pier base

  return {
    inputs: i,
    totalLiveLoad: totalLL,
    brakingForce,
    brakingPerLane,
    momentAtBase,
  };
}

export const DEFAULT_BRAKING: BrakingInputs = {
  workName: "Submersible Bridge — Som River",
  spanLength: 8.0,
  liveLoadClass: "ClassA",
  numLanes: 2,
  pierHeight: 3.5,
};
