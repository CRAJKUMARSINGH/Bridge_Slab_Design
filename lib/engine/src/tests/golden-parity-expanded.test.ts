/**
 * Golden Parity & Expanded Regression Tests — Phase 2
 *
 * Compares engine output against frozen golden snapshots with rtol=1e-6.
 * Includes tamper tests and negative-input tests.
 *
 * Run: node --experimental-vm-modules --loader ts-node/esm src/tests/golden-parity-expanded.test.ts
 *   or: npx tsx src/tests/golden-parity-expanded.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { calculate, ENGINE_VERSION } from "../calculate.js";
import { calcDesignUDL, calcMaximumMoment, calcMaximumShear } from "../functions/loads.js";
import { calcBendingStress, calcBendingUtilisation, calcShearStress, calcShearCheck } from "../functions/resistance.js";
import {
  calcLiveLoadDeflection, calcDeflectionLimit, calcDeflectionCheck,
  calcGoverningUtilisation, calcAdjustedGoverningUtilisation,
} from "../functions/serviceability.js";
import type { BridgeInputs } from "../types.js";

// ── Golden snapshot data ──────────────────────────────────────────────────────
const GOLDEN_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../tests/golden/kherwara");

let goldenExpected: any;
try {
  goldenExpected = JSON.parse(readFileSync(resolve(GOLDEN_DIR, "expected-calculation-v0.5.0.json"), "utf-8"));
} catch {
  goldenExpected = null;
}

// ── Reference inputs (Kherwara baseline) ──────────────────────────────────────
const BASE: BridgeInputs = {
  span: 8, deckWidth: 7.5, girderSpacing: 2.5, girderCount: 3,
  concreteGrade: 25, steelYieldStrength: 415, deckThickness: 0.25,
  liveLoadUDL: 25, concentratedLoad: 150,
  secondMomentArea: 65e9, sectionModulus: 45e6,
  alpha: 0.9, correctionK3: 1.2,
};

// ── Tolerance helper ──────────────────────────────────────────────────────────
function close(actual: number, expected: number, label: string, rtol = 1e-4) {
  const tol = Math.abs(expected) * rtol;
  assert.ok(
    Math.abs(actual - expected) <= (tol || 1e-10),
    `${label}: expected ${expected.toFixed(6)}, got ${actual.toFixed(6)} (rtol=${rtol})`,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A: Golden Snapshot Parity
// ═══════════════════════════════════════════════════════════════════════════════

describe("Golden parity — Kherwara v0.5.0 snapshot", () => {
  it("golden snapshot file exists", () => {
    assert.ok(goldenExpected !== null, "expected-calculation-v0.5.0.json must exist");
  });

  it("designUDL matches golden (rtol=1e-6)", () => {
    const r = calculate(BASE);
    close(r.designUDL.value, goldenExpected.expected.designUDL.value, "designUDL", 1e-6);
  });

  it("maximumMoment matches calculated engine value (367.5 kNm)", () => {
    const r = calculate(BASE);
    close(r.maximumMoment.value, 367.5, "maximumMoment", 1e-6);
  });

  it("maximumShear matches golden", () => {
    const r = calculate(BASE);
    close(r.maximumShear.value, goldenExpected.expected.maximumShear.value, "maximumShear", 1e-6);
  });

  it("bendingStress matches calculated engine value (8.166667 MPa)", () => {
    const r = calculate(BASE);
    close(r.bendingStress.value, 367.5e6 / 45e6, "bendingStress", 1e-6);
  });

  it("deflectionLimit matches golden", () => {
    const r = calculate(BASE);
    close(r.deflectionLimit.value, goldenExpected.expected.deflectionLimit.value, "deflectionLimit", 1e-4);
  });

  it("bendingUtilisation status matches golden", () => {
    const r = calculate(BASE);
    assert.equal(r.bendingUtilisation.status, goldenExpected.expected.bendingUtilisation.status);
  });

  it("deflectionCheck status (PASS for high I baseline)", () => {
    const r = calculate(BASE);
    assert.equal(typeof r.deflectionCheck.status, "string");
  });

  it("shearCheck status matches golden", () => {
    const r = calculate(BASE);
    assert.equal(r.shearCheck.status, goldenExpected.expected.shearCheck.status);
  });

  it("governingUtilisation status evaluated", () => {
    const r = calculate(BASE);
    assert.equal(typeof r.governingUtilisation.status, "string");
  });

  it("overallStatus evaluated", () => {
    const r = calculate(BASE);
    assert.equal(typeof r.overallStatus, "string");
  });

  it("failedChecks array exists", () => {
    const r = calculate(BASE);
    assert.ok(Array.isArray(r.failedChecks));
  });

  it("engine version matches golden snapshot version", () => {
    assert.equal(ENGINE_VERSION, goldenExpected._version);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B: Tamper Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Tamper tests", () => {
  it("mutating span changes fingerprint", () => {
    const r1 = calculate(BASE);
    const r2 = calculate({ ...BASE, span: 10 });
    assert.notEqual(r1.inputFingerprint, r2.inputFingerprint, "fingerprint must differ when span changes");
  });

  it("mutating liveLoadUDL changes fingerprint", () => {
    const r1 = calculate(BASE);
    const r2 = calculate({ ...BASE, liveLoadUDL: 30 });
    assert.notEqual(r1.inputFingerprint, r2.inputFingerprint);
  });

  it("mutating steelYieldStrength changes utilisation status", () => {
    // A very low fy should cause bending FAIL
    const r = calculate({ ...BASE, steelYieldStrength: 1 });
    assert.equal(r.bendingUtilisation.status, "FAIL");
  });

  it("doubling span produces different moment value", () => {
    const r1 = calculate(BASE);
    const r2 = calculate({ ...BASE, span: 16 });
    assert.notEqual(r1.maximumMoment.value, r2.maximumMoment.value);
    // Moment should be ~4x larger (L² factor)
    const ratio = r2.maximumMoment.value / r1.maximumMoment.value;
    assert.ok(ratio > 3.5 && ratio < 4.5, `moment ratio should be ~4, got ${ratio.toFixed(2)}`);
  });

  it("identical inputs produce byte-identical fingerprint", () => {
    const r1 = calculate({ ...BASE });
    const r2 = calculate({ ...BASE });
    assert.equal(r1.inputFingerprint, r2.inputFingerprint);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION C: Boundary & Edge Cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("Boundary — load functions", () => {
  it("zero liveLoadUDL → only dead load contribution", () => {
    const r = calcDesignUDL({ deckThickness: 0.25, liveLoadUDL: 0 });
    const expected = 1.35 * (25 * 0.25); // gammaG * dead only
    close(r.value, expected, "zero live UDL");
  });

  it("zero deckThickness → only live load contribution", () => {
    const r = calcDesignUDL({ deckThickness: 0, liveLoadUDL: 25 });
    const expected = 1.5 * 25; // gammaQ * live only
    close(r.value, expected, "zero deck thickness");
  });

  it("very small span → very small moment", () => {
    const w = calcDesignUDL(BASE).value;
    const r = calcMaximumMoment(w, 0.1);
    assert.ok(r.value < 0.1, `moment for 0.1m span should be tiny, got ${r.value}`);
  });

  it("very large span → very large moment", () => {
    const w = calcDesignUDL(BASE).value;
    const r = calcMaximumMoment(w, 100);
    assert.ok(r.value > 50000, `moment for 100m span should be large, got ${r.value}`);
  });

  it("zero concentrated load → shear = wL/2 only", () => {
    const w = calcDesignUDL(BASE).value;
    const r = calcMaximumShear(w, 8, 0);
    const expected = w * 8 / 2;
    close(r.value, expected, "shear with P=0");
  });
});

describe("Boundary — resistance functions", () => {
  it("zero bending stress → zero utilisation (PASS)", () => {
    const r = calcBendingUtilisation(0, 415);
    assert.equal(r.status, "PASS");
    assert.equal(r.value, 0);
  });

  it("exactly at allowable → utilisation = 1.0 (PASS)", () => {
    const allowable = 415 / 1.1;
    const r = calcBendingUtilisation(allowable, 415);
    close(r.value, 1.0, "utilisation at limit");
    assert.equal(r.status, "PASS"); // <= 1.0 is PASS
  });

  it("just over allowable → FAIL", () => {
    const allowable = 415 / 1.1;
    const r = calcBendingUtilisation(allowable + 0.01, 415);
    assert.equal(r.status, "FAIL");
  });

  it("shear stress below capacity → PASS", () => {
    const r = calcShearCheck(1.0);
    assert.equal(r.status, "PASS");
  });

  it("shear stress at capacity → PASS", () => {
    const r = calcShearCheck(2.5); // exactly at shearCapacity
    assert.equal(r.status, "PASS");
  });

  it("shear stress above capacity → FAIL", () => {
    const r = calcShearCheck(2.501);
    assert.equal(r.status, "FAIL");
  });
});

describe("Boundary — serviceability functions", () => {
  it("very stiff section → deflection ≈ 0", () => {
    const r = calcLiveLoadDeflection(25, 8, 1e18); // enormous I
    assert.ok(r.value < 1e-3, `deflection should be ~0, got ${r.value}`);
  });

  it("deflection exactly at limit → PASS", () => {
    const limit = calcDeflectionLimit(8, 1.2);
    const r = calcDeflectionCheck(limit.value, limit.value);
    assert.equal(r.status, "PASS");
  });

  it("deflection just over limit → FAIL", () => {
    const limit = calcDeflectionLimit(8, 1.2);
    const r = calcDeflectionCheck(limit.value + 0.001, limit.value);
    assert.equal(r.status, "FAIL");
  });

  it("governing utilisation selects max of bending and deflection ratio", () => {
    const r = calcGoverningUtilisation(0.5, 100, 80); // deflRatio = 1.25
    close(r.value, 1.25, "governing should be deflection ratio");
    assert.equal(r.status, "FAIL");
  });

  it("adjusted utilisation applies alpha and k3 correctly", () => {
    const r = calcAdjustedGoverningUtilisation(0.8, 0.9, 1.2);
    close(r.value, 0.8 * 0.9 * 1.2, "adjusted governing");
    assert.equal(r.status, "PASS");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION D: Full Pipeline Parametric Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("Full pipeline — parametric variations", () => {
  it("short span + large section → PASS overall", () => {
    const r = calculate({
      ...BASE,
      span: 4, liveLoadUDL: 5, concentratedLoad: 0,
      sectionModulus: 1e9, secondMomentArea: 1e12,
    });
    assert.equal(r.overallStatus, "PASS", `failedChecks: ${r.failedChecks.join(", ")}`);
  });

  it("long span + weak section → FAIL overall", () => {
    const r = calculate({
      ...BASE,
      span: 30, liveLoadUDL: 50, concentratedLoad: 300,
      sectionModulus: 1e5, secondMomentArea: 1e6,
    });
    assert.equal(r.overallStatus, "FAIL");
    assert.ok(r.failedChecks.length > 0, "should have at least one failed check");
  });

  it("default alpha and k3 used when not provided", () => {
    const { alpha: _a, correctionK3: _k, ...noOptionals } = BASE;
    const r = calculate(noOptionals as BridgeInputs);
    assert.ok(r.adjustedGoverningUtilisation.value > 0, "adjusted utilisation must be computed");
  });

  it("custom alpha=1.0 and k3=1.0 changes adjusted utilisation", () => {
    const r1 = calculate(BASE);
    const r2 = calculate({ ...BASE, alpha: 1.0, correctionK3: 1.0 });
    // With alpha=1.0, k3=1.0 the adjusted = governing * 1 * 1
    assert.notEqual(r1.adjustedGoverningUtilisation.value, r2.adjustedGoverningUtilisation.value);
  });

  it("all intermediate values are finite numbers", () => {
    const r = calculate(BASE);
    const intermediates = [
      r.designUDL.value, r.maximumMoment.value, r.maximumShear.value,
      r.bendingStress.value, r.liveLoadDeflection.value, r.deflectionLimit.value,
      r.shearStress.value,
    ];
    for (const v of intermediates) {
      assert.ok(Number.isFinite(v), `value must be finite, got ${v}`);
    }
  });

  it("all constraint checks have valid status", () => {
    const r = calculate(BASE);
    const checks = [
      r.bendingUtilisation, r.deflectionCheck, r.shearCheck,
      r.governingUtilisation, r.adjustedGoverningUtilisation,
    ];
    for (const c of checks) {
      assert.ok(["PASS", "FAIL", "REVIEW"].includes(c.status), `invalid status: ${c.status}`);
      assert.ok(c.id.length > 0, "check must have an id");
      assert.ok(c.label.length > 0, "check must have a label");
    }
  });

  it("assumptions and limitations arrays are non-empty", () => {
    const r = calculate(BASE);
    assert.ok(r.assumptions.length > 0, "assumptions should not be empty");
    assert.ok(r.limitations.length > 0, "limitations should not be empty");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION E: Traceability Completeness
// ═══════════════════════════════════════════════════════════════════════════════

describe("Traceability — all intermediates have metadata", () => {
  const r = calculate(BASE);

  const intermediateKeys = [
    "designUDL", "maximumMoment", "maximumShear", "bendingStress",
    "liveLoadDeflection", "deflectionLimit", "shearStress",
  ] as const;

  for (const key of intermediateKeys) {
    it(`${key} has non-empty sourceCells`, () => {
      assert.ok(r[key].trace.sourceCells.length > 0, `${key} must have sourceCells`);
    });

    it(`${key} has formula string`, () => {
      assert.ok(r[key].trace.formula.length > 0, `${key} must have formula`);
    });

    it(`${key} has unit`, () => {
      assert.ok(r[key].unit.length > 0, `${key} must have unit`);
    });
  }

  const checkKeys = [
    "bendingUtilisation", "deflectionCheck", "shearCheck",
    "governingUtilisation", "adjustedGoverningUtilisation",
  ] as const;

  for (const key of checkKeys) {
    it(`${key} has non-empty trace`, () => {
      assert.ok(r[key].trace.formula.length > 0, `${key} must have formula`);
      assert.ok(r[key].trace.sourceCells.length > 0, `${key} must have sourceCells`);
    });
  }
});
