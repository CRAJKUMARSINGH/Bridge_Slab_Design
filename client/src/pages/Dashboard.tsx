/**
 * Design Dashboard Page
 * ─────────────────────
 * MERGE NOTE: Ported from Repo B — DesignCheckDashboard.tsx (gift component).
 * Provides engineers a one-glance summary of all IRC/IS pass/fail verdicts.
 * Enhanced with SVG metrics cards and model toggle integration.
 *
 * Styled to match Repo A's orchid/royal design language.
 */
import { useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useModelStore } from '@/stores/useModelStore';
import { useDesignStore } from '@/stores/useDesignStore';
import { ModelSwitcher } from '@/components/ModelSwitcher';
import { SHEETS, CATEGORIES, sheetsByCategory } from '@/lib/sheet-definitions';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  BarChart3,
  Shield,
  Droplets,
  Building2,
  Ruler,
  TrendingUp,
  PencilRuler,
  BookOpen,
  Waves,
  GitBranch,
  Box,
  FlaskConical,
  Zap,
  ExternalLink,
  Database,
  FolderKanban,
  FileText,
  GitCompare,
} from 'lucide-react';

type Status = 'OK' | 'FAIL' | 'WARN' | 'INFO';

// ── Stats types ───────────────────────────────────────────────────────────────
type StatsSummary = {
  totalProjects: number;
  totalFiles: number;
  totalRecords: number;
  totalComparisons: number;
  recentFiles: Array<{
    id: number;
    fileName: string;
    fileType: string;
    projectId: number | null;
    createdAt: string;
  }>;
};

function useStatsSummary() {
  return useQuery<StatsSummary>({
    queryKey: ['stats', 'summary'],
    queryFn: () => apiClient<StatsSummary>({ url: '/api/stats/summary', method: 'GET' }),
    retry: false,
    staleTime: 30_000,
  });
}

function StatusBadge({ status }: { status: Status }) {
  const config: Record<Status, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    OK: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
    FAIL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
    WARN: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
    INFO: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Info },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text}`}>
      <Icon size={10} /> {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  status,
}: {
  label: string;
  value: string;
  icon: typeof Droplets;
  status?: Status;
}) {
  return (
    <div className="bento-stat !items-start !justify-start min-h-[110px]">
      <div className="flex w-full items-start justify-between">
        <div className="rounded-lg bg-app-accent/10 p-2">
          <Icon size={18} className="text-app-accent" />
        </div>
        {status && <StatusBadge status={status} />}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-app-fg font-mono">{value}</div>
        <div className="text-[10px] text-app-muted uppercase tracking-wider font-semibold mt-1">{label}</div>
      </div>
    </div>
  );
}

function SheetCategoryPanel({
  category,
  sheets,
}: {
  category: string;
  sheets: typeof SHEETS;
}) {
  const categoryIcons: Record<string, typeof Droplets> = {
    'A. Hydraulic Design': Droplets,
    'B. Load Calculations': TrendingUp,
    'C. Deck Slab Design': Ruler,
    'D. Pier Design': Building2,
    'E. Abutment Design': Shield,
    'F. Wing Wall & Return Wall': Building2,
    'G. Stability Checks': Shield,
    'H. Structural Checks': BarChart3,
    'I. Bearings & Joints': Ruler,
    'J. CAD Outputs': PencilRuler,
  };
  const Icon = categoryIcons[category] || BarChart3;

  return (
    <div className="rounded-xl border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] backdrop-blur-md overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--app-nav-bg)] to-transparent border-b border-[var(--app-glass-border)]">
        <Icon size={14} className="text-app-accent" />
        <h3 className="text-xs font-bold text-app-fg uppercase tracking-wider">{category}</h3>
        <span className="ml-auto text-[10px] text-app-muted">{sheets.length} sheets</span>
      </div>
      <div className="divide-y divide-[var(--app-glass-border)]">
        {sheets.map((sheet) => (
          <div key={sheet.id} className="flex items-center justify-between px-4 py-2 hover:bg-app-accent/5 transition-colors">
            <div>
              <div className="text-xs font-medium text-app-fg">
                <span className="text-app-muted mr-1">#{sheet.sheetNo}</span>
                {sheet.title}
              </div>
              <div className="text-[10px] text-app-muted">{sheet.subtitle}</div>
            </div>
            <div className="text-[9px] text-app-muted italic">{sheet.ref}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { activeModel } = useModelStore();
  const results = useDesignStore((s) => s.results);
  const grouped = useMemo(() => sheetsByCategory(), []);
  const stabilityCases = results?.pier?.loadCases ?? [];
  const stabilitySafe = stabilityCases.filter((c) => c.status === 'SAFE').length;
  const engineReady = !!results;

  // Live stats from DB — Requirement 11
  const { data: stats, isError: statsError } = useStatsSummary();

  return (
    <div className="relative min-h-screen p-6 space-y-6 overflow-hidden">
      {/* 2025 Hero Glow Backgrounds */}
      <div className="absolute top-0 right-0 w-80 h-80 hero-glow translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 hero-glow -translate-x-1/2 translate-y-1/2 opacity-20" style={{ filter: 'blur(60px)', background: 'var(--neon-purple)' }} />
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-app-fg">Design Dashboard</h1>
          <p className="text-sm text-app-muted mt-1">
            Engineering verdicts at a glance — {SHEETS.length} IRC-compliant design sheets
          </p>
        </div>
        <ModelSwitcher compact />
      </div>

      {/* Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard icon={Droplets} label="Total Sheets" value={String(SHEETS.length)} />
        <MetricCard icon={BarChart3} label="Categories" value={String(CATEGORIES.length)} />
        <MetricCard
          icon={Shield}
          label="Stability Safe Cases"
          value={String(stabilitySafe)}
          status={stabilityCases.length > 0 && stabilitySafe === stabilityCases.length ? 'OK' : 'WARN'}
        />
        <MetricCard icon={Building2} label="Active Model" value={activeModel === 'model-a' ? 'A' : 'B'} status="INFO" />
        <MetricCard icon={Ruler} label="Hydraulic Q" value={results?.hydraulics?.discharge?.toFixed(1) ?? '--'} />
        <MetricCard icon={TrendingUp} label="Engine Status" value={engineReady ? 'Ready' : 'No Run Yet'} status={engineReady ? 'OK' : 'WARN'} />
        {/* Live DB stats — Requirement 11 */}
        <MetricCard icon={FolderKanban} label="Projects" value={stats ? String(stats.totalProjects) : '--'} status="INFO" />
        <MetricCard icon={PencilRuler} label="Drawings" value={stats ? String(stats.totalFiles) : '--'} status={stats && stats.totalFiles > 0 ? 'OK' : 'INFO'} />
        <MetricCard icon={FileText} label="Records" value={stats ? String(stats.totalRecords) : '--'} />
        <MetricCard icon={GitCompare} label="Comparisons" value={stats ? String(stats.totalComparisons) : '--'} />
      </div>

      {/* DB stats warning banner — Requirement 11.3 */}
      {statsError && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 text-amber-400 text-xs">
          <Database size={14} className="shrink-0" />
          Live stats unavailable — database may be offline.
        </div>
      )}

      {/* Recent Outputs — Requirement 11.4 */}
      {stats && stats.recentFiles.length > 0 && (
        <div className="rounded-xl border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] backdrop-blur-md overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--app-glass-border)]">
            <FileText size={14} className="text-app-accent" />
            <h3 className="text-xs font-bold text-app-fg uppercase tracking-wider">Recent Outputs</h3>
            <span className="ml-auto text-[10px] text-app-muted">last {stats.recentFiles.length} files</span>
          </div>
          <div className="divide-y divide-[var(--app-glass-border)]">
            {stats.recentFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between px-4 py-2 hover:bg-app-accent/5 transition-colors">
                <div>
                  <div className="text-xs font-medium text-app-fg">{f.fileName}</div>
                  <div className="text-[10px] text-app-muted">
                    {new Date(f.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-app-accent/10 text-app-accent border border-app-accent/20">
                  {f.fileType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Info Banner */}
      <div className="rounded-xl bg-gradient-to-r from-orchid/10 to-royalblue/10 border border-orchid/30 p-4 shadow-[0_0_20px_rgba(139,92,246,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orchid to-transparent opacity-40" />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orchid/20 p-2">
            <Shield size={18} className="text-orchid" />
          </div>
          <div>
            <div className="text-sm font-bold text-app-fg">
              {activeModel === 'model-a' ? 'Model A — Industrial Core' : 'Model B — Premium Presentation'}
            </div>
            <div className="text-xs text-app-muted">
              {activeModel === 'model-a'
                ? 'SheetJS-based engine optimized for raw data precision and ultra-fast exports.'
                : 'ExcelJS-based engine producing pixel-perfect, styled reports matching Som River benchmark.'}
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-app-muted italic">
          Trial period active. Final selection after April–May 2026 user evaluation.
        </div>
      </div>

      {/* ── ASTRA Knowledge Base ─────────────────────────────────── */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/15">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/15 p-2"><BookOpen className="h-4 w-4 text-amber-400" /></div>
            <div>
              <p className="text-sm font-bold text-amber-400">ASTRA 15 Knowledge Base</p>
              <p className="text-[10px] text-app-muted">CRAJKUMARSINGH/Bridge_Slab_Design → Attached_Assets/ASTRA 15 TUTORIALS</p>
            </div>
          </div>
          <Link href="/astra-library">
            <a className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 transition">
              <ExternalLink className="h-3 w-3" /> Open Full Library
            </a>
          </Link>
        </div>

        {/* Progress meter */}
        <div className="px-5 py-3 border-b border-amber-500/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wide">Module implementation progress</span>
            <span className="text-[10px] font-bold text-amber-400">11 / 32 live</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-app-card/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: '34%' }} />
          </div>
          <p className="mt-1 text-[9px] text-app-muted">34% — calculators wired to IRC/IS/ASTRA standards</p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-y divide-amber-500/10">
          {[
            { icon: Waves,       label: 'Hydraulics',      total: 5,  live: 2, color: 'text-cyan-400',   page: '/hydraulics' },
            { icon: GitBranch,   label: 'Superstructure',  total: 6,  live: 3, color: 'text-blue-400',   page: '/t-girder' },
            { icon: Building2,   label: 'Substructure',    total: 7,  live: 3, color: 'text-amber-400',  page: '/pier-stability' },
            { icon: FlaskConical,label: 'Materials',       total: 4,  live: 1, color: 'text-emerald-400',page: '/design' },
            { icon: Box,         label: 'Culvert',         total: 5,  live: 1, color: 'text-violet-400', page: '/design' },
            { icon: Zap,         label: 'Analysis',        total: 5,  live: 1, color: 'text-orange-400', page: '/interaction-diagram' },
          ].map(c => (
            <Link key={c.label} href={c.page}>
              <a className="flex flex-col items-center gap-1 px-3 py-4 hover:bg-amber-500/8 transition group">
                <c.icon className={`h-5 w-5 ${c.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] font-semibold text-app-muted text-center leading-tight">{c.label}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${c.color}`}>{c.live}</span>
                  <span className="text-[9px] text-app-muted">/{c.total}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-app-card/50 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r from-${c.color.replace('text-','')} to-transparent`}
                    style={{ width: `${Math.round((c.live / c.total) * 100)}%` }} />
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* Live calculators quick-access */}
        <div className="px-5 py-3 border-t border-amber-500/10">
          <p className="text-[9px] font-bold text-app-muted uppercase tracking-wide mb-2">Live calculators</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Hydraulics',        page: '/hydraulics',         color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/8' },
              { label: 'T-Girder Analysis', page: '/t-girder',           color: 'border-blue-500/30 text-blue-400 bg-blue-500/8' },
              { label: 'Pier Stability',    page: '/pier-stability',     color: 'border-amber-500/30 text-amber-400 bg-amber-500/8' },
              { label: 'Abutment Stability',page: '/abutment-stability', color: 'border-orange-500/30 text-orange-400 bg-orange-500/8' },
              { label: 'P-M Diagram',       page: '/interaction-diagram',color: 'border-violet-500/30 text-violet-400 bg-violet-500/8' },
              { label: 'GAD Drawings',      page: '/drawing',            color: 'border-blue-500/30 text-blue-400 bg-blue-500/8' },
              { label: 'Cost Estimate',     page: '/estimate',           color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/8' },
              { label: 'Section Properties',page: '/t-girder',           color: 'border-blue-500/30 text-blue-400 bg-blue-500/8' },
              { label: 'Seismic Coeff.',    page: '/design',             color: 'border-orange-500/30 text-orange-400 bg-orange-500/8' },
              { label: 'ASTRA Library',     page: '/astra-library',      color: 'border-amber-500/30 text-amber-400 bg-amber-500/8' },
              { label: 'Narrative Report',  page: '/narrative-report',   color: 'border-purple-500/30 text-purple-400 bg-purple-500/8' },
            ].map(l => (
              <Link key={l.label} href={l.page}>
                <a className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition hover:opacity-80 ${l.color}`}>
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {l.label}
                </a>
              </Link>
            ))}
          </div>
        </div>

        {/* Formula quick-ref strip */}
        <div className="px-5 py-3 border-t border-amber-500/10 bg-[#0d1117]/50">
          <p className="text-[9px] font-bold text-app-muted uppercase tracking-wide mb-2">Key design equations (ASTRA reference)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {[
              { label: 'Manning (Hydraulics)', formula: 'Q = (1/n)·A·R^⅔·S₀^½' },
              { label: 'Lacey Scour',          formula: 'dsm = 1.34·(q²/f)^⅓' },
              { label: 'T-Girder UDL',         formula: 'wi = SMG·SCG·(Ds·γc + Dw·γw)' },
              { label: 'Section centroid',      formula: 'ȳ = ΣAi·yi / ΣAi' },
              { label: 'Coulomb Ka',            formula: 'Ka = sin²(α+φ) / [sin²α·(1+√…)²]' },
              { label: 'Seismic Ah',            formula: 'Ah = Z/2 × Sa/g × I/R' },
              { label: 'P-M Envelope',          formula: 'Pu0 = 0.4·fck·Ac + 0.67·fy·Asc' },
              { label: 'Biaxial (Bresler)',      formula: '(Mux/Mux1)^α + (Muy/Muy1)^α ≤ 1' },
            ].map(f => (
              <div key={f.label} className="rounded-md border border-[var(--app-glass-border)]/40 bg-app-card/20 px-2.5 py-2">
                <p className="text-[8px] font-bold text-app-muted uppercase tracking-wide mb-0.5">{f.label}</p>
                <p className="font-mono text-[10px] text-emerald-400">{f.formula}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sheet Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <SheetCategoryPanel key={cat} category={cat} sheets={grouped[cat] || []} />
        ))}
        <SheetCategoryPanel 
          category="J. CAD Outputs" 
          sheets={[
            { id: 'gad', sheetNo: 'D1', title: 'General Arrangement Drawing', subtitle: 'Longitudinal Section & Plan', ref: 'IRC:SP-13' },
            { id: 'pier', sheetNo: 'D2', title: 'Pier Details', subtitle: 'Sectional Elevation & Reinforcement', ref: 'IRC:112' },
            { id: 'abut', sheetNo: 'D3', title: 'Abutment Details', subtitle: 'Elevation & Stability Schematic', ref: 'IRC:78' },
          ] as any} 
        />
      </div>
    </div>
  );
}
