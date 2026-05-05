/**
 * Abutment Stability Calculator
 * ASTRA 15 reference: DESIGN/Abutment/Abutment Worksheet Design 1 & 2
 * Codes: IRC:6-2016, IRC:78-2014, IS:456-2000
 * Methods: Coulomb active pressure, Mononobe-Okabe seismic increment,
 *          Sliding / Overturning / Bearing stability checks
 */
import { useState, useMemo, useCallback } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft, BookOpen, CheckCircle2, XCircle, Info,
  Download, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Inputs {
  // Geometry (mm)
  H_stem: number;   // stem height above footing top
  D_f: number;      // footing thickness
  B_toe: number;    // toe projection (front)
  t_stem: number;   // stem thickness (base)
  B_heel: number;   // heel projection (back)

  // Backfill
  phi_deg: number;  // internal friction angle (degrees)
  gamma_s: number;  // unit weight of soil (kN/m³)
  delta_frac: number; // wall friction = delta_frac × phi  (e.g. 0.667)
  beta_deg: number; // backfill slope angle (degrees, 0 = horizontal)

  // Material
  gamma_c: number;  // unit weight of concrete (kN/m³)
  mu: number;       // friction coefficient at base

  // Superstructure
  R_DL: number;     // DL reaction per bearing line (kN/m)
  R_LL: number;     // LL reaction per bearing line (kN/m)
  bearing_offset: number; // bearing CL from front face of stem (mm)

  // Foundation
  SBC: number;      // safe bearing capacity (kN/m²)
  D_passive: number; // depth of passive soil in front (= D_f usually, kN/m²)

  // Seismic
  seismic: boolean;
  kh: number;       // horizontal seismic coefficient (= Ah from IRC:6 Cl.219)
  kv: number;       // vertical seismic coefficient (= kh/2)
}

interface Forces {
  // Weights (kN/m)
  W_stem: number; W_footing: number; W_backfill: number; W_super: number;
  W_total: number;
  // CG x from toe (m)
  xW_stem: number; xW_footing: number; xW_backfill: number; xW_super: number;
  // Earth pressure
  Ka: number; Kp: number;
  Pa: number; Pa_h: number; Pa_v: number;
  Pp: number;
  H_ep: number; // height of PA application from footing bottom (m)
  // Seismic increment (Mononobe-Okabe)
  KAE: number; dPa_h: number; dPa_v: number;
  // Moments about toe (kN·m/m) — positive = restoring
  M_restoring: number; M_overturning: number;
  // Resultant
  x_bar: number; // resultant CG from toe (m)
  B: number;     // footing width (m)
  e: number;     // eccentricity (m)
  // Bearing (kN/m²)
  sigma_max: number; sigma_min: number;
  // FOS
  FOS_sliding: number; FOS_overturning: number;
  // Checks
  slide_ok: boolean; overturn_ok: boolean; bearing_ok: boolean; no_tension: boolean;
}

// ─── Calculation engine ───────────────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }

function calcCoulombKa(phi: number, alpha: number, delta: number, beta: number): number {
  // Coulomb active pressure coefficient
  // phi, alpha, delta, beta all in radians
  const num = Math.sin(alpha + phi) ** 2;
  const A = Math.sin(phi + delta) * Math.sin(phi - beta);
  const B2 = Math.sin(alpha - delta) * Math.sin(alpha + beta);
  const sq = Math.sqrt(Math.max(A / B2, 0));
  const denom = Math.sin(alpha) ** 2 * Math.sin(alpha - delta) * (1 + sq) ** 2;
  if (denom === 0) return 0.33;
  return num / denom;
}

function calcCoulombKp(phi: number, alpha: number, delta: number, beta: number): number {
  // Coulomb passive pressure coefficient (β=0, δ=φ/3 for passive)
  const phi_p = phi, delta_p = phi / 3;
  const num = Math.sin(alpha - phi_p) ** 2;
  const A = Math.sin(phi_p + delta_p) * Math.sin(phi_p + beta);
  const B2 = Math.sin(alpha + delta_p) * Math.sin(alpha + beta);
  const sq = Math.sqrt(Math.max(A / B2, 0));
  const denom = Math.sin(alpha) ** 2 * Math.sin(alpha + delta_p) * (1 - sq) ** 2;
  if (denom === 0) return 3.0;
  return num / denom;
}

function calcMononobeOkabe(phi: number, delta: number, beta: number, kh: number, kv: number, H: number, gamma_s: number): {
  KAE: number; dPa_h: number; dPa_v: number;
} {
  const theta = Math.atan(kh / (1 - kv));
  const alpha = Math.PI / 2;
  const num = Math.cos(phi - theta - alpha) ** 2;
  const A = Math.sin(phi + delta) * Math.sin(phi - beta - theta);
  const B2 = Math.cos(alpha - delta) * Math.cos(alpha + beta + theta); // corrected
  const sq = Math.sqrt(Math.max(A / Math.max(B2, 1e-9), 0));
  const denom = Math.cos(theta) * Math.cos(alpha) ** 2 * Math.cos(delta + alpha + theta) * (1 + sq) ** 2;
  const KAE = denom === 0 ? 0.5 : num / denom;

  const Ka_static = calcCoulombKa(phi, alpha, delta, beta);
  const dPAE = 0.5 * gamma_s * H ** 2 * (KAE - Ka_static);
  return {
    KAE,
    dPa_h: Math.max(dPAE * Math.cos(delta), 0),
    dPa_v: Math.max(dPAE * Math.sin(delta), 0),
  };
}

function compute(inp: Inputs): Forces {
  const {
    H_stem, D_f, B_toe, t_stem, B_heel,
    phi_deg, gamma_s, delta_frac, beta_deg,
    gamma_c, mu,
    R_DL, R_LL, bearing_offset,
    SBC, D_passive,
    seismic, kh, kv,
  } = inp;

  const B = (B_toe + t_stem + B_heel) / 1000; // m
  const H_total = (H_stem + D_f) / 1000;       // m total height
  const Hs = H_stem / 1000;                    // stem height (m)
  const Df = D_f / 1000;                       // footing depth (m)
  const toe = B_toe / 1000;
  const ts  = t_stem / 1000;
  const heel = B_heel / 1000;
  const boff = bearing_offset / 1000;          // m from front of stem

  const phi  = toRad(phi_deg);
  const delta = toRad(delta_frac * phi_deg);
  const beta  = toRad(beta_deg);
  const alpha = Math.PI / 2; // vertical wall

  // ── Earth pressure coefficients ──
  const Ka = calcCoulombKa(phi, alpha, delta, beta);
  const Kp = calcCoulombKp(phi, alpha, delta, beta);

  // Active pressure resultant
  const Pa = 0.5 * gamma_s * H_total ** 2 * Ka;
  const Pa_h = Pa * Math.cos(delta);
  const Pa_v = Pa * Math.sin(delta);
  const H_ep = H_total / 3; // application height from footing bottom

  // Passive (front of footing, depth = D_f)
  const Pp_resist = 0.5 * gamma_s * (D_passive / 1000) ** 2 * Kp * 0.5; // 50% passive only

  // ── Weights (kN/m) and x from toe ──
  const W_stem     = gamma_c * ts * Hs;
  const xW_stem    = toe + ts / 2;

  const W_footing  = gamma_c * B * Df;
  const xW_footing = B / 2;

  const W_backfill = gamma_s * heel * Hs;
  const xW_backfill = B - heel / 2;

  const W_super = R_DL + R_LL;
  const xW_super = toe + boff; // bearing CL from toe

  const W_total = W_stem + W_footing + W_backfill + W_super;

  // ── Seismic increment ──
  let dPa_h = 0, dPa_v = 0, KAE = Ka;
  if (seismic && kh > 0) {
    const mo = calcMononobeOkabe(phi, delta, beta, kh, kv, H_total, gamma_s);
    KAE = mo.KAE; dPa_h = mo.dPa_h; dPa_v = mo.dPa_v;
  }

  // ── Moments about toe (base of footing) ──
  const M_W_stem     = W_stem     * xW_stem;
  const M_W_footing  = W_footing  * xW_footing;
  const M_W_backfill = W_backfill * xW_backfill;
  const M_W_super    = W_super    * xW_super;
  const M_Pa_v       = Pa_v       * B;       // vertical component acts at heel
  const M_dPa_v      = dPa_v      * B;

  const M_restoring  = M_W_stem + M_W_footing + M_W_backfill + M_W_super + M_Pa_v + M_dPa_v;

  const M_Pa_h       = Pa_h       * H_ep;
  const M_dPa_h      = dPa_h      * (2 * H_ep); // seismic acts at 0.6H
  const M_overturning = M_Pa_h + M_dPa_h;

  // ── Resultant and eccentricity ──
  const W_net       = W_total + Pa_v + dPa_v;
  const x_bar       = (M_restoring - M_overturning) / W_net;
  const e           = Math.abs(B / 2 - x_bar);

  // ── Bearing pressures ──
  const sigma_max = (W_net / B) * (1 + (6 * e) / B);
  const sigma_min = (W_net / B) * (1 - (6 * e) / B);

  // ── FOS ──
  const H_resist    = mu * W_net + Pp_resist;
  const H_drive     = Pa_h + dPa_h;
  const FOS_sliding = H_drive > 0 ? H_resist / H_drive : 99;
  const FOS_overturning = M_overturning > 0 ? M_restoring / M_overturning : 99;

  return {
    W_stem, W_footing, W_backfill, W_super, W_total,
    xW_stem, xW_footing, xW_backfill, xW_super,
    Ka, Kp, Pa, Pa_h, Pa_v, Pp: Pp_resist, H_ep,
    KAE, dPa_h, dPa_v,
    M_restoring, M_overturning,
    x_bar, B, e,
    sigma_max, sigma_min,
    FOS_sliding, FOS_overturning,
    slide_ok:     FOS_sliding    >= 1.50,
    overturn_ok:  FOS_overturning >= 2.00,
    bearing_ok:   sigma_max      <= SBC,
    no_tension:   sigma_min      >= 0,
  };
}

// ─── SVG Cross-section ────────────────────────────────────────────────────────
function AbutmentSVG({ inp, forces }: { inp: Inputs; forces: Forces }) {
  const SVG_W = 480, SVG_H = 380;
  const PAD = { l: 60, r: 40, t: 20, b: 60 };

  const { B_toe, t_stem, B_heel, H_stem, D_f } = inp;
  const totW = B_toe + t_stem + B_heel;
  const totH = H_stem + D_f;

  const scaleX = (SVG_W - PAD.l - PAD.r) / (totW * 1.3);
  const scaleY = (SVG_H - PAD.t - PAD.b) / (totH * 1.05);

  const ox = PAD.l + 0;
  const oy = SVG_H - PAD.b; // footing bottom y

  const sx = (mm: number) => mm * scaleX;
  const sy = (mm: number) => mm * scaleY;

  // Key x-coordinates
  const x0 = ox;                                   // toe (front)
  const x1 = ox + sx(B_toe);                       // front of stem
  const x2 = ox + sx(B_toe + t_stem);              // back of stem
  const x3 = ox + sx(totW);                        // back of heel

  // Key y-coordinates
  const y0 = oy;                                   // footing bottom
  const y1 = oy - sy(D_f);                         // footing top / stem base
  const y2 = oy - sy(D_f + H_stem);               // stem top (bearing seat)

  // Bearing CL
  const xBearing = ox + sx(B_toe + inp.bearing_offset);

  // Arrow helpers
  function arrowH(x1v: number, y: number, len: number, dir: 'L'|'R', col: string, label?: string) {
    const x2v = dir === 'R' ? x1v + len : x1v - len;
    const mx = dir === 'R' ? x2v - 6 : x2v + 6;
    return (
      <g>
        <line x1={x1v} y1={y} x2={x2v} y2={y} stroke={col} strokeWidth="1.5" markerEnd={`url(#arr_${col.replace('#','')})`} />
        {label && <text x={dir === 'R' ? x2v + 4 : x2v - 4} y={y + 4} fontSize="8" fill={col}
          textAnchor={dir === 'R' ? 'start' : 'end'}>{label}</text>}
      </g>
    );
  }

  // Hatching for backfill
  const hatchLines: React.ReactNode[] = [];
  const hatchStep = 12;
  for (let i = 0; i < 12; i++) {
    const hx = x2 + i * hatchStep;
    if (hx > x3) break;
    hatchLines.push(<line key={i} x1={hx} y1={y1} x2={hx - hatchStep * 0.7} y2={y1 - sy(H_stem)}
      stroke="#78716c" strokeWidth="0.8" opacity="0.5" />);
  }

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto" aria-label="Abutment cross-section">
      <defs>
        <marker id="arr_3b82f6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" />
        </marker>
        <marker id="arr_ef4444" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
        </marker>
        <marker id="arr_22c55e" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#22c55e" />
        </marker>
        <marker id="arr_f59e0b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Ground level line */}
      <line x1={ox - 20} y1={y0} x2={SVG_W - 20} y2={y0} stroke="#6b7280" strokeWidth="0.8" strokeDasharray="4,3" />
      <text x={ox - 22} y={y0 + 4} fontSize="8" fill="#6b7280" textAnchor="end">GL</text>

      {/* Footing */}
      <rect x={x0} y={y1} width={sx(totW)} height={sy(D_f)}
        fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={(x0 + x3) / 2} y={(y0 + y1) / 2 + 4} fontSize="8" textAnchor="middle" fill="#93c5fd">Footing</text>

      {/* Stem */}
      <rect x={x1} y={y2} width={sx(t_stem)} height={sy(H_stem)}
        fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="1.5" />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4} fontSize="8" textAnchor="middle" fill="#93c5fd">Stem</text>

      {/* Backfill hatching */}
      <rect x={x2} y={y2} width={sx(B_heel)} height={sy(H_stem)}
        fill="rgba(120,113,108,0.12)" stroke="none" />
      {hatchLines}
      <text x={(x2 + x3) / 2} y={(y1 + y2) / 2 + 4} fontSize="8" textAnchor="middle" fill="#78716c">Fill</text>

      {/* Earth pressure arrow (horizontal) */}
      {(() => {
        const yEP = y1 - sy(inp.H_stem / 3); // H/3 from base
        return (
          <g>
            <line x1={x3 + 6} y1={y1} x2={x3 + 6} y2={y2}
              stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
            <polygon points={`${x3 + 6},${y1} ${x3 + 18},${y1} ${x3 + 6},${y2}`}
              fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth="0.8" />
            <line x1={x3 + 22} y1={yEP} x2={x2} y2={yEP}
              stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arr_f59e0b)" />
            <text x={x3 + 28} y={yEP + 4} fontSize="8" fill="#fbbf24">Pa={forces.Pa.toFixed(0)} kN/m</text>
          </g>
        );
      })()}

      {/* Superstructure reaction arrow */}
      <line x1={xBearing} y1={y2 - 28} x2={xBearing} y2={y2}
        stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arr_22c55e)" />
      <text x={xBearing} y={y2 - 32} fontSize="8" textAnchor="middle" fill="#22c55e">
        R={forces.W_super.toFixed(0)} kN/m
      </text>

      {/* Weight arrow (resultant) */}
      <line x1={(x0 + x3) / 2} y1={y0 + 22} x2={(x0 + x3) / 2} y2={y0 + 8}
        stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arr_3b82f6)" />
      <text x={(x0 + x3) / 2} y={y0 + 36} fontSize="8" textAnchor="middle" fill="#60a5fa">
        σmax={forces.sigma_max.toFixed(0)} kPa
      </text>
      <text x={(x0 + x3) / 2} y={y0 + 47} fontSize="8" textAnchor="middle" fill="#60a5fa">
        σmin={forces.sigma_min.toFixed(0)} kPa
      </text>

      {/* Dimension lines */}
      {/* B_toe */}
      <line x1={x0} y1={y0 + 14} x2={x1} y2={y0 + 14} stroke="#6b7280" strokeWidth="0.8" markerEnd="url(#arr_6b7280)" />
      <text x={(x0 + x1) / 2} y={y0 + 24} fontSize="7" textAnchor="middle" fill="#6b7280">Toe={inp.B_toe}</text>

      {/* t_stem */}
      <line x1={x1} y1={y2 - 10} x2={x2} y2={y2 - 10} stroke="#6b7280" strokeWidth="0.8" />
      <text x={(x1 + x2) / 2} y={y2 - 14} fontSize="7" textAnchor="middle" fill="#6b7280">t={inp.t_stem}</text>

      {/* Height */}
      <line x1={x0 - 14} y1={y1} x2={x0 - 14} y2={y2} stroke="#6b7280" strokeWidth="0.8" />
      <text x={x0 - 20} y={(y1 + y2) / 2 + 4} fontSize="7" textAnchor="middle" fill="#6b7280"
        transform={`rotate(-90, ${x0 - 20}, ${(y1 + y2) / 2})`}>H={inp.H_stem}mm</text>

      {/* x_bar (resultant position) */}
      {(() => {
        const xbar_svg = ox + sx(forces.x_bar * 1000);
        return (
          <g>
            <line x1={xbar_svg} y1={y0 - 4} x2={xbar_svg} y2={y0 + 4} stroke="#a855f7" strokeWidth="2" />
            <text x={xbar_svg} y={y0 - 8} fontSize="7" textAnchor="middle" fill="#a855f7">R̄</text>
          </g>
        );
      })()}

      {/* B total label */}
      <line x1={x0} y1={y0 + 56} x2={x3} y2={y0 + 56} stroke="#6b7280" strokeWidth="0.8" />
      <text x={(x0 + x3) / 2} y={y0 + 68} fontSize="8" textAnchor="middle" fill="#6b7280">
        B = {(forces.B * 1000).toFixed(0)} mm
      </text>
    </svg>
  );
}

// ─── Reusable input field ─────────────────────────────────────────────────────
function Field({
  label, unit, value, min, max, step = 1,
  onChange, tooltip,
}: {
  label: string; unit?: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-app-muted">
        {label}
        {tooltip && <span title={tooltip}><Info className="h-3 w-3 text-app-muted/50 cursor-help" /></span>}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-2.5 py-1.5 text-sm text-app-fg focus:border-app-accent focus:outline-none"
        />
        {unit && <span className="shrink-0 text-[10px] text-app-muted w-8">{unit}</span>}
      </div>
    </div>
  );
}

// ─── FOS card ─────────────────────────────────────────────────────────────────
function FOSCard({
  label, fos, limit, ok, limitLabel,
}: { label: string; fos: number; limit: number; ok: boolean; limitLabel: string }) {
  const pct = Math.min((fos / (limit * 2)) * 100, 100);
  return (
    <div className={`rounded-xl border p-4 ${ok ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-red-500/30 bg-red-500/10'}`}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-app-muted">{label}</span>
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
      </div>
      <p className={`text-2xl font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{fos.toFixed(2)}</p>
      <p className="text-[10px] text-app-muted">Req. ≥ {limit} ({limitLabel})</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-glass-border)]">
        <div className={`h-full rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS: Inputs = {
  H_stem: 6000, D_f: 1000,
  B_toe: 600, t_stem: 800, B_heel: 2400,
  phi_deg: 30, gamma_s: 18, delta_frac: 0.667, beta_deg: 0,
  gamma_c: 24, mu: 0.5,
  R_DL: 480, R_LL: 92, bearing_offset: 300,
  SBC: 200, D_passive: 1000,
  seismic: false, kh: 0.09, kv: 0.045,
};

// ─── Report CSV ───────────────────────────────────────────────────────────────
function exportReport(inp: Inputs, f: Forces) {
  const lines = [
    'ABUTMENT STABILITY REPORT — IRC:78 / IS:456',
    `Date,${new Date().toLocaleDateString('en-IN')}`,
    '',
    'GEOMETRY',
    `Stem height H_stem (mm),${inp.H_stem}`,
    `Footing depth D_f (mm),${inp.D_f}`,
    `Toe B_toe (mm),${inp.B_toe}`,
    `Stem width t_stem (mm),${inp.t_stem}`,
    `Heel B_heel (mm),${inp.B_heel}`,
    `Total footing width B (m),${f.B.toFixed(3)}`,
    '',
    'SOIL',
    `Friction angle phi (deg),${inp.phi_deg}`,
    `Unit weight gamma_s (kN/m3),${inp.gamma_s}`,
    `Wall friction delta (deg),${(inp.delta_frac * inp.phi_deg).toFixed(1)}`,
    `Coulomb Ka,${f.Ka.toFixed(4)}`,
    `Kp,${f.Kp.toFixed(4)}`,
    '',
    'LOADS (kN/m)',
    `W_stem,${f.W_stem.toFixed(2)}`,
    `W_footing,${f.W_footing.toFixed(2)}`,
    `W_backfill,${f.W_backfill.toFixed(2)}`,
    `W_super (DL+LL),${f.W_super.toFixed(2)}`,
    `W_total,${f.W_total.toFixed(2)}`,
    `Pa (total),${f.Pa.toFixed(2)}`,
    `Pa_h (horizontal),${f.Pa_h.toFixed(2)}`,
    `Pa_v (vertical),${f.Pa_v.toFixed(2)}`,
    inp.seismic ? `dPa_h seismic,${f.dPa_h.toFixed(2)}` : '',
    '',
    'MOMENTS ABOUT TOE (kN.m/m)',
    `Restoring,${f.M_restoring.toFixed(2)}`,
    `Overturning,${f.M_overturning.toFixed(2)}`,
    '',
    'RESULTANT',
    `x_bar from toe (m),${f.x_bar.toFixed(3)}`,
    `Eccentricity e (m),${f.e.toFixed(3)}`,
    `e_limit (B/6) (m),${(f.B / 6).toFixed(3)}`,
    '',
    'BEARING PRESSURES (kN/m2)',
    `sigma_max,${f.sigma_max.toFixed(2)}`,
    `sigma_min,${f.sigma_min.toFixed(2)}`,
    `SBC,${inp.SBC}`,
    '',
    'STABILITY CHECKS',
    `FOS Sliding,${f.FOS_sliding.toFixed(2)},${f.slide_ok ? 'PASS' : 'FAIL'} (req >= 1.5)`,
    `FOS Overturning,${f.FOS_overturning.toFixed(2)},${f.overturn_ok ? 'PASS' : 'FAIL'} (req >= 2.0)`,
    `Bearing,${f.sigma_max.toFixed(0)} <= ${inp.SBC},${f.bearing_ok ? 'PASS' : 'FAIL'}`,
    `No tension,${f.sigma_min.toFixed(0)} >= 0,${f.no_tension ? 'PASS' : 'FAIL'}`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'Abutment_Stability_Report.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AbutmentStability() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  const [showDetail, setShowDetail] = useState(false);

  const set = useCallback(<K extends keyof Inputs>(key: K, val: Inputs[K]) =>
    setInp(prev => ({ ...prev, [key]: val })), []);

  const forces = useMemo(() => compute(inp), [inp]);
  const allOK  = forces.slide_ok && forces.overturn_ok && forces.bearing_ok && forces.no_tension;
  const B      = forces.B;
  const e_lim  = B / 6;

  // Derivative values for display
  const delta_deg = inp.delta_frac * inp.phi_deg;
  const H_total_m = (inp.H_stem + inp.D_f) / 1000;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">

      {/* Back */}
      <Link href="/astra-library">
        <a className="mb-5 inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-accent transition">
          <ArrowLeft className="h-4 w-4" /> ASTRA Library
        </a>
      </Link>

      {/* ASTRA banner */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
        <BookOpen className="h-4 w-4 shrink-0 text-amber-400" />
        <p className="flex-1 text-[11px] text-app-muted">
          <strong className="text-amber-400">ASTRA 15 — Abutment Worksheet Design 1 &amp; 2:</strong> Coulomb active
          pressure (IRC:78 / IS:456 Annex B), Mononobe-Okabe seismic increment, sliding/overturning/bearing
          checks. Benchmark: Typical highway bridge — H=6m, B=3.8m, φ=30°, SBC=200 kN/m².
        </p>
        <Link href="/astra-library">
          <a className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 transition">
            <BookOpen className="h-3.5 w-3.5" /> Library
          </a>
        </Link>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-app-fg">Abutment Stability Calculator</h1>
        <p className="mt-1 text-sm text-app-muted">
          IRC:78 / IS:456 — Coulomb earth pressure · Sliding · Overturning · Bearing capacity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">

        {/* ── INPUTS ── */}
        <div className="space-y-4">

          {/* Geometry */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Abutment geometry</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stem height H" unit="mm" value={inp.H_stem} min={1000} max={15000} step={100}
                onChange={v => set('H_stem', v)}
                tooltip="Height of breast wall from top of footing to bearing seat" />
              <Field label="Footing depth D_f" unit="mm" value={inp.D_f} min={300} max={3000} step={50}
                onChange={v => set('D_f', v)} />
              <Field label="Toe projection" unit="mm" value={inp.B_toe} min={200} max={3000} step={50}
                onChange={v => set('B_toe', v)}
                tooltip="Footing projection beyond front of stem" />
              <Field label="Stem width t" unit="mm" value={inp.t_stem} min={300} max={3000} step={50}
                onChange={v => set('t_stem', v)} />
              <Field label="Heel projection" unit="mm" value={inp.B_heel} min={500} max={6000} step={100}
                onChange={v => set('B_heel', v)}
                tooltip="Footing projection behind stem (backfill side)" />
              <Field label="Bearing offset" unit="mm" value={inp.bearing_offset} min={100} max={inp.t_stem}
                onChange={v => set('bearing_offset', v)}
                tooltip="Distance of bearing CL from front face of stem" />
            </div>
            <div className="mt-2 rounded-lg border border-[var(--app-glass-border)] px-3 py-1.5 font-mono text-[10px] text-app-muted">
              Total width B = {(B * 1000).toFixed(0)} mm &nbsp;|&nbsp; H_total = {(H_total_m * 1000).toFixed(0)} mm
            </div>
          </div>

          {/* Backfill */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Soil / backfill</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Friction angle φ" unit="°" value={inp.phi_deg} min={20} max={45} step={1}
                onChange={v => set('phi_deg', v)} />
              <Field label="Unit weight γ_s" unit="kN/m³" value={inp.gamma_s} min={14} max={22} step={0.5}
                onChange={v => set('gamma_s', v)} />
              <Field label="Wall friction δ/φ" unit="ratio" value={inp.delta_frac} min={0} max={1} step={0.05}
                onChange={v => set('delta_frac', v)}
                tooltip="Wall friction = delta_frac × phi. IRC:78 recommends 0.667 (2φ/3)" />
              <Field label="Backfill slope β" unit="°" value={inp.beta_deg} min={0} max={inp.phi_deg - 1} step={1}
                onChange={v => set('beta_deg', v)}
                tooltip="Backfill surface slope (0 = horizontal)" />
            </div>
            <div className="mt-2 rounded-lg border border-[var(--app-glass-border)] px-3 py-1.5 font-mono text-[10px] text-app-muted">
              Coulomb Ka = {forces.Ka.toFixed(4)} &nbsp;|&nbsp; Kp = {forces.Kp.toFixed(4)} &nbsp;|&nbsp; δ = {delta_deg.toFixed(1)}°
            </div>
          </div>

          {/* Material & Foundation */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Material &amp; foundation</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="γ_c concrete" unit="kN/m³" value={inp.gamma_c} min={22} max={26}
                onChange={v => set('gamma_c', v)} />
              <Field label="μ base friction" value={inp.mu} min={0.3} max={0.7} step={0.05}
                onChange={v => set('mu', v)}
                tooltip="Concrete-on-soil friction coefficient. Typically 0.5 for concrete on soil" />
              <Field label="SBC" unit="kN/m²" value={inp.SBC} min={50} max={1000} step={10}
                onChange={v => set('SBC', v)} />
              <Field label="Passive depth D_p" unit="mm" value={inp.D_passive} min={0} max={inp.D_f}
                onChange={v => set('D_passive', v)}
                tooltip="Depth of passive soil in front (usually = D_f). 50% of Pp is used conservatively." />
            </div>
          </div>

          {/* Superstructure */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Superstructure reactions (per m width)</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="R_DL" unit="kN/m" value={inp.R_DL} min={0} max={5000}
                onChange={v => set('R_DL', v)} tooltip="Dead load reaction from superstructure" />
              <Field label="R_LL" unit="kN/m" value={inp.R_LL} min={0} max={2000}
                onChange={v => set('R_LL', v)} tooltip="Live load reaction (IRC Class A / 70R)" />
            </div>
          </div>

          {/* Seismic */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-app-muted">Seismic (Mononobe-Okabe)</h2>
              <button
                onClick={() => set('seismic', !inp.seismic)}
                className={`rounded-lg border px-3 py-1 text-[11px] font-semibold transition ${
                  inp.seismic
                    ? 'border-orange-500/40 bg-orange-500/15 text-orange-400'
                    : 'border-[var(--app-glass-border)] text-app-muted'
                }`}>
                {inp.seismic ? 'ON (IRC:6 Cl.219)' : 'OFF'}
              </button>
            </div>
            {inp.seismic && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="k_h (Ah)" value={inp.kh} min={0.02} max={0.36} step={0.01}
                  onChange={v => set('kh', v)} tooltip="Horizontal seismic coefficient = Ah from IRC:6 Cl.219" />
                <Field label="k_v" value={inp.kv} min={0} max={0.2} step={0.005}
                  onChange={v => set('kv', v)} tooltip="Vertical seismic coefficient = kh/2 (IRC:6)" />
                <div className="col-span-2 rounded-lg border border-[var(--app-glass-border)] px-3 py-1.5 font-mono text-[10px] text-app-muted">
                  KAE = {forces.KAE.toFixed(4)} &nbsp;|&nbsp; ΔPa_h = {forces.dPa_h.toFixed(1)} kN/m
                </div>
              </div>
            )}
            {!inp.seismic && (
              <p className="text-[10px] text-app-muted">Enable to include Mononobe-Okabe seismic earth pressure increment</p>
            )}
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div className="space-y-4">

          {/* SVG */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-app-fg">Cross-section diagram</h2>
              <button onClick={() => exportReport(inp, forces)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--app-glass-border)] px-2.5 py-1.5 text-[11px] text-app-muted hover:text-app-fg transition">
                <Download className="h-3.5 w-3.5" /> Report CSV
              </button>
            </div>
            <AbutmentSVG inp={inp} forces={forces} />
          </div>

          {/* Overall status */}
          <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
            allOK
              ? 'border-emerald-500/30 bg-emerald-500/8'
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            {allOK
              ? <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              : <XCircle className="h-6 w-6 text-red-400" />}
            <div>
              <p className="font-bold text-app-fg">{allOK ? 'All stability checks PASS' : 'One or more checks FAIL'}</p>
              <p className="text-[11px] text-app-muted">
                Sliding FOS={forces.FOS_sliding.toFixed(2)} &nbsp;|&nbsp;
                Overturning FOS={forces.FOS_overturning.toFixed(2)} &nbsp;|&nbsp;
                σ_max={forces.sigma_max.toFixed(0)} kN/m²
              </p>
            </div>
          </div>

          {/* FOS Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FOSCard label="Sliding FOS" fos={forces.FOS_sliding}    limit={1.5} ok={forces.slide_ok}    limitLabel="IRC:78 Cl.706" />
            <FOSCard label="Overturning FOS" fos={forces.FOS_overturning} limit={2.0} ok={forces.overturn_ok} limitLabel="IRC:78 Cl.706" />
            <div className={`rounded-xl border p-4 ${forces.bearing_ok ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-red-500/30 bg-red-500/10'}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-app-muted">Bearing check</span>
                {forces.bearing_ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
              </div>
              <p className={`text-2xl font-bold ${forces.bearing_ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {forces.sigma_max.toFixed(0)}
              </p>
              <p className="text-[10px] text-app-muted">kN/m² ≤ SBC {inp.SBC}</p>
            </div>
            <div className={`rounded-xl border p-4 ${forces.no_tension ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-red-500/30 bg-red-500/10'}`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-app-muted">No-tension (e ≤ B/6)</span>
                {forces.no_tension ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
              </div>
              <p className={`text-2xl font-bold ${forces.no_tension ? 'text-emerald-400' : 'text-red-400'}`}>
                {forces.e.toFixed(3)}
              </p>
              <p className="text-[10px] text-app-muted">e (m) ≤ B/6 = {e_lim.toFixed(3)}</p>
            </div>
          </div>

          {/* Detailed calculation (collapsible) */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 overflow-hidden">
            <button
              onClick={() => setShowDetail(v => !v)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-app-fg hover:bg-app-card/60 transition">
              Step-by-step calculation
              {showDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDetail && (
              <div className="border-t border-[var(--app-glass-border)] divide-y divide-[var(--app-glass-border)]">

                {/* Earth pressure */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-muted">1. Coulomb earth pressure</h3>
                  <div className="rounded-lg border border-[var(--app-glass-border)] bg-[#0d1117] px-4 py-3 space-y-1 font-mono text-[11px] text-emerald-400">
                    <p>φ = {inp.phi_deg}°,  δ = {delta_deg.toFixed(1)}°,  β = {inp.beta_deg}°,  α = 90° (vertical)</p>
                    <p>Ka = {forces.Ka.toFixed(4)}  (Coulomb)</p>
                    <p>H_total = {H_total_m.toFixed(3)} m</p>
                    <p>Pa = 0.5 × {inp.gamma_s} × {H_total_m.toFixed(3)}² × {forces.Ka.toFixed(4)}</p>
                    <p>   = {forces.Pa.toFixed(2)} kN/m</p>
                    <p>Pa_h = Pa × cos(δ) = {forces.Pa_h.toFixed(2)} kN/m  (at H/3 = {forces.H_ep.toFixed(2)} m)</p>
                    <p>Pa_v = Pa × sin(δ) = {forces.Pa_v.toFixed(2)} kN/m</p>
                    {inp.seismic && <>
                      <p className="mt-1 text-amber-400">── Seismic increment (Mononobe-Okabe) ──</p>
                      <p>θ = arctan(kh/(1−kv)) = arctan({inp.kh}/{(1 - inp.kv).toFixed(3)})</p>
                      <p>KAE = {forces.KAE.toFixed(4)}</p>
                      <p>ΔPa_h = {forces.dPa_h.toFixed(2)} kN/m,  ΔPa_v = {forces.dPa_v.toFixed(2)} kN/m</p>
                    </>}
                  </div>
                </div>

                {/* Weights */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-muted">2. Weights (per m width)</h3>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-app-muted">
                        <th className="pb-1">Component</th>
                        <th className="pb-1 text-right">W (kN/m)</th>
                        <th className="pb-1 text-right">x from toe (m)</th>
                        <th className="pb-1 text-right">M (kNm/m)</th>
                      </tr>
                    </thead>
                    <tbody className="text-app-fg">
                      {[
                        ['Stem', forces.W_stem, forces.xW_stem],
                        ['Footing', forces.W_footing, forces.xW_footing],
                        ['Backfill', forces.W_backfill, forces.xW_backfill],
                        ['Super (DL+LL)', forces.W_super, forces.xW_super],
                        ['Pa_v (vertical EP)', forces.Pa_v, forces.B],
                        ...(inp.seismic ? [['ΔPa_v seismic', forces.dPa_v, forces.B] as [string, number, number]] : []),
                      ].map(([lbl, w, x]) => {
                        const wNum = w as number, xNum = x as number;
                        return (
                          <tr key={lbl as string} className="border-t border-[var(--app-glass-border)]">
                            <td className="py-1">{lbl as string}</td>
                            <td className="py-1 text-right">{wNum.toFixed(2)}</td>
                            <td className="py-1 text-right">{xNum.toFixed(3)}</td>
                            <td className="py-1 text-right">{(wNum * xNum).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-[var(--app-glass-border)] font-bold text-app-accent">
                        <td className="py-1">TOTAL (restoring)</td>
                        <td className="py-1 text-right">{(forces.W_total + forces.Pa_v + forces.dPa_v).toFixed(2)}</td>
                        <td />
                        <td className="py-1 text-right">{forces.M_restoring.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Moments */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-muted">3. Moments &amp; resultant</h3>
                  <div className="rounded-lg border border-[var(--app-glass-border)] bg-[#0d1117] px-4 py-3 space-y-1 font-mono text-[11px] text-emerald-400">
                    <p>ΣM_restoring  = {forces.M_restoring.toFixed(2)} kNm/m</p>
                    <p>ΣM_overturn   = Pa_h × H/3{inp.seismic ? ' + ΔPa_h × 0.6H' : ''}</p>
                    <p>              = {forces.M_overturning.toFixed(2)} kNm/m</p>
                    <p>x̄ from toe    = (ΣMr − ΣMo) / ΣW</p>
                    <p>              = ({forces.M_restoring.toFixed(2)} − {forces.M_overturning.toFixed(2)}) / {(forces.W_total + forces.Pa_v + forces.dPa_v).toFixed(2)}</p>
                    <p>              = {forces.x_bar.toFixed(3)} m</p>
                    <p>e             = |B/2 − x̄| = |{(forces.B / 2).toFixed(3)} − {forces.x_bar.toFixed(3)}|</p>
                    <p>              = {forces.e.toFixed(3)} m  (limit B/6 = {(forces.B / 6).toFixed(3)} m)</p>
                  </div>
                </div>

                {/* Bearing */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-muted">4. Bearing pressures</h3>
                  <div className="rounded-lg border border-[var(--app-glass-border)] bg-[#0d1117] px-4 py-3 space-y-1 font-mono text-[11px] text-emerald-400">
                    <p>σ = (ΣW/B) × (1 ± 6e/B)</p>
                    <p>σ_max = ({(forces.W_total + forces.Pa_v + forces.dPa_v).toFixed(1)}/{forces.B.toFixed(3)}) × (1 + 6×{forces.e.toFixed(3)}/{forces.B.toFixed(3)})</p>
                    <p>      = {forces.sigma_max.toFixed(2)} kN/m²  (SBC = {inp.SBC} kN/m²  {forces.bearing_ok ? '✓' : '✗'})</p>
                    <p>σ_min = {forces.sigma_min.toFixed(2)} kN/m²  {forces.no_tension ? '(no tension ✓)' : '(tension → revise geometry ✗)'}</p>
                  </div>
                </div>

                {/* Sliding */}
                <div className="px-5 py-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-muted">5. Sliding &amp; overturning</h3>
                  <div className="rounded-lg border border-[var(--app-glass-border)] bg-[#0d1117] px-4 py-3 space-y-1 font-mono text-[11px] text-emerald-400">
                    <p>Passive Pp = 0.5 × Kp × γ_s × D_p² × 0.5 = {forces.Pp.toFixed(2)} kN/m</p>
                    <p>FOS_sliding = (μ × ΣW + Pp) / (Pa_h{inp.seismic ? ' + ΔPa_h' : ''})</p>
                    <p>           = ({inp.mu} × {(forces.W_total + forces.Pa_v + forces.dPa_v).toFixed(1)} + {forces.Pp.toFixed(1)}) / {(forces.Pa_h + forces.dPa_h).toFixed(1)}</p>
                    <p>           = {forces.FOS_sliding.toFixed(3)}  {forces.slide_ok ? '≥ 1.50 ✓' : '< 1.50 ✗'}</p>
                    <p className="mt-1">FOS_overturning = ΣMr / ΣMo</p>
                    <p>           = {forces.M_restoring.toFixed(2)} / {forces.M_overturning.toFixed(2)}</p>
                    <p>           = {forces.FOS_overturning.toFixed(3)}  {forces.overturn_ok ? '≥ 2.00 ✓' : '< 2.00 ✗'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
