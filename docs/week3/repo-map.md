# Repository Map ΓÇö Week 3

**Last updated:** 09 August 2026  
**Status:** Post-reorientation target layout

This map describes the intended structure after Week 3. Populate each section
as work completes and update the "status" column accordingly.

---

## Top-level layout

```
Bridge-Reorient-System/
Γöé
Γö£ΓöÇΓöÇ lib/                         # Shared libraries (pnpm workspace packages)
Γöé   Γö£ΓöÇΓöÇ engine/                  # @workspace/engine ΓÇö calculation engine
Γöé   Γöé   Γö£ΓöÇΓöÇ src/
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ calculate.ts     # One authoritative pipeline
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ types.ts         # Input / result / trace types
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ fingerprint.ts   # Deterministic input hash
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ index.ts         # Public API
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ week0/           # Week 0 JSON registry files
Γöé   Γöé   Γö£ΓöÇΓöÇ package.json
Γöé   Γöé   ΓööΓöÇΓöÇ tsconfig.json
Γöé   Γöé
Γöé   Γö£ΓöÇΓöÇ api-spec/                # @workspace/api-spec ΓÇö OpenAPI YAML (Week 4)
Γöé   Γö£ΓöÇΓöÇ api-zod/                 # @workspace/api-zod ΓÇö generated Zod schemas (Week 4)
Γöé   ΓööΓöÇΓöÇ db/                      # @workspace/db ΓÇö Drizzle schema (Week 11)
Γöé
Γö£ΓöÇΓöÇ artifacts/
Γöé   Γö£ΓöÇΓöÇ bridge-report-studio/    # Main application (React UI + Express server)
Γöé   Γöé   Γö£ΓöÇΓöÇ client/              # React/Vite front-end
Γöé   Γöé   Γö£ΓöÇΓöÇ server/              # Express 5 API server
Γöé   Γöé   Γö£ΓöÇΓöÇ golden/              # Golden project fixtures (Week 6)
Γöé   Γöé   ΓööΓöÇΓöÇ package.json
Γöé   Γöé
Γöé   ΓööΓöÇΓöÇ mockup-sandbox/          # UI component sandbox
Γöé
Γö£ΓöÇΓöÇ scripts/
Γöé   Γö£ΓöÇΓöÇ week2/                   # Workbook classifier + make_demo
Γöé   Γö£ΓöÇΓöÇ week6/                   # Golden regression harness (Week 6)
Γöé   ΓööΓöÇΓöÇ week12/                  # Import workflow tools (Week 12)
Γöé
Γö£ΓöÇΓöÇ docs/
Γöé   Γö£ΓöÇΓöÇ week1/                   # Charter baseline, golden register, decision log
Γöé   Γö£ΓöÇΓöÇ week2/                   # (classifier docs)
Γöé   Γö£ΓöÇΓöÇ week3/                   # This repo map, archive manifest
Γöé   ΓööΓöÇΓöÇ ...                      # One folder per week
Γöé
Γö£ΓöÇΓöÇ archive/                     # Quarantined legacy components (git history preserved)
Γöé
Γö£ΓöÇΓöÇ creat.md                     # Living project charter ΓÇö MUST be kept current
Γö£ΓöÇΓöÇ replit.md                    # Operations guide
Γö£ΓöÇΓöÇ package.json                 # Workspace root
Γö£ΓöÇΓöÇ pnpm-workspace.yaml          # Workspace config
Γö£ΓöÇΓöÇ tsconfig.json                # Root TypeScript project references
ΓööΓöÇΓöÇ tsconfig.base.json           # Shared TS compiler options
```

---

## Source-of-truth files

| Concern | File |
|---|---|
| Project charter | `creat.md` |
| Operations guide | `replit.md` |
| DB schema | `lib/db/src/schema.ts` (Week 11) |
| API contract | `lib/api-spec/openapi.yaml` (Week 4) |
| Calculation engine | `lib/engine/src/calculate.ts` |
| Input schema (Zod) | `lib/api-zod/dist/` ΓÇö generated from API spec |
| Golden inputs | `artifacts/bridge-report-studio/golden/kherwara/inputs/` (Week 6) |
| Golden snapshots | `artifacts/bridge-report-studio/golden/kherwara/snapshots/` (Week 6) |
| Decision log | `docs/week1/decision-log.md` |

---

## Package graph

```
@workspace/engine            (no workspace deps)
       Γåæ
@workspace/api-zod           (Week 4 ΓÇö depends on engine types)
       Γåæ
bridge-report-studio/server  (depends on engine + api-zod + db)
       Γåæ
bridge-report-studio/client  (depends on api-zod for typed hooks)
```

---

## Status legend

| Symbol | Meaning |
|---|---|
| Γ£à | Complete and tested |
| ≡ƒöº | In progress |
| ≡ƒôï | Planned ΓÇö stub exists |
| Γ¢ö | Blocked ΓÇö dependency missing |
| ≡ƒùä∩╕Å | Archived |
