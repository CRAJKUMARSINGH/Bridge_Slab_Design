# Archive Manifest ΓÇö Week 3

**Rule:** Archive by git-mv, never delete. History is preserved.  
**Status:** Phase 1 ΓÇö inventory complete. Phase 2 (moves) requires engineering owner sign-off.

## Components to archive (pending approval)

| # | Current path | Archive path | Reason |
|---|---|---|---|
| 1 | `client/src/report-engine-weaver/` | `archive/legacy-ui/report-engine-weaver/` | Duplicate report-engine surface |
| 2 | `ETERNAL_RESEARCH_CHILD/` | `archive/legacy-platform/ETERNAL_RESEARCH_CHILD/` | Exploratory, not on main pipeline path |
| 3 | `scripts/phase-zero/` | `archive/legacy-scripts/phase-zero/` | Bootstrap-era scripts superseded by week0/ scripts |
| 4 | `scripts/stress-test-15-users.ts` | `archive/legacy-scripts/` | Load test, not on pipeline |
| 5 | `scripts/batch-eleven-comprehensive-pdf.ts` | `archive/legacy-scripts/` | Batch script, not pipeline |
| 6 | `scripts/export-sample-output-bundle.ts` | `archive/legacy-scripts/` | Sample export, not pipeline |
| 7 | `api/` | `archive/legacy-platform/api/` | Superseded by artifacts/api-server |
| 8 | `netlify/` | `archive/legacy-platform/netlify/` | Deployment platform not on main path |

## Components RETAINED (not archived)

| Path | Reason retained |
|---|---|
| `bridge-excel-generator/` | Current authoritative calculation engine ΓÇö retained until lib/engine parity proven |
| `server/` | Existing prototype backend ΓÇö retained as working prototype |
| `client/` | Existing prototype UI ΓÇö retained as working prototype |
| `shared/` | Shared schema/types ΓÇö retained |
| `lib/engine/` | New canonical engine under construction |
| `lib/api-zod/` | New input schema |
| `lib/api-spec/` | API contract |
| `lib/db/` | Persistence schema |
| `artifacts/api-server/` | New API server under construction |
| `artifacts/mockup-sandbox/` | UI component sandbox |
| `scripts/verify-*.ts` | Active parity scripts |
| `scripts/fixtures/` | Input fixtures |
| `scripts/week0/` | Foundation scripts |
| `tests/` | Golden regression fixtures |
| `inputs/` | Foundation registries |
| `project/` | Foundation project docs |
| `docs/` | Week deliverables |

## Single-path map (post-archive target)

```
Request ΓåÆ artifacts/mockup-sandbox (React UI)
            Γåô fetch
          lib/api-spec / lib/api-zod (typed contract)
            Γåô
          artifacts/api-server (Express 5)
            Γåô
          lib/engine (ONE pure calculation pipeline)
            Γåô
          Narrative + Chart + PDF generation
```

## Exit gate
- [ ] Engineering owner approves archive list
- [ ] git-mv executed for each component
- [ ] Application boots after each move
- [ ] Archive manifest updated with commit SHAs
