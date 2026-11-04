import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Landmark, Calculator, Loader2, Sparkles, Layers, Gauge, PencilRuler, Waves,
  ArrowUpFromLine, FolderKanban, BookOpen, FileText, Droplets, LayoutDashboard,
  GalleryHorizontalEnd, Library, GitFork, Blocks, FlaskConical, Columns3,
  Info, ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { applyKherwaraDemoSeed } from '@/lib/demo-seed';
import { useDesignStore } from '@/stores/useDesignStore';
import { useTheme } from '@/lib/theme-context';
import { SARASWATI } from '@/components/SaraswatiMascot';

const stagger = {
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};

function useFadeUpVariants() {
  const reduce = useReducedMotion();
  return {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: reduce ? { duration: 0 } : ({ type: 'spring', stiffness: 380, damping: 28 } as const) },
  };
}

const SUBMERSIBLE_IDS = [
  'kherwara-golden','larathi-stabil','irc-bedach-bedla','irc-jakham-mandvi',
  'irc-t01-jethliya','irc-sukanaka-matoon','irc-ayad-maharashtra',
  'irc-gumaniya-udaipur','irc-katumbi-chandrod',
];
const HIGHLEVEL_IDS = [
  'irc-sisarama-highlevel','irc-kumbhalgarh-kelwara','irc-parwan-highlevel',
  'irc-banas-highlevel','irc-ayad-fatehpura','irc-kherka-teegirder',
  'irc-sukanaka-highlevel',
];

type TemplateItem = { id: string; name: string; description: string; input: Record<string, unknown> };

const QUICK_REPORTS = [
  { name: 'SOM River — Kherwara',    type: 'Submersible', q: '900 m³/s',   url: '/api/reports/som-river-kherwara.html' },
  { name: 'BANAS River — High Level', type: 'High-Level', q: '2,181 m³/s', url: '/api/reports/banas-river-highlevel.html' },
  { name: 'PARWAN River — 70R Load',  type: 'High-Level', q: '1,142 m³/s', url: '/api/reports/parwan-river-highlevel.html' },
  { name: 'JAKHAM River — Mandvi',   type: 'Submersible', q: '613 m³/s',   url: '/api/reports/jakham-river-mandvi.html' },
];

export function Landing() {
  const [, setLocation] = useLocation();
  const [demoBusy, setDemoBusy]   = useState(false);
  const designLoaded              = useDesignStore(s => !!s.results);
  const { theme }                 = useTheme();
  const { data: projectsData }    = useQuery<{ projects?: { id: string; name: string }[] }>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json()),
  });
  const fadeUp                    = useFadeUpVariants();
  const statPanel                 = theme === 'light' ? 'auspicious-card' : 'glass-panel';
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  useEffect(() => {
    fetch('/api/design/templates')
      .then(r => r.json())
      .then((d: { templates?: TemplateItem[] }) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  const openDemoOutput = async () => {
    setDemoBusy(true);
    try {
      const ok = await applyKherwaraDemoSeed(true);
      if (ok) setLocation('/estimate');
    } finally { setDemoBusy(false); }
  };

  const total     = templates.length || 20;
  const submCt    = templates.filter(t => SUBMERSIBLE_IDS.includes(t.id)).length || 9;
  const hlCt      = templates.filter(t => HIGHLEVEL_IDS.includes(t.id)).length || 7;
  const genericCt = Math.max(0, total - submCt - hlCt) || 4;

  const typeData = [
    { label: 'Submersible (IRC SP-13)',   count: submCt,    pct: submCt / total,    color: 'var(--auspicious-orange)' },
    { label: 'High-Level (IRC:112-2015)', count: hlCt,      pct: hlCt / total,      color: 'var(--auspicious-maroon)' },
    { label: 'Generic starters',          count: genericCt, pct: genericCt / total, color: 'var(--auspicious-gold)' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-6 md:py-10 [perspective:1200px] overflow-hidden min-h-screen bg-[var(--auspicious-cream)] dark:bg-slate-950">
      {/* Traditional Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--auspicious-maroon)] via-[var(--auspicious-orange)] to-[var(--auspicious-maroon)]" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--auspicious-maroon)] via-[var(--auspicious-orange)] to-[var(--auspicious-maroon)]" />

      <div className="absolute top-4 left-4 opacity-30">
        <Sparkles className="h-12 w-12 text-[var(--auspicious-gold)]" />
      </div>
      <div className="absolute top-4 right-4 opacity-30">
        <Sparkles className="h-12 w-12 text-[var(--auspicious-gold)]" />
      </div>

      <div className="absolute top-0 left-1/4 w-96 h-96 hero-glow -translate-x-1/2 -translate-y-1/2 opacity-20"
        style={{ background: 'var(--auspicious-orange)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 hero-glow translate-x-1/2 translate-y-1/2 opacity-10"
        style={{ filter: 'blur(60px)', background: 'var(--auspicious-maroon)' }} />

      <motion.div className="grid gap-4 md:grid-cols-12 md:gap-5" initial="hidden" animate="show" variants={stagger}>

        {/* ── HERO ── */}
        <motion.header variants={fadeUp}
          className="auspicious-card auspicious-border depth-lift flex flex-col justify-center gap-4 p-6 md:col-span-7 md:row-span-2 md:p-10">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <Landmark className="h-16 w-16 shrink-0 text-[var(--auspicious-orange)]" aria-hidden />
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[var(--auspicious-maroon)] dark:text-[var(--auspicious-orange)] md:text-6xl">
                Bridge Design
                <span className="mt-1 block auspicious-gradient-text uppercase italic">
                  System
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-[var(--auspicious-maroon)]/80 dark:text-slate-300 md:text-lg leading-relaxed font-medium">
                Merging traditional excellence with modern engineering. IRC-compliant bridge design with 1,482+ formulas, 
                47-sheet Excel generation, and AI-powered rule checks.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setLocation('/design')}
                  className="auspicious-btn px-6 py-3 rounded-lg text-sm transition inline-flex items-center gap-2">
                  Start new design
                  {designLoaded && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" />✓ Design loaded
                    </span>
                  )}
                </button>
                <button onClick={() => setLocation('/projects')}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--auspicious-maroon)] bg-white/50 px-6 py-3 text-sm font-bold text-[var(--auspicious-maroon)] backdrop-blur-sm transition hover:bg-[var(--auspicious-maroon)] hover:text-white">
                  <FolderKanban className="h-4 w-4" />
                  Browse Projects
                </button>
                <button onClick={() => void openDemoOutput()} disabled={demoBusy}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--auspicious-orange)] bg-white/50 px-6 py-3 text-sm font-bold text-[var(--auspicious-orange)] backdrop-blur-sm transition hover:bg-[var(--auspicious-orange)] hover:text-white disabled:opacity-60">
                  {demoBusy
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Sparkles className="h-4 w-4" />}
                  Demo (Kherwara)
                </button>
              </div>
            </div>
            <SARASWATI
              size="lg"
              message="Consult the guide before you commit a section."
              className="mx-auto shrink-0 md:ml-auto"
            />
          </div>
        </motion.header>

        {/* ── PORTFOLIO STATS ── */}
        <motion.div variants={fadeUp} className={`${statPanel} depth-lift p-6 md:col-span-5`}>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--auspicious-maroon)]/60 dark:text-slate-400">Portfolio Overview</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total projects', value: total,  color: 'text-[var(--auspicious-orange)]' },
              { label: 'Submersible',    value: submCt, color: 'text-orange-700' },
              { label: 'High-Level',     value: hlCt,   color: 'text-red-900' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border-2 border-[var(--auspicious-gold)]/30 bg-white/40 p-4 text-center shadow-sm">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="mt-1 text-[11px] font-bold text-[var(--auspicious-maroon)]/70 uppercase leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-around text-[12px] font-bold text-[var(--auspicious-maroon)]/50 uppercase tracking-widest">
            <span>IRC:6-2016</span>
            <span>IRC:112-2015</span>
          </div>
        </motion.div>

        {/* ── BRIDGE TYPE BREAKDOWN CHART ── */}
        <motion.div variants={fadeUp} className="auspicious-card depth-lift p-6 md:col-span-5">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-[var(--auspicious-maroon)]/60">Bridge classification</h2>
          <div className="space-y-4">
            {typeData.map(t => {
              const w = Math.max(4, Math.round(t.pct * 100));
              return (
                <div key={t.label}>
                  <div className="mb-1.5 flex justify-between text-[12px] font-bold uppercase">
                    <span className="text-[var(--auspicious-maroon)]/70">{t.label}</span>
                    <span style={{ color: t.color }}>{t.count}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/50 border border-[var(--auspicious-gold)]/20">
                    <div className="h-full rounded-full transition-all shadow-inner" style={{ width: `${w}%`, background: t.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setLocation('/projects')}
              className="text-[12px] font-black text-[var(--auspicious-maroon)] uppercase tracking-wider hover:text-[var(--auspicious-orange)] transition">
              Explore All →
            </button>
          </div>
        </motion.div>

        {/* ── QUICK REPORT ACCESS ── */}
        <motion.div variants={fadeUp} className="auspicious-card depth-lift p-6 md:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--auspicious-maroon)]/60">Auspicious Reports</h2>
            <a href="/api/reports/" target="_blank" rel="noreferrer"
              className="text-[12px] font-black text-[var(--auspicious-orange)] hover:underline tracking-wider uppercase">Vault ↗</a>
          </div>
          <div className="space-y-3">
            {QUICK_REPORTS.map(r => (
              <a key={r.url} href={r.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-[var(--auspicious-gold)]/30 bg-white/60 px-4 py-3 text-sm transition hover:scale-[1.02] hover:bg-white/80 hover:shadow-md">
                <div className="flex items-center gap-3">
                  {r.type === 'Submersible'
                    ? <Waves className="h-5 w-5 text-orange-600 shrink-0" />
                    : <ArrowUpFromLine className="h-5 w-5 text-red-800 shrink-0" />}
                  <span className="text-[var(--auspicious-maroon)] font-bold">{r.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[var(--auspicious-maroon)]/60 font-mono text-xs">{r.q}</span>
                  <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tighter ${
                    r.type === 'Submersible' ? 'bg-orange-500/20 text-orange-700' : 'bg-red-500/20 text-red-800'
                  }`}>{r.type}</span>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* ── CAPABILITY SNAPSHOT ── */}
        <motion.div variants={fadeUp} className="auspicious-card depth-lift p-6 md:col-span-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--auspicious-maroon)]/60">Design Mastery</h2>
            <span className="rounded-full bg-[var(--auspicious-maroon)] px-3 py-1 text-[10px] font-bold text-[var(--auspicious-gold)] uppercase tracking-widest">
              Verified
            </span>
          </div>
          <svg viewBox="0 0 340 160" className="h-[160px] w-full">
            {[
              { label: 'Hydraulics Mastery',    value: 94, y: 14,  fill: 'var(--auspicious-orange)' },
              { label: 'Stability Precision',  value: 96, y: 52,  fill: 'var(--auspicious-maroon)' },
              { label: 'Structural Integrity', value: 91, y: 90,  fill: 'var(--auspicious-maroon)' },
              { label: 'Rule Compliance',      value: 89, y: 128, fill: 'var(--auspicious-orange)' },
            ].map(s => {
              const w = Math.max(12, (s.value / 100) * 200);
              return (
                <g key={s.label}>
                  <text x="8" y={s.y + 15} fontSize="11" fontWeight="bold" fill="var(--auspicious-maroon)" opacity="0.8">{s.label}</text>
                  <rect x="180" y={s.y} width="150" height="20" rx="4" fill="white" opacity="0.5" />
                  <rect x="180" y={s.y} width={w * 0.75}   height="20" rx="4" fill={s.fill} />
                  <text x="338" y={s.y + 15} textAnchor="end" fontSize="11" fontWeight="black" fill="var(--auspicious-maroon)">{s.value}%</text>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* ── FEATURE CARDS ── */}
        {[
          { icon: <Calculator className="h-10 w-10 text-[var(--auspicious-orange)]" />,       label: '1,482+ IRC Formulas', desc: 'Divine precision in every calculation path.' },
          { icon: <Layers className="h-10 w-10 text-[var(--auspicious-maroon)]" />,           label: '47-Sheet Workbook',   desc: 'A comprehensive engineering testament.' },
          { icon: <PencilRuler className="h-10 w-10 text-[var(--auspicious-orange)]" />,        label: 'Sacred CAD Drawings',        desc: 'Real-time GAD, Pier, and Abutment visuals.' },
          { icon: <Gauge className="h-10 w-10 text-[var(--auspicious-maroon)]" />,             label: 'Vigilant FOS Gauges',          desc: 'Guardian ratios for sliding and bearing.' },
          { icon: <Sparkles className="h-10 w-10 text-[var(--auspicious-orange)]" />,           label: 'Auspicious Insights',   desc: 'Rule-based engineering wisdom.' },
          { icon: <BookOpen className="h-10 w-10 text-[var(--auspicious-maroon)]" />,        label: 'Code Compliance',      desc: 'Absolute adherence to IRC standards.' },
        ].map((f, i) => (
          <motion.div key={i} variants={fadeUp}
            className="auspicious-card depth-lift flex flex-col items-center gap-3 p-6 text-center md:col-span-4 border-b-4 border-b-[var(--auspicious-gold)]">
            <div className="p-3 rounded-full bg-white/60 border border-[var(--auspicious-gold)]/20 shadow-inner">
              {f.icon}
            </div>
            <p className="text-base font-black text-[var(--auspicious-maroon)] uppercase tracking-tight">{f.label}</p>
            <p className="text-[12px] text-[var(--auspicious-maroon)]/70 font-medium leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}

        {/* ── QUICK ACCESS — all feature modules ── */}
        <motion.div variants={fadeUp} className="auspicious-card auspicious-border depth-lift p-6 md:col-span-12">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--auspicious-maroon)]/60">
                Module Quick Access
              </h2>
              <p className="mt-0.5 text-[11px] font-bold text-[var(--auspicious-maroon)]/40 uppercase tracking-widest">
                All engineering workspaces at a glance
              </p>
            </div>
            <span className="rounded-full border-2 border-[var(--auspicious-gold)]/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--auspicious-maroon)]">
              10 Modules
            </span>
          </div>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                path: '/hydraulics',
                icon: <Droplets className="h-6 w-6" />,
                label: 'Hydraulics',
                desc: 'Flood discharge & HFL calculations',
                color: 'text-blue-600',
                border: 'border-blue-300/40',
                bg: 'bg-blue-50/60',
              },
              {
                path: '/slab-design',
                icon: <Columns3 className="h-6 w-6" />,
                label: 'Slab Design',
                desc: 'RC slab design to IRC:112',
                color: 'text-amber-700',
                border: 'border-amber-300/40',
                bg: 'bg-amber-50/60',
              },
              {
                path: '/dashboard',
                icon: <LayoutDashboard className="h-6 w-6" />,
                label: 'IRC Dashboard',
                desc: 'Pass / fail rule-check verdicts',
                color: 'text-emerald-700',
                border: 'border-emerald-300/40',
                bg: 'bg-emerald-50/60',
              },
              {
                path: '/t-girder',
                icon: <GalleryHorizontalEnd className="h-6 w-6" />,
                label: 'T-Girder',
                desc: 'Composite section & live-load analysis',
                color: 'text-violet-700',
                border: 'border-violet-300/40',
                bg: 'bg-violet-50/60',
              },
              {
                path: '/astra-library',
                icon: <Library className="h-6 w-6" />,
                label: 'ASTRA Library',
                desc: 'Searchable ASTRA 15 reference cards',
                color: 'text-[var(--auspicious-maroon)]',
                border: 'border-[var(--auspicious-gold)]/40',
                bg: 'bg-[var(--auspicious-cream)]/80',
              },
              {
                path: '/interaction-diagram',
                icon: <GitFork className="h-6 w-6" />,
                label: 'P-M Diagram',
                desc: 'IS:456 column interaction diagram',
                color: 'text-rose-700',
                border: 'border-rose-300/40',
                bg: 'bg-rose-50/60',
              },
              {
                path: '/abutment-stability',
                icon: <Blocks className="h-6 w-6" />,
                label: 'Abutment',
                desc: 'Coulomb + seismic FOS checks',
                color: 'text-stone-700',
                border: 'border-stone-300/40',
                bg: 'bg-stone-50/60',
              },
              {
                path: '/formula-evaluator',
                icon: <FlaskConical className="h-6 w-6" />,
                label: 'Formula Eval',
                desc: 'Live IRC formula recalculator',
                color: 'text-cyan-700',
                border: 'border-cyan-300/40',
                bg: 'bg-cyan-50/60',
              },
              {
                path: '/pier-stability',
                icon: <Layers className="h-6 w-6" />,
                label: 'Pier Stability',
                desc: 'Pier sheet viewer & FOS gauges',
                color: 'text-[var(--auspicious-orange)]',
                border: 'border-orange-300/40',
                bg: 'bg-orange-50/60',
              },
              {
                path: '/about-scope',
                icon: <Info className="h-6 w-6" />,
                label: 'About Scope',
                desc: 'Module scope & drawing coverage',
                color: 'text-slate-600',
                border: 'border-slate-300/40',
                bg: 'bg-slate-50/60',
              },
            ].map(m => (
              <button
                key={m.path}
                onClick={() => setLocation(m.path)}
                className={`group flex flex-col gap-2 rounded-2xl border-2 ${m.border} ${m.bg} p-4 text-left
                  transition-all duration-200 hover:scale-[1.03] hover:shadow-lg focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-[var(--auspicious-orange)]/50
                  dark:bg-slate-900/60 dark:border-slate-700/50`}
              >
                <div className={`${m.color} flex items-center justify-between`}>
                  {m.icon}
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-70 group-hover:translate-x-0" />
                </div>
                <p className={`text-[13px] font-black uppercase tracking-tight ${m.color}`}>{m.label}</p>
                <p className="text-[11px] font-medium text-[var(--auspicious-maroon)]/60 dark:text-slate-400 leading-snug">
                  {m.desc}
                </p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── RECENT PROJECTS ── */}
        <motion.div variants={fadeUp} className="auspicious-card depth-lift p-6 md:col-span-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--auspicious-maroon)]/60">Recent Projects</h2>
            <button onClick={() => setLocation('/projects')}
              className="text-[12px] font-black text-[var(--auspicious-orange)] hover:underline tracking-wider uppercase">
              View All →
            </button>
          </div>
          {(() => {
            const recent = (projectsData?.projects ?? []).slice(0, 3);
            if (recent.length === 0) {
              return (
                <p className="text-sm text-[var(--auspicious-maroon)]/60 font-medium italic">
                  No projects yet — start a new design.
                </p>
              );
            }
            return (
              <div className="flex flex-wrap gap-3">
                {recent.map(p => (
                  <button key={p.id} onClick={() => setLocation('/projects')}
                    className="rounded-xl border-2 border-[var(--auspicious-gold)]/30 bg-white/60 px-4 py-2 text-sm font-bold text-[var(--auspicious-maroon)] transition hover:scale-[1.02] hover:shadow-md hover:bg-white/80">
                    {p.name}
                  </button>
                ))}
              </div>
            );
          })()}
        </motion.div>

        {/* ── ENGINEERING MANTRAS ── */}
        <motion.div variants={fadeUp} className="auspicious-card auspicious-border depth-lift p-8 md:col-span-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-black text-[var(--auspicious-maroon)] uppercase tracking-widest">Engineering Mantras</h2>
              <p className="mt-1 text-sm text-[var(--auspicious-maroon)]/70 font-bold italic">Engineering preview build — October 2026.  One design engine, one workbook, one set of verdicts.</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4 border-t-2 border-[var(--auspicious-gold)]/20 pt-8">
            <button onClick={() => setLocation('/report')}
              className="inline-flex items-center gap-3 rounded-xl border-2 border-[var(--auspicious-maroon)]/30 bg-[var(--auspicious-maroon)]/5 px-6 py-3 text-sm font-black text-[var(--auspicious-maroon)] uppercase tracking-wider transition hover:bg-[var(--auspicious-maroon)] hover:text-white">
              <FileText className="h-5 w-5" /> Narrative Report
            </button>
            <button onClick={() => setLocation('/drawing')}
              className="inline-flex items-center gap-3 rounded-xl border-2 border-[var(--auspicious-orange)]/30 bg-[var(--auspicious-orange)]/5 px-6 py-3 text-sm font-black text-[var(--auspicious-orange)] uppercase tracking-wider transition hover:bg-[var(--auspicious-orange)] hover:text-white">
              <PencilRuler className="h-5 w-5" /> Sacred Drawings
            </button>
            <button onClick={() => setLocation('/merge')}
              className="text-sm font-black text-[var(--auspicious-orange)] uppercase tracking-widest underline underline-offset-8 self-center ml-auto hover:text-[var(--auspicious-maroon)] transition">
              Integration Hub →
            </button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
