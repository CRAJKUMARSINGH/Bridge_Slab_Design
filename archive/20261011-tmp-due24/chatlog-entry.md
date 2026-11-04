
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
