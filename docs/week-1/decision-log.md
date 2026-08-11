# Decision Log ΓÇö Week 1

## D-001 Report-first product
**Decision:** The detailed HTML/PDF design report is the deliverable. Excel workbooks are parity oracles during migration, not the product interface.  
**Status:** Adopted.

## D-002 One golden project first ΓÇö Kherwara/Kharka
**Decision:** Kherwara/Kharka is the single first golden project. No expansion to other project types before golden regression is green.  
**Status:** Provisional ΓÇö pending naming confirmation (see OQ-001).

## D-003 Preserve before quarantine
**Decision:** Week 1 adds no destructive changes. Quarantine (archive moves) is a Week 3 deliverable.  
**Status:** Adopted.

## D-004 Existing bridge-excel-generator is the current reference engine
**Decision:** `bridge-excel-generator/design-engine.ts` and the Kherwara hydraulics snapshot are the current executable reference. The new `lib/engine/` replaces it incrementally starting Week 5.  
**Status:** Adopted.

## D-005 Kherwara Γëá Kharka until confirmed
**Decision:** Do not silently merge the two spellings. Both exist in the repo with different asset sets. The relationship must be confirmed by the project owner.  
**Status:** Open ΓÇö see OQ-001.

## D-006 alpha = 0.9, correctionK3 = 1.2 are engineer-controlled defaults
**Decision:** Both remain visible in the input contract as optional overrides, not hidden constants. Defaults from `answers_demo.json`.  
**Status:** Adopted.

## D-007 One authoritative calculation pipeline
**Decision:** All paths (UI, CLI, tests, report) must use the same calculation core. Divergent paths are archived.  
**Status:** Adopted ΓÇö enforced from Week 5 onwards.

## D-008 Failed checks are never suppressed
**Decision:** Deflection FAIL in the demo workbook is intentional and must appear in UI and report. No check result is hidden.  
**Status:** Adopted.
