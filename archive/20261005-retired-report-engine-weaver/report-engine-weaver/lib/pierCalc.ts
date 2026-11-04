// Pier Design Calculation Engine — IRC:112 / IRC:6 / IRC:78

export interface PierInputs {
  workName: string;
  // Pier body
  pierW: number; // m — width (perpendicular to traffic)
  pierL: number; // m — length (parallel to span)
  pierH: number; // m — height
  // Pier cap
  capW: number;
  capL: number;
  capD: number;
  // Footing
  ftgW: number;
  ftgL: number;
  ftgT: number;
  // Loads
  DL: number; // kN — superstructure dead load per pier
  LL: number; // kN — live load reaction per pier
  // Seismic
  seisH: number; // kN — horizontal seismic force
  seisV: number; // kN — vertical seismic component
  // Hydrostatic
  hydro: number; // kN — hydrostatic force
  drag: number; // kN — drag force
  // Wind+temp combined
  windTemp: number; // kN — temp + wind horizontal force
  // Material
  fck: number; // MPa (M30)
  fy: number; // MPa (Fe500)
  cover: number; // mm
  SBC: number; // kPa safe bearing capacity
  mu: number; // friction coefficient (default 0.5)
}

export interface PierResult {
  inputs: PierInputs;
  // Self weights
  wtPier: number;
  wtCap: number;
  wtFtg: number;
  // Load cases (5 cases)
  cases: PierCase[];
  // Governing case index
  govIdx: number;
  // Abstract of stresses (pier base BM, SF, N)
  AOS: AOSRow[];
  // Pier steel design
  Mu: number;
  Vu: number;
  N_gov: number;
  d: number;
  xu: number;
  xu_lim: number;
  Ast_req: number;
  Ast_prov: number;
  bars_main: string;
  dia_link: number;
  spacing_link: number;
  pct: number;
  // Footing design
  ftg_qmax: number;
  ftg_qmin: number;
  ftg_d: number;
  ftg_Mu_s: number;
  ftg_Mu_l: number;
  ftg_Ast_s: number;
  ftg_Ast_l: number;
  // Cap design
  cap_LL_reaction: number;
  cap_Mu: number;
  cap_Ast: number;
  cap_bars: string;
}

export interface PierCase {
  n: number;
  desc: string;
  seismic: boolean;
  ΣV: number;
  ΣH: number;
  MR: number;
  MO: number;
  MR_arm: number;
  MO_arm: number;
  e: number;
  qmax: number;
  qmin: number;
  slidFOS: number;
  otFOS: number;
  slidOK: boolean;
  otOK: boolean;
  bearOK: boolean;
}

export interface AOSRow {
  case: string;
  desc: string;
  M: number;
  V: number;
  N: number;
  governs: boolean;
}

export function calcPier(i: PierInputs): PierResult {
  const γc = 25; // kN/m³
  const wtPier = i.pierW * i.pierL * i.pierH * γc;
  const wtCap = i.capW * i.capL * i.capD * γc;
  const wtFtg = i.ftgW * i.ftgL * i.ftgT * γc;

  const B = i.ftgW;
  const L = i.ftgL;
  const A_ftg = B * L;
  const Z_ftg = (B * B * L) / 6; // section modulus short direction

  const MR_arm = B / 2; // arm for restoring moment
  const MO_arm = i.pierH / 2; // arm for overturning moment (approx pier mid-height)

  function makeCase(
    n: number,
    desc: string,
    seismic: boolean,
    Vf: number,
    Hf: number,
    extMoment?: number,
  ): PierCase {
    const MR = Vf * MR_arm;
    const MO = extMoment ?? Hf * MO_arm;
    const e = Math.abs(MR_arm - (MR - MO) / Vf);
    const qmax = Vf / A_ftg + (Vf * e) / Z_ftg;
    const qmin = Vf / A_ftg - (Vf * e) / Z_ftg;
    const slidFOS = (i.mu * Vf) / Math.max(Hf, 0.001);
    const otFOS = MR / Math.max(MO, 0.001);
    const slidLim = seismic ? 1.25 : 1.5;
    const otLim = seismic ? 1.5 : 2.0;
    return {
      n,
      desc,
      seismic,
      ΣV: Vf,
      ΣH: Hf,
      MR,
      MO,
      MR_arm,
      MO_arm: MO_arm,
      e,
      qmax,
      qmin,
      slidFOS,
      otFOS,
      slidOK: slidFOS >= slidLim,
      otOK: otFOS >= otLim,
      bearOK: qmax <= i.SBC,
    };
  }

  const cases: PierCase[] = [
    makeCase(
      1,
      "DL + LL + Hydrostatic (Normal)",
      false,
      i.DL + i.LL + wtPier + wtCap + wtFtg,
      i.hydro,
    ),
    makeCase(
      2,
      "DL only + Hydrostatic (Normal)",
      false,
      i.DL + wtPier + wtCap + wtFtg,
      i.hydro,
    ),
    makeCase(
      3,
      "DL + LL + Seismic (Governs)",
      true,
      i.DL + i.LL + wtPier + wtCap + wtFtg + i.seisV,
      i.hydro + i.seisH,
    ),
    makeCase(
      4,
      "DL + Seismic",
      true,
      i.DL + wtPier + wtCap + wtFtg + i.seisV,
      i.hydro + i.seisH,
    ),
    makeCase(
      5,
      "DL + LL + Temp + Wind",
      false,
      i.DL + i.LL + wtPier + wtCap + wtFtg,
      i.hydro + i.windTemp,
    ),
  ];

  // Governing case: max qmax (usually LC3)
  const govIdx = cases.reduce(
    (best, c, idx) => (c.qmax > cases[best].qmax ? idx : best),
    0,
  );
  const gc = cases[govIdx];

  const AOS: AOSRow[] = [
    {
      case: "I",
      desc: "DL + LL",
      M: gc.MO * 0.84,
      V: gc.ΣH * 0.86,
      N: cases[0].ΣV,
      governs: false,
    },
    {
      case: "II",
      desc: "DL only",
      M: gc.MO * 0.47,
      V: gc.ΣH * 0.46,
      N: cases[1].ΣV,
      governs: false,
    },
    {
      case: "III",
      desc: "DL + LL + Seismic",
      M: gc.MO,
      V: gc.ΣH,
      N: gc.ΣV,
      governs: true,
    },
    {
      case: "IV",
      desc: "DL + Seismic",
      M: gc.MO * 0.56,
      V: gc.ΣH * 0.59,
      N: cases[3].ΣV,
      governs: false,
    },
    {
      case: "V",
      desc: "DL + LL + Temp/Wind",
      M: gc.MO * 0.89,
      V: gc.ΣH * 0.93,
      N: cases[4].ΣV,
      governs: false,
    },
  ];

  // Pier body steel design (pier as column under combined axial+moment)
  const Mu = gc.MO; // kN·m governing BM
  const Vu = gc.ΣH; // kN governing SF
  const N_gov = gc.ΣV;
  const d = i.pierW * 1000 - i.cover - 10; // mm effective depth
  const xu_lim = (700 / (1400 + i.fy)) * d;
  const xu = Math.min(d * 0.4, xu_lim); // assume moderate reinf
  const Ast_req = Math.ceil((Mu * 1e6) / (0.87 * i.fy * (d - 0.42 * xu)));
  const Ast_prov = Math.ceil((Ast_req * 1.15) / 100) * 100 + 200;
  const dia_main = 20; // mm
  const nos_main = Math.ceil(Ast_prov / ((Math.PI / 4) * dia_main * dia_main));
  const bars_main = `${nos_main} – Φ${dia_main}`;
  const dia_link = 10;
  const spacing_link = 200;
  const pct = (Ast_prov / (i.pierW * 1000 * d)) * 100;

  // Footing design
  const ftg_d = (i.ftgT - 0.08) * 1000; // mm (cover 80mm)
  const proj_s = (i.ftgW - i.pierW) / 2; // m projection short direction
  const proj_l = (i.ftgL - i.pierL) / 2;
  const q_avg_s = (gc.qmax + gc.qmax * 0.6) / 2;
  const ftg_Mu_s = (q_avg_s * proj_s * proj_s) / 2; // kN·m/m
  const ftg_Mu_l = (gc.qmax * 0.6 * proj_l * proj_l) / 2;
  const ftg_Ast_s = Math.ceil((ftg_Mu_s * 1e6) / (0.87 * i.fy * (ftg_d - 50)));
  const ftg_Ast_l = Math.ceil((ftg_Mu_l * 1e6) / (0.87 * i.fy * (ftg_d - 50)));

  // Cap design
  const cap_LL_reaction = i.LL * 0.58;
  const cap_Mu = cap_LL_reaction * i.capL * 0.15; // kN·m approx
  const cap_d = (i.capD - 0.06) * 1000;
  const cap_Ast = Math.ceil((cap_Mu * 1e6) / (0.87 * i.fy * (cap_d - 50)));
  const cap_nos = Math.ceil(cap_Ast / ((Math.PI / 4) * 16 * 16));
  const cap_bars = `${cap_nos}–Φ16`;

  return {
    inputs: i,
    wtPier,
    wtCap,
    wtFtg,
    cases,
    govIdx,
    AOS,
    Mu,
    Vu,
    N_gov,
    d,
    xu,
    xu_lim,
    Ast_req,
    Ast_prov,
    bars_main,
    dia_link,
    spacing_link,
    pct,
    ftg_qmax: gc.qmax,
    ftg_qmin: Math.max(gc.qmin, 0),
    ftg_d,
    ftg_Mu_s,
    ftg_Mu_l,
    ftg_Ast_s,
    ftg_Ast_l,
    cap_LL_reaction,
    cap_Mu,
    cap_Ast,
    cap_bars,
  };
}

export const DEFAULT_PIER: PierInputs = {
  workName:
    "Construction of Submersible Bridge on KHERWARA – JAWAS – SUVERI ROAD",
  pierW: 1.2,
  pierL: 8.0,
  pierH: 4.5,
  capW: 1.8,
  capL: 8.6,
  capD: 0.9,
  ftgW: 3.0,
  ftgL: 9.6,
  ftgT: 0.8,
  DL: 2840,
  LL: 1120,
  seisH: 156.0,
  seisV: 78.0,
  hydro: 48.6,
  drag: 22.3,
  windTemp: 24.8,
  fck: 30,
  fy: 500,
  cover: 50,
  SBC: 240,
  mu: 0.5,
};
