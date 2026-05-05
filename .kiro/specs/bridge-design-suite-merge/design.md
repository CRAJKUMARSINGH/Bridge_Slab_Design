# Design Document

## Bridge Design Suite Merge — cursor-baseline + replit-baseline

---

## 1. Overview

The cursor-baseline (`Bridge_Slab_Design`) is a single-package Node.js + Express 4 + React 19
+ Vite 7 + TypeScript application. All code lives in one `package.json`. The replit-baseline
(`D4_Bridge`) contributes six backend capabilities that are absent from the cursor-baseline:

1. Project persistence (CRUD)
2. File record tracking
3. Analysis / design-variation records
4. Multi-file comparisons
5. Stats dashboard API
6. OpenAPI 3.1 spec + Orval-generated typed client hooks

The merge adds these six capabilities as new modules inside the existing single-package
structure. No monorepo conversion. No package manager change. No Node/Express/Zod version
change.

---

## 2. Architecture

### 2.1 Existing structure (unchanged)

```
server/
  app-factory.ts        ← Express app, mounts /api/design
  api-routes.ts         ← all /api/design/* handlers
  routes.ts             ← HTTP server wrapper + /api/health
  index-dev.ts / index-prod.ts
shared/
  schema.ts             ← currently only Zod stubs (no Drizzle tables yet)
client/src/
  pages/Projects.tsx    ← static template library (no backend)
  pages/Dashboard.tsx   ← hard-coded metrics strip
```

### 2.2 New modules added by this merge

```
shared/
  schema.ts             ← extended: Drizzle table defs + drizzle-zod exports
  db.ts                 ← Neon/Drizzle client singleton (DATABASE_URL guard)

server/
  project-routes.ts     ← /api/projects CRUD
  file-routes.ts        ← /api/files CRUD + /api/files/:id/similar
  record-routes.ts      ← /api/records CRUD + /api/records/variations
  comparison-routes.ts  ← /api/comparisons CRUD
  stats-routes.ts       ← /api/stats/summary
  db-guard.ts           ← middleware: returns 503 when DATABASE_URL unset

openapi/
  bridge-suite.yaml     ← OpenAPI 3.1 spec (hand-authored, kept in sync)

client/src/
  generated/api/        ← Orval output (React Query hooks + Zod schemas)
  pages/Projects.tsx    ← extended: live CRUD section above template library
  pages/Dashboard.tsx   ← extended: real stats from /api/stats/summary

orval.config.ts         ← Orval codegen configuration
```

### 2.3 Mount points in app-factory.ts

```
app.use('/api/design',       apiRoutes);          // unchanged
app.use('/api/projects',     projectRoutes);       // new
app.use('/api/files',        fileRoutes);          // new
app.use('/api/records',      recordRoutes);        // new
app.use('/api/comparisons',  comparisonRoutes);    // new
app.use('/api/stats',        statsRoutes);         // new
app.get('/api/openapi.yaml', serveOpenApiYaml);    // new
```

---

## 3. Database Schema Design

### 3.1 Drizzle table definitions (`shared/schema.ts`)

All four new tables are added to `shared/schema.ts` alongside the existing Zod stubs.
The existing `insertProjectSchema` Zod object is replaced by the Drizzle-generated version
via `drizzle-zod`.

```typescript
import { pgTable, serial, text, integer, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const projects = pgTable('projects', {
  id:         serial('id').primaryKey(),
  name:       text('name').notNull(),
  location:   text('location'),
  district:   text('district'),
  engineer:   text('engineer'),
  designData: jsonb('design_data'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const fileRecords = pgTable('file_records', {
  id:           serial('id').primaryKey(),
  projectId:    integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  fileName:     text('file_name').notNull(),
  fileType:     text('file_type').notNull(),   // dxf | pdf | svg | xlsx | html
  filePath:     text('file_path'),
  bridgeType:   text('bridge_type'),
  spanLength:   numeric('span_length'),
  width:        numeric('width'),
  height:       numeric('height'),
  material:     text('material'),
  loadCapacity: numeric('load_capacity'),
  designCode:   text('design_code'),
  layers:       jsonb('layers'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const analysisRecords = pgTable('analysis_records', {
  id:             serial('id').primaryKey(),
  fileId:         integer('file_id').references(() => fileRecords.id, { onDelete: 'cascade' }),
  projectId:      integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  variationType:  text('variation_type').notNull(),
  inputSnapshot:  jsonb('input_snapshot').notNull(),
  resultsSummary: jsonb('results_summary'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const comparisons = pgTable('comparisons', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  fileIds:   jsonb('file_ids').notNull(),   // number[]
  notes:     text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// drizzle-zod exports (Zod v3 compatible)
export const insertProjectSchema    = createInsertSchema(projects);
export const selectProjectSchema    = createSelectSchema(projects);
export const insertFileRecordSchema = createInsertSchema(fileRecords);
export const selectFileRecordSchema = createSelectSchema(fileRecords);
export const insertAnalysisSchema   = createInsertSchema(analysisRecords);
export const selectAnalysisSchema   = createSelectSchema(analysisRecords);
export const insertComparisonSchema = createInsertSchema(comparisons);
export const selectComparisonSchema = createSelectSchema(comparisons);
```

### 3.2 Database client (`shared/db.ts`)

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

export const db = DATABASE_URL
  ? drizzle(neon(DATABASE_URL), { schema })
  : null;

export function requireDb() {
  if (!db) throw Object.assign(new Error('Database not configured'), { status: 503 });
  return db;
}
```

### 3.3 Migration

`drizzle-kit push` (existing `npm run db:push` script) creates all four tables.
The `drizzle.config.ts` already points at `shared/schema.ts`.

---

## 4. API Layer Design

### 4.1 Error response contract

All error responses use the shape already established in `app-factory.ts`:

```json
{ "success": false, "error": "<human-readable message>" }
```

### 4.2 DB guard middleware (`server/db-guard.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import { db } from '../shared/db';

export function dbGuard(_req: Request, res: Response, next: NextFunction) {
  if (!db) return res.status(503).json({ success: false, error: 'Database not configured' });
  next();
}
```

Applied to all new route files as the first middleware.

### 4.3 Projects routes (`server/project-routes.ts`)

| Method | Path | Handler | Status codes |
|--------|------|---------|--------------|
| POST   | /    | createProject | 201, 400 |
| GET    | /    | listProjects  | 200 |
| GET    | /:id | getProject    | 200, 404 |
| PATCH  | /:id | updateProject | 200, 404 |
| DELETE | /:id | deleteProject | 204, 404 |

### 4.4 File records routes (`server/file-routes.ts`)

| Method | Path        | Handler          | Status codes |
|--------|-------------|------------------|--------------|
| POST   | /           | createFileRecord | 201, 400, 422 |
| GET    | /           | listFileRecords  | 200 |
| GET    | /:id        | getFileRecord    | 200, 404 |
| GET    | /:id/similar| getSimilarFiles  | 200, 404 |
| PATCH  | /:id        | updateFileRecord | 200, 404 |
| DELETE | /:id        | deleteFileRecord | 204 |

Similarity algorithm: for each candidate file record, check that `bridgeType` and
`material` and `designCode` match exactly (or both are null), and that `spanLength` and
`width` are within ±20% of the reference values. Exclude the reference file itself.

### 4.5 Analysis records routes (`server/record-routes.ts`)

| Method | Path        | Handler           | Status codes |
|--------|-------------|-------------------|--------------|
| POST   | /           | createRecord      | 201, 400 |
| GET    | /           | listRecords       | 200 |
| GET    | /variations | getVariations     | 200 |
| GET    | /:id        | getRecord         | 200, 404 |
| PATCH  | /:id        | updateRecord      | 200, 404 |
| DELETE | /:id        | deleteRecord      | 204 |

`GET /variations` returns `Record<string, AnalysisRecord[]>` grouped by `variationType`.

### 4.6 Comparisons routes (`server/comparison-routes.ts`)

| Method | Path | Handler          | Status codes |
|--------|------|------------------|--------------|
| POST   | /    | createComparison | 201, 400 |
| GET    | /    | listComparisons  | 200 |
| GET    | /:id | getComparison    | 200, 404 |
| DELETE | /:id | deleteComparison | 204 |

`GET /:id` hydrates `fileIds` by fetching the full `FileRecord` objects and returns them
inline as `files: FileRecord[]`.

### 4.7 Stats routes (`server/stats-routes.ts`)

`GET /summary` runs four `count(*)` queries in parallel via `Promise.all` and fetches the
5 most recent file records in a fifth query. All five queries are issued concurrently.

```typescript
const [projects, files, records, comparisons, recentFiles] = await Promise.all([
  db.select({ count: count() }).from(projectsTable),
  db.select({ count: count() }).from(fileRecordsTable),
  db.select({ count: count() }).from(analysisRecordsTable),
  db.select({ count: count() }).from(comparisonsTable),
  db.select().from(fileRecordsTable).orderBy(desc(fileRecordsTable.createdAt)).limit(5),
]);
```

### 4.8 OpenAPI YAML endpoint

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

app.get('/api/openapi.yaml', (_req, res) => {
  const yaml = readFileSync(join(process.cwd(), 'openapi/bridge-suite.yaml'), 'utf-8');
  res.setHeader('Content-Type', 'application/yaml');
  res.send(yaml);
});
```

---

## 5. Auto-Save Design Run Integration

The existing `POST /api/design/calculate` handler in `server/api-routes.ts` is modified
minimally:

1. Accept an optional `projectId` field in the request body (added to `projectInputBodySchema`
   as `z.number().int().optional()`).
2. After the Excel workbook is generated and the response is sent, fire-and-forget an
   async function `saveAnalysisRecord(projectId, input, summary)`.
3. `saveAnalysisRecord` wraps the DB insert in a try/catch; any error is logged but never
   propagated to the client.

The same pattern applies to `POST /api/design/results`.

```typescript
// fire-and-forget — never blocks the response
void saveAnalysisRecord(projectId, input, summary).catch(err =>
  logger.error({ err }, 'auto-save analysis record failed')
);
```

---

## 6. OpenAPI Specification Structure

File: `openapi/bridge-suite.yaml`

```yaml
openapi: 3.1.0
info:
  title: Bridge Design Suite API
  version: 1.0.0
paths:
  /api/projects:        { get: listProjects,    post: createProject }
  /api/projects/{id}:   { get: getProject, patch: updateProject, delete: deleteProject }
  /api/files:           { get: listFileRecords, post: createFileRecord }
  /api/files/{id}:      { get: getFileRecord, patch: updateFileRecord, delete: deleteFileRecord }
  /api/files/{id}/similar: { get: getSimilarFiles }
  /api/records:         { get: listRecords,     post: createRecord }
  /api/records/variations: { get: getVariations }
  /api/records/{id}:    { get: getRecord, patch: updateRecord, delete: deleteRecord }
  /api/comparisons:     { get: listComparisons, post: createComparison }
  /api/comparisons/{id}: { get: getComparison, delete: deleteComparison }
  /api/stats/summary:   { get: getStatsSummary }
components:
  schemas:
    Project: { ... }
    FileRecord: { ... }
    AnalysisRecord: { ... }
    Comparison: { ... }
    StatsSummary: { ... }
    ErrorResponse:
      type: object
      properties:
        success: { type: boolean, enum: [false] }
        error:   { type: string }
```

All error responses (400, 404, 422, 503) reference `ErrorResponse`.

---

## 7. Typed Client Code Generation (Orval)

### 7.1 `orval.config.ts`

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  bridgeSuite: {
    input: { target: './openapi/bridge-suite.yaml' },
    output: {
      target: './client/src/generated/api/index.ts',
      schemas: './client/src/generated/api/schemas',
      client: 'react-query',
      mode: 'tags-split',
      override: {
        mutator: { path: './client/src/lib/api-client.ts', name: 'apiClient' },
        header: () => ['// @ts-nocheck'],
        query: { useQuery: true, useMutation: true },
        zod: { generate: true, coerce: false },
      },
    },
  },
});
```

### 7.2 `npm run generate:api` script

Added to `package.json`:
```json
"generate:api": "orval --config orval.config.ts"
```

### 7.3 Generated hook naming

Orval derives hook names from `operationId`:
- `listProjects` → `useListProjects`
- `createProject` → `useCreateProject`
- `getStatsSummary` → `useGetStatsSummary`

---

## 8. Frontend Integration Design

### 8.1 Projects page (`client/src/pages/Projects.tsx`)

The page gains a new top section above the existing IRC template library:

```
┌─────────────────────────────────────────────────────┐
│  My Projects                          [+ New Project]│
│  ─────────────────────────────────────────────────  │
│  [ProjectCard] [ProjectCard] [ProjectCard]           │
│  (empty state if no projects)                        │
├─────────────────────────────────────────────────────┤
│  IRC Project Library  (existing, unchanged below)    │
└─────────────────────────────────────────────────────┘
```

State management:
- `useListProjects()` — React Query hook from generated API
- `useCreateProject()` — mutation with optimistic update
- `useDeleteProject()` — mutation with confirmation dialog
- On "Load into Design": read `designData` from project, write to Zustand `useDesignStore`,
  navigate to `/suite/design`

Error handling: all mutations wrap in try/catch; errors surface via `sonner` toast
(`toast.error(message)`). Success operations use `toast.success(message)`.

### 8.2 Dashboard page (`client/src/pages/Dashboard.tsx`)

The existing `MetricCard` grid is extended:

```typescript
const { data: stats } = useGetStatsSummary();

// Replace hard-coded values:
<MetricCard label="Projects"   value={stats?.totalProjects  ?? '--'} />
<MetricCard label="Files"      value={stats?.totalFiles     ?? '--'} />
<MetricCard label="Records"    value={stats?.totalRecords   ?? '--'} />
<MetricCard label="Comparisons"value={stats?.totalComparisons ?? '--'} />
<MetricCard label="Drawings"   value={stats?.totalFiles     ?? '--'} />  // replaces "3 Ready"
```

A "Recent Outputs" section is added below the metrics strip, rendering the 5 items from
`stats.recentFiles` as compact file cards.

When the stats query errors, metric values show `"--"` and a non-blocking amber warning
banner appears: "Live stats unavailable — database may be offline."

---

## 9. Backward Compatibility Strategy

### 9.1 Route isolation

All new routes are mounted under distinct prefixes (`/api/projects`, `/api/files`, etc.).
No existing `/api/design/*` route is modified except for the optional `projectId` field
addition (non-breaking: existing clients that omit it continue to work identically).

### 9.2 DATABASE_URL guard

`shared/db.ts` exports `db` as `null` when `DATABASE_URL` is absent. The `dbGuard`
middleware returns HTTP 503 before any handler runs. The existing design engine never
imports from `shared/db.ts` and is unaffected.

### 9.3 TypeScript compilation

Generated files carry `// @ts-nocheck` so they do not contribute errors to `npm run check`.
All new server files are written in strict TypeScript.

### 9.4 Dependency constraints

New dependencies required:
- `orval` (devDependency) — codegen tool, no runtime impact
- `drizzle-zod` is already present (`^0.7.0`)
- `@neondatabase/serverless` is already present
- `drizzle-orm` is already present (`^0.45.2`)

No new runtime dependency conflicts with existing version constraints.

---

## 10. Data Flow Diagrams

### 10.1 Design run with auto-save

```
Client
  │  POST /api/design/calculate  { ...ProjectInput, projectId: 42 }
  ▼
server/api-routes.ts
  │  1. validate input (projectInputBodySchema)
  │  2. calculateCompleteDesign(input)
  │  3. generate Excel workbook
  │  4. send response (Excel binary)
  │  5. void saveAnalysisRecord(42, input, summary)  ← fire-and-forget
  ▼
server/record-routes.ts (saveAnalysisRecord)
  │  INSERT INTO analysis_records ...
  ▼
Neon PostgreSQL
```

### 10.2 Projects page load

```
Browser
  │  GET /api/projects
  ▼
server/project-routes.ts
  │  SELECT * FROM projects ORDER BY created_at DESC
  ▼
Neon PostgreSQL
  │  rows
  ▼
React Query cache → Projects.tsx renders project cards
```

### 10.3 Stats dashboard load

```
Browser
  │  GET /api/stats/summary
  ▼
server/stats-routes.ts
  │  Promise.all([count projects, count files, count records,
  │               count comparisons, recent 5 files])
  ▼
Neon PostgreSQL (5 parallel queries)
  │  { totalProjects, totalFiles, totalRecords, totalComparisons, recentFiles }
  ▼
Dashboard.tsx MetricCard strip + Recent Outputs section
```

---

## 11. File / Folder Structure (new files only)

```
shared/
  db.ts                          ← NEW: Drizzle client singleton
  schema.ts                      ← MODIFIED: add 4 Drizzle tables + drizzle-zod exports

server/
  db-guard.ts                    ← NEW: 503 middleware
  project-routes.ts              ← NEW
  file-routes.ts                 ← NEW
  record-routes.ts               ← NEW
  comparison-routes.ts           ← NEW
  stats-routes.ts                ← NEW
  app-factory.ts                 ← MODIFIED: mount 5 new routers + openapi.yaml endpoint
  api-routes.ts                  ← MODIFIED: optional projectId + fire-and-forget auto-save

openapi/
  bridge-suite.yaml              ← NEW: OpenAPI 3.1 spec

client/src/
  generated/api/                 ← NEW: Orval output (gitignored or committed)
  pages/Projects.tsx             ← MODIFIED: live CRUD section added
  pages/Dashboard.tsx            ← MODIFIED: real stats + recent files

orval.config.ts                  ← NEW
```

---

## 12. Correctness Properties (Property-Based Testing)

These properties are encoded as Vitest + fast-check tests in
`client/src/report-engine/lib/__tests__/` and `server/__tests__/`.

### P1 — JSON Round-Trip Integrity (Requirement 14)

```
∀ valid ProjectInput p:
  JSON.parse(JSON.stringify(p)) deep-equals p
  AND
  calculateCompleteDesign(JSON.parse(JSON.stringify(p))).summary
    ≈ calculateCompleteDesign(p).summary   (within 1e-9)
```

### P2 — Similarity Symmetry (Requirement 4)

```
∀ file records A, B:
  isSimilar(A, B) ↔ isSimilar(B, A)
```

### P3 — Stats Consistency (Requirement 7)

```
∀ database state S:
  getStatsSummary().totalFiles === count(fileRecords in S)
  AND recentFiles.length ≤ 5
  AND recentFiles are ordered by createdAt DESC
```

### P4 — Comparison Minimum Size (Requirement 6)

```
∀ createComparison request with fileIds.length < 2:
  response.status === 400
```

### P5 — Cascade Delete (Requirement 2, 3)

```
∀ project P with file records F and analysis records A:
  DELETE /api/projects/:P.id
  → fileRecords where projectId = P.id → empty
  → analysisRecords where projectId = P.id → empty
```

### P6 — DATABASE_URL Absent Guard (Requirement 13)

```
∀ request to /api/projects | /api/files | /api/records | /api/comparisons | /api/stats
  when DATABASE_URL is unset:
  response.status === 503
```

---

## 13. Implementation Sequence

Following the merge rules (data models first, then backend, then API contracts, then UI):

1. **shared/schema.ts** — add Drizzle tables + drizzle-zod exports
2. **shared/db.ts** — Drizzle client singleton with DATABASE_URL guard
3. **server/db-guard.ts** — 503 middleware
4. **server/project-routes.ts** — Projects CRUD
5. **server/file-routes.ts** — File Records CRUD + similar search
6. **server/record-routes.ts** — Analysis Records CRUD + variations
7. **server/comparison-routes.ts** — Comparisons CRUD
8. **server/stats-routes.ts** — Stats summary
9. **server/app-factory.ts** — mount new routers + openapi.yaml endpoint
10. **server/api-routes.ts** — optional projectId + auto-save
11. **openapi/bridge-suite.yaml** — OpenAPI 3.1 spec
12. **orval.config.ts** + `npm run generate:api` — typed client
13. **client/src/pages/Projects.tsx** — live CRUD section
14. **client/src/pages/Dashboard.tsx** — real stats integration
15. **PBT tests** — encode correctness properties P1–P6
