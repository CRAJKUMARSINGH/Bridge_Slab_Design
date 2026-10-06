/**
 * New sheet generators — BATCH A (Admin & Substructure)
 *   DESIGN CRITERIA          (Sheet 2)
 *   INPUT DATA SUMMARY       (Sheet 3)
 *   SEISMIC ANALYSIS         (Sheet 11, IS:1893)
 *   WIND LOAD ANALYSIS       (Sheet 12, IS:875 / IRC:6 §209)
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import {
  addSectionDivider,
  addSubheader,
  addTableHeader,
  addTableRow,
  addTitle,
  setCellValue,
  setColumnWidths,
  styleHeader,
  COLORS,
} from '../utils';

const { SEISMIC_ZONE_FACTOR = { 2: 0.1, 3: 0.16, 4: 0.24, 5: 0.36 } }: any = {
  SEISMIC_ZONE_FACTOR: { 2: 0.1, 3: 0.16, 4: 0.24, 5: 0.36 },
};

// ---------------------------------------------------------------------------
// DESIGN CRITERIA — Sheet 2
// ---------------------------------------------------------------------------
export async function generateDesignCriteriaSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('DESIGN CRITERIA');
  setColumnWidths(ws, [44, 32, 32, 32]);

  addTitle(ws, 1, 'DESIGN CRITERIA & GOVERNING STANDARDS', 14, 1, 4);
  addTitle(ws, 2, input.projectName, 11, 1, 4);
  setCellValue(ws, 3, 1, `Job No : ${input.jobNumber ?? '—'}`);
  setCellValue(ws, 3, 3, `Date : ${new Date().toISOString().slice(0, 10)}`);

  styleHeader(ws, 5, 'A — PROJECT & AUTHORITY', 1, 4);
  const authRows = [
    ['Project Name', input.projectName, 'Location', input.location],
    ['River / Nallah', input.riverName, 'Issuing Authority', input.issuingAuthority ?? '—'],
    ['Job Number', input.jobNumber ?? '—', 'Bridge Type', (input.bridgeType ?? 'submersible') === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge'],
    ['Spans (nos × m)', `${input.numberOfSpans} × ${input.spanLength}`, 'Total Length (m)', input.totalLength.toFixed(2)],
    ['Carriageway (m)', input.carriageWidth.toFixed(2), 'Lanes', (input.numberOfLanes ?? 2).toString()],
  ];
  addTableHeader(ws, 6, ['Field', 'Value', 'Field', 'Value']);
  authRows.forEach((row, i) => addTableRow(ws, 7 + i, row));
  let r = 7 + authRows.length;

  r += 1;
  styleHeader(ws, r, 'B — GOVERNING CODES & STANDARDS', 1, 4);
  r += 1;
  addSubheader(ws, r, 'IRC (Indian Road Congress)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['Code', 'Title', 'Key Clauses Used', 'Section']);
  r += 1;
  const ircRows: Array<[string, string, string, string]> = [
    ['IRC:6-2017', 'Standard Specifications & Code of Practice for Road Bridges, Section II — Loads & Stresses', '§102 Materials, §200 Load combinations, §205 Impact, §206 Braking, §208 Buoyancy, §209 Wind, §210 Bearings, §211 Deck drainage & Joints, §212 Earth pressure (EP=1.5 for abutment Case 3/5 flood / ULS per hard constraint), §214 Seismic', 'Materials / Loads'],
    ['IRC:112-2015', 'Code of Practice for Concrete Road Bridges (Limit State Design)', '§1 Scope & responsibility, §1.2 Engineer sign-off, §1.3 Partial factors γc=1.5, γs=1.15, §5–§6 Materials, §7 ULS/SLS, §7.4 Deflection, §7.6 Crack width, §11.5 Approach slab, §16 Documentation', 'Design Basis'],
    ['IRC:78-2000', 'Standard Specifications & Code of Practice for Road Bridges, Section VII — Bearings', '§300 Types, §303.2.1 Compression, §303.2.2 Shear strain, §303.2.3 Rotation check for elastomeric pads', 'Bearings'],
    ['IRC:SP:13-2008', 'Guidelines for the Design of Highway Submersible Bridges', 'Appendix C — Skew ≥ 45° requires Engineer sign-off; Table 3 — Skew de-rating bands', 'Skew / Submersible'],
    ['MORTH 5th Rev', 'Specifications for Road & Bridge Works (MoRTH, GoI)', '§506.2.1 Strip-seal expansion joints, §506.2.3 Deck outlets / scuppers, §1200 Records & drawings', 'Works / Joints'],
  ];
  ircRows.forEach((row) => { addTableRow(ws, r, row); r += 1; });
  r += 1;
  addSubheader(ws, r, 'IS (Bureau of Indian Standards)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['Code', 'Title', 'Key Clauses Used', 'Section']);
  r += 1;
  const isRows: Array<[string, string, string, string]> = [
    ['IS 456:2000', 'Plain & Reinforced Concrete — Code of Practice', '§5.1.2 Ec = 5000√fck, §22 Analysis, §24 Deflection, §26 Reinforcement (§26.2 Ld, §26.5 spacing), Annex B L/d ratios, Table 6 limiting L/d, Table 26.2 bond τbd', 'Concrete Design'],
    ['IS 1893 (Part 1):2002', 'Criteria for Earthquake Resistant Design of Structures — General Provisions & Buildings', '§5 Lateral loads, §6.4.2 Zone factor Z / Importance I / R-factor, §7.3.1 0.5×LL in base shear, §7.10 Ordinary RC SMRF (R=3)', 'Seismic'],
    ['IS 875 (Part 3):1987', 'Code of Practice for Design Loads (Other Than Earthquake) for Buildings and Structures — Part 3 Wind Loads', '§5.3 Basic wind Vb, §5.4 k1/k2/k3 coefficients, §6.1 Pressure pz = 0.6 Vz²', 'Wind'],
  ];
  isRows.forEach((row) => { addTableRow(ws, r, row); r += 1; });

  r += 1;
  styleHeader(ws, r, 'C — MATERIALS & PARTIAL FACTORS', 1, 4);
  r += 1;
  const matRows = [
    [`Concrete — Deck / Pier / Abutment`, `${input.concreteGradeDeck ?? input.concreteGrade} / ${input.concreteGradePier ?? input.concreteGrade} / ${input.concreteGradeAbutment ?? input.concreteGrade}`, 'Concrete — Foundation', input.concreteGradeFoundation ?? 'M25'],
    [`Characteristic fck (MPa)`, input.fck.toFixed(0), 'Partial γc (IRC:112-2015 §1.3)', '1.50'],
    [`Steel Grade`, input.steelGrade, 'Characteristic fy (MPa)', input.fy.toFixed(0)],
    [`Partial γs (IRC:112-2015 §1.3)`, '1.15', 'Wearing Coat Concrete', input.concreteGradeWearing ?? 'M35'],
    [`Soil γ (kN/m³)`, (input.gamma).toFixed(2), 'Angle of internal friction φ (°)', input.phi.toFixed(1)],
    [`Safe Bearing Capacity (kPa)`, input.sbc.toFixed(0), 'Manning n (rugosity)', input.manningN.toFixed(3)],
  ];
  addTableHeader(ws, r, ['Parameter', 'Value', 'Parameter', 'Value']);
  r += 1;
  matRows.forEach((row) => { addTableRow(ws, r, row); r += 1; });

  r += 1;
  styleHeader(ws, r, 'D — LOAD & ENVIRONMENTAL CRITERIA', 1, 4);
  r += 1;
  const loadRows: Array<[string, string, string, string]> = [
    ['Seismic Zone (IS 1893)', `Zone ${input.seismicZone ?? 3}`, 'Importance I', '1.0 (Ordinary bridge)'],
    ['Response Reduction R', '3.0 (SMRF Ordinary)', 'Zone Factor Z', `${(SEISMIC_ZONE_FACTOR as any)[input.seismicZone ?? 3] ?? 0.16}`],
    ['Design Wind Vb (m/s)', `${input.designWindSpeed ?? 33}`, 'Exposure Cat / Terrain', 'Cat 2 — Open flat (k2=1.0)'],
    ['Return Period k1 / Topo k3', '1.00 / 1.00', 'Live Load Class', 'IRC Class A tracked + 70R wheeled'],
    ['Earth Pressure EP abutment (IRC:6-2016 §212)', 'ka = 1.5 × Coulomb active (Case 3 flood / Case 5 ULS)', 'Surcharge on backfill (kPa)', '12.5 kPa (HSM §3.2 equivalent)'],
    ['Freeboard above HFL (m)', `≥ 1.0 per IRC:6 §112.3`, 'Design ΔT for joints (°C)', '35 (IRC:6-2017 §211.2)'],
  ];
  addTableHeader(ws, r, ['Parameter', 'Value / Rule', 'Parameter', 'Value / Rule']);
  r += 1;
  loadRows.forEach((row) => { addTableRow(ws, r, row); r += 1; });

  r += 1;
  styleHeader(ws, r, 'E — STABILITY / ULS / SLS ACCEPTANCE LIMITS', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['Check', 'Limit', 'Reference', 'Governs']);
  r += 1;
  const limitRows = [
    ['Sliding Factor of Safety', '≥ 1.50', 'IRC:6-2017 §114 & IRC:112 §7.3.2', 'Pier & Abutment'],
    ['Overturning Factor of Safety', '≥ 1.80', 'IRC:6-2017 §114', 'Pier & Abutment'],
    ['Bearing (max base pressure) FOS', '≥ 2.50 vs SBC', 'IRC:78 §303 + IS 1893 §7.12', 'Footings'],
    ['Eccentricity e = M/V', '≤ L/6 (tension free base preferred)', 'IRC:6-2017 §113', 'Footings'],
    ['Deck slab Deflection SLS', '≤ L / 350 (total long term)', 'IRC:112-2015 §7.4.2(b)', 'Superstructure'],
    ['Crack width SLS', '≤ 0.30 mm (XS1 / XS2 exposure)', 'IRC:112-2015 Table 7.3, §7.6.3', 'All RC members'],
    ['Development length Ld', 'φ·fy / (4·τbd) IS 456 §26.2', 'IS 456:2000 §26.2, IRC:112 §6.8', 'Reinforcement'],
    ['Minimum Scour below bed (2×dsm)', '≥ 2·Lacey dsm per IRC:78 §105', 'IRC:78 §105 + IRC HFL + Afflux rules', 'Substructure'],
  ];
  limitRows.forEach((row) => { addTableRow(ws, r, row); r += 1; });

  r += 1;
  addSectionDivider(ws, r, `Prepared by Automated Design Engine · Issuing Authority: ${input.issuingAuthority ?? '—'}`);
}

// ---------------------------------------------------------------------------
// INPUT DATA SUMMARY — Sheet 3
// ---------------------------------------------------------------------------
export async function generateInputDataSummarySheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('INPUT DATA SUMMARY');
  setColumnWidths(ws, [8, 36, 22, 22, 8, 36, 22, 22]);

  addTitle(ws, 1, 'TABULATED INPUT DATA SUMMARY', 14, 1, 8);
  addTitle(ws, 2, input.projectName, 11, 1, 8);
  setCellValue(ws, 3, 1, `Source: Robotic Generator (deterministic) + optional seed override`);
  setCellValue(ws, 3, 5, `Date: ${new Date().toISOString().slice(0, 10)}`);

  const sections: Array<[string, Array<[string, string | number]>]> = [
    ['A — GEOMETRY', [
      ['Span Length (m)', input.spanLength],
      ['Number of Spans', input.numberOfSpans],
      ['Total Length (m)', input.totalLength],
      ['Carriageway Width (m)', input.carriageWidth],
      ['Number of Lanes', input.numberOfLanes ?? 2],
      ['Skew Angle (°)', input.skew ?? 0],
      ['Deck Slab Thickness (m)', input.deckSlabThickness ?? 0.25],
    ]],
    ['B — LEVELS (m MSL)', [
      ['Road Top Level RTL', input.rtl],
      ['Deck Soffit Level (est.)', input.deckSoffitLevel ?? 0],
      ['Average Ground Level AGL', input.agl],
      ['High Flood Level HFL', input.hfl],
      ['Ordinary Flood Level OFL', input.ofl],
      ['Normal Bed Level NBL', input.nbl],
      ['Design Water Level DWL', input.dwl],
      ['Average Bed Level', input.bedLevel],
      ['Foundation Level', input.foundationLevel],
      ['Freeboard above HFL (m)', input.freeboardAboveHfl ?? 0],
    ]],
    ['C — HYDRAULICS', [
      ['Design Discharge Q (m³/s)', input.discharge],
      ['Manning n', input.manningN],
      ['Bed Slope (1-in-N denom.)', input.bedSlope],
      ['Lacey Silt Factor f', input.laceysSiltFactor],
      ['Cross-Section Points', input.crossSectionData.length],
    ]],
    ['D — SOIL & FOUNDATION', [
      ['SBC (kPa)', input.sbc],
      ['Friction Angle φ (°)', input.phi],
      ['Soil γ (kN/m³)', input.gamma],
      ['Hard Rock at site?', input.hardRockAvailable ? 'Yes (3.0 m below bed)' : 'No'],
    ]],
    ['E — MATERIALS', [
      ['Concrete Grade', input.concreteGrade],
      ['Characteristic fck (MPa)', input.fck],
      ['Steel Grade', input.steelGrade],
      ['Characteristic fy (MPa)', input.fy],
      ['Concrete — Foundation', input.concreteGradeFoundation ?? '—'],
      ['Concrete — Deck', input.concreteGradeDeck ?? '—'],
      ['Concrete — Wearing', input.concreteGradeWearing ?? '—'],
    ]],
    ['F — SUBSTRUCTURE SIZING', [
      ['Pier Width (m)', input.pierWidth],
      ['Pier Length (m)', input.pierLength],
      ['Pier Depth (m)', input.pierDepth],
      ['Pier Base Width (m)', input.pierBaseWidth],
      ['Pier Base Length (m)', input.pierBaseLength],
      ['No. of Piers', input.numberOfPiers],
      ['Abutment Height (m)', input.abutmentHeight],
      ['Abutment Width (m)', input.abutmentWidth],
      ['Dirt Wall Height (m)', input.dirtWallHeight],
      ['Return Wall Length (m)', input.returnWallLength],
    ]],
    ['G — ENVIRONMENTAL', [
      ['Seismic Zone (IS 1893)', `Zone ${input.seismicZone ?? 3}`],
      ['Design Wind Speed Vb (m/s)', input.designWindSpeed ?? 33],
      ['Issuing Authority', input.issuingAuthority ?? '—'],
      ['Job Number', input.jobNumber ?? '—'],
    ]],
  ];

  let r = 5;
  sections.forEach(([header, rows]) => {
    styleHeader(ws, r, header, 1, 8);
    r += 1;
    addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Unit', '#', 'Parameter', 'Value', 'Unit']);
    r += 1;
    // pack two rows of the section into one 8-col row.
    for (let i = 0; i < rows.length; i += 2) {
      const left = rows[i];
      const right = rows[i + 1];
      addTableRow(ws, r, [
        (i / 2 + 1).toString(),
        left[0], typeof left[1] === 'number' ? left[1].toFixed(3).replace(/\.?0+$/, '') : String(left[1]),
        guessUnit(left[0]),
        right ? ((i + 1) / 2 + 1).toString() : '',
        right ? right[0] : '',
        right ? (typeof right[1] === 'number' ? right[1].toFixed(3).replace(/\.?0+$/, '') : String(right[1])) : '',
        right ? guessUnit(right[0]) : '',
      ]);
      r += 1;
    }
    r += 1;
  });

  function guessUnit(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('level') || n.includes('length') || n.includes('width') || n.includes('thickness') || n.includes('height') || n.includes('depth') || n.includes('distance')) return 'm / m MSL';
    if (n.includes('area')) return 'm²';
    if (n.includes('volume') || n.includes('discharge')) return 'm³/s';
    if (n.includes('pressure') || n.includes('sbc') || n.includes('stress')) return 'kPa / MPa';
    if (n.includes('weight') || n.includes('γ') || n.includes('gamma')) return 'kN/m³';
    if (n.includes('force') || n.includes('load')) return 'kN';
    if (n.includes('angle') || n.includes('skew') || n.includes('φ') || n.includes('phi')) return '°';
    if (n.includes('time') || n.includes('date')) return '—';
    if (n.includes('speed')) return 'm/s';
    if (n.includes('points')) return 'count';
    return '—';
  }
}

// ---------------------------------------------------------------------------
// SEISMIC ANALYSIS (IS:1893) — Sheet 11
// ---------------------------------------------------------------------------
export async function generateSeismicAnalysisSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('SEISMIC ANALYSIS (IS 1893)');
  setColumnWidths(ws, [6, 42, 20, 22]);

  addTitle(ws, 1, 'SEISMIC ANALYSIS — IS 1893 (Part 1):2002', 14, 1, 4);
  addTitle(ws, 2, input.projectName, 11, 1, 4);
  setCellValue(ws, 3, 1, 'Governing clauses: §6.4.2 Z / I / R, §7.3.1 base shear with 0.5×LL, §7.10 Ordinary SMRF (R=3, I=1)');
  setCellValue(ws, 3, 3, `Zone: ${input.seismicZone ?? 3}`);

  const zone = input.seismicZone ?? 3;
  const Z = (SEISMIC_ZONE_FACTOR as any)[zone] ?? 0.16;
  const I = 1.0; // Importance factor — ordinary bridge per Table 6
  const R = 3.0; // Response reduction — ordinary RC SMRF §7.10.2
  const Ct = 0.075; // m^(-0.25) for RC moment frame Table 5
  const h = input.abutmentHeight > 0 ? input.abutmentHeight : (input.rtl - input.foundationLevel);
  const T = Ct * Math.pow(h, 0.75);

  // IS 1893 Table 4 — Rock/Soil Type II (medium soil assumed for river alluvium)
  // Sa/g = 1 + 15T,  0 ≤ T ≤ 0.1
  // Sa/g = 2.5,        0.1 < T ≤ 0.4
  // Sa/g = 1.00 / T,   0.4 < T ≤ 4.0
  const SaOverG = T <= 0.1 ? 1 + 15 * T : T <= 0.4 ? 2.5 : 1.0 / Math.min(T, 4);

  const Ah = (Z * I * SaOverG) / (2 * R); // §6.4.2 horizontal design acceleration

  // Approximate DL = super + sub weight per pier bay
  // Deck: carriageWidth × spanLength × 0.3 m thick RCC × 25 kN/m³, plus 2 kN/m² wearing
  const deckAreaPerSpan = input.carriageWidth * input.spanLength;
  const deckDLPerSpan = deckAreaPerSpan * (0.3 * 25 + 2);
  const pierDLPerPier =
    input.pierWidth * input.pierLength * input.pierDepth * 25 +
    input.pierBaseWidth * input.pierBaseLength * 1.2 * 25;
  const nPiers = input.numberOfPiers;
  const totalDL = input.numberOfSpans * deckDLPerSpan + nPiers * pierDLPerPier + 2 * pierDLPerPier * 0.8; // abutments approximated lighter
  const LLperSpan = (input.numberOfLanes ?? 2) * 10 * input.spanLength * input.carriageWidth; // rough 10 kN/m² lane LL
  const totalLL05 = 0.5 * input.numberOfSpans * LLperSpan; // §7.3.1 0.5×LL
  const VB = Ah * (totalDL + totalLL05); // Base shear kN

  const shearPerPier = nPiers > 0 ? VB * 0.8 / nPiers : 0; // 0.8 on piers, 0.1 per abutment
  const shearPerAbutment = VB * 0.1;

  let r = 5;
  styleHeader(ws, r, 'A — COEFFICIENTS (IS 1893:2002 §6.4.2)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Reference']);
  r += 1;
  addTableRow(ws, r, ['1', 'Seismic Zone', `Zone ${zone}`, '§5 / §6.4.2']);
  addTableRow(ws, r + 1, ['2', 'Zone Factor Z', Z.toFixed(3), 'Table 2']);
  addTableRow(ws, r + 2, ['3', 'Importance Factor I', I.toFixed(2), 'Table 6 (Ordinary)']);
  addTableRow(ws, r + 3, ['4', 'Response Reduction R', R.toFixed(1), '§7.10.2 SMRF Ordinary']);
  addTableRow(ws, r + 4, ['5', 'Fundamental period Ct (m^-0.25)', Ct.toFixed(3), 'Table 5 RC frame']);
  addTableRow(ws, r + 5, ['6', 'Effective height h (m)', h.toFixed(3), 'RTL − Foundation Level']);
  addTableRow(ws, r + 6, ['7', 'T = Ct·h^0.75 (s)', T.toFixed(3), '§7.6.1 empirical']);
  addTableRow(ws, r + 7, ['8', 'Spectral accel Sa/g (Soil II)', SaOverG.toFixed(3), 'Table 4 — medium soil']);
  addTableRow(ws, r + 8, ['9', 'Horizontal Ah = Z·I·Sa/(2·R·g)', Ah.toFixed(4), '§6.4.2 (dimensionless)']);
  r += 10;

  styleHeader(ws, r, 'B — BASE SHEAR (§7.3.1 VB = Ah × (DL + 0.5 LL))', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Component', 'Value (kN)', 'Notes']);
  r += 1;
  addTableRow(ws, r, ['1', 'Estimated Total DL (kN)', totalDL.toFixed(1), 'Deck + Pier + Abutments']);
  addTableRow(ws, r + 1, ['2', '0.5 × Total LL (kN)', totalLL05.toFixed(1), '§7.3.1 contribution']);
  addTableRow(ws, r + 2, ['3', 'DL + 0.5 LL (kN)', (totalDL + totalLL05).toFixed(1), 'Seismic weight W']);
  addTableRow(ws, r + 3, ['4', 'Design Base Shear VB = Ah · W (kN)', VB.toFixed(1), '§7.3 total lateral']);
  r += 5;

  styleHeader(ws, r, 'C — LATERAL FORCE DISTRIBUTION', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Member', 'Shear Force (kN)', 'Notes']);
  r += 1;
  addTableRow(ws, r, ['1', `Per Pier (${nPiers} @ 0.8 split)`, shearPerPier.toFixed(1), 'Equal among piers (short bridge)']);
  addTableRow(ws, r + 1, ['2', 'Per Abutment (2 @ 0.1 split)', shearPerAbutment.toFixed(1), 'Wing/backfill share']);
  r += 3;

  addSectionDivider(ws, r,
    'Code references: IS 1893:2002 §5 lateral loads, §6.4.2 Ah formula, §7.3.1 base shear with 0.5 LL, §7.6 period, §7.10 Ordinary SMRF R=3. ' +
    'IRC:6-2017 §214 seismic loads on bridges.');
}

// ---------------------------------------------------------------------------
// WIND LOAD ANALYSIS (IS:875 / IRC:6 §209) — Sheet 12
// ---------------------------------------------------------------------------
export async function generateWindLoadSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('WIND LOAD ANALYSIS (IS 875)');
  setColumnWidths(ws, [6, 42, 20, 22]);

  addTitle(ws, 1, 'WIND LOAD ANALYSIS — IS 875 Part 3 + IRC:6-2017 §209', 14, 1, 4);
  addTitle(ws, 2, input.projectName, 11, 1, 4);
  setCellValue(ws, 3, 1, 'Governing clauses: IRC:6 §209.1 scope, §209.2 Vb, §209.3 k1 risk, §209.6 force; IS:875 §5.3 Vb, §5.4 k1/k2/k3, §6.1 Pz=0.6·Vz²');

  const Vb = input.designWindSpeed ?? 33;
  const k1 = 1.00; // 50-yr return risk coeff (§5.3.1 Class II)
  const k2 = 1.00; // Terrain Cat 2 (open), height < 10 m — Table 1
  const k3 = 1.00; // Flat topography (no hill/escarpment, §5.4.4)
  const k4 = 1.00; // Importance (ordinary bridge IRC)
  const Vz = Vb * k1 * k2 * k3 * k4;
  const Pz = 0.6 * Vz * Vz; // kN/m² (§6.1)

  const hPier = Math.max(1, input.rtl - input.foundationLevel);
  const CfPier = 1.2; // §209.4.1 square/rectangular solid pier
  const windPier = Pz * CfPier * input.pierWidth * hPier;

  const deckDepth = 1.5; // m — slab deck + parapets/railing (IRC:6 §209.5)
  const CfDeck = 1.3;
  const windSuper = Pz * CfDeck * input.carriageWidth * deckDepth * (input.numberOfSpans); // accum across spans

  const hAbut = input.abutmentHeight;
  const CfAbut = 1.4; // Wing wall + stem — rough face
  const windAbutPerSide = Pz * CfAbut * input.abutmentWidth * hAbut * 0.5; // half windward wing drag

  const totalWind = windPier * Math.max(1, input.numberOfPiers) + windSuper + 2 * windAbutPerSide;

  let r = 5;
  styleHeader(ws, r, 'A — VELOCITY & PRESSURE COEFFICIENTS', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Clause / Table']);
  r += 1;
  addTableRow(ws, r, ['1', 'Basic Wind Speed Vb (m/s)', Vb.toFixed(1), 'IRC:6 §209.2 / IS:875 §5.3']);
  addTableRow(ws, r + 1, ['2', 'k1 — Risk / Probability level', k1.toFixed(2), '50-yr return, Class II']);
  addTableRow(ws, r + 2, ['3', 'k2 — Terrain, height, structure', k2.toFixed(2), 'Cat 2 open, h<10 m Table 1']);
  addTableRow(ws, r + 3, ['4', 'k3 — Topography (flat)', k3.toFixed(2), '§5.4.4 — no ridge factor']);
  addTableRow(ws, r + 4, ['5', 'k4 — Importance', k4.toFixed(2), 'Ordinary road bridge IRC:6']);
  addTableRow(ws, r + 5, ['6', 'Vz = Vb·k1·k2·k3·k4 (m/s)', Vz.toFixed(2), '§5.2 design velocity']);
  addTableRow(ws, r + 6, ['7', 'Pz = 0.6·Vz² (kN/m²)', Pz.toFixed(3), '§6.1 design wind pressure']);
  r += 8;

  styleHeader(ws, r, 'B — FORCES ON COMPONENTS (IRC:6 §209.6)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Component', 'Force (kN)', 'Faces modelled']);
  r += 1;
  addTableRow(ws, r, ['1', `Piers (${Math.max(1, input.numberOfPiers)} nos, Cf=${CfPier})`, (windPier * Math.max(1, input.numberOfPiers)).toFixed(2), `B×L×H = ${input.pierWidth.toFixed(2)}×${input.pierLength.toFixed(2)}×${hPier.toFixed(2)}`]);
  addTableRow(ws, r + 1, ['2', `Superstructure (Cf=${CfDeck})`, windSuper.toFixed(2), `W=carriageway, depth=${deckDepth} m across ${input.numberOfSpans} spans`]);
  addTableRow(ws, r + 2, ['3', `Abutments ×2 (Cf=${CfAbut})`, (2 * windAbutPerSide).toFixed(2), 'Wing wall + stem, half windward drag']);
  addTableRow(ws, r + 3, ['4', 'TOTAL WIND FORCE (kN)', totalWind.toFixed(2), 'Load Case 3/5 contributing']);
  r += 5;

  addSectionDivider(ws, r,
    'Code references: IS 875 (Part 3):1987 §5.2 Vz, §5.3 Vb & k1, §5.4 k2/k3 terrain/topo, §6.1 pressure Pz. ' +
    'IRC:6-2017 §209.1 applicability, §209.2 Vb 33 m/s pan-India default, §209.3 combination, §209.4 drag coefficients, §209.6 resultant force.');
}

export default {
  generateDesignCriteriaSheet,
  generateInputDataSummarySheet,
  generateSeismicAnalysisSheet,
  generateWindLoadSheet,
};
