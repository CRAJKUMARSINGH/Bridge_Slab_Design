import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { GitMerge, ArrowRight, LayoutDashboard, FileText, Droplets, Layers, Ruler } from 'lucide-react';
import { ModelSwitcher } from '@/components/ModelSwitcher';
import { useModelStore } from '@/stores/useModelStore';

type FeatureFlagsResponse = {
  success?: boolean;
  flags?: {
    referenceApp00CacheApi: boolean;
    narrativeReportGoldenAllSheets: boolean;
    turboMonorepoMode: boolean;
  };
};

async function fetchFeatureFlags(): Promise<NonNullable<FeatureFlagsResponse['flags']>> {
  const res = await fetch('/api/design/feature-flags');
  if (!res.ok) throw new Error('Failed to load feature flags');
  const data = (await res.json()) as FeatureFlagsResponse;
  const f = data.flags;
  if (!f) throw new Error('No flags in response');
  return f;
}

export function MergeIntegration() {
  const activeModel = useModelStore((s) => s.activeModel);
  const { data: flags, isLoading: flagsLoading, error: flagsError } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 60_000,
  });

  const mergeLinks = [
    { href: '/design', label: 'Design', desc: 'Full workbook inputs, exports, previews', icon: Layers },
    { href: '/dashboard', label: 'Dashboard', desc: '50-sheet registry and model banner', icon: LayoutDashboard },
    { href: '/report', label: 'Narrative Report', desc: 'Repo B-style prose report', icon: FileText },
    { href: '/hydraulics', label: 'Hydraulics', desc: 'Standalone hydraulic flow', icon: Droplets },
    { href: '/slab-design', label: 'Slab Design', desc: 'IRC slab strip checks', icon: Ruler },
    { href: '/about-scope', label: 'About Scope', desc: 'Drawing deliverables vs backlog', icon: GitMerge },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
              <GitMerge className="h-3.5 w-3.5" aria-hidden />
              W16 Hybrid merge
            </div>
            <h2 className="text-xl font-semibold text-app-fg">Unified app integration</h2>
            <p className="mt-2 max-w-3xl text-sm text-app-muted leading-relaxed">
              This build combines <strong className="text-app-fg">Repo A</strong> (production bridge workbook generator,
              API, and primary UI) with <strong className="text-app-fg">Repo B</strong> additions (narrative reporting,
              dashboard patterns, optional slab/hydraulic entry points). The merge is part of the app: choose Model A or B,
              use the routes below, and verify server flags when deploying.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-5">
            <h3 className="text-sm font-semibold text-app-fg">Repo A (base)</h3>
            <ul className="mt-3 space-y-2 text-sm text-app-muted">
              <li>Design engine and <code className="rounded bg-app-card px-1 text-xs text-app-accent">generateCompleteExcel</code></li>
              <li><code className="rounded bg-app-card px-1 text-xs">POST /api/design/*</code> exports (Excel, PDF, DXF, SVG)</li>
              <li>Design page, estimate, pier stability, drawing hooks</li>
            </ul>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <h3 className="text-sm font-semibold text-app-fg">Repo B &amp; reference stream</h3>
            <ul className="mt-3 space-y-2 text-sm text-app-muted">
              <li>Narrative report route and golden 50-sheet prose (NARRATIVE REPORT workbook tab)</li>
              <li>Dashboard, optimiser panels, slab/hydraulic standalone pages</li>
              <li>Feature flags for rollout (see server panel)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-app-fg">Calculation model</h3>
          <p className="mt-1 text-sm text-app-muted">
            Active: <strong className="text-app-fg">{activeModel === 'model-a' ? 'Model A' : 'Model B'}</strong>. Selection
            is stored in the browser and shown on Design and Dashboard. Final choice after the AprilùMay 2026 trial.
          </p>
          <div className="mt-4 max-w-md">
            <ModelSwitcher />
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-app-fg">Server feature flags</h3>
          <p className="mt-1 text-sm text-app-muted">
            From <code className="rounded bg-app-card px-1 text-xs">GET /api/design/feature-flags</code> (Refapp rollout).
          </p>
          {flagsLoading && <p className="mt-4 text-sm text-app-muted">Loading flagsù</p>}
          {flagsError && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              Could not load flags (is the API running?). Defaults apply on the server.
            </p>
          )}
          {flags && !flagsLoading && (
            <ul className="mt-4 space-y-2 font-mono text-xs text-app-muted">
              <li className="flex justify-between gap-4">
                <span>narrativeReportGoldenAllSheets</span>
                <span className="text-app-fg">{flags.narrativeReportGoldenAllSheets ? 'on' : 'off'}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>referenceApp00CacheApi</span>
                <span className="text-app-fg">{flags.referenceApp00CacheApi ? 'on' : 'off'}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>turboMonorepoMode</span>
                <span className="text-app-fg">{flags.turboMonorepoMode ? 'on' : 'off'}</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8">
        <h3 className="text-lg font-semibold text-app-fg">Merge routes in this app</h3>
        <p className="mt-1 text-sm text-app-muted">
          These screens are wired in <code className="rounded bg-app-card px-1 text-xs">App.tsx</code> ù use them together as one product.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mergeLinks.map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}>
              <a className="group flex items-start gap-3 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 transition hover:border-app-accent/40 hover:bg-app-card/60">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-app-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-app-fg">{label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-app-muted opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 text-xs text-app-muted">{desc}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-app-muted">
        Run <code className="rounded bg-app-card px-1">npm run qa</code> before release. Monorepo migration notes live in{' '}
        <code className="rounded bg-app-card px-1">docs/SOLUTIONS-MONOREPO-MIGRATION-RUNBOOK.md</code>.
      </p>
    </div>
  );
}
