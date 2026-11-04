import io

P = 'august-due.md'
text = io.open(P, encoding='utf-8', newline='').read()
lines = text.splitlines(keepends=True)

# 1. annotate the T30 residue line so the "42" sentence is not left standing unqualified
old = "- **New: 42 remaining hand-applied thresholds across 12 client files** (row 24 / §AA-6) — site-by-site adjudication, several are deliberately different rules\n"
new = ("- **New: 42 remaining hand-applied thresholds across 12 client files** (row 24 / §AA-6) — site-by-site adjudication, "
       "several are deliberately different rules *(→ adjudicated the next turn: the 42 measured 28 lines / 34 literals, row 24 closed, "
       "two owner decisions left as rows 25 and 26 — see §AB and §T31)*\n")
assert text.count(old) == 1, text.count(old)
text = text.replace(old, new)

# 2. append the T31 gate run
t31 = """
## T31. TURN 31 GATE RUN (2026-10-08, DUE-21)

> Executed against HEAD `8b5730f2c5ef` (unchanged — nothing committed), Node v24.18.0, pnpm 10.33.0. Transcripts under `archive/20261007-tmp-due20/` as `tmp-due21-*.log`. This turn touched one client file and one gate script; **no engine file moved**, which is why the golden and all six artefacts are expected to be identical — and they are.

| Gate | Exit | Key numbers |
|---|---|---|
| `pnpm run check` | **0** | five typecheck lanes (libs · flat · client · tools · workspace) + `lint:narrative` 159 prose spans, 0 violations. The client lane is what proves `Design.tsx` compiles against the required `stabilityAcceptance` field rather than a local object |
| `pnpm run verify` (11 lanes) | **0** | golden 493 outputs **0 drifted**, tamper moved 48 · sheets 46/46 · links **20/20 fully linked, broken:0 diverge:0** · values **Templates: 20 \\| cells: 102 724 \\| formulas: 12 031 \\| defects: 0** · costing · uplift · cases · outcomes 300 cases **SAFE 195 / UNSAFE 105**, 20/20 templates carrying an UNSAFE case, attribution sliding 99 / overturning 82 / bearing 6, and now **two** acceptance arms green: `OK   acceptance rule reaches the browser from the response` and `OK   client thresholds are declared with a stated basis` · parity 22 shared facts, 11/11 each project, 0 defects · presentation A4/15 mm/19L-37P · engine 493 pinned, boundary 61 modules |
| `pnpm run test` | **0** | Integration 13/13 · Engine unit 2/2 (67 tests, 0 fail) · `15/15 files passed in 2 lanes` |
| `pnpm run deliverables` | **0** | 6 files, **all sizes identical to §T30**: workbook 109 971 B · sheet-book.pdf 3 249 807 B · comprehensive-report.pdf 4 980 101 B · short-design-report.pdf 222 981 B · design-report.html 430 004 chars · irc-checklist.html 39 752 chars (HTML printed as characters, per the §T30 disclosure) |
| `pnpm run candidate` | **0** | check 45.0 s · verify 82.2 s · test 97.0 s (audit:policy in the same chain); refuses to write a manifest on a red chain, so a green bundle is the proof all four ran |

### Negative controls run in this turn (three planted defects against the new arm 6b, each reverted)

| Control (planted defect) | Observed |
|---|---|
| New client file comparing `slidFOS >= 1.6` with no declaration | `DEFECT client thresholds are declared with a stated basis` → `compares a stability factor against a numeric literal (1.6) with no entry in DECLARED_CLIENT_THRESHOLDS`, exit **1** (`tmp-due21-ctl1.log`) |
| A **declared** site's 1.5 edited to 1.6, declaration left untouched | `declared thresholds are [1.5] but the file now uses [1.6] — update the declaration WITH its basis, never by copying the number in`, exit **1** (`tmp-due21-ctl2.log`) — the arm refuses to let a declaration become a comment that no longer describes the code |
| `Design.tsx` reverted to a local `{slidingFosMin: 1.5, …}` | **both** arms fire together: three hard-copy defects from Rule 6 **and** Rule 6's reader complaint `shows stability verdicts but never reads stabilityAcceptance`, exit **1** (`tmp-due21-ctl3.log`) — proves the widened 5-file reader list is live, not decorative |

Two authoring defects were found by the controls rather than by reading: the first 6b draft referenced an undefined `FOS_RULE_VALUES` and built a garbled message (rewritten as a sorted literal-set comparison), and a case-sensitive token list missed `r.worstSlid`, so the matcher needed the `i` flag — after which it immediately surfaced `OptimisationAtAGlance.tsx` as undeclared, a file the manual site count had missed. That is the standing argument for gating the inventory instead of typing it into a sentence.

### Read-back (artefacts and running app, not the code that made them)

- **Measured residue, not asserted:** the gate now owns the list. Ten declared files, 28 comparison lines / 34 literals, each with a basis string; the numbers in this register come from `DECLARED_CLIENT_THRESHOLDS` being re-measured on every run, and AB-1 corrects AA-6's "42" from the same measurement.
- **Row 25's stakes measured** (`archive/20261007-tmp-due20/measure-row25-gap.ts` → `tmp-due21-gap.txt`): of the 300 engine load cases, **3** lie in `[1.80, 2.00)` — larathi-stabil pier #1 at 1.8479059920, irc-kherka-teegirder #1 at 1.9706721402, irc-sukanaka-matoon #5 at 1.9998891394 — and all three are already UNSAFE on sliding (0.853 / 1.137 / 1.183), so **no verdict disagrees today**; the sukanaka case clears the engine's 1.80 by 1.11e-4, which is what makes this urgent before a sliding repair rather than after.
- **Value preservation checked where it mattered:** the only converted site read `acc.slidingFosMin` / `acc.overturningFosMin` where 1.5 / 1.8 had been typed; the four report-model and two calculator files that disagree with the engine were left byte-for-byte unchanged, and `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` was traced to `bridgeDerivation.ts:180` before being judged — it is an ultimate/allowable multiplier, not the retired bearing rule, and a sweep would have broken it.
- **Not verified this turn:** no browser run was needed for the shipped surface (the changed file is a preview band whose numbers did not move), so pixel evidence remains row 12; and the `Cl. 219` citation behind the seismic band is still unverified against the code text — row 26, an owner answer, not an agent one.

### Still DUE after this turn

- Licensed-engineer sign-off — **105 UNSAFE of 300, 20/20 templates** (row 1); §Y-6 figures are the current ones
- **Row 25 — the client's second design model, and overturning 2.00 vs the engine's 1.80** (§AB-2/3/7). Latent today, live as soon as sliding is repaired on sukanaka; decide one-model-vs-two before that repair, not after
- **Row 26 — seismic 5/6 edges and the IRC:6-2016 Cl. 219 citation** (§AB-4)
- The C1 abutment model decision (§Z-5 / §M-5 / row 23) — own heel/toe geometry, or analyse one abutment once
- M-2 governing water level (101.375 vs 100.856) · M-3 PDF legacy hydraulics block · M-4 design discharge (moves **0 of 493** pinned outputs)
- scoped `git lfs pull` → real A2–A5 data + `knowledge/` (rows 4/5b) · first `docker build` + hosted deploy and the serverless-503 decision (row 10 / §X-7) · pixel verification (row 12) · `lib/store/` persistence (row 11) · corrupt week-0 fixture (row 20) · two-writer advisory (row 21)
"""

if not text.endswith('\n'):
    text += '\n'
text = text + t31
io.open(P, 'w', encoding='utf-8', newline='').write(text)
print('T31 appended; lines now', len(text.splitlines()))
