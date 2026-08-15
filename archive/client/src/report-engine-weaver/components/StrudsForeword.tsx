import React from "react";
import type { Inputs, Derived } from "../../pages/BridgeSlabReport";
import { fv } from "../sheets/ReportUI";

/**
 * Foreword / "About this report" page.
 * Explains scope, methodology, governing codes and what the deliverables include.
 * Sets the CSS string `struds-project-name` used in the print page footer.
 */
export function StrudsForeword({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <section className="struds-foreword" data-proj={i.name}>
      <div className="eyebrow">Foreword</div>
      <h1>About This Design Report</h1>

      <p className="lead">
        This report documents the structural design of a{" "}
        <strong>submersible RCC slab bridge</strong> across the{" "}
        <strong>{i.river}</strong>. It transitions in measured sequence from the
        catchment hydraulics — discharge, regime width, scour and afflux — into
        the structural design of the deck slab, piers and abutments, closing
        with quantities and an audit-ready bill of quantities. Every value
        presented is computed from the inputs on the previous page; no figure
        is editorial. The intent is a single self-contained submission an
        approving authority can read end-to-end and reproduce on first
        principles.
      </p>

      <h2>Scope of work</h2>
      <dl className="scope-grid">
        <div>
          <dt>Bridge configuration</dt>
          <dd>
            {i.spans} spans of {fv(i.spanL, 1)} m c/c (effective length{" "}
            {fv(i.spans * i.spanL, 1)} m), carriageway {fv(i.cwWidth, 1)} m,
            overall width {fv(i.totalW, 1)} m.
          </dd>
        </div>
        <div>
          <dt>Hydraulic design</dt>
          <dd>
            Discharge by Manning&rsquo;s formula on surveyed cross-section;
            Lacey&rsquo;s regime width, scour by ASTRA factor, Molesworth
            afflux. HFL {fv(i.HFL, 2)} m, bed RL {fv(i.bedRL, 2)} m.
          </dd>
        </div>
        <div>
          <dt>Stability</dt>
          <dd>
            Pier and abutment stability for all governing IRC load combinations
            including seismic, hydrodynamic and braking; SBC{" "}
            {fv(i.SBC ?? d.SBC, 0)} kN/m², φ {fv(i.phi, 0)}°.
          </dd>
        </div>
        <div>
          <dt>Structural design</dt>
          <dd>
            Deck slab IRC:112 limit state, pier/abutment reinforcement,
            footing design and foundation pressure check, deck anchorage and
            expansion arrangement.
          </dd>
        </div>
        <div>
          <dt>Drawings</dt>
          <dd>
            General Arrangement, pier and abutment elevations, slab
            reinforcement, hydraulic profile and cross-section overlays
            (Annexure).
          </dd>
        </div>
        <div>
          <dt>Bill &amp; abstract</dt>
          <dd>
            Item-wise BOQ for earthwork, PCC, structural concrete, steel,
            pitching and ancillaries with rate analysis.
          </dd>
        </div>
      </dl>

      <h2>Governing codes &amp; references</h2>
      <div className="codes-strip">
        <span>IRC:6-2017 — Loads &amp; load combinations</span>
        <span>IRC:78-2014 — Foundations &amp; substructure</span>
        <span>IRC:112-2011 — Limit state design (concrete)</span>
        <span>IRC:SP:13 — Small bridge hydraulics</span>
        <span>IRC:5-2015 — Standard specifications &amp; geometry</span>
        <span>IS:1893 (Pt 1):2016 — Seismic</span>
        <span>IS:7784 (Pt I):1975 — Afflux</span>
        <span>IS:1786 — HYSD bars</span>
      </div>

      <h2>Deliverables in this report</h2>
      <ul className="deliverables">
        <li>
          <b>Hydraulics</b>
          Cross-section, Manning&rsquo;s velocity, discharge, regime width,
          scour, afflux, design water level, SBC.
        </li>
        <li>
          <b>Pier stability</b>
          Load cases LC-1 to LC-7 with sliding, overturning, base pressure and
          eccentricity verdicts.
        </li>
        <li>
          <b>Pier design</b>
          Reinforcement, footing pressure, cap design, anchorage of starter
          bars.
        </li>
        <li>
          <b>Abutment T1 &amp; C1</b>
          Stability for full reservoir &amp; sudden draw-down, stem &amp;
          footing reinforcement, dirt &amp; return walls.
        </li>
        <li>
          <b>Deck slab</b>
          Effective span, dispersal width, BM &amp; SF envelope, reinforcement
          and shear check (IRC:112 LSM).
        </li>
        <li>
          <b>Annexure</b>
          GAD sketch, pier elevation, abutment cross-section, slab
          reinforcement and hydraulic profile.
        </li>
      </ul>
    </section>
  );
}
