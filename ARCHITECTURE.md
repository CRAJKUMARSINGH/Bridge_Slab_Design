# Architecture

A map of the tree as it exists. Where the map and the tree disagree, the tree is
right and this file is the defect — `pnpm run gate:preflight` P-01 is the check.

## Shape

```
inputs/            design inputs + coefficients + constraints + schema + trace map
corpus/oracle/     GOLDEN-ORACLE.json — the frozen numerical oracle
lib/engine/src/    the calculation engine (contracts.ts is the frozen boundary)
lib/api-spec/      openapi.yaml + orval config (source of truth for the API)
lib/api-zod/       generated request/response schemas
lib/db/            drizzle schema and client
lib/narrative/     narrative text for reports
lib/report/        report assembly
server/            Express app: routes, exporters, validators
client/src/        Vite + React UI
bridge-excel-generator/  the workbook deliverable
shared/            cross-cutting types, schema, feature flags
pipeline/          end-to-end pipeline runner
scripts/gates/     the gates, and their harness (_lib.ts)
tests/golden/      frozen expected outputs
containment/       the rules that keep the instruction set honest
docs/phase-2/      the Phase-2 instruction set
archive/           retired artefacts + MANIFEST.md (nothing is deleted)
```

## Layers and what may import what

`lib/engine` is the calculation core and imports nothing above it. `server/` and
`bridge-excel-generator/` consume the engine. `client/` consumes the API, never
the engine. A cross-boundary import is a build failure unless it is declared in
[containment/CONTRACT.md](containment/CONTRACT.md).

| From | May reach | Via |
| --- | --- | --- |
| `lib/engine/src` | nothing in `server/`, `client/`, `bridge-excel-generator/` | — |
| `server/` | `lib/engine`, `lib/db`, `lib/api-zod`, `shared/` | direct import |
| `client/src` | the HTTP API only | `/api` requests |
| `bridge-excel-generator/` | `lib/engine`, `shared/` | direct import |
| `scripts/` | everything, read-only | direct import |

## The engine boundary

[lib/engine/src/contracts.ts](lib/engine/src/contracts.ts) is tier 1: VERIFIED.
Changing it is a contract change, not a refactor, and the change is recorded
before the code moves. Every numerical output that reaches a deliverable is
traceable back through it to a source cell.

## Verification

Numbers are checked against `corpus/oracle/GOLDEN-ORACLE.json`, never against a
previous run of the same code:

- `pnpm run verify:golden` — engine output against the oracle
- `pnpm run verify:parity` — HTML and PDF report paths agree
- `pnpm run gate:oracle` — the oracle is well-formed and complete

A gate is only real once it has been observed RED; see
[scripts/gates/_lib.ts](scripts/gates/_lib.ts) and
`pnpm run gate:prove -- <gate>`.

## Blast radius

Every artefact carries a trust tier, declared in
[containment/ARTIFACT-TIERS.json](containment/ARTIFACT-TIERS.json): T0 external
source, T1 authoritative, T2 derived, T3 deliverable, T4 narrative. A number may
only move *up* that list with evidence. `gate:tiers` fails if an artefact has no
declared tier, or if a gate reads tier-4 narrative as if it were truth.

## Known structural gaps

Recorded rather than smoothed over:

- `scripts/gates/*.mjs` are NOT-IMPLEMENTED stubs kept beside the real `.ts`
  gates; their retirement is a W00 decision.
- `docs/phase-2/week-01` … `week-12A` are the unverified Set-1 corpus, exempted
  from preflight by `containment/PENDING-RESOLUTIONS.json`.
- `docs/week1/` and `docs/week3/` duplicate `docs/week-1/` and `docs/week-3/`;
  `docs/week-N/` is canonical, the others are pending archive.
- `eslint.config.js` and `drizzle.config.ts` exist but the packages they name are
  not installed; both are listed in [.deps-plan.json](.deps-plan.json).
