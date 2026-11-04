import { describe, it, expect } from "vitest";
import {
  slabInputSchema,
  validateSlabInputs,
  parseSlabInputs,
  collectSlabWarnings,
  effectiveDepthOf,
  SlabInputValidationError,
  CONCRETE_GRADES,
  BOUNDARY_CONDITIONS,
} from "../slabInputSchema";
import { designSlab } from "../slabCalc";
import type { SlabInputs } from "../slabCalc";

// ── Canonical valid input used by existing B-series tests ────────────────────
const VALID: SlabInputs = {
  slabName: "S1",
  slabType: "twoway",
  concreteGrade: "M25",
  steelGrade: "Fe500",
  lx: 3.0,
  ly: 3.0,
  thickness: 150,
  floorFinish: 1.0,
  sunkLoad: 0,
  liveLoad: 4.0,
  boundaryCondition: "interior_panel",
  cover: 20,
  barDia: 10,
};

describe("Slab Input Physical-Bounds Schema (Category V)", () => {
  it("V01: accepts the canonical valid input", () =>
    expect(slabInputSchema.safeParse(VALID).success).toBe(true));

  it("V02: rejects zero span (audit probe: lx=0 previously returned deflection OK)", () => {
    const r = slabInputSchema.safeParse({ ...VALID, lx: 0, ly: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("must be > 0"))).toBe(true);
  });

  it("V03: rejects negative span (audit probe: lx=-3 previously returned OK)", () =>
    expect(slabInputSchema.safeParse({ ...VALID, lx: -3 }).success).toBe(false));

  it("V04: rejects NaN span", () =>
    expect(slabInputSchema.safeParse({ ...VALID, lx: NaN }).success).toBe(false));

  it("V05: rejects Infinity span", () =>
    expect(slabInputSchema.safeParse({ ...VALID, lx: Infinity }).success).toBe(false));

  it("V06: rejects sub-100 mm thickness (audit probe: 20 mm gave d=-5 mm, status OK)", () => {
    const r = slabInputSchema.safeParse({ ...VALID, thickness: 20 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("thickness must be >="))).toBe(true);
  });

  it("V07: rejects absurd live load (audit probe: 1e6 kN/m² previously returned OK)", () => {
    const r = slabInputSchema.safeParse({ ...VALID, liveLoad: 1e6 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("check units"))).toBe(true);
  });

  it("V08: rejects negative floorFinish / sunkLoad", () => {
    expect(slabInputSchema.safeParse({ ...VALID, floorFinish: -1 }).success).toBe(false);
    expect(slabInputSchema.safeParse({ ...VALID, sunkLoad: -2 }).success).toBe(false);
  });

  it("V09: rejects non-standard bar diameter", () =>
    expect(slabInputSchema.safeParse({ ...VALID, barDia: 11 }).success).toBe(false));

  it("V10: rejects concrete grade outside the IS 456 code set", () => {
    expect(slabInputSchema.safeParse({ ...VALID, concreteGrade: "M22.5" }).success).toBe(false);
    expect(CONCRETE_GRADES).not.toContain("M22.5" as never);
  });

  it("V11: rejects cover below 20 mm and above 75 mm (IS 456 Cl. 26.4 Table 16)", () => {
    expect(slabInputSchema.safeParse({ ...VALID, cover: 10 }).success).toBe(false);
    expect(slabInputSchema.safeParse({ ...VALID, cover: 200 }).success).toBe(false);
  });

  it("V12: cross-field — effective depth below 50 mm is rejected", () => {
    const r = slabInputSchema.safeParse({ ...VALID, thickness: 100, cover: 70, barDia: 25 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("Effective depth"))).toBe(true);
  });

  it("V13: two-way with Ly/Lx in (2, 3] is ALLOWED — engine handles via IS 456 Cl. 24.1 one-way fallback", () =>
    expect(slabInputSchema.safeParse({ ...VALID, lx: 2.0, ly: 5.0 }).success).toBe(true));

  it("V14: Ly/Lx beyond the 3.0 ceiling is rejected", () => {
    const r = slabInputSchema.safeParse({ ...VALID, lx: 1.0, ly: 4.0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("implausible"))).toBe(true);
  });

  it("V15: boundaryCondition cantilever is rejected on a two-way slab", () => {
    const r = slabInputSchema.safeParse({ ...VALID, boundaryCondition: "cantilever" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("one-way slabs"))).toBe(true);
    expect(BOUNDARY_CONDITIONS).toContain("cantilever");
  });

  it("V16: unknown extra keys are rejected (strict schema)", () =>
    expect(slabInputSchema.safeParse({ ...VALID, fck: 25 }).success).toBe(false));

  it("V17: cross-field — depth/span > 40% is rejected (thickness 1500 mm on 3 m span)", () => {
    const r = slabInputSchema.safeParse({ ...VALID, thickness: 1500 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message.includes("beam, not a slab"))).toBe(true);
  });

  it("V18: parseSlabInputs throws SlabInputValidationError with {path, message} issues", () => {
    try {
      parseSlabInputs({ ...VALID, lx: -3 });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(SlabInputValidationError);
      const e = err as SlabInputValidationError;
      expect(e.issues.length).toBeGreaterThan(0);
      expect(e.issues[0]).toHaveProperty("path");
      expect(e.issues[0]).toHaveProperty("message");
    }
  });

  it("V19: validateSlabInputs returns server-compatible {path, message} shape", () => {
    const r = validateSlabInputs({ ...VALID, liveLoad: 1e6 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues[0].path).toBe("liveLoad");
      expect(typeof r.issues[0].message).toBe("string");
    }
  });

  it("V20: integration — designSlab throws SlabInputValidationError on zero span", () =>
    expect(() => designSlab({ ...VALID, lx: 0, ly: 0 })).toThrow(SlabInputValidationError));

  it("V21: integration — designSlab throws on impossible section (thickness=20)", () =>
    expect(() => designSlab({ ...VALID, thickness: 20 })).toThrow(SlabInputValidationError));

  it("V22: integration — designSlab still computes the canonical valid design", () => {
    const result = designSlab(VALID);
    const midShort = result.steelPositions.find((p) => p.position === "MidShort");
    expect(result.deflectionStatus).toBe("OK");
    expect(midShort?.coeff).toBeCloseTo(0.024); // Table 26, interior_panel, ratio 1.0
    expect(effectiveDepthOf(VALID)).toBeCloseTo(150 - 20 - 5);
  });

  it("V23: advisories are non-fatal — M15 warns but still computes", () => {
    const inputs: SlabInputs = { ...VALID, concreteGrade: "M15" };
    expect(collectSlabWarnings(inputs).some((m) => m.includes("M15"))).toBe(true);
    expect(() => designSlab(inputs)).not.toThrow();
  });

  it("V24: span auto-swap is preserved — lx=5, ly=3 still computes (engine swaps internally)", () =>
    expect(() => designSlab({ ...VALID, lx: 5, ly: 3 })).not.toThrow());
});
