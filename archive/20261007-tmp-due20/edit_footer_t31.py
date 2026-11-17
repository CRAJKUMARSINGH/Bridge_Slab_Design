import io

P = 'august-due.md'
text = io.open(P, encoding='utf-8', newline='').read()

old_head = "*Last updated: 2026-10-08 (run dated 2026-10-07) — §AA added (DUE-20) plus §T30 gate run. DUE-20 closed row 22"
assert text.count(old_head) == 1

new_head = (
    "*Last updated: 2026-10-08 — §AB added (DUE-21) plus §T31 gate run. "
    "DUE-21 adjudicated row 24 site by site and corrected its own premise first: the \"42 remaining thresholds\" AA-6 had left behind were "
    "**regex matches** that included Froude tests, velocity and scour-depth limits, a biaxial DCR and the `99`/`999`/`Infinity` division sentinels — "
    "re-measured against a matcher that demands a stability variable beside the operator, the true surface is **28 comparison lines / 34 literals across 10 files**. "
    "Reading them found the reason AA could not have swept them: **the client ships a second design model** — `report-engine/**` + `BridgeSlabReport.tsx` derive their own "
    "`d.pierLCs`/`d.abtCases` from `Inputs` (friction-only sliding, `qmax ≤ SBC`) and `AbutmentStability.tsx`/`FormulaEvaluator.tsx` are standalone calculators, so **none of them "
    "ever receives a `CompleteDesignResult`** and there was no response to read. Two genuine divergences surfaced and both were filed rather than \"fixed\": **overturning 2.00 in the "
    "client against the engine's 1.80** (three sites, row 25) and **seismic edges of exactly 5/6 printed as \"reduced factors per IRC:6-2016 Cl. 219\"** with the clause text "
    "unverifiable here (row 26). `BridgeSlabReport.tsx:132 FOS_sbc: 2.5` was traced before being judged and is *not* the retired bearing rule but `qnu = SBC × FOS_sbc` at "
    "`bridgeDerivation.ts:180` — an ultimate/allowable multiplier a sweep would have broken. One value-preserving conversion was made (`Design.tsx`'s wind PASS edge now reads "
    "`acc.slidingFosMin`/`acc.overturningFosMin`, the same 1.5/1.8), the seismic edge kept its numbers and gained a comment naming why they are not the rule, and the residue is now "
    "**gate-owned**: `verify:outcomes` arm **6b** requires every client file comparing a stability factor to a decimal literal to appear in `DECLARED_CLIENT_THRESHOLDS` with a basis "
    "string *and* an unchanged literal set, while the reader list widened from 2 files to the **5** holding the response. Three planted controls each exited **1** — undeclared 1.6; a "
    "declared 1.5 edited to 1.6; `Design.tsx` reverted to a local limit object, which fired both arms at once — and the arm then caught `OptimisationAtAGlance.tsx`, a file the manual "
    "count had missed. Row 25's stakes were measured instead of asserted: **3 of 300** engine cases sit in `[1.80, 2.00)` and all three already fail on sliding, so **no verdict "
    "contradicts today**, but `irc-sukanaka-matoon` pier case 5 clears 1.80 by only **1.11e-4**, so the row-1 sliding repair makes browser and workbook disagree on that pier unless "
    "the model question is answered first. No engine file changed: `check` · `verify` (eleven lanes) · `test` 15/15 · `deliverables` · `candidate` all exit **0**, golden still **493 / "
    "0 drifted**, and all six artefact sizes byte-identical to §T30; nothing committed. Earlier the same day: §AA added (DUE-20) plus §T30 gate run. DUE-20 closed row 22"
)

text = text.replace(old_head, new_head)
io.open(P, 'w', encoding='utf-8', newline='').write(text)
print('footer lead updated')
