/**
 * Hydraulic Calculation Tests — ported from SECONDARY app (astra-improvements.test.ts)
 * Updated for PRIMARY app: F1 applied to total discharge, max scour = 2.0×
 */
import { describe, it, expect } from "vitest";
import {
  computeHydraulics,
  type CrossSectionPoint,
  DEFAULT_HYDRAULIC,
} from "../hydraulicCalc";

describe("Cross-section integration", () => {
  it("computes area and perimeter from survey points", () => {
    const points: CrossSectionPoint[] = [
      { chainage: 126.933, bedLevel: 67.37 },
      { chainage: 132.933, bedLevel: 64.17 },
      { chainage: 138.933, bedLevel: 62.388 },
      { chainage: 145.433, bedLevel: 61.97 },
      { chainage: 151.933, bedLevel: 62.25 },
      { chainage: 157.933, bedLevel: 63.37 },
      { chainage: 163.933, bedLevel: 67.37 },
    ];

    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      crossSectionPoints: points,
      hfl: 67.37,
      dischargeMethod: "max",
    });

    expect(result.computedArea).toBeDefined();
    expect(result.computedArea).toBeGreaterThan(0);
    expect(result.computedPerimeter).toBeDefined();
    expect(result.computedPerimeter).toBeGreaterThan(0);
    expect(result.waterSpread).toBeCloseTo(37, 1); // 163.933 - 126.933
  });

  it("falls back to legacy inputs when no cross-section points", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      crossSectionPoints: undefined,
      dischargeMethod: "manning",
    });

    expect(result.computedArea).toBeUndefined();
    expect(result.computedPerimeter).toBeUndefined();
    expect(result.waterSpread).toBeUndefined();
    expect(result.discharge).toBeGreaterThan(0);
  });
});

describe("Discharge methods", () => {
  it("dual discharge check — adopts max of observed vs Manning", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      observedVelocity: 2.2,
      dischargeMethod: "max",
    });

    expect(result.dischargeObserved).toBeDefined();
    expect(result.dischargeManning).toBeDefined();
    expect(result.dischargeMethod).toBe("Maximum (Observed vs Manning)");
    expect(result.discharge).toBeGreaterThan(0);
    expect(result.discharge).toBeGreaterThanOrEqual(result.dischargeManning);
  });

  it("user-specified discharge overrides Manning", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      dischargeMethod: "user",
      userDischarge: 500,
    });
    expect(result.discharge).toBe(500);
    expect(result.dischargeMethod).toBe("User Specified");
  });
});

describe("Scour depth — IRC:78-1983", () => {
  it("mean scour uses Lacey formula d2 = 1.34 × (Db²/Ksf)^(1/3)", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      dischargeMethod: "manning",
    });
    expect(result.meanScourDepth).toBeGreaterThan(0);
    expect(result.maxScourDepth).toBeGreaterThan(result.meanScourDepth);
  });

  it("max scour = 2.0 × mean scour (IRC:78-1983)", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      dischargeMethod: "manning",
    });
    const ratio = result.maxScourDepth / result.meanScourDepth;
    expect(ratio).toBeCloseTo(2.0, 5);
  });

  it("F1 applied to total discharge scales scour depth", () => {
    const base = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      F1: 1.0,
      dischargeMethod: "manning",
    });
    const scaled = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      F1: 1.3,
      dischargeMethod: "manning",
    });
    // Higher F1 → higher Db → deeper scour
    expect(scaled.meanScourDepth).toBeGreaterThan(base.meanScourDepth);
    expect(scaled.dischargePerMetre).toBeCloseTo(base.dischargePerMetre * 1.3, 3);
  });

  it("F2 factor controls foundation depth below HFL", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      F1: 1.0,
      F2: 1.33,
      lwl: 94.5,
      lbl: 93.5,
      dischargeMethod: "manning",
    });

    expect(result.foundationDepth).toBeDefined();
    expect(result.foundationLevel).toBeDefined();
    expect(result.depthFromLWL).toBeDefined();
    expect(result.depthFromLBL).toBeDefined();
    expect(result.foundationLevel!).toBeLessThan(result.inputs.hfl);
  });
});

describe("Afflux — Molesworth formula", () => {
  it("afflux is non-negative for valid inputs", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      dischargeMethod: "manning",
    });
    expect(result.afflux).toBeGreaterThanOrEqual(0);
  });

  it("afflux flood level = HFL + afflux", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      dischargeMethod: "manning",
    });
    expect(result.affluxFloodLevel).toBeCloseTo(
      result.inputs.hfl + result.afflux,
      6,
    );
  });

  it("deck clearance = topOfDeck − affluxFloodLevel", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      dischargeMethod: "manning",
    });
    expect(result.deckClearance).toBeCloseTo(
      result.inputs.topOfDeck - result.affluxFloodLevel,
      6,
    );
  });

  it("status OK when deck is above afflux flood level", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      topOfDeck: 999, // well above HFL
      dischargeMethod: "manning",
    });
    expect(result.status).toBe("OK");
  });

  it("status FAIL when deck is below afflux flood level", () => {
    const result = computeHydraulics({
      ...DEFAULT_HYDRAULIC,
      topOfDeck: 90, // well below HFL of 99.5
      dischargeMethod: "manning",
    });
    expect(result.status).toBe("FAIL");
  });
});
