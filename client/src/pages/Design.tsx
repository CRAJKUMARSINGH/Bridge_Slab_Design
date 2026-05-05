import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Loader2, Plus, Trash2, FileText, Layers, FileSpreadsheet, FileCheck, FileOutput, Calculator, Ruler, Building2, FileBarChart, FileJson, Grid3X3, SquareStack, Anchor, HardHat, Truck, Info, Maximize2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectInput, CrossSectionPoint, CompleteDesignResult } from '../../../bridge-excel-generator/types';
import { useDesignStore } from '@/stores/useDesignStore';
import { useModelStore } from '@/stores/useModelStore';
import { HydraulicsSheetPreview } from '@/components/HydraulicsSheetPreview';
import { WorkbookInputTabs } from '@/components/WorkbookInputTabs';
import { WorkbookSheetsViewer } from '@/components/WorkbookSheetsViewer';
import { GlassModal } from '@/components/GlassModal';
import { DesignPageSkeleton } from '@/components/Skeleton';
import { DesignCheckDashboard, IrcClausePanel, UtilizationGaugesPanel } from '@/components/DesignCheckDashboard';
import { EngineeringCopilot } from '@/components/EngineeringCopilot';
import { SimilarProjectsPanel } from '@/components/SimilarProjectsPanel';
import { DesignHistoryPanel } from '@/components/DesignHistoryPanel';
import { useDesignHistory } from '@/stores/useDesignHistory';
import { SeismicZonePanel } from '@/components/SeismicZonePanel';
import { WindLoadPanel } from '@/components/WindLoadPanel';
import { BackwaterCurvePanel } from '@/components/BackwaterCurvePanel';
import { OptimisationAtAGlance } from '@/components/OptimisationAtAGlance';
import { ModelOptimisersPanel } from '@/components/ModelOptimisersPanel';
import { AstraContextPanel } from '@/components/AstraContextPanel';

type TemplateItem = { id: string; name: string; description: string; input: ProjectInput };

function cloneInput(input: ProjectInput): ProjectInput {
  return JSON.parse(JSON.stringify(input)) as ProjectInput;
}

const CONCRETE_GRADES: Record<string, number> = { M25: 25, M30: 30, M35: 35 };
const STEEL_GRADES:   Record<string, number> = { Fe415: 415, Fe500: 500 };
const LAST_TEMPLATE_ID_KEY = 'designLastTemplateId';

/** Shared layout + interaction for export tiles (Design page output strip). */
const EXPORT_ACTION_BTN =
  'inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-[transform,box-shadow,filter] hover:brightness-[1.08] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-card)] motion-reduce:active:scale-100 motion-reduce:transition-none sm:px-4';

export function Design() {
  const engineResults = useDesignStore((s) => s.results);
  const hyd = engineResults?.hydraulics;

  const [loading, setLoading]           = useState<'excel' | 'pdf' | 'pdf-comprehensive' | 'pdf-short' | 'dxf' | 'html' | 'csv' | 'validate' | 'svg' | 'reinf-schedule' | 'reinf-drawing' | 'reinf-section' | 'abutment-detail' | 'estimation-detail' | 'deck-anchorage' | 'optimise' | null>(null);
  const [templatesLoading, setTL]       = useState(true);
  const [templates, setTemplates]       = useState<TemplateItem[]>([]);
  const [draft, setDraft]               = useState<ProjectInput | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [templateDetail, setTemplateDetail] = useState<TemplateItem | null>(null);
  const [hydModalOpen, setHydModalOpen] = useState(false);
  const [dxfAcadVersion, setDxfAcadVersion] = useState<'AC1018' | 'AC1021'>('AC1021');
  const activeModel = useModelStore((s) => s.activeModel);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch('/api/design/templates');
        const data = await res.json() as { success?: boolean; templates?: TemplateItem[] };
        if (!res.ok || !data.templates?.length) throw new Error('No templates');
        if (cancelled) return;
        setTemplates(data.templates);
        let pick = data.templates[0];
        try {
          const saved = localStorage.getItem(LAST_TEMPLATE_ID_KEY);
          if (saved) {
            const found = data.templates.find((t) => t.id === saved);
            if (found) pick = found;
          }
        } catch {
          /* ignore */
        }
        setDraft(cloneInput(pick.input));
        setCurrentTemplateId(pick.id);
      } catch (e) {
        if (!cancelled) toast.error('Could not load templates. Is the API running?');
      } finally {
        if (!cancelled) setTL(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const set = useCallback(<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const setNum = useCallback((key: keyof ProjectInput, raw: string) => {
    const n = parseFloat(raw);
    set(key, (Number.isFinite(n) ? n : 0) as any);
  }, [set]);

  const updateCrossSection = useCallback((idx: number, field: keyof CrossSectionPoint, raw: string) => {
    const n = parseFloat(raw);
    setDraft(prev => {
      if (!prev) return prev;
      const pts = [...prev.crossSectionData];
      pts[idx] = { ...pts[idx], [field]: Number.isFinite(n) ? n : 0 };
      return { ...prev, crossSectionData: pts };
    });
  }, []);

  const addCsRow = useCallback(() => {
    setDraft(prev => {
      if (!prev) return prev;
      const last = prev.crossSectionData[prev.crossSectionData.length - 1];
      return { ...prev, crossSectionData: [...prev.crossSectionData, { chainage: (last?.chainage ?? 0) + 20, gl: last?.gl ?? 280 }] };
    });
  }, []);

  const removeCsRow = useCallback((idx: number) => {
    setDraft(prev => {
      if (!prev || prev.crossSectionData.length <= 2) return prev;
      const pts = prev.crossSectionData.filter((_, i) => i !== idx);
      return { ...prev, crossSectionData: pts };
    });
  }, []);

  const persistResults = useCallback(async (body: ProjectInput) => {
    try {
      const res = await fetch('/api/design/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        success?: boolean;
        results?: CompleteDesignResult;
        issues?: { path: string; message: string }[];
      };
      if (!res.ok) {
        if (data.issues?.length) {
          toast.error(data.issues.map((i) => `${i.path}: ${i.message}`).join(' · '));
        }
        return;
      }
      if (data.success && data.results) {
        useDesignStore.getState().setResults(data.results);
        localStorage.setItem('lastDesignInput', JSON.stringify(body));

        // ── Record history entry ──────────────────────────────────────────
        const r   = data.results;
        const hyd = r.hydraulics;
        const laceyW = 4.75 * Math.sqrt(Math.max(body.discharge ?? 0, 0));
        const provW  = body.numberOfSpans * body.spanLength;
        const worstPier = [...r.pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
        const isHL = body.bridgeType === 'high-level';
        const affluxLim = isHL ? 0.50 : 0.30;
        const wRatio    = laceyW > 0 ? provW / laceyW : 0;
        const fckMin    = 25;

        // Quick clause counts (mirrors buildIrcClauses logic)
        type CS = 'PASS' | 'WARN' | 'FAIL';
        const checks: CS[] = [
          hyd.afflux <= affluxLim ? 'PASS' : hyd.afflux <= affluxLim * 1.15 ? 'WARN' : 'FAIL',
          wRatio >= 0.9 ? 'PASS' : wRatio >= 0.75 ? 'WARN' : 'FAIL',
          (body.fck ?? 25) >= fckMin ? 'PASS' : 'FAIL',
          ...r.pier.loadCases.map(lc => lc.status === 'SAFE' ? 'PASS' as CS : lc.status === 'CHECK' ? 'WARN' as CS : 'FAIL' as CS),
        ];
        const passCount = checks.filter(c => c === 'PASS').length;
        const warnCount = checks.filter(c => c === 'WARN').length;
        const failCount = checks.filter(c => c === 'FAIL').length;
        const verdict: 'PASS' | 'WARN' | 'FAIL' = failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'PASS';

        useDesignHistory.getState().addEntry({
          id:               Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          timestamp:        Date.now(),
          projectName:      body.projectName,
          bridgeType:       body.bridgeType ?? 'submersible',
          templateId:       null,
          discharge:        body.discharge ?? 0,
          numberOfSpans:    body.numberOfSpans,
          spanLength:       body.spanLength,
          afflux:           hyd.afflux,
          velocity:         hyd.velocity,
          scourDepth:       hyd.scourDepth,
          froudeNumber:     hyd.froudeNumber,
          waterwayRatio:    wRatio,
          pierSlidingFOS:   worstPier?.slidingFOS ?? 0,
          pierOverturningFOS: worstPier?.overturningFOS ?? 0,
          verdict,
          passCount,
          warnCount,
          failCount,
          // Seismic: Zone III default (Z=0.16, Sa/g=2.5, I=1.0, R=3.0)
          ...((() => {
            const sAh     = (0.16 / 2) * 2.5 * (1.0 / 3.0);
            const sW      = r.pier.loads.deadLoad;
            const sH      = r.pier.loads.totalHorizontalForce;
            const sFeq    = sAh * sW;
            const sRfric  = (worstPier?.slidingFOS ?? 1) * sH;
            const sSlideFOS = sH > 0 ? sRfric / (sH + sFeq) : 0;
            const sArm    = r.pier.geometry.depth * 0.6;
            const sOTRatio = sW > 0 ? (sFeq * sArm) / (sW * (r.pier.geometry.baseWidth / 2)) : 0;
            const sOTFOS  = (worstPier?.overturningFOS ?? 1) / (1 + sOTRatio);
            const sVerd: 'PASS' | 'WARN' | 'FAIL' = sSlideFOS >= 1.25 && sOTFOS >= 1.50 ? 'PASS' : sSlideFOS >= 1.10 ? 'WARN' : 'FAIL';
            return { seismicAh: sAh, seismicPierSlideFOS: sSlideFOS, seismicPierOTFOS: sOTFOS, seismicVerdict: sVerd };
          })()),
          // Wind: Vb=44 m/s default (central Rajasthan), TC-2, k1=1.06, k3=1.0
          ...((() => {
            const wVb    = 44;
            const wK2    = 1.00;   // TC-2, h≤10m approximation
            const wVd    = wVb * 1.06 * wK2 * 1.0;
            const wPd    = Math.max(0.6 * wVd * wVd, 464) / 1000; // kN/m²
            const pierH  = r.pier.geometry.depth;
            const pierL  = r.pier.geometry.length;
            const deckD  = (body.deckSlabThickness ?? 0.5) + 0.3;
            const FwP    = wPd * (pierH * pierL) * 1.3;
            const FwDk   = wPd * (deckD * body.spanLength) * 1.3;
            const Fw     = FwP + FwDk;
            const wH     = r.pier.loads.totalHorizontalForce;
            const wRfric = (worstPier?.slidingFOS ?? 1) * wH;
            const wFOS   = wH > 0 ? wRfric / (wH + Fw) : 0;
            const wOTarm = pierH * 0.5;
            const wMbase = wH * wOTarm;
            const wMS    = (worstPier?.overturningFOS ?? 1) * wMbase;
            const wMwind = FwP * wOTarm + FwDk * pierH;
            const wOTFOS = wMbase > 0 ? wMS / (wMbase + wMwind) : 0;
            const wVerd: 'PASS' | 'WARN' | 'FAIL' = wFOS >= 1.50 && wOTFOS >= 1.80 ? 'PASS' : (wFOS >= 1.25 || wOTFOS >= 1.50) ? 'WARN' : 'FAIL';
            return { windVd: wVd, windPd: wPd * 1000, windPierSlideFOS: wFOS, windVerdict: wVerd };
          })()),
          draft:            { ...body },
        });
      }
    } catch {
      /* non-fatal: file export still succeeded */
    }
  }, []);

  const applyHydraulicsDraft = useCallback((next: ProjectInput) => {
    setDraft(next);
    void persistResults(next);
  }, [persistResults]);

  const applyWorkbookChange = useCallback(
    (fn: (prev: ProjectInput) => ProjectInput) => {
      setDraft((prev) => {
        if (!prev) return prev;
        let next = fn(prev);
        if (next.concreteGrade !== prev.concreteGrade && CONCRETE_GRADES[next.concreteGrade]) {
          next = { ...next, fck: CONCRETE_GRADES[next.concreteGrade] };
        }
        if (next.steelGrade !== prev.steelGrade && STEEL_GRADES[next.steelGrade]) {
          next = { ...next, fy: STEEL_GRADES[next.steelGrade] };
        }
        void persistResults(next);
        return next;
      });
    },
    [persistResults],
  );

  const handleLoadById = (id: string) => {
    const found = templates.find(t => t.id === id);
    if (!found) return;
    try { localStorage.setItem(LAST_TEMPLATE_ID_KEY, id); } catch { /* ignore */ }
    setDraft(cloneInput(found.input));
    setCurrentTemplateId(id);
    toast.message(`Loaded: ${found.name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyOptimisationUpdates = useCallback(
    (updates: Partial<ProjectInput>) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates };
        void persistResults(next);
        return next;
      });
      toast.success('Applied optimisation update');
    },
    [persistResults],
  );

  const handleGenerate = async (mode: 'excel' | 'pdf' | 'pdf-comprehensive' | 'pdf-short' | 'dxf' | 'html' | 'csv' | 'validate') => {
    if (!draft) return;
    setLoading(mode);
    try {
      const endpoints: Record<string, string> = {
        'excel': '/api/design/calculate',
        'pdf': '/api/design/pdf',
        'pdf-comprehensive': '/api/design/pdf/comprehensive',
        'pdf-short': '/api/design/pdf',
        'dxf': '/api/design/dxf',
        'html': '/api/design/report/html',
        'csv': '/api/design/gad/csv',
        'validate': '/api/design/validate/html'
      };
      const endpoint = endpoints[mode];
      const bodyPayload =
        mode === 'dxf'
          ? { ...draft, acadVersion: dxfAcadVersion }
          : draft;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as {
          error?: string;
          issues?: { path: string; message: string }[];
        };
        if (err.issues?.length) {
          throw new Error(err.issues.map((i) => `${i.path}: ${i.message}`).join(' · '));
        }
        throw new Error(err.error ?? `Request failed (${response.status})`);
      }
      const blob = await response.blob();
      const extMap: Record<string, string> = {
        'excel': 'xlsx', 'pdf': 'pdf', 'pdf-comprehensive': 'pdf', 'pdf-short': 'pdf',
        'dxf': 'dxf', 'html': 'html', 'csv': 'csv', 'validate': 'html'
      };
      const ext = extMap[mode];
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; 
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_${mode}.${ext}`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      void persistResults(draft);
      toast.success(`${mode.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setLoading(null);
    }
  };

  const handleOptimise = async () => {
    if (!draft) return;
    setLoading('optimise');
    try {
      const res = await fetch('/api/design/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (data.success) {
        setDraft(data.optimised);
        toast.success(data.message);
        void persistResults(data.optimised);
      } else {
        toast.error(data.message || 'Optimisation failed');
      }
    } catch (e: any) {
      toast.error(`Optimisation error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleJSON = async () => {
    if (!draft) return;
    try {
      const response = await fetch('/api/design/gad/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_GAD.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('JSON downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'JSON export failed');
    }
  };

  const handleDetailedAbutment = async (type: 'TYPE1' | 'C1') => {
    if (!draft) return;
    setLoading('abutment-detail');
    try {
      const response = await fetch(`/api/design/detailed-abutment/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      const jsonStr = JSON.stringify(data.design, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_Abutment_${type}_Design.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(`${type} abutment design downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Abutment design failed');
    } finally {
      setLoading(null);
    }
  };

  const handleDetailedEstimation = async () => {
    if (!draft) return;
    setLoading('estimation-detail');
    try {
      const response = await fetch('/api/design/detailed-estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      const jsonStr = JSON.stringify(data.estimation, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_Detailed_Estimation.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('Detailed estimation downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Estimation failed');
    } finally {
      setLoading(null);
    }
  };

  const handleDeckAnchorage = async () => {
    if (!draft) return;
    setLoading('deck-anchorage');
    try {
      const response = await fetch('/api/design/deck-anchorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      const jsonStr = JSON.stringify(data.anchorage, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_Deck_Anchorage.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('Deck anchorage analysis downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Anchorage analysis failed');
    } finally {
      setLoading(null);
    }
  };

  const handleReinforcementSchedule = async () => {
    if (!draft) return;
    setLoading('reinf-schedule');
    try {
      const response = await fetch('/api/design/reinforcement/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      const jsonStr = JSON.stringify(data.reinforcement, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_Reinforcement_Schedule.json`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success('Reinforcement schedule downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Schedule export failed');
    } finally {
      setLoading(null);
    }
  };

  const handleReinforcementDrawing = async (element: 'pier' | 'abutment-type1' | 'abutment-c1') => {
    if (!draft) return;
    setLoading('reinf-drawing');
    try {
      const response = await fetch(`/api/design/reinforcement/drawing/${element}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_Reinforcement_${element}.svg`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(`${element} reinforcement drawing downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Drawing export failed');
    } finally {
      setLoading(null);
    }
  };

  const handleReinforcementSection = async (element: 'pier' | 'abutment') => {
    if (!draft) return;
    setLoading('reinf-section');
    try {
      const response = await fetch(`/api/design/reinforcement/section/${element}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_Section_${element}.svg`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(`${element} section drawing downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Section export failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSVG = async (type: 'gad' | 'pier' | 'abutment' | 'slab') => {
    if (!draft) return;
    setLoading('svg');
    try {
      const response = await fetch(`/api/design/drawings/svg/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.projectName.replace(/\s+/g, '_')}_${type.toUpperCase()}.svg`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success(`${type.toUpperCase()} SVG downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'SVG export failed');
    } finally {
      setLoading(null);
    }
  };

  const inp = (label: string, key: keyof ProjectInput, type: 'text' | 'number' = 'number') => (
    <label key={String(key)} className="block">
      <span className="text-app-muted text-sm">{label}</span>
      <input
        type={type}
        value={(draft?.[key] as string | number) ?? ''}
        onChange={e => type === 'number' ? setNum(key, e.target.value) : set(key, e.target.value as any)}
        className="app-field"
      />
    </label>
  );

  /** Optional string: empty input clears the key (merged defaults apply on next API merge). */
  const inpOptStr = (label: string, key: keyof ProjectInput) => (
    <label key={String(key)} className="block">
      <span className="text-app-muted text-sm">{label}</span>
      <input
        type="text"
        value={String(draft?.[key] ?? '')}
        onChange={(e) => {
          const v = e.target.value.trim();
          set(key, (v === '' ? undefined : v) as ProjectInput[typeof key]);
        }}
        className="app-field"
        placeholder="(optional)"
      />
    </label>
  );

  const bentoSection = (title: string, children: ReactNode, gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3') => (
    <div className="glass-panel p-5 md:p-6">
      <h3 className="text-app-fg font-semibold mb-4 text-sm uppercase tracking-wide">{title}</h3>
      <div className={gridClass}>{children}</div>
    </div>
  );

  return (
    <>
        <h1 className="text-3xl font-bold text-app-fg mb-3 text-center tracking-tight">Bridge Design</h1>
        <p className="text-center mb-6">
          <Link
            href="/pier-stability"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--app-glass-border)] bg-app-card/50 px-3 py-1.5 text-sm font-medium text-app-accent hover:bg-app-card/80"
          >
            Pier stability — sliding, overturning, bearing
          </Link>
        </p>
        <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-app-muted">Model Selection</span>
            <div className="flex rounded-lg bg-black/20 p-1">
              <button
                type="button"
                onClick={() => useModelStore.getState().setModel('model-a')}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeModel === 'model-a'
                    ? 'bg-app-accent text-white shadow-lg'
                    : 'text-app-muted hover:text-app-fg'
                }`}
              >
                Model A (Industrial)
              </button>
              <button
                type="button"
                onClick={() => useModelStore.getState().setModel('model-b')}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeModel === 'model-b'
                    ? 'bg-app-accent text-white shadow-lg'
                    : 'text-app-muted hover:text-app-fg'
                }`}
              >
                Model B (Premium)
              </button>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-app-accent/70 font-bold mt-1">
            Final model selection will be made after 1-month user trial (April-May 2026).
          </p>
        </div>

        <details className="mb-4 w-full rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 px-4 py-3 text-sm text-app-muted backdrop-blur-sm open:bg-app-card/60">
          <summary className="cursor-pointer select-none font-medium text-app-fg">
            Scope, limits, and how this compares to a full production office line
          </summary>
          <div className="mt-3 space-y-3 border-t border-[var(--app-glass-border)] pt-3 text-left leading-relaxed">
            <p>
              <span className="font-semibold text-app-fg">This build already does: </span>
              IRC-oriented calculations, ~46-sheet Excel from one payload, API exports (PDF/HTML/DXF/SVG/JSON), hydraulics
              preview aligned with the HYDRAULICS sheet, golden Kherwara-style template, reinforcement schedules, and
              optional REMOTE_APP analyses.
            </p>
            <p>
              <span className="font-semibold text-app-fg">Parity target (your line/word standard): </span>
              For all 46 Excel tabs, static wording, layout, and formula structure should match the reference workbook;
              only <span className="text-app-fg">data</span> (inputs and the numeric/string results they drive) should
              move when variables change. The shipped{' '}
              <code className="rounded bg-app-card px-1 text-app-accent">.xlsx</code> is the primary artifact for that
              goal. Automated checks today cover a subset (run <code className="rounded bg-app-card px-1 text-app-accent">npm run verify:excel</code>); full
              sheet-by-sheet diffing is expanded as each generator is brought up to the sample.
            </p>
            <p>
              <span className="font-semibold text-app-fg">Where the web app and short reports differ: </span>
              Short HTML/PDF remain summaries plus selected workbook-style grids (HYDRAULICS, INPUT templates in PDF).
              The Design page mirrors the three INPUT sheets closely; it does not reproduce all 46 sheets on screen.
              There is no multi-user drawing approval, project database, or native DWG pipeline in this repo path.
            </p>
            <p>
              <span className="font-semibold text-app-fg">What the drawings are NOT (yet): </span>
              no reinforcement bar bending schedule as a printable PDF; no cross-section at each pier location; no wing wall / return wall drawings;
              no foundation plan drawing; no AutoCAD DXF for pier or abutment (only plan GAD is in DXF, SVG for the rest);
              no longitudinal section with soil strata. SVG drawings render live in browser from current inputs. DXF downloads as a .dxf file for AutoCAD.
            </p>
            <p>
              <span className="font-semibold text-app-fg">To close the gap: </span>
              prioritize which sheets need the next golden assertions or HTML/PDF mirroring, or supply a frozen reference
              <code className="rounded bg-app-card px-1 text-app-accent">.xlsx</code> for automated layout-and-label diff
              (masking variable cells).
            </p>
          </div>
        </details>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
        {/* Template selector */}
        {templatesLoading ? (
          <div className="lg:col-span-12 glass-panel p-6">
            <p className="mb-4 text-sm text-app-muted">Loading templates…</p>
            <DesignPageSkeleton />
          </div>
        ) : (
          <div className="lg:col-span-12 glass-panel p-5">
            <p className="text-app-muted text-sm mb-3">Load template</p>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.setItem(LAST_TEMPLATE_ID_KEY, t.id);
                      } catch {
                        /* ignore */
                      }
                      setDraft(cloneInput(t.input));
                      setCurrentTemplateId(t.id);
                      toast.message(`Loaded: ${t.name}`);
                    }}
                    className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/80 px-3 py-2 text-sm text-app-fg transition-colors hover:border-app-accent/45"
                  >
                    {t.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`About ${t.name}`}
                    onClick={() => setTemplateDetail(t)}
                    className="rounded-lg border border-[var(--app-glass-border)] px-2 text-app-muted transition-colors hover:border-app-accent/40 hover:text-app-accent"
                  >
                    <Info className="w-4 h-4 m-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {draft && (
          <>
            <div className="lg:col-span-12">
              <WorkbookInputTabs draft={draft} onApply={applyWorkbookChange} />
            </div>

            <div className="lg:col-span-12">
              <WorkbookSheetsViewer draft={draft} />
            </div>

            <div className="lg:col-span-5">
              {bentoSection('1. Project Information', <>
                {inp('Project Name', 'projectName', 'text')}
                {inp('Location', 'location', 'text')}
                {inp('River Name', 'riverName', 'text')}
                <label className="block">
                  <span className="text-app-muted text-sm">Bridge Type</span>
                  <select
                    value={draft.bridgeType ?? 'submersible'}
                    onChange={(e) => set('bridgeType', e.target.value as ProjectInput['bridgeType'])}
                    className="app-field"
                  >
                    <option value="submersible">Submersible slab bridge</option>
                    <option value="high-level">High-level slab bridge</option>
                  </select>
                </label>
              </>)}
            </div>

            <div className="lg:col-span-7">
              {bentoSection('2. Bridge Geometry', <>
                {inp('Span Length (m)', 'spanLength')}
                {inp('Number of Spans', 'numberOfSpans')}
                {inp('Carriageway Width (m)', 'carriageWidth')}
                <label className="block">
                  <span className="text-app-muted text-sm">Total Length (m)</span>
                  <input
                    type="number"
                    value={draft.numberOfSpans * draft.spanLength}
                    onChange={e => setNum('totalLength', e.target.value)}
                    className="app-field"
                  />
                </label>
                {inp('Number of Lanes', 'numberOfLanes')}
              </>)}
            </div>

            <div className="lg:col-span-12">
              {bentoSection('3. Hydraulics', <>
                {inp('HFL (m MSL)', 'hfl')}
                {inp('Bed Level (m MSL)', 'bedLevel')}
                {inp('Foundation Level (m MSL)', 'foundationLevel')}
                {inp('Design Discharge (m³/s)', 'discharge')}
                {inp("Manning's n", 'manningN')}
                {inp('Bed Slope (1 in X)', 'bedSlope')}
                {inp("Lacey's Silt Factor", 'laceysSiltFactor')}
              </>)}
            </div>

            {/* Cross Section */}
            <div className="lg:col-span-12 glass-panel p-5 md:p-6">
              <h3 className="text-app-fg font-semibold mb-4 text-sm uppercase tracking-wide">4. Cross Section Data</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-app-muted">
                  <thead><tr className="border-b border-[var(--app-glass-border)]">
                    <th className="text-left py-2 pr-4 text-app-fg">Chainage (m)</th>
                    <th className="text-left py-2 pr-4 text-app-fg">G.L. (m MSL)</th>
                    <th></th>
                  </tr></thead>
                  <tbody>
                    {draft.crossSectionData.map((pt, i) => (
                      <tr key={i} className="border-b border-[var(--app-glass-border)]/60">
                        <td className="py-1 pr-4">
                          <input type="number" value={pt.chainage}
                            onChange={e => updateCrossSection(i, 'chainage', e.target.value)}
                            className="app-field !mt-0 py-1.5"/>
                        </td>
                        <td className="py-1 pr-4">
                          <input type="number" value={pt.gl}
                            onChange={e => updateCrossSection(i, 'gl', e.target.value)}
                            className="app-field !mt-0 py-1.5"/>
                        </td>
                        <td className="py-1">
                          <button type="button" onClick={() => removeCsRow(i)}
                            className="text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 p-1"><Trash2 className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addCsRow}
                className="mt-3 flex items-center gap-1 text-app-accent hover:underline text-sm">
                <Plus className="w-4 h-4"/> Add Row
              </button>
            </div>

            <div className="lg:col-span-6">
              {bentoSection('5. Pier', <>
                {inp('Pier Width (m)', 'pierWidth')}
                {inp('Pier Length (m)', 'pierLength')}
                {inp('Pier Depth (m)', 'pierDepth')}
                {inp('Number of Piers', 'numberOfPiers')}
                {inp('Pier Base Width (m)', 'pierBaseWidth')}
                {inp('Pier Base Length (m)', 'pierBaseLength')}
              </>)}
            </div>

            <div className="lg:col-span-6">
              {bentoSection('6. Abutment', <>
                {inp('Abutment Height (m)', 'abutmentHeight')}
                {inp('Abutment Width (m)', 'abutmentWidth')}
                {inp('Abutment Depth (m)', 'abutmentDepth')}
                {inp('Dirt Wall Height (m)', 'dirtWallHeight')}
                {inp('Return Wall Length (m)', 'returnWallLength')}
              </>)}
            </div>

            <div className="lg:col-span-6">
              {bentoSection('7. Materials', <>
                <label className="block">
                  <span className="text-app-muted text-sm">Concrete Grade</span>
                  <select value={draft.concreteGrade}
                    onChange={e => { set('concreteGrade', e.target.value); set('fck', CONCRETE_GRADES[e.target.value] ?? 25); }}
                    className="app-field">
                    {Object.keys(CONCRETE_GRADES).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                {inp('fck (MPa)', 'fck')}
                <label className="block">
                  <span className="text-app-muted text-sm">Steel Grade</span>
                  <select value={draft.steelGrade}
                    onChange={e => { set('steelGrade', e.target.value); set('fy', STEEL_GRADES[e.target.value] ?? 415); }}
                    className="app-field">
                    {Object.keys(STEEL_GRADES).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                {inp('fy (MPa)', 'fy')}
                {inp('SBC (kN/m²)', 'sbc')}
                {inp('Phi φ (degrees)', 'phi')}
                {inp('Gamma γ (kN/m³)', 'gamma')}
              </>)}
            </div>

            <div className="lg:col-span-6">
              {bentoSection('8. Design Levels', <>
                {inp('RTL — Road Top Level (m MSL)', 'rtl')}
                {inp('AGL — Avg Ground Level (m MSL)', 'agl')}
                {inp('NBL — Normal Bed Level (m MSL)', 'nbl')}
                {inp('OFL — Ordinary Flood Level (m MSL)', 'ofl')}
                {inp('DWL — Design Water Level (m MSL)', 'dwl')}
                {inp('Deck slab thickness (m)', 'deckSlabThickness')}
                {inp('Deck soffit level (m MSL)', 'deckSoffitLevel')}
                {inp('Freeboard above HFL (m)', 'freeboardAboveHfl')}
              </>)}
            </div>

            <div className="lg:col-span-12">
              {bentoSection('9. Documentation (TechNote / Tech Report)', <>
                {inp('Issuing authority', 'issuingAuthority', 'text')}
                {inp('Job / file number', 'jobNumber', 'text')}
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--app-glass-border)] bg-app-card/40 px-3 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-app-accent"
                    checked={draft.hardRockAvailable === true}
                    onChange={(e) => set('hardRockAvailable', e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-app-fg">Hard rock at foundation</span>
                    <span className="text-app-muted text-xs">Switches foundation wording on TechNote and Tech Report (open foundation vs hard stratum).</span>
                  </span>
                </label>
              </>)}
            </div>

            <div className="lg:col-span-12">
              <details className="glass-panel p-5 md:p-6">
                <summary className="cursor-pointer select-none text-app-fg font-semibold text-sm uppercase tracking-wide">
                  Optional concrete grades (per element)
                </summary>
                <p className="text-app-muted text-xs mt-2 mb-4 max-w-3xl">
                  Leave blank to use the main <span className="text-app-fg">Concrete Grade</span> everywhere on TechNote / Tech Report. Matches{' '}
                  <code className="rounded bg-app-card px-1 text-app-accent">concreteGradeFoundation</code> and related keys in{' '}
                  <code className="rounded bg-app-card px-1 text-app-accent">GET /api/design/schema</code>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inpOptStr('Foundation / blinding', 'concreteGradeFoundation')}
                  {inpOptStr('Piers', 'concreteGradePier')}
                  {inpOptStr('Abutments', 'concreteGradeAbutment')}
                  {inpOptStr('Deck slab', 'concreteGradeDeck')}
                  {inpOptStr('Wearing coat', 'concreteGradeWearing')}
                </div>
              </details>
            </div>

            {/* Exports — grouped for desktop scanning */}
            <div className="lg:col-span-12 glass-panel p-5 md:p-6 mt-0 space-y-6">
              <header className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-app-fg">Exports &amp; outputs</h3>
                <p className="max-w-3xl text-xs text-app-muted">
                  Workbook, reports, CAD interchange, validation, and detail downloads. Other actions stay disabled while one export runs.
                </p>
              </header>
              <div className="space-y-6">
                <section className="space-y-3" aria-labelledby="export-deliverables-heading">
                  <h4 id="export-deliverables-heading" className="text-[11px] font-bold uppercase tracking-wider text-app-muted">
                    Primary deliverables &amp; smart features
                  </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <button type="button" onClick={handleOptimise} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-700 hover:to-amber-600`}>
                  {loading === 'optimise' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5"/>}
                  Optimise Dimensions
                </button>
                <button type="button" onClick={() => handleGenerate('excel')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600`}>
                  {loading === 'excel' ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5"/>}
                  Excel (full workbook)
                </button>
                <button type="button" onClick={() => handleGenerate('pdf-comprehensive')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600`}>
                  {loading === 'pdf-comprehensive' ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5"/>}
                  PDF (~200-250 pages)
                </button>
                <button type="button" onClick={() => handleGenerate('html')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600`}>
                  {loading === 'html' ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileOutput className="w-5 h-5"/>}
                  HTML Report
                </button>
                <button type="button" onClick={() => handleGenerate('dxf')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600`}>
                  {loading === 'dxf' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Ruler className="w-5 h-5"/>}
                  DXF Drawings
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--app-glass-border)] bg-app-card/35 px-3 py-2">
                <label className="text-xs font-semibold text-app-muted uppercase tracking-wide">DXF Compatibility</label>
                <select
                  value={dxfAcadVersion}
                  onChange={(e) => setDxfAcadVersion(e.target.value as 'AC1018' | 'AC1021')}
                  className="app-field !mt-0 !h-9 !w-auto min-w-[220px] !py-1.5"
                >
                  <option value="AC1021">AC1021 (AutoCAD 2007/2010+)</option>
                  <option value="AC1018">AC1018 (AutoCAD 2004/2006 compatible)</option>
                </select>
              </div>
                </section>

                <section className="space-y-3" aria-labelledby="export-interchange-heading">
                  <h4 id="export-interchange-heading" className="text-[11px] font-bold uppercase tracking-wider text-app-muted">
                    CAD &amp; interchange
                  </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <button type="button" onClick={() => handleGenerate('csv')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600`}>
                  {loading === 'csv' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Calculator className="w-5 h-5"/>}
                  GAD CSV
                </button>
                <button type="button" onClick={handleJSON} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600`}>
                  {loading === 'svg' ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileJson className="w-5 h-5"/>}
                  GAD JSON
                </button>
                <button type="button" onClick={() => handleSVG('gad')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600`}>
                  {loading === 'svg' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Building2 className="w-5 h-5"/>}
                  GAD SVG
                </button>
                <button type="button" onClick={() => handleSVG('pier')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700`}>
                  {loading === 'svg' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Layers className="w-5 h-5"/>}
                  Pier SVG
                </button>
              </div>
                </section>

                <section className="space-y-3" aria-labelledby="export-validation-heading">
                  <h4 id="export-validation-heading" className="text-[11px] font-bold uppercase tracking-wider text-app-muted">
                    Validation &amp; reports
                  </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <button type="button" onClick={() => handleGenerate('validate')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700`}>
                  {loading === 'validate' ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileCheck className="w-5 h-5"/>}
                  IRC Validation
                </button>
                <button type="button" onClick={() => handleGenerate('pdf-short')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700`}>
                  {loading === 'pdf-short' ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileBarChart className="w-5 h-5"/>}
                  Short PDF
                </button>
                <button type="button" onClick={() => handleSVG('abutment')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700`}>
                  {loading === 'svg' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Building2 className="w-5 h-5"/>}
                  Abutment SVG
                </button>
                <button type="button" onClick={() => handleSVG('slab')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700`}>
                  {loading === 'svg' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Layers className="w-5 h-5"/>}
                  Slab SVG
                </button>
              </div>
                </section>

                <section className="space-y-3" aria-labelledby="export-reinf-heading">
                  <h4 id="export-reinf-heading" className="text-[11px] font-bold uppercase tracking-wider text-app-muted">
                    Reinforcement
                  </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <button type="button" onClick={handleReinforcementSchedule} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700`}>
                  {loading === 'reinf-schedule' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Grid3X3 className="w-5 h-5"/>}
                  Steel Schedule
                </button>
                <button type="button" onClick={() => handleReinforcementDrawing('pier')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700`}>
                  {loading === 'reinf-drawing' ? <Loader2 className="w-5 h-5 animate-spin"/> : <SquareStack className="w-5 h-5"/>}
                  Pier Steel Detail
                </button>
                <button type="button" onClick={() => handleReinforcementSection('pier')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600`}>
                  {loading === 'reinf-section' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Layers className="w-5 h-5"/>}
                  Pier Section
                </button>
                <button type="button" onClick={() => handleReinforcementSection('abutment')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600`}>
                  {loading === 'reinf-section' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Building2 className="w-5 h-5"/>}
                  Abutment Section
                </button>
              </div>
                </section>

                <section className="space-y-3" aria-labelledby="export-packages-heading">
                  <h4 id="export-packages-heading" className="text-[11px] font-bold uppercase tracking-wider text-app-muted">
                    Detail packages
                  </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <button type="button" onClick={() => handleDetailedAbutment('TYPE1')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600`}>
                  {loading === 'abutment-detail' ? <Loader2 className="w-5 h-5 animate-spin"/> : <HardHat className="w-5 h-5"/>}
                  Type1 Abutment
                </button>
                <button type="button" onClick={() => handleDetailedAbutment('C1')} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600`}>
                  {loading === 'abutment-detail' ? <Loader2 className="w-5 h-5 animate-spin"/> : <HardHat className="w-5 h-5"/>}
                  C1 Abutment
                </button>
                <button type="button" onClick={handleDetailedEstimation} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600`}>
                  {loading === 'estimation-detail' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Truck className="w-5 h-5"/>}
                  Detailed BOQ
                </button>
                <button type="button" onClick={handleDeckAnchorage} disabled={!!loading}
                  className={`${EXPORT_ACTION_BTN} bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600`}>
                  {loading === 'deck-anchorage' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Anchor className="w-5 h-5"/>}
                  Deck Anchorage
                </button>
              </div>
                </section>
              </div>
            </div>

            <div className="lg:col-span-12 glass-panel p-5 md:p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-app-fg">Preview &amp; engine output</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHydModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-glass-border)] bg-app-card/70 px-3 py-2 text-sm text-app-fg backdrop-blur-md transition-colors hover:border-app-accent/40"
                  >
                    <Maximize2 className="h-4 w-4 text-app-accent" />
                    Hydraulics (full)
                  </button>
                  <button
                    type="button"
                    onClick={() => draft && void persistResults(draft)}
                    className="rounded-lg border border-[var(--app-glass-border)] bg-app-card/70 px-4 py-2 text-sm text-app-fg backdrop-blur-md transition-colors hover:border-app-accent/40"
                  >
                    Refresh engine metrics
                  </button>
                </div>
              </div>
              <p className="text-app-muted text-xs max-w-3xl">
                Values below come from <code className="text-app-accent/90">design-engine.ts</code> (same as Excel). Click
                refresh to recompute from the current form without downloading a file. The HYDRAULICS table mirrors the
                workbook layout; cross-sheet wiring is described in{' '}
                <code className="text-app-accent/90">docs/SHEET_DEPENDENCY_MAP.md</code> and implemented in{' '}
                <code className="text-app-accent/90">bridge-excel-generator/index.ts</code>.
              </p>

              <DesignCheckDashboard draft={draft} results={engineResults ?? null} />
              {engineResults && <UtilizationGaugesPanel draft={draft} results={engineResults} />}
              {engineResults && <IrcClausePanel draft={draft} results={engineResults} />}
              {engineResults && draft && <SeismicZonePanel draft={draft} results={engineResults} />}
              {engineResults && draft && <WindLoadPanel draft={draft} results={engineResults} />}
              {engineResults && draft && <BackwaterCurvePanel draft={draft} results={engineResults} />}
              {engineResults && draft && <EngineeringCopilot draft={draft} results={engineResults} />}
              <DesignHistoryPanel
                current={draft}
                onRestore={(restoredDraft) => {
                  setDraft(restoredDraft);
                  try { localStorage.setItem(LAST_TEMPLATE_ID_KEY, ''); } catch { /* ignore */ }
                  void persistResults(restoredDraft);
                  toast.message(`Restored: ${restoredDraft.projectName}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              {draft && templates.length > 0 && (
                <SimilarProjectsPanel
                  draft={draft}
                  templates={templates}
                  currentTemplateId={currentTemplateId}
                  currentName={templates.find(t => t.id === currentTemplateId)?.name ?? 'Active Design'}
                  onLoad={handleLoadById}
                  engineResults={engineResults ?? null}
                />
              )}
              <OptimisationAtAGlance
                draft={draft}
                results={engineResults ?? null}
                onApply={applyOptimisationUpdates}
              />
              <ModelOptimisersPanel
                draft={draft}
                results={engineResults ?? null}
                onApply={applyOptimisationUpdates}
              />

              {/* ── ASTRA Reference Panel ──────────────────────────────── */}
              <AstraContextPanel
                pageKey="design"
                title="Seismic Coeff., Materials, Bearing, Limit State (IRC:6, IS:456, IRC:83)"
                defaultOpen={false}
              />

              {hyd && (
                <>
                  <p className="text-app-muted text-sm">
                    Flow type: <strong className="text-app-fg">{hyd.flowType}</strong>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(
                      [
                        ['A cross-section (m²)', hyd.crossSectionalArea.toFixed(2)],
                        ['P wetted (m)', hyd.wettedPerimeter.toFixed(3)],
                        ['R hydraulic (m)', hyd.hydraulicRadius.toFixed(3)],
                        ['V velocity (m/s)', hyd.velocity.toFixed(3)],
                        ['Q discharge (m³/s)', hyd.discharge.toFixed(2)],
                        ['Afflux (m)', hyd.afflux.toFixed(3)],
                        ['Design water level (m MSL)', hyd.designWaterLevel.toFixed(3)],
                        ['Froude No.', hyd.froudeNumber.toFixed(3)],
                      ] as const
                    ).map(([label, val]) => (
                      <div key={label} className="rounded-xl border border-[var(--app-glass-border)] bg-app-card/50 px-3 py-2 backdrop-blur-sm">
                        <div className="text-app-muted text-xs">{label}</div>
                        <div className="font-mono text-sm text-app-fg">{val}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div>
                <h3 className="text-app-fg font-medium mb-2 text-sm">HYDRAULICS sheet (layout mirror)</h3>
                <HydraulicsSheetPreview input={draft} onInputChange={applyHydraulicsDraft} />
              </div>
            </div>

            <GlassModal
              open={!!templateDetail}
              onOpenChange={(o) => !o && setTemplateDetail(null)}
              title={templateDetail?.name ?? 'Template'}
              size="md"
            >
              <p className="text-app-muted text-sm leading-relaxed">{templateDetail?.description}</p>
            </GlassModal>

            <GlassModal
              open={hydModalOpen}
              onOpenChange={setHydModalOpen}
              title="HYDRAULICS — full sheet preview"
              size="full"
            >
              {draft && (
                <HydraulicsSheetPreview input={draft} variant="modal" onInputChange={applyHydraulicsDraft} />
              )}
            </GlassModal>
          </>
        )}
        </div>
    </>
  );
}
