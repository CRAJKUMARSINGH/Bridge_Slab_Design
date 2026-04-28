# Milestone W15 — Verification hardening & programme handoff

**Week:** 15 of 15  
**Instruction note:** §6 full formula report; §8 completion; §9 dump-and-diff before “complete”; §11 post-build review gate.

## Purpose

Expand automated checks to **multiple reference workbooks**, stabilize **CI** (optional), produce **client handoff pack**: matrix, formula report, known gaps, rerun instructions.

## Entry criteria

- Core generator work complete to agreed v1 scope (weeks W05–W14 outcomes).

## Tasks

- [x] Add or extend scripts under `scripts/verify-*.ts` for **second and third** golden workbooks (afflux + hydraulics + estimation minimum). — **2026-04-12:** third fixture `MINIMAL_CHANNEL_PROJECT_INPUT` in `scripts/verify-kherwara-excel-golden.ts` (full W05–W13 golden block).
- [x] Document **known gaps** vs “identical to reference” (honest list). — [`docs/KNOWN-GAPS-v1.md`](../KNOWN-GAPS-v1.md)
- [x] Run `npm run phase-zero:full` on frozen reference set; archive manifest with **release tag**. — Path recorded in `STATUS.md`: `archive/phase-zero-extract-full/manifest.json` (release tag at maintainer discretion).
- [x] Optional: GitHub Actions / CI job running `npm run qa` on push. — [`.github/workflows/qa.yml`](../../.github/workflows/qa.yml)
- [ ] Update `docs/milestones/README.md` if 12-week compression was used. — **N/A** (programme tracked as full 15-week in STATUS).
- [ ] Prepare **single** consolidated suggestions doc per §11 **only after** client confirms v1 — store separately from this milestone folder.

## Deliverables

| Artifact | Note |
|----------|------|
| `RELEASE-NOTES-v1.md` | Root — version, scope, verify commands |
| Frozen Phase Zero manifest | `archive/phase-zero-extract-full/manifest.json` — date in `STATUS.md` |
| Client handoff zip checklist | [`CLIENT-HANDOFF-v1-CHECKLIST.md`](./CLIENT-HANDOFF-v1-CHECKLIST.md) |

## Verification

```bash
npm run qa
npm run phase-zero:full
```

## Exit criteria

- `npm run qa` green on **main**.
- Handoff pack **reviewed** internally; **STATUS.md** shows **programme complete** or **v1 complete / v2 backlog**.

## Handoff / discontinuity

**Programme end:** Archive this `docs/milestones/` folder with release tag. **Resume for v2:** Duplicate `STATUS.md` to new programme folder; do not delete W01–W15 history.

---

## Post-programme (§11)

No feature suggestions mixed into v1 closure. After client sign-off, maintain **one** suggestions document for prioritised enhancements.
