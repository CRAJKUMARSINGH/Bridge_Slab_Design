import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ProjectInput } from '../../../bridge-excel-generator/types';
import { ExcelLikeSheetGrid } from '@/components/ExcelLikeSheetGrid';
import type { SheetPreview } from '@/types/sheetPreview';

export type { SheetPreview };

type Props = {
  draft: ProjectInput;
};

export function WorkbookSheetsViewer({ draft }: Props) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetPreview[]>([]);

  const draftKey = useMemo(() => JSON.stringify(draft), [draft]);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setErr(null);
        try {
          const res = await fetch('/api/design/workbook-previews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draftRef.current),
          });
          const data = (await res.json()) as { success?: boolean; sheets?: SheetPreview[]; error?: string };
          if (cancelled) return;
          if (!res.ok || !data.success || !data.sheets?.length) {
            throw new Error(data.error ?? 'Preview failed');
          }
          setSheets(data.sheets);
          setTab(0);
        } catch (e) {
          if (!cancelled) {
            setErr(e instanceof Error ? e.message : 'Failed to load sheets');
            setSheets([]);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 2200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [draftKey]);

  const cur = sheets[tab];

  return (
    <div className="glass-panel overflow-hidden p-0">
      <div className="border-b border-[var(--app-glass-border)] px-4 py-3">
        <h3 className="text-app-fg font-semibold text-sm uppercase tracking-wide">Generated workbook — all sheets</h3>
        <p className="mt-1 text-[11px] text-app-muted sm:text-xs">
          Live grid from the same Excel the app would download (default seed matches{' '}
          <span className="text-app-fg/90">stabil*.xls</span> Larathi/Som values when that template is loaded). Max{' '}
          {140}×18 cells per sheet for speed.
        </p>
      </div>
      <div className="flex flex-wrap border-b border-[var(--app-glass-border)] bg-app-card/40 px-1 max-h-[44vh] overflow-y-auto">
        {loading && sheets.length === 0 ? (
          <div className="flex w-full items-center gap-2 px-3 py-4 text-app-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Building workbook preview…
          </div>
        ) : (
          sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setTab(i)}
              className={`max-w-[200px] truncate px-2.5 py-2 text-left text-[10px] font-medium sm:text-xs ${
                tab === i ? 'border-b-2 border-app-accent bg-app-bg text-app-fg' : 'text-app-muted hover:text-app-fg'
              }`}
              title={s.name}
            >
              {i + 1}. {s.name}
            </button>
          ))
        )}
      </div>
      {err && <p className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{err}</p>}
      {cur && <ExcelLikeSheetGrid sheet={cur} maxHeight="min(60vh,560px)" />}
    </div>
  );
}
