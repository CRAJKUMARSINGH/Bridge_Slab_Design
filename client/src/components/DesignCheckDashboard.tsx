import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { CompleteDesignResult, ProjectInput } from '../../../bridge-excel-generator/types';

type Props = {
  draft: ProjectInput;
  results: CompleteDesignResult | null;
};

type StatusTone = 'ok' | 'warn' | 'fail';

function toneForLoadCases(statuses: string[]): StatusTone {
  if (statuses.some((s) => s === 'UNSAFE')) return 'fail';
  if (statuses.some((s) => s === 'CHECK')) return 'warn';
  return 'ok';
}

function barColor(tone: StatusTone): string {
  if (tone === 'ok') return 'rgb(16 185 129)';
  if (tone === 'warn') return 'rgb(245 158 11)';
  return 'rgb(239 68 68)';
}

export function DesignCheckDashboard({ draft, results }: Props) {
  if (!results) return null;

  const hyd = results.hydraulics;
  const pierStatuses = results.pier.loadCases.map((lc) => lc.status);
  const abtType1Statuses = results.abutmentType1.loadCases.map((lc) => lc.status);
  const abtC1Statuses = results.abutmentC1.loadCases.map((lc) => lc.status);

  const pierTone = toneForLoadCases(pierStatuses);
  const abtType1Tone = toneForLoadCases(abtType1Statuses);
  const abtC1Tone = toneForLoadCases(abtC1Statuses);

  const recommendedSpans = Math.max(1, Math.ceil(hyd.regimeWidth / Math.max(0.1, draft.spanLength)));
  const spanDelta = recommendedSpans - draft.numberOfSpans;
  const affluxTone: StatusTone = hyd.afflux <= 0.3 ? 'ok' : hyd.afflux <= 0.45 ? 'warn' : 'fail';
  const flowTone: StatusTone = hyd.flowType.toLowerCase().includes('subcritical') ? 'ok' : 'warn';

  const totals = [
    draft.numberOfSpans * draft.spanLength,
    hyd.regimeWidth,
    hyd.effectiveWaterway,
  ];
  const maxVal = Math.max(...totals, 1);

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-app-fg text-base font-semibold">Design Check Dashboard</h3>
        <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-3 py-1 text-xs text-app-muted">
          Repo B additive panel
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Flow Regime" value={hyd.flowType} tone={flowTone} detail={`Fr ${hyd.froudeNumber.toFixed(3)}`} />
        <MetricCard title="Afflux" value={`${hyd.afflux.toFixed(3)} m`} tone={affluxTone} detail={`DWL ${hyd.designWaterLevel.toFixed(3)} m`} />
        <MetricCard
          title="Span Guidance"
          value={`${recommendedSpans} spans`}
          tone={spanDelta === 0 ? 'ok' : spanDelta > 0 ? 'warn' : 'ok'}
          detail={spanDelta === 0 ? 'Current matches regime width' : `${spanDelta > 0 ? '+' : ''}${spanDelta} vs current`}
        />
        <MetricCard
          title="Effective Waterway"
          value={`${hyd.effectiveWaterway.toFixed(2)} m`}
          tone={hyd.effectiveWaterway >= hyd.regimeWidth * 0.95 ? 'ok' : 'warn'}
          detail={`Regime ${hyd.regimeWidth.toFixed(2)} m`}
        />
        {draft.bridgeType === 'high-level' && (
          <>
            <MetricCard
              title="Clearance above HFL"
              value={`${hyd.freeboardAboveHfl?.toFixed(3) ?? '—'} m`}
              tone={hyd.isFreeboardSafe ? 'ok' : 'fail'}
              detail={
                hyd.isFreeboardSafe
                  ? `Required ≥ ${(hyd.requiredFreeboardAboveHfl ?? draft.freeboardAboveHfl ?? 1.2).toFixed(2)} m (IRC Q + project)`
                  : `Need ≥ ${(hyd.requiredFreeboardAboveHfl ?? draft.freeboardAboveHfl ?? 1.2).toFixed(2)} m above HFL`
              }
            />
            <MetricCard
              title="Clearance above DWL"
              value={`${hyd.freeboard?.toFixed(3) ?? '—'} m`}
              tone={
                typeof hyd.freeboard === 'number' && hyd.freeboard < 0.3
                  ? 'warn'
                  : 'ok'
              }
              detail="Soffit − design water level (HFL + afflux)"
            />
            {typeof results.pier.loads?.windForce === 'number' && results.pier.loads.windForce > 0 && (
              <MetricCard
                title="Wind on pier (screening)"
                value={`${results.pier.loads.windForce.toFixed(1)} kN`}
                tone="ok"
                detail="Included in lateral stability model"
              />
            )}
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">Critical check status</p>
          <StatusRow label="Pier load cases" statuses={pierStatuses} tone={pierTone} />
          <StatusRow label="Abutment Type-1 cases" statuses={abtType1Statuses} tone={abtType1Tone} />
          <StatusRow label="Abutment C1 cases" statuses={abtC1Statuses} tone={abtC1Tone} />
        </div>

        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">Waterway comparison</p>
          <svg viewBox="0 0 380 120" className="h-[120px] w-full">
            {[
              { label: 'Provided', value: totals[0], y: 20, tone: 'rgb(56 189 248)' },
              { label: 'Regime', value: totals[1], y: 52, tone: 'rgb(168 85 247)' },
              { label: 'Effective', value: totals[2], y: 84, tone: 'rgb(34 197 94)' },
            ].map((b) => {
              const w = (b.value / maxVal) * 240;
              return (
                <g key={b.label}>
                  <text x="8" y={b.y + 10} fontSize="10" fill="currentColor" className="text-app-muted">
                    {b.label}
                  </text>
                  <rect x="110" y={b.y} width={w} height="18" rx="4" fill={b.tone} opacity="0.9" />
                  <text x={115 + w} y={b.y + 12} fontSize="10" fill="currentColor" className="text-app-fg">
                    {b.value.toFixed(2)} m
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}

// ─── UTILIZATION RATIO GAUGES ────────────────────────────────────────────────

function ArcGauge({
  label, value, max, unit, required, reverse = false,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  required?: number;
  reverse?: boolean;
}) {
  const pct    = Math.min(1, value / max);
  const margin = required != null ? (value - required) / required : null;

  let tone: StatusTone;
  if (reverse) {
    tone = value <= max * 0.8 ? 'ok' : value <= max ? 'warn' : 'fail';
  } else {
    tone = margin == null ? 'ok' : margin >= 0.2 ? 'ok' : margin >= 0 ? 'warn' : 'fail';
  }

  const r   = 28;
  const cx  = 40;
  const cy  = 40;
  const circumference = Math.PI * r;
  const arcLen = pct * circumference;
  const fill  = barColor(tone);

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-3">
      <svg viewBox="0 0 80 48" className="h-12 w-20">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="currentColor" strokeWidth="7"
          className="text-app-card/80"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={fill} strokeWidth="7"
          strokeDasharray={`${arcLen} ${circumference}`}
          strokeLinecap="round"
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="10" fill={fill} fontWeight="bold">
          {value.toFixed(2)}
        </text>
        {unit && (
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="currentColor" className="text-app-muted">
            {unit}
          </text>
        )}
      </svg>
      <p className="text-center text-[10px] font-semibold text-app-fg leading-tight">{label}</p>
      {required != null && (
        <p className="text-[10px] text-app-muted">
          {value >= required ? '✓' : '✗'} req ≥ {required}
        </p>
      )}
    </div>
  );
}

function UtilizationGauges({ draft, results }: { draft: ProjectInput; results: CompleteDesignResult }) {
  const hyd  = results.hydraulics;
  const pier = results.pier;

  const worstPier = [...pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
  const worstAbt  = [...results.abutmentType1.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
  const isHL      = draft.bridgeType === 'high-level';
  const affluxLim = isHL ? 0.5 : 0.3;
  const laceyW    = 4.75 * Math.sqrt(draft.discharge ?? 0);
  const provided  = draft.numberOfSpans * draft.spanLength;
  const wRatio    = laceyW > 0 ? provided / laceyW : 1;

  return (
    <div className="mt-5 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-muted">Utilization ratio gauges</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {worstPier && (
          <>
            <ArcGauge label="Pier Sliding FOS" value={worstPier.slidingFOS}   max={4} required={1.5} />
            <ArcGauge label="Pier Overturn FOS" value={worstPier.overturningFOS} max={5} required={1.8} />
            <ArcGauge label="Pier Bearing FOS"  value={worstPier.bearingFOS}  max={6} required={2.5} />
          </>
        )}
        {worstAbt && (
          <ArcGauge label="Abt Sliding FOS"  value={worstAbt.slidingFOS}   max={4} required={1.5} />
        )}
        <ArcGauge
          label="Afflux / Limit"
          value={hyd.afflux}
          max={affluxLim}
          unit={`of ${affluxLim} m`}
          reverse
        />
        <ArcGauge
          label="Waterway / Lacey"
          value={wRatio}
          max={1.5}
          unit={`${(wRatio * 100).toFixed(0)}%`}
        />
      </div>
    </div>
  );
}

export function UtilizationGaugesPanel({ draft, results }: { draft: ProjectInput; results: CompleteDesignResult }) {
  if (!results) return null;
  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      <h3 className="mb-1 text-base font-semibold text-app-fg">Factor of Safety — Utilization Ratios</h3>
      <p className="mb-4 text-xs text-app-muted">Visual capacity gauges for critical IRC stability checks. Arc fills to actual value; colour indicates margin vs required minimum.</p>
      <UtilizationGauges draft={draft} results={results} />
    </section>
  );
}

// ─── IRC CLAUSE REFERENCE PANEL ──────────────────────────────────────────────

type ClauseStatus = 'PASS' | 'WARN' | 'FAIL' | 'N/A';

interface IrcClause {
  code: string;
  clause: string;
  description: string;
  computed: string;
  limit: string;
  status: ClauseStatus;
}

function clauseColor(s: ClauseStatus): string {
  if (s === 'PASS') return 'rgb(16 185 129)';
  if (s === 'WARN') return 'rgb(245 158 11)';
  if (s === 'FAIL') return 'rgb(239 68 68)';
  return 'rgb(100 116 139)';
}

function buildIrcClauses(draft: ProjectInput, results: CompleteDesignResult): IrcClause[] {
  const hyd  = results.hydraulics;
  const isHL = draft.bridgeType === 'high-level';
  const clauses: IrcClause[] = [];

  // IRC SP-13 / IRC:6 — Afflux
  const affluxLimit = isHL ? 0.5 : 0.3;
  clauses.push({
    code: isHL ? 'IRC:6-2016' : 'IRC SP-13',
    clause: isHL ? 'Cl. 214.1' : 'Cl. 5.3',
    description: 'Afflux at bridge site',
    computed: `${hyd.afflux.toFixed(3)} m`,
    limit: `≤ ${affluxLimit} m`,
    status: hyd.afflux <= affluxLimit ? 'PASS' : hyd.afflux <= affluxLimit * 1.15 ? 'WARN' : 'FAIL',
  });

  // IRC SP-13 Cl. 4.2 — Lacey's waterway
  const laceyW  = 4.75 * Math.sqrt(draft.discharge ?? 0);
  const provided = draft.numberOfSpans * draft.spanLength;
  const wRatio  = provided / Math.max(laceyW, 1);
  clauses.push({
    code: 'IRC SP-13',
    clause: 'Cl. 4.2',
    description: "Lacey's linear waterway — provided vs regime",
    computed: `${provided.toFixed(1)} m`,
    limit: `≥ ${(0.9 * laceyW).toFixed(1)} m (90% of ${laceyW.toFixed(1)} m)`,
    status: wRatio >= 0.9 ? 'PASS' : wRatio >= 0.75 ? 'WARN' : 'FAIL',
  });

  // IRC:78-1983 Cl. 706.1 — Scour depth / foundation below scour
  const scourDepth = hyd.scourDepth ?? (1.34 * Math.pow((draft.discharge ?? 0) / Math.max(draft.numberOfSpans, 1), 0.33) * Math.pow(1 / Math.max(draft.laceysSiltFactor ?? 1.5, 0.1), 0.33));
  const bed        = draft.bedLevel ?? 0;
  const found      = draft.foundationLevel ?? 0;
  const depthBelowScour = bed - scourDepth - found;
  clauses.push({
    code: 'IRC:78-1983',
    clause: 'Cl. 706.1',
    description: 'Foundation depth below design scour level',
    computed: `${depthBelowScour.toFixed(2)} m below scour`,
    limit: '≥ 1.2 m (soft rock) / 2.0 m (hard rock)',
    status: depthBelowScour >= 1.2 ? 'PASS' : depthBelowScour >= 0.6 ? 'WARN' : 'FAIL',
  });

  // IRC:112-2015 Cl. 14.3.2 — Minimum concrete grade
  const fckMin = 25;
  clauses.push({
    code: 'IRC:112-2015',
    clause: 'Cl. 14.3.2',
    description: 'Minimum concrete grade for bridge deck',
    computed: `M${draft.fck ?? 25}`,
    limit: `≥ M${fckMin}`,
    status: (draft.fck ?? 25) >= fckMin ? 'PASS' : 'FAIL',
  });

  // IRC:112-2015 Cl. 15.3 — Min pier width
  const pierWidthMin = 1.0;
  clauses.push({
    code: 'IRC:112-2015',
    clause: 'Cl. 15.3',
    description: 'Minimum pier width (structural)',
    computed: `${draft.pierWidth ?? 1.2} m`,
    limit: `≥ ${pierWidthMin} m`,
    status: (draft.pierWidth ?? 1.2) >= pierWidthMin ? 'PASS' : 'FAIL',
  });

  // Pier stability load cases
  const pierStatuses = results.pier.loadCases.map(lc => lc.status);
  const pierUnsafe = pierStatuses.filter(s => s === 'UNSAFE').length;
  const pierCheck  = pierStatuses.filter(s => s === 'CHECK').length;
  clauses.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 202.3',
    description: `Pier stability — ${pierStatuses.length} load combinations`,
    computed: `${pierStatuses.length - pierUnsafe - pierCheck} SAFE, ${pierCheck} CHECK, ${pierUnsafe} UNSAFE`,
    limit: 'All combinations SAFE',
    status: pierUnsafe > 0 ? 'FAIL' : pierCheck > 0 ? 'WARN' : 'PASS',
  });

  // Abutment stability
  const abtStatuses = results.abutmentType1.loadCases.map(lc => lc.status);
  const abtUnsafe = abtStatuses.filter(s => s === 'UNSAFE').length;
  const abtCheck  = abtStatuses.filter(s => s === 'CHECK').length;
  clauses.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 202.3',
    description: `Abutment stability — ${abtStatuses.length} load combinations`,
    computed: `${abtStatuses.length - abtUnsafe - abtCheck} SAFE, ${abtCheck} CHECK, ${abtUnsafe} UNSAFE`,
    limit: 'All combinations SAFE',
    status: abtUnsafe > 0 ? 'FAIL' : abtCheck > 0 ? 'WARN' : 'PASS',
  });

  // High-level: freeboard above HFL
  if (isHL) {
    const fb = hyd.freeboardAboveHfl ?? 0;
    const fbReq = hyd.requiredFreeboardAboveHfl ?? draft.freeboardAboveHfl ?? 1.2;
    clauses.push({
      code: 'IRC:5-2015',
      clause: 'Cl. 106.3',
      description: 'Freeboard — soffit above HFL',
      computed: `${fb.toFixed(3)} m`,
      limit: `≥ ${fbReq.toFixed(2)} m`,
      status: fb >= fbReq ? 'PASS' : fb >= fbReq * 0.9 ? 'WARN' : 'FAIL',
    });
  }

  // Carriageway width per IRC:5-2015
  const cwMin = draft.numberOfLanes === 1 ? 4.25 : 7.5;
  clauses.push({
    code: 'IRC:5-2015',
    clause: 'Cl. 112.1',
    description: `Carriageway width (${draft.numberOfLanes ?? 2}-lane bridge)`,
    computed: `${draft.carriageWidth} m`,
    limit: `≥ ${cwMin} m`,
    status: (draft.carriageWidth ?? 7.5) >= cwMin ? 'PASS' : 'FAIL',
  });

  return clauses;
}

export function IrcClausePanel({ draft, results }: { draft: ProjectInput; results: CompleteDesignResult }) {
  const clauses = buildIrcClauses(draft, results);
  const pass = clauses.filter(c => c.status === 'PASS').length;
  const warn = clauses.filter(c => c.status === 'WARN').length;
  const fail = clauses.filter(c => c.status === 'FAIL').length;
  const [exporting, setExporting] = useState(false);

  const exportChecklist = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/design/checklist/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error('Export failed');
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${draft.projectName.replace(/\s+/g, '_')}_IRC_Checklist.html`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch { /* silently fail */ } finally {
      setExporting(false);
    }
  };

  const verdict   = fail > 0 ? 'FAIL' : warn > 0 ? 'WARN' : 'PASS';
  const verdictCls = verdict === 'PASS' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                   : verdict === 'WARN' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                   : 'bg-red-500/15 text-red-400 border-red-500/30';

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-app-fg text-base font-semibold">IRC Code Compliance — Clause-by-Clause</h3>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${verdictCls}`}>
            {verdict}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs">
            <span style={{ color: clauseColor('PASS') }} className="font-semibold">{pass} PASS</span>
            {warn > 0 && <span style={{ color: clauseColor('WARN') }} className="font-semibold">{warn} WARN</span>}
            {fail > 0 && <span style={{ color: clauseColor('FAIL') }} className="font-semibold">{fail} FAIL</span>}
          </div>
          <button
            onClick={() => void exportChecklist()}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-3 py-1.5 text-[11px] font-semibold text-app-fg transition hover:border-app-accent/50 hover:text-app-accent disabled:opacity-60"
          >
            {exporting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FileDown className="h-3.5 w-3.5" />}
            Export QA Checklist
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--app-glass-border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--app-glass-border)] bg-app-card/70">
              <th className="px-3 py-2 text-left font-semibold text-app-muted w-24">Code</th>
              <th className="px-3 py-2 text-left font-semibold text-app-muted w-24">Clause</th>
              <th className="px-3 py-2 text-left font-semibold text-app-muted">Check</th>
              <th className="px-3 py-2 text-left font-semibold text-app-muted w-32">Computed</th>
              <th className="px-3 py-2 text-left font-semibold text-app-muted w-40">Limit</th>
              <th className="px-3 py-2 text-center font-semibold text-app-muted w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {clauses.map((c, i) => (
              <tr key={i} className="border-b border-[var(--app-glass-border)]/50 hover:bg-app-card/40">
                <td className="px-3 py-2 font-mono text-[10px] text-app-muted">{c.code}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-app-muted">{c.clause}</td>
                <td className="px-3 py-2 text-app-fg">{c.description}</td>
                <td className="px-3 py-2 font-mono text-app-fg">{c.computed}</td>
                <td className="px-3 py-2 text-app-muted">{c.limit}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: clauseColor(c.status) + '22', color: clauseColor(c.status) }}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[10px] text-app-muted">
        IRC:6-2016 · IRC:78-1983 · IRC SP-13 (2004) · IRC:112-2015 · IRC:5-2015. Engineer must verify all clauses against project-specific conditions.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: StatusTone;
}) {
  return (
    <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-3">
      <p className="text-xs text-app-muted">{title}</p>
      <p className="text-app-fg mt-1 text-sm font-semibold">{value}</p>
      <p className="mt-1 text-xs" style={{ color: barColor(tone) }}>
        {detail}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  statuses,
  tone,
}: {
  label: string;
  statuses: string[];
  tone: StatusTone;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="text-app-muted">{label}</span>
        <span className="font-mono" style={{ color: barColor(tone) }}>
          {statuses.join(', ')}
        </span>
      </div>
      <div className="h-2 rounded-full bg-app-card/80">
        <div className="h-2 rounded-full" style={{ width: '100%', background: barColor(tone) }} />
      </div>
    </div>
  );
}
