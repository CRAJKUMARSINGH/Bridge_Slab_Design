# Milestone W01 — Foundation: extracts, matrix boot, QA baseline

**Programme:** Artemis-III (bridge workbook generator)  
**Week:** 1 of 15  
**Instruction note:** [`Attached_Assets/instructions.md`](../../Attached_Assets/instructions.md) — §2 seed order, §3 assessment, §10 references.

## Purpose

Establish **machine-readable reference corpus** and a **living assessment record** so no design decision depends on opening Excel manually. Lock **regression baseline** for the existing codebase.

## Entry criteria

- Repository clone with `npm install` successful.
- `Attached_Assets/` contains reference workbooks and Word files (as supplied by client).

## Tasks

- [x] Run `npm run qa` — record pass/fail and date in `STATUS.md`.
- [x] Run `npm run phase-zero` (capped) and/or `npm run phase-zero:full` — confirm `archive/phase-zero-extract*/manifest.json` lists expected files; note any FAIL rows.
- [x] Copy or open [`Attached_Assets/workbook-assessment-matrix-template.csv`](../../Attached_Assets/workbook-assessment-matrix-template.csv); create working copy (e.g. `docs/milestones/assessment-matrix-WIP.csv` or client-approved path).
- [x] Complete **at least 2** §3a rows (e.g. BEDACH `.xlsx`, LARATHI SOM `.xls`) as proof of process.
- [x] Read `docs/INSTRUCTIONS_ALIGNMENT.md` and confirm team agrees: **one bridge per run**, **many files for variation study** — see `STATUS.md` discontinuity note (2026-04-12).
- [x] List known extract failures (e.g. unreadable `.doc`) in `STATUS.md` or week handoff.

## Deliverables / artifacts

| Artifact | Location / note |
|----------|------------------|
| Phase Zero manifest | `archive/phase-zero-extract-full/manifest.json` (or capped sibling) |
| Matrix WIP | First rows populated (path agreed by team) |
| QA log | `STATUS.md` updated |

## Verification

```bash
npm run qa
npm run phase-zero:full
```

## Exit criteria

- `npm run qa` **green**.
- Phase Zero run completes with **manifest**; failures **documented**.
- Assessment matrix **started** with ≥2 reference workbooks.

## Handoff / discontinuity

**If stopping after W01:** Next owner runs `npm run qa`, opens `manifest.json`, continues matrix rows for remaining workbooks, and does not change generators until W02+ scope is agreed.
