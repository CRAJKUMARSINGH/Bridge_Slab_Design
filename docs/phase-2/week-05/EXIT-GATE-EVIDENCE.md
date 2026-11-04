# P2-W05 EXIT GATE EVIDENCE
Week: W05 — Reproducibility & cold-start determinism | Agent: Devin | Verifier: Kiro (pending) | Date: 2026-10-31
Baseline commit: worktree HEAD (W05 artifacts are staged in the worktree; no W05 commit exists yet)
Branch: `master`

Week gate: `gate:repro` (`package.json` → `node scripts/gates/gate-repro.mjs`).

## Gate checklist (copied verbatim from the instruction file §5)
| # | Gate item | Result | Evidence (file:line or command) |
|---|---|---|---|
| 1 | RunFingerprint implemented and stored | PASS | `lib/engine/src/reproducibility.ts` (`buildRunFingerprint`, `sha256Hex`, `canonicalJson`); type contract `RunFingerprint { inputSha256; engineVersion; registryVersions }` in `lib/engine/src/contracts.ts#L43-L47`, stored on `DesignResult.fingerprint`. Gate group A: 5/5 assertions (`contracts.ts declares RunFingerprint`, `carries inputSha256/engineVersion/registryVersions`, `DesignResult stores a RunFingerprint (T5.2)`). |
| 2 | 3 runs produce byte-identical output after cold restart | PASS | `gate:repro` group D spawns 3 separate `node` processes; `coldStartRuns[0] === [1] === [2]` byte-for-byte. Digest `3babbb49aa6b034403390b31f89a6f16546dd933170851124bcc6f3fbb6d7f86`. Extraction assertion: `D: all 3 runs are byte-identical after cold restart`. |
| 3 | gate:repro green | PASS | `GATE gate-repro: PASS 23 assertions`, exit 0. |
| 4 | REPRO-PROOF.md written | PASS | `docs/phase-2/week-05/REPRO-PROOF.md` (4739 bytes; 3-run comparison table, non-determinism audit, integrity block, honest limitations). |
| 5 | No non-determinism in calculation/export paths | PASS | `gate:repro` group B walks `lib/engine/src/**`: no `Math.random` / `Date.now` / `performance.now` / `process.hrtime`; the only wall-clock read is `calculatedAt: new Date().toISOString()` at `lib/engine/src/calculate.ts:42`, and that key is in `VOLATILE_FIELDS` so it never enters a reproducibility hash. |

## Command log (raw, untrimmed)
### week gate — GREEN
```
$ node scripts/gates/gate-repro.mjs; "EXIT=$LASTEXITCODE"
GATE gate-repro: PASS 23 assertions
EXIT=0
```

### cold-start comparison — the 3 runs, unescaped from `scripts/gates/.out/gate-repro.json`
Each run is one separate `node` process; the printed lines are byte-identical:
```
{"fp":"{\"engineVersion\":{\"codes\":\"codes-4b9a4227c2e1\",\"coefficients\":\"coeff-bb71b204f310\",\"engine\":\"0.5.0\"},\"inputSha256\":\"e639058da28678bed106c4f8eacdff0dd9768c08e39133c2aa14149cb4960b50\",\"registryVersions\":{\"codes\":\"codes-4b9a4227c2e1\",\"coefficients\":\"coeff-bb71b204f310\",\"engine\":\"0.5.0\"}}","digest":"3babbb49aa6b034403390b31f89a6f16546dd933170851124bcc6f3fbb6d7f86"}
{"fp":"… same …","digest":"3babbb49aa6b034403390b31f89a6f16546dd933170851124bcc6f3fbb6d7f86"}
{"fp":"… same …","digest":"3babbb49aa6b034403390b31f89a6f16546dd933170851124bcc6f3fbb6d7f86"}
```

### test lane (W05) — `node --test`
```
$ node --test tests/integration/reproducibility.test.ts; "EXIT=$LASTEXITCODE"
▶ T5.1 — sha256 + canonical JSON  (3 pass)
▶ T5.4 — volatile fields never affect the digest  (4 pass)
▶ T5.1 — RunFingerprint  (5 pass)
▶ T5.6 — export integrity block  (3 pass)
ℹ tests 15
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
EXIT=0
```

### harness regression — `gate-all-stubs`
```
$ node scripts/gates/gate-all-stubs.mjs; "EXIT=$LASTEXITCODE"
GATE gate-all-stubs: PASS 15 assertions
EXIT=0
```

### Non-vacuity
The digest assertion is non-vacuous by construction: a companion assertion in the same lane
and in `gate:repro` group C proves that (a) changing only `calculatedAt` leaves the digest
**unchanged**, while (b) changing a **real** field changes the digest. A vacuous hasher (one
that ignores all input) would fail (b); a hasher that included the clock would fail (a).
Additionally, `D: different input -> different fingerprint` is asserted in group C.

### not run — and why
- `npm run check` / `pnpm run build` / `gate:full`: `tsx` is absent and the `pnpm` shim is
  broken in this worktree (escape **E-008**, `GREEN_ONLY_IN_DIRTY_TREE`). Gates that shell
  out through `tsx` (`gate:readme`, `gate:docs`, `gate:index`, …) cannot be executed here.
- `gate:repro` is a plain-Node `.mjs` gate and is therefore unaffected; it is the week gate
  and it runs.
- The engine orchestrator (`calculate.ts`, `functions/*.ts`) is **not executed** by the
  cold-start proof — its `.js` import specifiers do not resolve without a build (E-008). The
  proof covers the fingerprint machinery + real registry data; arithmetic determinism is shown
  statically. See `REPRO-PROOF.md` §Limitations.

## Artifacts produced
| Path | sha256 | Bytes |
|---|---|---|
| `docs/phase-2/week-05/REPRO-PROOF.md` | `0cf2d86828b92d6c3a971f5d513d9206248c0052d9866d752e8171fe4b9ab109` | 4739 |
| `docs/phase-2/week-05/EXIT-GATE-EVIDENCE.md` | *(this file)* | — |
| `lib/engine/src/reproducibility.ts` | `c62c2f079697bcee9a4851d542a8173193e4f0a4d6a3304be25c89f3050bb225` | 4952 |
| `lib/engine/src/contracts.ts` | `477a0614f445ec9fe87cbd3e2a0e40630591c2c36e6a3e797fc145b8d84a59db` | 1840 |
| `scripts/gates/gate-repro.mjs` | `92ebbdadf67a743344c491644a6bc1a4c43d3d6181ef8b9d36246fc071188185` | 10042 |
| `tests/integration/reproducibility.test.ts` | `f6f9df36de35282b7e2d9a20e84615152e9e08b482829a03ca4b69b3cc380eeb` | 5101 |
| `PATH-MANIFEST.json` (W05 ownership extended) | — | — |
| `scripts/gates/.out/gate-repro.json` | — | pass 23 / fail 0 / coldStartRuns 3 |

## Deviations
| Item | Expected | Actual | Reason | Registered where |
|---|---|---|---|---|
| T5.3/T5.7 orchestrator execution | execute `calculate()` end-to-end and a live DB write/read | fingerprint + canonical-digest machinery executed; arithmetic determinism static; DB round-trip structural only | `.js` import specifiers in `calculate.ts`/`functions/*.ts` do not resolve without a build; no DB in this worktree (E-008) | this table + `REPRO-PROOF.md` §Limitations + `containment/escapes.json` E-008 |
| T5.2 DB persistence | write fingerprint to the DB record | stored on `DesignResult.fingerprint` in the type layer; DB write not exercised | no DB in this worktree (E-008) | this table |
| `gate:repro` dialect | `_lib.run` `.ts` harness | standalone plain-Node `.mjs` | `.mjs` gates are exempt from the `.ts` meta-gates; non-vacuity closed by the paired positive/negative assertions above | this table |

## Declarations
- [x] No test was weakened to make a gate pass.
- [x] No file was deleted.
- [x] Every deliverable in section 6 of the instruction file exists and is non-empty. (`docs/phase-2/week-05/{REPRO-PROOF,EXIT-GATE-EVIDENCE}.md`.)
- [x] `creat.md` §8 chat log updated (session entry "P2-W05 CLOSE-OUT (ledger W05 = GREEN)").
- [ ] Licensed-engineer review recorded. (**Not recorded — all W05 artefacts remain DRAFT.**)

> **Honesty note.** Boxes 1–5 are backed by the raw `node` output above. The engine
> orchestrator and a live database could not be exercised in this worktree (escape E-008);
> those are declared as not-run / structural-only rather than asserted green. The W05
> deliverables are DRAFT; no sign-off is implied.
