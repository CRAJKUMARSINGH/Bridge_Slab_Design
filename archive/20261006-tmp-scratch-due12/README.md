# Scratch logs — DUE-12 release-candidate sweep (2026-10-06)

Working transcripts from the batch that closed DUE-12 (§T of `august-due.md`) and
the A3 classifier port (§V). They were written to the repo root as `tmp-due12-*.log`
during the runs and moved here so the root stays clean. Kept, not deleted, because
§T-11/§T-12 cite their timings and exit codes.

| File | Command | Result |
|---|---|---|
| `tmp-due12-check.log` | `pnpm run check` (typecheck lanes + narrative lint) | exit 0 — 158 prose spans, no hard-coded numbers |
| `tmp-due12-deliver.log` | `pnpm run deliverables` | exit 0 — 6 deliverables written to `test-output/` |
| `tmp-due12-verify.log` | `pnpm run verify` (nine gates) | exit 0 — presentation policy proven on artefacts |
| `tmp-due12-pipeline.log` | `pnpm run pipeline` (inputs → workbook/PDF/HTML) | exit 0 — full engine run, the bulk of the file is engine stdout |
| `tmp-due12-test2.log` | `pnpm run test` (13-file integration lane) | exit 0 — `Integration lane: 13/13 files passed.` |
| `tmp-due12-candidate.log` | `pnpm run candidate` — **before** the harness fix | exit 1: `test` failed while its 5 tests passed standalone; "Refusing to bundle" — proof the §T-1 gate will not bundle a red chain |
| `tmp-due12-candidate2.log` | `pnpm run candidate` — **after** `--test-isolation=none` | exit 0 — 6 deliverables + gate transcripts, commit `63a0a0dbde0c` |

The two `candidate` logs are the pair that documents the Node test-runner
serialization bug: the red run is the evidence, the green run is the fix.
The canonical copies of the green transcripts live in
`evidence/release-candidate/gates/`; these are the raw redirects.
