# CHITTOR & UIT BRIDGES STABILITY ANALYSIS TEMPLATE
# ===============================================

## EXCEL FILE STRUCTURE ANALYSIS

### CHITTOR BEDACH Bridge Excel Structure:
**File: plus Stability Analysis HIGH LEVEL BRIDGE - BEDACH.xls**

### UIT BRIDGES Excel Structure:
**File: Stability Analysis SUBMERSIBLE BRIDGE ACROSS AYAD RIVER.xls**

## IDENTIFIED SHEET STRUCTURE

### Common Sheets in Both CHITTOR & UIT:
1. **afflux calculation** - Hydraulic calculations and afflux analysis
2. **HYDRAULICS** - Detailed hydraulic design and flow analysis  
3. **STABILITY CHECK FOR PIER** - Pier stability under all load combinations
4. **FOOTING DESIGN** - Foundation design and pressure distribution
5. **STEEL IN PIER** / **STEEL REINFORCEMENT** - Reinforcement calculations
6. **Deck Anchorage** - Deck slab anchorage design
7. **Bed Slope** / **Scour Analysis** - Scour depth and bed protection

## VARIABLE DEFINITIONS SHEET (NEW)
# Central registry for all design variables with formula wiring

| Variable | Symbol | Formula | Value | Unit | Sheet Reference | Status |
|----------|--------|---------|-------|------|----------------|--------|
| L_eff | L | =INPUT!C4 | 12.0 | m | Geometry_Input.C4 | ✓ Active |
| W_bridge | W | =W_carr+2*W_foot | 12.5 | m | Geometry_Input.C9 | ✓ Active |
| Q_design | Q | =Hydraulics.C4 | 1265.76 | Cumecs | Hydraulics.C4 | ✓ Active |
| V_design | V | =Q/A_cross | 3.5 | m/s | Hydraulics.C10 | ✓ Active |
| DL_total | DL | =SUM(Loads.C4:C8) | 6220.8 | kN | Stability.C15 | ✓ Active |
| LL_total | LL | =IRC_AA*Impact | 2437.5 | kN | Stability.C16 | ✓ Active |
| Impact_Factor | IF | =IF(L_eff>9,1.25,1.5) | 1.25 | - | Stability.C17 | ✓ Active |
| P_max | σmax | =P/A+6M/(BL²) | 441.0 | kN/m² | Foundation.C18 | ✓ Active |
| ds_normal | ds | =1.34*(Q²/f)^(1/3) | 2.8 | m | Scour.C4 | ✓ Active |
| ds_design | dsd | =1.5*ds_normal | 4.2 | m | Scour.C5 | ✓ Active |
| Ast_pier | As | =M/(0.87*fy*d*j) | 2850 | kg | Steel.C9 | ✓ Active |

## FORMULA WIRING SYSTEM

### Primary Dependencies:
```
Variables_Sheet → All_Design_Sheets
│
├── Geometry_Variables → Hydraulics, Stability, Foundation
├── Hydraulic_Variables → Scour_Analysis, Afflux_Calculation  
├── Load_Variables → Foundation_Design, Steel_Design
├── Foundation_Variables → Steel_Design, Cost_Estimation
└── Steel_Variables → Cost_Estimation, Bar_Schedule
```

### Cross-Sheet Formula References:

#### From Variables Sheet to Design Sheets:
- `Variables.L_eff` → `Stability.C4` (Span length for impact factor)
- `Variables.Q_design` → `Hydraulics.C4`, `Scour.C4` (Discharge calculations)
- `Variables.DL_total` → `Foundation.C8` (Dead load transfer)
- `Variables.LL_total` → `Foundation.C9` (Live load transfer)

#### Between Design Sheets:
- `Hydraulics.V_design` → `Scour.C10` (Velocity for stone size)
- `Stability.P_total` → `Foundation.C8` (Total load transfer)
- `Foundation.M_foundation` → `Steel.C13` (Moment for steel design)
- `Steel.Total_Weight` → `Cost.C4` (Steel quantity for costing)

## SHEET DESIGN SPECIFICATIONS

### Sheet 1: Variables_Sheet (NEW)
**Purpose:** Central variable registry and formula coordination
**Key Features:**
- All design variables defined in one location
- Formula references to source sheets
- Status tracking (Active/Modified/Inactive)
- Cross-sheet dependency mapping

### Sheet 2: Afflux_Calculation (From CHITTOR/UIT)
**Purpose:** Hydraulic calculations and afflux analysis
**Key Formulas:**
- `Q = A * V` (Discharge calculation)
- `Wr = 4.8 * Q^0.5` (Regime width - Lacey)
- `Afflux = V²/(2g) * ((1/Cr²)-1)` (Molesworth formula)
**Formula Wiring:**
- Input: `Variables.Q_design`, `Variables.A_cross`
- Output: `Afflux → Deck_Level_Calculation`

### Sheet 3: Hydraulics (From CHITTOR/UIT)
**Purpose:** Detailed hydraulic analysis and verification
**Key Formulas:**
- `V = (1/n) * R^(2/3) * S^(1/2)` (Manning's equation)
- `R = A/P` (Hydraulic radius)
- `Q = A * V` (Continuity equation)
**Formula Wiring:**
- Input: `Variables.Q_design`, `Variables.V_design`
- Output: `V_design → Scour_Analysis.C10`

### Sheet 4: Stability_Check_Pier (From CHITTOR/UIT)
**Purpose:** Pier stability analysis under all load combinations
**Key Formulas:**
- `LC1 = 1.5*DL + 1.5*LL` (Ultimate limit state)
- `LC2 = 1.2*DL + 1.2*LL + 1.2*Wind` (Combined loading)
- `SF_overturning = M_resisting / M_overturning` (Safety factor)
**Formula Wiring:**
- Input: `Variables.DL_total`, `Variables.LL_total`
- Output: `P_total → Foundation_Design.C8`

### Sheet 5: Foundation_Design (From CHITTOR/UIT)  
**Purpose:** Foundation design and pressure distribution
**Key Formulas:**
- `σ_max = P/A + 6M/(B*L²)` (Maximum foundation pressure)
- `σ_min = P/A - 6M/(B*L²)` (Minimum foundation pressure)
- `e = M/P` (Eccentricity calculation)
**Formula Wiring:**
- Input: `Stability.P_total`, `Stability.M_total`
- Output: `Foundation_Dimensions → Steel_Design.C4:C6`

### Sheet 6: Steel_Design (From CHITTOR/UIT)
**Purpose:** Reinforcement calculation for all components
**Key Formulas:**
- `Ast = M/(0.87*fy*d*j)` (Flexural steel requirement)
- `Asv = V/(0.87*fy*d/sv)` (Shear steel requirement)  
- `Weight = Length * Area * Density` (Steel weight calculation)
**Formula Wiring:**
- Input: `Foundation.M_foundation`, `Stability.V_shear`
- Output: `Total_Steel → Cost_Estimation.C4`

### Sheet 7: Scour_Analysis (From CHITTOR/UIT)
**Purpose:** Scour depth calculation and bed protection design
**Key Formulas:**
- `ds = 1.34*(Q²/f)^(1/3)` (Lacey's scour formula)
- `ds_design = 1.5 * ds_normal` (Design scour with safety factor)
- `d50 = V²/(5.75*g)` (Stone size - Neill's formula)
**Formula Wiring:**
- Input: `Variables.Q_design`, `Hydraulics.V_design`
- Output: `ds_design → Foundation_Depth_Check`

### Sheet 8: Deck_Anchorage (From UIT)
**Purpose:** Deck slab anchorage design
**Key Formulas:**
- `H_braking = 0.2 * LL` (Braking force)
- `T_thermal = α * L * E * A * ΔT` (Thermal force)
- `F_seismic = Z * I * Sa/g * W` (Seismic force)
**Formula Wiring:**
- Input: `Variables.LL_total`, `Variables.L_eff`
- Output: `Anchorage_Forces → Steel_Design`

## IMPLEMENTATION GUIDELINES

### 1. Variable Sheet Setup:
- Create central Variables_Sheet as first sheet
- Define all variables with formulas and references
- Implement status tracking system
- Setup cross-sheet dependency mapping

### 2. Formula Wiring Implementation:
- Use absolute references for variable sheet connections
- Implement error checking for circular references
- Add formula validation and verification
- Setup automatic recalculation triggers

### 3. Sheet Templates:
- Follow CHITTOR & UIT Excel structure exactly
- Maintain formula compatibility with source files
- Implement professional formatting and layout
- Add comprehensive error checking

### 4. Cross-Sheet References:
- Use named ranges for important variables
- Implement formula auditing and tracing
- Add dependency visualization
- Setup change tracking and version control

## VALIDATION CHECKLIST

### Formula Wiring Validation:
- [ ] All variables properly defined in Variables_Sheet
- [ ] Cross-sheet references working correctly
- [ ] No circular reference errors
- [ ] Formula calculations match CHITTOR/UIT results
- [ ] All dependencies properly mapped

### Sheet Structure Validation:
- [ ] All CHITTOR sheets implemented
- [ ] All UIT sheets implemented  
- [ ] Formula structure matches source Excel files
- [ ] Professional formatting applied
- [ ] Error checking implemented

### System Integration Validation:
- [ ] Variables sheet controls all calculations
- [ ] Changes propagate correctly through all sheets
- [ ] Final results match manual calculations
- [ ] Export functionality working
- [ ] Documentation complete

## READY FOR IMPLEMENTATION
This template provides the complete structure for implementing the CHITTOR & UIT bridges stability analysis system with full formula wiring and variable sheet integration.