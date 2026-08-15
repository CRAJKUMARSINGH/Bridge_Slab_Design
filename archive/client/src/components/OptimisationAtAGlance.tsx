import type { CompleteDesignResult, ProjectInput } from '../../../bridge-excel-generator/types';

type Props = {
  draft: ProjectInput;
  results: CompleteDesignResult | null;
  onApply: (updates: Partial<ProjectInput>) => void;
};

type Suggestion = {
  id: string;
  title: string;
  reason: string;
  updates: Partial<ProjectInput>;
};

function hasUnsafe(statuses: string[]): boolean {
  return statuses.includes('UNSAFE');
}

function hasCheck(statuses: string[]): boolean {
  return statuses.includes('CHECK');
}

export function OptimisationAtAGlance({ draft, results, onApply }: Props) {
  if (!results) return null;

  const hyd = results.hydraulics;
  const providedWaterway = draft.numberOfSpans * draft.spanLength;
  const regimeWaterway = hyd.regimeWidth;
  const effectiveWaterway = hyd.effectiveWaterway;
  const targetWaterway = regimeWaterway * 0.98;
  const spanLengthSafe = Math.max(0.1, draft.spanLength);
  const recommendedSpans = Math.max(1, Math.ceil(targetWaterway / spanLengthSafe));

  const pierStatuses = results.pier.loadCases.map((lc) => lc.status);
  const abtType1Statuses = results.abutmentType1.loadCases.map((lc) => lc.status);
  const abtC1Statuses = results.abutmentC1.loadCases.map((lc) => lc.status);
  const hasAnyUnsafe = hasUnsafe(pierStatuses) || hasUnsafe(abtType1Statuses) || hasUnsafe(abtC1Statuses);
  const hasAnyCheck = hasCheck(pierStatuses) || hasCheck(abtType1Statuses) || hasCheck(abtC1Statuses);

  const suggestions: Suggestion[] = [];

  if (recommendedSpans !== draft.numberOfSpans && recommendedSpans <= 16) {
    suggestions.push({
      id: 'span-count',
      title: `Adjust spans to ${recommendedSpans}`,
      reason: `Regime width ${regimeWaterway.toFixed(2)} m vs provided ${providedWaterway.toFixed(2)} m`,
      updates: { numberOfSpans: recommendedSpans, totalLength: recommendedSpans * draft.spanLength },
    });
  }

  if (hyd.afflux > 0.3 && draft.spanLength <= 18) {
    const nextSpanLength = Math.min(20, Math.round((draft.spanLength + 1) * 10) / 10);
    suggestions.push({
      id: 'span-length',
      title: `Increase span length to ${nextSpanLength.toFixed(1)} m`,
      reason: `Afflux is ${hyd.afflux.toFixed(3)} m (target <= 0.300 m)`,
      updates: { spanLength: nextSpanLength, totalLength: nextSpanLength * draft.numberOfSpans },
    });
  }

  if (hasAnyUnsafe && draft.pierBaseWidth <= 3.5) {
    const next = Math.round((draft.pierBaseWidth + 0.2) * 10) / 10;
    suggestions.push({
      id: 'pier-base-width',
      title: `Increase pier base width to ${next.toFixed(1)} m`,
      reason: 'One or more stability cases are UNSAFE; wider footing often improves bearing/sliding reserve',
      updates: { pierBaseWidth: next },
    });
  }

  if (hasAnyCheck && !hasAnyUnsafe && draft.sbc < 450) {
    const nextSbc = Math.round((draft.sbc + 25) * 10) / 10;
    suggestions.push({
      id: 'soil-sensitivity',
      title: `Run sensitivity at SBC ${nextSbc.toFixed(0)} kPa`,
      reason: 'CHECK statuses present; quick sensitivity run can confirm robustness',
      updates: { sbc: nextSbc },
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-app-fg text-base font-semibold">Optimisation At A Glance</h3>
        <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-3 py-1 text-xs text-app-muted">
          Repo B additive panel
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Provided waterway" value={`${providedWaterway.toFixed(2)} m`} />
        <Metric label="Regime waterway" value={`${regimeWaterway.toFixed(2)} m`} />
        <Metric label="Effective waterway" value={`${effectiveWaterway.toFixed(2)} m`} />
        <Metric label="Afflux" value={`${hyd.afflux.toFixed(3)} m`} />
      </div>

      <div className="mt-4 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">Suggested quick actions</p>
        {suggestions.length === 0 ? (
          <p className="text-sm text-emerald-500">No immediate auto-tuning action needed based on current checks.</p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-app-fg">{s.title}</p>
                  <p className="text-xs text-app-muted">{s.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onApply(s.updates)}
                  className="rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-3">
      <p className="text-xs text-app-muted">{label}</p>
      <p className="text-app-fg mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
