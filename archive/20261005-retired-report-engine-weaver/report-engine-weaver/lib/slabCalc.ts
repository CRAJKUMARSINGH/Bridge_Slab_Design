// IS 456:2000 Bridge / Building Slab Design — Calculation Engine

export type ConcreteGrade = "M15" | "M20" | "M25" | "M30" | "M35" | "M40";
export type SteelGrade = "Fe250" | "Fe415" | "Fe500" | "Fe550";
export type SlabType = "oneway" | "twoway";

export type BoundaryCondition =
  | "simply_supported"
  | "propped"
  | "cantilever"
  | "interior_panel"
  | "one_short_edge_disc"
  | "one_long_edge_disc"
  | "two_adj_edges_disc"
  | "two_short_edges_disc"
  | "two_long_edges_disc"
  | "three_edges_disc_one_long_cont"
  | "three_edges_disc_one_short_cont"
  | "four_edges_disc";

export interface SlabInputs {
  slabName: string;
  slabType: SlabType;
  concreteGrade: ConcreteGrade;
  steelGrade: SteelGrade;
  lx: number; // shorter span (m)
  ly: number; // longer span (m)
  thickness: number; // total slab thickness (mm)
  floorFinish: number; // kN/m²
  sunkLoad: number; // kN/m²
  liveLoad: number; // kN/m²
  boundaryCondition: BoundaryCondition;
  cover: number; // clear cover (mm)
  barDia: number; // main bar dia (mm)
}

export interface SteelPosition {
  position: string;
  coeff?: number | null;
  moment: number | null;
  astReq: number;
  barDia: number;
  spacing: number;
  astPrv: number;
  remark: string;
}

export interface SlabResult {
  inputs: SlabInputs;
  effectiveSlabType: SlabType;
  spanRatio: number;
  selfWeight: number;
  totalDL: number;
  totalLL: number;
  totalDesignLoad: number;
  effectiveDepth: number;
  spanDepthRatio: number;
  modificationFactor: number;
  basicFactor: number;
  permissibleRatio: number;
  deflectionStatus: "OK" | "FAIL";
  steelPositions: SteelPosition[];
  distributionBarDia: number;
  distributionSpacing: number;
  distributionAst: number;
  minSteelMain: number;
  minSteelDist: number;
  fck: number;
  fy: number;
  warnings: string[];
}

export function getFck(g: ConcreteGrade): number {
  return { M15: 15, M20: 20, M25: 25, M30: 30, M35: 35, M40: 40 }[g];
}

export function getFy(g: SteelGrade): number {
  return { Fe250: 250, Fe415: 415, Fe500: 500, Fe550: 550 }[g];
}

// ─── IS 456 Table 26 — Two-way slab moment coefficients ─────────────────────
// [ratio, αx_neg(support), αx_pos(midspan), αy_neg(support), αy_pos(midspan)]
type Row = [number, number, number, number, number];

const T26: Record<string, Row[]> = {
  interior_panel: [
    [1.0, 0.032, 0.024, 0.032, 0.024],
    [1.1, 0.037, 0.028, 0.028, 0.021],
    [1.2, 0.043, 0.032, 0.024, 0.018],
    [1.3, 0.047, 0.036, 0.021, 0.016],
    [1.4, 0.051, 0.039, 0.019, 0.014],
    [1.5, 0.053, 0.041, 0.017, 0.013],
    [1.75, 0.06, 0.045, 0.014, 0.011],
    [2.0, 0.065, 0.049, 0.013, 0.01],
  ],
  one_short_edge_disc: [
    [1.0, 0.037, 0.028, 0.037, 0.028],
    [1.1, 0.043, 0.032, 0.032, 0.024],
    [1.2, 0.048, 0.036, 0.027, 0.02],
    [1.3, 0.051, 0.039, 0.023, 0.017],
    [1.4, 0.055, 0.041, 0.021, 0.016],
    [1.5, 0.058, 0.043, 0.019, 0.014],
    [1.75, 0.065, 0.048, 0.016, 0.012],
    [2.0, 0.07, 0.053, 0.013, 0.01],
  ],
  one_long_edge_disc: [
    [1.0, 0.037, 0.028, 0.037, 0.028],
    [1.1, 0.044, 0.033, 0.032, 0.024],
    [1.2, 0.052, 0.039, 0.027, 0.02],
    [1.3, 0.057, 0.044, 0.023, 0.017],
    [1.4, 0.063, 0.047, 0.021, 0.016],
    [1.5, 0.067, 0.051, 0.019, 0.014],
    [1.75, 0.077, 0.059, 0.016, 0.012],
    [2.0, 0.085, 0.065, 0.013, 0.01],
  ],
  two_adj_edges_disc: [
    [1.0, 0.047, 0.035, 0.047, 0.035],
    [1.1, 0.053, 0.04, 0.038, 0.029],
    [1.2, 0.06, 0.045, 0.032, 0.024],
    [1.3, 0.065, 0.049, 0.027, 0.021],
    [1.4, 0.071, 0.053, 0.024, 0.018],
    [1.5, 0.075, 0.056, 0.021, 0.016],
    [1.75, 0.084, 0.063, 0.017, 0.013],
    [2.0, 0.091, 0.069, 0.015, 0.011],
  ],
  two_short_edges_disc: [
    [1.0, 0.045, 0.035, 0.0, 0.035],
    [1.1, 0.049, 0.037, 0.0, 0.03],
    [1.2, 0.052, 0.04, 0.0, 0.025],
    [1.3, 0.056, 0.043, 0.0, 0.022],
    [1.4, 0.059, 0.044, 0.0, 0.019],
    [1.5, 0.06, 0.045, 0.0, 0.017],
    [1.75, 0.065, 0.049, 0.0, 0.014],
    [2.0, 0.069, 0.052, 0.0, 0.011],
  ],
  two_long_edges_disc: [
    [1.0, 0.0, 0.035, 0.045, 0.035],
    [1.1, 0.0, 0.043, 0.037, 0.028],
    [1.2, 0.0, 0.051, 0.031, 0.024],
    [1.3, 0.0, 0.057, 0.027, 0.02],
    [1.4, 0.0, 0.063, 0.023, 0.017],
    [1.5, 0.0, 0.068, 0.02, 0.015],
    [1.75, 0.0, 0.08, 0.016, 0.012],
    [2.0, 0.0, 0.088, 0.013, 0.01],
  ],
  three_edges_disc_one_long_cont: [
    [1.0, 0.057, 0.043, 0.0, 0.043],
    [1.1, 0.064, 0.048, 0.0, 0.036],
    [1.2, 0.071, 0.053, 0.0, 0.031],
    [1.3, 0.076, 0.057, 0.0, 0.027],
    [1.4, 0.08, 0.06, 0.0, 0.024],
    [1.5, 0.084, 0.064, 0.0, 0.021],
    [1.75, 0.091, 0.069, 0.0, 0.017],
    [2.0, 0.097, 0.074, 0.0, 0.014],
  ],
  three_edges_disc_one_short_cont: [
    [1.0, 0.0, 0.043, 0.057, 0.043],
    [1.1, 0.0, 0.051, 0.047, 0.036],
    [1.2, 0.0, 0.059, 0.039, 0.03],
    [1.3, 0.0, 0.065, 0.033, 0.025],
    [1.4, 0.0, 0.07, 0.029, 0.022],
    [1.5, 0.0, 0.075, 0.025, 0.019],
    [1.75, 0.0, 0.084, 0.019, 0.014],
    [2.0, 0.0, 0.09, 0.015, 0.011],
  ],
  four_edges_disc: [
    [1.0, 0.0, 0.056, 0.0, 0.056],
    [1.1, 0.0, 0.06, 0.0, 0.044],
    [1.2, 0.0, 0.065, 0.0, 0.035],
    [1.3, 0.0, 0.069, 0.0, 0.028],
    [1.4, 0.0, 0.072, 0.0, 0.023],
    [1.5, 0.0, 0.075, 0.0, 0.018],
    [1.75, 0.0, 0.079, 0.0, 0.013],
    [2.0, 0.0, 0.083, 0.0, 0.009],
  ],
};

function interp(
  rows: Row[],
  r: number,
): { axNeg: number; axPos: number; ayNeg: number; ayPos: number } {
  const rr = Math.min(Math.max(r, 1.0), 2.0);
  if (rr <= rows[0][0])
    return {
      axNeg: rows[0][1],
      axPos: rows[0][2],
      ayNeg: rows[0][3],
      ayPos: rows[0][4],
    };
  const last = rows[rows.length - 1];
  if (rr >= last[0])
    return { axNeg: last[1], axPos: last[2], ayNeg: last[3], ayPos: last[4] };
  for (let i = 0; i < rows.length - 1; i++) {
    if (rr >= rows[i][0] && rr <= rows[i + 1][0]) {
      const t = (rr - rows[i][0]) / (rows[i + 1][0] - rows[i][0]);
      const lerp = (a: number, b: number) => a + t * (b - a);
      return {
        axNeg: lerp(rows[i][1], rows[i + 1][1]),
        axPos: lerp(rows[i][2], rows[i + 1][2]),
        ayNeg: lerp(rows[i][3], rows[i + 1][3]),
        ayPos: lerp(rows[i][4], rows[i + 1][4]),
      };
    }
  }
  return { axNeg: last[1], axPos: last[2], ayNeg: last[3], ayPos: last[4] };
}

function bcToKey(bc: BoundaryCondition): string {
  const m: Partial<Record<BoundaryCondition, string>> = {
    simply_supported: "four_edges_disc",
    four_edges_disc: "four_edges_disc",
    propped: "one_short_edge_disc",
    cantilever: "four_edges_disc",
    interior_panel: "interior_panel",
    one_short_edge_disc: "one_short_edge_disc",
    one_long_edge_disc: "one_long_edge_disc",
    two_adj_edges_disc: "two_adj_edges_disc",
    two_short_edges_disc: "two_short_edges_disc",
    two_long_edges_disc: "two_long_edges_disc",
    three_edges_disc_one_long_cont: "three_edges_disc_one_long_cont",
    three_edges_disc_one_short_cont: "three_edges_disc_one_short_cont",
  };
  return m[bc] ?? "interior_panel";
}

// Required steel area from Mu (kN·m) — per IS 456 Clause G-1
export function calcAst(
  Mu_kNm: number,
  fck: number,
  fy: number,
  d: number,
): number {
  if (Mu_kNm <= 0) return 0;
  const Mu = Mu_kNm * 1e6; // N·mm
  const b = 1000;
  // Mu = 0.87·fy·Ast·d·[1 − (Ast·fy)/(b·d·fck)]
  // Rearranged quadratic: A·x² + B·x + C = 0, x = Ast
  const A = (fy * fy) / (fck * b);
  const B = -(fy * d);
  const C = Mu / 0.87;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return 0;
  return (-B - Math.sqrt(disc)) / (2 * A);
}

// Choose bar spacing (round down to nearest 5 mm, clamp 75–300 mm)
export function barSpacing(
  astReq: number,
  dia: number,
): { spacing: number; astPrv: number } {
  const abar = (Math.PI * dia * dia) / 4;
  if (astReq <= 0) return { spacing: 300, astPrv: (abar * 1000) / 300 };
  let s = Math.floor((abar * 1000) / astReq / 5) * 5;
  s = Math.max(75, Math.min(300, s));
  return { spacing: s, astPrv: (abar * 1000) / s };
}

// IS 456 Table 23 — basic span/depth ratio
function basicFactor(bc: BoundaryCondition, st: SlabType): number {
  if (st === "oneway") {
    if (bc === "cantilever") return 7;
    if (bc === "simply_supported") return 20;
    return 26; // continuous / propped
  }
  if (bc === "four_edges_disc" || bc === "simply_supported") return 20;
  return 26;
}

// IS 456 Fig 4 — modification factor (simplified from figure)
function mfFactor(astReq: number, astPrv: number, fy: number): number {
  const fs = 0.58 * fy * Math.min(astReq / Math.max(astPrv, 1), 1);
  // Curve approximation: MF ≈ 475 / (fs + 65) capped at [0.5, 2.0]
  const mf = 475 / (fs + 65);
  return Math.min(Math.max(mf, 0.5), 2.0);
}

export function designSlab(inp: SlabInputs): SlabResult {
  const warnings: string[] = [];
  const fck = getFck(inp.concreteGrade);
  const fy = getFy(inp.steelGrade);

  const lx = Math.min(inp.lx, inp.ly);
  const ly = Math.max(inp.lx, inp.ly);
  const spanRatio = ly / lx;

  const effectiveSlabType: SlabType = spanRatio > 2 ? "oneway" : inp.slabType;
  if (spanRatio > 2 && inp.slabType === "twoway") {
    warnings.push(
      "Ly/Lx > 2 — slab treated as One-Way per IS 456:2000 Cl. 24.1",
    );
  }

  const selfWeight = (inp.thickness / 1000) * 25; // kN/m²
  const totalDL = selfWeight + inp.floorFinish + inp.sunkLoad;
  const totalLL = inp.liveLoad;
  const w = 1.5 * (totalDL + totalLL); // factored load (kN/m²)

  const d = inp.thickness - inp.cover - inp.barDia / 2; // effective depth (mm)
  const minSteel = 0.0012 * 1000 * inp.thickness; // 0.12% — IS 456 Cl. 26.5.2.1

  const steelPositions: SteelPosition[] = [];
  let distribBarDia = 10,
    distribSpacing = 0,
    distribAst = 0;

  if (effectiveSlabType === "oneway") {
    // Moment coefficients for one-way slab
    let midCoeff = 0,
      suppCoeff = 0;
    switch (inp.boundaryCondition) {
      case "simply_supported":
        midCoeff = 1 / 8;
        suppCoeff = 0;
        break;
      case "propped":
        // One end fixed, one propped: max +ve ≈ 9wl²/128 ≈ 0.0703wl²
        // But STRUDS uses total load formula; approximate with IS 456 coeff
        midCoeff = 0.086;
        suppCoeff = 0.086;
        break;
      case "cantilever":
        midCoeff = 0;
        suppCoeff = 0.5;
        break;
      default:
        midCoeff = 0.083;
        suppCoeff = 0.083;
    }

    const Mmid = midCoeff * w * lx * lx;
    const Msupp = suppCoeff * w * lx * lx;

    const astMid = Math.max(calcAst(Mmid, fck, fy, d), minSteel);
    const midDet = barSpacing(astMid, inp.barDia);

    steelPositions.push({
      position: "Main Mid Span",
      coeff: null,
      moment: Mmid,
      astReq: astMid,
      barDia: inp.barDia,
      spacing: midDet.spacing,
      astPrv: midDet.astPrv,
      remark: "",
    });

    if (Msupp > 0) {
      const astS = Math.max(calcAst(Msupp, fck, fy, d), minSteel);
      const sDet = barSpacing(astS, inp.barDia);
      const edgeName = inp.lx <= inp.ly ? "Right Edge" : "Left Edge";
      steelPositions.push({
        position: edgeName,
        coeff: null,
        moment: null,
        astReq: astS,
        barDia: inp.barDia,
        spacing: sDet.spacing,
        astPrv: sDet.astPrv,
        remark: "Extra at Top",
      });
    }

    // Distribution steel — 0.12% — IS 456 Cl 26.5.2.1
    const distDet = barSpacing(minSteel, 10);
    distribBarDia = 10;
    distribSpacing = distDet.spacing;
    distribAst = distDet.astPrv;

    const mf = mfFactor(astMid, midDet.astPrv, fy);
    const bf = basicFactor(inp.boundaryCondition, "oneway");
    const actualSD = (lx * 1000) / d;
    const permissible = mf * bf;

    return {
      inputs: inp,
      effectiveSlabType,
      spanRatio,
      selfWeight,
      totalDL,
      totalLL,
      totalDesignLoad: w,
      effectiveDepth: d,
      spanDepthRatio: actualSD,
      modificationFactor: mf,
      basicFactor: bf,
      permissibleRatio: permissible,
      deflectionStatus: actualSD <= permissible ? "OK" : "FAIL",
      steelPositions,
      distributionBarDia: distribBarDia,
      distributionSpacing: distribSpacing,
      distributionAst: distribAst,
      minSteelMain: minSteel,
      minSteelDist: minSteel,
      fck,
      fy,
      warnings,
    };
  } else {
    // Two-way slab
    const key = bcToKey(inp.boundaryCondition);
    const rows = T26[key] ?? T26["interior_panel"];
    const c = interp(rows, Math.min(spanRatio, 2.0));

    const MxPos = c.axPos * w * lx * lx;
    const MxNeg = c.axNeg * w * lx * lx;
    const MyPos = c.ayPos * w * lx * lx;
    const MyNeg = c.ayNeg * w * lx * lx;

    const dLong = d - inp.barDia; // second layer of reinforcement

    // Midspan short direction
    const astMS = Math.max(calcAst(MxPos, fck, fy, d), minSteel);
    const msD = barSpacing(astMS, inp.barDia);
    steelPositions.push({
      position: "MidShort",
      coeff: c.axPos,
      moment: MxPos,
      astReq: astMS,
      barDia: inp.barDia,
      spacing: msD.spacing,
      astPrv: msD.astPrv,
      remark: "Main",
    });

    // Midspan long direction
    const astML = Math.max(calcAst(MyPos, fck, fy, dLong), minSteel);
    const mlD = barSpacing(astML, inp.barDia);
    steelPositions.push({
      position: "MidLong",
      coeff: c.ayPos,
      moment: MyPos,
      astReq: astML,
      barDia: inp.barDia,
      spacing: mlD.spacing,
      astPrv: mlD.astPrv,
      remark: "Other",
    });

    // Support (negative) — short direction
    const astSD = Math.max(calcAst(MxNeg, fck, fy, d), minSteel);
    const sdD = barSpacing(astSD, inp.barDia);
    steelPositions.push({
      position: "SuppDown",
      coeff: c.axNeg,
      moment: MxNeg,
      astReq: MxNeg > 0 ? astSD : 0,
      barDia: inp.barDia,
      spacing: sdD.spacing,
      astPrv: sdD.astPrv,
      remark: "Extra at Top",
    });

    // Support (negative) — long direction
    const astST = Math.max(calcAst(MyNeg, fck, fy, d), minSteel);
    const stD = barSpacing(astST, inp.barDia);
    steelPositions.push({
      position: "SuppTop",
      coeff: c.ayNeg,
      moment: MyNeg,
      astReq: MyNeg > 0 ? astST : 0,
      barDia: inp.barDia,
      spacing: stD.spacing,
      astPrv: stD.astPrv,
      remark: "Extra at Top",
    });

    // Left & Right supports (use average of axNeg/ayNeg for side strips)
    const avgCoeff = (c.axNeg + c.ayNeg) / 2;
    const MsideL = Math.max(avgCoeff * w * lx * lx, 0);
    const astSL = Math.max(
      calcAst(
        MsideL > 0 ? MsideL : MyNeg > 0 ? MyNeg * 0.5 : minSteel * 0.5,
        fck,
        fy,
        d,
      ),
      minSteel,
    );
    const slD = barSpacing(astSL, inp.barDia);
    steelPositions.push({
      position: "SuppLeft",
      coeff: c.ayNeg > 0 ? c.ayNeg : 0,
      moment: MyNeg > 0 ? MyNeg * 0.5 : 0,
      astReq: MyNeg > 0 ? astSL : 0,
      barDia: inp.barDia,
      spacing: slD.spacing,
      astPrv: slD.astPrv,
      remark: "Extra at Top",
    });

    const astSR = Math.max(
      calcAst(MxNeg > 0 ? MxNeg : MxPos * 0.75, fck, fy, d),
      minSteel,
    );
    const srD = barSpacing(astSR, inp.barDia);
    steelPositions.push({
      position: "SuppRight",
      coeff: c.axNeg,
      moment: MxNeg,
      astReq: astSR,
      barDia: inp.barDia,
      spacing: srD.spacing,
      astPrv: srD.astPrv,
      remark: "Extra at Top",
    });

    const mf = mfFactor(astMS, msD.astPrv, fy);
    const bf = basicFactor(inp.boundaryCondition, "twoway");
    const actualSD = (lx * 1000) / d;
    const permissible = mf * bf;

    return {
      inputs: inp,
      effectiveSlabType,
      spanRatio,
      selfWeight,
      totalDL,
      totalLL,
      totalDesignLoad: w,
      effectiveDepth: d,
      spanDepthRatio: actualSD,
      modificationFactor: mf,
      basicFactor: bf,
      permissibleRatio: permissible,
      deflectionStatus: actualSD <= permissible ? "OK" : "FAIL",
      steelPositions,
      distributionBarDia: 0,
      distributionSpacing: 0,
      distributionAst: 0,
      minSteelMain: minSteel,
      minSteelDist: minSteel,
      fck,
      fy,
      warnings,
    };
  }
}

export const bcLabels: Record<BoundaryCondition, string> = {
  simply_supported: "Simply Supported (All Edges)",
  propped: "Propped Slab (One Edge Continuous)",
  cantilever: "Cantilever",
  interior_panel: "Interior Panel (All Edges Continuous)",
  one_short_edge_disc: "One Short Edge Discontinuous",
  one_long_edge_disc: "One Long Edge Discontinuous",
  two_adj_edges_disc: "Two Adjacent Edges Discontinuous",
  two_short_edges_disc: "Two Short Edges Discontinuous",
  two_long_edges_disc: "Two Long Edges Discontinuous",
  three_edges_disc_one_long_cont:
    "Three Edges Disc. (One Long Edge Continuous)",
  three_edges_disc_one_short_cont:
    "Three Edges Disc. (One Short Edge Continuous)",
  four_edges_disc: "Four Edges Discontinuous",
};

export const oneWayBC: BoundaryCondition[] = [
  "simply_supported",
  "propped",
  "cantilever",
];
export const twoWayBC: BoundaryCondition[] = [
  "interior_panel",
  "one_short_edge_disc",
  "one_long_edge_disc",
  "two_adj_edges_disc",
  "two_short_edges_disc",
  "two_long_edges_disc",
  "three_edges_disc_one_long_cont",
  "three_edges_disc_one_short_cont",
  "four_edges_disc",
];
