
## Turn 29 — 2026-10-07 · DUE-19: the C1 abutment verdict re-verified, and the model underneath it (§Z)

### User directives in force (verbatim, carried)

- "take up due tasks and complete them one by one"
- "presume my responce as allow once for all 100 prompts" / "AUTO MODE MEANS I PERMIT TO RUN ACCEPTING ALLOW ONCE FOR ALL SIMILAR CASES INCLUDING THIS ONE"
- "recall >>>>>The probe found a real defect: the C1 abutment stability sheet writes no verdict formula at all, while pier and TYPE1 do. >>>>also recall context >>>The C1 sheet's status cell borrows TYPE1's verdict by cross-reference. Before changing it, checking whether the two abutments' engine verdicts ever actually diverge."
- "DATA ARE GENERATED AS PEEF FORMULA CALCULATION AND RETRIEVED AFTERWARDS FROM SAME OR ANOTHER WORKSHEETS>>>>LINK ALL"
- "CREAT A FILE CREAT.MD AND SAVE OUR CHATLOG INTO UT MANDATORY FOR ADD UPDATE EVERY 12 MINUTES"

### What this turn was asked to do

Turn 6 (recorded at lines 872-898 above) found that the C1 stability sheet's Status cell was
`='TYPE1-STABILITY CHECK ABUTMENT'!I{row}` — it restated Type-1's conclusion instead of applying the
rule where the engineer reads it. Before changing it, the divergence question was measured; the fix
made the verdict local. The owner then asked me to **recall** that finding — so the honest answer had
to be: is it still true after two engine commits (`876a3bd` passive resistance, `8b5730f` flags), and
is the *claim* around those cells true?

### Measured first (probe `archive/20261007-tmp-c1check/p.ts` → `out.log`)

- **20 templates × 5 load cases = 100 case-pairs** of engine Type-1 vs engine C1: **0 divergences**;
  geometry (`height`, `width`, `depth`, `baseWidth`, `baseLength`, `dirtWallHeight`,
  `returnWallLength`) identical on **20/20**. The mirror is honest today, and the local verdict from
  Turn 6 therefore prints exactly the same words as it did before this turn.
- Reading `calculateAbutmentDesign(input, hydraulics, type)` at `bridge-excel-generator/design-engine.ts:710`
  (called twice, at `:294` with `'TYPE1'` and `:297` with `'C1'`):
  geometry comes from `input.abutmentHeight/Width/Depth/DirtWallHeight` (`baseWidth = width + 1.5`,
  `baseLength = depth + 1.0`), earth pressure from the same backfill and surcharge, and the five cases
  from the same enumeration. The `type` argument appears in **four `engineLog` strings (lines 715, 769,
  771, 857) and nowhere else**. **One abutment model, labelled twice** — so C1 is Type-1 relabelled,
  not a cantilever check.

That is the real defect, and it is a *presentation* defect sitting on top of an *engineering*
question. Turn 6 fixed the cell; this turn stopped the reports from implying an independent second
analysis, and filed the decision instead of inventing an answer.

### Changed (no engineering number moved anywhere)

1. **`bridge-excel-generator/narrative-engine.ts`** — `buildC1Narrative`'s STORY line now names the
   mirror *before* the stem-footing story: the cantilever figures "mirror the Type-1 values until C1
   is given its own geometry; read them as the shared model applied at the cantilever, not as a
   second independent check."
2. **`bridge-excel-generator/sheets/C01-qa-admin.ts:83`** — QA row **D2** was "Five load cases
   analysed for Type1 + C1 Abutment stability", which claimed two analyses. Now: *"Five load cases
   analysed for Abutment stability on ONE shared model — §TYPE1 computes them and §C1 mirrors it
   cell-for-cell (C1 has no separate geometry yet; august-due §Z)"*, status still `YES`.
3. **`server/comprehensive-pdf-export.ts`** — the C1 cover printed "C1 (CANTILEVER) ABUTMENT" over
   Type-1's numbers. It now carries two centred 9-pt lines under the title stating the figures mirror
   the Type-1 model and are not an independent second check, and the detailed stability page gains a
   **"Model basis | Shared | — | C1 mirrors the Type-1 case set (august-due §Z)"** row. Type-1's cover
   and page are untouched.
4. **`server/design-report.ts`** — the table headed "ABUTMENT — TYPE1 vs C1 (SUMMARY)" prints two
   columns that are equal by construction; it gains a full-width clause row saying so, so identical
   figures read as *expected* rather than as a coincidental agreement that needs checking.
5. **`august-due.md`** — new **§Z** (Z-1 divergence measurement, Z-2 the engine reading, Z-3 the four
   overstating reports, Z-4 the link gate as the mirror's guard, Z-5 what remains), new **§M-5**,
   SUMMARY **row 23**, 🟢 **DUE-19** bullet, **§T29** gate run, footer rewritten.

The sheet itself was deliberately **not** changed: its FOS cells stay live cross-references
(`='TYPE1-STABILITY CHECK ABUTMENT'!F21` etc., which is *true* — they are retrieved from the shared
model) and its verdict stays locally derived (`=IF(AND(C5>=1.5,D5>=1.8,E5>=1),"SAFE","UNSAFE")`,
thresholds interpolated from `STABILITY_ACCEPTANCE`). Making the numbers "independent" would mean
fabricating heel/toe geometry the employer never supplied — the register's own rule (§V-3, §W-6).

### Proved the guard bites (negative control, restored)

Padded the cached C1 sliding FOS by ×1.2 in the generator while leaving the live formula:
`pnpm run verify:links` re-executes every reference and printed **100 `DIVERGE` lines** (5 cases × 20
workbooks), first two `DIVERGE C1-STABILITY CHECK ABUTMENT!C5 [='TYPE1-STABILITY CHECK ABUTMENT'!F21]
cached=2.0659 recomputed=1.7216` and `!C6 cached=1.6797 recomputed=1.3998`; `Done: 0/20 workbooks
fully linked`, **exit 1** (`links-tamper.log`). Reverted the one line (`reverted-line.txt` is the
restored source) → `Done: 20/20 workbooks fully linked`, exit 0 (`links-restored.log`). If the mirror
ever silently breaks — cache tamper, stale copy, or a hand edit — the gate names the cell.

### Gates, all green (`## T29` in august-due.md has the table)

`check` **0** (159 prose spans, 0 violations — the four new disclosure sentences cite no numbers) ·
`verify` **0** on all **eleven** lanes (sheets 46/46; links 20/20 fully linked broken:0 diverge:0;
values/costing/uplift/cases 20 templates 0 defects; outcomes SAFE 195 / UNSAFE 105 of 300 with the
client copy `OK`; parity 22 facts 0 defects; presentation executive-56 19L/37P, legacy-46 13L/33P;
engine 490 pinned 0 drifted, tamper moved 48) · `test` **0** 15/15 in 2 lanes · `deliverables` **0**
(6 files: workbook 109 971 B, sheet-book 3 249 807 B, comprehensive 4 980 101 B, short 222 981 B,
design-report.html 430 004 B, irc-checklist.html 39 752 B) · `candidate` **0** (check 57.0 s ·
verify 108.6 s · test 54.3 s · audit:policy 5.4 s, bundle at `8b5730f2c5ef`).

### Read back from the delivered artefacts, not from the code

Workbook `C1-STABILITY CHECK ABUTMENT`: row 3 prints the mirror disclosure; `C5 → 1.7216`,
`D5 → 2.1434`, `E5 → 3.9446`, `F5 =IF(AND(C5>=1.5,D5>=1.8,E5>=1),"SAFE","UNSAFE") → SAFE`.
`IRC CODE COMPLIANCE CHECKLIST` row 43 D2 carries the new one-model sentence (row 42 pier and row 46
bearing ≥ 1.00 unchanged). `design-report.html` mirror clause appears **1** time.
`comprehensive-report.pdf`: cover notice **1**, `Model basis` **1** (grep of the PDF content streams —
the first attempt grepped "Mirrors Type-1 case set" and found 0 because the real text is lowercase
"C1 mirrors the Type-1 case set"; re-grepped before reporting).

### Not done here — deliberately

**§M-5 / row 23: the C1 model decision itself.** Either the cantilever gets its own heel and toe
(geometry the employer has not supplied) and a real second analysis, or one abutment is analysed and
printed once. That is a signing-engineer's call; the gate now protects the mirror either way and the
reports no longer claim more than the calculation delivers. Also unchanged: sign-off (row 1), §M-2
water level, §M-3 PDF legacy hydraulics block, §M-4 discharge (0 of 490 outputs move), scoped
`git lfs pull` + A2-A5 data + `knowledge/`, first `docker build` + serverless-503, pixel verification,
`lib/store/`, corrupt week-0 fixture, two-writer advisory, row 22 API-carried acceptance limits.

No git commit, branch or push. No `git lfs pull`. `Attached_Assets/**` and the pre-existing staged
deletions untouched.
