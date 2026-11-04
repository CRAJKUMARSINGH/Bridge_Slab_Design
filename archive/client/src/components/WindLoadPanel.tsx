/**
 * IRC:6-2016 Cl. 212 — Wind Load Check
 * Computes design wind pressure, wind forces on pier and deck,
 * and checks pier stability FOS under combined normal + wind loading.
 * Seismic and wind are NOT combined (IRC:6-2016 Cl. 219.1).
 */
import { useState, useMemo } from 'react';
import { Wind, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ProjectInput, CompleteDesignResult } from '../../../bridge-excel-generator/types';

// ── IS:875 Part 3 — k2 terrain/height factors (simplified, Table 2) ──────────
// [terrain_cat][height_band_index]: height bands ≤5, ≤10, ≤15, ≤20, ≤30, ≤50m
const K2_TABLE: Record<number, number[]> = {
  1: [1.05, 1.05, 1.09, 1.12, 1.15, 1.20],
  2: [1.00, 1.00, 1.02, 1.05, 1.07, 1.12],
  3: [0.91, 0.91, 0.94, 0.96, 1.00, 1.04],
  4: [0.82, 0.82, 0.85, 0.87, 0.89, 0.91],
};
function getK2(terrainCat: number, height: number): number {
  const bands = [5, 10, 15, 20, 30, 50];
  const idx   = bands.findIndex(b => height <= b);
  const i     = idx < 0 ? bands.length - 1 : idx;
  return K2_TABLE[terrainCat]?.[i] ?? 1.0;
}

// ── Drag coefficients (IS:875 Part 3 / IRC:6-2016 Cl. 212) ───────────────────
const CD_PIER = 1.3;   // rectangular solid pier
const CD_DECK = 1.3;   // solid slab deck

// ── Rajasthan wind speed guess from location ──────────────────────────────────
function guessVb(location: string): number {
  const t = location.toLowerCase();
  if (/barmer|jaisalmer|jodhpur|bikaner|churu/.test(t)) return 47;
  if (/jaipur|alwar|bharatpur|kota|bundi/.test(t))      return 39;
  return 44; // most of Rajasthan
}

// ── Status helpers ────────────────────────────────────────────────────────────
type WindStatus = 'PASS' | 'FAIL' | 'WARN';
function wBadge(s: WindStatus) {
  if (s === 'PASS') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (s === 'WARN') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}
function wColor(s: WindStatus) {
  return s === 'PASS' ? 'rgb(16 185 129)' : s === 'WARN' ? 'rgb(245 158 11)' : 'rgb(239 68 68)';
}

// ── FOS Row ───────────────────────────────────────────────────────────────────
function FosRow({ label, value, req, note }: { label: string; value: number; req: number; note: string }) {
  const status: WindStatus = value >= req ? 'PASS' : value >= req * 0.90 ? 'WARN' : 'FAIL';
  return (
    <tr className="border-b border-[var(--app-glass-border)]/40 hover:bg-app-card/30">
      <td className="px-3 py-2 text-xs text-app-muted">{label}</td>
      <td className="px-3 py-2 font-mono text-sm font-semibold text-app-fg">{value.toFixed(3)}</td>
      <td className="px-3 py-2 text-xs text-app-muted">≥ {req.toFixed(1)}</td>
      <td className="px-3 py-2">
        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${wBadge(status)}`}>
          {status}
        </span>
      </td>
      <td className="px-3 py-2 text-[10px] text-app-muted">{note}</td>
    </tr>
  );
}

// ── Wind speed comparison row ─────────────────────────────────────────────────
function SpeedRow({ Vb, Vd, pd, Fw, pierSlideFOS, active }: {
  Vb: number; Vd: number; pd: number; Fw: number;
  pierSlideFOS: number; active: boolean;
}) {
  const ok = pierSlideFOS >= 1.5;
  return (
    <tr className={`border-b border-[var(--app-glass-border)]/40 ${active ? 'bg-app-accent/5 font-semibold' : 'hover:bg-app-card/30'}`}>
      <td className="px-3 py-2 text-sm">
        <span className={`font-mono ${active ? 'text-app-accent' : 'text-app-fg'}`}>{active && '▶ '}{Vb} m/s</span>
      </td>
      <td className="px-3 py-2 text-center font-mono text-sm">{Vd.toFixed(1)}</td>
      <td className="px-3 py-2 text-center font-mono text-sm">{pd.toFixed(0)}</td>
      <td className="px-3 py-2 text-center font-mono text-sm">{Fw.toFixed(1)}</td>
      <td className="px-3 py-2 text-center">
        <span style={{ color: pierSlideFOS >= 1.5 ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}
          className="font-mono text-sm font-semibold">
          {pierSlideFOS.toFixed(3)}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${ok ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
          {ok ? 'PASS' : 'FAIL'}
        </span>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function WindLoadPanel({ draft, results }: { draft: ProjectInput; results: CompleteDesignResult }) {
  const defaultVb = guessVb(draft.location ?? '');

  const [Vb,         setVb]         = useState(defaultVb);
  const [terrainCat, setTerrainCat] = useState(2);
  const [k1,         setK1]         = useState(1.06);   // 100-yr return (IRC default)
  const [k3,         setK3]         = useState(1.0);    // flat terrain
  const [collapsed,  setCollapsed]  = useState(false);

  const calc = useMemo(() => {
    const pier       = results.pier;
    const h_pier     = pier.geometry.depth;       // m (pier height)
    const k2         = getK2(terrainCat, h_pier);
    const Vd         = Vb * k1 * k2 * k3;        // m/s
    const pd_Pa      = Math.max(0.6 * Vd * Vd, 464); // N/m² (IRC min 464)
    const pd_kNm2    = pd_Pa / 1000;              // kN/m²

    // ── Pier wind area (transverse = pier_length face × pier height) ──────
    const pierLen    = pier.geometry.length;      // m along bridge axis
    const Ae_pier    = h_pier * pierLen;          // m²
    const Fw_pier    = pd_kNm2 * Ae_pier * CD_PIER; // kN

    // ── Deck wind area (transverse, per pier) ─────────────────────────────
    const deckDepth  = (draft.deckSlabThickness ?? 0.5) + 0.3; // slab + kerb ≈ 0.6–0.8 m
    const deckLenPerPier = draft.spanLength;      // each pier takes one span tributary
    const Ae_deck    = deckDepth * deckLenPerPier;
    const Fw_deck    = pd_kNm2 * Ae_deck * CD_DECK; // kN

    const Fw_total   = Fw_pier + Fw_deck;

    // ── Stability — reconstruct friction resistance from worst normal FOS ──
    const worstPier  = [...pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
    const H_normal   = pier.loads.totalHorizontalForce;
    const R_fric     = worstPier.slidingFOS * H_normal; // kN (friction + passive)

    const H_wind     = H_normal + Fw_total;
    const slideFOS_wind = R_fric / H_wind;

    // Overturning with wind (wind on pier acts at h/2, wind on deck at full h)
    const arm_pier   = h_pier * 0.5;
    const arm_deck   = h_pier;
    const M_wind     = Fw_pier * arm_pier + Fw_deck * arm_deck;
    // Reconstruct M_stabilize / M_overturn ratio
    const M_overturn_base = H_normal * arm_pier; // proxy for normal OT moment
    const M_stabilize = worstPier.overturningFOS * M_overturn_base;
    const overturnFOS_wind = M_stabilize / (M_overturn_base + M_wind);

    // ── Wind speed comparison ─────────────────────────────────────────────
    const speeds = [33, 39, 44, 47, 50];
    const comparison = speeds.map(v => {
      const vd   = v * k1 * k2 * k3;
      const pd   = Math.max(0.6 * vd * vd, 464) / 1000;
      const fw   = pd * Ae_pier * CD_PIER + pd * Ae_deck * CD_DECK;
      const fos  = R_fric / (H_normal + fw);
      return { Vb: v, Vd: vd, pd: pd * 1000, Fw: fw, pierSlideFOS: fos };
    });

    const slideOK   = slideFOS_wind >= 1.50;
    const overturnOK = overturnFOS_wind >= 1.80;
    const verdict: WindStatus = (slideOK && overturnOK) ? 'PASS' : (slideOK || overturnOK) ? 'WARN' : 'FAIL';

    return {
      k2, Vd, pd_Pa, pd_kNm2, Fw_pier, Fw_deck, Fw_total,
      Ae_pier, Ae_deck, deckDepth, H_wind,
      slideFOS_wind, overturnFOS_wind, slideOK, overturnOK,
      verdict, comparison,
      H_normal, worstPier,
    };
  }, [Vb, terrainCat, k1, k3, draft, results]);

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">

      {/* ── HEADER ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-app-accent" />
          <h3 className="text-base font-semibold text-app-fg">Wind Load Check</h3>
          <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">
            IRC:6-2016 Cl. 212 · IS:875-III
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${wBadge(calc.verdict)}`}>
            {calc.verdict}
          </span>
          <span className="rounded-full border border-[var(--app-glass-border)]/40 bg-app-card/40 px-2 py-0.5 text-[10px] text-app-muted">
            Not combined with seismic (Cl. 219.1)
          </span>
        </div>
        <button onClick={() => setCollapsed(c => !c)}
          className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 p-1.5 text-app-muted hover:text-app-fg transition">
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (<>

        {/* ── CONTROLS ── */}
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 sm:grid-cols-4">

          {/* Basic wind speed */}
          <div className="col-span-2 sm:col-span-1">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">
              Basic Wind Speed Vb (m/s)
            </p>
            <div className="flex flex-wrap gap-1">
              {[33, 39, 44, 47, 50].map(v => (
                <button key={v} onClick={() => setVb(v)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    Vb === v
                      ? 'bg-app-accent text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {Vb >= 47 ? 'Western Rajasthan (Jodhpur, Barmer)' : Vb >= 44 ? 'Central Rajasthan' : Vb >= 39 ? 'Eastern Rajasthan (Jaipur, Alwar)' : 'Low-wind zone'}
            </p>
          </div>

          {/* Terrain category */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Terrain Cat.</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(c => (
                <button key={c} onClick={() => setTerrainCat(c)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    terrainCat === c
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {terrainCat === 1 ? 'Open, coastal, lakeside' : terrainCat === 2 ? 'Open with scattered obstacles' : terrainCat === 3 ? 'Suburban, small towns' : 'Urban with tall buildings'}
            </p>
          </div>

          {/* k1 — risk factor */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Risk Factor k1</p>
            <div className="flex gap-1">
              {([1.0, 1.06] as const).map(v => (
                <button key={v} onClick={() => setK1(v)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    k1 === v
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {v.toFixed(2)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {k1 === 1.06 ? '100-yr return (IRC bridges)' : '50-yr return'}
            </p>
          </div>

          {/* k3 — topography */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Topography k3</p>
            <div className="flex gap-1">
              {([1.0, 1.1, 1.2] as const).map(v => (
                <button key={v} onClick={() => setK3(v)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    k3 === v
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {v.toFixed(1)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {k3 === 1.0 ? 'Flat / valley' : k3 === 1.1 ? 'Gentle slope / ridge' : 'Hilltop / escarpment'}
            </p>
          </div>
        </div>

        {/* ── PARAMETER CARDS ── */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Terrain factor k2',     value: calc.k2.toFixed(3),          color: 'text-violet-400' },
            { label: 'Design speed Vd',       value: `${calc.Vd.toFixed(1)} m/s`, color: 'text-app-accent' },
            { label: 'Wind pressure pd',      value: `${calc.pd_Pa.toFixed(0)} Pa`, color: 'text-cyan-400' },
            { label: 'pd (kN/m²)',            value: `${calc.pd_kNm2.toFixed(4)}`, color: 'text-cyan-400' },
            { label: 'Pier wind area',        value: `${calc.Ae_pier.toFixed(2)} m²`, color: 'text-app-muted' },
            { label: 'Deck wind area',        value: `${calc.Ae_deck.toFixed(2)} m²`, color: 'text-app-muted' },
            { label: 'Wind force on pier',    value: `${calc.Fw_pier.toFixed(2)} kN`, color: 'text-rose-400' },
            { label: 'Total wind force',      value: `${calc.Fw_total.toFixed(2)} kN`, color: 'text-rose-400' },
          ].map(p => (
            <div key={p.label} className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/40 p-3">
              <p className="text-[10px] text-app-muted">{p.label}</p>
              <p className={`mt-1 text-sm font-bold font-mono ${p.color}`}>{p.value}</p>
            </div>
          ))}
        </div>

        {/* ── STABILITY CHECK TABLE ── */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] bg-app-card/70">
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Wind stability check</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">FOS (wind)</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Required</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Status</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <FosRow
                label={`Pier sliding — normal (${calc.H_normal.toFixed(1)} kN) + wind (${calc.Fw_total.toFixed(1)} kN) = ${calc.H_wind.toFixed(1)} kN total lateral`}
                value={calc.slideFOS_wind}
                req={1.50}
                note={`Normal FOS = ${calc.worstPier.slidingFOS.toFixed(2)} · wind adds ${((calc.Fw_total / calc.H_normal) * 100).toFixed(0)}% to lateral force`}
              />
              <FosRow
                label={`Pier overturning — additional moment from wind: Fw_pier × h/2 + Fw_deck × h`}
                value={calc.overturnFOS_wind}
                req={1.80}
                note={`Normal FOS = ${calc.worstPier.overturningFOS.toFixed(2)} · overturning arm = pier depth ${results.pier.geometry.depth.toFixed(1)} m`}
              />
            </tbody>
          </table>
        </div>

        {/* ── WIND SPEED COMPARISON TABLE ── */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
          <p className="border-b border-[var(--app-glass-border)] bg-app-card/70 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">
            Wind speed comparison — same terrain cat ({terrainCat}), k1 = {k1.toFixed(2)}, k3 = {k3.toFixed(1)}
          </p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] bg-app-card/60">
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Vb (m/s)</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Vd (m/s)</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">pd (N/m²)</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Fw total (kN)</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Pier slide FOS<br/><span className="font-normal">(≥ 1.50)</span></th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {calc.comparison.map(row => (
                <SpeedRow key={row.Vb} {...row} active={row.Vb === Vb} />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── EXPOSED AREAS NOTE ── */}
        <div className="mb-4 rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-3 text-[11px] text-app-muted">
          <p className="font-semibold text-app-fg mb-1">Exposed areas used in calculation</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span>Pier face (transverse): <strong className="text-app-fg">{results.pier.geometry.depth.toFixed(2)} m × {results.pier.geometry.length.toFixed(2)} m = {calc.Ae_pier.toFixed(2)} m²</strong></span>
            <span>Cd (pier, rectangular): <strong className="text-app-fg">{CD_PIER}</strong></span>
            <span>Deck depth (slab + kerb): <strong className="text-app-fg">{calc.deckDepth.toFixed(2)} m</strong> · span tributary: <strong className="text-app-fg">{draft.spanLength} m</strong></span>
            <span>Cd (deck, solid slab): <strong className="text-app-fg">{CD_DECK}</strong></span>
          </div>
        </div>

        {/* ── METHOD NOTE ── */}
        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-3 text-[11px] text-app-muted space-y-1.5">
          <div className="flex gap-2 items-start">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
            <span>
              <strong className="text-app-fg">Method:</strong> IRC:6-2016 Cl. 212 &amp; IS:875 Part 3.
              Vd = Vb × k1 × k2 × k3 = {Vb} × {k1.toFixed(2)} × {calc.k2.toFixed(3)} × {k3.toFixed(1)} = <strong className="text-app-accent">{calc.Vd.toFixed(2)} m/s</strong>.
              pd = 0.6 × Vd² = {calc.pd_Pa.toFixed(0)} N/m² (IRC minimum 464 N/m² per Cl. 212.3).
            </span>
          </div>
          <div className="flex gap-2 items-start">
            {calc.verdict === 'PASS'
              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
              : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />}
            <span>
              <strong className="text-app-fg">FOS limits (wind case):</strong> same as normal — sliding ≥ 1.50, overturning ≥ 1.80 (IRC:6-2016 Cl. 202.3).
              Wind and seismic are <strong className="text-app-fg">not combined</strong> per IRC:6-2016 Cl. 219.1 — check each independently.
            </span>
          </div>
          <div className="flex gap-2 items-start">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-app-muted" />
            <span>
              Rajasthan wind speed reference (IS:875 Part 3): Jodhpur/Barmer/Jaisalmer — <strong className="text-app-fg">47 m/s</strong>;
              most districts — <strong className="text-app-fg">44 m/s</strong>; Jaipur/Alwar/Kota — <strong className="text-app-fg">39 m/s</strong>.
            </span>
          </div>
        </div>

      </>)}
    </section>
  );
}
