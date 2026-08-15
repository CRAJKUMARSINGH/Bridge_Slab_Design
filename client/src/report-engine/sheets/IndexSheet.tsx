import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import { Page, SectionHead, HR, Prose, SummaryTable } from "./ReportUI";

/**
 * HYBRID INDEX SHEET (Sheet 0)
 * Replicates the professional index from the reference application.
 */
export function IndexSheet({ i }: { i: Inputs }) {
  const indexItems = [
    { sn: 1, title: "Preamble & Technical Report", sheet: "1" },
    { sn: 2, title: "Hydraulic Design & Waterway Analysis", sheet: "2-7" },
    { sn: 3, title: "Stability Check for Pier (All Load Cases)", sheet: "8-11" },
    { sn: 4, title: "Computation of Reinforcement in Pier", sheet: "12-14" },
    { sn: 5, title: "Design of Pier Footing & Cap", sheet: "15-18" },
    { sn: 6, title: "Stability Check for Abutment (Type 1)", sheet: "19-22" },
    { sn: 7, title: "Detailed Design of Abutment Footing & Stem", sheet: "23-28" },
    { sn: 8, title: "Detailed Design of C1 Abutment", sheet: "29-34" },
    { sn: 9, title: "Cross Sections & L-Section of River", sheet: "35-37" },
    { sn: 10, title: "General Arrangement Drawing (GAD)", sheet: "38-40" },
    { sn: 11, title: "Abstract of Cost & BOQ", sheet: "45-46" },
  ];

  return (
    <Page id="s-index">
      <HR />
      <div style={{ textAlign: "center", marginBottom: 40, marginTop: 40 }}>
         <h1 style={{ color: "#1e3a5f", fontSize: "24pt", textTransform: "uppercase", letterSpacing: 3, marginBottom: 10 }}>{i.name}</h1>
         <div style={{ height: 4, width: 80, background: "royalblue", margin: "0 auto 20px" }}></div>
         <h2 style={{ fontSize: "18pt", letterSpacing: 10, color: "#666" }}>INDEX</h2>
      </div>

      <div style={{ maxWidth: 650, margin: "0 auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Verdana, sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ padding: 10, textAlign: "center", width: 50 }}>S.No</th>
              <th style={{ padding: 10, textAlign: "left" }}>Particulars</th>
              <th style={{ padding: 10, textAlign: "center", width: 80 }}>Sheet No.</th>
            </tr>
          </thead>
          <tbody>
            {indexItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px 10px", textAlign: "center" }}>{item.sn}</td>
                <td style={{ padding: "12px 10px", fontWeight: idx < 2 ? "bold" : "normal" }}>{item.title}</td>
                <td style={{ padding: "12px 10px", textAlign: "center", fontStyle: "italic", color: "#666" }}>{item.sheet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 50, fontSize: 10, color: "#888" }}>
        <HR />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
           <span>System: Bridge Design Suite v2.0 Hybrid</span>
           <span>Audit Date: {new Date().toLocaleDateString("en-IN")}</span>
        </div>
      </div>
    </Page>
  );
}


