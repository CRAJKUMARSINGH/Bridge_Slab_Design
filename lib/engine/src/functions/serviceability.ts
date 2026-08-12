/**
 * Serviceability functions — Week 5
 */
import { COEFFICIENTS as C } from "../coefficients.js";
import type { TracedValue, ConstraintCheck } from "../types.js";

/** Calc!B14 — Live-load deflection: 5wL⁴/384EI (N/mm system) */
export function calcLiveLoadDeflection(q: number, L: number, I: number): TracedValue {
  const w_N_mm = q * 1e-3;                  // kN/m → N/mm (unit-width strip)
  const L_mm   = L * C.mToMm.value;
  const E      = C.elasticModulusSteel.value;
  const value  = (C.deflectionNum.value * w_N_mm * L_mm ** 4) / (C.deflectionDen.value * E * I);
  return {
    value, unit: "mm",
    trace: {
      formula: `5×(q×10⁻³)×L_mm⁴/(384×E×I) [N/mm system, unit-width strip]`,
      sourceCells: ["Calc!B14","Inputs!B10","Inputs!B3","Inputs!B12","Factors!B5"],
      inputs: ["liveLoadUDL","span","secondMomentArea"], coefficients: ["deflectionNum","deflectionDen","elasticModulusSteel","mToMm"],
    },
  };
}

/** Calc!B15 — Deflection limit: L/k3 (workbook-parity — see AMB-001) */
export function calcDeflectionLimit(L: number, k3: number): TracedValue {
  const L_mm  = L * C.mToMm.value;
  const value = L_mm / k3;
  return {
    value, unit: "mm",
    trace: {
      formula: `L_mm/k3 = ${L}×1000/${k3}  [workbook-parity AMB-001]`,
      sourceCells: ["Calc!B15","Inputs!B3","Calc!B21"],
      inputs: ["span"], coefficients: ["correctionK3","mToMm"],
    },
  };
}

/** Calc!B16 — Deflection check: δ ≤ δ_lim */
export function calcDeflectionCheck(delta: number, deltaLim: number): ConstraintCheck {
  return {
    id: "deflectionCheck", label: "Deflection check",
    value: delta, limit: deltaLim, unit: "mm",
    status: delta <= deltaLim ? "PASS" : "FAIL",
    trace: {
      formula: `δ≤δ_lim: ${delta.toFixed(4)}≤${deltaLim.toFixed(4)}`,
      sourceCells: ["Calc!B16","Calc!B14","Calc!B15"],
      inputs: [], coefficients: [],
    },
  };
}

/** Calc!B20 — Governing utilisation: MAX(η_bend, δ/δ_lim) */
export function calcGoverningUtilisation(eta_bend: number, delta: number, deltaLim: number): ConstraintCheck {
  const deflRatio = delta / deltaLim;
  const value     = Math.max(eta_bend, deflRatio);
  return {
    id: "governingUtilisation", label: "Governing utilisation",
    value, limit: 1.0, unit: "ratio",
    status: value <= 1.0 ? "PASS" : "FAIL",
    trace: {
      formula: `MAX(η_bend,δ/δ_lim) = MAX(${eta_bend.toFixed(4)},${deflRatio.toFixed(4)})`,
      sourceCells: ["Calc!B20","Calc!B11","Calc!B16","Calc!B15"],
      inputs: [], coefficients: [],
    },
  };
}

/** Calc!B22 — Adjusted governing utilisation: η_gov × α × k3 */
export function calcAdjustedGoverningUtilisation(eta_gov: number, alpha: number, k3: number): ConstraintCheck {
  const value = eta_gov * alpha * k3;
  return {
    id: "adjustedGoverningUtilisation", label: "Adjusted governing utilisation",
    value, limit: 1.0, unit: "ratio",
    status: value <= 1.0 ? "PASS" : "FAIL",
    trace: {
      formula: `η_gov×α×k3 = ${eta_gov.toFixed(4)}×${alpha}×${k3}`,
      sourceCells: ["Calc!B22","Calc!B20","Calc!B13","Calc!B21"],
      inputs: [], coefficients: ["alpha","correctionK3"],
    },
  };
}
