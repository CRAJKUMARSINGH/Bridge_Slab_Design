# Bridge Slab Design

Bridge Slab Design — an engineering calculation and design-report toolchain for
RCC slab bridges (IRC / IS / MoRTH design basis), with an auditable containment
harness (`pnpm run gate:foundation`) that keeps the repository's claims
falsifiable.

> The 2026-11-19 documentation purge removed this README. It is restored here
> because a standing order must reside in it; the generated module map below is
> produced by `scripts/gen-readme-map.ts` (`pnpm run gen:readme`) and verified by
> `gate:readme`.

## Standing Orders

These orders are permanent and apply to every agent working in this repository.

1. **Keep the session chat log.** The session chat log is appended to
   `CREAT.md` at the repository root and refreshed on a 12-minute cadence.
   `CREAT.md` is intentionally local-only (git-ignored) so the log never dirties
   the tracked tree. This order also resides in `CREAT.md` itself.
2. **Keep folders always, even when empty.** No directory is ever deleted for
   being empty, and a directory the repository requires is kept present even
   when it holds no content, using a `.gitkeep` placeholder so that git — which
   does not track empty directories — still preserves it. Empty is a valid
   state; absent is not.

Authoritative per-week instruction inputs live in `CODE-JUNCTION/`
(local-only, git-ignored). Read and apply them before starting a week.

## Repository map

<!-- GEN:module-map -->
| Path | Purpose | Size |
|---|---|---|
| `api/` | serverless API entry point | 1 entries |
| `archive/` | retired artefacts, one MANIFEST.md row each | 897 entries |
| `artifacts/` | workspace app packages | 94 entries |
| `bridge-excel-generator/` | legacy engine (being absorbed into lib/engine) | 29 entries |
| `client/` | React UI | 132 entries |
| `containment/` | trust tiers, contracts, claim ledger | 11 entries |
| `data/` | local-only data, not shipped | 1 entries |
| `design-reports/` | generated design report HTML | 27 entries |
| `docs/` | phase deliverables | 57 entries |
| `Drawing_Module/` | drawing components, reached through the @drawing/* alias | 2 entries |
| `engineering/` | engineering knowledge audit and asset registry | 2 entries |
| `evidence/` | assimilation evidence bundles | 663 entries |
| `inputs/` | engine input contract (variables, coefficients, constraints) | 6 entries |
| `lib/` | authoritative engine surface (shim; migrates in W02) | 57 entries |
| `openapi/` | OpenAPI description of the API | 1 entries |
| `out/` | generated reports and workbooks | 4 entries |
| `pipeline/` | pipeline entry point | 1 entries |
| `project/` | canonical projects and asset catalogue | 6 entries |
| `python_cad/` | CAD adapter | 3 entries |
| `sample/` | integration test logs | 622 entries |
| `scripts/` | tooling, gates, extractors | 132 entries |
| `server/` | Express 4 API server | 36 entries |
| `shared/` | db, schema, feature flags | 6 entries |
| `src/` | root-level extras | 1 entries |
| `test-output/` | ad-hoc verification output | 6 entries |
| `tests/` | golden fixtures and integration tests | 23 entries |
<!-- /GEN:module-map -->
