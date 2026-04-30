import React from "react";
import type { Inputs } from "../BridgeSlabReport";

export function ReportFooter({ i }: { i: Inputs }) {
  return (
    <div
      style={{
        marginTop: 40,
        borderTop: "2px solid darkorchid",
        paddingTop: 16,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#666",
          textAlign: "center",
          fontFamily: "Verdana,sans-serif",
          marginBottom: 16,
        }}
      >
        <div>
          STRUDS-style calculation report â€”{" "}
          <span style={{ color: "royalblue", fontStyle: "italic" }}>
            IRC:SP:13
          </span>{" "}
          Â·{" "}
          <span style={{ color: "royalblue", fontStyle: "italic" }}>IRC:6</span>{" "}
          Â·{" "}
          <span style={{ color: "royalblue", fontStyle: "italic" }}>
            IRC:112
          </span>{" "}
          Â·{" "}
          <span style={{ color: "royalblue", fontStyle: "italic" }}>
            IRC:78
          </span>{" "}
          Â· IS:1904
        </div>
        <div style={{ marginTop: 4 }}>
          {i.river} Â· {i.jobNo} Â· Generated {new Date().toLocaleString("en-IN")}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
          textAlign: "center",
          fontSize: 10,
          fontFamily: "Verdana,sans-serif",
        }}
      >
        <div>
          <div style={{ height: 48 }} />
          <div style={{ fontWeight: "bold", color: "darkorchid" }}>
            Prepared By
          </div>
          <div>{i.engineer}</div>
        </div>
        <div>
          <div style={{ height: 48 }} />
          <div style={{ fontWeight: "bold", color: "darkorchid" }}>
            Checked By
          </div>
          <div>Design Engineer</div>
        </div>
        <div>
          <div style={{ height: 48 }} />
          <div style={{ fontWeight: "bold", color: "darkorchid" }}>
            Approved By
          </div>
          <div>Executive Engineer / Client</div>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: 9,
          color: "#888",
          marginTop: 24,
          fontFamily: "Verdana,sans-serif",
        }}
      >
        This report follows STRUDS {i.strudsVer} (build {i.buildVer})
        presentation conventions. All values shall be verified by a competent
        structural engineer before construction.
      </div>
    </div>
  );
}


