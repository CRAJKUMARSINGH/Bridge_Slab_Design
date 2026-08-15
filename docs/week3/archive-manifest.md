# Archive Manifest ΓÇö Week 3

**Purpose:** Record every component moved to `archive/` during the Week 3 repository
reorientation. History is preserved via git moves ΓÇö nothing is deleted.

**Rule:** A component is archived only when the baseline proves it is not required
by the single server / calculation / report / UI path defined in the repo map below.
If there is any doubt, the component stays in place and is listed as RETAINED.

---

## Archive structure

```
archive/
  legacy-platform/      # Duplicate dashboard, auth, or deployment layers
  legacy-engines/       # Superseded calculation paths
  legacy-ui/            # Superseded front-end entry points
  legacy-scripts/       # One-off or exploratory scripts
  README.md             # This document's summary
```

---

## Components archived in Week 3

| # | Original path | Archive path | Reason | Status |
|---|---|---|---|---|
| ΓÇö | No components archived yet | ΓÇö | Canonical workbook classification (Week 2) must complete first | PENDING |

> When a component is archived, add a row to this table with the git commit SHA.

---

## Components retained (not archived)

| Path | Purpose | Notes |
|---|---|---|
| `lib/engine/` | Single authoritative calculation engine | Must not be duplicated |
| `lib/api-spec/` | OpenAPI contract | Week 4 populates |
| `lib/api-zod/` | Generated Zod schemas | Week 4 populates |
| `artifacts/bridge-report-studio/` | React/Vite UI | Single UI path |
| `artifacts/mockup-sandbox/` | UI component sandbox | Retained for development |
| `scripts/` | CLI tools, classifiers, parity | Required by plan |
| `docs/` | Week deliverables, decisions | Project record |

---

## Single-path map (post-reorientation)

```
Request ΓåÆ artifacts/bridge-report-studio (React UI)
              Γåô fetch
         lib/api-spec / lib/api-zod (typed API contract)
              Γåô
         artifacts/bridge-report-studio/server/ (Express 5 API server)
              Γåô
         lib/engine (calculation engine ΓÇö ONE pipeline)
              Γåô
         report generation ΓåÆ HTML / PDF
```

Any code path that bypasses `lib/engine` for calculations must be archived.

---

## Dependency and runtime baseline

| Dependency | Retained | Reason |
|---|---|---|
| Express 5 | YES | API server |
| Zod v4 | YES | Input validation |
| Drizzle ORM | YES | Project/run persistence (Week 11) |
| PostgreSQL | YES | Persistence store |
| Vite 7 | YES | UI build |
| React 19 | YES | UI |
| esbuild 0.27.3 | YES | Server bundle |
| openpyxl (Python) | YES | Workbook classification scripts |

---

## Exit gate checklist

- [ ] Application boots after reorientation
- [ ] Prototype UI still renders
- [ ] Every archived component is recoverable via git history
- [ ] Archive manifest updated with all moved paths and commit SHAs
- [ ] README updated with current repo map
