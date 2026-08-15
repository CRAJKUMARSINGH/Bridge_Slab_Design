# Bridge Report Studio

Bridge Report Studio is a report-first bridge slab design pipeline. It accepts the
controlled Week 0 input contract recovered from the attached evidence, runs one
traceable calculation core, keeps failed checks visible, and produces a printable
narrative HTML report.

This is a **prototype/review build**. It is not an approved structural design
tool, and all generated reports are marked `DRAFT` until a licensed engineer
records review status.

## Quick start

```bash
pnpm install
pnpm run verify:golden
pnpm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.html
```

Open the generated HTML in a browser and use the browser print dialog to save a
PDF. The report uses landscape print CSS, narrative chapters, a constraint
register, and a calculation trace.

## API

```bash
pnpm --filter @workspace/api-server run dev
```

- `GET /api/design/contract`
- `POST /api/design/calculate`
- `POST /api/design/report/html`

The API and CLI call the same `@workspace/engine` calculation core.

## Canonical Reference Workbooks & Audit Findings

The design pipeline is benchmarked against two canonical Excel reference workbooks:

1. **Calculations & Stability Source:**
   - **File:** `Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls`
   - **Role:** Primary engineering reference for hydraulics ($Q$, HFL, bed slope, afflux), pier stability, abutment footing design, live load accumulation (75T / Class A / Class 70R), buoyancy, and current forces.

2. **Master 46-Sheet Structure Source:**
   - **File:** `REMOTE_APP/attached_assets/FINAL_RESULT.xls` (and `attached_assets/for replit FINAL_RESULT_1763885256922.xls`)
   - **Role:** Authoritative 46-sheet layout template that defines the complete structural report contract implemented in `bridge-excel-generator/sheets/` (`INDEX`, `HYDRAULICS`, `STABILITY CHECK FOR PIER`, `TYPE1-STABILITY CHECK ABUTMENT`, `Bridge measurements`, `Abstract`, etc.).

## Evidence and limitations

- `inputs/` is the source-of-truth prototype contract and provenance map.
- `tests/golden/kherwara/expected.json` freezes the attached Week 0 demo values.
- `pnpm run verify:golden` proves that a tampered input changes the result and validates formula parity against the canonical workbooks.
- The Kherwara/Kharka seed calculations are mapped line-by-line to `Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls` and the 46-sheet `FINAL_RESULT.xls` contract.

See `docs/implementation-reality-check.md`, `project/`, and `creat.md` for the current evidence-led status.