# Project Strategy — Engineering Knowledge System Architecture

**Date:** August 16, 2026
**Status:** APPROVED & IN EXECUTION

---

## Strategic Vision

This repository is already structured as a **bridge-slab design/report system**, with:
- An authoritative calculation engine
- Validation schemas (Zod)
- API with 70+ endpoints
- Report generation (HTML, PDF, narrative prose)
- SVG/DXF drawings
- Workbook intake & 46-sheet Excel generation
- Golden fixtures & regression testing
- An `Attached_Assets/` directory with substantial historical engineering material

The strategy is **broader than "make the AI read the Word/Excel files."**

---

## Architecture Principle: Enrich, Don't Replace

The agent should **NOT replace** the architecture. It should **enrich** the existing architecture from the engineering archive.

### Safe Knowledge Pipeline (9 Stages)

```
Historical Word/Excel
    → Extract Engineering Knowledge
    → Validate
    → Normalize
    → Engineering Knowledge Registry
    → Calculation Engine
    → Independent Checks
    → Design Result → Drawing → Report
```

### Unsafe Pattern (PROHIBITED)

```
Word/Excel → AI reads → AI writes code
```

---

## Three Expert Roles

The AI agent acts as three experts simultaneously:

1. **Senior Indian Bridge Structural Engineer / IIT Faculty**
   - Deep knowledge of IRC codes, Indian bridge practice, and limit state design
   - Practical experience with site conditions, materials, and construction

2. **Forensic Reviewer of Legacy Calculations**
   - Every historical formula is suspect until independently verified
   - 10-step verification protocol enforced for all extracted knowledge
   - Classification: VALID / CONDITIONALLY VALID / OBSOLETE / QUESTIONABLE / UNRESOLVED

3. **Software Architect Converting Engineering Knowledge**
   - Reliable, testable, traceable calculation engine
   - Engineering knowledge as structured data (JSON registries)
   - Regression-proof with golden test cases

---

## 8 Permanent Engineering Repositories

Located at `engineering/` in the project root:

| Repository | Purpose |
|---|---|
| `knowledge/` | Formulas, design methods, load models, detailing, materials, code refs, historical practice, conflicts |
| `verification/` | Hand checks, independent checks, Excel parity, regression cases |
| `registry/` | Asset, formula, code, method, decision, and warning registries (JSON) |
| `benchmarks/` | Performance and accuracy benchmarks |
| `assumptions/` | Documented assumptions per bridge type |
| `reports/` | Engineering audit and review reports |
| `drawings/` | Drawing specifications and standards |
| `review/` | Review comments and resolutions |

---

## Priority Source Material in Attached_Assets/

The following asset categories are the **first sources** the agent mines for the slab-design engine:

1. **Deck Slab & Tee-Beam Analyses**
   - `Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Bridge 19 M.docx`
   - `Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Kherka Bridge.docx`

2. **Slab Design Reference**
   - `DETAILED SLAB DESIGN.htm` (comprehensive slab design HTML)

3. **Stability Analysis Spreadsheets**
   - Multiple stability analysis XLS files (Bedach, Jakham, submersible bridges)

4. **Pier & Abutment Design**
   - `DESIGN OF PIER AND CHECK FOR STABIL.txt`
   - `Design of ABUTMENT D JOHNSON VICTOR.xls`
   - `KUMBHALGARH ABUTMENT WITHOUT BEARING.xls`

5. **Hydraulic Calculations**
   - `Hydraulic Calculations AYAD BRIDGE.doc`
   - `Hydraulic Calculations CHAP BRIDGE.doc`
   - `HFL BRIDGE BANAS RIVER...xls`

6. **Project-Specific Design Notes**
   - Numerous project-specific Excel calculation sheets with real-world parameters

---

## IRC Code Edition Control

Every calculation must record the **exact code edition and amendment** — never "as per IRC":

| Code | Edition | Domain |
|---|---|---|
| IRC:5-2015 | 8th Rev. + Amendments 1-3 | Waterway, afflux, clearance |
| IRC:6-2017 | Section II + 2020 revisions | Loads & combinations |
| IRC:78-2014 | 2nd Rev. + Amendment 2 | Substructure & foundations |
| IRC:112-2020 | Limit State Method | Concrete road bridges |
| IS 456:2000 | 4th Rev. (Reaffirmed 2021) | General RCC |

---

## Phase Execution Protocol

1. Each phase is executed **independently**.
2. Deliverables are produced and saved.
3. **User review is required** before proceeding to the next phase.
4. No uncontrolled cross-phase engineering changes.

### Phase Status

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Engineering Knowledge Audit & Inventory | ✅ **APPROVED** |
| Phase 2 | Formula Extraction & Validation | 🔜 Next |
| Phase 3+ | Engine Enhancement (per approved formulas) | ⏳ Pending |

---

## Related Documents

- [Master Instruction](file:///e:/Rajkumar/Bridge_Slab_Design/docs/MASTER-INSTRUCTION-BRIDGE-AGENT.md)
- [Engineering Knowledge Audit Report](file:///e:/Rajkumar/Bridge_Slab_Design/engineering/reports/engineering_knowledge_audit.md)
- [Asset Registry](file:///e:/Rajkumar/Bridge_Slab_Design/engineering/registry/asset_registry.json)
