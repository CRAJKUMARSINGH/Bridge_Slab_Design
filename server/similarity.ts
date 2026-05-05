/**
 * Pure similarity helper for file records.
 *
 * Two file records are considered "similar" when:
 *  - bridgeType, material, and designCode match exactly (or both are null/undefined)
 *  - spanLength and width are within ±20% of the reference values
 *    (if either side is null/undefined the numeric check is skipped for that field)
 *
 * Exported as a pure function so it can be unit/property-tested without a DB.
 *
 * Requirements: 4.1, 4.2 — P2 (Similarity Symmetry)
 */

export interface SimilarityRecord {
  id?: number;
  bridgeType?: string | null;
  material?: string | null;
  designCode?: string | null;
  spanLength?: string | number | null;
  width?: string | number | null;
  fileType?: string | null;
}

function toNum(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function nullableMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const aN = a ?? null;
  const bN = b ?? null;
  return aN === bN;
}

function withinTwentyPercent(ref: number | null, candidate: number | null): boolean {
  if (ref === null || candidate === null) return true; // skip check when either is absent
  if (ref === 0) return candidate === 0;
  return Math.abs(candidate - ref) / Math.abs(ref) <= 0.2;
}

/**
 * Returns true when `candidate` is similar to `reference`.
 * The function is symmetric: isSimilar(a, b) === isSimilar(b, a).
 */
export function isSimilar(reference: SimilarityRecord, candidate: SimilarityRecord): boolean {
  if (!nullableMatch(reference.bridgeType, candidate.bridgeType)) return false;
  if (!nullableMatch(reference.material, candidate.material)) return false;
  if (!nullableMatch(reference.designCode, candidate.designCode)) return false;

  const refSpan = toNum(reference.spanLength);
  const canSpan = toNum(candidate.spanLength);
  if (!withinTwentyPercent(refSpan, canSpan)) return false;
  if (!withinTwentyPercent(canSpan, refSpan)) return false; // enforce symmetry on numeric check

  const refW = toNum(reference.width);
  const canW = toNum(candidate.width);
  if (!withinTwentyPercent(refW, canW)) return false;
  if (!withinTwentyPercent(canW, refW)) return false;

  return true;
}
