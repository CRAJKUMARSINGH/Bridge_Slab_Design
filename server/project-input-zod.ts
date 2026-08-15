import { z } from 'zod';

const crossSectionPoint = z.object({
  chainage: z.number().finite(),
  gl: z.number().finite(),
});

/**
 * Validates optional JSON body before mergeProjectInput.
 * Unknown keys are stripped so they cannot pollute ProjectInput.
 */
export const projectInputBodySchema = z
  .object({
    projectName: z.string().max(2000).optional(),
    location: z.string().max(2000).optional(),
    riverName: z.string().max(500).optional(),
    bridgeType: z.enum(['submersible', 'high-level']).optional(),
    spanLength: z.number().finite().optional(),
    numberOfSpans: z.number().int().min(1).max(500).optional(),
    carriageWidth: z.number().finite().positive().optional(),
    numberOfLanes: z.number().int().min(1).max(20).optional(),
    totalLength: z.number().finite().positive().optional(),
    hfl: z.number().finite().optional(),
    bedLevel: z.number().finite().optional(),
    foundationLevel: z.number().finite().optional(),
    discharge: z.number().finite().optional(),
    manningN: z.number().finite().positive().optional(),
    bedSlope: z.number().finite().positive().optional(),
    laceysSiltFactor: z.number().finite().positive().optional(),
    crossSectionData: z.array(crossSectionPoint).min(1).max(200).optional(),
    pierWidth: z.number().finite().positive().optional(),
    pierLength: z.number().finite().positive().optional(),
    pierDepth: z.number().finite().optional(),
    numberOfPiers: z.number().int().min(0).max(500).optional(),
    pierBaseWidth: z.number().finite().positive().optional(),
    pierBaseLength: z.number().finite().positive().optional(),
    abutmentHeight: z.number().finite().positive().optional(),
    abutmentWidth: z.number().finite().positive().optional(),
    abutmentDepth: z.number().finite().positive().optional(),
    dirtWallHeight: z.number().finite().optional(),
    returnWallLength: z.number().finite().optional(),
    concreteGrade: z.string().max(50).optional(),
    fck: z.number().finite().positive().optional(),
    steelGrade: z.string().max(50).optional(),
    fy: z.number().finite().positive().optional(),
    sbc: z.number().finite().positive().optional(),
    phi: z.number().finite().optional(),
    gamma: z.number().finite().positive().optional(),
    rtl: z.number().finite().optional(),
    agl: z.number().finite().optional(),
    nbl: z.number().finite().optional(),
    ofl: z.number().finite().optional(),
    dwl: z.number().finite().optional(),
    deckSlabThickness: z.number().finite().positive().optional(),
    freeboardAboveHfl: z.number().finite().optional(),
    deckSoffitLevel: z.number().finite().optional(),
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
  .strip();

export type ProjectInputBodyParsed = z.infer<typeof projectInputBodySchema>;

export function formatZodIssues(err: z.ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}
