# Milestone W14 — API, UI, schema sync, export

**Week:** 14 of 15  
**Instruction note:** Section **9** JSDoc on new fields; variable audit CSV regeneration.

## Purpose

Keep **`POST /api/design/calculate`**, **`GET /api/design/schema`**, **Zod**, **React forms**, and **Excel export** aligned with extended `ProjectInput` from W12+.

## Entry criteria

- Schema changes from prior weeks collected in one branch or checklist.

## Tasks

- [x] Merge all new `ProjectInput` fields into `server/project-input-zod.ts` and `schemas/project-input.schema.json`.
- [x] Update `server/default-project-inputs.ts` defaults.
- [x] UI: `client/` forms — show new fields where user-editable; hide computed-only.
- [x] Excel export button path — verify buffer download works end-to-end.
- [x] Run `npm run audit:variables` if variable audit must reflect new sheet bindings.

## Deliverables

| Artifact | Note |
|----------|------|
| API changelog | [`artifacts/W14-api-ui-changelog.md`](./artifacts/W14-api-ui-changelog.md) |
| Updated `variable-audit-matrix.csv` | Regenerated (`npm run audit:variables`); includes W12+ keys + `29-31-technote-techreport.ts` scan |

## Verification

```bash
npm run check
npm run qa
npm run audit:variables
```

## Exit criteria

- **No** 400s on default template payloads; schema **documents** new keys.

## Handoff / discontinuity

**If stopped:** List **pending API keys** not yet in UI — prevents silent drift.

**Closed 2026-04-12:** Design **§9** + optional grades `<details>`; defaults for `issuingAuthority` / `jobNumber` / `hardRockAvailable`; Zod JSDoc lines; schema description; audit matrix refreshed. **Pending UI keys:** none for W12+ optional inputs.
