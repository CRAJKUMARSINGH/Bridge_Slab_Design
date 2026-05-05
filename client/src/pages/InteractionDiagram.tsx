/**
 * P-M Interaction Diagram Generator
 * IS:456-2000 Cl.39 (strain compatibility + simplified rectangular stress block)
 * SP:16 non-dimensional charts cross-reference
 * Biaxial bending: Bresler contour method (IS:456 Annex B)
 * ASTRA Library reference: Interaction Diagrams module
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft, RefreshCw, Download, BookOpen,
  CheckCircle2, XCircle, Info, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const Es = 200_000; // MPa (IS:456 Cl.B-1.3)
const eps_cu = 0.0035; // ultimate concrete strain (IS:456 Cl.38.1)

// IS:456 balanced NA depth ratio
function xuD_bal(fy: number) {
  return (0.0035 * Es) / (0.0035 * Es + 0.87 * fy);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Bar { di: number; Asi: number } // di from compression face (mm), area mm²

interface PMPoint { xu: number; Pu: number; Mu: number }

interface Inputs {
  b: number; D: number; cover: number;
  nTop: number; nBot: number; nSide: number;
  barDia: number; stirrupDia: number;
  fck: number; fy: number;
  Pu_applied: number; Mu_applied: number;
  Muy_applied: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Steel stress from strain, capped at 0.87·fy (IS:456 LSM) */
function steelStress(eps: number, fy: number): number {
  const fyd = 0.87 * fy;
  return Math.max(-fyd, Math.min(fyd, Es * eps));
}

/** Build bar positions from section geometry */
function buildBars(inputs: Inputs): Bar[] {
  const { b, D, cover, nTop, nBot, nSide, barDia, stirrupDia } = inputs;
  const Abar = (Math.PI / 4) * barDia ** 2;
  const dc = cover + stirrupDia + barDia / 2; // cover to centroid of bar

  const bars: Bar[] = [];

  // Top bars (at di = dc from compression face)
  for (let i = 0; i < nTop; i++) bars.push({ di: dc, Asi: Abar });

  // Bottom bars (at di = D - dc from compression face)
  for (let i = 0; i < nBot; i++) bars.push({ di: D - dc, Asi: Abar });

  // Side bars on each face (uniformly spaced between top and bottom, nSide bars per side)
  if (nSide > 0) {
    const step = (D - 2 * dc) / (nSide + 1);
    for (let k = 1; k <= nSide; k++) {
      const di = dc + k * step;
      // 2 bars per layer (left + right face), per the convention
      bars.push({ di, Asi: 2 * Abar });
    }
  }

  return bars;
}

/** IS:456 rectangular stress block — one point on P-M envelope */
function computeOnePoint(xu: number, b: number, D: number, fck: number, fy: number, bars: Bar[]): PMPoint {
  // Limit xu to column depth for pure axial case
  const xu_eff = Math.min(xu, D);

  // Concrete compression block force and moment about centroid
  const Cc = 0.36 * fck * b * xu_eff;
  const yc = 0.42 * xu_eff; // centroid of stress block from compression face
  const Mc = Cc * (D / 2 - yc);

  let Pu = Cc;
  let Mu = Mc;

  for (const bar of bars) {
    const eps_si = (xu === 0) ? -0.002 : (eps_cu * (xu - bar.di)) / xu;
    const fsi_raw = steelStress(eps_si, fy);
    // Subtract concrete stress at bar position (only if bar is in compression zone)
    const fci = bar.di < xu_eff ? 0.36 * fck : 0;
    const fsi = fsi_raw - fci;
    const Fi = fsi * bar.Asi;
    Pu += Fi;
    Mu += Fi * (D / 2 - bar.di);
  }

  return { xu, Pu, Mu: Math.abs(Mu) };
}

/** Generate the full P-M envelope (200 points) */
function generateEnvelope(inputs: Inputs): PMPoint[] {
  const { b, D, fck, fy } = inputs;
  const bars = buildBars(inputs);

  // xu sweep: from very large (≈pure axial) down to near zero (pure bending)
  // We use a non-linear spacing to get more points near the balanced point
  const xubals = xuD_bal(fy) * D;
  const xuValues: number[] = [];

  // Far axial region (xu > 2D)
  for (let i = 20; i >= 1; i--) xuValues.push(i * D);
  // Near axial region (xu D to 2D)
  for (let i = 100; i >= 51; i--) xuValues.push((i / 50) * D);
  // Balanced and below (xu = D to 0.02D)
  for (let i = 100; i >= 1; i--) xuValues.push((i / 100) * D);

  const pts: PMPoint[] = xuValues.map(xu => computeOnePoint(xu, b, D, fck, fy, bars));

  // Pure axial: xu → ∞ (all concrete + all steel in compression)
  const Asc = bars.reduce((s, bar) => s + bar.Asi, 0);
  const Ac = b * D - Asc;
  const Pu0 = 0.4 * fck * Ac + 0.67 * fy * Asc; // IS:456 Cl.39.3

  // Pure bending: iterate xu until Pu = 0
  let xuPB = xubals * 0.05;
  for (let iter = 0; iter < 200; iter++) {
    const pt = computeOnePoint(xuPB, b, D, fck, fy, bars);
    if (Math.abs(pt.Pu) < 0.5) break;
    if (pt.Pu > 0) xuPB *= 0.9; else xuPB *= 1.1;
  }
  const ptPB = computeOnePoint(xuPB, b, D, fck, fy, bars);

  // Filter envelope to Pu ≥ 0 and Mu ≥ 0, deduplicate, sort by Pu descending
  const all: PMPoint[] = [
    { xu: 1e8, Pu: Pu0, Mu: 0 },   // pure axial
    ...pts,
    { ...ptPB, Pu: 0 },            // pure bending
  ];

  return all
    .filter(p => p.Pu >= -0.01 * Pu0 && p.Mu >= 0)
    .sort((a, b) => b.Pu - a.Pu)
    .map(p => ({ ...p, Pu: Math.max(p.Pu, 0) }));
}

/** α exponent for biaxial check (IS:456 Annex B) */
function biaxialAlpha(PuRatio: number): number {
  // IS:456: α = 1.0 for Pu/(Pu0) ≤ 0.2, = 2.0 for ≥ 0.8, linear interpolation
  if (PuRatio <= 0.2) return 1.0;
  if (PuRatio >= 0.8) return 2.0;
  return 1.0 + (PuRatio - 0.2) / 0.6;
}

/** Check if point (Pu, Mu) is inside the envelope (simple ray-cast) */
function isInsideEnvelope(Pu: number, Mu: number, envelope: PMPoint[]): boolean {
  // For a given Pu, find Mu capacity by linear interpolation
  for (let i = 0; i < envelope.length - 1; i++) {
    const p1 = envelope[i], p2 = envelope[i + 1];
    if (Pu <= p1.Pu && Pu >= p2.Pu) {
      const t = (Pu - p1.Pu) / (p2.Pu - p1.Pu);
      const MuCap = p1.Mu + t * (p2.Mu - p1.Mu);
      return Mu <= MuCap;
    }
  }
  return false;
}

/** Mu capacity at given Pu by interpolation */
function MuCapacity(Pu: number, envelope: PMPoint[]): number {
  for (let i = 0; i < envelope.length - 1; i++) {
    const p1 = envelope[i], p2 = envelope[i + 1];
    if (Pu <= p1.Pu && Pu >= p2.Pu) {
      const t = (Pu - p1.Pu) / (p2.Pu - p1.Pu);
      return p1.Mu + t * (p2.Mu - p1.Mu);
    }
  }
  return 0;
}

// ─── SVG chart ────────────────────────────────────────────────────────────────
const PAD = { top: 32, right: 32, bottom: 52, left: 68 };

function EnvelopeSVG({
  envelope, Pu_applied, Mu_applied, b, D, fck, fy,
}: {
  envelope: PMPoint[];
  Pu_applied: number; Mu_applied: number;
  b: number; D: number; fck: number; fy: number;
}) {
  const W = 520, H = 400;
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxMu = Math.max(...envelope.map(p => p.Mu), Mu_applied * 1.1, 1);
  const maxPu = Math.max(...envelope.map(p => p.Pu), Pu_applied * 1.1, 1);

  const sx = (mu: number) => PAD.left + (mu / maxMu) * cW;
  const sy = (pu: number) => PAD.top + cH - (pu / maxPu) * cH;

  // Envelope path
  const envPath = envelope.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.Mu).toFixed(1)},${sy(p.Pu).toFixed(1)}`).join(' ');

  // Key points
  const Asc = ((Math.PI / 4) * 20 ** 2) * 6; // rough (unused in SVG - just for labels)
  const balanced = envelope.find(p => p.xu <= xuD_bal(fy) * D + 1 && p.xu >= xuD_bal(fy) * D - 1)
    ?? envelope[Math.floor(envelope.length / 2)];
  const pureAxial = envelope[0];
  const pureBending = envelope[envelope.length - 1];

  const inside = isInsideEnvelope(Pu_applied, Mu_applied, envelope);
  const MuCap = MuCapacity(Pu_applied, envelope);

  // Grid lines
  const nGridX = 5, nGridY = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="P-M Interaction Diagram">
      <defs>
        <linearGradient id="envFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.04" />
        </linearGradient>
        <marker id="arrowX" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6b7280" />
        </marker>
        <marker id="arrowY" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
          <path d="M0,6 L3,0 L6,6 Z" fill="#6b7280" />
        </marker>
      </defs>

      {/* Background */}
      <rect x={PAD.left} y={PAD.top} width={cW} height={cH}
        fill="rgba(0,0,0,0.12)" rx="4" />

      {/* Grid */}
      {Array.from({ length: nGridX + 1 }, (_, i) => {
        const x = PAD.left + (i / nGridX) * cW;
        const val = ((i / nGridX) * maxMu / 1e6).toFixed(0);
        return (
          <g key={i}>
            <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + cH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={x} y={PAD.top + cH + 18} textAnchor="middle" fontSize="9" fill="#6b7280">{val}</text>
          </g>
        );
      })}
      {Array.from({ length: nGridY + 1 }, (_, i) => {
        const y = PAD.top + (i / nGridY) * cH;
        const val = (((nGridY - i) / nGridY) * maxPu / 1e3).toFixed(0);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#6b7280">{val}</text>
          </g>
        );
      })}

      {/* Axes labels */}
      <text x={PAD.left + cW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">
        Mu (kNm)
      </text>
      <text x={12} y={PAD.top + cH / 2} textAnchor="middle" fontSize="10" fill="#9ca3af"
        transform={`rotate(-90, 12, ${PAD.top + cH / 2})`}>
        Pu (kN)
      </text>
      <text x={PAD.left + cW / 2} y={PAD.top - 10} textAnchor="middle" fontSize="9" fill="#6b7280">
        IS:456-2000 Cl.39 | M{fck}/Fe{fy} | {b}×{D} mm
      </text>

      {/* Envelope fill */}
      <path
        d={`${envPath} L${sx(0).toFixed(1)},${sy(0).toFixed(1)} L${sx(0).toFixed(1)},${sy(pureAxial.Pu).toFixed(1)} Z`}
        fill="url(#envFill)" />

      {/* Envelope curve */}
      <path d={envPath} fill="none" stroke="#3b82f6" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Key points */}
      {/* Pure Axial */}
      <circle cx={sx(0)} cy={sy(pureAxial.Pu)} r="4" fill="#3b82f6" />
      <text x={sx(0) + 7} y={sy(pureAxial.Pu) - 4} fontSize="9" fill="#60a5fa">
        Pu0={(pureAxial.Pu / 1e3).toFixed(0)} kN
      </text>

      {/* Pure Bending */}
      <circle cx={sx(pureBending.Mu)} cy={sy(0)} r="4" fill="#8b5cf6" />
      <text x={sx(pureBending.Mu) - 4} y={sy(0) - 8} fontSize="9" fill="#a78bfa" textAnchor="middle">
        Mu0={(pureBending.Mu / 1e6).toFixed(0)} kNm
      </text>

      {/* Balanced point */}
      <circle cx={sx(balanced.Mu)} cy={sy(balanced.Pu)} r="4" fill="#f59e0b" />
      <text x={sx(balanced.Mu) + 7} y={sy(balanced.Pu) - 4} fontSize="9" fill="#fbbf24">Bal</text>

      {/* Applied load point */}
      {Pu_applied > 0 && (
        <>
          {/* Dashed lines to axes */}
          <line x1={sx(Mu_applied)} y1={sy(Pu_applied)} x2={sx(Mu_applied)} y2={PAD.top + cH}
            stroke={inside ? '#22c55e' : '#ef4444'} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
          <line x1={PAD.left} y1={sy(Pu_applied)} x2={sx(Mu_applied)} y2={sy(Pu_applied)}
            stroke={inside ? '#22c55e' : '#ef4444'} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
          {/* Mu capacity line */}
          <line x1={sx(MuCap)} y1={sy(Pu_applied) - 14} x2={sx(MuCap)} y2={sy(Pu_applied) + 14}
            stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" />
          {/* Point */}
          <circle cx={sx(Mu_applied)} cy={sy(Pu_applied)} r="6"
            fill={inside ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}
            stroke={inside ? '#22c55e' : '#ef4444'} strokeWidth="2" />
          <text x={sx(Mu_applied) + 9} y={sy(Pu_applied) + 4} fontSize="9"
            fill={inside ? '#22c55e' : '#ef4444'}>
            Applied
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Section sketch ───────────────────────────────────────────────────────────
function SectionSketch({ b, D, cover, bars }: { b: number; D: number; cover: number; bars: Bar[] }) {
  const scale = Math.min(160 / b, 220 / D);
  const sw = b * scale, sh = D * scale;
  const ox = (180 - sw) / 2, oy = (240 - sh) / 2;

  return (
    <svg viewBox="0 0 180 240" className="w-full h-auto" aria-label="Column cross-section">
      {/* Section */}
      <rect x={ox} y={oy} width={sw} height={sh}
        fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="1.5" rx="1" />
      {/* Dimension labels */}
      <text x={ox + sw / 2} y={oy - 6} textAnchor="middle" fontSize="9" fill="#6b7280">b = {b} mm</text>
      <text x={ox - 6} y={oy + sh / 2} textAnchor="middle" fontSize="9" fill="#6b7280"
        transform={`rotate(-90,${ox - 14},${oy + sh / 2})`}>D = {D} mm</text>
      {/* Cover */}
      <rect x={ox + cover * scale} y={oy + cover * scale}
        width={sw - 2 * cover * scale} height={sh - 2 * cover * scale}
        fill="none" stroke="#6b7280" strokeWidth="0.5" strokeDasharray="3,2" />
      {/* Bars */}
      {bars.map((bar, i) => {
        const r = Math.sqrt(bar.Asi / Math.PI) * scale;
        // X positions: spread across width
        const xPositions = bar.Asi > ((Math.PI / 4) * 20 ** 2) * 1.5
          ? [ox + sw * 0.25, ox + sw * 0.75]
          : [ox + sw / 2];
        return xPositions.map((bx, j) => (
          <circle key={`${i}-${j}`}
            cx={bx}
            cy={oy + bar.di * scale}
            r={Math.max(r, 2.5)}
            fill="#f59e0b" opacity="0.85" />
        ));
      })}
    </svg>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function Field({
  label, unit, value, min, max, step = 1,
  onChange, tooltip,
}: {
  label: string; unit?: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; tooltip?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-app-muted">
        {label}
        {tooltip && <span title={tooltip} className="cursor-help text-app-muted/50"><Info className="h-3 w-3" /></span>}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-2.5 py-1.5 text-sm text-app-fg focus:border-app-accent focus:outline-none"
        />
        {unit && <span className="shrink-0 text-[10px] text-app-muted">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const DEFAULTS: Inputs = {
  b: 500, D: 600, cover: 40, barDia: 20, stirrupDia: 10,
  nTop: 3, nBot: 3, nSide: 1,
  fck: 25, fy: 415,
  Pu_applied: 1200e3,   // N
  Mu_applied: 150e6,    // N·mm
  Muy_applied: 80e6,
};

export default function InteractionDiagram() {
  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  const [showTable, setShowTable] = useState(false);

  const set = useCallback(<K extends keyof Inputs>(key: K, val: number) =>
    setInp(prev => ({ ...prev, [key]: val })), []);

  const bars    = useMemo(() => buildBars(inp), [inp]);
  const envelope = useMemo(() => generateEnvelope(inp), [inp]);

  // ── Summary stats ──
  const Pu0   = envelope[0]?.Pu ?? 0;
  const Mu0   = envelope[envelope.length - 1]?.Mu ?? 0;
  const Asc   = bars.reduce((s, b) => s + b.Asi, 0);
  const p_pct = (Asc / (inp.b * inp.D)) * 100;
  const xbal  = xuD_bal(inp.fy) * inp.D;
  const Asc_min = 0.008 * inp.b * inp.D; // IS:456 Cl.26.5.3.1
  const Asc_max = 0.040 * inp.b * inp.D;

  // ── Uniaxial check ──
  const inside      = isInsideEnvelope(inp.Pu_applied, inp.Mu_applied, envelope);
  const MuCap_x     = MuCapacity(inp.Pu_applied, envelope);
  const utilX       = inp.Mu_applied / (MuCap_x || 1);

  // ── Biaxial check (Bresler, IS:456 Annex B) ──
  const MuCap_y     = MuCapacity(inp.Pu_applied, envelope); // symmetric → same cap in Y
  const alpha       = biaxialAlpha(inp.Pu_applied / Pu0);
  const biaxialDCR  = (inp.Mu_applied / MuCap_x) ** alpha + (inp.Muy_applied / MuCap_y) ** alpha;
  const biaxialOK   = biaxialDCR <= 1.0;

  // ── Table: selected envelope points ──
  const tableRows = useMemo(() => {
    const step = Math.max(1, Math.floor(envelope.length / 12));
    return envelope.filter((_, i) => i % step === 0).slice(0, 15);
  }, [envelope]);

  // ── CSV export ──
  function handleExport() {
    const header = 'xu (mm),Pu (kN),Mu (kNm)\n';
    const rows = envelope.map(p =>
      `${p.xu.toFixed(1)},${(p.Pu / 1e3).toFixed(2)},${(p.Mu / 1e6).toFixed(2)}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'PM_envelope.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const fckGrades  = [15, 20, 25, 30, 35, 40, 45, 50];
  const fyGrades   = [250, 415, 500, 550];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8">

      {/* Back nav */}
      <Link href="/astra-library">
        <a className="mb-6 inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-accent transition">
          <ArrowLeft className="h-4 w-4" /> ASTRA Library
        </a>
      </Link>

      {/* ASTRA Reference banner */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
        <BookOpen className="h-4 w-4 shrink-0 text-amber-400" />
        <p className="flex-1 text-[11px] text-app-muted">
          <strong className="text-amber-400">ASTRA 15 — Interaction Diagrams:</strong> Envelope generation
          uses IS:456-2000 Cl.39 (simplified rectangular stress block, ε_cu=0.0035).
          Biaxial check per IS:456 Annex B (Bresler contour, α from P/Pu0 ratio).
          Cross-reference SP:16 non-dimensional charts (p/(fck) vs Pu/bD·fck, Mu/bD²·fck).
        </p>
        <Link href="/astra-library">
          <a className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 transition">
            <BookOpen className="h-3.5 w-3.5" /> Library
          </a>
        </Link>
      </div>

      {/* Title */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-app-fg">P-M Interaction Diagram</h1>
        <p className="mt-1 text-sm text-app-muted">
          RCC column/pier axial load vs. moment capacity — IS:456-2000 Cl.39 strain compatibility
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">

        {/* ── INPUT PANEL ── */}
        <div className="space-y-5">

          {/* Section geometry */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Section geometry</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width b" unit="mm" value={inp.b} min={150} max={2000} onChange={v => set('b', v)}
                tooltip="Column/pier width in the bending plane" />
              <Field label="Depth D" unit="mm" value={inp.D} min={150} max={3000} onChange={v => set('D', v)}
                tooltip="Column depth (bending axis)" />
              <Field label="Clear cover" unit="mm" value={inp.cover} min={20} max={75} onChange={v => set('cover', v)}
                tooltip="Nominal cover to face of stirrup (IS:456 Cl.26.4)" />
              <Field label="Stirrup dia" unit="mm" value={inp.stirrupDia} min={6} max={16}
                onChange={v => set('stirrupDia', v)} />
            </div>
          </div>

          {/* Reinforcement */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Reinforcement</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Bar diameter" unit="mm" value={inp.barDia} min={8} max={40} step={2}
                  onChange={v => set('barDia', v)} />
              </div>
              <Field label="Top bars" unit="nos" value={inp.nTop} min={2} max={10}
                onChange={v => set('nTop', Math.max(2, Math.round(v)))}
                tooltip="Bars on the compression face" />
              <Field label="Bottom bars" unit="nos" value={inp.nBot} min={2} max={10}
                onChange={v => set('nBot', Math.max(2, Math.round(v)))}
                tooltip="Bars on the tension face" />
              <div className="col-span-2">
                <Field label="Side bars (each face)" unit="nos" value={inp.nSide} min={0} max={6}
                  onChange={v => set('nSide', Math.max(0, Math.round(v)))}
                  tooltip="Intermediate bars on left and right faces (each counted ×2)" />
              </div>
            </div>

            {/* Steel summary */}
            <div className={`mt-3 rounded-lg border px-3 py-2 text-[10px] ${
              Asc < Asc_min || Asc > Asc_max
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400'
            }`}>
              Asc = {(Asc / 100).toFixed(0)} cm²  |  p = {p_pct.toFixed(2)}%
              {Asc < Asc_min && '  ⚠ Below min 0.8% (IS:456 Cl.26.5.3.1)'}
              {Asc > Asc_max && '  ⚠ Exceeds max 4.0%'}
            </div>
          </div>

          {/* Materials */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Materials</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-app-muted">Concrete fck</label>
                <select value={inp.fck} onChange={e => set('fck', +e.target.value)}
                  className="w-full rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-2.5 py-1.5 text-sm text-app-fg focus:border-app-accent focus:outline-none">
                  {fckGrades.map(g => <option key={g} value={g}>M{g}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-app-muted">Steel fy</label>
                <select value={inp.fy} onChange={e => set('fy', +e.target.value)}
                  className="w-full rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-2.5 py-1.5 text-sm text-app-fg focus:border-app-accent focus:outline-none">
                  {fyGrades.map(g => <option key={g} value={g}>Fe{g}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2 rounded-lg border border-[var(--app-glass-border)] px-3 py-2 font-mono text-[10px] text-app-muted">
              xu_bal/D = {xuD_bal(inp.fy).toFixed(4)}  |  xu_bal = {xbal.toFixed(0)} mm
            </div>
          </div>

          {/* Applied loads */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-app-muted">Applied loads (factored)</h2>
            <div className="space-y-3">
              <Field label="Pu (axial)" unit="kN" value={inp.Pu_applied / 1e3} min={0}
                onChange={v => set('Pu_applied', v * 1e3)} />
              <Field label="Mux (major)" unit="kNm" value={inp.Mu_applied / 1e6} min={0}
                onChange={v => set('Mu_applied', v * 1e6)}
                tooltip="Moment about major axis (bending in D direction)" />
              <Field label="Muy (minor)" unit="kNm" value={inp.Muy_applied / 1e6} min={0}
                onChange={v => set('Muy_applied', v * 1e6)}
                tooltip="Moment about minor axis (used in biaxial check only)" />
            </div>
          </div>

          {/* Section sketch */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-muted">Section sketch</h2>
            <SectionSketch b={inp.b} D={inp.D} cover={inp.cover} bars={bars} />
          </div>
        </div>

        {/* ── RESULTS PANEL ── */}
        <div className="space-y-5">

          {/* P-M Chart */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-app-fg">P-M Interaction Envelope</h2>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--app-glass-border)] px-2.5 py-1.5 text-[11px] text-app-muted hover:text-app-fg transition">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
            <EnvelopeSVG
              envelope={envelope}
              Pu_applied={inp.Pu_applied}
              Mu_applied={inp.Mu_applied}
              b={inp.b} D={inp.D} fck={inp.fck} fy={inp.fy}
            />
            <p className="mt-2 text-center text-[10px] text-app-muted">
              Blue region = safe zone  |  Dot = applied (Pu, Mu)  |  Dashed = balanced point
            </p>
          </div>

          {/* Capacity summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Pure axial Pu0', value: `${(Pu0 / 1e3).toFixed(0)} kN`,   color: 'text-blue-400' },
              { label: 'Pure bending Mu0', value: `${(Mu0 / 1e6).toFixed(0)} kNm`, color: 'text-violet-400' },
              { label: 'Bal. xu/D', value: xuD_bal(inp.fy).toFixed(3),             color: 'text-amber-400' },
              { label: 'Steel ratio p', value: `${p_pct.toFixed(2)}%`,              color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-[10px] text-app-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Uniaxial check */}
          <div className={`rounded-xl border p-5 ${
            inside ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className="mb-3 flex items-center gap-2">
              {inside
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                : <XCircle className="h-5 w-5 text-red-400" />}
              <h2 className="font-semibold text-app-fg">
                Uniaxial Check — {inside ? 'PASS' : 'FAIL'}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
              {[
                { label: 'Applied Pu', value: `${(inp.Pu_applied / 1e3).toFixed(0)} kN` },
                { label: 'Applied Mux', value: `${(inp.Mu_applied / 1e6).toFixed(0)} kNm` },
                { label: 'Mu capacity', value: `${(MuCap_x / 1e6).toFixed(0)} kNm` },
                { label: 'Utilisation', value: `${(utilX * 100).toFixed(1)}%` },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-lg font-bold text-app-fg">{s.value}</p>
                  <p className="text-[10px] text-app-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--app-glass-border)]">
              <div className={`h-full rounded-full transition-all ${utilX > 1 ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(utilX * 100, 100)}%` }} />
            </div>
          </div>

          {/* Biaxial check */}
          <div className={`rounded-xl border p-5 ${
            biaxialOK ? 'border-emerald-500/30 bg-emerald-500/8' : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div className="mb-3 flex items-center gap-2">
              {biaxialOK
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                : <XCircle className="h-5 w-5 text-red-400" />}
              <h2 className="font-semibold text-app-fg">
                Biaxial Check (IS:456 Annex B) — {biaxialOK ? 'PASS' : 'FAIL'}
              </h2>
            </div>
            <div className="mb-3 rounded-lg border border-[var(--app-glass-border)] bg-[#0d1117] px-4 py-3 font-mono text-[11px] text-emerald-400">
              (Mux/Mux1)^α + (Muy/Muy1)^α ≤ 1.0<br />
              α = {alpha.toFixed(2)}  (Pu/Pu0 = {(inp.Pu_applied / Pu0).toFixed(3)})<br />
              = ({(inp.Mu_applied / 1e6).toFixed(0)}/{(MuCap_x / 1e6).toFixed(0)})^{alpha.toFixed(2)} + ({(inp.Muy_applied / 1e6).toFixed(0)}/{(MuCap_y / 1e6).toFixed(0)})^{alpha.toFixed(2)}<br />
              = {((inp.Mu_applied / MuCap_x) ** alpha).toFixed(3)} + {((inp.Muy_applied / MuCap_y) ** alpha).toFixed(3)} = <strong>{biaxialDCR.toFixed(3)}</strong> {biaxialOK ? '≤ 1.0 ✓' : '> 1.0 ✗'}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--app-glass-border)]">
              <div className={`h-full rounded-full ${biaxialOK ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(biaxialDCR * 100, 100)}%` }} />
            </div>
          </div>

          {/* SP:16 Non-dimensional check */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-5">
            <h2 className="mb-3 text-sm font-bold text-app-fg">SP:16 Non-dimensional Parameters</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Pu / (fck·b·D)', value: (inp.Pu_applied / (inp.fck * inp.b * inp.D)).toFixed(3) },
                { label: 'Mu / (fck·b·D²)', value: (inp.Mu_applied / (inp.fck * inp.b * inp.D ** 2)).toFixed(4) },
                { label: 'p / fck', value: (p_pct / 100 / inp.fck * 1000).toFixed(4) },
                { label: 'd\'/D (cover ratio)', value: ((inp.cover + inp.stirrupDia + inp.barDia / 2) / inp.D).toFixed(3) },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-[var(--app-glass-border)] p-3 text-center">
                  <p className="text-base font-bold text-app-accent">{s.value}</p>
                  <p className="mt-0.5 text-[9px] text-app-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-app-muted">
              Use these values with SP:16 Charts 27–62 to cross-check the envelope.
              d'/D is the cover-to-depth ratio for chart selection.
            </p>
          </div>

          {/* Envelope table (collapsible) */}
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 overflow-hidden">
            <button
              onClick={() => setShowTable(v => !v)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-app-fg hover:bg-app-card/60 transition">
              Envelope data table ({envelope.length} points)
              {showTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead className="border-t border-[var(--app-glass-border)] bg-app-card/60">
                    <tr>
                      {['xu (mm)', 'xu/D', 'Pu (kN)', 'Mu (kNm)', 'Status'].map(h => (
                        <th key={h} className="px-4 py-2 text-left font-semibold text-app-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((p, i) => {
                      const isApplied = Math.abs(p.Pu - inp.Pu_applied) / (Pu0 || 1) < 0.04;
                      return (
                        <tr key={i} className={`border-t border-[var(--app-glass-border)] ${
                          isApplied ? 'bg-app-accent/8' : ''
                        }`}>
                          <td className="px-4 py-1.5 font-mono text-app-fg">{p.xu > 1e6 ? '∞' : p.xu.toFixed(0)}</td>
                          <td className="px-4 py-1.5 font-mono text-app-muted">{p.xu > 1e6 ? '—' : (p.xu / inp.D).toFixed(3)}</td>
                          <td className="px-4 py-1.5 font-mono text-app-fg">{(p.Pu / 1e3).toFixed(1)}</td>
                          <td className="px-4 py-1.5 font-mono text-app-fg">{(p.Mu / 1e6).toFixed(1)}</td>
                          <td className="px-4 py-1.5 font-mono">
                            {p.xu > 1e6 ? <span className="text-blue-400">Pure Axial</span>
                              : p.xu < 1 ? <span className="text-violet-400">Pure Bending</span>
                              : Math.abs(p.xu - xbal) / inp.D < 0.02 ? <span className="text-amber-400">Balanced</span>
                              : <span className="text-app-muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
