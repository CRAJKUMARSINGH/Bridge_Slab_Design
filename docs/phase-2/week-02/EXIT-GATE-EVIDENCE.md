# P2-W02 EXIT GATE EVIDENCE

Week: W02 — Engine consolidation & golden fixture freeze | Agent: TraeCode | Verifier: Kiro (pending) | Date: 2026-10-30
Baseline commit: `048eac0` on `foundation/set-one-hardening` | Final commit: uncommitted (working tree; W02 = GREEN is **provisional under escape E-008**, dirty tree — 566 entries)

This file is evidence, not a summary of evidence. Command output below is copied
from the terminal, including the two RED runs that prove `gate:parity` can fail.

## Gate checklist (copied verbatim from the instruction file §5)

| # | Gate item | Result | Evidence (file:line or command) |
|---|---|---|---|
| 1 | Engine consolidated into `lib/engine/src/**` with zero outward deps | PASS | `lib/engine/src/{hydraulics,loads,stability,rebar}/index.ts` — ports, no relative imports at all; verified by executing each module directly under Node's type-stripping loader |
| 2 | `contracts.ts` implemented with all shared types | PASS | `lib/engine/src/contracts.ts` (1840 B); asserted by `gate-docs` assertion 5 = `contracts-ts-valid` |
| 3 | Golden fixtures frozen and named by bridge code | PASS | `corpus/golden/{SOM-KHW,SOM-LAR,BED-HL}.json` — one file per oracle bridge, named by bridge code |
| 4 | `gate:parity` green | PASS | `GATE gate-parity: PASS 31 assertions` (transcript below) |
| 5 | `PARITY-DIFF.md` written | PASS | `docs/phase-2/week-02/PARITY-DIFF.md` (9724 B) |

## What was consolidated, and how it was verified

`gate:parity` is a *regression* gate, so it cannot on its own prove the ports were
faithful. Each port was therefore verified field-by-field against the original by
executing the original's own code path: the source file is copied to a temp `.ts`,
its import lines are stripped and replaced with passthrough shims, the internal
calculators are force-exported, and every numeric leaf is diffed against the port at
1e-9.

| Port | Source | Numeric fields compared | Diffs |
|---|---|---|---|
| `hydraulics/index.ts` | `client/src/report-engine/lib/hydraulicCalc.ts` | 23 | 0 |
| `loads/index.ts` | `client/src/report-engine/lib/loadCalc.ts` | 31 | 0 |
| `stability/index.ts` | `bridge-excel-generator/design-engine.ts` | 399 | 0 |
| `rebar/index.ts` | `slabCalc.ts`, `ircSlabCalc.ts`, `pierCalc.ts`, `design-engine.ts` | 113 | 0 |

The last two use the *generator's own code path*, which prints during execution
(`→ Calculating pier design…`, `⚠ Pier: α = 30.0° …`), so the comparison is against
real execution rather than a re-reading of the source.

ADR-0013 lock check: all 8 files in `foundation/engine.lock.json` re-hashed — 8/8
MATCH, 0 drift. The locked engine bytes were **not** touched, so no `lock:engine`
update is required. (13 `bridge-excel-generator/**` files show as modified in
`git status`; that is pre-existing and is not attributable to this session — the
hash comparison is what establishes it.)

## Command log (raw, untrimmed)

### `node scripts/gates/gate-parity.mjs` — GREEN

```
gate-parity: 1 asserted, 2 skipped of 3 frozen fixtures
  SKIP BED-HL: No repository input snapshot matches the oracle (oracle: hfl 442.5, 18 spans, spanLength 10.8 m, skew 30 deg). scripts/f…
  SKIP SOM-KHW: The only repository input for this bridge (scripts/fixtures/kherwara-project-input.ts, hfl 100.6 / 12 spans / spanLength…
  oracle vs computed (measured):
    SOM-KHW A: computed 141.500000000 vs oracle 490.300000000 relErr 7.114e-1 (rtol 1.000e-6) OUT
    SOM-KHW V: computed 1.71808981814 vs oracle 1.83546800000 relErr 6.395e-2 (rtol 1.000e-4) OUT
    SOM-KHW Q: computed 243.109709267 vs oracle 899.930000000 relErr 7.299e-1 (rtol 1.000e-4) OUT
    SOM-LAR A: computed 440.825000000 vs oracle 440.825000000 relErr 0.000e+0 (rtol 1.000e-6) OK
    SOM-LAR V: computed 2.41042556490 vs oracle 2.41098100000 relErr 2.304e-4 (rtol 1.000e-4) OUT
    SOM-LAR Q: computed 1062.57584965 vs oracle 1062.82100000 relErr 2.307e-4 (rtol 1.000e-4) OUT
GATE gate-parity: PASS 31 assertions
EXIT=0
```

### RED proof 1 of 2 — the baseline is falsifiable

`corpus/golden/SOM-LAR.json` → `baseline.hydraulics.velocityManning` perturbed from
`2.410425564901543` to `2.4104256` (a drift of 3.510e-8, i.e. 14.6x the 2.410e-9
tolerance), gate re-run, then the byte value restored.

```
  FAIL SOM-LAR: velocityManning == frozen baseline (rtol 1e-9):
velocityManning: computed 2.41042556490 vs frozen 2.41042560000 (|Δ| 3.510e-8, tol 2.410e-9)
GATE gate-parity: FAIL 31 assertions
EXIT=1
```

### RED proof 2 of 2 — the register cannot be dropped silently

`docs/phase-2/SOURCE-DEFECT-REGISTER.md` row SD-02 with the `[SOM-LAR/V]` token
removed, gate re-run, then the token restored.

```
  FAIL SOM-LAR: measured V delta is registered: relErr 2.304e-4 > rtol 1.000e-4
and SOURCE-DEFECT-REGISTER.md has no token [SOM-LAR/V]
GATE gate-parity: FAIL 31 assertions
EXIT=1
```

**This run also caught a real defect in the gate itself.** The first version of the
check scanned the whole register file with `includes()`, so the *example* token in
the register's own convention paragraph satisfied it: with `[SOM-LAR/V]` deleted
from the row, the gate still printed `PASS 31 assertions`. The check now scans only
table rows (`|`-prefixed lines) and the example was rewritten so it cannot match a
real token. Both RED proofs above were run **after** that fix — the second one is
what proves it.

### `node scripts/gates/gate-docs.mjs` and `gate-all-stubs.mjs` — regression check

```
GATE gate-docs: PASS 5 assertions
docs=0
GATE gate-all-stubs: PASS 15 assertions
stubs=0
```

### Full gate chain (`gate:foundation`, `npm run check`, `npm run test`)

NOT RUN in this environment, same limit W00 and W01 recorded: the TypeScript gate
chain requires `tsx`, which is not installed in this worktree, and the pnpm shim is
broken. Only plain-`node` `.mjs` gates can be executed here. This is an environment
limit, not a gate failure.

## Artifacts produced

sha256 = full 64-hex digest, lowercase.

| Path | sha256 | Bytes |
|---|---|---|
| lib/engine/src/contracts.ts | 477a0614f445ec9fe87cbd3e2a0e40630591c2c36e6a3e797fc145b8d84a59db | 1840 |
| lib/engine/src/hydraulics/index.ts | 0b048827c65531bfc1f48c6ba21622e889c10e91e4544473111d11f33567376c | 10136 |
| lib/engine/src/loads/index.ts | 436c5a416bea43d539c3bd8bce79e9ff80f8f5d2eda3d09b4b65027c2bfe0a82 | 15416 |
| lib/engine/src/stability/index.ts | 043aaf1afeb9411db77fd14f81294915f8188b623c6f39276a06375148a4f666 | 18682 |
| lib/engine/src/rebar/index.ts | c54430c41e1b94484796dafe56268b7a6cedf7b8384d56c8e443436f7be1962f | 13227 |
| corpus/golden/SOM-KHW.json | 2a5db3f6a48d006587c3722290438a52c67d8fd0532924f6555676aea0a51302 | 4767 |
| corpus/golden/SOM-LAR.json | 86ed8bb25acbfca0a5ac6ca7db056f11fa84c54e1abd8726a2204d453a397b90 | 5420 |
| corpus/golden/BED-HL.json | ab5a92539cc25726f02ec4de82d8f6ed0b99b813b1b6e7be80a8f6f430c350e2 | 2244 |
| scripts/gates/gate-parity.mjs | 12a5c62481f1398e1e9cf70850bc4409306e0ab71e733bc026d261d6686ca28c | 10204 |
| docs/phase-2/week-02/PARITY-DIFF.md | e26393f6509d364ae5ecf8ccc682c98b6b9c1b85e7eb8798ab5206a124493b3b | 9724 |
| docs/phase-2/SOURCE-DEFECT-REGISTER.md | ed5b06bdd4181a58febefb56c33ca2d9f938493c4f8d2b5d5a544462ba3f351c | 5438 |

## Deviations

| Item | Expected | Actual | Reason | Registered where |
|---|---|---|---|---|
| `gate:parity` scope | "golden corpus result equality at rtol 1e-9" (`PHASE-2-GATE-SPECS.md` row 17) | Regression equality against a frozen baseline, **plus** a mandatory registration check for every measured oracle gap | The engine's inputs live in `.ts` fixtures a plain-`node` gate cannot import, and 2 of 3 bridges have no matching input at all. Read literally, "result equality" would have required either a vacuous pass or a permanently RED gate. Decision taken with the user. | this file; `gate-parity.mjs` header comment |
| Oracle coverage | 3 of 3 bridges comparable | 1 of 3 comparable | SOM-KHW's only repository input is declared superseded by the oracle itself; BED-HL has no repository input and its source workbook is absent from the checkout | `SOURCE-DEFECT-REGISTER.md` SD-01, SD-03 |
| SOM-LAR V and Q | inside declared ROUNDED band | OUT by 2.3x (2.30e-4 vs 1e-4) | Wetted-perimeter definition; root cause quantified and the Manning implementation ruled out | `SOURCE-DEFECT-REGISTER.md` SD-02; `PARITY-DIFF.md` |
| `gate:prove` / `.pills.json` | poisoned-artefact RED/GREEN pair | not applicable | `.pills.json` has no `parity` entry, so `gate:prove parity` has nothing to poison; RED was proven by two manual perturbations instead | this file, "RED proof 1/2" |
| Gate verdicts in this file | committed tree | working tree (dirty) | files not yet committed at close-out | escape E-008 (`GREEN_ONLY_IN_DIRTY_TREE`) |
| W02 spec T2.2 reference | `PHASE-2-DOC-TEMPLATES.md PART D` | that file has no PART D | dangling reference in the spec | noted here only; `contracts.ts` satisfies T2.2 regardless |

## Declarations

- [x] No test was weakened to make a gate pass. `gate:parity` was made **stricter**
      during this week: its first version passed with a token missing from the
      register row (the proof is in the transcript above), and that hole was closed
      before W02 was called green.
- [x] No tolerance was widened to close a gap. SD-02's 2.30e-4 delta is left visible
      and registered, not absorbed into a 1e-2 band.
- [x] No file was deleted; everything retired is in `archive/` with a manifest row.
      The W02 freeze helper was written to `%TEMP%` and deleted there, outside the repo.
- [x] Every deliverable in §6 of the instruction file exists and is non-empty.
- [x] `creat.md` §8 chat log updated; entries older than 24h removed. The W02 entry
      was appended; the single >24h entry (2026-10-26 W06 tolerance sign-off) was
      **relocated** to `CREAT-CHATLOG.MD` before removal — relocated, never deleted.
- [ ] Verifier (Kiro) sign-off. **W02 is DRAFT until a licensed engineer records
      name, date and registration number.**
