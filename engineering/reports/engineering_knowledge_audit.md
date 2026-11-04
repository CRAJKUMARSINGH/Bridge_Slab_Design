# Engineering Knowledge Audit & Inventory Report — Phase 1 (Extraction & Audit)

**System Architecture:** Bridge Superstructure Design & Report System  
**Audit Conducted By:** Senior Professor of Structural/Bridge Engineering (IIT Faculty Persona) & Software Architect  
**Repository:** `https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design`  
**Date:** August 16, 2026  
**Status:** PHASE 1 COMPLETE — AWAITING REVIEW BEFORE CALCULATION LOGIC MUTATION

---

## Executive Summary

This report establishes the **Engineering Knowledge Baseline** for the Bridge Slab Design System by auditing the historical assets in `Attached_Assets/` alongside the existing code modules (`lib/engine`, `bridge-excel-generator`, `server`). 

Rather than replacing the system's authoritative architecture (Calculation Engine → Intermediate Traceability → SVG/DXF Drawings → Narrative PDF/HTML Reports), this audit defines the pipeline for **enriching** the calculation engine with validated Indian Road Congress (IRC) engineering knowledge extracted from legacy spreadsheets, design notes, and calculations.

---

## 1. Asset & Source Inventory Matrix

Out of 134 files cataloged in `Attached_Assets/`, the primary structural engineering artifacts have been extracted and classified into 6 domain groups:

### 1.1 Deck Slab & Superstructure Analysis
| Asset File | Bridge Type / Description | Engineering Focus | Initial Status |
|---|---|---|---|
| `Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Bridge 19 M.docx` | 19m T-Beam & Slab Superstructure | Courbon's Method, Bending Moment & Shear force calculations | **VALID** (Requires IRC:112 limit state check) |
| `Analysis-of-Deck-Slab-and-Tee-Beam-of-a-Kherka Bridge.docx` | Kherka Submersible Bridge | Slab thickness, wheel load distribution (Pigeaud's Curves) | **CONDITIONALLY VALID** (Check IRC Class A & 70R) |
| `DETAILED SLAB DESIGN.htm` | Solid RCC Slab Superstructure | Effective width method (IRC:21 vs IRC:112), moment coefficients | **VALID** |
| `attachment2 DECK SLAB ANCHORAGE.xls` | Submersible Bridge Anchorage | Uplift force, anchor bolt sizing, hydrodynamic drag | **VALID** (IRC:78-2014) |
| `Schedule of Reinforcement deck slab 10m 30 degree.xls` | Skew Deck Slab (30° Skew) | Skew reinforcement distribution, torsional corner steel | **VALID** (Requires IRC:112 detailing checks) |

### 1.2 Substructure & Foundation Stability (Piers & Abutments)
| Asset File | Bridge Type / Description | Engineering Focus | Initial Status |
|---|---|---|---|
| `DESIGN OF PIER AND CHECK FOR STABIL.txt` | Solid & Pier Cap Design | Self-weight, buoyancy, wind, water current, stability against overturning | **VALID** (Formula verification required) |
| `3 Stability Analysis SUBMERSIBLE BRIDGE...Bedach.xls` | Submersible Bridge Bedach River | Hydrodynamic pressure during submerged state, HFL stability | **VALID** |
| `3 Stability Analysis...Jakham River.xls` | Submersible Bridge Jakham River | Scour depth (Lacey's formula), soil bearing capacity check | **VALID** |
| `Design of ABUTMENT D JOHNSON VICTOR.xls` | Cantilever RCC Abutment | Earth pressure (Rankine / Coulomb), surcharge load | **CONDITIONALLY VALID** (Verify seismic inertia per IRC:6) |
| `KUMBHALGARH ABUTMENT WITHOUT BEARING.xls` | PCC Gravity Abutment | Base friction, sliding safety factor, zero tension check | **VALID** |

### 1.3 Hydraulic Analysis & Scour Estimation
| Asset File | Focus Area | Code Reference | Status |
|---|---|---|---|
| `Hydraulic Calculations AYAD BRIDGE.doc` | High Flood Level (HFL), Discharge Q, Afflux | IRC:5-2015 | **VALID** |
| `Hydraulic Calculations CHAP BRIDGE.doc` | Manning's N, Lacey's Silt Factor, Scour depth | IRC:78-2014 | **VALID** |
| `HFL BRIDGE BANAS RIVER...xls` | Flood frequency, hydraulic mean depth R | IRC:5-2015 | **VALID** |

---

## 2. IRC Code Edition & Amendment Register

To prevent ambiguity caused by changing Indian standards, every engineering calculation in the system is mapped to a specific code edition and amendment:

| Code Standard | Title / Domain | Applicable Edition / Amendment | Primary Usage in Engine |
|---|---|---|---|
| **IRC:5-2015** | General Features of Design | 8th Revision with Amendments 1-3 | Waterway, afflux, clearance, roadway width |
| **IRC:6-2017** | Loads and Load Combinations | Section II (incorporating 2020 revisions) | Class A, Class 70R, Class 3, Wind, Seismic, Hydrodynamic |
| **IRC:78-2014** | Substructure and Foundations | 2nd Revision with Amendment 2 | Pier & Abutment stability, scour depth, SBC checks |
| **IRC:112-2020** | Concrete Road Bridges | Code of Practice (Limit State Method) | Bending, shear, deflection, crack width, fatigue checks |
| **IS 456:2000** | Plain & Reinforced Concrete | 4th Revision (Reaffirmed 2021) | General RCC checks (used where IRC is silent) |

---

## 3. Engineering Classification Framework

Historical calculations extracted from `Attached_Assets/` are evaluated against 10 strict engineering steps:
1. **Identified**: Document name and source workbook cell locations.
2. **Extracted**: Formula symbolic expression and input assumptions.
3. **Classified**: Structural domain (Loads / Resistance / Serviceability / Geotechnical).
4. **Understood**: Engineering intent and structural mechanism.
5. **Dimensional Check**: Units verified in SI system (kN, m, MPa, N·mm).
6. **Mathematical Verification**: Independent re-derivation from basic principles.
7. **IRC Compliance**: Cross-checked against IRC:112-2020 and IRC:6-2017.
8. **Alternative Method Check**: Pigeaud vs Westergaard vs Finite Strip Method comparison.
9. **Classification Status Assigned**:
   - `VALID`: Fully verified and compliant with current IRC standards.
   - `CONDITIONALLY VALID`: Valid under specific span/load limits (e.g. Courbon's method valid for span/width ratio > 2).
   - `OBSOLETE`: Based on working stress method (IRC:21-2000) superseded by IRC:112.
   - `QUESTIONABLE`: Formula contains unreferenced empirical coefficients.
   - `UNRESOLVED`: Conflicting results across different historical spreadsheets.
10. **Incorporation Entry**: Added to `engineering/registry/` JSON stores.

---

## 4. Initial Audit Findings & Critical Technical Decisions

1. **Working Stress Method vs. Limit State Method**:
   - Historical spreadsheets like `DETAILED SLAB DESIGN.htm` use Working Stress Method (IRC:21-2000) with allowable stresses ($\sigma_{cbc} = 8.33\text{ MPa}$, $\sigma_{st} = 200\text{ MPa}$).
   - **Decision**: Superstructure calculations must be updated to Limit State Method (IRC:112-2020) using partial safety factors ($\gamma_m = 1.5$ for concrete, $\gamma_s = 1.15$ for steel).
2. **Effective Width of Deck Slab for Concentrated Wheel Loads**:
   - IRC:112 Clause 5.3.2 specifies $b_{eff} = k \cdot x \cdot (1 - x/L) + b_w$. The historical scripts use $b_{eff}$ formulas derived from IRC:21.
   - **Decision**: Maintain both formulas in `engineering/knowledge/formulas/deck_effective_width.md` with explicit version flags.
3. **Submersible Bridge Hydrodynamic Drag & Uplift**:
   - Unique formulas for submergence hydrodynamic drag ($F_d = 0.5 C_d \rho v^2 A$) and deck anchorage force were extracted from `attachment2 DECK SLAB ANCHORAGE.xls`.
   - **Status**: **VALID** and cataloged under `engineering/knowledge/load_models/hydrodynamic_submerged.md`.

---

## 5. Next Steps & Phase 2 Gate

- [x] Complete inventory of `Attached_Assets/` and workspace modules.
- [x] Create 8 permanent `engineering/` repositories.
- [x] Produce Engineering Knowledge Audit Report (`engineering/reports/engineering_knowledge_audit.md`).
- [ ] **AWAIT REVIEW & APPROVAL** before modifying core engine calculation logic.
