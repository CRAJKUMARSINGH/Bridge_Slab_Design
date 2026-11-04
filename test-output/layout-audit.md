# Layout Audit — Visual/Presentation Policy Check
**Date:** 2026-10-06  
**Project:** Construction of Submersible Bridge on KHERWARA - JAWAS - SUVERI ROAD  
**Artefacts verified:** design-report.html, irc-checklist.html, design-workbook.xlsx, comprehensive-report.pdf

---

## What Was Measured

### 2a — HTML Artefacts (design-report.html, irc-checklist.html)

| Check | Criterion | design-report.html | irc-checklist.html |
|---|---|---|---|
| @page rule present | `size: A4; margin: 15mm` | ✅ Present (line ~200) | ✅ Present (line 12) |
| Cover page width | No hardcoded mm value wider than print area | ✅ No fixed mm width found | N/A |
| TOC items | `<ul>/<li>` elements present, not empty | ✅ `<nav class="struds-toc"><ul><li>…</li></ul>` at line 2493 | N/A |
| Table overflow | No `overflow: hidden` that clips data columns | ✅ Fixed (see below) | ✅ None found |
| Bad number values | No NaN, undefined, [object Object], e+N in cells | ✅ None found | ✅ None found |
| Section headers | Hydraulics, Structural, Estimation sections present | ✅ All three present | ✅ Hydraulic summary present |

### 2b — Excel Workbook Sheet Metadata

| Metric | Expected | Actual | Result |
|---|---|---|---|
| Total sheets | 56 | 56 | ✅ PASS |
| Landscape sheets | 19 | 19 | ✅ PASS |
| Portrait sheets | 37 | 37 | ✅ PASS |
| A4 paper size (paperSize=9) | 56 | 56 | ✅ PASS |
| 15 mm margins OK (≈0.591 in ± 0.05) | 56 | 56 | ✅ PASS |
| Margin failures | 0 | 0 | ✅ PASS |

### 2c — PDF Verification

| Metric | Expected | Actual | Result |
|---|---|---|---|
| Page count | ≥ 1 | 225 pages | ✅ PASS |
| MediaBox (A4 portrait in pts) | ~595×842 | 595.28×841.89 | ✅ PASS |

---

## What Passed (Initial Scan)

- `@page { size: A4; margin: 15mm; }` in both HTML files
- Cover page uses no hardcoded `mm` width — uses `max-width: 900px` (responsive)
- TOC in design-report.html: full `<nav class="struds-toc">` with `<ul><li>` links to all 56 sheets
- No `NaN`, `undefined`, `[object Object]`, or scientific notation (`e+N`) in any table cells
- Section headers: Hydraulics (`HYDRAULICS — workbook page`, `HYDRAULICS — DERIVED VALUES`), Structural (`STRUCTURAL DESIGN REPORT`, narrative block 5), Estimation (`ESTIMATION & BOQ`) all present
- Excel workbook: 56 sheets, exact orientation split (19L/37P), A4 size on all, 15 mm margins on all
- PDF: 225 pages, all pages A4 portrait (595.28×841.89 pt)

## What Failed (and Was Fixed)

### Finding: `overflow: hidden` clipping data columns in Hydraulics workbook table

**File:** `server/workbook-line-report.ts`  
**Location:** CSS rule `.wb-hyd-table td`  
**Problem:** The class used `table-layout: fixed` combined with `overflow: hidden; text-overflow: ellipsis`. In a fixed-layout table, cells cannot grow beyond their assigned `ch`-width; `overflow: hidden` silently clips any content that exceeds the cell box. Data values, labels, or formula text in the HYDRAULICS grid could be truncated with no visual indicator.

**Fix applied:** Replaced `overflow: hidden; text-overflow: ellipsis` with `word-break: break-word; overflow-wrap: anywhere` so content wraps within the cell rather than being clipped.

**Before:**
```css
.wb-hyd-table td {
    border: 1px solid #000; padding: 2px 6px; vertical-align: middle;
    overflow: hidden; text-overflow: ellipsis;
}
```

**After:**
```css
.wb-hyd-table td {
    border: 1px solid #000; padding: 2px 6px; vertical-align: middle;
    word-break: break-word; overflow-wrap: anywhere;
}
```

**Deliverables regenerated:** `pnpm run deliverables` completed successfully, all 6 artefacts rewritten.

---

## Final Verdict

| Artefact | Status |
|---|---|
| design-report.html | ✅ ALL PASS |
| irc-checklist.html | ✅ ALL PASS |
| design-workbook.xlsx | ✅ ALL PASS (56/56/56 sheets, orientation split exact) |
| comprehensive-report.pdf | ✅ ALL PASS (225 pages, A4 MediaBox) |

**One defect found and fixed:** `overflow: hidden` on `.wb-hyd-table td` in `server/workbook-line-report.ts` — replaced with `word-break: break-word; overflow-wrap: anywhere`. Deliverables regenerated and re-verified.
