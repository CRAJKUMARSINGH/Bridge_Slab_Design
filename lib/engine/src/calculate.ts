/**
 * Bridge slab calculation engine — orchestrator (Week 5 refactor)
 *
 * One authoritative pipeline. All paths use this function.
 * No raw numeric literals — everything in coefficients.ts.
 */

import type { BridgeInputs, CalculationResult } from "./types.js";
import { fingerprintInputs }        from "./fingerprint.js";
import { calcDesignUDL, calcMaximumMoment, calcMaximumShear } from "./functions/loads.js";
import { calcBendingStress, calcBendingUtilisation, calcShearStress, calcShearCheck } from "./functions/resistance.js";
import { calcLiveLoadDeflection, calcDeflectionLimit, calcDeflectionCheck, calcGoverningUtilisation, calcAdjustedGoverningUtilisation } from "./functions/serviceability.js";

export const ENGINE_VERSION = "0.5.0";

const DEFAULT_ALPHA = 0.9;
const DEFAULT_K3    = 1.2;

export function calculate(inputs: BridgeInputs): CalculationResult {
  const alpha = inputs.alpha      ?? DEFAULT_ALPHA;
  const k3    = inputs.correctionK3 ?? DEFAULT_K3;

  const designUDL          = calcDesignUDL(inputs);
  const maximumMoment      = calcMaximumMoment(designUDL.value, inputs.span);
  const maximumShear       = calcMaximumShear(designUDL.value, inputs.span, inputs.concentratedLoad);
  const bendingStress      = calcBendingStress(maximumMoment.value, inputs.sectionModulus);
  const bendingUtilisation = calcBendingUtilisation(bendingStress.value, inputs.steelYieldStrength);
  const liveLoadDeflection = calcLiveLoadDeflection(inputs.liveLoadUDL, inputs.span, inputs.secondMomentArea);
  const deflectionLimit    = calcDeflectionLimit(inputs.span, k3);
  const deflectionCheck    = calcDeflectionCheck(liveLoadDeflection.value, deflectionLimit.value);
  const shearStress        = calcShearStress(maximumShear.value, inputs.girderCount, inputs.girderSpacing, inputs.deckThickness);
  const shearCheck         = calcShearCheck(shearStress.value);
  const governingUtilisation = calcGoverningUtilisation(bendingUtilisation.value, liveLoadDeflection.value, deflectionLimit.value);
  const adjustedGoverningUtilisation = calcAdjustedGoverningUtilisation(governingUtilisation.value, alpha, k3);

  const allChecks  = [bendingUtilisation, deflectionCheck, shearCheck, governingUtilisation, adjustedGoverningUtilisation];
  const failedChecks  = allChecks.filter((c) => c.status === "FAIL").map((c) => c.id);
  const overallStatus = failedChecks.length > 0 ? "FAIL" : "PASS";

  return {
    engineVersion: ENGINE_VERSION,
    calculatedAt:  new Date().toISOString(),
    inputFingerprint: fingerprintInputs(inputs),
    designUDL, maximumMoment, maximumShear, bendingStress,
    liveLoadDeflection, deflectionLimit, shearStress,
    bendingUtilisation, deflectionCheck, shearCheck,
    governingUtilisation, adjustedGoverningUtilisation,
    overallStatus, failedChecks,
    assumptions: [
      "Simply-supported beam model (workbook-parity).",
      "Dead load = concreteUnitWeight × deckThickness only.",
      "Live-load deflection uses unit-width strip in N/mm system.",
      "Deflection limit = L/k3 (workbook-parity, see AMB-001).",
      "Shear area = girderCount × girderSpacing_mm × deckThickness_mm.",
      "alpha default 0.9, correctionK3 default 1.2 unless engineer overrides.",
    ],
    limitations: [
      "Week 5 engine: six demo-workbook constraints only.",
      "No punching shear, fatigue, bearing, seismic, or thermal checks.",
      "No parity against canonical Kherwara workbook yet (see OQ-002).",
      "Results must not be used for design decisions without licensed-engineer review.",
    ],
  };
}
