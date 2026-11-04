# Specification: Robotic Slab Bridge 56-Sheet PDF Book

## Problem

The existing bridge design suite produces a 46-sheet engineering workbook via `bridge-excel-generator/index.ts` and can render it as a PDF book via `landscape-pdf-export.ts`. However:

1. The user requires **56 sheets** (10 additional engineering & compliance sheets) not present in the current sheet contract.
2. Inputs must be generated **robotically** — the system must assume reasonable IRC-compliant variables and produce a complete, internally-consistent design when no explicit project input is supplied.
3. The final deliverable must be a **single bound PDF book** with cover, file index, 56 numbered sheets in the correct presentation order, and correct portrait/landscape orientation per sheet.

## Users

- **Primary**: Design engineer requesting an instant IRC-compliant slab bridge design book for tender/approval with no data entry.
- **Secondary**: QA reviewer validating sheet count (56), sheet order, IRC code references, and PDF page orientation consistency.
- **Tertiary**: Client authority receiving the signed-off design dossier.

## Goals

1. Expand the workbook contract from 46 → **56 sheets** by adding 10 new IRC-compliant design/compliance sheets.
2. Implement a **robotic input generator** that, without user input, synthesises a fully validated `ProjectInput` record conforming to `ProjectInputSchema` with cross-consistent geometry, levels, materials, and hydraulic data.
3. Produce a **single PDF book** file containing exactly 56 design/compliance sheets + 2 front-matter pages (cover + TOC) = **58 PDF pages**, where each sheet occupies exactly one PDF page with the correct A4 orientation (landscape sheets per `LANDSCAPE_SHEET_INDEXES` plus new indexes).
4. Every sheet must reference real IRC/IS/MORTH code clauses (IRC:6-2016, IRC:112-2015, IS:456, IS:1893, IS:875, IRC:78) as the governing standard for its calculations.

## Non-Goals

- **No** new structural finite-element or 3D analysis engine — continue using the existing `design-engine.ts` and `remote-app-adapter` numeric base.
- **No** UI/client pages added for this task — deliverable is a programmatic PDF file written to disk (and reusable as an API handler helper if needed later).
- **No** changes to the database/Drizzle schema or the `/projects` fallback storage.
- **No** documentation files created beyond the Spec Mode artifacts (spec.md, tasks.md, review.md).

## Functional Requirements

### FR-01: Sheet count expanded to 56

`EXPECTED_SHEET_NAMES` (sheet-contract.ts) must list exactly 56 sheet names in a prescribed, fixed order. The 10 NEW sheets (added between the existing 46) are:

| New Position | Sheet Name | Governing Standard(s) | Section |
|---|---|---|---|
| Insert after Sheet 1 (INDEX) → new Sheet 2 | DESIGN CRITERIA | IRC:6-2016 §102–§110, IRC:112-2015 §1–§6 | Admin |
| (shifts everything by 1; new Sheet 3) | INPUT DATA SUMMARY | — (tabularised ProjectInput mirror) | Admin |
| Insert after Sheet 8 (SBC) → new Sheet 10 | SEISMIC ANALYSIS (IS:1893) | IS:1893:2002 §5–§7, IRC:6-2016 §214 | Substructure |
| (new Sheet 11) | WIND LOAD ANALYSIS | IS:875 Part-3, IRC:6-2016 §209 | Substructure |
| Insert after Sheet 19 (LL-ABSTRACT) → new Sheet 21 | BEARING DETAILS | IRC:78-1983 §300, IRC:6-2016 §210 | Superstructure |
| (new Sheet 22) | EXPANSION JOINT & DRAINAGE | MORTH §5.6, IRC:6-2016 §211 | Superstructure |
| (new Sheet 23) | APPROACH SLAB DESIGN | IRC:112-2015 §11.5, IS:456 §22–§24 | Approaches |
| Insert before Sheet 41 (TechNote) → new Sheet 49 | IRC CODE COMPLIANCE CHECKLIST | IRC:6, IRC:112, IRC:78, IS:1893, IS:875, IS:456 | QA |
| (new Sheet 50) | SERVICEABILITY CHECK (DEFLECTION/CRACK) | IRC:112-2015 §7.4, §7.6, IS:456 Annex B | QA |
| (new Sheet 51) | REVISION SHEET / DESIGN REGISTER | — (admin) | Admin |

Final sheet indices 1–56 after re-indexing:
- 1: INDEX
- 2: DESIGN CRITERIA  ← NEW
- 3: INPUT DATA SUMMARY  ← NEW
- 4: INSERT-HYDRAULICS
- 5: afflux calculation
- 6: HYDRAULICS
- 7: Deck Anchorage
- 8: CROSS SECTION
- 9: Bed Slope
- 10: SBC
- 11: SEISMIC ANALYSIS  ← NEW
- 12: WIND LOAD ANALYSIS  ← NEW
- 13: STABILITY CHECK FOR PIER
- 14: abstract of stresses
- 15: STEEL IN FLARED PIER BASE
- 16: STEEL IN PIER
- 17: FOOTING DESIGN
- 18: Footing STRESS DIAGRAM
- 19: Pier Cap LL tracked vehicle
- 20: Pier Cap
- 21: LLOAD
- 22: loadsumm
- 23: LL-ABSTRACT
- 24: BEARING DETAILS  ← NEW
- 25: EXPANSION JOINT & DRAINAGE  ← NEW
- 26: APPROACH SLAB DESIGN  ← NEW
- 27: TYPE1-AbutMENT Drawing
- …existing TYPE1 & C1 abutment sheets continue…
- 48: Bridge measurements (was 46 — shifted by 2)
- 49: IRC CODE COMPLIANCE CHECKLIST  ← NEW
- 50: SERVICEABILITY CHECK  ← NEW
- 51: REVISION SHEET  ← NEW
- (Remaining 5 sheets from existing 46 to fill 52–56: INSERT C1-ABUT through C1-DIRT LL_BM — repositioned)

*Exact final ordering codified in sheet-contract.ts; the table above is a human-readable guide only.*

### FR-02: Robotic (auto) input generator

Create `bridge-excel-generator/robotic-input.ts` exporting:

```
generateRoboticProjectInput(seed?: Partial<ProjectInput>): ProjectInput
```

Behaviour:
1. When `seed` is empty, pick a plausible demo bridge name & river from a built-in catalogue (e.g. "Sukher River High-Level Slab Bridge — Chittorgarh").
2. Synthesise **consistent** geometry:
   - `spanLength` ∈ [10, 30] m step 0.5 m; `numberOfSpans` ∈ [3, 9] odd count.
   - `totalLength` = `numberOfSpans × spanLength + 2 × 0.5` (0.5 m abutment overhang each side).
   - `carriageWidth` = 7.5 m (2-lane IRC single carriageway) or 11.0 m (4-lane), both plus 1.5 m footpath each side for deck width.
   - Levels consistent: `rtl > agl > bedLevel > foundationLevel` with HFL between agl and RTL minus deck thickness minus freeboard.
3. Hydraulic: generate 9-point `crossSectionData` with a parabolic river profile (GL min at centre), compute Manning-consistent `discharge` so the existing engine's `Q = A × V` rounds cleanly.
4. Soil: `sbc` = 200 kPa, `phi` = 30°, `gamma` = 18 kN/m³ as default earthwork; set `hardRockAvailable = true` at depth 3.0 m below bed when no seed.
5. Materials: `concreteGrade = 'M30'` → `fck = 30`; `steelGrade = 'Fe415'` → `fy = 415`; `seismicZone = 3`; `designWindSpeed = 33`.
6. Pier/abutment geometry sized from span + carriage width using `DESIGN_CONSTANTS` from project memory (registry already established).
7. Run `ProjectInputSchema.parse(...)` and return only on success; throw a typed `RoboticInputValidationError` on mismatch so caller can surface it.

### FR-03: 56-sheet PDF book generator

Extend `server/landscape-pdf-export.ts` (or add a sibling `fiftysix-sheet-book-pdf.ts`) with:

```
generateFiftysixSheetBookPDF(input?: ProjectInput): Promise<{ pdf: Buffer; sheetCount: number; pageCount: number; }>
```

Behaviour:
1. If no `input` is passed, call the robotic generator and stamp "ROBOTIC DESIGN — FOR REVIEW ONLY" watermark on every page corner.
2. Invoke the 56-sheet Excel generator, then `buildWorkbookSheetPreviews` (or an optimised 56-sheet variant) to get per-sheet tabular data.
3. **PDF structure**:
   - Page 1 — landscape cover: "EXECUTIVE ENGINEERING BOOK (56 SHEETS)" with project name, bridge type, date, and robotic flag.
   - Page 2 — file topic index (list all 56 sheets with page numbers).
   - Pages 3–58 — exactly 56 pages, one per sheet: sheet title header (20 pt dark navy), 15 mm margins, rendered via `jspdf-autotable` from preview rows.
   - For every sheet whose 1-based index ∈ `LANDSCAPE_SHEET_INDEXES` (plus newly added landscape sheet indices): print the sheet in landscape A4; otherwise portrait.
   - New landscape sheets by index: DESIGN CRITERIA (2), INPUT DATA SUMMARY (3), SEISMIC (11), WIND (12), BEARING (24), SERVICEABILITY (50).
4. Watermark handling: for robotic inputs, add a light grey "ROBOTIC — REVIEW ONLY" diagonal stamp via `doc.setTextColor(210,210,210)` + rotated `doc.text(...)`.
5. Output: PDF buffer written to `out/<project-slug>-56sheet-book.pdf` as side effect, and also returned.

### FR-04: Sheet generators for the 10 new sheets

Create each new sheet generator function under `bridge-excel-generator/sheets/` (or inline in a new `sheets/47-56-new-compliance.ts` file) matching the style of `01-index.ts` / `29-46-estimation.ts`:

- `generateDesignCriteriaSheet(ws, input)` — lists IRC clauses with short description, material grades, seismic zone, and design assumptions.
- `generateInputDataSummarySheet(ws, input)` — 2-col key/value mirror of ProjectInput grouped by Geometry / Levels / Hydraulics / Soil / Materials / Pier / Abutment.
- `generateSeismicAnalysisSheet(ws, input)` — computes Z, I, R, Sa/g per IS:1893 Table 4 for rock/soil, Ah, base shear, pier column shear force; references §5–§7.
- `generateWindLoadSheet(ws, input)` — Vz = Vb·k1·k2·k3, Pz = 0.6·Vz², force on pier + superstructure per IRC:6 §209; Vb default 33 m/s.
- `generateBearingDetailsSheet(ws, input)` — elastomeric pad size (L×B×t), shear deformation limit 0.5t, rotation check, quantity per pier/abutment per IRC:78 §300.
- `generateExpansionJointSheet(ws, input)` — strip seal joint size, movement capacity ΔL = α·L·ΔT (α = 12e-6/°C, ΔT = 35°C), deck drainage scupper spacing 5 m, outlets per IRC:6 §211.
- `generateApproachSlabSheet(ws, input)` — L = 3 m, t = 250 mm, M25, Fe415; BM + SF for wheel patch; steel spacing calculated per IS:456 §22.
- `generateComplianceChecklistSheet(ws, input)` — 40+ yes/NA row checklist: IRC:6 §102 material codes, §200 loads, IRC:112 §7 ULS/SLS, §7.4 deflection, IS:1893 zones, etc.
- `generateServiceabilitySheet(ws, input)` — long/short term deflection (IS:456 Annex B / IRC:112 §7.4.2), crack width wcr ≤ 0.3 mm, limiting L/d ratios.
- `generateRevisionSheet(ws, input)` — 8-row revision log: Rev 00 robotic baseline, date, sheet references, prepared "AUTOMATED ENGINE", checked "—", approved "PENDING".

### FR-05: Sheet contract & landscape index update

Update `sheet-contract.ts`:
- `EXPECTED_SHEET_NAMES` to exactly 56 strings, order as designed.
- `EXPECTED_SHEET_COUNT = 56`.
- `LANDSCAPE_SHEET_INDEXES` Set updated with indices for new landscape sheets (1-based): 2, 3, 11, 12, 24, 50.

### FR-06: CLI entry point

Add `scripts/src/generate-56sheet-book.ts` that:
```
tsx scripts/src/generate-56sheet-book.ts [--out path] [--seed-json path]
```
- With no args: robotic input → writes `out/robotic-56sheet-book.pdf` + prints `{pdfPath, pageCount, sheetCount}`.
- With `--seed-json inputs/KHERWARA.json`: partial seed merged into robotic generator → outputs stamped PDF.

## Non-Functional Requirements

### NFR-01: Deterministic output
For a given seed (including empty) the robotic generator must produce byte-identical `ProjectInput` across runs (no `Math.random()`; use a seeded linear-congruential generator or a fixed constant table). The PDF must not embed timestamps in a way that breaks deterministic file comparison when the same seed is used twice.

### NFR-02: IRC clause traceability
Every new sheet must render **at least 3 explicit IRC/IS clause references** as bold header/footer notes. The robotic generator's `location`/`riverName`/`authority` must be consistent with PWD Rajasthan naming (e.g., "PWD (R&B) Circle — Udaipur") so sheets cite the issuing authority context.

### NFR-03: Performance
- End-to-end (generate 56 sheets → build PDF) must complete in ≤ 90 seconds on a 4-core laptop.
- Heap usage peak ≤ 1 GB (ExcelJS 46-sheet workbook is ~250 MB; 56 sheets should stay under 400 MB).

### NFR-04: Typecheck zero regressions
`pnpm run typecheck` must return 0 after all changes; all new functions must have explicit TypeScript interfaces, no implicit `any`.

### NFR-05: Presentation spec honouring
All 56 PDF pages use A4 with 15 mm margins; correct orientation per `LANDSCAPE_SHEET_INDEXES`; alternating row highlight in tables; dark-navy headers matching existing PDF export.

## Constraints, Dependencies, Assumptions

- **Constraint**: `EXPECTED_SHEET_COUNT` must remain the single source of truth. If any test calls `.length` on the names array, the test must still pass (56 === 56).
- **Dependency**: `exceljs`, `jspdf`, `jspdf-autotable`, `zod` already present. No new npm packages allowed.
- **Dependency**: Continue to use `DESIGN_CONSTANTS` registry (per project memory) for any new constants (diameter choices, spacing minima, load factors). Reference IRC:6-2016 §212 EP = 1.5 where abutment loads appear.
- **Assumption**: The existing design engine (`calculateCompleteDesign`) correctly handles spans in the 10–30 m range; values are reviewed for plausibility only, not re-derived.
- **Assumption**: A4 printable width landscape = 267 mm (297 − 2×15), portrait = 180 mm (210 − 2×15). Autotable columns sized to fit.

## Open Questions

None. User requested "robotically design … assume urself variables … give all 56 sheet result in specified pdf book" — fully specified above via the robotic generator + PDF book pipeline.

## Acceptance Criteria

### rule AC-01 — Sheet count = 56
Open `generateCompleteExcel` output → `workbook.worksheets.length === 56` → names match `EXPECTED_SHEET_NAMES` order exactly → `EXPECTED_SHEET_COUNT === 56`.

### rule AC-02 — Robotic generator produces valid input
Call `generateRoboticProjectInput()` → `ProjectInputSchema.parse()` returns without throwing → `totalLength ≈ numberOfSpans×spanLength` within ±2 m → all level inequalities `rtl > agl > hfl > bedLevel > foundationLevel` hold.

### rule AC-03 — New 10 sheets exist and are named correctly
In the 56 workbook sheets, the following names (case-insensitive match) must be present:
- "DESIGN CRITERIA"
- "INPUT DATA SUMMARY"
- "SEISMIC ANALYSIS (IS:1893)" or "SEISMIC ANALYSIS"
- "WIND LOAD ANALYSIS" or "WIND LOAD ANALYSIS (IS:875)"
- "BEARING DETAILS"
- "EXPANSION JOINT & DRAINAGE"
- "APPROACH SLAB DESIGN"
- "IRC CODE COMPLIANCE CHECKLIST"
- "SERVICEABILITY CHECK"
- "REVISION SHEET"

### rule AC-04 — PDF has 58 pages (cover + TOC + 56)
Run the CLI → inspect PDF metadata: `pageCount === 58`. Pages 3–58 correspond 1:1 to workbook sheet order.

### rule AC-05 — Correct landscape orientation for 12+ sheets
PDF pages for sheet indices {2, 3, 5, 7, 11, 12, 13, 15, 19, 20, 24, 34, 35, 50} (union of existing + new) are landscape; all others portrait. (Exact set verified by reading jsPDF internal orientation on added pages.)

### rule AC-06 — Every new sheet has ≥3 IRC/IS clause references
Extract text from each of the 10 new PDF pages → at least 3 distinct §-prefixed clause identifiers (e.g., "IRC:6-2016 §209") appear on each page.

### rule AC-07 — `pnpm run typecheck` exits 0
Run at repo root after implementation → exit code 0, no new TS errors.

### rubric AC-08 — Engineering plausibility (0–2)
- **2**: All computed values (bearing pad size, joint movement, slab steel, seismic Ah, wind Vz) are within physically reasonable bounds; no `NaN` / `CHECK` / `UNSAFE` rows in any of the 10 new sheets for the robotic run.
- **1**: One or two `CHECK` rows remain but no `UNSAFE`; values otherwise sensible.
- **0**: Three+ `CHECK`/`UNSAFE` rows or obviously wrong values (e.g., negative scour, wind > 100 m/s).

### rubric AC-09 — PDF presentation quality (0–2)
- **2**: Cover page + TOC styled consistently with `landscape-pdf-export.ts` existing design; every table header is dark-navy/white; alternating row shading; 15 mm margins visually uniform; robotic watermark readable but unobtrusive.
- **1**: Styling mostly consistent but 1–2 tables overflow 15 mm margin or header colours differ.
- **0**: Missing cover/TOC, 2+ sheets overflow margins, or illegible font sizes below 7 pt.
