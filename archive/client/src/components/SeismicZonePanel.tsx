/**
 * IRC:6-2016 Cl. 219 — Seismic Zone Check
 * Computes design horizontal seismic acceleration, pier/abutment seismic forces,
 * and checks modified FOS requirements for the seismic load case.
 */
import { useState, useMemo } from 'react';
import { Activity, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ProjectInput, CompleteDesignResult } from '../../../bridge-excel-generator/types';

// ── IRC:6-2016 Table 5 ────────────────────────────────────────────────────────
const ZONE_FACTORS: Record<string, number> = {
  'II': 0.10, 'III': 0.16, 'IV': 0.24, 'V': 0.36,
};

// ── Sa/g per IRC:6-2016 Cl. 219.5.1 (5% damping) ────────────────────────────
function specAccel(T: number, soilType: 'I' | 'II' | 'III'): number {
  if (T < 0.1) return 1.0 + 15 * T;
  if (soilType === 'I') {
    if (T <= 0.40) return 2.50;
    return 1.00 / T;
  }
  if (soilType === 'II') {
    if (T <= 0.55) return 2.50;
    return 1.36 / T;
  }
  // Type III — Soft soil
  if (T <= 0.67) return 2.50;
  return 1.67 / T;
}

// ── Time period (simplified pier cantilever, IRC:6 Annex D) ──────────────────
function pierTimePeriod(inp: ProjectInput, r: CompleteDesignResult): number {
  const h    = r.pier.geometry.depth;                    // pier height (m)
  const E    = 5000 * Math.sqrt(inp.fck ?? 25) * 1000;  // N/m² (E in MPa → N/m²)
  const b    = inp.pierWidth;                             // m (across flow)
  const d    = inp.pierLength;                            // m (along bridge)
  const I    = (b * Math.pow(d, 3)) / 12;               // m⁴ (stiff direction)
  const K    = (3 * E * I) / Math.pow(h, 3);            // N/m stiffness
  const W    = r.pier.loads.deadLoad * 1000;             // N (dead load)
  const g    = 9.81;
  const T    = 2 * Math.PI * Math.sqrt(W / (g * K));
  return Math.max(0.1, Math.min(T, 3.0));               // clamp to reasonable range
}

// ── Rajasthan district → default zone ────────────────────────────────────────
function guessZone(location: string, riverName: string): string {
  const text = (location + ' ' + riverName).toLowerCase();
  if (/delhi|alwar|bharatpur|dholpur/.test(text))  return 'III';
  if (/jaipur|dausa|sawai|sikar|jhunjhunu/.test(text)) return 'III';
  if (/kutch|bhuj|surat/.test(text))              return 'V';
  return 'II'; // Default Rajasthan
}

// ── Status helpers ────────────────────────────────────────────────────────────
type SeisStatus = 'PASS' | 'FAIL' | 'WARN';
function sColor(s: SeisStatus) {
  if (s === 'PASS') return 'rgb(16 185 129)';
  if (s === 'WARN') return 'rgb(245 158 11)';
  return 'rgb(239 68 68)';
}
function sBadge(s: SeisStatus) {
  if (s === 'PASS') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (s === 'WARN') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

// ── Row component ─────────────────────────────────────────────────────────────
function Row({ label, value, unit, status, note }: {
  label: string; value: string; unit?: string;
  status?: SeisStatus; note?: string;
}) {
  return (
    <tr className="border-b border-[var(--app-glass-border)]/40 hover:bg-app-card/30">
      <td className="px-3 py-2 text-xs text-app-muted">{label}</td>
      <td className="px-3 py-2 text-sm font-semibold text-app-fg font-mono">
        {value}{unit && <span className="ml-0.5 text-[10px] font-normal text-app-muted">{unit}</span>}
      </td>
      {status && (
        <td className="px-3 py-2">
          <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge(status)}`}>
            {status}
          </span>
        </td>
      )}
      {note && <td className="px-3 py-2 text-[10px] text-app-muted">{note}</td>}
    </tr>
  );
}

// ── Zone comparison table row ─────────────────────────────────────────────────
function ZoneRow({ zone, Ah, pierFOS, abtFOS, active }: {
  zone: string; Ah: number; pierFOS: number; abtFOS: number; active: boolean;
}) {
  const pierOK = pierFOS >= 1.25;
  const abtOK  = abtFOS >= 1.25;
  const status: SeisStatus = (pierOK && abtOK) ? 'PASS' : 'FAIL';
  return (
    <tr className={`border-b border-[var(--app-glass-border)]/40 ${active ? 'bg-app-accent/5 font-semibold' : 'hover:bg-app-card/30'}`}>
      <td className="px-3 py-2 text-sm">
        <span className={`inline-flex items-center gap-1 font-mono ${active ? 'text-app-accent' : 'text-app-fg'}`}>
          {active && '▶ '} Zone {zone}
        </span>
      </td>
      <td className="px-3 py-2 text-center text-sm font-mono">{ZONE_FACTORS[zone].toFixed(2)}</td>
      <td className="px-3 py-2 text-center text-sm font-mono">{Ah.toFixed(4)}</td>
      <td className="px-3 py-2 text-center">
        <span style={{ color: pierFOS >= 1.25 ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }} className="font-mono text-sm font-semibold">
          {pierFOS.toFixed(2)}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <span style={{ color: abtFOS >= 1.25 ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }} className="font-mono text-sm font-semibold">
          {abtFOS.toFixed(2)}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${sBadge(status)}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SeismicZonePanel({ draft, results }: { draft: ProjectInput; results: CompleteDesignResult }) {
  const defaultZone = guessZone(draft.location ?? '', draft.riverName ?? '');

  const [zone,       setZone]       = useState<string>(defaultZone);
  const [soilType,   setSoilType]   = useState<'I' | 'II' | 'III'>('II');
  const [importance, setImportance] = useState<1.0 | 1.5>(1.0);
  const [R,          setR]          = useState<number>(3.0);
  const [collapsed,  setCollapsed]  = useState(false);

  const calc = useMemo(() => {
    const Z   = ZONE_FACTORS[zone];
    const T   = pierTimePeriod(draft, results);
    const SaG = specAccel(T, soilType);
    const Ah  = (Z / 2) * SaG * (importance / R);

    const pier = results.pier;
    const abt  = results.abutmentType1;

    // Seismic weight = dead load on pier (most conservative)
    const W_pier = pier.loads.deadLoad;           // kN
    const W_abt  = abt.loads?.deadLoad ?? W_pier; // kN

    // Seismic forces
    const Feq_pier = Ah * W_pier;
    const Feq_abt  = Ah * W_abt;

    // Pier arm (from foundation level to centroid of seismic mass)
    // ≈ half the pier depth + footing half-thickness
    const pierArm = pier.geometry.depth * 0.6;  // m (conservative 60% height)

    // Worst normal-case load values
    const worstPier = [...pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
    const worstAbt  = [...abt.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];

    // Reconstruct friction resistance from normal-case FOS
    // sliding_resistance = FOS_normal × H_normal (since FOS = R / H)
    const H_pier_normal = pier.loads.totalHorizontalForce;
    const H_abt_normal  = (abt.loads as { earthPressure?: number; waterPressure?: number })?.earthPressure ?? H_pier_normal * 0.8;

    const R_pier_friction = worstPier.slidingFOS * H_pier_normal;
    const R_abt_friction  = worstAbt.slidingFOS  * H_abt_normal;

    // Seismic sliding FOS (IRC:6 Cl. 219 — horizontal seismic force adds to driving force)
    const FOS_pier_slide_seismic = R_pier_friction / (H_pier_normal + Feq_pier);
    const FOS_abt_slide_seismic  = R_abt_friction  / (H_abt_normal  + Feq_abt);

    // Seismic overturning FOS
    // M_resist = FOS_OT_normal × M_overturn_normal
    // M_overturn_seismic = M_overturn_normal + Feq × arm
    const M_overturn_pier_normal  = worstPier.overturningFOS > 0 ? 1.0 : 0; // relative unit
    const M_resist_pier           = worstPier.overturningFOS; // = M_resist / M_OT → ratio
    const seismicOTRatio_pier     = (Feq_pier * pierArm) / (W_pier * (pier.geometry.baseWidth / 2));
    const FOS_pier_OT_seismic     = worstPier.overturningFOS / (1 + seismicOTRatio_pier);

    const seismicOTRatio_abt      = (Feq_abt  * pierArm) / (W_abt  * (draft.abutmentWidth / 2));
    const FOS_abt_OT_seismic      = worstAbt.overturningFOS / (1 + seismicOTRatio_abt);

    // Void unused variables
    void M_overturn_pier_normal; void M_resist_pier;

    // Zone comparison table (all zones)
    const zoneComparison = Object.keys(ZONE_FACTORS).map(z => {
      const Zi   = ZONE_FACTORS[z];
      const Ahi  = (Zi / 2) * SaG * (importance / R);
      const Feqi = Ahi * W_pier;
      const fosP = R_pier_friction / (H_pier_normal + Feqi);
      const fosA = R_abt_friction  / (H_abt_normal  + Ahi * W_abt);
      return { zone: z, Ah: Ahi, pierFOS: fosP, abtFOS: fosA };
    });

    const pierSlideOK = FOS_pier_slide_seismic >= 1.25;
    const abtSlideOK  = FOS_abt_slide_seismic  >= 1.25;
    const pierOTOK    = FOS_pier_OT_seismic     >= 1.50;
    const abtOTOK     = FOS_abt_OT_seismic      >= 1.50;
    const overallOK   = pierSlideOK && abtSlideOK && pierOTOK && abtOTOK;
    const anyWarn     = [pierSlideOK, abtSlideOK, pierOTOK, abtOTOK].filter(Boolean).length >= 2;
    const verdict: SeisStatus = overallOK ? 'PASS' : anyWarn ? 'WARN' : 'FAIL';

    return {
      Z, T, SaG, Ah, Feq_pier, Feq_abt, pierArm,
      FOS_pier_slide_seismic, FOS_abt_slide_seismic,
      FOS_pier_OT_seismic, FOS_abt_OT_seismic,
      pierSlideOK, abtSlideOK, pierOTOK, abtOTOK,
      verdict, zoneComparison, W_pier, W_abt,
    };
  }, [zone, soilType, importance, R, draft, results]);

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">

      {/* ── HEADER ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-app-accent" />
          <h3 className="text-base font-semibold text-app-fg">Seismic Zone Check</h3>
          <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">
            IRC:6-2016 Cl. 219
          </span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sBadge(calc.verdict)}`}>
            {calc.verdict}
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

          {/* Zone */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Seismic Zone</p>
            <div className="flex gap-1">
              {['II', 'III', 'IV', 'V'].map(z => (
                <button key={z} onClick={() => setZone(z)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    zone === z
                      ? 'bg-app-accent text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Soil type */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Soil Type</p>
            <div className="flex gap-1">
              {(['I', 'II', 'III'] as const).map(s => (
                <button key={s} onClick={() => setSoilType(s)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    soilType === s
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {soilType === 'I' ? 'Hard rock / rocky' : soilType === 'II' ? 'Medium / alluvium' : 'Soft / loose'}
            </p>
          </div>

          {/* Importance */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Importance (I)</p>
            <div className="flex gap-1">
              {([1.0, 1.5] as const).map(v => (
                <button key={v} onClick={() => setImportance(v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    importance === v
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {v.toFixed(1)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {importance === 1.0 ? 'Normal bridge' : 'Important / NH / expressway'}
            </p>
          </div>

          {/* R factor */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-app-muted">Response Factor (R)</p>
            <div className="flex gap-1">
              {[2.0, 3.0].map(v => (
                <button key={v} onClick={() => setR(v)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    R === v
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'border border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:text-app-fg'
                  }`}>
                  {v.toFixed(1)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[9px] text-app-muted">
              {R === 3.0 ? 'Ductile detailing (IRC:112)' : 'Non-ductile RCC pier'}
            </p>
          </div>
        </div>

        {/* ── SEISMIC PARAMETERS ── */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Zone factor Z',         value: calc.Z.toFixed(2),              color: 'text-app-accent' },
            { label: 'Period T',              value: `${calc.T.toFixed(3)} s`,         color: 'text-violet-400' },
            { label: 'Spectral acc. Sa/g',    value: calc.SaG.toFixed(3),             color: 'text-cyan-400' },
            { label: 'Design acc. Ah',        value: calc.Ah.toFixed(4),              color: 'text-amber-400' },
            { label: 'Pier seismic force',    value: `${calc.Feq_pier.toFixed(1)} kN`, color: 'text-rose-400' },
            { label: 'Abt seismic force',     value: `${calc.Feq_abt.toFixed(1)} kN`,  color: 'text-rose-400' },
            { label: 'Seismic weight (pier)', value: `${calc.W_pier.toFixed(0)} kN`,   color: 'text-app-muted' },
            { label: 'Pier arm (seismic)',    value: `${calc.pierArm.toFixed(2)} m`,    color: 'text-app-muted' },
          ].map(p => (
            <div key={p.label} className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/40 p-3">
              <p className="text-[10px] text-app-muted">{p.label}</p>
              <p className={`mt-1 text-sm font-bold font-mono ${p.color}`}>{p.value}</p>
            </div>
          ))}
        </div>

        {/* ── FOS CHECK TABLE ── */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] bg-app-card/70">
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Seismic stability check</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Computed FOS</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Status</th>
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="Pier sliding FOS (seismic)"
                value={calc.FOS_pier_slide_seismic.toFixed(3)}
                status={calc.pierSlideOK ? 'PASS' : 'FAIL'}
                note={`≥ 1.25 req. (IRC:6-2016 Cl. 219) · normal = ${results.pier.loadCases.sort((a,b)=>a.slidingFOS-b.slidingFOS)[0]?.slidingFOS.toFixed(2)}`}
              />
              <Row
                label="Pier overturning FOS (seismic)"
                value={calc.FOS_pier_OT_seismic.toFixed(3)}
                status={calc.pierOTOK ? 'PASS' : 'FAIL'}
                note={`≥ 1.50 req. (IRC:6-2016 Cl. 219) · normal = ${results.pier.loadCases.sort((a,b)=>a.overturningFOS-b.overturningFOS)[0]?.overturningFOS.toFixed(2)}`}
              />
              <Row
                label="Abutment sliding FOS (seismic)"
                value={calc.FOS_abt_slide_seismic.toFixed(3)}
                status={calc.abtSlideOK ? 'PASS' : 'FAIL'}
                note={`≥ 1.25 req. · normal = ${results.abutmentType1.loadCases.sort((a,b)=>a.slidingFOS-b.slidingFOS)[0]?.slidingFOS.toFixed(2)}`}
              />
              <Row
                label="Abutment overturning FOS (seismic)"
                value={calc.FOS_abt_OT_seismic.toFixed(3)}
                status={calc.abtOTOK ? 'PASS' : 'FAIL'}
                note={`≥ 1.50 req. · normal = ${results.abutmentType1.loadCases.sort((a,b)=>a.overturningFOS-b.overturningFOS)[0]?.overturningFOS.toFixed(2)}`}
              />
            </tbody>
          </table>
        </div>

        {/* ── ZONE COMPARISON TABLE ── */}
        <div className="mb-4 overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
          <p className="border-b border-[var(--app-glass-border)] bg-app-card/70 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-app-muted">
            Zone comparison — same soil type ({soilType}) and importance (I = {importance.toFixed(1)})
          </p>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--app-glass-border)] bg-app-card/60">
                <th className="px-3 py-2 text-[11px] font-bold text-app-muted">Zone</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Z</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Ah</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Pier slide FOS</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Abt slide FOS</th>
                <th className="px-3 py-2 text-center text-[11px] font-bold text-app-muted">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {calc.zoneComparison.map(zc => (
                <ZoneRow key={zc.zone} {...zc} active={zc.zone === zone} />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── IRC METHOD NOTE ── */}
        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/30 p-3 text-[11px] text-app-muted space-y-1">
          <div className="flex gap-2 items-start">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
            <span>
              <strong className="text-app-fg">Method:</strong> Seismic Coefficient Method per IRC:6-2016 Cl. 219.5.1.
              Ah = (Z/2) × (Sa/g) × (I/R) = ({calc.Z.toFixed(2)}/2) × {calc.SaG.toFixed(3)} × ({importance.toFixed(1)}/{R.toFixed(1)}) = <strong className="text-app-accent">{calc.Ah.toFixed(4)}</strong>.
              Time period T = {calc.T.toFixed(3)} s (pier cantilever, Annex D).
            </span>
          </div>
          <div className="flex gap-2 items-start">
            {calc.verdict === 'PASS'
              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
              : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />}
            <span>
              <strong className="text-app-fg">Reduced FOS limits (seismic):</strong> sliding ≥ 1.25 (vs 1.5 normal), overturning ≥ 1.50 (vs 1.8 normal) per IRC:6-2016 Cl. 219.5.
              {draft.location && <> Location <em>{draft.location}</em> defaulted to Zone {guessZone(draft.location, draft.riverName ?? '')}.</>}
            </span>
          </div>
          <div className="flex gap-2 items-start">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-app-muted" />
            <span>
              Rajasthan reference: most Rajasthan districts fall in <strong className="text-app-fg">Zone II</strong> (Z=0.10); Jaipur, Alwar, Sawai Madhopur in <strong className="text-app-fg">Zone III</strong> (Z=0.16) per BIS IS:1893.
            </span>
          </div>
        </div>

      </>)}
    </section>
  );
}
