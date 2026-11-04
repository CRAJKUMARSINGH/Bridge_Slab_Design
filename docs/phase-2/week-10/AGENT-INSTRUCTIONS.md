# P2-W10 — REPORT GENERATION & INTEGRITY VERIFICATION
Primary: Trae | Verifier: Kiro | Prereq: W09A | Gate: verify:report

## 0. READ FIRST
docs/phase-2/_templates/REPORT-SPEC.md | server/comprehensive-pdf-export.ts
server/design-report.ts | server/checklist-export.ts | docs/phase-2/DATA-MODEL.md

## 1. OBJECTIVE
Build the report generation pipeline: chapter list, page geometry, provenance
footnotes, integrity block, and verify:report as the reproducibility gate.

## 2. HARD CONSTRAINTS
- Reports must regenerate from the manifest with matching hashes.
- TOC page numbers must be correct (not approximate).
- Every figure, table, and chapter carries a provenance footnote.
- The integrity block (sha256 of HTML, PDF, figures, input, result, engine version)
  is embedded in the report.

## 3. TASKS
T10.1 Implement the chapter list from REPORT-SPEC.md: every chapter with data source,
      figures, tables, and mandatory flag.
T10.2 Implement page geometry: landscape size, margins, header, footer, page
      numbering, TOC/LOF generation.
T10.3 Implement the provenance footnote format:
      `based on: {{input}} · {{coefficient}} · {{cell}} · {{formula}} · engine {{version}}`
T10.4 Implement the integrity block: sha256 of HTML, PDF, each figure, input JSON,
      result JSON, engine version.
T10.5 Implement verify:report — regenerate from manifest; assert hashes match; assert
      TOC page numbers are correct.
T10.6 Create docs/phase-2/week-10/REPORT-VALIDATION.md with the regeneration test.
T10.7 Ensure the comprehensive PDF, HTML design report, and IRC checklist all carry
      provenance footnotes and integrity blocks.

## 4. EVIDENCE
verify:report output, REPORT-VALIDATION.md, sample report with integrity block.

## 5. EXIT GATE
[ ] Report regenerates from manifest with matching hashes
[ ] TOC page numbers correct
[ ] Provenance footnotes on every figure, table, and chapter
[ ] Integrity block embedded in HTML, PDF, and JSON outputs
[ ] verify:report green

## 6. DELIVERABLES
docs/phase-2/week-10/{REPORT-VALIDATION,EXIT-GATE-EVIDENCE}.md |
docs/phase-2/_templates/REPORT-SPEC.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
