# UIT BRIDGES — Bridge Nr Police Chowki: Sheet-wise Variable Extraction
Source directory: `UIT BRIDGES/Bridge Nr Police Chowki/`

## Files in scope
- `Stability Analysis SUBMERSIBLE BRIDGE ACROSS AYAD RIVER ON OLD BHUPALPURA - NEW BHUPALPURA ROAD N.xls`
- `hYDRAULIC dESIGN.xls` (root of `UIT BRIDGES`)
- `Design of Pier Cap.xls`
- `design of Pier Footing ayad bridge.xls` (root of `UIT BRIDGES/NAVRATNA COMPLEX` or project variant if present locally)
- `Design of ABUTMENT Bridge Near Police Chowki.xls`
- `Design of Dirt Wall bRIDGE nEAR pOLICE cHOWKI.xls`
- `LLCALpier1 SUBMERSIBLE BRIDGE ACROSS AYAD RIVER ON OLD BHUPALPURA - NEW BHUPALPURA ROAD NEAR POLI.xls`
- `liveloadtyp for three lanes.xls`
- Field data (if applicable): `FIELD DATA bhupalpura chowki levels.xls`

Note: If multiple variants exist in sibling folders (e.g., `NAVRATNA COMPLEX`), use Police Chowki first; cross-check formulas against variants.

---

## Standard table format to fill for each sheet
| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|

---

## 1) HYDRAULICS (from `hYDRAULIC dESIGN.xls` and/or project Stability workbook)
- Sheets to extract: Hydraulics, Afflux, Regime width, Manning velocity

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Discharge | Q |  | Cumecs |  |  |
| Area | A |  | m² |  |  |
| Wetted Perimeter | P |  | m |  |  |
| Manning n | n |  | - |  |  |
| Slope | S |  | - |  |  |
| Velocity | V |  | m/s | V = (1/n)*(A/P)^(2/3)*S^(1/2) |  |
| Regime Width | L |  | m | L = 4.8*sqrt(Q) |  |
| Effective Waterway | W_eff |  | m | W = L - n_piers*B_pier |  |
| Afflux | Δh |  | m | per sheet formula |  |

---

## 2) STABILITY CHECK FOR PIER (Police Chowki workbook)

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Effective span | L_eff |  | m |  |  |
| Span C/C of piers | L_cc |  | m |  |  |
| Pier cap width | W_cap |  | m |  |  |
| HFL | HFL |  | m |  |  |
| Bed Level | BL |  | m |  |  |
| Foundation Level | FL |  | m |  |  |
| Deck Level | DL |  | m |  |  |
| SBC | SBC |  | kN/m² |  |  |
| Live load reaction | R |  | kN | user input (Phase 1) |  |
| Impact factor | IF |  | - | user input (Phase 1) |  |
| Moments (long/trans) | M_e/M_b |  | kN·m | user input (Phase 1) |  |

---

## 3) FOOTING DESIGN (Pier)

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Footing length | L_f |  | m |  |  |
| Footing width | B_f |  | m |  |  |
| Pier width | B_p |  | m |  |  |
| Vertical load | P |  | kN |  |  |
| Long. Eccentricity | e_l |  | m | e_l = M_e/P |  |
| Trans. Eccentricity | e_b |  | m | e_b = M_b/P |  |
| el/L_f |  |  | - |  |  |
| Area in tension | A_t |  | m² |  |  |
| Max. pressure | σ_max |  | kN/m² | per sheet |  |

---

## 4) ABUTMENT (Type-1 battered) — `Design of ABUTMENT Bridge Near Police Chowki.xls`

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Stem thickness (top) | t_t |  | m |  |  |
| Stem thickness (base) | t_b |  | m |  |  |
| Height | H |  | m |  |  |
| Base length | L_b |  | m |  |  |
| Base width | B_b |  | m |  |  |
| Heel length | L_h |  | m |  |  |
| Toe length | L_toe |  | m |  |  |
| Active earth coeff. | K_a |  | - | (1-sinφ)/(1+sinφ) |  |
| Active pressure | P_a |  | kN | 0.5*K_a*γ*H² | per sheet |  |
| Max. base pressure | σ_max |  | kN/m² | per sheet |  |

---

## 5) DIRT WALL — `Design of Dirt Wall bRIDGE nEAR pOLICE cHOWKI.xls`

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Height | H |  | m |  |  |
| γ_soil | γ |  | kN/m³ |  |  |
| φ | φ |  | deg |  |  |
| K_a | K_a |  | - |  |  |
| P_a | P_a |  | kN |  |  |

---

## 6) LIVE LOAD (LLCAL, liveloadtyp)

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Reaction (max) | R_max |  | kN |  |  |
| Moment (max) | M_max |  | kN·m |  |  |
| Impact factor | IF |  | - |  |  |

---

## 7) Cross-section / Field data

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Points count | N |  | - | target ~15 (variable) |  |
| Spacing | Δx |  | m | typical 5 m (variable) |  |
| HFL | HFL |  | m |  |  |
| L-section spacing |  |  | m | typical 25 m |  |

---

Checklist:
- [ ] Fill every table row with exact Cell/Equation per sheet
- [ ] Capture any special skew adjustments (rows 79–81 in pier stability)
- [ ] Note any cross-sheet references
- [ ] Export consolidated JSON schema once complete


