/**
 * Runtime boundary for the bridge design calculation pipeline.
 *
 * The workbook/report generators must not accept an incomplete object and then
 * silently fill engineering values.  This schema is intentionally kept next to
 * ProjectInput so the CLI, API, and workbook paths can share the same contract.
 */

import { z } from 'zod';
import type { ProjectInput } from './types';

const finitePositive = z.number().finite().positive();
const finiteNonNegative = z.number().finite().nonnegative();

/**
 * Bed slope is the DENOMINATOR of the "1 in N" convention used on every drawing and
 * in Manning's equation (S = 1/N), so N = 1500 means a fall of 1 m per 1500 m.
 * Bounds: N < 1 would mean a slope steeper than 100 %, and N > 100 000 is flatter
 * than any surveyed natural watercourse this tool is used on — both are typos for
 * the gradient form (0.000667) rather than the 1-in-N form, and Manning would then
 * return a velocity ~sqrt(1500) times out of scale.
 */
const bedSlopeDenominator = z.number().finite().min(1).max(100_000);

/**
 * Fallback for the optional `deckSlabThickness` input. Every consumer must use
 * this constant: sheets 3, 5, the BOQ, the drawings and the checklist each used
 * to guess their own value (0.83, 0.8, 0.25, 0.35, 0.5), so one bridge could be
 * modelled with five different deck slabs.
 */
export const DEFAULT_DECK_SLAB_THICKNESS_M = 0.25;

/** Read the deck slab thickness a project states, or the single project default. */
export function deckSlabThicknessOf(input: { deckSlabThickness?: number }): number {
  return input.deckSlabThickness ?? DEFAULT_DECK_SLAB_THICKNESS_M;
}

export const ProjectInputSchema = z.object({
  projectName: z.string().trim().min(1),
  location: z.string().trim().min(1),
  riverName: z.string().trim().min(1),
  bridgeType: z.string().trim().optional(),
  jobNumber: z.string().trim().optional(),
  issuingAuthority: z.string().trim().optional(),
  hardRockAvailable: z.boolean().optional(),

  spanLength: finitePositive,
  numberOfSpans: z.number().int().positive(),
  numberOfLanes: z.number().int().positive().optional(),
  carriageWidth: finitePositive,
  totalLength: finitePositive,
  bridgeLength: finitePositive.optional(),
  bridgeWidth: finitePositive.optional(),
  skew: z.number().finite().optional(),
  deckSlabThickness: finitePositive.optional(),
  deckSoffitLevel: z.number().finite().optional(),
  freeboardAboveHfl: finiteNonNegative.optional(),
  pierDesign: z.object({
    effectiveSpan: finitePositive.optional(),
    spanCC: finitePositive.optional(),
  }).optional(),
  hydraulics: z.object({
    crossSectionalArea: finiteNonNegative.optional(),
    wettedPerimeter: finiteNonNegative.optional(),
    hydraulicRadius: finiteNonNegative.optional(),
    velocity: finiteNonNegative.optional(),
    discharge: finiteNonNegative.optional(),
    regimeWidth: finiteNonNegative.optional(),
    effectiveWaterway: finiteNonNegative.optional(),
    scourDepth: finiteNonNegative.optional(),
    designScourDepth: finiteNonNegative.optional(),
    afflux: finiteNonNegative.optional(),
    designWaterLevel: z.number().finite().optional(),
    hfl: z.number().finite().optional(),
    froudeNumber: finiteNonNegative.optional(),
    flowType: z.string().optional(),
    foundationDepth: finiteNonNegative.optional(),
    foundationLevel: z.number().finite().optional(),
    soffitLevel: z.number().finite().optional(),
    // Freeboard is measured UPWARD from a water level to the soffit, so it is legitimately negative:
    // a submersible crossing whose design water level rises above the deck soffit (small-bridge:
    // soffit 283.25 m against DWL 284.01 m) is a designed-for-overtopping case, not bad data. Forbidding
    // the sign here used to throw ZodError inside the HTML report for two of the twenty templates,
    // which the single-project deliverables run never exercised. Adequacy is carried by isFreeboardSafe.
    freeboard: z.number().finite().optional(),
    freeboardAboveHfl: z.number().finite().optional(),
    ircMinimumFreeboardAboveHfl: finiteNonNegative.optional(),
    requiredFreeboardAboveHfl: finiteNonNegative.optional(),
    isFreeboardSafe: z.boolean().optional(),
  }).partial().optional(),

  hfl: z.number().finite(),
  bedLevel: z.number().finite(),
  foundationLevel: z.number().finite(),
  discharge: finiteNonNegative,
  manningN: finitePositive,
  bedSlope: bedSlopeDenominator,
  laceysSiltFactor: finitePositive,
  crossSectionData: z.array(z.object({
    chainage: z.number().finite(),
    gl: z.number().finite(),
  })).min(2),

  pierWidth: finitePositive,
  pierLength: finitePositive,
  pierDepth: finitePositive,
  numberOfPiers: z.number().int().nonnegative(),
  pierBaseWidth: finitePositive,
  pierBaseLength: finitePositive,

  abutmentHeight: finitePositive,
  abutmentWidth: finitePositive,
  abutmentDepth: finitePositive,
  dirtWallHeight: finiteNonNegative,
  returnWallLength: finiteNonNegative,

  concreteGrade: z.string().trim().min(1),
  fck: finitePositive,
  steelGrade: z.string().trim().min(1),
  fy: finitePositive,

  sbc: finitePositive,
  phi: z.number().finite().min(0).max(50),
  gamma: finitePositive,

  rtl: z.number().finite(),
  agl: z.number().finite(),
  nbl: z.number().finite(),
  ofl: z.number().finite(),
  dwl: z.number().finite(),

  concreteGradeFoundation: z.string().trim().optional(),
  concreteGradePier: z.string().trim().optional(),
  concreteGradeAbutment: z.string().trim().optional(),
  concreteGradeDeck: z.string().trim().optional(),
  concreteGradeWearing: z.string().trim().optional(),
}).superRefine((value, ctx) => {
  const spanProduct = value.spanLength * value.numberOfSpans;
  if (value.totalLength < spanProduct * 0.95) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalLength'],
      message: 'totalLength is materially shorter than spanLength × numberOfSpans',
    });
  }
  if (value.totalLength > spanProduct * 1.10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalLength'],
      message: 'totalLength exceeds spanLength × numberOfSpans by more than 10%; verify abutment/approach allocations',
    });
  }
  for (let i = 1; i < value.crossSectionData.length; i += 1) {
    if (value.crossSectionData[i].chainage <= value.crossSectionData[i - 1].chainage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['crossSectionData', i, 'chainage'],
        message: 'cross-section chainages must be strictly increasing',
      });
    }
  }
  if (value.numberOfPiers > 0 && value.numberOfPiers >= value.numberOfSpans) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['numberOfPiers'],
      message: 'numberOfPiers must be less than numberOfSpans for a conventional multi-span bridge',
    });
  }
  if (value.hfl <= value.bedLevel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['hfl'],
      message: 'Highest Flood Level (hfl) must be above the average bed level (bedLevel)',
    });
  }
  if (value.foundationLevel >= value.bedLevel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['foundationLevel'],
      message: 'Foundation level must be below the bed level; foundation must penetrate the riverbed',
    });
  }
  // OFL may equal HFL: the Kherwara employer record carries the same gauge for
  // both, which is normal for a submersible crossing where the roadway is under
  // water at either level. Only OFL *above* HFL is physically inconsistent.
  // Confirming the governing levels stays a sign-off item.
  if (value.hfl < value.ofl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ofl'],
      message: 'Ordinary Flood Level (ofl) must not exceed the Highest Flood Level (hfl)',
    });
  }
  if (value.ofl <= value.nbl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['nbl'],
      message: 'Normal Bed Level (nbl) must be below the Ordinary Flood Level (ofl)',
    });
  }
  if (value.rtl <= value.agl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rtl'],
      message: 'Road Top Level (rtl) must be above the Average Ground Level (agl)',
    });
  }
  if (value.skew !== undefined && (value.skew < 0 || value.skew >= 60)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['skew'],
      message: 'Skew angle must be in [0, 60) degrees; skew ≥ 60° requires a non-standard analysis outside this engine',
    });
  }
  const fyGrade = value.steelGrade.toUpperCase();
  if ((fyGrade === 'FE415' && Math.abs(value.fy - 415) > 1) ||
      (fyGrade === 'FE500' && Math.abs(value.fy - 500) > 1)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['fy'],
      message: `fy (${value.fy}) is inconsistent with steelGrade "${value.steelGrade}"; expected ~${fyGrade === 'FE415' ? 415 : fyGrade === 'FE500' ? 500 : 'matching grade'} MPa`,
    });
  }
});

export type ValidatedProjectInput = z.infer<typeof ProjectInputSchema>;

export function validateProjectInput(value: unknown): ProjectInput {
  return ProjectInputSchema.parse(value) as ProjectInput;
}

export function assertValidProjectInput(value: unknown): asserts value is ProjectInput {
  ProjectInputSchema.parse(value);
}
