/**
 * Load / action functions — Week 5
 */
import { COEFFICIENTS as C } from "../coefficients.js";
import type { BridgeInputs, TracedValue } from "../types.js";

/** Calc!B5 — Design UDL: gammaG×(rho_c×t) + gammaQ×q */
export function calcDesignUDL(inputs: Pick<BridgeInputs, "deckThickness" | "liveLoadUDL">): TracedValue {
  const dead  = C.concreteUnitWeight.value * inputs.deckThickness;
  const value = C.gammaG.value * dead + C.gammaQ.value * inputs.liveLoadUDL;
  return {
    value, unit: "kN/m",
    trace: {
      formula: `γG×(ρc×t)+γQ×q = ${C.gammaG.value}×(${C.concreteUnitWeight.value}×${inputs.deckThickness})+${C.gammaQ.value}×${inputs.liveLoadUDL}`,
      sourceCells: ["Calc!B5","Factors!B1","Factors!B2","Factors!B6","Inputs!B9","Inputs!B10"],
      inputs: ["deckThickness","liveLoadUDL"], coefficients: ["gammaG","gammaQ","concreteUnitWeight"],
    },
  };
}

/** Calc!B6 — Maximum moment: wL²/8 */
export function calcMaximumMoment(w: number, L: number): TracedValue {
  const value = (w * L ** 2) / C.momentDivisor.value;
  return {
    value, unit: "kN·m",
    trace: {
      formula: `wL²/8 = ${w.toFixed(4)}×${L}²/8`,
      sourceCells: ["Calc!B6","Calc!B5","Inputs!B3"],
      inputs: ["span"], coefficients: ["momentDivisor"],
    },
  };
}

/** Calc!B7 — Maximum shear: wL/2 + gammaQ×P */
export function calcMaximumShear(w: number, L: number, P: number): TracedValue {
  const value = (w * L) / C.shearDivisor.value + C.gammaQ.value * P;
  return {
    value, unit: "kN",
    trace: {
      formula: `wL/2+γQ×P = ${w.toFixed(4)}×${L}/2+${C.gammaQ.value}×${P}`,
      sourceCells: ["Calc!B7","Calc!B5","Inputs!B3","Inputs!B11","Factors!B2"],
      inputs: ["span","concentratedLoad"], coefficients: ["shearDivisor","gammaQ"],
    },
  };
}
