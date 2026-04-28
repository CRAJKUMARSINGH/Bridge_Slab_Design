# Milestone W12 — TechNote & Tech Report (instruction 5a / 5b)

**Week:** 12 of 15  
**Instruction note:** Section **5a** (merged prose grid); **5b** (report layout); narrative inputs (`issuingAuthority`, `jobNumber`, grades split, `hardRockAvailable`, etc.).

## Purpose

Rebuild or refine **`TechNote`** and **`Tech Report`** generators to match **section order**, **merge ranges**, and **inline dynamic values** per spec — not generic summaries.

## Entry criteria

- W03 Word/token work available.
- W02 matrix supplies project identity and material grades per bridge.

## Tasks

- [x] Measure reference Excel **row/column merges** for TechNote/Tech Report (Phase Zero does not export merge geometry for Word — use workbook or ExcelJS read pass if needed). → **W12-GAP-001** — merge map deferred; generator uses A:I merged blocks.
- [x] Implement instruction **5a** sections 1–13 in order; conditional **foundation** prose (hard rock).
- [x] Implement instruction **5b** items 1–7; spec items (a)–(k).
- [x] Extend `ProjectInput` + `server/project-input-zod.ts` + `schemas/project-input.schema.json` together.

## Deliverables

| Artifact | Note |
|----------|------|
| Trace + gaps | [`artifacts/W12-technote-techreport.md`](./artifacts/W12-technote-techreport.md) |
| Schema diff | New optional fields in `project-input.schema.json` / zod |

## Verification

```bash
npm run qa
```

## Exit criteria

- TechNote/Tech Report **structurally** match instruction **5** (merges may need client visual sign-off). → **13** TechNote sections, **7** report parts + **(a)–(k)**; **hardRockAvailable** branches verified in `verify:excel`.

## Handoff / discontinuity

**If stopped:** Save **reference row numbers** for each **5a** heading — prose merge layout is easy to lose in memory.

**Closed 2026-04-12:** `29-31-technote-techreport.ts` + golden checks; `npm run qa` green.
