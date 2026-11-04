# 20261007-tmp-c1check — DUE-19 scratch (Turn 29, 2026-10-07)

Evidence for **DUE-19 (§Z)**: the Turn-6 C1 abutment verdict fix re-verified, and the one-model
finding underneath it. Nothing here is a deliverable; `test-output/` holds those. Kept per the
project rule *archive, never delete* — probe sources are parked in `probes/` rather than removed.

## Logs (transcripts, verbatim)

| File | What it proves |
|---|---|
| `out.log` | **The divergence measurement.** 20 templates × 5 load cases = **100 case-pairs** of engine Type-1 vs engine C1 (sliding / overturning / bearing FOS, V, H, M, status): **0 divergences**, geometry identical on **20/20**. This is why the mirror statements in §Z-3 are facts, not hedges. |
| `links-tamper.log` | **Negative control.** With one cached C1 sliding FOS inflated ×1.2 in the generator, `verify:links` re-executes `='TYPE1-STABILITY CHECK ABUTMENT'!F21…H25` and prints **100 `DIVERGE` lines** (5 cases × 20 workbooks), `Done: 0/20 workbooks fully linked`, **exit 1**. |
| `links-restored.log` | Same line reverted → `Done: 20/20 workbooks fully linked`, exit 0. Paired with the tamper above, this is §Z-4. |
| `check.log` | `pnpm run check` exit **0** after the four disclosure edits — typecheck lanes + `lint:narrative` **159 prose spans, 0 violations**. |
| `verify.log` | `pnpm run verify` exit **0**, all **eleven** lanes: sheets 46/46 · links 20/20 broken:0 diverge:0 · values/costing/uplift/cases 20 templates 0 defects · outcomes **SAFE 195 / UNSAFE 105 of 300**, bearing-attributed 6, client UI copy `OK` · parity 22 facts 0 defects · presentation executive-56 19L/37P + legacy-46 13L/33P · engine **490 pinned, 0 drifted**, tamper moved 48, discharge diagnostic 0 of 490. |
| `deliverables.log` | `pnpm run deliverables` exit **0**, 6 files: workbook **109 971 B**, sheet-book.pdf 3 249 807 B, comprehensive-report.pdf 4 980 101 B, short-design-report.pdf 222 981 B, design-report.html 430 004 B, irc-checklist.html 39 752 B. |
| `candidate.log` | `pnpm run candidate` exit **0** — check 57.0 s · verify 108.6 s · test 54.3 s · audit:policy 5.4 s, bundle = 6 deliverables + gate transcripts at commit `8b5730f2c5ef`. |
| `wbread.log`, `wbread-summary.log` | **Artefact read-back** of `test-output/design-workbook.xlsx` sheet `C1-STABILITY CHECK ABUTMENT`: row 3 mirror disclosure, `C5 →1.7216`, `D5 →2.1434`, `E5 →3.9446`, `F5 =IF(AND(C5>=1.5,D5>=1.8,E5>=1),"SAFE","UNSAFE") → SAFE`. The first line of these logs prints `QA sheet: undefined` — this probe looked the QA sheet up under a name it does not have, so that sub-check simply found nothing; the QA text was read properly by `qaprobe.ts` below, and the C1 cell output came from the correct sheet object. |
| `qaread.log` | Read-back of `IRC CODE COMPLIANCE CHECKLIST` via `getWorksheet` by its real name (`C01-qa-admin.ts:29`): row 43 **D2** carries the new one-model sentence; row 42 (pier) and row 46 (bearing ≥ 1.00) unchanged. |
| `wbread-tail.log` | The **error** half of the first workbook probe: `MODULE_NOT_FOUND` — `wbprobe.ts` sat one directory too deep and imported `'../bridge-excel-generator/utils.ts'`. Fixed to `'../../…'` before the successful read above. Recorded so the later log is not mistaken for the first run. |
| `turn29-chatlog.md` | The Turn 29 text **before** it was appended to `CREAT-CHATLOG.MD` (the append used `cat >>`, because a heredoc with the apostrophes in this text broke bash). Kept as the draft of record. |

## `probes/` (source of the measurements above — archived, not deleted)

| File | Purpose |
|---|---|
| `p.ts` | Divergence measurer: builds every template's engine result twice (`'TYPE1'`, `'C1'`) and compares case by case → `out.log`. |
| `wbprobe.ts` | Opens the regenerated workbook with ExcelJS and prints the C1 stability sheet's formulas **and** cached results (via `readCellValue`, never the raw cell) → `wbread*.log`. |
| `qaprobe.ts` | Reads QA checklist rows 42/43/46 from the delivered workbook → `qaread.log`. |
| `reverted-line.txt` | The exact generator line restored after the tamper control (`result: Number(loadCase.slidingFOS.toFixed(4))`, `bridge-excel-generator/sheets/29-46-estimation.ts`), so the revert is auditable. |

Run with `npx tsx <file>` from the repo root. tsx compiles `archive/**` as CJS, so these use
`function main()` + `main()` — no top-level await.

## What was NOT changed

No engineering number, verdict, FOS or quantity moved. The abutment engine is untouched: giving the
cantilever its own heel/toe geometry is §M-5 / SUMMARY row 23, an engineering decision, and
inventing those dimensions would fabricate a structure (§V-3, §W-6). No git commit, branch or push;
no `git lfs pull`.
