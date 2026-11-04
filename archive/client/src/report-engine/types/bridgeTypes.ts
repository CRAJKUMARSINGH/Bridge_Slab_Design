// Bridge types for the narrative prose report engine (Repo B)
export interface XSecRow { ch: string; gl: number; remarks: string; }
export interface MoSTRow {
  span: number; live_load: number; breaking_load: number;
  ll_reaction: number; ll_moment: number; dl_moment: number; breaking_force: number;
}
export interface Inputs {
  firmName?: string; firmLogo?: string;
  name: string; location: string; river: string; jobNo: string;
  client: string; engineer: string; strudsVer: string; buildVer: string;
  spans: number; spanL: number; cwWidth: number; fpWidth: number;
  totalW: number; skewDeg: number; showFootpath: boolean; grade: string; steel: string;
  A: number; P_: number; n: number; S_denom: number; HFL: number; bedRL: number;
  Ksf: number; A_obs_slab: number; A_obs_pier: number; A_obs_abt: number;
  xsec: XSecRow[]; mostStandards: MoSTRow[];
  phi: number; gamma: number; Df: number; ftgB: number;
  Nc: number; Nq: number; Ny: number; FOS_sbc: number; SBC: number; mu: number;
  pierW: number; pierL: number; pierH: number; capW: number; capL: number; capD: number;
  ftgPW: number; ftgPL: number; ftgPT: number;
  DL_pier: number; LL_pier: number; seisH: number; seisV: number;
  hydro: number; drag: number; windTemp: number;
  fck_pier: number; fy_pier: number; cover_pier: number;
  abt_H: number; abt_Bbase: number; abt_toe?: number; abt_heel?: number;
  abt_tstem: number; abt_tftg: number; abt_phi: number; abt_gamma: number;
  c1_Bbase: number; c1_tstem: number;
  qty_earthwork: number; qty_pcc: number; qty_m25: number; qty_m30: number;
  qty_m35: number; qty_steel: number; qty_formwork: number; qty_railing: number;
  qty_wc: number; qty_pitching: number; qty_backfill: number;
  rate_earthwork: number; rate_pcc: number; rate_m25: number; rate_m30: number;
  rate_m35: number; rate_steel: number; rate_railing: number; rate_wc: number;
  rate_pitching: number; rate_backfill: number;
  slabD: number; anchorDia: number; anchorBoltDia: number; anchorBoltGrade: string;
  ancIsRequired: boolean; slab_span: number; slab_t: number; slab_wc: number;
  slab_fy: number; slab_fck: number; slab_cover: number;
  retWallL: number; retWallT: number; dirtWallT: number;
  ancBoltDia: number; ancBoltGrade: string;
  seismicZone?: 'II' | 'III' | 'IV' | 'V';
  Cd?: number; R_factor?: number; I_factor?: number;
  f1Factor?: number; f2Factor?: number; maxScourMultiplier?: number; v_observed?: number;
  pier_rect_L?: number; pier_flared_L?: number; pier_flared_W?: number; pier_flared_H?: number;
}
