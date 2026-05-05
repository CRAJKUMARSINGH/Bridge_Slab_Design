/**
 * IRC SP-13 / IS:6966 — Backwater Curve Analysis
 * Computes the M1/M2 water surface profile upstream of the bridge
 * using the Direct Step Method (Manning's equation, rectangular channel).
 *
 * Convention: x = 0 at bridge upstream face, x increases going upstream.
 */
import { useState, useMemo } from 'react';
import {
  Waves, ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2, TrendingDown,
} from 'lucide-react';
import type { ProjectInput, CompleteDesignResult } from '../../../bridge-excel-generator/types';

const g = 9.81; // m/s²

// ── Manning's discharge for rectangular channel ────────────────────────────────
function qManning(B: number, y: number, n: number, S0: number): number {
  if (y <= 0) return 0;
  const A = B * y;
  const R = A / (B + 2 * y);
  return (1 / n) * A * Math.pow(R, 2 / 3) * Math.pow(S0, 0.5);
}

// ── Bisection solver for normal depth ─────────────────────────────────────────
function solveNormalDepth(Q: number, B: number, n: number, S0: number): number {
  if (S0 <= 0 || B <= 0) return 1.0;
  let lo = 0.001, hi = 30;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (qManning(B, mid, n, S0) < Q) lo = mid;
    else hi = mid;
    if (hi - lo < 0.0001) break;
  }
  return (lo + hi) / 2;
}

// ── Critical depth for rectangular channel ─────────────────────────────────────
function criticalDepth(Q: number, B: number): number {
  return Math.pow((Q * Q) / (g * B * B), 1 / 3);
}

// ── Station record ─────────────────────────────────────────────────────────────
interface Station {
  x: number;       // m upstream from bridge
  y: number;       // flow depth (m)
  V: number;       // velocity (m/s)
  Fr: number;      // Froude number
  Sf: number;      // friction slope
  E: number;       // specific energy (m)
  zBed: number;    // bed elevation (m MSL)
  zWS: number;     // water surface elevation (m MSL)
}

// ── Direct Step Method ────────────────────────────────────────────────────────
function computeProfile(
  Q: number, B: number, n: number, S0: number, bedLevel: number,
  y0: number, yn: number, yc: number,
  dx: number, maxSteps: number,
): Station[] {
  const stations: Station[] = [];
  let y = y0;

  for (let i = 0; i <= maxSteps; i++) {
    const x     = i * dx;
    const A     = B * y;
    const R     = A / (B + 2 * y);
    const V     = Q / A;
    const Sf    = (n * V) ** 2 / Math.pow(R, 4 / 3);
    const Fr    = V / Math.sqrt(g * y);
    const E     = y + (V * V) / (2 * g);
    const zBed  = bedLevel + S0 * x;
    const zWS   = zBed + y;

    stations.push({ x, y, V, Fr, Sf, E, zBed, zWS });

    // Convergence: depth within 2% of normal depth
    if (Math.abs(y - yn) / Math.max(yn, 0.01) < 0.02) break;

    // dy per unit upstream distance
    const denom = 1 - Fr * Fr;
    if (Math.abs(denom) < 1e-6) break; // near-critical, stop
    const dydUpstream = -(S0 - Sf) / denom;

    const yNew = y + dydUpstream * dx;
    // Clamp: don't cross critical from above (M1) or go negative
    if (yNew <= 0.01) break;
    if (y > yc && yNew < yc) { y = yc + 0.001; }
    else { y = yNew; }
  }

  return stations;
}

// ── Profile type ──────────────────────────────────────────────────────────────
function classifyProfile(Fr0: number, y0: number, yn: number, yc: number, S0: number, n: number, Q: number, B: number): string {
  const isMild = yn > yc;  // mild slope: yn > yc
  if (isMild && y0 > yn)   return 'M1 — mild slope, backwater (depth above normal)';
  if (isMild && y0 < yn && y0 > yc) return 'M2 — mild slope, drawdown (depth between normal and critical)';
  if (!isMild && y0 > yc && y0 > yn) return 'S1 — steep slope, backwater';
  if (!isMild && y0 < yc) return 'S3 — steep slope, drawdown';
  return Fr0 < 1 ? 'Subcritical backwater (check slope classification)' : 'Supercritical flow';
}

// ── SVG Profile Chart ─────────────────────────────────────────────────────────
function ProfileChart({ stations, yn, yc, bedLevel }: {
  stations: Station[]; yn: number; yc: number; bedLevel: number;
}) {
  if (stations.length < 2) return null;

  const W = 560, H = 180, pad = { t: 16, r: 20, b: 36, l: 52 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const xMax  = stations[stations.length - 1].x;
  const zMin  = stations[0].zBed - 0.2;
  const zMax  = Math.max(...stations.map(s => s.zWS)) + 0.3;

  const px = (x: number) => pad.l + (x / Math.max(xMax, 1)) * chartW;
  const py = (z: number) => pad.t + chartH - ((z - zMin) / (zMax - zMin)) * chartH;

  // Build SVG path strings
  const bedPath   = stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${px(s.x).toFixed(1)} ${py(s.zBed).toFixed(1)}`).join(' ');
  const wsPath    = stations.map((s, i) => `${i === 0 ? 'M' : 'L'} ${px(s.x).toFixed(1)} ${py(s.zWS).toFixed(1)}`).join(' ');
  const bedFill   = `${bedPath} L ${px(xMax).toFixed(1)} ${(pad.t + chartH).toFixed(1)} L ${px(0).toFixed(1)} ${(pad.t + chartH).toFixed(1)} Z`;
  const wsFill    = `${wsPath} ` + stations.slice().reverse().map((s, i) => `${i === 0 ? 'L' : 'L'} ${px(s.x).toFixed(1)} ${py(s.zBed).toFixed(1)}`).join(' ') + ' Z';

  // Yn and Yc reference lines at distance x: they slope with the bed
  const ynPoints  = stations.map(s => `${px(s.x).toFixed(1)},${py(s.zBed + yn).toFixed(1)}`).join(' ');
  const ycPoints  = stations.map(s => `${px(s.x).toFixed(1)},${py(s.zBed + yc).toFixed(1)}`).join(' `');

  // Y-axis labels
  const yTicks = 4;
  const zStep  = (zMax - zMin) / yTicks;

  // X-axis labels
  const xTicks = Math.min(5, stations.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      <defs>
        <clipPath id="bwChart">
          <rect x={pad.l} y={pad.t} width={chartW} height={chartH} />
        </clipPath>
      </defs>

      {/* Grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const z = zMin + i * zStep;
        return (
          <line key={i} x1={pad.l} y1={py(z)} x2={pad.l + chartW} y2={py(z)}
            stroke="var(--app-glass-border, #334155)" strokeWidth="0.5" opacity="0.5" />
        );
      })}

      {/* Water fill */}
      <path d={wsFill} fill="rgba(59,130,246,0.18)" clipPath="url(#bwChart)" />
      {/* Bed fill */}
      <path d={bedFill} fill="rgba(120,90,50,0.35)" clipPath="url(#bwChart)" />

      {/* Yn line */}
      <polyline points={ynPoints} fill="none" stroke="#10b981" strokeWidth="1.5"
        strokeDasharray="6,3" clipPath="url(#bwChart)" />
      {/* Yc line */}
      <polyline points={ycPoints} fill="none" stroke="#f59e0b" strokeWidth="1.5"
        strokeDasharray="3,3" clipPath="url(#bwChart)" />

      {/* Bed line */}
      <path d={bedPath} fill="none" stroke="rgb(120,90,50)" strokeWidth="2" clipPath="url(#bwChart)" />
      {/* Water surface */}
      <path d={wsPath} fill="none" stroke="rgb(59,130,246)" strokeWidth="2.5" clipPath="url(#bwChart)" />

      {/* Bridge marker at x=0 */}
      <rect x={px(0) - 4} y={pad.t} width={8} height={chartH} fill="rgba(239,68,68,0.25)" clipPath="url(#bwChart)" />
      <line x1={px(0)} y1={pad.t} x2={px(0)} y2={pad.t + chartH}
        stroke="rgb(239,68,68)" strokeWidth="2" clipPath="url(#bwChart)" />

      {/* Y-axis labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const z = zMin + i * zStep;
        return (
          <text key={i} x={pad.l - 4} y={py(z) + 3} textAnchor="end"
            fontSize="9" fill="var(--app-muted, #94a3b8)">{z.toFixed(2)}</text>
        );
      })}
      <text x={10} y={pad.t + chartH / 2} textAnchor="middle" fontSize="9"
        fill="var(--app-muted, #94a3b8)" transform={`rotate(-90, 10, ${pad.t + chartH / 2})`}>
        Elev (m MSL)
      </text>

      {/* X-axis labels */}
      {Array.from({ length: xTicks + 1 }, (_, i) => {
        const x = (xMax / xTicks) * i;
        return (
          <text key={i} x={px(x)} y={pad.t + chartH + 14} textAnchor="middle"
            fontSize="9" fill="var(--app-muted, #94a3b8)">{x.toFixed(0)}</text>
        );
      })}
      <text x={pad.l + chartW / 2} y={H - 2} textAnchor="middle"
        fontSize="9" fill="var(--app-muted, #94a3b8)">← Upstream distance from bridge (m)</text>

      {/* Legend */}
      <g transform={`translate(${pad.l + 6}, ${pad.t + 4})`}>
        {[
          { color: 'rgb(59,130,246)',  dash: '',     label: 'Water surface' },
          { color: '#10b981',          dash: '6,3',  label: `yn = ${yn.toFixed(3)} m` },
          { color: '#f59e0b',          dash: '3,3',  label: `yc = ${yc.toFixed(3)} m` },
          { color: 'rgb(239,68,68)',   dash: '',     label: 'Bridge' },
        ].map((l, i) => (
          <g key={i} transform={`translate(${i * 110}, 0)`}>
            <line x1={0} y1={5} x2={20} y2={5} stroke={l.color} strokeWidth="1.5"
              strokeDasharray={l.dash} />
            <text x={23} y={8} fontSize="8" fill="var(--app-muted, #94a3b8)">{l.label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function BackwaterCurvePanel({ draft, results }: {
  draft: ProjectInput;
  results: CompleteDesignResult;
}) {
  const [dx,        setDx]        = useState(100);    // step size (m)
  const [maxSteps,  setMaxSteps]  = useState(50);
  const [collapsed, setCollapsed] = useState(false);

  const calc = useMemo(() => {
    const Q  = draft.discharge ?? 0;
    const n  = draft.manningN ?? 0.033;
    const S0 = draft.bedSlope > 0 ? 1 / draft.bedSlope : 0.001; // convert "1 in X"
    const B  = draft.numberOfSpans * draft.spanLength;            // effective waterway
    const bedLvl = draft.bedLevel;

    if (Q <= 0 || B <= 0 || S0 <= 0 || n <= 0) {
      return null;
    }

    const yn = solveNormalDepth(Q, B, n, S0);
    const yc = criticalDepth(Q, B);
    const y0 = (draft.hfl ?? 0) - bedLvl;  // flow depth at bridge (upstream face)

    if (y0 <= 0) return null;

    const stations = computeProfile(Q, B, n, S0, bedLvl, y0, yn, yc, dx, maxSteps);

    // Affected length: last station where |y - yn| / yn > 5%
    const lastAffected = stations.slice().reverse().find(s => Math.abs(s.y - yn) / yn > 0.05);
    const La = lastAffected?.x ?? stations[stations.length - 1].x;

    // Afflux: y0 - yn (depth excess at bridge)
    const afflux_computed = y0 - yn;

    const st0     = stations[0];
    const profile = classifyProfile(st0.Fr, y0, yn, yc, S0, n, Q, B);
    const verdict = afflux_computed <= (draft.bridgeType === 'high-level' ? 0.50 : 0.30) && stations[0].Fr < 1 ? 'PASS' : 'WARN';

    return { yn, yc, y0, La, afflux_computed, S0, B, Q, stations, profile, verdict };
  }, [draft, results, dx, maxSteps]);

  const hyd = results.hydraulics;

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">

      {/* ── HEADER ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-app-accent" />
          <h3 className="text-base font-semibold text-app-fg">Backwater Curve Analysis</h3>
          <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">
            IRC SP-13 · Direct Step Method
          </span>
          {calc && (
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
              calc.verdict === 'PASS'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              {calc.verdict}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Step size control */}
          <div className="flex items-center gap-1.5 text-[10px] text-app-muted">
            <span>Step Δx</span>
            {[50, 100, 200, 500].map(v => (
              <button key={v} onClick={() => setDx(v)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                  dx === v
                    ? 'bg-app-accent/20 text-app-accent'
                    : 'border border-[var(--app-glass-border)] text-app-muted hover:text-app-fg'
                }`}>
                {v}m
              </button>
            ))}
          </div>
          <button onClick={() => setCollapsed(c => !c)}
            className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 p-1.5 text-app-muted hover:text-app-fg transition">
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (<>

        {!calc ? (
          <div className="rounded-xl border border-dashed border-[var(--app-glass-border)] py-8 text-center text-sm text-app-muted">
            Run a calculation first to compute the backwater profile.
          </div>
        ) : (<>

          {/* ── SUMMARY CARDS ── */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Normal depth yn',    value: `${calc.yn.toFixed(3)} m`,                  color: 'text-emerald-400', note: 'Manning\'s Q' },
              { label: 'Critical depth yc',  value: `${calc.yc.toFixed(3)} m`,                  color: 'text-amber-400',   note: 'Q²/gB²)^(1/3)' },
              { label: 'Bridge depth y₀',    value: `${calc.y0.toFixed(3)} m`,                  color: 'text-blue-400',    note: 'HFL − bedLevel' },
              { label: 'Computed afflux',    value: `${calc.afflux_computed.toFixed(3)} m`,      color: calc.afflux_computed > 0.3 ? 'text-red-400' : 'text-emerald-400', note: 'y₀ − yn' },
              { label: 'Engine afflux',      value: `${hyd.afflux.toFixed(3)} m`,               color: 'text-app-accent',  note: 'from server' },
              { label: 'Affected length La', value: `${calc.La.toFixed(0)} m`,                  color: 'text-violet-400',  note: '5% of yn criterion' },
              { label: 'Effective width B',  value: `${calc.B.toFixed(1)} m`,                   color: 'text-app-muted',   note: 'spans × length' },
              { label: 'Bed slope S₀',       value: `1 in ${draft.bedSlope.toFixed(0)} (${(calc.S0 * 1000).toFixed(2)}‰)`, color: 'text-app-muted', note: 'input' },
            ].map(p => (
              <div key={p.label} className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/40 p-3">
                <p className="text-[10px] text-app-muted">{p.label}</p>
                <p className={`mt-1 text-sm font-bold font-mono ${p.color}`}>{p.value}</p>
                <p className="text-[9px] text-app-muted">{p.note}</p>
              </div>
            ))}
          </div>

          {/* Profile classification */}
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--app-glass-border)]/50 bg-app-card/30 px-3 py-2">
            <Waves className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <p className="text-[11px] text-app-fg">
              <strong>Profile type:</strong> {calc.profile}
            </p>
          </div>

          {/* ── SVG CHART ── */}
          <div className="mb-4 overflow-hidden rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">
              Water surface profile — upstream of bridge (bridge at x = 0)
            </p>
            <ProfileChart
              stations={calc.stations}
              yn={calc.yn}
              yc={calc.yc}
              bedLevel={draft.bedLevel}
            />
          </div>

          {/* ── STATION TABLE ── */}
          <div className="mb-4 overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--app-glass-border)] bg-app-card/70">
                  {['x (m ↑)', 'Depth y (m)', 'Vel V (m/s)', 'Fr', 'Sf (×10⁻⁴)', 'Energy E (m)', 'Bed Elev (m)', 'W.S. Elev (m)', 'y/yn'].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] font-bold text-app-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calc.stations
                  .filter((_, i) => i % Math.max(1, Math.floor(calc.stations.length / 15)) === 0 || i === calc.stations.length - 1)
                  .map(s => {
                    const ratio = s.y / calc.yn;
                    const nearNormal = Math.abs(ratio - 1) < 0.05;
                    return (
                      <tr key={s.x}
                        className={`border-b border-[var(--app-glass-border)]/40 hover:bg-app-card/30 ${
                          s.x === 0 ? 'bg-blue-500/10' : nearNormal ? 'bg-emerald-500/5' : ''
                        }`}>
                        <td className="px-3 py-1.5 font-mono text-[11px] font-semibold text-app-accent">{s.x.toFixed(0)}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-app-fg">{s.y.toFixed(4)}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-app-fg">{s.V.toFixed(3)}</td>
                        <td className={`px-3 py-1.5 font-mono text-[11px] font-semibold ${s.Fr < 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {s.Fr.toFixed(4)}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-app-muted">{(s.Sf * 10000).toFixed(3)}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-app-fg">{s.E.toFixed(4)}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-app-muted">{s.zBed.toFixed(3)}</td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-blue-400">{s.zWS.toFixed(3)}</td>
                        <td className={`px-3 py-1.5 font-mono text-[11px] ${nearNormal ? 'text-emerald-400 font-semibold' : 'text-app-muted'}`}>
                          {ratio.toFixed(3)}{nearNormal && ' ≈yn'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <p className="px-3 py-1 text-[9px] text-app-muted border-t border-[var(--app-glass-border)]/40">
              Showing every {Math.max(1, Math.floor(calc.stations.length / 15))} station(s) · {calc.stations.length} total computed.
              Blue row = bridge face (x=0). Green row = near-normal depth (y/yn ≈ 1).
            </p>
          </div>

          {/* ── NOTE ── */}
          <div className="space-y-1.5 rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-3 text-[11px] text-app-muted">
            <div className="flex gap-2 items-start">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
              <span>
                <strong className="text-app-fg">Method:</strong> Direct Step Method (Manning's uniform flow, rectangular channel approximation).
                dy/d(x↑) = −(S₀ − Sf) / (1 − Fr²). Starting condition: y₀ = HFL − bed level = {calc.y0.toFixed(3)} m at bridge upstream face.
                Effective channel width B = {calc.B.toFixed(1)} m, S₀ = 1/{draft.bedSlope} = {(calc.S0 * 1000).toFixed(2)}‰.
              </span>
            </div>
            <div className="flex gap-2 items-start">
              {calc.La < 500
                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />}
              <span>
                <strong className="text-app-fg">Afflux extent:</strong> Depth returns to within 5% of normal depth at approximately
                <strong className="text-app-fg"> {calc.La.toFixed(0)} m</strong> upstream of the bridge
                {calc.La < 500
                  ? ' — within acceptable range for DPR submission.'
                  : ' — verify upstream flood impact in DPR; check with State PWD.'}
                Computed afflux ({calc.afflux_computed.toFixed(3)} m) vs engine output ({hyd.afflux.toFixed(3)} m).
              </span>
            </div>
            <div className="flex gap-2 items-start">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-app-muted" />
              <span>
                <strong className="text-app-fg">PWD/DPR requirement:</strong> IRC SP-13 Cl. 5 requires backwater curve to show affected upstream length
                and confirm afflux dissipates before the nearest upstream structure (road, railway, habitation). Submersible bridges: afflux ≤ 0.30 m; high-level: ≤ 0.50 m per Cl. 5.3.
              </span>
            </div>
          </div>

        </>)}
      </>)}
    </section>
  );
}
