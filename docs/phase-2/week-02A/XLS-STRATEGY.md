# XLS-STRATEGY — the `.xls` (BIFF8) reading decision

P2-W02A T2A.2 · Status: **DRAFT** (runtime proof deferred, see §7) · Owner: Devin
Prerequisite deliverable for P2-W04 T4.1 (cross-referenced from `week-04/AGENT-INSTRUCTIONS.md`).

## 1. The problem (finding F2)

The entire legacy corpus is BIFF8 `.xls`: 7 of the 8 frozen workbooks in
[corpus/raw/manifest.json](file:///c:/Users/Rajkumar/Bridge_Slab_Design/corpus/raw/manifest.json)
are `format: "biff8"`; only `BED-SUB` is OOXML `.xlsx`. The oracle and every parity gate
in Phase 2 must read those bytes, so the reader is on the critical path of the whole
phase.

Three facts constrain the choice:

1. **ExcelJS cannot open BIFF8.** The comment block in
   [check-audit-threshold.mjs](file:///c:/Users/Rajkumar/Bridge_Slab_Design/scripts/check-audit-threshold.mjs#L54-L66)
   records this: SheetJS *"is the only reader in this tree that opens the .xls files"*.
2. **`xlsx` is a security exception.** SheetJS npm releases stop at 0.18.5 and carry
   unpatched prototype-pollution / ReDoS advisories, so the package is an `ACCEPTED_HIGH`
   entry with an `owner` and a `reviewBy` date, and its **import is confined to
   `scripts/**`** — `audit:policy` fails if `server/`, `client/src/`, `bridge-excel-generator/`,
   `pipeline/`, **`lib/`**, `artifacts/`, `api/` or `shared/` import it.
3. **P2-W04 T4.1 must move the `.xlsx` path off `xlsx` without losing `.xls`.** T4.1's hard
   requirement is that BIFF8 capability survives, because the corpus is `.xls`.

## 2. Decision

> **Keep the pinned SheetJS decoder for the `.xls` (BIFF8) path only — the sanctioned
> "keep xlsx for .xls only" option — but split the reader so the `xlsx` import never
> crosses into `lib/`.**

- [lib/engine/src/io/xls.ts](file:///c:/Users/Rajkumar/Bridge_Slab_Design/lib/engine/src/io/xls.ts)
  is the **dependency-free matrix layer**: it reads the bytes, rejects LFS pointer stubs,
  asserts the OLE2/CFB (BIFF8) container, computes the source sha256, restores A1
  addresses, and applies the error-cell → REVIEW semantics. It imports **no third-party
  package** and therefore cannot violate rule 2 above.
- The record decode is injected through the `XlsDecoderPort` interface. The pinned SheetJS
  implementation is [scripts/assimilate/sheetjs-xls-decoder.ts](file:///c:/Users/Rajkumar/Bridge_Slab_Design/scripts/assimilate/sheetjs-xls-decoder.ts),
  which lives under `scripts/**` — the one directory `audit:policy` allows `xlsx` in.
- `@workspace/engine` exposes the layer as the subpath export `@workspace/engine/io/xls`
  (see [lib/engine/package.json](file:///c:/Users/Rajkumar/Bridge_Slab_Design/lib/engine/package.json)).

Data flow:

```
corpus/raw/<CODE>/<file>.xls
  └─ readXlsMatrix(path, sheetJsXlsDecoder)          lib/engine/src/io/xls.ts   (no deps)
       ├─ assertNotLfsPointer / assertBiff8          → named error, never a silent pass
       ├─ sha256(bytes)                              → source provenance on every matrix
       └─ decoder.decode(bytes)                      scripts/…/sheetjs-xls-decoder.ts (xlsx)
            └─ matrixFromDecoded(...)                → XlsWorkbookMatrix { sheets, review }
```

## 3. Options considered and rejected

| Option | Verdict | Reason |
| --- | --- | --- |
| **A. Pure-TS BIFF8 parser inside `lib/`** | Deferred, not chosen now | Zero deps and fully W04-proof, but a correct BIFF8 reader must handle the OLE2/CFB directory, `SST` + `CONTINUE` fragmentation, `RK`/`MULRK` encodings, shared formulas and the various `*STRING` records. That is a large, high-risk surface to land inside an assimilation week, and a subtly wrong reader would corrupt the oracle silently. Revisit in W04 if `xlsx` is removed outright (see §6 option b). |
| **B. Import `xlsx` directly in `lib/engine/src/io/xls.ts`** | **Rejected** | Fails `audit:policy` (`lib/` is a scanned directory in `IMPORT_RULES`). This is the literal reading of "*keep xlsx for .xls only*", and it collides with a hard gate — see §5. |
| **C. ExcelJS everywhere** | **Rejected** | ExcelJS cannot open BIFF8 at all. It is only usable for the single `.xlsx` workbook (`BED-SUB`). |
| **D. Controlled conversion step** (pre-convert each `.xls` to `.xlsx`, keep originals) | Not chosen for W02A | Adds a derivative artefact layer and a second thing to hash/verify; the W02A hard constraint is that originals are immutable and every value carries the *source* sha256. Kept as the W04/T4.1 fallback (option a in §6). |
| **E. Injected decoder port (chosen)** | **Chosen** | Satisfies rules 1–3 simultaneously: BIFF8 reads stay on the pinned SheetJS, `lib/` stays dependency-free, and W04 can replace the decoder without touching the matrix contract. |

## 4. Guarantees the layer provides

- **Container proof.** `assertBiff8()` returns only for the OLE2/CFB magic
  `D0 CF 11 E0 A1 B1 1A E1`. A ZIP (`PK\x03\x04`) is rejected by name as *"OOXML (.xlsx),
  not BIFF8"*, and an LFS stub is rejected with the `git lfs pull --include=…` fix.
- **Provenance.** Every matrix carries `sha256` of the exact bytes read, matching the
  `sha256` frozen in `corpus/raw/manifest.json`, plus per-cell `row`, `col` and A1 `address`.
- **Positional cells.** `RawCell` indices are zero-based absolute (row, col), so a cell's
  A1 address is reconstructed exactly; interior gaps stay as `kind: "blank"` and fully
  blank rows / trailing blank columns are trimmed.
- **Error cells never throw (T2A.7).** A failed formula or an unresolved-reference text
  cell becomes `kind: "error"` with its source text preserved in `value` and its literal in
  `errorCode`. `matrixFromDecoded()` keeps the partial row, lists every offending
  `<sheet>!<A1>` in `review.errorCells`, and sets `review.flag = true` with a reason. No
  exception propagates.
- **No `.xlsx` code path here.** `.xlsx` is out of scope for this module by construction,
  which is what lets W04 migrate it independently (§6).

## 5. Conflict discovered while choosing (record as a source/tooling defect)

T2A.2's instruction offers "*keep xlsx for `.xls` only*" **or** "*add a pinned converter*"
and asks for the reader to live at `lib/engine/src/io/xls.ts`. Neither the instruction nor
`week-04/AGENT-INSTRUCTIONS.md` notes that `scripts/check-audit-threshold.mjs`
`IMPORT_RULES` already **forbids `lib/**` from importing `xlsx`**. Taken literally,
"keep xlsx for `.xls` only" is unsatisfiable at that path.

Resolution taken here: **option E** — the pinned decoder is kept, but its import stays in
`scripts/**`, and `lib/` owns only the dependency-free layer. The security gate is **not**
weakened (no `allowedDirs` were widened). This is surfaced, not silently worked around, and
is queued for `SOURCE-DEFECT-REGISTER.md` (T2A.5) as a strategy/tooling defect.

## 6. Interaction with P2-W04 T4.1 (required cross-reference)

T4.1 migrates the **`.xlsx`** path off `xlsx@0.18.5` and states the hard requirement that
**`.xls` (BIFF8) capability must survive**. Under this strategy:

- **W04 must not delete or rewrite** [lib/engine/src/io/xls.ts](file:///c:/Users/Rajkumar/Bridge_Slab_Design/lib/engine/src/io/xls.ts)
  — it is the frozen `.xls` contract, and `XlsWorkbookMatrix` is what T4.12 fuzzes.
- **W04 has two acceptable moves for the decoder:**
  - **(a) Keep the pinned SheetJS decoder** for `.xls` only. Then T4.1/T4.9's requirement
    applies: the `ACCEPTED_HIGH` `xlsx` entry in
    [check-audit-threshold.mjs](file:///c:/Users/Rajkumar/Bridge_Slab_Design/scripts/check-audit-threshold.mjs#L54-L66)
    must keep an explicit `owner` and `reviewBy` (expiry) — it already carries
    `owner: RAJKUMAR SINGH CHAUHAN`, `reviewBy: 2027-01-31`. The exception must **not** be
    removed while the decoder is the only BIFF8 reader available.
  - **(b) Replace the decoder** with a controlled converter or a dependency-free BIFF8
    parser. Then §3 option A becomes real work; only
    [scripts/assimilate/sheetjs-xls-decoder.ts](file:///c:/Users/Rajkumar/Bridge_Slab_Design/scripts/assimilate/sheetjs-xls-decoder.ts)
    is swapped. `lib/engine/src/io/xls.ts` and the matrix contract are unchanged.
- **In both moves the `.xlsx` migration must not route through this module.** A `.xlsx`
  reaching `readXlsMatrix()` fails `assertBiff8()` by design.
- **T4.12 fuzz obligations** (all 8 corpus workbooks, including the `#ERR:Ref` / `#ERR:Name`
  sheets): assert **no exception**, **partial row returned**, **REVIEW flag raised**, and
  **source cell preserved**. Every one of those is a guarantee of §4 and is exercised
  through the matrix, independent of which decoder W04 settles on.

## 7. Verification status

**Runtime-proven (T2A.3).** The reader has been **executed** in this worktree:
`node scripts/assimilate/emit-oracle.ts` decoded 5 of the 8 corpus workbooks (37,882 cells) —
4 BIFF8 `.xls` through the frozen `readXlsMatrix(abs, sheetJsXlsDecoder)` path, plus the single
OOXML `.xlsx` (`BED-SUB`) — under Node 26 native type-stripping, with no `tsx`. The 3 remaining
workbooks are password-protected (**D-18** in
[SOURCE-DEFECT-REGISTER.md](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md)),
which is a source limit, not a toolchain limit.

**T2A.7 is closed (test-proven).** [tests/integration/xls-error-cells.test.ts](file:///c:/Users/Rajkumar/Bridge_Slab_Design/tests/integration/xls-error-cells.test.ts)
passes 3/3 (`node:test`, `exit 0`) across all three layers: the dependency-free `matrixFromDecoded`
keeps a `#ERR:Ref` / `#ERR:Name` partial row whole and flags REVIEW without throwing; the decoder
classifies a textual token as `kind: "error"`; and the real Bedach workbook (`loadsumm ` +
`Deck Anchorage`) reads without throwing and names its error cells in `review.errorCells`. A RED
scratch run fails 2/2 on deliberately-wrong expectations, proving the GREEN assertions are
non-vacuous (`EXIT-GATE-EVIDENCE.md` §4.5). The corpus carries genuine BIFF error cells
(`#REF!`/`#VALUE!`) but **no** textual `#ERR:` token, so that branch is exercised with an in-memory
workbook rather than claimed against the corpus.

Still **deferred**: the T4.12 fuzz obligations over **all 8** workbooks (including the
`#ERR:Ref` / `#ERR:Name` sheets) and the explicit rejected-`.xlsx` / rejected-LFS-stub runtime
assertions have not been executed. Those carry the existing containment escape
**E-008 (`GREEN_ONLY_IN_DIRTY_TREE`)**.

## 8. Honest residual risks

- The pinned SheetJS build (0.20.3, CDN tarball) still carries the unpatched advisories;
  the mitigation remains *containment* (import confined to `scripts/**`), not patching.
- `assertBiff8()` proves the container, not the record stream. A corrupt-but-OLE2 file
  reaches the decoder; that path is what T2A.7/T4.12 exist to keep non-fatal.
- `LfsPointerError` / `assertNotLfsPointer` are deliberately duplicated from
  [scripts/read-office-workbook.ts](file:///c:/Users/Rajkumar/Bridge_Slab_Design/scripts/read-office-workbook.ts)
  because `lib/` cannot import from `scripts/` across the package boundary; the two
  implementations must be kept in step.
