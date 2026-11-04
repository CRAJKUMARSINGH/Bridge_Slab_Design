import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Loader2, Layers, ArrowLeft, BookOpen } from 'lucide-react';
import type { ProjectInput } from '../../../bridge-excel-generator/types';
import { useDesignStore } from '@/stores/useDesignStore';
import { ExcelLikeSheetGrid } from '@/components/ExcelLikeSheetGrid';
import { Skeleton } from '@/components/Skeleton';
import type { SheetPreview } from '@/types/sheetPreview';

/** Must match server `STABILITY_CHECK_PIER_SHEET_NAME` and Excel worksheet name. */
const STABILITY_CHECK_PIER_SHEET = 'STABILITY CHECK FOR PIER';

function resolveProjectInput(resultsInput: ProjectInput | undefined): ProjectInput | null {
  if (resultsInput) return resultsInput;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('lastDesignInput') : null;
    if (!raw) return null;
    return JSON.parse(raw) as ProjectInput;
  } catch {
    return null;
  }
}

export function PierStability() {
  const results = useDesignStore((s) => s.results);
  const projectInput = useMemo(() => resolveProjectInput(results?.input), [results?.input]);

  const [sheet, setSheet] = useState<SheetPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputKey = useMemo(() => (projectInput ? JSON.stringify(projectInput) : ''), [projectInput]);

  useEffect(() => {
    if (!projectInput) {
      setSheet(null);
      setErr(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/design/workbook-sheet-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...projectInput, sheetName: STABILITY_CHECK_PIER_SHEET }),
        });
        const data = (await res.json()) as {
          success?: boolean;
          sheet?: SheetPreview;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.success || !data.sheet) {
          throw new Error(data.error ?? 'Could not load sheet preview');
        }
        setSheet(data.sheet);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : 'Sheet preview failed');
          setSheet(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inputKey, projectInput]);

  return (
    <>
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Link href="/design">
            <a className="inline-flex items-center gap-2 text-sm text-app-muted transition-colors hover:text-app-accent">
              <ArrowLeft className="h-4 w-4" /> Back to Design
            </a>
          </Link>
        </div>

        <header className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <Layers className="h-10 w-10 text-app-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-app-fg md:text-3xl">{STABILITY_CHECK_PIER_SHEET}</h1>
          <p className="mt-2 text-sm text-app-muted">
            Same worksheet as in the generated Excel — row and column layout matches the workbook (not a separate summary).
            Change inputs on Design, then return here; this view rebuilds from the same generator as the download.
          </p>
        </header>

        {/* ASTRA Reference banner */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
          <BookOpen className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="flex-1 text-[11px] text-app-muted">
            <strong className="text-amber-400">ASTRA 15 Reference:</strong> Pier stability formulas follow
            <strong className="text-app-fg"> Pier Worksheet Design 1 &amp; 2</strong> (ASTRA DESIGN/Pier) and
            <strong className="text-app-fg"> Pier with Pile Foundation</strong> tutorial.
            Benchmark: BEDACH River pier W_DL=479 kN, W_LL=92 kN → SBC check 7.8 kg/cm². Seismic: Zone III Z=0.24, I=1.5 (frmPier_Design_with_Piles).
          </p>
          <Link href="/astra-library">
            <a className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20 transition">
              <BookOpen className="h-3.5 w-3.5" /> Open ASTRA Library
            </a>
          </Link>
        </div>

        {!projectInput && (
          <div className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 px-6 py-10 text-center text-app-muted">
            <p className="mb-4">No design input found. Run a calculation on Design first (input is saved automatically).</p>
            <Link href="/design">
              <a className="inline-flex items-center gap-2 rounded-lg bg-app-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Go to Design
              </a>
            </Link>
          </div>
        )}

        {projectInput && loading && (
          <div className="space-y-4 py-8" aria-busy="true" aria-label="Loading sheet preview">
            <div className="flex items-center justify-center gap-2 text-app-muted">
              <Loader2 className="h-6 w-6 animate-spin text-app-accent" />
              <span>Building sheet from workbook (same as Excel)…</span>
            </div>
            <Skeleton className="h-12 w-full max-w-2xl mx-auto" />
            <Skeleton className="h-[min(60vh,520px)] w-full" />
          </div>
        )}

        {projectInput && !loading && err && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-app-fg">
            {err}
          </div>
        )}

        {projectInput && !loading && sheet && (
          <div className="glass-panel overflow-hidden p-0">
            <div className="border-b border-[var(--app-glass-border)] px-4 py-3">
              <h2 className="text-app-fg text-sm font-semibold uppercase tracking-wide">{sheet.name}</h2>
              <p className="mt-1 text-[11px] text-app-muted">
                {sheet.rowCount} rows × {sheet.colCount} columns — same cell grid as the downloaded .xlsx; scroll vertically to read row-by-row.
              </p>
            </div>
            <ExcelLikeSheetGrid sheet={sheet} maxHeight="min(85vh, 900px)" />
          </div>
        )}
    </>
  );
}
