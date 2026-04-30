import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, useReducedMotion } from 'framer-motion';
import { Landmark, Calculator, FileText, Loader2, Sparkles, Layers, Gauge, PencilRuler } from 'lucide-react';
import { applyKherwaraDemoSeed } from '@/lib/demo-seed';
import { useModelStore } from '@/stores/useModelStore';
import { useTheme } from '@/lib/theme-context';

const stagger = {
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

function useFadeUpVariants() {
  const reduce = useReducedMotion();
  return {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : ({ type: 'spring', stiffness: 380, damping: 28 } as const),
    },
  };
}

export function Landing() {
  const [, setLocation] = useLocation();
  const [demoBusy, setDemoBusy] = useState(false);
  const { activeModel, setModel } = useModelStore();
  const { theme } = useTheme();
  const fadeUp = useFadeUpVariants();
  const statPanel = theme === 'light' ? 'neo-surface' : 'glass-panel';

  const openDemoOutput = async () => {
    setDemoBusy(true);
    try {
      const ok = await applyKherwaraDemoSeed(true);
      if (ok) setLocation('/estimate');
    } finally {
      setDemoBusy(false);
    }
  };

  const chooseModel = (model: 'A' | 'B') => {
    setModel(model === 'B' ? 'model-b' : 'model-a');
  };

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-8 md:py-12 [perspective:1200px] overflow-hidden">
      {/* 2025 Hero Glow Backgrounds */}
      <div className="absolute top-0 left-1/4 w-96 h-96 hero-glow -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 hero-glow translate-x-1/2 translate-y-1/2 opacity-20" style={{ filter: 'blur(60px)', background: 'var(--neon-purple)' }} />

      <motion.div
        className="grid gap-4 md:grid-cols-12 md:gap-5"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {/* Hero - spans most of top row (bento) */}
        <motion.header
          variants={fadeUp}
          className="glass-panel depth-lift flex flex-col justify-center gap-4 p-6 text-center md:col-span-7 md:row-span-2 md:p-10 md:text-left"
        >
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <Landmark className="h-16 w-16 shrink-0 text-app-accent md:h-20 md:w-20" aria-hidden />
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-app-fg md:text-5xl lg:text-6xl">
                Bridge Design
                <span className="mt-1 block text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 dark:from-cyan-300 dark:via-cyan-400 dark:to-fuchsia-400 drop-shadow-[0_0_35px_var(--app-accent-glow)]">
                  System
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-app-muted md:text-lg">
                Professional bridge design with 1,482+ IRC formulas and 47-sheet Excel generation.
              </p>
            </div>
          </div>
        </motion.header>

        <motion.div
          variants={fadeUp}
          className={`${statPanel} depth-lift bento-stat p-6 md:col-span-5`}
        >
          <Calculator className="mx-auto mb-3 h-10 w-10 text-app-accent md:mx-0" aria-hidden />
          <h2 className="text-center text-lg font-semibold text-app-fg md:text-left">1,482+ IRC formulas</h2>
          <p className="mt-2 text-center text-sm text-app-muted md:text-left leading-relaxed">
            IRC:6-2016 aligned calculation paths for hydraulics, stability, and deliverables.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className={`${statPanel} depth-lift bento-stat p-6 md:col-span-5`}
        >
          <Layers className="mx-auto mb-3 h-10 w-10 text-violet-500 dark:text-violet-400 md:mx-0" aria-hidden />
          <h2 className="text-center text-lg font-semibold text-app-fg md:text-left">47-sheet workbook</h2>
          <p className="mt-2 text-center text-sm text-app-muted md:text-left leading-relaxed">
            Excel output structured like senior engineer reference books - not a simplified summary.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-panel depth-lift p-6 md:col-span-12"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-app-fg">Model selector</h2>
              <p className="mt-1 text-sm text-app-muted">
                Final model selection will be made after 1-month user trial (April-May 2026).
              </p>
            </div>
            <div className="inline-flex rounded-xl border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] p-1">
              <button
                type="button"
                onClick={() => chooseModel('A')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeModel === 'model-a'
                    ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-app-fg/80 hover:text-app-fg'
                }`}
                aria-pressed={activeModel === 'model-a'}
              >
                Model A
              </button>
              <button
                type="button"
                onClick={() => chooseModel('B')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeModel === 'model-b'
                    ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-app-fg/80 hover:text-app-fg'
                }`}
                aria-pressed={activeModel === 'model-b'}
              >
                Model B
              </button>
            </div>
          </div>
          <p className="mt-4 border-t border-[var(--app-glass-border)] pt-4 text-center text-sm text-app-muted md:text-left">
            <button
              type="button"
              onClick={() => setLocation('/merge')}
              className="font-semibold text-app-accent underline-offset-2 hover:underline"
            >
              Open merge integration hub
            </button>
            <span className="hidden sm:inline"> — unified Repo A + B routes, feature flags, and model context.</span>
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-panel depth-lift p-6 md:col-span-12"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-app-fg">Design capability snapshot</h2>
            <span className="rounded-full border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] px-3 py-1 text-xs text-app-muted">
              SVG dashboard preview
            </span>
          </div>
          <p className="mb-4 text-sm text-app-muted">
            Quick readiness view for the current merge stream. Final numerical values are generated from the design engine on the Design page.
          </p>
          <svg viewBox="0 0 720 220" className="h-[220px] w-full">
            {[
              { label: 'Hydraulics', value: activeModel === 'model-a' ? 94 : 92, y: 24, fill: '#06b6d4' },
              { label: 'Stability checks', value: activeModel === 'model-a' ? 96 : 95, y: 74, fill: '#8b5cf6' },
              { label: 'Workbook parity', value: activeModel === 'model-a' ? 91 : 90, y: 124, fill: '#22c55e' },
              { label: 'Report prose', value: activeModel === 'model-a' ? 89 : 93, y: 174, fill: '#f97316' },
            ].map((s) => {
              const width = Math.max(20, (s.value / 100) * 460);
              return (
                <g key={s.label}>
                  <text x="20" y={s.y + 16} fontSize="13" fill="currentColor" className="text-app-muted">
                    {s.label}
                  </text>
                  <rect x="200" y={s.y} width="460" height="26" rx="8" fill="currentColor" className="text-app-card/80" />
                  <rect x="200" y={s.y} width={width} height="26" rx="8" fill={s.fill} opacity="0.95" />
                  <text x={670} y={s.y + 17} textAnchor="end" fontSize="12" fill="currentColor" className="text-app-fg">
                    {s.value}%
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-panel depth-lift flex flex-col items-center justify-center gap-2 p-6 text-center md:col-span-4"
        >
          <Gauge className="h-9 w-9 text-app-accent" aria-hidden />
          <p className="text-sm font-medium text-app-fg">Hydraulics to estimation</p>
          <p className="text-xs text-app-muted">One pipeline from inputs to BOQ-style rolls.</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-panel depth-lift flex flex-col items-center justify-center gap-2 p-6 text-center md:col-span-4"
        >
          <FileText className="h-9 w-9 text-violet-500 dark:text-violet-400" aria-hidden />
          <p className="text-sm font-medium text-app-fg">Reports & previews</p>
          <p className="text-xs text-app-muted">In-browser sheet grids mirror workbook cells.</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-panel depth-lift flex flex-col items-center justify-center gap-2 p-6 text-center md:col-span-4"
        >
          <PencilRuler className="h-9 w-9 text-app-accent" aria-hidden />
          <p className="text-sm font-medium text-app-fg">CAD Drawings</p>
          <p className="text-xs text-app-muted">Real-time SVG schematics for GAD, Pier, and Abutment.</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="glass-panel flex flex-col items-stretch justify-center gap-3 p-6 sm:flex-row sm:items-center md:col-span-12"
        >
          <button
            type="button"
            onClick={() => setLocation('/design')}
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-[filter,transform] hover:brightness-110 active:scale-[0.99] dark:from-cyan-500 dark:to-fuchsia-600 dark:shadow-[0_0_32px_-6px_color-mix(in_oklab,var(--app-accent)_45%,transparent)]"
          >
            Start new design
          </button>
          <button
            type="button"
            onClick={() => void openDemoOutput()}
            disabled={demoBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--app-glass-border)] bg-[var(--app-glass-bg)] px-6 py-3.5 text-base font-semibold text-app-fg backdrop-blur-md transition-[border-color,box-shadow,opacity] hover:border-app-accent/50 hover:shadow-[0_0_24px_-8px_var(--app-accent-glow)] disabled:opacity-60"
          >
            {demoBusy ? (
              <Loader2 className="h-5 w-5 animate-spin text-app-accent" aria-hidden />
            ) : (
              <Sparkles className="h-5 w-5 text-app-accent" aria-hidden />
            )}
            View demo output (Kherwara seed)
          </button>
          <button
            type="button"
            onClick={() => setLocation('/report')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-6 py-3.5 text-base font-semibold text-violet-600 dark:text-violet-400 backdrop-blur-md transition hover:bg-violet-500/20"
          >
            <FileText className="h-5 w-5" aria-hidden />
            Narrative report
          </button>
          <button
            type="button"
            onClick={() => setLocation('/drawing')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3.5 text-base font-semibold text-cyan-600 dark:text-cyan-400 backdrop-blur-md transition hover:bg-cyan-500/20"
          >
            <PencilRuler className="h-5 w-5" aria-hidden />
            View Drawings
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}



