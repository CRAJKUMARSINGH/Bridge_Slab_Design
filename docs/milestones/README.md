# Artemis-III — milestone record (12–15 week programme)

This folder is the **authoritative week-by-week record** for the submersible bridge workbook application (`Attached_Assets/instructions.md` as normative objective). Use it when work **pauses, resumes, or changes owner** so nothing relies on chat memory alone.

## How to use

1. **Start or resume:** Open the current week file (e.g. `W07-*.md` or `W16-*.md`), complete **Entry state**, execute **Tasks**, satisfy **Exit criteria**, note **Artifacts**.
2. **Discontinuity (stop mid-programme):** In the active week file, fill **Handoff block** at the bottom; update `STATUS.md` (root of this folder).
3. **Normative spec:** [`../INSTRUCTIONS_ALIGNMENT.md`](../INSTRUCTIONS_ALIGNMENT.md) → [`../../Attached_Assets/instructions.md`](../../Attached_Assets/instructions.md).
4. **Ground truth for binaries:** [`../PHASE_ZERO_READ_PIPELINE.md`](../PHASE_ZERO_READ_PIPELINE.md) — `npm run phase-zero` / `npm run phase-zero:full`.
5. **Regression gate:** `npm run qa` before treating a week as closed.

## Deep-dive narrative (~10k words/week target)

Expanded per-week specs (core prose + **outline to expand** with paste-in appendices): [`deep/README.md`](./deep/README.md).  
Reusable **common appendix** block for any week: [`deep/_PROGRAMME-COMMON-APPENDIX.md`](./deep/_PROGRAMME-COMMON-APPENDIX.md).

**Note:** ~10,000 × 15 ≈ **150,000 words** (book-length). Each `deep/WNN.md` ships with **substantive narrative** plus appendices to fill from Phase Zero dumps, matrix CSV, meeting notes, and ADRs until the target word count is reached for client archival.

## Milestone index

| Week | Control card | Deep spec | Theme |
|------|--------------|-----------|--------|
| 01 | [W01…](./W01-foundation-extracts-and-matrix.md) | [deep/W01.md](./deep/W01.md) | Extracts, matrix boot, QA |
| 02 | [W02…](./W02-assessment-matrix-primary-refs.md) | [deep/W02.md](./deep/W02.md) | §3a priority matrix |
| 03 | [W03…](./W03-word-prose-and-template-tokens.md) | [deep/W03.md](./deep/W03.md) | §3b Word ↔ Excel |
| 04 | [W04…](./W04-formula-registry-manning-lacey.md) | [deep/W04.md](./deep/W04.md) | Manning & Lacey |
| 05 | [W05…](./W05-afflux-molesworth-cross-books.md) | [deep/W05.md](./deep/W05.md) | Afflux seed |
| 06 | [W06…](./W06-hydraulics-sheet-parity.md) | [deep/W06.md](./deep/W06.md) | HYDRAULICS |
| 07 | [W07…](./W07-pier-stability-and-lload.md) | [deep/W07.md](./deep/W07.md) | Pier, LLOAD, loadsumm |
| 08 | [W08…](./W08-type1-abutment-stability-footing.md) | [deep/W08.md](./deep/W08.md) | TYPE1 stability/footing |
| 09 | [W09…](./W09-type1-cap-dirt-return-steel.md) | [deep/W09.md](./deep/W09.md) | TYPE1 cap/dirt/steel |
| 10 | [W10…](./W10-c1-abutment-block.md) | [deep/W10.md](./deep/W10.md) | C1 block |
| 11 | [W11…](./W11-estimation-measurements-abstract-boq.md) | [deep/W11.md](./deep/W11.md) | Estimation chain |
| 12 | [W12…](./W12-technote-techreport-section-5.md) | [deep/W12.md](./deep/W12.md) | §5a / §5b |
| 13 | [W13…](./W13-sketches-placeholders-abstract-stresses.md) | [deep/W13.md](./deep/W13.md) | §5i / §5f |
| 14 | [W14…](./W14-api-ui-schema-sync-export.md) | [deep/W14.md](./deep/W14.md) | API, UI, schema |
| 15 | [W15…](./W15-verify-hardening-handoff.md) | [deep/W15.md](./deep/W15.md) | Verify, handoff |
| 16 | [W16…](./W16-post-v1-loadsumm-and-backlog.md) | [deep/W16.md](./deep/W16.md) | Post-v1: loadsumm ↔ LLOAD, v2 boot |

**Compressed 12-week path:** Merge W13 into W12 or W14; merge W14 into W15; skip optional polish weeks only if client accepts reduced scope (document in `STATUS.md`).

## Status log

Edit **`STATUS.md`** in this folder for: current week, blockers, last `npm run qa` date, assigned engineer, link to last PR.
