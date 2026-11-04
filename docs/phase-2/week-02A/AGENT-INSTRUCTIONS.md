# P2-W02A — SOURCE CORPUS ASSIMILATION & ORACLE FREEZE
Primary: Devin | Verifier: Antigravity | Prereq: P2-W02 gate GREEN

## 0. READ FIRST
docs/phase-2/week-02/ARCHITECTURE.md | lib/engine/src/** | scripts/phase-zero/extract-excel.ts
python_cad/scanner.py | scripts/fixtures/*.json | AUDIT-REPORT-v1.0.md

## 1. OBJECTIVE
Turn the 8 uploaded legacy workbooks into a versioned, hashed, machine-readable
oracle corpus, and prove the current fixtures wrong. This is the foundation of every
parity gate in Phase 2.

## 2. HARD CONSTRAINTS
- Originals are immutable. Copy to `corpus/raw/`, never edit in place.
- Every extracted number carries: file, sheet, cell/row, and a sha256 of the source.
- Do NOT "fix" a source value silently. Record it as a defect (see T2A.5).

## 3. TASKS
T2A.1 Create corpus/raw/<bridge-code>/ with the 8 workbooks verbatim + sha256 manifest.
      Bridge codes: SOM-KHW (Kherwara 9/000), SOM-LAR (Larathi), BED-HL (Bedach skew),
      BED-SUB (Bedach submersible), AYAD-HL, REF-PIERCAP-1, REF-PIERCAP-2, REF-FOOTING.
T2A.2 Solve the .xls problem (F2). Build lib/engine/src/io/xls.ts that reads BIFF8 and
      returns a sheet/cell matrix. Options: keep xlsx for .xls only, or add a pinned
      converter. Decide, document in docs/phase-2/week-02A/XLS-STRATEGY.md, and state
      the interaction with P2-W04 T4.1 (which must NOT break .xls).
T2A.3 Extractor: scripts/assimilate/emit-oracle.ts -> corpus/oracle/<bridge>.json
      capturing every value from the sheets: cross-section, bed slope, HYDRAULICS,
      afflux calc, Deck Anchorage, STABILITY CHECK PIER, abstract of stresses,
      STEEL IN *, FOOTING DESIGN, Pier Cap, LLOAD, loadsumm, LL-ABSTRACT,
      STABILITY CHECK ABUTMENT, DIRT *, AbutMENT Drawing, Abstract, Bridge measurements,
      General Abs., Tech Report.
T2A.4 Freeze corpus/oracle/GOLDEN-ORACLE.json from docs/phase-2/week-02A/ORACLE-TABLE.md
      (48 values already enumerated: A, P, R, V, Q, regime width, Db, dsm, Ka, obstruction,
      a, h, AFL, obstructed velocity, drag FS, Pmax, FS overturning, FS sliding, Ash, skew).
      Every entry needs unit, source cell, and tolerance.
T2A.5 Write docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md with all 14 defects D-01..D-14,
      each with: description, evidence (file+sheet+cell), the app's required behaviour,
      owner, and status. This register is a first-class deliverable.
T2A.6 Tolerance policy: rtol=1e-6 for arithmetic, 1e-4 for interpolated/rounded source
      values, and 2% for values the source rounded by hand. Document per category.
T2A.7 Handle broken formula cells: #ERR:Ref / #ERR:Name must produce a partial row plus a
      REVIEW flag, never an exception. Test with loadsumm and Bedach Deck Anchorage.
T2A.8 Delete/replace the two wrong fixtures. Move to corpus/superseded/ with a note.
      New fixtures must be named by bridge code, not by vague label.
T2A.9 Add `npm run gate:oracle` that asserts every GOLDEN-ORACLE entry is reachable from
      the corpus and that the corpus hashes match.

## 4. EVIDENCE
Paste: corpus manifest with sha256, oracle entry count, gate:oracle output,
and an explicit before/after table for the two superseded fixtures.

## 5. EXIT GATE
[ ] 8 workbooks copied and hashed; originals untouched
[ ] .xls reader works; XLS-STRATEGY.md states the W04 interaction
[ ] GOLDEN-ORACLE.json frozen with 48+ entries, units, sources, tolerances
[ ] SOURCE-DEFECT-REGISTER.md has D-01..D-14 with required behaviours
[ ] #ERR cells tolerated (test-proven)
[ ] Old fixtures superseded with a written note
[ ] gate:oracle green

## 6. DELIVERABLES
corpus/** | lib/engine/src/io/xls.ts | docs/phase-2/week-02A/{XLS-STRATEGY,ORACLE-TABLE,SOURCE-DEFECT-REGISTER,EXIT-GATE-EVIDENCE}.md
scripts/assimilate/emit-oracle.ts

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard. Report must list every source defect found beyond D-01..D-14.
