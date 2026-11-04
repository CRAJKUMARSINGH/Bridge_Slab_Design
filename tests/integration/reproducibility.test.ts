/**
 * P2-W05 — reproducibility contract lane.
 *
 * Exercises the shipping lib/engine/src/reproducibility.ts (dependency-free, loads under
 * Node type stripping — escape E-008). The 3-process cold-start proof lives in the gate
 * (scripts/gates/gate-repro.mjs); this lane covers the contract's unit behaviour.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  VOLATILE_FIELDS,
  sha256Hex,
  canonicalJson,
  stripVolatile,
  reproducibleDigest,
  buildRunFingerprint,
  fingerprintMatches,
  integrityBlock,
} from "../../lib/engine/src/reproducibility.ts";
import type { BridgeInputs } from "../../lib/engine/src/types.ts";

const INPUTS: BridgeInputs = {
  span: 12, deckWidth: 8, girderSpacing: 2, girderCount: 4, concreteGrade: 30,
  steelYieldStrength: 415, deckThickness: 0.2, liveLoadUDL: 20, concentratedLoad: 100,
  secondMomentArea: 1.2e10, sectionModulus: 5.5e7,
};
const REGISTRY = { engine: "0.5.0", coefficients: "coeff-bb71b204f310", codes: "codes-4b9a4227c2e1" };

describe("T5.1 — sha256 + canonical JSON", () => {
  it("sha256Hex matches the known sha256 of an empty string", () => {
    assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("canonicalJson is key-order independent (including nested objects)", () => {
    assert.equal(
      canonicalJson({ b: 2, a: { d: 4, c: 3 } }),
      canonicalJson({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });

  it("canonicalJson drops undefined but keeps null", () => {
    assert.equal(canonicalJson({ a: 1, b: undefined, c: null }), '{"a":1,"c":null}');
  });
});

describe("T5.4 — volatile fields never affect the digest", () => {
  it("declares calculatedAt as volatile", () => {
    assert.ok(VOLATILE_FIELDS.includes("calculatedAt"));
  });

  it("stripVolatile removes volatile keys at any depth", () => {
    const stripped = stripVolatile({ calculatedAt: "x", nested: { runId: "y", keep: 1 } }) as any;
    assert.equal("calculatedAt" in stripped, false);
    assert.equal("runId" in stripped.nested, false);
    assert.equal(stripped.nested.keep, 1);
  });

  it("two results differing only in calculatedAt hash the same", () => {
    const a = { engineVersion: "0.5.0", overallStatus: "PASS", calculatedAt: "2026-01-01T00:00:00Z" };
    const b = { engineVersion: "0.5.0", overallStatus: "PASS", calculatedAt: "2026-10-31T12:00:00Z" };
    assert.equal(reproducibleDigest(a), reproducibleDigest(b));
  });

  it("a real field change DOES change the digest (non-vacuous)", () => {
    const a = { engineVersion: "0.5.0", overallStatus: "PASS" };
    const b = { engineVersion: "0.5.0", overallStatus: "FAIL" };
    assert.notEqual(reproducibleDigest(a), reproducibleDigest(b));
  });
});

describe("T5.1 — RunFingerprint", () => {
  it("is stable for the same input + registry", () => {
    assert.ok(fingerprintMatches(buildRunFingerprint(INPUTS, REGISTRY), buildRunFingerprint(INPUTS, REGISTRY)));
  });

  it("changes when the input changes", () => {
    assert.ok(!fingerprintMatches(
      buildRunFingerprint(INPUTS, REGISTRY),
      buildRunFingerprint({ ...INPUTS, span: 13 }, REGISTRY),
    ));
  });

  it("changes when the registry changes (engine version is part of the contract)", () => {
    assert.ok(!fingerprintMatches(
      buildRunFingerprint(INPUTS, REGISTRY),
      buildRunFingerprint(INPUTS, { ...REGISTRY, engine: "0.6.0" }),
    ));
  });

  it("exposes inputSha256 as 64-char hex and mirrors the registry into engineVersion", () => {
    const fp = buildRunFingerprint(INPUTS, REGISTRY);
    assert.match(fp.inputSha256, /^[0-9a-f]{64}$/);
    assert.deepEqual(fp.engineVersion, { engine: "0.5.0", coefficients: REGISTRY.coefficients, codes: REGISTRY.codes });
  });

  it("is JSON-round-trippable (T5.7: a stored fingerprint reloads to the same values)", () => {
    const fp = buildRunFingerprint(INPUTS, REGISTRY);
    const reloaded = JSON.parse(JSON.stringify(fp));
    assert.ok(fingerprintMatches(fp, reloaded as any));
  });
});

describe("T5.6 — export integrity block", () => {
  it("hashes each artifact and yields a 64-char digest", () => {
    const block = integrityBlock({ "report.html": "<html></html>", "result.json": "{}", "figure-1.dxf": "0\nSECTION" }, "0.5.0");
    assert.match(block.digest, /^[0-9a-f]{64}$/);
    assert.deepEqual(Object.keys(block.artifacts).sort(), ["figure-1.dxf", "report.html", "result.json"]);
    assert.equal(block.artifacts["result.json"], sha256Hex("{}"));
  });

  it("is content-sensitive — editing one artifact changes the block digest", () => {
    const a = integrityBlock({ "report.html": "<html>A</html>" }, "0.5.0");
    const b = integrityBlock({ "report.html": "<html>B</html>" }, "0.5.0");
    assert.notEqual(a.digest, b.digest);
    assert.notEqual(a.artifacts["report.html"], b.artifacts["report.html"]);
  });

  it("is engine-version sensitive", () => {
    assert.notEqual(
      integrityBlock({ "result.json": "{}" }, "0.5.0").digest,
      integrityBlock({ "result.json": "{}" }, "0.5.1").digest,
    );
  });
});
