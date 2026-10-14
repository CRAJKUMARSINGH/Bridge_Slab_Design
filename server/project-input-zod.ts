import { z } from 'zod';

// ── Physical-bounds constants ─────────────────────────────────────────────────
// ASSUMPTION items are marked; they require adjudication and sign-off in the
// gap log before launch (repo charter: record discrepancies, don't silently patch).
const SPAN_M_MIN = 1, SPAN_M_MAX = 100;             // ASSUMPTION ceiling
const LENGTH_M_MIN = 1, LENGTH_M_MAX = 5000;        // ASSUMPTION
const LEVEL_M_MIN = -50, LEVEL_M_MAX = 3000;        // relative datums may go negative
const DISCHARGE_MAX = 100_000;                      // ASSUMPTION m³/s
const MANNING_N_MIN = 0.01, MANNING_N_MAX = 0.1;    // natural channels
const BED_SLOPE_MIN = 10, BED_SLOPE_MAX = 50_000;  // "1 in N" format: S = 1/N (e.g. 500 = 1:500)
// NOTE: The engine uses Math.sqrt(1/bedSlope) — it is NOT m/m. It is the "1 in N"
// slope denominator. Values 10-50,000 correspond to slopes 1:10 (very steep) to
// 1:50,000 (near-flat). The original schema had min(1).max(100_000) which was
// also unitless. ASSUMPTION: reasonable range based on default values (840–1500).
const SILT_FACTOR_MIN = 0.5, SILT_FACTOR_MAX = 2.0; // IRC SP-13
const PIER_DIM_M_MIN = 0.3, PIER_DIM_M_MAX = 30;
const ABUTMENT_DIM_M_MIN = 0.5, ABUTMENT_DIM_M_MAX = 50;
const FCK_MIN = 15, FCK_MAX = 60;                   // IS 456 Table 2
const FY_VALUES = [250, 415, 500, 550] as const;    // IS 1786
const DECK_THICK_M_MIN = 0.1, DECK_THICK_M_MAX = 2.0;
const SBC_MIN = 50, SBC_MAX = 1500;
const GAMMA_MIN = 10, GAMMA_MAX = 26;               // kN/m³ (normal-weight concrete)
const PHI_MIN = 0, PHI_MAX = 45;                    // degrees

const finite = (label: string) => z.number().finite(`${label} must be a finite number`);

const crossSectionPoint = z.object({
  chainage: finite('chainage'),
  gl: finite('gl'),
});

/**
 * Validates optional JSON body before mergeProjectInput.
 * Unknown keys are stripped so they cannot pollute ProjectInput.
 * Physical bounds added per audit findings — ASSUMPTION items recorded above.
 */
export const projectInputBodySchema = z
  .object({
    projectName: z.string().max(2000).optional(),
    location: z.string().max(2000).optional(),
    riverName: z.string().max(500).optional(),
    bridgeType: z.enum(['submersible', 'high-level']).optional(),
    spanLength: finite('spanLength').min(SPAN_M_MIN).max(SPAN_M_MAX, `spanLength must be <= ${SPAN_M_MAX} m — check units`).optional(),
    numberOfSpans: z.number().int().min(1, 'numberOfSpans must be >= 1').max(500).optional(),
    carriageWidth: finite('carriageWidth').min(3, 'carriageWidth must be >= 3 m (IRC:6 minimum single lane)').max(60).optional(),
    numberOfLanes: z.number().int().min(1).max(20).optional(),
    totalLength: finite('totalLength').min(LENGTH_M_MIN).max(LENGTH_M_MAX).optional(),
    hfl: finite('hfl').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    bedLevel: finite('bedLevel').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    foundationLevel: finite('foundationLevel').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    discharge: finite('discharge').min(0, 'discharge cannot be negative').max(DISCHARGE_MAX, 'discharge exceeds any plausible design flood — check units').optional(),
    manningN: finite('manningN').min(MANNING_N_MIN, `manningN must be >= ${MANNING_N_MIN}`).max(MANNING_N_MAX, `manningN must be <= ${MANNING_N_MAX} (dense vegetation / flood plain)`).optional(),
    bedSlope: finite('bedSlope').min(BED_SLOPE_MIN, `bedSlope must be >= ${BED_SLOPE_MIN} (1-in-N format; N=${BED_SLOPE_MIN} is a very steep slope)`).max(BED_SLOPE_MAX, `bedSlope must be <= ${BED_SLOPE_MAX} (1-in-N format; N=${BED_SLOPE_MAX} is near-flat) — check units`).optional(),
    laceysSiltFactor: finite('laceysSiltFactor').min(SILT_FACTOR_MIN).max(SILT_FACTOR_MAX, `laceysSiltFactor must be <= ${SILT_FACTOR_MAX} (coarse gravel)`).optional(),
    crossSectionData: z.array(crossSectionPoint).min(1, 'crossSectionData needs at least one point').max(200).optional(),
    pierWidth: finite('pierWidth').min(PIER_DIM_M_MIN).max(PIER_DIM_M_MAX).optional(),
    pierLength: finite('pierLength').min(PIER_DIM_M_MIN).max(PIER_DIM_M_MAX).optional(),
    pierDepth: finite('pierDepth').min(-50).max(60, 'pierDepth must be <= 60 m — check units').optional(),
    numberOfPiers: z.number().int().min(0, 'numberOfPiers cannot be negative').max(500).optional(),
    pierBaseWidth: finite('pierBaseWidth').min(PIER_DIM_M_MIN).max(PIER_DIM_M_MAX).optional(),
    pierBaseLength: finite('pierBaseLength').min(PIER_DIM_M_MIN).max(PIER_DIM_M_MAX).optional(),
    abutmentHeight: finite('abutmentHeight').min(ABUTMENT_DIM_M_MIN).max(ABUTMENT_DIM_M_MAX).optional(),
    abutmentWidth: finite('abutmentWidth').min(ABUTMENT_DIM_M_MIN).max(ABUTMENT_DIM_M_MAX).optional(),
    abutmentDepth: finite('abutmentDepth').min(ABUTMENT_DIM_M_MIN).max(ABUTMENT_DIM_M_MAX).optional(),
    dirtWallHeight: finite('dirtWallHeight').min(0, 'dirtWallHeight cannot be negative').max(20).optional(),
    returnWallLength: finite('returnWallLength').min(0, 'returnWallLength cannot be negative').max(100).optional(),
    concreteGrade: z.string().max(50).optional(),
    fck: finite('fck').min(FCK_MIN, `fck must be >= ${FCK_MIN} N/mm² (IS 456:2000 Table 2 minimum grade)`).max(FCK_MAX, `fck must be <= ${FCK_MAX} N/mm² — check units`).optional(),
    steelGrade: z.string().max(50).optional(),
    fy: finite('fy').refine((v) => (FY_VALUES as readonly number[]).includes(v), `fy must be one of ${FY_VALUES.join(', ')} N/mm² (IS 1786 grades)`).optional(),
    sbc: finite('sbc').min(SBC_MIN).max(SBC_MAX, `sbc must be <= ${SBC_MAX} kN/m² — check units`).optional(),
    phi: finite('phi').min(PHI_MIN, 'phi cannot be negative').max(PHI_MAX, `phi must be <= ${PHI_MAX}°`).optional(),
    gamma: finite('gamma').min(GAMMA_MIN, `gamma must be >= ${GAMMA_MIN} kN/m³`).max(GAMMA_MAX, `gamma must be <= ${GAMMA_MAX} kN/m³ (steel is 78.5)`).optional(),
    rtl: finite('rtl').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    agl: finite('agl').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    nbl: finite('nbl').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    ofl: finite('ofl').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    dwl: finite('dwl').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    deckSlabThickness: finite('deckSlabThickness')
      .min(DECK_THICK_M_MIN, `deckSlabThickness must be >= ${DECK_THICK_M_MIN} m (0.1 m = 100 mm; IRC:21-2000 deck minimum is 0.2 m)`)
      .max(DECK_THICK_M_MAX, `deckSlabThickness must be <= ${DECK_THICK_M_MAX} m — check units (mm entered instead of m?)`).optional(),
    freeboardAboveHfl: finite('freeboardAboveHfl').min(-10).max(20, 'freeboardAboveHfl must be <= 20 m — check units').optional(),
    deckSoffitLevel: finite('deckSoffitLevel').min(LEVEL_M_MIN).max(LEVEL_M_MAX).optional(),
    /** Client / department line on TechNote & Tech Report (assessment matrix). */
    issuingAuthority: z.string().max(2000).optional(),
    /** Job / file / estimate reference for office records. */
    jobNumber: z.string().max(500).optional(),
    /** If true, foundation narrative uses hard-rock branch on TechNote / Tech Report. */
    hardRockAvailable: z.boolean().optional(),
    /** Optional; blank means use `concreteGrade` on Tech sheets. */
    concreteGradeFoundation: z.string().max(50).optional(),
    concreteGradePier: z.string().max(50).optional(),
    concreteGradeAbutment: z.string().max(50).optional(),
    concreteGradeDeck: z.string().max(50).optional(),
    concreteGradeWearing: z.string().max(50).optional(),
    /**
     * Optional project ID — when supplied, a successful design run is
     * automatically saved as an Analysis Record (fire-and-forget).
     * Requirement 12.1 / 12.2.
     */
    projectId: z.number().int().positive().optional(),
  })
  .strip()
  .superRefine((v, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    // Water-level ordering: a high flood level below the bed is impossible.
    if (v.hfl !== undefined && v.bedLevel !== undefined && v.hfl <= v.bedLevel)
      add('hfl', `hfl (${v.hfl} m) must be above bedLevel (${v.bedLevel} m).`);
    // dwl may be up to 0.5 m above hfl for submersible bridges (design water
    // level can exceed HFL slightly); anything beyond 0.5 m is a data error.
    if (v.dwl !== undefined && v.hfl !== undefined && v.dwl > v.hfl + 0.5)
      add('dwl', `dwl (${v.dwl} m) exceeds hfl (${v.hfl} m) by more than 0.5 m — check values (submersible bridges allow dwl slightly above hfl).`);
    if (v.foundationLevel !== undefined && v.bedLevel !== undefined && v.foundationLevel > v.bedLevel)
      add('foundationLevel', `foundationLevel (${v.foundationLevel} m) must be at or below bedLevel (${v.bedLevel} m).`);
    if (v.deckSoffitLevel !== undefined && v.hfl !== undefined && v.deckSoffitLevel < v.hfl)
      add('deckSoffitLevel', `deckSoffitLevel (${v.deckSoffitLevel} m) is below hfl (${v.hfl} m) — the deck would be submerged.`);
    // Span × count must be consistent with the declared total length.
    if (v.spanLength !== undefined && v.numberOfSpans !== undefined && v.totalLength !== undefined
        && v.spanLength * v.numberOfSpans > v.totalLength * 1.5)
      add('spanLength', `spanLength (${v.spanLength} m) x numberOfSpans (${v.numberOfSpans}) = ${(v.spanLength * v.numberOfSpans).toFixed(1)} m exceeds totalLength (${v.totalLength} m) — inconsistent geometry.`);
    // Lane check against carriageway width (IRC:6-2017 lane width 3.75 m).
    if (v.carriageWidth !== undefined && v.numberOfLanes !== undefined
        && v.numberOfLanes * 3.75 > v.carriageWidth * 1.2)
      add('numberOfLanes', `numberOfLanes (${v.numberOfLanes}) x 3.75 m lane width exceeds carriageWidth (${v.carriageWidth} m).`);
  });

export type ProjectInputBodyParsed = z.infer<typeof projectInputBodySchema>;

export function formatZodIssues(err: z.ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}
