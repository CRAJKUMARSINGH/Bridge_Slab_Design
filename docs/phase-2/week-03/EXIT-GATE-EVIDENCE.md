# P2-W03 EXIT GATE EVIDENCE
Week: W03 — Clause coverage & source-defect validations | Agent: Devin | Verifier: Antigravity (pending) | Date: 2026-10-31
Baseline commit: `048eac075e33afe6dd550ad4d8db9783d2adebf4` | Branch: `foundation/set-one-hardening`
Final commit: worktree at the same HEAD (W03 artifacts are staged in the worktree; no W03 commit exists yet)

Week gate: `verify:clauses` (`package.json:33` → `node scripts/gates/verify-clauses.mjs`).

## Gate checklist (copied verbatim from the instruction file)
| # | Gate item | Result | Evidence (file:line or command) |
|---|---|---|---|
| 1 | Every cited clause has an implementing test | PASS | `GATE verify-clauses: PASS 42 assertions`; 9 registry entries each assert "implementing test … exists and names [ID]" (`.out/verify-clauses.json`, checks 10/14/18/22/26/30/34/38/42). Test file: `tests/integration/clause-coverage.test.ts`. |
| 2 | No orphan citations | PASS | Gate: `9 registered clauses, 22 citations in 22 files, 0 orphan(s)`. |
| 3 | verify:clauses green | PASS | `verify:clauses` exit 0; `GATE verify-clauses: PASS 42 assertions`. |
| 4 | D-02, D-06, D-07, D-11 validations implemented and tested | PASS | `lib/engine/src/validations/source-defects.ts`; tests `D-02` ×2, `D-06` ×2, `D-07` ×3, `D-11` ×2 in `tests/integration/source-defects.test.ts` — 31/31 lane green. |
| 5 | REVIEW status implemented and blocks REVIEWED transition | PASS | `statusForSeverity` maps WARN/REVIEW→`REVIEW`; `reviewTransition(checks, "REVIEWED")` blocks while any check is REVIEW. Tests: `D-12: a code basis predating the current IRC:6 edition is REVIEW`, `T3.11: a REVIEW check blocks the transition to REVIEWED`. |
| 6 | REALITY-AUDIT.md written with corrections | PASS | `docs/phase-2/week-03/REALITY-AUDIT.md` (27 claims adjudicated; 4 headline corrections APPLIED to `README.md`). |
| 7 | INPUT-DICTIONARY.md filled | PASS | `docs/phase-2/INPUT-DICTIONARY.md` (non-empty); `tests/integration/input-dictionary.test.ts` 4/4 asserts every documented field is a key in `ProjectInputSchema`. |

## Command log (raw, untrimmed)
### week gate — first RED (non-vacuity proof, comment-borne unregistered token)
Probe file `lib/engine/src/_vacuity-probe.ts` temporarily added containing the comment
`// Deliberately cites an unregistered clause: IS:9999 — no registry entry exists.`

```
$ node scripts/gates/verify-clauses.mjs; "EXIT=$LASTEXITCODE"
verify-clauses: 9 registered clauses, 23 citations in 23 files, 1 orphan(s)
  FAIL no orphan citation: every token under the scan root resolves to the registry: 1 orphan citation(s):
    lib/engine/src/_vacuity-probe.ts: "IS:9999" -> IS:9999 (unregistered)
GATE verify-clauses: FAIL 42 assertions
EXIT=1
```

Probe deleted, gate re-run:
```
$ node scripts/gates/verify-clauses.mjs; "EXIT=$LASTEXITCODE"
verify-clauses: 9 registered clauses, 22 citations in 22 files, 0 orphan(s)
GATE verify-clauses: PASS 42 assertions
EXIT=0
```

Note: an earlier probe that placed `IS:9999` inside a **string literal** left the gate GREEN —
the scanner blanks string contents before matching. This is recorded as residual item 4 in
`CLAUSE-COVERAGE.md` and is the reason the proof uses a comment.

### week gate — GREEN (final)
```
$ node scripts/gates/verify-clauses.mjs; "EXIT=$LASTEXITCODE"
verify-clauses: 9 registered clauses, 22 citations in 22 files, 0 orphan(s)
GATE verify-clauses: PASS 42 assertions
EXIT=0
```

### test lane (W03) — `node --test`
```
$ node --test tests/integration/clause-coverage.test.ts tests/integration/source-defects.test.ts tests/integration/input-dictionary.test.ts; "EXIT=$LASTEXITCODE"
... (MODULE_TYPELESS_PACKAGE_JSON warnings only; no failures) ...
ℹ tests 31
ℹ suites 0
ℹ pass 31
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 224.4835
EXIT=0
```
Per-file split: `clause-coverage` 12, `source-defects` 15, `input-dictionary` 4.

### not run — and why
- `npm run check` / `pnpm run build` / `gate:full`: `tsx` is absent and the `pnpm` shim is
  broken in this worktree (escape **E-008**, `GREEN_ONLY_IN_DIRTY_TREE`). Gates that shell out
  through `tsx` (`gate:readme`, `gate:docs`, `gate:index`, …) cannot be executed here.
- `verify:clauses` is a plain-Node `.mjs` gate and is therefore unaffected; it is the week gate
  and it runs.
- The behavioural Zod lane cannot be executed (`zod` is not resolvable under E-008), so
  `tests/integration/input-dictionary.test.ts` is deliberately static — it reads
  `INPUT-DICTIONARY.md` and the `ProjectInputSchema` key set rather than importing `zod`.

## Artifacts produced
| Path | sha256 | Bytes |
|---|---|---|
| `docs/phase-2/week-03/CLAUSE-COVERAGE.md` | `8ae0545d93020b7690066f1d009d98d940fa7377693658bfc90377b42e43ff45` | 5640 |
| `docs/phase-2/week-03/REALITY-AUDIT.md` | `acfee8d2031d6131c6fe48adb311faa00478c212d0fe118b7d18a9dbb9d2e40b` | 10454 |
| `docs/phase-2/ASSUMPTION-REGISTER.md` | `c38c5e591bb60571f37a8731485cf24026df2ff204fb618d5501721a6dc3006f` | 10481 |
| `docs/phase-2/INPUT-DICTIONARY.md` | `62bbd8b0648f0dde9d8c92f088a5664e6752a5d5975b46b981f0a72dc35dd8a7` | 11457 |
| `lib/engine/src/clause-registry.ts` | `c0f9c9551755765110e7f169d570177c09268f7d37212528a7b84478b558b5c0` | 8725 |
| `lib/engine/src/validations/source-defects.ts` | `8db6d9823224c5af3a97b5382b2939d635f60e009c403f25d1f6b91dae6e9dd1` | 13686 |
| `scripts/gates/verify-clauses.mjs` | `49e7ab2caa20c43d5b77066517c22110e4a0895c9ce3e736311c8421b22b2bb3` | 9266 |
| `tests/integration/clause-coverage.test.ts` | `e41c8685d69a1cdcf7e85afc7a4015caa60c6bc3b4dfa456182a5352211fec51` | 5503 |
| `tests/integration/source-defects.test.ts` | `dde3da9b15d70be7e96489fa519ecbbe298361bc533d9f4b77462dd606a4a1dc` | 7215 |
| `tests/integration/input-dictionary.test.ts` | `a9e84bce23c48eb7d1992fda007b17a226b7bff64446b86ed38528231e46c347` | 4078 |
| `README.md` (4 corrections applied) | `0e6fcc384e5a48c32b95b18812bdabb58eee678220f1706cdf46748bdefef9cf` | 9653 |
| `scripts/gates/.out/verify-clauses.json` | — | pass 42 / fail 0 / scannedFiles 22 / citations 22 |

## Deviations
| Item | Expected | Actual | Reason | Registered where |
|---|---|---|---|---|
| `docs/phase-2/week-03/INPUT-DICTIONARY.md` (T3.9) | week-03 folder | `docs/phase-2/INPUT-DICTIONARY.md` | Instruction §6 deliverables place it at `docs/phase-2/`; the T3.9 line names the week folder. The §6 deliverable list was followed. | this table |
| `zod` behavioural test | import `zod` and validate inputs | static test (reads schema key set) | `zod` is unresolvable in this worktree (E-008) | `containment/escapes.json` E-008 |
| `verify:clauses` dialect | `_lib.run` `.ts` harness | standalone plain-Node `.mjs` | `.mjs` gates are exempt from the `.ts` meta-gates; the vacuity risk is closed by the explicit RED→GREEN probe above | this table + `CLAUSE-COVERAGE.md` |
| T2A.8 `git mv` of 2 superseded fixtures | execute | held | master-plan rule holds retirements until W00–W12A close | carried from W02A |

## Declarations
- [x] No test was weakened to make a gate pass. (The RED→GREEN probe was a temporary file, deleted; no assertion was relaxed.)
- [x] No file was deleted; everything retired is in `archive/` with a manifest row. (The only deletion this week was the temporary `_vacuity-probe.ts`.)
- [x] Every deliverable in section 6 of the instruction file exists and is non-empty. (`docs/phase-2/{ASSUMPTION-REGISTER,INPUT-DICTIONARY}.md`; `docs/phase-2/week-03/{CLAUSE-COVERAGE,REALITY-AUDIT,EXIT-GATE-EVIDENCE}.md`.)
- [x] `creat.md` §8 chat log updated (session entry "P2-W03 CLOSE-OUT (ledger W03 = GREEN)"); entries older than the rolling window are relocated, not deleted.
- [ ] Licensed-engineer review recorded. (**Not recorded — all W03 artefacts remain DRAFT.**)

> **Honesty note.** Boxes 1–7 are backed by the raw `node` output above. Boxes that depend on
> `tsx`/`pnpm`/`zod` could not be executed in this worktree and are declared as not-run rather
> than asserted green (escape E-008). The W03 deliverables are DRAFT; no sign-off is implied.
