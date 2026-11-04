import React from "react";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FORMAT HELPERS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export const fv = (n: number, dec = 2) =>
  isNaN(n)
    ? "â€”"
    : n.toLocaleString("en-IN", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
export const fi = (n: number) => Math.round(n).toLocaleString("en-IN");
export const fmt = (n: number, dec: number) => (n || 0).toFixed(dec);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DISPLAY PRIMITIVES  (STRUDS style)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function HR() {
  return (
    <div style={{ borderTop: "2px solid orchid", margin: "10px 0 14px" }} />
  );
}
export function Cl({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ color: "blue", fontStyle: "italic", fontSize: 10 }}>
      {children}
    </span>
  );
}
export function SectionHead({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        fontFamily: "Verdana,sans-serif",
        fontSize: 13,
        fontWeight: "bold",
        color: "darkorchid",
        borderBottom: "2px solid royalblue",
        padding: "6px 0",
        margin: "24px 0 10px",
        background:
          "linear-gradient(90deg, rgba(138,43,226,0.05) 0%, transparent 100%)",
        paddingLeft: 8,
        borderLeft: "4px solid darkorchid",
      }}
    >
      {children}
    </div>
  );
}
export function SubHead({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        fontFamily: "Verdana,sans-serif",
        fontSize: 11,
        fontWeight: "bold",
        color: "#483d8b",
        textDecoration: "none",
        margin: "18px 0 6px",
        borderBottom: "1px solid #eee",
        paddingBottom: 2,
      }}
    >
      {children}
    </div>
  );
}
export function SubHeadCl({
  children,
  clause,
}: {
  children: React.ReactNode;
  clause: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontWeight: "bold",
        fontSize: 11,
        fontFamily: "Verdana,sans-serif",
        margin: "12px 0 4px",
        color: "#333",
      }}
    >
      <span style={{ color: "darkorchid", textDecoration: "underline" }}>
        {children}
      </span>
      <Cl>{clause}</Cl>
    </div>
  );
}
export interface CRow {
  sym?: string;
  eq?: React.ReactNode;
  result?: React.ReactNode;
  unit?: string;
  where?: React.ReactNode;
  clause?: React.ReactNode;
  indent?: boolean;
  bold?: boolean;
  note?: "ok" | "fail" | "warn";
  blank?: boolean;
}
export function CalcRow({
  sym,
  eq,
  result,
  unit,
  where,
  clause,
  indent,
  bold,
  note,
  blank,
}: CRow) {
  if (blank) return <div style={{ height: 6 }} />;
  const noteColor =
    note === "ok" ? "green" : note === "fail" ? "#b00020" : "#b07a00";
  return (
    <div
      className="calc-row"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1fr",
        gap: 12,
        alignItems: "baseline",
        marginBottom: 4,
        padding: "2px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      {/* Col 1: Descriptive Where */}
      <div
        style={{
          fontSize: 9.5,
          color: note ? noteColor : "#222",
          fontFamily: "Verdana,sans-serif",
          fontWeight: note ? "bold" : "normal",
          paddingRight: 8,
          borderRight: "1px solid #eee",
        }}
      >
        {where}
        {note && (
          <span style={{ marginLeft: 4 }}>
            {note === "ok" ? "âœ“ OK" : note === "fail" ? "âœ— CHECK" : "âš  WARN"}
          </span>
        )}
      </div>

      {/* Col 2: Computation */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 0,
          fontFamily: "Verdana,sans-serif",
          fontSize: 10.5,
          fontWeight: bold ? "bold" : "normal",
        }}
      >
        {sym !== undefined && (
          <span
            style={{
              display: "inline-block",
              minWidth: 60,
              textAlign: "right",
              fontStyle: "italic",
              fontWeight: bold ? "bold" : "normal",
              marginRight: 8,
            }}
          >
            {sym}
          </span>
        )}
        {sym !== undefined && (
          <span style={{ minWidth: 20, textAlign: "center", color: "#666" }}>
            {" = "}
          </span>
        )}
        {sym === undefined && indent && <span style={{ minWidth: 80 }} />}
        <span
          style={{
            flex: 1,
            color: "#005a00",
            fontFamily: "Consolas,'Courier New',monospace",
            fontSize: 10,
          }}
        >
          {eq}
        </span>
        {result !== undefined && (
          <span
            style={{
              minWidth: 70,
              textAlign: "right",
              fontWeight: "bold",
              color: "#000",
              fontFamily: "Verdana,sans-serif",
              fontSize: 10.5,
            }}
          >
            {" "}
            {result}
          </span>
        )}
        {unit && (
          <span style={{ marginLeft: 5, color: "#666", fontSize: 9.5 }}>
            {unit}
          </span>
        )}
      </div>

      {/* Col 3: Where / Reference */}
      <div
        style={{
          textAlign: "left",
          fontSize: 9,
          color: "#555",
          fontStyle: "italic",
          paddingLeft: 8,
          borderLeft: "1px solid #eee",
        }}
      >
        {where && <span style={{ color: "#777" }}>{where}</span>}
        {clause && (
          <div style={{ color: "blue", marginTop: 2 }}>{clause}</div>
        )}
      </div>
    </div>
  );
}

/**
 * DetailedStory: For high-fidelity arithmetic storytelling.
 * Renders multiple steps of a calculation with explicit units.
 */
export function DetailedStory({
  label,
  steps,
  result,
  unit,
  where,
  bold,
}: {
  label: string;
  steps: string[];
  result: string | number;
  unit?: string;
  where?: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 3fr 1fr",
        gap: 12,
        marginBottom: 8,
        fontSize: 10,
        fontFamily: "Verdana,sans-serif",
        alignItems: "baseline",
      }}
    >
      <div style={{ fontWeight: bold ? "bold" : "normal", color: "#333" }}>{label}</div>
      <div style={{ fontFamily: "Consolas, monospace", color: "#005a00" }}>
        {steps.map((s, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "baseline" }}>
            {idx > 0 && <span style={{ marginRight: 8 }}>=</span>}
            <span>{s}</span>
          </div>
        ))}
        <div style={{ textAlign: "right", fontWeight: "bold", color: "#000", marginTop: 2 }}>
          = {result} {unit}
        </div>
      </div>
      <div style={{ fontSize: 9, color: "#666", fontStyle: "italic" }}>
        {where}
      </div>
    </div>
  );
}
export function CalcBlock({
  rows,
  whereHeader,
}: {
  rows: CRow[];
  whereHeader?: boolean;
}) {
  return (
    <div
      className="glass-card"
      style={{
        margin: "10px 0 15px",
        padding: "10px 14px",
        borderRadius: 6,
        borderLeft: "4px solid #c8b8d0",
        background: "rgba(252, 248, 255, 0.4)",
      }}
    >
      {whereHeader && (
        <div style={{ display: "flex", marginBottom: 6 }}>
          <div style={{ flex: "0 0 56%" }} />
          <div
            style={{
              flex: 1,
              fontSize: 9.5,
              color: "#666",
              fontWeight: "bold",
              fontFamily: "Verdana,sans-serif",
              paddingLeft: 10,
              borderLeft: "1px solid #e0e0e0",
            }}
          >
            Where
          </div>
        </div>
      )}
      {rows.map((r, i) => (
        <CalcRow key={i} {...r} />
      ))}
    </div>
  );
}
export function Prose({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 11,
        lineHeight: 1.6,
        color: "#444",
        marginBottom: 12,
        fontFamily: "Times New Roman, serif",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
export function Check({
  pass,
  children,
}: {
  pass: boolean;
  children?: React.ReactNode;
}) {
  return (
    <span
      style={{
        color: pass ? "green" : "#b00020",
        fontWeight: "bold",
        fontSize: 10,
      }}
    >
      {pass ? "âœ“  " : "âœ—  "}
      {children}
    </span>
  );
}
export function Gov({ children }: { children?: React.ReactNode }) {
  return (
    <span
      style={{
        color: "#007a3d",
        fontWeight: "bold",
        fontStyle: "italic",
        fontSize: 10,
      }}
    >
      {children || "âœ“ Governing Case"}
    </span>
  );
}
export function SummaryTable({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <table
      style={{
        borderCollapse: "collapse",
        fontSize: 9.5,
        marginBottom: 15,
        fontFamily: "Verdana,sans-serif",
        width: "100%",
        maxWidth: "100%",
        border: "1px solid #b8a0c8",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <thead>
        <tr>
          {head.map((h, i) => (
            <th
              key={i}
              style={{
                background: "linear-gradient(180deg, #f8f1fc 0%, #ede0f5 100%)",
                color: "#4b0082",
                border: "1px solid #a080b0",
                fontWeight: "bold",
                padding: "6px 12px",
                textAlign: i === 0 ? "left" : "center",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            style={{
              background: ri % 2 === 0 ? "#fff" : "rgba(250, 248, 252, 0.6)",
              transition: "background 0.2s ease",
            }}
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                style={{
                  border: "1px solid #c8b8d0",
                  padding: "6px 12px",
                  textAlign: ci === 0 ? "left" : "center",
                  verticalAlign: "top",
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function Page({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="page-section relative mx-auto bg-white mb-6 print:mb-0 print:shadow-none"
      style={{
        width: "297mm",
        minHeight: "210mm",
        padding: "20mm",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        boxSizing: "border-box",
        pageBreakAfter: "always",
      }}
    >
      {children}
    </div>
  );
}


