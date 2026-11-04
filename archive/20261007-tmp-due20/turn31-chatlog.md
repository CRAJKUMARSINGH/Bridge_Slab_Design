

## Turn 31 — 2026-10-08 (DUE-21: adjudicate the residual hand-applied stability thresholds in `client/`)

**Directive in force:** "take up due tasks and complete them one by one", with "presume my responce as allow once for all 100 prompts" / "AUTO MODE MEANS I PERMIT TO RUN ACCEPTING ALLOW ONCE FOR ALL SIMILAR CASES INCLUDING THIS ONE". No commits, branches or pushes were made or requested. This turn opened by closing DUE-20's paperwork (row 22, §AA, §T30) and then took row 24 — the 42 thresholds §AA had left as measured residue.

### What the row actually said, and what turned out to be true

Row 24 asked a yes/no-shaped question — should every remaining client threshold read `stabilityAcceptance`? The answer was **no**, and the premise was wrong in two places, found by measuring rather than by trusting §AA's own sentence:

1. **The "42" was not 42 stability thresholds.** AA-6 had counted regex matches, and that pattern also picked up Froude-number tests (`d.Fr < 1.0`), velocity and scour-depth limits, a biaxial DCR check (`<= 1.0`), an importance-factor choice, and division sentinels (`: 99`, `: 999`, `Infinity`). Re-measured with a matcher that requires a stability variable next to the comparison operator: **28 comparison lines / 34 literals across 10 files**. Corrected in §AB-1 rather than restated quietly — a register whose counts rot is a register nobody can act on.
2. **Most of them could not have read the response even in principle.** The client ships a **second design model**: `client/src/report-engine/**` plus `BridgeSlabReport.tsx` build their own load cases (`d.pierLCs`, `d.abtCases`) from `Inputs`, with friction-only sliding and `qmax <= SBC` for bearing; `AbutmentStability.tsx` and `FormulaEvaluator.tsx` are standalone calculators. None of them receives a `CompleteDesignResult`, so DUE-20's rule was unreachable there by construction. That is row 25 now, not a to-do.

### Two divergences surfaced, and both were left alone deliberately

- **Overturning: the client says 2.00, the engine says 1.80** (`AbutmentStability.tsx:223/497/837` + `limit={2.0}`, `FormulaEvaluator.tsx:281` PASS 2.0 / WARN 1.7, `report-engine/sheets/AbutmentOptimiser.tsx:197` `fos_ot_min = 2.00`). Sliding and bearing agree, so it is a one-rule split between two calculators judging the same bridge. **Not changed** — re-pointing those sites at the engine's number would re-verdict a *different* arithmetic (no §706 passive term), which is moving engineering outcomes to tidy a list. Its bite was measured rather than asserted: scanning all 300 engine load cases for `1.80 <= overturningFOS < 2.00` gives **3 cases**, all on the pier stability sheet, and **all three already UNSAFE on sliding** (0.853 / 1.137 / 1.183), so **no verdict contradicts today**. The margin matters though: `irc-sukanaka-matoon` pier case 5 sits at **1.9998891394** — it clears 1.80 by **1.11e-4**, so the first sliding repair row 1 recommends turns this into a live browser-vs-workbook disagreement. Hence the advice in next-action 4e: answer row 25 **before** repairing sliding, not after.
- **Seismic edges are exactly 5/6 of the normal rule, cited as "IRC:6-2016 Cl. 219"** (sliding 1.25 against 1.5, overturning 1.50 against 1.8 — both precisely a 16.7% reduction, not the 25% "reduced factors" wording invites, which would be 1.125 / 1.35). The clause text could not be verified from this repo. Row 26, an owner answer.

And one near-miss worth recording: `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` looked exactly like a stale copy of the retired bearing rule §M-1 killed. It is not — it is the ultimate/allowable multiplier in `bridgeDerivation.ts:180` (`qnu = SBC * FOS_sbc`). Had this row been swept by regex, a working quantity would have been "fixed" into a wrong one. That is the evidence for site-by-site reading.

### What was actually changed

- `client/src/pages/Design.tsx` — the wind preview's PASS edge was the engine rule re-typed inside a file that *does* hold the response, so it now reads `acc.slidingFosMin` / `acc.overturningFosMin` via `const acc = r.stabilityAcceptance`. Same numbers, so value-preserving by construction. The seismic edge in the same file kept its numbers and gained a comment naming why they are *not* the engine rule and where the open question lives.
- `scripts/verify-stability-outcomes.ts` — reader list widened from 2 files to the **5** that receive the response (`DesignCheckDashboard`, `CompareModal`, `EngineeringCopilot`, `WindLoadPanel`, `pages/Design.tsx`), and new arm **6b** added: every client file that compares a stability factor against a decimal literal must appear in `DECLARED_CLIENT_THRESHOLDS` **with a basis string**, and its declared literal set must still match what the file actually contains. Ten files declared, all bases written from the reading above. The inventory is now measured on every run instead of being a sentence in a markdown file.

### Controls, and what they found about the gate itself

Three planted defects, each reverted: (i) an undeclared `slidFOS >= 1.6` → `compares a stability factor against a numeric literal (1.6) with no entry in DECLARED_CLIENT_THRESHOLDS`, exit **1**; (ii) a declared site's 1.5 edited to 1.6 → `declared thresholds are [1.5] but the file now uses [1.6] — update the declaration WITH its basis, never by copying the number in`, exit **1**; (iii) `Design.tsx` reverted to a local limit object → **both** arms fire at once (three hard-copy defects **and** `shows stability verdicts but never reads stabilityAcceptance`), exit **1**, proving the widened reader list is live.

The controls also caught two authoring bugs before anything shipped: the first 6b draft referenced an undefined `FOS_RULE_VALUES` and produced a garbled message (rewritten as a sorted literal-set comparison), and a case-sensitive token list missed `r.worstSlid`, so the matcher needed the `i` flag — after which it immediately flagged `OptimisationAtAGlance.tsx`, **a file the manual count had missed**. A gate that finds what the human missed is the argument for gating rather than typing.

### Gate state at the end of this turn

| Lane | Exit | Evidence |
|---|---|---|
| `pnpm run check` | **0** | five typecheck lanes + `lint:narrative` 159 spans, 0 violations |
| `pnpm run verify` (11 lanes) | **0** | `OK   acceptance rule reaches the browser from the response` · `OK   client thresholds are declared with a stated basis` · links 20/20 fully linked (broken:0 diverge:0) · values 20 templates / 102 724 cells / 12 031 formulas / defects 0 · outcomes 300 cases SAFE 195 / UNSAFE 105, 20/20 templates unsafe-bearing, attribution sliding 99 / overturning 82 / bearing 6 · parity 22 facts 0 defects · engine **493 outputs, 0 drifted**, tamper moved 48 |
| `pnpm run test` | **0** | 13 integration + 2 engine files, 67 engine tests 0 fail → `15/15 files passed in 2 lanes` |
| `pnpm run deliverables` | **0** | 6 files, sizes **identical to §T30** — workbook 109 971 B, sheet-book 3 249 807 B, comprehensive 4 980 101 B, short 222 981 B, design-report.html 430 004 chars, irc-checklist.html 39 752 chars |
| `pnpm run candidate` | **0** | check 45.0 s · verify 82.2 s · test 97.0 s; the chain refuses to bundle on red, so a green manifest is the proof |

No engine file moved, so the golden and the artefacts were expected to be untouched — and the read-back confirms it rather than assuming it.

### Register and paperwork

`august-due.md`: row 24 struck **ADJUDICATED**; rows 25 and 26 opened with exact sites; **§AB** (AB-1…AB-7) — AB-7 is this turn's gap measurement; **§T31** gate run with the three controls and the read-back; next-action 4d closed, 4e re-pointed at the measured stakes; footer re-led to §AB/T31. `CREAT-CHATLOG.MD` this entry. `CODE-JUNCTION/august-due.md` re-synced by copy and compared byte-for-byte. Transcripts and the measuring script kept under `archive/20261007-tmp-due20/` (`tmp-due21-*.log`, `measure-row25-gap.ts` → `tmp-due21-gap.txt`); nothing was deleted from the tree — the register convention is archive, not remove.

### Still DUE after this turn

Licensed-engineer sign-off on **105 UNSAFE of 300** across **20/20** templates (row 1 — the only thing that makes any output authoritative) · **row 25**, the client's second design model and its 2.00-vs-1.80 overturning rule · **row 26**, the seismic 5/6 edges and their unverified Cl. 219 citation · row 23 / §Z-5, the C1 one-model-two-labels decision · §M-2 governing water level (101.375 vs 100.856) · §M-3 the PDF's legacy hydraulics block · §M-4 design discharge (moves **0 of 493** pinned outputs) · scoped `git lfs pull` then real A2–A5 data and `knowledge/` (rows 4/5b) · first `docker build`, hosted deploy and the serverless-503 question (row 10 / §X-7) · pixel verification (row 12) · `lib/store/` persistence (row 11) · corrupt week-0 fixture (row 20) · two-writer advisory (row 21).

Nothing committed, branched or pushed. The four UNSAFE STRUCTURAL REVIEW flags, the PARWAN bar grade, OFL = HFL, SSR/DSR rates, IRC impact factors and the estimation assumption register remain owner-only decisions and were not touched.
