# DUE-11 working scratch (2026-10-06)

Read-only probes and run transcripts from the print-policy pass, kept for the audit trail behind
`august-due.md` §S. Nothing here is imported by any code path.

- `due11-probe-pagesetup.mjs` — ExcelJS read-back of one workbook: per-sheet orientation, paperSize,
  fitToPage and margins in mm. This is what measured the pre-fix 14-landscape defect and the
  post-fix 19/37. Superseded in the long run by `scripts/verify-presentation-policy.ts`.
- `due11-static.mjs` — throwaway loopback static server, because the in-app browser refuses `file://`
  and needed to load `test-output/*.html` for the CSSOM measurement. Stopped after the run.
- `due11-gate.txt` — `verify:presentation` summary lines (both book shapes, @page count, PDF tallies).
- `due11-check.log`, `due11-verify.log`, `due11-deliverables.log`, `due11-book56.log`,
  `due11-candidate.log` — command transcripts; the authoritative copies are in
  `evidence/release-candidate/gates/`.
