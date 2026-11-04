import type { CompleteDesignResult, ProjectInput } from '../../../bridge-excel-generator/types';

type Props = {
  draft: ProjectInput;
  results: CompleteDesignResult | null;
  onApply: (updates: Partial<ProjectInput>) => void;
};

type Trial = {
  spans: number;
  spanLength: number;
  providedWaterway: number;
  affluxEstimate: number;
  targetWaterwayOk: boolean;
};

function estimateAfflux(currentAfflux: number, currentWaterway: number, trialWaterway: number): number {
  const safeCurrent = Math.max(currentWaterway, 0.1);
  const ratio = safeCurrent / Math.max(trialWaterway, 0.1);
  return currentAfflux * ratio * ratio;
}

function buildHydraulicsTrials(draft: ProjectInput, results: CompleteDesignResult): Trial[] {
  const hyd = results.hydraulics;
  const currentWaterway = Math.max(draft.numberOfSpans * draft.spanLength, 0.1);
  const currentAfflux = hyd.afflux;
  const targetWaterway = hyd.regimeWidth * 0.98;
  const trials: Trial[] = [];
  const spanLengths = [draft.spanLength - 1, draft.spanLength, draft.spanLength + 1, draft.spanLength + 2]
    .map((v) => Math.round(v * 10) / 10)
    .filter((v, idx, arr) => v >= 5 && v <= 20 && arr.indexOf(v) === idx);

  for (const spanLength of spanLengths) {
    for (let spans = Math.max(1, draft.numberOfSpans - 1); spans <= draft.numberOfSpans + 3; spans += 1) {
      const providedWaterway = spans * spanLength;
      const affluxEstimate = estimateAfflux(currentAfflux, currentWaterway, providedWaterway);
      const targetWaterwayOk = providedWaterway >= targetWaterway;
      trials.push({ spans, spanLength, providedWaterway, affluxEstimate, targetWaterwayOk });
    }
  }

  return trials
    .sort((a, b) => a.providedWaterway - b.providedWaterway)
    .slice(0, 10);
}

function statusTone(statuses: Array<'SAFE' | 'UNSAFE' | 'CHECK'>): 'ok' | 'warn' | 'fail' {
  if (statuses.some((s) => s === 'UNSAFE')) return 'fail';
  if (statuses.some((s) => s === 'CHECK')) return 'warn';
  return 'ok';
}

function nextPierFooting(draft: ProjectInput, tone: 'ok' | 'warn' | 'fail') {
  if (tone === 'ok') {
    return {
      pierBaseWidth: Math.max(1.2, Math.round((draft.pierBaseWidth - 0.1) * 10) / 10),
      pierBaseLength: Math.max(2.0, Math.round((draft.pierBaseLength - 0.2) * 10) / 10),
      mode: 'economy' as const,
    };
  }
  if (tone === 'warn') {
    return {
      pierBaseWidth: Math.round((draft.pierBaseWidth + 0.1) * 10) / 10,
      pierBaseLength: Math.round((draft.pierBaseLength + 0.2) * 10) / 10,
      mode: 'stabilize' as const,
    };
  }
  return {
    pierBaseWidth: Math.round((draft.pierBaseWidth + 0.2) * 10) / 10,
    pierBaseLength: Math.round((draft.pierBaseLength + 0.4) * 10) / 10,
    mode: 'strengthen' as const,
  };
}

function nextAbutmentBase(draft: ProjectInput, tone: 'ok' | 'warn' | 'fail') {
  if (tone === 'ok') {
    return {
      abutmentWidth: Math.max(1.0, Math.round((draft.abutmentWidth - 0.1) * 10) / 10),
      abutmentDepth: Math.max(1.0, Math.round((draft.abutmentDepth - 0.1) * 10) / 10),
      mode: 'economy' as const,
    };
  }
  if (tone === 'warn') {
    return {
      abutmentWidth: Math.round((draft.abutmentWidth + 0.1) * 10) / 10,
      abutmentDepth: Math.round((draft.abutmentDepth + 0.1) * 10) / 10,
      mode: 'stabilize' as const,
    };
  }
  return {
    abutmentWidth: Math.round((draft.abutmentWidth + 0.2) * 10) / 10,
    abutmentDepth: Math.round((draft.abutmentDepth + 0.2) * 10) / 10,
    mode: 'strengthen' as const,
  };
}

export function ModelOptimisersPanel({ draft, results, onApply }: Props) {
  if (!results) return null;

  const hydTrials = buildHydraulicsTrials(draft, results);
  const hydBest = hydTrials.find((t) => t.targetWaterwayOk && t.affluxEstimate <= 0.3) ?? hydTrials[hydTrials.length - 1];
  const pierTone = statusTone(results.pier.loadCases.map((lc) => lc.status));
  const abutTone = statusTone([
    ...results.abutmentType1.loadCases.map((lc) => lc.status),
    ...results.abutmentC1.loadCases.map((lc) => lc.status),
  ]);
  const pierNext = nextPierFooting(draft, pierTone);
  const abutNext = nextAbutmentBase(draft, abutTone);

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-app-fg text-base font-semibold">Model Optimisers (Repo B port)</h3>
        <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-3 py-1 text-xs text-app-muted">
          Hydraulics / Pier / Abutment
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">Hydraulics optimiser</p>
          <p className="mb-2 text-xs text-app-muted">
            Trial grid from current model. Estimated afflux follows a relative waterway scaling from current engine output.
          </p>
          <div className="max-h-44 overflow-auto rounded-lg border border-[var(--app-glass-border)]">
            <table className="w-full text-xs">
              <thead className="bg-app-card/70 text-app-muted">
                <tr>
                  <th className="px-2 py-1 text-left">Spans</th>
                  <th className="px-2 py-1 text-left">L (m)</th>
                  <th className="px-2 py-1 text-left">Waterway</th>
                  <th className="px-2 py-1 text-left">Afflux est.</th>
                </tr>
              </thead>
              <tbody>
                {hydTrials.map((t) => (
                  <tr key={`${t.spans}-${t.spanLength}`} className="border-t border-[var(--app-glass-border)]">
                    <td className="px-2 py-1 text-app-fg">{t.spans}</td>
                    <td className="px-2 py-1 text-app-fg">{t.spanLength.toFixed(1)}</td>
                    <td className="px-2 py-1 text-app-fg">{t.providedWaterway.toFixed(2)}</td>
                    <td className="px-2 py-1 text-app-fg">{t.affluxEstimate.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hydBest && (
            <button
              type="button"
              onClick={() =>
                onApply({
                  numberOfSpans: hydBest.spans,
                  spanLength: hydBest.spanLength,
                  totalLength: hydBest.spans * hydBest.spanLength,
                })
              }
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
            >
              Apply best hydraulics trial
            </button>
          )}
        </div>

        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">Pier optimiser</p>
          <p className="text-xs text-app-muted">
            Current status: <span className="text-app-fg">{pierTone.toUpperCase()}</span>. Proposed update mode:{' '}
            <span className="text-app-fg">{pierNext.mode}</span>.
          </p>
          <div className="mt-3 rounded-lg border border-[var(--app-glass-border)] bg-app-card/50 p-3 text-xs">
            <p className="text-app-muted">Base width: <span className="text-app-fg">{draft.pierBaseWidth.toFixed(2)} m ? {pierNext.pierBaseWidth.toFixed(2)} m</span></p>
            <p className="text-app-muted">Base length: <span className="text-app-fg">{draft.pierBaseLength.toFixed(2)} m ? {pierNext.pierBaseLength.toFixed(2)} m</span></p>
          </div>
          <button
            type="button"
            onClick={() =>
              onApply({
                pierBaseWidth: pierNext.pierBaseWidth,
                pierBaseLength: pierNext.pierBaseLength,
              })
            }
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
          >
            Apply pier optimiser update
          </button>
        </div>

        <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-muted">Abutment optimiser</p>
          <p className="text-xs text-app-muted">
            Current status: <span className="text-app-fg">{abutTone.toUpperCase()}</span>. Proposed update mode:{' '}
            <span className="text-app-fg">{abutNext.mode}</span>.
          </p>
          <div className="mt-3 rounded-lg border border-[var(--app-glass-border)] bg-app-card/50 p-3 text-xs">
            <p className="text-app-muted">Abutment width: <span className="text-app-fg">{draft.abutmentWidth.toFixed(2)} m ? {abutNext.abutmentWidth.toFixed(2)} m</span></p>
            <p className="text-app-muted">Abutment depth: <span className="text-app-fg">{draft.abutmentDepth.toFixed(2)} m ? {abutNext.abutmentDepth.toFixed(2)} m</span></p>
          </div>
          <button
            type="button"
            onClick={() =>
              onApply({
                abutmentWidth: abutNext.abutmentWidth,
                abutmentDepth: abutNext.abutmentDepth,
              })
            }
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white hover:brightness-110"
          >
            Apply abutment optimiser update
          </button>
        </div>
      </div>
    </section>
  );
}
