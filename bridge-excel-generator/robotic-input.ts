/**
 * ROBOTIC (AUTOMATED) PROJECT INPUT GENERATOR
 * Produces a deterministic, IRC-compliant, schema-valid ProjectInput when
 * no explicit project data is supplied. Deterministic (no Math.random()) so
 * repeated calls with the same seed return byte-identical objects.
 */

import type { CrossSectionPoint, ProjectInput } from './types';
import { ProjectInputSchema } from './input-contract';

export class RoboticInputValidationError extends Error {
  constructor(public readonly zodIssues: unknown, message = 'Robotic input failed schema validation') {
    super(message);
    this.name = 'RoboticInputValidationError';
  }
}

// ---------------------------------------------------------------------------
// DESIGN_CONSTANTS registry-style parameters shared by the sheet generators.
// Kept local to this file to match the "assume urself variables" instruction
// but aligned with the existing remote-app-adapter constant naming.
// ---------------------------------------------------------------------------
const REGISTRY = {
  PIER_WIDTH_M: 2.0,
  PARAPET_PLUS_CLEARANCE_EACH_SIDE_M: 0.6,
  WING_WALL_EXTRA_WIDTH_M: 1.5,
  MANNING_N: 0.033,
  LACEY_SILT_FACTOR: 1.5,
  CONCRETE_GRADE: 'M30',
  FCK_MPA: 30,
  STEEL_GRADE: 'Fe415',
  FY_MPA: 415,
  SBC_KPA: 200,
  PHI_DEG: 30,
  GAMMA_KN_M3: 18,
  SEISMIC_ZONE: 3 as const,
  DESIGN_WIND_SPEED_M_S: 33,
  DECK_OVERHANG_ABUTMENT_M: 0.5,
  FOOTING_EXTRA_PIER_EACH_SIDE_M: 0.75,
  PIER_BASE_THICKNESS_M: 0.6,
  DEFAULT_DECK_SLAB_T_M: 0.25,
  FREEBOARD_ABOVE_HFL_M: 1.5,
} as const;

// Deterministic catalogue. All index 0 selections (no randomness).
const BRIDGE_CATALOGUE: Array<{
  projectName: string;
  location: string;
  riverName: string;
  issuingAuthority: string;
  jobNumber: string;
  spanLengthM: number;
  numberOfSpans: number;
  carriageWidthM: number;
  bridgeType: 'high-level' | 'submersible';
  hardRockAvailable: boolean;
}> = [
  {
    projectName: 'Sukher River High-Level Slab Bridge at Chittorgarh',
    location: 'Chittorgarh District, Rajasthan',
    riverName: 'Sukher River',
    issuingAuthority: 'PWD (R&B) Circle — Udaipur, Government of Rajasthan',
    jobNumber: 'PWD-UDR/SLAB/2026-10/001',
    spanLengthM: 15,
    numberOfSpans: 5,
    carriageWidthM: 7.5,
    bridgeType: 'high-level',
    hardRockAvailable: true,
  },
  {
    projectName: 'Kothari River Slab Bridge near Bhilwara',
    location: 'Bhilwara District, Rajasthan',
    riverName: 'Kothari River',
    issuingAuthority: 'PWD (R&B) Circle — Ajmer',
    jobNumber: 'PWD-AJM/SLAB/2026-10/002',
    spanLengthM: 12,
    numberOfSpans: 7,
    carriageWidthM: 7.5,
    bridgeType: 'submersible',
    hardRockAvailable: false,
  },
];

function clampFinite(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function buildCrossSection(
  chainageStartM: number,
  chainageEndM: number,
  bedLevelM: number,
  valleyDepthM: number,
): CrossSectionPoint[] {
  const N: number = 9;
  const pts: CrossSectionPoint[] = [];
  const width = chainageEndM - chainageStartM;
  for (let i = 0; i < N; i += 1) {
    const t = N === 1 ? 0.5 : i / (N - 1);
    const chainage = chainageStartM + t * width;
    // Parabolic profile: deepest at centre (t=0.5), bank levels 2–3 m above bed.
    const normalised = (t - 0.5) * 2; // -1..1
    const gl = bedLevelM + valleyDepthM * (normalised * normalised);
    pts.push({
      chainage: parseFloat(chainage.toFixed(2)),
      gl: parseFloat(gl.toFixed(3)),
    });
  }
  return pts;
}

export function generateRoboticProjectInput(
  seed?: Partial<ProjectInput>,
): ProjectInput {
  // Deterministic catalogue: always index 0. A "seed" bridgeType / location /
  // spanLength overrides just those keys without disturbing the rest.
  const cat = BRIDGE_CATALOGUE[0];

  const spanLength = clampFinite(
    seed?.spanLength ?? cat.spanLengthM,
    10,
    30,
  );
  const numberOfSpansRaw = clampFinite(
    seed?.numberOfSpans ?? cat.numberOfSpans,
    3,
    9,
  );
  // Ensure odd count (symmetric pier arrangement preferred by IRC SP:13).
  const numberOfSpans =
    numberOfSpansRaw % 2 === 0 ? Math.max(3, numberOfSpansRaw - 1) : Math.round(numberOfSpansRaw);

  const carriageWidth = clampFinite(
    seed?.carriageWidth ?? cat.carriageWidthM,
    5.0,
    14.0,
  );

  // Levels — keep strict monotonic order per spec invariant.
  const foundationLevel = clampFinite(seed?.foundationLevel ?? 240.0, 100, 900);
  const bedLevel = clampFinite(
    seed?.bedLevel ?? foundationLevel + 3.5,
    foundationLevel + 0.6,
    foundationLevel + 8,
  );
  const hfl = clampFinite(
    seed?.hfl ?? bedLevel + 2.5,
    bedLevel + 0.5,
    bedLevel + 5,
  );
  const agl = clampFinite(
    seed?.agl ?? hfl + 0.8,
    hfl + 0.5,
    hfl + 3,
  );
  const freeboard = clampFinite(
    seed?.freeboardAboveHfl ?? REGISTRY.FREEBOARD_ABOVE_HFL_M,
    1.0,
    3.0,
  );
  const deckT = clampFinite(
    seed?.deckSlabThickness ?? REGISTRY.DEFAULT_DECK_SLAB_T_M,
    0.20,
    0.45,
  );
  const rtl = clampFinite(
    seed?.rtl ?? hfl + freeboard + deckT + 0.3,
    agl + 0.5,
    agl + 8,
  );
  const ofl = clampFinite(seed?.ofl ?? hfl - 0.5, bedLevel + 0.2, hfl);
  const nbl = clampFinite(seed?.nbl ?? bedLevel + 0.3, bedLevel, hfl);
  const dwl = clampFinite(seed?.dwl ?? (hfl + ofl) / 2, ofl, hfl);

  // Cross section: 50 m wide profile centred around chainage 100.
  const crossSectionData =
    seed?.crossSectionData ?? buildCrossSection(75, 125, bedLevel, 3.5);

  // Hydraulics: Manning-consistent Q for a 40 m clear waterway × 2.5 m avg depth
  // at V = (1/n)·R^(2/3)·S^(1/2). We set discharge equal to what a Manning
  // solver would produce for S = 1/1500 so the existing engine's values line up.
  const Rapprox = 1.9;
  const ManningS = 1 / 1500;
  const Vapprox = (1 / REGISTRY.MANNING_N) * Math.pow(Rapprox, 2 / 3) * Math.sqrt(ManningS);
  const Aapprox = 90; // m² for 40 m wide × ~2.25 m deep
  const discharge = clampFinite(
    seed?.discharge ?? parseFloat((Aapprox * Vapprox).toFixed(1)),
    10,
    5000,
  );

  const numberOfLanes =
    seed?.numberOfLanes ?? (carriageWidth <= 8.5 ? 2 : carriageWidth <= 12.5 ? 4 : 6);

  const pierWidth = REGISTRY.PIER_WIDTH_M;
  const pierLength = carriageWidth + 2 * REGISTRY.PARAPET_PLUS_CLEARANCE_EACH_SIDE_M;
  const pierDepth = Math.max(1.2, (rtl - foundationLevel) * 0.92);
  const pierBaseWidth = pierWidth + 2 * REGISTRY.FOOTING_EXTRA_PIER_EACH_SIDE_M;
  const pierBaseLength = pierLength + 2 * REGISTRY.FOOTING_EXTRA_PIER_EACH_SIDE_M;

  const abutmentHeight = rtl - foundationLevel;
  const abutmentWidth = pierLength + REGISTRY.WING_WALL_EXTRA_WIDTH_M;
  const abutmentDepth = pierDepth + 0.2;
  const dirtWallHeight = Math.max(1.5, abutmentHeight * 0.6);
  const returnWallLength = Math.max(3, carriageWidth * 0.4);

  const totalLength =
    numberOfSpans * spanLength + 2 * REGISTRY.DECK_OVERHANG_ABUTMENT_M;

  const draft: ProjectInput = {
    projectName: seed?.projectName ?? cat.projectName,
    location: seed?.location ?? cat.location,
    riverName: seed?.riverName ?? cat.riverName,
    bridgeType: seed?.bridgeType ?? cat.bridgeType,
    seismicZone: seed?.seismicZone ?? REGISTRY.SEISMIC_ZONE,
    designWindSpeed: seed?.designWindSpeed ?? REGISTRY.DESIGN_WIND_SPEED_M_S,
    jobNumber: seed?.jobNumber ?? cat.jobNumber,
    issuingAuthority: seed?.issuingAuthority ?? cat.issuingAuthority,
    hardRockAvailable: seed?.hardRockAvailable ?? cat.hardRockAvailable,

    spanLength,
    numberOfSpans,
    numberOfLanes,
    carriageWidth,
    totalLength,
    bridgeLength: seed?.bridgeLength ?? totalLength,
    bridgeWidth: seed?.bridgeWidth ?? pierLength + 0.5,
    skew: clampFinite(seed?.skew ?? 0, 0, 45),
    deckSlabThickness: deckT,
    deckSoffitLevel: seed?.deckSoffitLevel ?? rtl - deckT,
    freeboardAboveHfl: freeboard,
    pierDesign: {
      effectiveSpan: spanLength,
      spanCC: spanLength,
      ...(seed?.pierDesign ?? {}),
    },
    hydraulics: seed?.hydraulics ?? { hfl },

    hfl,
    bedLevel,
    foundationLevel,
    discharge,
    manningN: seed?.manningN ?? REGISTRY.MANNING_N,
    bedSlope: clampFinite(seed?.bedSlope ?? 1500, 1, 100_000),
    laceysSiltFactor: seed?.laceysSiltFactor ?? REGISTRY.LACEY_SILT_FACTOR,

    crossSectionData,

    pierWidth,
    pierLength,
    pierDepth,
    numberOfPiers: numberOfSpans - 1,
    pierBaseWidth,
    pierBaseLength,

    abutmentHeight,
    abutmentWidth,
    abutmentDepth,
    dirtWallHeight,
    returnWallLength,

    concreteGrade: seed?.concreteGrade ?? REGISTRY.CONCRETE_GRADE,
    fck: clampFinite(seed?.fck ?? REGISTRY.FCK_MPA, 15, 60),
    steelGrade: seed?.steelGrade ?? REGISTRY.STEEL_GRADE,
    fy: clampFinite(seed?.fy ?? REGISTRY.FY_MPA, 240, 600),
    concreteGradeFoundation: seed?.concreteGradeFoundation ?? 'M25',
    concreteGradePier: seed?.concreteGradePier ?? 'M30',
    concreteGradeAbutment: seed?.concreteGradeAbutment ?? 'M30',
    concreteGradeDeck: seed?.concreteGradeDeck ?? 'M30',
    concreteGradeWearing: seed?.concreteGradeWearing ?? 'M35',

    sbc: clampFinite(seed?.sbc ?? REGISTRY.SBC_KPA, 50, 800),
    phi: clampFinite(seed?.phi ?? REGISTRY.PHI_DEG, 15, 45),
    gamma: clampFinite(seed?.gamma ?? REGISTRY.GAMMA_KN_M3, 14, 22),

    rtl,
    agl,
    nbl,
    ofl,
    dwl,
  };

  const parsed = ProjectInputSchema.safeParse(draft);
  if (!parsed.success) {
    throw new RoboticInputValidationError(parsed.error.issues);
  }
  return parsed.data;
}

export default generateRoboticProjectInput;
