import { useState } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { 
  GADDrawing, PierDrawing, AbutmentDrawing, 
  DeckingDrawing, CrossSectionDrawing 
} from '../../../Drawing_Module/src/components';
import { 
  Download, FileDown, Layers, MousePointer2, Printer, 
  AlertCircle, LayoutTemplate, Building2, Columns3, 
  Loader2, Maximize2, MoveVertical 
} from "lucide-react";
import { toast } from 'sonner';

type SvgKey = 'gad' | 'pier' | 'abutment' | 'decking' | 'xsec';

const DRAWING_PANELS: { key: SvgKey; label: string; Component: any; Icon: any }[] = [
  { key: 'gad',      label: 'GAD Elevation', Component: GADDrawing, Icon: LayoutTemplate },
  { key: 'decking',  label: 'Decking Layout', Component: DeckingDrawing, Icon: Maximize2 },
  { key: 'xsec',     label: 'Typical X-Sec', Component: CrossSectionDrawing, Icon: MoveVertical },
  { key: 'pier',     label: 'Pier Details',  Component: PierDrawing, Icon: Columns3 },
  { key: 'abutment', label: 'Abutment Details', Component: AbutmentDrawing, Icon: Building2 },
];

export function Drawing() {
  const [activePanel, setActivePanel] = useState<SvgKey>('gad');
  const [isExporting, setIsExporting] = useState(false);
  const results = useDesignStore((s) => s.results);
  const { input } = results ?? {};
  const activePanelMeta = DRAWING_PANELS.find((p) => p.key === activePanel);

  const handleDownloadDXF = async () => {
    if (!results || !results.input) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/design/dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results.input),
      });
      
      if (!response.ok) throw new Error('Failed to generate DXF');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${results.input.projectName.replace(/\s+/g, '_')}_CAD.dxf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Professional DXF generated successfully');
    } catch (err) {
      console.error(err);
      toast.error('CAD Engine Error: Could not generate DXF');
    } finally {
      setIsExporting(false);
    }
  };

  if (!results?.input) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500 dark:text-amber-400" />
        <h1 className="mb-2 text-2xl font-bold text-app-fg">No design input</h1>
        <p className="max-w-md text-app-muted">
          Run a design from the Design page first; input is saved for drawing export here.
        </p>
      </div>
    );
  }

  const ActiveComponent = DRAWING_PANELS.find(p => p.key === activePanel)?.Component;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent px-4 py-3">
          <h1 className="text-3xl font-bold text-app-fg">CAD Drawings</h1>
          <p className="text-sm text-app-muted mt-1">Interactive browser-side SVG rendering</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-300">
              Live Geometry
            </span>
            <span className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
              Level Linked
            </span>
            <span className="rounded-full border border-green-400/35 bg-green-500/10 px-2 py-0.5 font-semibold text-green-300">
              Print Ready
            </span>
          </div>
          {input && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-white/10 bg-app-card/35 px-2 py-1 text-app-muted">
                Project: <span className="text-app-fg">{input.projectName}</span>
              </span>
              <span className="rounded-md border border-white/10 bg-app-card/35 px-2 py-1 text-app-muted">
                Spans: <span className="text-app-fg">{input.numberOfSpans} x {input.spanLength} m</span>
              </span>
              <span className="rounded-md border border-white/10 bg-app-card/35 px-2 py-1 text-app-muted">
                Piers: <span className="text-app-fg">{input.numberOfPiers}</span>
              </span>
              <span className="rounded-md border border-white/10 bg-app-card/35 px-2 py-1 text-app-muted">
                Type:{' '}
                <span className="text-app-fg">
                  {input.bridgeType === 'high-level' ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge'}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Printer className="w-4 h-4"/>
            Print / PDF
          </button>
          <button 
            type="button" 
            onClick={() => handleDownloadDXF()}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4"/>}
            Download DXF (Professional)
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-app-card/20 rounded-xl w-fit border border-white/5">
        {DRAWING_PANELS.map(panel => (
          <button
            key={panel.key}
            onClick={() => setActivePanel(panel.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activePanel === panel.key
                ? 'bg-app-accent text-white shadow-lg shadow-app-accent/25 scale-[1.01]'
                : 'text-app-muted hover:text-app-fg hover:bg-white/5'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <panel.Icon className="h-4 w-4" />
              {panel.label}
            </span>
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-glass-border)] bg-white/5">
          <h3 className="text-app-fg font-semibold inline-flex items-center gap-2">
            {activePanelMeta && (
              <>
                <activePanelMeta.Icon className="h-4 w-4 text-app-accent" />
                {activePanelMeta.label}
              </>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
            <p className="text-xs text-app-muted italic">Scale dynamically computed from geometry</p>
          </div>
        </div>
        <div className="p-6 bg-slate-50/5 overflow-x-auto min-h-[600px] flex justify-center">
          <div
            key={activePanel}
            className="origin-top transform scale-90 lg:scale-100 transition-all duration-300 ease-out animate-[fadeIn_250ms_ease-out]"
          >
            {ActiveComponent && <ActiveComponent results={results} />}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-xl border border-white/5 bg-app-card/30">
          <h4 className="text-xs font-bold text-app-accent uppercase tracking-wider mb-2">Auto-Scale</h4>
          <p className="text-sm text-app-muted leading-relaxed">Drawing scale is automatically calculated to fit standard A1 dimensions (841mm width) at screen resolution.</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-app-card/30">
          <h4 className="text-xs font-bold text-app-accent uppercase tracking-wider mb-2">Live Data</h4>
          <p className="text-sm text-app-muted leading-relaxed">Changes in the Design tab are reflected here instantly. Substructure reinforcement follows IRC:112 guidelines.</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-app-card/30">
          <h4 className="text-xs font-bold text-app-accent uppercase tracking-wider mb-2">Print Ready</h4>
          <p className="text-sm text-app-muted leading-relaxed">Use the Print button for high-fidelity PDF output. All line weights and hatch patterns are vectorized for clarity.</p>
        </div>
      </div>
    </div>
  );
}
