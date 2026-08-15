/**
 * Property P3 — Stats Consistency
 *
 * ∀ database state S:
 *   getStatsSummary().totalFiles === count(fileRecords in S)
 *   AND recentFiles.length ≤ 5
 *   AND recentFiles are ordered by createdAt DESC
 *
 * Tested via a pure in-memory implementation of the stats aggregation logic,
 * mirroring what server/d4-routes.ts does in GET /stats/summary.
 *
 * Requirements: 7.1, 7.2
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── In-memory stats aggregation (mirrors d4-routes GET /stats/summary) ────────

interface MockFileRecord {
  id: number;
  fileName: string;
  fileType: string;
  createdAt: string; // ISO string
}

interface MockProject { id: number }
interface MockRecord  { id: number }
interface MockComparison { id: number }

interface MockDb {
  projects: MockProject[];
  fileRecords: MockFileRecord[];
  analysisRecords: MockRecord[];
  comparisons: MockComparison[];
}

function getStatsSummary(db: MockDb) {
  const totalProjects    = db.projects.length;
  const totalFiles       = db.fileRecords.length;
  const totalRecords     = db.analysisRecords.length;
  const totalComparisons = db.comparisons.length;

  const recentFiles = [...db.fileRecords]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return { totalProjects, totalFiles, totalRecords, totalComparisons, recentFiles };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const isoDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') })
  .map(d => d.toISOString());

const fileRecordArb = (id: number): fc.Arbitrary<MockFileRecord> =>
  fc.record({
    id: fc.constant(id),
    fileName: fc.string({ minLength: 1, maxLength: 50 }),
    fileType: fc.constantFrom('dxf', 'pdf', 'svg', 'xlsx', 'html'),
    createdAt: isoDateArb,
  });

const dbArb: fc.Arbitrary<MockDb> = fc.integer({ min: 0, max: 20 }).chain(n =>
  fc.record({
    projects:        fc.array(fc.record({ id: fc.integer({ min: 1, max: 999 }) }), { minLength: 0, maxLength: 10 }),
    fileRecords:     fc.tuple(...Array.from({ length: n }, (_, i) => fileRecordArb(i + 1))).map(arr => arr as MockFileRecord[]),
    analysisRecords: fc.array(fc.record({ id: fc.integer({ min: 1, max: 999 }) }), { minLength: 0, maxLength: 10 }),
    comparisons:     fc.array(fc.record({ id: fc.integer({ min: 1, max: 999 }) }), { minLength: 0, maxLength: 5 }),
  }),
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P3 — Stats Consistency', () => {
  it('totalFiles equals the number of file records in the store', () => {
    fc.assert(
      fc.property(dbArb, (db) => {
        const stats = getStatsSummary(db);
        expect(stats.totalFiles).toBe(db.fileRecords.length);
      }),
      { numRuns: 200, seed: 200 },
    );
  });

  it('recentFiles.length is always ≤ 5', () => {
    fc.assert(
      fc.property(dbArb, (db) => {
        const stats = getStatsSummary(db);
        expect(stats.recentFiles.length).toBeLessThanOrEqual(5);
      }),
      { numRuns: 200, seed: 201 },
    );
  });

  it('recentFiles are ordered by createdAt DESC', () => {
    fc.assert(
      fc.property(dbArb, (db) => {
        const stats = getStatsSummary(db);
        for (let i = 0; i < stats.recentFiles.length - 1; i++) {
          const curr = new Date(stats.recentFiles[i].createdAt).getTime();
          const next = new Date(stats.recentFiles[i + 1].createdAt).getTime();
          expect(curr).toBeGreaterThanOrEqual(next);
        }
      }),
      { numRuns: 200, seed: 202 },
    );
  });

  it('totalProjects, totalRecords, totalComparisons match their respective store lengths', () => {
    fc.assert(
      fc.property(dbArb, (db) => {
        const stats = getStatsSummary(db);
        expect(stats.totalProjects).toBe(db.projects.length);
        expect(stats.totalRecords).toBe(db.analysisRecords.length);
        expect(stats.totalComparisons).toBe(db.comparisons.length);
      }),
      { numRuns: 200, seed: 203 },
    );
  });

  it('empty database returns all zeros and empty recentFiles', () => {
    const empty: MockDb = { projects: [], fileRecords: [], analysisRecords: [], comparisons: [] };
    const stats = getStatsSummary(empty);
    expect(stats.totalProjects).toBe(0);
    expect(stats.totalFiles).toBe(0);
    expect(stats.totalRecords).toBe(0);
    expect(stats.totalComparisons).toBe(0);
    expect(stats.recentFiles).toHaveLength(0);
  });
});
