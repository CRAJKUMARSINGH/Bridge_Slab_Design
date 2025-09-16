# BRIDGE DESIGN VARIABLES EXTRACTED FROM ACTUAL EXCEL SHEETS
## Complete Variable List from UIT BRIDGES & KHERWARA BRIDGE Excel Files

---

## SHEET 1: HYDRAULICS DESIGN VARIABLES

### From UIT Bridge - HYDRAULICS Sheet:
| Variable | Symbol | Value | Unit | Description | Cell Location |
|----------|---------|--------|------|-------------|---------------|
| Chainage | Ch | Variable | m | Survey chainage points | Row 7, Col 2 |
| Ground Level | G.L. | Variable | m | Ground level at each chainage | Row 7, Col 3 |
| Depth of Flow | D | Variable | m | Water depth at each point | Row 7, Col 4 |
| Length of Flow | L | Variable | m | Flow length measurement | Row 7, Col 5 |
| Average Depth of Flow | D_avg | Calculated | m | Mean depth across section | Row 7, Col 6 |
| Cross Sectional Area of Flow | A | Calculated | m² | Flow area | Row 7, Col 7 |
| Wetted Perimeter | P | Calculated | m | Wetted perimeter | Row 7, Col 8 |

### From KHERWARA - Afflux Calculation Sheet:
| Variable | Symbol | Value | Unit | Description | Cell Location |
|----------|---------|--------|------|-------------|---------------|
| Discharge | Q | 902.15 | Cumecs | Total flood discharge | Row 14 |
| Cross Sectional Area | A | 490.30 | m² | Flow cross-section area | Row 6 |
| Wetted Perimeter | P | 190.71 | m | Wetted perimeter | Row 7 |
| Slope | S | 1 in 960 | - | Channel bed slope | Row 8 |
| Rugosity Coefficient | n | 0.033 | - | Manning's roughness | Row 10 |
| Velocity | V | 1.84 | m/sec | Flow velocity | Row 13 |
| Regime Surface Width | L | 144.18 | m | Natural channel width | Row 17 |
| Effective Linear Waterway | W_eff | 96 | m | Clear waterway width | Row 20 |
| Silt Factor | Ksf | 1.5 | - | Lacey's silt factor | Row 27 |
| Obstructed Width | W_obs | 13.2 | m | Width blocked by piers | Row 29 |
| Effective Waterway (Final) | W_final | 81.6 | m | Net effective waterway | Row 30 |

---

## SHEET 2: STABILITY CHECK FOR PIER VARIABLES

### Basic Design Data (UIT Bridge):
| Variable | Symbol | Value | Unit | Description | Cell Location |
|----------|---------|--------|------|-------------|---------------|
| Right Effective Span | L_eff | 9.6 | m | Effective span length | Row 13 |
| Span C/C of Piers | L_cc | 11.1 | m | Center to center pier spacing | Row 14 |
| Overall Width of Pier Cap | W_cap | 15 | m | Pier cap total width | Row 15 |
| High Flood Level | HFL | 101.2 | m | Maximum flood level | Row 16 |
| Buoyancy at Footing Level | B_f | 100 | % | Buoyancy factor at footing | Row 18 |
| Buoyancy at Pier Level | B_p | 100 | % | Buoyancy factor at pier | Row 19 |
| Flood Discharge | Q | 1265.76 | Cumecs | Design flood discharge | Row 21 |
| River Bed Slope | S | 1 in 975 | - | Bed slope ratio | Row 22 |
| Design Velocity | V | 3.5 | m/sec | Design flow velocity | Row 23 |
| Bed Level of Highest Pier | BL | 94.99 | m | River bed level at pier | Row 24 |
| Safe Bearing Capacity | SBC | 45 t/m² (450 kN/m²) | - | Allowable soil pressure | Row 25 |
| Top Level of Founding Rock | RL | 91.49 | m | Rock level | Row 26 |
| Embedment in Hard Rock | E | 1.5 | m | Pier embedment depth | Row 27 |
| Foundation Level of Highest Pier | FL | 89.99 | m | Foundation bottom level | Row 28 |
| Deck Level of Bridge | DL | 100.5 | m | Bridge deck level | Row 29 |
| Top Level of Pier Cap | PCL | 99.525 | m | Pier cap top level | Row 30 |
| Level Difference | LD | 9.535 | m | Pier cap to foundation | Row 31 |

### Dead Load Components:
| Variable | Symbol | Formula | Unit | Description | Cell Location |
|----------|---------|---------|------|-------------|---------------|
| Self Weight of Slab | DL_slab | 11.1 × 15 × 0.9 × 24 | kN | Deck slab self weight | Row 35 |
| Self Weight of Wearing Coat | DL_wear | 11.1 × 12 × 0.075 × 24 | kN | Wearing course weight | Row 36 |
| Footpath Load | DL_foot | 2×11.1 × 1.5 × 0.5 × 24 | kN | Footpath dead load | Row 37 |
| Pier Cap Load | DL_cap | 1.5 × 15 × 0.6 × 24 | kN | Pier cap self weight | Row 41 |
| Flared Portion Sides | DL_flare | 0.5 × 0.15 × 0.6 × 15 | kN | Flared section load | Row 42 |

---

## SHEET 3: FOOTING DESIGN VARIABLES

### From UIT Bridge - FOOTING DESIGN Sheet:
| Variable | Symbol | Value | Unit | Description | Cell Location |
|----------|---------|--------|------|-------------|---------------|
| Length of Footing | L_f | Variable | m | Footing length (trial value) | Row 11 |
| Width of Footing | B_f | Variable | m | Footing width (trial value) | Row 12 |
| Width of Pier | B_p | Variable | m | Pier stem width | Row 13 |
| Vertical Load | P | Variable | kN | Total vertical load | Row 14 |
| Longitudinal Moment | M_e | Variable | kN-m | Moment about transverse axis | Row 15 |
| Transverse Moment | M_b | Variable | kN-m | Moment about longitudinal axis | Row 16 |
| Eccentricity (Longitudinal) | e_l | Me/P = 0.1356 | m | Longitudinal eccentricity | Row 17 |
| Eccentricity (Transverse) | e_b | Mb/P = 0.4900 | m | Transverse eccentricity | Row 18 |
| el/lf Ratio | - | 0.0110 | - | Eccentricity ratio check | Row 19 |
| Area in Tension | A_t | 0 | m² | Tensile stress area | Row 23 |
| Maximum Pressure (Redistributed) | σ_max | 258.56 | kN/m² | Maximum bearing pressure | Row 25 |

---

## SHEET 4: CROSS SECTION SURVEY VARIABLES

### Survey Point Data Structure:
| Variable | Symbol | Type | Unit | Description |
|----------|---------|------|------|-------------|
| Point Number | i | Integer | - | Survey point sequence |
| Chainage | Ch_i | Real | m | Distance along survey line |
| Left Distance | DL_i | Real | m | Distance from left bank |
| Right Distance | DR_i | Real | m | Distance from right bank |
| Ground Level | GL_i | Real | m | Ground elevation |
| Water Level | WL_i | Real | m | Water surface elevation |
| Bed Level | BL_i | Real | m | River bed elevation |

---

## ADDITIONAL SHEETS TO BE EXTRACTED:

### Required Variables from Remaining Sheets:
1. **STEEL IN PIER** - Reinforcement calculations
2. **STEEL IN FLARED PIER BASE** - Base reinforcement
3. **ABUTMENT FOOTING DESIGN** - Abutment foundation design
4. **STABILITY CHECK ABUTMENT** - Abutment stability
5. **DIRT WALL REINFORCEMENT** - Retaining wall design
6. **Bed Slope** - Channel slope calculations
7. **Deck Anchorage** - Deck connection details

---

## CRITICAL QUESTIONS BASED ON EXTRACTED DATA:

### 1. **TRIAL AND ERROR ITERATIONS:**
- **Footing Dimensions**: What are the typical trial sequences for footing length and width?
- **Stress Limits**: Maximum pressure = 258.56 kN/m² vs SBC = 450 kN/m² - what's the safety factor target?
- **Area in Tension**: Currently shows 0 m² - this means no tension, correct?

### 2. **SURVEY POINTS:**
- **Cross Section**: How many survey points are typically taken? (I see structure but need actual count)
- **Spacing**: What's the typical spacing between survey points?
- **Longitudinal Section**: How many points along the bridge alignment?

### 3. **SKEW BRIDGE VARIABLES:**
- **Skew Angle θ**: What values are used? (0°, 15°, 30°, 45°?)
- **Load Modification**: How are loads modified for skew bridges?
- **Effective Span**: How is L_eff calculated for skewed bridges?

### 4. **MISSING CRITICAL VARIABLES:**
- **Seismic Coefficients**: Zone factors, response reduction factors
- **Live Load Values**: IRC loading, impact factors
- **Material Properties**: Concrete grade, steel grade, unit weights
- **Scour Calculations**: Scour depth formulas and factors

### 5. **CALCULATION SEQUENCES:**
Based on the sheets, the sequence appears to be:
1. **Hydraulics** → Discharge, velocity, scour depth
2. **Cross Section** → Survey data processing
3. **Stability Check** → Load calculations, stability analysis
4. **Footing Design** → Foundation sizing through trial and error
5. **Steel Design** → Reinforcement calculations

**Is this sequence correct? Are there any parallel calculations or iterations between sheets?**

---

## NEXT STEPS:
1. **Extract remaining sheet variables** (Steel, Abutment, etc.)
2. **Identify trial and error logic** for footing sizing
3. **Extract formulas** for each calculation step
4. **Understand skew bridge modifications**
5. **Map interdependencies** between sheets

**Please confirm if this extraction approach is capturing all the critical variables from your Excel sheets, and guide me on the missing elements or typical values for the trial parameters.**
