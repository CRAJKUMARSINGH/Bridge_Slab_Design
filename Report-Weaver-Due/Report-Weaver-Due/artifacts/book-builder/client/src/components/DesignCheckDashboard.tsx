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
