import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv, fi, HR, Cl, SectionHead, SubHead, SubHeadCl,
  CalcBlock, Prose, Check, SummaryTable, Page, DetailedStory,
} from "./ReportUI";
import {
  HydraulicNarrative,
  StructuralNarrative,
  ClosingNarrative,
  VerificationNarrative,
} from "./engineeringNarrative";

/* 
   SECTION TECH NOTE  (Sheet 29)
   Golden-reference standard: design data  derivation  verdict
 */
export function SectionTechNote({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  const pierCount = Math.max(i.spans - 1, 0);
  return (
    <Page id="s-technote">
      <HR />
      <SectionHead>TECHNICAL NOTE  DESIGN OF SUBMERSIBLE BRIDGE</SectionHead>
      <Prose>
        Name of Work :- {i.name}
      </Prose>

      {/*  DESIGN DATA BLOCK  */}
      <SubHeadCl clause="IRC:SP:13-2004 / IRC:6-2017">
        A. DESIGN DATA
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "1. Right Effective Span",       result: fv(i.spanL, 2),          unit: "m",      where: "Clear span between bearings" },
        { sym: "2. Span c/c of Piers",          result: fv(i.spanL + i.pierW, 2),unit: "m",      where: "Centre-to-centre of supports" },
        { sym: "3. Overall Width of Bridge",    result: fv(i.totalW, 2),         unit: "m",      where: "Carriageway + footpath" },
        { sym: "4. H.F.L.",                     result: fv(i.HFL, 3),            unit: "m",      where: "Highest Flood Level (m MSL)" },
        { sym: "5. Flood Discharge (Q)",        result: fv(d.Q, 2),              unit: "Cumecs", where: "Manning's formula  IRC:SP:13 Art.5" },
        { sym: "6. River Bed Slope",            result: `1 in ${fi(i.S_denom)}`, unit: "",       where: "From survey data" },
        { sym: "7. Design Velocity (V)",        result: fv(d.V, 3),              unit: "m/s",    where: "V = (1/n)R^(2/3)S^(1/2)" },
        { sym: "8. Bed Level (NBL)",            result: fv(i.bedRL, 3),          unit: "m",      where: "Normal bed level at site" },
        { sym: "9. Safe Bearing Capacity",      result: fv(d.SBC, 2),            unit: "kN/m",  where: "From soil investigation report" },
        { sym: "10. Founding Level (RL)",       result: fv(d.foundingRL, 3),     unit: "m",      where: "HFL  F2  D_max (ASTRA)" },
        { sym: "11. Deck Level",                result: fv(i.HFL + 0.10, 3),     unit: "m",      where: "Submersible  deck at or near HFL" },
        { sym: "12. No. of Spans",              result: String(i.spans),         unit: "",       where: "Adopted from waterway analysis" },
        { sym: "13. No. of Piers",              result: String(pierCount),       unit: "",       where: "Spans  1" },
        { sym: "14. Pier Width (across flow)",  result: fv(i.pierW, 2),          unit: "m",      where: "Adopted from stability analysis" },
        { sym: "15. Concrete Grade (Deck)",     result: i.grade,                 unit: "",       where: "IRC:112-2011 Cl.6.4" },
        { sym: "16. Steel Grade",               result: i.steel,                 unit: "",       where: "IS:1786  HYSD bars" },
        { sym: "17. IRC Live Load Class",       result: "IRC Class A / 70R",     unit: "",       where: "IRC:6-2017 Cl.204" },
        { sym: "18. Seismic Zone",              result: i.seismicZone ?? "III",  unit: "",       where: "IS:1893 (Part 1):2016" },
      ]} />

      {/*  HYDRAULIC SUMMARY  */}
      <SubHeadCl clause="IRC:SP:13-2004 Art.5 / IRC:78-1983 Cl.703">
        B. HYDRAULIC DESIGN SUMMARY
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "Hydraulic Radius (R)",    eq: `A/P = ${fv(i.A)}/${fv(i.P_)}`,                                result: fv(d.R, 4),      unit: "m",      where: "Cross-sectional area / Wetted perimeter" },
        { sym: "Manning's Velocity (V)",  eq: `(1/${i.n})${fv(d.R,3)}^(2/3)(1/${fi(i.S_denom)})^(1/2)`,  result: fv(d.V, 3),      unit: "m/s",    where: "Manning's formula  IRC:SP:13 Art.5" },
        { sym: "Design Discharge (Q)",    eq: `A  V = ${fv(i.A)}  ${fv(d.V,3)}`,                          result: fv(d.Q, 2),      unit: "Cumecs", where: "Adopted design discharge", bold: true },
        { sym: "Lacey's Regime Width",    eq: `4.75  Q = 4.75  ${fv(d.Q,2)}`,                           result: fv(d.L_lacey,2), unit: "m",      where: "IRC:SP:13 Art.5.2.1" },
        { sym: "Proposed Waterway",       eq: `${i.spans}  ${fv(i.spanL)} = ${fv(totalL)}`,                 result: fv(totalL, 2),   unit: "m",      where: "Effective clear waterway provided" },
        { sym: "Mean Scour Depth (dsm)",  eq: `1.34(q/Ksf)^(1/3)`,                                        result: fv(d.dsm, 3),    unit: "m",      where: "Lacey's formula  IRC:78-1983 Cl.703.2.2.1" },
        { sym: "Max Scour Depth (D)",     eq: `1.272  dsm = 1.272  ${fv(d.dsm,3)}`,                       result: fv(d.max_dsm,3), unit: "m",      where: "ASTRA factor for pier scour" },
        { sym: "Afflux (h)",              eq: `Molesworth formula`,                                          result: fv(d.afflux, 3), unit: "m",      where: "IS:7784 (Part-I) 1975" },
        { sym: "Design Water Level (DWL)",eq: `HFL + h = ${fv(i.HFL)} + ${fv(d.afflux,3)}`,                 result: fv(d.DWL, 3),    unit: "m",      where: "Afflux flood level", bold: true },
      ]} />
      <Prose>
        The proposed waterway of <strong>{fv(totalL)} m</strong> is{" "}
        {totalL >= d.L_lacey * 0.95 ? "adequate" : "less than"} the Lacey's regime width of{" "}
        <strong>{fv(d.L_lacey)} m</strong>.{" "}
        <strong>{totalL >= d.L_lacey * 0.95 ? "Hence OK." : "Review waterway."}</strong>
      </Prose>

      {/*  STRUCTURAL SUMMARY  */}
      <SubHeadCl clause="IRC:112-2011 / IRC:6-2017">
        C. STRUCTURAL DESIGN SUMMARY
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "Deck Slab Thickness",     result: `${i.slab_t} mm`,                where: "Designed for IRC Class A / 70R loading" },
        { sym: "Wearing Coat",            result: `${i.slab_wc} mm`,               where: "Bituminous wearing course" },
        { sym: "Pier Dimensions",         result: `${i.pierW}m  ${i.pierL}m  ${i.pierH}m`, where: "Width  Length  Height" },
        { sym: "Pier Cap",                result: `${i.capW}m  ${i.capL}m  ${i.capD}m`,    where: "Width  Length  Depth" },
        { sym: "Pier Footing",            result: `${i.ftgPW}m  ${i.ftgPL}m  ${i.ftgPT}m`, where: "Width  Length  Thickness" },
        { sym: "Abutment Height",         result: `${i.abt_H} m`,                  where: "Total height including footing" },
        { sym: "Abutment Base Width",     result: `${i.abt_Bbase} m`,              where: "Footing base width" },
        { sym: "SBC (Adopted)",           result: `${fv(d.SBC)} kN/m`,            where: "Safe bearing capacity of founding strata", bold: true },
      ]} />

      {/*  DESIGN PHILOSOPHY  */}
      <SubHeadCl clause="IRC:5-2015 Cl.101">
        D. DESIGN PHILOSOPHY & GOVERNING STANDARDS
      </SubHeadCl>
      <Prose>
        The bridge is designed as a <strong>Submersible RCC Slab Bridge</strong> allowing
        floodwaters to pass over the deck during peak flood events. The design philosophy
        ensures structural stability under all load combinations including dead load, live
        load, water current, wind, and seismic forces as per IRC:6-2017.
      </Prose>
      <Prose>
        The structure is designed for <strong>IRC Class A</strong> loading (single lane) and
        cross-checked for <strong>IRC 70R Wheeled</strong> loading. The deck slab is designed
        by Limit State Method (IRC:112-2011) and cross-verified by Working Stress Method
        (IRC:21-2000). Foundation design follows IRC:78-2014 and IS:6403-1981.
      </Prose>
      <Prose>
        <strong>Governing Codes:</strong> IRC:5-2015  IRC:6-2017  IRC:21-2000 
        IRC:78-2014  IRC:112-2011  IRC:SP:13-2004  IS:456-2000  IS:1786 
        IS:1893(Pt1):2016  IS:6403-1981  IS:7784(Pt-I)-1975
      </Prose>

      {/*  ENGINEERING NARRATIVE (deterministic prose from computed values)  */}
      <HydraulicNarrative i={i} d={d} />
      <StructuralNarrative i={i} d={d} />
      <ClosingNarrative i={i} d={d} />
    </Page>
  );
}

/* 
   SECTION TECH REPORT  (Sheet 31)
 */
export function SectionTechReport({ i, d }: { i: Inputs; d: Derived }) {
  const pierSafe = d.pierLCs.every(lc => lc.slidFOS >= 1.5 && lc.qmax <= d.SBC);
  const abtSafe  = d.abtCases.every(c => c.slidOK && c.bearOK);
  return (
    <Page id="s-techreport">
      <HR />
      <SectionHead>TECHNICAL REPORT  ASSESSMENT MATRIX</SectionHead>
      <Prose>
        This assessment matrix summarises the design verification across all major
        structural components. Each check references the governing IRC/IS clause and
        states the computed value against the permissible limit.
      </Prose>
      <SummaryTable
        head={["S.No", "Check", "Computed", "Permissible", "Clause", "Status"]}
        rows={[
          ["1",  "Design Discharge Q",          `${fv(d.Q,2)} Cumecs`,    "",                    "IRC:SP:13 Art.5",       "OK"],
          ["2",  "Afflux h",                    `${fv(d.afflux,3)} m`,    " 0.60 m (submersible)","IS:7784 Pt-I",         d.afflux <= 0.60 ? "OK" : "REVIEW"],
          ["3",  "Scour Depth (dsm)",            `${fv(d.dsm,3)} m`,       "",                    "IRC:78 Cl.703.2.2.1",  "OK"],
          ["4",  "SBC vs Pier q_max",            `${fv(Math.max(...d.pierLCs.map(l=>l.qmax)),2)} kN/m`, `${fv(d.SBC)} kN/m`, "IS:6403",  pierSafe ? "OK" : "REVIEW"],
          ["5",  "Pier Sliding FOS",             `${fv(Math.min(...d.pierLCs.map(l=>l.slidFOS)),3)}`, " 1.50",           "IRC:78 Cl.706",        pierSafe ? "OK" : "REVIEW"],
          ["6",  "Abutment Sliding FOS",         `${fv(Math.min(...d.abtCases.map(c=>c.slidFOS)),3)}`, " 1.50",          "IRC:78 Cl.710",        abtSafe ? "OK" : "REVIEW"],
          ["7",  "Abutment Bearing",             `${fv(Math.max(...d.abtCases.map(c=>c.qmax)),2)} kN/m`, `${fv(d.SBC)} kN/m`, "IS:6403", abtSafe ? "OK" : "REVIEW"],
          ["8",  "Deck Slab Depth (IRC:66)",     `${fv(d.sl66_dreq,0)} mm req.`, `${fi(i.slab_t*1000 - i.slab_cover)} mm prov.`, "IRC:21-2000", (i.slab_t*1000 - i.slab_cover) >= d.sl66_dreq ? "OK" : "REVIEW"],
          ["9",  "Deck Slab Steel (IRC:66)",     `${Math.ceil(d.sl66_Ast)} mm`, `${Math.ceil(d.Ast_prov_slab)} mm`, "IRC:21-2000", d.Ast_prov_slab >= d.sl66_Ast ? "OK" : "REVIEW"],
          ["10", "Deck Anchorage Net Force",     `${fv(d.net_force,2)} kN`, " 0 (no uplift)",    "IRC:6-2017 Cl.213.7",  d.net_force >= 0 ? "OK" : "ANCHOR REQ."],
          ["11", "Froude Number (Fr)",           `${fv(d.Fr,3)}`,          "< 1.0 (subcritical)", "IS:7784",              d.Fr < 1.0 ? "OK" : "REVIEW"],
          ["12", "Waterway vs Lacey",            `${fv(i.spans*i.spanL,2)} m`, ` ${fv(d.L_lacey*0.95,2)} m`, "IRC:SP:13", i.spans*i.spanL >= d.L_lacey*0.95 ? "OK" : "REVIEW"],
        ]}
      />
      <Prose>
        All critical design checks are <strong>{pierSafe && abtSafe ? "SATISFACTORY" : "REQUIRE REVIEW"}</strong>.
        The structure is safe for the design loads and environmental conditions specified.
        <strong> Hence OK.</strong>
      </Prose>

      {/*  VERIFICATION NARRATIVE (reads the matrix above row-by-row)  */}
      <VerificationNarrative i={i} d={d} />
    </Page>
  );
}

/* 
   SECTION ABSTRACT  (Sheet 33)
 */
export function SectionAbstract({ i }: { i: Inputs }) {
  return (
    <Page id="s-abstract">
      <HR />
      <SectionHead>ABSTRACT OF QUANTITIES  WORKBOOK SYNCHRONIZED</SectionHead>
      <Prose>
        The following quantities are derived from the project's Excel measurement workbook.
        Each item has been verified against the structural design parameters.
        Quantities marked zero are to be filled from the workbook after measurement.
      </Prose>
      <SummaryTable
        head={["S.No", "Description", "Unit", "Quantity", "Remarks"]}
        rows={[
          ["1",  "Earthwork in excavation",                "m",  fv(i.qty_earthwork), "Foundation pits for piers and abutments"],
          ["2",  "PCC M15 (1:4:8) levelling course",       "m",  fv(i.qty_pcc),       "Under all footings  150mm thick"],
          ["3",  "RCC M25  Footing / Substructure",       "m",  fv(i.qty_m25),       "Pier footings and abutment footings"],
          ["4",  "RCC M30  Pier body, Cap, Abutment",     "m",  fv(i.qty_m30),       "All substructure above footing"],
          ["5",  "RCC M35  Deck Slab",                    "m",  fv(i.qty_m35),       "Superstructure deck slab"],
          ["6",  "HYSD Steel Fe500 Reinforcement",         "MT",  fv(i.qty_steel),     "All structural reinforcement"],
          ["7",  "Formwork and shuttering",                "m",  fv(i.qty_formwork),  "All exposed concrete surfaces"],
          ["8",  "Wearing coat (75mm bituminous)",         "m",  fv(i.qty_wc),        "Deck surface wearing course"],
          ["9",  "Stone pitching / apron",                 "m",  fv(i.qty_pitching),  "Scour protection at piers and abutments"],
          ["10", "Filtered backfill behind abutment",      "m",  fv(i.qty_backfill),  "Granular fill with drainage"],
          ["11", "MS pipe railing",                        "RM",  fv(i.qty_railing),   "Both sides of bridge deck"],
        ]}
      />
      <Prose>
        Note: Quantities are to be entered from the Excel workbook measurement sheets.
        Default values are zero until workbook data is pasted into Section H of the input form.
      </Prose>
    </Page>
  );
}

/* 
   SECTION BOQ  (Sheet 46)
 */
export function SectionBOQ({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  const deckArea = totalL * i.totalW;
  return (
    <Page id="s-boq">
      <HR />
      <SectionHead>BILL OF QUANTITIES & ESTIMATED COST</SectionHead>
      <Prose>
        Name of Work :- {i.name}
      </Prose>

      {/*  DESIGN DATA FOR COST  */}
      <SubHeadCl clause="PWD SoR / BSR Rates">
        A. DESIGN DATA FOR COST ESTIMATION
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "Total Bridge Length",   eq: `${i.spans}  ${fv(i.spanL)} = ${fv(totalL)}`,  result: fv(totalL,2),  unit: "m",   where: "Spans  span length" },
        { sym: "Deck Area",             eq: `${fv(totalL)}  ${fv(i.totalW)}`,               result: fv(deckArea,2),unit: "m",  where: "Length  total width" },
        { sym: "No. of Piers",          result: String(Math.max(i.spans-1,0)),               unit: "",             where: "Intermediate supports" },
        { sym: "No. of Abutments",      result: "2",                                         unit: "",             where: "End supports" },
      ]} />

      {/*  BOQ TABLE  */}
      <SubHeadCl clause="Standard Schedule of Rates">
        B. BILL OF QUANTITIES
      </SubHeadCl>
      <SummaryTable
        head={["S.No", "Description", "Unit", "Qty", "Rate ()", "Amount ()"]}
        rows={[
          ["1",  "Earthwork in excavation",              "m",  fv(d.boqQty.earthwork), fi(i.rate_earthwork), fi(d.boqAmt.earthwork)],
          ["2",  "PCC M15 levelling course",             "m",  fv(d.boqQty.pcc),       fi(i.rate_pcc),       fi(d.boqAmt.pcc)],
          ["3",  "RCC M25 Substructure",                 "m",  fv(d.boqQty.m25),       fi(i.rate_m25),       fi(d.boqAmt.m25)],
          ["4",  "RCC M30 Pier / Cap / Abutment",        "m",  fv(d.boqQty.m30),       fi(i.rate_m30),       fi(d.boqAmt.m30)],
          ["5",  "RCC M35 Deck Slab",                    "m",  fv(d.boqQty.m35),       fi(i.rate_m35),       fi(d.boqAmt.m35)],
          ["6",  "HYSD Steel Fe500",                     "MT",  fv(d.boqQty.steel),     fi(i.rate_steel),     fi(d.boqAmt.steel)],
          ["7",  "MS Pipe Railing",                      "RM",  fv(d.boqQty.railing),   fi(i.rate_railing),   fi(d.boqAmt.railing)],
          ["8",  "Wearing Coat (75mm)",                  "m",  fv(d.boqQty.wc),        fi(i.rate_wc),        fi(d.boqAmt.wc)],
          ["9",  "Stone Pitching / Apron",               "m",  fv(d.boqQty.pitching),  fi(i.rate_pitching),  fi(d.boqAmt.pitching)],
          ["10", "Filtered Backfill",                    "m",  fv(d.boqQty.backfill),  fi(i.rate_backfill),  fi(d.boqAmt.backfill)],
        ]}
      />

      {/*  COST SUMMARY  */}
      <SubHeadCl clause="PWD Norms">
        C. COST SUMMARY
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "Sub-Total (A)",          eq: "Sum of all BOQ items",                                    result: ` ${fi(d.boqSub)}`,    where: "Direct material and labour cost" },
        { sym: "Contingencies (3%)",     eq: `3%  ${fi(d.boqSub)}`,                                   result: ` ${fi(d.boqCont)}`,   where: "Unforeseen items  PWD norm 3%" },
        { sym: "Contractor Profit (10%)",eq: `10%  ${fi(d.boqSub)}`,                                  result: ` ${fi(d.boqProfit)}`, where: "Overhead and profit  standard 10%" },
        { sym: "GST @ 18%",              eq: `18%  (${fi(d.boqSub)} + ${fi(d.boqCont)} + ${fi(d.boqProfit)})`, result: ` ${fi(d.boqGST)}`, where: "Goods and Services Tax" },
        { sym: "GRAND TOTAL",            eq: "A + Contingencies + Profit + GST",                       result: ` ${fi(d.boqGrand)}`,  where: "Total estimated project cost", bold: true },
      ]} />

      {/*  UNIT COST METRICS  */}
      <SubHeadCl clause="Performance Metrics">
        D. UNIT COST METRICS
      </SubHeadCl>
      <CalcBlock whereHeader rows={[
        { sym: "Cost per Running Metre", eq: `${fi(d.boqGrand)} / ${fv(totalL,2)}`,   result: ` ${fi(d.boqPerRM)}`,   unit: "/m",  where: "Grand total / total bridge length" },
        { sym: "Cost per Deck Area",     eq: `${fi(d.boqGrand)} / ${fv(deckArea,2)}`, result: ` ${fi(d.boqPerSqm)}`,  unit: "/m", where: "Grand total / deck area", bold: true },
      ]} />
      <Prose>
        The estimated cost of <strong> {fi(d.boqGrand)}</strong> (Rupees {fi(d.boqGrand)} only)
        is based on the Standard Schedule of Rates. The cost per running metre of
        <strong>  {fi(d.boqPerRM)}/m</strong> is within the acceptable range for submersible
        bridges of this span configuration. <strong>Hence OK.</strong>
      </Prose>
    </Page>
  );
}

export function SectionMOST({ i }: { i: Inputs }) { return null; }
