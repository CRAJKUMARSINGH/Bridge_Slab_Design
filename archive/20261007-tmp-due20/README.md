# DUE-20 working transcripts (2026-10-07)

Kept, not deleted: this is the evidence behind **august-due.md §AA / §T30** — the acceptance rule
moved into the design response and the browser's hand copy was retired. Nothing here is a deliverable;
`test-output/` and `evidence/release-candidate/` hold those. HEAD for every run: `8b5730f2c5ef`.

## Gate transcripts

| File | What it proves |
| --- | --- |
| `tmp-due20-check.log`, `tmp-due20-check2.log` | `pnpm run check` exit 0 — five typecheck lanes (the client lane compiles the four reader conversions against the now-required `stabilityAcceptance`) + `lint:narrative` 159 spans, 0 violations |
| `tmp-due20-verify.log` | `pnpm run verify` exit 0 on eleven lanes, including `OK   acceptance rule reaches the browser from the response`, links 20/20 fully linked, outcomes SAFE 195 / UNSAFE 105 of 300 (sliding 99 / overturning 82 / bearing 6), engine 493 pinned 0 drifted |
| `tmp-due20-emit.log` | deliberate golden re-accept: 490 → 493, diff = exactly the three new keys |
| `tmp-due20-golden-before.json` | the 490-key snapshot taken **before** the re-emit, so the three-key delta is checkable rather than asserted |
| `tmp-due20-test.log` | `pnpm run test` exit 0, 15/15 files in two lanes |
| `tmp-due20-deliverables.log` | six artefacts regenerated with the sizes §T30 quotes (note the HTML lines are character counts — see below) |
| `tmp-due20-candidate.log` | `pnpm run candidate` exit 0: check 72.2 s · verify 98.7 s · test 39.7 s · audit:policy 10.1 s, bundle against `8b5730f2c5ef` |
| `tmp-due20-devserver.log` | dev server boot log (`server/index-dev.ts`, :5180) for the browser pass; the server was stopped after the run |
| `tmp-due20-api.json` | live `POST /api/design/results` payload carrying `stabilityAcceptance {slidingFosMin:1.5, overturningFosMin:1.8, bearingFosMin:1}` — the reason no new endpoint was added |

## Negative controls (each planted, run, reverted)

| File | Planted defect → observed |
| --- | --- |
| `tmp-due20-ctl-a.log` | `client/src/lib/tmp-limit-probe.ts` with `slidingFosMin: 2` → `DEFECT acceptance rule reaches the browser from the response`, exit 1. This run also exposed two bugs **in the guard**: the literal pattern truncated `2.5` to `2`, and `String.match` named only the first literal per file |
| `tmp-due20-ctl-b.log` | probe with `slidingFosMin = 2.5` plus a literal left in `DesignCheckDashboard` → every literal named with the engine's value beside it. It also proved the first `limitReaders` list could not fire: bare filenames were compared against repo-relative paths |
| `tmp-due20-ctl-c.log` | non-global regex passed to `matchAll` → the lane crashed with a `TypeError` and printed **no** DEFECT line (a red gate that says nothing). Fixed, not tolerated |
| `tmp-due20-ctl-d.log` | full arm coverage: three literals + `shows stability verdicts but never reads stabilityAcceptance from the response` + the retired `STABILITY_LIMITS` name, exit 1 |

## Measurement notes kept with the run

| File | Content |
| --- | --- |
| `tmp-due20-remaining.txt` | the 42 surviving hand-applied threshold comparisons across 12 client files — the reason §AA does not claim the client is clean; filed as **row 24** |
| `tmp-due20-htmlsize.txt` | `design-report.html` = 430 004 **characters** vs 432 811 **bytes** on disk (same for 39 752 / 39 965): `regenerate-test-output.ts` prints string lengths for the HTML files. §T30 records the sizes as chars so the delivery column is not labelling characters as bytes |
| `tmp-due20-facts*.txt`, `tmp-due20-register-map.txt`, `tmp-due20-bytes.txt`, `tmp-due20-crlf.txt`, `tmp-due20-aa.txt`, `tmp-due20-t30.txt`, `tmp-due20-footer.txt`, `tmp-due20-next.txt`, `tmp-due20-y5.txt`, `tmp-due20-swap.txt` | excerpts pulled out of the logs to write §AA/§T30 from measured text, and the register-editing probes (line map, row 23/24 ordering, line-ending check) |
| `tmp-due20-port-check.txt`, `tmp-due20-port-after.txt`, `tmp-due20-kill.txt` | the dev server started for the browser pass was PID 2192 on :5180; stopped and the port confirmed free afterwards |

## `retired/stability-limits.ts`

The client's hand copy of `STABILITY_ACCEPTANCE`, deleted from `client/src/lib/` by this turn. It is
kept here (not erased) because §Y-5 documents why it existed: `client/src` imports only *types* from
`bridge-excel-generator`, so there was no other source for the three numbers. Its restore path is the
old `verify:outcomes` grep, which now fails closed instead — any literal of the rule under
`client/src`, or any verdict-rendering file that ignores `stabilityAcceptance`, is a named defect.

## DUE-21 additions (Turn 31, 2026-10-08)

This directory kept its name across the turn: DUE-20's paperwork closed and DUE-21 (row 24) opened in
the same sitting, so the `tmp-due21-*` transcripts belong to the same batch.

| File | What it proves |
|---|---|
| `tmp-due21-check.log`, `tmp-due21-green.log`, `tmp-due21-check-final.log` | `pnpm run check` exit 0 — five typecheck lanes (the client lane is what proves `Design.tsx` compiles against the required `stabilityAcceptance` rather than a local object) + `lint:narrative` 159 spans, 0 violations. The final log re-runs the lane after the register/chatlog/archive edits |
| `tmp-due21-verify.log` | `pnpm run verify` exit 0, eleven lanes, both acceptance arms green: `OK   acceptance rule reaches the browser from the response` and `OK   client thresholds are declared with a stated basis`; links 20/20, outcomes SAFE 195 / UNSAFE 105, engine 493 pinned 0 drifted |
| `tmp-due21-test.log`, `tmp-due21-deliverables.log`, `tmp-due21-candidate.log` | `15/15 files passed in 2 lanes`; six artefacts with sizes **identical to §T30**; `candidate` exit 0 (check 45.0 s · verify 82.2 s · test 97.0 s) |
| `tmp-due21-ctl1.log`, `tmp-due21-ctl2.log`, `tmp-due21-ctl3.log` | the three planted defects against new arm 6b: an undeclared `1.6`; a declared 1.5 edited to 1.6; `Design.tsx` reverted to a local limit object (fires Rule 6 **and** the reader complaint together). Each exit 1, each reverted |
| `tmp-due21-sites.txt`, `tmp-due21-sites2.txt`, `tmp-due21-superset.txt` | the site inventory, built twice: the loose superset (what AA's "42" had actually matched — Froude, velocity, scour, DCR, `99`/`999`/`Infinity`) and the stability-only matcher's **first pass: 28 lines / 34 literals across 9 files**. That pass was itself wrong and §AB-1 corrects it against the gate's own matcher -- **25 comparison lines / 33 literal occurrences across 10 files** (19 distinct values), the delta being four print-only strings in `AbutmentStability.tsx` and the file the hand scan missed (`OptimisationAtAGlance.tsx`). Kept so every correction is checkable, not asserted |
| `tmp-due21-fosscan.txt` | the per-file FOS/threshold scan behind the `DECLARED_CLIENT_THRESHOLDS` bases |
| `tmp-due21-probe1.txt`, `probe2`, `probe3`, `tmp-due21-r1..r4.log` | the reasoning probes: confirming the report model never receives a `CompleteDesignResult`, and the four gate-script revisions (an undefined `FOS_RULE_VALUES`, a garbled message, the case-sensitive token list that missed `r.worstSlid`, and the `i` flag that then surfaced `OptimisationAtAGlance.tsx`) |
| `measure-row25-gap.ts` → `tmp-due21-gap.txt` | row 25's stakes measured: of 300 engine load cases, **3** lie in `[1.80, 2.00)` (larathi 1.8479059920, kherka 1.9706721402, sukanaka **1.9998891394**) and all three already fail on sliding, so no verdict contradicts today — while sukanaka's **1.11e-4** margin makes it live the moment sliding is repaired |
 | `measure-client-thresholds.ts` | re-runs arm 6b's own regex over `client/src` and reports the figure the register quotes: **25 comparison lines / 33 literal occurrences across 10 files** (19 distinct values). Kept because §AB-1 corrects this directory's own earlier scan, and the correction has to be reproducible
| `edit_ab.py`, `edit_t31.py`, `edit_footer_t31.py`, `check_pipes.py` | the register editors. Python rather than the edit tool because `august-due.md` is UTF-8/LF with long single-line bullets; `check_pipes.py` verifies every table row's unescaped pipe count after an edit, because an unescaped pipe inside a cell silently splits the row into columns |
| `tmp-due21-bullets.txt`, `tmp-due21-footer.txt`, `tmp-due21-pipes.txt` | read-backs of the edited register: the four COMPLETED bullets' heads/tails, the new footer lead, the pipe audit (141 table rows scanned) |

## What was NOT changed

- No engineering number moved: golden diff is the three rule keys only, all six artefact sizes are
  identical to the §T29 run, outcome tally unchanged (SAFE 195 / UNSAFE 105).
- The four owner STRUCTURAL REVIEW flags, the C1 model question (row 23) and §M-2/M-3/M-4 were left
  for the licensed engineer / owner decisions. **DUE-21 added two more to that list rather than
  resolving them:** the client's second design model with overturning **2.00** against the engine's
  **1.80** (row 25 — three sites named, left byte-for-byte unchanged because re-pointing them would
  re-verdict a different arithmetic), and the seismic **5/6** edges whose `IRC:6-2016 Cl. 219`
  citation could not be verified from this repo (row 26). `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` was
  traced to `bridgeDerivation.ts:180` and is **not** the retired bearing rule, so it was not touched —
  a regex sweep of row 24 would have broken a working ultimate/allowable multiplier.
- One client value moved, and it moved nowhere: `Design.tsx`'s wind PASS edge now reads
  `stabilityAcceptance` where 1.5 / 1.8 had been typed. No engine file changed, so the golden (493)
  and all six artefacts are untouched.
- Nothing was committed, branched or pushed.
