# Client handoff pack — v1 checklist (zip / folder)

Use this when assembling the **handoff bundle** (cloud folder or zip). Tick items when included.

## Core

- [ ] **`RELEASE-NOTES-v1.md`** (repository root)
- [ ] **`docs/KNOWN-GAPS-v1.md`** — honest gap index with links to weekly artifacts
- [ ] **`docs/milestones/STATUS.md`** — programme snapshot (date, last `npm run qa`, Phase Zero path)
- [ ] **`docs/OPERATOR_NOTE.md`** — how to run dev, tests, and golden checks
- [ ] **`docs/SHEET_DEPENDENCY_MAP.md`** — cross-sheet wiring (if maintained for this release)
- [ ] **Sample generated workbook** (`.xlsx`) — e.g. from app “full workbook” export or scripted `generateCompleteExcel` for a reference project

## Assessment / parity (optional but recommended)

- [ ] **`bridge-excel-generator/variable-audit-matrix.csv`** (or regenerated via `npm run audit:variables`)
- [ ] **`docs/milestones/artifacts/assessment-matrix-WIP.csv`** — W02 matrix (status per STATUS.md)
- [ ] **Phase Zero full output** — `archive/phase-zero-extract-full/manifest.json` + agreed subset of JSONL (large; confirm size with client)

## Reports already in-repo

- [ ] **`docs/milestones/artifacts/`** — W03–W14 markdown reports as referenced in `KNOWN-GAPS-v1.md`

## Not in default pack (unless requested)

- Full `node_modules`, full `archive/` history, or credentials — exclude unless explicitly agreed.

After internal review and client receipt, maintain **one** separate suggestions/backlog document per instruction note §11 — **not** bundled as “new scope” inside this checklist.
