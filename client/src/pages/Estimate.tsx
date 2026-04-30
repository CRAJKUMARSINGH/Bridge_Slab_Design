import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompleteDesignResult } from '../../../bridge-excel-generator/types';
import { useDesignStore } from '@/stores/useDesignStore';

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDec(n: number, d = 2) {
  return n.toFixed(d);
}

export function Estimate() {
  const results = useDesignStore((s) => s.results);
  const hydrateFromStorage = useDesignStore((s) => s.hydrateFromStorage);
  const setResults = useDesignStore((s) => s.setResults);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    hydrateFromStorage();
    if (useDesignStore.getState().results) return;
    const raw = localStorage.getItem('lastDesignInput');
    if (!raw) return;
    fetch('/api/design/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
      .then((r) => r.json())
      .then((data: { success?: boolean; results?: CompleteDesignResult }) => {
        if (data.success && data.results) setResults(data.results);
      })
      .catch(() => {});
  }, [hydrateFromStorage, setResults]);

  const estimation = results?.estimation;
  const input = results?.input;

  const deckArea =
    input && input.carriageWidth > 0 && input.totalLength > 0
      ? input.carriageWidth * input.totalLength
      : 0;
  const ratePerSqm =
    estimation && deckArea > 0
      ? estimation.cost.ratePerSqm ?? estimation.cost.total / deckArea
      : 0;

  const handleDownloadBOQ = async () => {
    const inputRaw = localStorage.getItem('lastDesignInput');
    if (!inputRaw) {
      toast.error('No design input. Run a design on the Design page first.');
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch('/api/design/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: inputRaw,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Request failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Bridge_Design_BOQ.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel workbook downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (!results || !estimation) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-card/60">
          <FileSpreadsheet className="h-8 w-8 text-app-muted" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-app-fg">No estimate available</h2>
        <p className="mb-6 max-w-md text-app-muted">
          Run a calculation from the <strong className="text-app-fg">Design</strong> page (Excel, PDF, or DXF) to
          populate BOQ and costs here.
        </p>
        <Link href="/design">
          <a className="rounded-lg bg-app-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Go to Design
          </a>
        </Link>
      </div>
    );
  }

  const c = estimation.cost;

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-app-fg">Cost estimate</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(
            [
              ['Subtotal', c.subtotal],
              ['Profit (10%)', c.profit],
              ['Overhead (8%)', c.overhead],
              ['GST (18%)', c.gst],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="glass-panel p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-app-muted mb-1">{label}</p>
              <p className="text-xl font-bold text-app-fg">₹{fmt(value)}</p>
            </div>
          ))}
          <div className="rounded-xl border border-cyan-500/35 bg-gradient-to-br from-cyan-600/25 to-violet-600/20 p-4 shadow-sm md:col-span-1 col-span-2 dark:from-cyan-500/20 dark:to-violet-500/15">
            <p className="text-xs font-medium text-cyan-800 dark:text-cyan-200 mb-1">Grand total</p>
            <p className="text-xl font-bold text-app-fg">₹{fmt(c.total)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-4">
            <p className="text-sm font-medium text-app-muted mb-1">Cost per running metre</p>
            <p className="text-2xl font-bold text-app-fg">₹{fmt(c.ratePerMeter)}/m</p>
          </div>
          <div className="glass-panel p-4">
            <p className="text-sm font-medium text-app-muted mb-1">Cost per m² (deck area)</p>
            <p className="text-2xl font-bold text-app-fg">₹{fmt(ratePerSqm)}/m²</p>
          </div>
        </div>

        <div className="glass-panel overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--app-glass-border)]">
            <h2 className="text-lg font-semibold text-app-fg">Bill of quantities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-glass-border)] bg-app-card/40">
                  <th className="text-left p-3 font-semibold text-app-muted">Item</th>
                  <th className="text-left p-3 font-semibold text-app-muted">Description</th>
                  <th className="text-left p-3 font-semibold text-app-muted">Unit</th>
                  <th className="text-right p-3 font-semibold text-app-muted">Qty</th>
                  <th className="text-right p-3 font-semibold text-app-muted">Rate (₹)</th>
                  <th className="text-right p-3 font-semibold text-app-muted">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {estimation.boq.map((item, index) => (
                  <tr
                    key={item.itemNo}
                    className={index % 2 === 0 ? 'bg-transparent' : 'bg-app-card/25'}
                  >
                    <td className="p-3 text-app-accent font-mono text-xs">{item.itemNo}</td>
                    <td className="p-3 text-app-fg/90">{item.description}</td>
                    <td className="p-3 text-app-muted">{item.unit}</td>
                    <td className="p-3 text-right text-app-fg/90">{fmtDec(item.quantity)}</td>
                    <td className="p-3 text-right text-app-fg/90">{fmt(item.rate)}</td>
                    <td className="p-3 text-right font-medium text-app-fg">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--app-glass-border)] bg-app-card/35 font-semibold">
                  <td colSpan={5} className="p-3 text-right text-app-muted">
                    Subtotal:
                  </td>
                  <td className="p-3 text-right text-app-fg">₹{fmt(c.subtotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleDownloadBOQ}
            disabled={downloading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            Download full BOQ Excel
          </button>
        </div>
    </div>
  );
}
