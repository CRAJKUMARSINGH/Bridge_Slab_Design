import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv, fi, HR, Cl, SectionHead, SubHead, SubHeadCl,
  CalcBlock, Prose, Check, SummaryTable, Page, DetailedStory,
} from "./ReportUI";

/**
 * PREAMBLE SHEET (Sheet 0)
 * Golden-reference standard: formal design data block + governing standards
 */
export function PreambleSheet({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  return (
    <Page id="s-preamble">
      <HR />
      <SectionHead>DESIGN OF SUBMERSIBLE BRIDGE  PREAMBLE & BASIS OF DESIGN</SectionHead>

      {/*  PROJECT BANNER  */}
      <div style={{ textAlign: "center", marginBottom: 16, fontFamily: "Verdana,sans-serif" }}>
        {i.firmName && (
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#1e3a5f", marginBottom: 4 }}>
            {i.firmName}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#333" }}>
          Name of Work :- {i.name}
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
          Location :- {i.location} &nbsp;|&nbsp; River :- {i.river}
        </div>
        <div style={{ fontSize: 10, color: "#555" }}>
          Job No. :- {i.jobNo} &nbsp;|&nbsp; Engineer :- {i.engineer}
        </div>
        <div style={{ fontSize: 10, color: "#555" }}>
          Date :- {new Date().toLocaleDateString("en-IN")} &nbsp;|&nbsp;
          STRUDS Ver. :- {i.strudsVer} / {i.buildVer}
        </div>
      </div>

      {/*  DESIGN DATA  */}
      <SubHeadCl clause="IRC:SP:13-2004 / IRC:6-2017">
        1. DESIGN DATA
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "1.  Right Effective Span",       result: fv(i.spanL, 2),                    unit: "m",      where: "Clear span between bearings" },
        { sym: "2.  Span c/c of Piers",          result: fv(i.spanL + i.pierW, 2),          unit: "m",      where: "Centre-to-centre of supports" },
        { sym: "3.  No. of Spans",               result: String(i.spans),                   unit: "",       where: "Adopted from waterway analysis" },
        { sym: "4.  Total Bridge Length",         result: fv(totalL, 2),                     unit: "m",      where: `${i.spans}  ${fv(i.spanL)} m` },
        { sym: "5.  Carriageway Width",           result: fv(i.cwWidth, 2),                  unit: "m",      where: "Clear carriageway" },
        { sym: "6.  Overall Width",               result: fv(i.totalW, 2),                   unit: "m",      where: "Carriageway + footpath" },
        { sym: "7.  Skew Angle",                  result: `${i.skewDeg}`,                   unit: "",       where: "0 = right bridge" },
        { sym: "8.  H.F.L.",                      result: fv(i.HFL, 3),                      unit: "m",      where: "Highest Flood Level (m MSL)" },
        { sym: "9.  Normal Bed Level (NBL)",      result: fv(i.bedRL, 3),                    unit: "m",      where: "River bed level at site" },
        { sym: "10. Manning's n",                 result: String(i.n),                       unit: "",       where: "Rugosity coefficient from IRC:SP:13 Table" },
        { sym: "11. Bed Slope",                   result: `1 in ${fi(i.S_denom)}`,           unit: "",       where: "From survey data" },
        { sym: "12. Lacey's Silt Factor (Ksf)",   result: String(i.Ksf),                     unit: "",       where: "From soil investigation" },
        { sym: "13. Design Discharge (Q)",        result: fv(d.Q, 2),                        unit: "Cumecs", where: "Manning's formula  IRC:SP:13 Art.5", bold: true },
        { sym: "14. Design Velocity (V)",         result: fv(d.V, 3),                        unit: "m/s",    where: "V = (1/n)R^(2/3)S^(1/2)" },
        { sym: "15. Mean Scour Depth (dsm)",      result: fv(d.dsm, 3),                      unit: "m",      where: "Lacey's formula  IRC:78-1983 Cl.703.2.2.1" },
        { sym: "16. Afflux (h)",                  result: fv(d.afflux, 3),                   unit: "m",      where: "Molesworth formula  IS:7784 Pt-I" },
        { sym: "17. Design Water Level (DWL)",    result: fv(d.DWL, 3),                      unit: "m",      where: `HFL + h = ${fv(i.HFL)} + ${fv(d.afflux,3)}`, bold: true },
        { sym: "18. Founding Level (RL)",         result: fv(d.foundingRL, 3),               unit: "m",      where: "HFL  F2  D_max (ASTRA)" },
        { sym: "19. Safe Bearing Capacity",       result: fv(d.SBC, 2),                      unit: "kN/m",  where: "From soil investigation report" },
        { sym: "20. Angle of Internal Friction",  result: `${i.phi}`,                       unit: "",       where: "Backfill soil property" },
        { sym: "21. Unit Weight of Backfill",     result: `${i.gamma} kN/m`,                unit: "",       where: "Soil unit weight" },
        { sym: "22. Concrete Grade (Deck)",       result: i.grade,                           unit: "",       where: "IRC:112-2011 Cl.6.4" },
        { sym: "23. Steel Grade",                 result: i.steel,                           unit: "",       where: "IS:1786  HYSD bars" },
        { sym: "24. IRC Live Load Class",         result: "IRC Class A / 70R",               unit: "",       where: "IRC:6-2017 Cl.204" },
        { sym: "25. Seismic Zone",                result: i.seismicZone ?? "III",            unit: "",       where: "IS:1893 (Part 1):2016" },
      ]} />

      {/*  GOVERNING STANDARDS  */}
      <SubHeadCl clause="IRC / IS Codes">
        2. GOVERNING DESIGN STANDARDS
      </SubHeadCl>
      <div style={{ fontFamily: "Verdana,sans-serif", fontSize: 10, lineHeight: 1.9, color: "#333", marginBottom: 16 }}>
        <div><Cl>IRC:5-2015</Cl>  General Features of Design for Bridges</div>
        <div><Cl>IRC:6-2017</Cl>  Standard Specifications and Code of Practice for Road Bridges (Loads)</div>
        <div><Cl>IRC:21-2000</Cl>  Code of Practice for Plain and Reinforced Concrete (Working Stress)</div>
        <div><Cl>IRC:78-2014</Cl>  Foundations and Substructure</div>
        <div><Cl>IRC:112-2011</Cl>  Code of Practice for Concrete Road Bridges (Limit State)</div>
        <div><Cl>IRC:SP:13-2004</Cl>  Guidelines for Design of Small Bridges and Culverts</div>
        <div><Cl>IS:456-2000</Cl>  Plain and Reinforced Concrete  Code of Practice</div>
        <div><Cl>IS:1786</Cl>  High Strength Deformed Steel Bars and Wires</div>
        <div><Cl>IS:1893(Pt1):2016</Cl>  Criteria for Earthquake Resistant Design</div>
        <div><Cl>IS:6403-1981</Cl>  Code of Practice for Determination of Bearing Capacity of Shallow Foundations</div>
        <div><Cl>IS:7784(Pt-I)-1975</Cl>  Code of Practice for Design of Cross-Drainage Works</div>
      </div>

      {/*  DESIGN PHILOSOPHY  */}
      <SubHeadCl clause="IRC:5-2015 Cl.101">
        3. DESIGN PHILOSOPHY
      </SubHeadCl>
      <Prose>
        The bridge is designed as a <strong>Submersible RCC Slab Bridge</strong> allowing
        floodwaters to pass over the deck during peak flood events. The design ensures
        structural stability under all load combinations  dead load, live load, water
        current, wind, and seismic forces  as per IRC:6-2017.
      </Prose>
      <Prose>
        The deck slab is designed by <strong>Limit State Method</strong> (IRC:112-2011)
        and cross-verified by <strong>Working Stress Method</strong> (IRC:21-2000).
        Foundation design follows IRC:78-2014 and IS:6403-1981. All stability checks
        are performed at the footing base level using the Meyerhof eccentric bearing
        formula: <strong>q = V/A  Ve/Z</strong>.
      </Prose>

      {/*  SIGNATURE BLOCK  */}
      <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, fontFamily: "Verdana,sans-serif", fontSize: 10 }}>
        <div>
          <div style={{ borderTop: "1px solid #333", paddingTop: 6 }}>
            <div style={{ fontWeight: "bold" }}>Prepared by</div>
            <div style={{ color: "#555", marginTop: 4 }}>{i.engineer}</div>
            <div style={{ color: "#555" }}>{i.firmName}</div>
          </div>
        </div>
        <div>
          <div style={{ borderTop: "1px solid #333", paddingTop: 6 }}>
            <div style={{ fontWeight: "bold" }}>Checked by</div>
            <div style={{ color: "#555", marginTop: 4 }}>Engineer-in-Charge</div>
            <div style={{ color: "#555" }}>Seal & Date</div>
          </div>
        </div>
      </div>
    </Page>
  );
}
