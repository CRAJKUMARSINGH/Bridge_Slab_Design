import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FolderKanban, Waves, ArrowUpFromLine, ChevronRight, Search, Loader2, AlertCircle, Plus, Trash2, FolderOpen } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const LAST_TEMPLATE_ID_KEY = 'designLastTemplateId';
const DESIGN_INPUT_KEY = 'designProjectInput';

// ── Project types ─────────────────────────────────────────────────────────────
type DbProject = {
  id: number;
  name: string;
  description: string | null;
  bridgeType: string | null;
  location: string | null;
  status: string;
  fileCount: number;
  recordCount: number;
  createdAt: string;
  updatedAt: string;
};

// ── API helpers ───────────────────────────────────────────────────────────────
function useProjects() {
  return useQuery<DbProject[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient<DbProject[]>({ url: '/api/projects', method: 'GET' }),
    retry: false,
  });
}

function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; location?: string; bridgeType?: string }) =>
      apiClient<DbProject>({ url: '/api/projects', method: 'POST', data: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient<void>({ url: `/api/projects/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

type TemplateItem = {
  id: string;
  name: string;
  description: string;
  input: Record<string, unknown>;
};

const IRC_BADGES: Record<string, string[]> = {
  'larathi-stabil':         ['IRC SP-13', 'IRC:6-2016', 'Q=1,067 m³/s', '12×8 m', 'Submersible'],
  'kherwara-golden':        ['IRC SP-13', 'IRC:6-2016', 'Q=900 m³/s',   '12×8 m', 'Submersible'],
  'irc-bedach-bedla':       ['IRC SP-13', 'IRC:6-2016', 'Q=387 m³/s',   '8×8 m',  'Submersible'],
  'irc-jakham-mandvi':      ['IRC SP-13', 'IRC:6-2016', 'Q=613 m³/s',   '10×8 m', 'Submersible'],
  'irc-t01-jethliya':       ['IRC SP-13', 'IRC:6-2016', 'Q=178 m³/s',   '5×8 m',  'Submersible'],
  'irc-sukanaka-matoon':    ['IRC SP-13', 'IRC:6-2016', 'Q=242 m³/s',   '6×8 m',  'Submersible'],
  'irc-ayad-maharashtra':   ['IRC SP-13', 'IRC:6-2016', 'Q=525 m³/s',   '8×10 m', 'Submersible'],
  'irc-gumaniya-udaipur':   ['IRC SP-13', 'IRC:6-2016', 'Q=143 m³/s',   '4×8 m',  'Submersible'],
  'irc-katumbi-chandrod':   ['IRC SP-13', 'IRC:6-2016', 'Q=313 m³/s',   '7×8 m',  'Submersible'],
  'irc-sisarama-highlevel': ['IRC:112-2015', 'IRC:6-2016', 'Q=199 m³/s', '3×12 m', 'High-Level'],
  'irc-kumbhalgarh-kelwara':['IRC:112-2015', 'IRC:6-2016', 'Q=486 m³/s', '4×16 m', 'High-Level'],
  'irc-parwan-highlevel':   ['IRC:112-2015', 'IRC:6-2016', '70R Load',   '4×20 m', 'High-Level'],
  'irc-banas-highlevel':    ['IRC:112-2015', 'IRC:6-2016', 'Q=2,181 m³/s','6×16 m','High-Level'],
  'irc-ayad-fatehpura':     ['IRC:112-2015', 'IRC:6-2016', 'Q=438 m³/s', '4×12 m', 'High-Level'],
  'irc-kherka-teegirder':   ['IRC:112-2015', 'IRC:21',    'Courbon',     '2×19 m', 'Tee Beam'],
  'irc-sukanaka-highlevel': ['IRC:112-2015', 'IRC:6-2016', 'Q=265 m³/s', '3×12 m', 'High-Level'],
  'high-level-reference':   ['IRC:112-2015', 'IRC:6-2016', 'Q=820 m³/s', '4×12 m', 'High-Level'],
  'small-bridge':           ['IRC SP-13', 'IRC:6-2016', '3×8 m', 'Starter'],
  'medium-bridge':          ['IRC SP-13', 'IRC:6-2016', '4×12 m', 'Starter'],
  'large-bridge':           ['IRC SP-13', 'IRC:6-2016', '5×16 m', 'Starter'],
};

const IRC_REPORT_MAP: Record<string, string> = {
  'larathi-stabil':         '/api/reports/som-river-larathi.html',
  'kherwara-golden':        '/api/reports/som-river-kherwara.html',
  'irc-bedach-bedla':       '/api/reports/bedach-river-bedla.html',
  'irc-jakham-mandvi':      '/api/reports/jakham-river-mandvi.html',
  'irc-t01-jethliya':       '/api/reports/t01-road-jethliya.html',
  'irc-sukanaka-matoon':    '/api/reports/sukanaka-nalah-matoon.html',
  'irc-ayad-maharashtra':   '/api/reports/ayad-river-maharashtra.html',
  'irc-gumaniya-udaipur':   '/api/reports/gumaniya-nalah-udaipur.html',
  'irc-katumbi-chandrod':   '/api/reports/katumbi-chandrod.html',
  'irc-sisarama-highlevel': '/api/reports/sisarama-nalah-highlevel.html',
  'irc-kumbhalgarh-kelwara':'/api/reports/kumbhalgarh-bridge.html',
  'irc-parwan-highlevel':   '/api/reports/parwan-river-highlevel.html',
  'irc-banas-highlevel':    '/api/reports/banas-river-highlevel.html',
  'irc-ayad-fatehpura':     '/api/reports/ayad-river-fatehpura.html',
  'irc-kherka-teegirder':   '/api/reports/kherka-bridge.html',
  'irc-sukanaka-highlevel': '/api/reports/sukanaka-nalah-highlevel.html',
};

const IRC_ORDER = [
  'kherwara-golden','larathi-stabil','irc-bedach-bedla','irc-jakham-mandvi',
  'irc-t01-jethliya','irc-sukanaka-matoon','irc-ayad-maharashtra',
  'irc-gumaniya-udaipur','irc-katumbi-chandrod',
  'irc-sisarama-highlevel','irc-kumbhalgarh-kelwara','irc-parwan-highlevel',
  'irc-banas-highlevel','irc-ayad-fatehpura','irc-kherka-teegirder',
  'irc-sukanaka-highlevel',
];

function badgeColor(tag: string): string {
  if (tag === 'Submersible') return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
  if (tag === 'High-Level')  return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (tag === 'Tee Beam')    return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
  if (tag === 'Starter')     return 'bg-white/5 text-app-muted border border-white/10';
  if (tag.startsWith('IRC')) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return 'bg-white/5 text-app-muted border border-white/10';
}

function typeOf(id: string): string {
  return IRC_BADGES[id]?.[4] ?? IRC_BADGES[id]?.[3] ?? '';
}

const GENERIC_IDS = ['small-bridge','medium-bridge','large-bridge','high-level-reference'];

// ── My Projects (DB-backed) section ──────────────────────────────────────────
function MyProjectsSection({ onLoadIntoDesign }: { onLoadIntoDesign: (p: DbProject) => void }) {
  const { data: projects, isLoading, isError } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), location: newLocation.trim() || undefined },
      {
        onSuccess: () => {
          setNewName('');
          setNewLocation('');
          setShowForm(false);
        },
      },
    );
  }

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete project "${name}"? This will also remove all linked files and records.`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-app-accent" />
          <h2 className="text-sm font-bold text-app-fg">My Projects</h2>
          {projects && (
            <span className="rounded-full bg-app-accent/15 px-2 py-0.5 text-[10px] font-semibold text-app-accent">
              {projects.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-app-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-app-accent/30 bg-app-accent/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-app-fg">Create Project</p>
          <input
            autoFocus
            required
            placeholder="Project name *"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-3 py-2 text-xs text-app-fg placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
          <input
            placeholder="Location (optional)"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            className="w-full rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 px-3 py-2 text-xs text-app-fg placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-app-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[var(--app-glass-border)] px-4 py-1.5 text-xs text-app-muted hover:text-app-fg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 py-4 text-app-muted text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading projects…
        </div>
      )}

      {/* Error — DB offline is non-fatal */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-amber-400 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Projects unavailable — database may be offline.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && projects?.length === 0 && (
        <div className="py-6 text-center space-y-2">
          <p className="text-sm text-app-muted">No projects yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-app-accent underline underline-offset-2 hover:opacity-80"
          >
            Create your first project
          </button>
        </div>
      )}

      {/* Project cards */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(p => (
            <div
              key={p.id}
              className="flex flex-col rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 hover:border-app-accent/40 hover:bg-app-card/60 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-app-fg leading-snug">{p.name}</h4>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                  p.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/5 text-app-muted border border-white/10'
                }`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-app-muted mb-3">
                {p.location && <span>📍 {p.location}</span>}
                {p.bridgeType && <span>🌉 {p.bridgeType}</span>}
                <span>📁 {p.fileCount} file{p.fileCount !== 1 ? 's' : ''}</span>
                <span>📊 {p.recordCount} record{p.recordCount !== 1 ? 's' : ''}</span>
                <span className="col-span-2 text-[10px]">
                  Created {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => onLoadIntoDesign(p)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-app-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                >
                  <ChevronRight className="h-3 w-3" /> Load into Design
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/8 px-2.5 py-1.5 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition"
                  title="Delete project"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Projects() {
  const [, navigate] = useLocation();
  const [templates, setTemplates]   = useState<TemplateItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [query, setQuery]           = useState('');
  const [loadingId, setLoadingId]   = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/design/templates');
        const data = await res.json() as { success?: boolean; templates?: TemplateItem[] };
        if (!res.ok || !data.templates?.length) throw new Error('empty');
        const ordered = IRC_ORDER
          .map(id => data.templates!.find(t => t.id === id))
          .filter(Boolean) as TemplateItem[];
        const rest = data.templates.filter(t => !IRC_ORDER.includes(t.id) && !GENERIC_IDS.includes(t.id));
        const generic = data.templates.filter(t => GENERIC_IDS.includes(t.id));
        setTemplates([...ordered, ...rest, ...generic]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function loadIntoDesign(template: TemplateItem) {
    setLoadingId(template.id);
    try { localStorage.setItem(LAST_TEMPLATE_ID_KEY, template.id); } catch { /* ignore */ }
    setTimeout(() => navigate('/design'), 150);
  }

  function loadProjectIntoDesign(project: DbProject) {
    // Store the project's designData as the active input if available
    try {
      if (project.name) {
        localStorage.setItem(DESIGN_INPUT_KEY, JSON.stringify({ projectName: project.name, location: project.location ?? '' }));
      }
    } catch { /* ignore */ }
    navigate('/design');
  }

  const q = query.toLowerCase();
  const filtered = templates.filter(t =>
    !q ||
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    (IRC_BADGES[t.id] ?? []).some(b => b.toLowerCase().includes(q))
  );

  const submersible = filtered.filter(t => typeOf(t.id) === 'Submersible');
  const highLevel   = filtered.filter(t => typeOf(t.id) === 'High-Level' || typeOf(t.id) === 'Tee Beam');
  const generic     = filtered.filter(t => GENERIC_IDS.includes(t.id));

  return (
    <div className="space-y-6 px-1 pb-8">

      {/* ── MY PROJECTS (DB-backed) ── */}
      <MyProjectsSection onLoadIntoDesign={loadProjectIntoDesign} />

      {/* ── HEADER ── */}
      <div className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-7 w-7 shrink-0 text-app-accent" />
            <div>
              <h2 className="text-base font-bold text-app-fg">IRC Project Library</h2>
              <p className="text-xs text-app-muted">
                {loading
                  ? 'Loading…'
                  : `${templates.length} certified bridge projects — click any card to open in Design`}
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-muted" />
            <input
              className="h-8 w-52 rounded-lg border border-[var(--app-glass-border)] bg-app-card/60 pl-8 pr-3 text-xs text-app-fg placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent"
              placeholder="Search by name, river, code…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-app-muted text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading IRC projects…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Could not load templates. Make sure the Bridge Design API is running.
        </div>
      )}

      {/* ── SUBMERSIBLE (IRC SP-13) ── */}
      {submersible.length > 0 && (
        <section>
          <SectionHeader
            icon={<Waves className="h-4 w-4 text-blue-400" />}
            title="Submersible Slab Bridges"
            count={submersible.length}
            countColor="bg-blue-500/20 text-blue-300"
            subtitle="IRC SP-13 · Overtopping permitted at HFL · IRC:6-2016 loads"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {submersible.map(t => (
              <ProjectCard key={t.id} template={t} onLoad={loadIntoDesign} loadingId={loadingId} />
            ))}
          </div>
        </section>
      )}

      {/* ── HIGH-LEVEL (IRC:112-2015) ── */}
      {highLevel.length > 0 && (
        <section>
          <SectionHeader
            icon={<ArrowUpFromLine className="h-4 w-4 text-emerald-400" />}
            title="High-Level Bridges"
            count={highLevel.length}
            countColor="bg-emerald-500/20 text-emerald-300"
            subtitle="IRC:112-2015 · Deck above HFL + freeboard · IRC:6-2016 loads"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {highLevel.map(t => (
              <ProjectCard key={t.id} template={t} onLoad={loadIntoDesign} loadingId={loadingId} />
            ))}
          </div>
        </section>
      )}

      {/* ── GENERIC STARTERS ── */}
      {generic.length > 0 && !q && (
        <section>
          <SectionHeader
            icon={<FolderKanban className="h-4 w-4 text-app-muted" />}
            title="Generic Starter Templates"
            count={generic.length}
            countColor="bg-white/10 text-app-muted"
            subtitle="Parametric starting points — not tied to a specific project"
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {generic.map(t => (
              <ProjectCard key={t.id} template={t} onLoad={loadIntoDesign} loadingId={loadingId} compact />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-app-muted">No projects match "{query}"</p>
      )}
    </div>
  );
}

function SectionHeader({
  icon, title, count, countColor, subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  countColor: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {icon}
      <span className="font-semibold text-app-fg text-sm">{title}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${countColor}`}>{count}</span>
      <span className="text-[11px] text-app-muted">{subtitle}</span>
    </div>
  );
}

function ProjectCard({
  template, onLoad, loadingId, compact = false,
}: {
  template: TemplateItem;
  onLoad: (t: TemplateItem) => void;
  loadingId: string | null;
  compact?: boolean;
}) {
  const badges  = IRC_BADGES[template.id] ?? [];
  const typeBadge = badges[4] ?? badges[3] ?? 'Bridge';
  const isActive = loadingId === template.id;
  const reportUrl = IRC_REPORT_MAP[template.id];
  const inp = template.input as any;

  return (
    <div className="flex flex-col rounded-xl border border-[var(--app-glass-border)] bg-app-card/40 p-4 transition-all hover:border-app-accent/40 hover:bg-app-card/60">
      {/* Top row — type badge + report link */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeColor(typeBadge)}`}>
          {typeBadge}
        </span>
        {reportUrl && (
          <a
            href={reportUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-app-muted underline underline-offset-2 hover:text-app-accent"
            onClick={e => e.stopPropagation()}
          >
            IRC Report ↗
          </a>
        )}
      </div>

      {/* Name */}
      <h4 className="mb-2 text-sm font-semibold leading-snug text-app-fg">{template.name}</h4>

      {!compact && (
        <>
          {/* Key engineering stats */}
          <div className="mb-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-app-muted">
            {inp.spanLength && inp.numberOfSpans && (
              <span>Spans: {inp.numberOfSpans}×{inp.spanLength} m ({(inp.numberOfSpans * inp.spanLength)} m)</span>
            )}
            {inp.carriageWidth && <span>Carriage: {inp.carriageWidth} m</span>}
            {inp.hfl           && <span>HFL: {inp.hfl} m MSL</span>}
            {inp.discharge     && <span>Q: {Number(inp.discharge).toFixed(1)} m³/s</span>}
            {inp.riverName     && <span>River: {inp.riverName}</span>}
            {inp.fck           && <span>M{inp.fck} / Fe{inp.fy ?? 415}</span>}
          </div>

          {/* IRC code chips */}
          <div className="mb-3 flex flex-wrap gap-1">
            {badges.slice(0, 4).map(b => (
              <span key={b} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeColor(b)}`}>{b}</span>
            ))}
          </div>
        </>
      )}

      {compact && (
        <p className="mb-3 text-[11px] text-app-muted leading-relaxed line-clamp-2">{template.description}</p>
      )}

      {/* Load into Design button */}
      <button
        onClick={() => onLoad(template)}
        disabled={!!loadingId}
        className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-app-accent px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isActive
          ? <><Loader2 className="h-3 w-3 animate-spin" /> Opening Design…</>
          : <><span>Load into Design</span><ChevronRight className="h-3 w-3" /></>}
      </button>
    </div>
  );
}
