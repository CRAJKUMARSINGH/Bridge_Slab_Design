import { Inputs } from './types/bridgeTypes';
import { calculateHydraulics, HydraulicsResults } from './services/hydraulics';
import { calculateStructural, StructuralResults } from './services/structural';
import { calculateCosting, CostingResults } from './services/costing';
// REFERENCE-APP00 superior engines — absorbed via Hybrid Superiority Principle
import { calcPier, PierResult } from './lib/pierCalc';
import { designIRCSlab } from './lib/ircSlabCalc';
import { calcDeadLoad, calcSeismic, calcWaterCurrent, calcBraking } from './lib/loadCalc';

export interface Derived extends HydraulicsResults, StructuralResults, CostingResults {
  recSpans: number;
  recSpanL: number;
  recAfflux: string | number;
  isUndersized: boolean;

  // IRC:66 Slab (Working Stress — upgraded via ircSlabCalc)
  sl66_leff: number;
  sl66_be: number;
  sl66_Mdl: number;
  sl66_Mll: number;
  sl66_Mtot: number;
  sl66_dreq: number;
  sl66_Ast: number;

  // Deck Anchorage
  dl_slab: number; buoyancy: number; uplift: number; totalUplift: number;
  anchorCapacity: number; numBolts: number; net_force: number;

  // Weights
  wt_pier: number; wt_cap: number; wt_ftg: number;

  // Geometry volumes
  geo: {
    pier_rect_V: number; pier_curved_V: number;
    cap_main_V: number; cap_flare_V: number; ftg_V: number;
    slab_self_V: number; wc_V: number;
    abt_stem_V: number; abt_ftg_V: number; dirtwall_V: number;
  };

  // Abutment design fields
  Ka: number; Pa: number; Pa_h: number; Pa_v: number;
  SBC: number;
  abt_stem_Mu: number; abt_stem_d: number; abt_stem_Ast: number;
  abt_heel_Mu: number; abt_toe_Mu: number; abt_ftg_d: number;
  abt_heel_Ast: number; abt_toe_Ast: number;
  dirtwall_Mu: number; dirtwall_Ast: number; h_dw: number;
  c1_stem_Mu: number; c1_stem_d: number; c1_stem_Ast: number;
  c1_heel_Mu: number; c1_toe_Mu: number; c1_heel_Ast: number;
  c1_toe_Ast: number; c1_cap_Mu: number; c1_cap_Ast: number;

  // Slab design fields
  sl_d: number; sl_leff: number; wDL: number; wLL: number; wu: number;
  Mu_slab: number; Ast_req_slab: number; Ast_prov_slab: number; sp_main: number;

  // Pier design (upgraded — from calcPier)
  qnu: number;
  L_eff_skew: number;
  ftg_d: number; ftg_Mu_s: number; ftg_Ast_s: number; ftg_Mu_l: number; ftg_Ast_l: number;
  cap_Mu: number; cap_d: number; cap_Ast: number; cap_nos: number;
  MR_arm: number; MO_arm: number;

  // Full pier result from REFERENCE-APP00 calcPier (5 IRC load cases, AOS, steel)
  pierResult: PierResult;

  // Load calculation results (REFERENCE-APP00 loadCalc)
  deadLoad: ReturnType<typeof calcDeadLoad>;
  seismic: ReturnType<typeof calcSeismic>;
  waterCurrent: ReturnType<typeof calcWaterCurrent>;
  braking: ReturnType<typeof calcBraking>;
}

/**
 * HYBRID DERIVATION ENGINE (Version 3.0)
 * OUR_APP service architecture + REFERENCE-APP00 superior calculation engines
 * Zero-Loss: all existing fields preserved; new fields added from REF-APP00
 */
export function derive(i: Inputs): Derived {
  //  Layer 1: Hydraulics (OUR_APP service — proven, golden-tested)
  const hydraulics = calculateHydraulics(i);

  //  Layer 2: Structural (OUR_APP service — stability cases)
  const structural = calculateStructural(i, hydraulics);

  //  Layer 3: Costing (OUR_APP service)
  const costing = calculateCosting(i, structural);

  //  Layer 4: Pier Design — REFERENCE-APP00 calcPier (5 IRC load cases, AOS, footing, cap)
  const pierResult = calcPier({
    workName: i.name,
    pierW: i.pierW, pierL: i.pierL, pierH: i.pierH,
    capW: i.capW, capL: i.capL, capD: i.capD,
    ftgW: i.ftgPW, ftgL: i.ftgPL, ftgT: i.ftgPT,
    DL: i.DL_pier, LL: i.LL_pier,
    seisH: i.seisH, seisV: i.seisV,
    hydro: i.hydro, drag: i.drag, windTemp: i.windTemp,
    fck: i.fck_pier, fy: i.fy_pier, cover: i.cover_pier,
    SBC: i.SBC, mu: i.mu,
  });

  //  Layer 5: IRC Slab Design — REFERENCE-APP00 designIRCSlab (working stress, K-factor table)
  const ircSlab = designIRCSlab({
    slabName: i.name,
    concreteGrade: (i.grade as any) || 'M30',
    steelGrade: (i.steel as any) || 'Fe500',
    clearSpan: i.slab_span,
    supportWidth: 0.45,
    slabThickness: i.slab_t,
    wearingCoatThickness: i.slab_wc,
    carriagewayWidth: i.cwWidth,
    footpathWidth: i.fpWidth,
    cover: i.slab_cover,
    barDia: 20,
    a1: 3.6, b1: 0.85, b2: 1.2,
    totalLiveLoad: 700,
    concreteUW: 24, wearingCoatUW: 22,
    impactMethod: 'irc6',
  });

  //  Layer 6: Load Calculations — REFERENCE-APP00 loadCalc
  const deadLoad = calcDeadLoad({
    workName: i.name,
    spanLength: i.spanL,
    slabThickness: i.slab_t,
    wearingCoatThickness: i.slab_wc,
    footpathWidth: i.fpWidth,
    railingLoad: 1.0,
    numSpans: i.spans,
    spanWidth: i.cwWidth,
    concreteUW: 24, bituminousUW: 22,
  });

  const seismic = calcSeismic({
    workName: i.name,
    seismicZone: i.seismicZone ?? 'III',
    soilType: 'II',
    importanceFactor: i.I_factor ?? 1.5,
    responseFactor: i.R_factor ?? 3.0,
    deckDL: i.DL_pier * i.spans,
    pierSelfWeight: pierResult.wtPier + pierResult.wtCap + pierResult.wtFtg,
    numPiers: Math.max(i.spans - 1, 1),
  });

  const waterCurrent = calcWaterCurrent({
    workName: i.name,
    velocity: hydraulics.V,
    numPiers: Math.max(i.spans - 1, 1),
    pierWidth: i.pierW,
    pierHeight: Math.max(i.HFL - i.bedRL, 1),
    pierShape: 'semicircular',
    angle: i.skewDeg,
  });

  const braking = calcBraking({
    workName: i.name,
    spanLength: i.spanL,
    liveLoadClass: 'ClassA',
    numLanes: Math.max(1, Math.floor(i.cwWidth / 3.5)),
    pierHeight: i.pierH,
  });

  //  IRC:66 Slab (upgraded — use ircSlabCalc result where available)
  const sl66_leff = ircSlab.effectiveSpan;
  const sl66_Mdl = ircSlab.deadLoadMoment;
  const sl66_Mll = ircSlab.liveLoadMoment;
  const sl66_Mtot = ircSlab.designMoment;
  const sl66_dreq = ircSlab.requiredDepth;
  const sl66_Ast = ircSlab.requiredSteel;
  const sl66_be = ircSlab.effectiveWidthBe;

  //  Deck Anchorage
  const dl_slab = (i.spanL * i.totalW * i.slabD * 25) + (i.spanL * i.totalW * 0.075 * 24);
  const buoyancy = i.spanL * i.totalW * i.slabD * 10;
  const hydrodynamicUplift = 0.5 * 1.5 * (hydraulics.V * hydraulics.V) * (i.totalW * i.spanL) / 10;
  const totalUplift = buoyancy + hydrodynamicUplift;
  const anchorCapacity = 45;
  const net_force = totalUplift - dl_slab * 0.9;
  const numBolts = net_force > 0 ? Math.max(4, Math.ceil(net_force / anchorCapacity)) : 4;

  //  Geometry
  const qnu = i.SBC * i.FOS_sbc;
  const L_eff_skew = i.spanL / Math.max(Math.cos((i.skewDeg * Math.PI) / 180), 0.1);
  const MR_arm = pierResult.cases[0]?.MR_arm ?? i.ftgPW / 2;
  const MO_arm = pierResult.cases[0]?.MO_arm ?? (i.pierH / 2 + i.ftgPT);

  //  Pier footing/cap from calcPier (REFERENCE-APP00 — superior)
  const ftg_d = pierResult.ftg_d;
  const ftg_Mu_s = pierResult.ftg_Mu_s;
  const ftg_Mu_l = pierResult.ftg_Mu_l;
  const ftg_Ast_s = pierResult.ftg_Ast_s;
  const ftg_Ast_l = pierResult.ftg_Ast_l;
  const cap_Mu = pierResult.cap_Mu;
  const cap_d = (i.capD - 0.06) * 1000;
  const cap_Ast = pierResult.cap_Ast;
  const cap_nos = Math.max(2, Math.ceil(cap_Ast / ((Math.PI / 4) * 16 * 16)));

  //  Geometry volumes (OUR_APP — superior tracking)
  const pier_rect_L = i.pier_rect_L ?? (i.pierL - i.pierW);
  const pier_rect_V = pier_rect_L * i.pierW * i.pierH;
  const pier_curved_V = (Math.PI / 4) * i.pierW * i.pierW * i.pierH;
  const cap_main_V = i.capW * i.capL * i.capD;
  const cap_flare_V = i.capL * i.capD * 0.1;
  const ftg_V = i.ftgPW * i.ftgPL * i.ftgPT;
  const slab_self_V = i.spanL * i.totalW * i.slabD;
  const wc_V = i.spanL * i.totalW * 0.075;
  const abt_stem_V = i.abt_H * i.abt_tstem * i.totalW;
  const abt_ftg_V = i.abt_Bbase * i.abt_tftg * i.totalW;
  const dirtwall_V = i.totalW * i.dirtWallT * i.slabD;

  //  Abutment earth pressure (Rankine)
  const phiRad = i.abt_phi * (Math.PI / 180);
  const Ka = Math.tan(Math.PI / 4 - phiRad / 2) ** 2;
  const Pa = 0.5 * i.abt_gamma * i.abt_H * i.abt_H * Ka;
  const Pa_h = Pa * Math.cos(20 * Math.PI / 180);
  const Pa_v = Pa * Math.sin(20 * Math.PI / 180);

  //  Slab design (IS 456 ULS — from existing structural service)
  const fy = Math.max(i.fy_pier, 250);
  const sl_d = Math.max((i.slab_t - i.slab_cover - 10), 200);
  const sl_leff = i.slab_span;
  const wDL = deadLoad.totalDL;
  const wLL = 5.0; // kN/m IRC Class A equivalent
  const wu = 1.5 * (wDL + wLL);
  const Mu_slab = (wu * sl_leff * sl_leff) / 8;
  const Ast_req_slab = Math.ceil((Mu_slab * 1e6) / (0.87 * fy * (sl_d - 0.42 * (700 / (1400 + fy)) * sl_d)));
  const Ast_prov_slab = Math.ceil(Ast_req_slab * 1.15 / 100) * 100 + 200;
  const sp_main = Math.max(75, Math.min(300, Math.floor(((Math.PI / 4) * 20 * 20 * 1000) / Ast_req_slab / 5) * 5));

  return {
    ...hydraulics,
    ...structural,
    ...costing,
    dl_slab, buoyancy, uplift: hydrodynamicUplift, totalUplift, anchorCapacity, numBolts, net_force,
    SBC: i.SBC,
    geo: { pier_rect_V, pier_curved_V, cap_main_V, cap_flare_V, ftg_V, slab_self_V, wc_V, abt_stem_V, abt_ftg_V, dirtwall_V },
    recSpans: i.spans,
    recSpanL: i.spanL,
    recAfflux: hydraulics.afflux < 0.3 ? 'Safe' : 'Moderate',
    isUndersized: hydraulics.totalL < hydraulics.L_lacey * 0.95,
    sl66_leff, sl66_be, sl66_Mdl, sl66_Mll, sl66_Mtot, sl66_dreq, sl66_Ast,
    Ka, Pa, Pa_h, Pa_v,
    qnu, L_eff_skew, MR_arm, MO_arm,
    ftg_d, ftg_Mu_s, ftg_Ast_s, ftg_Mu_l, ftg_Ast_l,
    cap_Mu, cap_d, cap_Ast, cap_nos,
    wt_pier: pierResult.wtPier,
    wt_cap: pierResult.wtCap,
    wt_ftg: pierResult.wtFtg,
    pierResult,
    deadLoad, seismic, waterCurrent, braking,
    abt_stem_Mu: Pa_h * (i.abt_H / 3), abt_stem_d: Math.max((i.abt_tstem - 0.06) * 1000, 200),
    abt_stem_Ast: Math.ceil((Pa_h * (i.abt_H / 3) * 1e6) / (0.87 * fy * Math.max((i.abt_tstem - 0.06) * 1000 - 50, 50))),
    abt_heel_Mu: Pa * 0.6, abt_toe_Mu: Pa * 0.4,
    abt_ftg_d: Math.max((i.abt_tftg - 0.08) * 1000, 200),
    abt_heel_Ast: Math.ceil((Pa * 0.6 * 1e6) / (0.87 * fy * Math.max((i.abt_tftg - 0.08) * 1000 - 50, 50))),
    abt_toe_Ast: Math.ceil((Pa * 0.4 * 1e6) / (0.87 * fy * Math.max((i.abt_tftg - 0.08) * 1000 - 50, 50))),
    dirtwall_Mu: 0.5 * i.abt_gamma * i.slabD * i.slabD * Ka * i.slabD / 3,
    dirtwall_Ast: 1200, h_dw: i.slabD,
    c1_stem_Mu: Pa_h * (i.abt_H / 3) * 1.05, c1_stem_d: Math.max((i.c1_tstem - 0.06) * 1000, 200),
    c1_stem_Ast: Math.ceil((Pa_h * (i.abt_H / 3) * 1.05 * 1e6) / (0.87 * fy * Math.max((i.c1_tstem - 0.06) * 1000 - 50, 50))),
    c1_heel_Mu: Pa * 0.65, c1_toe_Mu: Pa * 0.45,
    c1_heel_Ast: Math.ceil((Pa * 0.65 * 1e6) / (0.87 * fy * 350)),
    c1_toe_Ast: Math.ceil((Pa * 0.45 * 1e6) / (0.87 * fy * 350)),
    c1_cap_Mu: 80, c1_cap_Ast: 1800,
    sl_d, sl_leff, wDL, wLL, wu, Mu_slab, Ast_req_slab, Ast_prov_slab, sp_main,
  };
}
