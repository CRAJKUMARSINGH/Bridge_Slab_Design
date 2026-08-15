/**
 * One-off emitter: rebuild assessment-matrix-WIP.csv for W02 Tier A completion.
 * Run: node scripts/emit-w02-assessment-matrix.mjs
 */
import fs from "fs";
import path from "path";

const out = path.resolve("docs/milestones/artifacts/assessment-matrix-WIP.csv");

const headers = [
  "project_name",
  "river_location",
  "sheet_list_in_order",
  "num_spans",
  "span_length_cc_m",
  "right_span_clear_m",
  "skew_angle_deg",
  "carriage_width_m",
  "footpath_present",
  "pier_type",
  "num_piers",
  "pier_width_across_flow_m",
  "pier_cap_width_mm",
  "abutment_type",
  "foundation_type",
  "hard_rock_available",
  "foundation_depth_m_below_bed",
  "hfl_m_msl",
  "deck_level_top_slab_m_msl",
  "soffit_level_m_msl",
  "rtl_m_msl",
  "nbl_m_msl",
  "agl_m_msl",
  "ofl_m_msl",
  "fl_m_msl",
  "manning_n",
  "bed_slope_1_in_x",
  "lacey_silt_factor",
  "discharge_q_cumecs",
  "velocity_v_m_s",
  "scour_depth_dsm_m",
  "afflux_h_m",
  "afflux_flood_level_afl_m_msl",
  "sbc_kn_m2",
  "sbc_foundation_depth_m",
  "phi_deg",
  "gamma_kn_m3",
  "wall_friction_z_deg",
  "active_earth_pressure_ka",
  "concrete_grade_foundation",
  "concrete_grade_piers",
  "concrete_grade_abutments",
  "concrete_grade_deck_slab",
  "concrete_grade_wearing_coat",
  "steel_grade",
  "irc_live_load_class",
  "estimated_cost_rs_lacs",
  "bsr_year_and_state",
  "technote_sheet_present",
  "tech_report_sheet_present",
  "sketch_sheets_present",
  "unique_sheets_not_in_bedach",
  "prose_variations_from_bedach",
  "anomalies_notes",
];

function esc(s) {
  if (s == null || s === "") return "";
  const t = String(s);
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function row(cells) {
  return cells.map(esc).join(",");
}

/** @type {Record<string,string>[]} */
const data = [];

const bedachPlusSheets =
  "Deck Anchorage | Sheet8 | TechNote | INSERT | afflux calculation | HYDRAULICS | Bed Slope | SBC | STABILITY CHECK FOR PIER | abstract of stresses | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM | Pier Cap LL tracked vehicle | Pier Cap | LLOAD | loadsumm  | LL-ABSTRACT | INSERT (2) | AbutMENT Drawing | STABILITY CHECK ABUTMENT | ABUTMENT FOOTING DESIGN | Abut Footing STRESS DIAGRAM | CAN-RETURN FOOTING DESIGN | STEEL IN CANT-ABUTMENT | STEEL IN CANT-RETURNS | Abutment Cap | DIRT WALL REINFORCEMENT | DIRT DirectLoad_BM | DIRT LL_BM | INSERT (3) | Tech Report | General Abs.  | Abstract | Bridge measurements | Sheet1 | Sheet2 | Sheet3";

data.push({
  project_name: "BEDACH submersible (plus Stability xlsx)",
  river_location: "Bedach River — Syphon Tiraha / Bedla Road",
  sheet_list_in_order: bedachPlusSheets,
  hfl_m_msl: "442.5",
  rtl_m_msl: "442.63",
  nbl_m_msl: "439.75",
  agl_m_msl: "437.493",
  ofl_m_msl: "438.493",
  fl_m_msl: "435.75",
  manning_n: "0.033",
  bed_slope_1_in_x: "830",
  discharge_q_cumecs: "1317.79",
  velocity_v_m_s: "2.15",
  technote_sheet_present: "Y",
  tech_report_sheet_present: "Y",
  sketch_sheets_present: "AbutMENT Drawing",
  unique_sheets_not_in_bedach: "",
  prose_variations_from_bedach: "Baseline office workbook; C1-style cantilever return chain (CAN-RETURN + STEEL IN CANT-*).",
  anomalies_notes:
    "Levels from HYDRAULICS F3/E60–E65 (Phase Zero). Spans/SBC/grades/IRC class: engineer to confirm from STABILITY or INPUT sheets. ANOM-W02-001: three empty tabs Sheet1–Sheet3.",
});

data.push({
  project_name: "BEDACH stability (legacy xls)",
  river_location: "Bedach River — Syphon Tiraha / Bedla Road",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Imperical Discharge | Deck Anchorage | CROSS SECTION | Bed Slope | abstract of stresses | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM",
  hfl_m_msl: "99.6",
  manning_n: "0.033",
  bed_slope_1_in_x: "223",
  discharge_q_cumecs: "1327.41",
  velocity_v_m_s: "2.98",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROSS SECTION",
  unique_sheets_not_in_bedach: "Imperical Discharge; CROSS SECTION",
  prose_variations_from_bedach: "Pier-and-footing-only stability set vs full BEDACH xlsx.",
  anomalies_notes:
    "No RTL/NBL block on HYDRAULICS tab in extract (ends at design discharge). Tab Imperical Discharge spelling. ANOM-W02-002: no abutment/LLOAD/estimation chain.",
});

data.push({
  project_name: "Larathi Som River (Stability xls)",
  river_location: "Som River — Larathi to Larathi B",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Deck Anchorage | CROSS SECTION | Bed Slope | STABILITY CHECK FOR PIER | abstract of stresses | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM | Pier Cap LL tracked vehicle | Pier Cap | LLOAD | loadsumm  | LL-ABSTRACT | AbutMENT Drawing | STABILITY CHECK ABUTMENT | ABUTMENT FOOTING DESIGN | Abut Footing STRESS DIAGRAM | STEEL IN ABUTMENT | Abutment Cap | DIRT WALL REINFORCEMENT | DIRT DirectLoad_BM | DIRT LL_BM",
  hfl_m_msl: "99.5",
  rtl_m_msl: "99.95",
  nbl_m_msl: "92.69",
  agl_m_msl: "96.169",
  ofl_m_msl: "97.369",
  fl_m_msl: "89.69",
  manning_n: "0.033",
  bed_slope_1_in_x: "926",
  discharge_q_cumecs: "1062.82",
  velocity_v_m_s: "2.41",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "AbutMENT Drawing; CROSS SECTION",
  unique_sheets_not_in_bedach: "CROSS SECTION; STEEL IN ABUTMENT",
  prose_variations_from_bedach:
    "Work title in HYDRAULICS A2; single STEEL IN ABUTMENT vs C1 cantilever split; footnotes on rational evaluation of levels vs afflux.",
  anomalies_notes:
    "Levels E36–E43 HYDRAULICS. No separate SBC tab. ANOM-W02-003: fewer sheets than BEDACH plus; no TechNote/Tech Report/estimation.",
});

data.push({
  project_name: "Som River — Kherwara Jawas Suveri (Stability xls)",
  river_location: "Som River — Kherwara–Jawas–Suveri (matches golden generator job name)",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Deck Anchorage | CROSS SECTION | Bed Slope | STABILITY CHECK FOR PIER | abstract of stresses | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM | Pier Cap LL tracked vehicle | Pier Cap | LLOAD | loadsumm  | LL-ABSTRACT | AbutMENT Drawing | STABILITY CHECK ABUTMENT | ABUTMENT FOOTING DESIGN | Abut Footing STRESS DIAGRAM | STEEL IN ABUTMENT | Abutment Cap | DIRT WALL REINFORCEMENT | DIRT DirectLoad_BM | DIRT LL_BM | Sheet1",
  hfl_m_msl: "100.6",
  rtl_m_msl: "101.6",
  nbl_m_msl: "96.47",
  agl_m_msl: "96.6",
  ofl_m_msl: "97.6",
  fl_m_msl: "93.47",
  manning_n: "0.033",
  bed_slope_1_in_x: "960",
  discharge_q_cumecs: "899.93",
  velocity_v_m_s: "1.84",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "AbutMENT Drawing; CROSS SECTION",
  unique_sheets_not_in_bedach: "CROSS SECTION; STEEL IN ABUTMENT; Sheet1",
  prose_variations_from_bedach: "Same structural tab set as Larathi Som xls; different hydraulics numbers and trailing Sheet1.",
  anomalies_notes: "HYDRAULICS A2 names Kherwara road job — primary regression golden in repo. ANOM-W02-004: trailing Sheet1.",
});

data.push({
  project_name: "Jakham — Mandvi Parsola Vai Bajpura (3 Stability xls)",
  river_location: "Jakham River — Mandvi Parsola Vai Bajpura road",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Deck Anchorage | CROSS SECTION | Bed Slope | abstract of stresses | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROSS SECTION",
  unique_sheets_not_in_bedach: "CROSS SECTION",
  prose_variations_from_bedach: "Pier-only stability export; same sheet count/order pattern as BEDACH legacy xls but Jakham site.",
  anomalies_notes: "ANOM-W02-005: no abutment/LLOAD tabs — confirm with paired Design of ABUTMENT xls (Tier B).",
});

data.push({
  project_name: "T01 — Jethliya Sobhaniya Teendhari Chhatri (3 Stability xls)",
  river_location: "T01 corridor — Jethliya Sobhaniya Teendhari Chhatri Road",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Deck Anchorage | CROSS SECTION | Bed Slope | abstract of stresses | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROSS SECTION",
  unique_sheets_not_in_bedach: "CROSS SECTION",
  prose_variations_from_bedach: "Pier-only stability; mirror of Mandvi Jakham template.",
  anomalies_notes: "ANOM-W02-006: Tier B dirt-wall/abutment files exist separately in Attached_Assets.",
});

data.push({
  project_name: "Ayad — Maharashtra Bhawan New Bhupalpura (Stability xls)",
  river_location: "Ayad River — Maharashtra Bhawan / New Bhupalpura Road",
  sheet_list_in_order:
    "CROS SECTION AT 100 M US | CROS SECTION AT 100 M DS | CROS SECTION AT PROPOSED SITE | HYDRAULICS | Bed Slope | afflux calculation | abstract of stresses | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROS SECTION AT 100 M US; CROS SECTION AT 100 M DS; CROS SECTION AT PROPOSED SITE",
  unique_sheets_not_in_bedach:
    "CROS SECTION AT 100 M US; CROS SECTION AT 100 M DS; CROS SECTION AT PROPOSED SITE",
  prose_variations_from_bedach:
    "Multi-chainage cross-section tabs (typo CROS); HYDRAULICS and Bed Slope lead before afflux in tab order.",
  anomalies_notes:
    "ANOM-W02-007: no Deck Anchorage/LLOAD/abutment in this file — likely split across companion workbooks. Hydraulics-only levels TBD (layout differs).",
});

data.push({
  project_name: "Ayad — Old Bhupalpura to New Bhupalpura (Stability xls)",
  river_location: "Ayad River — Old Bhupalpura – New Bhupalpura",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Imperical Discharge | Deck Anchorage | CROS SECTION PRINT | CROS SECTION | Bed Slope | abstract of stresses | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROS SECTION PRINT; CROS SECTION",
  unique_sheets_not_in_bedach: "Imperical Discharge; CROS SECTION PRINT; CROS SECTION",
  prose_variations_from_bedach: "Combines empirical discharge check with print/layout cross-section tabs.",
  anomalies_notes: "ANOM-W02-008: CROS spelling; pier-only tail — verify abutment in separate xls.",
});

data.push({
  project_name: "Sukanaka Nalah — near M (Stability xls)",
  river_location: "Sukanaka Nalah — Udaipur–Jhamar Kotada road (near M)",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Imperical Discharge | Deck Anchorage | CROS SECTION PRINT | CROS SECTION | Bed Slope | abstract of stresses | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | FOOTING DESIGN | Footing STRESS DIAGRAM",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROS SECTION PRINT; CROS SECTION",
  unique_sheets_not_in_bedach: "Imperical Discharge; CROS SECTION PRINT; CROS SECTION",
  prose_variations_from_bedach: "Same tab pattern as Ayad Old Bhupalpura class; different river.",
  anomalies_notes: "ANOM-W02-009: pair with MATOON VILLAGE file for Sukanaka corridor diff.",
});

data.push({
  project_name: "Sukanaka Nalah — Matoon Village (Stability xls)",
  river_location: "Sukanaka Nalah — near Matoon Village",
  sheet_list_in_order:
    "afflux calculation | HYDRAULICS | Imperical Discharge | CROS SECTION PRINT | CROS SECTION | Bed Slope",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROS SECTION PRINT; CROS SECTION",
  unique_sheets_not_in_bedach: "Imperical Discharge; CROS SECTION PRINT; CROS SECTION",
  prose_variations_from_bedach: "Truncated workbook vs sibling NEAR M file — hydraulics and cross-section only in Phase Zero index.",
  anomalies_notes:
    "ANOM-W02-010: only six sheets in extract — missing pier steel/footing/stability block vs NEAR M copy; verify source file completeness with engineer.",
});

data.push({
  project_name: "Gumaniya Wala Nalah — Aaloo factory (SUBMERSIBLE xls)",
  river_location: "Gumaniya Wala Nalah — Udaipur (near Aaloo factory)",
  sheet_list_in_order:
    "ABUTMENT | CROS SECTION | HYDRAULICS | Bed Slope | STABILITY CHECK FOR PIER | STEEL IN FLARED  PIER BASE  | STEEL IN PIER | cover",
  technote_sheet_present: "N",
  tech_report_sheet_present: "N",
  sketch_sheets_present: "CROS SECTION",
  unique_sheets_not_in_bedach: "ABUTMENT; CROS SECTION; cover",
  prose_variations_from_bedach: "Compact alternate template: combined ABUTMENT sheet; typo CROS SECTION.",
  anomalies_notes:
    "ANOM-W02-011: no afflux tab in workbook-summary sheet index — confirm embedded calcs or incomplete file.",
});

const lines = [row(headers)];
for (const obj of data) {
  const cells = headers.map((h) => obj[h] ?? "");
  lines.push(row(cells));
}

fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log("Wrote", out, "rows", data.length);
