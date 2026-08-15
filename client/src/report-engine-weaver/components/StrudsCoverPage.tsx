import React from "react";
import type { Inputs } from "../../pages/BridgeSlabReport";

/**
 * STRUDS-style cover page.
 * Full A4 landscape, gradient banner, firm logo, project metadata, IRC code stack,
 * signature block. Renders identically on screen and print.
 */
export function StrudsCoverPage({ i }: { i: Inputs }) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const totalLength = (i.spans * i.spanL).toFixed(1);
  const bridgeKind = i.spans === 1 ? "Single-Span" : `${i.spans}-Span`;

  return (
    <section className="struds-cover" data-proj={i.name}>
      <header className="struds-cover-firm">
        {i.firmLogo ? (
          <img src={i.firmLogo} alt="Firm logo" />
        ) : (
          <div
            style={{
              width: 16 + "mm",
              height: 16 + "mm",
              border: "1pt solid rgba(255,255,255,0.45)",
              borderRadius: "2mm",
              display: "grid",
              placeItems: "center",
              fontSize: "8pt",
              letterSpacing: "1pt",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            LOGO
          </div>
        )}
        <div className="firm-name">
          {i.firmName || "Consulting Bridge Engineers"}
        </div>
      </header>

      <div className="struds-cover-codes">
        <span>IRC:6-2017</span>
        <span>IRC:78-2014</span>
        <span>IRC:112-2011</span>
        <span>IRC:SP:13</span>
        <span>IS:1893-2016</span>
      </div>

      <div className="struds-cover-stamp">FOR&nbsp;SUBMISSION</div>

      <div className="struds-cover-body">
        <div className="struds-cover-eyebrow">Structural Design Report</div>
        <h1 className="struds-cover-title">
          Submersible RCC
          <br />
          Slab Bridge
        </h1>
        <div className="struds-cover-subtitle">
          {bridgeKind} · {totalLength} m total · {i.river}
        </div>

        <div className="struds-cover-project">
          <div className="lbl">Name of Work</div>
          <div className="name">{i.name}</div>
        </div>

        <dl className="struds-cover-meta">
          <div>
            <dt>Location</dt>
            <dd>{i.location}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{i.client}</dd>
          </div>
          <div>
            <dt>Job Number</dt>
            <dd>{i.jobNo}</dd>
          </div>
          <div>
            <dt>Issued</dt>
            <dd>{today}</dd>
          </div>
        </dl>
      </div>

      <footer className="struds-cover-foot">
        <div className="struds-cover-sign">
          <div className="role">Designed By</div>
          <div className="name">{i.engineer || "Design Engineer"}</div>
          <div className="qual">M.E. (Civil) · Structural</div>
        </div>
        <div className="struds-cover-sign">
          <div className="role">Checked By</div>
          <div className="name">________________________</div>
          <div className="qual">Senior Engineer</div>
        </div>
        <div className="struds-cover-sign">
          <div className="role">Approved By</div>
          <div className="name">________________________</div>
          <div className="qual">Executive Engineer · PWD</div>
        </div>
      </footer>
    </section>
  );
}
