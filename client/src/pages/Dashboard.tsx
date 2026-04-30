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
import { useModelStore } from '@/stores/useModelStore';
import { useDesignStore } from '@/stores/useDesignStore';
import { ModelSwitcher } from '@/components/ModelSwitcher';
import { SHEETS, CATEGORIES, sheetsByCategory } from '@/lib/sheet-definitions';
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
} from 'lucide-react';

type Status = 'OK' | 'FAIL' | 'WARN' | 'INFO';

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
        <MetricCard icon={PencilRuler} label="Drawings" value="3 Ready" status="OK" />
      </div>

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
