# Bridge Slab Design — Presentation Specification

**Status:** draft/review build specification · 2026-10-04
**Applies to:** HTML report (`server/design-report.ts`), comprehensive PDF (`server/comprehensive-pdf-export.ts`), landscape sheet PDF (`server/landscape-pdf-export.ts`), and the 46-sheet Excel workbook contract (`bridge-excel-generator/sheet-contract.ts`).

---

## 1. Page setup (mandatory, all outputs)

| Property | Value |
|---|---|
| Page size | **A4** (210 × 297 mm) |
| Margins | **15 mm on all four sides** (top, bottom, left, right) |
| Content width (portrait) | 180 mm |
| Content width (landscape) | 267 mm |
| Implemented in | `@page { size: A4; margin: 15mm; }` (HTML report + checklist export), `MARGIN = 15` (jsPDF portrait), ExcelJS `pageSetup` via `applyWorkbookPageSetup()` (workbook, 15 mm = 0.5906 in) |

## 2. Title sheet (cover page)

Every generated report/PDF must open with a designed cover containing:

1. Firm band header (navy gradient `#1F496B → #0F5A8C`) — exists in `design-report.ts` (`struds-cover-band`) and `addCoverPage()` in the comprehensive PDF.
2. Project name, river name, location — bound to `ProjectInput` (never a sample river).
3. Bridge type + key geometry line: `N × span m, carriage width m, total length m`.
4. Design levels block: HFL / RTL / FL / bed.
5. Status stamp: **"DRAFT / REVIEW BUILD — engineering sign-off required"**.
6. Date of generation and workbook/report hash (reproducibility hook).

## 3. Index page

- The report TOC lists all calculation sections in the 46-sheet canonical order.
- The Excel workbook's sheet 1 (`INDEX`) is generated from `EXPECTED_SHEET_NAMES` — it stays the authoritative table of contents.
- No additional Excel sheet may be inserted: the 46-sheet golden contract would break. Cover/index presentation belongs to the report lanes, not the workbook.

## 4. Worksheet orientation tabulation (owner-confirmed 2026-10-04; re-proven 2026-10-06)

User tabulation: *"LANDSCAPE >>> 3, 5, 9, 10, 15, 16, 17, 18 TO 21, 30-31, ALL OTHER PORTRAIT"*.
Those numbers address the **46-sheet** book, so the contract is carried by **sheet name**, not by
position: `isLandscapeSheet(name)` in `bridge-excel-generator/sheet-contract.ts`. It is applied by
`applyWorkbookPageSetup()` (A4 `paperSize: 9`, fit-to-width, 15 mm margins) and by both PDF lanes.

> A positional set was the defect: when the book grew 46 → 56 the hard-coded indexes silently
> re-targeted sheets (13 landscape declared, 8 owner sheets actually printed portrait). See
> `august-due.md` §S. `pnpm run verify:presentation` now proves the policy on the artefacts.

### 4.1 Landscape sheets in the live 56-sheet book

| 56-book # | Worksheet name | Source of the tabulation |
|---|---|---|
| 2 | DESIGN CRITERIA | 56-book extension |
| 3 | INPUT DATA SUMMARY | 56-book extension |
| 5 | afflux calculation | owner [3] |
| 7 | Deck Anchorage | owner [5] |
| 11 | SEISMIC ANALYSIS (IS 1893) | 56-book extension |
| 12 | WIND LOAD ANALYSIS (IS 875) | 56-book extension |
| 13 | STABILITY CHECK FOR PIER | owner [9] |
| 14 | abstract of stresses | owner [10] |
| 19 | Pier Cap LL tracked vehicle | owner [15] |
| 20 | Pier Cap | owner [16] |
| 21 | LLOAD | owner [17] |
| 22 | loadsumm | owner [18] |
| 23 | LL-ABSTRACT | owner [19] |
| 24 | BEARING DETAILS | 56-book extension |
| 27 | TYPE1-AbutMENT Drawing | owner [20] |
| 28 | TYPE1-STABILITY CHECK ABUTMENT | owner [21] |
| 37 | C1-AbutMENT Drawing | owner [30] |
| 38 | C1-STABILITY CHECK ABUTMENT | owner [31] |
| 55 | SERVICEABILITY CHECK | 56-book extension |

**Summary:** 19 landscape / 37 portrait in the 56-sheet executive book; the same thirteen owner
names give 13 landscape / 33 portrait in the `legacy-46` book. Measured by read-back of the
generated workbooks on 2026-10-06 (`verify:presentation`), not inferred from the writer code.
The six "extension" sheets are wide tabulations that arrived with the 56-book; the owner's
"ALL OTHER PORTRAIT" wording covers sheets that existed in the 46-sheet book, so these six are a
stated agent decision and can be reverted by deleting their names from one array.

### 4.2 Non-workbook print lanes

| Lane | Page declaration | Status |
|---|---|---|
| `server/design-report.ts` (HTML report) | `size: A4; margin: 15mm` | compliant |
| `server/checklist-export.ts` (IRC checklist HTML) | `size: A4; margin: 15mm` | compliant |
| `client/src/report-engine/generateCertificationReport.ts` | was `18mm 15mm` → `size: A4; margin: 15mm` | fixed 2026-10-06 |
| `client/src/styles/struds-report.css` | A4 landscape, was `14/12/16/12 mm` → `15mm` | fixed 2026-10-06 |
| `client/src/styles/excel-fidelity.css` | A4 landscape, was `10mm 12mm` → `15mm` | fixed 2026-10-06 |
| `server/pdf-export.ts`, `comprehensive-pdf-export.ts`, `landscape-pdf-export.ts`, `fiftysix-sheet-book-pdf.ts` | jsPDF `format: 'a4'` + 15 mm constants | compliant (PDF MediaBox measured by the gate) |

Two deliberate exceptions, both recorded rather than hidden:
- `struds-report.css` keeps `@page :first { margin: 0 }` because the cover is a full-bleed
  297 × 210 mm gradient panel; its own 18 mm inner padding is the effective text margin.
- The client report master prints **landscape** A4. The owner's tabulation constrains workbook
  sheets; "A4 pages with 15 mm margins" constrains page size and margins, which landscape A4
  satisfies. Screen sheets are drawn as 297 mm paper, so the print block now pins cover/foreword/
  ToC to the 267 × 180 mm text area — before this they hung 24–30 mm off the right edge.

### 4.3 Historical 46-sheet tabulation (numbers exactly as the owner wrote them)

| # | Worksheet name | Density hint | Orientation |
|---|---|---|---|
| 1 | INDEX | low | PORTRAIT |
| 2 | INSERT- HYDRAULICS | divider | PORTRAIT |
| 3 | afflux calculation | high (88 rows) | **LANDSCAPE** |
| 4 | HYDRAULICS | medium (49 rows) | PORTRAIT |
| 5 | Deck Anchorage | medium (two blocks: bounding envelope + live DWL check) | **LANDSCAPE** |
| 6 | CROSS SECTION | medium (wide survey) | PORTRAIT |
| 7 | Bed Slope | medium | PORTRAIT |
| 8 | SBC | low | PORTRAIT |
| 9 | STABILITY CHECK FOR PIER | high (13-col case table) | **LANDSCAPE** |
| 10 | abstract of stresses | high (9-col table) | **LANDSCAPE** |
| 11 | STEEL IN FLARED PIER BASE | low | PORTRAIT |
| 12 | STEEL IN PIER | low | PORTRAIT |
| 13 | FOOTING DESIGN | low | PORTRAIT |
| 14 | Footing STRESS DIAGRAM | medium | PORTRAIT |
| 15 | Pier Cap LL tracked vehicle | low | **LANDSCAPE** |
| 16 | Pier Cap | low | **LANDSCAPE** |
| 17 | LLOAD | medium | **LANDSCAPE** |
| 18 | loadsumm | medium | **LANDSCAPE** |
| 19 | LL-ABSTRACT | medium | **LANDSCAPE** |
| 20 | TYPE1-AbutMENT Drawing | low | **LANDSCAPE** |
| 21 | TYPE1-STABILITY CHECK ABUTMENT | medium | **LANDSCAPE** |
| 22 | TYPE1-ABUTMENT FOOTING DESIGN | low | PORTRAIT |
| 23 | TYPE1- Abut Footing STRESS | medium | PORTRAIT |
| 24 | TYPE1-STEEL IN ABUTMENT | low | PORTRAIT |
| 25 | TYPE1-Abutment Cap | low | PORTRAIT |
| 26 | TYPE1-DIRT WALL REINFORCEMENT | low | PORTRAIT |
| 27 | TYPE1-DIRT DirectLoad_BM | low | PORTRAIT |
| 28 | TYPE1-DIRT LL_BM | low | PORTRAIT |
| 29 | INSERT C1-ABUT | divider | PORTRAIT |
| 30 | C1-AbutMENT Drawing | low | **LANDSCAPE** |
| 31 | C1-STABILITY CHECK ABUTMENT | medium | **LANDSCAPE** |
| 32 | C1-ABUTMENT FOOTING DESIGN | low | PORTRAIT |
| 33 | C1-Abut Footing STRESS DIAGRAM | medium | PORTRAIT |
| 34 | CAN-RETURN FOOTING DESIGN | low | PORTRAIT |
| 35 | STEEL IN CANT-ABUTMENT | low | PORTRAIT |
| 36 | STEEL IN CANT-RETURNS | low | PORTRAIT |
| 37 | C1-Abutment Cap | low | PORTRAIT |
| 38 | C1-DIRT WALL REINFORCEMENT | low | PORTRAIT |
| 39 | C1-DIRT DirectLoad_BM | low | PORTRAIT |
| 40 | C1-DIRT LL_BM | low | PORTRAIT |
| 41 | TechNote | text | PORTRAIT |
| 42 | INSERT ESTIMATE | divider | PORTRAIT |
| 43 | Tech Report | text | PORTRAIT |
| 44 | General Abs. | medium | PORTRAIT |
| 45 | Abstract | high (long BOQ) | PORTRAIT |
| 46 | Bridge measurements | medium | PORTRAIT |

**Summary of the historical table:** LANDSCAPE = 13 sheets {3, 5, 9, 10, 15, 16, 17, 18, 19, 20, 21, 30, 31};
PORTRAIT = 33 sheets. This is the `legacy-46` book; §4.1 is the live 56-sheet numbering.

## 5. Typographic contract

- Sheet titles: bold 14 pt, navy `#1F496B`; sub-headers 12 pt.
- Table header bands: solid fill with thin black borders; alternating data rows light gray.
- CHECK / UNSAFE outcomes: red `#9C0006` bold — never hidden.
- Narrative blocks: italic 10 pt `#1F4E79`, wrap text.
- Numbers: 2–3 decimals, `0.000` numFmt on cross-sheet reaction values. **No exponential
  notation in a rupee or quantity cell** — the preview renderer groups digits in the Indian
  convention (`en-IN`, up to 3 decimals) so the abstract reads `89,00,620`, not `8.9006e+6`;
  sub-`0.0001` coefficients may still use scientific notation.
- **Per-unit number formats, chosen from the unit column, not the magnitude** (sheet 5 contract,
  turn 12): `m MSL`/`m`/`m/s` → `0.000`, `m²`/`m³` → `#,##0.000`, `kN` → `#,##0.00`, everything
  else `0.00`. A level must read `100.856`, never `100.8561406481468`. The format pass reads each
  value through `readCellValue()` — ExcelJS strips `cell.value` for a cached `0`/`FALSE`, so an
  ordinary `cell.value` loop silently skips exactly the rows a dry bridge produces.
- **Label column must fit the longest label it carries**: sheet 5's label column went 8 characters
  against 40-character labels; widths are `[4, 46, 4, 14, 12, 58, …]` (label / value / unit / note).
- Verdict prose follows the case: sheet 5 closes with the sentence that matches the actual
  submergence (`submerged > 0`, dry high-level, or dry-in-channel), and CHECK/UNSAFE rows name the
  licensed-engineer sign-off requirement instead of asserting safety.

## 6. Estimation and BOQ presentation

- Item rows are generated from the BOQ array, never a fixed row count — `Abstract` and
  `General Abs.` stay row-aligned because both derive from the same list, and every
  `General Abs.` amount is a live cross-sheet retrieval (`='Abstract'!F<row>`).
- `Abstract` amount cells are formulas (`=D×E`); the totals are the **PWD BSR 2022 departmental
  ladder, not GST**: subtotal → +1 % Quality Control → +3 % contingency provision (printed, booked
  **nil**, engineer directs) → +1.5 % Contingencies → **G.Total** → +13 % prorata Overheads &
  Profit → Grand total → ₹ Lakh. Every cost lane (sheets 42/44/45, both PDFs, the HTML report, the
  client estimate page) carries the note *"GST is not added: this is a departmental (non-GST)
  abstract."*
- Earthwork must name its material **and its depth band**. `EARTHWORK_RATES` prices four
  categories separately — soil to 3 m (₹51/m³), soil 3–6 m (₹57/m³), soft rock without blasting
  (₹63/m³), hard rock with blasting (₹514/m³). Where the project sets `hardRockAvailable`, the
  top `ROCK_HEAD_DEPTH_BELOW_BED_M` = 1.5 m of the dig still books as soil, and the rock below it
  splits at `SOFT_ROCK_BAND_THICKNESS_M` = 1.0 m. A `₹0` rock row is not acceptable in a
  client-facing abstract; the bands are stated assumptions on the `Abstract` sheet, not survey data.
- Wearing coat is billed **by volume** (`plan area × WEARING_COAT_THICKNESS_M`, 75 mm average,
  R-13/B-4/5 rate) — the same constant the deck-anchorage load path uses, so the bill and the
  stability model cannot disagree about the coat.
- Sheet 46 `Bridge Measurements` presents each BOQ item as its own measurement trail: Nos / L / B /
  H / unit / rule-applied, a live `=E*F*G*H` per row (plan and steel variants where the basis
  differs), a `=ROUND(SUM(...))` item total, and a `TIES / CHECK` cell against the `Abstract` row.
- Narrative text about ground conditions must follow the project flag. Sheet 3's IRC 78
  scour note states rock-anchorage only for hard-rock projects; soil-foundated bridges read
  "Hard rock is not stated at foundation level…".

## 7. Known gaps (DUE)

- HTML print lane (`design-report.ts`) emits a single `@page` rule; per-section orientation switching would need named pages / multiple stylesheets.
- Client print lanes are proven at the CSSOM level only: the in-app browser had no visible surface
  during the 2026-10-06 pass (`viewport=0x0`), so no screenshot or print-preview measurement was
  possible. Re-run the visual check on a real page before trusting cover/ToC appearance.
- `struds-report.css` cover still prints full-bleed (`@page :first { margin: 0 }`). Owner can force
  15 mm by deleting that rule, which also requires the cover box to drop to 267 × 180 mm.
- Sheet 3 (surveyed section ⇒ AFL 101.375) and the engine (`spans × span` ⇒ DWL 100.856) still
  compute **different design water levels**, so the sheet-9 DWL cell stays an input with a live
  delta row in section D rather than a link. Deciding which definition governs is a sign-off call.

### Closed 2026-10-06
- ~~13 of the 21 sheets the owner tabulated were printing the wrong way round~~ — DONE (§S): the
  orientation contract is now keyed by sheet **name** (`isLandscapeSheet`), so the 46 → 56 sheet
  insertion cannot re-target it again; the workbook, the 56-page book lane and the landscape PDF
  lane all read the same source. `pnpm run verify:presentation` (9th gate) proves A4 + 15 mm +
  orientation on the generated workbook, every `@page` rule in source, and the `MediaBox` of every
  delivered PDF page.
- ~~Certification report printed at `18mm 15mm`~~ — DONE: `size: A4; margin: 15mm`.
- ~~Client report masters printed at 12/14/16 mm and 10/12 mm~~ — DONE: both now `margin: 15mm`.
- ~~Cover / foreword / ToC printed as 297 mm sheets inside a ≤273 mm text area~~ — DONE: the print
  block pins them to the 267 × 180 mm text area, so the right edge no longer hangs off the page.

### Closed 2026-10-04
- Rupee amounts printed as `8.9006e+6` — DONE (turn 9): the preview renderer's
  "≥ 10⁶ ⇒ exponential" rule is removed; numbers now group Indian-style
  (`en-IN`, ≤ 3 decimals), so the abstract reads `89,00,620` / `16,02,111.6` /
  `1,05,02,731.6`. Exponential survives only below `0.0001`.
- ~~Workbook was value-dumped~~ — DONE: the Excel lane is now a live linked model — derived cells are same-sheet formulas and downstream sheets retrieve via cross-sheet references. Verified by `scripts/verify-workbook-links.ts`, which re-executes every formula (including IF/AND/MAX/SUM status verdicts) from its own cached operands across all 20 Phase-1 templates: 439–582 formulas per workbook, 167 cross-sheet refs, 0 broken links, 0 cache-vs-formula divergences. Engine values are retained as cached results so previews stay correct before recalculation.
- Cached results must reach the page — DONE (turn 8): ExcelJS hides a cached `0`/`FALSE` behind `cell.value`, which made HTML/PDF previews print the raw formula text for zero-result cells. All readers now go through `readCellValue()`; `scripts/verify-workbook-value-sanity.ts` proves every formula cell in all 20 workbooks carries a value (48,234 cells / 9,118 formulas, 0 defects), and `scripts/verify-estimation-consistency.ts` keeps the cost sheets' quantities honest (sub-bed foundation ⇒ real excavation quantity, area-based wearing coat, amount = quantity × rate).
- ~~Excel workbook print setup~~ — DONE: `applyWorkbookPageSetup()` in `bridge-excel-generator/index.ts` sets A4 (`paperSize: 9`), `fitToPage: true`, fit-to-width, 15 mm margins, and orientation per `isLandscapeSheet(ws.name)`. Re-proven 2026-10-06 by `verify:presentation` after the positional contract is fixed (see §4): 19 landscape / 37 portrait in the 56-book, 13 / 33 in `legacy-46`.
- ~~`checklist-export.ts` 18/14 mm margins~~ — DONE: `@page` rule now `margin:15mm` (server/checklist-export.ts:376).
- ~~Landscape report lane~~ — DONE: `generateLandscapeBookPDF()` (`server/landscape-pdf-export.ts`) selects A4 orientation per sheet from `isLandscapeSheet(sheet.name)` (sheets outside the contract default to landscape); verified by measuring the `MediaBox` of every generated page — 119 pages in `test-output/sheet-book.pdf`, geometry A4 on all of them.
- ~~Sheet 5 was a one-line screen~~ — DONE (turn 12): it is now a live two-block check (bounding
  envelope + design-water-level check) whose FOS is a real formula chain (`=MAX(0,MIN(DWL−soffit,thk))`,
  `=IF(uplift>0,resisting/uplift,99)`, `=IF(…,"YES","NO")`, Hence O.K./CHECK), pulling DWL from
  `='STABILITY CHECK FOR PIER'!B16` and velocity from `=HYDRAULICS!C…`. `verify:uplift` ties the
  sheet value to the engine on all 20 templates (kherwara 8.16/8.17 to the 0.01 gate tolerance).
- ~~GST in the cost presentation~~ — DONE (turn 11): every lane now shows the PWD BSR 2022 ladder
  with the non-GST note; rupee totals read in `en-IN` grouping and in ₹ Lakh on the abstract.
- ~~`pnpm run deliverables` wrote outside the repo-root `test-output/`~~ — DONE (turn 12):
  `regenerate-test-output.ts` no longer uses `process.cwd()` (pnpm runs it with `cwd=scripts`), so the
  six review deliverables cannot drift into a divergent twin.
