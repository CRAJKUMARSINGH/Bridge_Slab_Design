# P2-W02A EXIT GATE EVIDENCE

Week: W02A — Source corpus assimilation & oracle freeze | Agent: TraeCode (for Devin) | Verifier: Antigravity (pending) | Date: 2026-10-31
Baseline commit: uncommitted (working tree) | Gate under test: `gate:oracle`
**W02A is GREEN on the gate; it stays DRAFT pending licensed sign-off.** This file records
what was measured, and what remains open.

This file is evidence, not a summary of evidence. Every number below was copied from
the terminal of this worktree, including the RED runs. Where a value could not be
measured, it is marked **NOT RUN** with the reason — nothing is guessed.

## 1. Gate checklist (copied verbatim from `AGENT-INSTRUCTIONS.md` §5)

| # | Exit-gate item | Result | Evidence |
|---|---|---|---|
| 1 | 8 workbooks copied and hashed; originals untouched | **PASS** | `corpus/raw/manifest.json` — 8 entries, `sha256` + `bytes`; `gate-oracle` re-hashes all 8 on every run: `8/8 corpus hashes verified` |
| 2 | `.xls` reader works; `XLS-STRATEGY.md` states the W04 interaction | **PASS (runtime-proven)** | `lib/engine/src/io/xls.ts` + `scripts/assimilate/sheetjs-xls-decoder.ts`; decision + W04 T4.1 interaction in `XLS-STRATEGY.md`. The reader **ran** this week: `emit-oracle.ts` read all 5 readable workbooks (37,882 cells) — see §4.2 |
| 3 | `GOLDEN-ORACLE.json` frozen with 48+ entries, units, sources, tolerances | **PASS** | `GOLDEN-ORACLE.json` v1.1.0 — **55 values** (SOM-KHW 21, SOM-LAR 17, BED-HL 17), **every entry carries `sheet`, `cell` and `tol`**. Independently re-resolved: 55/55 `(sheet, cell)` pairs agree within band, 0 mismatches (§3) |
| 4 | `SOURCE-DEFECT-REGISTER.md` has D-01..D-14 with required behaviours | **PASS (DRAFT)** | `docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md` — D-01..D-14 + D-15..D-18 + T-01. **D-13 recorded as an unresolvable provenance gap, not guessed** (see §6) |
| 5 | `#ERR` cells tolerated (test-proven) | **PASS (test-proven)** | `tests/integration/xls-error-cells.test.ts` — `pass 3 / fail 0` (§4.5). Covers both spellings: textual `#ERR:Ref` / `#ERR:Name` (synthetic, since the corpus carries none) and genuine BIFF error cells in the real Bedach workbook's `loadsumm ` + `Deck Anchorage` sheets. A partial row is retained and REVIEW is flagged — **no exception**. Non-vacuity proven by a RED scratch run (§4.5) |
| 6 | Old fixtures superseded with a written note | **PASS (written note; move held)** | The required written note exists — `GOLDEN-ORACLE.json` `superseded[]` + `archive/MANIFEST.md` + §5 (explicit before/after) — matching the V-02A criterion ("carry a written reason"). The physical `git mv` into `corpus/superseded/` (T2A.8) is **held** by the project-wide archive-never-delete rule (hold until W00–W12A close); the hold is disclosed, not a silent pass |
| 7 | `gate:oracle` green | **PASS** | `GATE gate-oracle: PASS 270 assertions` (`exit 0`); `scripts/gates/.out/gate-oracle.json` = `pass 270, fail 0, skipped 0`. Non-vacuity proven in §4.3 (RED→GREEN→RED) |

**Exit verdict: all 7 items PASS (item 6 on its written-note criterion; the physical fixture
move is held by the archive-never-delete rule and disclosed in §5). `gate:oracle` is GREEN and
the `#ERR` tolerance is test-proven. W02A close-out sets `containment/GATE-LEDGER.json`
`W02A = GREEN` on this evidence; the week and every deliverable stay DRAFT pending licensed
engineer sign-off.**

## 2. Corpus manifest (sha256, measured)

`corpus/raw/manifest.json` — `schemaVersion: corpus-raw.v1`, `hashAlgorithm: sha256`,
`hashCase: lowercase`, `originalsImmutable: true`. Every digest below is re-measured
by `gate-oracle` on each run; all 8 matched at authoring time and again on this run.

| Bridge code | Format | Bytes | sha256 |
|---|---|---|---|
| SOM-KHW | biff8 | 862208 | `143c972c402bd7703aefedc50de9f86bac7f91d6e2425186a7caae3e0673c3c8` |
| SOM-LAR | biff8 | 1102336 | `1f457e9ec0399b013fdf801a2709b283f2f4b68692f61c66501be30fe312885f` |
| BED-HL | biff8 | 1731584 | `a05db117aa50c56a574aa474b56e39556d13fd645564ffcb3e1b98aef07c5a02` |
| BED-SUB | xlsx | 512457 | `0b08b7c10c954a7b0ec96effbf67d2157e48121ba43a6968cd14c7e583e849dd` |
| AYAD-HL | biff8 | 1257984 | `1146d470b27be09cfd80cba0ddb5c4667917a6d085dc489b47a16b1fb23dec2e` |
| REF-PIERCAP-1 | biff8 | 219136 | `9ddbf40d1797ef2a5f0efd2e4756e58ca2d73fcac7bc738a519f8ab6f67a7bb1` |
| REF-PIERCAP-2 | biff8 | 3574784 | `d01704be2f2600a453ae3c8ef77f45fd9372ecf4d54119625a49b38e5504a812` |
| REF-FOOTING | biff8 | 472576 | `fd16c50a3453f5682c6d0f17263e2a8e857b7be7f7c7fd746671e691aa68d9b0` |

7 of the 8 are BIFF8 `.xls`; only `BED-SUB` is OOXML `.xlsx`. The originals under
`reference-design-examples/` were never opened for write — the copies were made by
byte copy and the digests above were measured on the copies.

## 3. Oracle entry count

`corpus/oracle/GOLDEN-ORACLE.json` — `version 1.1.0`, 3 bridges, **55 values** total
(SOM-KHW 21, SOM-LAR 17, BED-HL 17). `toleranceCategories` are frozen to
`{ ARITH: 1e-6, ROUNDED: 1e-4, HAND: 2e-2 }` and the gate deep-equals them. Every value
carries `{ q, v, u, sheet, cell, tol }` (and, where the source cell is a formula, its
`formula` string).

The T2A.4 target was **48+** values with a source cell on every entry. 55 ≥ 48, and every
entry now carries a `cell` — the freeze gap the gate previously reported is closed.

**Independent cross-check (measured):** a scratch harness re-opened the emitted
`corpus/oracle/<bridge>.json`, resolved every `(sheet, cell)` pair named by the golden
oracle, and compared within band → `verified 55 entries, 0 problems`.

## 4. Command log (raw)

### 4.1 `node scripts/gates/gate-oracle.mjs` — this run

```
gate-oracle: 8/8 corpus hashes verified, 3 bridges, 55 oracle values
GATE gate-oracle: PASS 270 assertions
EXIT=0
```

`scripts/gates/.out/gate-oracle.json`:

```json
{ "name": "gate-oracle", "ts": "2026-10-31T11:04:26.608Z", "commit": "local", "pass": 270, "fail": 0, "skipped": 0, "egress": "none" }
```

The 270 assertions are the 8 corpus hashes (×4 checks each), oracle presence + frozen-band
deep-equal, 3 bridges × (4 reachability checks), 55 values × (4 provenance checks), and the
`>= 48` freeze floor. Before this week the gate was RED (`FAIL 150 assertions`, 25 values,
no cells); it is now GREEN on the completed freeze.

### 4.2 `node scripts/assimilate/emit-oracle.ts` — T2A.3, this run

```
emit-oracle: 8 bridge(s) -> corpus/oracle
  OK   SOM-KHW        cells:  7482 review:4  -> ...\corpus\oracle\SOM-KHW.json
  OK   SOM-LAR        cells:  7427 review:10 -> ...\corpus\oracle\SOM-LAR.json
  OK   BED-HL         cells:  9852 review:36 -> ...\corpus\oracle\BED-HL.json
  OK   BED-SUB        cells:  9736 review:40 -> ...\corpus\oracle\BED-SUB.json
  OK   AYAD-HL        cells:  3385  -> ...\corpus\oracle\AYAD-HL.json
  FAIL REF-PIERCAP-1  File is password-protected
  FAIL REF-PIERCAP-2  File is password-protected
  FAIL REF-FOOTING    File is password-protected
emit-oracle: 3 failure(s)
emit-oracle: 5/8 emitted, 37882 cells, 4 workbooks flagged for review
EXIT=1
```

`5/8` workbooks emitted; the 3 failures are a **real source finding** (`D-18`), not a
toolchain failure: those three workbooks are password-protected and the protection is **not**
bypassed. The reader itself works — it decoded 37,882 cells across 5 workbooks: 4 BIFF8
`.xls` containers via the frozen `readXlsMatrix(abs, sheetJsXlsDecoder)` path, plus the single
OOXML `.xlsx` (`BED-SUB`).

### 4.3 Non-vacuity proof — RED → GREEN → RED (`tmp/gate-oracle-proof.mjs`)

A gate that only ever passes (or only ever fails) could be vacuous. To prove it can
distinguish a complete freeze from an incomplete one — and from provenance drift — a scratch
harness builds a synthetic corpus + oracle under `tmp/gop/`, **copies the real gate script**
(the gate resolves `repo = <dir>/../..`, so it must run from a synthetic tree), and drives
three phases. Raw output of this run:

```
PHASE 1 no source cells (incomplete freeze expected)
  exit=1
  GATE gate-oracle: FAIL 206 assertions
PHASE 2 source cells present (complete freeze expected)
  exit=0
  GATE gate-oracle: PASS 206 assertions
PHASE 3 one corpus byte flipped (provenance expected)
  exit=1
  GATE gate-oracle: FAIL 206 assertions
proof scratch cleaned: true
```

- **Phase 1** (no source cells) → RED: the freeze is incomplete, as designed.
- **Phase 2** (cells present, 48+ values) → GREEN: the same gate passes a complete freeze.
- **Phase 3** (one corpus byte flipped) → RED: the hash check catches provenance drift.

The harness lives in `tmp/` (gitignored) and removes its scratch tree on completion, so it
never touches tracked data.

### 4.4 Full gate chain — NOT RUN

`gate:full` and the `npm run` script chain were **not exercised** this session. The `pnpm`
shim is broken (`Cannot find module '…corepack/dist/pnpm.js'`), so the script chain could not
be driven; only direct `node <script>` invocations were run.

Correction to the earlier "`.ts` needs `tsx`" framing: Node 26 native type-stripping **does**
execute `.ts` directly — `emit-oracle.ts` ran (§4.2) — but only when its relative imports are
extension-qualified. Gates that import extensionless (e.g. `gate-hygiene.ts` →
`import … from './_lib'`) still fail under plain `node` with
`ERR_MODULE_NOT_FOUND: Cannot find module '…/scripts/gates/_lib'` and require `tsx`, which is
absent here. Plain-node `.mjs` gates do run: this session `gate-docs.mjs` → `PASS 5 assertions`.
So the limitation is per-file (extension-qualified vs extensionless imports), not "all `.ts`".

### 4.5 T2A.7 — `#ERR` tolerance, GREEN + non-vacuity (this run)

`node --test tests/integration/xls-error-cells.test.ts`:

```
▶ T2A.7 — matrixFromDecoded tolerates #ERR:Ref / #ERR:Name
  ✔ keeps the partial row, records the literal and raises REVIEW (never throws)
▶ T2A.7 — decoder classifies the #ERR:Ref / #ERR:Name text tokens
  ✔ turns a text cell carrying #ERR:Ref or #ERR:Name into kind "error"
▶ T2A.7 — real Bedach workbook reads without throwing
  ✔ loadsumm and Deck Anchorage keep error rows and flag REVIEW
ℹ tests 3 / ℹ suites 3 / ℹ pass 3 / ℹ fail 0
EXIT=0
```

The three layers, in the order the test proves them:

1. **`matrixFromDecoded` (dependency-free)** — an in-memory sheet whose row 2 carries
   `#ERR:Ref` (cell A) and `#ERR:Name` (cell C) is handed to the matrix builder. The row is
   **kept whole** (`row 2`, `cells.length 3`), the good value between the two errors survives,
   `sheet.hasErrors === true`, `review.flag === true`, and `review.errorCells` names
   `loadsumm!A2` and `loadsumm!C2`. A trailing blank row is still dropped, so the error row
   keeps its 1-based number rather than being shifted. **No exception is thrown.**
2. **`sheetJsXlsDecoder`** — a `#ERR:Ref` / `#ERR:Name` **text** cell is classified as
   `kind: "error"`. The corpus carries no textual `#ERR:` token (a grep over
   `corpus/oracle/**` returns nothing), so this branch is exercised with an in-memory
   workbook written through SheetJS, not claimed against the corpus.
3. **`readXlsMatrix` over the real Bedach workbook** (`corpus/raw/BED-HL/plus Stability
   Analysis HIGH LEVEL BRIDGE - BEDACH.xls`) — reads **without throwing**; `review.flag ===
   true`; the `Deck Anchorage` sheet is found with `hasErrors === true` and retained error
   rows; the trimmed `loadsumm ` sheet is found with `hasErrors === true`; both are named in
   `review.errorCells`; `sha256.length === 64` and `sourcePath` is the real absolute path.

**Non-vacuity (RED scratch, gitignored `tmp/xls-error-red.test.ts`)** — two deliberately-wrong
assertions (the error row *should* be dropped; the real workbook *should not* be flagged):

```
✖ RED: expects the error row to be DROPPED (wrong — must fail)
  AssertionError: WRONG: error row should have been dropped   2 !== 1
✖ RED: expects the real workbook NOT to be flagged (wrong — must fail)
  AssertionError: WRONG: workbook carries error cells         true !== false
ℹ tests 2 / ℹ pass 0 / ℹ fail 2
EXIT=1
```

Both wrong expectations failed (`actual 2, expected 1` and `actual true, expected false`),
so the GREEN assertions in `tests/integration/xls-error-cells.test.ts` are **not vacuous**.
The scratch file removes nothing and is discarded after the proof.

## 5. Superseded fixtures — explicit before/after

The two wrong fixtures are named in `GOLDEN-ORACLE.json` `superseded[]` and in
`archive/MANIFEST.md`. They still exist **in place**; the `git mv` into
`corpus/superseded/` is held (archive-never-delete; not a "suitable time" yet).
Measured facts for both bodies as they stand:

| Fixture | Bytes | sha256 (measured) | Why superseded |
|---|---|---|---|
| `scripts/fixtures/kherwara-hydraulics-snapshot.json` | 477 | `3c132012c7018034baf0094d34e4b7ffe394f22877e1793b07de2b272afcbf45` | `crossSectionalArea` **141.5** vs oracle **490.30**; `discharge` **243.11** vs oracle **899.93** |
| `scripts/fixtures/high-level-hydraulics-snapshot.json` | 475 | `c3c4e93de79d92432075a97cbdaea255d2e5f691752eb9fb011cfebe27449e55` | `designWaterLevel` **287.25** matches no uploaded workbook |

Before / after (measured):

| Quantity | Fixture (before) | Oracle (after) | Delta |
|---|---|---|---|
| kherwara `crossSectionalArea` | 141.49999999999977 | 490.300 | +248.8 |
| kherwara `discharge` | 243.10970926711096 | 899.930 | +656.8 |
| high-level `designWaterLevel` | 287.24671557437733 | — (no matching workbook) | n/a |

`corpus/superseded/` **does not exist yet** — created by the held `git mv` (T2A.8).
The replacement fixtures must be named by bridge code (`SOM-KHW`, `BED-HL`, …), not
by vague label; neither the old names nor the new tree are in place yet.

## 6. Source-defect register — honesty note

`docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md` carries D-01..D-14 plus D-15..D-18
and a tooling defect T-01 (`lib/**` may not import `xlsx`, yet T2A.2 asks for the
reader in `lib/**` — resolved by the injected decoder port, gate kept strict). **D-18**
records the password-protected corpus found by the T2A.3 run (§4.2).

The enumerating source `CODE-JUNCTION/VENICE-GUIDE.MD §F5` is **absent** from this
checkout, so D-01..D-14 were reconstructed from secondary references
(`specs/E-01…E-12`, `week-{03,06A,07A,09A}/AGENT-INSTRUCTIONS.md`). **D-13 could not
be enumerated from any surviving reference** (its only appearance is `week-06A §0`
listing "D-01..D-03, D-13, D-14"); it is recorded as a provenance gap and **not
guessed**. No sign-off is claimed — the register is DRAFT.

## 7. Artifacts produced (sha256 measured)

| Path | sha256 | Bytes |
|---|---|---|
| docs/phase-2/week-02A/ORACLE-TABLE.md | `35cc28078e938537f62bb5ee99566516d5f0706bfb954b27b580cf2ed93484c6` | 11897 |
| docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md | `4d4ea7e4c610262011554c4ee61e9cc4f0c5cef05248b753a4ef05513da35c24` | 16421 |
| docs/phase-2/week-02A/XLS-STRATEGY.md | `c6b1ccbabd405b3b2a985cf86a287d6168dfbd3e639e143afcfeebbed800dde5` | 11131 |
| scripts/gates/gate-oracle.mjs | `87c0cceeaa3528e41f3e2c1dbfa5202358eb6a59670f09bbe31065f124b18486` | 9386 |
| corpus/oracle/GOLDEN-ORACLE.json | `d891c948e645dd3ce6fa636a1a51591d70b6573d9e1ab49c2c39249eca9fd092` | 8675 |
| corpus/raw/manifest.json | `18e902e2346e879b9a3765e1c3bcf32098d6469cf4be641b60fcce3d68aa8818` | 5168 |
| lib/engine/src/io/xls.ts | `232feca3132227d6e78b8fb17b0ae921711695a9baa27f15db6947da1fb5465a` | 10032 |
| scripts/assimilate/emit-oracle.ts | `f39dd82e30587516c312e0d51587fa54bdd66a87559e8c87f12ad96a4814f6fe` | 9862 |
| scripts/assimilate/sheetjs-xls-decoder.ts | `0bcc9af66066e86201e70f39658a03177d19122c867ae2fb51387c87b83c3cf7` | 3591 |
| tests/integration/xls-error-cells.test.ts | `9ab7d1357b80a1891fc64524d9d8efa97c76519b592d8f6985403fa2092243ab` | 5297 |

## 8. Deviations

| Item | Expected | Actual | Reason | Registered where |
|---|---|---|---|---|
| `corpus/oracle/<bridge>.json` | 8 per-bridge oracle files from T2A.3 | **5 produced** | 3 workbooks (`REF-PIERCAP-1`, `REF-PIERCAP-2`, `REF-FOOTING`) are password-protected; `emit-oracle.ts` reports `File is password-protected` and emits no oracle for them (protection **not** bypassed) | `SOURCE-DEFECT-REGISTER.md` **D-18**; §4.2 |
| `GOLDEN-ORACLE.json` size | 48+ values with cells | **55 values, every entry with a cell** (v1.1.0) | Met from T2A.3 output; no values invented | §3; `ORACLE-TABLE.md` §3 |
| Oracle scope | all bridge quantities | **3 of 5 emitted bridges frozen** (SOM-KHW, SOM-LAR, BED-HL) | `BED-SUB` and `AYAD-HL` emitted but carry no E-spec oracle targets; `REF-*` unreadable (D-18) | §3; `ORACLE-TABLE.md` §4 |
| T2A.7 textual `#ERR:` | exercised against the corpus | **synthetic only** | the corpus carries genuine BIFF error cells (`#REF!`/`#VALUE!`) but **no** `#ERR:Ref`/`#ERR:Name` text token; that branch is covered by an in-memory workbook rather than claimed against the corpus | this file §4.5 layer 2 |
| T2A.8 `git mv` | fixtures moved to `corpus/superseded/` | declared, **held in place** | Archive-never-delete; hold until W00–W12A close | `archive/MANIFEST.md`; this file §5 |
| D-01..D-14 source | `VENICE-GUIDE.MD §F5` | file absent from checkout | reconstructed from secondary refs; D-13 flagged undeterminable | `SOURCE-DEFECT-REGISTER.md` provenance note |
| Full gate chain | `gate:full` | **NOT RUN** | broken `pnpm` shim; only direct `node` invocations were run | §4.4 |
| Gate verdicts | committed tree | working tree (dirty) | files not committed at close-out | escape E-008 |

## 9. Declarations

- [x] No test or tolerance was weakened to make `gate:oracle` pass. The gate is now GREEN on a
      **completed** freeze (55 values, every entry with a cell); `ROUNDED` (1e-4) was explicitly
      **not** widened past SD-02's 2.30e-4 (`ORACLE-TABLE.md` §1).
- [x] No value was invented. Every oracle value was extracted from a source workbook and
      carries its `(sheet, cell)`; the 3 unreadable workbooks were **left out and registered**
      (D-18) rather than filled with guesses. D-13 is recorded as a gap, not a guess.
- [x] The password protection on the 3 `REF-*` workbooks was **not** bypassed.
- [x] The `#ERR` tolerance is **test-proven**, not asserted: `tests/integration/xls-error-cells.test.ts`
      passes 3/3 and a RED scratch run fails 2/2 on the deliberately-wrong expectations, so the
      GREEN assertions are non-vacuous. The textual-token branch is covered synthetically because
      the corpus carries no `#ERR:` token — that is stated, not hidden (§4.5, §8).
- [x] No source workbook was edited in place. All 8 copies re-hash to their manifest
      digests on this run.
- [x] No file was deleted. Everything retired is declared in `archive/MANIFEST.md`;
      the moves are held.
- [ ] Verifier (Antigravity) sign-off. **W02A deliverables are DRAFT until a licensed
      engineer records name, date and registration number.**
