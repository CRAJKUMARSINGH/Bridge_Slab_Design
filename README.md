# CURSOR SLAB DESIGN

[![Engineering Status](https://img.shields.io/badge/Status-W16_Unified_Merge-green.svg)](#programme-status)
[![IRC Compliance](https://img.shields.io/badge/Standards-IRC:6_|_IRC:78_|_IRC:112-blue.svg)](#engineering-standards)
[![Build Status](https://img.shields.io/badge/QA-Pass_(31_Tests)-brightgreen.svg)](#regression-testing)
[![User Manual](https://img.shields.io/badge/Docs-User_Manual-orange.svg)](USER_MANUAL.md)

> **Welcome Engineers!** Ready to cut your submersible bridge design time from weeks to minutes? CURSOR SLAB DESIGN’s automated generation engine instantly maps complex geometry inputs into audit-ready, IRC-compliant 53-sheet workbooks. Try out our visual dashboard below!

A professional-grade engineering suite for the automated design and documentation of submersible high-level slab bridges. This tool transforms complex IRC-standard calculations into audit-ready 53-sheet Excel workbooks, high-fidelity DXF drawings, and narrative engineering dossiers.

---

## 🚀 Quick Start (Video-Style Guide)

### 1. Installation & Environment Setup
Clone the repository and install the engineering dependencies.
```bash
# Install Node.js 20+ and npm 9+ first
npm install
```

### 2. Launch the Design Dashboard
Start the development server to access the interactive web interface.
```bash
npm run dev
# Dashboard available at: http://localhost:5000
```

### 3. Configure Design Parameters
Open the UI and navigate to the **Design** page.
- **Hydraulics**: Enter Discharge (Q), Bed Level, and HFL.
- **Structural**: Select Slab Thickness and Material Grades (M25/Fe500).
- **Model Selection**: Switch between **Model A** and **Model B** for performance comparison.

### 4. Verify & Export
- **Live Checks**: Monitor real-time visualizations for Scour Depth and Afflux.
- **Export**: Click the action buttons (20+ formats) to generate:
    - 📄 **Excel**: 53-sheet complete design workbook.
    - 📐 **DXF**: Professional CAD drawings with 16 engineering layers.
    - 📖 **PDF/HTML**: Narrative report with step-by-step prose derivations.

---

## 🛠 Core Capabilities

### 📊 Automated Workbook Generation
Generates a complete 53-sheet professional workbook including:
- **Hydraulics**: Manning’s formula, Lacey scour, and Molesworth afflux calculations.
- **Pier Stability**: 5-case analysis (Normal, HFL, Full Submersion, Buoyancy cases).
- **Abutment Design**: Support for Type1 and C1 profiles with earth pressure (Ka/Pa) analysis.
- **Structural**: Slab design compliant with IRC:21-2000 / IRC:112.
- **Estimation**: Detailed Quantity takeoff and BOQ roll-up.

### 🎨 Professional DXF Engine
- **CAD Standard**: AutoCAD-compatible export (AC1021) with dynamic levels for HFL, Scour, and Bed.
- **Multi-Unit**: Support for both Meters (m) and Millimeters (mm).
- **Engineering Layers**: Dedicated layers for dimensions, hatching, and text annotations.

### 🧪 Engineering Rigor
- **Structural Standards**: IRC SP-13 (Hydraulics), IRC:6 (Loads), IRC:78 (Foundations), IRC:112 (Concrete).
- **Dual-Model Trial**: Interactive selection for Model A vs Model B with persistent trial state.
- **Narrative Storytelling**: Report prose designed for "spoon-fed" engineering transparency.

---

## 🏗 Technology Stack

- **Frontend**: React + Vite + Tailwind (Internal Components)
- **Backend**: Node.js + Express (REST API)
- **Engine**: TypeScript Structural Calculation Core
- **Logging**: Pino Structured Logging
- **Testing**: Vitest Suite (31 unit & regression tests)
- **Excel**: ExcelJS with dynamic formula wiring

---

## 🚦 Programme Status

| Milestone | Status | Details |
|---|---|---|
| **W16 (Post-v1)** | ✅ Complete | Unified Merge (Repo A + Repo B) finalized. |
| **QA Verification** | 🟢 Pass | `npm run qa` passing with 31 tests. |
| **Calculations** | 🛠 Validated | Scour (2.0×), IRC:66 stresses corrected. |
| **Model Selection** | ⏱ Trial | Active 1-month trial (April-May 2026). |

---

## 🧪 Regression Testing

Run the full verification suite before any commit:
```bash
npm run qa
```
- `verify:engine`: Validates hydraulics core against Kherwara golden snapshots.
- `verify:excel`: Checks cross-sheet formula wiring and BOQ roll-up.
- `test:excel`: Generates `TEST_CURRENT_OUTPUT.xlsx` for manual inspection.

---

## 📄 Documentation

- [`AGENTS.md`](AGENTS.md): Binding specification and contributor guidelines.
- [`docs/milestones/STATUS.md`](docs/milestones/STATUS.md): Current development status and blockers.
- [`docs/OPERATOR_NOTE.md`](docs/OPERATOR_NOTE.md): Command reference and golden test values.
- [`docs/PHASE_ZERO_READ_PIPELINE.md`](docs/PHASE_ZERO_READ_PIPELINE.md): Data extraction logic for reference workbooks.

---

## ⚖️ License & Compliance
This software is built for professional engineering use and requires validation by a licensed Structural Engineer. Compliance with **IRC:6-2016** and **IRC:112-2011** is maintained by the design engine core.
