import React from "react";

/**
 * Source-of-truth policy (see repo attached_assets/ â€” pasted workbook excerpts only).
 * No tender quantities or bar lists are invented in code; they come from user input = Excel workbook.
 */

/** Calculation sheets driven only by structural/hydraulic inputs + derive() */
export const ENGINE_SHEET_IDS = [
  "s-banner",
  "s-hyd",
  "s-afflux",
  "s-hyd-summ",
  "s-deck",
  "s-xsec",
  "s-sbc",
  "s-pier",
  "s-aos",
  "s-pier-steel",
  "s-pier-ftg",
  "s-pier-cap",
  "s-lload",
  "s-deck-slab",
  "s-t1",
  "s-t1-detail",
  "s-technote",
  "s-c1",
  "s-techreport",
  "s-c1-detail",
] as const;

/** Quantities & schedule: values must match your project Excel workbook (user-entered) */
export const WORKBOOK_QUANTITY_SHEET_IDS = [
  "s-abstract",
  "s-bars",
  "s-boq",
] as const;

export function ReportSourceNotice() {
  return (
    <div
      style={{
        border: "1px solid #c4a35a",
        background: "#fffbeb",
        padding: "10px 14px",
        marginBottom: 14,
        fontFamily: "Verdana,sans-serif",
        fontSize: 10,
        lineHeight: 1.65,
        color: "#333",
      }}
    >
      <div style={{ fontWeight: "bold", color: "#8b6914", marginBottom: 6 }}>
        Data source â€” Excel workbook and attached_assets reference only
      </div>
      <div>
        Hydraulic, stability, member design and deck-slab sheets use{" "}
        <strong>only the inputs</strong> you enter (same logic chain as the
        original Bridge_Slab_Design application). Narrative style follows{" "}
        <code>attached_assets/DESIGN_PROSE_SAMPLE.MD</code> and other pasted
        extracts in <code>attached_assets/</code>.
      </div>
      <div style={{ marginTop: 8 }}>
        Cross-section profile (Sheet 6) and bed-slope longitudinal section
        (Sheet 7) are rendered directly from the survey data entered in the
        hydraulic input section.
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Abstract, full bar schedule, and BOQ quantities</strong> are{" "}
        <strong>not</strong> taken from hidden code constants. Enter them from
        your sanctioned quantity / estimate workbook so outputs match Excel.
        Defaults are <strong>zero</strong> until you fill Section H.
      </div>
    </div>
  );
}


