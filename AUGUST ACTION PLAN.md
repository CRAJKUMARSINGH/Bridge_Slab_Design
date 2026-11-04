# AUGUST ACTION PLAN — Bridge Design Suite
> **Drafted:** 2026-10-04 | **Repo:** `E:\Rajkumar\Bridge_Slab_Design`
> **Based on:** `august-due.md` audit (9 sections A–I)
> **Mandate:** Every action below is concrete, file-level, and assignable. Each item names the exact file to create/edit, the exit criterion, and the verification command.

---

## HOW TO USE THIS PLAN

- Work top-to-bottom within each sprint. Items inside a sprint are roughly sequential unless marked **[PARALLEL]**.
- An item is **DONE** only when the exit criterion is met and verified — not when code is written.
- Every agent (Kiro or otherwise) must append a chat-log entry to `CREAT.md` every 12 minutes.
- This file is the single source of truth for August execution. Update status inline as items complete.

---

## STATUS KEY

| Symbol | Meaning |
|---|---|
| 🔴 | Blocking — nothing downstream can be trusted until this is fixed |
| 🟠 | High priority — required for pipeline integrity |
| 🟡 | Medium priority — required for release quality |
| 🟢 | Done |
| ⬜ | Not started |
| 🔄 | In progress |

---

---

# SPRINT 0 — UNBLOCK THE PIPELINE
> **Goal:** Fix the critical defects and missing foundations so that every downstream sprint builds on solid ground.
> **Time-box:** 3 days

---

## ACTION 0.1 — Fix CURSOR-002: Abutment Load Cases Bug
**Priority:** 🔴 BLOCKING
**File:** `bridge-excel-generator/design-engine.ts`
**Defect:** The 5 IRC:6 abutment load cases all produce identical results because the loop variable `i` is never used to vary the load combination factors.

### Steps
1. Open `bridge-excel-generator/design-engine.ts`.
2. Find the abutment load cases loop (search for `for` near `AbutmentDesignResult`).
3. Define the 5 IRC:6-2016 load combination factor sets:
   ```
   Case 1 — Service:        DL×1.0 + LL×1.0 + EP×1.0
   Case 2 — Construction:   DL×1.0 + Wind×1.0 + EP×1.0 (no LL)
   Case 3 — Flood:          DL×1.0 + Hydro×1.0 + EP×1.5 (no LL)
   Case 4 — Seismic:        DL×1.0 + LL×0.25 + EP×1.0 + Seismic×1.0
   Case 5 — ULS:            DL×1.35 + LL×1.5 + EP×1.5
   ```
4. Apply the correct factors for each case index inside the loop.
5. Verify that the 5 result objects differ — at least `verticalForce`, `horizontalForce`, and `moment` must be different across cases.

### Exit Criterion
- `calculateAbutmentDesign()` returns 5 non-identical result objects for any non-zero input set.
- Add a test in `lib/engine/src/tests/` or `tests/integration/` asserting `case1.verticalForce !== case5.verticalForce`.

### Verification Command
```bash
npx tsx scripts/src/design.ts --input inputs/KHERWARA.json --out out/test-abutment.html
# inspect out/test-abutment.html — all 5 abutment cases must show different values
```

---

## ACTION 0.2 — Fix BOLT-001: Dead Router in Server
**Priority:** 🔴 BLOCKING (crash-bomb risk)
**File:** `server/antigravity-api-routes.ts`
**Defect:** Router file exists but is never mounted — if any code accidentally imports it, ENOENT crash.

### Steps
1. Check if `server/antigravity-api-routes.ts` is imported anywhere: `grep -r "antigravity-api-routes" server/`
2. If not imported: move to `archive/server/` via `git mv`.
3. If imported: mount it correctly in `server/app-factory.ts` under `/api/antigravity` OR move to archive.
4. Re-run `npm run check` — must pass.

### Exit Criterion
- `server/antigravity-api-routes.ts` either mounted and tested, or archived.
- `npm run check` exits 0.

---

## ACTION 0.3 — Fix CURSOR-003: Replace `z.any()` in insertProjectSchema
**Priority:** 🔴 BLOCKING (zero validation on project save)
**File:** Locate via: `grep -r "z.any()" shared/ lib/ server/`

### Steps
1. Find `insertProjectSchema` definition.
2. Replace `z.any()` for `designData` with a typed Zod schema matching `ProjectInput` (89 fields from `bridge-excel-generator/types.ts`).
3. Add a validation test: send malformed `designData` → expect a 400 error with a readable message.

### Exit Criterion
- Posting `{ designData: "not-an-object" }` returns HTTP 400 with a Zod validation error message.

---

## ACTION 0.4 — Create `BASELINE_MANIFEST.md` at Root
**Priority:** 🟠 HIGH — Day 0 gate from Week 0 plan
**File:** `BASELINE_MANIFEST.md` (root)

### Content to include
1. All top-level directories with one-line purpose each.
2. All `package.json` scripts (list every script name + what it runs).
3. Confirmed dual-engine situation: `lib/engine/` (canonical) vs `bridge-excel-generator/design-engine.ts` (comprehensive but buggy).
4. Confirmed duplicate trees still live: `client/` + `api/` + `archive/client/` + `archive/api/`.
5. Current `npm run check` and `npm run verify:golden` output verbatim.
6. Open questions list (link to `docs/week-0/open-questions.md`).

### Exit Criterion
- File exists at `BASELINE_MANIFEST.md`, is committed, and accurately describes the real tree (not aspirational structure).

---

## ACTION 0.5 — Create `WEEK0_ACCEPTANCE.md`
**Priority:** 🟠 HIGH — Day 5 gate
**File:** `WEEK0_ACCEPTANCE.md` (root)

### Content
```markdown
# Week 0 Acceptance Checklist
[ ] BASELINE_MANIFEST.md committed and accurate
[ ] Golden regression green: npm run verify:golden passes
[ ] Tamper test red: deliberately wrong input fails golden
[ ] npm run check exits 0
[ ] Kherwara/Kharka identity decision recorded (OPEN/RESOLVED)
[ ] Licensed-engineer name and review date recorded below
[ ] README accurately describes this build (not a future build)

## Engineer Sign-Off
Name: _______________
Date: _______________
Scope: _______________
```

### Exit Criterion
- File exists, all checkboxes are filled (with ✅ or explicit notes), and at least the engineer name line has a value.

---

---

# SPRINT 1 — ASSET ASSIMILATION PIPELINE
> **Goal:** Give every `.xls/.xlsx/.doc/.docx` file in `Attached_Assets/` a registry record, an extraction status, and a disposition. Unlock narrative and parity work.
> **Time-box:** 5 days

---

## ACTION 1.1 — Run Full A1 Inventory; Commit Output
**Priority:** 🟠 HIGH
**Script:** `scripts/assimilate/inventory.py`
**Output:** `knowledge/inventory.json`

### Steps
1. Create `knowledge/` directory at root.
2. Run `python scripts/assimilate/inventory.py --root Attached_Assets --out knowledge/inventory.json`
3. Verify output contains: `path`, `sha256`, `type` (xls/xlsx/doc/docx/pdf/other), `bytes`, `project_guess` for every file.
4. Commit `knowledge/inventory.json` as an artifact.
5. Update `asset-register.json` at root to reference `knowledge/inventory.json` (it is currently a 985-byte stub).

### Exit Criterion
- `knowledge/inventory.json` committed with ≥ 173 records (48 `.doc` + 13 `.docx` + 97 `.xls` + 15 `.xlsx` as described in plan docs).
- Zero files under `Attached_Assets/` are missing from the inventory.

### Verification
```bash
python -c "import json; d=json.load(open('knowledge/inventory.json')); print(len(d['files']), 'assets inventoried')"
```

---

## ACTION 1.2 — Create `scripts/assimilate/normalize.py` (A2)
**Priority:** 🟠 HIGH
**Output:** `knowledge/corpus/**` — `.md` files from Word docs, `.xlsx` from `.xls`

### Steps
1. Create `scripts/assimilate/normalize.py`.
2. For `.doc` / `.docx`: call `pandoc input.docx -o knowledge/corpus/<hash>.md` (pandoc must be installed).
3. For `.xls`: call `soffice --headless --convert-to xlsx input.xls --outdir knowledge/corpus/`.
4. Preserve original files — normalize only produces copies.
5. Record each file's normalized path back into `knowledge/inventory.json`.
6. Handle failures gracefully — log errors to `knowledge/normalize-errors.log`, continue.

### Exit Criterion
- Every `.docx` in `Attached_Assets/` has a corresponding `.md` in `knowledge/corpus/`.
- Every `.xls` has a corresponding `.xlsx` in `knowledge/corpus/`.
- `knowledge/normalize-errors.log` exists (may be empty if all succeed).

---

## ACTION 1.3 — Create `scripts/assimilate/classify_cells.py` (A3)
**Priority:** 🟠 HIGH
**Output:** `knowledge/registry/<workbook-hash>/variables.json`, `coefficients.json`, `constraints.json`

### Steps
1. Port / adapt the `classify_cells.py` demo (documented in `docs/week-0/`) into `scripts/assimilate/classify_cells.py`.
2. Support `--batch` mode: process all `.xlsx` files in `knowledge/corpus/`.
3. Support `--answers answers.json` to pre-load engineer decisions so ambiguous cells are not re-prompted.
4. Output per-workbook JSON files under `knowledge/registry/<sha256>/`.
5. Merge confirmed variables into `inputs/variables.json` (additive, no overwrites without confirmation).
6. Record any conflicts in `knowledge/conflicts.md` — do NOT auto-resolve.

### Exit Criterion
- Running `python scripts/assimilate/classify_cells.py --batch knowledge/corpus/ --out knowledge/registry/` completes without crash.
- At least the Kherwara/Kharka canonical workbook produces non-empty `variables.json` and `constraints.json`.
- `knowledge/conflicts.md` created (even if empty).

---

## ACTION 1.4 — Create `scripts/assimilate/mine_narrative.py` (A4)
**Priority:** 🟡 MEDIUM
**Output:** `knowledge/narrative_corpus/*.jinja`

### Steps
1. Create `scripts/assimilate/mine_narrative.py`.
2. Read each `.md` file in `knowledge/corpus/` (normalized from Word docs).
3. Identify paragraphs containing numerical values using regex (`\d+\.?\d*\s*(m|mm|kN|MPa|m³/s)`).
4. Replace each number with a `{{ variable_name }}` placeholder (use the closest preceding heading/label as the name hint).
5. Save each templated paragraph to `knowledge/narrative_corpus/<source-hash>.jinja`.
6. Also save a `provenance.json` alongside each `.jinja` file recording: source file, page/paragraph ref, original numbers.

### Exit Criterion
- Running against `DESIGN REPORT KHARKA BRIDGE.docx` produces at least one `.jinja` template with `{{ }}` placeholders.
- `provenance.json` exists alongside every `.jinja`.

---

## ACTION 1.5 — Create `scripts/assimilate/map_drawings.py` (A5)
**Priority:** 🟡 MEDIUM
**Output:** `knowledge/layout_manifest.json`

### Steps
1. Create `scripts/assimilate/map_drawings.py`.
2. Walk `assets/` subdirectories: `COMPONENT_DRAWINGS_SORTED/`, `DRAWINGS_FROM_RAJKUMAR_DESIGNS/`, `E_DRIVE_BRIDGE_DESIGN/`, `GENERATED_DRAWINGS/`.
3. For each `.pdf`, `.dwg`, `.png`, `.svg`: record filename, path, sha256, inferred component tag (pier / abutment / deck / wing-wall / cross-section / general).
4. Infer component tag from filename keywords: `pier`, `abutment`, `deck`, `wing`, `cross`, `section`, `gad`.
5. Output `knowledge/layout_manifest.json` with structure:
   ```json
   { "drawings": [{ "path": "...", "sha256": "...", "component": "pier", "format": "pdf" }] }
   ```
6. Populate `engineering/drawings/` with symlinks or a catalog file pointing to discovered drawings.

### Exit Criterion
- `knowledge/layout_manifest.json` committed with ≥ 10 drawing records.
- `engineering/drawings/` is no longer empty.

---

## ACTION 1.6 — Run Assimilation Coverage Gate
**Priority:** 🟠 HIGH (CI gate)
**Command:** `npm run assimilate -- --report`

### Steps
1. Add an `assimilate` script to root `package.json`:
   ```json
   "assimilate": "python scripts/assimilate/inventory.py --coverage-report"
   ```
2. Implement `--coverage-report` mode in `inventory.py` that:
   - Counts files by bucket: `used:numbers`, `used:narrative`, `used:drawing`, `superseded`, `out-of-scope`, `unclassified`.
   - Exits with code 1 if any file is `unclassified`.
3. Add this gate to `.github/workflows/ci.yml`.

### Exit Criterion
- `npm run assimilate -- --report` exits 0 when all assets are classified.
- `ci.yml` runs this gate on every push.

---

---

# SPRINT 2 — PDF PIPELINE
> **Goal:** Produce a real PDF from inputs. This is the single most-requested missing deliverable.
> **Time-box:** 5 days

---

## ACTION 2.1 — Implement `lib/report/src/index.ts` — HTML Report Builder
**Priority:** 🔴 BLOCKING (currently a stub)
**File:** `lib/report/src/index.ts`

### Steps
1. Read the existing `lib/engine/src/html-report.ts` — this already produces a small HTML report.
2. Expand `lib/report/src/index.ts` to produce a full multi-section HTML report with:
   - Cover page (project name, bridge type, date, engineer)
   - Auto-generated Table of Contents (anchor links to each section)
   - Section 1: Project Summary
   - Section 2: Design Basis (IRC codes, material grades, load class)
   - Section 3: Hydraulics (Manning's, Lacey scour, Molesworth afflux, discharge)
   - Section 4: Pier Design (5 IRC:6 load combinations, FOS table, reinforcement)
   - Section 5: Abutment Design (Rankine Ka, 5 load cases, FOS table)
   - Section 6: Slab Design (moment, shear, deflection, utilisation)
   - Section 7: Governing Checks (pass/fail table — failing checks in RED)
   - Section 8: Estimation / BOQ summary
   - Section 9: Assumptions & Limitations
3. Every number must come from the calculation result object — no hard-coded values.
4. Portrait for text sections, landscape CSS class for tables/charts.
5. Export function signature: `generateReport(result: CalculationResult, input: ProjectInput): string` (returns HTML string).

### Exit Criterion
- `npm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.html` produces a file > 100 KB with all 9 sections.
- TOC anchor links resolve correctly.
- No hard-coded numbers appear in the HTML outside of formula constants.

---

## ACTION 2.2 — Implement PDF Export via jsPDF or Puppeteer
**Priority:** 🔴 BLOCKING
**File:** `lib/report/src/pdf.ts` (new file)

### Approach (choose one — jsPDF recommended for Node.js without browser dependency)

**Option A — jsPDF + html2canvas (client-side)**
```ts
import jsPDF from 'jspdf';
// render HTML sections → PDF pages with portrait/landscape per section
```

**Option B — Puppeteer headless Chrome (server-side, best fidelity)**
```ts
import puppeteer from 'puppeteer';
// load HTML string → print to PDF with @page CSS rules
```

### Steps (Option B — recommended)
1. `pnpm add puppeteer --filter @workspace/report` (pinned exact version).
2. Create `lib/report/src/pdf.ts`:
   ```ts
   export async function generatePDF(html: string, outPath: string): Promise<void>
   ```
3. Use Puppeteer: launch → newPage → setContent(html) → pdf({ path: outPath, format: 'A4', landscape: false, printBackground: true }).
4. Handle landscape sections via `@media print { .landscape { size: A4 landscape; } }` CSS.
5. Add page numbers via CSS `@page` counter.
6. Set a 5-minute timeout; log elapsed time.

### Exit Criterion
- `npm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.pdf` produces a real `.pdf` file > 500 KB.
- PDF contains all 9 sections and a cover page.
- Landscape pages (load case tables) render correctly.

### Verification
```bash
# file size check
(Get-Item out/KHERWARA-report.pdf).Length  # should be > 500000 bytes
```

---

## ACTION 2.3 — Create `pipeline/run.ts` — Single Command Entry Point
**Priority:** 🟠 HIGH
**File:** `pipeline/run.ts` (new directory + file)

### Steps
1. Create `pipeline/` directory.
2. `pipeline/run.ts`:
   ```ts
   // Usage: npx tsx pipeline/run.ts --input inputs/KHERWARA.json --out out/KHERWARA-report.pdf
   // Steps:
   // 1. Load and validate input (zod schema from lib/api-zod)
   // 2. Run calculateBridgeDesign() from lib/engine
   // 3. Run generateNarrative() from lib/narrative
   // 4. Run generateReport() from lib/report → HTML string
   // 5. Run generatePDF() → write .pdf
   // 6. Write run-manifest.json with input hash, output hash, duration, timestamp
   ```
3. Add to root `package.json`:
   ```json
   "design": "tsx pipeline/run.ts"
   ```
   (replacing or aliasing the existing `scripts/src/design.ts` entry).
4. Add a `--html-only` flag that skips the PDF step (for fast iteration).

### Exit Criterion
- `npm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.pdf` runs end-to-end in < 5 minutes.
- `out/run-manifest.json` is written alongside the PDF with: `{ inputHash, outputHash, engineVersion, durationMs, timestamp }`.

---

## ACTION 2.4 — Wire PDF Download in React UI
**Priority:** 🟠 HIGH
**Files:** `client/src/pages/Estimate.tsx` and/or `client/src/pages/BridgeSlabReport.tsx`

### Steps
1. Add a `GET /api/design/report/pdf` endpoint in `server/api-routes.ts` that:
   - Reads current design state from `useDesignStore` (or accepts `projectId` param).
   - Calls `generatePDF()` from `lib/report/`.
   - Streams the PDF buffer back with `Content-Type: application/pdf` and `Content-Disposition: attachment`.
2. In the React UI (Estimate page and BridgeSlabReport page), add:
   ```tsx
   <a href="/api/design/report/pdf" download="bridge-report.pdf">
     <FileDown className="h-4 w-4" /> Download PDF
   </a>
   ```
3. Show a loading spinner while the PDF is being generated (can take 10–30 seconds).
4. Handle error states (show toast if PDF generation fails).

### Exit Criterion
- Clicking "Download PDF" in the browser downloads a valid `.pdf` file.
- The file opens correctly in a PDF viewer showing all 9 sections.

---

## ACTION 2.5 — Add Full ~200-Page Report Assembly (`assemble.ts`)
**Priority:** 🟠 HIGH
**File:** `lib/report/src/assemble.ts` (new)

### Steps
1. Create `lib/report/src/assemble.ts` that assembles all section HTML strings in order.
2. Accept an array of `{ title, html, orientation }` objects.
3. Insert page-break directives between sections.
4. Prepend cover page and TOC.
5. Append appendices: formula reference table, input echo, golden-run hash.
6. Target: assembled HTML that Puppeteer can render into a ~150–200 page PDF.

### Exit Criterion
- Generated PDF is ≥ 50 pages.
- TOC page numbers are accurate.
- Run time < 5 minutes on a standard machine.

---

---

# SPRINT 3 — NARRATIVE LAYER & LINT RULE
> **Goal:** Ensure the narrative engine produces traceable, template-driven prose — no hard-coded numbers.
> **Time-box:** 3 days

---

## ACTION 3.1 — Expand `lib/narrative/src/index.ts` from Stub to Full Engine
**Priority:** 🟠 HIGH
**File:** `lib/narrative/src/index.ts`

### Steps
1. Read `bridge-excel-generator/narrative-engine.ts` — extract the working narrative patterns.
2. Expand `lib/narrative/src/index.ts` to produce at minimum:
   - `generateProjectSummaryChapter(input, result): string`
   - `generateHydraulicsChapter(input, result): string`
   - `generatePierChapter(input, result): string`
   - `generateAbutmentChapter(input, result): string`
   - `generateSlabChapter(input, result): string`
   - `generateChecksChapter(result): string`
3. Each function returns HTML fragment string — no raw numbers, only `${result.hydraulics.discharge.toFixed(2)} m³/s` style interpolation.
4. Integrate mined Jinja templates from `knowledge/narrative_corpus/` where available (fall back to built-in templates if not yet mined).

### Exit Criterion
- `generateHydraulicsChapter()` produces a paragraph that reads like engineering prose, not a table dump.
- Every number in the output traces to a field of `CalculationResult`.

---

## ACTION 3.2 — Add No-Hard-Coded-Numbers Lint Rule
**Priority:** 🟡 MEDIUM
**Files:** `lib/narrative/src/**`, `.eslintrc` or custom lint script

### Steps
1. Create `scripts/lint-narrative.ts`:
   - Scans all `.ts` files in `lib/narrative/src/`.
   - Flags any string literal containing an isolated number (e.g. `"span of 45 m"` — the `45` must come from a variable, not be hard-coded).
   - Regex: detect string templates with numeric literals that are not formula constants (skip known constants: 8, 2, 5, 384, 1000, 1e6).
2. Add to root `package.json`: `"lint:narrative": "tsx scripts/lint-narrative.ts"`.
3. Add to `ci.yml` as a required check.

### Exit Criterion
- Running `npm run lint:narrative` on the built-in template functions reports zero violations.
- A deliberately injected `"span of 45 m"` string causes the lint to exit 1.

---

---

# SPRINT 4 — CI HARDENING & EVIDENCE BUNDLE
> **Goal:** Make CI authoritative. Build the release evidence bundle.
> **Time-box:** 3 days

---

## ACTION 4.1 — Fix `ci.yml` — Add Missing Script Definitions
**Priority:** 🟠 HIGH
**Files:** `.github/workflows/ci.yml`, root `package.json`

### Steps
1. Open root `package.json`, verify these scripts exist:
   - `"check"` — typecheck across all packages
   - `"test"` — run all tests
   - `"verify:golden"` — already present
   - `"design"` — pipeline entry
   - `"lint:narrative"` — from Action 3.2
   - `"assimilate"` — from Action 1.6
2. Add any missing definitions.
3. Update `ci.yml` to run all 7 gates in order:
   ```yaml
   - run: npm run check
   - run: npm run test
   - run: npm run assimilate -- --report
   - run: npm run verify:golden
   - run: npm run lint:narrative
   - run: npm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.pdf
   - uses: actions/upload-artifact@v4
     with:
       name: bridge-report
       path: out/KHERWARA-report.pdf
   ```
4. Add tamper job:
   ```yaml
   tamper-test:
     steps:
       - run: npm run verify:golden -- --tamper
       # this MUST exit non-zero — assert with: if: success() → fail
   ```

### Exit Criterion
- `ci.yml` runs all 7 gates.
- PDF is uploaded as a CI artifact on every green run.
- Tamper job fails as expected (CI reports it as a required-fail).

---

## ACTION 4.2 — Create `evidence/release-candidate/` Bundle
**Priority:** 🟠 HIGH
**Directory:** `evidence/release-candidate/`

### Steps
1. Create directory structure:
   ```
   evidence/release-candidate/
     ci/
       typecheck.log
       tests.log
       verify-golden.log
     golden/
       diff-report.txt
     tamper/
       tamper-proof.log
     assimilation/
       coverage.md
     report/
       canonical-report.html
       canonical-report.pdf
     MANIFEST.sha256
     ENGINEERING_REVIEW.md
   ```
2. After CI passes, copy logs into `ci/`.
3. Copy golden diff report into `golden/`.
4. Copy canonical PDF/HTML into `report/`.
5. Generate `MANIFEST.sha256`:
   ```bash
   Get-FileHash evidence/release-candidate/report/canonical-report.pdf | Out-File evidence/release-candidate/MANIFEST.sha256
   ```
6. `ENGINEERING_REVIEW.md` template:
   ```markdown
   # Engineering Review Record
   Reviewer: _______________
   Date: _______________
   Scope: _______________
   Verdict: [ ] Approved for internal use  [ ] Requires revision  [ ] Blocked
   Notes:
   ```

### Exit Criterion
- `evidence/release-candidate/` committed with all subdirectories populated.
- `MANIFEST.sha256` contains hashes of the canonical PDF and HTML.
- `ENGINEERING_REVIEW.md` exists (even if verdict is pending).

---

## ACTION 4.3 — Fix Persistence: Create `lib/store/` and Run Manifests
**Priority:** 🟡 MEDIUM
**Files:** `lib/store/src/index.ts` (new package)

### Steps
1. Create `lib/store/` as a new pnpm workspace package.
2. Implement `saveRun(manifest: RunManifest): void` — writes `out/runs/<timestamp>-manifest.json`.
3. Implement `loadRun(id: string): RunManifest | null`.
4. `RunManifest` type:
   ```ts
   type RunManifest = {
     id: string;
     timestamp: string;
     inputHash: string;
     outputHash: string;
     engineVersion: string;
     durationMs: number;
     inputPath: string;
     outputPath: string;
     goldenDiff?: string;
   }
   ```
5. Call `saveRun()` from `pipeline/run.ts` after successful PDF generation.

### Exit Criterion
- Two consecutive runs of the same input produce byte-identical PDFs AND identical `outputHash` in the manifest.

---

---

# SPRINT 5 — BUG FIXES & QUALITY
> **Goal:** Fix the remaining high-priority defects from Section F of `august-due.md`.
> **Time-box:** 3 days

---

## ACTION 5.1 — Fix GENSPARK-001: Add Compute Timeout to Optimisation Route
**Priority:** 🔴 BLOCKING (DoS vector)
**File:** `server/api-routes.ts` or `artifacts/api-server/src/routes/`

### Steps
1. Find the optimisation endpoint (search for `optimis` in server route files).
2. Wrap the synchronous CPU-heavy call in a `Promise` with a 30-second timeout:
   ```ts
   const result = await Promise.race([
     optimise(input),
     new Promise((_, reject) => setTimeout(() => reject(new Error('Optimisation timeout')), 30000))
   ]);
   ```
3. Return HTTP 504 with `{ error: 'Optimisation timed out' }` on timeout.
4. Log the timeout event.

### Exit Criterion
- A deliberately slow optimisation call returns 504 after 30 seconds, not an indefinite hang.

---

## ACTION 5.2 — Fix QODER-004: Add Debounce to Input Form API Calls
**Priority:** 🟠 HIGH
**Files:** `client/src/pages/Design.tsx`, `client/src/components/WorkbookInputTabs.tsx`

### Steps
1. Install or import `useDebouncedCallback` (already available via `@tanstack/react-query` utils or add `use-debounce` package — pinned version).
2. Wrap every `onChange` handler that triggers an API call with a 300 ms debounce.
3. Cancel pending requests when a new keystroke arrives (use `AbortController`).

### Exit Criterion
- Typing quickly in an input field produces at most 1 API call per 300 ms burst, not 1 per keystroke.
- Network tab in DevTools confirms.

---

## ACTION 5.3 — Fix LOVABLE-003: Wire Projects Page Backend CRUD
**Priority:** 🟠 HIGH
**Files:** `client/src/pages/Projects.tsx`, `server/api-routes.ts`

### Steps
1. Verify `/api/projects` GET, POST, PUT, DELETE routes exist in `server/api-routes.ts`.
2. If not, implement them (read from / write to a JSON file store or the existing DB schema in `shared/schema.ts`).
3. In `Projects.tsx`, replace any hardcoded/mock data with `useQuery` calls to `/api/projects`.
4. Add create, rename, and delete project UI interactions.
5. On project click: load template into `useDesignStore` and navigate to `/design`.

### Exit Criterion
- A project created in the UI persists across page refresh.
- Clicking a project navigates to `/design` with that project's inputs pre-loaded.

---

## ACTION 5.4 — Fix WINDSURF-001 + WINDSURF-002: WCAG Accessibility
**Priority:** 🟡 MEDIUM
**Files:** `client/index.html`, all form component files

### Steps
1. `client/index.html`: Add `lang="en"` to the `<html>` tag.
2. Search for all `<input>` and `<select>` elements without an associated `<label htmlFor>`:
   ```bash
   grep -rn "<input" client/src/components/ | grep -v "htmlFor\|aria-label"
   ```
3. For each: add a `<label htmlFor="field-id">` and matching `id="field-id"` on the input.
4. Add `<meta name="description">` and `<title>` to `client/index.html`.

### Exit Criterion
- `axe-core` or browser accessibility checker reports zero WCAG 1.3.1 and 3.1.1 violations on the Design page.

---

## ACTION 5.5 — Fix LOVABLE-002: Update Stale Trial Banner
**Priority:** 🟡 MEDIUM
**File:** `client/src/pages/Landing.tsx` (or wherever the banner renders)

### Steps
1. Find the "April–May 2026 trial period" text.
2. Replace with accurate current status: `"Engineering preview build — October 2026"` or similar.
3. If the banner is controlled by a feature flag, update `shared/feature-flags.ts`.

### Exit Criterion
- No reference to "April–May 2026" in the running UI.

---

## ACTION 5.6 — Promote Hard-Coded Engineering Constants
**Priority:** 🟡 MEDIUM
**File:** `bridge-excel-generator/design-engine.ts`

### Steps
1. Find all instances of:
   - `liveLoadPerMeter = 50` (kN/m — "IRC Class AA governing" — HARDCODED)
   - `deckObstruction = 0.83` (m — Molesworth afflux — HARDCODED)
   - `frictionCoeff = 0.5`
   - `mainBarDia = 25`, `linkDia = 10`, `linkSpacing = 150`
2. For each: move to a named constant in a `DESIGN_CONSTANTS` object at the top of the file OR promote to `inputs/coefficients.json` with a source reference.
3. Add a comment on each constant: `// IRC:6-2016 Table X Clause Y` or `// Molesworth 1868 formula constant — see docs/`.

### Exit Criterion
- Zero anonymous numeric literals remain in `calculatePierDesign()` or `calculateAbutmentDesign()` that are not formula skeleton constants (8, 2, 5, 384).

---

---

# SPRINT 6 — MULTI-PROJECT BATCH & DOCKER
> **Goal:** Prove the pipeline works for 3+ different bridge projects. Package it for headless runs.
> **Time-box:** 4 days

---

## ACTION 6.1 — Add Second and Third Golden Projects
**Priority:** 🟠 HIGH
**Files:** `inputs/BANAS-HIGHLEVEL.json`, `inputs/JAKHAM-MANDVI.json`, `tests/golden/banas/`, `tests/golden/jakham/`

### Steps
1. From the existing `design-reports/` HTML outputs (banas-river-highlevel, jakham-river-mandvi), extract the input parameters.
2. Create `inputs/BANAS-HIGHLEVEL.json` and `inputs/JAKHAM-MANDVI.json` following the same schema as `inputs/KHERWARA.json`.
3. Run the pipeline on each: `npm run design -- --input inputs/BANAS-HIGHLEVEL.json --out out/BANAS-report.pdf`.
4. Capture outputs as golden fixtures: `tests/golden/banas/expected.json`, `tests/golden/jakham/expected.json`.
5. Add both to the `verify:golden` script.

### Exit Criterion
- 3 different input sets each produce a valid PDF.
- All 3 golden fixtures pass `npm run verify:golden`.

---

## ACTION 6.2 — Create `pipeline/batch.ts` — Multi-Project Batch Runner
**Priority:** 🟡 MEDIUM
**File:** `pipeline/batch.ts` (new)

### Steps
1. Accept a glob or directory of `.json` input files.
2. For each input: run the full pipeline, write PDF + HTML + manifest to `out/<project-name>/`.
3. After all runs: write a `out/batch-summary.json` with per-project status and output hashes.
4. Exit 0 only if ALL projects succeed.
5. Add to `package.json`: `"batch": "tsx pipeline/batch.ts --inputs 'inputs/*.json' --outdir out/"`.

### Exit Criterion
- `npm run batch` processes all 3 input files and produces 3 PDFs + `out/batch-summary.json`.

---

## ACTION 6.3 — Create `Dockerfile` for Headless Runs
**Priority:** 🟡 MEDIUM
**File:** `Dockerfile` (root)

### Dockerfile
```dockerfile
FROM node:24-slim

# Install system deps for Puppeteer + Python
RUN apt-get update && apt-get install -y \
    python3 python3-pip pandoc \
    chromium fonts-liberation libgbm1 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/ ./lib/
COPY pipeline/ ./pipeline/
COPY inputs/ ./inputs/
COPY scripts/ ./scripts/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

CMD ["pnpm", "run", "design", "--", "--input", "inputs/KHERWARA.json", "--out", "out/KHERWARA-report.pdf"]
```

### Exit Criterion
- `docker build -t bridge-design .` succeeds.
- `docker run -v $(pwd)/out:/app/out bridge-design` produces `out/KHERWARA-report.pdf`.

---

---

# SPRINT 7 — HOUSEKEEPING & OPEN QUESTIONS
> **Goal:** Close the remaining documentation gaps and get engineering decisions recorded.
> **Time-box:** 2 days

---

## ACTION 7.1 — Adjudicate Kherwara vs Kharka Identity
**Priority:** 🔴 BLOCKING (engineer decision required)
**File:** `project/canonical-projects/kherwara-kharka-decision.md`

### Steps
1. Open `project/canonical-projects/kherwara-kharka-decision.md`.
2. Change status from `OPEN` to `RESOLVED`.
3. Record: Are Kherwara and Kharka the same bridge project? (Check `Attached_Assets/DESIGN REPORT KHARKA BRIDGE.docx` and `Attached_Assets/FINAL BRIDGE KHERKA 01–03.docx` — look for grid references, design discharge Q, and bridge location.)
4. Select one authoritative workbook revision.
5. Select one authoritative design-report set.
6. Record the decision with the engineer's name and date.

### Exit Criterion
- `kherwara-kharka-decision.md` no longer contains `Status: OPEN`.
- The decision is recorded with a named engineer and date.

---

## ACTION 7.2 — Complete Platform Quarantine
**Priority:** 🟡 MEDIUM
**Files:** Root `package.json`, `api/`, `client/` (live + archive)

### Steps
1. Confirm what is still live that should be archived:
   - `api/` at root — move to `archive/api-root/` if not used by `artifacts/api-server/`.
   - Review `drizzle-orm`, `@neondatabase/serverless`, `passport`, `express-session` in root `package.json` — uninstall if not required by `artifacts/api-server/`.
2. Run `npm run check` after each uninstall — must still pass.
3. Update `BASELINE_MANIFEST.md` to reflect the cleaned dependency tree.

### Exit Criterion
- Root `package.json` does not list DB/auth packages unless they are used by a live code path.
- `npm run check` passes.

---

## ACTION 7.3 — Populate `engineering/review/ENGINEERING_REVIEW.md`
**Priority:** 🔴 BLOCKING for release
**File:** `engineering/review/ENGINEERING_REVIEW.md` (new)

### Template
```markdown
# Engineering Review Record
**Build:** KHERWARA prototype — October 2026
**Reviewer:** [Licensed Engineer Name, Qualification]
**Date:** [Date]
**Scope:** IRC:112-2015 slab design · IRC:6-2016 loads · IRC SP-13 hydraulics
**Verdict:** [ ] Approved for internal use  [ ] Requires revision  [ ] Blocked

## Findings
[Engineer's notes]

## Sign-Off
Signature: _______________
Registration No.: _______________
```

### Exit Criterion
- File exists with at minimum: reviewer name, date, and an explicit verdict selection.

---

## ACTION 7.4 — Sync `docs/implementation-reality-check.md` with Current State
**Priority:** 🟡 MEDIUM
**File:** `docs/implementation-reality-check.md`

### Steps
1. Update the "What is implemented" section to reflect Sprint 0–6 completions.
2. Update the "What is not evidenced" section — remove items as they are completed.
3. Update the "Authoritative path" section to reference `pipeline/run.ts` once Action 2.3 is done.

### Exit Criterion
- A new reader of `docs/implementation-reality-check.md` gets an accurate picture of the current build state.

---

---

# DELIVERY CHECKLIST — ALL SPRINTS

Use this as the final gate before calling any output "released."

```
SPRINT 0 — UNBLOCK
[ ] CURSOR-002 abutment load cases fixed and tested
[ ] BOLT-001 dead router resolved
[ ] CURSOR-003 z.any() replaced with typed schema
[ ] BASELINE_MANIFEST.md committed
[ ] WEEK0_ACCEPTANCE.md committed

SPRINT 1 — ASSET ASSIMILATION
[ ] knowledge/inventory.json committed (≥173 records)
[ ] normalize.py produces knowledge/corpus/**
[ ] classify_cells.py produces knowledge/registry/**
[ ] mine_narrative.py produces knowledge/narrative_corpus/*.jinja
[ ] map_drawings.py produces knowledge/layout_manifest.json
[ ] npm run assimilate -- --report exits 0

SPRINT 2 — PDF PIPELINE
[ ] lib/report/src/index.ts full HTML builder (9 sections)
[ ] lib/report/src/pdf.ts Puppeteer PDF generator
[ ] pipeline/run.ts single-command entry
[ ] PDF download wired in React UI
[ ] out/KHERWARA-report.pdf > 500 KB committed as artifact

SPRINT 3 — NARRATIVE
[ ] lib/narrative/src/index.ts full (6 chapter functions)
[ ] lint:narrative passes (zero hard-coded number violations)

SPRINT 4 — CI & EVIDENCE
[ ] ci.yml runs all 7 gates
[ ] PDF uploaded as CI artifact
[ ] evidence/release-candidate/ bundle committed
[ ] lib/store/ run manifests working

SPRINT 5 — BUG FIXES
[ ] Compute timeout on optimisation route
[ ] Input debounce added
[ ] Projects CRUD wired
[ ] WCAG lang + label fixes
[ ] Hard-coded engineering constants promoted

SPRINT 6 — BATCH & DOCKER
[ ] 3 golden projects passing verify:golden
[ ] pipeline/batch.ts produces 3 PDFs
[ ] Dockerfile builds and runs

SPRINT 7 — HOUSEKEEPING
[ ] Kherwara/Kharka decision RESOLVED
[ ] Platform quarantine complete
[ ] engineering/review/ populated
[ ] docs/implementation-reality-check.md updated
```

---

*Last updated: 2026-10-04 — Kiro (AutoLog)*
*Next update due: next agent session or 12 minutes, whichever comes first — append to CREAT.md*
