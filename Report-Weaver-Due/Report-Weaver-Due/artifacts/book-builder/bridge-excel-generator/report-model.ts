/**
 * REPORT MODEL
 * Flat map of id → { value, unit, formulaText, label }
 * Single source of truth for both Excel sheet writers and HTML/PDF reports.
 * Filled from calculateCompleteDesign() results.
 */

import type { EnhancedProjectInput } from './types';

export interface ReportCell {
  id: string;           // unique key, e.g. "hyd.area"
  label: string;        // human-readable label
  value: number | string;
  unit: string;
  formulaText?: string; // Excel formula string from formulas-*.json
  section: string;      // which sheet / section this belongs to
  row?: number;         // original Excel row (for ordering)
}

export type ReportModel = Record<string, ReportCell>;

/**
 * Build the report model from EnhancedProjectInput.
 * All values come from the engine — no recalculation here.
 */
export function buildReportModel(input: EnhancedProjectInput): ReportModel {
  const hyd  = input.hydraulics;
  const pier = input.pier;
  const abt  = input.abutmentType1;
  const est  = input.estimation;
  const model: ReportModel = {};

  const add = (cell: ReportCell) => { model[cell.id] = cell; };

  // ── PROJECT INFO ──────────────────────────────────────────────────────────
  add({ id: 'proj.name',     label: 'Project Name',          value: input.projectName,    unit: '',       section: 'Project' });
  add({ id: 'proj.location', label: 'Location',              value: input.location,       unit: '',       section: 'Project' });
  add({ id: 'proj.river',    label: 'River Name',            value: input.riverName,      unit: '',       section: 'Project' });

  // ── BRIDGE GEOMETRY ───────────────────────────────────────────────────────
  add({ id: 'geom.spans',    label: 'Number of Spans',       value: input.numberOfSpans,  unit: '',       section: 'Geometry' });
  add({ id: 'geom.spanL',    label: 'Span Length',           value: input.spanLength,     unit: 'm',      section: 'Geometry' });
  add({ id: 'geom.totalL',   label: 'Total Length',          value: input.totalLength,    unit: 'm',      section: 'Geometry' });
  add({ id: 'geom.width',    label: 'Carriageway Width',     value: input.carriageWidth,  unit: 'm',      section: 'Geometry' });

  // ── HYDRAULICS (formulas from formulas-hydraulics.json) ───────────────────
  add({ id: 'hyd.hfl',       label: 'H.F.L.',                value: input.hfl,            unit: 'm MSL',  section: 'HYDRAULICS', row: 4,
        formulaText: 'F4 = HFL (input)' });
  add({ id: 'hyd.bedLevel',  label: 'Bed Level',             value: input.bedLevel,       unit: 'm MSL',  section: 'HYDRAULICS' });
  add({ id: 'hyd.manningN',  label: "Manning's n",           value: input.manningN,       unit: '',       section: 'HYDRAULICS', row: 32,
        formulaText: 'C32 = n (input)' });
  add({ id: 'hyd.bedSlope',  label: 'Bed Slope (1 in X)',    value: input.bedSlope,       unit: '',       section: 'HYDRAULICS', row: 33,
        formulaText: "C33 = 'Bed Slope'!J24" });

  if (hyd) {
    add({ id: 'hyd.area',    label: 'Cross-Sectional Area (A)', value: +hyd.crossSectionalArea.toFixed(2), unit: 'm²', section: 'HYDRAULICS', row: 27,
          formulaText: 'F27 = SUM(F6:F26)' });
    add({ id: 'hyd.perim',   label: 'Wetted Perimeter (P)',     value: +hyd.wettedPerimeter.toFixed(2),    unit: 'm',  section: 'HYDRAULICS', row: 27,
          formulaText: 'G27 = SUM(G6:G26)' });
    add({ id: 'hyd.radius',  label: 'Hydraulic Radius (R)',     value: +hyd.hydraulicRadius.toFixed(3),    unit: 'm',  section: 'HYDRAULICS', row: 31,
          formulaText: 'C31 = C29/C30' });
    add({ id: 'hyd.vel',     label: 'Velocity (V)',             value: +hyd.velocity.toFixed(3),           unit: 'm/s', section: 'HYDRAULICS', row: 34,
          formulaText: 'C34 = (1/C32*(C31^(2/3))*((1/C33)^0.5))' });
    add({ id: 'hyd.Q',       label: 'Discharge (Q)',            value: +hyd.discharge.toFixed(2),          unit: 'm³/s', section: 'HYDRAULICS', row: 35,
          formulaText: 'C35 = C29*C34' });
    add({ id: 'hyd.regime',  label: 'Regime Width',             value: +hyd.regimeWidth.toFixed(2),        unit: 'm',  section: 'HYDRAULICS' });
    add({ id: 'hyd.scour',   label: 'Scour Depth (dsm)',        value: +hyd.scourDepth.toFixed(3),         unit: 'm',  section: 'HYDRAULICS' });
    add({ id: 'hyd.scour2',  label: 'Design Scour Depth (2×dsm)', value: +hyd.designScourDepth.toFixed(3), unit: 'm',  section: 'HYDRAULICS' });
    add({ id: 'hyd.froude',  label: 'Froude Number',            value: +hyd.froudeNumber.toFixed(4),       unit: '',   section: 'HYDRAULICS' });
    add({ id: 'hyd.flow',    label: 'Flow Type',                value: hyd.flowType,                       unit: '',   section: 'HYDRAULICS' });
  }

  // ── AFFLUX (formulas from formulas-afflux-calculation.json) ──────────────
  if (hyd) {
    add({ id: 'afl.afflux',  label: 'Afflux (h)',              value: +hyd.afflux.toFixed(3),             unit: 'm',  section: 'afflux calculation', row: 78,
          formulaText: 'B78 = ROUNDUP(((C13^2/17.85)+0.0152)*((C46/C77)^2-1),2)' });
    add({ id: 'afl.dwl',     label: 'Design Water Level',      value: +hyd.designWaterLevel.toFixed(3),   unit: 'm MSL', section: 'afflux calculation', row: 79,
          formulaText: 'F79 = B79+D79  (HFL + Afflux)' });
    add({ id: 'afl.scour',   label: 'Scour Depth (Lacey)',     value: +hyd.scourDepth.toFixed(2),         unit: 'm',  section: 'afflux calculation', row: 33,
          formulaText: 'B33 = ROUNDUP(1.34*(C32^2/G27)^(1/3),2)' });
  }

  // ── PIER ──────────────────────────────────────────────────────────────────
  if (pier) {
    add({ id: 'pier.w',      label: 'Pier Width',              value: pier.geometry.width,                unit: 'm',  section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.l',      label: 'Pier Length',             value: pier.geometry.length,               unit: 'm',  section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.d',      label: 'Pier Depth',              value: pier.geometry.depth,                unit: 'm',  section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.DL',     label: 'Dead Load',               value: +pier.loads.deadLoad.toFixed(1),    unit: 'kN', section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.LL',     label: 'Live Load',               value: +pier.loads.liveLoad.toFixed(1),    unit: 'kN', section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.hydro',  label: 'Hydrostatic Force',       value: +pier.loads.hydrostaticForce.toFixed(1), unit: 'kN', section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.drag',   label: 'Drag Force',              value: +pier.loads.dragForce.toFixed(1),   unit: 'kN', section: 'STABILITY CHECK FOR PIER' });
    add({ id: 'pier.buoy',   label: 'Buoyancy',                value: +pier.loads.buoyancy.toFixed(1),    unit: 'kN', section: 'STABILITY CHECK FOR PIER' });
    pier.loadCases.forEach(lc => {
      add({ id: `pier.lc${lc.caseNumber}.sliding`,     label: `Case ${lc.caseNumber} Sliding FOS`,     value: +lc.slidingFOS.toFixed(2),     unit: '≥1.5', section: 'STABILITY CHECK FOR PIER' });
      add({ id: `pier.lc${lc.caseNumber}.overturning`, label: `Case ${lc.caseNumber} Overturning FOS`, value: +lc.overturningFOS.toFixed(2), unit: '≥1.8', section: 'STABILITY CHECK FOR PIER' });
      add({ id: `pier.lc${lc.caseNumber}.bearing`,     label: `Case ${lc.caseNumber} Bearing FOS`,     value: +lc.bearingFOS.toFixed(2),     unit: '≥2.5', section: 'STABILITY CHECK FOR PIER' });
      add({ id: `pier.lc${lc.caseNumber}.status`,      label: `Case ${lc.caseNumber} Status`,          value: lc.status,                     unit: '',     section: 'STABILITY CHECK FOR PIER' });
    });
  }

  // ── ABUTMENT (TYPE1) ──────────────────────────────────────────────────────
  if (abt) {
    add({ id: 'abt.H',       label: 'Abutment Height',         value: abt.geometry.height,                unit: 'm',  section: 'TYPE1-STABILITY CHECK ABUTMENT' });
    add({ id: 'abt.t',       label: 'Stem Width',              value: abt.geometry.width,                 unit: 'm',  section: 'TYPE1-STABILITY CHECK ABUTMENT' });
    add({ id: 'abt.B',       label: 'Base Width',              value: abt.geometry.baseWidth,             unit: 'm',  section: 'TYPE1-STABILITY CHECK ABUTMENT' });
    add({ id: 'abt.Ka',      label: 'Ka (Rankine)',            value: +abt.earthPressure.ka.toFixed(4),   unit: '',   section: 'TYPE1-STABILITY CHECK ABUTMENT',
          formulaText: 'Ka = tan²(45° - φ/2)' });
    add({ id: 'abt.Pa',      label: 'Active Earth Pressure',   value: +abt.earthPressure.pa.toFixed(2),   unit: 'kN/m', section: 'TYPE1-STABILITY CHECK ABUTMENT',
          formulaText: 'Pa = 0.5 × Ka × γ × H²' });
  }

  // ── ESTIMATION ────────────────────────────────────────────────────────────
  if (est) {
    add({ id: 'est.conc.m25',  label: 'Concrete M25',          value: est.quantities.concrete.m25,        unit: 'm³', section: 'ESTIMATION' });
    add({ id: 'est.conc.m30',  label: 'Concrete M30',          value: est.quantities.concrete.m30,        unit: 'm³', section: 'ESTIMATION' });
    add({ id: 'est.conc.m35',  label: 'Concrete M35',          value: est.quantities.concrete.m35,        unit: 'm³', section: 'ESTIMATION' });
    add({ id: 'est.steel',     label: 'Total Steel',           value: est.quantities.steel.total,         unit: 'MT', section: 'ESTIMATION' });
    add({ id: 'est.formwork',  label: 'Formwork',              value: est.quantities.formwork,            unit: 'm²', section: 'ESTIMATION' });
    add({ id: 'est.excav',     label: 'Excavation',            value: est.quantities.excavation.total,    unit: 'm³', section: 'ESTIMATION' });
    add({ id: 'est.subtotal',  label: 'Subtotal',              value: est.cost.subtotal,                  unit: '₹',  section: 'ESTIMATION' });
    add({ id: 'est.profit',    label: "Contractor's Profit",   value: est.cost.profit,                    unit: '₹',  section: 'ESTIMATION' });
    add({ id: 'est.overhead',  label: 'Overhead',              value: est.cost.overhead,                  unit: '₹',  section: 'ESTIMATION' });
    add({ id: 'est.gst',       label: 'GST (18%)',             value: est.cost.gst,                       unit: '₹',  section: 'ESTIMATION' });
    add({ id: 'est.total',     label: 'Grand Total',           value: est.cost.total,                     unit: '₹',  section: 'ESTIMATION' });
    add({ id: 'est.perRm',     label: 'Cost per Running Metre', value: est.cost.ratePerMeter,             unit: '₹/Rm', section: 'ESTIMATION' });
  }

  return model;
}

/** Get all cells for a given section, sorted by row */
export function getSectionCells(model: ReportModel, section: string): ReportCell[] {
  return Object.values(model)
    .filter(c => c.section === section)
    .sort((a, b) => (a.row ?? 999) - (b.row ?? 999));
}

/** Get a single cell value by id, with fallback */
export function getCell(model: ReportModel, id: string): ReportCell | undefined {
  return model[id];
}
