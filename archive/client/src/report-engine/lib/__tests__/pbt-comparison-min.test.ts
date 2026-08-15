/**
 * Property P4 — Comparison Minimum Size
 *
 * ∀ createComparison request with fileIds.length < 2:
 *   response.status === 400
 *
 * Tested via a pure validation function that mirrors the route handler logic.
 *
 * Requirements: 6.2, 6.3
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Pure validation logic (mirrors d4-routes POST /comparisons) ───────────────

interface CreateComparisonBody {
  title?: unknown;
  fileIds?: unknown;
  notes?: unknown;
}

interface ValidationResult {
  status: 400 | 201;
  error?: string;
}

function validateCreateComparison(body: CreateComparisonBody): ValidationResult {
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    return { status: 400, error: 'title is required' };
  }
  if (!body.fileIds || typeof body.fileIds !== 'string') {
    return { status: 400, error: 'fileIds must be a JSON string' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.fileIds);
  } catch {
    return { status: 400, error: 'fileIds must be valid JSON' };
  }
  if (!Array.isArray(parsed)) {
    return { status: 400, error: 'fileIds must be an array' };
  }
  if (parsed.length < 2) {
    return { status: 400, error: 'At least 2 files are required for a comparison' };
  }
  return { status: 201 };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

// Arrays with 0 or 1 entries — should always fail
const tooFewFileIds = fc.array(fc.integer({ min: 1, max: 999 }), { maxLength: 1 });

// Arrays with 2+ entries — should always pass (given valid title)
const enoughFileIds = fc.array(fc.integer({ min: 1, max: 999 }), { minLength: 2, maxLength: 20 });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P4 — Comparison Minimum Size', () => {
  it('returns 400 when fileIds has 0 entries', () => {
    const result = validateCreateComparison({ title: 'Test', fileIds: JSON.stringify([]) });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/at least 2/i);
  });

  it('returns 400 when fileIds has exactly 1 entry', () => {
    const result = validateCreateComparison({ title: 'Test', fileIds: JSON.stringify([42]) });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/at least 2/i);
  });

  it('returns 400 for all arrays with fewer than 2 entries (property)', () => {
    fc.assert(
      fc.property(tooFewFileIds, (ids) => {
        const result = validateCreateComparison({
          title: 'Test Comparison',
          fileIds: JSON.stringify(ids),
        });
        expect(result.status).toBe(400);
      }),
      { numRuns: 200, seed: 300 },
    );
  });

  it('returns 201 for all arrays with 2 or more entries (property)', () => {
    fc.assert(
      fc.property(enoughFileIds, (ids) => {
        const result = validateCreateComparison({
          title: 'Test Comparison',
          fileIds: JSON.stringify(ids),
        });
        expect(result.status).toBe(201);
      }),
      { numRuns: 200, seed: 301 },
    );
  });

  it('returns 400 when title is missing', () => {
    const result = validateCreateComparison({ fileIds: JSON.stringify([1, 2]) });
    expect(result.status).toBe(400);
  });

  it('returns 400 when fileIds is not valid JSON', () => {
    const result = validateCreateComparison({ title: 'Test', fileIds: 'not-json' });
    expect(result.status).toBe(400);
  });
});
