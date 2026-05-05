# Implementation Plan: Bridge Design Suite Merge

## Overview

Merge the D4_Bridge (replit-baseline) project management and file-tracking capabilities into
the Bridge_Slab_Design (cursor-baseline) single-package application. The implementation
follows the data-model-first sequence: schema → DB client → guard middleware → five route
modules → app wiring → API contract changes → OpenAPI spec → Orval codegen → frontend
integration → property-based tests.

All new code is TypeScript. No monorepo conversion. No version changes to npm, Node 20,
Express 4, or Zod 3.

---

## Tasks

- [x] 1. Extend shared/schema.ts with Drizzle table definitions and drizzle-zod exports
  - Replace the existing Zod-only stubs in `shared/schema.ts` with four Drizzle table
    definitions: `projects`, `fileRecords`, `analysisRecords`, `comparisons`
  - Import `pgTable`, `serial`, `text`, `integer`, `numeric`, `jsonb`, `timestamp` from
    `drizzle-orm/pg-core`
  - Import `createInsertSchema`, `createSelectSchema` from `drizzle-zod`
  - Define `projects` table: `id` serial PK, `name` text NOT NULL, `location` text,
    `district` text, `engineer` text, `designData` jsonb, `createdAt` / `updatedAt`
    timestamp with time zone defaultNow()
  - Define `fileRecords` table: `id` serial PK, `projectId` integer FK → projects.id ON
    DELETE CASCADE, `fileName` text NOT NULL, `fileType` text NOT NULL, `filePath` text,
    `bridgeType` text, `spanLength` numeric, `width` numeric, `height` numeric,
    `material` text, `loadCapacity` numeric, `designCode` text, `layers` jsonb,
    `createdAt` / `updatedAt` timestamp with time zone defaultNow()
  - Define `analysisRecords` table: `id` serial PK, `fileId` integer FK →
    fileRecords.id ON DELETE CASCADE, `projectId` integer FK → projects.id ON DELETE
    CASCADE, `variationType` text NOT NULL, `inputSnapshot` jsonb NOT NULL,
    `resultsSummary` jsonb, `createdAt` / `updatedAt` timestamp with time zone defaultNow()
  - Define `comparisons` table: `id` serial PK, `name` text NOT NULL, `fileIds` jsonb
    NOT NULL, `notes` text, `createdAt` / `updatedAt` timestamp with time zone defaultNow()
  - Export `insertProjectSchema`, `selectProjectSchema`, `insertFileRecordSchema`,
    `selectFileRecordSchema`, `insertAnalysisSchema`, `selectAnalysisSchema`,
    `insertComparisonSchema`, `selectComparisonSchema` via `createInsertSchema` /
    `createSelectSchema`
  - Keep all existing exports intact so no existing import breaks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Create shared/db.ts — Drizzle client singleton with DATABASE_URL guard
  - Create `shared/db.ts`
  - Import `neon` from `@neondatabase/serverless` and `drizzle` from
    `drizzle-orm/neon-http`
  - Import `* as schema` from `./schema`
  - Read `process.env.DATABASE_URL`; if set, construct `drizzle(neon(DATABASE_URL), { schema })`
    and export as `db`; if unset, export `db = null`
  - Export `requireDb()` helper that returns `db` when non-null or throws
    `Object.assign(new Error('Database not configured'), { status: 503 })`
  - _Requirements: 13.2_

- [-] 3. Create server/db-guard.ts — 503 middleware
  - Create `server/db-guard.ts`
  - Import `db` from `../shared/db`
  - Export `dbGuard` Express middleware: if `db` is null, respond with HTTP 503
    `{ success: false, error: 'Database not configured' }` and return; otherwise call
    `next()`
  - _Requirements: 13.2_

- [~] 4. Create server/project-routes.ts — Projects CRUD
  - Create `server/project-routes.ts` with an Express `Router`
  - Apply `dbGuard` as the first middleware on the router
  - `POST /` — validate body with `insertProjectSchema`, insert into `projects`, return 201
    with created row; return 400 on validation failure
  - `GET /` — select all projects ordered by `createdAt` DESC, return 200 with array
  - `GET /:id` — select project by id; return 200 or 404
  - `PATCH /:id` — partial update with `insertProjectSchema.partial()`, set `updatedAt` to
    `new Date()`, return 200 with updated row or 404
  - `DELETE /:id` — delete project by id (cascade handled by DB); return 204 or 404
  - All error responses use `{ success: false, error: string }` shape
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [~] 5. Create server/file-routes.ts — File Records CRUD + similar search
  - Create `server/file-routes.ts` with an Express `Router`
  - Apply `dbGuard` as the first middleware on the router
  - `POST /` — validate body with `insertFileRecordSchema`; validate `fileType` is one of
    `dxf | pdf | svg | xlsx | html` (400 if not); attempt insert, catch FK violation and
    return 422; return 201 with created row
  - `GET /` — list all file records ordered by `createdAt` DESC; support optional
    `?projectId=` query param to filter
  - `GET /:id` — return 200 with row or 404
  - `GET /:id/similar` — fetch reference record (404 if missing); iterate all other records
    and apply similarity check: `bridgeType`, `material`, `designCode` must match exactly
    (or both null); `spanLength` and `width` must be within ±20% of reference values;
    exclude the reference record itself; return 200 with matching array
  - `PATCH /:id` — partial update, return 200 or 404
  - `DELETE /:id` — delete, return 204
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 4.4, 4.5_

- [~] 6. Create server/record-routes.ts — Analysis Records CRUD + variations grouping
  - Create `server/record-routes.ts` with an Express `Router`
  - Apply `dbGuard` as the first middleware on the router
  - `POST /` — validate body with `insertAnalysisSchema`; require `inputSnapshot` (400 if
    missing); insert and return 201
  - `GET /` — list all records ordered by `createdAt` DESC; support optional `?projectId=`
    and `?fileId=` query params
  - `GET /variations` — fetch all records, group by `variationType` into a
    `Record<string, AnalysisRecord[]>` object, return 200 (route must be registered before
    `GET /:id` to avoid shadowing)
  - `GET /:id` — return 200 or 404
  - `PATCH /:id` — partial update, return 200 or 404
  - `DELETE /:id` — delete, return 204
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [~] 7. Create server/comparison-routes.ts — Comparisons CRUD
  - Create `server/comparison-routes.ts` with an Express `Router`
  - Apply `dbGuard` as the first middleware on the router
  - `POST /` — validate body with `insertComparisonSchema`; additionally validate that
    `fileIds` is an array with at least 2 entries (400 if not); insert and return 201
  - `GET /` — list all comparisons ordered by `createdAt` DESC, return 200
  - `GET /:id` — fetch comparison (404 if missing); hydrate `fileIds` by fetching the
    corresponding `FileRecord` rows and attach as `files: FileRecord[]`; return 200
  - `DELETE /:id` — delete, return 204
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [~] 8. Create server/stats-routes.ts — Stats summary endpoint
  - Create `server/stats-routes.ts` with an Express `Router`
  - Apply `dbGuard` as the first middleware on the router
  - `GET /summary` — issue five queries concurrently via `Promise.all`:
    `count(*)` from `projects`, `count(*)` from `fileRecords`, `count(*)` from
    `analysisRecords`, `count(*)` from `comparisons`, and `SELECT * FROM fileRecords ORDER
    BY createdAt DESC LIMIT 5`
  - Return 200 with `{ totalProjects, totalFiles, totalRecords, totalComparisons,
    recentFiles }`; all counts default to 0 when tables are empty
  - _Requirements: 7.1, 7.2, 7.3_

- [~] 9. Modify server/app-factory.ts — mount new routers and serve OpenAPI YAML
  - Import `projectRoutes`, `fileRoutes`, `recordRoutes`, `comparisonRoutes`,
    `statsRoutes` from their respective route files
  - Import `readFileSync` from `node:fs` and `join` from `node:path`
  - Mount routers in `createApp`:
    - `app.use('/api/projects', projectRoutes)`
    - `app.use('/api/files', fileRoutes)`
    - `app.use('/api/records', recordRoutes)`
    - `app.use('/api/comparisons', comparisonRoutes)`
    - `app.use('/api/stats', statsRoutes)`
  - Add `GET /api/openapi.yaml` handler: read
    `openapi/bridge-suite.yaml` with `readFileSync`, set `Content-Type: application/yaml`,
    send file contents
  - Keep all existing mounts and middleware unchanged
  - _Requirements: 8.4, 13.1_

- [~] 10. Modify server/api-routes.ts — add optional projectId and fire-and-forget auto-save
  - Add `projectId: z.number().int().optional()` to `projectInputBodySchema` in
    `server/project-input-zod.ts` (or inline in `api-routes.ts` if schema is defined there)
  - Write a `saveAnalysisRecord(projectId: number, input: ProjectInput, summary: unknown)`
    async helper function in `api-routes.ts` that inserts a row into `analysisRecords` with
    `variationType: 'design-run'`, `inputSnapshot: input`, `resultsSummary: summary`; wrap
    the entire body in try/catch and log errors with `logger.error` — never throw
  - In `POST /calculate`: after `res.send(buffer)`, if `parsed.data.projectId` is set, call
    `void saveAnalysisRecord(projectId, input, summary).catch(...)` (fire-and-forget)
  - In `POST /results`: after `res.json(...)`, apply the same fire-and-forget pattern with
    `resultsSummary` set to the results object
  - Ensure the response is never delayed or blocked by the auto-save path
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [~] 11. Create openapi/bridge-suite.yaml — OpenAPI 3.1 specification
  - Create `openapi/` directory and `openapi/bridge-suite.yaml`
  - Set `openapi: 3.1.0`, `info.title: Bridge Design Suite API`, `info.version: 1.0.0`
  - Define paths for all new endpoints:
    - `/api/projects` (GET `listProjects`, POST `createProject`)
    - `/api/projects/{id}` (GET `getProject`, PATCH `updateProject`, DELETE `deleteProject`)
    - `/api/files` (GET `listFileRecords`, POST `createFileRecord`)
    - `/api/files/{id}` (GET `getFileRecord`, PATCH `updateFileRecord`, DELETE `deleteFileRecord`)
    - `/api/files/{id}/similar` (GET `getSimilarFiles`)
    - `/api/records` (GET `listRecords`, POST `createRecord`)
    - `/api/records/variations` (GET `getVariations`)
    - `/api/records/{id}` (GET `getRecord`, PATCH `updateRecord`, DELETE `deleteRecord`)
    - `/api/comparisons` (GET `listComparisons`, POST `createComparison`)
    - `/api/comparisons/{id}` (GET `getComparison`, DELETE `deleteComparison`)
    - `/api/stats/summary` (GET `getStatsSummary`)
  - Define `components/schemas` for `Project`, `FileRecord`, `AnalysisRecord`,
    `Comparison`, `StatsSummary`, `ErrorResponse`
  - Every operation must have an `operationId` following `<verb><Resource>` convention
  - Document 400, 404, 422, 503 error responses referencing `ErrorResponse` schema
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [~] 12. Add Orval codegen configuration and generate:api script
  - Install `orval` as a devDependency: `npm install --save-dev orval`
  - Create `orval.config.ts` at the workspace root:
    - Input: `./openapi/bridge-suite.yaml`
    - Output target: `./client/src/generated/api/index.ts`
    - Schemas output: `./client/src/generated/api/schemas`
    - Client: `react-query`
    - Mode: `tags-split`
    - Override mutator: `{ path: './client/src/lib/api-client.ts', name: 'apiClient' }`
    - Override header: `() => ['// @ts-nocheck']`
    - Query options: `{ useQuery: true, useMutation: true }`
    - Zod options: `{ generate: true, coerce: false }`
  - Create `client/src/lib/api-client.ts` with a base `apiClient` fetch wrapper that
    reads the base URL from `import.meta.env.VITE_API_BASE_URL` (defaulting to `''`) and
    forwards requests
  - Add `"generate:api": "orval --config orval.config.ts"` to `package.json` scripts
  - Run `npm run generate:api` to produce the generated hooks and schemas in
    `client/src/generated/api/`
  - Verify generated files carry `// @ts-nocheck` header
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [~] 13. Checkpoint — verify TypeScript compilation and existing tests pass
  - Run `npm run check` and fix any TypeScript errors introduced by steps 1–12
  - Run `npm run test` and confirm all pre-existing Vitest suites pass without modification
  - Ensure all new server files compile cleanly under strict mode
  - _Requirements: 13.4, 13.5_

- [~] 14. Modify client/src/pages/Projects.tsx — add live CRUD section above template library
  - [ ] 14.1 Add project list and create-project UI above the existing IRC template library
    - Import `useListProjects`, `useCreateProject`, `useDeleteProject` from the generated
      API hooks in `client/src/generated/api/`
    - Import `toast` from `sonner` for success/error notifications
    - Add a "My Projects" section rendered above the existing IRC template library header
    - Render a `[+ New Project]` button that opens an inline form or dialog with a `name`
      input field
    - On form submit, call `useCreateProject` mutation; on success show
      `toast.success('Project created')` and invalidate the projects query; on error show
      `toast.error(message)`
    - Render each project as a `ProjectCard` showing `name`, `location`, `district`,
      `engineer`, and `createdAt` (formatted date)
    - Show an empty-state message with a "Create Project" CTA when no projects exist
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 14.2 Implement delete and load-into-design actions on project cards
    - Add a "Delete" button on each project card; on click, show a confirmation dialog
      (use `window.confirm` or a Radix `AlertDialog`); on confirm, call
      `useDeleteProject` mutation; on success remove the card and show
      `toast.success('Project deleted')`
    - Add a "Load into Design" button on each project card; when the project has a
      `designData` snapshot, write it to the Zustand `useDesignStore` and navigate to
      `/suite/design` using `useLocation` from `wouter`
    - Handle network errors in all mutations: catch errors and call `toast.error(message)`
      without leaving the UI in an inconsistent state
    - Keep the existing IRC template library section (all existing JSX below the new
      section) completely unchanged
    - _Requirements: 10.4, 10.5, 10.6, 10.7_

- [~] 15. Modify client/src/pages/Dashboard.tsx — replace hard-coded metrics with live stats
  - Import `useGetStatsSummary` from the generated API hooks
  - Call `const { data: stats, isError } = useGetStatsSummary()` at the top of the
    `Dashboard` component
  - Replace the hard-coded `MetricCard` values in the metrics strip:
    - Add a "Projects" card: `value={String(stats?.totalProjects ?? '--')}`
    - Add a "Files" card: `value={String(stats?.totalFiles ?? '--')}`
    - Add a "Records" card: `value={String(stats?.totalRecords ?? '--')}`
    - Add a "Comparisons" card: `value={String(stats?.totalComparisons ?? '--')}`
    - Replace the hard-coded `"Drawings: 3 Ready"` card with
      `value={String(stats?.totalFiles ?? '--')}` and label `"Drawings"`
  - Add a "Recent Outputs" section below the metrics strip that renders
    `stats?.recentFiles` as compact file cards (fileName, fileType badge, createdAt)
  - When `isError` is true, show a non-blocking amber warning banner:
    `"Live stats unavailable — database may be offline."` without hiding any other
    dashboard content
  - When stats are loading, show `"--"` in all affected metric cards
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [~] 16. Checkpoint — verify TypeScript compilation and full test suite
  - Run `npm run check` and fix any TypeScript errors in client pages or generated files
  - Run `npm run test` and confirm all tests pass
  - _Requirements: 13.4, 13.5_

- [~] 17. Write property-based tests encoding correctness properties P1–P6
  - [ ] 17.1 Write property test for JSON round-trip integrity (P1)
    - Create `server/__tests__/pbt-round-trip.test.ts`
    - Use `vitest` + `fast-check` (add `fast-check` as a devDependency if not present)
    - Generate arbitrary `ProjectInput`-shaped objects using `fc.record(...)` with
      appropriate arbitraries for each field
    - Assert `JSON.parse(JSON.stringify(p))` deep-equals `p`
    - Assert `calculateCompleteDesign(JSON.parse(JSON.stringify(p))).summary` is
      numerically equal (within 1e-9) to `calculateCompleteDesign(p).summary`
    - **Property P1: JSON Round-Trip Integrity**
    - **Validates: Requirements 14.2, 14.3**

  - [ ] 17.2 Write property test for similarity symmetry (P2)
    - Create `server/__tests__/pbt-similarity.test.ts`
    - Extract the `isSimilar(a, b)` comparison logic from `file-routes.ts` into a
      pure helper function `isSimilar` exported from `server/similarity.ts`
    - Generate pairs of arbitrary `FileRecord`-shaped objects using `fc.tuple(fc.record(...), fc.record(...))`
    - Assert `isSimilar(a, b) === isSimilar(b, a)` for all generated pairs
    - **Property P2: Similarity Symmetry**
    - **Validates: Requirements 4.1, 4.2**

  - [ ] 17.3 Write property test for stats consistency (P3)
    - Create `server/__tests__/pbt-stats.test.ts`
    - Mock the Drizzle `db` object with an in-memory store using `vitest` mocks
    - For arbitrary arrays of file records (length 0–20), assert that
      `getStatsSummary()` returns `totalFiles === fileRecords.length`
    - Assert `recentFiles.length <= 5`
    - Assert `recentFiles` are ordered by `createdAt` DESC (each item's `createdAt` ≥
      the next item's `createdAt`)
    - **Property P3: Stats Consistency**
    - **Validates: Requirements 7.1, 7.2**

  - [ ] 17.4 Write property test for comparison minimum size (P4)
    - Create `server/__tests__/pbt-comparison-min.test.ts`
    - Use `fc.array(fc.integer(), { maxLength: 1 })` to generate `fileIds` arrays with
      0 or 1 entries
    - Make a direct call to the comparison creation handler (or use supertest) with each
      generated payload
    - Assert the response status is 400 for all inputs where `fileIds.length < 2`
    - **Property P4: Comparison Minimum Size**
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 17.5 Write property test for cascade delete (P5)
    - Create `server/__tests__/pbt-cascade-delete.test.ts`
    - Mock the Drizzle `db` object with an in-memory store
    - For arbitrary project + file records + analysis records, simulate a project delete
      and assert that all associated `fileRecords` and `analysisRecords` with matching
      `projectId` are removed from the store
    - **Property P5: Cascade Delete**
    - **Validates: Requirements 2.7, 1.5**

  - [ ] 17.6 Write property test for DATABASE_URL absent guard (P6)
    - Create `server/__tests__/pbt-db-guard.test.ts`
    - Use `fc.constantFrom('/api/projects', '/api/files', '/api/records', '/api/comparisons', '/api/stats/summary')` to generate route paths
    - For each path, call the route handler with `db = null` (simulate absent
      `DATABASE_URL` by importing `dbGuard` with a mocked null `db`)
    - Assert the response status is 503 for every new database-dependent route
    - **Property P6: DATABASE_URL Absent Guard**
    - **Validates: Requirements 13.2_**

- [~] 18. Final checkpoint — full quality gate
  - Run `npm run check` — zero TypeScript errors expected
  - Run `npm run test` — all tests (pre-existing + new PBT) must pass
  - Verify `GET /api/openapi.yaml` returns the YAML file with `Content-Type: application/yaml`
  - Verify that when `DATABASE_URL` is unset, all `/api/design/*` endpoints respond
    normally and all new endpoints return 503
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 13, 16, 18) ensure incremental validation at key milestones
- Property tests (task 17) validate universal correctness properties; unit tests validate
  specific examples and edge cases
- The `saveAnalysisRecord` helper in task 10 must never be awaited in the request path —
  fire-and-forget is enforced by `void expr.catch(logger.error)`
- Generated files in `client/src/generated/api/` carry `// @ts-nocheck` and must not be
  edited manually; regenerate with `npm run generate:api` after any OpenAPI spec change
- The `GET /api/records/variations` route must be registered before `GET /api/records/:id`
  in the router to prevent Express from matching `"variations"` as an `:id` parameter
