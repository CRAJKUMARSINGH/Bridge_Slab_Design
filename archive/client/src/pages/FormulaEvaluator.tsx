/**
 * FormulaEvaluator — Live ASTRA formula evaluator with real-time IRC verdicts
 * All formulas sourced from CRAJKUMARSINGH/Bridge_Slab_Design ASTRA 15 TUTORIALS
 * Engineers type in values → every formula recomputes instantly → pass/fail badge shown.
 */
import { useState, useMemo } from 'react';
import { Calculator, Waves, GitBranch, Shield, Zap, BookOpen, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';

// ─── helpers ─────────────────────────────────────────────────────────────────
const N = (v: number, d = 3) => isNaN(v) || !isFinite(v) ? '—' : v.toFixed(d);

function NumInput({
  label, unit, value, onChange, step = 0.01, min = 0,
}: { label: string; unit: string; value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-app-muted uppercase tracking-wide mb-1">{label} {unit && <span className="font-normal normal-case text-app-muted/70">({unit})</span>}</label>
      <input
        type="number" value={value} step={step} min={min}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-[var(--app-glass-border)] bg-app-card/50 px-2.5 py-1.5 text-sm font-mono text-app-fg focus:outline-none focus:border-app-accent/60 transition"
      />
    </div>
  );
}

type Verdict = 'PASS' | 'FAIL' | 'WARN' | 'INFO';

function ResultRow({ label, formula, result, verdict, limit, benchmark }: {
  label: string; formula: string; result: string; verdict: Verdict; limit?: string; benchmark?: string;
}) {
  const cfg: Record<Verdict, { border: string; badge: string; icon: typeof CheckCircle2 }> = {
    PASS: { border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
    FAIL: { border: 'border-red-500/20',     badge: 'bg-red-500/10 text-red-400 border-red-500/30',         icon: XCircle },
    WARN: { border: 'border-amber-500/20',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',   icon: AlertTriangle },
    INFO: { border: 'border-blue-500/20',    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',      icon: CheckCircle2 },
  };
  const c = cfg[verdict];
  const Icon = c.icon;
  return (
    <div className={`rounded-lg border p-3 ${c.border}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-app-fg">{label}</span>
        <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${c.badge}`}>
          <Icon className="h-2.5 w-2.5" />{verdict}
        </span>
      </div>
      <p className="font-mono text-[9px] text-app-muted/70 mb-1">{formula}</p>
      <p className="font-mono text-sm font-bold text-emerald-400">{result}</p>
      {limit && <p className="text-[9px] text-app-muted mt-1">Limit: {limit}</p>}
      {benchmark && <p className="text-[9px] text-amber-400 mt-1">ASTRA: {benchmark}</p>}
    </div>
  );
}

// ─── HYDRAULICS TAB ───────────────────────────────────────────────────────────
function HydraulicsTab() {
  const [v, setV] = useState({ A: 48.5, P: 22.4, n: 0.030, S_denom: 6000, Q_given: 0, Ksf: 1.50, pier_b: 1.2, HFL: 100.5, bedRL: 99.0, y: 2.16 });
  const s = (k: keyof typeof v, val: number) => setV(p => ({ ...p, [k]: val }));

  const R = v.A / Math.max(v.P, 0.0001);
  const S0 = 1 / Math.max(v.S_denom, 1);
  const V_man = (1 / v.n) * Math.pow(R, 2 / 3) * Math.pow(S0, 0.5);
  const Q = V_man * v.A;
  const Fr = V_man / Math.sqrt(9.81 * v.y);
  const q_unit = Q / Math.max(v.A / v.y, 0.0001);
  const L_lacey = 4.75 * Math.sqrt(Q);
  const dsm = 1.34 * Math.pow((q_unit * q_unit) / Math.max(v.Ksf, 0.001), 1 / 3);
  const D_design = 2.0 * dsm;
  const Db_sq_over_Ksf = (v.pier_b * v.pier_b) / Math.max(v.Ksf, 0.001);
  const dsm_pier = 1.34 * Math.pow(Db_sq_over_Ksf, 1 / 3);
  const foundRL = v.bedRL - D_design;
  const afflux = (V_man * V_man) / (2 * 9.81) * 0.15;  // simplified Molesworth
  const DWL = v.HFL + afflux;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Cross-Section & Channel</p>
        <NumInput label="Cross-section Area A" unit="m²" value={v.A} onChange={val => s('A', val)} step={0.5} />
        <NumInput label="Wetted Perimeter P" unit="m" value={v.P} onChange={val => s('P', val)} step={0.1} />
        <NumInput label="Flow Depth y" unit="m" value={v.y} onChange={val => s('y', val)} step={0.1} />
        <NumInput label="Manning's n" unit="" value={v.n} onChange={val => s('n', val)} step={0.001} min={0.010} />
        <NumInput label="Bed slope 1:S_denom" unit="" value={v.S_denom} onChange={val => s('S_denom', val)} step={500} min={100} />
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mt-4 mb-2">Scour & Levels</p>
        <NumInput label="Silt factor Ksf" unit="" value={v.Ksf} onChange={val => s('Ksf', val)} step={0.05} />
        <NumInput label="Pier width b" unit="m" value={v.pier_b} onChange={val => s('pier_b', val)} step={0.1} />
        <NumInput label="Bed RL" unit="m" value={v.bedRL} onChange={val => s('bedRL', val)} step={0.1} />
        <NumInput label="HFL" unit="m MSL" value={v.HFL} onChange={val => s('HFL', val)} step={0.1} />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Live Results — IRC SP-13, IS:7784, Manning, Lacey</p>
        <ResultRow label="Hydraulic Radius R" formula="R = A / P" result={`${N(R)} m`} verdict="INFO" benchmark="Typical plains river: 1.5–3.0 m" />
        <ResultRow label="Design Velocity V (Manning)" formula="V = (1/n)·R^⅔·S₀^½" result={`${N(V_man)} m/s`} verdict={V_man < 3.0 ? 'PASS' : 'WARN'} limit="< 3.0 m/s (soft soil)" benchmark="Kherwara: 1.847 m/s" />
        <ResultRow label="Design Discharge Q" formula="Q = V · A" result={`${N(Q, 2)} m³/s (cumecs)`} verdict="INFO" />
        <ResultRow label="Froude Number Fr" formula="Fr = V / √(g·y)" result={`${N(Fr, 4)}`} verdict={Fr < 1.0 ? 'PASS' : 'FAIL'} limit="< 1.0 (subcritical required)" benchmark="Typical: 0.3–0.7 subcritical" />
        <ResultRow label="Lacey Regime Waterway" formula="L = 4.75·√Q" result={`${N(L_lacey, 2)} m`} verdict="INFO" benchmark="For Q=200 m³/s → L=67.2 m" />
        <ResultRow label="Lacey Scour Depth (mean)" formula="dsm = 1.34·(q²/f)^⅓" result={`${N(dsm, 3)} m`} verdict="INFO" />
        <ResultRow label="Pier Scour (ASTRA 2.0× factor)" formula="D_design = 2.0 × dsm" result={`${N(D_design, 3)} m below bed`} verdict="INFO" benchmark="ASTRA multiplier = 2.0 (conservative)" />
        <ResultRow label="Founding RL" formula="RL_found = bedRL − D_design" result={`RL ${N(foundRL, 3)} m`} verdict="INFO" />
        <ResultRow label="Afflux (Molesworth)" formula="h ≈ V²/(2g) × 0.15" result={`${N(afflux, 3)} m`} verdict={afflux <= 0.6 ? 'PASS' : 'FAIL'} limit="≤ 0.60 m (IS:7784 submersible)" benchmark="IS:7784: 0.60 m limit" />
        <ResultRow label="Design Water Level" formula="DWL = HFL + afflux" result={`${N(DWL, 3)} m MSL`} verdict="INFO" />
      </div>
    </div>
  );
}

// ─── T-BEAM SECTION TAB ──────────────────────────────────────────────────────
function TBeamTab() {
  const [v, setV] = useState({ L: 19.2, B: 12.1, NMG: 4, NCG: 3, CL: 0.975, CR: 0.975, Ds: 250, D: 1800, Bw: 300, Bb: 650, Db: 650, Dw: 75, gamma_c: 24, gamma_w: 22 });
  const s = (k: keyof typeof v, val: number) => setV(p => ({ ...p, [k]: val }));

  const SMG = (v.B - v.CL - v.CR) / Math.max(v.NMG - 1, 1);
  const SCG = v.L / (v.NCG + 1);
  const Ds_m = v.Ds / 1000;
  const Dw_m = v.Dw / 1000;
  const wi_inner = SMG * SCG * (Ds_m * v.gamma_c + Dw_m * v.gamma_w);

  const Bw_m = v.Bw / 1000, Bb_m = v.Bb / 1000, Db_m = v.Db / 1000;
  const D_m = v.D / 1000;
  const flange_w = SMG; // inner flange width approximation
  const h_web = D_m - Ds_m - Db_m;

  // Approximate section properties (3 rectangles: flange top, web, bottom flange)
  const A1 = flange_w * Ds_m,   y1 = D_m - Ds_m / 2;
  const A2 = Bw_m * h_web,      y2 = Db_m + h_web / 2;
  const A3 = Bb_m * Db_m,       y3 = Db_m / 2;
  const Atotal = A1 + A2 + A3;
  const ybar = (A1 * y1 + A2 * y2 + A3 * y3) / Math.max(Atotal, 0.0001);
  const I1 = flange_w * Math.pow(Ds_m, 3) / 12 + A1 * Math.pow(y1 - ybar, 2);
  const I2 = Bw_m * Math.pow(h_web, 3) / 12 + A2 * Math.pow(y2 - ybar, 2);
  const I3 = Bb_m * Math.pow(Db_m, 3) / 12 + A3 * Math.pow(y3 - ybar, 2);
  const Ixx = I1 + I2 + I3;

  const jointLoad = wi_inner * SCG;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Bridge Geometry</p>
        <NumInput label="Effective span L" unit="m" value={v.L} onChange={val => s('L', val)} step={0.5} />
        <NumInput label="Total width B" unit="m" value={v.B} onChange={val => s('B', val)} step={0.5} />
        <NumInput label="No. main girders NMG" unit="" value={v.NMG} onChange={val => s('NMG', val)} step={1} min={2} />
        <NumInput label="No. cross girders NCG" unit="" value={v.NCG} onChange={val => s('NCG', val)} step={1} min={1} />
        <NumInput label="Left cantilever CL" unit="m" value={v.CL} onChange={val => s('CL', val)} step={0.05} />
        <NumInput label="Right cantilever CR" unit="m" value={v.CR} onChange={val => s('CR', val)} step={0.05} />
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mt-4 mb-2">Cross-Section (mm)</p>
        <NumInput label="Deck slab Ds" unit="mm" value={v.Ds} onChange={val => s('Ds', val)} step={25} />
        <NumInput label="Total depth D" unit="mm" value={v.D} onChange={val => s('D', val)} step={50} />
        <NumInput label="Web width Bw" unit="mm" value={v.Bw} onChange={val => s('Bw', val)} step={25} />
        <NumInput label="Bot flange Bb" unit="mm" value={v.Bb} onChange={val => s('Bb', val)} step={25} />
        <NumInput label="Bot flange depth Db" unit="mm" value={v.Db} onChange={val => s('Db', val)} step={25} />
        <NumInput label="Wearing coat Dw" unit="mm" value={v.Dw} onChange={val => s('Dw', val)} step={5} />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Live Results — ASTRA T-Beam WS1 & WS2</p>
        <ResultRow label="Girder Spacing (inner) SMG" formula="SMG = (B − CL − CR) / (NMG − 1)" result={`${N(SMG)} m`} verdict="INFO" benchmark="ASTRA: SMG=2.650 m (L=19.2m, NMG=4)" />
        <ResultRow label="Cross-Girder Panel SCG" formula="SCG = L / (NCG + 1)" result={`${N(SCG)} m`} verdict="INFO" benchmark="ASTRA: SCG=9.600 m (NCG=3 gives 4 panels → 4.8m)" />
        <ResultRow label="Inner UDL (Dead Load)" formula="wi = SMG·SCG·(Ds·γc + Dw·γw)" result={`${N(wi_inner, 4)} T/m (ton/m)`} verdict="INFO" benchmark="ASTRA: 0.5364 T/m (swf=1.4 excluded here)" />
        <ResultRow label="Cross-Girder Joint Load" formula="W_joint = wi · SCG" result={`${N(jointLoad, 4)} Ton`} verdict="INFO" benchmark="ASTRA: 0.4617 Ton" />
        <ResultRow label="Total Gross Area Ax" formula="Ax = ΣAi = A_flange + A_web + A_btm" result={`${N(Atotal, 4)} m²`} verdict="INFO" benchmark="ASTRA: Ax=1.355 m² (inner)" />
        <ResultRow label="Centroid from bottom ȳ" formula="ȳ = ΣAi·yi / ΣAi" result={`${N(ybar, 4)} m from bottom`} verdict="INFO" benchmark="ASTRA: ȳ ≈ 0.732 m (inner girder)" />
        <ResultRow label="Second Moment Ixx" formula="Ixx = Σ[bi·hi³/12 + Ai·(yi−ȳ)²]" result={`${N(Ixx, 4)} m⁴`} verdict="INFO" benchmark="ASTRA: 25.7603 m⁴ (inner girder)" />
        <ResultRow label="Elastic Section Modulus St (top)" formula="St = Ixx / (D − ȳ)" result={`${N(Ixx / Math.max(D_m - ybar, 0.0001), 4)} m³`} verdict="INFO" />
        <ResultRow label="Elastic Section Modulus Sb (bot)" formula="Sb = Ixx / ȳ" result={`${N(Ixx / Math.max(ybar, 0.0001), 4)} m³`} verdict="INFO" />
      </div>
    </div>
  );
}

// ─── SLAB DESIGN TAB ─────────────────────────────────────────────────────────
function SlabDesignTab() {
  const [v, setV] = useState({ span: 3.5, slab_t: 220, cover: 30, fck: 25, fy: 415, DL_kNm: 8.5, LL_kNm: 12.6, phi: 16 });
  const s = (k: keyof typeof v, val: number) => setV(p => ({ ...p, [k]: val }));

  const d_prov = v.slab_t - v.cover - v.phi / 2;
  const Mu = 1.5 * (v.DL_kNm + v.LL_kNm);
  const d_req = Math.sqrt((Mu * 1e6) / (0.138 * v.fck * 1000));
  const xu_lim_d = v.fy <= 415 ? 0.48 : v.fy <= 500 ? 0.46 : 0.44;
  const xu_lim = xu_lim_d * d_prov;
  const Cc = 0.36 * v.fck * 1000 * xu_lim;
  const Cs = 0.87 * v.fy;
  const Ast_req = Cc / Cs;  // simplified (T=C at xu_lim)
  const Ast_prov_16_150 = Math.PI / 4 * v.phi * v.phi * (1000 / 150);
  const Pt_prov = (Ast_prov_16_150 / (1000 * d_prov)) * 100;
  const Pt_min = 0.85 / v.fy * 100;
  const Mu_cap = 0.87 * v.fy * Ast_prov_16_150 * (d_prov - 0.42 * xu_lim) / 1e6;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Section & Materials (IS:456 LSM)</p>
        <NumInput label="Slab total thickness" unit="mm" value={v.slab_t} onChange={val => s('slab_t', val)} step={10} />
        <NumInput label="Clear cover" unit="mm" value={v.cover} onChange={val => s('cover', val)} step={5} />
        <NumInput label="Bar diameter φ" unit="mm" value={v.phi} onChange={val => s('phi', val)} step={2} />
        <NumInput label="fck (concrete grade)" unit="MPa" value={v.fck} onChange={val => s('fck', val)} step={5} min={20} />
        <NumInput label="fy (steel grade)" unit="MPa" value={v.fy} onChange={val => s('fy', val)} step={85} min={250} />
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mt-4 mb-2">Design Moments (unfactored)</p>
        <NumInput label="Dead load moment MDL" unit="kN·m" value={v.DL_kNm} onChange={val => s('DL_kNm', val)} step={0.5} />
        <NumInput label="Live load moment MLL" unit="kN·m" value={v.LL_kNm} onChange={val => s('LL_kNm', val)} step={0.5} />
        <NumInput label="Effective span" unit="m" value={v.span} onChange={val => s('span', val)} step={0.1} />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Live Results — IS:456-2000 + IRC:112 LSM</p>
        <ResultRow label="Effective Depth Provided" formula="d_prov = t − cover − φ/2" result={`${N(d_prov, 0)} mm`} verdict="INFO" />
        <ResultRow label="Factored Design Moment Mu" formula="Mu = 1.5 × (MDL + MLL)" result={`${N(Mu, 2)} kN·m`} verdict="INFO" />
        <ResultRow label="Required Effective Depth" formula="d_req = √(Mu×10⁶ / 0.138·fck·b)" result={`${N(d_req, 1)} mm`} verdict={d_prov >= d_req ? 'PASS' : 'FAIL'} limit={`d_prov = ${N(d_prov, 0)} mm`} benchmark="IS:456 Cl.G-1.1(c): Mu_lim=0.138·fck·b·d²" />
        <ResultRow label="Neutral Axis Limit xu_lim/d" formula="Fe415→0.48,  Fe500→0.46" result={`${N(xu_lim_d, 2)}  →  xu_lim = ${N(xu_lim, 0)} mm`} verdict="INFO" />
        <ResultRow label="Required Flexural Steel Ast" formula="T = C at xu_lim → Ast = 0.36·fck·b·xu/(0.87·fy)" result={`${N(Ast_req, 0)} mm²/m`} verdict="INFO" />
        <ResultRow label="Provided Ast (φ16 @ 150 mm c/c)" formula="Ast_prov = π/4·φ²·(1000/s)" result={`${N(Ast_prov_16_150, 0)} mm²/m`} verdict={Ast_prov_16_150 >= Ast_req ? 'PASS' : 'FAIL'} limit={`≥ ${N(Ast_req, 0)} mm²/m req.`} />
        <ResultRow label="Percentage Steel Pt" formula="Pt = Ast / (b·d) × 100" result={`${N(Pt_prov, 3)} %`} verdict={Pt_prov >= Pt_min ? 'PASS' : 'FAIL'} limit={`≥ Pt_min = 0.85/fy×100 = ${N(Pt_min, 3)}%`} />
        <ResultRow label="Moment Capacity Mu_cap" formula="Mu = 0.87·fy·Ast·(d − 0.42·xu_lim)" result={`${N(Mu_cap, 2)} kN·m`} verdict={Mu_cap >= Mu ? 'PASS' : 'FAIL'} limit={`≥ Mu = ${N(Mu, 2)} kN·m`} />
      </div>
    </div>
  );
}

// ─── STABILITY TAB ───────────────────────────────────────────────────────────
function StabilityTab() {
  const [v, setV] = useState({ H: 6.0, gamma_s: 18, phi_deg: 30, delta_deg: 20, alpha_deg: 90, B: 3.6, mu: 0.55, W_stem: 85.2, W_ftg: 62.4, Pa_offset: 0, surcharge_q: 0, SBC: 200 });
  const s = (k: keyof typeof v, val: number) => setV(p => ({ ...p, [k]: val }));

  const phi = v.phi_deg * Math.PI / 180;
  const delta = v.delta_deg * Math.PI / 180;
  const alpha = v.alpha_deg * Math.PI / 180;

  // Coulomb Ka
  const sin_aphiphi = Math.sin(alpha + phi);
  const sin_alphaminusdelta = Math.sin(alpha - delta);
  const sin_phiplusdelta = Math.sin(phi + delta);
  const sin_alpha_sq = Math.sin(alpha) ** 2;
  const A_coulomb = sin_phiplusdelta * v.H / Math.max(sin_alphaminusdelta * 1, 0.0001);
  const sqrtTerm = Math.sqrt(sin_phiplusdelta / Math.max(sin_alphaminusdelta, 0.0001));
  const denom = sin_alpha_sq * sin_alphaminusdelta * (1 + sqrtTerm) ** 2;
  const Ka = Math.max(0, sin_aphiphi ** 2 / Math.max(denom, 0.0001));

  const Pa = 0.5 * Ka * v.gamma_s * v.H * v.H;
  const Pa_h = Pa * Math.cos(delta);
  const Pa_v = Pa * Math.sin(delta);
  const surcharge_Pa = Ka * v.surcharge_q * v.H;

  const ΣW = v.W_stem + v.W_ftg + Pa_v;
  const FOS_slide = (v.mu * ΣW) / Math.max(Pa_h + surcharge_Pa, 0.0001);

  // Overturning (Pa acts at H/3)
  const M_overturn = Pa_h * v.H / 3 + surcharge_Pa * v.H / 2;
  const x_stem = v.B * 0.55; // approx centroid of stem + footing weight
  const M_resist = ΣW * x_stem;
  const FOS_overturn = M_resist / Math.max(M_overturn, 0.0001);

  const e = v.B / 2 - (M_resist - M_overturn) / Math.max(ΣW, 0.0001);
  const q_max = ΣW / v.B * (1 + 6 * Math.abs(e) / v.B);
  const q_min = ΣW / v.B * (1 - 6 * Math.abs(e) / v.B);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Abutment / Retaining Wall</p>
        <NumInput label="Wall height H" unit="m" value={v.H} onChange={val => s('H', val)} step={0.5} />
        <NumInput label="Base width B" unit="m" value={v.B} onChange={val => s('B', val)} step={0.1} />
        <NumInput label="Soil friction angle φ" unit="°" value={v.phi_deg} onChange={val => s('phi_deg', val)} step={1} />
        <NumInput label="Wall friction angle δ" unit="°" value={v.delta_deg} onChange={val => s('delta_deg', val)} step={1} />
        <NumInput label="Back-face inclination α" unit="°" value={v.alpha_deg} onChange={val => s('alpha_deg', val)} step={5} />
        <NumInput label="Backfill unit weight γs" unit="kN/m³" value={v.gamma_s} onChange={val => s('gamma_s', val)} step={1} />
        <NumInput label="Friction coeff μ (base)" unit="" value={v.mu} onChange={val => s('mu', val)} step={0.05} />
        <NumInput label="Wall self-weight W_stem" unit="kN/m" value={v.W_stem} onChange={val => s('W_stem', val)} step={5} />
        <NumInput label="Footing self-weight W_ftg" unit="kN/m" value={v.W_ftg} onChange={val => s('W_ftg', val)} step={5} />
        <NumInput label="Surcharge q" unit="kN/m²" value={v.surcharge_q} onChange={val => s('surcharge_q', val)} step={5} />
        <NumInput label="Safe Bearing Capacity SBC" unit="kN/m²" value={v.SBC} onChange={val => s('SBC', val)} step={10} />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Live Results — IRC:78, Coulomb, IS:456</p>
        <ResultRow label="Coulomb Ka" formula="Ka = sin²(α+φ) / [sin²α·sin(α−δ)·(1+√(...))²]" result={`Ka = ${N(Ka, 4)}`} verdict="INFO" benchmark="For φ=30°, δ=20°, α=90°: Ka≈0.297" />
        <ResultRow label="Active Earth Thrust Pa" formula="Pa = ½·Ka·γs·H²" result={`${N(Pa, 2)} kN/m`} verdict="INFO" />
        <ResultRow label="Pa horizontal component" formula="Pa_h = Pa·cos(δ)" result={`${N(Pa_h, 2)} kN/m`} verdict="INFO" />
        <ResultRow label="Surcharge earth pressure" formula="ΔPa = Ka·q·H" result={`${N(surcharge_Pa, 2)} kN/m`} verdict="INFO" />
        <ResultRow label="FOS Sliding" formula="FOS = μ·ΣW / (Pa_h + ΔPa_q)" result={`${N(FOS_slide, 3)}`} verdict={FOS_slide >= 1.5 ? 'PASS' : FOS_slide >= 1.3 ? 'WARN' : 'FAIL'} limit="≥ 1.50 (IRC:78 Cl.706)" benchmark="Typical abutment: FOS 1.6–2.2" />
        <ResultRow label="FOS Overturning" formula="FOS = ΣM_restoring / ΣM_overturn" result={`${N(FOS_overturn, 3)}`} verdict={FOS_overturn >= 2.0 ? 'PASS' : FOS_overturn >= 1.7 ? 'WARN' : 'FAIL'} limit="≥ 2.0 (IRC:78)" />
        <ResultRow label="Eccentricity e" formula="e = B/2 − (M_resist−M_overturn)/ΣW" result={`${N(Math.abs(e), 3)} m`} verdict={Math.abs(e) <= v.B / 6 ? 'PASS' : 'FAIL'} limit={`≤ B/6 = ${N(v.B / 6, 3)} m (no tension)`} />
        <ResultRow label="Max Base Pressure q_max" formula="q_max = ΣW/B·(1 + 6e/B)" result={`${N(q_max, 2)} kN/m²`} verdict={q_max <= v.SBC ? 'PASS' : 'FAIL'} limit={`≤ SBC = ${v.SBC} kN/m²`} />
        <ResultRow label="Min Base Pressure q_min" formula="q_min = ΣW/B·(1 − 6e/B)" result={`${N(q_min, 2)} kN/m²`} verdict={q_min >= 0 ? 'PASS' : 'WARN'} limit="≥ 0 (no uplift at toe)" />
      </div>
    </div>
  );
}

// ─── SEISMIC TAB ─────────────────────────────────────────────────────────────
function SeismicTab() {
  const [v, setV] = useState({ zone: 3, I: 1.5, R: 2.5, Sa_g: 2.5, W: 5000, pier_H: 8.0, pier_D: 1.5, fck: 30, kh: 0, kv: 0, phi_deg: 30, gamma_s: 18, H_abut: 6 });
  const s = (k: keyof typeof v, val: number) => setV(p => ({ ...p, [k]: val }));

  const Z_map: Record<number, number> = { 2: 0.10, 3: 0.16, 4: 0.24, 5: 0.36 };
  const Z = Z_map[v.zone] ?? 0.16;
  const Ah = (Z / 2) * (v.Sa_g) * (v.I / v.R);
  const FH = Ah * v.W;

  // Pier stiffness (cantilever approximation)
  const Ec = 5000 * Math.sqrt(v.fck);  // MPa
  const I_pier = Math.PI / 64 * Math.pow(v.pier_D, 4);  // m⁴
  const K_pier = 3 * Ec * 1000 * I_pier / Math.pow(v.pier_H, 3);  // kN/m
  const M_pier = v.W / 9.81;  // tonne approx
  const T = 2 * Math.PI * Math.sqrt((M_pier) / Math.max(K_pier * 1000, 1));

  // Mononobe-Okabe
  const kh_eff = v.kh || Ah;
  const theta = Math.atan(kh_eff / Math.max(1 - v.kv, 0.001));
  const phi = v.phi_deg * Math.PI / 180;
  const KAE_num = Math.pow(Math.cos(phi - theta - 0), 2);
  const KAE_denom_inner = Math.sqrt(Math.sin(phi + phi * 0.667) * Math.sin(phi - theta) / Math.max(Math.cos(theta), 0.001));
  const KAE = KAE_num / (Math.cos(theta) * Math.pow(1 + KAE_denom_inner, 2));
  const Ka_static = Math.pow(Math.tan(Math.PI / 4 - phi / 2), 2);  // Rankine for comparison
  const delta_Pa = 0.5 * v.gamma_s * v.H_abut * v.H_abut * (KAE - Ka_static);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Seismic Parameters (IRC:6 Cl.219)</p>
        <div>
          <label className="block text-[10px] font-semibold text-app-muted uppercase tracking-wide mb-1">Seismic Zone</label>
          <select value={v.zone} onChange={e => s('zone', parseInt(e.target.value))}
            className="w-full rounded-md border border-[var(--app-glass-border)] bg-app-card/50 px-2.5 py-1.5 text-sm text-app-fg focus:outline-none">
            <option value={2}>Zone II — Z=0.10 (Low)</option>
            <option value={3}>Zone III — Z=0.16 (Moderate)</option>
            <option value={4}>Zone IV — Z=0.24 (Severe)</option>
            <option value={5}>Zone V — Z=0.36 (Very Severe)</option>
          </select>
        </div>
        <NumInput label="Importance Factor I" unit="" value={v.I} onChange={val => s('I', val)} step={0.25} />
        <NumInput label="Response Reduction R" unit="" value={v.R} onChange={val => s('R', val)} step={0.5} />
        <NumInput label="Sa/g (spectral accel.)" unit="" value={v.Sa_g} onChange={val => s('Sa_g', val)} step={0.25} />
        <NumInput label="Seismic weight W" unit="kN" value={v.W} onChange={val => s('W', val)} step={100} />
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mt-4 mb-2">Pier Stiffness</p>
        <NumInput label="Pier height H" unit="m" value={v.pier_H} onChange={val => s('pier_H', val)} step={0.5} />
        <NumInput label="Pier diameter D" unit="m" value={v.pier_D} onChange={val => s('pier_D', val)} step={0.1} />
        <NumInput label="fck (pier concrete)" unit="MPa" value={v.fck} onChange={val => s('fck', val)} step={5} />
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mt-4 mb-2">Mononobe-Okabe (Abutment)</p>
        <NumInput label="Backfill φ" unit="°" value={v.phi_deg} onChange={val => s('phi_deg', val)} step={1} />
        <NumInput label="γs backfill" unit="kN/m³" value={v.gamma_s} onChange={val => s('gamma_s', val)} step={1} />
        <NumInput label="Abutment height H" unit="m" value={v.H_abut} onChange={val => s('H_abut', val)} step={0.5} />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-app-muted uppercase tracking-wide mb-2">Live Results — IRC:6-2016 Cl.219, IS:1893-2016</p>
        <ResultRow label="Zone Factor Z" formula="Zone II=0.10, III=0.16, IV=0.24, V=0.36" result={`Z = ${Z}`} verdict="INFO" benchmark="ASTRA pier file: Zone III → Z=0.24 (old code). IRC:6-2016 uses Z=0.16 for Zone III" />
        <ResultRow label="Design Horizontal Ah" formula="Ah = Z/2 × Sa/g × I/R" result={`Ah = ${N(Ah, 4)}`} verdict={Ah <= 0.3 ? 'PASS' : 'WARN'} limit="IRC:6: max 0.36 Zone V" benchmark="ASTRA: Ah=0.09 (Zone III, I=1.5, R=2.5, Sa/g=2.5)" />
        <ResultRow label="Horizontal Seismic Force FH" formula="FH = Ah × W" result={`${N(FH, 1)} kN`} verdict="INFO" />
        <ResultRow label="Pier Ec (concrete modulus)" formula="Ec = 5000·√fck  (IS:456 Cl.6.2.3.1)" result={`${N(Ec, 0)} MPa`} verdict="INFO" />
        <ResultRow label="Pier Second Moment I" formula="I = π/64 × D⁴" result={`${N(I_pier, 4)} m⁴`} verdict="INFO" />
        <ResultRow label="Pier Stiffness K (cantilever)" formula="K = 3·Ec·I / H³" result={`${N(K_pier, 0)} kN/m`} verdict="INFO" />
        <ResultRow label="Fundamental Period T" formula="T = 2π·√(M/K)  [Rayleigh]" result={`${N(T, 3)} s`} verdict="INFO" benchmark="Rigid piers T < 0.1s → Sa/g = 2.5 (plateau)" />
        <ResultRow label="Mononobe-Okabe KAE" formula="KAE via seismic active wedge (θ=arctan(kh/(1-kv)))" result={`KAE = ${N(KAE, 4)}`} verdict="INFO" />
        <ResultRow label="Seismic Earth Pressure Increment ΔPa" formula="ΔPa = ½·γs·H²·(KAE − Ka)  @0.6H" result={`${N(delta_Pa, 2)} kN/m  (acts at 0.6H)`} verdict="INFO" benchmark="IS:1893: seismic increment acts at 0.6H from base" />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type Tab = 'hydraulics' | 'tbeam' | 'slab' | 'stability' | 'seismic';

const TABS: { id: Tab; label: string; icon: typeof Calculator; color: string }[] = [
  { id: 'hydraulics', label: 'Hydraulics',     icon: Waves,      color: 'text-cyan-400' },
  { id: 'tbeam',      label: 'T-Beam Section', icon: GitBranch,  color: 'text-blue-400' },
  { id: 'slab',       label: 'Slab Design',    icon: Calculator, color: 'text-emerald-400' },
  { id: 'stability',  label: 'Stability',      icon: Shield,     color: 'text-amber-400' },
  { id: 'seismic',    label: 'Seismic',        icon: Zap,        color: 'text-orange-400' },
];

export default function FormulaEvaluator() {
  const [tab, setTab] = useState<Tab>('hydraulics');

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 space-y-6">

      {/* Header */}
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Calculator className="h-6 w-6 text-app-accent" />
          <h1 className="text-2xl font-bold text-app-fg">Live Formula Evaluator</h1>
        </div>
        <p className="text-sm text-app-muted max-w-2xl mx-auto">
          Type your project values → every IRC/IS formula recomputes instantly with pass/fail verdicts.
          Sourced from <strong className="text-app-fg">ASTRA 15 TUTORIALS</strong> — Manning · Lacey · Coulomb · IS:456 · IRC:6 Cl.219.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-app-muted">
          {['IRC SP-13', 'IRC:6-2016 Cl.219', 'IRC:78-2014', 'IS:456-2000', 'IS:1893-2016', 'IS:7784', 'ASTRA 15'].map(s => (
            <span key={s} className="rounded-full border border-[var(--app-glass-border)] px-2 py-0.5">{s}</span>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 p-1 bg-app-card/20 rounded-xl w-full border border-white/5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-fit inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-app-accent text-white shadow-lg shadow-app-accent/25 scale-[1.01]' : 'text-app-muted hover:text-app-fg hover:bg-white/5'
            }`}>
            <t.icon className={`h-4 w-4 ${tab === t.id ? 'text-white' : t.color}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/40 p-5">
        {tab === 'hydraulics'  && <HydraulicsTab />}
        {tab === 'tbeam'       && <TBeamTab />}
        {tab === 'slab'        && <SlabDesignTab />}
        {tab === 'stability'   && <StabilityTab />}
        {tab === 'seismic'     && <SeismicTab />}
      </div>

      {/* ASTRA Library link */}
      <div className="flex items-center justify-center gap-4">
        <Link href="/astra-library">
          <a className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition">
            <BookOpen className="h-4 w-4" /> Open Full ASTRA Library (32 modules)
          </a>
        </Link>
        <Link href="/report">
          <a className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-400 hover:bg-purple-500/20 transition">
            <CheckCircle2 className="h-4 w-4" /> Narrative Report
          </a>
        </Link>
      </div>
    </div>
  );
}
