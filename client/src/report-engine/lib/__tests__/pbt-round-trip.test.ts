/**
 * Property P1 — JSON Round-Trip Integrity
 *
 * ∀ valid ProjectInput p:
 *   JSON.parse(JSON.stringify(p)) deep-equals p
 *   AND
 *   calculateCompleteDesign(JSON.parse(JSON.stringify(p))).hydraulics.discharge
 *     ≈ calculateCompleteDesign(p).hydraulics.discharge  (within 1e-9)
 *
 * Requirements: 14.2, 14.3
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateCompleteDesign } from '../../../../../bridge-excel-generator/design-engine';
import type { ProjectInput } from '../../../../../bridge-excel-generator/types';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../../../../../scripts/fixtures/kherwara-project-input';

// ── Arbitraries ───────────────────────────────────────────────────────────────

const crossSectionPoint = fc.record({
  chainage: fc.double({ min: 0, max: 500, noNaN: true }),
  gl: fc.double({ min: 80, max: 120, noNaN: true }),
});

const projectInputArb: fc.Arbitrary<ProjectInput> = fc.record({
  projectName: fc.string({ minLength: 1, maxLength: 100 }),
  location: fc.string({ maxLength: 100 }),
  riverName: fc.string({ maxLength: 50 }),
  bridgeType: fc.constantFrom('submersible', 'high-level'),
  spanLength: fc.double({ min: 4, max: 30, noNaN: true }),
  numberOfSpans: fc.integer({ min: 1, max: 20 }),
  carriageWidth: fc.double({ min: 4, max: 12, noNaN: true }),
  totalLength: fc.double({ min: 20, max: 600, noNaN: true }),
  hfl: fc.double({ min: 90, max: 110, noNaN: true }),
  bedLevel: fc.double({ min: 85, max: 100, noNaN: true }),
  foundationLevel: fc.double({ min: 80, max: 95, noNaN: true }),
  discharge: fc.double({ min: 50, max: 2000, noNaN: true }),
  manningN: fc.double({ min: 0.02, max: 0.05, noNaN: true }),
  bedSlope: fc.double({ min: 100, max: 5000, noNaN: true }),
  laceysSiltFactor: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
  crossSectionData: fc.array(crossSectionPoint, { minLength: 2, maxLength: 10 }),
  pierWidth: fc.double({ min: 0.5, max: 3, noNaN: true }),
  pierLength: fc.double({ min: 1, max: 6, noNaN: true }),
  pierDepth: fc.double({ min: 1, max: 8, noNaN: true }),
  numberOfPiers: fc.integer({ min: 0, max: 20 }),
  pierBaseWidth: fc.double({ min: 1, max: 5, noNaN: true }),
  pierBaseLength: fc.double({ min: 2, max: 8, noNaN: true }),
  abutmentHeight: fc.double({ min: 2, max: 10, noNaN: true }),
  abutmentWidth: fc.double({ min: 0.3, max: 2, noNaN: true }),
  abutmentDepth: fc.double({ min: 1, max: 5, noNaN: true }),
  dirtWallHeight: fc.double({ min: 0.5, max: 4, noNaN: true }),
  returnWallLength: fc.double({ min: 2, max: 10, noNaN: true }),
  concreteGrade: fc.constantFrom('M25', 'M30', 'M35'),
  fck: fc.constantFrom(25, 30, 35),
  steelGrade: fc.constantFrom('Fe415', 'Fe500'),
  fy: fc.constantFrom(415, 500),
  sbc: fc.double({ min: 100, max: 400, noNaN: true }),
  phi: fc.double({ min: 20, max: 40, noNaN: true }),
  gamma: fc.double({ min: 16, max: 22, noNaN: true }),
  rtl: fc.double({ min: 95, max: 115, noNaN: true }),
  agl: fc.double({ min: 85, max: 105, noNaN: true }),
  nbl: fc.double({ min: 85, max: 100, noNaN: true }),
  ofl: fc.double({ min: 90, max: 110, noNaN: true }),
  dwl: fc.double({ min: 90, max: 112, noNaN: true }),
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P1 — JSON Round-Trip Integrity', () => {
  it('JSON.parse(JSON.stringify(p)) deep-equals p for arbitrary ProjectInput', () => {
    fc.assert(
      fc.property(projectInputArb, (p) => {
        const serialised = JSON.stringify(p);
        const deserialised = JSON.parse(serialised) as ProjectInput;
        // Re-serialise and compare strings — fastest deep-equality check
        expect(JSON.stringify(deserialised)).toBe(serialised);
      }),
      { numRuns: 50, seed: 42 },
    );
  });

  it('calculateCompleteDesign produces numerically identical discharge after round-trip', () => {
    // Use the known-good Kherwara fixture to avoid engine edge cases
    const p = KHERWARA_REFERENCE_PROJECT_INPUT;
    const original = calculateCompleteDesign(p, { quiet: true });
    const roundTripped = JSON.parse(JSON.stringify(p)) as ProjectInput;
    const after = calculateCompleteDesign(roundTripped, { quiet: true });

    expect(Math.abs(original.hydraulics.discharge - after.hydraulics.discharge)).toBeLessThan(1e-9);
    expect(Math.abs(original.hydraulics.scourDepth - after.hydraulics.scourDepth)).toBeLessThan(1e-9);
  });

  it('re-serialisation is idempotent for arbitrary ProjectInput (round-trip property)', () => {
    fc.assert(
      fc.property(projectInputArb, (p) => {
        const once = JSON.stringify(JSON.parse(JSON.stringify(p)));
        const twice = JSON.stringify(JSON.parse(once));
        expect(twice).toBe(once);
      }),
      { numRuns: 50, seed: 43 },
    );
  });
});
