import { useMemo, useState } from 'react';
import type { ProjectInput, CompleteDesignResult } from '../../../bridge-excel-generator/types';
import { Waves, ArrowUpFromLine, GitCompare, ArrowRight, SplitSquareHorizontal, X } from 'lucide-react';
import { CompareModal } from './CompareModal';

type TemplateItem = { id: string; name: string; description: string; input: ProjectInput };

interface Match {
  template: TemplateItem;
  score: number;
  deltaQ: number;
  deltaWaterway: number;
  deltaSpans: number;
}

function similarity(a: ProjectInput, b: ProjectInput): number {
  let score = 0;
  if (a.bridgeType === b.bridgeType) score += 40;
  const qA = a.discharge ?? 0;
  const qB = b.discharge ?? 0;
  const qMax = Math.max(qA, qB, 1);
  score += 30 * (1 - Math.abs(qA - qB) / qMax);
  const wA = a.numberOfSpans * a.spanLength;
  const wB = b.numberOfSpans * b.spanLength;
  const wMax = Math.max(wA, wB, 1);
  score += 20 * (1 - Math.abs(wA - wB) / wMax);
  const sMax = Math.max(a.numberOfSpans, b.numberOfSpans, 1);
  score += 10 * (1 - Math.abs(a.numberOfSpans - b.numberOfSpans) / sMax);
  return score;
}

function DeltaBadge({ value, unit, label }: { value: number; unit: string; label: string }) {
  const pct   = Math.abs(value) / Math.max(Math.abs(value) + 1, 1);
  const color = pct < 0.2 ? 'text-emerald-400' : pct < 0.5 ? 'text-amber-400' : 'text-red-400';
  const sign  = value > 0 ? '+' : value < 0 ? '' : '';
  return (
    <span className="inline-flex flex-col items-center rounded-lg border border-[var(--app-glass-border)] bg-app-card/40 px-2.5 py-1.5 text-center">
      <span className={`text-[11px] font-bold ${color}`}>{sign}{value.toFixed(value % 1 === 0 ? 0 : 1)} {unit}</span>
      <span className="text-[9px] text-app-muted">{value > 0 ? '▲' : value < 0 ? '▼' : '='} {label}</span>
    </span>
  );
}

export function SimilarProjectsPanel({
  draft,
  templates,
  currentTemplateId,
  currentName,
  onLoad,
  engineResults,
}: {
  draft: ProjectInput;
  templates: TemplateItem[];
  currentTemplateId: string | null;
  currentName?: string;
  onLoad: (id: string) => void;
  engineResults?: CompleteDesignResult | null;
}) {
  const [pinned, setPinned] = useState<TemplateItem | null>(null);

  const matches = useMemo<Match[]>(() => {
    return templates
      .filter(t => t.id !== currentTemplateId)
      .map(t => ({
        template:     t,
        score:        similarity(draft, t.input),
        deltaQ:       (t.input.discharge ?? 0) - (draft.discharge ?? 0),
        deltaWaterway:(t.input.numberOfSpans * t.input.spanLength) - (draft.numberOfSpans * draft.spanLength),
        deltaSpans:   t.input.numberOfSpans - draft.numberOfSpans,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [draft, templates, currentTemplateId]);

  if (matches.length === 0) return null;

  const typeLabel = (t: TemplateItem) =>
    t.input.bridgeType === 'high-level' ? 'High-Level' : 'Submersible';

  const TypeIcon = ({ t }: { t: TemplateItem }) =>
    t.input.bridgeType === 'high-level'
      ? <ArrowUpFromLine className="h-4 w-4 shrink-0 text-emerald-400" />
      : <Waves className="h-4 w-4 shrink-0 text-blue-400" />;

  const typeBadge = (t: TemplateItem) =>
    t.input.bridgeType === 'high-level'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

  const matchBadgeColor = (score: number) =>
    score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-app-muted';

  const activeName = currentName ?? 'Active Design';

  return (
    <>
      <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-app-accent" />
            <h3 className="text-base font-semibold text-app-fg">Similar IRC Projects</h3>
            <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">
              closest matches from library
            </span>
          </div>
          <p className="text-[11px] text-app-muted">
            Ranked by discharge · waterway · bridge type — click <SplitSquareHorizontal className="inline h-3 w-3" /> to compare
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {matches.map(({ template: t, score, deltaQ, deltaWaterway, deltaSpans }) => {
            const isPinned = pinned?.id === t.id;
            return (
              <div key={t.id}
                className={`flex flex-col rounded-xl border p-4 gap-3 transition ${
                  isPinned
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-[var(--app-glass-border)] bg-app-card/40 hover:border-app-accent/40'
                }`}>

                {/* header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TypeIcon t={t} />
                    <p className="text-sm font-semibold text-app-fg leading-tight truncate">{t.name}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold ${matchBadgeColor(score)}`}>
                    {score.toFixed(0)}% match
                  </span>
                </div>

                {/* description */}
                <p className="text-[11px] text-app-muted leading-relaxed line-clamp-2">{t.description}</p>

                {/* quick stats */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className="rounded-md border border-[var(--app-glass-border)] bg-app-card/30 px-2 py-1">
                    <span className="text-app-muted">Q: </span>
                    <span className="font-semibold text-app-fg">{(t.input.discharge ?? 0).toFixed(0)} m³/s</span>
                  </span>
                  <span className="rounded-md border border-[var(--app-glass-border)] bg-app-card/30 px-2 py-1">
                    <span className="text-app-muted">Spans: </span>
                    <span className="font-semibold text-app-fg">{t.input.numberOfSpans}×{t.input.spanLength}m</span>
                  </span>
                </div>

                {/* delta badges */}
                <div className="flex flex-wrap gap-1.5">
                  <DeltaBadge value={deltaQ}        unit="m³/s"  label="vs Q" />
                  <DeltaBadge value={deltaWaterway} unit="m"     label="vs L" />
                  <DeltaBadge value={deltaSpans}    unit="spans" label="vs n" />
                </div>

                {/* action row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--app-glass-border)]">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${typeBadge(t)}`}>
                    {typeLabel(t)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* compare / unpin toggle */}
                    <button
                      onClick={() => setPinned(isPinned ? null : t)}
                      title={isPinned ? 'Close comparison' : 'Compare side by side'}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                        isPinned
                          ? 'border-violet-500/50 bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                          : 'border-[var(--app-glass-border)] bg-app-card/40 text-app-muted hover:border-violet-500/40 hover:text-violet-400'
                      }`}>
                      {isPinned
                        ? <><X className="h-3 w-3" /> Close</>
                        : <><SplitSquareHorizontal className="h-3 w-3" /> Compare</>}
                    </button>
                    {/* load */}
                    <button
                      onClick={() => onLoad(t.id)}
                      className="flex items-center gap-1 rounded-lg border border-app-accent/40 bg-app-accent/10 px-2.5 py-1 text-[11px] font-semibold text-app-accent transition hover:bg-app-accent/20">
                      Load <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {pinned && (
          <p className="mt-3 text-center text-[11px] text-violet-400">
            <SplitSquareHorizontal className="inline h-3 w-3 mr-1" />
            Comparing <strong>{activeName}</strong> vs <strong>{pinned.name}</strong> — full table below
          </p>
        )}
      </section>

      {/* comparison modal */}
      {pinned && (
        <CompareModal
          open={!!pinned}
          onClose={() => setPinned(null)}
          current={{ name: activeName, input: draft }}
          compare={{ name: pinned.name, input: pinned.input }}
          engineResults={engineResults ?? null}
        />
      )}
    </>
  );
}
