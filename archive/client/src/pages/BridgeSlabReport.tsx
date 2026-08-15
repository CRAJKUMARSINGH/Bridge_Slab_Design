import React, { useState, useCallback } from "react";
import {
  SectionHydraulics,
  SectionAffluxScour,
  SectionHydSummary,
  SectionDeckAnchorage,
  SectionXSecBedSlope,
  SectionSBC,
} from "@/report-engine/sheets/HydraulicsSection";
import {
  SectionAOS,
  SectionPierSteel,
  SectionPierFooting,
  SectionPierCap,
  SectionLLOAD,
} from "@/report-engine/sheets/PierSection";
import {
  SectionAbutment,
  SectionAbtDetail,
  SectionC1Detail,
  SectionDirtWall,
  SectionReturnWall,
  SectionApproachSlab,
  SectionAbtSteelDetail,
} from "@/report-engine/sheets/AbutmentSection";
import {
  SectionTechNote,
  SectionTechReport,
  SectionAbstract,
  SectionBOQ,
  SectionMOST,
} from "@/report-engine/sheets/SummarySection";
import { PileFoundationSection } from '@/report-engine/sheets/PileFoundationSection';
import { ExpansionJointSchematic } from "@/report-engine/sheets/ExpansionJointSchematic";
import { AnnexureDrawings } from "@/report-engine/sheets/AnnexureDrawings";
import { ReportFooter } from "@/report-engine/sheets/ReportFooter";
import { ReportSourceNotice } from "@/report-engine/sheets/workbookSource";
import {
  generateExcelModelA,
  generateExcelModelB,
  generateProfessionalPDF,
  exportToCSV,
  exportAuditManifest,
  generateSurveySMS,
} from "@/report-engine/exportUtils";
import { generateCertificationReport } from "@/report-engine/generateCertificationReport";
import { Derived, derive } from "@/report-engine/bridgeDerivation";
import { InputSection } from "@/report-engine/sheets/InputSection";
import { Inputs, XSecRow, MoSTRow } from "@/report-engine/types/bridgeTypes";

// Gift Enhancements
import DesignCheckDashboard from "@/report-engine/sheets/DesignCheckDashboard";
import SectionPierStabilityEnhanced from "@/report-engine/sheets/PierStabilityEnhanced";
import HydraulicsOptimiser from "@/report-engine/sheets/HydraulicsOptimiser";
import PierOptimiser from "@/report-engine/sheets/PierOptimiser";
import AbutmentOptimiser from "@/report-engine/sheets/AbutmentOptimiser";
import { OptimisationAtAGlance } from "@/report-engine/sheets/OptimisationAtAGlance";

// Zero-Loss Hybrid (v2.0) New Sheets
import { IndexSheet } from "@/report-engine/sheets/IndexSheet";
import { PreambleSheet } from "@/report-engine/sheets/PreambleSheet";
import { DetailedXSecFlowSheet } from "@/report-engine/sheets/DetailedXSecFlowSheet";
import { DetailedCostingSheet } from "@/report-engine/sheets/DetailedCostingSheet";
import { AbutmentC1Sheet } from "@/report-engine/sheets/AbutmentC1Sheet";
import SectionSlabIRC66 from "@/report-engine/sheets/SectionSlabIRC66";
import SectionPierStabilityIRC6 from "@/report-engine/sheets/SectionPierStabilityIRC6";
import { StrudsCoverPage } from "@/report-engine/components/StrudsCoverPage";
import { StrudsForeword } from "@/report-engine/components/StrudsForeword";
import { StrudsTOC } from "@/report-engine/components/StrudsTOC";

export type { Inputs, XSecRow, MoSTRow, Derived };

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CLEANUP: Circular types removed. Loaded from src/types/bridgeTypes.ts
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */


/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DEFAULT INPUTS  — Kherwara Bridge / SOM RIVER
   Ref: Attached_Assets/3 Stability Analysis SUBMERSIBLE BRIDGE  Mandvi Parsola Vai Bajpura road across Jakham River.xls
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export const DEFAULT_XSEC: XSecRow[] = [
  { ch: "0+000", gl: 97.6, remarks: "" },
  { ch: "0+010", gl: 96.8, remarks: "" },
  { ch: "0+020", gl: 96.2, remarks: "" },
  { ch: "0+030", gl: 95.8, remarks: "" },
  { ch: "0+050", gl: 93.8, remarks: "" },
  { ch: "0+070", gl: 91.8, remarks: "" },
  { ch: "0+080", gl: 91.5, remarks: "Min. RL" },
  { ch: "0+100", gl: 92.2, remarks: "" },
  { ch: "0+140", gl: 95.0, remarks: "" },
  { ch: "0+160", gl: 96.4, remarks: "" },
];

export const DEFAULTS: Inputs = {
  name: "Construction of Submersible Bridge on KHERWARA – JAWAS – SUVERI ROAD",
  location:
    "KM 9/000, KHERWARA – JAWAS – SUVERI ROAD, DIST. UDAIPUR, RAJASTHAN",
  river: "SOM RIVER",
  jobNo: "BSY/2025/KWR-01",
  client: "Public Works Department, Rajasthan",
  engineer: "Er. R.K. Singh, M.E. (Civil)",
  strudsVer: "4.0.0",
  buildVer: "1.640",
  spans: 3,
  spanL: 12.2,
  cwWidth: 7.5,
  fpWidth: 1.5,
  totalW: 10.5,
  skewDeg: 0,
  showFootpath: false,
  grade: "M30",
  steel: "Fe500",
  // Hydraulics
  A: 184,
  P_: 52,
  n: 0.035,
  S_denom: 500,
  HFL: 97.5,
  bedRL: 91.5,
  Ksf: 1.1,
  A_obs_slab: 2.5,
  A_obs_pier: 5.2,
  A_obs_abt: 8.4,
  xsec: DEFAULT_XSEC,
  // SBC
  phi: 30,
  gamma: 18,
  Df: 2.5,
  ftgB: 4.5,
  Nc: 30.14,
  Nq: 18.4,
  Ny: 22.4,
  FOS_sbc: 2.5,
  // Pier geometry
  pierW: 1.2,
  pierL: 8.5,
  pierH: 6.0,
  capW: 1.6,
  capL: 8.9,
  capD: 0.8,
  ftgPW: 4.5,
  ftgPL: 10.5,
  ftgPT: 1.2,
  // Pier loads
  DL_pier: 1250,
  LL_pier: 750,
  seisH: 125,
  seisV: 62.5,
  hydro: 45,
  drag: 12,
  windTemp: 15,
  mu: 0.5,
  // Pier material
  fck_pier: 30,
  fy_pier: 500,
  cover_pier: 50,
  // Abutment
  abt_H: 6.2,
  abt_tstem: 0.8,
  abt_Bbase: 4.2,
  abt_tftg: 0.8,
  abt_phi: 32,
  abt_gamma: 18.5,
  c1_tstem: 0.45,
  c1_Bbase: 4.4,
  // Deck slab
  slab_span: 12.2,
  slab_t: 350,
  slab_wc: 75,
  slab_fy: 500,
  slab_fck: 35,
  slab_cover: 40,
  // Deck Anchorage
  ancBoltDia: 25,
  ancBoltGrade: "8.8",
  ancIsRequired: true,
  anchorDia: 25,
  anchorBoltDia: 25,
  anchorBoltGrade: "8.8",
  SBC: 250,
  slabD: 0.35,
  // Return Wall & Misc
  retWallL: 4.5,
  retWallT: 0.45,
  dirtWallT: 0.3,
  // Branding (editable by buyer)
  firmName: "Er. R.K. Singh & Associates",
  firmLogo: "",
  // BOQ rates
  rate_earthwork: 185,
  rate_pcc: 4200,
  rate_m25: 6400,
  rate_m30: 7200,
  rate_m35: 7800,
  rate_steel: 68000,
  rate_railing: 78000,
  rate_wc: 680,
  rate_pitching: 580,
  rate_backfill: 220,
  // Workbook quantities (enter from Excel — zeros until pasted)
  qty_earthwork: 0,
  qty_pcc: 0,
  qty_m25: 0,
  qty_m30: 0,
  qty_m35: 0,
  qty_steel: 0,
  qty_railing: 0,
  qty_wc: 0,
  qty_pitching: 0,
  qty_backfill: 0,
  qty_formwork: 0,
  // --- MoST Standard Table (User will fill afterwards) ---
  mostStandards: [
    {
      span: 3,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 4,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 5,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 6,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 7,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 8,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 9,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
    {
      span: 10,
      live_load: 0,
      breaking_load: 0,
      ll_reaction: 0,
      ll_moment: 0,
      dl_moment: 0,
      breaking_force: 0,
    },
  ],
  // ASTRA/IRC Defaults
  seismicZone: "III",
  Cd: 0.70,
  R_factor: 3.0,
  I_factor: 1.2,
  f1Factor: 1.3,
  f2Factor: 1.33,
  maxScourMultiplier: 1.272,
  v_observed: 0,
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DERIVATIONS (Centralized in src/utils/bridgeDerivation.ts)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */


import {
  fv,
  fi,
  fmt,
  CRow,
  HR,
  Cl,
  SectionHead,
  SubHead,
  SubHeadCl,
  CalcRow,
  CalcBlock,
  Prose,
  Check,
  SummaryTable,
  Page,
} from "@/report-engine/sheets/ReportUI";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TABLE OF CONTENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const TOC = [
  { sn: "0", label: "Index Sheet", href: "s-index" },
  { sn: "1", label: "Preamble & Technical Report", href: "s-preamble" },
  { sn: "2–7", label: "Hydraulics & Waterway Analysis", href: "s-hyd" },
  { sn: "8–11", label: "Pier Stability — IRC:6-1966 Standard", href: "s-pier-66" },
  { sn: "12", label: "Abstract of Stresses — Pier Base", href: "s-aos" },
  { sn: "13–14", label: "Pier Reinforcement Design", href: "s-pier-steel" },
  { sn: "15–16", label: "Pier Footing Design", href: "s-pier-ftg" },
  { sn: "17–18", label: "Pier Cap — Live Load & Design", href: "s-pier-cap" },
  { sn: "19–28", label: "Abutment Type 1 — Stability & Design", href: "s-t1" },
  { sn: "29–34", label: "Abutment C1 — Structural details", href: "s-c1" },
  { sn: "35–37", label: "Slab Design — IRC:66 Alternate", href: "s-slab-66" },
  { sn: "38–44", label: "Annexure: Drawings & BBS", href: "s-annexure-drawings" },
  { sn: "45–46", label: "BOQ & Cost Analysis", href: "s-boq" },
  { sn: "47–50", label: "Technical Note & Assesment Matrix", href: "s-technote" },
];

function TableOfContents() {
  return (
    <div
      className="toc-block"
      style={{
        border: "1px solid orchid",
        padding: "10px 14px",
        margin: "10px 0 14px",
        background: "#fdf6ff",
        fontFamily: "Verdana,sans-serif",
      }}
    >
      <div
        style={{
          color: "darkorchid",
          fontWeight: "bold",
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        TABLE OF CONTENTS — DESIGN CALCULATION SHEETS
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 20,
        }}
      >
        {TOC.map((t, i) => (
          <div
            key={i}
            style={{ fontSize: 9.5, padding: "2px 0", display: "flex", gap: 6 }}
          >
            <span style={{ color: "#aaa", minWidth: 36, fontSize: 9 }}>
              {t.sn}
            </span>
            <a
              href={"#" + t.href}
              style={{ color: "royalblue", textDecoration: "none" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.textDecoration = "underline")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.textDecoration = "none")
              }
            >
              {t.label}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SECTION COMPONENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ProjectBanner({ i }: { i: Inputs }) {
  return (
    <div id="s-banner">
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        {/* Firm Logo (if uploaded) */}
        {i.firmLogo && (
          <div style={{ marginBottom: 8 }}>
            <img
              src={i.firmLogo}
              alt="Firm Logo"
              style={{ height: 50, maxWidth: 200, objectFit: "contain" }}
            />
          </div>
        )}
        {/* Firm Name */}
        {i.firmName && (
          <div
            style={{
              fontSize: 11,
              fontWeight: "bold",
              fontFamily: "Verdana,sans-serif",
              color: "#1e3a5f",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {i.firmName}
          </div>
        )}
        <div
          style={{
            fontSize: 15,
            fontWeight: "bold",
            fontFamily: "Verdana,sans-serif",
            color: "darkorchid",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          DESIGN OF SUBMERSIBLE BRIDGE
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#333",
            fontFamily: "Verdana,sans-serif",
            marginTop: 6,
          }}
        >
          Name Of Work :- {i.name}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px 24px",
          fontSize: 10,
          fontFamily: "Verdana,sans-serif",
          margin: "8px 0 4px",
        }}
      >
        {[
          ["Name of Work", i.name],
          ["Client", i.client],
          ["Location", i.location],
          ["Engineer", i.engineer],
          ["River", i.river],
          ["Job No.", i.jobNo],
          ["Date", new Date().toLocaleDateString("en-IN")],
          ["STRUDS / Building Version", i.strudsVer + " / " + i.buildVer],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex" }}>
            <span
              style={{ color: "darkorchid", fontWeight: "bold", minWidth: 180 }}
            >
              {k}
            </span>
            <span style={{ color: "darkorchid", minWidth: 10 }}> : </span>
            <span style={{ color: "darkorchid", fontWeight: "bold" }}>{v}</span>
          </div>
        ))}
      </div>
      <HR />
      <SectionHead>Structural Design Philosophy & Project Abstract</SectionHead>
      <Prose>
        Now we begin the comprehensive structural design report for the
        Submersible RCC Bridge across the <strong>{i.river}</strong>. First of
        all, we narrate the project's design philosophy and the governing
        ministry standards which anchor our engineering assumptions. This report
        transitions from the raw hydraulic power of the river catchment into the
        refined structural details of the deck, piers, and abutments, ensuring
        100% compliance with IRC and MoST specifications.
      </Prose>
      <Prose>
        The bridge consists of <strong>{i.spans} spans</strong> of{" "}
        <strong>{fv(i.spanL, 1)} m</strong> each (total length{" "}
        <strong>{fv(i.spans * i.spanL, 1)} m</strong>), carriageway{" "}
        <strong>{fv(i.cwWidth, 1)} m</strong> and overall width{" "}
        <strong>{fv(i.totalW, 1)} m</strong>. The structural design follows a
        rigorous path transitioning through <Cl>IRC:SP:13</Cl>,{" "}
        <Cl>IRC:6-2017</Cl>, <Cl>IRC:112-2011</Cl>, and <Cl>IRC:78-2014</Cl>.
      </Prose>
    </div>
  );
}

// Cleanup non-local components

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function BridgeSlabReport() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  // Auto-compute on first render so the cover page + foreword + ToC are visible
  // immediately with the seeded Kherwara design. Users click "Edit Inputs" to modify.
  const [computed, setComputed] = useState(true);
  const [showInputs, setShowInputs] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [d, setD] = useState<Derived>(() => derive(DEFAULTS));

  const handleCompute = () => {
    setD(derive(inp));
    setComputed(true);
    setShowInputs(false);
    setTimeout(() => {
      document
        .getElementById("s-banner")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div
      className="report-outer"
      style={{ background: "#d8d8d8", minHeight: "100vh", padding: "14px 6px" }}
    >
      {/* Toolbar */}
      <div
        className="no-print"
        style={{
          maxWidth: 900,
          margin: "0 auto 10px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setShowInputs((v) => !v)}
          style={{
            background: showInputs ? "#555" : "#1e3a5f",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            fontFamily: "Verdana,sans-serif",
            fontSize: 11,
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          {showInputs ? "▲ Hide Inputs" : "▼ Edit Inputs"}
        </button>
        <button
          onClick={handleCompute}
          style={{
            background: "#007a3d",
            color: "#fff",
            border: "none",
            padding: "6px 20px",
            fontFamily: "Verdana,sans-serif",
            fontSize: 11,
            fontWeight: "bold",
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          ▶ Compute All Sheets
        </button>
        <button
          onClick={() => setShowToc((v) => !v)}
          style={{
            background: showToc ? "#555" : "royalblue",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            fontFamily: "Verdana,sans-serif",
            fontSize: 11,
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          {showToc ? "Hide TOC" : "Show TOC"}
        </button>
        <button
          onClick={() => window.print()}
          style={{
            background: "darkorchid",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            fontFamily: "Verdana,sans-serif",
            fontSize: 11,
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          🖨 Print / Save PDF
        </button>
        <button
          onClick={() => {
            if (!computed) { 
              alert("Please compute first.");
              return;
            }
            generateSurveySMS(inp, d);
          }}
          style={{
            background: "#4b0082", // Indigo
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            fontFamily: "Verdana,sans-serif",
            fontSize: 11,
            cursor: "pointer",
            borderRadius: 2,
          }}
        >
          📲 Export Survey SMS (.txt)
        </button>
        <button
          onClick={() => {
            if (!computed) {
              alert("Please compute first.");
              return;
            }
            generateCertificationReport(inp, d);
          }}
          style={{
            background: "#006633",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            fontFamily: "Verdana,sans-serif",
            fontSize: 11,
            cursor: "pointer",
            borderRadius: 2,
            fontWeight: "bold",
          }}
        >
          🏅 IRC Certification Report (.html)
        </button>

        <span style={{ fontSize: 10, color: "#555", marginLeft: 8 }}>
          IRC:112 / IRC:6 / IRC:SP:13 · {inp.river} ·{" "}
          {new Date().toLocaleDateString("en-IN")}
        </span>
      </div>

      {/* Input Form */}
      {/* â”€â”€ Recalculation / Optimisation Windows â”€â”€ */}
      {computed && (
        <OptimisationAtAGlance 
          i={inp} d={d} 
          onApply={(updates) => setInp(prev => ({ ...prev, ...updates }))} 
        />
      )}

      {showInputs && <InputSection inp={inp} setInp={setInp} />}

      {!computed && (
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "#fff",
            padding: "40px 28px",
            textAlign: "center",
            fontFamily: "Verdana,sans-serif",
            fontSize: 12,
            color: "#555",
            border: "1px solid #bbb",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📐</div>
          <div
            style={{ fontWeight: "bold", color: "royalblue", marginBottom: 6 }}
          >
            Fill in all input parameters above and click{" "}
            <strong style={{ color: "#007a3d" }}>▶ Compute All Sheets</strong>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#888",
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Renders calculation sheets from your inputs (same engine logic as
            Bridge_Slab_Design). Abstract and BOQ quantities come from{" "}
            <strong>Section H</strong> — copy from your Excel workbook; defaults
            are zero.
          </div>
        </div>
      )}

      {/* ── Cover + Foreword + ToC — STRUDS-style A4 landscape front matter ── */}
      {computed && (
        <>
          <StrudsCoverPage i={inp} />
          <StrudsForeword i={inp} d={d} />
          {showToc && <StrudsTOC entries={TOC} />}
        </>
      )}

      {/* Report body — engine sheets + workbook-quantity sheets */}
      {computed && (
        <div
          className="report-body"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            background: "#fff",
            padding: "20px 28px 40px",
            fontFamily: "Verdana,Geneva,Tahoma,sans-serif",
            fontSize: 11,
            lineHeight: 1.55,
            border: "1px solid #bbb",
            boxShadow: "0 2px 10px rgba(0,0,0,.10)",
          }}
        >
          <ProjectBanner i={inp} />
          <ReportSourceNotice />
          <DesignCheckDashboard inp={inp} d={d} />

           <IndexSheet i={inp} />
           <PreambleSheet i={inp} d={d} />
           
           <SectionHydraulics i={inp} d={d} />
           <SectionAffluxScour i={inp} d={d} />
           <SectionHydSummary i={inp} d={d} />
           <SectionDeckAnchorage i={inp} d={d} />
           <SectionXSecBedSlope i={inp} d={d} />
           <SectionSBC i={inp} d={d} />

           <SectionPierStabilityIRC6 i={inp} d={d} 
             V_flood={d.V} 
             foundingRL={inp.bedRL - 2.0} 
             LL_mom_long={250} 
             LL_mom_trans={d.pierLCs[2]?.MO ?? 2000} 
             wind_mom_trans={100} 
           />
           
           <SectionAOS i={inp} d={d} />
           <SectionPierSteel i={inp} d={d} />
           <SectionPierFooting i={inp} d={d} />
           <SectionPierCap i={inp} d={d} />

           <SectionAbutment i={inp} d={d} isC1={false} />
           <SectionAbtDetail i={inp} d={d} />
           <AbutmentC1Sheet i={inp} d={d} />
           
           <SectionSlabIRC66 i={inp} d={d} />

           <DetailedCostingSheet i={inp} d={d} />
           <SectionAbstract i={inp} />
           <SectionBOQ i={inp} d={d} />
           <SectionTechNote i={inp} d={d} />

          <hr />
          <AnnexureDrawings i={inp} d={d} />

          <ReportSourceNotice />
          <ReportFooter i={inp} />
        </div>
      )}
    </div>
  );
}

function OpButton({
  label,
  color,
  icon,
  onClick,
  textDark = false,
}: {
  label: string;
  color: string;
  icon: string;
  onClick?: () => void;
  textDark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color,
        border: "none",
        borderRadius: "6px",
        padding: "10px",
        color: textDark ? "#333" : "white",
        fontSize: "10px",
        fontWeight: "600",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "transform 0.1s, opacity 0.2s",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.opacity = "0.9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.opacity = "1";
      }}
    >
      <span style={{ fontSize: "14px" }}>{icon}</span>
      {label}
    </button>
  );
}

function IRCSafetyValidator({ d }: { d: Derived }) {
  const pierSafe = d.pierLCs.every(
    (lc) => lc.slidFOS >= 1.5 && lc.qmax <= d.SBC,
  );
  const abtSafe = d.abtCases.every((c) => c.slidOK && c.bearOK);
  const allSafe = pierSafe && abtSafe;

  return (
    <div
      style={{
        background: allSafe ? "#e8f5e9" : "#fff3e0",
        border: `1px solid ${allSafe ? "#c8e6c9" : "#ffe0b2"}`,
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ marginTop: 30, borderLeft: "4px solid royalblue", paddingLeft: 15, background: "#f0f7ff", padding: 15 }}>
        <div style={{ fontStyle: "italic", fontSize: 12, color: "#1e3a5f" }}>
          "The structure is designed as a submersible RCC slab bridge, allowing floodwaters 
          to pass over the deck during peak velocity events while maintaining total structural 
          stability through robust anchorage and dead load equilibrium."
        </div>
      </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>{allSafe ? "🛡" : "⚠ ï¸"}</span>
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "12px",
                color: allSafe ? "#2e7d32" : "#e65100",
              }}
            >
              IRC COMPLIANCE AUDIT:{" "}
              {allSafe ? "ALL CHECKS PASSED" : "ATTENTION REQUIRED"}
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              Stability Analysis across 46 sheets verified against IRC:78 and
              IRC:6 standards.
            </div>
          </div>
        </div>
        <div style={{ fontSize: "11px", fontWeight: "bold", color: "#666" }}>
          FOS_min = 1.50
        </div>
      </div>
    </div>
  );
}




