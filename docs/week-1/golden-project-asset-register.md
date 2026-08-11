# Golden Project Asset Register ΓÇö Week 1

**Project:** Kherwara / Kharka Bridge  
**Status:** Provisional ΓÇö engineering approval pending  
**Captured:** 2026-08-10

## Identity note
Repository contains both spellings. OQ-001 must be answered before the
canonical workbook is accepted.

## Report candidates

| Path | Type | Status |
|---|---|---|
| `Attached_Assets/DESIGN REPORT KHARKA BRIDGE.docx` | Design report | Present |
| `Attached_Assets/Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Kherka Bridge.docx` | Structural report | Present |
| `Attached_Assets/FINAL BRIDGE KHERKA 01.docx` | Supporting report | Present |
| `sample/merged-15-users/user_01/Kherwara_Golden_report.pdf` | Generated sample | Present ΓÇö not canonical |

## Workbook candidates

| Path | Type | Status |
|---|---|---|
| `sample/merged-15-users/user_01/Kherwara_Golden_design.xlsx` | Generated golden workbook | Present ΓÇö provenance unconfirmed |
| `assets/E_DRIVE_BRIDGE_DESIGN/Kharka Bridge Rehabilitation/final proposals kharka 27 may2015/T-Beam-Design BRIDGE DECK.xls` | Legacy deck workbook | Present (LFS) ΓÇö conversion pending |
| `assets/E_DRIVE_BRIDGE_DESIGN/Kharka Bridge Rehabilitation/final proposals kharka 27 may2015/HYDRAULICS KHERKA BRIDGE.xlsx` | Hydraulic workbook | Present |

## Drawing candidates

| Path | Status |
|---|---|
| `assets/DRAWINGS_FROM_RAJKUMAR_DESIGNS/KHERWARA BRIDGE/GAD SUBMERSIBLE BRIDGE KHERWARA.dwg` | Present |
| `assets/DRAWINGS_FROM_RAJKUMAR_DESIGNS/KHERWARA BRIDGE/GAD.pdf` | Present |
| `assets/COMPONENT_DRAWINGS_SORTED/General Arrangement Drawings (GAD)/GAD Kharka Bbrige.dwg` | Present |

## Existing fixtures
- Input: `scripts/fixtures/kherwara-project-input.ts`
- Hydraulics snapshot: `scripts/fixtures/kherwara-hydraulics-snapshot.json`
- Checker: `scripts/verify-engine-hydraulics.ts`
- Week 0 golden: `tests/golden/kherwara/inputs.json` + `expected-hydraulics.json`

## Selection gate checklist
- [ ] OQ-001: Kherwara = Kharka confirmed
- [ ] Canonical workbook filename and revision confirmed
- [ ] Engineering owner identified
- [ ] Licensed reviewer named
