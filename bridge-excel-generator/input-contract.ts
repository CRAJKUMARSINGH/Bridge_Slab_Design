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
    freeboard: finiteNonNegative.optional(),
    freeboardAboveHfl: finiteNonNegative.optional(),
    ircMinimumFreeboardAboveHfl: finiteNonNegative.optional(),
    requiredFreeboardAboveHfl: finiteNonNegative.optional(),
    isFreeboardSafe: z.boolean().optional(),
  }).partial().optional(),

  hfl: z.number().finite(),
  bedLevel: z.number().finite(),
  foundationLevel: z.number().finite(),
  discharge: finiteNonNegative,
  manningN: finitePositive,
  bedSlope: finitePositive,
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
  if (value.totalLength < value.spanLength * value.numberOfSpans * 0.95) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalLength'],
      message: 'totalLength is materially shorter than spanLength × numberOfSpans',
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
});

export type ValidatedProjectInput = z.infer<typeof ProjectInputSchema>;

export function validateProjectInput(value: unknown): ProjectInput {
  return ProjectInputSchema.parse(value) as ProjectInput;
}

export function assertValidProjectInput(value: unknown): asserts value is ProjectInput {
  ProjectInputSchema.parse(value);
}
