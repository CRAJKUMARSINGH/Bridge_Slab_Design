/**
 * Unit tests — Week 5
 * Node built-in test runner (no extra deps)
 * Run: node --experimental-vm-modules --loader ts-node/esm src/tests/calculate.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculate, ENGINE_VERSION } from "../calculate.js";
import { calcDesignUDL, calcMaximumMoment, calcMaximumShear } from "../functions/loads.js";
import { calcBendingStress, calcBendingUtilisation } from "../functions/resistance.js";
import { calcLiveLoadDeflection, calcDeflectionLimit } from "../functions/serviceability.js";
import type { BridgeInputs } from "../types.js";

const BASE: BridgeInputs = {
  span: 8, deckWidth: 7.5, girderSpacing: 2.5, girderCount: 3,
  concreteGrade: 25, steelYieldStrength: 415, deckThickness: 0.25,
  liveLoadUDL: 25, concentratedLoad: 150,
  secondMomentArea: 65e9, sectionModulus: 45e6,
  alpha: 0.9, correctionK3: 1.2,
};

function close(a: number, e: number, label: string, pct = 0.1) {
  const tol = Math.abs(e) * (pct / 100);
  assert.ok(Math.abs(a - e) <= tol, `${label}: expected ${e.toFixed(6)}, got ${a.toFixed(6)}`);
}

describe("calcDesignUDL", () => {
  it("gammaG×dead + gammaQ×live", () => {
    const r = calcDesignUDL(BASE);
    // 1.35×(25×0.25)+1.5×25 = 1.35×6.25+37.5 = 8.4375+37.5 = 45.9375
    close(r.value, 45.9375, "designUDL");
    assert.equal(r.unit, "kN/m");
  });
});

describe("calcMaximumMoment", () => {
  it("wL²/8", () => {
    const w = calcDesignUDL(BASE).value;
    close(calcMaximumMoment(w, BASE.span).value, w * 64 / 8, "moment");
  });
});

describe("calcMaximumShear", () => {
  it("wL/2 + gammaQ×P", () => {
    const w = calcDesignUDL(BASE).value;
    const expected = w * 8 / 2 + 1.5 * 150;
    close(calcMaximumShear(w, BASE.span, BASE.concentratedLoad).value, expected, "shear");
  });
});

describe("calcBendingStress", () => {
  it("M×1e6/Z", () => {
    const M = calcMaximumMoment(calcDesignUDL(BASE).value, BASE.span).value;
    close(calcBendingStress(M, BASE.sectionModulus).value, M * 1e6 / BASE.sectionModulus, "σ_bend");
  });
});

describe("calcBendingUtilisation PASS", () => {
  it("300 MPa vs fy=415 → PASS", () => {
    const r = calcBendingUtilisation(300, 415);
    assert.equal(r.status, "PASS");
    close(r.value, 300 / (415 / 1.1), "eta_bend");
  });
});

describe("calcDeflectionLimit", () => {
  it("L/k3 = 8000/1.2", () => {
    close(calcDeflectionLimit(8, 1.2).value, 8000 / 1.2, "deflLim");
  });
});

describe("calculate (full pipeline)", () => {
  it("runs without throwing", () => assert.doesNotThrow(() => calculate(BASE)));
  it("returns correct engine version", () => assert.equal(calculate(BASE).engineVersion, ENGINE_VERSION));
  it("fingerprint stable", () => assert.equal(calculate(BASE).inputFingerprint, calculate({ ...BASE }).inputFingerprint));
  it("fingerprint changes with different input", () => assert.notEqual(calculate(BASE).inputFingerprint, calculate({ ...BASE, span: 10 }).inputFingerprint));
  it("trace sourceCells non-empty for all intermediates", () => {
    const r = calculate(BASE);
    for (const k of ["designUDL","maximumMoment","maximumShear","bendingStress","liveLoadDeflection","deflectionLimit","shearStress"] as const)
      assert.ok(r[k].trace.sourceCells.length > 0, `${k} must have sourceCells`);
  });
  it("oversized section → PASS", () => {
    const r = calculate({ ...BASE, span: 4, liveLoadUDL: 5, concentratedLoad: 0, sectionModulus: 1e9, secondMomentArea: 1e12 });
    assert.equal(r.overallStatus, "PASS", `failedChecks: ${r.failedChecks.join(", ")}`);
  });
});
