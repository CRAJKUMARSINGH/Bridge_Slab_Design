import { useState } from 'react';
import {
  History, RotateCcw, Trash2, Download, ChevronDown, ChevronUp,
  Waves, ArrowUpFromLine, Clock, X,
} from 'lucide-react';
import { useDesignHistory, type HistoryEntry, type HistoryVerdict } from '@/stores/useDesignHistory';
import type { ProjectInput } from '../../../bridge-excel-generator/types';

function verdictStyle(v: HistoryVerdict) {
  if (v === 'PASS') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (v === 'WARN') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function absDate(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function DeltaChip({ label, current, stored, unit }: { label: string; current: number; stored: number; unit: string }) {
  const diff = stored - current;
  if (Math.abs(diff) < 0.01) return null;
  const sign  = diff > 0 ? '+' : '';
  const color = 'text-app-muted';
  return (
    <span className={`text-[9px] ${color}`}>
      {label} {sign}{Math.abs(diff) < 10 ? diff.toFixed(2) : diff.toFixed(0)}{unit}
    </span>
  );
}

function EntryCard({
  entry,
  current,
  onRestore,
  onRemove,
  index,
}: {
  entry: HistoryEntry;
  current: ProjectInput | null;
  onRestore: (draft: ProjectInput) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHL = entry.bridgeType === 'high-level';

  return (
    <div className={`rounded-xl border transition ${
      index === 0
        ? 'border-app-accent/30 bg-app-accent/5'
        : 'border-[var(--app-glass-border)] bg-app-card/40'
    }`}>
      {/* ── collapsed header ── */}
      <div className="flex items-center gap-2 p-3">
        {/* type icon */}
        {isHL
          ? <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          : <Waves          className="h-3.5 w-3.5 shrink-0 text-blue-400" />}

        {/* project name + index badge */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {index === 0 && (
            <span className="shrink-0 rounded-full bg-app-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-app-accent">
              LATEST
            </span>
          )}
          <p className="truncate text-[11px] font-semibold text-app-fg">{entry.projectName}</p>
        </div>

        {/* IRC verdict */}
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${verdictStyle(entry.verdict)}`}>
          {entry.verdict}
        </span>
        {/* Seismic badge */}
        {entry.seismicVerdict && (
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${verdictStyle(entry.seismicVerdict)}`}
            title={`Seismic Zone III: ${entry.seismicVerdict} · Ah=${entry.seismicAh?.toFixed(4) ?? '—'} · pier slide FOS=${entry.seismicPierSlideFOS?.toFixed(2) ?? '—'}`}
          >
            EQ {entry.seismicVerdict}
          </span>
        )}
        {/* Wind badge */}
        {entry.windVerdict && (
          <span
            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${verdictStyle(entry.windVerdict)}`}
            title={`Wind Vb=44 m/s: ${entry.windVerdict} · Vd=${entry.windVd?.toFixed(1) ?? '—'} m/s · pd=${entry.windPd?.toFixed(0) ?? '—'} N/m² · pier slide FOS=${entry.windPierSlideFOS?.toFixed(2) ?? '—'}`}
          >
            WL {entry.windVerdict}
          </span>
        )}
        <span className="shrink-0 text-[10px] text-app-muted" title={absDate(entry.timestamp)}>
          {relativeTime(entry.timestamp)}
        </span>

        {/* expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="shrink-0 rounded p-0.5 text-app-muted hover:text-app-fg"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── quick stats row (always visible) ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-[var(--app-glass-border)]/40 px-3 pb-2 pt-1.5">
        {[
          { l: 'Q',      v: `${entry.discharge.toFixed(0)} m³/s` },
          { l: 'Spans',  v: `${entry.numberOfSpans}×${entry.spanLength}m` },
          { l: 'Afflux', v: `${entry.afflux.toFixed(3)} m` },
          { l: 'FOS',    v: `${entry.pierSlidingFOS.toFixed(2)}` },
          { l: 'Fr',     v: entry.froudeNumber.toFixed(3) },
          { l: 'W/L',    v: `${(entry.waterwayRatio * 100).toFixed(0)}%` },
        ].map(s => (
          <span key={s.l} className="text-[10px] text-app-muted">
            <span className="font-semibold text-app-fg">{s.v}</span> {s.l}
          </span>
        ))}
        {current && (
          <span className="ml-1 flex gap-2">
            <DeltaChip label="ΔQ"   current={current.discharge ?? 0}               stored={entry.discharge}   unit=" m³/s" />
            <DeltaChip label="ΔL"   current={current.numberOfSpans * current.spanLength} stored={entry.numberOfSpans * entry.spanLength} unit="m" />
          </span>
        )}
      </div>

      {/* ── expanded detail ── */}
      {expanded && (
        <div className="border-t border-[var(--app-glass-border)]/40 px-3 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-app-muted">
            <span><span className="text-app-fg font-semibold">{entry.discharge.toFixed(1)}</span> m³/s discharge</span>
            <span><span className="text-app-fg font-semibold">{entry.velocity.toFixed(3)}</span> m/s velocity</span>
            <span><span className="text-app-fg font-semibold">{entry.scourDepth.toFixed(2)}</span> m scour depth</span>
            <span><span className="text-app-fg font-semibold">{entry.afflux.toFixed(3)}</span> m afflux</span>
            <span><span className="text-app-fg font-semibold">{entry.pierSlidingFOS.toFixed(2)}</span> pier sliding FOS</span>
            <span><span className="text-app-fg font-semibold">{entry.pierOverturningFOS.toFixed(2)}</span> pier overturn FOS</span>
            <span><span className="text-app-fg font-semibold">{(entry.waterwayRatio * 100).toFixed(1)}%</span> waterway/Lacey</span>
            <span>
              <span style={{ color: 'rgb(16 185 129)' }} className="font-semibold">{entry.passCount}P</span>{' '}
              <span style={{ color: 'rgb(245 158 11)' }} className="font-semibold">{entry.warnCount}W</span>{' '}
              <span style={{ color: 'rgb(239 68 68)' }} className="font-semibold">{entry.failCount}F</span>
              {' '}IRC clauses
            </span>
          </div>
          <p className="mt-1.5 text-[9px] text-app-muted">{absDate(entry.timestamp)}</p>
        </div>
      )}

      {/* ── action row ── */}
      <div className="flex items-center justify-end gap-1.5 border-t border-[var(--app-glass-border)]/40 px-3 py-2">
        <button
          onClick={() => onRemove(entry.id)}
          className="rounded p-1 text-app-muted hover:text-red-400 transition"
          title="Remove this entry"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onRestore(entry.draft)}
          className="flex items-center gap-1 rounded-lg border border-app-accent/40 bg-app-accent/10 px-3 py-1 text-[11px] font-semibold text-app-accent transition hover:bg-app-accent/20"
        >
          <RotateCcw className="h-3 w-3" /> Restore
        </button>
      </div>
    </div>
  );
}

export function DesignHistoryPanel({
  current,
  onRestore,
}: {
  current: ProjectInput | null;
  onRestore: (draft: ProjectInput) => void;
}) {
  const { entries, removeEntry, clearAll } = useDesignHistory();
  const [collapsed, setCollapsed] = useState(false);

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bridge-design-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      {/* ── header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-app-accent" />
          <h3 className="text-base font-semibold text-app-fg">Design History</h3>
          <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">
            {entries.length} / 30 runs
          </span>
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              <button
                onClick={exportHistory}
                title="Export history as JSON"
                className="flex items-center gap-1 rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-2.5 py-1.5 text-[11px] font-semibold text-app-muted transition hover:border-app-accent/40 hover:text-app-fg"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button
                onClick={clearAll}
                title="Clear all history"
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 p-1.5 text-app-muted transition hover:text-app-fg"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {entries.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--app-glass-border)] py-8 text-center">
              <Clock className="h-8 w-8 text-app-muted/40" />
              <p className="text-sm font-semibold text-app-muted">No runs recorded yet</p>
              <p className="text-[11px] text-app-muted/70">
                Every time you run a calculation the results are saved here automatically.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {entries.map((entry, i) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  index={i}
                  current={current}
                  onRestore={onRestore}
                  onRemove={removeEntry}
                />
              ))}
            </div>
          )}

          <p className="mt-3 text-center text-[10px] text-app-muted">
            History persists across browser sessions · Last {Math.min(entries.length, 30)} of 30 runs stored locally
          </p>
        </>
      )}
    </section>
  );
}
