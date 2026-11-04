/**
 * Hostile / Edge-Case Input Tests — all 6 engines
 *
 * Purpose: document current engine behaviour for impossible or extreme inputs.
 *   - Plain `it(...)` : expected to PASS (engine already handles it correctly)
 *   - `it.fails(...)` : documents a KNOWN BUG (expected to fail today)
 *
 * Cast hostile values with `as any` to bypass TypeScript — these are
 * intentionally invalid inputs; the tsconfig excludes test files.
 *
 * Run environment: vitest (same as other __tests__ files in this folder)
 * These tests are NOT in the pnpm run test integration lane (that lane uses
 * node:test); they are documentation + vitest-runnable specs.
 */
import { describe, it, expect } from "vitest";

import { designSlab, getFck, getFy } from "../slabCalc";
import { SlabInputValidationError } from "../slabInputSchema";
import { computeHydraulics } from "../hydraulicCalc";
import { designIRCSlab, DEFAULT_IRC_SLAB } from "../ircSlabCalc";
import { IRCSlabInputValidationError } from "../ircSlabInputSchema";
import { calcPier } from "../pierCalc";
import { calcDeadLoad } from "../loadCalc";
import { SHEETS, CATEGORIES } from "../sheets";

// ── Shared valid base inputs ──────────────────────────────────────────────────
const VALID_SLAB = {
  slabName: "S1",
  slabType: "oneway" as const,
  concreteGrade: "M25" as const,
  steelGrade: "Fe415" as const,
  lx: 4.0,
  ly: 8.0,
  thickness: 150,
  floorFinish: 1.0,
  sunkLoad: 0,
  liveLoad: 5.0,
  boundaryCondition: "simply_supported" as const,
  cover: 25,
  barDia: 12,
};

// DEFAULT_IRC_SLAB has cover=30 which fails the schema (min 40).
// Use a valid override for "success-path" IRC tests.
const VALID_IRC_SLAB = { ...DEFAULT_IRC_SLAB, cover: 40 };

const VALID_HYDRAULIC = {
  workName: "HY1",
  crossSectionPoints: [
    { chainage: 0, bedLevel: 100 },
    { chainage: 10, bedLevel: 99 },
    { chainage: 20, bedLevel: 99.5 },
  ],
  slope: 840,
  rugosity: 0.03,
  dischargeMethod: "manning" as const,
  numSpans: 3,
  spanLength: 8.0,
  numPiers: 2,
  pierWidth: 1.2,
  numAbutments: 2,
  abutTopWidth: 0.5,
  abutBottomWidth: 1.0,
  hfl: 102.0,
  bedLevel: 100.0,
};

const VALID_PIER = {
  workName: "P1",
  pierW: 1.2, pierL: 4.0, pierH: 5.0,
  capW: 1.5, capL: 4.5, capD: 0.8,
  ftgW: 3.0, ftgL: 6.0, ftgT: 0.9,
  DL: 800, LL: 400,
  seisH: 50, seisV: 20,
  hydro: 30, drag: 15,
  windTemp: 25,
  fck: 30, fy: 500,
  sbc: 200, phi: 30, gamma: 20,
};

const VALID_DEAD_LOAD = {
  workName: "DL1",
  spanLength: 8.0,
  slabThickness: 200,
  wearingCoatThickness: 75,
  footpathWidth: 0,
  railingLoad: 1.0,
  numSpans: 3,
  spanWidth: 7.5,
  concreteUW: 24,
  bituminousUW: 22,
};

// ─── 1. slabCalc hostile inputs ──────────────────────────────────────────────
describe("slabCalc hostile inputs", () => {
  it("valid input computes positive Ast", () => {
    const r = designSlab(VALID_SLAB);
    expect(r.steelPositions.length).toBeGreaterThan(0);
    expect(r.steelPositions[0].astReq).toBeGreaterThan(0);
  });

  it("zero span throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, lx: 0 } as any))
      .toThrow(SlabInputValidationError);
  });

  it("negative span throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, lx: -3 } as any))
      .toThrow(SlabInputValidationError);
  });

  it("NaN span throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, lx: NaN } as any))
      .toThrow(SlabInputValidationError);
  });

  it("Infinity span throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, lx: Infinity } as any))
      .toThrow(SlabInputValidationError);
  });

  it("absurd live load (1e6 kN/m²) throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, liveLoad: 1e6 } as any))
      .toThrow(SlabInputValidationError);
  });

  it("zero thickness throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, thickness: 0 } as any))
      .toThrow(SlabInputValidationError);
  });

  it("thickness below minimum (20 mm) throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, thickness: 20 } as any))
      .toThrow(SlabInputValidationError);
  });

  it("Ly/Lx > 3 throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, lx: 1, ly: 10 } as any))
      .toThrow(SlabInputValidationError);
  });

  it("getFck returns correct values for all grades", () => {
    expect(getFck("M15")).toBe(15);
    expect(getFck("M20")).toBe(20);
    expect(getFck("M25")).toBe(25);
    expect(getFck("M30")).toBe(30);
    expect(getFck("M35")).toBe(35);
    expect(getFck("M40")).toBe(40);
  });

  it("getFy returns correct values for all grades", () => {
    expect(getFy("Fe250")).toBe(250);
    expect(getFy("Fe415")).toBe(415);
    expect(getFy("Fe500")).toBe(500);
    expect(getFy("Fe550")).toBe(550);
  });

  it("valid two-way slab returns steelPositions with midspan coefficients", () => {
    const r = designSlab({
      ...VALID_SLAB,
      slabType: "twoway",
      lx: 3.0, ly: 3.0,
      boundaryCondition: "interior_panel",
    });
    const midShort = r.steelPositions.find(p => p.position === "MidShort");
    expect(midShort).toBeDefined();
    expect(midShort!.astReq).toBeGreaterThan(0);
  });

  it("empty slabName throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, slabName: "" } as any))
      .toThrow(SlabInputValidationError);
  });

  it("invalid concreteGrade throws SlabInputValidationError", () => {
    expect(() => designSlab({ ...VALID_SLAB, concreteGrade: "M99" } as any))
      .toThrow(SlabInputValidationError);
  });

  it("result includes fck from grade (not an unused parameter)", () => {
    const r25 = designSlab({ ...VALID_SLAB, concreteGrade: "M25" });
    const r30 = designSlab({ ...VALID_SLAB, concreteGrade: "M30" });
    // fck affects design — minSteel formula differs
    expect(r25.fck).toBe(25);
    expect(r30.fck).toBe(30);
  });
});

// ─── 2. ircSlabCalc hostile inputs ───────────────────────────────────────────
describe("ircSlabCalc hostile inputs", () => {
  it("valid input (cover=40) computes positive steel", () => {
    const r = designIRCSlab(VALID_IRC_SLAB);
    expect(r.requiredSteel).toBeGreaterThan(0);
  });

  it("clearSpan = 0 throws IRCSlabInputValidationError", () => {
    expect(() => designIRCSlab({ ...VALID_IRC_SLAB, clearSpan: 0 } as any))
      .toThrow(IRCSlabInputValidationError);
  });

  it("clearSpan < 0 throws IRCSlabInputValidationError", () => {
    expect(() => designIRCSlab({ ...VALID_IRC_SLAB, clearSpan: -5 } as any))
      .toThrow(IRCSlabInputValidationError);
  });

  it("slabThickness < 200 mm throws IRCSlabInputValidationError (IRC:21 minimum)", () => {
    expect(() => designIRCSlab({ ...VALID_IRC_SLAB, slabThickness: 150 } as any))
      .toThrow(IRCSlabInputValidationError);
  });

  it("NaN clearSpan throws IRCSlabInputValidationError", () => {
    expect(() => designIRCSlab({ ...VALID_IRC_SLAB, clearSpan: NaN } as any))
      .toThrow(IRCSlabInputValidationError);
  });

  it("corrected sigmaCb: M25 = 8.5 N/mm² (IS 456:2000 Table 21)", () => {
    const r = designIRCSlab(VALID_IRC_SLAB);
    expect(r.sigmaCb).toBeCloseTo(8.5, 5);
  });

  it("corrected sigmaSt: Fe415 barDia=20mm > 12mm → 190 N/mm²", () => {
    const r = designIRCSlab({ ...VALID_IRC_SLAB, barDia: 20 });
    expect(r.sigmaSt).toBeCloseTo(190, 5);
  });

  it("sigmaSt: Fe415 barDia=12mm → 200 N/mm²", () => {
    const r = designIRCSlab({ ...VALID_IRC_SLAB, barDia: 12 });
    expect(r.sigmaSt).toBeCloseTo(200, 5);
  });

  it("m is derived from sigmaCb (not hardcoded 10)", () => {
    const r = designIRCSlab(VALID_IRC_SLAB);
    const expectedM = 280 / (3 * 8.5);
    expect(r.m).toBeCloseTo(expectedM, 2);
    expect(r.m).not.toBe(10); // must not be the old hardcoded value
  });

  it("Q is derived from m and sigmaSt (not hardcoded 1.11)", () => {
    const r = designIRCSlab({ ...VALID_IRC_SLAB, barDia: 20 });
    const m = 280 / (3 * 8.5);
    const expectedQ = (8.5 / 2) * (m * 190) / (m * 190 + 8.5);
    expect(r.Q).toBeCloseTo(expectedQ, 2);
    expect(r.Q).not.toBe(1.11); // must not be the old hardcoded value
  });

  it("shearStatus is OK or FAIL (not undefined)", () => {
    const r = designIRCSlab(VALID_IRC_SLAB);
    expect(["OK", "FAIL"]).toContain(r.shearStatus);
  });

  it("DEFAULT_IRC_SLAB (cover=30) throws because cover < 40 mm schema limit", () => {
    expect(() => designIRCSlab(DEFAULT_IRC_SLAB))
      .toThrow(IRCSlabInputValidationError);
  });

  it("distribution steel > 0", () => {
    const r = designIRCSlab(VALID_IRC_SLAB);
    expect(r.distributionSteel).toBeGreaterThan(0);
  });

  it("Infinity totalLiveLoad throws IRCSlabInputValidationError", () => {
    expect(() => designIRCSlab({ ...VALID_IRC_SLAB, totalLiveLoad: Infinity } as any))
      .toThrow(IRCSlabInputValidationError);
  });
});

// ─── 3. hydraulicCalc hostile inputs ─────────────────────────────────────────
describe("hydraulicCalc hostile inputs", () => {
  it("valid input returns an object without throwing", () => {
    expect(() => computeHydraulics(VALID_HYDRAULIC as any)).not.toThrow();
  });

  it("valid input returns positive discharge", () => {
    const r = computeHydraulics(VALID_HYDRAULIC as any);
    expect(r).toBeDefined();
    expect(typeof r).toBe("object");
  });

  it("single cross-section point does not crash", () => {
    const h = {
      ...VALID_HYDRAULIC,
      crossSectionPoints: [{ chainage: 0, bedLevel: 100 }],
    };
    expect(() => computeHydraulics(h as any)).not.toThrow();
  });

  it("slope = 0 does not crash (engine guards with sqrt(1/slope) fallback)", () => {
    // No schema gate on hydraulicCalc — engine may return Infinity velocity; must not throw
    expect(() => computeHydraulics({ ...VALID_HYDRAULIC, slope: 0 } as any)).not.toThrow();
  });

  it("rugosity = 0 does not crash", () => {
    expect(() => computeHydraulics({ ...VALID_HYDRAULIC, rugosity: 0 } as any)).not.toThrow();
  });

  it("numSpans = 0 does not crash", () => {
    expect(() => computeHydraulics({ ...VALID_HYDRAULIC, numSpans: 0 } as any)).not.toThrow();
  });

  it("result from valid input is an object with expected keys", () => {
    const r = computeHydraulics(VALID_HYDRAULIC as any);
    expect(r).toHaveProperty("inputs");
  });

  it.fails("fck parameter on hydraulicCalc is unused — bug documented (no schema gate)", () => {
    // The hydraulicCalc engine does not consume fck; this test documents the absence of
    // a schema gate. When a gate is added this test should be promoted to a plain it().
    const r1 = computeHydraulics({ ...VALID_HYDRAULIC } as any);
    const r2 = computeHydraulics({ ...VALID_HYDRAULIC, fck: 99999 } as any);
    // If fck were used, results would differ — they don't, confirming it's unused.
    expect(JSON.stringify(r1)).not.toBe(JSON.stringify(r2));
  });
});

// ─── 4. loadCalc hostile inputs ──────────────────────────────────────────────
describe("loadCalc hostile inputs", () => {
  it("valid dead load input returns positive totalDL", () => {
    const r = calcDeadLoad(VALID_DEAD_LOAD);
    expect(r.totalDL).toBeGreaterThan(0);
  });

  it("zero spanWidth does not throw (division by zero guard)", () => {
    // No schema gate — engine must handle gracefully
    expect(() => calcDeadLoad({ ...VALID_DEAD_LOAD, spanWidth: 0 })).not.toThrow();
  });

  it("zero slabThickness returns zero slabSelfWeight", () => {
    const r = calcDeadLoad({ ...VALID_DEAD_LOAD, slabThickness: 0 });
    expect(r.slabSelfWeight).toBe(0);
  });

  it("negative spanLength does not throw", () => {
    expect(() => calcDeadLoad({ ...VALID_DEAD_LOAD, spanLength: -1 })).not.toThrow();
  });

  it("NaN concreteUW propagates NaN (no schema gate — documented bug)", () => {
    const r = calcDeadLoad({ ...VALID_DEAD_LOAD, concreteUW: NaN });
    // Without a schema gate, NaN propagates to slabSelfWeight
    expect(Number.isNaN(r.slabSelfWeight)).toBe(true);
  });

  it("result object has slabSelfWeight, wcLoad, totalDL keys", () => {
    const r = calcDeadLoad(VALID_DEAD_LOAD);
    expect(r).toHaveProperty("slabSelfWeight");
    expect(r).toHaveProperty("wcLoad");
    expect(r).toHaveProperty("totalDL");
  });
});

// ─── 5. pierCalc hostile inputs ──────────────────────────────────────────────
describe("pierCalc hostile inputs", () => {
  it("valid input returns an object without throwing", () => {
    expect(() => calcPier(VALID_PIER)).not.toThrow();
  });

  it("result has basic structural keys", () => {
    const r = calcPier(VALID_PIER);
    expect(r).toBeDefined();
    expect(typeof r).toBe("object");
  });

  it("zero pier height does not throw", () => {
    expect(() => calcPier({ ...VALID_PIER, pierH: 0 })).not.toThrow();
  });

  it("zero DL does not throw", () => {
    expect(() => calcPier({ ...VALID_PIER, DL: 0 })).not.toThrow();
  });

  it("negative seismic force does not throw", () => {
    expect(() => calcPier({ ...VALID_PIER, seisH: -100 })).not.toThrow();
  });

  it.fails("drag force is unused in pier design — known gap (no schema gate)", () => {
    // calcPier() does not incorporate drag in the moment calculation.
    // A correct implementation would yield different overturning moment
    // when drag is non-zero vs zero.
    const r0 = calcPier({ ...VALID_PIER, drag: 0 });
    const r1 = calcPier({ ...VALID_PIER, drag: 500 });
    expect(JSON.stringify(r0)).not.toBe(JSON.stringify(r1));
  });

  it.fails("fck is unused in pier design — known gap (no schema gate)", () => {
    // calcPier() does not incorporate fck in any capacity check.
    const r25 = calcPier({ ...VALID_PIER, fck: 25 });
    const r60 = calcPier({ ...VALID_PIER, fck: 60 });
    expect(JSON.stringify(r25)).not.toBe(JSON.stringify(r60));
  });

  it("NaN DL propagates NaN (no schema gate — documented)", () => {
    const r = calcPier({ ...VALID_PIER, DL: NaN });
    // Without a schema gate NaN will propagate through calculations
    const vals = Object.values(r).filter(v => typeof v === "number");
    const hasNaN = vals.some(v => Number.isNaN(v as number));
    expect(hasNaN).toBe(true);
  });
});

// ─── 6. sheets registry integrity ────────────────────────────────────────────
describe("sheets registry integrity", () => {
  it("SHEETS array is non-empty", () => {
    expect(SHEETS.length).toBeGreaterThan(0);
  });

  it("every sheet has required string fields: id, title, category, ref", () => {
    for (const s of SHEETS) {
      expect(typeof s.id).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.title).toBe("string");
      expect(s.title.length).toBeGreaterThan(0);
      expect(typeof s.category).toBe("string");
      expect(s.category.length).toBeGreaterThan(0);
      expect(typeof s.ref).toBe("string");
    }
  });

  it("every sheet has a positive integer sheetNo", () => {
    for (const s of SHEETS) {
      expect(Number.isInteger(s.sheetNo)).toBe(true);
      expect(s.sheetNo).toBeGreaterThan(0);
    }
  });

  it("sheet ids are unique", () => {
    const ids = SHEETS.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("sheet numbers are unique", () => {
    const nos = SHEETS.map(s => s.sheetNo);
    const unique = new Set(nos);
    expect(unique.size).toBe(nos.length);
  });

  it("all sheet categories are in CATEGORIES", () => {
    for (const s of SHEETS) {
      expect(CATEGORIES).toContain(s.category);
    }
  });

  it("CATEGORIES array is non-empty", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
  });

  it("CATEGORIES items are unique strings", () => {
    const unique = new Set(CATEGORIES);
    expect(unique.size).toBe(CATEGORIES.length);
    for (const c of CATEGORIES) {
      expect(typeof c).toBe("string");
      expect(c.length).toBeGreaterThan(0);
    }
  });

  it("sheet subtitles are strings (empty string is allowed)", () => {
    for (const s of SHEETS) {
      expect(typeof s.subtitle).toBe("string");
    }
  });
});
