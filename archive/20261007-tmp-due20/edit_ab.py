import io

P = 'august-due.md'
s = io.open(P, encoding='utf-8', newline='').read()

# 1. correct the AA-6 count statement
o = ('| AA-6 | **Measured residue, not claimed completion.** 42 hand-applied FOS/threshold '
     'comparison sites survive across 12 client files')
n = ('| AA-6 | **Measured residue, not claimed completion.** 42 hand-applied FOS/threshold '
     'comparison sites survive across 12 client files *(count corrected in AB-1: that total was regex '
     'matches and included non-stability numbers)*')
assert s.count(o) == 1
s = s.replace(o, n, 1)

# 2. replace row 24 with an adjudicated row plus new rows 25 and 26
start = s.index('24. **Remaining hand-applied stability/FOS thresholds in `client/`**')
end = s.index('\n\n', start) + 2
row25_26 = (
    '24. ~~**Remaining hand-applied stability/FOS thresholds in `client/`**~~ **ADJUDICATED 2026-10-08 (AB)** '
    '-- every site was classified, not swept. **28 comparison lines / 34 literals across 10 files** is the real surface '
    '(AB-1 corrects the 42, which had counted Froude / velocity / scour-depth / DCR comparisons and the `99` / `999` / `Infinity` '
    'division sentinels); one convertible site was converted (`Design.tsx` wind PASS edge, now reads `stabilityAcceptance`) and the rest '
    'are **declared with a written basis and drift-gated** by new arm 6b of `verify:outcomes` (three planted controls: an undeclared literal, '
    'a drifted literal and a re-added copy each exit 1). The classification produced two findings that are owner decisions, filed as rows 25 and 26.\n\n'
    '25. **The client runs a second, independent design model that never sees the engine -- and it applies a different overturning rule** '
    '(AB-2, AB-3, new 2026-10-08). `report-engine/**` and `BridgeSlabReport.tsx` build their own load cases (`d.pierLCs`, `d.abtCases`, '
    'friction-only `mu*V/H`, `qmax <= SBC`) from `Inputs`; `AbutmentStability.tsx` and `FormulaEvaluator.tsx` are standalone calculators. '
    'None of them receives a `CompleteDesignResult`, so `stabilityAcceptance` is unreachable there without a plumbing decision. Their sliding '
    '(1.5) and bearing (pressure <= SBC) expressions agree with the engine, but **overturning is 2.00 there against the engine\'s 1.80** '
    '(`AbutmentStability.tsx:223/497/837` and `limit={2.0}`, `FormulaEvaluator.tsx:281` PASS 2.0 / WARN 1.7, '
    '`report-engine/sheets/AbutmentOptimiser.tsx:197` `fos_ot_min = 2.00`) -- so one bridge can print FAIL in the browser and SAFE in the '
    'workbook. Nothing was changed: pointing those sites at 1.80 would re-verdict a *different* arithmetic. Decide either (a) the report model '
    'becomes a view over the engine response (one calculator, one rule) or (b) it stays an independent check with its own declared rule set, in '
    'which case the two overturning numbers must be reconciled or labelled as two methods. Note also `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` -- '
    'checked and **not** the retired bearing rule: it is the ultimate/allowable multiplier in `bridgeDerivation.ts:180` (`qnu = SBC * FOS_sbc`), '
    'a different quantity that a sweep would have broken.\n\n'
    '26. **Seismic reduced edges: citation unverified, and the reduction is 5/6 not 25%** (AB-4, new 2026-10-08). '
    '`SeismicZonePanel.tsx` (8 sites) and the `Design.tsx` preview band judge seismic combinations at sliding 1.25 / overturning 1.50, printed as '
    '"per IRC:6-2016 Cl. 219". Two things this session could not close: the clause text was not verified against the code, and 1.25/1.5 and '
    '1.50/1.8 are both exactly **5/6** (a 16.7% reduction), not the 25% that "reduced factors" normally implies (which would be 1.125 / 1.35). '
    'If 5/6 is intended, derive it from `stabilityAcceptance` instead of typing it a second time; if 25% is intended, four UI sites are wrong today. '
    'Either way it is a code-clause decision, not an agent one.\n'
)
s = s[:start] + row25_26 + s[end:]

# 3. insert section AB before the next-actions block
ANCHOR = '## IMMEDIATE NEXT ACTIONS (in order)'
assert s.count(ANCHOR) == 1
sec = (
    '## AB. THE CLIENT\'S REMAINING STABILITY THRESHOLDS, CLASSIFIED AND DECLARED (2026-10-08, DUE-21)\n'
    '> Row 24 asked whether the 42 comparisons left after AA should all read `stabilityAcceptance`. They should not, '
    'and most of them cannot: the client ships a second calculator, and that calculator applies a different overturning '
    'rule to the same bridge. The count itself was wrong too.\n\n'
    '| # | Finding | Disposition |\n| --- | --- | --- |\n'
    '| AB-1 | **The "42" was not 42 stability thresholds.** AA-6 measured it as regex matches, which picked up '
    'Froude-number tests (`d.Fr < 1.0`), velocity and scour-depth limits (`>= 1.2 m` below scour), a biaxial DCR (`<= 1.0`), '
    'an importance factor (`1.0 | 1.5`) and division sentinels (`: 99`, `: 999`, `Infinity`). Re-measured with a matcher that '
    'requires a stability variable next to the comparison operator: **28 comparison lines / 34 literals across 10 files**, '
    'most of them the seismic band or the report model. | Corrected here rather than re-stated quietly, and the *gate* now owns '
    'the list (`DECLARED_CLIENT_THRESHOLDS`), so the count is measured on every run instead of being a sentence that rots. |\n'
    '| AB-2 | **The client has its own design model.** `report-engine/**` + `BridgeSlabReport.tsx` derive `d.pierLCs` / `d.abtCases` '
    'from `Inputs` -- own load combinations, own friction-only sliding, `qmax <= SBC` for bearing -- and `AbutmentStability.tsx` / '
    '`FormulaEvaluator.tsx` are standalone calculators. **None receives a `CompleteDesignResult`,** so there was no response to read '
    'and AA could not have reached them. | Left exactly as found, no number moved, each declared in `verify:outcomes` 6b with its reason. '
    'The real question -- one engine or two models -- is **row 25**; same family as Z (a presentation claiming more than one calculation '
    'supports). |\n'
    '| AB-3 | **The two models disagree on overturning: 2.00 in the client, 1.80 in the engine.** Sites: `AbutmentStability.tsx:223` '
    '(`overturn_ok: FOS_overturning >= 2.00`), repeated at `:497` and `:837` and as `limit={2.0}` on the FOS card; '
    '`FormulaEvaluator.tsx:281` (PASS 2.0 / WARN 1.7); `report-engine/sheets/AbutmentOptimiser.tsx:197` (`fos_ot_min = 2.00`). Sliding '
    '(1.5) and bearing agree, so it is a one-rule divergence -- and it means the browser can mark a case FAIL that the workbook marks SAFE '
    'for the same inputs: the Y-4 defect class, on the other side of the boundary. | **Not changed.** Re-pointing those sites at '
    '`overturningFosMin` would re-verdict a model whose arithmetic differs (friction-only sliding, no 706 passive term) -- moving '
    'engineering outcomes to make a list tidy. Registered as row 25 with the exact sites. `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` was tested '
    'before being judged and is *not* the retired bearing rule: it is `qnu = SBC x FOS_sbc` in `bridgeDerivation.ts:180`, an '
    'ultimate/allowable multiplier -- which is why this row was read site by site instead of swept. |\n'
    '| AB-4 | **Seismic edges are a deliberately different rule, and their arithmetic deserves a look.** `SeismicZonePanel.tsx` has 8 '
    'comparisons at 1.25 (sliding) / 1.50 (overturning) and the panel\'s own method note reads "Reduced FOS limits (seismic): sliding >= 1.25 '
    '(vs 1.5 normal), overturning >= 1.50 (vs 1.8 normal) per IRC:6-2016 Cl. 219". Two things this session could not close: the clause text '
    'was not verified, and both ratios are exactly **5/6** (-16.7%), not the 25% that wording invites (25% would be 1.125 / 1.35). | Left as-is '
    'and declared; the panel already discloses its basis, which is what row 24 asked for. Filed as **row 26** -- derive 5/6 from '
    '`stabilityAcceptance` if that is the intent, or correct four UI sites if 25% is. |\n'
    '| AB-5 | **What actually changed.** `client/src/pages/Design.tsx`: the wind preview\'s PASS edge (`wFOS >= 1.50 && wOTFOS >= 1.80`) was '
    'the engine rule re-typed in a file that *does* hold the response, so it now reads `acc.slidingFosMin` / `acc.overturningFosMin` with '
    '`const acc = r.stabilityAcceptance`; the seismic edge kept its numbers and gained a comment naming why they are not the rule. '
    '`scripts/verify-stability-outcomes.ts`: the reader list widened from 2 files to the **5** that receive the response '
    '(`DesignCheckDashboard`, `CompareModal`, `EngineeringCopilot`, `WindLoadPanel`, `Design`), and new arm **6b** requires every client file '
    'that compares a stability factor against a decimal literal to appear in `DECLARED_CLIENT_THRESHOLDS` with a basis string **and** with the '
    'literal set unchanged. | Value-preserving by construction: `acc.slidingFosMin = 1.5` and `acc.overturningFosMin = 1.8` are the numbers '
    'already there. No engine file changed, so the golden (493 outputs) and the six artefacts are untouched by this turn\'s code. |\n'
    '| AB-6 | **Three controls, each reverted.** (i) New file comparing `slidFOS >= 1.6` -> `compares a stability factor against a numeric '
    'literal (1.6) with no entry in DECLARED_CLIENT_THRESHOLDS`, exit **1**. (ii) A declared site\'s 1.5 edited to 1.6 -> `declared thresholds '
    'are [1.5] but the file now uses [1.6] -- update the declaration WITH its basis, never by copying the number in`, exit **1**. '
    '(iii) `Design.tsx` reverted to a local `{slidingFosMin: 1.5, ...}` -> both arms fire: three hard-copy defects **and** `shows stability '
    'verdicts but never reads stabilityAcceptance`, exit **1** -- proving the widened reader list is live. The arm also caught a file AB-1 had '
    'missed (`OptimisationAtAGlance`), which is the argument for gating the list rather than typing it. | Reverted; the green run reads '
    '`OK   acceptance rule reaches the browser from the response` and `OK   client thresholds are declared with a stated basis`, defects **0**, '
    'templates 20. |\n\n---\n\n'
)
s = s.replace(ANCHOR, sec + ANCHOR, 1)

# 4. next-actions: mark 4d closed and add 4e
o4d = '4d. Adjudicate the 42 remaining hand-applied thresholds in `client/`'
k = s.index(o4d)
eol = s.index('\n', k)
note = ('\n   4d-bis. **CLOSED 2026-10-08 (AB)** -- sites classified and declared, the one convertible site converted, '
        'and the residual left as two owner decisions: row 25 (the client\'s second model, incl. overturning 2.00 vs the '
        'engine\'s 1.80) and row 26 (seismic 5/6 edges: citation and derivation).\n'
        '4e. Decide row 25 and row 26 -- both are code-clause / model-architecture answers, not edits an agent may make.')
s = s[:eol] + note + s[eol:]

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('AB written; lines now', s.count('\n') + 1)
