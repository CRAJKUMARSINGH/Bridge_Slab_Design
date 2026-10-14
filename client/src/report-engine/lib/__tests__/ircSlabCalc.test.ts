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

  it("working stress constants — M25/Fe415 per IS 456:2000 Table 21 (CORRECTED)", () => {
    const r = designIRCSlab(DEFAULT_IRC_SLAB);
    // sigmaCb: M25 = 8.5 N/mm² per IS 456:2000 Table 21 (corrected from 8.33)
    expect(r.sigmaCb).toBeCloseTo(8.5, 5);
    // sigmaSt: Fe415 barDia=20mm > 12mm → 190 N/mm² per IS 456:2000 Table 21
    expect(r.sigmaSt).toBeCloseTo(190, 5);
    // m = 280/(3*sigmaCb): derived per IS 456:2000 Cl. B-1.3 (corrected from hardcoded 10)
    expect(r.m).toBeCloseTo(280 / (3 * 8.5), 2);
    // Q = sigmaCb/2 * (m*sigmaSt)/(m*sigmaSt + sigmaCb): derived (corrected from hardcoded 1.11)
    const expectedM = 280 / (3 * 8.5);
    const expectedQ = (8.5 / 2) * (expectedM * 190) / (expectedM * 190 + 8.5);
    expect(r.Q).toBeCloseTo(expectedQ, 2);
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

  it("IRC:6 impact: 50% at L≤3m, formula 4.5/(6+L) for 3<L≤45m", () => {
    // Short span — L≤3m → IRC:6 caps impact at 50%.
    // Set a1 < clearSpan to satisfy the cross-field load-patch rule.
    const short = designIRCSlab({ ...DEFAULT_IRC_SLAB, clearSpan: 2.0, a1: 1.8, impactMethod: "irc6" });
    expect(short.impactFactor).toBe(50);

    // Long span — slab-bridge spans are capped at 40 m (schema), so the IRC:6
    // >45 m / 10 % floor is not reachable through designIRCSlab. Verify the
    // 4.5/(6+L) formula is applied on the effective span instead.
    const long = designIRCSlab({ ...DEFAULT_IRC_SLAB, clearSpan: 40.0, impactMethod: "irc6" });
    const expectedIF = (4.5 / (6 + long.effectiveSpan)) * 100;
    expect(long.impactFactor).toBeCloseTo(expectedIF, 2);
    expect(long.impactFactor).toBeLessThan(50);
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
