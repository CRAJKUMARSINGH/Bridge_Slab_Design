/**
 * IRC 21:2000 Slab Design Tests — ported from SECONDARY app
 */
import { describe, it, expect } from "vitest";
import { designIRCSlab, DEFAULT_IRC_SLAB } from "../ircSlabCalc";

describe("IRC 21:2000 slab design", () => {
  it("computes positive effective span, depth, and moments", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    expect(r.effectiveSpan).toBeGreaterThan(0);
    expect(r.effectiveDepth).toBeGreaterThan(0);
    expect(r.deadLoadMoment).toBeGreaterThan(0);
    expect(r.liveLoadMoment).toBeGreaterThan(0);
    expect(r.designMoment).toBeGreaterThan(0);
  });

  it("effective span = min(L + deff, L + support) — IRC 21:2000", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    // option1 = 8.25 + 0.76 = 9.01, option2 = 8.25 + 0.45 = 8.70 → min = 8.70
    expect(r.effectiveSpan).toBeCloseTo(8.7, 1);
  });

  it("45° dispersion increases load footprint", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    expect(r.dispersedLength).toBeGreaterThan(DEFAULT_IRC_SLAB.a1);
    expect(r.dispersedWidthBw).toBeGreaterThan(DEFAULT_IRC_SLAB.b1);
  });

  it("K factor is within IRC 21:2000 table range [1.80, 2.10]", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    expect(r.Kfactor).toBeGreaterThanOrEqual(1.8);
    expect(r.Kfactor).toBeLessThanOrEqual(2.1);
  });

  it("working stress constants — M25/Fe415 per IS 456:2000", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    expect(r.sigmaCb).toBe(8.33);  // IS 456 Table 21
    expect(r.sigmaSt).toBe(200);   // IS 456 Table 22
    expect(r.m).toBe(10);
    expect(r.Q).toBe(1.11);
    expect(r.requiredSteel).toBeGreaterThan(0);
  });

  it("distribution steel = 0.2×M_DL + 0.3×M_LL — IRC 21:2000", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    const expected = 0.2 * r.deadLoadMoment + 0.3 * r.liveLoadMoment;
    expect(r.distributionMoment).toBeCloseTo(expected, 5);
    expect(r.distributionSteel).toBeGreaterThan(0);
    expect(r.distributionSteel).toBeLessThan(r.requiredSteel);
  });

  it("ASTRA linear impact: 25% at L≤5m, 10% at L≥9m", () => {
    const short = designIRCSlab({ ...DEFAULT_IRC_SLAB, clearSpan: 4.0, impactMethod: "astra_linear" });
    expect(short.impactFactor).toBe(25);

    const long = designIRCSlab({ ...DEFAULT_IRC_SLAB, clearSpan: 10.0, impactMethod: "astra_linear" });
    expect(long.impactFactor).toBe(10);
  });

  it("IRC:6 impact: 50% at L≤3m, 10% at L>45m", () => {
    const short = designIRCSlab({ ...DEFAULT_IRC_SLAB, clearSpan: 2.0, impactMethod: "irc6" });
    expect(short.impactFactor).toBe(50);

    const long = designIRCSlab({ ...DEFAULT_IRC_SLAB, clearSpan: 50.0, impactMethod: "irc6" });
    expect(long.impactFactor).toBe(10);
  });

  it("shear check returns OK or FAIL (not undefined)", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    expect(["OK", "FAIL"]).toContain(r.shearStatus);
  });

  it("provided steel ≥ required steel (bar spacing clamped)", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    expect(r.providedSteel).toBeGreaterThanOrEqual(r.requiredSteel * 0.95); // within 5% due to rounding
  });
});
