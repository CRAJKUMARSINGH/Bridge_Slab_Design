# Milestone W03 — Word documents: prose, tokens, instruction-note 3b

**Week:** 3 of 15  
**Instruction note:** 3b, 5a/5b prose, 7 Word integration.

## Purpose

Map **verbatim paragraphs** from Word into Excel cells; mark **`{{variableName}}`** using instruction-note 4 canonical names; capture **necessity** and other free text for Tech Report Item 3.

## Entry criteria

- W02 complete for priority workbooks.
- Phase Zero `extracted.txt` exists for relevant `.doc` / `.docx` (or manual extract for failed files).

## Tasks

- [x] For each supplementary Word doc tied to a priority bridge: list paragraphs that appear in **TechNote** / **Tech Report** / other sheets.
- [x] Mark static vs dynamic segments; propose **canonical** token names (instruction-note 4).
- [x] Extract **IRC clause** and **drawing refs** (D-01, etc.); verify same strings appear in reference Excel.
- [x] Document **assumptions** that vary across workbooks (temperature, shrinkage, braking %) → must become `ProjectInput` fields.
- [x] Resolve unreadable `.doc` (re-save as `.docx` or alternate extract) if needed for sign-off — **TRUSS** file documented as blocked pending conversion (see report).

## Deliverables

| Artifact | Note |
|----------|------|
| Word extraction report | [`artifacts/W03-word-extraction-report.md`](./artifacts/W03-word-extraction-report.md) — instruction-note 8 item 2 draft |
| `designNotes` / `necessityNarrative` draft | [`artifacts/w03-schema-hooks.md`](./artifacts/w03-schema-hooks.md) |

## Verification

- At least **one** Word ↔ Excel paragraph traced row-by-row for **BEDACH** (or chosen primary).

## Exit criteria

- Word extraction report **approved internally** (or submitted to client per instruction-note 8) — **draft complete 2026-04-12**; formal sign-off pending.

## Handoff / discontinuity

**If stopped:** Attach **file list** of Word docs “done vs pending” in `STATUS.md`; paste token table fragment so prose work is not lost.
