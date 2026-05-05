import { useState } from 'react';
import { useDesignStore } from '@/stores/useDesignStore';
import { AstraContextPanel } from '@/components/AstraContextPanel';
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
      
      {/* Drawing Standards Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Auto-Scale (IRC SP-13)</h4>
          </div>
          <p className="text-xs text-app-muted leading-relaxed mb-2">Drawing scale auto-computed to fit standard A1 (841×594 mm). Longitudinal section 1:100, cross-section 1:50, details 1:20 per IRC SP-13 Cl. 6.2.</p>
          <div className="rounded-md bg-[#0d1117] px-2 py-1.5 font-mono text-[9px] text-emerald-400 leading-relaxed">
            <p>Scale = sheet_width / bridge_length</p>
            <p>Min girder depth shown ≥ 3 mm on sheet</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Live Data (IRC:112)</h4>
          </div>
          <p className="text-xs text-app-muted leading-relaxed mb-2">Design tab changes propagate instantly. Pier/abutment rebar follows IRC:112-2011 cover rules (40 mm min. exposed). Slab steel from IS:456-2000 Cl.26.3.</p>
          <div className="rounded-md bg-[#0d1117] px-2 py-1.5 font-mono text-[9px] text-emerald-400 leading-relaxed">
            <p>Cover ≥ 40 mm (substructure)</p>
            <p>Pt_min = 0.85/fy × 100 %</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Print Ready (ASTRA DXF)</h4>
          </div>
          <p className="text-xs text-app-muted leading-relaxed mb-2">High-fidelity vector PDF matches ASTRA DXF export format. Line weights: border 0.7 mm, dimensions 0.25 mm, hatching 0.18 mm (ISO 128-20).</p>
          <div className="rounded-md bg-[#0d1117] px-2 py-1.5 font-mono text-[9px] text-emerald-400 leading-relaxed">
            <p>DXF R12 → ASTRA import ready</p>
            <p>Layer: BEAM, SLAB, DIM, HATCH</p>
          </div>
        </div>
      </div>

      {/* ASTRA Drawing Reference Panel */}
      <div className="mt-4">
        <AstraContextPanel
          pageKey="drawing"
          title="ASTRA DXF, GAD Standards, IRC SP-13, Under Pass Drawings"
          defaultOpen={false}
          compact={true}
        />
      </div>
    </div>
  );
}
