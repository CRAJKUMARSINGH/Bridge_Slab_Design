/**
 * Narrative report engine — Week 8
 * Generates readable engineering prose from CalculationResult.
 * All sentences link to calculated values; failed checks are never hidden.
 */
import type { CalculationResult } from "./types.js";

export interface ReportSection { id: string; heading: string; body: string; }
export interface ReportChapter { id: string; title: string; sections: ReportSection[]; }

export interface DesignReport {
  projectCode: string; projectName: string; revision: string;
  engineVersion: string; generatedAt: string; inputFingerprint: string;
  reviewState: string; overallStatus: string;
  chapters: ReportChapter[];
  assumptions: string[]; limitations: string[]; failedChecks: string[];
}

const f = (v: number, d = 3) => v.toFixed(d);
const s = (st: string) => st === "PASS" ? "✓ PASS" : "✗ FAIL";

export function generateReport(
  result: CalculationResult,
  projectCode: string, projectName: string,
  revision: string, reviewState = "draft",
): DesignReport {
  const failNote = result.failedChecks.length > 0
    ? `The design does not satisfy all checks — failed checks: ${result.failedChecks.join(", ")}. These must not be disregarded.`
    : "All design checks are satisfied.";

  return {
    projectCode, projectName, revision, reviewState,
    engineVersion: result.engineVersion, generatedAt: result.calculatedAt,
    inputFingerprint: result.inputFingerprint, overallStatus: result.overallStatus,
    chapters: [
      {
        id: "Ch-1", title: "Design Summary", sections: [
          { id: "Ch-1.1", heading: "Project and Status",
            body: `Project: ${projectName} (${projectCode}). ${failNote} ` +
                  `Engine: ${result.engineVersion}. Fingerprint: ${result.inputFingerprint}. DRAFT — licensed-engineer review required.` },
        ],
      },
      {
        id: "Ch-2", title: "Actions", sections: [
          { id: "Ch-2.1", heading: "Design UDL and Effects",
            body: `Design UDL w = ${f(result.designUDL.value)} kN/m.\n` +
                  `Max moment M = wL²/8 = ${f(result.maximumMoment.value)} kN·m.\n` +
                  `Max shear V = wL/2 + γQ·P = ${f(result.maximumShear.value)} kN.` },
        ],
      },
      {
        id: "Ch-3", title: "Resistance and Serviceability Checks", sections: [
          { id: "Ch-3.1", heading: "Bending",
            body: `Bending stress σ = ${f(result.bendingStress.value)} MPa — utilisation ${f(result.bendingUtilisation.value, 4)} — ${s(result.bendingUtilisation.status)}.` },
          { id: "Ch-3.2", heading: "Deflection",
            body: `Live-load deflection δ = ${f(result.liveLoadDeflection.value)} mm — limit ${f(result.deflectionLimit.value)} mm — ${s(result.deflectionCheck.status)}.` },
          { id: "Ch-3.3", heading: "Shear",
            body: `Shear stress τ = ${f(result.shearStress.value, 4)} MPa — ${s(result.shearCheck.status)}.` },
          { id: "Ch-3.4", heading: "Governing",
            body: `Governing utilisation η_gov = ${f(result.governingUtilisation.value, 4)} — ${s(result.governingUtilisation.status)}.\n` +
                  `Adjusted η_adj = ${f(result.adjustedGoverningUtilisation.value, 4)} — ${s(result.adjustedGoverningUtilisation.status)}.` },
        ],
      },
      {
        id: "Ch-4", title: "Assumptions and Limitations", sections: [
          { id: "Ch-4.1", heading: "Assumptions",   body: result.assumptions.map((a,i)=>`${i+1}. ${a}`).join("\n") },
          { id: "Ch-4.2", heading: "Limitations",   body: result.limitations.map((l,i)=>`${i+1}. ${l}`).join("\n") },
          { id: "Ch-4.3", heading: "Review",
            body: "This software calculated the six Week 0 design checks only. A qualified licensed engineer must confirm model, inputs, coefficients, and conclusions before engineering reliance." },
        ],
      },
    ],
    assumptions: result.assumptions, limitations: result.limitations, failedChecks: result.failedChecks,
  };
}
