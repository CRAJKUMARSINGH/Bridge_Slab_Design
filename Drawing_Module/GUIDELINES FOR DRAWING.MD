# GUIDELINES FOR DRAWING (ABSOLUTE ASSUMPTIONS)

This document frames the canonical engineering and visual standards for the Bridge Drawing Module. All SVG rendering components MUST adhere to these absolute assumptions to ensure design consistency and engineering audit-readiness.

## §1. DATUM & COORDINATE SYSTEM
- **Vertical Baseline**: All elevations are based on **Reduced Levels (RL)** in meters Above Mean Sea Level (AMSL).
- **Coordinate Mapping**: 
  - `x = (chainage - originChainage) * S` (where S is the horizontal scale factor).
  - `y = (datumRL - currentRL) * S` (where S is the vertical scale factor).
- **Origin**: The left side of the drawing border represents `Origin Chainage - 10.0m`.

## §2. TOPOGRAPHY & GROUND LEVELS (NGL)
- **Natural Ground Level (NGL)**: MUST be derived using **Linear Interpolation** from the `crossSectionData` array at any specific chainage point.
- **GAD Ground Profile**: Rendered as a continuous dashed polyline (`COLORS.GROUND`) following the interpolated NGL at $1\text{m}$ intervals.
- **Abutment NGL**: Same set of levels presumed for both A1 and A2.
- **Pier NGL**: Linked to the exact chainage of the pier shaft centerline.

## §3. STRUCTURAL GEOMETRY ASSUMPTIONS
- **Wearing Coat**: Fixed at $75\text{mm}$ thickness ($0.075\text{m}$) unless explicitly overridden.
- **PCC Blinding**: Fixed at $150\text{mm}$ ($0.15\text{m}$) below RCC footings.
- **Approach Slabs**: Presumed length of $3.5\text{m}$ at both ends of the bridge.
- **Symmetry**: A1 and A2 abutments are geometrically identical unless separate left/right design results are provided.

## §4. REINFORCEMENT & COVER
- **Concrete Cover**:
  - **Superstructure/Slab**: $40\text{mm}$
  - **Substructure (Pier/Abutment)**: $50\text{mm}$
  - **Foundations**: $75\text{mm}$
- **Lap Length**: $50 \times \text{Diameter}$ of the bar.
- **Bent-up Bars**: $45^\circ$ crank angle for shear resistance.

## §5. VISUAL & CAD STANDARDS
- **Line Weights**:
  - `Heavy (0.8pt)`: Structural outlines (Concrete).
  - `Mid (0.5pt)`: Foundation outlines, axis lines.
  - `Thin (0.3pt)`: Hatching, dimension lines, reinforcement.
- **Color Palette**:
  - `COLORS.STRUCTURE`: `#2C3E50` (Deep Blue)
  - `COLORS.GROUND`: `#6D4C41` (Soil Brown)
  - `COLORS.WATER`: `#039BE5` (River Blue)
- **Hatch Patterns**:
  - Concrete: `p-conc` (Standard dots/triangles)
  - Earth/Backfill: `p-earth` (Diagonal dashes)
  - Foundation Strata: `p-rock`, `p-gravel`, `p-clay`.

## §6. UI & WIRING PROTOCOL
- **Source of Truth**: All data MUST be consumed from the `useDesignStore().results` hook.
- **Redundancy Policy**: Delete any `.old`, `.bak`, or duplicate `.tsx` files in the `Drawing*` folders. The `Drawing_Module` is the single source of truth.
