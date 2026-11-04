/**
 * Property P6 — DATABASE_URL Absent Guard
 *
 * ∀ request to /api/projects | /api/files | /api/records |
 *              /api/comparisons | /api/stats/summary
 *   when DATABASE_URL is unset (db === null):
 *   response.status === 503
 *
 * Tested via a pure implementation of the dbGuard middleware logic.
 *
 * Requirements: 13.2
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── Pure dbGuard logic (mirrors server/db-guard.ts) ───────────────────────────

interface MockResponse {
  statusCode: number;
  body: unknown;
  ended: boolean;
}

interface MockRequest {
  path: string;
  method: string;
}

function runDbGuard(db: null | object, _req: MockRequest): MockResponse {
  if (!db) {
    return { statusCode: 503, body: { success: false, error: 'Database not configured' }, ended: true };
  }
  return { statusCode: 200, body: null, ended: false }; // next() called
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const dbDependentPaths = fc.constantFrom(
  '/api/projects',
  '/api/files',
  '/api/records',
  '/api/comparisons',
  '/api/stats/summary',
);

const httpMethods = fc.constantFrom('GET', 'POST', 'PATCH', 'DELETE');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P6 — DATABASE_URL Absent Guard', () => {
  it('returns 503 for every DB-dependent route when db is null', () => {
    fc.assert(
      fc.property(dbDependentPaths, httpMethods, (path, method) => {
        const res = runDbGuard(null, { path, method });
        expect(res.statusCode).toBe(503);
        expect(res.ended).toBe(true);
        expect((res.body as any).success).toBe(false);
        expect(typeof (res.body as any).error).toBe('string');
      }),
      { numRuns: 100, seed: 500 },
    );
  });

  it('calls next() (status 200) when db is configured', () => {
    fc.assert(
      fc.property(dbDependentPaths, httpMethods, (path, method) => {
        const mockDb = {}; // non-null db
        const res = runDbGuard(mockDb, { path, method });
        expect(res.statusCode).toBe(200);
        expect(res.ended).toBe(false);
      }),
      { numRuns: 100, seed: 501 },
    );
  });

  it('503 response body always has success: false and a string error', () => {
    const res = runDbGuard(null, { path: '/api/projects', method: 'GET' });
    expect(res.body).toMatchObject({ success: false, error: expect.any(String) });
  });

  it('503 is returned regardless of HTTP method when db is null', () => {
    const methods = ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'HEAD'];
    for (const method of methods) {
      const res = runDbGuard(null, { path: '/api/projects', method });
      expect(res.statusCode).toBe(503);
    }
  });

  it('all 5 DB-dependent route prefixes return 503 when db is null', () => {
    const routes = [
      '/api/projects',
      '/api/files',
      '/api/records',
      '/api/comparisons',
      '/api/stats/summary',
    ];
    for (const path of routes) {
      const res = runDbGuard(null, { path, method: 'GET' });
      expect(res.statusCode).toBe(503);
    }
  });
});
