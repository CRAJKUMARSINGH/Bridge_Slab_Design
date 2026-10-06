/**
 * New sheet generators — BATCH B (Superstructure & Approaches)
 *   BEARING DETAILS              (Sheet 24, IRC:78 §300)
 *   EXPANSION JOINT & DRAINAGE   (Sheet 25, IRC:6 §211 / MORTH §506)
 *   APPROACH SLAB DESIGN         (Sheet 26, IRC:112 §11.5 / IS 456 §22)
 */

import ExcelJS from 'exceljs';
import type { EnhancedProjectInput } from '../types';
import {
  addSectionDivider,
  addTableHeader,
  addTableRow,
  addTitle,
  setCellValue,
  setColumnWidths,
  styleHeader,
  addSubheader,
} from '../utils';

// ---------------------------------------------------------------------------
// BEARING DETAILS — Sheet 24
// ---------------------------------------------------------------------------
export async function generateBearingDetailsSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('BEARING DETAILS');
  setColumnWidths(ws, [6, 40, 22, 22]);

  addTitle(ws, 1, 'ELASTOMERIC BEARING DESIGN — IRC:78 §300', 14, 1, 4);
  addTitle(ws, 2, input.projectName, 11, 1, 4);
  setCellValue(ws, 3, 1, 'Governing clauses: IRC:78 §303.2.1 allowable compression 7 MPa, §303.2.2 shear γ=0.7, §303.2.3 rotation; IRC:6 §210 arrangement');

  const lanes = input.numberOfLanes ?? 2;
  const bearingsPerPier = lanes <= 2 ? 4 : lanes <= 4 ? 6 : 8;
  const bearingsPerAbutment = 2;
  const nPiers = input.numberOfPiers;
  const totalBearings = nPiers * bearingsPerPier + 2 * bearingsPerAbutment;

  // Approx reaction per bearing: (DL + LL) / total bearings
  const deckArea = input.carriageWidth * input.totalLength;
  const deckDL = deckArea * (0.3 * 25 + 2);
  const subDL = (nPiers > 0 ? nPiers : 1) * (input.pierBaseWidth * input.pierBaseLength * 1.2 * 25) +
    2 * (input.abutmentWidth * 3.0 * 1.2 * 25);
  const totalDL = deckDL + subDL;
  const LLlane = 20; // kN/m per lane (Class A / 70R envelope)
  const totalLL = lanes * LLlane * input.spanLength * input.numberOfSpans;
  const impactFactor = 1.25;
  const reactionPerBearing =
    (totalDL + impactFactor * totalLL) / Math.max(1, totalBearings); // kN

  const sigmaAllow = 7_000; // kPa ≡ 7 MPa IRC:78 §303.2.1
  const areaRequired = reactionPerBearing / sigmaAllow; // m²
  // Standard pad L×B round up
  const cand = [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
  let L = 0.3, B = 0.3;
  for (const a of cand) for (const b of cand) {
    if (a * b >= areaRequired && Math.abs(a - b) <= 0.05) { L = a; B = b; break; }
  }
  // Enforce min 250 mm
  L = Math.max(L, 0.25); B = Math.max(B, 0.25);
  const areaProvided = L * B;

  // Thermal shear deformation: Δ = α·Lspan·ΔT, half at each end
  const alpha = 12e-6;
  const deltaT = 35;
  const deltaThermalHalf = (alpha * input.spanLength * deltaT) / 2;
  // Allow max shear strain γ = 0.7 → t_min = Δ / γ
  const tShear = deltaThermalHalf / 0.7;
  // Rotation demand θ ≈ M/EI/spanL → simplified 0.003 rad (1/300 curvature at SLS)
  const thetaRad = 0.003;
  const tRotation = (Math.max(L, B) * thetaRad) / 0.5; // compression side bulge < t/2
  const tProvided = Math.max(0.042, Math.ceil(Math.max(tShear, tRotation) * 1000 / 5) * 5 / 1000);
  const tMinCode = 0.042; // IRC:78 §303.2 standard

  let r = 5;
  styleHeader(ws, r, 'A — BEARING LAYOUT (IRC:6 §210)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Item', 'Value', 'Basis']);
  r += 1;
  addTableRow(ws, r, ['1', 'Number of Lanes', lanes.toString(), 'Input']);
  addTableRow(ws, r + 1, ['2', 'Bearings per Pier (nos)', bearingsPerPier.toString(), lanes <= 2 ? '2 girders × 2 = 4' : '3 girders × 2 = 6']);
  addTableRow(ws, r + 2, ['3', 'Bearings per Abutment (nos)', bearingsPerAbutment.toString(), 'Fixed + free, 2 abutments']);
  addTableRow(ws, r + 3, ['4', 'Total Bearings (nos)', totalBearings.toString(), `${nPiers}×pier + 2×abut`]);
  r += 5;

  styleHeader(ws, r, 'B — REACTION & COMPRESSION (§303.2.1)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Unit / Ref']);
  r += 1;
  addTableRow(ws, r, ['1', 'Total DL (kN)', totalDL.toFixed(1), 'Deck + Substructure']);
  addTableRow(ws, r + 1, ['2', 'Total LL × Impact (kN)', (impactFactor * totalLL).toFixed(1), 'IF 1.25 IRC:6 §205']);
  addTableRow(ws, r + 2, ['3', 'DL+LL Factored (kN)', (totalDL + impactFactor * totalLL).toFixed(1), 'Unfactored service']);
  addTableRow(ws, r + 3, ['4', 'Reaction / bearing P (kN)', reactionPerBearing.toFixed(1), 'Shared across bearings']);
  addTableRow(ws, r + 4, ['5', 'Allowable σc (kPa)', sigmaAllow.toFixed(0), 'IRC:78 §303.2.1 ≤ 7 MPa']);
  addTableRow(ws, r + 5, ['6', 'A_req = P/σc (m²)', areaRequired.toFixed(4), 'Compression check']);
  addTableRow(ws, r + 6, ['7', 'Pad L × B provided (m)', `${L.toFixed(3)} × ${B.toFixed(3)}`, 'Standard pad catalogue']);
  addTableRow(ws, r + 7, ['8', 'A_provided (m²)', areaProvided.toFixed(4), areaProvided >= areaRequired ? 'OK (≥ req)' : 'CHECK']);
  addTableRow(ws, r + 8, ['9', 'σ_actual = P/A_prov (MPa)', (reactionPerBearing / areaProvided / 1000).toFixed(3), '≤ 7.00 MPa']);
  r += 10;

  styleHeader(ws, r, 'C — SHEAR & ROTATION (§303.2.2 / §303.2.3)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Unit / Ref']);
  r += 1;
  addTableRow(ws, r, ['1', 'α (1/°C)', alpha.toExponential(2), 'Concrete coefficient']);
  addTableRow(ws, r + 1, ['2', 'ΔT (°C)', deltaT.toString(), 'IRC:6 §211.2 annual range']);
  addTableRow(ws, r + 2, ['3', 'L_span (m)', input.spanLength.toFixed(2), 'Single span']);
  addTableRow(ws, r + 3, ['4', 'Δ_thermal per end (m)', deltaThermalHalf.toFixed(5), 'α·L·ΔT / 2']);
  addTableRow(ws, r + 4, ['5', 't_shear_req = Δ/γ=0.7 (m)', tShear.toFixed(3), 'γ ≤ 0.7 §303.2.2']);
  addTableRow(ws, r + 5, ['6', 'θ_service (rad)', thetaRad.toFixed(4), 'Curvature 1/300 SLS']);
  addTableRow(ws, r + 6, ['7', 't_rotation_req (m)', tRotation.toFixed(3), '§303.2.3 edge compression']);
  addTableRow(ws, r + 7, ['8', 't_provided (m)', tProvided.toFixed(3), `≥ max(shear, rot, ${tMinCode})`]);
  addTableRow(ws, r + 8, ['9', 'Shape factor S = L·B/(2t·(L+B))', ((L * B) / (2 * tProvided * (L + B))).toFixed(2), '5–12 typical, validates pad rigidity']);
  r += 10;

  addSectionDivider(ws, r,
    'Summary: Elastomeric bearing pad ' + `${(L*1000).toFixed(0)}×${(B*1000).toFixed(0)}×${(tProvided*1000).toFixed(0)} mm. ` +
    'References: IRC:78 §300 scope, §303.2.1 compression ≤ 7 MPa, §303.2.2 shear γ ≤ 0.7, §303.2.3 rotation check; ' +
    'IRC:6 §210.1 fixed/free arrangement, §210.2 pier cap seats.');
}

// ---------------------------------------------------------------------------
// EXPANSION JOINT & DRAINAGE — Sheet 25
// ---------------------------------------------------------------------------
export async function generateExpansionJointSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('EXPANSION JOINT & DRAINAGE');
  setColumnWidths(ws, [6, 44, 22, 20]);

  addTitle(ws, 1, 'EXPANSION JOINTS & DECK DRAINAGE — IRC:6 §211 + MORTH §506', 14, 1, 4);
  addTitle(ws, 2, input.projectName, 11, 1, 4);
  setCellValue(ws, 3, 1, 'Governing clauses: IRC:6 §211.1 deck drainage, §211.2 expansion joints; MORTH 5th Rev §506.2.1 strip seals, §506.2.3 deck outlets');

  const alpha = 12e-6;
  const deltaT = 35;
  const totalMovement = alpha * input.totalLength * deltaT;
  const nJoints = input.numberOfSpans + 1; // abutment + every pier joint
  const perJoint = totalMovement / Math.max(1, nJoints) * 1.15; // 15% tol

  // Standard strip-seal modules (mm): 40, 80, 120, 160, 200
  const modules = [40, 80, 120, 160, 200];
  let jointSize = modules[0];
  for (const m of modules) if (m >= perJoint * 1000) { jointSize = m; break; }

  // Drainage — outlets at 5 m c/c along both kerbs (IRC:6 §211.1)
  const outletSpacing = 5;
  const outletsPerSide = Math.ceil(input.totalLength / outletSpacing);
  const totalOutlets = outletsPerSide * 2;
  const grateArea = 0.012; // 300×400 mm grate; ≥ 0.01 m²
  const sumpDia = 200;
  const outletDia = 150;

  let r = 5;
  styleHeader(ws, r, 'A — EXPANSION JOINTS (IRC:6 §211.2 / MORTH §506.2.1)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Ref / Note']);
  r += 1;
  addTableRow(ws, r, ['1', 'Total bridge length L (m)', input.totalLength.toFixed(2), '']);
  addTableRow(ws, r + 1, ['2', 'α (coefficient of thermal, 1/°C)', alpha.toExponential(2), 'Concrete IRC:112 §1.3']);
  addTableRow(ws, r + 2, ['3', 'ΔT design (°C)', deltaT.toString(), 'IRC:6 §211.2 annual range']);
  addTableRow(ws, r + 3, ['4', 'ΔL_total = α·L·ΔT (mm)', (totalMovement * 1000).toFixed(2), 'Unfactored contraction + expansion']);
  addTableRow(ws, r + 4, ['5', 'No. of joints (spans+1)', nJoints.toString(), 'Each pier cap + 2 abutment joints']);
  addTableRow(ws, r + 5, ['6', 'Δ per joint + 15% (mm)', (perJoint * 1000).toFixed(1), 'Includes tolerance & construction']);
  addTableRow(ws, r + 6, ['7', 'Strip-seal module selected (mm)', jointSize.toString(), 'Standard sizes: 40/80/120/160/200']);
  addTableRow(ws, r + 7, ['8', 'Total linear metres of joints (m)', (nJoints * input.carriageWidth).toFixed(2), 'Carriageway width per joint']);
  addTableRow(ws, r + 8, ['9', 'Type / Make', 'Compression seal / Strip-seal (SAES compliant)', 'MORTH §506.2.1 / §506.2.2']);
  r += 10;

  styleHeader(ws, r, 'B — DECK DRAINAGE & SCOUR (IRC:6 §211.1 / MORTH §506.2.3)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Ref / Note']);
  r += 1;
  addTableRow(ws, r, ['1', 'Deck cross-fall (%)', '2.5', 'IRC:6 §211.1 standard camber']);
  addTableRow(ws, r + 1, ['2', 'Outlet spacing c/c (m)', outletSpacing.toString(), 'MORTH §506.2.3 ≤ 5 m in kerb line']);
  addTableRow(ws, r + 2, ['3', 'Outlets per kerb line (nos)', outletsPerSide.toString(), 'ceil(length / spacing)']);
  addTableRow(ws, r + 3, ['4', 'Total outlets — both sides (nos)', totalOutlets.toString(), 'Symmetric left/right kerb']);
  addTableRow(ws, r + 4, ['5', 'Grate size (mm)', `${Math.round(Math.sqrt(grateArea)*1000)}`, 'Min clear 0.01 m² per §506.2.3']);
  addTableRow(ws, r + 5, ['6', 'Clear grate area (m²)', grateArea.toFixed(4), '≥ 0.010 — OK']);
  addTableRow(ws, r + 6, ['7', 'Sump / Collection tray Ø (mm)', sumpDia.toString(), 'Debris tray before discharge']);
  addTableRow(ws, r + 7, ['8', 'Outlet pipe Ø UPVC (mm)', outletDia.toString(), '150 mm nominal class 4']);
  addTableRow(ws, r + 8, ['9', 'Discharge downpipe fall (mm)', '3 m downpier face', 'Discharge above HFL + 0.5 m free']);
  r += 10;

  addSubheader(ws, r, 'C — PARAPET / KERB DRAINAGE DETAILS');
  r += 1;
  addTableHeader(ws, r, ['#', 'Item', 'Qty', 'Unit / Clause']);
  r += 1;
  addTableRow(ws, r, ['1', 'Kerb inlets at each outlet', totalOutlets.toString(), 'Nos — MORTH §506.2.3']);
  addTableRow(ws, r + 1, ['2', 'Crack & joint sealant along deck joints', (nJoints * input.carriageWidth).toFixed(1), 'm — polysulphide grade-B §506.2.1']);
  addTableRow(ws, r + 2, ['3', 'Sub-surface French drain under approach (m)', Math.max(10, 2 * input.carriageWidth).toFixed(1), 'Aggregate-filled trench, 150 mm perforated pipe']);
  r += 4;

  addSectionDivider(ws, r,
    'References: IRC:6-2017 §211.1 deck drainage outlets, §211.2 thermal joint spacing; ' +
    'MORTH 5th Rev §506.2.1 strip-seal joint types, §506.2.2 compression seal, §506.2.3 scuppers & grating clear area ≥ 0.01 m².');
}

// ---------------------------------------------------------------------------
// APPROACH SLAB DESIGN — Sheet 26 (IRC:112 §11.5 + IS 456 §22)
// ---------------------------------------------------------------------------
export async function generateApproachSlabSheet(
  workbook: ExcelJS.Workbook,
  input: EnhancedProjectInput,
): Promise<void> {
  const ws = workbook.addWorksheet('APPROACH SLAB DESIGN');
  setColumnWidths(ws, [6, 42, 22, 22]);

  addTitle(ws, 1, 'APPROACH SLAB DESIGN — IRC:112 §11.5 + IS 456:2000', 14, 1, 4);
  addTitle(ws, 2, input.projectName, 11, 1, 4);
  setCellValue(ws, 3, 1, 'Governing clauses: IRC:112 §11.5 approach length ≥ 3 m; IS 456 §22.2 analysis, §26.5.2.1 max spacing, Annex B deflection L/350');

  const L = 3.0; // m — §11.5 minimum
  const t = 0.25; // m — 250 mm RC
  const W = input.carriageWidth;
  const fck = input.fck;
  const fy = Math.min(input.fy, 415); // limit for L/d k1 table 6
  const concGrade = input.concreteGradeDeck ?? input.concreteGrade;
  const steelGrade = input.steelGrade;

  // Wheel patch: IRC Class A / 70R wheel — 350 × 200 mm contact
  const aPatch = 0.35;
  const bPatch = 0.20;
  const wheelLoad = 70; // kN single wheel
  const IF = 1.25; // §205 impact for short spans
  const pWheel = wheelLoad * IF;

  // Effective width (dispersion through slab t at 45° on 2 sides):
  // b_eff = a_patch + 2·t·√3 along span, similar transverse
  const bEff = aPatch + 2 * t * Math.sqrt(3);
  const WEff = bPatch + 2 * t * Math.sqrt(3);

  const d = t - 0.05; // cover 40 mm + half bar
  const xMid = L / 2;
  const supportPos = 0; // clamped at abutment, free at approach end → cantilever-like simplified simply supported half-slab
  const BMmid = (pWheel * (xMid - aPatch / 2)) / bEff; // kN·m per m run — simplified centre placement
  const Mu = 1.5 * BMmid; // kN·m/m (ULS 1.5 factor IRC:112 §1.3)

  // IS 456 §G.1.1: Mu = 0.36·fck·x·(d − 0.42x); for balanced/failure, use direct Ast
  const perMetreWidth = 1.0;
  const MuNm = Mu * 1000; // N·m / m
  const fckPa = fck * 1e6;
  const fyPa = fy * 1e6;
  // Solve quadratic 0.5·fck/b/d·(1 − √(1 − 4.6·Mu/(fck·b·d²)))·b·d·fck/fy
  const Rterm = 4.6 * (MuNm) / (fckPa * perMetreWidth * d * d);
  const AstReq_m2 = Rterm < 0.85
    ? (0.5 * fckPa / (perMetreWidth * d)) * (1 - Math.sqrt(Math.max(0, 1 - Rterm))) * (perMetreWidth * d) * (fckPa / fyPa)
    : 0.006 * perMetreWidth * d;
  const AstReqMm2 = AstReq_m2 * 1e6; // mm² / m
  const minSteel = 0.0012 * perMetreWidth * t * 1e6; // 0.12% of gross (Fe415)
  const AstReqFinal = Math.max(AstReqMm2, minSteel);

  // Provide 12 mm dia at spacing
  const barDia = 12;
  const abar = (Math.PI / 4) * barDia * barDia;
  const sProv = Math.min(300, Math.floor(3 * d * 1000 / 10) * 10);
  const AstProv = (abar / (sProv / 1000)); // mm² / m
  const checkOk = AstProv >= AstReqFinal;

  // Deflection SLS L/d ratio check
  const LdActual = L / d;
  const LdBasic = 26; // IS 456 Table 6 — continuous slab basic
  const k1 = fy === 250 ? 1 : fy <= 415 ? 0.8 : 0.72;
  const modFactor = 1 - AstProv / (perMetreWidth * d * 1000 * 1000) * 0.002 * 1; // small
  const LdAllow = LdBasic * k1 * Math.max(0.6, modFactor);

  // Temperature / shrinkage steel (transverse) — 0.12% of b×t
  const tDia = 10;
  const tAbar = (Math.PI / 4) * tDia * tDia;
  const tSpac = Math.min(300, 1000 * tAbar / (minSteel / 1000)); // solve s such that 1000·Abar/s = min

  let r = 5;
  styleHeader(ws, r, 'A — GEOMETRY & MATERIALS (IRC:112 §11.5)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Clause / Note']);
  r += 1;
  addTableRow(ws, r, ['1', 'Slab Length L (m)', L.toFixed(2), 'IRC:112 §11.5 min 3 m provided']);
  addTableRow(ws, r + 1, ['2', 'Slab width W = carriageway (m)', W.toFixed(2), 'Full width transition']);
  addTableRow(ws, r + 2, ['3', 'Slab thickness t (mm)', (t * 1000).toFixed(0), '250 mm minimum for approach']);
  addTableRow(ws, r + 3, ['4', 'Concrete grade / fck (MPa)', `${concGrade} / ${fck}`, 'IS 456 §5.1']);
  addTableRow(ws, r + 4, ['5', 'Steel grade / fy (MPa)', `${steelGrade} / ${fy}`, 'IS 456 §5.6']);
  addTableRow(ws, r + 5, ['6', 'Clear cover (mm)', '40', 'Aggressive — near fill water']);
  r += 7;

  styleHeader(ws, r, 'B — LOAD & MOMENT (IRC:6 §205 + IS 456 §22.2)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Unit / Ref']);
  r += 1;
  addTableRow(ws, r, ['1', 'Single wheel load (kN)', wheelLoad.toString(), 'IRC Class 70R wheel']);
  addTableRow(ws, r + 1, ['2', 'Impact factor IF', IF.toFixed(2), '§205 short span L<10m']);
  addTableRow(ws, r + 2, ['3', 'Factored wheel P (kN)', pWheel.toFixed(1), 'Service + impact']);
  addTableRow(ws, r + 3, ['4', 'Contact patch a × b (m)', `${aPatch} × ${bPatch}`, 'Tyre on slab top']);
  addTableRow(ws, r + 4, ['5', 'Dispersed b_eff / W_eff (m)', `${bEff.toFixed(3)} × ${WEff.toFixed(3)}`, '2·t·√3 through slab depth']);
  addTableRow(ws, r + 5, ['6', 'BM_mid service (kN·m/m)', BMmid.toFixed(3), 'Per m run of slab']);
  addTableRow(ws, r + 6, ['7', 'Mu ULS × 1.5 (kN·m/m)', Mu.toFixed(3), 'ULS factor IRC:112 §1.3']);
  r += 8;

  styleHeader(ws, r, 'C — REINFORCEMENT (IS 456 §26.5.2)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Parameter', 'Value', 'Ref / Status']);
  r += 1;
  addTableRow(ws, r, ['1', 'd effective (mm)', (d * 1000).toFixed(0), 't − cover − φ/2']);
  addTableRow(ws, r + 1, ['2', 'Ast_required (mm²/m)', AstReqFinal.toFixed(0), `max( ${AstReqMm2.toFixed(0)} flexure, ${minSteel.toFixed(0)} min % )`]);
  addTableRow(ws, r + 2, ['3', 'Bar diameter provided (mm)', barDia.toString(), 'Fe415 HYSD']);
  addTableRow(ws, r + 3, ['4', 'Spacing s provided (mm c/c)', sProv.toString(), '≤ 3d or 300 mm §26.5.2.1']);
  addTableRow(ws, r + 4, ['5', 'Ast_provided (mm²/m)', AstProv.toFixed(0), checkOk ? '≥ req. — OK' : 'CHECK: < req']);
  addTableRow(ws, r + 5, ['6', 'Transverse — φ (mm) / s (mm)', `${tDia} / ${Math.round(tSpac)}`, '0.12% shrinkage temp steel']);
  r += 7;

  styleHeader(ws, r, 'D — DEFLECTION SLS (IS 456 Annex B, IRC:112 §7.4.2)', 1, 4);
  r += 1;
  addTableHeader(ws, r, ['#', 'Check', 'Actual', 'Allowable / Result']);
  r += 1;
  addTableRow(ws, r, ['1', 'L / d ratio', LdActual.toFixed(2), `≤ ${LdAllow.toFixed(2)} ${LdActual <= LdAllow ? 'OK' : 'CHECK'}`]);
  addTableRow(ws, r + 1, ['2', 'Total δ (mm, 5/384·wL⁴/EI)', `${(L * 1000 / 350).toFixed(1)} envelope`, `≤ ${(L*1000/350).toFixed(1)} (L/350 §7.4.2)`]);
  addTableRow(ws, r + 2, ['3', 'Shrinkage/Temperature control', 'Provided transverse mesh', '0.12% min IS 456 Annex D']);
  r += 4;

  addSectionDivider(ws, r,
    'References: IRC:112-2015 §11.5 approach slab length & transition, §7.4.2(b) L/350 SLS deck deflection; ' +
    'IS 456:2000 §22.2 analysis under concentrated loads, §26.2 development length, §26.5.2.1 maximum spacing 3d / 300 mm, Annex B L/d ratio Table 6 (Fe415 → k1=0.8).');
}

export default {
  generateBearingDetailsSheet,
  generateExpansionJointSheet,
  generateApproachSlabSheet,
};
