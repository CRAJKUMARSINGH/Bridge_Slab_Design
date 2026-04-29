# STORY TELLING REQUIREMENT (LATEST DECISIONS)

## Mandate
Story telling is **mandatory for each nook and corner of the app** and **all workbook pages**.  
No sheet should remain purely tabular without engineering narrative context.

## Scope (Non-Negotiable)
- `TechNote` and `Tech Report` are mandatory narrative anchors and must carry full prose.
- Every generated Excel sheet must include a structured engineering story block.
- HTML report must include an engineering narrative section aligned with workbook language.

## Master Narrative Pattern
The reference pattern is the detailed pier stability style shared by the user (`DESIGN OF PIER AND CHECK FOR STABILITY- SUBMERSIBLE BRIDGE`) and must be followed in sequencing and tone.

Each sheet-level story should preserve this engineering flow:
1. `DESIGN DATA`
2. `A) DEAD LOAD CALCULATION`
3. `B) LIVE LOAD CALCULATION`
4. `C) LOADS DUE TO WATER CURRENT`
5. `D) SEISMIC CONDITION`
6. `E) WIND FORCE`
7. `BASE PRESSURE / STABILITY VERDICT`

## Dynamic Variable Binding (Mandatory)
Narrative must quote computed values (not placeholders), including where applicable:
- Design discharge `Q`
- `HFL`, bed level, foundation level, deck/soffit levels
- Velocity, afflux, design water level
- Froude number and interpreted flow regime
- Design scour depth
- SBC, soil friction angle (`phi`), unit weight (`gamma`)
- Dead/live/wind/current actions and governing moment/stress outcomes

## Bridge-Type Conditional Logic
- **Submersible:** narrative must explicitly describe overtopping intent, drag/buoyancy/current/stability governance.
- **High-Level:** narrative must explicitly describe freeboard/clearance compliance and IRC:5-2015 style checks.

## Quality Gates
- Any `CHECK`-type result is a mandatory engineering review stop-point.
- Only compliant combinations should read as `Hence O.K.` in narrative tone.
- No placeholder or invalid tokens (`NaN`, `[INSERT HERE]`, empty formulas) are allowed in narrative outputs.

## Certification Protocol
For certification runs, verify at least 3 distinct scenarios:
- Submersible baseline
- Submersible with different soil/hydraulic profile
- High-level bridge case

Extract and quote exact generated lines from:
- `TechNote`
- `Tech Report`
- One structural sheet (minimum: `STABILITY CHECK FOR PIER`)

End with explicit `PASS` / `FAIL` status and reasons.
