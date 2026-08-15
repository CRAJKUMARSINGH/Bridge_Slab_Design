# Bridge Report Studio

A report-first bridge slab design pipeline that turns a controlled input set into traceable calculation results and a draft narrative HTML report.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.html` — generate a report
- `pnpm run verify:golden` — run the KHERWARA demo parity and tamper checks
- `pnpm run assimilate` — inventory supported uploaded Office assets without modifying them
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- The calculation/report path does not require a database.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `inputs/` — versioned input, variable, coefficient, constraint, and trace registries
- `lib/engine/` — single pure calculation core
- `lib/narrative/` — deterministic narrative chapters
- `lib/report/` — printable landscape HTML report renderer
- `scripts/src/` — design, golden, tamper, and metadata-only assimilation commands
- `tests/golden/kherwara/` — frozen Week 0 demo expectations
- `artifacts/api-server/` — API routes for contract, calculation, and report HTML
- `docs/` and `project/` — baseline, canonical-project, and assimilation decisions

## Architecture decisions

- The attached Week 0 demo formula sequence is the parity authority for this first slice.
- Excel is treated as a reference/parity harness; the user-facing calculation path is pure TypeScript.
- `Factors!B2` is explicitly retained as zero because it is blank in the attached demo workbook.
- Failed constraints remain visible; the demo is expected to fail the deflection check.
- All outputs remain `DRAFT` pending licensed-engineer review.

## Product

The current prototype accepts the attached Week 0 bridge slab contract, returns intermediates and source-cell trace records, and renders a narrative HTML report with visible constraint status. It is not an approved structural design tool.

## User preferences

- Use only the attached plans and archived source evidence for formula or scope changes.
- Do not mark Kherwara/Kharka as one approved canonical project until the workbook/report/drawing identity is confirmed.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm run verify:golden` before expanding the calculation surface.
- Treat missing Office assets and unresolved project identity as explicit review blockers, not silent fallbacks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
