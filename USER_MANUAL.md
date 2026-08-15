# Bridge Slab Design System - User Manual

Welcome to the Submersible Bridge Slab Design System! This manual provides a quick guide on how to navigate the system and generate complete engineering designs.

## 1. Getting Started
1. **Launch the Dashboard**: Start the development server using `npm run dev` and navigate to `http://localhost:5000`.
2. **Select a Mode**: Choose between creating a new custom design or using one of the quick start templates.

## 2. Using Quick Templates
The quickest way to see the system in action is to use the provided templates:
- **Larathi / Som**: Uses canonical values for a fully comprehensive submersible design.
- **High-level Slab Bridge**: Useful for dual-mode high-level starter decks.
- **Small, Medium, Large Bridges**: Standardized typical layouts based on standard span configurations.

## 3. Creating a Custom Design
1. Go to the **Design** tab.
2. Enter your project details:
   - River/Bridge name.
   - Geometry (Spans, carriage width, skew).
   - Hydraulics (HFL, bed levels, discharge, Manning's N).
   - Geotech (Bearing capacity, concrete/steel grades).
3. The system validates all inputs in real-time according to IRC standards.

## 4. Generating Outputs
Once your design is validated, you can click:
- **Download Excel**: Generates a 46+ sheet engineering workbook complete with all mathematical formulas and dynamic inter-sheet cell wiring.
- **Generate Drawing / PDF**: Generates DXF/PDF sketches of the GAD, Pier, and Abutment cross-sections based on your parameters.

## Note on Video Guides
Since this application runs in your local development environment, the best way to get a video walkthrough is to utilize the AI Browser Subagent to perform an automated test loop (e.g., "test run the app as five distinct users"). It will automatically record a `.webp` video artifact that demonstrates the interface.
