import type { ProjectInput, CompleteDesignResult } from '../../../bridge-excel-generator/types';
import { GlassModal } from './GlassModal';
import { Waves, ArrowUpFromLine, CheckCircle2, AlertTriangle, Minus } from 'lucide-react';

type Side = { name: string; input: ProjectInput };

// ── helpers ──────────────────────────────────────────────────────────────────

function laceyWidth(q: number) { return 4.75 * Math.sqrt(Math.max(0, q)); }
function waterwayRatio(inp: ProjectInput) {
  const lw = laceyWidth(inp.discharge ?? 0);
  return lw > 0 ? (inp.numberOfSpans * inp.spanLength) / lw : 0;
}

function TypeBadge({ inp }: { inp: ProjectInput }) {
  const isHL = inp.bridgeType === 'high-level';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
      isHL ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
           : 'border-blue-500/30 bg-blue-500/15 text-blue-400'
    }`}>
      {isHL
        ? <ArrowUpFromLine className="h-3 w-3" />
        : <Waves className="h-3 w-3" />}
      {isHL ? 'High-Level' : 'Submersible'}
    </span>
  );
}

// ── row types ─────────────────────────────────────────────────────────────────

type RowDef =
  | { kind: 'section'; label: string }
  | { kind: 'row'; label: string; unit?: string; a: number | string; b: number | string; higherIsBetter?: boolean; fmt?: (v: number | string) => string };

function fmt2(v: number | string) { return typeof v === 'number' ? v.toFixed(2) : v; }
function fmt0(v: number | string) { return typeof v === 'number' ? v.toFixed(0) : v; }
function fmtPct(v: number | string) { return typeof v === 'number' ? (v * 100).toFixed(1) + '%' : v; }

function buildRows(a: ProjectInput, b: ProjectInput, eng: CompleteDesignResult | null): RowDef[] {
  const laceyA = laceyWidth(a.discharge ?? 0);
  const laceyB = laceyWidth(b.discharge ?? 0);
  const wrA    = waterwayRatio(a);
  const wrB    = waterwayRatio(b);

  const worstPierA  = eng  ? [...eng.pier.loadCases].sort((x, y) => x.slidingFOS - y.slidingFOS)[0]  : null;
  const worstAbtA   = eng  ? [...eng.abutmentType1.loadCases].sort((x, y) => x.slidingFOS - y.slidingFOS)[0] : null;

  return [
    { kind: 'section', label: 'Hydraulics & Hydrology' },
    { kind: 'row', label: 'Design discharge Q',         unit: 'm³/s', a: a.discharge ?? 0,             b: b.discharge ?? 0,             fmt: fmt0 },
    { kind: 'row', label: 'Highest Flood Level',        unit: 'm MSL', a: a.hfl,                       b: b.hfl,                        fmt: fmt2 },
    { kind: 'row', label: 'Bed level',                  unit: 'm MSL', a: a.bedLevel,                  b: b.bedLevel,                   fmt: fmt2 },
    { kind: 'row', label: 'Foundation level',           unit: 'm MSL', a: a.foundationLevel,           b: b.foundationLevel,            fmt: fmt2 },
    { kind: 'row', label: 'Manning\'s n',               unit: '',       a: a.manningN,                 b: b.manningN,                   fmt: (v) => typeof v === 'number' ? v.toFixed(3) : v },
    { kind: 'row', label: 'Lacey\'s silt factor f',     unit: '',       a: a.laceysSiltFactor,          b: b.laceysSiltFactor,           fmt: fmt2 },
    { kind: 'row', label: 'Lacey\'s regime width',      unit: 'm',      a: laceyA,                     b: laceyB,                       fmt: fmt1 },
    { kind: 'row', label: 'Waterway / regime ratio',    unit: '',       a: wrA,                        b: wrB,                          higherIsBetter: true, fmt: fmtPct },

    { kind: 'section', label: 'Bridge Geometry' },
    { kind: 'row', label: 'Number of spans',            unit: '',       a: a.numberOfSpans,             b: b.numberOfSpans,              higherIsBetter: false },
    { kind: 'row', label: 'Span length',                unit: 'm',      a: a.spanLength,                b: b.spanLength,                 fmt: fmt2 },
    { kind: 'row', label: 'Total waterway',             unit: 'm',      a: a.numberOfSpans * a.spanLength, b: b.numberOfSpans * b.spanLength, higherIsBetter: true, fmt: fmt1 },
    { kind: 'row', label: 'Number of piers',            unit: '',       a: a.numberOfPiers,             b: b.numberOfPiers },
    { kind: 'row', label: 'Pier width (across flow)',   unit: 'm',      a: a.pierWidth,                 b: b.pierWidth,                  fmt: fmt2 },
    { kind: 'row', label: 'Pier length (along bridge)', unit: 'm',      a: a.pierLength,                b: b.pierLength,                 fmt: fmt2 },
    { kind: 'row', label: 'Abutment height',            unit: 'm',      a: a.abutmentHeight,            b: b.abutmentHeight,             fmt: fmt2 },

    { kind: 'section', label: 'Materials' },
    { kind: 'row', label: 'Concrete grade fck',         unit: 'MPa',    a: a.fck,                      b: b.fck,                        higherIsBetter: true, fmt: (v) => `M${v}` },
    { kind: 'row', label: 'Steel grade fy',             unit: 'MPa',    a: a.fy,                       b: b.fy,                         higherIsBetter: true, fmt: (v) => `Fe${v}` },

    ...(eng ? [
      { kind: 'section' as const, label: 'Computed Results (active design)' },
      { kind: 'row' as const, label: 'Flow velocity',          unit: 'm/s', a: eng.hydraulics.velocity,              b: '—', fmt: fmt2 },
      { kind: 'row' as const, label: 'Afflux',                 unit: 'm',   a: eng.hydraulics.afflux,               b: '—', fmt: (v: number | string) => typeof v === 'number' ? v.toFixed(3) : v },
      { kind: 'row' as const, label: 'Normal scour depth',     unit: 'm',   a: eng.hydraulics.scourDepth,           b: '—', fmt: fmt2 },
      { kind: 'row' as const, label: 'Froude number',          unit: '',    a: eng.hydraulics.froudeNumber,         b: '—', fmt: (v: number | string) => typeof v === 'number' ? v.toFixed(3) : v },
      ...(worstPierA ? [
        { kind: 'row' as const, label: 'Pier sliding FOS (worst)',    unit: '', a: worstPierA.slidingFOS,    b: '—', higherIsBetter: true, fmt: fmt2 },
        { kind: 'row' as const, label: 'Pier overturning FOS (worst)',unit: '', a: worstPierA.overturningFOS, b: '—', higherIsBetter: true, fmt: fmt2 },
        { kind: 'row' as const, label: 'Pier bearing FOS (worst)',    unit: '', a: worstPierA.bearingFOS,    b: '—', higherIsBetter: true, fmt: fmt2 },
      ] : []),
      ...(worstAbtA ? [
        { kind: 'row' as const, label: 'Abutment sliding FOS (worst)',    unit: '', a: worstAbtA.slidingFOS,    b: '—', higherIsBetter: true, fmt: fmt2 },
        { kind: 'row' as const, label: 'Abutment overturning FOS (worst)',unit: '', a: worstAbtA.overturningFOS, b: '—', higherIsBetter: true, fmt: fmt2 },
      ] : []),
    ] : []),
  ];
}

function fmt1(v: number | string) { return typeof v === 'number' ? v.toFixed(1) : v; }

// ── delta cell ────────────────────────────────────────────────────────────────

function DeltaCell({ a, b, higherIsBetter }: { a: number | string; b: number | string; higherIsBetter?: boolean }) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    return <td className="px-3 py-2 text-center text-[11px] text-app-muted">—</td>;
  }
  const diff = b - a;
  if (Math.abs(diff) < 0.001) {
    return (
      <td className="px-3 py-2 text-center">
        <span className="inline-flex items-center gap-0.5 text-[11px] text-app-muted">
          <Minus className="h-3 w-3" /> equal
        </span>
      </td>
    );
  }
  const bIsHigher = diff > 0;
  const bIsBetter = higherIsBetter == null ? null : (higherIsBetter ? bIsHigher : !bIsHigher);
  const color = bIsBetter == null ? 'text-app-muted' : bIsBetter ? 'text-emerald-400' : 'text-red-400';
  const sign  = diff > 0 ? '+' : '';
  return (
    <td className={`px-3 py-2 text-center text-[11px] font-semibold ${color}`}>
      {sign}{Math.abs(diff) < 100 ? diff.toFixed(2) : diff.toFixed(0)}
    </td>
  );
}

// ── value cell ────────────────────────────────────────────────────────────────

function ValueCell({ value, unit, fmt, isResult }: { value: number | string; unit?: string; fmt?: (v: number | string) => string; isResult?: boolean }) {
  const display = fmt ? fmt(value) : typeof value === 'number' ? value.toFixed(2) : value;
  return (
    <td className={`px-3 py-2.5 text-center text-sm font-semibold ${isResult ? 'text-app-accent' : 'text-app-fg'}`}>
      {display}{unit && typeof value === 'number' ? <span className="ml-0.5 text-[10px] font-normal text-app-muted">{unit}</span> : ''}
    </td>
  );
}

// ── FOS indicator (for computed results) ─────────────────────────────────────

function FosIndicator({ value, required }: { value: number | string; required?: number }) {
  if (typeof value !== 'number' || required == null) return null;
  return value >= required
    ? <CheckCircle2 className="inline ml-1 h-3 w-3 text-emerald-400" />
    : <AlertTriangle className="inline ml-1 h-3 w-3 text-red-400" />;
}

// ── main modal ────────────────────────────────────────────────────────────────

export function CompareModal({
  open,
  onClose,
  current,
  compare,
  engineResults,
}: {
  open: boolean;
  onClose: () => void;
  current: Side;
  compare: Side;
  engineResults: CompleteDesignResult | null;
}) {
  const rows = buildRows(current.input, compare.input, engineResults);
  const fosCols = new Set(['Pier sliding FOS (worst)', 'Pier overturning FOS (worst)', 'Pier bearing FOS (worst)', 'Abutment sliding FOS (worst)', 'Abutment overturning FOS (worst)']);
  const fosReq: Record<string, number> = {
    'Pier sliding FOS (worst)': 1.5,
    'Pier overturning FOS (worst)': 1.8,
    'Pier bearing FOS (worst)': 2.5,
    'Abutment sliding FOS (worst)': 1.5,
    'Abutment overturning FOS (worst)': 1.8,
  };

  return (
    <GlassModal open={open} onOpenChange={o => !o && onClose()} title="Side-by-side Project Comparison" size="full">
      <div className="overflow-x-auto">

        {/* sticky header */}
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--app-glass-border)]">
              <th className="w-52 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-app-muted">Parameter</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-app-accent">Active Design</span>
                  <span className="max-w-[180px] truncate text-[11px] font-normal text-app-fg">{current.name}</span>
                  <TypeBadge inp={current.input} />
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-violet-400">Comparison</span>
                  <span className="max-w-[180px] truncate text-[11px] font-normal text-app-fg">{compare.name}</span>
                  <TypeBadge inp={compare.input} />
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-app-muted">Δ (B−A)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.kind === 'section') {
                return (
                  <tr key={i} className="border-t-2 border-[var(--app-glass-border)] bg-app-card/60">
                    <td colSpan={4} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-app-muted">
                      {row.label}
                    </td>
                  </tr>
                );
              }
              const isFos   = fosCols.has(row.label);
              const req     = fosReq[row.label];
              const isResult = row.b === '—';
              return (
                <tr key={i} className="border-b border-[var(--app-glass-border)]/40 transition hover:bg-app-card/30">
                  <td className="px-3 py-2 text-xs text-app-muted">{row.label}</td>
                  <ValueCell value={row.a} unit={row.unit} fmt={row.fmt} isResult={isResult} />
                  <ValueCell value={row.b} unit={isResult ? undefined : row.unit} fmt={row.fmt} />
                  <DeltaCell a={row.a} b={row.b} higherIsBetter={row.higherIsBetter} />
                  {isFos && typeof row.a === 'number' && (
                    <td className="pr-3">
                      <FosIndicator value={row.a} required={req} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-3 text-[11px] text-app-muted">
          <strong className="text-app-fg">Note:</strong> Comparison project values are from stored IRC project templates.
          Computed results (velocity, afflux, FOS etc.) are only available for the <span className="text-app-accent font-semibold">Active Design</span> after running a calculation.
          Δ column = Comparison − Active. <span className="text-emerald-400">Green</span> = comparison is better for that parameter; <span className="text-red-400">red</span> = comparison is worse.
        </div>
      </div>
    </GlassModal>
  );
}
