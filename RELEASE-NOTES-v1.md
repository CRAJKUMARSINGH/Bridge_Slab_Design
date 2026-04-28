# Release notes — v1.0.0 (programme closure)

**Date:** 2026-04-12  
**Scope:** Submersible bridge design workbook generator (Excel export, server API, client UI) per the binding instruction note and weekly milestones W01–W15.

## Verification (local / CI)

| Command | Purpose |
|---------|---------|
| `npm run check` | TypeScript compile |
| `npm run verify:engine` | Hydraulics / design-engine regression |
| `npm run verify:excel` | Golden Excel: Kherwara, Larathi, MinimalChannel (afflux, hydraulics, estimation, W07–W13 smoke) |
| `npm run test:excel` | Excel generator smoke |
| `npm run qa` | All of the above |

**Phase Zero (reference dump):** `npm run phase-zero:full` → `archive/phase-zero-extract-full/manifest.json` (frozen manifest path; last run recorded in `docs/milestones/STATUS.md`).

## Documentation

- Operator commands: [`docs/OPERATOR_NOTE.md`](docs/OPERATOR_NOTE.md)  
- Known gaps vs “identical to reference”: [`docs/KNOWN-GAPS-v1.md`](docs/KNOWN-GAPS-v1.md)  
- Programme status: [`docs/milestones/STATUS.md`](docs/milestones/STATUS.md)  
- Client zip checklist: [`docs/milestones/CLIENT-HANDOFF-v1-CHECKLIST.md`](docs/milestones/CLIENT-HANDOFF-v1-CHECKLIST.md)

## Phase Zero caveat

One legacy Word file failed extraction in the full run; see manifest and per-file `ERROR.txt` under `archive/phase-zero-extract-full/`.
