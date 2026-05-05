/**
 * Property P2 — Similarity Symmetry
 *
 * ∀ file records A, B:
 *   isSimilar(A, B) ↔ isSimilar(B, A)
 *
 * Requirements: 4.1, 4.2
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isSimilar, type SimilarityRecord } from '../../../../../server/similarity';

// ── Arbitrary ─────────────────────────────────────────────────────────────────

const nullableString = fc.option(fc.string({ maxLength: 30 }), { nil: null });
const nullablePositiveNum = fc.option(
  fc.double({ min: 1, max: 100, noNaN: true }),
  { nil: null },
);

const similarityRecordArb: fc.Arbitrary<SimilarityRecord> = fc.record({
  id: fc.integer({ min: 1, max: 9999 }),
  bridgeType: nullableString,
  material: nullableString,
  designCode: nullableString,
  spanLength: nullablePositiveNum,
  width: nullablePositiveNum,
  fileType: nullableString,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P2 — Similarity Symmetry', () => {
  it('isSimilar(A, B) === isSimilar(B, A) for all arbitrary record pairs', () => {
    fc.assert(
      fc.property(
        fc.tuple(similarityRecordArb, similarityRecordArb),
        ([a, b]) => {
          expect(isSimilar(a, b)).toBe(isSimilar(b, a));
        },
      ),
      { numRuns: 200, seed: 100 },
    );
  });

  it('isSimilar(A, A) is always true (reflexivity)', () => {
    fc.assert(
      fc.property(similarityRecordArb, (a) => {
        expect(isSimilar(a, a)).toBe(true);
      }),
      { numRuns: 100, seed: 101 },
    );
  });

  it('records with different bridgeType are never similar', () => {
    fc.assert(
      fc.property(
        similarityRecordArb,
        similarityRecordArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (a, b, typeA, typeB) => {
          fc.pre(typeA !== typeB);
          const recA = { ...a, bridgeType: typeA };
          const recB = { ...b, bridgeType: typeB };
          expect(isSimilar(recA, recB)).toBe(false);
        },
      ),
      { numRuns: 100, seed: 102 },
    );
  });

  it('records with spanLength differing by >20% are never similar', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 50, noNaN: true }),
        (refSpan) => {
          const a: SimilarityRecord = { bridgeType: 'X', material: null, designCode: null, spanLength: refSpan, width: null };
          const b: SimilarityRecord = { bridgeType: 'X', material: null, designCode: null, spanLength: refSpan * 1.21, width: null };
          expect(isSimilar(a, b)).toBe(false);
          expect(isSimilar(b, a)).toBe(false);
        },
      ),
      { numRuns: 100, seed: 103 },
    );
  });

  it('records with spanLength within 20% are similar (when other fields match)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 0.19, noNaN: true }),
        (refSpan, fraction) => {
          const a: SimilarityRecord = { bridgeType: null, material: null, designCode: null, spanLength: refSpan, width: null };
          const b: SimilarityRecord = { bridgeType: null, material: null, designCode: null, spanLength: refSpan * (1 + fraction), width: null };
          expect(isSimilar(a, b)).toBe(true);
          expect(isSimilar(b, a)).toBe(true);
        },
      ),
      { numRuns: 100, seed: 104 },
    );
  });
});
