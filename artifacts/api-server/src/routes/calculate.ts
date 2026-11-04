/**
 * POST /api/calculate — Week 7 traceability endpoint
 */
import type { Request, Response } from "express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../../../");

export async function handleCalculate(req: Request, res: Response): Promise<void> {
  try {
    const { validateInputs }     = await import(join(ROOT, "lib/engine/src-local/api-zod/input-schema.js")).catch(() => import("../../../lib/api-zod/src/input-schema.ts" as string));
    const { calculate }          = await import(join(ROOT, "lib/engine/src/calculate.js")).catch(() => import(join(ROOT, "lib/engine/src/calculate.ts")));
    const { buildTraceRecords, STANDARD_ASSUMPTIONS, STANDARD_LIMITATIONS, STANDARD_REVIEW_CHECKLIST } =
      await import(join(ROOT, "lib/engine/src/traceability.js")).catch(() => import(join(ROOT, "lib/engine/src/traceability.ts")));

    const validation = validateInputs(req.body);
    if (!validation.valid) { res.status(400).json({ error: "Invalid inputs", details: validation.errors }); return; }

    const i = validation.inputs;
    const eng = {
      span: i.spanLength, deckWidth: i.deckWidth, girderSpacing: i.girderSpacing,
      girderCount: i.girderCount, concreteGrade: i.concreteStrength, steelYieldStrength: i.steelGrade,
      deckThickness: i.deckThickness, liveLoadUDL: i.liveLoadUdl,
      concentratedLoad: i.liveLoadPoint ?? 0, secondMomentArea: i.secondMoment,
      sectionModulus: i.sectionModulus, alpha: i.alpha ?? 0.9, correctionK3: i.correctionK3 ?? 1.2,
    };
    const result = calculate(eng as Parameters<typeof calculate>[0]);
    const traces = buildTraceRecords(result);

    res.json({ engineVersion: result.engineVersion, calculatedAt: result.calculatedAt,
      inputFingerprint: result.inputFingerprint, overallStatus: result.overallStatus,
      failedChecks: result.failedChecks,
      intermediates: { designUDL: result.designUDL, maximumMoment: result.maximumMoment,
        maximumShear: result.maximumShear, bendingStress: result.bendingStress,
        liveLoadDeflection: result.liveLoadDeflection, deflectionLimit: result.deflectionLimit, shearStress: result.shearStress },
      constraints: { bendingUtilisation: result.bendingUtilisation, deflectionCheck: result.deflectionCheck,
        shearCheck: result.shearCheck, governingUtilisation: result.governingUtilisation,
        adjustedGoverningUtilisation: result.adjustedGoverningUtilisation },
      traceRecords: traces, assumptions: STANDARD_ASSUMPTIONS, limitations: STANDARD_LIMITATIONS,
      reviewChecklist: STANDARD_REVIEW_CHECKLIST,
    });
  } catch (err) {
    res.status(500).json({ error: "Calculation failed", message: (err as Error).message });
  }
}
