import io

P = 'archive/20261007-tmp-due20/README.md'
t = io.open(P, encoding='utf-8', newline='').read()

section = """## DUE-21 additions (Turn 31, 2026-10-08)

This directory kept its name across the turn: DUE-20's paperwork closed and DUE-21 (row 24) opened in
the same sitting, so the `tmp-due21-*` transcripts belong to the same batch.

| File | What it proves |
|---|---|
| `tmp-due21-check.log`, `tmp-due21-green.log`, `tmp-due21-check-final.log` | `pnpm run check` exit 0 — five typecheck lanes (the client lane is what proves `Design.tsx` compiles against the required `stabilityAcceptance` rather than a local object) + `lint:narrative` 159 spans, 0 violations. The final log re-runs the lane after the register/chatlog/archive edits |
| `tmp-due21-verify.log` | `pnpm run verify` exit 0, eleven lanes, both acceptance arms green: `OK   acceptance rule reaches the browser from the response` and `OK   client thresholds are declared with a stated basis`; links 20/20, outcomes SAFE 195 / UNSAFE 105, engine 493 pinned 0 drifted |
| `tmp-due21-test.log`, `tmp-due21-deliverables.log`, `tmp-due21-candidate.log` | `15/15 files passed in 2 lanes`; six artefacts with sizes **identical to §T30**; `candidate` exit 0 (check 45.0 s · verify 82.2 s · test 97.0 s) |
| `tmp-due21-ctl1.log`, `tmp-due21-ctl2.log`, `tmp-due21-ctl3.log` | the three planted defects against new arm 6b: an undeclared `1.6`; a declared 1.5 edited to 1.6; `Design.tsx` reverted to a local limit object (fires Rule 6 **and** the reader complaint together). Each exit 1, each reverted |
| `tmp-due21-sites.txt`, `tmp-due21-sites2.txt`, `tmp-due21-superset.txt` | the site inventory, built twice: the loose superset (what AA's "42" had actually matched — Froude, velocity, scour, DCR, `99`/`999`/`Infinity`) and the stability-only matcher's **28 lines / 34 literals across 10 files**. Kept so AB-1's correction is checkable, not asserted |
| `tmp-due21-fosscan.txt` | the per-file FOS/threshold scan behind the `DECLARED_CLIENT_THRESHOLDS` bases |
| `tmp-due21-probe1.txt`, `probe2`, `probe3`, `tmp-due21-r1..r4.log` | the reasoning probes: confirming the report model never receives a `CompleteDesignResult`, and the four gate-script revisions (an undefined `FOS_RULE_VALUES`, a garbled message, the case-sensitive token list that missed `r.worstSlid`, and the `i` flag that then surfaced `OptimisationAtAGlance.tsx`) |
| `measure-row25-gap.ts` → `tmp-due21-gap.txt` | row 25's stakes measured: of 300 engine load cases, **3** lie in `[1.80, 2.00)` (larathi 1.8479059920, kherka 1.9706721402, sukanaka **1.9998891394**) and all three already fail on sliding, so no verdict contradicts today — while sukanaka's **1.11e-4** margin makes it live the moment sliding is repaired |
| `edit_ab.py`, `edit_t31.py`, `edit_footer_t31.py`, `check_pipes.py` | the register editors. Python rather than the edit tool because `august-due.md` is UTF-8/LF with long single-line bullets; `check_pipes.py` verifies every table row's unescaped pipe count after an edit, because an unescaped `\\|` inside a cell silently splits a row |
| `tmp-due21-bullets.txt`, `tmp-due21-footer.txt`, `tmp-due21-pipes.txt` | read-backs of the edited register: the four COMPLETED bullets' heads/tails, the new footer lead, the pipe audit (141 table rows scanned) |

"""

anchor = '## What was NOT changed\n'
assert t.count(anchor) == 1
t = t.replace(anchor, section + anchor)

old_bullets = """- The four owner STRUCTURAL REVIEW flags, the C1 model question (row 23), §M-2/M-3/M-4, and the 12
  residual client threshold files (row 24) were left for the licensed engineer / owner decisions."""
assert t.count(old_bullets) == 1
new_bullets = """- The four owner STRUCTURAL REVIEW flags, the C1 model question (row 23) and §M-2/M-3/M-4 were left
  for the licensed engineer / owner decisions. **DUE-21 added two more to that list rather than
  resolving them:** the client's second design model with overturning **2.00** against the engine's
  **1.80** (row 25 — three sites named, left byte-for-byte unchanged because re-pointing them would
  re-verdict a different arithmetic), and the seismic **5/6** edges whose `IRC:6-2016 Cl. 219`
  citation could not be verified from this repo (row 26). `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` was
  traced to `bridgeDerivation.ts:180` and is **not** the retired bearing rule, so it was not touched —
  a regex sweep of row 24 would have broken a working ultimate/allowable multiplier.
- One client value moved, and it moved nowhere: `Design.tsx`'s wind PASS edge now reads
  `stabilityAcceptance` where 1.5 / 1.8 had been typed. No engine file changed, so the golden (493)
  and all six artefacts are untouched."""

t = t.replace(old_bullets, new_bullets)
io.open(P, 'w', encoding='utf-8', newline='').write(t)
print('README updated, lines', len(t.splitlines()))
