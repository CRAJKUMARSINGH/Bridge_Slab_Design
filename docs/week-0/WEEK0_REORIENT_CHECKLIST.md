# WEEK 0 ΓÇö REORIENT CHECKLIST (CURSOR SLAB DESIGN ΓåÆ Bridge Report Pipeline)

Product decision (from repo's own DREAM030526.md): **the deliverable is the detailed
design report (HTML/PDF). Excel is only a structural model of formula sequencing.**

---

## Day 0 ΓÇö Baseline & freeze (~2 h)
- [ ] `git checkout -b reorient-week0` (main stays untouched)
- [ ] Record entry points from `package.json` scripts (30+ today) ΓÇö the baseline list
- [ ] Write `BASELINE_MANIFEST.md`: top-level inventory, entry points, output artifacts
      (`design-reports/*.html`, `sample/*`, `artifacts/`), duplicate engine trees
      (`client/src/report-engine` vs `client/src/report-engine-weaver`)
- [ ] Record npm install/`npm run check` result as finding #0 (unconfirmed until run)
- **EXIT:_manifest committed; ZERO files changed/deleted; keep/archive list approved**

## Day 1 ΓÇö Golden project + input contract (~4 h)
- [ ] Pick ONE validation project: **Kherwara** (assets: `Attached_Assets/DESIGN REPORT
      KHARKA BRIDGE.docx`, `Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Kherka Bridge.docx`,
      `FINAL BRIDGE KHERKA 01..03.docx`; existing hook: `scripts/verify-kherwara-excel-golden.ts`)
- [ ] Convert one legacy project workbook ΓåÆ .xlsx:
      `soffice --headless --convert-to xlsx "<legacy>.xls" --outdir work/golden/`
- [ ] Run classifier (real data, interactive): `python classify_cells.py work/golden/<wb>.xlsx --confirm --outdir work/golden/out`
- [ ] Derive input contract from `VARIABLE_SELECTION_SHEET.xlsx` (INPUT rows, 194-row catalog)
      ΓåÆ `inputs/schema.json` via `scripts/extract_contract.py`
- **EXIT:_variables.json / coefficients.json / constraints.json committed; schema approved;
      Γëñ5 open ambiguous cells**

## Day 2 ΓÇö Quarantine platform layer (~3 h)
- [ ] `mkdir archive/` then `git mv` (never `rm`): `ETERNAL_RESEARCH_CHILD/`,
      `scripts/phase-zero/`, `scripts/smoke-*`, `scripts/batch-*`, `scripts/run-fifteen-*`,
      `scripts/stress-test-*`, `scripts/export-sample-output-bundle.ts`, `api/`, `netlify/`,
      `vercel.json`, `client/` (dashboard) ΓåÆ `archive/client-dashboard/`,
      `client/src/report-engine-weaver/` (duplicate engine)
- [ ] Strip DB/auth deps: `npm uninstall drizzle-orm drizzle-kit drizzle-zod
      @neondatabase/serverless passport passport-local express-session connect-pg-simple memorystore`
- [ ] `npm uninstall xlsx` or document exception; re-check `npm run check` (tsc)
- **EXIT:_tsc passes on trimmed set; server boots with NO DB (`npm run dev` renders);
      nothing deleted ΓÇö all in archive/**

## Day 3 ΓÇö Single pipeline (~4 h)
- [ ] `pipeline/` : `run.ts` = load contract ΓåÆ validate (`shared/schema.ts`) ΓåÆ
      `bridge-excel-generator/design-engine.ts` ΓåÆ `narrative-engine.ts` ΓåÆ
      `server/landscape-pdf-export.ts` / `comprehensive-pdf-export.ts` ΓåÆ PDF
- [ ] One command: `npm run design -- --input inputs/KHERWARA.yaml --out out/KHERWARA-report.pdf`
- [ ] Classifier wired as `npm run classify` (python, calls classify_cells.py)
- [ ] ExcelJS generator kept ONLY for golden-file/parity tests ΓÇö not user-facing
- **EXIT:_one command ΓåÆ one PDF for Kherwara; no server/UI in the critical path**

## Day 4 ΓÇö Golden regression harness (~4 h)
- [ ] `tests/golden/kherwara/`: `inputs.yaml` + frozen `expected.json` (all intermediates)
- [ ] `npm run verify:golden` ΓÇö diff vs snapshot, rtol=1e-6, ANY diff > 0 blocks
- [ ] Constraint gate: every `constraints.json` inequality evaluated, utilisation Γëñ 1.0
- [ ] NEGATIVE test: tamper one input ΓåÆ verify goes RED (proves the harness bites)
- **EXIT:_verify:golden green on Kherwara; red on tampered input**

## Day 5 ΓÇö Acceptance gate (~3 h)
- [ ] Rewrite `README.md`: one purpose sentence (report-first), 2-command quickstart,
      input contract, pipeline diagram, "add a new project" section
- [ ] `requirements.txt` (Python: openpyxl, PyYAML) + trimmed, locked `package-lock.json`
- [ ] `WEEK0_ACCEPTANCE.md` with Day 0ΓÇô5 exit criteria + licensed-engineer sign-off line
- [ ] Commit `reorient-week0` ΓåÆ PR ΓåÆ merge
- **EXIT:_colleague on a CLEAN clone runs README quickstart and produces the Kherwara
      PDF with zero questions**

---
## Non-negotiables
- Archive, never delete (git mv preserves history)
- One golden project before expanding: Kherwara
- No new feature work before `verify:golden` is green
- Every number in the report must trace to `inputs/` or a formula ΓÇö no hard-coded outputs
