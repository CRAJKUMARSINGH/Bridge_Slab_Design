# Milestone W13 — Sketches (instruction 5i), abstract of pressures (instruction 5f)

**Week:** 13 of 15  
**Instruction note:** Section **5i** Phase 1 **placeholder** tab names and text; section **5f** abstract of base pressures (MAX/MIN, `sbc` check).

## Purpose

Ensure **sketch** sheets meet **Phase 1** spec; align **abstract of stresses** / base pressures sheet with **5–9 load cases** and Excel **MAX/MIN** logic where required.

## Entry criteria

- Pier/abutment stability outputs available for pressure aggregation.

## Tasks

- [x] Verify tab names: **AbutMENT Drawing**, **Footing STRESS DIAGRAM**, **Abut Footing STRESS** / **DIAGRAM** (exact spelling per generator — see artifact table).
- [x] Placeholder merged cell text: *Drawing to be inserted manually — ref Drawing D-01 / D-03 / D-05* (instruction **5i**).
- [x] JSONL vs `10-abstract-of-stresses.ts` — formula vs **5f** (generator-anchored audit; **W13-GAP-001**).
- [x] **Do not** start Phase 2 graphics unless client instructs (instruction note **5i**).

## Deliverables

| Artifact | Note |
|----------|------|
| Sketch + pressures audit | [`artifacts/W13-sketches-abstract-pressures.md`](./artifacts/W13-sketches-abstract-pressures.md) |
| Sketch placeholder sign-off | Client OK for Phase 1 — **pending** (artifact documents Phase 1 only) |

## Verification

```bash
npm run qa
```

## Exit criteria

- Placeholders **live**; pressures sheet **matches** reference logic or gap documented. → **5** pier load cases from engine; **=MAX** / **=MIN** / **SBC** column; gaps in artifact.

## Handoff / discontinuity

**If stopped:** Distinguish **Phase 1 vs 2** explicitly in `STATUS.md` so no one imports images prematurely.

**Closed 2026-04-12:** `sketch-placeholders.ts`, sheet updates, `verifyW13SketchesAndAbstract`, `npm run qa` green. **Phase 2** (embedded drawings) **not** started.
