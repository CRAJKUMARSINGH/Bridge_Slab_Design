# Scratch logs — DUE-16 engine-boundary batch (2026-10-06)

Transcripts written to the repo root while §W of `august-due.md` was being built,
moved here so the root stays clean. The files were named `tmp-due15-*` when they
were created; the batch was relabelled **DUE-16** mid-run because commit `aec5b42`
had already taken the DUE-15 label (rows 18a/18b). The filenames were updated, the
contents were not.

| File | Command | Result |
|---|---|---|
| `tmp-due16-test.log` | `pnpm run test` — the runner immediately after it became two lanes | exit 0 — `Integration lane: 13/13`, `Engine unit lane: 2/2`, `Test lanes: 15/15 in 2 lanes` |
| `tmp-due16-candidate.log` | `pnpm run candidate` — first four-chain run with the eleven-lane `verify` | **exit 1**: `check 0 · verify 0 (125.4 s) · test 1 · audit:policy 0`, "Refusing to bundle". This is the run that caught §W-8 — the optimiser's `deadlineMs: 0` guard produced one trial instead of zero, which passed on an idle machine and failed under load |
| `tmp-due16-candidate2.log` | `pnpm run candidate` — after the §W-8 fix | exit 0 — `check 0 in 50.4 s · verify 0 in 125.4 s · test 0 in 77.0 s · audit:policy 0 in 7.5 s`, 6 deliverables, commit `f6b92117556d` |
| `tmp-golden-hash.txt` | `sha256sum tests/golden/deliverable-engine/kherwara.json` | the digest used to prove the snapshot re-emits byte-for-byte (`sha256sum -c` passed after a mutate/restore cycle and a fresh `--emit`) |

The red/green pair is the evidence for §W-7 and §W-8: the gate that §T-1 built
refused to bundle a failing chain, and this time the failure was in the product
rather than in Node's test serialisation. Canonical transcripts of the green run
are in `evidence/release-candidate/gates/`.
