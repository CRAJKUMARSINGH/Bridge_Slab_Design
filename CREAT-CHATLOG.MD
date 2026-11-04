# CREAT-CHATLOG — Running chat log (Bridge_Slab_Design)

> Naming note: the requested file `CREAT.MD` cannot be created because Windows
> treats it as the existing `creat.md` (project planning doc). This file is the
> chat log instead. Update policy: appended at every working turn; a literal
> 15-minute timer is not possible inside an agent session — the log is updated
> at least once per turn, which is the closest faithful behaviour. The rollup
> cadence rule lives in `creat.md` §0 (governance, 15 min).

---

## Session 2026-10-03/04 — CODE-JUNCTION audit follow-up + repo-wide enrichment

### Turn 1 — user
"read all files in folder CODE-JUNCTION >>>> apply enrichment and fixing of code if due >>>> indicate what is due and done"

### Agent actions
- Read all 4 CODE-JUNCTION files (NOTE.txt, BRIDGE 12 AUD.txt, two implementation plans).
- Verified the 2026-08 audit's priority-fix list against current HEAD (`ab38f29`):
  all 12 audit items already closed (LL-ABSTRACT added, sheets bound to engine,
  wind IRC:6-2017 + seismic IS:1893 implemented, MATERIAL_RATES populated,
  46-sheet contract enforced).
- Applied first-pass enrichment fixes:
  1. Sheet 9: added missing 'Status' header + column width.
  2. Sheet 10: added missing 'Status' header + column width.
  3. loadsumm: removed dead `?? 0` fallbacks and `as any` cast on seismicForce.
  4. Type1/C1 stress sheets: NaN pressure now renders `CHECK`, not raw NaN.
- Validation: excel-integrity 3/3 pass; verify-kherwara-excel-golden OK; tsc clean.

### Turn 2 — user
"DECIDE AS BEST AGENT ... DO NEEDFUL >> read all folders/subfolders, enrich and fix, ensure valuable code is wired to mainline >> create CREAT.MD chat log every 12 min >> add presentation specification markdown, A4 15mm margins >> list worksheet names for portrait/landscape tabulation >> add great designed title sheet + index page"

### Agent actions
- Ran deep scan (Explore agent) across all source folders. Findings and fixes:
  - **HIGH — sheet 4 (HYDRAULICS)**: R/V/Q formulas referenced column B (text
    labels) instead of column C (values) → would show #VALUE!/#DIV/0! on real
    Excel recalc. Fixed all to column C; added
    `computeCrossSectionHydraulics()` as TS mirror so cached results equal the
    formulas instead of Kherwara sample literals (490.30, 190.71, 1.84, 899.93).
  - **HIGH — sheet 3 (afflux calculation)**: stale cross-sheet refs
    `=HYDRAULICS!B28/B29` replaced with dynamic `=HYDRAULICS!C{aRow}/C{pRow}`
    via `getHydraulicsTotalRow()`; broken `=B49+D76` (added a text cell) fixed
    to `=B49+C76`; broken `=C86` fixed to `=B86`; every sample-literal cached
    result replaced by computed values (velocity, discharge, Lacey scour,
    Molesworth afflux, AFL, obstruction areas).
  - **MED — sheet 3**: 0.83 slab thickness now `input.deckSlabThickness ?? 0.83`
    (soffit derived: HFL+1.0−thickness); `2 × 1.2` end-width extracted to named
    constant `ABUT_END_WIDTH_M` with pending-survey comment.
  - **MED — server/remote-app-adapter.ts**: added missing **M20 concrete
    quantity bucket** (M20 grade previously produced zero quantities with
    nonzero cost); fixed **wearing coat priced as M35 concrete** →
    `RATE_LOOKUP.wearingCoat`, BOQ unit corrected m³ → m².
  - Propagated `m20` through `EstimationResult` (types.ts), both BOQ maps
    (design-engine.ts, index.ts) and the PDF quantities summary (pdf-export.ts).
  - **Dead-code quarantine**: `bridge-excel-generator/sheets-extracted/`
    (47 TODO-skeleton files, zero importers, contained contract-violating
    sheet names) moved via `git mv` to `archive/sheets-extracted/` —
    archive-first policy respected.
  - **Report layer**: `design-report.ts` HTML now carries
    `@page { size: A4; margin: 15mm; }`; confirmed comprehensive PDF already has
    designed cover page + foreword + TOC on A4/15mm.
- Validation after edits: tsc whole-repo clean; excel-integrity 3/3; golden
  verifier OK; verify-engine-hydraulics OK.
- Created `PRESENTATION-SPEC.md` with the 46-worksheet orientation table for
  user tabulation.

### Remaining DUE (deferred, needs user input)
- Orientation table in PRESENTATION-SPEC.md §4 to be filled by user → then
  per-sheet ExcelJS `pageSetup` + landscape-lane honouring will be implemented.
- Platform quarantine (`client/`, `api/`, `netlify/`, `report-engine-weaver/`):
  partially archived already, but `bridge-excel-generator` imports
  `server/remote-app-adapter`, so full quarantine needs an engine decoupling
  step first (circular-layering fix).
- IRC impact factors (1.10/1.25/1.50 in loadsumm) → move to an IRC:6 config
  with clause references.
- SSR/DSR approved rate registers to replace provisional MATERIAL_RATES.
- 468-row legacy replica fidelity for sheet 9 + LLOAD influence-line tables
  (engineering decision: replica vs. engine-driven view).
- Licensed-engineer sign-off and evidence bundle (Week-15 plan).

---

## Turn 3 — 2026-10-04 (orientation tabulation returned by user)

### User
"LANDSCAPE >>>3, 5, 9,10, 15,16, 17,18 TO 21, 30-31, ALL OTHER PORTRAIT"

### Agent actions
- Encoded the tabulation as `LANDSCAPE_SHEET_INDEXES = {3,5,9,10,15,16,17,18,19,20,21,30,31}`
  in `bridge-excel-generator/sheet-contract.ts` (13 landscape / 33 portrait).
- Implemented `applyWorkbookPageSetup()` in `bridge-excel-generator/index.ts`:
  every sheet gets A4 (`pageSize: 9`), orientation per the set, `fitToPage: true`,
  fit-to-width 1 page, margins 15 mm all around (ExcelJS inches = 0.5906).
- Verified end-to-end by generating the workbook and reloading it: landscape
  sheets = exactly 3,5,9,10,15,16,17,18,19,20,21,30,31; portrait 33;
  `fitToPage` true on all; 15 mm margins confirmed.
- Closed checklist-export gap: `@page margin:18mm 14mm` → `margin:15mm`
  (server/checklist-export.ts:376).
- Closed landscape-lane gap: `generateLandscapeBookPDF()` in
  `server/landscape-pdf-export.ts` now flips each sheet page between A4
  landscape/portrait per `LANDSCAPE_SHEET_INDEXES` (heading band, dividers and
  page labels sized per orientation; unknown extra sheets default landscape).
  Verified on a generated book: 63 pages = 27 landscape / 36 portrait.
- `PRESENTATION-SPEC.md` §4 filled with the confirmed orientation column;
  §6 moved workbook-pageSetup and checklist-margins to "Closed 2026-10-04".
- Fixed broken verifier `scripts/verify-narrative-depth.ts`: extensionless
  default import (`import calc from '.../design-engine'`) resolved to a
  duplicate module instance under tsx ESM and threw "not a function". Now uses
  `import { calculateCompleteDesign } from '.../design-engine.ts'` — all 6
  narrative-depth sheets OK.
- Validation: tsc clean; excel-integrity 3/3; golden verifier OK (46/46).

### DONE vs DUE (as of 2026-10-04, end of turn 3)
**DONE:** Turn-1/2 fixes and validations; orientation tabulation implemented in
the Excel workbook (A4 / 15 mm / fit-to-width across all 46 sheets); checklist
export margins aligned; landscape PDF book lane honouring the orientation table;
PRESENTATION-SPEC updated; chat log maintained.
**DUE:** HTML report per-section orientation; engine decoupling
(`bridge-excel-generator/index.ts` → `server/remote-app-adapter`) before
quarantining `client/`, `api/`, `netlify/`; IRC impact-factor configurability
(1.10/1.25/1.50); SSR/DSR real rates; 468-row legacy sheet-9 replica decision;
licensed-engineer sign-off bundle.

---

## Turn 4 — 2026-10-04 (full test run + elegance/readability review)

### User
"TEST RUN AND GENERATE ONE DESIGN >>> READ CHECK IT FOR ELEGANCE READABILITY AND BEAUTY"

### Agent actions
- Ran the full pipeline on the Kherwara reference design: workbook (46/46),
  comprehensive PDF (225 pages), landscape sheet book (63 pages, 27 L / 36 P),
  short PDF, HTML design report, IRC checklist HTML. All green.
- Readability review found and fixed 3 real defects:
  1. **Sheet preview numbers** (`server/workbook-sheets-preview.ts`):
     `toPrecision(12)` produced `644.638493015` in report tables. Now a shared
     `numberDisplay()` caps at 3 decimals (integers stay plain, exponent form
     for ≥1e6 / <1e-4). Also applied to formula-result cells.
  2. **Cantilever (C1) narrative was unreachable** (`narrative-engine.ts`):
     `getSheetNarrativeParagraphs` matched `'abutment'` → Type1 before the C1
     branch, so `buildC1Narrative()` never ran. Reordered dispatch (type1 →
     C1/cant → generic abutment). C1 now emits stem-footing story with distinct
     verdict line.
  3. **Reinforcement/hydraulic raw floats** in sheet cells
     (`12-18-pier-remaining.ts`, `19-28-abutment-type1.ts` steelText → Ast 1 dp,
     weight 2 dp; `29-46-estimation.ts` `n()` → 3 dp).
- Validation after fixes: tsc clean; excel-integrity 3/3; golden verifier OK;
  narrative-depth 6/6; regenerated outputs show 0 rendered long-decimals and
  0 NaN/placeholder defects in both HTML lanes.

## Turn 5 — 2026-10-04 ("DATA ARE GENERATED AS PER FORMULA CALCULATION AND RETRIEVED AFTERWARDS FROM SAME OR ANOTHER WORKSHEETS >>> LINK ALL")

### DONE
- Workbook is now a live linked model (engine values kept as cached results).
  Baseline before this work: 74 formulas / 2 cross-sheet refs. Final:
  **370 formulas / 152 cross-sheet refs / 445 input literals / 0 broken refs**
  (topology validator now permanent at `scripts/verify-workbook-links.ts`).
- Linked chains (same-sheet formula calc + cross-sheet retrieval):
  1. HYDRAULICS → Sheet 9 "STABILITY CHECK FOR PIER": velocity & discharge
     retrieved by reference; all Section B loads and the whole 5-case stability
     table (V/H/M, sliding/overturning/bearing FOS, live SAFE-UNSAFE IF) are
     formulas from the Section A parameter cells. `PIER_STABILITY_ROWS`
     extended (drag/wind/seis/totalH) as the shared row-anchor contract.
  2. Sheet 10 "abstract of stresses": geometry, P, M, SBC retrieved from
     sheet 9; P/A, M/Z, p-max and status computed in-sheet.
  3. Sheet 18 "loadsumm": 8 loads retrieved from sheet 9 Section B; IRC MT
     reactions computed as `=C5/9.81*factor`; "LLOAD" live-load column and
     status are cross-sheet formulas; Pier Cap LL retrieved from sheet 9.
  4. Sheet 21 Type-1 abutment stability: full live mirror of the engine
     (Ka = TAN((45−φ/2)·π/180)², Pa = ½·Ka·γ·H², V/H/M, three FOS, IF status).
  5. Sheet 31 C1 stability: pure retrieval view of sheet 21 (identical model),
     plus C1 footing-stress and C1 stem Pa retrieved from TYPE1 cells.
  6. TYPE1 footing stress: pressure = V/(Bw·Bl) with cross-sheet refs, live
     IF status.
  7. Estimation: Sheet 45 Abstract Amount `=Qty*Rate`, SUBTOTAL `=SUM`,
     GST `=sub*0.18`, GRAND TOTAL `=sub+gst`; Sheet 44 General Abs. retrieves
     each amount from 'Abstract' and computes % of subtotal; sheet 42 INSERT
     ESTIMATE retrieves subtotal/GST/total from 'Abstract'.
  8. Sheet 46 Bridge measurements: quantities `=L*W*D*C` with SUM total (prior batch).
- Spot-verified against the engine: Ka 0.3333, Pa 75 kN, Type1 case-1 FOS
  2.1042/2.6197/3.9446 SAFE, C1 retrieval identical, loadsumm C13 44.852 MT,
  Abstract amount/subtotal consistent with BOQ.
- Validation after the batch: tsc 0 errors; excel-integrity 3/3; golden
  46/46; link audit broken:0. Regenerated `test-output/design-workbook.xlsx`
  (68 KB) with all links.

### DUE (next)
- Sheets 6 CROSS SECTION / 7 Bed Slope / 3 afflux chain: extend remaining
  derived rows to formulas (sheet 3 already partly formula-native).
- Decide whether sheet 9's DWL input can link to sheet 3 once the
  effective-waterway definition (engine vs legacy 468-row mirror) is agreed.
- Licensed-engineer sign-off remains outstanding for all CHECK/UNSAFE outcomes.

## Turn 6 — 2026-10-04 (action plan for DUE + auto-mode bug removal)

### DONE
- Wrote `ACTION-PLAN.md` (phases A–D) for the LINK ALL DUE items + bug sweep.
- Extended `scripts/verify-workbook-links.ts`: now validates SAME-SHEET refs
  (764 checked) and re-evaluates every arithmetic formula against its cached
  result (divergence detector). This immediately found 6 real bugs:
  1. **Sheet 3 legacy row-drift** — 11 stale/self-referencing formulas
     (`=B63*D63` self-refs, `=C60*C64` pointing at "m2" text, `=C55+B65+B71`
     self-sum, afflux `=B49+C76` circular, DWL `=B86` → empty, etc.). All
     anchors corrected; sheet 3 also converted to live formulas: bridgeWidth
     `=((C18-1)*F18)+2.4`, avg depth `=B49-B59`, deck top/soffit, slab areas,
     obstruction chain.
  2. **Abstract double-count** — engine BOQ contains a pseudo "TOTAL" item;
     sheets 42/44/45 now filter it (`boqItems()`), so `=SUM` subtotals match
     and the qty×rate formula no longer diverges.
  3. **Footing STRESS DIAGRAM mislabels** — distribution[0] was labelled
     "Max edge" but the engine trapezoid starts at pMin; corrected and the
     whole sheet is now live (V/M/Bw/Bl/A/Sx retrieved from sheet 9 service
     case; p = V/A ± M/Sx; 7-point interpolation + IF status by formula).
  4–6. Stale-cache cells (D68), empty-target refs B84/B85 fixed by the anchor
     corrections above.
- Sheets 6 CROSS SECTION & 7 Bed Slope fully linked (depth/Δ/mean/strip/
  totals; local + overall slope; fallback profile) with HFL/bed/slope input
  cells. HYDRAULICS Critical-Levels heights now formula-linked. Sheet 5 deck
  anchorage: volume inputs added, volume & "Anchorage required" now formulas.
- Waterway-definition blocker handled per plan B: legacy afflux chain
  extracted to `computeLegacyAffluxChain()`; sheet 9 gains section D
  "RECONCILIATION — DWL vs legacy AFL" live delta cell; DWL stays a
  deliberate input until engineering fixes one definition.
- Workbook totals: **465 formulas / 163 cross-sheet refs / 764 same-sheet
  refs / 0 broken / 0 divergences** (from 370/152 at end of turn 5).
- Regression: tsc 0; integrity 3/3; golden 46/46; hydraulics OK; narrative
  depth OK; `test-output/design-workbook.xlsx` regenerated (69.5 KB).

### DUE (unchanged decisions for user)
- Pick the contractual effective-waterway definition (spans×span vs legacy
  screening width) → then sheet 9 DWL can link to sheet 3.
- SSR/DSR rates, IRC impact-factor config, engine decoupling for
  client/api/netlify quarantine, licensed-engineer sign-off.

## Turn 7 — 2026-10-04 ("AUTO MODE MEANS I PERMIT TO RUN ACCEPTING ALLOW ONCE FOR ALL SIMILAR CASES")

Blanket auto-approval confirmed, so this turn ran the bug sweep end to end without
re-asking. All work is local file edits plus test runs; nothing committed.

### DONE
- **`POST /api/design/calculate` test failure was a harness bug, not an engine bug.**
  A direct probe proved the route returns 200 with a 68 KB workbook; superagent left
  the xlsx body un-parsed, so `res.body.length` was always falsy. The test now
  buffers the binary and additionally asserts the `PK` zip signature
  (`tests/integration/api-calculate.test.ts`). All 5 tests pass; the earlier
  `ZodError spanLength` line in the log came from the deliberate bad-input test.
- **Link auditor upgraded from arithmetic-only to a real Excel mini-interpreter**
  (`scripts/verify-workbook-links.ts`): IF/AND/OR/MAX/MIN/SUM/ABS/POWER/SQRT/TAN/PI,
  `<>`→`!=`, Excel `=`→`==`, ranges (`SUM(C4:C9)`, cross-sheet ranges), text operands,
  blank-cell-equals-zero semantics, and `A--B` sign collision. It now re-executes
  **every** formula, including the SAFE/UNSAFE verdicts, instead of skipping them.
- **Auditor now runs across all 20 Phase-1 templates** (cross-section lengths 5..16)
  rather than one golden input, so anchor drift that depends on data shape is caught:
  `larathi-stabil` 582 formulas → 0 broken / 0 divergences; all 20 workbooks clean.
- **Bugs found by the widened auditor and fixed:**
  1. `LL-ABSTRACT` H6 cached the live-load reaction *without* impact although its
     own formula is `MAX(loadsumm!C13,C14,C15,C17)` (Class A governs, ×1.5) —
     cached value and formula disagreed by exactly 50 %. K6 (MT→kN) followed.
     Now cached = governing reaction incl. impact (400 kN → 61.162 MT → 611.62 kN),
     matching `loadsumm` C17.
  2. `Bed Slope` local/overall slope cells cached 1-decimal values (4.3, 6.2) while
     their formulas compute 4.3478, 6.25 — the displayed number contradicted the
     formula. Caches now carry full precision and rounding moved to the cell number
     format (`0.0`).
  3. Four cross-sheet references to `loadsumm` (lowercase) were invisible to the
     old reference regex, so they had never been validated; they now resolve
     case-insensitively (cross refs 163 → 167) and re-execute.
- **Permanent regeneration command for the review deliverables**
  (`scripts/regenerate-test-output.ts`): writes the six files in `test-output/`
  — workbook 69.5 KB, sheet-book 66 pages / 30 landscape, comprehensive 4.5 MB,
  short report 13 pages, HTML report, IRC checklist. HTML has 0 NaN/undefined;
  the only long decimals left are invisible SVG path coordinates.
- **Regression**: `tsc --noEmit` clean (root + scripts), 12/12 integration lanes
  green (71 tests), 46-sheet golden contract OK, engine golden (`scripts/src/verify-golden.ts`,
  must be run from the `scripts/` package because it resolves paths relative to cwd)
  passes with the tamper check, 26/26 eleven-design smoke.

### DUE
- Sheet 9 DWL link still waits on the effective-waterway decision (unchanged).
- The mini-interpreter deliberately refuses unknown functions; those cells are
  printed as unaudited rather than passed — currently none.
- Engine-side: SSR/DSR rates, IRC impact-factor configuration, engine decoupling
  for client/api/netlify quarantine, licensed-engineer sign-off.


---

## Turn 8 — 2026-10-04 (auto mode continued: read-side cache loss + cost-model bugs)

Auto-approval still in force, so this turn ran straight through: sweep → fix → re-prove.
No commit made.

### DONE
- **Async-sink sweep finished.** Every `generateHTMLDesignReport` call site in the live
  tree now awaits (the three artifact scripts fixed last turn were re-run to proof:
  `run-eleven-full-artifacts` → **26/26 generated**, `run-fifteen-random-full-artifacts`
  → **15/15 generated**, both exit 0). A tree-wide scan found no remaining
  write-FileSync-receives-Promise case; `generateIrcChecklistHTML` is correctly sync.
- **New permanent auditor `scripts/verify-workbook-value-sanity.ts`** — scans every cell
  of all 20 template workbooks (48,234 cells / 9,118 formulas) for non-finite numbers,
  leaked placeholder text (`undefined`, `[object Object]`, cached `#REF!`) and formulas
  with no cached value. Final state: **0 defects**.
- **Bug 10 — cached zeros were invisible to every reader.** ExcelJS rebuilds formula
  cells through `_copyModel`, whose `if (value)` guard drops falsy keys, so a legitimately
  cached `0` (or `FALSE`) disappears from `cell.value`/`cell.text` even though the .xlsx
  stores `<v>0</v>`. Effect: LLOAD live-load rows, Abstract/General Abs. excavation &
  backfill rows, HYDRAULICS/CROSS SECTION clearance rows rendered as the **raw formula
  string** in the HTML report, sheet-book and comprehensive PDF. Added
  `readCellValue()` (`bridge-excel-generator/utils.ts`) which recovers the true cached
  value from `cell.model`, and routed the preview renderer plus both workbook auditors
  through it. Verified: LLOAD now prints `0`, and no `=IF(`/`='SHEET'!` text leaks into
  `design-report.html`.
- **Bug 11 — earthwork was billed at zero for every bridge.**
  `calculateDetailedEstimation` used `foundationLevel − bedLevel + 1` as excavation depth.
  A footing always sits *below* the bed, so the value was negative and the `Math.max(0, …)`
  clamp turned it into 0 m³ — and backfill with it. Corrected to
  `bedLevel − foundationLevel + 1`, matching sheet 08's "Embedment below bed" row.
  Kherwara now estimates 826.25 m³ excavation (₹2,06,562.50) and 330.50 m³ backfill.
- **Bug 12 — BOQ unit mismatch on the wearing coat.** Quantity was
  `length × width × 0.05` (a volume) while the BOQ unit and the rate card (R-13, ₹1200/m²
  for a 75 mm coat) are per **m²**, understating that line ~20×. Quantity is now the
  carriageway area: 720 m² → ₹8,64,000; grand total 8,900,620 + 18 % GST = ₹1,05,02,731.60,
  and the item sum, subtotal, GST and grand total reconcile exactly.
- **Bug 13 — one input, five different defaults.** `deckSlabThickness` is optional, and
  each consumer guessed: 0.25 (reports, drawings, PDFs, BOQ), 0.35 (`svg-diagrams`),
  0.5 (`checklist-export`), 0.8 (sheet 5 deck anchorage), 0.83 (sheet 3 legacy afflux).
  `calculateDeckAnchorage` even contradicted itself — deck weight from a hardcoded 0.25
  while the soffit used the input value. Added
  `DEFAULT_DECK_SLAB_THICKNESS_M` / `deckSlabThicknessOf()` in `input-contract.ts` and
  converted all 14 fallback sites to it.
- **Bug 14 — `{ quiet: true }` was ignored.** Ten-plus callers pass it to
  `calculateCompleteDesign`, whose signature accepted no options argument at all, so every
  batch/verifier run printed engine progress. The option is now honoured (module-level
  quiet flag with save/restore around the run).
- **Self-inflicted bug caught by the gate:** the import rewrite wrote
  `'./input-contract'` from files inside `sheets/`, which crashed workbook generation with
  `MODULE_NOT_FOUND`. Corrected to `'../input-contract'`; full gate re-run afterwards.
- **Static proof of the cache contract:** all 71 `setCellFormula(...)` call sites in the
  live tree pass a cached result — none rely on Excel recalculation alone.
- **Wired the verifiers into the main line:** `pnpm run verify:sheets | verify:links |
  verify:values | verify:costing`, aggregate `pnpm run verify` (exit 0) and
  `pnpm run deliverables`.
- **New guard `scripts/verify-estimation-consistency.ts`** locks in bugs 11 and 12
  (sub-bed foundation ⇒ non-zero excavation; wearing-coat quantity = area and unit = m²;
  every BOQ line amount = quantity × rate) and turns the hard-rock gap into a visible
  warning. Result: 20/20 templates, **0 defects / 3 warnings**.
- **Gate (all green):** tsc root 0 + scripts 0 · 12/12 integration lanes · golden 46/46 ·
  hydraulics fixtures OK · narrative depth OK · engine golden + tamper OK · design smoke
  26/26 · link audit 20/20 (0 broken / 0 divergences) · value sanity 0 defects ·
  estimation consistency 0 defects.
- **Deliverables regenerated and read back from the written files**:
  `design-workbook.xlsx` 69,529 B (46 sheets), `sheet-book.pdf` 1,611,071 B,
  `comprehensive-report.pdf` 4,528,404 B, `short-design-report.pdf` 202,744 B,
  `design-report.html` 274,553 B (0 NaN, 0 `undefined`, corrected totals present),
  `irc-checklist.html` 39,467 B.

### DUE (needs an engineering decision, deliberately not auto-fixed)
- **Hard-rock excavation split.** 3 templates set `hardRockAvailable: true`, yet the
  estimator books 100 % of the digging at the ordinary-soil rate (₹250/m²) with
  `hardRock: 0` (rock rate ₹800). The rule (full depth in rock? a core level? a %) is an
  engineering choice — the new verifier flags it as a warning so it cannot be forgotten.
- **Estimation assumption register** — undocumented constants still baked into the cost
  model: abutment band length `10 m`, steel ratios 80/60/50/100 kg/m³, backfill = 0.4 ×
  excavation, 2 bearings per pier, and the wearing-coat thickness assumed 50 mm in the
  anchorage load path while the rate card prices a 75 mm coat.
- Sheet 9 DWL link (effective-waterway definition, unchanged from turn 7).
- SSR/DSR rate register, IRC impact-factor configuration, engine decoupling before
  quarantining client/api/netlify, licensed-engineer sign-off on CHECK/UNSAFE verdicts.

## Turn 9 — 2026-10-04 ("MODIFY NOW >>>> ordinary soli now 80% rock 20% >>>>")

The hard-rock question was the one DUE item answered in that message, so only that rule was
implemented. No commit made.

### DONE
- **Bug 15 — earthwork priced the wrong material.** Implemented the decided split in
  `calculateDetailedEstimation` (`server/remote-app-adapter.ts`): new
  `EXCAVATION_ROCK_SHARE = 0.2`; where `hardRockAvailable` is set, 80 % of the dig bills at
  R-09 ₹250/m³ and 20 % at R-10 ₹800/m³, `costs.excavationHardRock` joins the total, and the
  BOQ gains an "Excavation in hard rock (20% share)" line (item numbers are now assigned
  after the list is built, so a non-rock BOQ still runs 1…9 + TOTAL). Non-rock projects are
  unchanged: zero rock, no rock row. `quantities.excavation.{ordinary,hardRock}` already
  flowed through `mapDetailedEstimationToEstimationResult`, so sheets 42–46, the PDFs and
  the HTML report needed no edit.
- **Guard upgraded from warning to failure.** `scripts/verify-estimation-consistency.ts`
  now asserts the 20 % share whenever the flag is set, that a non-rock project books no
  rock, and that the rock BOQ line carries the ₹800 rate; it also checks the BOQ lines add
  up to the reported subtotal (catches a cost line that never reached the abstract).
  Result: **20/20 templates, 0 defects, 0 warnings** (was 0 defects / 3 warnings).
- **Bug 16 — a report sentence that lied about the ground.** Sheet 3's IRC 78-1983 scour
  note asserted "hard rock is available in foundation so the foundation will be anchored in
  the rock" for *every* bridge, contradicting sheet 08 (which does read the flag). The note
  is now conditional on `hardRockAvailable`. Text-only change — no number moved.
- **Bug 17 — rupees printed as `8.9006e+6`.** The preview renderer's
  `≥1e6 ⇒ exponential` rule (`server/workbook-sheets-preview.ts:29`) reached the HTML
  report, sheet-book and comprehensive PDF, so the abstract showed
  `SUBTOTAL 8.9006e+6`. Numbers now group Indian-style (`en-IN`, ≤ 3 decimals) with
  scientific notation kept only below `0.0001`. Read back: `89,00,620` / `16,02,111.6` /
  `1,05,02,731.6`, 0 exponentials, 0 NaN/undefined.
- **Read-back proof from written files** (`sample/rock-check/*.xlsx`, 46 sheets each):
  - larathi-stabil — soil 925.43 m³ ₹2,31,357.50 + rock 231.36 m³ ₹1,85,086.00,
    share exactly 20.0 %, subtotal ₹1,72,51,658.25, GST ₹31,05,298.48, grand ₹2,03,56,956.73;
  - irc-gumaniya-udaipur — 501.60 + 125.40 m³ (20.0 %), subtotal ₹86,40,755, grand ₹1,01,96,090.90;
  - irc-kumbhalgarh-kelwara — 781.20 + 195.30 m³ (20.0 %), subtotal ₹1,70,76,105, grand ₹2,01,49,803.90;
  - kherwara-golden (control, no rock flag) — identical to turn 8: ₹89,00,620 + 18 % =
    ₹1,05,02,731.60, proving the change cannot move a non-rock estimate.
  `General Abs.` rows re-mirror the new item and its % of subtotal in both sheets.
- **Gate (all green, re-run after every edit):** tsc root 0 + scripts 0 · 12/12 integration
  lanes (70 tests, 0 fail) · `pnpm run verify` = golden 46/46 + link audit 20/20
  (`broken:0 diverge:0`, cross-refs 167 → 168 on rock templates because the extra abstract
  row is retrieved) + value sanity 48,264 cells / 9,127 formulas / 0 defects + costing
  20/20 0 defects · engine golden (`cd scripts && npx tsx src/verify-golden.ts`) 0 ·
  hydraulics + narrative-depth 0 · design smoke 26/26 · eleven-artifacts 26/26 twice.
- **Deliverables regenerated** after the fixes: `design-workbook.xlsx` 69,530 B,
  `sheet-book.pdf` 1,611,057 B, `comprehensive-report.pdf` 4,528,506 B,
  `short-design-report.pdf` 202,761 B, `design-report.html` 275,186 B, `irc-checklist.html` 39,671 B.
- **Docs:** `ACTION-PLAN.md` gains C15 ✅ and the OUT-OF-SCOPE list now names the two
  unconfirmed register items; `PRESENTATION-SPEC.md` gains §6 "Estimation and BOQ
  presentation" (row-driven items, material-named earthwork, flag-honest narrative) and the
  no-exponential money rule in §5.

### DUE (needs your confirmation — the two register items you restated were NOT marked MODIFY NOW)
- **Bearings per pier: code says 2, your register note says 3.** Cost-only change
  (₹25,000 × piers), applied on your word.
- **Wearing-coat thickness: load path uses 50 mm, rate card R-13 prices 75 mm.** Moving the
  anchorage load to 75 mm *adds* resisting weight, so SAFE/CHECK verdicts on the submersible
  cases can change — that needs the engineer sign-off run, not auto mode. Say the word and I
  will apply it and report every verdict that moves.
- Rest of the assumption register: abutment band 10 m, steel ratios 80/60/50/100 kg/m³,
  backfill = 0.4 × excavation.
- Sheet 9 DWL link (effective-waterway definition), SSR/DSR rate register, IRC
  impact-factor configuration, engine decoupling, licensed-engineer sign-off.
- The "Bug Investigation Scratchpad" (localhost:5000 routing/DB items) you pasted was treated
  as notes, not a request — say so if you want that lane investigated; the API lanes are all
  green here.

## Turn 10 — 2026-10-04 ("MODIFY NOW >>>> 6 Bearings/pier")

One decided item applied; the pasted "fully linked workbook / per-sheet audit" narration was
already delivered in turns 5–9, so it was re-proved rather than re-planned. No commit made.

### DONE
- **Bearings: 6 per pier.** `BEARINGS_PER_PIER = 6` in `server/remote-app-adapter.ts`
  replaces the hardcoded `numberOfPiers * 2`; the BOQ line, `costs.bearings`, the abstract
  and every downstream lane pick it up automatically. Guard added to
  `scripts/verify-estimation-consistency.ts`: BOQ bearings must equal piers × 6 —
  **20/20 templates pass** (kherwara/larathi 66 nos, single-pier kherka 6 nos).
- **Cost effect, read back from the regenerated files** (`scripts/test-output/`):
  Bearings 66 nos × ₹25,000 = ₹16,50,000 (was ₹5,50,000) ⇒ SUBTOTAL **₹1,00,00,620**,
  GST 18 % **₹18,00,111.60**, GRAND TOTAL **₹1,18,00,731.60**. The `Abstract` amount cells
  are still live `=D×E` formulas and the `General Abs.` amounts still retrieve
  `='Abstract'!F<row>`, so the new figure is auditable in the sheet.
- **Drawing left alone on purpose:** the DXF pier elevation draws one bearing pad per cap
  end (a sectional view, not a count). It does not contradict 6/pier, so it was not touched.
- **Per-sheet formula-vs-literal audit re-run on the written workbook** (one-off pass over
  `design-workbook.xlsx`, saved to `sample/per-sheet-formula-audit.log`): 465 formula cells
  vs 377 literal numeric cells across the 46 sheets; the dense calculation sheets are
  formula-led (sheet 9 56/46, sheet 10 47/0, sheet 21 43/12, sheet 23 25/0, sheet 31 32/0,
  sheet 33 25/0, sheet 44 21/0). Every remaining literal is a *stated input* — levels,
  geometry, SBC, load values — not a derived quantity. Nothing restructured.
- **Gate (all green):** tsc root 0 + scripts 0 · `pnpm run verify` = golden 46/46, link audit
  20/20 `broken:0 diverge:0`, value sanity 20/20 0 defects, costing 20/20 0 defects ·
  `pnpm run deliverables` 6/6 · eleven-case artifacts 26/26 · engine golden 0 ·
  narrative depth 0.
- **Docs:** `ACTION-PLAN.md` gains C16/C17 and closes the bearings item;
  `PRESENTATION-SPEC.md` §6 records the material-named earthwork and flag-honest narrative
  rules (turn 9).

### DUE (one register item still without your go-ahead)
- ~~**Wearing-coat thickness: anchorage loads use 50 mm, rate card R-13 prices 75 mm.**~~
  **CLOSED turn 11** — the load path now uses the same 75 mm through the single
  `WEARING_COAT_THICKNESS_M`; the verdict movement it caused is itemised under turn 12.
- Assumption register: abutment band 10 m, steel ratios 80/60/50/100 kg/m³,
  backfill = 0.4 × excavation.
- Sheet 9 DWL link (effective-waterway definition), SSR/DSR rate register, IRC
  impact-factor configuration, engine decoupling, licensed-engineer sign-off.

## Turn 11 — 2026-10-04 (BEDACH estimate enrichment + "ask me in lucid manner for decisions")

The real PWD detailed estimate `plus Detailed ESTIMATE HL Bridge BEDACH.xls` was dumped to
`sample/bedach-estimate-dump.txt` and mined for conventions. Four decisions were put to you in
plain language (GST vs departmental ladder, wearing-coat thickness in the load path, steel-ratio
basis, rock/soil split); you answered **[No preference] to all four**, so I decided each one and
recorded the reasoning here. No commit made.

### DONE
- **Rate register rebuilt from PWD BSR 2022 (Rajasthan)** — `bridge-excel-generator/material-rates.ts`:
  four depth-banded earthwork categories (ordinary soil up to 3 m, soil 3–6 m, soft rock without
  blasting, hard rock with blasting), location-specific concrete rates that **include formwork**,
  TMT priced per MT, wearing coat priced by volume at a 75 mm average.
- **Estimation engine reworked** — `calculateDetailedEstimation` in `server/remote-app-adapter.ts`
  now builds quantities as an audit trail of measurement rows (Nos / L / B / H / unit / rule applied)
  and each BOQ quantity is the **sum of its own rows**, so any rupee can be chased back to a
  dimension. Excavation is depth-banded; a hard-rock project books the top 1.5 m as soil
  (`ROCK_HEAD_DEPTH_BELOW_BED_M`) and the balance as rock.
- **PWD overhead ladder replaces GST** in every cost lane: 1 % quality control + 3 % contingency
  provision (booked nil) + 1.5 % contingencies → G.Total → 13 % prorata overheads & profit →
  Grand total → ₹ Lakh (`OVERHEAD_RATES`). Sheets 42/44/45, the PDF abstract, the HTML report and the
  client estimate page carry the same ladder with the note "GST is not added: this is a departmental
  (non-GST) abstract."
- **Sheet 46 'Bridge Measurements'** — grouped by BOQ item with section banners, BSR code,
  measurement-basis text, a live quantity formula per row (`=E*F*G*H`, plus plan and steel variants),
  a `=ROUND(SUM(...))` total per item and a `TIES / CHECK` cell against the Abstract row it belongs to.
- **Dead estimation shim archived** — `sheets/46-estimation.ts` (a stub encoding profit/GST offsets
  with no importers) moved to `archive/20261004-retired-estimation-shim/`.
- **A4 had never actually been applied**: ExcelJS serialises only `paperSize` and silently ignores
  `pageSize`, so `bridge-excel-generator/index.ts` now sets `paperSize: 9`. Read-back proves
  **46/46 sheets A4 with 15 mm margins**, 13 landscape per your tabulation.
- **Costing guard rewritten** — `scripts/verify-estimation-consistency.ts` now enforces nine rule
  families (band sums, band rates by BSR code, rock only when flagged, steel rows reproducing their
  own percentage product, coat billed as volume, amount = qty x rate, every rate present in the
  register, BOQ sum = subtotal, each BOQ quantity = sum of its measurement rows, ladder
  reconciliation, bearings, concrete grade buckets). **20/20 templates, 0 defects.**
- **Kherwara totals ₹1,61,19,000 (₹161.19 Lakh)** through the ladder — read back from the
  regenerated workbook rather than from in-memory engine numbers.

## Turn 12 — 2026-10-04 ("continue" — finish the verdict check, keep removing bugs)

Chasing "does the 75 mm coat move any verdict" exposed two deeper faults in the hydraulic/uplift
chain. Both are fixed, and the check that would have missed them is now a gate. No commit made.

### DONE
- **Negative-buoyancy bug in deck anchorage** (`calculateDeckAnchorage`). Submergence was
  `min(hfl − rtl + thk, thk)` with no floor, so wherever the deck soffit sits above the water level
  the model billed *negative* buoyancy, a negative factor of safety, and therefore **UNSAFE on all
  12 submersible templates** (Kherwara uplift −4,235 kN, FOS −2.05). Now
  `submerged = max(0, min(DWL − soffit, thk))`, DWL is the design level (afflux included) instead of
  raw HFL, and the division is guarded (`FOS = uplift > 0 ? R/U : 99`).
- **Verdicts that moved — 19 of 20 templates flipped false-UNSAFE to SAFE** with sane factors
  (larathi 4.15, kherwara 8.16, small 2.10, medium 1.73, bedach 7.26, jakham 5.98, t01 8.88,
  sukanaka-matoon 6.17, ayad 5.87, gumaniya 8.02, katumbi 5.95, every high-level 99 = dry).
  **`large-bridge` stays UNSAFE at FOS 1.11** — a real CHECK, not a sign error, so it is left flagged.
- **Hold-down bolts are no longer invented for dry decks**: the old `Math.max(numberOfBolts, 4)`
  floor proposed 4 bolts even where the deck is nowhere near water; the 4-bolt provision now applies
  only when the deck is actually submerged, and sizing uses the clamped net uplift.
- **Sheet 3 afflux was pairing two different cross-sections.** `a` came from a width x depth
  rectangle (361.6 m²) while `A` came from the surveyed section (141.5 m²), so `A/a` fell below 1 and
  Molesworth returned **−0.135 m for Kherwara** and up to **+15.85 m for small-bridge** (a flood
  level above the road level). `a` is now `=C46-B71` (surveyed area minus total obstruction) with the
  rule printed beside it. Afflux is sane and near the engine: kherwara −0.135 to **+0.775** (engine
  0.256), small-bridge 15.854 to **0.352** (engine 2.010), parwan 0.102 to 0.308 (engine 0.312).
- **Sheet 5 'Deck Anchorage' rebuilt as a live check** instead of a one-line screen. Block A keeps
  the bounding fully-submerged envelope; block B adds the design-water-level check with cross-sheet
  links (DWL from the pier stability sheet, velocity from HYDRAULICS), a clamped
  `=MAX(0,MIN(DWL−soffit,thk))` submergence, static buoyancy, hydrodynamic uplift, the four resisting
  terms, `=IF(uplift>0,resisting/uplift,99)` FOS, YES/NO hold-down and a Hence O.K./CHECK verdict.
  It mirrors the engine's high-level branch, so **sheet 5 FOS equals engine FOS on all 20 templates**.
  The label column was 8 characters wide against 40-character labels — widened — and per-unit number
  formats now render DWL as 100.856 instead of 100.8561406481468.
- **New gate `pnpm run verify:uplift`** (`scripts/verify-uplift-sanity.ts`): no negative uplift
  component, finite positive FOS, nil buoyancy when the soffit is at/above DWL, status follows the
  1.2 threshold, no bolts for dry decks, and sheet 5 tied to the engine. The `verify` aggregate is
  now five gates.
- **Root `npx tsc --noEmit` is a NO-OP** — root `tsconfig.json` is `"files": []` plus references to
  `lib/*`, so the flat tree (generator + adapter + PDF + scripts) had never been type checked. Added
  **`tsconfig.flat.json`** and wired `pnpm run typecheck:flat` into `pnpm run typecheck`; it found
  one real type error, now fixed in `scripts/verify-kherwara-excel-golden.ts`.
- **`pnpm run deliverables` wrote to the wrong folder**: `regenerate-test-output.ts` used
  `process.cwd()`, and pnpm runs it with `cwd=scripts`, so root `test-output/` kept stale files while
  a twin accumulated in `scripts/test-output/`. Output is now anchored to the repo root.
- **Gate (all green):** `pnpm run typecheck` (libs + flat + 3 workspace lanes) · `verify:sheets`
  46/46 · `verify:links` 20/20 `broken:0 diverge:0` · `verify:values` 63,159 cells / 11,911 formulas /
  **0 defects** · `verify:costing` 20/20 **0 defects** · `verify:uplift` 20/20 **0 defects** · engine
  golden passed · hydraulics fixtures OK · narrative depth OK · `deliverables` 6/6.
- **Read-back proof from the written `test-output/design-workbook.xlsx`**: sheet 3 `a` = 61.5 m²,
  h = +0.775 m, AFL/DWL 101.375; sheet 5 FOS 8.17 with `Hence O.K.` and hold-down `NO`; 46/46 A4 and
  15 mm, 13 landscape, 0 scientific-notation cells; the new sheet-5 rows also appear in
  `design-report.html`.

### DUE (needs you, not me)
- **large-bridge reads UNSAFE (FOS 1.11) on hydrodynamic uplift alone** — genuine review item.
- **Which water level governs?** Sheet 3 (surveyed section, 101.375) and the engine (spans x span
  rectangle, 100.856) still disagree; sheet 9 section D keeps the gap visible. Unifying them moves
  freeboard/scour and can change structural verdicts, so it is your call, not auto mode.
- **`zod` is imported by `input-contract.ts` but declared by no package.json** — it only resolves
  from a pnpm store copy. Declare it rather than relying on the store path.
- Sheet 9 DWL link, SSR/DSR rate register for unpriced grades, IRC impact-factor configuration,
  engine decoupling before quarantining client/api/netlify, licensed-engineer sign-off.

## Turn 13 — 2026-10-04 ("continue" — close the documentation, re-prove the gates, read the artifacts back)

No engineering decision changed this turn. It closes the paperwork the previous two turns owed,
re-runs every gate against the current tree, and reads the written deliverables instead of trusting
in-memory numbers. No commit made.

### DONE
- **`ACTION-PLAN.md` brought up to date**: Phase **E** (BEDACH PWD enrichment, steps E1–E5) added as a
  plan of record, plus status entries **C18–C23** (depth-head rock model, 75 mm coat closed in the
  load path, negative-buoyancy fix, sheet-3 section-pairing fix, sheet-5 rebuild, the
  `typecheck:flat` + deliverables-path holes). Phase D's regression recipe now lists **five gates**
  and warns that bare root `npx tsc --noEmit` is a no-op; the out-of-scope list gained the
  water-level decision, `large-bridge`, and the undeclared `zod` import, and closed the
  wearing-coat and rock-split items with strikethrough instead of deleting them.
- **`PRESENTATION-SPEC.md` brought up to date**: §5 now states the per-unit number-format contract
  (`m MSL`/`m`/`m/s` → `0.000`, `m²`/`m³` → `#,##0.000`, `kN` → `#,##0.00`), the label-column-width
  rule (`[4, 46, 4, 14, 12, 58, …]`), and case-matched verdict prose; §6 was rewritten from
  GST-era text to the **PWD BSR 2022 ladder** (1 % QC + 3 % provision nil + 1.5 % contingencies →
  G.Total → 13 % prorata OH&Profit → Grand total → ₹ Lakh, "GST is not added"), the four depth-banded
  earthwork rates (₹51 / ₹57 / ₹63 / ₹514 per m³ with the 1.5 m rock head and 1.0 m soft-rock band),
  coat billed by volume, and sheet 46's measurement trail; §4 marks sheet 5 as the two-block live
  check; §7 records the sheet-3 vs engine water-level gap as the open presentation gap and lists the
  closed items.
- **Stale DUE entry reconciled**: turn 10's "wearing-coat 50 vs 75 mm" item is struck through and
  points at C19/C20, so the register no longer claims a decision that was already taken.
- **Stray deliverable twin archived, not deleted**: the six files the old `process.cwd()` bug wrote
  into `scripts/test-output/` moved to `archive/20261004-stray-scripts-test-output/`.
- **Gates re-run against the current tree, all green**: `pnpm run typecheck` (libs + flat + 3
  workspace lanes, exit 0) · `verify:sheets` 46/46 · `verify:links` 20/20 `broken:0 diverge:0`
  (kherwara 604 formulas / 216 cross-sheet / 979 same-sheet refs re-executed) · `verify:values`
  20/20 `nonFinite:0 placeholder:0 missingResult:0` · `verify:costing` 20/20 **0 defects**
  (Kherwara ₹1,61,19,000 = ₹161.19 L, 826.3 m³ dig, 78.01 MT steel, 66 bearings) ·
  `verify:uplift` 20/20 **0 defects**. All twelve `tests/integration/*.test.ts` lanes re-run through
  tsx: **70 tests, `ℹ fail 0` in every lane** (api-calculate 5, api-d4-crud 13, api-drawings 17,
  api-health 4, api-pier-cases 4, api-reports 5, api-specialty 7, deploy-readiness 3,
  excel-integrity 3, report-integrity 1, security 4, zod-contract 4).
- **Read-back of the regenerated `test-output/` files** (not the generator's in-memory numbers):
  **46/46 sheets A4 (`paperSize: 9`), 46/46 with 15 mm margins on all four sides, 13 landscape**,
  **0 numbers rendered in scientific notation**; sheet 5 carries the live chain
  `='STABILITY CHECK FOR PIER'!B16` (DWL, fmt `0.000`), `=MAX(0,MIN(D16-D18,D8))` (submergence 0),
  `=HYDRAULICS!C21` (V = 1.718 m/s), `=D19*0.075*22` (coat 99 kN — the 75 mm coat, in the load path),
  `=IF(D24>0,D28/D24,99)` → **FOS 8.165**, hold-down `=IF(OR(D29<1.2,D20>0.1),"YES","NO")` → **NO**;
  sheet 3 row 72 is `a = C46-B71` → **61.5 m²**; `design-report.html` contains the new sheet-5 rows
  (FOS / hydrodynamic uplift / wearing coat / Hence O.K.). Six deliverables written, 46 sheets,
  output anchored to the repo root.
- **Read-back note worth knowing**: ExcelJS exposes page margins as `pageSetup.margins.{left,right,
  top,bottom}` — a checker that reads `pageSetup.margin` (singular) sees nothing and reports 46/46
  sheets as unformatted. The margins were always right; the probe was wrong.

### DUE (unchanged — needs you, not me)
- **large-bridge UNSAFE (FOS 1.11)** on hydrodynamic uplift alone; licensed-engineer sign-off on
  every CHECK/UNSAFE outcome.
- **Which water level governs** — sheet 3 surveyed section (AFL 101.375) vs engine `spans × span`
  (DWL 100.856); decides the sheet-9 DWL link and can move freeboard/scour verdicts.
- **Declare `zod`** in a package.json instead of resolving it from the pnpm store via
  `tsconfig.flat.json`'s `baseUrl`.
- SSR/DSR rate register for unpriced grades; IRC impact-factor configuration; estimation assumption
  register (abutment band 10 m, steel ratios 80/60/50/100 kg/m³, backfill = 0.4 × excavation);
  engine decoupling before quarantining client/api/netlify.

---

## Turn 14 — 2026-10-05 ("CODE-JUNCTION august-due.* apply fixes … indicate what is due and done")

The register was audited row by row against the working tree instead of against memory, and every
row that had gone stale was corrected. Fixes were applied where the register was right and the code
was not. No commit, no branch, no push.

### DONE — code, this turn
- **CURSOR-001 closed for real.** `server/api-routes.ts` now has **zero** `as any` (was 19): eight
  export-handler payloads narrowed to `EnhancedProjectInput`, eight SVG calls take the typed input
  directly, and the `rawBody.projectId` / `raw.model` probes read through `Record<string, unknown>`
  guards. `comprehensive-pdf-export.ts` 6 → 0 (BOQ `amount` and `cost.total` were already typed, the
  cast was decoration), `remote-app-adapter.ts` 3 → `Partial<CompleteDesignResult>`,
  `app-factory.ts` error middleware → `err: unknown`, `d4-routes.ts` → `Response`,
  `workbook-sheets-preview.ts` ExcelJS buffer cast now targets the parameter type with the reason
  written down. **One genuine bug surfaced** on the way: the slabdraw proxy spread an `unknown`
  payload (TS2698) and now merges it only when it is a plain object.
- **BEDACH-002 named.** The Molesworth blockage depth is `DECK_OBSTRUCTION_DEPTH_M = 0.83` with a
  comment saying it is an un-sourced legacy assumption, and the wrong "Deck slab thickness" note is
  gone. Regenerated deliverables came back **byte-identical** (79,337 / 2,127,466 / 221,055 B),
  proving the rename moved no number. The clause still needs an engineer.
- **§D-12 honoured.** `verdictFill()` paints UNSAFE/FAIL red and CHECK amber in the pier-stability
  and both abutment case tables. Read-back of the regenerated comprehensive PDF counts **25 red fill
  ops** (`0.91 0.3 0.24 rg`) against 13 green — failing checks are now visible without reading digits.
- **`/estimate` can download the report.** "Download complete report PDF" posts the stored input to
  `/api/design/pdf/comprehensive`; the BOQ handler and the new one share one `download()` helper,
  and the button state is `'excel' | 'pdf' | null` instead of a boolean. **Landing deliberately stays
  navigation-only** — it holds no project input, so a download there would either 400 or reuse
  another run's input. Decision recorded in §I rather than left as a blank row.
- **CI archives the evidence.** New `actions/upload-artifact@v4` step takes `tmp/pipeline/**` with
  `if: always()` (a half-finished bundle is what makes a failure reviewable), 30-day retention.
- **Typecheck lane widened where it can be.** `comprehensive-pdf-export.ts`,
  `landscape-pdf-export.ts` and `workbook-sheets-preview.ts` joined `tsconfig.flat.json`. The three
  server entry files could not: `express`, `cors`, `pino`, `pino-http` and `drizzle-zod` are declared
  by no package on the flat tree, which is now written into the tsconfig comment as the unblock.

### DONE — register (this is the "due vs done" deliverable)
- `august-due.md`: header re-dated; **new §F2** gives a per-ID disposition for all 18 section-F
  defects with evidence (17 DONE, BEDACH-002 PARTIAL); **new §J** records nine findings the register
  did not say; §A (wk 7/8/9/10), §B (day 0/3/5), §D (wk 7–13), §E (check/test/links/pipeline/
  artefact-upload), §G, §H, §I, SUMMARY and IMMEDIATE NEXT ACTIONS all corrected; 19,980 → 34,683 B.
- `CODE-JUNCTION/august-due.md` re-synced — `diff -q` now reports the two copies identical (they had
  diverged when only the header was edited).
- `BASELINE_MANIFEST.md` and `WEEK0_ACCEPTANCE.md` stand at the root as the Day 0 / Day 5 deliverables.

### GATES — re-run on the current tree, all green
`pnpm run check` exit 0 · `pnpm run test` **13/13 files** · `pnpm run verify` exit 0 (46/46 sheets,
**20/20 workbooks fully linked**, `nonFinite:0 placeholder:0 missingResult:0`, costing/uplift clean,
**Templates: 20 | defects: 0** for case diversity) · `pnpm run audit:policy` OK ·
`pnpm run pipeline --only=kherwara-golden,high-level-reference` exit 0 in **9.9 s** for both projects,
`manifest.json` with `failures: 0` · `pnpm run deliverables` rewrote the six `test-output/` files.

### DUE — new, structural (see §J)
1. **Declare `express`, `cors`, `pino`, `pino-http`, `drizzle-zod`, `zod`** in root `package.json` —
   until then `api-routes.ts`, `app-factory.ts` and `d4-routes.ts` stay outside any typecheck lane.
2. **`client/**` has no compile lane at all** — no `client/package.json`, no tsconfig, and `react`,
   `react-dom`, `zustand`, `wouter` are declared by *no* package in the repo. Every UI edit here is
   parse-verified only; either give the client a lane or finish the Week-0 quarantine.
3. **No gate asserts safety outcomes** — green gates and 15/15 UNSAFE can coexist.
4. **`vercel.json` / `netlify.toml` call scripts that do not exist through a rejected package manager.**
5. `evidence/release-candidate/`, `knowledge/`, assimilate `--report`, A2–A5 scripts, Dockerfile,
   `lib/log.ts`, HTML/PDF parity harness, narrative lint rule, Model A/B (cosmetic), dead `xlsx` scripts.

### DUE — unchanged, needs you not me
Sign-off on the moved verdicts (Kherwara TYPE1/C1 = SAFE/UNSAFE/UNSAFE/UNSAFE/SAFE, sliding
1.176 / 1.3998 / 0.9763, bearing 5.174; 19/20 templates 15/15 not SAFE; `large-bridge` uplift FOS 1.11) ·
governing water level (sheet 3 AFL 101.375 vs engine DWL 100.856) · Kherwara vs Kharka identity ·
two unreconciled afflux models · SSR/DSR rates · IRC impact factors · estimation assumption register.

---

## Turn 15 — 2026-10-05 ("test run the repo in browser")

First time this app was actually driven in a browser on this machine. It did not boot, then it booted
white-screened, then it ran — and each stage exposed a separate defect. All fixes are in the working
tree; **no commit, no branch, no push**.

### DONE — made the app run (all four blockers were independent)
- **K-1 Express 5 route syntax.** `server/vite.ts` mounted `app.use("*", …)` twice; `path-to-regexp` 8
  rejects a bare `"*"` (`PathError: Missing parameter name at index 1`), so the dev server exited before
  listening. Both rewritten as `app.use("/{*splat}", …)`.
- **K-2 Tailwind was never wired into the dev config.** `client/src/index.css` is Tailwind v4
  (`@import "tailwindcss"`); the production config had `@tailwindcss/vite`, the dev config did not, so
  `/suite/src/index.css` was served as `text/html` and the browser refused the module, leaving a blank
  page. Plugin added to `vite.config.ts`.
- **K-3 Windows native bindings were pruned.** `pnpm-workspace.yaml` excluded
  `@tailwindcss/oxide-win32-x64-msvc` and `lightningcss-win32-x64-msvc` (correct for the Linux CI image,
  fatal locally). Those two lines removed, arm64 still excluded, `tailwindcss@4.3.3` added to root
  devDependencies.
- **K-4 Two copies of React.** A stray `_npm_tmp_deps/` npm tree carried react **19.3.0** and five root
  packages (`@tanstack/react-query`, `html2canvas`, `wouter`, `xlsx`, `zustand`) were symlinked into it
  while Vite resolved react **19.1.0** elsewhere, giving `Invalid hook call` and a white screen. Packages
  declared properly at root, links rebuilt from the store, `.vite` cache cleared, and the tree
  **archived** to `archive/offline-workaround-2026-10-05/_npm_tmp_deps` (not deleted).

### DONE — crash-level engine defects the browser run exposed
- **K-5 ExcelJS defined names used a fictional API.** `bridge-excel-generator/utils.ts` called
  `definedNames.find(…)` and `add({name, formula, comment})`; ExcelJS 4.4 has neither (it is positional:
  `add(ref, name)`, `getRanges(name)`, `remove(ref, name)`, no name comments). Every workbook build threw
  `dn.find is not a function`, which 500'd `POST /api/design/workbook-previews` — the Design page's sheet
  panel. Rewritten, and because a re-`add` *extends* a name's range list, prior ranges are removed first
  so the names stay scalar.
- **K-6 Sheet protection never ran.** The code called `ws.protection.protect(…)`; the real API is
  `await ws.protect(password, options)`. Fixed and awaited. **Proven by reading the artefact back**, not
  by trusting the call: the delivered workbook went from **0 sheetProtection / 0 definedName** entries to
  **21 `sheetProtection sheet="1"` + 19 defined names**, 79,337 to 80,396 B.
- **K-7 `narrative-engine.ts` had lost a function signature.** The working-tree copy dropped
  `export function assertNarrativeHasNoPlaceholders(text, context) {` and its `NaN token` rule, leaving an
  orphan body: esbuild aborted the server at boot with
  `narrative-engine.ts:406:0: ERROR: Unexpected "}"`. Restored from HEAD; workbook/PDF/previews/HTML all
  regenerate 200 with the guard active.

### DONE — two data-contract rejections that blocked the UI
- **K-8 `verify:links` aborted at template 16/20.** `irc-parwan-highlevel` set `fy: 500` with no
  `steelGrade`, so the merge produced Fe415 + 500 MPa and the input contract refused it. Added an explicit
  `steelGrade: 'Fe500'`. The PARWAN source record states no bar grade, so the grade follows `fy` — **this
  is a sign-off item, not a decision the repo can make**. Links now **20/20 fully linked**.
- **K-9 OFL guard blocked the Excel button.** The Kherwara employer record legitimately carries
  **OFL = HFL = 100.6 m**; the guard demanded OFL strictly below HFL, so the Design page returned a Zod
  toast instead of a workbook. Relaxed to reject only `ofl > hfl`. Larathi's OFL moved 100.6 to 99.0 to
  agree with its own HFL; both level blocks are inherited, un-sourced data (the Larathi `.xls` is no
  longer in `Attached_Assets`) and stay sign-off items.

### DONE — UI correctness
- **K-10 16 nested-anchor hydration errors** (`In HTML, <a> cannot be a descendant of <a>`) in 8 files —
  wouter `<Link>` wrapped around a raw `<a>`. Every site rewritten so `<Link>` carries the class and owns
  the single anchor: `Navigation.tsx` (2, earlier), `AbutmentStability` 2, `FormulaEvaluator` 2,
  `AstraContextPanel` 2, `Estimate` 2, `Dashboard` 3, `MergeIntegration` 1, `InteractionDiagram` 2,
  `PierStability` 3. `document.querySelectorAll('a a')` now returns **0** on the pages re-checked. Also
  `Dashboard` quick-access pointed at `/narrative-report`, which is not a route, corrected to `/report`.

### WHAT THE RUN PROVED
All 17 routes render content with no error boundary, and the unknown-route fallback shows its own page.
In-page flows: `/api/design/calculate` 200 (xlsx 106 KB), `/pdf` 200, `/pdf/comprehensive` 200 (4.8 MB),
`/dxf` 200, `/report/html` 200, `/gad/csv` 200, `/workbook-previews` 200, `/detailed-estimation` 200,
`/optimise` 200, `/deck-anchorage` 200. "Compute Hydraulic Design" and "Compute Design" both replace
their empty states with full reports (Lacey regime, scour, afflux; slab loading/deflection/steel).
`Drawing` and `Estimate` populate after a design run, and BOQ money renders in `en-IN` grouping
(`2,81,63,126`) with no `e+6`. Gates: `pnpm run verify` **exit 0** (46/46 sheets, 20/20 linked, values,
costing, uplift, 20/20 case-diverse), `typecheck:libs` **exit 0**, `typecheck:flat` **exit 0**.

### NOT VERIFIED — stated as due, not as done
- **No pixel evidence.** The in-app browser has no visible surface; `take_screenshot` fails with
  `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE` (attempted twice). Evidence here is DOM + console + network.
  A4 / 15 mm / landscape policy is checked only as workbook/PDF setup values, never on a rendered page.
- **DB-backed endpoints return a deliberate 503** (`{"error":"Database not configured"}`): `/schema`,
  `/gad`, `/drawings`, `/detailed-abutment`, `/reinforcement`, `/checklist`. By design (asserted by
  `pbt-db-guard`), so those panels stay empty locally — not a regression, but untested with data.

### CORRECTION TO THE RECORD — there was no prompt injection
Turn 14's notes and this turn's early entries reported "a persistent injected instruction line telling
me the app is at `localhost:3000` and to take screenshots", flagged as a security concern. That was wrong
and is withdrawn. Auditing the session transcript for the phrase gives **140 hits in my own assistant
thinking blocks, 1 in the compaction summary, and 2 in tool results that were my own `grep` output
echoing the transcript**; the only instruction-like text ever returned by a tool is the
`take_screenshot` **schema description** from `mcp_get` ("Take a screenshot of the selected page…").
Nothing in tool output asked for anything. I misread my own recurring reasoning as an external attacker
and reported it as a finding — a false positive on exactly the kind of claim that should be verified
before being stated. Method recorded in memory: before flagging an injection, attribute the text by
transcript role rather than by recollection.

### DUE — unchanged, needs you not me
Sign-off on the moved verdicts (Kherwara TYPE1/C1 = SAFE/UNSAFE/UNSAFE/UNSAFE/SAFE, sliding
1.176 / 1.3998 / 0.9763, bearing 5.174; 19/20 templates 15/15 not SAFE; `large-bridge` uplift FOS 1.11) ·
governing water level (sheet 3 AFL 101.375 vs engine DWL 100.856) · Kherwara vs Kharka identity · two
unreconciled afflux models · **new this turn: PARWAN bar grade (Fe500 inferred from `fy`) and OFL = HFL
on the Kherwara/Larathi level block** · SSR/DSR rates · IRC impact factors · estimation assumptions.

### DUE — structural
Declare `react`/`react-dom` at root (they resolve only through `artifacts/mockup-sandbox`) and give
`client/**` a tsconfig + typecheck lane · add a stability-outcome gate so green does not mean safe ·
visual pass with a real screenshot surface.
## Turn 16 — 2026-10-05 ("take up due tasks and complete them one by one" — DUE-1: client typecheck lane)

Started walking the structural DUE list in order. DUE-1 is closed; nothing here changed a design number.

### DONE — DUE-1: `client/**` now has a compile lane
- **Root `package.json` declares the UI runtime.** `react` and `react-dom` were resolving at the root
  only through a hoist **symlink into `artifacts/mockup-sandbox/node_modules`** — the app ran because a
  sibling demo happened to depend on React, which is not a contract. Now declared from the workspace
  catalog (`react`/`react-dom` 19.1.0 — the catalog pins that exact version), plus `@types/react`
  19.2.17, `@types/react-dom` 19.2.3, `lucide-react`, `clsx`, `tailwind-merge`, `framer-motion`,
  `sonner`. `pnpm install --prefer-offline` → **exit 0**, all 9 packages linked at the root,
  `pnpm-lock.yaml` updated. (`--offline` alone fails: `ERR_PNPM_NO_OFFLINE_META` on `clsx`, the local
  metadata mirror has no entry for the new specifiers. Registry reachable, HTTP 200.)
- **New `tsconfig.client.json`** — `jsx: react-jsx`, DOM libs, `strictNullChecks` on, `noImplicitAny`
  off (matching the flat lane), `paths` mirroring `vite.config.ts` exactly (`@` → `client/src`,
  `@shared` → `shared`, `@assets` → `attached_assets`).
- **New script `typecheck:client`**, inserted into `typecheck` between the flat lane and the workspace
  lane, so `pnpm run check` **and therefore CI** (`ci.yml:33` already runs `pnpm run check`) now typecheck
  the browser app. No workflow edit needed.
- **Lane result: 0 errors over 106 files.** First run gave **6 errors, all `TS2345`**.
- **The bug the lane found on its first run** (`client/src/report-engine/exportUtils.ts:829`):
  `let chainages = []` infers `never[]`, so the three `chainages.push(...)` calls building the
  setting-out SMS chainage list were type errors. Fixed by `const chainages: string[] = []`. Runtime
  behaviour was already correct — `push` works regardless — so **no output number moves**; the value of
  the fix is that the next person who mis-uses the array is caught at compile time.
- **Dead duplicate retired**: `client/src/report-engine-weaver` is a near-clone of `report-engine`
  (`exportUtils.ts` 880 lines in both) with **zero importers anywhere** outside itself, while the live
  report pages (`BridgeSlabReport`/`HydraulicPage`/`SlabPage`, routed at `/report`, `/hydraulics`,
  `/slab-design`) import `@/report-engine/*`. Archived to `archive/20261005-retired-report-engine-weaver/`
  (52 files + a README giving the evidence and restore path) per the archive-don't-delete policy.
  `mv` was refused (Windows lock held by the running Vite watcher), so the copy was made first and
  verified at 51 files before the original was removed — nothing could be lost in between.

### KNOWN GAP this lane deliberately leaves
11 `*.test.ts(x)` files under `client/src` are excluded, because `vitest` and `fast-check` are imported
by them but declared by **no** package in the workspace and absent from the pnpm store, so an offline
install cannot supply them (and `minimumReleaseAge: 1440` would gate fresh ones). The reason and the
unblock step are written into the tsconfig header rather than left implicit.

### VERIFIED after the change
`pnpm run check` → **exit 0** (libs + flat + client + workspace lanes) · dev server survived the install
(PID 16148 still LISTENING on 5180, `/suite/` → 200) · re-navigated in the browser: `/suite/` and
`/suite/report` both load with **zero console errors/warnings**, so the edited `exportUtils.ts` and the
removed duplicate broke nothing that the app actually loads.

### NEXT in the queue
DUE-2 stability-outcome gate → DUE-3 narrative lint → DUE-4 HTML/PDF parity → DUE-5
`evidence/release-candidate/` → DUE-6 `vercel.json`/`netlify.toml` + quarantine decision → DUE-7 dead
`xlsx` importers / Model A-B.
## Turn 17 — 2026-10-05 ("take up due tasks… complete them one by one" — DUE-2 outcome gate, DUE-3 narrative lint)

Two structural DUE items closed. Approvals were pre-granted by the owner for this run, so nothing was
re-asked. No commit, no branch, no push.

### DONE — DUE-2: stability-outcome gate (`green` no longer reads as `safe`)
- New **`scripts/verify-stability-outcomes.ts`**, wired as `verify:outcomes` and appended to the root
  `verify` chain (**six gates → seven**).
- It asserts five things per load case: the member exists, the three factors of safety are finite and
  positive, `status` is SAFE or UNSAFE (never blank, never `CHECK`, which the engine cannot emit),
  the status equals the threshold rule **re-derived from that case's own numbers**, and the generated
  workbook's stability sheet renders the same verdict for the same case in the same order — read back
  out of the file, not from the generator's own arrays.
- **A UNSAFE verdict does not fail the build.** That is deliberate and is written into the file header:
  failing CI on an engineering outcome trains people to delete the gate. Exit code answers *is the
  machinery telling the truth*; the tally answers *what the truth is*, printed in the same run and
  written to `evidence/stability-outcomes.json`.
- **First run found two real things.** (a) My own first version mishandled ExcelJS's
  `{formula, result}` value object and reported every sheet verdict as `[object Object]` — fixed by
  unwrapping `.result` the way the other gates do. (b) Substantively: the **C1 (cantilever abutment)
  stability sheet had no verdict of its own** — its Status cell was `='TYPE1-STABILITY CHECK
  ABUTMENT'!I{row}`, i.e. it restated Type-1's conclusion instead of applying the rule at the place
  the engineer reads it. Verified first that the two abutments genuinely agree today
  (`tmp-abcheck`: **0 divergences across 20 templates × 5 cases**), then changed the cell to derive
  locally from its own row: `=IF(AND(C>=1.5,D>=1.8,E>=2.5),"SAFE","UNSAFE")`, FOS still live-linked
  from the shared Type-1 model. Same verdicts, visible rule, and the sheet stops being able to inherit
  a wrong answer if C1 ever takes its own geometry. The gate now also flags a verdict that is *copied
  or hard-coded* rather than derived.
- **THE HEADLINE, now impossible to miss:** 300 load cases across 20 templates →
  **SAFE 4, UNSAFE 296; 20 of 20 templates carry at least one UNSAFE case.**
  Attribution (reporting only, no threshold touched): sliding < 1.5 → 106, overturning < 1.8 → 82,
  bearing < 2.5 → **218**; **190 cases fail bearing ALONE, and 184 of those would pass the commoner
  "pressure ≤ SBC" reading (a factor of 1.0)**. In other words most of this wall of UNSAFE is one
  project-chosen number — the 2.5 bearing factor — not 190 separate structural emergencies. That is
  an engineering decision for the signing engineer; the gate only states it, with the count.
- `pnpm run verify` → **exit 0 on all seven gates** after the C1 change, including the link gate's
  formula re-evaluation: `diverge:0` on all 20 workbooks, `20/20 fully linked`.

### DONE — DUE-3: narrative lint (hard-coded numbers in prose)
- New **`scripts/lint-narrative-no-hardcoded-numbers.ts`**, wired as `lint:narrative` and put inside
  `pnpm run check`, so **CI enforces it** (`ci.yml:33` already runs `check`).
- It scans the two prose-producing sources (`lib/narrative/src/**`,
  `bridge-excel-generator/narrative-engine.ts`), walks string and template literals while skipping
  `${…}` bodies (those are the engine's values and must contain numbers), and rejects a digit that
  behaves like **data**: decimal place, attached unit, or next to `= > < ≥ ≤ × /`. A bare integer in
  "Step 2", chapter "4 —", or the abutment called Type 1 is enumeration, not a result, so it is left
  alone — 49 naive hits narrowed to 4 real ones. Explicit allowlist with reasons written in: code
  citations, `mm2/mm3/mm4` units, the "1 in N" slope idiom, spreadsheet cell references like
  `Factors!B2`, locale/format tokens. If the scanner ever finds no prose at all it **fails loudly**
  rather than passing vacuously.
- **The 4 real violations, fixed at the root rather than silenced:**
  - `narrative-engine.ts:309` said "Compare against Sliding >= 1.50, Overturning >= 1.80, Bearing >=
    2.50" — three thresholds typed into a sentence, so the report could outlive a change to the rule.
  - `narrative-engine.ts:165` said "Pa acts at approximately **H/3** above base" while the engine
    computes `earthPressure.location`. Now states the computed figure in metres and keeps the
    triangular-pressure convention in words instead of digits.
- **Structural fix behind that**: added exported **`STABILITY_ACCEPTANCE`** (`slidingFosMin 1.5`,
  `overturningFosMin 1.8`, `bearingFosMin 2.5`) in `design-engine.ts`, with the doc note that the 2.5
  bearing factor is *this project's own conservatism* (QA checklist rows D3–D5), not a literal IRC
  clause, and that changing it flips verdicts and is therefore an engineer's decision. Both engine
  status rules, the narrative, and the new gate now read those constants instead of each carrying
  their own copy.
- **Proof no number moved**: re-ran `verify:outcomes` after the refactor — identical tally
  (SAFE 4 / UNSAFE 296; 106 / 82 / 218 by check; defects 0). `pnpm run check` → **exit 0** with the
  lint reporting **154 prose spans, no hard-coded quantities**.
- ⚠️ **Consequence for deliverables:** two narrative sentences changed wording, so the regenerated
  test-output artefacts will differ in prose (not in figures). Regeneration is queued with the
  remaining DUE items.

### Register items touched
`august-due.md` HIGH #3 ("no gate asserts safety outcomes") and MEDIUM #13 ("narrative lint rule") are
now implemented; both are pending the register rewrite at the end of this batch so the wording, the
evidence and the moved-number audit go in together.

---

## Turn 18 — 2026-10-05 · DUE-4: HTML/PDF parity gate (`take up due tasks and complete them one by one`)

**Directive in force:** "take up due tasks and complete them one by one", with the standing "presume my
responce as allow once for all 100 prompts". No permission was sought mid-batch; nothing was committed.

**What was built.** `scripts/verify-html-pdf-parity.ts` — the 8th gate (`pnpm run verify:parity`, inside
`pnpm run verify`, therefore in CI). It renders the browser report (`server/design-report.ts`) and the
signed comprehensive PDF (`server/comprehensive-pdf-export.ts`) for the same design, extracts the text of
both, reads eleven labelled quantities at each label, and requires the two formats to print the same set
of numbers. Flags: `--all` (20 templates), `--only=id1,id2`, `--survey` (show readings, judge nothing),
`--dump=DIR` (write extracted text + unstripped HTML for tracing a suspicious reading).

**Three false alarms the harness had to be corrected for, each documented in the file:**
1. PDF text extraction initially joined every string operand on a page into one blob, so no label sat
   beside its own value. Rewritten to walk the content stream as a command tape and break lines at the
   text-position operators (`Td`, `TD`, `T*`, `Tm`, `BT`, `ET`).
2. The PDF embeds drawings as SVG source. That is not typeset PDF text; XML streams are now skipped.
3. Matching values by `toFixed` reported a divergence between 0.4475 (browser) and 0.447 (PDF) — the same
   number, two rounding directions. The rule is now half of one unit in the last displayed digit of the
   shorter printing, which still rejects 100.856 against 101.375.

**Real defect found and fixed (§L-6).** Sweeping all 20 templates, `small-bridge` and `large-bridge`
could not produce an HTML report at all: `assertValidProjectInput` threw
`ZodError { path: ['hydraulics','freeboard'], message: 'Number must be greater than or equal to 0' }`.
`freeboard = soffit − design water level`, and for a deck designed to overtop it is legitimately negative
(soffit 283.25 m against DWL 284.010 m). `bridge-excel-generator/input-contract.ts` now lets `freeboard`
and `freeboardAboveHfl` carry a sign; adequacy stays with `isFreeboardSafe`, and
`server/claude-validator.ts:299` already treated a negative value as a WARNING, so the contract was the
outlier. `test-output/` never exposed this because the deliverables script renders only the Kherwara
fixture — one reason the parity gate runs over every template, not one.

**New finding, deliberately NOT changed (§L-7, §M-3).** `shared/input-workbook-previews.ts:225-244`
prints `Approximate Velocity` 2.994 m/s and `Normal Scour Depth` 3.993 m from its own ad-hoc formulas,
against the engine's 1.718 m/s and d_sm 2.400 m, in a block that exists only in the PDF. Renaming or
deleting inherited employer-sheet content in a signed document is the engineer's call: registered, mean
scour depth excluded from the parity fact list with the reason in the header. Related: `Design discharge`
prints as both 902.15 and 243.11 cumecs in *both* formats (§M-4) — reported as a self-contradiction, not
a parity defect, which is why the gate separates the two classes of finding.

**Evidence.** `pnpm run verify` → exit 0 across eight gates (sheets 46/46, links 20/20, values, costing,
uplift, cases, outcomes 20 templates 0 defects, parity 2 projects 22 comparisons 0 divergences).
Full sweep: 20 projects, 220 comparisons, 0 divergences after the freeboard and matcher fixes.
`pnpm run check` → exit 0 (typecheck:libs, typecheck:flat, typecheck:client, artifacts/scripts lanes,
lint:narrative 154 spans). `test-output/` regenerated after the contract change.

**Register.** `august-due.md` — §D-6 narrative lint and §D-10 parity rows closed, new §L (7 findings) and
§M (4 sign-off questions: bearing factor 2.5 vs `pressure ≤ SBC`, governing water level, the PDF's legacy
hydraulics block, which discharge governs), HIGH #8/#9 and MEDIUM #13/#14 closed, next-actions 3/4 struck
and 4b added. `CODE-JUNCTION/august-due.md` re-synced byte-identical (54,174 B each).

---

## Turn 19 — 2026-10-05 · DUE-5, DUE-6, DUE-7: release bundle, deployment surface, Model A/B (`take up due tasks and complete them one by one`)

**Directive in force:** same as Turn 18, with "presume my responce as allow once for all 100 prompts". No
permission was sought mid-batch; nothing was committed, branched or pushed. Three register rows closed.

**DUE-5 — `evidence/release-candidate/`.** `scripts/build-release-candidate.ts` (`pnpm run candidate`) runs
`pnpm run check` and `pnpm run verify` itself rather than trusting an old transcript, captures both into
`gates/`, copies the six deliverables with SHA-256 and byte counts, and writes `manifest.json` +
`MANIFEST.md` (commit, dirty-tree flag, Node/pnpm versions, per-chain exits, artefact table). Two rules
were the point of the design: a red chain produces **no manifest** — it writes the captured output, names
the failing chain and exits non-zero — and the bundle says what it does **not** certify, because a
reviewer otherwise sees green exit codes next to a bridge the engine calls unsafe on 296 of 300 load
cases. §M's four sign-off questions are printed inside the bundle, tally taken from
`evidence/stability-outcomes.json`.

**DUE-6 — deployment configs and the half-done quarantine.** `netlify.toml` described a deployment that
never existed: `npm run build:netlify` (no such script), functions published from `netlify/functions/`
(no such directory), and npm for install, which the root `preinstall` rejects outright. `vercel.json` had
the same two npm problems and pointed at a nonexistent `build:vercel`. Vercel was repaired and the build
was **run**, not assumed — `pnpm install --frozen-lockfile` → `pnpm run build:vercel` → `vite build` →
`dist/public/index.html` + 16 hashed chunks. Netlify's config was **archived** with a README stating what
a working path needs (the missing event→Express adapter) and how to restore it. Nothing was deleted.
Quarantine question decided: `client/` and `api/` **stay live** — the §K browser run boots 17 routes and
serves every artefact type from `client/`, and `api/index.ts` is the entry the corrected `vercel.json`
calls. What the half-done quarantine actually left behind was the dead 51-file report-engine clone (§L-1).

**DUE-7 — Model A/B removed, not implemented.** Verified bottom-up before touching anything:
`generateCompleteExcel()` ignored `options.model`; no client body sent `model` except
`POST /api/design/calculate`, which discarded it; `model-selection.ts` helpers had zero callers; the only
module holding two real engines (the SheetJS Model A track in `client/src/report-engine/exportUtils.ts`)
was not imported by any page. **A toggle that cannot move a number is a defect in a calculation product.**
Deleted `useModelStore`, `ModelSwitcher`, `model-selection.ts` → archived with a README holding the four
decision reasons, the edited call sites and the restore path. UI swept: `Navigation.tsx` keeps a theme
button only, `Design.tsx` loses the Model Selection card, `Dashboard.tsx` loses the switcher + "Active
Model" card + banner (metric strip 10 cards → 9), `MergeIntegration.tsx` and `Landing.tsx` lose the
selector. `exportUtils.ts` is now single-track: 262 lines of Model A deleted, `generateExcelModelB`
renamed to `generateExcelWorkbook`, filename `_ModelB_StylePerfect.xlsx` → `_ReportEngine.xlsx`.
Numbers that moved: none in any deliverable. Two cosmetic client figures: the Dashboard strip card count,
and Landing's four radar bars, keyed to `activeModel`, fixed at Model A's published 94/96/91/89.

**DUE-7 — J-8's premise was false, and the real cause was worse.** The register asserted four scripts
"import `xlsx`, which is not installed". `xlsx@0.18.5` is declared in the root `package.json` and in
`pnpm-lock.yaml`; `scripts/` resolves it through pnpm's hoisted store. The scripts were failing to open
their **reference workbook**: the paths pointed at `Attached_Assets/…` and a
`REMOTE_APP/attached_assets/FINAL_RESULT.xls` that has never existed in this repository, and the file at
the old location was a **132-byte Git LFS pointer stub** — which SheetJS parses as a 1-sheet / 4-cell
workbook instead of erroring. Silent wrong data. Re-pointed `workbook-standards-config.ts` (LARATHI
resolves first at `assets/E_DRIVE_BRIDGE_DESIGN/KHERWARA BRIDGE II/…`, historical path kept as fallback;
the fictional REMOTE_APP entries deleted; `final-result-46` now states the template is absent because the
46-sheet contract is generated with `book: 'legacy-46'`), and added `scripts/read-office-workbook.ts`:
`assertNotLfsPointer()` fails with the file name and the exact `git lfs pull --include="<path>"` command.
`git lfs pull` on the LARATHI file took it 132 B → 1,102,336 B and the reader went from 1 sheet / 4 cells
to **25 sheets / 7,538 non-empty cells**; `git status` still reports the path unmodified, so the pre-existing
staged state was not disturbed. **1,876 of the 2,080 files under `assets/` are still pointer stubs** —
this is now recorded as the blocking prerequisite for the A2–A5 assimilation stage.

**Defect found only in the browser.** Console on `/design`: `<polyline> attribute points: Expected number,
"52.0,97.7 \`76.4,95.7 …"`. `client/src/components/BackwaterCurvePanel.tsx:129` joined the critical-depth
point list with `` ' \`' `` instead of `' '`, so the amber **Yc curve never drew** on the backwater profile.
Fixed; re-verified with `evaluate_script` (2 polylines, both point lists fully numeric, no console errors).
Eight gates cannot see this class of defect — SVG attribute validity is runtime-only.

**Tooling notes for future turns.** The Edit tool fails on this repo's box-drawing/em-dash comment headers
(byte mojibake between read and write) — for those regions rewrite with a script that preserves the BOM.
An earlier script truncated a block comment one line wrong and produced `TS1010: '*/' expected`; the fix
was to detect the last unclosed opener rather than match on `/*`. Bash stdout is still dropped regularly
("bash output unavailable"), so every probe redirects to `tmp-*.txt` and is read back.

**Evidence.** `pnpm run check` exit 0 (typecheck:libs / flat / client, artifacts + scripts lanes,
lint:narrative). `pnpm run verify` exit 0 across all **eight** gates. `pnpm run build:client` exit 0.
Browser snapshots of `/merge`, `/dashboard`, `/design`, `/` — no model UI anywhere, no error overlay;
`grep` over `client/src` for `useModelStore|ModelSwitcher|activeModel|model-selection|generateExcelModel[AB]`
returns nothing outside `archive/`. The 503 on `/api/stats/summary` is the database offline in dev
(pre-existing, §K), not a regression from this batch. No delivered number moved, so `test-output/` was
not regenerated.

**Register.** `august-due.md` — new §O (7 rows: removal, moved/unmoved numbers, J-8's corrected root
cause, the pointer guard, the polyline fix, the doc corrections, gate evidence), J-7 and J-8 closed,
KERO-001 / LOVABLE-002 / CURSOR-001 residuals re-worded so they no longer assert a Model A/B chip or an
uninstalled package, SUMMARY row 15 struck, BLOCKING #4 gained the LFS prerequisite, next-actions 5b/7/8
updated, and the count corrected to 1,876 stubs of 2,080. `README.md` and
`docs/implementation-reality-check.md` no longer credit `REMOTE_APP/…FINAL_RESULT.xls`; README gained a
Git LFS paragraph. `CODE-JUNCTION/august-due.md` re-synced byte-identical (66,766 B each).
**Still DUE:** engineer sign-off (`engineering/review/` empty), Kherwara/Kharka identity, governing water
level, the assimilation scripts A2–A5 (+ `git lfs pull` first), `assimilate --report`, `Dockerfile` +
`lib/log.ts`, engine decoupling (J-5), and a real visual pass for the A4/15 mm/landscape policy.
---

## Turn 20 — 2026-10-06 · DUE-8: a real typecheck lane for the root tooling (`take up due tasks and complete them one by one`)

**What moved.** DUE-7 ended with a standing rule: refresh `evidence/release-candidate/` whenever tracked
code moves. The first execution of that rule failed. `pnpm run candidate` exited 1 with no stdout; run
through `execFileSync` to capture the error it was `TypeError: Cannot read properties of undefined
(reading 'split')` at `scripts/build-release-candidate.ts:128`, and after that fix the same error again at
`:161`. Both lines read `g.cmd` while the manifest gates are built as `{ command, exit }` — and both sit on
code paths that only execute when a bundle is actually assembled, which is why every dry reading of that
file looked correct. Fixed at both sites; the rebuilt bundle now writes the gate table properly.

**Why a typo survived, which was the real finding.** It could not be caught, because nothing compiles
those files. `scripts/tsconfig.json` is `"include": ["src"]` with `rootDir: src`, and `tsconfig.flat.json`
reaches root-level scripts only through the glob `scripts/verify-*.ts`. So **39 of the 46 root-level
`scripts/*.ts` were typechecked by nothing** — including the release bundler and the narrative linter,
both of which run inside `check` and `candidate`. This is the same diagnosis as §J-2 ("green gates prove
nothing about the code they skip"), on the tooling side of the repo.

**The lane.** `scripts/tsconfig.tools.json` (extends `tsconfig.flat.json`; includes `*.ts` +
`phase-zero/*.ts`) plus `pnpm run typecheck:tools`, inserted into the `typecheck` chain so it runs inside
`check` and CI. First attempt extended `tsconfig.base.json` instead and reported 24 errors, most of them
`noImplicitAny` noise on scripts written for `tsx`; switching to the flat config's options isolated **15
real errors**. No exclusion lists: `tsconfig.flat.json`'s header already says the fix for a broken file is
to fix the file.

**What the lane found beyond the crash — four more latent defects, all in tools the pipeline uses.**
1. `lint-narrative-no-hardcoded-numbers.ts` declared `skipTemplateBody(start): number` while returning the
   template **string**; its two callers then called `.trim()` and `.length` on a `number`.
2. `run-five-samples-workbook-label-match.ts` and 3. `test-storytelling.ts` passed Node 24's
   `Buffer<ArrayBufferLike>` into ExcelJS's pre-generic `Buffer` — bridged once per file with a commented
   `Uint8Array` binding.
4. `test-storytelling.ts` also called `row.values.map(...)` where ExcelJS types `row.values` as a union of
   an array getter and a `(begin,end)` method; now normalised through an explicit union test.

And the one that mattered most: **`stress-test-251-users.ts` recorded
`pier_max_moment: results.pier?.maxMoment ?? 0` — `PierDesignResult` has no `maxMoment` field**, so all
251 load-test payloads logged a pier moment of 0. It is now the worst of the pier load cases
(`Math.max(0, …loadCases.map(c => c.moment))`), which is what the field was always meant to hold. That
script is invoked by `scripts/qa-ultra-strict.ts`, so this was a QA number, not cosmetics.

**Two undeclared imports, handled without hiding them.** `export-sample-output-bundle.ts` imports `sharp`
and `phase-zero/extract-word.ts` imports `word-extractor`; neither package is declared by any
`package.json` in this repo or present in the store, so neither script can run. They stay **inside** the
lane with a targeted `@ts-expect-error` naming §P-3 on the import line — declaring a package turns its
marker "unused" and fails the lane, which is the deliberate signal to delete the marker. They were not
silently installed: `sharp` is a native binary and the repo pins `minimumReleaseAge: 1440`.

**Three scripts archived, not deleted.** `debug-ctx.ts`, `debug-wind.ts`, `test-narratives-output.ts`
import `bridge-excel-generator/prose/…` and `…/fixtures/kherwara-design` — a module layer that no longer
exists (narratives live in `bridge-excel-generator/narrative-engine.ts` now). Zero references from any
script, gate, doc or workflow, so they moved to
`archive/20261006-root-scripts-importing-removed-prose-layer/` with a README giving the repair path.

**LFS census, now repo-wide and in two scopes** (§P-6). Tracked binary assets: 1,659 total, **1,529 still
pointer stubs**, 17 materialised, 113 absent from the worktree (the pre-existing `Attached_Assets/**` and
`sheets-extracted/**` deletions this register deliberately does not touch); stubs by directory —
`assets/` 1,400, `Attached_Assets/` 68, `sample/` 60, root 1. Files actually on disk: `assets/` 1,876
stubs of 2,080; `Attached_Assets/` 710 of 715. §O-4's single-scope figure understated this.

**§J-9 was half wrong, and is corrected.** `pnpm run assets:inventory` is not a stub and not even
TypeScript — it runs `python scripts/assimilate/inventory.py`, exited 0, and replaced a 985-byte file with
a **46,396-byte register of 97 Office/CAD assets** (49 `workbook-legacy`, 32 `drawing-cad`, 14 `workbook`,
2 `workbook-macro`, sha256 per file). Reading each indexed file back showed **96 of 97 are LFS pointers**:
the register is honest, the corpus behind it is empty. 93 of 97 still say `projectHint: "unassigned"`. So
**A1 is done**; A2–A5 need `git lfs pull` first.

**Tooling notes for future turns.** Bash stdout was dropped again for the candidate run, so the exit code
went to `tmp-due8-candexit.txt` and was read back. Inline `node -e` with a regex containing backslashes got
mangled by shell escaping (`SyntaxError: missing ) after argument list`) — write the probe as a `.mjs`
file instead of quoting it. Editing the register by script (BOM-preserving) remains the reliable path
around the box-drawing/em-dash mojibake that breaks the Edit tool in this repo.

**Evidence.** `pnpm run check` **exit 0** with the new step in it (43 root files compiled,
`pnpm run typecheck:tools` exit 0 on its own after the stale exclude entry was trimmed). `pnpm run
candidate` **exit 0**; `MANIFEST.md` shows `| \`pnpm run check\` | 0 | gates/check.txt |` and the same for
`verify`, with six deliverables digested. Those digests differ from Turn 19's bundle while every gate
value is unchanged — ExcelJS and the PDF writer stamp creation times, so `sha256sum` proves nothing about
numbers and `verify` is the numeric proof.

**Register.** `august-due.md` — new §P (P-1 crash, P-2 lane gap, P-3 four latent defects + the QA field,
P-4 undeclared packages, P-5 archived scripts, P-6 two-scope LFS census, P-7 §J-9 re-scope, P-8 evidence);
§O-8's "lane not yet wired / SUMMARY HIGH #17" cross-reference corrected to row 10a; SUMMARY gained rows
10a (lane, DONE) and 18a (declare `sharp`/`word-extractor` or retire the two tools); BLOCKING #4 rewritten
with both census scopes; DUE-5/6/7/8 recorded under COMPLETED; footer now covers §O and §P.
`CODE-JUNCTION/august-due.md` re-synced byte-identical.
**Still DUE:** engineer sign-off (`engineering/review/` empty), Kherwara/Kharka identity, governing water
level, `git lfs pull` then A2–A5 and `assimilate --report`, `Dockerfile` + `lib/log.ts`, engine decoupling
(J-5), the 18a package decision, and a real visual pass for the A4/15 mm/landscape policy.
---

## Turn 21 — 2026-10-06 · DUE-9: the A1 assimilation coverage gate (`take up due tasks and complete them one by one`)

**What was due.** SUMMARY row 11 / next action 6 / Action 1.6 of the August plan:
`pnpm run assimilate -- --report` must print a coverage table and **fail** while any indexed legacy asset
is `unclassified`. It could not fail at all: the inventory had no concept of classification, only
`projectHint`, a filename guess that can say `unassigned` and still exit 0.

**What was built.** `scripts/assimilate/inventory.py` gains `--report` (alias `--coverage-report`, and a
bare `--` token is dropped from argv so the documented `pnpm run assimilate -- --report` survives pnpm's
argument forwarding). It assigns every indexed asset one of the plan's six buckets, prints the table,
writes `evidence/assimilation-coverage.md` (the artefact Action 1.6 asks for), and exits 1 while any asset
is `unclassified`. `pnpm run assets:inventory` keeps its non-gating behaviour.

**The decision I made, and why.** Buckets are **only** granted by records in
`project/asset-catalog/asset-classification.json`, keyed on sha256 with a `relativePath` fallback. Nothing
is inferred from a name, extension or `projectHint`: `used:numbers` / `used:narrative` / `used:drawing` /
`superseded` / `out-of-scope` are claims about engineering provenance, and a gate that computed them from
filenames would be another §J-2 lane that cannot go red. A record missing `reason` or `decidedBy`, or
naming a bucket outside the five, is **demoted to unclassified** rather than trusted. A missing or
malformed decision file prints its own status line and leaves everything unclassified — no traceback, no
accidental zero-asset pass. **I wrote zero classification decisions**: 97 assets remain unclassified
because that tally is the engineer's to move, and the file documents the rule (including "do not classify
an LFS pointer stub").

**Two divergent inventories found and merged.** `pnpm run assimilate` called `scripts/src/assimilate.py`
and `pnpm run assets:inventory` called `scripts/assimilate/inventory.py` — same job, different default
roots (`attached_assets` does not exist here), different output paths, `role` vs `projectHint`, and the
older one blind to `.dxf`/`.zip`. The duplicate is archived at
`archive/20261006-duplicate-legacy-inventory-script/` with a field-by-field README; `assimilate` now routes
to the live script with explicit paths. Corrected on the way: the 414-byte
`project/asset-catalog/asset-register.json` was **not** produced by either script — its
`supportedOfficeFilesPresent`/`note` keys are hand-written, so it is an authored decision record and the
earlier "the script wrote a stub" framing is wrong.

**Pointer stubs are now recorded per file.** 96 of the 97 indexed assets are Git LFS pointers, and a
pointer hashes perfectly, so `lfsPointer` is content-sniffed against the LFS prefix (not by file size) and
the report counts them. `sourceRoot` became repo-relative (`Attached_Assets` instead of an absolute
machine path) so registers compare across machines.

**CI.** The gate runs after `verify` with `continue-on-error: true`, a step name that says "expected red
until A3", plus an artefact upload of the coverage report and register. It is deliberately **not** in
`pnpm run verify`: making it blocking today would redden every build over a decision only an engineer can
supply, and the register's own rule is that sign-off is row 1. The flag to remove when decisions exist is
stated in the workflow comment.

**Evidence.** `pnpm run assimilate` → exit **1**: "Indexed 97 Office assets", "LFS pointer stubs among
indexed assets: 96 of 97", "FAIL: 97 of 97 assets are unclassified". `asset-register.json` 985 B →
**60,866 B**; `evidence/assimilation-coverage.md` **15,098 B**. A five-case probe (`tmp/due9-probe.py`)
proved both directions: exit **0** with one complete decision record (bucket applied by hash,
`lfsPointer:false`), and exit 1 for a reasonless record, an unknown bucket name, an empty decision list,
and malformed JSON. Windows console mangles em-dashes, so report stdout is ASCII-sanitised while the files
stay UTF-8. `pnpm run candidate` then refreshed `evidence/release-candidate/` against the whole tree: exit 0, with `check` and `verify` both 0 in the regenerated MANIFEST (2026-10-05T20:40:59Z).

**Register.** `august-due.md` — new §Q (Q-1…Q-6); §A's A1 row re-worded (gate added, `knowledge/` still
absent); §E rows corrected for staleness — the narrative-lint row still said "Not implemented" though
§L-4 shipped it, the candidate-bundle row now reads "built, not committed" (it is untracked and committing
needs an explicit ask), the `check` row lists all four lanes, and the `assimilate --report` row is ✅ DONE;
SUMMARY row 11 struck with what actually remains; next action 6 closed; DUE-9 added to COMPLETED; footer
covers §O/§P/§Q. `CODE-JUNCTION/august-due.md` re-synced byte-identical. `scripts/assimilate/README.md`,
`replit.md` and `.github/workflows/ci.yml` updated to match.
**Still DUE:** `git lfs pull` then A2–A5 (`normalize.py`, `classify_cells.py`, `mine_narrative.py`,
`map_drawings.py`) and the `knowledge/` tree, the signed classifications this gate now counts, engineer
sign-off, Kherwara/Kharka identity, governing water level, `Dockerfile` + `lib/log.ts`, the 18a
`sharp`/`word-extractor` decision, engine decoupling (J-5), and a real visual pass.
---

## Turn 22 — 2026-10-06 · DUE-10: the headless container, and three claims in row 14 that were wrong (`take up due tasks and complete them one by one`)

**What was due.** SUMMARY row 10's tail and §D row 14: "Docker, error handling, logging, packaging
(`lib/log.ts`, Dockerfile) — ❌ STILL DUE | No `Dockerfile`. No `lib/log.ts`. `requirements.txt`
unversioned." Checking each clause against the code before acting on it turned up three corrections and
one genuine gap.

**Corrections, in the register's own style (R-4, R-6).**
- `lib/log.ts` does not exist **under that name**: a pino logger has been sitting at `server/logger.ts`
  since the SECONDARY-app adoption — level from `LOG_LEVEL`, JSON in production, pino-pretty in
  development, imported by `server/index.ts`, `index-prod.ts`, `api-routes.ts`, `app-factory.ts`, and
  typechecked transitively through the flat lane. So no second logger was created. (Noted, not merged:
  `artifacts/api-server/src/lib/logger.ts` is an independent pino configuration — drift risk.)
- `requirements.txt` is not "unversioned", it **does not exist**. `requirements.txt` was therefore
  written, and only with versions I could verify: `ezdxf==1.4.4`, `openpyxl==3.1.5`, `pydantic==2.13.5`,
  each mapped in a comment to the file that imports it, read out of `pip list` and confirmed by importing
  all three. The langchain quartet that `scripts/ingest_bridge_documents.py` imports (`langchain`,
  `langchain-community`, FAISS, `HuggingFaceEmbeddings`) is **listed but deliberately unpinned** — nothing
  is installed, so any version would be invented. That script became new SUMMARY row 18b (repair it, or
  archive it; it is the only code that reads `.doc`, which A2 still cannot do).
- The Python that *is* live — `scripts/assimilate/inventory.py` and the archived `src/assimilate.py` — is
  standard-library only, so the A1 gate has no dependency on this file at all.

**The real gap the row was pointing at (R-5).** `pipeline/run.ts` is what a container, cron or CI step
runs, and both of its catch sites printed `error.message` and dropped the stack — one line of evidence for
an unattended failure. A `describeError()` helper now prints stacks to stderr while `manifest.json`'s
per-stage `detail` keeps the one-line message: stack where a human reads, message where a program parses.
Proof: `npx tsx pipeline/run.ts --only=no-such-project` exits 1 with a 14-frame stack where the old build
printed a single line; the happy path is unchanged (`--only=kherwara-golden` exit 0).

**Dockerfile, written against this repo rather than the plan (R-1).** ACTION 6.3's sketch installs
Chromium and sets `PUPPETEER_EXECUTABLE_PATH`, but every PDF here is drawn by jsPDF in plain Node; it runs
`npm install -g pnpm` in a repo whose `preinstall` hook rejects npm and whose `packageManager` pins
pnpm@10.33.0; it copies four directories, which cannot resolve a pnpm workspace; and its `CMD` points at
`pnpm run design --out ….pdf`, a script that writes HTML. The file now uses `node:24-slim-bookworm`,
corepack, `python3` (only so §Q's gate runs in-container), `COPY . .` + `pnpm install --frozen-lockfile`,
`NODE_ENV=production` set *after* the install because the build needs devDeps while the logger should be
JSON at runtime, and `CMD ["pnpm","run","pipeline"]`. Each deviation is named in the header so nobody
"restores" the browser.

**The honest status (R-2): the image has never been built.** `docker: command not found` on this host. So
the Dockerfile says NOT BUILT YET with the prove commands, and CI gained a separate
`container-image-build` job — `docker build`, then a cold `pnpm run pipeline --only=kherwara-golden`
inside the image, artefacts uploaded — marked `continue-on-error: true` so the first push produces the
evidence instead of a green word with none behind it. The workflow parses (`yaml.safe_load` → jobs
`quality-gates`, `container-image-build`).

**`.dockerignore`, decided by reading code (R-3).** `assets/` (13 MB) and `Attached_Assets/` (3.1 MB) stay
in the context: `server/pier-case-engine.ts` walks `Attached_Assets` at runtime and scores pier cases from
the file *names*, and four authoring tools default to reference workbooks under those roots — excluding
them would change reported results, not just size. `sample/` (19 MB, zero code references), `archive/`,
`.git`, `node_modules`, build output and generated `test-output/`/`evidence/`/`tmp/` go. Self-correction
recorded in the row: my first draft claimed the six workbook gates read those corpora — grep shows no
`assets/` or `Attached_Assets/` path in `scripts/verify-*.ts` or the generator, so the claim was narrowed
to the code that really reads them.

**Bundle refresh.** `pnpm run candidate` re-ran both chains over the DUE-9 and DUE-10 tree and exit 0: `evidence/release-candidate/MANIFEST.md` now reports `pnpm run check` 0 and `pnpm run verify` 0 with transcripts in `gates/`, and the six deliverable digests refreshed. No delivered number moved.

**Register.** `august-due.md` — new §R (R-1…R-7); §D row 14 re-scoped to PARTIAL with the three corrected
clauses; SUMMARY row 10's "Still due" now names the unbuilt image and the hosted deploy instead of
`lib/log.ts`; new row 18b; next action 8 updated; DUE-10 added to COMPLETED; footer covers §O/§P/§Q/§R.
Also fixed two markdown spots (§O-5, §P-1) where escaped backticks inside code spans rendered visible
backslashes. `CODE-JUNCTION/august-due.md` re-synced byte-identical.
**Still DUE:** the first successful `docker build` (CI, on push), a hosted deploy, `git lfs pull` then
A2–A5 (`docs/week-0/classify_cells.py` is a demo the A3 port can start from) and the signed
classifications §Q counts, row 18a/18b package decisions, engineer sign-off, Kherwara/Kharka identity,
governing water level, engine decoupling (J-5), and a real visual pass.

---

## Turn 23 — 2026-10-06 · DUE-11: measuring the print policy instead of asserting it (`take up due tasks and complete them one by one`)

**The task said "visual pass". The first honest step was reading the artefacts, and that found a
functional defect, not a cosmetic one.** `PRESENTATION-SPEC.md` §4 and the register both claimed
"13 landscape / 33 portrait, verified by workbook read-back". The delivered
`test-output/design-workbook.xlsx` measured **14 landscape**, and mapping each of those indexes to
the sheet actually sitting at that position showed the tabulation had been re-targeted when the book
grew 46 → 56: `abstract of stresses`, `LLOAD`, `loadsumm`, `LL-ABSTRACT`, `TYPE1-AbutMENT Drawing`,
`TYPE1-STABILITY CHECK ABUTMENT`, `C1-AbutMENT Drawing` and `C1-STABILITY CHECK ABUTMENT` were
printing **portrait**, while `STEEL IN FLARED PIER BASE`, `TYPE1-DIRT DirectLoad_BM` and
`TYPE1-DIRT LL_BM` — nobody's landscape sheets — were printing landscape. The code comment said
index 54 was `SERVICEABILITY CHECK`; index 54 is `IRC CODE COMPLIANCE CHECKLIST`, which is the
off-by-one that dates the edit. Margins and paper size were fine the whole time: all 56 sheets
`paperSize 9`, `fitToPage true`, `15/15/15/15` mm.

**Fix: key the tabulation by sheet name.** `LANDSCAPE_SHEET_INDEXES` is gone; `isLandscapeSheet(name)`
+ a private `LANDSCAPE_SHEET_NAMES` array typed against `EXPECTED_SHEET_NAMES` replace it, so a
renamed sheet is now a compile error rather than a silent orientation change. All three consumers
(`applyWorkbookPageSetup`, `landscape-pdf-export.ts`, `fiftysix-sheet-book-pdf.ts`) ask by name, which
also means the 46-sheet and 56-sheet books — different orders, same content — each get the owner's
intent instead of one of them getting a compromise. Measured after the change: **56-book 19 landscape /
37 portrait**, **`legacy-46` 13 / 33** (the owner's tabulation, restored exactly).

**Decision recorded, because "ALL OTHER PORTRAIT" does not cover sheets that did not exist yet:** the
six wide 56-book sheets (`DESIGN CRITERIA`, `INPUT DATA SUMMARY`, `SEISMIC ANALYSIS`, `WIND LOAD
ANALYSIS`, `BEARING DETAILS`, `SERVICEABILITY CHECK`) stay landscape. That is my call, not the
owner's, so it is labelled "56-book extension" in every row of the new §4.1 table and is reversible by
deleting six names from one array.

**Three more off-policy rules, all in client lanes nobody had measured:**
`generateCertificationReport.ts` printed `@page { margin: 18mm 15mm }`; `struds-report.css` printed
`14mm 12mm 16mm 12mm`; `excel-fidelity.css` printed `10mm 12mm`. All three are now `15mm`. Orientation
was left as authored — "A4 pages with 15 mm margins" constrains the page size and the margins, and
landscape A4 satisfies both; the portrait/landscape tabulation is about workbook sheets, not about the
SPA print master. `@page :first { margin: 0 }` stays, deliberately: the report cover is a full-bleed
297 × 210 mm gradient panel whose own 18 mm inner padding is the effective text margin. That exception
is now named in the gate by file + selector, so it cannot spread unnoticed.

**Reading the print block found a latent clipping bug that no gate could see.** `.struds-cover`,
`.struds-foreword` and `.struds-toc` are hard-sized to 297 mm because on screen they are drawn as paper.
The printable text area was 273 mm under the old margins and is 267 mm under the mandated 15 mm, so
those three boxes already hung 24–30 mm off the right edge of every printed cover, foreword and ToC —
before this change, not because of it. The print block now pins them to the text area
(`width: 267mm`, cover `height: 180mm`, foreword/ToC `min-height: 180mm`).

**Ninth gate: `pnpm run verify:presentation`.** Nothing in the eight existing gates read a `pageSetup`
or an `@page`, which is why a documented "verified by read-back" could stay wrong for two days. It now
measures three things: every generated worksheet's paper size, fit-to-page, four margins and orientation
for **both** book shapes; every `@page` rule reachable under `client/src`, `server`,
`bridge-excel-generator`, `pipeline`; and the `MediaBox` of **every page** of the delivered PDFs. It bit
its own author twice, which is the point of writing it: the first version's regex
(`/@page(:[a-z-]+)?\s*\{/) could not match `@page :first` because of the space, so the one real margin
exception went unmeasured; and once it matched, the size check demanded `size` on a rule that only
overrides the margin — corrected to "declare A4 somewhere in the file, and name it where you name it".

**Measured vs assumed, stated plainly.** Proven: workbook read-backs above; `verify:presentation` exit
0 (6 `@page` rules scanned, 1 allowed exception; PDF pages `comprehensive-report.pdf` 225 all portrait,
`sheet-book.pdf` 118 with 50 landscape, `short-design-report.pdf` 14 all portrait, none non-A4);
`pnpm run book:56` regenerated and measured independently — 133 pages, 59 landscape / 74 portrait,
0 non-A4; and the live browser CSSOM on `http://localhost:5180/suite/report`, which returned
`@page { size: a4 landscape; margin: 15mm }` twice plus `@page :first { margin: 0 }`, and confirmed
`width: 267mm` / `height: 180mm` / `min-height: 180mm` are in the served stylesheet with **0 console
errors or warnings**; `design-report.html` and `irc-checklist.html` each expose exactly one
`@page { size: a4; margin: 15mm }`. **Not proven: pixels.** The in-app browser again had no visible
surface (`viewport=0x0, visibilityState=hidden`, screenshot refused), so nothing has been looked at
with eyes — cover/ToC appearance after the 267 mm pin and the legibility of the widest fit-to-width
tables remain human judgements. SUMMARY row 12 narrows to exactly that.

**Regression + artefacts.** `pnpm run deliverables` regenerated all six `test-output/` files;
`pnpm run check` exit 0 (four typecheck lanes + workspace lanes + narrative lint, 158 prose spans);
`pnpm run verify` exit 0 across all **nine** gates including the new one; `pnpm run candidate` refreshed
`evidence/release-candidate/` over the changed tree. No delivered engineering number moved — this turn
touched orientation, print margins and one new verifier.

**Docs.** `august-due.md` — new §S (S-1…S-8); SUMMARY row 12 rewritten from "visual verification is
missing" to the half that is actually still open; next action 9 struck through with the same
qualification; DUE-11 added to COMPLETED; footer now leads with §S and records the nine-gate chain.
`PRESENTATION-SPEC.md` §4 rebuilt: §4.1 is the live 56-sheet landscape table by name with the source of
each row, §4.2 tabulates the non-workbook print lanes, §4.3 keeps the owner's 46-sheet numbers as
history; §7 gained three DUE items and a "Closed 2026-10-06" block. `CODE-JUNCTION/august-due.md`
re-synced byte-identical.
**Still DUE:** eyes-on verification of the rendered pages (row 12), the first successful `docker build`
and a hosted deploy (row 10), `git lfs pull` then A2–A5 with signed classifications (§Q/§S counts),
row 18a/18b package decisions, engineer sign-off on the moved verdicts, Kherwara/Kharka identity,
governing water level, and engine decoupling (J-5).

---

## Turn 24

**Date:** 2026-10-06

### Identity decision: Kherwara is correct; Kharka references removed

The engineering owner confirmed: **Kherwara is the correct name; Kharka is wrong.** This is an authoritative trust-me directive. No further adjudication of source documents is required.

### Files changed

| File | Change |
|---|---|
| lib/engine/src/index.ts | projectName default changed from "KHERWARA / KHARKA DEMO" → "KHERWARA DEMO" |
| lib/engine/src/traceability.ts | L-001 limitation text updated: "Kherwara/Kharka workbook" → "Kherwara workbook" |
| inputs/KHERWARA.json | projectName field changed from "KHERWARA / KHARKA DEMO" → "KHERWARA DEMO" |
| tmp/due9/register.json | projectHint slug changed from "kherwara-kharka-review" → "kherwara-review" |
| lib/api-zod/dist/generated/api.d.ts | Both calculateDesignBodyProjectNameDefault and renderDesignReportBodyProjectNameDefault constants updated from "KHERWARA / KHARKA DEMO" → "KHERWARA DEMO" |
| lib/api-spec/openapi.yaml | projectName default in schema updated from "KHERWARA / KHARKA DEMO" → "KHERWARA DEMO" |
| project/canonical-projects/kherwara-kharka-decision.md | Status changed from OPEN → RESOLVED ✅; decision and action log added |
| august-due.md | Row 1 (Day 1 identity): "Identity still OPEN" → "Identity RESOLVED 2026-10-06"; blocking row 2 struck through and marked DONE; immediate-action item 2 updated; file-exists table row updated |
| CODE-JUNCTION/august-due.md | Same changes as august-due.md above |
| WEEK0_ACCEPTANCE.md | Identity adjudication row changed from ❌ NOT ACCEPTED → ✅ ACCEPTED 2026-10-06 |
| README.md | "Kherwara/Kharka identity is recorded…" → "Kherwara identity is recorded and resolved…" |

### Files left alone and why

| File | Reason |
|---|---|
| assets/DRAWINGS_FROM_RAJKUMAR_DESIGNS/drawing_extraction_log.txt | Historical filesystem log of external drive paths (E:\BRIDGE DESIGN\Kharka Bridge Rehabilitation\...). These are actual asset path records, not code or project data. Changing them would falsify the historical record. |
| archive/20261006-tmp-scratch-due7-due8/* | Archived historical working logs. Left as evidence of prior state. |
| AUGUST ACTION PLAN.md | Planning document whose text describes what was asked and why; the task is now closed, the document remains as audit trail. |
| creat1.md, origin-weekly-plan.md, kiro-impl-plan.md, replit.md, CERTIFICATION-CODE-JUNCTION.md | Historical planning / chatlog / spec documents. Contain "Kherwara/Kharka" as a reference to the open identity question that has now been answered. These remain as audit trail. |
| CREAT-CHATLOG.MD turns 1–23 "Still DUE" lines | Prior-turn status summaries are historical; they correctly described the state at the time they were written. They are not updated retroactively. |
| CODE-JUNCTION/COMPREHENSIVE_IMPLEMENTATION_PLAN (1).md, CODE-JUNCTION/bridge_slab_design_comprehensive_impl_plan.md | Comprehensive planning specs. Contain DESIGN REPORT KHARKA BRIDGE.docx as a reference to an actual physical asset file, and historical planning text about the identity question. Left unchanged as audit trail. |
| project/canonical-projects/kherwara-kharka-decision.md filename | Not renamed — would break references to this path in multiple documents. |

**Still DUE:** eyes-on verification of the rendered pages (row 12), the first successful docker build and a hosted deploy (row 10), git lfs pull then A2–A5 with signed classifications (§Q/§S counts), row 18a/18b package decisions, engineer sign-off on the moved verdicts, **governing water level** (sheet 3 AFL 101.375 vs engine DWL 100.856), and engine decoupling (J-5). (Kherwara/Kharka identity is now **CLOSED**.)


---

## Turn 25 — 2026-10-06 · DUE-12 closed, and stage A3 landed under a second writer (§T, §V)

**Standing directive:** take up due tasks and complete them one by one, in auto mode, presuming allowance once for all prompts. Nothing was committed, branched or pushed.

### What this turn actually did

1. **Closed the regression sweep (§T).** `pnpm run candidate` now runs all four CI chains (`check · verify · test · audit:policy`) with a transcript per chain. Its first run went **red** on `test`, and the red was in the harness: Node's cross-process test-frame serialisation corrupted while the design engine poured hundreds of stdout lines through the same child, so `api-calculate.test.ts` was failed by a file whose five tests pass standalone three times out of three. Fixed by making the lane deterministic (`--test-isolation=none` in `scripts/run-integration-tests.ts`), not by re-running until green. Second run: exit 0, `check 48.2 s / verify 85.4 s / test 59.5 s / audit:policy 6.4 s`, 6 deliverables with digests, 13/13 integration files, nine verify gates unchanged, 300 cases with 4 SAFE.
2. **Ported the deep cell classifier (§V).** `docs/week-0/classify_cells.py` now lives as `scripts/assimilate/classify_workbook.py` (renamed, because the concurrent writer took `classify_cells.py` for a different corpus-wide A3 — the two are batch-headers vs per-workbook dependency graph). Six silent-failure modes fixed: `--confirm` read a module global; `--min-confidence` was theatre; `--answers` keys were dropped on case mismatch with no warning; a date cell crashed the registry write; cp1252 stdout died on a degree sign; nothing refused an unreadable input. Four refusals added (BIFF `.xls` → A2, LFS pointer stub, missing path, `--outdir` inside `project/asset-catalog/`), plus `--proposal`, which emits a suggestion with `decidedBy: null` and grants nothing.
3. **Measured it**, on `test-output/design-workbook.xlsx`: 19 variables · 15 coefficients · 108 constraints · 569 intermediates · 285 ambiguous · 3 295 noise · 54 embedded literals; `--min-confidence 0.9` demotes 34 cells; lowercase answers keys land; `Nosuch!Z9` warns. Evidence at `evidence/assimilation/cell-classification/design-workbook/`.
4. **Corrected three stale claims the register was still making:** §C rows A2–A5 and SUMMARY row 4 said the assimilation scripts did not exist (they do; their data does not — 95 of 96 normalized records are `lfs-stub`), and `requirements.txt` was missing `xlrd==2.0.2`, which A2 imports.
5. **Repaired this chatlog.** Turn 24 had been written through a layer that consumed escape sequences: 4 BEL, 1 TAB and 2 mid-line CR, eating the first letter of `august-due.md`, `assets/…`, `archive/…`, `tmp/due9/register.json`, `renderDesignReport…` and `replit.md`. All 7 sites restored, the one legitimate CRLF left alone.

### Files changed

| File | Change |
|---|---|
| scripts/run-integration-tests.ts | spawns `node --test --test-isolation=none`, with the observed error named in the comment |
| scripts/assimilate/classify_workbook.py | the port (guards, `confirm` parameter, min-confidence, case-insensitive answers + unmatched warnings, ISO dates, UTF-8 stdout, `--proposal`, argv `--` filter, `main()` returning an exit code) |
| scripts/assimilate/README.md | new A3b section (refusals, proposal semantics, the corrupt fixture warning); pipeline table row; prerequisites point at `requirements.txt` |
| requirements.txt | `xlrd==2.0.2` pinned; openpyxl mapped to its real consumers |
| package.json | `assimilate:classify:workbook` script |
| august-due.md | §T-11/§T-12 written (red run, root cause, green-run numbers, owner commits); new §V (7 rows); §C A1–A5 rows corrected; SUMMARY row 4 rewritten; rows 20 and 21 added; DUE-12 and DUE-14 completed bullets; next action 5 struck to data-only; footer rewritten |
| CODE-JUNCTION/august-due.md | re-synced byte-identical (`cmp` clean) |
| CREAT-CHATLOG.MD | this turn + the escape-damage repair |
| archive/20261006-tmp-scratch-due12/ | the seven working logs from this batch, moved out of the repo root |

### Files deliberately not touched

| File | Reason |
|---|---|
| scripts/assimilate/classify_cells.py, normalize.py, mine_narrative.py, map_drawings.py | the concurrent writer's A2/A3/A4/A5 — verified unchanged after my edits (`classify_cells.py` md5 `a4bf54e…`) |
| docs/week-0/demo_bridge_raw.xlsx | corrupt (UTF-8 BOM before the PK signature). Replacing a committed asset to make a test pass is what this register forbids — recorded as row 20 instead |
| `project/asset-catalog/asset-classification.json` | buckets are a human grant; `--proposal` refuses to write there and refuses an `--outdir` inside it |
| `Attached_Assets/**` | read-only; no `git lfs pull` run, because 146 of its paths are deleted in the working tree and a pull could restore what the owner removed |

**Still DUE:** the engineer sign-off on the moved verdicts (row 1) and on every bucket (§V-3); `git lfs pull` then real A2–A5 runs (row 4, 5b); the corrupt week-0 fixture (row 20); two writers in one worktree (row 21); `knowledge/` tree; the first `docker build` and a hosted deploy (row 10); pixel-level eyes on the print output (row 12); the pier-catalog cwd decision (row 19); governing water level, bearing factor, PDF hydraulics block and discharge (§M).

---

## Turn 26 — 2026-10-06 · Final gate run + deliverables + docs (Task 7 of workflow wf_e0c19545e80e4326)

**Standing directive:** auto mode, allowance for all similar prompts. This turn executed the four production gates, regenerated the six deliverables, refreshed the release candidate, and updated both register files. Commit `13cdf0b8b1dd` (HEAD → master, engine decoupling J-5) was the tree snapshot the candidate captured.

### Task 2 (DUE-12): HTML/XLSX/PDF verification results

Covered in Turn 25 (§T). Summary carried forward for this turn's record:

- `pnpm run candidate` first attempt: **red** on `test` — Node cross-process serialisation corrupted frames while the design engine poured stdout through the same child. `api-calculate.test.ts` reported `tests 3 pass 2 fail 1` for a file whose 5 tests pass standalone — a harness defect, not a product defect.
- Fix: `scripts/run-integration-tests.ts` spawns `node --test --test-isolation=none`; the lane is now deterministic.
- Green run: `check 0 / verify 0 / test 0 / audit:policy 0`, 13/13 integration files, 6 deliverables with SHA-256 digests. Four real defects discovered on the way: SEC-003 (partial API payload caused HTTP 500), a 204-vs-200 delete assertion, two stale deploy assertions, `proxy-addr` CVE + the falsehood that SheetJS had been removed.
- HTML/PDF parity: `verify:parity` — 20 templates, 220 comparisons, 0 divergences. Confirmed by `pnpm run verify` on this turn: all 9 gates exit 0.

### Task 3 (DUE-13): Docker status

Covered in §U. `docker: command not found` on this host. Dockerfile syntax verified manually:

- `FROM node:24-slim-bookworm` ✓, corepack for pnpm@10.33.0 ✓, `pnpm install --frozen-lockfile` ✓, `CMD ["pnpm","run","pipeline"]` ✓, `NODE_ENV=production` set after install ✓, `.dockerignore` keeps `assets/` + `Attached_Assets/` (pier-case engine reads them), drops `sample/` (19 MB, no code reference) ✓.
- Dockerfile header says NOT BUILT YET; CI `container-image-build` job (with `continue-on-error: true`) is the first build attempt. Image build remains open — row 10 of SUMMARY.

### Task 4 (DUE-14): A2–A5 script creation results

Covered in §V. Summary:

- `normalize.py` (A2, xlrd BIFF + openpyxl OOXML), `classify_cells.py` (A3 batch header-pattern classifier), `classify_workbook.py` (A3b deep dependency-graph classifier, the week-0 port hardened), `mine_narrative.py` (A4 candidate-sentence extractor), `map_drawings.py` (A5 ezdxf entity mapper) all exist in `scripts/assimilate/` with root pnpm scripts.
- **Data produced: almost none.** 95 of 96 records in `evidence/assimilation/normalized/` are `status: lfs-stub`. The blocking prerequisite is `git lfs pull` on 1,876 stubs under `assets/` — the scripts are written, the corpus is not materialised.
- Deep classifier `classify_workbook.py` measured on `test-output/design-workbook.xlsx`: 19 variables · 15 coefficients · 108 constraints · 569 intermediates · 285 ambiguous · 54 embedded literals. `--proposal` grants nothing, `--outdir` inside `project/asset-catalog/` refused.
- `xlrd==2.0.2` pinned in `requirements.txt`; README prerequisites updated.

### Task 5 (DUE-15): Package decisions

Covered in §T-6, §T-7, and the `aec5b42` commit ("DUE-15"):

- `sharp@0.35.5` and `word-extractor@1.0.4` declared in root `devDependencies`. Both scripts (`export-sample-output-bundle.ts`, `phase-zero/extract-word.ts`) have zero callers but unique functions (SVG→PNG, `.doc` extractor). `@ts-expect-error` markers removed. `sharp` added to `onlyBuiltDependencies` in `pnpm-workspace.yaml` (native binary). `tsconfig.tools.json` header comment updated.
- `scripts/ingest_bridge_documents.py` archived to `archive/scripts/` — zero callers, document-RAG ingestion not part of any current gate. `langchain` family remains unpinned in `requirements.txt` because the script is archived and those packages are not installed.
- `exceljs` and `drizzle-orm` reclassified from `devDependencies` → `dependencies` (§T-7): the shipped server imports both; a `--prod` install would have shipped a server that cannot build a workbook.
- `proxy-addr` overridden to `^2.0.8` (GHSA-jqcg-44mw-7w3h, critical, published 2026-09-15, same major).
- `source-map-js` overridden to `^1.2.2` (GHSA-68fv-2mgg-jv7q, high, published 2026-09-30, dev tooling only).
- `xlsx` moved to `devDependencies` (was a `dependency`); source scan replaces name-ban in `audit:policy`.

### Task 6 (J-5): Engine decoupling result

Covered in commit `13cdf0b` ("refactor: decouple bridge-excel-generator from server layer (J-5)"). This is the HEAD commit for this gate run.

- `bridge-excel-generator/index.ts` previously imported `server/remote-app-adapter` — a server-layer module — to call `calculateCompleteDesign`. This circular layering prevented quarantining `server/` from the generator and made the generator unsuitable as an independent library.
- Decoupling: the generator now accepts a `CompleteDesignResult` object as a parameter (passed in by the caller) rather than computing it internally. All call sites updated accordingly.
- The golden harness (`@workspace/engine`) and the deliverable generator (`design-engine.ts`) remain two separate implementations (J-5 is noted but not fully resolved — the engine decoupling narrows the surface but the two-engine situation persists until J-5's remaining steps are taken).
- All gates continue to pass after the decoupling; no delivered number moved.

### Task 7: Final gate results

**Step 7a — `pnpm run check`:** exit 0 in ~53 s
- typecheck:libs ✓, typecheck:flat ✓, typecheck:client (106 files, 0 errors) ✓, typecheck:tools (43 root scripts) ✓, workspace lanes ✓
- lint:narrative: 158 prose spans, 0 hard-coded quantities

**Step 7b — `pnpm run verify` (all 9 gates):** exit 0
- verify:sheets: 46/46 sheets (3 fixtures: kherwara-golden, larathi-stabil, fixture-minimal)
- verify:links: 20/20 workbooks fully linked — broken:0, diverge:0; kherwara 609 formulas / 211 cross-sheet / 1090 same-sheet
- verify:values: 20 templates, 101,859 cells, 12,011 formulas, nonFinite:0, placeholder:0, missingResult:0
- verify:costing: 20 templates, 0 defects — kherwara 826.3 m³ dig, 78.01 MT steel, 66 bearings, total ₹161.19 L
- verify:uplift: 20 templates, 0 defects — large-bridge UNSAFE FOS 1.11 (genuine review item)
- verify:cases: 20 templates, 0 defects — all 5 distinct abutment cases, non-zero horizontal spread
- verify:outcomes: 300 load cases — **SAFE 4 / UNSAFE 296**; bearing < 2.5 in 218 cases (190 fail bearing alone)
- verify:parity: 2 projects (kherwara + high-level), 22 comparisons, 0 divergences
- verify:presentation: executive-56 book 19L/37P, legacy-46 13L/33P; 6 @page rules scanned (1 named exception); comprehensive-report.pdf 225 pages all portrait, sheet-book.pdf 118 pages (50 landscape), short-design-report.pdf 14 pages all portrait

**Step 7c — `pnpm run deliverables`:** exit 0 — 6 files written to `test-output/`
- `design-workbook.xlsx` 109,039 B (56 sheets, 19 landscape / 37 portrait)
- `sheet-book.pdf` 3,203,059 B (118 pages, 50 landscape)
- `comprehensive-report.pdf` 4,913,586 B (225 pages, all portrait)
- `short-design-report.pdf` 221,114 B (14 pages)
- `design-report.html` 416,961 B
- `irc-checklist.html` 39,743 B

**Step 7d — `pnpm run candidate`:** exit 0
- Ran all 4 CI chains: check=0 (53.3 s), verify=0 (83.9 s), test=0 (75.9 s), audit:policy=0 (6.3 s)
- Commit `13cdf0b8b1dd30fc1df50d451d517a7b2d3afea9`, Node v24.14.0, pnpm 10.33.0
- Working tree had uncommitted changes (register files updated but not yet committed)
- 6 deliverables bundled with SHA-256: workbook `cf2b649a…`, sheet-book `a0d4cdcd…`, comprehensive PDF `9eee4c70…`, short PDF `cd6058d1…`, design-report.html `bca3fc2a…`, irc-checklist.html `415e1ac5…`
- `evidence/release-candidate/MANIFEST.md` and `manifest.json` refreshed; 4-gate transcript set in `gates/`
- Engineering outcomes banner: 300 cases · 4 SAFE · 296 UNSAFE · 20/20 templates with at least one unsafe case

### Commit

All four pipeline steps completed. Changes from this turn (register files + chatlog update) committed as:

```
docs: Task7 final gate run — CREAT-CHATLOG Turn26 + august-due §T24
```

### Still DUE (carried forward, unchanged by this turn)

- Engineer sign-off on 296 UNSAFE / 4 SAFE verdict tally (row 1)
- Governing water level: sheet 3 AFL 101.375 m vs engine DWL 100.856 m (row 3 / §M-2)
- `git lfs pull` then real A2–A5 data runs — 1,876 pointer stubs blocking (row 4/5b)
- First successful `docker build` — CI job exists, image never built (row 10)
- Pixel-level visual verification of cover / ToC / wide tables (row 12)
- Pier-catalog cwd binding in serverless (row 19)
- §M-1…§M-4 sign-off questions (bearing factor, water level, PDF hydraulics block, which discharge)
- `knowledge/` tree (downstream of A2–A5)
- Two writers in one worktree (row 21)

---

## Turn 27 — 2026-10-06 · DUE-16: J-5 measured, three coverage holes closed, and a real optimiser defect (§W)

> Standing directive still in force: `take up due tasks and complete them one by one`, blanket permission to run, no commit unless asked. Housekeeping from Turn 25 finished first (archive README + project memory), then the next non-blocked register item: **next action 6 / §J row J-5, engine decoupling**.

### What the register claimed, and what the code did

| Claim | Measured |
|---|---|
| "Two calculation engines coexist; the golden harness guards the one that produces **no deliverable**." | Half true, and the false half mattered. `lib/engine` owns the deck-slab chain (UDL/BM/SF/deflection/utilisation); `bridge-excel-generator/design-engine.ts` owns hydraulics/scour/stability/reinforcement/BOQ. **Neither calls the other** — zero `@workspace/engine` importers under `bridge-excel-generator/`, `pipeline/`, `server/`, `shared/`, `client/`, `api/`. So merging them was not the task; the sentence was hiding three holes. |

### The three holes (all closed)

| # | Hole | Closure |
|---|---|---|
| W-2(1) | `verify:golden` was defined, passing, and **excluded from `pnpm run verify`** — CI had never once executed the numeric golden regression. | First lane of the aggregate: **eleven** gates now, and inside `pnpm run candidate` + CI automatically. |
| W-2(2) | `lib/engine/src/tests/{calculate,golden-parity-expanded}.test.ts` = **79 assertions**, both green standalone, invoked only by `scripts/qa-ultra-strict.ts`, which no script or CI job calls. | `scripts/run-integration-tests.ts` is a two-lane runner (`Integration lane`, `Engine unit lane`): `15/15 files passed in 2 lanes`. Per-file `--test-isolation=none` (§T-11) carried to both. |
| W-2(3) | The engine that produces the workbook, three PDFs and the HTML had **no numeric regression whatsoever**. | New gate `pnpm run verify:engine` (`scripts/verify-engine-boundary.ts`): boundary from the import graph (61 modules, 0 under `lib/engine/`), calculator-coverage tripwire, **485** pinned outputs in `tests/golden/deliverable-engine/kherwara.json` (31 965 B, sha256 `00d09398…`), 233 of them case-by-case `loadCases`. |

### Proving the gate can fail (five controls, each restored)

drifted value → exit 1 · trimmed `covers` → exit 1 naming `calculateDetailedEstimation` · deleted pinned key → exit 1 `new output … is not pinned` · entries replaced with a non-engine entry → exit 1 `not reachable from any deliverable entry` · entries replaced to include `lib/engine/src/index.ts` → exit 1 `The boundary moved`. Determinism: two clean runs identical, `--emit` reproduces the file byte-for-byte (`sha256sum -c` OK).

### Two findings the gate produced

| Finding | Disposition |
|---|---|
| **`ProjectInput.discharge` moves 0 of 485 outputs on the deliverable path.** `calculateHydraulics` derives `Q = A × V` (Kherwara 243.11 cumecs) and never reads the declared 902.15, which reaches the book only through sheet 3's own rows (`sheets/03-afflux-calculation.ts:34,284,291`) and the `h?.discharge ?? input.discharge` fallbacks. | §M-4's "which discharge governs" is now located in code instead of suspected. **Not changed** — it is the signing engineer's decision. The gate keeps the probe as a printed diagnostic, and the control tamper is `manningN + 0.005` (moves 44 of 485), which is what proves the snapshot is live. |
| **The red candidate found a product defect, not a harness one.** `design-optimise-limits.test.ts` failed `1 !== 0`: `deadlineMs: 0` produced one trial under load, zero on an idle machine, because `Date.now() > deadline` only trips after a millisecond ticks. Same line: the message interpolated `DEFAULT_DEADLINE_MS`, so a 500 ms caller was told "5000 ms compute budget exhausted". | `server/optimisation-engine.ts` now compares elapsed with `>=` against the caller's resolved budget and quotes the requested number; test gained `assert.match(message, /^Stopped at iteration 0: 0 ms compute budget exhausted/)`. Five consecutive runs of the file: `pass 5 · fail 0` each. Route path (no budget) unchanged. |

### Second writer, again (§W-9)

Mid-batch the owner landed `13cdf0b` "decouple bridge-excel-generator from server layer (J-5)" (+2 229/−630) and `aec5b42` labelled **DUE-15**. Their J-5 is the import direction (verified: zero generator→`server/*` imports remain); this one is numeric coverage. Complementary halves recorded in the same §J row. **This batch is therefore DUE-16**, and the snapshot was emitted after `13cdf0b`, so its 485 values are post-refactor. §T24's "9 gates" was accurate at that commit and is superseded.

### Files changed this turn

| File | Change |
|---|---|
| `package.json` | `verify` chain → eleven lanes (`verify:golden` first, `verify:engine` last); `verify:engine` script added. |
| `scripts/package.json` | `verify:engine` → `tsx ./verify-engine-boundary.ts`. |
| `scripts/verify-engine-boundary.ts` | **new** — boundary + coverage + 485-value golden, `--emit`, five self-controls, writes `evidence/engine-boundary.json`. |
| `scripts/run-integration-tests.ts` | single-lane → two-lane runner (integration + `lib/engine/src/tests`). |
| `server/optimisation-engine.ts` | `>=` elapsed-vs-budget; message quotes the caller's `deadlineMs`. |
| `tests/integration/design-optimise-limits.test.ts` | asserts the reported budget, not just the phrase. |
| `tests/golden/deliverable-engine/kherwara.json` | **new** — snapshot + `provenance` + `covers` + boundary record. |
| `august-due.md` | §W (W-1…W-9), §J J-5 row corrected, next action 6 closed, §E three gate rows updated, DUE-16 bullet, footer. |
| `CREAT-CHATLOG.MD` | this turn. |
| `archive/20261006-tmp-scratch-due12/README.md` | **new** — the seven Turn-25 logs described (promised in Turn 25). |
| project memory | `project-validation-commands.md` (eleven lanes, two test lanes, `--test-isolation=none`), `project-asset-assimilation-state.md` (**new**), index. |

### Deliberately not touched

`lib/engine`'s two entry points (merging them is an engineering decision); the 485 numbers themselves (no product calculation changed); `13cdf0b`/`aec5b42` content; `project/asset-catalog/asset-classification.json`; `Attached_Assets/**`; no `git lfs pull`; nothing committed.

### Still DUE after this turn

Licensed-engineer sign-off (row 1) · §M-1…§M-4 (now including the located §M-4 discharge fact) · governing water level (row 3) · `git lfs pull` → real A2–A5 data (rows 4/5b) · first `docker build` (row 10) · pixel verification (row 12) · pier-catalog cwd (row 19) · corrupt week-0 fixture (row 20) · **two writers / one worktree (row 21 — now with a label collision as evidence)** · `knowledge/` tree.

---

## Turn 28 — 2026-10-07 · DUE-17 + DUE-18: the working directory, a sliding number with no arithmetic, and eleven copies of one rule (§X, §Y)

### User directives in force (verbatim, carried)

- "take up due tasks and complete them one by one"
- "presume my responce as allow once for all 100 prompts"
- "DATA ARE GENERATED AS PEEF FORMULA CALCULATION AND RETRIEVED AFTERWARDS FROM SAME OR ANOTHER WORKSHEETS>>>>LINK ALL"
- "ALL OUTPUT IN A4 PAGES WITH 15 MM MARGINS ALL AROUND" / "LANDSCAPE >>>3, 5, 9,10, 15,16, 17,18 TO 21, 30-31, ALL OTHER PORTRAIT"
- "read all files in folder >>>>>E:\Rajkumar\Bridge_Slab_Design\CODE-JUNCTION >>>> apply enrichment and fixing of code if due>>>>indicate what is due and done"
- "CREAT A FILE CREAT.MD AND SAVE OUR CHATLOG INTO UT MANDATORY FOR ADD UPDATE EVERY 12 MINUTES"

### Work done

**DUE-17 (§X) — the pier-case catalog.** `resolveDefaultPierAssetRoot()` built its candidates from `process.cwd()` and then returned an unchecked fallback path, so any server not started at the repo root threw inside `buildPierCaseCatalog` and answered 500. Resolution is now module-relative (`import.meta.url`) with cwd as a de-duplicated fallback, preference order sorted-pier-drawings then `Attached_Assets`, and `PIER_ASSET_ROOT` honoured only when it names an existing directory. The route is an explicit contract: **503** "asset library is not installed" (naming both remedies), **400** for a `?root=` that is missing, **400** for one outside `pierAssetTrees()` — the containment check had to move from "inside the single resolved default" to "inside either installed tree", or the fix would have rejected legitimate siblings.

Measuring the *other* branch is what mattered: from the repo root the old code returned 200 with a catalog in which **0 of 10 templates were source-backed**, because its first candidate names `research_assets/component_drawings_sorted/...` and this repo has no `research_assets/` at all — so it always fell through to the general `Attached_Assets` dump (32 files). Module-relative default: **35 drawings, 4 of 10 source-backed** (single-column, hammerhead, tall-viaduct, circular). Five integration assertions pin it, including `process.chdir(os.tmpdir())` returning the same root, and the three status shapes. `.dockerignore`'s justification comment and the engine's own evidence `note` string corrected to match the code.

**DUE-18 (§Y) — sheet 9, and then the acceptance rule.** Commit `876a3bd` added IRC:78-2000 §706 passive earth resistance to the engine's pier sliding FOS. The workbook was not told: column K still read `=B{mu}*ABS(H)/MAX(ABS(I),1)` while its cached `result` was the passive-aware engine value. Measured on `irc-t01-jethliya` the ratio is **exactly 1.500 for all five cases** (the `0.5*mu*V` cap binds everywhere), and the row contradicts itself: `N` tests `K>=1.5`, so the ULS case displays 1.627 / SAFE while the formula printed beside it yields 1.085. Section A gained phi (B27), gamma (B28), **Kp as a live formula** `=TAN((45+B27/2)*PI()/180)^2` (B29) and the §706 cap (B30, from `DESIGN_CONSTANTS`); mu came off a literal; K is now the §706 arithmetic, cell-referenced end to end — which is what "LINK ALL" asks for, not a decoration.

Inserting four Section-A rows moved everything below them by 4, and `PIER_STABILITY_ROWS` — the hand-maintained anchor table sheets **10** and **12-18** point back into sheet 9 by — had not moved. Nothing errors: downstream formulas just read the neighbouring row. The link gate's own evidence print was the proof (it asked `H47` for a service-case V and printed `null` while reporting "fully linked"); it now reads the export and walks the case table to find its length. Section B is anchored to `R.passiveCap + 2` rather than to `Ah`, and `pierStabilityDrift()` throws at generation time on any mismatch — negative control run by mutating the layout: `dead: sheet 9 writes 34, PIER_STABILITY_ROWS publishes 33`.

The wider defect surfaced while fixing that: **eleven hand copies** of the 1.5 / 1.8 / 2.5 acceptance rule, **eight still printing bearing 2.5** after §M-1 was decided to 1.0. Consequences, each real: `server/claude-validator.ts` was *failing* cases the engine had just passed; `server/comprehensive-pdf-export.ts` recomputed sliding as `mu*V/H` — passive-free — two pages after its own summary table printed the engine's number; five verdict chains in `narrative-engine.ts` hard-coded the literals, and the first compile of that sweep caught `c1Ok` referenced where it does not exist (TS2304). Sheet 9 prose/status, sheet 20's mu cell + status, `A01`/`C01`, `29-46-estimation.ts`, `checklist-export.ts`, `design-report.ts` and the PDF now interpolate `STABILITY_ACCEPTANCE` / `DESIGN_CONSTANTS`. The browser cannot import the engine (a deliberate type-only boundary), so `client/src/lib/stability-limits.ts` is the single client copy **and is gated**: setting `bearingFosMin: 2.5` made `verify:outcomes` print `DEFECT client UI copy of the acceptance rule ... the engine applies 1` and exit 1; restored gives `OK`, defects 0. Deleting the copy by carrying the limits in the API is filed as **row 22** rather than done silently, because it changes a response contract.

Owner-authored content corrected, not withdrawn: the four STRUCTURAL REVIEW comments quoted figures no engine run reproduces (large-bridge "0.677"; parwan/kherka/sukanaka bearing 0.930/0.902/0.871 with sliding 1.505/1.504/1.508). Re-measured on the current engine: large-bridge pier sliding **0.228 / 0.183 / 0.084 / 0.117 / 0.364** (min 0.084 at flood, overturning min 0.110, bearing 1.270), parwan **0.985 / 0.370 / 0.606**, kherka **0.979 / 0.488 / 0.846**, sukanaka **0.967 / 0.474 / 0.890**. Each comment now carries the reproduction command and states that the 2026-10-06 figures match no current run. **The UNSAFE flags stay** — that is a signing engineer's call, not this session's.

### Findings

| Finding | Disposition |
|---|---|
| Two gates were red at HEAD before this batch touched anything: `876a3bd` changed the engine's per-case output (a `passiveResistance` on each pier load case) without re-pinning, so `verify:engine` reported **11 of 485 drifted**. | Golden re-emitted deliberately (`--emit`): **490 pinned, 0 drift**, tamper control moves 48, discharge diagnostic restated as 0 of 490. Recorded as evidence for row 21 (two writers), with the cheap rule proposed: every engine-touching commit re-runs `verify`. |
| The register's tallies (§F/§L/§T24) still said 4 SAFE / 296 UNSAFE. | Corrected where they mislead: row 1 annotated, §M-1 marked DECIDED with what it now costs (only **6 of 105** UNSAFE cases fail bearing alone), next action 1 renumbered. Delivered measurement: **300 cases, SAFE 195, UNSAFE 105, 20 of 20 templates carrying an UNSAFE case**. |
| Is the new 503 a regression for anyone? | No consumer exists — grep over `client/`, `api/`, `server/` finds only the route, its tests and `security.test.ts`. It exists so the first hosted deploy fails legibly. Stated in §X-5/§X-7 instead of assumed. |

### Gates (transcripts in `archive/20261006-tmp-scratch-due17/logs/`)

`check` exit 0 · `verify` exit 0 on **eleven** lanes (links **20/20 fully linked**, broken 0 / diverge 0; cases 0 defects; outcomes defects 0 with client copy `OK`; parity 22 facts 0 defects; engine 490 pinned 0 drift) · `test` exit 0 `15/15 files in 2 lanes` · `deliverables` 6 files regenerated · **`candidate` exit 0** on all four chains plus `audit:policy`, bundle captured against `8b5730f2c5ef`.

### Artefact read-back (the delivered files, not the code that made them)

`test-output/design-workbook.xlsx`: sheet 9 `B22 mu 0.5 · B27 phi 30 · B28 gamma 18 · B29 Kp formula -> 3 · B30 cap 0.5`; `K51 -> 1.066` carrying the §706 formula, `N51 UNSAFE`; `K55 -> 1.627`, `N55 SAFE`; row 3 prose `sliding >= 1.5, overturning >= 1.8, bearing >= 1`. Sheet 20: `B18 0.5`, `F21 =$B$18*C21/D21 -> 1.7216`, `I21 SAFE`. QA rows D1/D2 present. `irc-checklist.html`: `Bearing >= 1 (pressure <= SBC)` / `(req >= 1)` with **zero** `2.5` occurrences. `design-report.html`: no `2.5 typical`, contains `>= 1 (pressure <= SBC)` and `>= 1.5 (IRC:6 Sec 114)`.

### Files changed this turn

| File | Change |
|---|---|
| `server/pier-case-engine.ts` | module-relative resolution, `isExistingDirectory`, `pierAssetTrees()`, nullable default root, evidence-note wording. |
| `server/api-routes.ts` | 503 / 400 / 400 route contract; containment checked against every installed tree. |
| `.dockerignore` | comment corrected to the real preference order. |
| `tests/integration/api-pier-cases.test.ts` | five assertions including chdir root-identity and the three status shapes. |
| `bridge-excel-generator/sheets/09-stability-check-pier.ts` | §706 Section-A cells, passive-aware K formula, corrected `PIER_STABILITY_ROWS`, `pierStabilityDrift()` + generation-time throw, acceptance interpolated. |
| `bridge-excel-generator/sheets/19-28-abutment-type1.ts`, `29-46-estimation.ts`, `A01-admin-substructure.ts`, `C01-qa-admin.ts` | mu from `DESIGN_CONSTANTS`; statuses and labels from `STABILITY_ACCEPTANCE`. |
| `bridge-excel-generator/narrative-engine.ts` | one `stabilityOk()` replacing five literal verdict chains, and the `c1Ok` scope bug it exposed. |
| `server/checklist-export.ts`, `server/claude-validator.ts`, `server/comprehensive-pdf-export.ts`, `server/design-report.ts` | colour logic, captions, validator comparisons, the PDF sliding row (now printing `Pp`) and the HTML report all from the constants. |
| `client/src/lib/stability-limits.ts` (**new**), `client/src/components/DesignCheckDashboard.tsx`, `CompareModal.tsx` | single client copy, used by the four gauges and the compare modal. |
| `scripts/verify-stability-outcomes.ts` | header rules rewritten to the rule in force, `BEARING_FOS_FOR_SBC_LIMIT` and the vacuous banner clause removed, client-copy check added. |
| `scripts/verify-workbook-links.ts` | evidence rows read from `PIER_STABILITY_ROWS`; case-table length discovered, not hard-coded. |
| `server/default-project-inputs.ts` | four STRUCTURAL REVIEW comments re-measured. |
| `tests/golden/deliverable-engine/kherwara.json` | re-emitted 485 -> **490**. |
| `august-due.md` | §X (X-1...X-7), §Y (Y-1...Y-9), §T28, rows 1 and 19 corrected, row 22 added, row 21 updated, §M-1 marked DECIDED, next actions 1 and 4b, footer. |
| `CODE-JUNCTION/august-due.md` | twin re-synced (`cmp` identical). |
| `CREAT-CHATLOG.MD` | this turn. |

### Deliberately not touched

No git commit, branch or push. `Attached_Assets/**` and the pre-existing staged deletions; no `git lfs pull`. The §706 **engineering** model itself (cap fraction, phi/gamma defaults) — the owner's `876a3bd` stands, and only the workbook and its copies were made to agree with it. §M-2 water level, §M-3 PDF hydraulics block, §M-4 discharge, PARWAN bar grade, OFL = HFL, SSR/DSR rates, IRC impact factors, estimation assumption register, empty `engineering/review/`. The four UNSAFE flags were corrected with numbers, never removed.

### Still DUE after this turn

Licensed-engineer sign-off (row 1, 105 UNSAFE of 300) · §M-2...§M-4 · scoped `git lfs pull` then real A2-A5 data and `knowledge/` (rows 4/5b) · first `docker build` plus the hosted deploy and the serverless-503 decision it forces (row 10 / §X-7) · pixel verification (row 12) · `lib/store/` persistence (row 11) · corrupt week-0 fixture (row 20) · two writers / one worktree (row 21, now demonstrably able to leave a gate red at HEAD) · **new row 22** — API-carried acceptance limits so the client copy can go.

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

### Measured first (probe `archive/20261007-tmp-c1check/probes/p.ts` → `out.log`)

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
fully linked`, **exit 1** (`links-tamper.log`). Reverted the one line (`probes/reverted-line.txt` is the
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

---

## Turn 30 — 2026-10-07 (paperwork landed 2026-10-08 00:1x) · DUE-20: the acceptance rule now travels in the design response, and the browser's copy is deleted (§AA)

**Directive in force:** *take up due tasks and complete them one by one* — auto mode, all approvals
presumed, no commits.

### What this turn did

Row 22 (§Y-5) was the last hand copy of the stability acceptance rule left in the product: the
browser could not import engine code, so `client/src/lib/stability-limits.ts` re-typed 1.5 / 1.8 / 1
and `verify:outcomes` grepped it. A gate on a copy is a workaround, so the copy went away instead.

1. **The rule became part of the result.** `types.ts` gained `StabilityAcceptance` and
   `CompleteDesignResult.stabilityAcceptance` (required, not optional — a result arriving without the
   rule it was judged against is a defect). `runCompleteDesign` returns the engine's own
   `STABILITY_ACCEPTANCE`, so the printed factors and the printed rule cannot disagree by construction.
2. **No new endpoint.** `POST /api/design/results` (`server/api-routes.ts:319`) already returns the
   engine result verbatim, so the field arrives untouched — proven against the live server, not argued
   (`tmp-due20-api.json`). A separate `/api/design/acceptance-limits` route was rejected: a second
   source for the same three numbers is the same disease with a nicer URL.
3. **Four verdict-rendering client surfaces converted**, not the two row 22 named:
   `DesignCheckDashboard` (four arc gauges + the `req ≥` caption), `CompareModal` (the `fosReq` map),
   `EngineeringCopilot` (both insight blocks *and* the prose they print), `WindLoadPanel` (two
   `FosRow`s, the wind pass/fail tests, `SpeedRow`'s colour logic — which needed a new `required` prop
   because it had been deriving its own colour from a literal — plus two sentences of method text).
   `DesignCheckDashboard`'s `max={1.5}` was inspected and deliberately **left**: it is the Lacey-ratio
   gauge axis, not a stability limit.
4. **Stale-cache guard.** `useDesignStore` persists `{results}` in `localStorage.lastDesignResults`;
   a payload written before this change has no rule in it, so the rehydrator now returns `null` and
   forces a refetch rather than painting limit-less gauges.
5. **The copy deleted and the grep inverted.** `stability-limits.ts` moved to
   `archive/20261007-tmp-due20/retired/`. Rule 6 of `verify:outcomes` now walks every `.ts`/`.tsx`
   under `client/src` and fails on three things: a hard-coded `*FosMin` literal (file, value, and the
   engine's value quoted beside it), any reference to the retired `STABILITY_LIMITS` name, and a file
   that renders stability verdicts without ever reading `stabilityAcceptance` — the direction the old
   grep could not see, because ignoring the response is how a green gate comes to mean nothing.

### Two real client bugs found while converting

- `CompareModal` had an `fosReq` entry for **"Abutment overturning FOS (worst)"** but that row was
  missing from `fosCols`, so its ✓/✗ indicator had never rendered. Fixed in the same edit; it was
  invisible precisely because the column list, not the requirement map, drove rendering.
- The store's cached-payload case above: without the guard, a returning user gets gauges with no
  threshold, which reads as "no requirement" rather than "stale cache".

### Four planted controls — and the two bugs they found in the guard itself

| Control | Result |
| --- | --- |
| `client/src/lib/tmp-limit-probe.ts` with `slidingFosMin: 2` | `DEFECT acceptance rule reaches the browser from the response`, exit 1 — and it printed `= 2` for a `2.5` literal and only one literal per file: pattern widened to `[0-9]+(?:\.[0-9]+)?` and switched to `matchAll` |
| probe `2.5` + a literal left in `DesignCheckDashboard` | every literal named against the engine's value; but the *reader* arm did not fire — `limitReaders` held bare filenames while the walker compares repo-relative paths, so the defect was unreachable. Fixed to full relative paths and re-proved |
| reader that ignores the response + retired name referenced | `shows stability verdicts but never reads stabilityAcceptance from the response` and the retired-copy defect, exit 1 |
| authoring slip: non-global regex into `matchAll` | lane crashed with a `TypeError` and printed **no** DEFECT line, exit 1 — a red gate that says nothing is indistinguishable from one that never ran; fixed rather than tolerated |

Green run: `OK   acceptance rule reaches the browser from the response`, defects 0.

### Gate state (§T30), all read from the transcripts

`check` **0** · `verify` **0** on eleven lanes (links 20/20 fully linked; outcomes 300 cases
SAFE 195 / UNSAFE 105, 20/20 templates, sliding 99 / overturning 82 / bearing 6; parity 22 facts;
presentation 19L/37P and 13L/33P; engine **493 pinned, 0 drifted**, tamper moved 48) · `test` **0**
15/15 · `deliverables` **0** (6 files) · **`candidate` 0** (check 72.2 s · verify 98.7 s · test 39.7 s
· audit:policy 10.1 s) against `8b5730f2c5ef`. Golden went **490 → 493** and the diff is exactly the
three new keys, so the rule is now pinned too: changing it takes a deliberate re-accept.

### Read-back: the app, not the code

Live `POST /api/design/results` → `stabilityAcceptance {slidingFosMin:1.5, overturningFosMin:1.8,
bearingFosMin:1}`. On `/suite/design`, after "Refresh engine metrics": gauges `req ≥ 1.5 / 1.8 / 1 /
1.5` against worst-pier 0.405 / 0.856 / 6.898 / 0.405 with marks `✗ ✗ ✓ ✗`; copilot `(req ≥ 1.5)`
`(req ≥ 1.8)`; wind panel `sliding ≥ 1.50, overturning ≥ 1.80`. The UI's verdict now matches the
engine's UNSAFE case because it is the engine's rule. Console clean. **Pixels still open (row 12)**:
this host's screenshot surface returns `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE / visibilityState=hidden`,
so the evidence is DOM text, not an image.

### Two honest-residue statements instead of a clean claim

- **42 hand-applied threshold comparisons survive across 12 client files** (`SeismicZonePanel` 9,
  `Design` 7, `engineeringNarrative` 6, `FormulaEvaluator` 4, `OptimisationAtAGlance` 3,
  `AbutmentStability` 3, `PierOptimiser` 2, and five files with 1 each). They are **not all the
  stability rule** — IRC:20 reduced factors, WARN bands that are not verdicts, optimiser design
  limits — so they are filed as **row 24** for site-by-site adjudication. Regex-sweeping them would
  have changed printed verdicts to quiet a grep, which is exactly the §Y-4 mistake in reverse.
- **`test-output/` HTML sizes are characters, not bytes.** `regenerate-test-output.ts` prints
  `design-report.html 430,004` while the file is **432,811 bytes** on disk (and 39,752 vs 39,965 for
  the checklist) — the gap is the multi-byte `≥ — × ₹` set. Measured this turn (`tmp-due20-htmlsize.txt`)
  and §T30 now labels them "chars". The workbook and four PDFs are byte-exact.

### Register / docs touched

`august-due.md`: row 22 struck with the §AA pointer, **new row 24**, **§AA** (AA-1…AA-8),
**§T30** gate run, §Y-5 annotated as closed, next-actions 4c/4d added, footer rewritten (DUE-20
summary plus the char/byte disclosure). `CODE-JUNCTION/august-due.md` re-synced and byte-compared.
Transcripts and the retired module under `archive/20261007-tmp-due20/` with a README.

### Safety

No git commit, branch or push. No `git lfs pull`. The dev server started for the browser pass
(PID 2192, :5180) was stopped and the port confirmed free. `Attached_Assets/**`,
`bridge-excel-generator/sheets-extracted/**` and the pre-existing `.gitignore` state untouched;
scratch files archived, not deleted.


## Turn 31 — 2026-10-08 (DUE-21: adjudicate the residual hand-applied stability thresholds in `client/`)

**Directive in force:** "take up due tasks and complete them one by one", with "presume my responce as allow once for all 100 prompts" / "AUTO MODE MEANS I PERMIT TO RUN ACCEPTING ALLOW ONCE FOR ALL SIMILAR CASES INCLUDING THIS ONE". No commits, branches or pushes were made or requested. This turn opened by closing DUE-20's paperwork (row 22, §AA, §T30) and then took row 24 — the 42 thresholds §AA had left as measured residue.

### What the row actually said, and what turned out to be true

Row 24 asked a yes/no-shaped question — should every remaining client threshold read `stabilityAcceptance`? The answer was **no**, and the premise was wrong in two places, found by measuring rather than by trusting §AA's own sentence:

1. **The "42" was not 42 stability thresholds.** AA-6 had counted regex matches, and that pattern also picked up Froude-number tests (`d.Fr < 1.0`), velocity and scour-depth limits, a biaxial DCR check (`<= 1.0`), an importance-factor choice, and division sentinels (`: 99`, `: 999`, `Infinity`). Re-measured with a matcher that requires a stability variable next to the comparison operator: **25 comparison lines / 33 literal occurrences across 10 files** (19 distinct values). Corrected in §AB-1 rather than restated quietly — a register whose counts rot is a register nobody can act on.
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

The controls also caught two authoring bugs before anything shipped: the first 6b draft referenced an undefined `FOS_RULE_VALUES` and produced a garbled message (rewritten as a sorted literal-set comparison), and a case-sensitive token list missed `r.worstSlid`, so the matcher needed the `i` flag — after which it immediately flagged `OptimisationAtAGlance.tsx`, **a file the manual count had missed**. A gate that finds what the human missed is the argument for gating rather than typing. The lesson repeated itself before this entry was written: the register's first DUE-21 count -- 28 lines / 34 literals across 9 files, from a hand-written scan -- did not match the gate's own matcher either. Re-running that regex as `measure-client-thresholds.ts` gives **25 / 33 across 10**: four of `AbutmentStability.tsx`'s six lines are print-only strings the adjacency rule refuses, and `OptimisationAtAGlance.tsx` was missing from the hand list. §AB-1 now carries the correction, because a count that has to be restated by hand is exactly the thing this turn was supposed to stop doing.

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

---

## Turns 32–34 — 2026-10-10 / 2026-10-11 (DUE-22 rows 4/5b · DUE-23 estimation enrichment §AD · DUE-24 pipeline currency §AE)

> Turns 32 and 33 landed in `august-due.md` (§AC, §AD) but not here — that gap is why this entry covers all three. Everything below was measured on the tree, and every number a previous turn asserted was re-measured before being repeated.

### Turn 32 — DUE-22: the corpus stopped being pointers, and the register's own explanation was wrong

- A scoped `git lfs pull --include "<95 paths>"` exited **0** while 29 files stayed 131–132 B stubs. Read `.gitattributes`: the repo attributes only lowercase `*.dwg *.pdf *.xls *.xlsx *.zip *.mp4 *.csv`, so 27 `.DXF` and 2 `.xlsm` never invoke the filter at all. The earlier "the square brackets in the names are the problem" diagnosis was **false** — 28 of the 95 paths carry brackets and four bracketed `.xls` files pulled cleanly.
- The deterministic mechanism is per-path `git lfs smudge`: read the pointer's own `oid`/`size`, check the fetched object against that sha256 **before** replacing the file, then `os.replace`. 29/29 materialised, 0 refused.
- **No unscoped pull was ever run**, and the owner's own deletions under `Attached_Assets/` were not restored.

### Turn 33 — DUE-23: the authority's own estimate found four under-billings

- Compared our bill against `plus Detailed ESTIMATE HL Bridge BEDACH.xls` (sha256 `5953625d…`, 4 sheets, **every cell a literal**), so the comparison had to be about which work families get priced rather than a formula transplant.
- Four real gaps fixed: **railing was registered but never billed** (₹1 747/Rmt sitting in the rate register with no `add()` behind it), **expansion joints billed at abutments only** (2 → 13 faces), **no traffic signs at all**, and an exclusion note that was a sentence rather than a schedule. A fifth question — the authority's `@4995 RCC M-20` band — was answered by reading its measurement sheet and settled with an assumption row plus exclusion clause (6), **moving no money**.
- Kherwara moved BOQ 22 → 25 lines, measurements 31 → 35, subtotal ₹1,39,16,667.302 → **₹1,43,14,822.853** (the ₹3,98,155.551 delta reconciles exactly to those three families), grand total → **₹1,65,80,143.5695, SAY 165.80 Lakh**. All 20 templates re-billed; all 25 tie cells on `Bridge measurements` read **TIES**.
- Two of our own guards earned their keep. `verify:costing` failed 20/20 templates on the new `run` basis because its `bandTotal()` re-derives quantities independently — the checker was the bug, and extending it took defects to 0. And `verify:engine` was **already red at HEAD** before this turn touched anything: owner commit `876a3bd` had moved the §706 passive term without re-pinning, including one `UNSAFE → SAFE` flip. Both features were accepted deliberately in one re-emit: **493 outputs, 0 drifted, tamper still moves 48**.
- Coverage proof that no further enrichment is due: our bill now carries **24 of the authority's 35 rate families = 96.2 %** of its cost. The remaining 11 lines (3.8 %) are each classified — soft/hard rock *are* billed by the 3 templates whose dig reaches rock, `@4995` is design intent, and the other eight need survey geometry no input carries.

### Turn 34 — DUE-24: the pipeline was still counting the corpus it had lost

- Re-running the stages exposed the residue §AC left: `normalized/` held **191 records for a 96-asset corpus**, `classified/` and `narrative/` **95 pointer-era readings each**, `drawings/` 31 — because every stage names its output `<sha256[:12]>_<fileName>.json`, so new bytes write a new record and the old one stays. A3's own line claimed `processed=31 of 191`: 16 real workbooks plus **15 readings of 132-byte stubs**, indistinguishable in the output.
- Fixed at the mechanism: new `scripts/assimilate/output_currency.py`, `relocate_stale(out_dir, expected)`, called by A2/A3/A4/A5. It **moves** records no current input produces into `<stage>/pointer-era/` — never a delete — and stages glob only the top level, so the ghosts stop being inputs while staying on disk. Each stage now prints its own `records=` and `relocated-pointer-era=`. Measured: **316 relocated**, top level 96 / 96 / 96 / 31, A3 `processed=16 of 96`.
- A5's eight `error` records were never eight broken drawings: the register's `drawing-cad` kind includes `.dwg`, and ezdxf reads DXF only. Now a named refusal `unsupported-dwg` with the reason — **28 DXF mapped, 4 DWG refused, 0 error, 0 stub, 0 missing**.
- Measured the ceiling instead of pushing through it: all 16 workbooks that read cleanly are BIFF `.xls`, and `xlrd 2.0.2` was probed — **no `XL_CELL_FORMULA`, and `Sheet` has no `cell_formula_text`**, so it cannot dump BIFF formulas at all. A3b's deep layer therefore runs on **0 of 16**; unblocking needs `.xlsx` copies or a pinned-dependency decision, which is the owner's.
- Two stale claims corrected by re-measuring: A3's header classifier is near-blind on this corpus (35 sheets, 548 headers → **463 blank / 80 label / 5 engineering-value**, because these property tables start their content below row 1), and row 4's "146 `Attached_Assets` paths deleted in the working tree" is **gone** (715 tracked = 715 on disk). The unscoped-pull hazard was restated on measured numbers: **1,876 of 2,080 files under `assets/` are still stubs**.
- `pnpm run assimilate` exits **1** exactly as designed, now against the true corpus: `LFS pointer stubs among indexed assets: 0 of 97` and `FAIL: 97 of 97 assets are unclassified`. Rows 4/5b are blocked on three named human inputs — 49 password-protected workbooks, 97 bucket signatures (`reason` + `decidedBy`), and the A3b format decision.

### Gate state at the end of turn 34

| Lane | Exit | Evidence |
|---|---|---|
| `pnpm run assimilate` | **1 — correct** | red by design on 97/97 unclassified; 0 stubs of 97 |
| `pnpm run check` | **0** | five typecheck lanes + `lint:narrative` 159 spans |
| `pnpm run verify` (11 lanes) | **0** | 132.6 s · golden 493 outputs / 0 drifted / tamper moves 48 · links 20/20 · values, costing, outcomes, parity, presentation 0 defects |
| `pnpm run test` | **0** | 91.0 s, 15/15 files in 2 lanes |
| `pnpm run audit:policy` | **0** | 5.8 s |
| `pnpm run candidate` | **0** | 6 deliverables + transcripts, commit `8b5730f2c5ef` |

Deliverables were deliberately **not** regenerated: no engine, sheet or server file moved in turn 34, so the bundle carries the six artefacts turn 33 regenerated with unchanged digests.

### Register and paperwork

`august-due.md`: row 4 rewritten from "the corpus is pointers" to the measured post-pull state with its three human blockers named; **§AC** (turn 32), **§AD** (turn 33), **§AE** (turn 34) and **§T32** gate run added; next-actions 5/5b re-pointed; footer re-led. `scripts/assimilate/README.md` gained a *Record currency* section, the A2-before-A3/A4 ordering rule, the `unsupported-dwg` status, the xlrd-has-no-formula-text fact and the scoped-pull warning. `CODE-JUNCTION/august-due.md` re-synced by copy. Transcripts under `archive/20261011-tmp-due24/` (`a2/a3/a4/a5.log`, `assimilate-gate.log`, `candidate.log`, `git-status.txt`, `stub-scan.txt`); nothing deleted — the register's convention is archive, not remove.

### Safety

Nothing committed, branched or pushed. **No `git lfs pull` of any scope was run in turn 34**, and no stage wrote under `Attached_Assets/`. The 316 relocations are tracked-file moves showing to git as `D` + `??`; §AE-7 and §T32 state plainly that `git restore` here would re-create the double-count, so the owner should commit them as renames or leave them. No engineering decision needing a licensed engineer was adopted: the four UNSAFE template flags, the presentation of the `UNSAFE → SAFE` §706 flip, rows 23/25/26, §M-2…§M-4, the 97 asset buckets and the encrypted-workbook question all remain the owner's and were left open on purpose.

### Still DUE after these turns

Licensed-engineer sign-off on **105 UNSAFE of 300** across **20/20** templates (row 1) · the three human inputs behind rows 4/5b · **row 25** client second model / overturning 2.00 vs 1.80 · **row 26** seismic 5/6 and the Cl. 219 citation · **row 23 / §Z-5** C1 one model, two labels · §M-2 governing water level · §M-3 PDF legacy hydraulics block · §M-4 design discharge (0 of 493) · first `docker build` + hosted deploy (row 10) · **pixel verification (row 12)** · `lib/store/` persistence (row 11) · corrupt week-0 fixture (row 20) · two-writer advisory (row 21).

## Turn 35 — 2026-10-13 (DUE-25: row 12, the pixel-level visual pass with eyes on the rendered surfaces) → §AF, §T33

> Row 12 had waited four turns on one thing: somebody actually *looking* at the output. The PDFs were read page by page — text with coordinates, then the same pages rasterised to PNG and inspected — and the surfaces did not hold up. Five defects, all real, all fixed, all re-measured on the regenerated files. Register: **§AF** (AF-1…AF-11) and **§T33**; row 12 is **split**, not closed, because the HTML half still cannot be looked at here.

### What eyes on the rendered pages found

- **The sheet-book's File Topic Index was 100 % fiction: 52 of 52 claims pointed at pages that did not hold the named sheet.** The index is written before `autoTable` decides where each sheet lands, so its page numbers were guesses about a document that had not been paginated yet — and nothing checked them. Fixed at the mechanism: `generateLandscapeBookPDF` is now a **three-pass convergence loop** (lay out → record where each sheet actually starts → re-lay with those numbers → accept only when the page map stops moving, throw if it will not settle), with the index placeholder pages created *before* the sheets so all passes share one geometry. The first draft re-flowed itself by inserting its own index pages; the checker caught that. Result on the printed file: **58 index claims, 0 mismatches, 0 sheets banded but absent from the index**.
- **98 of 99 pages carried no identity.** Every page now wears a band — `SHEET: <NAME>` / `(CONT.)`, `FILE TOPIC INDEX`, `SECTION DIVIDER` — with `Page n of N`. Implementing it exposed a second bug the checker caught rather than me: bands were painted in both the creation pass and the final pass, so sheet first pages carried **two overlapping stamps** and read as "unstamped". Bands are now final-pass only. **0 unstamped apart from the cover; 0 stamps disagreeing with the real length**; comprehensive report **225 pages, 0 unstamped**.
- **Merged notes printed once per column.** ExcelJS hands *every* cell of a merged range the master's value, so a three-column note occupied all three. `cellDisplay()` now keeps text on the anchor cell only (`cell.isMerged && cell.master.address !== cell.address → ''`). Pixel-checked on `AFFLUX CALCULATION` (p16–20).
- **Two silent truncations.** The print window was hard-coded at 140 rows and the table additionally capped width at `Math.min(colCount, 15)`. Measured against the delivered workbook: max **97** source rows, max **15** printed columns — the cap was never tripped because the widest sheet sat *exactly* on it, with zero headroom. Now an explicit `400 × 18` window, the width cap is gone, and a sheet whose source is taller prints a red **`!! PRINT CLIPPED: this worksheet holds N rows …`**. `sourceColCount` was probed and deliberately **not** added: `ws.columnCount` reports 60 for every sheet because it grows with the scan window.
- **Off-page tables.** The appendix grid assumed a column split and the detailed estimate overran the right margin. `tableLayout` was tried and proved absent — not in the installed v3 typings and not in the v5 runtime bundle — so widths are computed (longest-cell weights, clamped, renormalised to the printable width) with `truncateCell`, `tableWidth` and `overflow: 'linebreak'`. Pixel-checked: appendix p67 prints 3 real columns with legible names, and the `TOTAL COST` band on p61–62 clears the last row.
- **The last page printed a bare FOS with no rule beside it.** Now `0.40 vs min 1.5 - BELOW LIMIT` and `0.86 vs min 1.8 - BELOW LIMIT` in red, `1.70 vs min 1 - OK`, limits interpolated from `STABILITY_ACCEPTANCE`. **No engineering number moved** — this is presentation of the engine's own verdict, and it is row 1's evidence, restated rather than resolved.

### One red gate, and the attribution mattered

`pnpm run check` came up **2** on six `lib/` errors (3× TS4114 missing `override`, 3× unused imports). They were **not** in my files and **not** in HEAD: `git log` shows those files untouched since `ab38f29`/`f6b9211`, and `tsconfig.base.json` carries an **uncommitted** flip of `noImplicitOverride`, `noUnusedLocals` and `strictFunctionTypes` from `false` to `true`, mtime **2026-10-12 23:12** — after §T32 recorded `check` green. Rather than revert a config decision that is not mine (row 21: two writers in this worktree), the six violations were repaired: `override` on `ApiError.name`, `ResponseParseError.name`, `ResponseParseError.cause`, and the dead imports trimmed from two `lib/engine` test files. `check` exit **0** again, and again after the register edits.

### A fourth stale assertion in four turns

Row 18a claims `export-sample-output-bundle.ts` is "the only tool that converts SVG diagrams to PNG". A grep for `sharp` returns **two** files: that script **and `server/comprehensive-pdf-export.ts:455`**, where a dynamic import rasterises each annexure drawing into a PNG page **of the signed deliverable**. So `sharp` is load-bearing on the shipped path and sits in root `devDependencies`; an install without dev dependencies loses drawing pages, not a dev tool. The code degrades honestly (`rasteriseAnnexureSvg` → `null`, and the page says there is no rasteriser), which is why no gate ever saw it. Corrected in place at row 18a, filed as §AF-11, promoted to next action 11 — **not changed**, because the packaging decision is the owner's.

### Gate state at the end of turn 35

| Lane | Exit | Evidence |
|---|---|---|
| `pnpm run check` | **0** | five typecheck lanes + `lint:narrative` 159 spans + `lint:pdf-glyphs` 1 463 literals / 5 exporters · re-run **after** the register edits, still 0 (`check-after-docs.txt`) |
| `pnpm run verify` (11 lanes) | **0** | golden 493 outputs / 0 drifted / tamper moves 48 · links 20/20 workbooks, 12 411 formulas · values 104 624 cells, 0 defects · costing · uplift · cases · outcomes · parity 22 facts · presentation 56/56 sheets and every PDF `MediaBox` |
| `pnpm run test` | **0** | 15/15 files in 2 lanes |
| `pnpm run audit:policy` | **0** | — |
| `pnpm run deliverables` | **0** | 6 artefacts, `Total sheets: 56/56` |
| `pnpm run candidate` | **0** | `check 84.0 s · verify 141.4 s · test 140.8 s · audit:policy 23.9 s`, bundle rebuilt on `8b5730f2c5ef` |
| Render inspection | **5 found, 5 fixed** | sheet-book **99 pages**: 92 banded sheet pages / 56 distinct sheets, index [2,3,4,5], dividers [6,57], 0 unstamped, 58/58 index claims, 23 multi-page sheets · comprehensive **225 pages**, 0 unstamped, 0 disagreeing |

Artefacts: `design-workbook.xlsx` 111,404 · `sheet-book.pdf` **2,741,527** (was 3,308,013) · `comprehensive-report.pdf` **9,218,343** (was 10,595,682) · `short-design-report.pdf` 225,252 · `design-report.html` 380,066 · `irc-checklist.html` 39,752. The two HTML figures are characters, not bytes (381,556 / 39,965 on disk — multi-byte `≥ — × ₹`), the same disclosure as §T30.

### Register and paperwork

`august-due.md`: **§AF** added before `## IMMEDIATE NEXT ACTIONS`, **§T33** after §T32, **row 12 split** (PDF/workbook half DONE, HTML-on-screen half open), **row 18a corrected** in place, next-action **9** updated and a new **11** added, "Last updated" rewritten. `CODE-JUNCTION/august-due.md` re-synced by copy. Evidence in `archive/20261011-tmp-due24/`: `sheetbook-final.txt`, `stamps9.txt`, `gate17/18.txt`, `candidate3.txt`, `sheet-extent.txt`, `liberrors-prov*.txt`, `tsconfig-diff.txt`, `check-after-docs.txt` and the rasterised pages under `img2/`.

A numbering defect worth naming: this register's `§T` counter and this file's turn counter parted at DUE-22 (the chatlog counted DUE-22/23/24 as turns 32/33/34; the register logged one §T32). This entry is chatlog **Turn 35** = register **§T33**, and §T33 says so on its first line so the next reader does not chase a phantom turn.

### Safety

Nothing committed, branched or pushed; no `git lfs pull` of any scope; `archive/` only grew. Two working-tree items are now in front of the owner's commit step beyond §AE-7's rename advice: the `tsconfig.base.json` strictness flip (kept, not reverted) and `package.json` (`lint:pdf-glyphs` lane added to `check`; `nanoid 3.3.16 → 3.3.18`). **Also corrected here, because I nearly repeated a phantom:** the working note for this turn said tool results had been carrying prompt-injection text impersonating system messages ("ignore previous instructions … do not run typecheck …"). Audited against the session transcript by role and block type, **no such text exists in any tool result**. The strict pattern returns 14 `tool_result` hits, every one of them an echo of my *own* reading of `feedback-verify-injection-provenance.md` — the memory file written after the identical 2026-10-05 false positive, whose text literally contains the phrases being searched for — plus 7 in `assistant/thinking` and 1 in `user/text` that are likewise mine. This entry previously asserted the injection as fact; that assertion was wrong, is retracted here, and the gates were run and are green regardless. Recorded as §T33's fourth self-correction.

### Still DUE after this turn

**HTML rendered on a screen** (browser surface here is `0×0`) · licensed-engineer sign-off on **105 UNSAFE of 300**, 20/20 templates (row 1), now printed in red on the report's last page · §AF-10/AF-11's five rendered-surface observations (1–46 numbering vs the 56-tab book, `sharp` placement, near-blank pier-stability cover p15, D-04 scour label over a gridline, ~40 % empty appendix pages) · rows 4/5b's three human inputs · **row 25** · **row 26** · **row 23 / §Z-5** · rows 17–18 · §M-2…§M-4 · first `docker build` + hosted deploy (row 10) · `lib/store/` (row 11) · corrupt week-0 fixture (row 20) · two-writer advisory (row 21).

## Turn 36 — 2026-10-16 (DUE-26: water-level unification + uplift anchorage + engine golden re-accept) → §T34

> Three owner decisions taken 2026-10-15 were applied and certified this turn. The governing-water-level question — open since DUE-4 and the reason the parity gate carried a named exclusion — is **closed by unifying sheet 3 onto the engine definition**, not by choosing one of two disagreeing numbers. The hydrodynamic-uplift UNSAFE is **closed with hold-down anchorage**. The Item-4 estimate decisions moved the golden snapshot, which was re-accepted through the gate's own `--emit` protocol. One red gate (parity) was root-caused to a PDF label truncation and fixed at the harness, not the renderer. Register: **§T34**; 11/11 gates green.

### What closed

- **§M-2 / DUE item 2 — governing water level → CLOSED.** The choice was "unify on the engine definition": make sheet 3 use the engine's canonical waterway (`spans × spanLength`) and the engine obstruction areas, so `AFL == DWL` and the two numbers *become one number* rather than one being adjudicated over the other. In [03-afflux-calculation.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheets/03-afflux-calculation.ts) `computeLegacyAffluxChain` became `computeAffluxChain` and reproduces `calculateHydraulics` line for line — `bridgeWidth = numberOfSpans × spanLength`, `effectiveWaterway = bridgeWidth − numberOfPiers × pierWidth`, `unobstructedArea = bridgeWidth × avgDepth`, deck blockage = `bridgeWidth × DECK_OBSTRUCTION_DEPTH_M` (0.83), Molesworth `afflux = ((V²/17.85)+0.0152)·((A_unob/A_ob)² − 1)`, `afl = hfl + afflux` (AFL cell **C76**). Sheet-3's printed AFL is now **100.856** where it printed 101.375. In [09-stability-check-pier.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheets/09-stability-check-pier.ts) §D became `=ROUND(B16-'afflux calculation'!C76,3)` → **0**, with a note that a non-zero value flags a future divergence. **No structural/freeboard/scour verdict moved** — they already read the engine DWL — and the parity harness's water-level exclusion was retired from the header comment (only *mean scour depth* is a deliberate exclusion now).
- **DUE item 1 — hydrodynamic uplift → CLOSED with anchorage.** `large-bridge` read UNSAFE at **FOS 1.11** on uplift alone. Per the decision, hold-down anchorage was added at the pier bases in [05-deck-anchorage.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheets/05-deck-anchorage.ts): base FOS (self-weight only) reported separately from the anchored FOS, `BOLT_CAPACITY_KN = 45.2` (20 mm grade 8.8), bolt force = 1.5× the FOS-1.2 margin, `numberOfBolts`, `anchorageCapacity = numberOfBolts × BOLT_CAPACITY_KN`, and safety against uplift = `(resisting + anchorage) / totalUplift`. The row is now labelled `Factor of safety against uplift (with anchorage)`. `verify:uplift` reports `large-bridge FOS = 1.25 SAFE` (was 1.11 UNSAFE); all 20 templates SAFE.
- **DUE item 4 — estimates → applied, golden re-accepted.** M30/M35/M40 concrete rates = **5111 / 6111 / 7111** (`material-rates.ts`, `SSR_RATE_SOURCE`, plus the cautionary-sign 500-33/500-34, railing and hold-down-anchor lines); backfill = **0.4 × excavation** (`BACKFILL_RATIO_OF_EXCAVATION`, [design-engine-types.ts](file:///e:/Rajkumar/Bridge_Slab_Design/shared/design-engine-types.ts)); steel ratios retained at the BEDACH-derived 1.5 % / 1.45 % / 1.5 %. These moved `estimation.*`, so the pinned engine snapshot was re-emitted through the gate's documented protocol: `pnpm run verify:engine -- --emit` → *"Emitted 493 pinned values"*; the re-run then reported `493 outputs checked, 0 drifted, tamper moved 48`. No hydraulic value moved — the `+50 m³/s` diagnostic still displaces **0** outputs.

### The one red gate, and why the fix was in the harness

`verify:parity` came up red on the deck-anchorage row: `'Factor of safety against uplift': only in HTML (8.165 / 99)`. The number was present and correct in **both** documents — what differed was the label. Dumping the extracted PDF text (`parity-dump/`) showed the PDF's workbook-grid appendix prints every cell into a fixed-width grid and elides labels past 32 characters, so the 48-character label survives as `Factor of safety against uplift…`, an ellipsis that the harness's latin1 extraction keeps only as an invisible byte — which the `$`-anchored pattern could never match. The fix relaxed the fact regex to a **prefix match** (`/^factor of safety against uplift/i`), the same class of cosmetic tolerance the harness already applies to precision and digit grouping; no renderer was changed, because nothing was wrong with the renderer's output. After the fix: `2 projects · 22 shared facts · defects: 0 · self-contradictions: 0`.

### Gate state at the end of turn 36

| Lane | Exit | Measured |
|---|---|---|
| `pnpm run check` | **0** | five typecheck lanes + `lint:narrative` (159 prose spans) + `lint:pdf-glyphs` (1 461 literals / 5 exporters) |
| `pnpm run verify` (11 lanes) | **0** | golden 493 / 0 drifted / tamper moves 48 · sheets (46-sheet contract) · links 20/20 `broken:0 diverge:0` · values 104 924 cells / 12 451 formulas / 0 defects · costing 20/0 · uplift 20/0 · cases 20/0 · outcomes SAFE 195 / UNSAFE 105 / 0 defects · parity 22 facts / 0 defects · presentation OK · engine 493 / 0 drifted / boundary OK |

Evidence: per-gate transcript in `verify-run.log`.

### Register and paperwork

`august-due.md`: **§T34** added after §T33, **§M-2 marked closed** in the sign-off table, the live **§SUMMARY item 3** and the **IMMEDIATE NEXT ACTIONS 2 / 4b** entries updated, and the still-due lists now name §M-3/§M-4 (not §M-2). `CERTIFICATION-CODE-JUNCTION.md`: a 4th re-certification pass (**items 23–27**) records the three closures, the parity root cause, and the 11/11 gate table; §18 item 2 struck through as resolved; scorecard +1 row (124 checks / 95 PASS). `ACTION-PLAN.md`: the waterway/water-level, uplift and zod items moved to closed. `CODE-JUNCTION/DUE — needs you, not me.txt`: items 1 and 2 annotated RESOLVED, item 4 partly decided, engine decoupling still deferred. `CODE-JUNCTION/` otherwise empty; no `august-due.md` re-sync owed.

### Still DUE after this turn

- Licensed-engineer sign-off — **105 UNSAFE of 300, 20/20 templates** (row 1)
- **§M-3** legacy hydraulics block in the comprehensive PDF · **§M-4** which discharge is the design discharge · **§M-5** does a C1 abutment exist · **row 25** (overturning 2.00 vs 1.80) · **row 26** (seismic 5/6, Cl. 219)
- SSR/DSR rates remain flagged "provisional" pending the official schedule; **engine decoupling** from `client/` / `api/` / `netlify/` — owner-deferred
- HTML pixel verification on a real display · first `docker build` + hosted deploy · `lib/store/` · corrupt week-0 fixture · two-writer advisory

### Safety

Nothing committed, branched or pushed; no `git lfs pull` of any scope. The only files written this turn are the three engine/sheet sources named above (applied in the prior working tree), the golden snapshot, the parity harness header, and documentation. Untracked scratch logs (`verify-run.log`, `parity-dump/`) were left in place as evidence.

---

## Session 2026-10-30 — Apply all *.txt / *.md instructions + declare redundant docs

### Turn — user
"APPLY ALL FROM *.TXT AND *.MD >>>>>REPOSITORY ROOT AND ITS SUB FOLDERS >>>>>>USED UP FILES NEED DECLARED AS REDUNDANT AND DELETED AT SUITABLE TIME"

### Scope agreed with the user
- Source scope: everything in root + all subfolders, including `archive/` and `sample/*.log` dumps.
- Used-up files: archive via `git mv` (the repo's archive-never-delete ground rule), not hard delete.
- Pending TODOs: apply all actionable open items found in the in-scope docs.

### What was applied this turn
1. **README.md — Project documentation section repointed** away from three dangling paths
   (`CODE-JUNCTION/bridge_slab_design_comprehensive_impl_plan.md` and
   `CODE-JUNCTION/BRIDGE 12 AUD.txt` do not exist; `origin-weekly-plan.md` had moved to
   `archive/20261023-w00-closeout/`). The section now points at `creat.md` / `CANONICAL.md`,
   the Phase-2 kit, `AUDIT-REPORT-v1.0.md`, and the archived weekly plan.
2. **CANONICAL.md — three dangling links fixed:** `origin-weekly-plan.md` and
   `docs/plan-b/15-week-implementation-plan.md` now point at their W00 archive locations, and
   `CODE-JUNCTION/VENICE-GUIDE.MD` (absent) now points at the real file
   `CODE-JUNCTION/VENICE IS GURU.txt`. This is the ADR-0012 (no-dangling-references) rule applied.

### Used-up files declared REDUNDANT (declared now, `git mv` at a suitable time)
Rows added to `archive/MANIFEST.md` §"Pending retirements (not yet moved)":
`Get_Code_Sudited_Grok.md`, `MASTER-APP-TESTER.md`, `ACTION-PLAN.md`,
`CODE-JUNCTION/00 FOR ALL APPS/000 master tester venice.md`, `CODE-JUNCTION/Slab.txt`,
`CODE-JUNCTION/Slab2.txt` (byte-identical duplicate, sha256 `0d169617…`),
`CODE-JUNCTION/Slab replit chat.txt`, `CODE-JUNCTION/VENICE IS GURU.txt`, `.q1.txt`,
`excel_workbook_audit_report.md`. Each row names the artefact that replaced it.

### Still due after this turn
- `AUGUST ACTION PLAN.md`, `creat1.md`, `replit.md`, `kiro-impl-plan.md` (WEEK 5+ items),
  `DREAM030526.md` (2 open backlog items) and `PHASE-2-MASTER-PLAN.md` (phase exit gate)
  carry open items that are cross-week engineering work, not W00 clerical cleanup.
- Doc consolidation (H-01, 293+ `.md`) is larger than the declaration above; only the
  root-level, instruction-bearing set was declared redundant here.
- Gate harness is not runnable in this worktree (no local `node_modules`/`tsx`), so the
  README module map and gates were not re-run; the changes are prose/link-only and inside
  no gate-generated block.

### Safety
Nothing committed, branched, pushed, or moved. Only `README.md`, `CANONICAL.md`,
`archive/MANIFEST.md`, `creat.md` and this chatlog were edited.

---

## Archived from creat.md §8 — Session 2026-10-26 — W06 tolerance sign-off (the project's first non-DRAFT event)

> Relocated here on 2026-10-30 when `creat.md` §8's rolling-24 h window was applied
> (owner decision: relocate-then-remove, so no history is lost — archive-never-delete).
> Verbatim below as it stood in §8.

**Operator:** TraeCode (agent) | **Verifier:** not yet run
**Triggered by:** User — "the nine tolerance flags go to zero by recording the licensed-engineer approvals; keep --strict; prove it is falsifiable"

#### Actions taken
1. Recorded the licensed-engineer ruling in `foundation/tolerances.json`: `approvedBy` + `approvedOn` (2026-10-26) on all nine quantity entries and on `default`; replaced the afflux placeholder `approvedBy: "PENDING — licensed engineer"` with the approver; moved the charter provenance into each entry's `note`.
2. Emptied `pendingApproval`. The nine records were an exemption, not an approval, and `verify-tolerances.mjs` fails any entry that is both approved and still listed — the list may only shrink.
3. Proved falsifiability: `verify:tolerances --strict` green, then blanked one `approvedOn` to force exit 1, then restored it to green.
4. Filled the `Engine ruling` section of `project/decision-log/DEV-007.md`.

#### Key findings
- The eight unflagged quantities sat at `atol 1e-6` against a `default` of `1e-9` — a 1000x widening that had never been approved. `hydraulics.afflux` at 0.05 rtol / 0.02 atol is ~50,000x looser than the charter's 1e-6 rtol. The nine approvals are a licensed ruling on nine real loosenings, not paperwork.
- The earlier green of `verify:tolerances` came from the `pendingApproval` exemption, not from an approval — the "defanged gate" reading, now closed.

#### Outcome / gate verdict
- `verify:tolerances --strict` exited 0 unpoisoned ("9 registered, 0 unapproved, 0 recorded-pending") and exited 1 poisoned ("UNAPPROVED hydraulics.afflux: missing approvedBy/approvedOn"). The gate is falsifiable and the exemption list is empty.
- Approver: RAJKUMAR SINGH CHAUHAN, Fellow IEI, reg. no. 1293016. The afflux widening was explicitly reviewed and accepted.

**Next-week blockers:**
- The code-side half of DEV-007 is not closed: `engineConsistency.test.ts` still applies a bare 0.08 m absolute for afflux and still cross-wires `excel.scourDepth` against `web.meanScourDepth`. Deciding the canonical field names and repointing the test at the registry tolerance remains a code change.
