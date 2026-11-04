/**
 * DUAL-TRACK EXPORT ENGINE (v2.1 â€” A/B Testing Suite)
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Model A: "Data-Perfect" â€” Uses SheetJS (xlsx) for ultra-reliable calculation export.
 * Model B: "Style-Perfect" â€” Uses ExcelJS for Som-River-grade formatting (borders, fills, merges).
 *
 * Benchmark: "Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER.xls"
 *            26 sheets, thick borders, orchid/blue header fills, merged title rows.
 */

// file-saver replaced with native browser download
function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); document.body.removeChild(a);
}
import type { Inputs } from './types/bridgeTypes'; import type { Derived } from './bridgeDerivation';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CALCULATION MANIFEST (Deep-Audit Logger)
   Tracks every exported variable for gap discovery.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function buildManifest(i: Inputs, d: Derived) {
  return {
    generatedAt: new Date().toISOString(),
    project: i.name,
    river: i.river,
    firmName: i.firmName || "",
    engineVersion: "v2.1-AB",
    variables: {
      // Hydraulics
      Q: d.Q,
      V: d.V,
      L_lacey: d.L_lacey,
      dsm: d.dsm,
      afflux: d.afflux,
      Fr: d.Fr,
      DWL: d.DWL,
      // SBC
      SBC: d.SBC,
      qnu: d.qnu,
      // Pier
      pierLCs: d.pierLCs.map((lc, idx) => ({
        case: idx + 1,
        Vf: lc.Vf,
        Hf: lc.Hf,
        qmax: lc.qmax,
        slidFOS: lc.slidFOS,
        otFOS: lc.otFOS,
      })),
      // Steel
      Ast_req: d.Ast_req,
      Ast_prov: d.Ast_prov,
      nos_main: d.nos_main,
      // BBS
      bbs_pier: d.bbs_pier,
      // Abutment
      Ka: d.Ka,
      Pa: d.Pa,
      abtCases: d.abtCases.map((c, idx) => ({
        case: idx + 1,
        Vf: c.Vf,
        Hf: c.Hf,
        qmax: c.qmax,
        slidFOS: c.slidFOS,
        otFOS: c.otFOS,
        slidOK: c.slidOK,
        otOK: c.otOK,
      })),
    },
  };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MODEL A â€” DATA-PERFECT (SheetJS / xlsx)
   Focus: 100% calculation fidelity, lightweight, instant.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export async function generateExcelModelA(i: Inputs, d: Derived) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const firmName = i.firmName || i.engineer;

  // --- Sheet 1: HYDRAULICS ---
  const hydData = [
    [firmName],
    ["HYDRAULIC CALCULATIONS & WATERWAY DESIGN"],
    ["Project:", i.name],
    ["River:", i.river, "", "Engineer:", i.engineer],
    ["Date:", new Date().toLocaleDateString("en-IN")],
    [""],
    ["Parameter", "Symbol", "Value", "Unit", "Reference"],
    ["Catchment Area", "A", i.A, "mÂ²", "IRC:SP:13"],
    ["Wetted Perimeter", "P", i.P_, "m", "Field Survey"],
    ["Manning's n", "n", i.n, "", "IRC:SP:13 Table"],
    ["Bed Slope", "S", "1 in " + i.S_denom, "", "Survey"],
    ["Hydraulic Radius", "R = A/P", +d.R.toFixed(3), "m", ""],
    ["Avg. Velocity", "V = (1/n)R^â…”S^Â½", +d.V.toFixed(3), "m/s", "Manning"],
    ["Design Discharge", "Q = AV", +d.Q.toFixed(2), "cumecs", ""],
    ["Lacey's Regime Width", "W = 4.75âˆšQ", +d.L_lacey.toFixed(2), "m", "Lacey"],
    ["Design Scour Depth", "dsm", +d.dsm.toFixed(2), "m", "IRC:78"],
    ["Afflux", "h", +d.afflux.toFixed(3), "m", "Molesworth"],
    ["Froude Number", "Fr", +d.Fr.toFixed(3), "", ""],
    ["Skew Angle", "Î¸", i.skewDeg, "deg", ""],
    [
      "Effective Span (Skew)",
      "L_eff",
      +(d.L_eff_skew?.toFixed(2) || i.spanL),
      "m",
      "L/cos(Î¸)",
    ],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(hydData),
    "HYDRAULICS",
  );

  // --- Sheet 2: CROSS SECTION ---
  const xsecData = [
    ["CROSS SECTION OF RIVER"],
    ["Chainage", "RL (m)", "Remarks"],
    ...i.xsec.map((r: any) => [r.ch, r.gl, r.remarks]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(xsecData),
    "CROSS_SECTION",
  );

  // --- Sheet 3: SBC ---
  const sbcData = [
    ["SAFE BEARING CAPACITY (Terzaghi's Equation)"],
    ["Parameter", "Value", "Unit"],
    ["Angle of Repose (Ï†)", i.phi, "deg"],
    ["Unit Weight (Î³)", i.gamma, "kN/mÂ³"],
    ["Foundation Depth (Df)", i.Df, "m"],
    ["Footing Width (B)", i.ftgB, "m"],
    ["Nc", i.Nc, ""],
    ["Nq", i.Nq, ""],
    ["NÎ³", i.Ny, ""],
    ["FOS", i.FOS_sbc, ""],
    ["qnu (kN/mÂ²)", +d.qnu.toFixed(1), "Gross"],
    ["SBC (kN/mÂ²)", +d.SBC.toFixed(1), "Net Allowable"],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sbcData), "SBC");

  // --- Sheet 4: DECK ANCHORAGE ---
  const ancData = [
    ["ANCHORAGE OF DECK SLAB TO SUBSTRUCTURE"],
    ["(Ref: Som River Workbook Sheet 'Deck Anchorage')"],
    [""],
    ["Parameter", "Value", "Unit"],
    ["DL of Slab", +d.dl_slab.toFixed(1), "kN"],
    ["Buoyancy Force", +d.buoyancy.toFixed(1), "kN"],
    ["Total Uplift", +(d.totalUplift?.toFixed(1) || 0), "kN"],
    ["Net Force", +(d.net_force?.toFixed(1) || 0), "kN"],
    ["Bolt Diameter", i.ancBoltDia, "mm"],
    ["Bolt Grade", i.ancBoltGrade, ""],
    ["Anchor Capacity/Bolt", +(d.anchorCapacity?.toFixed(1) || 0), "kN"],
    ["No. of Bolts Required", d.numBolts || 0, "nos"],
    ["Anchorage Required?", i.ancIsRequired ? "YES" : "NO", ""],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(ancData),
    "DECK_ANCHORAGE",
  );

  // --- Sheet 5: STABILITY PIER ---
  const pierData = [
    ["STABILITY ANALYSIS FOR PIER"],
    ["Project:", i.name],
    [""],
    [
      "Case",
      "Description",
      "V (kN)",
      "H (kN)",
      "e (m)",
      "qmax (kN/mÂ²)",
      "qmin",
      "FOS Slide",
      "FOS OT",
      "Status",
    ],
    ...d.pierLCs.map((lc, idx) => [
      idx + 1,
      ["DL+LL+Hydro", "DL+Hydro", "DL+LL+Seismic", "DL+Seismic", "DL+LL+Wind", "Dislodged (One-Span)"][
        idx
      ],
      +lc.Vf.toFixed(1),
      +lc.Hf.toFixed(1),
      +lc.e.toFixed(3),
      +lc.qmax.toFixed(1),
      +lc.qmin.toFixed(1),
      +lc.slidFOS.toFixed(2),
      +lc.otFOS.toFixed(2),
      lc.slidFOS >= 1.5 && lc.qmax <= d.SBC ? "SAFE âœ“" : "CHECK âœ—",
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(pierData),
    "STABILITY_PIER",
  );

  // --- Sheet 6: ABSTRACT OF STRESSES ---
  const aosData = [
    ["ABSTRACT OF BASE PRESSURE AND STRESSES"],
    ["Case", "qmax (kN/mÂ²)", "qmin (kN/mÂ²)", "FOS Sliding", "FOS Overturning"],
    ...d.pierLCs.map((lc, idx) => [
      idx + 1,
      +lc.qmax.toFixed(1),
      +lc.qmin.toFixed(1),
      +lc.slidFOS.toFixed(2),
      +lc.otFOS.toFixed(2),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aosData), "AOS");

  // --- Sheet 7: PIER STEEL ---
  const steelData = [
    ["REINFORCEMENT CALCULATION IN PIER"],
    ["Parameter", "Value", "Unit"],
    ["Effective Depth", d.d_pier, "mm"],
    ["xu_lim", d.xu_lim, "mm"],
    ["xu_actual", d.xu, "mm"],
    ["Ast Required", d.Ast_req, "mmÂ²"],
    ["Ast Provided", d.Ast_prov, "mmÂ²"],
    ["No. of Main Bars", d.nos_main, "nos"],
    ["Steel %", +d.pct.toFixed(3), "%"],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(steelData),
    "PIER_STEEL",
  );

  // --- Sheet 8: BBS ---
  const bbsData = [
    ["BAR BENDING SCHEDULE â€” PIER"],
    ["Mark", "Description", "Dia (mm)", "Nos", "Length (m)", "Weight (kg)"],
    ...d.bbs_pier.map((b) => [
      b.mark,
      b.desc,
      b.dia,
      b.nos,
      +b.len.toFixed(2),
      +b.wt.toFixed(1),
    ]),
    [
      "",
      "",
      "",
      "",
      "TOTAL",
      +d.bbs_pier.reduce((s, b) => s + b.wt, 0).toFixed(1),
    ],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bbsData), "BBS");

  // --- Sheet 9: ABUTMENT STABILITY ---
  const abtData = [
    ["STABILITY ANALYSIS FOR ABUTMENT"],
    [
      "Case",
      "V (kN)",
      "H (kN)",
      "qmax",
      "FOS Slide",
      "FOS OT",
      "Slide OK?",
      "OT OK?",
      "Bearing OK?",
    ],
    ...d.abtCases.map((c, idx) => [
      idx + 1,
      +c.Vf.toFixed(1),
      +c.Hf.toFixed(1),
      +c.qmax.toFixed(1),
      +c.slidFOS.toFixed(2),
      +c.otFOS.toFixed(2),
      c.slidOK ? "YES" : "NO",
      c.otOK ? "YES" : "NO",
      c.bearOK ? "YES" : "NO",
    ]),
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(abtData),
    "ABUTMENT_STABILITY",
  );

  // --- Sheet 10: PROJECT SUMMARY ---
  const summData = [
    ["PROJECT SUMMARY"],
    ["Item", "Value"],
    ["Name of Work", i.name],
    ["Location", i.location],
    ["River", i.river],
    ["No. of Spans", i.spans],
    ["Span Length", i.spanL + " m"],
    ["Total Length", d.totalL + " m"],
    ["Carriageway Width", i.cwWidth + " m"],
    ["Total Width", i.totalW + " m"],
    ["Grade of Concrete", i.grade],
    ["Grade of Steel", i.steel],
    ["SBC", d.SBC.toFixed(1) + " kN/mÂ²"],
    ["Design Discharge", d.Q.toFixed(2) + " cumecs"],
    ["Skew Angle", i.skewDeg + "Â°"],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summData),
    "SUMMARY",
  );

  // --- Manifest Sheet ---
  const manifest = buildManifest(i, d);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["CALCULATION AUDIT MANIFEST"],
      ["Generated", manifest.generatedAt],
      ["Engine", manifest.engineVersion],
      ["Total Variables Tracked", Object.keys(manifest.variables).length],
    ]),
    "_AUDIT",
  );

  const filename = `${i.river.replace(/\s+/g, "_")}_ModelA_DataPerfect.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MODEL B â€” STYLE-PERFECT (ExcelJS)
   Benchmark: "Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER.xls"
   Features: Thick borders, orchid fills, cell merges, logo embedding.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export async function generateExcelModelB(i: Inputs, d: Derived) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = (i as any).firmName || i.engineer;
  wb.created = new Date();

  const firmName = (i as any).firmName || i.engineer;
  const firmLogo = (i as any).firmLogo || null;

  // â”€â”€ Style Constants (Som River Benchmark) â”€â”€
  const HEADER_FILL: any = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A5F" },
  };
  const SUBHEAD_FILL: any = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F0FA" },
  };
  const ORCHID_FILL: any = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFDF6FF" },
  };
  const SAFE_FILL: any = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F5E9" },
  };
  const WARN_FILL: any = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF3E0" },
  };
  const THICK_BORDER: any = {
    top: { style: "medium", color: { argb: "FF333333" } },
    left: { style: "medium", color: { argb: "FF333333" } },
    bottom: { style: "medium", color: { argb: "FF333333" } },
    right: { style: "medium", color: { argb: "FF333333" } },
  };
  const THIN_BORDER: any = {
    top: { style: "thin", color: { argb: "FF999999" } },
    left: { style: "thin", color: { argb: "FF999999" } },
    bottom: { style: "thin", color: { argb: "FF999999" } },
    right: { style: "thin", color: { argb: "FF999999" } },
  };
  const HEADER_FONT: any = {
    name: "Arial",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const SUBHEAD_FONT: any = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: "FF1E3A5F" },
  };
  const DATA_FONT: any = { name: "Arial", size: 10 };

  function addStyledHeader(
    ws: any,
    title: string,
    subtitle: string,
    cols: number,
  ) {
    // Row 1: Main Title (merged)
    ws.mergeCells(1, 1, 1, cols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = HEADER_FONT;
    titleCell.fill = HEADER_FILL;
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.border = THICK_BORDER;
    ws.getRow(1).height = 30;

    // Row 2: Project name (merged)
    ws.mergeCells(2, 1, 2, cols);
    const subCell = ws.getCell(2, 1);
    subCell.value = subtitle;
    subCell.font = { ...SUBHEAD_FONT, size: 9 };
    subCell.fill = ORCHID_FILL;
    subCell.alignment = { horizontal: "center", wrapText: true };
    subCell.border = THIN_BORDER;

    // Row 3: Firm / Engineer line
    ws.mergeCells(3, 1, 3, cols);
    const firmCell = ws.getCell(3, 1);
    firmCell.value = `${firmName} | ${new Date().toLocaleDateString("en-IN")}`;
    firmCell.font = {
      name: "Arial",
      size: 8,
      italic: true,
      color: { argb: "FF666666" },
    };
    firmCell.alignment = { horizontal: "right" };
  }

  function styleDataRow(ws: any, rowNum: number, isHeader: boolean = false) {
    const row = ws.getRow(rowNum);
    row.eachCell((cell: any) => {
      cell.font = isHeader ? SUBHEAD_FONT : DATA_FONT;
      cell.fill = isHeader
        ? SUBHEAD_FILL
        : { type: "pattern", pattern: "none" };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle" };
    });
  }

  // â•â•â• Sheet 1: HYDRAULICS â•â•â•
  const wsH = wb.addWorksheet("HYDRAULICS");
  wsH.columns = [
    { width: 28 },
    { width: 18 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
  ];
  addStyledHeader(
    wsH,
    "HYDRAULIC CALCULATIONS & WATERWAY DESIGN",
    `Name Of Work :- ${i.name}`,
    5,
  );

  const hydRows = [
    ["Parameter", "Symbol", "Substitution / Formula", "Value", "Unit", "Reference"],
    ["Catchment Area", "A", "", i.A, "mÂ²", "IRC:SP:13"],
    ["Wetted Perimeter", "P", "", i.P_, "m", "Field Survey"],
    ["Manning's n", "n", "", i.n, "", "IRC:SP:13"],
    ["Bed Slope", "S", `1 : ${i.S_denom}`, `1 in ${i.S_denom}`, "", "Survey"],
    ["Hydraulic Radius", "R", "A / P", +d.R.toFixed(3), "m", ""],
    ["Intermediate R^(2/3)", "R_23", `(${d.R.toFixed(3)})^(2/3)`, +(Math.pow(d.R, 2/3)).toFixed(4), "m^0.67", ""],
    ["Intermediate S^(1/2)", "S_12", `(1/${i.S_denom})^(1/2)`, +(Math.pow(1/i.S_denom, 0.5)).toFixed(4), "â€”", ""],
    ["Avg. Velocity", "V", "(1/n) * R_23 * S_12", +d.V.toFixed(3), "m/s", "Manning"],
    ["Design Discharge", "Q", "A * V", +d.Q.toFixed(2), "cumecs", ""],
    ["Lacey's Width", "W", "4.75 * âˆšQ", +d.L_lacey.toFixed(2), "m", "Lacey"],
    ["Scour Depth", "dsm", "1.34 * (qÂ²/f)^(1/3)", +d.dsm.toFixed(2), "m", "IRC:78"],
    ["Afflux", "h", "Molesworth Formula", +d.afflux.toFixed(3), "m", "IS:7784"],
    ["Froude No.", "Fr", "V / âˆš(g*D)", +d.Fr.toFixed(3), "", ""],
  ];
  hydRows.forEach((row, idx) => {
    wsH.addRow(row);
    styleDataRow(wsH, idx + 4, idx === 0);
  });
  wsH.columns[2].width = 35; // Expand formula column

  // â•â•â• Sheet 2: DECK ANCHORAGE â•â•â•
  const wsA = wb.addWorksheet("Deck Anchorage");
  wsA.columns = [{ width: 30 }, { width: 14 }, { width: 10 }];
  addStyledHeader(
    wsA,
    "ANCHORAGE OF DECK SLAB TO SUBSTRUCTURE",
    `Name Of Work :- ${i.name}`,
    3,
  );
  const ancRows = [
    ["Parameter", "Value", "Unit"],
    ["DL of Slab", +d.dl_slab.toFixed(1), "kN"],
    ["Buoyancy", +d.buoyancy.toFixed(1), "kN"],
    ["Total Uplift", +(d.totalUplift?.toFixed(1) || 0), "kN"],
    ["Net Force", +(d.net_force?.toFixed(1) || 0), "kN"],
    ["Bolt Dia", i.ancBoltDia, "mm"],
    ["Bolt Grade", i.ancBoltGrade, ""],
    ["Capacity/Bolt", +(d.anchorCapacity?.toFixed(1) || 0), "kN"],
    ["Bolts Required", d.numBolts || 0, "nos"],
  ];
  ancRows.forEach((row, idx) => {
    wsA.addRow(row);
    styleDataRow(wsA, idx + 4, idx === 0);
  });

  // â•â•â• Sheet 3: STABILITY PIER â•â•â•
  const wsP = wb.addWorksheet("STABILITY CHECK FOR PIER");
  wsP.columns = [
    { width: 8 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
  ];
  addStyledHeader(
    wsP,
    "DESIGN OF PIER AND CHECK FOR STABILITY",
    `Name Of Work :- ${i.name}`,
    10,
  );
  const pierHdr = [
    "Case",
    "Description",
    "V (kN)",
    "H (kN)",
    "e (m)",
    "qmax (kN/mÂ²)",
    "qmin",
    "FOS Slide",
    "FOS OT",
    "Status",
  ];
  wsP.addRow(pierHdr);
  styleDataRow(wsP, 4, true);
  d.pierLCs.forEach((lc, idx) => {
    const status = lc.slidFOS >= 1.5 && lc.qmax <= d.SBC ? "SAFE âœ“" : "CHECK âœ—";
    const row = wsP.addRow([
      idx + 1,
      ["DL+LL+Hydro", "DL+Hydro", "DL+LL+Seismic", "DL+Seismic", "DL+LL+Wind"][
        idx
      ],
      +lc.Vf.toFixed(1),
      +lc.Hf.toFixed(1),
      +lc.e.toFixed(3),
      +lc.qmax.toFixed(1),
      +lc.qmin.toFixed(1),
      +lc.slidFOS.toFixed(2),
      +lc.otFOS.toFixed(2),
      status,
    ]);
    styleDataRow(wsP, row.number);
    // Color-code status
    const statusCell = row.getCell(10);
    statusCell.fill = status.includes("SAFE") ? SAFE_FILL : WARN_FILL;
    statusCell.font = {
      ...DATA_FONT,
      bold: true,
      color: { argb: status.includes("SAFE") ? "FF2E7D32" : "FFE65100" },
    };
  });

  // â•â•â• Sheet 4: BBS â•â•â•
  const wsB = wb.addWorksheet("BBS");
  wsB.columns = [
    { width: 10 },
    { width: 24 },
    { width: 10 },
    { width: 8 },
    { width: 12 },
    { width: 12 },
  ];
  addStyledHeader(
    wsB,
    "BAR BENDING SCHEDULE â€” PIER",
    `Name Of Work :- ${i.name}`,
    6,
  );
  wsB.addRow([
    "Mark",
    "Description",
    "Dia (mm)",
    "Nos",
    "Length (m)",
    "Weight (kg)",
  ]);
  styleDataRow(wsB, 4, true);
  d.bbs_pier.forEach((b) => {
    const r = wsB.addRow([
      b.mark,
      b.desc,
      b.dia,
      b.nos,
      +b.len.toFixed(2),
      +b.wt.toFixed(1),
    ]);
    styleDataRow(wsB, r.number);
  });
  const totalRow = wsB.addRow([
    "",
    "",
    "",
    "",
    "TOTAL",
    +d.bbs_pier.reduce((s, b) => s + b.wt, 0).toFixed(1),
  ]);
  totalRow.getCell(5).font = { ...DATA_FONT, bold: true };
  totalRow.getCell(6).font = { ...DATA_FONT, bold: true };
  totalRow.eachCell((c) => {
    c.border = THICK_BORDER;
  });

  // â•â•â• Sheet 5: ABUTMENT â•â•â•
  const wsAbt = wb.addWorksheet("STABILITY CHECK ABUTMENT");
  wsAbt.columns = [
    { width: 8 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
  ];
  addStyledHeader(
    wsAbt,
    "STABILITY ANALYSIS FOR ABUTMENT",
    `Name Of Work :- ${i.name}`,
    9,
  );
  wsAbt.addRow([
    "Case",
    "V (kN)",
    "H (kN)",
    "qmax",
    "FOS Slide",
    "FOS OT",
    "Slide?",
    "OT?",
    "Bearing?",
  ]);
  styleDataRow(wsAbt, 4, true);
  // â•â•â• [NEW] Sheet 5: DETAILED PIER STABILITY (Tabular Buildup) â•â•â•
  const wsPDet = wb.addWorksheet("PIER LOAD BUILDUP");
  wsPDet.columns = [{ width: 8 }, { width: 30 }, { width: 14 }, { width: 12 }, { width: 14 }];
  addStyledHeader(wsPDet, "DETAILED TABULAR LOAD BUILDUP (PIER)", `Project: ${i.name}`, 5);
  wsPDet.addRow(["Case", "Load Component", "Value (V)", "Arm (m)", "Moment (MR/MO)"]);
  styleDataRow(wsPDet, 4, true);
  
  d.pierLCs.forEach((lc: any, idx: number) => {
    wsPDet.addRow([idx + 1, lc.desc, "", "", ""]);
    wsPDet.getRow(wsPDet.lastRow!.number).fill = SUBHEAD_FILL;
    
    wsPDet.addRow(["", "Superstructure Dead Load", lc.comp.dl || 0, d.MR_arm, +( (lc.comp.dl || 0) * d.MR_arm ).toFixed(2)]);
    if(lc.comp.ll) wsPDet.addRow(["", "Live Load Reaction", lc.comp.ll, d.MR_arm, +( lc.comp.ll * d.MR_arm ).toFixed(2)]);
    wsPDet.addRow(["", "Concrete Self Weight (P+C+F)", lc.comp.self, d.MR_arm, +( lc.comp.self * d.MR_arm ).toFixed(2)]);
    if(lc.comp.buoyancy) wsPDet.addRow(["", "Buoyancy Deduction (-)", -lc.comp.buoyancy, d.MR_arm, +( -lc.comp.buoyancy * d.MR_arm ).toFixed(2)]);
    if(lc.comp.seisV) wsPDet.addRow(["", "Seismic Vertical", lc.comp.seisV, d.MR_arm, +( lc.comp.seisV * d.MR_arm ).toFixed(2)]);
    
    wsPDet.addRow(["", "TOTAL VERTICAL (Î£V)", lc.Vf, "", lc.MR]);
    wsPDet.lastRow!.font = { bold: true };
    
    wsPDet.addRow(["", "Lateral Force (Current/EQ/Wind)", lc.comp.lat || 0, d.MO_arm, lc.MO]);
    wsPDet.addRow(["", "TOTAL LATERAL (Î£H)", lc.Hf, "", ""]);
    wsPDet.lastRow!.font = { bold: true };
    wsPDet.addRow([]); // Spacer
  });

  // â•â•â• [NEW] Sheet 6: DETAILED ABUTMENT STABILITY (Tabular Buildup) â•â•â•
  const wsADet = wb.addWorksheet("ABUTMENT LOAD BUILDUP");
  wsADet.columns = [{ width: 8 }, { width: 30 }, { width: 14 }, { width: 12 }, { width: 14 }];
  addStyledHeader(wsADet, "DETAILED TABULAR LOAD BUILDUP (ABUTMENT)", `Project: ${i.name}`, 5);
  wsADet.addRow(["Case", "Load Component", "Value (V)", "Arm (m)", "Moment (MR/MO)"]);
  styleDataRow(wsADet, 4, true);

  d.abtCases.forEach((lc: any, idx: number) => {
    wsADet.addRow([idx+1, lc.desc, "", "", ""]);
    wsADet.getRow(wsADet.lastRow!.number).fill = SUBHEAD_FILL;

    wsADet.addRow(["", "Dead Load Superstructure", lc.comp.dl || 0, lc.MR_arm, +( (lc.comp.dl || 0) * lc.MR_arm ).toFixed(2)]);
    if(lc.comp.ll) wsADet.addRow(["", "Live Load Reaction", lc.comp.ll, lc.MR_arm, +( lc.comp.ll * lc.MR_arm ).toFixed(2)]);
    wsADet.addRow(["", "Abutment Stem Self Wt", lc.comp.stem, lc.MR_arm, +( lc.comp.stem * lc.MR_arm ).toFixed(2)]);
    wsADet.addRow(["", "Footing Base Self Wt", lc.comp.base, lc.MR_arm, +( lc.comp.base * lc.MR_arm ).toFixed(2)]);
    wsADet.addRow(["", "Fill Over Heel", lc.comp.soil, lc.MR_arm, +( lc.comp.soil * lc.MR_arm ).toFixed(2)]);
    wsADet.addRow(["", "Vertical Earth Component", lc.comp.pav, lc.MR_arm, +( lc.comp.pav * lc.MR_arm ).toFixed(2)]);

    wsADet.addRow(["", "TOTAL VERTICAL (Î£V)", lc.Vf, "", lc.MR]);
    wsADet.lastRow!.font = { bold: true };

    wsADet.addRow(["", "Active Earth Thrust (Ph)", lc.comp.pah, lc.MO_arm, lc.MO]);
    wsADet.addRow(["", "TOTAL LATERAL (Î£H)", lc.Hf, "", ""]);
    wsADet.lastRow!.font = { bold: true };
    wsADet.addRow([]); // Spacer
  });

  // â•â•â• Sheet 6: PROJECT SUMMARY â•â•â•
  const wsS = wb.addWorksheet("SUMMARY");
  wsS.columns = [{ width: 28 }, { width: 40 }];
  addStyledHeader(
    wsS,
    "PROJECT DESIGN SUMMARY",
    `Name Of Work :- ${i.name}`,
    2,
  );
  [
    ["Name of Work", i.name],
    ["Location", i.location],
    ["River", i.river],
    ["No. of Spans", i.spans],
    ["Span Length", i.spanL + " m"],
    ["Total Length", d.totalL + " m"],
    ["CW Width", i.cwWidth + " m"],
    ["Total Width", i.totalW + " m"],
    ["Concrete Grade", i.grade],
    ["Steel Grade", i.steel],
    ["SBC", d.SBC.toFixed(1) + " kN/mÂ²"],
    ["Design Discharge", d.Q.toFixed(2) + " cumecs"],
    ["Skew Angle", i.skewDeg + "Â°"],
    ["Engineer", i.engineer],
    ["Firm", firmName],
  ].forEach((row, idx) => {
    wsS.addRow(row);
    styleDataRow(wsS, idx + 4, false);
  });

  // â•â•â• Write & Download â•â•â•
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `${i.river.replace(/\s+/g, "_")}_ModelB_StylePerfect.xlsx`;
  saveAs(blob, filename);
  return filename;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PDF EXPORT (jsPDF + html2canvas)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export async function generateProfessionalPDF(
  targetId: string,
  filename: string,
) {
  const html2canvas = (await import("html2canvas")).default;
  const jsPDF = (await import("jspdf")).default;
  const element = document.getElementById(targetId);
  if (!element) {
    alert("Report section not found. Please compute first.");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const imgProps = pdf.getImageProperties(imgData);
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  let heightLeft = pdfHeight;
  let position = 0;
  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft >= 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save(filename.replace(/[^\w\s-]/g, "_") + ".pdf");
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CSV / JSON EXPORTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvContent =
    "data:text/csv;charset=utf-8," +
    headers.join(",") +
    "\n" +
    data
      .map((e) => headers.map((h) => JSON.stringify(e[h] ?? "")).join(","))
      .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename + ".csv");
}

export function exportAuditManifest(i: Inputs, d: Derived) {
  const manifest = buildManifest(i, d);
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  });
  saveAs(blob, `${i.river.replace(/\s+/g, "_")}_Audit_Manifest.json`);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SURVEY SMS / TXT EXPORT
 â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function generateSurveySMS(i: Inputs, d: Derived) {
  const fv = (n: number) => (isNaN(n) || !isFinite(n) ? "â€”" : n.toFixed(2));
  
  // Create Setting-Out Matrix points based on spans
  let chainages = [];
  chainages.push(`Ch. 0.00m (Abutment 1)`);
  let currentCh = i.spanL / 2; // Assuming Abutment to Pier 1 is spanL spacing approx 
  for (let s = 1; s < i.spans; s++) {
    chainages.push(`Ch. ${fv(s * (i.spanL + i.pierW))}m (Pier ${s})`);
  }
  chainages.push(`Ch. ${fv(i.spans * (i.spanL + i.pierW))}m (Abutment 2)`);

  const smsText = `
[BRIDGE DESIGN SURVEY TXT]
Work: ${i.name}
River: ${i.river}
Loc: ${i.location}
Date: ${new Date().toLocaleDateString("en-IN")}
------------------------
[1. GEOMETRY]
Spans: ${i.spans} x ${fv(i.spanL)}m
Total L: ~${fv(d.totalL)}m
CW Width: ${i.cwWidth}m
Total W: ${i.totalW}m
------------------------
[2. HYDRAULIC LIMITS]
Discharge Q: ${fv(d.Q)} cumecs
Bed RL: ${fv(i.bedRL)}m
HFL: ${fv(d.DWL)}m (incl. Afflux ${fv(d.afflux)}m)
Max Scour Depth: ${fv(d.dsm)}m
Founding RL: ${fv(d.foundingRL)}m
------------------------
[3. GEOTECH & BEARING]
Allow. SBC: ${fv(d.SBC)} kPa
FOS: Sliding=1.5, OT=2.0
------------------------
[4. GAD & SETTING-OUT COORDINATES]
${chainages.join("\n")}
Pier Footing Width: ${fv(i.abt_Bbase)}m
Abutment Footing Width: ${fv(i.abt_Bbase)}m
Anchor Bolts Req: ${d.numBolts && d.numBolts > 0 ? `YES (${d.numBolts} nos, Dia ${i.ancBoltDia}mm)` : "NO"}
------------------------
*** END OF REPORT ***
  `.trim();

  const blob = new Blob([smsText], { type: "text/plain;charset=utf-8;" });
  saveAs(blob, `${i.river.replace(/\s+/g, "_")}_Survey.txt`);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LEGACY ALIAS (backward compatibility)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export const generateExcelWorkbook = generateExcelModelA;



