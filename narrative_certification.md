# Technical Design Report Certification

## User 1: Larathi / Som (stabil*.xls seed)

### TechNote Content
```text
TECHNICAL NOTE
This design is prepared in accordance with IRC:6-2017 (Loads and stresses), IRC:112-2015 (Concrete bridges), IRC:78-2014 (Foundations), IRC:SP:13 (Hydraulic design of bridges), and relevant Ministry of Road Transport and Highways circulars as applicable to the project.
For submersible configuration, overtopping behavior is intentionally considered and deck anchorage / drag resistance checks govern flood-stage safety.
Project framing: total bridge length 96.00 m with 12.00 span(s) at nominal span length 8.00 m and carriageway width 7.50 m.
Design discharge Q = 1,062.576 m³/s; HFL = 99.50 m MSL; bed level (working) = 96.17 m MSL; foundation level = 92.00 m MSL.
From the hydraulic design cycle, computed velocity is approximately 2.41 m/s, afflux is approximately 0.826 m, and design scour depth is approximately 12.833 m.
Flow interpretation: Froude-number-based regime classification is taken from the hydraulics engine output and used to judge whether flow is tranquil/subcritical or rapid/supercritical for design narration and review traceability.
The submersible deck is proportioned for controlled overtopping under flood loading with stability verification carried through pier and abutment checks.
Open foundations are designed for safe bearing capacity SBC = 200.00 kPa, soil friction angle φ = 30.00°, unit weight γ = 18.00 kN/m³. If field tests indicate weaker strata, revised bearing and stability checks shall be carried out.
Substructure storyline: pier, footing and abutment sheets carry the governing sliding, overturning, bearing and stress checks; any CHECK outcome must be treated as a mandatory engineering review checkpoint.
Execution note: this narrative is generated from computed variables to avoid manual rewriting and to preserve one-to-one consistency between design sheets, notes and report language.
DESIGN STORY NOTE (TechNote) - DESIGN OF SUBMERSIBLE BRIDGE
Design data: project Construction of Submersible Bridge on Larathi to Larathi B Road, across Som River, location Larathi to Larathi B Road, Som River, river Som, total bridge length 96.00 m with 12 span(s) of 8.00 m and carriageway width 7.50 m.
Code basis: IRC:6 for load effects, IRC:112 for concrete design, IRC:78 for foundations, IRC:SP:13 for hydraulic interpretation, with overtopping accepted by design intent for submersible behavior.
Step 1 - hydraulic control variables are fixed from the same engine that drives the workbook: design discharge 1,062.576 cumecs, velocity 2.41 m/s, afflux 0.826 m, and design scour depth 12.833 m.
Step 2 - geotechnical basis is declared before any substructure verdict: SBC 200.00 kN/m2, phi 30.00 deg, gamma 18.00 kN/m3, foundation level 92.00 m MSL.
Step 3 - submersible flood story: deck may overtop, therefore drag, hydrostatic action, buoyancy, scour and base-pressure stability become the governing acceptance chain instead of fixed soffit clearance.
Narrative policy: every major sheet must read in the order design data -> engineering logic -> visible computed values -> pass/check verdict, so reviewers can follow the design without opening source code.

```

### Tech Report Content
```text
TECHNICAL REPORT
Project Name: Construction of Submersible Bridge on Larathi to Larathi B Road, across Som River
Location: Larathi to Larathi B Road, Som River
Bridge Type: Submersible Bridge
Total Length: 48 m
Width: 7.5 m
No. of Spans: 12
Hydraulic computations establish a design discharge of 1,062.576 m³/s with approach velocity 2.41 m/s. The resulting afflux is 0.826 m, giving design water level 100.326 m MSL.
Scour checks indicate mean scour depth 6.416 m and design scour 12.833 m. Froude number is 0.422, corresponding to Subcritical flow.
Hydraulic interpretation note: discharge continuity, resistance and flow-regime checks are treated together so that section sizing and hazard indicators remain engineering-consistent.
Submersible behavior is accepted by design, and overtopping-stage actions are controlled through anchorage, drag and substructure stability checks.
Open foundations for SBC 200.00 kPa at 92.00 m MSL; φ = 30.00°, γ = 18.00 kN/m³. Stability and stress checks on pier/abutment footing sheets govern.
Structural action path: load transfer from deck to pier/abutment is validated through reinforcement, stress distribution and foundation stability sheets before quantities are finalized.
Compliance traceability: every stated value is sourced from computed workbook fields so technical prose and design tables remain synchronized for audit, tender and proof-check use.
DESIGN STORY NOTE (Tech Report) - DESIGN OF SUBMERSIBLE BRIDGE
Hydraulic story: discharge 1,062.576 cumecs moving at 2.41 m/s across the adopted section produces afflux 0.826 m, design water level 100.326 m MSL, Froude number 0.422 and flow classification Subcritical.
Substructure story: design scour depth 12.833 m governs founding exposure, after which pier and abutment checks combine dead load, live load, water current, hydrostatic action, and buoyancy as applicable.
Pier verdict line: minimum sliding FOS 0.218, overturning FOS 0.709, and bearing FOS 2.26 from the generated load-case set. Check: Hence NOT O.K. - revise inputs/member sizes and re-verify.
Quantity and cost story: BOQ is not an isolated schedule; it is downstream of geometry, reinforcement and foundation dimensions already verified in the design sheets, so report language and estimated quantities remain traceable to the same numerical source.
Compliance traceability statement: this prose is generated from computed values to preserve one-to-one consistency between calculations, workbook sheets and report language.

```

## User 2: Kherwara worksheet (reference)

### TechNote Content
```text
TECHNICAL NOTE
This design is prepared in accordance with IRC:6-2017 (Loads and stresses), IRC:112-2015 (Concrete bridges), IRC:78-2014 (Foundations), IRC:SP:13 (Hydraulic design of bridges), and relevant Ministry of Road Transport and Highways circulars as applicable to the project.
For submersible configuration, overtopping behavior is intentionally considered and deck anchorage / drag resistance checks govern flood-stage safety.
Project framing: total bridge length 96.00 m with 12.00 span(s) at nominal span length 8.00 m and carriageway width 7.50 m.
Design discharge Q = 243.11 m³/s; HFL = 100.60 m MSL; bed level (working) = 96.60 m MSL; foundation level = 92.60 m MSL.
From the hydraulic design cycle, computed velocity is approximately 1.718 m/s, afflux is approximately 0.256 m, and design scour depth is approximately 4.80 m.
Flow interpretation: Froude-number-based regime classification is taken from the hydraulics engine output and used to judge whether flow is tranquil/subcritical or rapid/supercritical for design narration and review traceability.
The submersible deck is proportioned for controlled overtopping under flood loading with stability verification carried through pier and abutment checks.
Open foundations are designed for safe bearing capacity SBC = 150.00 kPa, soil friction angle φ = 30.00°, unit weight γ = 18.00 kN/m³. If field tests indicate weaker strata, revised bearing and stability checks shall be carried out.
Substructure storyline: pier, footing and abutment sheets carry the governing sliding, overturning, bearing and stress checks; any CHECK outcome must be treated as a mandatory engineering review checkpoint.
Execution note: this narrative is generated from computed variables to avoid manual rewriting and to preserve one-to-one consistency between design sheets, notes and report language.
DESIGN STORY NOTE (TechNote) - DESIGN OF SUBMERSIBLE BRIDGE
Design data: project Construction of Submersible Bridge on KHERWARA - JAWAS - SUVERI ROAD, location KM 9/000, KHERWARA - JAWAS - SUVERI ROAD, river SOM, total bridge length 96.00 m with 12 span(s) of 8.00 m and carriageway width 7.50 m.
Code basis: IRC:6 for load effects, IRC:112 for concrete design, IRC:78 for foundations, IRC:SP:13 for hydraulic interpretation, with overtopping accepted by design intent for submersible behavior.
Step 1 - hydraulic control variables are fixed from the same engine that drives the workbook: design discharge 243.11 cumecs, velocity 1.718 m/s, afflux 0.256 m, and design scour depth 4.80 m.
Step 2 - geotechnical basis is declared before any substructure verdict: SBC 150.00 kN/m2, phi 30.00 deg, gamma 18.00 kN/m3, foundation level 92.60 m MSL.
Step 3 - submersible flood story: deck may overtop, therefore drag, hydrostatic action, buoyancy, scour and base-pressure stability become the governing acceptance chain instead of fixed soffit clearance.
Narrative policy: every major sheet must read in the order design data -> engineering logic -> visible computed values -> pass/check verdict, so reviewers can follow the design without opening source code.

```

### Tech Report Content
```text
TECHNICAL REPORT
Project Name: Construction of Submersible Bridge on KHERWARA - JAWAS - SUVERI ROAD
Location: KM 9/000, KHERWARA - JAWAS - SUVERI ROAD
Bridge Type: Submersible Bridge
Total Length: 48 m
Width: 7.5 m
No. of Spans: 12
Hydraulic computations establish a design discharge of 243.11 m³/s with approach velocity 1.718 m/s. The resulting afflux is 0.256 m, giving design water level 100.856 m MSL.
Scour checks indicate mean scour depth 2.40 m and design scour 4.80 m. Froude number is 0.274, corresponding to Subcritical flow.
Hydraulic interpretation note: discharge continuity, resistance and flow-regime checks are treated together so that section sizing and hazard indicators remain engineering-consistent.
Submersible behavior is accepted by design, and overtopping-stage actions are controlled through anchorage, drag and substructure stability checks.
Open foundations for SBC 150.00 kPa at 92.60 m MSL; φ = 30.00°, γ = 18.00 kN/m³. Stability and stress checks on pier/abutment footing sheets govern.
Structural action path: load transfer from deck to pier/abutment is validated through reinforcement, stress distribution and foundation stability sheets before quantities are finalized.
Compliance traceability: every stated value is sourced from computed workbook fields so technical prose and design tables remain synchronized for audit, tender and proof-check use.
DESIGN STORY NOTE (Tech Report) - DESIGN OF SUBMERSIBLE BRIDGE
Hydraulic story: discharge 243.11 cumecs moving at 1.718 m/s across the adopted section produces afflux 0.256 m, design water level 100.856 m MSL, Froude number 0.274 and flow classification Subcritical.
Substructure story: design scour depth 4.80 m governs founding exposure, after which pier and abutment checks combine dead load, live load, water current, hydrostatic action, and buoyancy as applicable.
Pier verdict line: minimum sliding FOS 0.27, overturning FOS 0.856, and bearing FOS 1.702 from the generated load-case set. Check: Hence NOT O.K. - revise inputs/member sizes and re-verify.
Quantity and cost story: BOQ is not an isolated schedule; it is downstream of geometry, reinforcement and foundation dimensions already verified in the design sheets, so report language and estimated quantities remain traceable to the same numerical source.
Compliance traceability statement: this prose is generated from computed values to preserve one-to-one consistency between calculations, workbook sheets and report language.

```

## User 3: High-level slab bridge (starter)

### TechNote Content
```text
TECHNICAL NOTE
This design is prepared in accordance with IRC:6-2017 (Loads and stresses), IRC:112-2015 (Concrete bridges), IRC:78-2014 (Foundations), IRC:SP:13 (Hydraulic design of bridges), and relevant Ministry of Road Transport and Highways circulars as applicable to the project.
IRC:5-2015 (freeboard / vertical clearance) is additionally applied for deck level control in this high-level crossing.
Project framing: total bridge length 48.00 m with 4.00 span(s) at nominal span length 12.00 m and carriageway width 7.50 m.
Design discharge Q = 1,240.256 m³/s; HFL = 286.50 m MSL; bed level (working) = 281.20 m MSL; foundation level = 277.50 m MSL.
From the hydraulic design cycle, computed velocity is approximately 2.762 m/s, afflux is approximately 0.747 m, and design scour depth is approximately 21.554 m.
Flow interpretation: Froude-number-based regime classification is taken from the hydraulics engine output and used to judge whether flow is tranquil/subcritical or rapid/supercritical for design narration and review traceability.
Road top level RTL = 288.30 m MSL with deck soffit at 288.05 m MSL; available clearance above HFL is 1.20 m and above DWL is 0.803 m.
Open foundations are designed for safe bearing capacity SBC = 220.00 kPa, soil friction angle φ = 30.00°, unit weight γ = 18.00 kN/m³. If field tests indicate weaker strata, revised bearing and stability checks shall be carried out.
Substructure storyline: pier, footing and abutment sheets carry the governing sliding, overturning, bearing and stress checks; any CHECK outcome must be treated as a mandatory engineering review checkpoint.
Execution note: this narrative is generated from computed variables to avoid manual rewriting and to preserve one-to-one consistency between design sheets, notes and report language.
DESIGN STORY NOTE (TechNote) - DESIGN OF HIGH-LEVEL BRIDGE
Design data: project High Level Slab Bridge Template, location Fixture � high-level reference, river SAMPLE, total bridge length 48.00 m with 4 span(s) of 12.00 m and carriageway width 7.50 m.
Code basis: IRC:6 for load effects, IRC:112 for concrete design, IRC:78 for foundations, IRC:SP:13 for hydraulic interpretation, and IRC:5 style freeboard/clearance governance for high-level deck control.
Step 1 - hydraulic control variables are fixed from the same engine that drives the workbook: design discharge 1,240.256 cumecs, velocity 2.762 m/s, afflux 0.747 m, and design scour depth 21.554 m.
Step 2 - geotechnical basis is declared before any substructure verdict: SBC 220.00 kN/m2, phi 30.00 deg, gamma 18.00 kN/m3, foundation level 277.50 m MSL.
Step 3 - high-level clearance story: soffit 288.05 m MSL, available freeboard above HFL 1.55 m, governing required freeboard 1.20 m. Check: Hence O.K.
Narrative policy: every major sheet must read in the order design data -> engineering logic -> visible computed values -> pass/check verdict, so reviewers can follow the design without opening source code.

```

### Tech Report Content
```text
TECHNICAL REPORT
Project Name: High Level Slab Bridge Template
Location: Fixture � high-level reference
Bridge Type: Submersible Bridge
Total Length: 48 m
Width: 7.5 m
No. of Spans: 4
Hydraulic computations establish a design discharge of 1,240.256 m³/s with approach velocity 2.762 m/s. The resulting afflux is 0.747 m, giving design water level 287.247 m MSL.
Scour checks indicate mean scour depth 10.777 m and design scour 21.554 m. Froude number is 0.383, corresponding to Subcritical flow.
Hydraulic interpretation note: discharge continuity, resistance and flow-regime checks are treated together so that section sizing and hazard indicators remain engineering-consistent.
Deck soffit and freeboard are controlled as high-level crossing criteria; IRC:5-2015 style vertical clearance checks are explicitly included with hydraulics outputs.
Open foundations for SBC 220.00 kPa at 277.50 m MSL; φ = 30.00°, γ = 18.00 kN/m³. Stability and stress checks on pier/abutment footing sheets govern.
Structural action path: load transfer from deck to pier/abutment is validated through reinforcement, stress distribution and foundation stability sheets before quantities are finalized.
Compliance traceability: every stated value is sourced from computed workbook fields so technical prose and design tables remain synchronized for audit, tender and proof-check use.
DESIGN STORY NOTE (Tech Report) - DESIGN OF HIGH-LEVEL BRIDGE
Hydraulic story: discharge 1,240.256 cumecs moving at 2.762 m/s across the adopted section produces afflux 0.747 m, design water level 287.247 m MSL, Froude number 0.383 and flow classification Subcritical.
Substructure story: design scour depth 21.554 m governs founding exposure, after which pier and abutment checks combine dead load, live load, water current, hydrostatic action, and buoyancy as applicable.
Pier verdict line: minimum sliding FOS 0.097, overturning FOS 0.217, and bearing FOS 1.92 from the generated load-case set. Check: Hence NOT O.K. - revise inputs/member sizes and re-verify.
Quantity and cost story: BOQ is not an isolated schedule; it is downstream of geometry, reinforcement and foundation dimensions already verified in the design sheets, so report language and estimated quantities remain traceable to the same numerical source.
Compliance traceability statement: this prose is generated from computed values to preserve one-to-one consistency between calculations, workbook sheets and report language.

```

