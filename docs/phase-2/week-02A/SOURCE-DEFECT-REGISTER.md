# SOURCE DEFECT REGISTER — P2-W02A (D-series)

P2-W02A T2A.5 · Status: **DRAFT** · Owner: Devin · Verifier: Antigravity

Rule: a source value is never silently "fixed". It is registered, then a reviewed
decision chooses the app behaviour.

> **This is the D-series register (source/method defects).** It is a different file from
> [docs/phase-2/SOURCE-DEFECT-REGISTER.md](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/SOURCE-DEFECT-REGISTER.md),
> which is the **SD-series parity register** (`SD-01…SD-03`) read mechanically by
> `gate:parity` through `[<CODE>/<QUANTITY>]` tokens. Where a week instruction says
> "`SOURCE-DEFECT-REGISTER.md` **D-01..D-14**" it means *this* file; where it says
> "`SOURCE-DEFECT-REGISTER.md` SD-nn" it means the parity file. Both are referenced
> below by full path to avoid ambiguity (ADR-0012).

## Provenance of this list — read this before trusting an ID

The enumerating source for D-01..D-14 is **`CODE-JUNCTION/VENICE-GUIDE.MD` §F5**
(cited verbatim in
[CERTIFICATION-CODE-JUNCTION.md §29 F5](file:///c:/Users/Rajkumar/Bridge_Slab_Design/CERTIFICATION-CODE-JUNCTION.md#L484-L484):
*"14 source defects — transverse/longitudinal moment sharing, copy-paste scour width,
Bedach DPR total mismatch"*).

**`VENICE-GUIDE.MD` is not present in this checkout** (`git log -- CODE-JUNCTION/VENICE-GUIDE.MD`
exits 128; the file is absent from the tree and from `CODE-JUNCTION/`, which today holds
only `VENICE IS GURU.txt`). D-01..D-14 therefore **cannot be enumerated from their source**.
Each row below is reconstructed from the surviving secondary references — the
`docs/phase-2/specs/E-01…E-12` files and the `week-03 / week-06A / week-07A / week-09A`
instruction files — and every row states which reference it rests on. Where the references
do not pin a row down, the row says so rather than guessing. **D-13 is unresolved**.

The `Evidence` column names the **file and sheet** where it is known. The extractor
[`scripts/assimilate/emit-oracle.ts`](file:///c:/Users/Rajkumar/Bridge_Slab_Design/scripts/assimilate/emit-oracle.ts)
(T2A.3) has since been **run** and emitted the per-bridge oracle files; the source **cell**
for every *frozen quantity* is recorded in
[GOLDEN-ORACLE.json](file:///c:/Users/Rajkumar/Bridge_Slab_Design/corpus/oracle/GOLDEN-ORACLE.json)
(T2A.4). The per-row `cell not yet pinned` markers below are the **owning week's** to fill —
this register is a defect list, not an oracle — and §5 records the measured T2A.3/T2A.4
result, including its two findings. See [XLS-STRATEGY.md §7](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/XLS-STRATEGY.md#L121-L129)
for the reader design that made the extraction possible.

## Register

| ID | Defect | Evidence (file / sheet / cell) | Required app behaviour | Decision | Owner | Status |
|---|---|---|---|---|---|---|
| D-01 | Afflux: the **section area** and the **waterway area** are conflated. The source builds `a` from `A_waterway` (94.8 × 5 = 474.000 for SOM-KHW) while the cross-section area `A_section` is 490.300 — two different quantities under one symbol. | `week-06A/AGENT-INSTRUCTIONS.md` T6A.3; `specs/E-02-afflux.md` §"Two areas"; sheet `afflux calc`; cell not yet pinned | Keep `A_section` and `A_waterway`/`A_unobstructed` as **separate named quantities**; a reviewed flag selects which feeds `a`; never silently substitute one for the other. | **CORRECT** | Devin (W06A T6A.3) | OPEN |
| D-02 | A **constant is reused** across sections where it is not valid for the local section (reuse of a value derived for a different geometry). | `week-03/AGENT-INSTRUCTIONS.md` T3.10 (*"warn when a reused constant is inconsistent with the local section"*); workbook/sheet/cell not yet pinned | **WARN** when a reused constant is inconsistent with the local section; never reuse silently. | **WARN** | Devin (W03 T3.10) | OPEN |
| D-03 | Scour: **copy-paste waterway width**. The waterway base is `94.8` in both files, though Larathi's section is 115 m and its waterway 88 m — one bridge's base was pasted onto another. (F5: *"copy-paste scour width"*.) | `specs/E-03-scour.md` §Defects; `CERTIFICATION-CODE-JUNCTION.md` §29 F5; scour sheet of the stability workbook; cell not yet pinned | One **authoritative waterway** per bridge; `Db` derives from it; warn on inconsistent reuse across files. | **CORRECT** (authoritative field + reuse warn) | Devin (W06A T6A.5) | OPEN |
| D-04 | Water current: the source **reuses the longitudinal force** when computing transverse moments, in **both** submersible files — the transverse moment is bound to the wrong force. (F5: *"transverse/longitudinal moment sharing"*.) | `specs/E-05-water-current.md` §CRITICAL; `week-06A/AGENT-INSTRUCTIONS.md` T6A.7; sheet `STABILITY CHECK PIER` / water-current block; cell not yet pinned | Separate **longitudinal and transverse force variables** per direction; test that `Mx ≠ My` unless the geometry is genuinely symmetric. | **CORRECT** | Devin (W06A T6A.7) | OPEN |
| D-05 | Wind: **force-to-moment binding** is wrong — the reproduced pressure set (85.373 / 74.7855 / 79.7355 kg/m²) is bound to the wrong moment arm. | `week-07A/AGENT-INSTRUCTIONS.md` T7A.13; sheet wind / pier stability; cell not yet pinned | Wind pressure as a function of height (IRC:6 cl.212.3), with each pressure bound to **its own** moment — no shared/reused force. | **CORRECT** | Devin (W07A T7A.13) | OPEN |
| D-06 | A cell with **non-zero area yields a zero force** — a silently dropped load. | `specs/E-05-water-current.md` §Defects; `week-03/AGENT-INSTRUCTIONS.md` T3.10 (*"flag when a nonzero area yields a zero force"*); cell not yet pinned | When `area > 0` but the computed force is `0`, raise **REVIEW**. | **WARN** (REVIEW) | Devin (W03 T3.10) | OPEN |
| D-07 | Live load: the source uses **82.5 T**, which matches **no** vehicle in the registry. | `specs/E-09-pier-cap-rebar.md` §Defect; `specs/E-10-live-load-matrix.md` §Defects; `week-07A/AGENT-INSTRUCTIONS.md` T7A.4; sheet `LLOAD`; cell not yet pinned | **REJECT** any load that matches no registry entry (registry: 70R(W) 100 T, 70R(T) 70 T, AA tracked 70 T, AA wheeled 2×20 T, Class A). | **REJECT** | Devin (W07A T7A.4) | OPEN |
| D-08 | BOQ: a **zero-valued charge line** (a charge-stack row that evaluates to 0) passes unnoticed. | `specs/E-12-boq-dpr.md` §Defects; `week-09A/AGENT-INSTRUCTIONS.md` T9A.3; sheets `Abstract` / `General Abs.`; cell not yet pinned | Flag zero-valued charge lines as **suspect**; never silently accept a zero charge. | **WARN** | Devin (W09A T9A.3) | OPEN |
| D-09 | DPR: the **cost total is typed, not computed**, and disagrees with the BOQ — the Bedach DPR states **Rs.987.60 Lacs** against its own abstract of **Rs.1264.83 Lacs**. (F5: *"Bedach DPR total mismatch"*.) | `specs/E-12-boq-dpr.md` §Defects; `CERTIFICATION-CODE-JUNCTION.md` §29 F5; sheets `Tech Report` / `General Abs.`; cell not yet pinned | The DPR cost line is **computed from the BOQ** and **fails on mismatch**; no hardcoded total. | **CORRECT** | Devin (W09A T9A.6) | OPEN |
| D-10 | Pier stability: **buoyancy is a magic ratio** rather than a fraction of `gammaW` with a printed derivation. | `specs/E-06-pier-stability.md` §Buoyancy (D-10); `week-07A/AGENT-INSTRUCTIONS.md` T7A.2; sheet `STABILITY CHECK PIER`; cell not yet pinned | `gamma_eff = 24 − f·10` (f = 0.15 pier → 22.5; f = 1.0 footing → 14); emit **both** with- and without-buoyancy branches with the derivation printed. | **CORRECT** | Devin (W07A T7A.2) | OPEN |
| D-11 | Foundation: only **one permissible-stress criterion** is carried instead of the dual (soil vs rock) criteria the source implies. | `specs/E-06-pier-stability.md` §Stress (*"[D-11: both carried]"*); `week-03/AGENT-INSTRUCTIONS.md` T3.10; sheet `STABILITY CHECK PIER`; cell not yet pinned | Carry **both** permissible-stress criteria (250 kN/m² soil; 8000 / −3600 kN/m² rock) and **state which governs**. | **CORRECT** | Devin (W03 T3.10) | OPEN |
| D-12 | The **code basis predates the current IRC edition** (seismic branch based on a superseded IRC:6 edition). | `week-07A/AGENT-INSTRUCTIONS.md` T7A.14 (*"emitted as REVIEW when the code basis predates IRC:6-2017"*); `week-03/AGENT-INSTRUCTIONS.md` T3.11; cell not yet pinned | Emit **REVIEW** for any item whose code basis predates the current edition; REVIEW appears in the report and **blocks** a REVIEWED transition. | **WARN** (REVIEW) | Devin (W03 T3.11 / W07A T7A.14) | OPEN |
| D-13 | **UNRESOLVED — not enumerable from the surviving sources.** The only reference is `week-06A/AGENT-INSTRUCTIONS.md` §0: *"SOURCE-DEFECT-REGISTER.md (D-01..D-03, D-13, D-14)"*, grouping D-13 with the hydraulics/scour set. No spec, task, or code states what it is; `VENICE-GUIDE.MD §F5` is absent. | `week-06A/AGENT-INSTRUCTIONS.md` §0 (the sole reference); no other match in the tree | **TBD** — do not guess. Likely a hydraulics/scour row (candidates: the duplicate-`Q`-in-one-workbook case recorded as **D-17** in `specs/E-01-hydraulics.md`, or the `deriveBedSlope` / rugosity-provenance defect). To be resolved by recovering `VENICE-GUIDE.MD §F5`. | **TBD** | unassigned (W06A theme) | OPEN — **provenance gap** |
| D-14 | **Legacy unit mixing**: a single sheet mixes T, kN, kg/cm² and N/mm²; the app can inherit the wrong unit silently. | `specs/E-01-hydraulics.md` §Defects; `week-06A/AGENT-INSTRUCTIONS.md` T6A.12; `docs/phase-2/govt/G-02-unit-systems.md` L3; cell not yet pinned | Accept legacy units at the **boundary** and normalise to SI with a printed **conversion trace**; never assume a unit. | **CORRECT** | Devin (W06A T6A.12) | OPEN |

`Decision` values are the four the template allows: **COPY / CORRECT / WARN / REJECT**
(a `REVIEW`-flagging requirement is recorded as `WARN (REVIEW)`).

## Beyond D-01..D-14 (every further source defect found)

T2A.5 §9 requires every source defect found *beyond* D-01..D-14 to be listed. The specs
enumerate three more D-series ids and one tooling/strategy defect:

| ID | Defect | Evidence | Required app behaviour | Decision | Owner | Status |
|---|---|---|---|---|---|---|
| D-15 | Abutment `Ka`: the source's stated basis (Θ=90°, Φ=35°, δ=0°, z=17.5) yields **Ka = 0.496**, while textbook Rankine **and** Coulomb with those exact angles give **0.271** — a 1.83× gap. The source is internally consistent at 0.496 (0.5·18·6.15²·0.496 = 168.83 kN matches its earth-pressure line). | `specs/E-07-abutment-dirt-wall.md` §Ka; `docs/adr/README.md` L38; `docs/phase-2/govt/G-07-engine-versioning.md` (*"D-15 unresolved: source 0.496 vs textbook 0.271"*) | Implement the **general Coulomb form**; assert the engine returns **0.496** for parity; register D-15; **do NOT** silently change to 0.271. | **WARN** (carry source value + REVIEW) | Devin (W07A T7A.8) | OPEN |
| D-16 | Live load: the source quotes **Class A train as 55.4 T**, which must be reconciled against the IRC:6 Annex before use. | `specs/E-10-live-load-matrix.md` §Defects | Reconcile against the IRC:6 Annex; carry as a registry entry only once reconciled. | **TBD** | Devin (W07A T7A.4) | OPEN |
| D-17 | Hydraulics: **two different `Q` values in one workbook**; the discrepancy must surface as REVIEW rather than one silently winning. | `specs/E-01-hydraulics.md` §Defects | Emit **REVIEW** when a workbook carries two disagreeing `Q`. | **WARN** (REVIEW) | Devin (W06A) | OPEN |
| D-18 | Corpus access: **3 of the 8 frozen workbooks are password-protected** (`REF-PIERCAP-1`, `REF-PIERCAP-2`, `REF-FOOTING`). `emit-oracle.ts` cannot read them — it reports `File is password-protected` and emits **no** oracle for the bridge. | terminal of T2A.3 run; [EXIT-GATE-EVIDENCE.md §5](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/EXIT-GATE-EVIDENCE.md) | Do **not** bypass the protection. Take a password at the **boundary** (or exclude the workbook by a reviewed, recorded decision) and flag the workbook **REVIEW**; never emit a partial oracle silently. | **TBD** | Devin (W02A T2A.3) | OPEN |
| T-01 | **Strategy/tooling defect.** T2A.2 places the BIFF8 reader at `lib/engine/src/io/xls.ts` and offers *"keep xlsx for .xls only"*, but `scripts/check-audit-threshold.mjs` `IMPORT_RULES` **forbids `lib/**` from importing `xlsx`**. Read literally, the instruction is unsatisfiable at that path. | [XLS-STRATEGY.md §5](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/XLS-STRATEGY.md#L83-L94); `scripts/check-audit-threshold.mjs` `IMPORT_RULES` | **Do not weaken the security gate.** Keep the pinned SheetJS decode in `scripts/**` behind an injected decoder port; `lib/` owns only the dependency-free matrix layer. | **CORRECT** (option E) | Devin (W02A T2A.2) | RESOLVED (design); runtime proof deferred under E-008 |

## Decision log

### T-01 — `lib/**` must not import `xlsx` while T2A.2 asks for the reader in `lib/**`
Decision: **CORRECT** — injected decoder port (XLS-STRATEGY option E).
Rationale: the security exception for `xlsx` is an `ACCEPTED_HIGH` containment control;
widening `IMPORT_RULES` to admit `lib/**` would defeat it. Splitting the reader keeps the
import in `scripts/**` (the one allowed directory) and leaves `lib/` dependency-free.
IRC/clause basis: n/a (tooling/build-governance, not a design clause).
Approved by: **DRAFT — awaiting licensed-engineer sign-off** (name, date, registration no.).
Date: —

### D-01..D-14, D-15..D-18
Full per-defect decision logs are **not** written here yet: the D-series decisions are
owned and closed by the weeks that implement them (W03 T3.10–T3.11 for D-02/D-06/D-07/D-11/
D-12; W06A for D-01/D-03/D-04/D-13/D-14; W07A for D-05/D-10/D-15/D-16; W09A for D-08/D-09).
D-18 (password-protected corpus) is owned by W02A/T2A.3 and is **TBD** pending the source
password or a reviewed exclusion.

This register is **DRAFT** and, per the project rule, no defect row leaves `OPEN` until the
owning week lands its validation test and a licensed engineer records a review status.
The register is never "closed by decision" in W02A; W02A only *creates* it.

## Honest residual gaps

1. **D-13 cannot be enumerated.** The list's own source (`VENICE-GUIDE.MD §F5`) is missing
   from the checkout. Twelve of fourteen rows were reconstructed from secondary references;
   D-13 has no surviving description. It is recorded as a provenance gap, not guessed.
2. **Defect-specific cells not pinned.** `emit-oracle.ts` (T2A.3) has run (see §5); the
   frozen quantities' cells are recorded in `GOLDEN-ORACLE.json`. The per-defect cell markers
   below read `cell not yet pinned` — each owning week pins its own cell against the emitted
   extract rather than this register inventing one.
3. **No licensed sign-off.** Every row is DRAFT; nothing is `REVIEWED`.

## §5 T2A.3 / T2A.4 execution findings (measured)

`scripts/assimilate/emit-oracle.ts` was **run** and produced the per-bridge oracle files;
`GOLDEN-ORACLE.json` was then refrozen from them and `gate:oracle` turned **GREEN**
(`PASS 270 assertions`). The full transcript is in
[EXIT-GATE-EVIDENCE.md §4](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/EXIT-GATE-EVIDENCE.md).
Two findings came out of the run that are **not** clean numeric cells, so they are recorded
here rather than frozen into the oracle:

1. **Password-protected corpus (D-18).** `REF-PIERCAP-1`, `REF-PIERCAP-2` and `REF-FOOTING`
   are password-protected; the extractor reports `File is password-protected` and emits no
   oracle for them. 5 of 8 workbooks emitted. The protection is **not** bypassed.
2. **Values located but not frozen — no clean numeric cell.** (a) The E-05 SOM water-current
   pair `16.5736` / `17.2753` **is** in the corpus at `STABILITY CHECK FOR PIER!M106` and
   `!M147`, but neither row carries a label in the R1C1 dump, so the quantity name would be a
   guess; held for T6A.11. (b) The E-05 BED-HL water-current set (`77.6352` / `67.232` /
   `43.2337`) and the E-10 `LLOAD` set (`788.266` kN, `244.253` kNm, `2247.881` kNm) appear
   **nowhere** as cells in the three bridges — verified by an exact-and-tolerant sweep of every
   sheet; these are engine-derived targets owned by T6A.11, not source literals. (c) The Bedach
   skew angle `30` occurs only in label-bearing cells (`HYDRAULICS!A9`, `CROSS SECTION!A9`),
   not as a standalone numeric input; deferred to T7A.3.
