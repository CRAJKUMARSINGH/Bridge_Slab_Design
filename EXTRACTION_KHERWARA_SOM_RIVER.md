# KHERWARA BRIDGE — SOM River: Sheet-wise Variable Extraction
Source directory: `KHERWARA BRIDGE/`

## Files in scope
- `hydraulics.xls`
- `Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER.xls`
- `cross section.xls`
- `stability pdf/` (afflux.pdf, stability check pier.pdf, abut*.pdf, steel p*.pdf, bed slope.pdf, deck anchorage.pdf, etc.)

---

## Standard table format
| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|

---

## 1) HYDRAULICS — `hydraulics.xls`

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Discharge | Q |  | Cumecs |  | 902.15 (from repo docs) |
| Area | A |  | m² |  | 490.30 (from repo docs) |
| Wetted Perimeter | P |  | m |  | 190.71 (from repo docs) |
| Slope | S |  | - |  | 1 in 960 (from repo docs) |
| Manning n | n |  | - |  | 0.033 (from repo docs) |
| Velocity | V |  | m/s | V = (1/n)*(A/P)^(2/3)*S^(1/2) | 1.84 (from repo docs) |
| Regime width | L |  | m | L = 4.8*sqrt(Q) | 144.18 (from repo docs) |
| Effective waterway | W_eff |  | m | per sheet | 96 → 81.6 final (from repo docs) |
| Afflux | Δh |  | m | per sheet | to extract from afflux.pdf/xls |

---

## 2) STABILITY CHECK FOR PIER — `Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER.xls`

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| L_eff | L_eff |  | m |  | 9.6 (from repo docs) |
| L_cc | L_cc |  | m |  | 11.1 (from repo docs) |
| W_cap | W_cap |  | m |  | 15 (from repo docs) |
| HFL | HFL |  | m |  | 101.2 (from repo docs) |
| BL | BL |  | m |  | 94.99 (from repo docs) |
| FL | FL |  | m |  | 89.99 (from repo docs) |
| DL | DL |  | m |  | 100.5 (from repo docs) |
| SBC | SBC |  | kN/m² |  | 450 (from repo docs) |
| e = M/P | e |  | m |  | to extract from xls |
| Skew modifiers |  |  | - | rows 79–81 | obstructed velocity factors per sheet |

---

## 3) FOOTING DESIGN — pier footing table

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| L_f | L_f |  | m |  | start = pier L + 2×0.5 m; extend 0–5 m |
| B_f | B_f |  | m |  | start = pier B + 2×0.5 m; extend 0–5 m |
| σ_max | σ_max |  | kN/m² |  | 258.56 example (from repo docs) |
| A_t | A_t |  | m² |  | 0 for acceptance (from repo docs) |

---

## 4) ABUTMENT — battered and cantilever (per PDFs/linked xls)

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Geometry set |  |  |  | per drawing/xls |  |
| Active earth | P_a |  | kN | 0.5*K_a*γ*H² |  |
| Base pressure | σ |  | kN/m² | per sheet |  |

---

## 5) CROSS SECTION — `cross section.xls`

| Variable | Symbol | Cell | Unit | Equation/Reference | Notes |
|----------|--------|------|------|--------------------|-------|
| Points | N |  | - | target ~15 (variable) |  |
| Spacing | Δx |  | m | typical 5 m |  |
| L-section Δ |  |  | m | typical 25 m |  |

---

Checklist:
- [ ] Record exact cells and formulas
- [ ] Capture skew adjustments
- [ ] Cross-check PDFs vs xls values


