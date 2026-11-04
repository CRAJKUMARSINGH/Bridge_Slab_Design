/**
 * Resistance / section-capacity functions — Week 5
 */
import { COEFFICIENTS as C } from "../coefficients.js";
import type { TracedValue, ConstraintCheck } from "../types.js";

/** Calc!B10 — Bending stress: M×10⁶/Z */
export function calcBendingStress(M: number, Z: number): TracedValue {
  const value = (M * C.kNmToNmm.value) / Z;
  return {
    value, unit: "MPa",
    trace: {
      formula: `M×10⁶/Z = ${M.toFixed(4)}×1000000/${Z}`,
      sourceCells: ["Calc!B10","Calc!B6","Inputs!B13"],
      inputs: ["sectionModulus"], coefficients: ["kNmToNmm"],
    },
  };
}

/** Calc!B11 — Bending utilisation: σ/(fy/γM) */
export function calcBendingUtilisation(sigma: number, fy: number): ConstraintCheck {
  const allowable = fy / C.gammaM.value;
  const value = sigma / allowable;
  return {
    id: "bendingUtilisation", label: "Bending utilisation",
    value, limit: 1.0, unit: "ratio",
    status: value <= 1.0 ? "PASS" : "FAIL",
    trace: {
      formula: `σ/(fy/γM) = ${sigma.toFixed(4)}/(${fy}/${C.gammaM.value})`,
      sourceCells: ["Calc!B11","Calc!B10","Inputs!B8","Factors!B4"],
      inputs: ["steelYieldStrength"], coefficients: ["gammaM"],
    },
  };
}

/** Calc!B18 — Shear stress: V×1000/(n×s_mm×t_mm) */
export function calcShearStress(V: number, n: number, s: number, t: number): TracedValue {
  const s_mm = s * C.mToMm.value;
  const t_mm = t * C.mToMm.value;
  const value = (V * C.kNToN.value) / (n * s_mm * t_mm);
  return {
    value, unit: "MPa",
    trace: {
      formula: `V×1000/(n×s_mm×t_mm) = ${V.toFixed(4)}×1000/(${n}×${s_mm}×${t_mm})`,
      sourceCells: ["Calc!B18","Calc!B7","Inputs!B6","Inputs!B5","Inputs!B9"],
      inputs: ["girderCount","girderSpacing","deckThickness"], coefficients: ["kNToN","mToMm"],
    },
  };
}

/** Calc!B19 — Shear check: τ ≤ τ_cap */
export function calcShearCheck(tau: number): ConstraintCheck {
  const cap = C.shearCapacity.value;
  return {
    id: "shearCheck", label: "Shear check",
    value: tau, limit: cap, unit: "MPa",
    status: tau <= cap ? "PASS" : "FAIL",
    trace: {
      formula: `τ≤τ_cap: ${tau.toFixed(4)}≤${cap}`,
      sourceCells: ["Calc!B19","Calc!B18","Factors!B8"],
      inputs: [], coefficients: ["shearCapacity"],
    },
  };
}
