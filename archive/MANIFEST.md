# archive/MANIFEST.md

Nothing in this repository is deleted. When an artefact is retired it moves under
`archive/` and gains one row here. The row is the only evidence that the thing
existed, so it is written before the file moves, not after.

## Row schema

| Column | Meaning |
| --- | --- |
| `path` | the path the artefact had **before** it was archived |
| `archivedAs` | the path it has now |
| `replacedBy` | the artefact that took over its job, or `none` |
| `reason` | why it was retired, in one sentence |
| `week` | the week that retired it |
| `sha256` | hash of the content as archived |
| `verified` | `yes` once a gate or verifier has been run against the replacement |

A row with `replacedBy: none` and no `reason` is a deletion wearing a costume.

## Rows

| path | archivedAs | replacedBy | reason | week | sha256 | verified |
| --- | --- | --- | --- | --- | --- | --- |
| `api/index.ts` | `archive/api/index.ts` | `server/` | pre-Express-split entry point | pre-W00 | TBD | no |
| `client/src/**` | `archive/client/src/**` | `client/src/**` (current) | pre-Vite-split UI tree | pre-W00 | TBD | no |
| `archive/test-outputs/**` | (in place) | `test-output/**` | QA logs kept for provenance, not regenerated | pre-W00 | TBD | no |
| `archive/test-outputs/qa-251/**` | (in place) | — | 251-user stress artefacts, retained as evidence of a run | pre-W00 | TBD | no |
| `origin-weekly-plan.md` | `archive/20261023-w00-closeout/origin-weekly-plan.md` | `creat.md` | superseded plan; CANONICAL.md declares creat.md as authority | W00 | 9eed496ec67654683e18b15bbbe63b150ad98b3ede4d7545298675f7898275ac | no |
| `docs/plan-b/15-week-implementation-plan.md` | `archive/20261023-w00-closeout/15-week-implementation-plan.md` | `creat.md` | superseded alternative schedule; H-16 | W00 | 2ec9f5d69d4750888aa37b05497591c1a97f3a35cddb3e2f741da9398759ab00 | no |
| `docs/week1/**` | `archive/20261023-w00-closeout/docs-week1/**` | `docs/week-1/**` | duplicated week-folder spelling (H-15); docs/week1/README.md sha256: 441488db | W00 | (dir) | no |
| `docs/week3/**` | `archive/20261023-w00-closeout/docs-week3/**` | `docs/week-3/**` | duplicated week-folder spelling (H-15); docs/week3/README.md sha256: 33cd1e92 | W00 | (dir) | no |
| `CODE-JUNCTION/Slab.txt` | `archive/20261101-code-junction-retirement/Slab.txt` | `creat.md` §8 | raw QA prompt dump; actioned 2026-10-29 | W00 (moved 2026-11-01) | 0d169617d9b887f7b771fc6c13df4147142c58b7f032991e406d0aec8b03bcab | no |
| `CODE-JUNCTION/Slab2.txt` | `archive/20261101-code-junction-retirement/Slab2.txt` | `CODE-JUNCTION/Slab.txt` | byte-identical duplicate of `Slab.txt` (same sha256) | W00 (moved 2026-11-01) | 0d169617d9b887f7b771fc6c13df4147142c58b7f032991e406d0aec8b03bcab | no |
| `CODE-JUNCTION/Slab replit chat.txt` | `archive/20261101-code-junction-retirement/Slab replit chat.txt` | `creat.md` §8 | transcript; its findings actioned 2026-10-29 | W00 (moved 2026-11-01) | 6f909b7ab9eaddaa1f0f3235ba9afe82a91200a7a02c81409e766a9039c21880 | no |
| `CODE-JUNCTION/VENICE IS GURU.txt` | `archive/20261101-code-junction-retirement/VENICE IS GURU.txt` | `README.md` §Standing instructions | standing-instruction dump; its rules were added to README | W00 (moved 2026-11-01) | 0db6499864b5fd7e9121ae7ff806217767a6416369e7c4d9eb512f43121f27d8 | no |
| `CODE-JUNCTION/00 FOR ALL APPS/000 master tester venice.md` | `archive/20261101-code-junction-retirement/000 master tester venice.md` | `README.md` §Standing instructions | standing instruction set extracted into README and applied | W00 (moved 2026-11-01) | 5de5b0721bbbf0b8dc597ee2ebf09ca65501205c9b6944780264acee692ae661 | no |
| `CODE-JUNCTION/00 FOR ALL APPS/SARASWATI.jpg` | `archive/20261101-code-junction-retirement/SARASWATI.jpg` | `client/src/assets/saraswati.jpg` | mascot image already shipped and imported by the live component | W02A (moved 2026-11-01) | 0ba4fe02de7326bd59256a068c98060bdedd8e25531b17405baab44a66166a87 | no |
| `CODE-JUNCTION/00 FOR ALL APPS/SARASWATI.test.tsx` | `archive/20261101-code-junction-retirement/SARASWATI.test.tsx` | `client/src/components/__tests__/SaraswatiMascot.test.tsx` | source test already ported; broken import path dropped | W02A (moved 2026-11-01) | f8c3eca4f33cd35762ff8a76b3b40b8a8f82ea563ed2cd971238474e79067a0b | no |
| `CODE-JUNCTION/Bridge_Slab_Design_fixed.zip` | `archive/20261101-code-junction-retirement/Bridge_Slab_Design_fixed.zip` | the live working tree (this repo) | 5.4 MB LFS snapshot bundle of the repo; no file references it, the repo itself is the source of truth | W02A (moved 2026-11-01) | 3613aec79bda5b632bf4927cfd4acbc0af6c96de54fd334ca714580a50ccee35 | no |
| `CODE-JUNCTION/Bridge_Slab_Design.txt` | `archive/20261101-code-junction-retirement/Bridge_Slab_Design.txt` | `creat.md` §8 | repo-source text dump; not referenced by any live artefact | moved 2026-11-01 | dc7b9a1205772f126f593937764babab74a04ca5643e25c7d8d2c704d113cad3 | no |
| `CODE-JUNCTION/Bridge_Slab_Design1.txt` | `archive/20261101-code-junction-retirement/Bridge_Slab_Design1.txt` | `CODE-JUNCTION/Bridge_Slab_Design.txt` | earlier revision of the same dump | moved 2026-11-01 | 5760bdb5fd7884bf7da204f9357ecd5659621e16c75d4585fcec62b9563e550a | no |
| `AUGUST ACTION PLAN.md` | `archive/20261101-superseded-plans/AUGUST ACTION PLAN.md` | `creat.md` | superseded sprint plan; all sprints are DONE or owner-decisions | moved 2026-11-01 | 3718e80949de1bb9c1a6de0eb620d8f03de3a28d95932f49a32f1baec00d78ca | no |
| `creat1.md` | `archive/20261101-superseded-plans/creat1.md` | `creat.md` | superseded early chatlog; `creat.md` is canonical | moved 2026-11-01 | 5b0fdbcc9a2939e1336fdc810b2b2327e7ec076490487d97ef6e1f0eec9d9c12 | no |

Rows marked `pre-W00` record artefacts that were already under `archive/` when
the Phase-2 foundation week started. `sha256` is `TBD` for those because they were
archived before the manifest existed and the hash is written when the row is
next touched, not invented now.

## Pending retirements (not yet moved)

These are declared so the move is a scheduled action rather than a surprise. Each
row is a file whose instructions have been applied and which is now superseded by
the artefact named in `replacedBy`. Per the archive-never-delete rule the move
itself is a `git mv` into `archive/<date>-<reason>/`.

Owner decision 2026-10-30: **hold the move until all open weeks close** (W00
close-out), so nothing is moved while an agent may still read the source.
**Owner decision 2026-11-01 supersedes it for a bounded scope:** the
`CODE-JUNCTION/` set and the superseded plan documents were moved now (rows above,
`week` = `moved 2026-11-01`); the remaining rows below are still **held**. The
folder `CODE-JUNCTION/` is retained as an empty directory (`.gitkeep`), never
deleted.

| path | replacedBy | reason | week |
| --- | --- | --- | --- |
| `scripts/gates/*.mjs` | `scripts/gates/*.ts` | NOT-IMPLEMENTED stubs kept beside the real gates | W00 |
| `Get_Code_Sudited_Grok.md` | `AUDIT-REPORT-v1.0.md` | external audit prompt; its requested output now exists | W00 |
| `MASTER-APP-TESTER.md` | `creat.md` §8 | app-testing prompt; its checks were applied 2026-10-29 | W00 |
| `ACTION-PLAN.md` | `creat.md` | link-all + bug-removal sweep fully closed (A1–E5 ✅) | W00 |
| `.q1.txt` | `evidence/assimilation-coverage.md` | failed-run log (`ASSIM_EXIT=1`); superseded by the evidence bundle | W00 |
| `excel_workbook_audit_report.md` | `scripts/audit_excel_workbooks.ts` | generated report with no rows; regenerable at will | W00 |

### Held at root deliberately (not retired)

- `august-due.md` — the historical defect register. It is cited by ~15 live
  artefacts, including the sha256-pinned engine modules
  `bridge-excel-generator/design-engine.ts`, `bridge-excel-generator/types.ts` and
  `client/src/report-engine/lib/ircSlabCalc.ts` (per `foundation/engine.lock.json`)
  and by `.github/workflows/ci.yml`. Moving it would force an engine re-lock under
  ADR-0013 for no benefit, so it stays at root.

Items previously in this table (`origin-weekly-plan.md`, `docs/plan-b/15-week-implementation-plan.md`,
`docs/week1/**`, `docs/week3/**`) were moved to archive on 2026-10-23 as part of T00.25.
