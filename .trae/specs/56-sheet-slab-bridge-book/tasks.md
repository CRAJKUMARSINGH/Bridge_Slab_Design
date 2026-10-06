# Implementation Tasks: 56-Sheet Slab Bridge PDF Book

Dependency map:
- Task 1 (sheet contract) must complete before any sheet-generation task references the new 56-item names array.
- Task 2 (robotic input generator) must complete before the CLI / PDF book generator can run with no seed.
- Tasks 3a–3c (10 new sheet generators) can run concurrently with each other after Task 1; they do not conflict on files.
- Task 4 (index.ts wiring) depends on Task 1 and all of 3a–3c completing.
- Task 5 (PDF book) depends on Task 4 and Task 2 completing.
- Task 6 (CLI) depends on Task 5.
- Task 7 (verify) depends on all prior tasks.

## Task 1: Update sheet contract (sheet-contract.ts) to 56 sheets

**Priority**: high
**Depends on**: —
**AC coverage**: AC-01, AC-05

### Description
Replace the 46-item `EXPECTED_SHEET_NAMES` in [sheet-contract.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheet-contract.ts) with the exact 56-item ordered list from spec.md FR-01 (re-indexed final positions 1–56). Set `EXPECTED_SHEET_COUNT = 56`. Update `LANDSCAPE_SHEET_INDEXES` Set with union of existing landscape indices (3,5,9,10,15,16,17,18,19,20,21,30,31) + new ones (2,3,11,12,24,50) per FR-05 (deduplicate the overlapping index 3 — final Set = {2,3,5,7,11,12,13,15,19,20,24,34,35,50}).

### Test Requirements (TR)
- **rule TR-1.1**: `EXPECTED_SHEET_NAMES.length === 56` and `EXPECTED_SHEET_COUNT === 56`.
- **rule TR-1.2**: All 10 new sheet names are present (case-insensitive substring match against the 10 names in AC-03).
- **rule TR-1.3**: `LANDSCAPE_SHEET_INDEXES` is a `Set<number>` with 13+ members and includes `2, 11, 12, 24, 50`.
- **rule TR-1.4**: `pnpm run typecheck` passes.

---

## Task 2: Implement robotic input generator (bridge-excel-generator/robotic-input.ts)

**Priority**: high
**Depends on**: —
**AC coverage**: AC-02, AC-08

### Description
Create [robotic-input.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/robotic-input.ts) exporting `generateRoboticProjectInput(seed?)` and `RoboticInputValidationError`. Use a **deterministic** pseudo-random selection (no `Math.random()`): use a fixed catalogue of 5 bridge name/river/location tuples and a deterministic catalogue of span × lanes × levels combos so the same empty call returns byte-identical input.

Catalogue entries must reference PWD (R&B) Rajasthan naming convention (per project memory). Generated input **must** pass `ProjectInputSchema.parse()`; generate 9-point `crossSectionData` (parabolic: `gl = bedLevel + 2×((chainage/width) - 0.5)² × depth_max`) so hydraulics engine sees a valid concave profile.

Size pier/abutment from spans using the `DESIGN_CONSTANTS` registry already present in the shared constant system; pier width = 2.0 m, pier length = carriageWidth + 2×0.6 m (parapet + clearance); abutmentHeight = rtl - foundationLevel; abutmentWidth = pierLength + 1.5 (wing).

### Test Requirements (TR)
- **rule TR-2.1**: `generateRoboticProjectInput()` → `ProjectInputSchema.parse(result)` → returns `result` without throwing.
- **rule TR-2.2**: Level invariants hold: `rtl > agl > hfl > bedLevel > foundationLevel` and `agl >= bedLevel + 0.5`.
- **rule TR-2.3**: Deterministic: two consecutive calls with no seed return objects with JSON-stable equality (`JSON.stringify(a) === JSON.stringify(b)`).
- **rule TR-2.4**: `crossSectionData.length === 9` and chainage strictly increasing.
- **rule TR-2.5**: `pnpm run typecheck` passes.
- **rubric TR-2.6 — Plausibility (0-2)**:
  - 2: span ∈ [10,30], spans ∈ [3,9] odd, carriage width 7.5 or 11.0 m, sbc 150–350 kPa, phi 27–34°, concrete M25/M30/M35, steel Fe415/Fe500, seismic zone II–IV.
  - 1: one parameter outside band but not absurd.
  - 0: two+ parameters implausible (span < 5, sbc < 50, etc).

---

## Task 3a: New sheet generators batch A (Admin & Substructure: Design Criteria, Input Summary, Seismic, Wind)

**Priority**: high
**Depends on**: Task 1
**AC coverage**: AC-01, AC-03, AC-06, AC-08

### Description
Create a new file [bridge-excel-generator/sheets/A01-admin-substructure.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheets/A01-admin-substructure.ts) exporting four async functions matching the style of `01-index.ts`:

1. `generateDesignCriteriaSheet(ws, input)` — 2-column format, rows:
   - Project, location, authority, PWD circle
   - Standards cited (IRC:6-2016, IRC:112-2015, IRC:78, IS:456, IS:1893, IS:875 Part-3, MORTH 5th revision)
   - Material fck, fy, unit weights, IRC 112 §1.3 partial factors γc=1.5 γs=1.15
   - Seismic zone factor Z, importance factor I=1, response reduction R=3 (IS:1893 §6.4.2)
   - IRC:6 §200 load combinations, §209 wind, §212 EP=1.5 abutment (per hard constraint)
   - Freeboard rule IRC:6 §112.3 minimum 1.0 m above HFL

2. `generateInputDataSummarySheet(ws, input)` — grouped key/value table mirroring all ProjectInput fields (6 groups).

3. `generateSeismicAnalysisSheet(ws, input)` — IS:1893 §5/§7:
   - Z (from SEISMIC_ZONE_FACTOR table in design-engine.ts)
   - I=1, R=3 (ordinary RC frame with SMRF per §7.10)
   - Sa/g for rock = 2.50/T for T<0.4s, ... (Table 4 curve) — compute T=Ct·h^(0.75) Ct=0.075 m^(−0.25)
   - Ah = Z·I·Sa/(2·R·g)
   - Base shear VB = Ah·(DL + 0.5·LL) — 0.5 LL per §7.3.1 for live load contribution
   - Distribute pier shear equally among number of piers + 0.6 on each abutment
   - All 3 clause references: IS:1893 §6.4.2, §7.3.1, §7.10.2

4. `generateWindLoadSheet(ws, input)` — IS:875 Part-3 + IRC:6 §209:
   - Vb = designWindSpeed default 33 m/s (IRC:6-2017 §209.2)
   - k1 (probability risk) = 1.0 for 50-yr return (§209.3 / IS:875 §5.3)
   - k2 (height/terrain) = 1.0 for flat open terrain Cat 2, h < 10 m
   - k3 (topography) = 1.0 flat
   - Vz = Vb·k1·k2·k3
   - Pz = 0.6·Vz²  (kN/m²)
   - Force pier: Pz × Cf=1.2 × pierWidth × (rtl - foundationLevel)
   - Force superstructure: Pz × Cf=1.3 × carriageWidth × 1.5 m (deck depth incl parapet)
   - Clause refs: IRC:6 §209.1, §209.2, §209.6; IS:875 Part-3 §5.3, §6.1

All functions use `setColumnWidths`, `addTableHeader`/`addTableRow`, `setCellValue` from [utils.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/utils.ts). No naked `any`.

### Test Requirements (TR)
- **rule TR-3a.1**: All four functions create worksheet rows ≥ 10 and contain ≥ 3 distinct `§` clause references per sheet.
- **rule TR-3a.2**: Seismic sheet Ah is a finite positive number; VB finite positive.
- **rule TR-3a.3**: Wind sheet Vz in [20, 60] m/s; Pz, pier force, super force all finite positive.
- **rule TR-3a.4**: `pnpm run typecheck` passes.

---

## Task 3b: New sheet generators batch B (Superstructure & Approaches: Bearing, Expansion Joint, Approach Slab)

**Priority**: high
**Depends on**: Task 1
**AC coverage**: AC-01, AC-03, AC-06, AC-08

### Description
Create new file [bridge-excel-generator/sheets/B01-superstructure-approaches.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheets/B01-superstructure-approaches.ts) exporting three async generators:

1. `generateBearingDetailsSheet(ws, input)` — IRC:78 §300, IRC:6 §210:
   - Elastomeric bearing selection. Reaction per bearing = (DL+LL)/bearings. 2 bearings per abutment; 4 per pier (2 lanes) or 6 per pier (4 lanes).
   - Pad size L×B ≥ reaction / (7 MPa allowable compression — IRC:78 §303.2.1)
   - Thickness t = max shear strain 0.7 × t ≥ Δ_shear; Δ_shear = ΣΔthermal + ΣΔseismic + ΣΔrotation
   - Thermal Δ = α·Lspan·ΔT = 12e-6 × spanLength × 35°C, half each end
   - t_min = 20 mm; round standard pad sizes: 250×250×42, 300×300×52, etc
   - Clause refs: IRC:78 §303.2.1 (compression), §303.2.2 (shear), §303.2.3 (rotation); IRC:6 §210 bearings arrangement

2. `generateExpansionJointSheet(ws, input)` — MORTH §5.6, IRC:6 §211:
   - Strip seal joint size. Δmovement = α·Ltotal·ΔT = 12e-6 × totalLength × 35°C. Round to standard modules: 40/80/120 mm.
   - Number of joints: numberOfSpans + 1 (abut joints)
   - Drainage: scuppers at 5 m c/c along each kerb line. Number per deck span = ceil(carriageWidth / 5) * 2 lines.
   - Scupper outlet 150 mm Ø UPVC with 200 mm Ø sump; grate area ≥ 0.01 m²
   - Clause refs: IRC:6 §211.1 deck drainage, §211.2 joints; MORTH 5th Rev §506.2.1 strip seals, §506.2.3 deck drainage

3. `generateApproachSlabSheet(ws, input)` — IRC:112 §11.5, IS:456 §22–§24:
   - Slab L=3.0 m, t=250 mm, M25/Fe415
   - Wheel patch 350×200 mm at 0.6 m from kerb; impact factor 1.25 (IRC:6 §205 for short spans)
   - BM @ midspan = patch load × (L/2 - a/2); distribute across effective width (a + 2·t·√3)
   - Ast req = (0.5·fck/b/d)·(1 − √(1 − 4.6·Mu/(fck·b·d²))) × b·d·(fck/fy)  (IS:456 §G.1.1)
   - Spacing = 1000·Ast_provided / (bar_dia²·π/4) — s ≤ 3d or 300 mm
   - Clause refs: IS:456 §22.2 analysis, §26.5.2.1 max spacing; IRC:112 §11.5 approach slab length, §7.4.2 deflection limit L/350

### Test Requirements (TR)
- **rule TR-3b.1**: Three functions create ≥12 rows each with ≥3 clause refs per sheet.
- **rule TR-3b.2**: Bearing pad L,B,t all finite positive; area ≥ reaction / 7e6 (7 MPa converted to Pa × m² = N ⇒ kN ÷ 7e3 kN/m² = m² ok).
- **rule TR-3b.3**: Approach slab steel spacing ≤ 300 mm; Ast provided ≥ Ast required.
- **rule TR-3b.4**: `pnpm run typecheck` passes.

---

## Task 3c: New sheet generators batch C (QA & Admin: Compliance Checklist, Serviceability, Revision)

**Priority**: medium
**Depends on**: Task 1
**AC coverage**: AC-01, AC-03, AC-06, AC-08

### Description
Create new file [bridge-excel-generator/sheets/C01-qa-admin.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/sheets/C01-qa-admin.ts) exporting three async generators:

1. `generateComplianceChecklistSheet(ws, input)` — 45-row yes/NA checklist:
   - Section A: Codes Applicable (8 rows) — IRC:6, IRC:112, IRC:78, IRC:SP:13, IS:456, IS:1893, IS:875, MORTH (all YES).
   - Section B: Materials (8 rows) — fck specified, fy specified, sbc available, manning N, lacey f, concrete grades for foundation/pier/abutment/deck/wearing, weldability of steel (YES/YES/YES/CHECK as applicable).
   - Section C: Loads & Factors (10 rows) — IRC:6 §102 γc=1.5, §103 γs=1.15, §200 DL/LL/EL/WL/SE, §205 impact, §209 wind Vb=33, §212 EP=1.5 for case 3/5 abutment, §214 seismic, buoyancy §208, centrifuge/braking §206/§207.
   - Section D: Analysis & Design (9 rows) — 5 load cases pier, 5 cases abutment, sliding ≥1.5, overturning ≥1.8, bearing ≥2.5, SLS L/d ≤350, crack wcr≤0.3 mm, bearing stress < SBC, freeboard ≥1.0 m — all "YES" where engine results pass, else "CHECK".
   - Section E: Drawings & QA (10 rows) — GAD, reinforcement, bearing schedule, BOQ, cross section, plan, longitudinal section, IRC checklist reviewed, TechNote signed, Approval page — first 8 YES, last 2 PENDING REVIEW.
   - Clause refs inline with each row (sufficient to hit 3+).

2. `generateServiceabilitySheet(ws, input)` — IRC:112 §7.4 & §7.6, IS:456 Annex B:
   - Deflection: δ = (5/384)·w·L⁴/(E·I) for UDL deck span.
   - Ec = 5000·√fck MPa (IS:456 §5.1.2); I_gross = B·t³/12 per metre width; I_cracked ~ 0.6·I_gross simple factor.
   - Long term multiplier λ = 1 + θ (θ = creep 1.6 at 28 days — IRC:112 Table 7.2)
   - Allowable: L/350 (IRC:112 §7.4.2(b)) for deck slabs; verify computed δ ≤ L/350.
   - Crack width: Gergely-Lutz wcr = 3·αcr·fm·(Ascr/Σ(As·(c+φ/2)²))·φ  (simplified). Assume crack ≤ 0.3 mm (Table 7.3 exposure class XS1/XS2).
   - L/d ratio: IS:456 Table 6 for continuous slab basic L/d=26; k1=0.8 (Fe415) → L/d=20.8; span/actualD check.
   - Clause refs: IRC:112 §7.4.1, §7.4.2, §7.6.2, §7.6.3; IS:456 §5.1.2, Annex B Table 6.

3. `generateRevisionSheet(ws, input)` — 8-col table Rev, Date, Sheets, Description, Prepared, Checked, Approved, Remarks:
   - Rev 00 | today ISO | 1–56 all | INITIAL ROBOTIC BASELINE — IRC:6/112/78/IS:456/IS:1893/IS:875/MORTH compliant draft | AUTOMATED ENGINE v1 | — | PENDING REVIEW | Robotic input; QA Checklist sheet 49 lists pending items.
   - 2 blank rows prefixed Rev 01/Rev 02 for future edits.
   - Footer: "This design was generated robotically and requires Engineer-of-Record sign-off per IRC:112 §1.2 before construction."
   - Clause refs: IRC:112 §1.2 responsibility, §1.3 design criteria, §16 documentation; MORTH §1200 record keeping.

### Test Requirements (TR)
- **rule TR-3c.1**: Checklist ≥ 45 rows grouped into A-E with headers; YES / CHECK / PENDING values only.
- **rule TR-3c.2**: Serviceability computed deflection finite positive; actual L/d ratio computed; crack width expression present with finite value ≤ 0.5 mm range.
- **rule TR-3c.3**: Revision sheet has Rev 00 row with 8 cells populated and ≥ 3 clause refs in footer.
- **rule TR-3c.4**: `pnpm run typecheck` passes.

---

## Task 4: Wire 56-sheet generator in index.ts (reorder & add calls)

**Priority**: high
**Depends on**: Task 1, Task 3a, Task 3b, Task 3c
**AC coverage**: AC-01, AC-03

### Description
Update [bridge-excel-generator/index.ts](file:///e:/Rajkumar/Bridge_Slab_Design/bridge-excel-generator/index.ts):

1. Import the 10 new generators from the three new files A01/B01/C01.
2. Reorder `await generateIndexSheet…` → `await generateDesignCriteriaSheet…` → `await generateInputDataSummarySheet…` → then continue with existing sheets in their shifted order (INSERT-HYDRAULICS becomes 4th, etc).
3. For abutment / C1 / estimation sheets: keep their existing numeric position but shift by the insertions. Specifically INSERT C1-ABUT stays at sheet 34 (original 29 + 5 new before it) and estimation TechNote moves to sheet 52 (original 41 + 11 = 52).
4. Update `console.log` from "46 sheets" → "56 sheets".
5. Ensure `applyDetailedNarrativeToAllSheets` runs on all 56 (already iterates `.worksheets` so it scales automatically; verify loop bound unchanged).
6. `applyWorkbookPageSetup` already uses `LANDSCAPE_SHEET_INDEXES` Set, so Task 1's Set update will correctly orient the 56 sheets.

### Test Requirements (TR)
- **rule TR-4.1**: `await generateCompleteExcel(validInput)` → buffer produced; workbook.worksheets.length === 56.
- **rule TR-4.2**: Sheet names match `EXPECTED_SHEET_NAMES` 1:1 order in contract.
- **rule TR-4.3**: `EXPECTED_SHEET_COUNT` is logged (check "56 sheets" string).
- **rule TR-4.4**: `pnpm run typecheck` passes.

---

## Task 5: Implement 56-sheet PDF book compiler (server/fiftysix-sheet-book-pdf.ts)

**Priority**: high
**Depends on**: Task 2, Task 4
**AC coverage**: AC-04, AC-05, AC-06, AC-09

### Description
Create [server/fiftysix-sheet-book-pdf.ts](file:///e:/Rajkumar/Bridge_Slab_Design/server/fiftysix-sheet-book-pdf.ts) exporting `generateFiftysixSheetBookPDF(input?)` returning `{pdf:Buffer, sheetCount:56, pageCount:58}`.

Behaviour:
1. If `!input` → call `generateRoboticProjectInput()` → set `roboticMode = true`.
2. Call `generateCompleteExcel(input)` → Excel buffer.
3. Call `buildWorkbookSheetPreviews(input)` (reuse existing [workbook-sheets-preview.ts](file:///e:/Rajkumar/Bridge_Slab_Design/server/workbook-sheets-preview.ts)) but use `SINGLE_SHEET_MAX_ROWS=500, SINGLE_SHEET_MAX_COLS=36` for **every** sheet (not just stability). Result: 56 preview objects.
4. Build jsPDF:
   - Page 1 landscape cover (reuse the `landscape-pdf-export.ts` cover but headline: "EXECUTIVE ENGINEERING BOOK (56 SHEETS)"; robotic banner watermark if needed).
   - Page 2 TOC landscape: list all 56 sheet names with 1-based page (page 3 + i for sheet index i).
   - Pages 3–58 — for every sheet (0..55):
     - Look up `LANDSCAPE_SHEET_INDEXES.has(i+1)` → choose `doc.addPage(orientation)` or start with the correct orientation.
     - Header block: sheet index, sheet name (20pt bold navy), date generated, project name.
     - Render preview rows via `jspdf-autotable` (imported in `landscape-pdf-export.ts` already). Column widths auto-fit to `CW / ncols`; font 8.5 pt; header fill navy (31,73,107) white text; alt rows (240,245,250).
     - Robotic diagonal watermark via `doc.saveGraphicsState(); doc.rotate(25); doc.setTextColor(220,220,220); doc.setFontSize(50); doc.text('ROBOTIC-REVIEW-ONLY', CW/2, CW/2); doc.restoreGraphicsState()`.
5. Side effect: write `out/<slug>-56sheet-book.pdf` via `fs/promises`; slug = projectName lowercased & non-ASCII stripped & underscored, or `robotic-bridge`.
6. Return Promise-resolved object.

### Test Requirements (TR)
- **rule TR-5.1**: `generateFiftysixSheetBookPDF()` → resolves with `{sheetCount:56, pageCount:58}`.
- **rule TR-5.2**: `out/*.pdf` file exists post-call; file size > 200 KB (58 pages should easily clear this).
- **rule TR-5.3**: For each sheet index in `LANDSCAPE_SHEET_INDEXES`, the matching PDF page has landscape orientation (verify jsPDF internal `pageContext` or the size tuple (297,210) vs (210,297)).
- **rule TR-5.4**: In robotic mode (no input), "ROBOTIC" appears in the generated buffer (UTF-8 string scan of raw PDF finds 5+ occurrences).
- **rule TR-5.5**: `pnpm run typecheck` passes.
- **rubric TR-5.6 — Presentation (0-2)**:
  - 2: 7+pt minimum font readable; headers navy/white; alt rows; margins visually 10–20 mm; watermark legible but non-obscuring; TOC page numbers match actual page.
  - 1: One presentation issue (tiny font, table overflow, missing TOC, wrong header colour) but still legible.
  - 0: Unreadable (font < 6 pt or tables overflow off-page everywhere or 3+ pages blank).

---

## Task 6: Add CLI entry (scripts/src/generate-56sheet-book.ts)

**Priority**: medium
**Depends on**: Task 5
**AC coverage**: (integrated evidence with Task 5)

### Description
Create [scripts/src/generate-56sheet-book.ts](file:///e:/Rajkumar/Bridge_Slab_Design/scripts/src/generate-56sheet-book.ts):

- Parse `--out <path>` (default `out/robotic-56sheet-book.pdf`) and `--seed-json <path>` (optional).
- If `--seed-json`: read and parse JSON → call `generateRoboticProjectInput(seed)`.
- Otherwise empty call → robotic mode.
- Await `generateFiftysixSheetBookPDF(input)` → write buffer to out path if `--out` differs from default.
- Console.log `{pdfPath, pageCount, sheetCount, durationMs}`.
- Exit 0 on success, exit 1 with stack on error.
- Add a target in root package.json `scripts`: `"book:56": "tsx scripts/src/generate-56sheet-book.ts"`.

### Test Requirements (TR)
- **rule TR-6.1**: `pnpm book:56 -- --out out/cli-test.pdf` runs and produces file with size > 200 KB.
- **rule TR-6.2**: stderr empty, exit code 0 when environment correct.
- **rule TR-6.3**: `pnpm run typecheck` passes.

---

## Task 7: End-to-end verification (run + static gates)

**Priority**: high
**Depends on**: Task 2, Task 4, Task 5, Task 6
**AC coverage**: All (AC-01 → AC-09)

### Description
Execute the full pipeline locally and collect evidence:

1. `pnpm run typecheck` → capture exit code.
2. `pnpm book:56 -- --out out/e2e-56sheet-book.pdf` → capture exit code, capture console log of `{sheetCount, pageCount}`.
3. Open workbook output via `buildWorkbookSheetPreviews(roboticInput)` and verify:
   - 56 preview objects.
   - Each of the 10 new sheet names present; each non-empty rows ≥ 5.
4. Extract PDF metadata via `pdf-parse` or simple string scan of buffer (no new npm packages — use the raw Buffer UTF-8 scan already demonstrated in TR-5.4 / a regex for `/Type /Page` to count page objects). Confirm 58 pages.
5. Spot-check values from new sheets: seismic Ah, wind Vz, bearing pad area, approach slab steel. Report them for reviewer.
6. Write results in completion evidence block; attach file paths of all generated artefacts.

### Test Requirements (TR)
- **rule TR-7.1**: `pnpm run typecheck` exit 0.
- **rule TR-7.2**: `pnpm book:56` exit 0, console logs `sheetCount:56` & `pageCount:58`.
- **rule TR-7.3**: Preview array length = 56; every required name present.
- **rule TR-7.4**: PDF page count = 58.
- **rule TR-7.5**: All 4 spot values physically plausible (per rubric AC-08 score anchors).
