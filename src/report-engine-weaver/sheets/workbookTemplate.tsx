import React from "react";

/**
 * WORKBOOK TEMPLATE (Aesthetic Foundation v2.0)
 * Provides standardized, professional bridge engineering report components.
 * Matches "Som River" benchmark style: Royal Blue / Dark Orchid / Medium Borders.
 */

export const Page = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <section id={id} className="report-page" style={{ 
    padding: "30px 40px", 
    marginBottom: 40, 
    background: "#fff", 
    border: "1px solid #ccc",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
    minHeight: "1050px",
    position: "relative"
  }}>
    {children}
  </section>
);

export const SectionHead = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ 
    color: "#fff", 
    background: "linear-gradient(to right, #1e1a2e, #4b0082)", 
    padding: "10px 15px", 
    fontSize: 16, 
    textTransform: "uppercase",
    borderLeft: "5px solid royalblue",
    marginBottom: 20
  }}>
    {children}
  </h2>
);

export const SubHead = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ color: "royalblue", borderBottom: "1px solid #ddd", paddingBottom: 5, marginBottom: 15, fontSize: 13 }}>
    {children}
  </h3>
);

export const CalcBlock = ({ rows }: { rows: any[] }) => (
  <div style={{ margin: "15px 0", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx} style={{ background: r.blank ? "transparent" : (idx % 2 === 0 ? "#fff" : "#f9f8ff") }}>
            {r.blank ? (
              <td colSpan={4} style={{ height: 10 }} />
            ) : (
              <>
                <td style={{ padding: "8px 12px", width: "35%", color: "#555" }}>{r.where}</td>
                <td style={{ padding: "8px 12px", width: "15%", textAlign: "center", fontWeight: "bold" }}>{r.sym}</td>
                <td style={{ padding: "8px 12px", width: "30%", textAlign: "right", fontFamily: "Consolas, monospace" }}>{r.eq || ""}</td>
                <td style={{ padding: "8px 12px", width: "20%", textAlign: "right", fontWeight: "bold", fontSize: 12 }}>
                  {r.result} <small style={{ fontWeight: "normal", color: "#666" }}>{r.unit}</small>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Prose = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ margin: "10px 0", lineHeight: 1.6, color: "#333", ...style }}>{children}</p>
);

export const HR = () => <hr style={{ border: 0, borderTop: "2px solid darkorchid", margin: "20px 0" }} />;

export const PageBreak = () => <div className="page-break" style={{ pageBreakBefore: "always", height: 1 }} />;

export const Check = ({ pass, children }: { pass?: boolean; children: React.ReactNode }) => (
  <div style={{ 
    padding: "8px 12px", 
    background: pass ? "#e6f4ed" : "#fce8ec", 
    borderLeft: `5px solid ${pass ? "#007a3d" : "#b00020"}`,
    color: pass ? "#004d26" : "#7b0016",
    fontSize: 10,
    marginTop: 5
  }}>
    {pass ? "âœ“ " : "âœ— "} {children}
  </div>
);

export const SummaryTable = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", margin: "15px 0", fontSize: 11 }}>
    <thead>
      <tr style={{ background: "#f0f0f0", borderTop: "2px solid #333", borderBottom: "1px solid #333" }}>
        {head.map((h, i) => <th key={i} style={{ padding: 10, textAlign: "left" }}>{h}</th>)}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
          {row.map((cell, j) => <td key={j} style={{ padding: 10 }}>{cell}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);


