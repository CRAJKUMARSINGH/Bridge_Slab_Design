/**
 * Property P5 — Cascade Delete
 *
 * ∀ project P with file records F and analysis records A:
 *   DELETE project P
 *   → fileRecords where projectId = P.id → empty
 *   → analysisRecords where projectId = P.id → empty
 *
 * Tested via a pure in-memory store that mirrors the cascade behaviour
 * enforced by the Drizzle schema (ON DELETE CASCADE).
 *
 * Requirements: 2.7, 1.5
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ── In-memory store with cascade delete ───────────────────────────────────────

interface Project      { id: number; name: string }
interface FileRecord   { id: number; projectId: number | null; fileName: string }
interface AnalysisRec  { id: number; projectId: number | null; fileId: number | null; variationType: string }

interface Store {
  projects:        Project[];
  fileRecords:     FileRecord[];
  analysisRecords: AnalysisRec[];
}

function deleteProject(store: Store, projectId: number): Store {
  const projects        = store.projects.filter(p => p.id !== projectId);
  const fileRecords     = store.fileRecords.filter(f => f.projectId !== projectId);
  const analysisRecords = store.analysisRecords.filter(a => a.projectId !== projectId);
  return { projects, fileRecords, analysisRecords };
}

// ── Arbitraries ───────────────────────────────────────────────────────────────

const projectArb = (id: number): fc.Arbitrary<Project> =>
  fc.record({ id: fc.constant(id), name: fc.string({ minLength: 1, maxLength: 30 }) });

const fileRecordArb = (id: number, projectId: number | null): fc.Arbitrary<FileRecord> =>
  fc.record({
    id: fc.constant(id),
    projectId: fc.constant(projectId),
    fileName: fc.string({ minLength: 1, maxLength: 30 }),
  });

const analysisRecArb = (id: number, projectId: number | null): fc.Arbitrary<AnalysisRec> =>
  fc.record({
    id: fc.constant(id),
    projectId: fc.constant(projectId),
    fileId: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
    variationType: fc.constantFrom('design-run', 'manual', 'optimised'),
  });

// Build a store with 1–5 projects, each with 0–5 files and 0–5 records
const storeArb: fc.Arbitrary<{ store: Store; targetId: number }> =
  fc.integer({ min: 1, max: 5 }).chain(numProjects => {
    const projectIds = Array.from({ length: numProjects }, (_, i) => i + 1);
    return fc.integer({ min: 0, max: numProjects - 1 }).chain(targetIdx => {
      const targetId = projectIds[targetIdx];

      const projectsArb = fc.tuple(...projectIds.map(id => projectArb(id)));

      // Files: some belong to targetId, some to other projects, some to null
      const filesArb = fc.array(
        fc.integer({ min: 0, max: numProjects }).chain(pidIdx => {
          const pid = pidIdx === 0 ? null : projectIds[pidIdx - 1];
          return fileRecordArb(Math.random() * 10000 | 0, pid);
        }),
        { minLength: 0, maxLength: 10 },
      );

      const recsArb = fc.array(
        fc.integer({ min: 0, max: numProjects }).chain(pidIdx => {
          const pid = pidIdx === 0 ? null : projectIds[pidIdx - 1];
          return analysisRecArb(Math.random() * 10000 | 0, pid);
        }),
        { minLength: 0, maxLength: 10 },
      );

      return fc.record({ projects: projectsArb, files: filesArb, recs: recsArb }).map(
        ({ projects, files, recs }) => ({
          store: {
            projects: projects as Project[],
            fileRecords: files,
            analysisRecords: recs,
          },
          targetId,
        }),
      );
    });
  });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('P5 — Cascade Delete', () => {
  it('deleting a project removes it from the projects list', () => {
    fc.assert(
      fc.property(storeArb, ({ store, targetId }) => {
        const after = deleteProject(store, targetId);
        expect(after.projects.find(p => p.id === targetId)).toBeUndefined();
      }),
      { numRuns: 200, seed: 400 },
    );
  });

  it('deleting a project removes all fileRecords with that projectId', () => {
    fc.assert(
      fc.property(storeArb, ({ store, targetId }) => {
        const after = deleteProject(store, targetId);
        const orphaned = after.fileRecords.filter(f => f.projectId === targetId);
        expect(orphaned).toHaveLength(0);
      }),
      { numRuns: 200, seed: 401 },
    );
  });

  it('deleting a project removes all analysisRecords with that projectId', () => {
    fc.assert(
      fc.property(storeArb, ({ store, targetId }) => {
        const after = deleteProject(store, targetId);
        const orphaned = after.analysisRecords.filter(a => a.projectId === targetId);
        expect(orphaned).toHaveLength(0);
      }),
      { numRuns: 200, seed: 402 },
    );
  });

  it('records belonging to OTHER projects are not affected', () => {
    fc.assert(
      fc.property(storeArb, ({ store, targetId }) => {
        const before = store.fileRecords.filter(f => f.projectId !== targetId && f.projectId !== null);
        const after  = deleteProject(store, targetId).fileRecords.filter(f => f.projectId !== null);
        // Every non-target file that existed before should still exist after
        for (const f of before) {
          expect(after.find(a => a.id === f.id)).toBeDefined();
        }
      }),
      { numRuns: 200, seed: 403 },
    );
  });

  it('null-projectId records are never deleted by a project delete', () => {
    fc.assert(
      fc.property(storeArb, ({ store, targetId }) => {
        const nullBefore = store.fileRecords.filter(f => f.projectId === null).length;
        const nullAfter  = deleteProject(store, targetId).fileRecords.filter(f => f.projectId === null).length;
        expect(nullAfter).toBe(nullBefore);
      }),
      { numRuns: 200, seed: 404 },
    );
  });
});
