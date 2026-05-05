# Requirements Document

## Introduction

This document specifies the requirements for merging the D4_Bridge (Replit-baseline) project
management and file-tracking features into the Bridge_Slab_Design (cursor-baseline) application.

The cursor-baseline is a single-package Node.js + Express 4 + React 19 + Vite 7 + TypeScript
application that already provides a comprehensive IRC bridge design engine (46-sheet Excel,
SVG drawings, DXF/PDF export, validation, estimation, and more). Its Projects page is currently
UI-only — it shows static template cards but has no persistent backend.

The D4_Bridge app provides a well-structured REST API for project persistence, file record
tracking, design variation records, multi-file comparisons, and a stats dashboard, backed by
PostgreSQL via Drizzle ORM.

The merge goal is to incorporate those six capabilities into the cursor-baseline without
breaking any existing feature, without changing the package manager (npm), Node version (20),
Express version (4), or Zod version (3), and without converting the app to a monorepo.

---

## Glossary

- **System**: The merged Bridge Design Suite application (cursor-baseline after merge).
- **Design_Engine**: The existing `POST /api/design/calculate` pipeline that produces the
  46-sheet Excel workbook and all derived outputs.
- **Project**: A named bridge design project record stored in PostgreSQL, containing metadata
  such as name, location, district, responsible engineer, and an optional snapshot of the
  `ProjectInput` used for the last design run.
- **File_Record**: A database record representing a generated output file (DXF, DXF, PDF, SVG,
  Excel, HTML) linked to a Project, storing bridge parameters and the file's storage path or
  URL.
- **Analysis_Record**: A database record capturing a single design run or design variation,
  linked to a File_Record, storing the full `ProjectInput` snapshot, computed results summary,
  and a variation type label.
- **Comparison**: A database record grouping two or more File_Records for side-by-side
  parameter comparison.
- **Stats_Dashboard**: The aggregated counts and recent-activity summary served by
  `GET /api/stats/summary`.
- **OpenAPI_Spec**: A machine-readable OpenAPI 3.1 YAML document describing all new and
  existing `/api/projects`, `/api/files`, `/api/records`, `/api/comparisons`, and
  `/api/stats` endpoints.
- **Typed_Client**: TypeScript React Query hooks and Zod schemas auto-generated from the
  OpenAPI_Spec using Orval (or an equivalent codegen tool compatible with npm and Zod v3).
- **Projects_Page**: The existing React page at `/suite/projects` (`client/src/pages/Projects.tsx`).
- **Dashboard_Page**: The existing React page at `/suite/dashboard` (`client/src/pages/Dashboard.tsx`).
- **Drizzle_Schema**: The Drizzle ORM table definitions in `shared/schema.ts` (and any
  co-located migration files) that define the PostgreSQL tables used by the System.
- **IRC**: Indian Roads Congress — the design code family (IRC SP-13, IRC:112-2015, IRC:6-2016,
  IRC:78) that governs all bridge design calculations in the System.

---

## Requirements

### Requirement 1: Database Schema Extension

**User Story:** As a backend developer, I want the Drizzle ORM schema to include tables for
projects, file records, analysis records, and comparisons, so that all new persistence
features share the existing Neon PostgreSQL connection and migration toolchain.

#### Acceptance Criteria

1. THE Drizzle_Schema SHALL define a `projects` table with columns: `id` (serial primary key),
   `name` (text, not null), `location` (text), `district` (text), `engineer` (text),
   `designData` (jsonb), `createdAt` (timestamp with time zone, default now()),
   `updatedAt` (timestamp with time zone, default now()).

2. THE Drizzle_Schema SHALL define a `file_records` table with columns: `id` (serial primary
   key), `projectId` (integer, foreign key → projects.id, on delete cascade), `fileName`
   (text, not null), `fileType` (text, not null — one of: `dxf`, `pdf`, `svg`, `xlsx`,
   `html`), `filePath` (text), `bridgeType` (text), `spanLength` (numeric), `width`
   (numeric), `height` (numeric), `material` (text), `loadCapacity` (numeric),
   `designCode` (text), `layers` (jsonb), `createdAt` (timestamp with time zone, default
   now()), `updatedAt` (timestamp with time zone, default now()).

3. THE Drizzle_Schema SHALL define an `analysis_records` table with columns: `id` (serial
   primary key), `fileId` (integer, foreign key → file_records.id, on delete cascade),
   `projectId` (integer, foreign key → projects.id, on delete cascade), `variationType`
   (text, not null), `inputSnapshot` (jsonb, not null), `resultsSummary` (jsonb),
   `createdAt` (timestamp with time zone, default now()), `updatedAt` (timestamp with time
   zone, default now()).

4. THE Drizzle_Schema SHALL define a `comparisons` table with columns: `id` (serial primary
   key), `name` (text, not null), `fileIds` (jsonb, not null — array of file_record ids),
   `notes` (text), `createdAt` (timestamp with time zone, default now()), `updatedAt`
   (timestamp with time zone, default now()).

5. WHEN `drizzle-kit push` is executed against a connected Neon PostgreSQL database, THE
   Drizzle_Schema SHALL create all four tables without errors and without dropping or
   altering any pre-existing tables.

6. THE Drizzle_Schema SHALL export Zod v3 insert and select schemas for each table using
   `drizzle-zod`, so that route handlers can validate request bodies without importing Zod v4.

---

### Requirement 2: Projects CRUD API

**User Story:** As a bridge engineer, I want to create, read, update, and delete bridge design
projects via a REST API, so that my work is persisted in the database and survives page
refreshes and server restarts.

#### Acceptance Criteria

1. WHEN a `POST /api/projects` request is received with a valid JSON body containing at least
   a `name` field, THE System SHALL insert a new Project row and return HTTP 201 with the
   created Project object (including `id`, `createdAt`, `updatedAt`).

2. WHEN a `POST /api/projects` request is received with a missing or empty `name` field, THE
   System SHALL return HTTP 400 with a JSON error body describing the validation failure.

3. WHEN a `GET /api/projects` request is received, THE System SHALL return HTTP 200 with a
   JSON array of all Project rows ordered by `createdAt` descending.

4. WHEN a `GET /api/projects/:id` request is received with a valid integer `id`, THE System
   SHALL return HTTP 200 with the matching Project object.

5. WHEN a `GET /api/projects/:id` request is received with an `id` that does not exist in the
   database, THE System SHALL return HTTP 404 with a JSON error body.

6. WHEN a `PATCH /api/projects/:id` request is received with a valid JSON body, THE System
   SHALL update only the supplied fields of the matching Project row, set `updatedAt` to the
   current timestamp, and return HTTP 200 with the updated Project object.

7. WHEN a `DELETE /api/projects/:id` request is received with a valid integer `id`, THE System
   SHALL delete the matching Project row (cascading to its file_records and analysis_records)
   and return HTTP 204 with no body.

8. WHEN a `DELETE /api/projects/:id` request is received with an `id` that does not exist,
   THE System SHALL return HTTP 404 with a JSON error body.

---

### Requirement 3: File Records CRUD API

**User Story:** As a bridge engineer, I want every DXF, PDF, SVG, Excel, and HTML file
generated by the Design Engine to be optionally registered as a File Record linked to a
Project, so that I can track what outputs have been produced for each project.

#### Acceptance Criteria

1. WHEN a `POST /api/files` request is received with a valid JSON body containing `projectId`,
   `fileName`, and `fileType`, THE System SHALL insert a new File_Record row and return HTTP
   201 with the created File_Record object.

2. WHEN a `POST /api/files` request is received with a `fileType` value not in the allowed
   set (`dxf`, `pdf`, `svg`, `xlsx`, `html`), THE System SHALL return HTTP 400 with a
   descriptive validation error.

3. WHEN a `POST /api/files` request is received with a `projectId` that does not reference an
   existing Project, THE System SHALL return HTTP 422 with a JSON error body indicating the
   foreign key constraint failure.

4. WHEN a `GET /api/files` request is received, THE System SHALL return HTTP 200 with a JSON
   array of all File_Record rows ordered by `createdAt` descending.

5. WHEN a `GET /api/files` request is received with a `projectId` query parameter, THE System
   SHALL return HTTP 200 with only the File_Record rows belonging to that project.

6. WHEN a `GET /api/files/:id` request is received with a valid integer `id`, THE System SHALL
   return HTTP 200 with the matching File_Record object.

7. WHEN a `GET /api/files/:id` request is received with an `id` that does not exist, THE
   System SHALL return HTTP 404 with a JSON error body.

8. WHEN a `PATCH /api/files/:id` request is received with a valid JSON body, THE System SHALL
   update only the supplied fields and return HTTP 200 with the updated File_Record object.

9. WHEN a `DELETE /api/files/:id` request is received with a valid integer `id`, THE System
   SHALL delete the matching File_Record row (cascading to its analysis_records) and return
   HTTP 204 with no body.

---

### Requirement 4: Similar Files Search

**User Story:** As a bridge engineer, I want to find previously generated files that are
structurally similar to a given file by comparing bridge parameters, so that I can reuse or
compare designs without manually searching.

#### Acceptance Criteria

1. WHEN a `GET /api/files/:id/similar` request is received with a valid integer `id`, THE
   System SHALL return HTTP 200 with a JSON array of File_Record rows whose `bridgeType`,
   `spanLength`, `width`, `material`, and `designCode` fields are similar to those of the
   referenced file.

2. WHEN computing similarity, THE System SHALL consider two numeric parameters similar WHEN
   their values differ by no more than 20 percent of the reference file's value.

3. WHEN a `GET /api/files/:id/similar` request is received with an `id` that does not exist,
   THE System SHALL return HTTP 404 with a JSON error body.

4. WHEN a `GET /api/files/:id/similar` request is received and no similar files exist, THE
   System SHALL return HTTP 200 with an empty JSON array.

5. THE System SHALL exclude the reference file itself from the similarity results.

---

### Requirement 5: Analysis / Design Variation Records API

**User Story:** As a bridge engineer, I want every design run to be optionally saved as an
Analysis Record linked to a project and file, so that I can review the history of design
variations and compare parameter changes over time.

#### Acceptance Criteria

1. WHEN a `POST /api/records` request is received with a valid JSON body containing
   `fileId`, `projectId`, `variationType`, and `inputSnapshot`, THE System SHALL insert a
   new Analysis_Record row and return HTTP 201 with the created record.

2. WHEN a `POST /api/records` request is received with a missing `inputSnapshot` field, THE
   System SHALL return HTTP 400 with a descriptive validation error.

3. WHEN a `GET /api/records` request is received, THE System SHALL return HTTP 200 with a
   JSON array of all Analysis_Record rows ordered by `createdAt` descending.

4. WHEN a `GET /api/records` request is received with a `projectId` query parameter, THE
   System SHALL return only Analysis_Record rows belonging to that project.

5. WHEN a `GET /api/records` request is received with a `fileId` query parameter, THE System
   SHALL return only Analysis_Record rows linked to that file.

6. WHEN a `GET /api/records/variations` request is received, THE System SHALL return HTTP 200
   with a JSON object grouping Analysis_Record rows by their `variationType` field.

7. WHEN a `GET /api/records/:id` request is received with a valid integer `id`, THE System
   SHALL return HTTP 200 with the matching Analysis_Record object.

8. WHEN a `GET /api/records/:id` request is received with an `id` that does not exist, THE
   System SHALL return HTTP 404 with a JSON error body.

9. WHEN a `PATCH /api/records/:id` request is received with a valid JSON body, THE System
   SHALL update only the supplied fields and return HTTP 200 with the updated record.

10. WHEN a `DELETE /api/records/:id` request is received with a valid integer `id`, THE System
    SHALL delete the matching Analysis_Record row and return HTTP 204 with no body.

---

### Requirement 6: Multi-File Comparisons API

**User Story:** As a bridge engineer, I want to create named comparisons that group multiple
File Records, so that I can perform side-by-side parameter analysis across different design
variants or projects.

#### Acceptance Criteria

1. WHEN a `POST /api/comparisons` request is received with a valid JSON body containing
   `name` and a non-empty `fileIds` array, THE System SHALL insert a new Comparison row and
   return HTTP 201 with the created Comparison object.

2. WHEN a `POST /api/comparisons` request is received with an empty `fileIds` array, THE
   System SHALL return HTTP 400 with a descriptive validation error.

3. WHEN a `POST /api/comparisons` request is received with a `fileIds` array containing fewer
   than 2 entries, THE System SHALL return HTTP 400 with a descriptive validation error
   stating that at least 2 files are required for a comparison.

4. WHEN a `GET /api/comparisons` request is received, THE System SHALL return HTTP 200 with a
   JSON array of all Comparison rows ordered by `createdAt` descending.

5. WHEN a `GET /api/comparisons/:id` request is received with a valid integer `id`, THE System
   SHALL return HTTP 200 with the matching Comparison object, including the full File_Record
   objects for each id in `fileIds`.

6. WHEN a `GET /api/comparisons/:id` request is received with an `id` that does not exist,
   THE System SHALL return HTTP 404 with a JSON error body.

7. WHEN a `DELETE /api/comparisons/:id` request is received with a valid integer `id`, THE
   System SHALL delete the matching Comparison row and return HTTP 204 with no body.

---

### Requirement 7: Stats Dashboard API

**User Story:** As a project manager, I want a single endpoint that returns aggregate counts
and recent activity across all projects, files, records, and comparisons, so that the
Dashboard page can display real data instead of hard-coded placeholders.

#### Acceptance Criteria

1. WHEN a `GET /api/stats/summary` request is received, THE System SHALL return HTTP 200 with
   a JSON object containing: `totalProjects` (integer), `totalFiles` (integer),
   `totalRecords` (integer), `totalComparisons` (integer), and `recentFiles` (array of the
   5 most recently created File_Record rows).

2. WHEN the database contains no rows in any table, THE System SHALL return HTTP 200 with all
   count fields set to 0 and `recentFiles` set to an empty array.

3. THE System SHALL compute all counts in a single database round-trip using parallel queries
   or a single aggregation query, so that the endpoint responds within 500 ms under normal
   load.

---

### Requirement 8: OpenAPI Specification

**User Story:** As a frontend developer, I want a machine-readable OpenAPI 3.1 specification
covering all new project management, file record, analysis record, comparison, and stats
endpoints, so that typed client hooks can be generated automatically.

#### Acceptance Criteria

1. THE System SHALL provide an OpenAPI 3.1 YAML document at `openapi/bridge-suite.yaml`
   describing all endpoints under `/api/projects`, `/api/files`, `/api/records`,
   `/api/comparisons`, and `/api/stats`.

2. THE OpenAPI_Spec SHALL define request body schemas and response schemas for every endpoint
   using JSON Schema objects that are consistent with the Drizzle_Schema Zod definitions.

3. THE OpenAPI_Spec SHALL include an `operationId` for every operation, following the
   convention `<verb><Resource>` (e.g., `listProjects`, `createProject`, `getProject`,
   `updateProject`, `deleteProject`).

4. WHEN `GET /api/openapi.yaml` is requested, THE System SHALL serve the OpenAPI_Spec YAML
   file with `Content-Type: application/yaml`.

5. THE OpenAPI_Spec SHALL document all HTTP error responses (400, 404, 422, 500) with
   consistent `{ success: false, error: string }` response schemas.

---

### Requirement 9: Typed API Client Code Generation

**User Story:** As a frontend developer, I want TypeScript React Query hooks and Zod v3
schemas auto-generated from the OpenAPI spec, so that I can call the new backend endpoints
with full type safety and without writing boilerplate fetch code.

#### Acceptance Criteria

1. THE System SHALL include an Orval configuration file (`orval.config.ts`) that reads
   `openapi/bridge-suite.yaml` and outputs generated files to
   `client/src/generated/api/`.

2. WHEN `npm run generate:api` is executed, THE System SHALL invoke Orval and produce
   TypeScript React Query hooks (using `@tanstack/react-query` v5) and Zod v3 validation
   schemas in `client/src/generated/api/`.

3. THE generated hooks SHALL follow the naming convention `use<OperationId>` (e.g.,
   `useListProjects`, `useCreateProject`).

4. THE generated Zod schemas SHALL be compatible with Zod v3 (`zod ^3.x`) and SHALL NOT
   import from `zod/v4` or any Zod v4-specific API.

5. THE generated files SHALL be excluded from TypeScript strict-mode errors via a
   `// @ts-nocheck` header or equivalent suppression, so that codegen output does not block
   the `npm run check` build step.

6. WHERE the `DATABASE_URL` environment variable is not set, THE System SHALL start without
   error and the generated hooks SHALL return appropriate error states rather than crashing
   the application.

---

### Requirement 10: Projects Page — Live CRUD Integration

**User Story:** As a bridge engineer, I want the Projects page to display my persisted
projects from the database and allow me to create, rename, and delete them, so that the page
reflects real project state rather than static template cards.

#### Acceptance Criteria

1. WHEN the Projects page loads, THE Projects_Page SHALL fetch projects from
   `GET /api/projects` and display each project as a card showing `name`, `location`,
   `district`, `engineer`, and `createdAt`.

2. WHEN the Projects page is displayed and no projects exist in the database, THE
   Projects_Page SHALL display an empty-state message with a "Create Project" call-to-action.

3. WHEN a user submits the "Create Project" form with a valid name, THE Projects_Page SHALL
   call `POST /api/projects`, optimistically add the new project card to the list, and show
   a success toast notification.

4. WHEN a user clicks "Delete" on a project card and confirms the action, THE Projects_Page
   SHALL call `DELETE /api/projects/:id` and remove the card from the list.

5. WHEN a user clicks "Load into Design" on a project card that has a `designData` snapshot,
   THE Projects_Page SHALL populate the Design page's Zustand store with the stored
   `ProjectInput` and navigate to `/suite/design`.

6. THE Projects_Page SHALL continue to display the existing IRC template library section
   (static template cards) below the persisted projects section, so that the template
   browsing workflow is not disrupted.

7. WHEN a network error occurs during any CRUD operation, THE Projects_Page SHALL display an
   error toast notification with a human-readable message and SHALL NOT leave the UI in an
   inconsistent state.

---

### Requirement 11: Dashboard Page — Real Stats Integration

**User Story:** As a project manager, I want the Dashboard page to show real counts of
projects, files, records, and comparisons from the database, so that the metrics strip
reflects actual usage rather than hard-coded values.

#### Acceptance Criteria

1. WHEN the Dashboard page loads, THE Dashboard_Page SHALL fetch data from
   `GET /api/stats/summary` and display `totalProjects`, `totalFiles`, `totalRecords`, and
   `totalComparisons` in the existing metrics strip cards.

2. WHEN the stats API returns data, THE Dashboard_Page SHALL replace the hard-coded
   "Drawings: 3 Ready" metric card with a live count of total File_Records.

3. WHEN the stats API call fails or the database is unavailable, THE Dashboard_Page SHALL
   display "--" in the affected metric cards and show a non-blocking warning banner, without
   crashing or hiding the rest of the dashboard content.

4. WHEN `recentFiles` is returned by the stats API, THE Dashboard_Page SHALL display the 5
   most recent files in a "Recent Outputs" section below the metrics strip.

---

### Requirement 12: Auto-Save Design Run as Analysis Record

**User Story:** As a bridge engineer, I want each successful design calculation to be
optionally saved as an Analysis Record linked to the active project, so that I can review
the history of design runs without manually exporting data.

#### Acceptance Criteria

1. WHEN `POST /api/design/calculate` completes successfully and the request body includes a
   `projectId` field referencing an existing Project, THE System SHALL automatically create
   an Analysis_Record with `variationType` set to `"design-run"`, `inputSnapshot` set to
   the full `ProjectInput`, and `resultsSummary` set to the top-level numeric outputs from
   `calculateCompleteDesign`.

2. WHEN `POST /api/design/calculate` completes successfully and the request body does not
   include a `projectId` field, THE System SHALL NOT create an Analysis_Record and SHALL
   behave identically to the current implementation.

3. IF the Analysis_Record insertion fails for any reason, THEN THE System SHALL log the error
   and still return the Excel file to the client, so that the design export is never blocked
   by a database write failure.

4. WHEN `POST /api/design/results` completes successfully and the request body includes a
   `projectId` field, THE System SHALL apply the same auto-save behaviour as criterion 1,
   with `resultsSummary` set to the JSON results object.

---

### Requirement 13: Backward Compatibility and Non-Regression

**User Story:** As a developer, I want all existing API endpoints and client pages to continue
working exactly as before the merge, so that no currently working feature is broken by the
new database tables or route additions.

#### Acceptance Criteria

1. THE System SHALL mount all new project management routes under `/api/projects`,
   `/api/files`, `/api/records`, `/api/comparisons`, and `/api/stats`, so that no new route
   path conflicts with any existing `/api/design/*` route.

2. WHEN `DATABASE_URL` is not set in the environment, THE System SHALL start successfully,
   serve all existing `/api/design/*` endpoints without error, and return HTTP 503 with a
   descriptive message from any new database-dependent endpoint.

3. THE System SHALL NOT modify the request or response contract of any existing
   `/api/design/*` endpoint, except to optionally accept an additional `projectId` field in
   the body of `POST /api/design/calculate` and `POST /api/design/results` (Requirement 12).

4. WHEN `npm run check` is executed, THE System SHALL produce zero TypeScript compilation
   errors across all server and client source files.

5. WHEN `npm run test` is executed, THE System SHALL pass all pre-existing Vitest test suites
   without modification.

6. THE System SHALL NOT introduce any new npm dependency that conflicts with the existing
   `zod ^3.x`, `express ^4.x`, `drizzle-orm ^0.45.x`, or `@tanstack/react-query ^5.x`
   version constraints.

---

### Requirement 14: Parser and Serializer Round-Trip Integrity

**User Story:** As a developer, I want all JSON serialization and deserialization of
`ProjectInput`, `resultsSummary`, and bridge parameter objects stored in JSONB columns to
preserve data fidelity, so that a design run loaded from the database produces identical
results to the original run.

#### Acceptance Criteria

1. THE System SHALL serialize `ProjectInput` objects to JSON before storing them in the
   `inputSnapshot` JSONB column using `JSON.stringify`.

2. WHEN an `inputSnapshot` is read from the database and parsed with `JSON.parse`, THE
   System SHALL produce a `ProjectInput` object that, when passed to `calculateCompleteDesign`,
   returns a `resultsSummary` numerically identical (within floating-point tolerance of
   1e-9) to the original run's summary.

3. FOR ALL valid `ProjectInput` objects, serializing then deserializing then re-serializing
   SHALL produce an identical JSON string (round-trip property).

4. THE System SHALL validate every `inputSnapshot` read from the database against the
   `projectInputBodySchema` Zod schema before passing it to the Design_Engine, and SHALL
   return HTTP 422 with a descriptive error if validation fails.
