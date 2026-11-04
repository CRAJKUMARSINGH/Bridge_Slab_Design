/**
 * ModelSwitcher — Clean toggle between Model A and Model B
 * ─────────────────────────────────────────────────────────
 * MERGE NOTE: Per Genius Prompt Rule 6 — "Add a clean toggle/switcher labeled
 * 'Model A' and 'Model B'. Include a note: 'Final model selection will be made
 * after 1-month user trial (April–May 2026)'."
 *
 * Styled to match Repo A's dark orchid/royal blue design language.
 */
import { useModelStore, type ModelVariant } from '@/stores/useModelStore';
import { Database, FileSpreadsheet } from 'lucide-react';

const models: { id: ModelVariant; label: string; sublabel: string; icon: typeof Database }[] = [
  {
    id: 'model-a',
    label: 'Model A',
    sublabel: 'Industrial Core',
    icon: Database,
  },
  {
    id: 'model-b',
    label: 'Model B',
    sublabel: 'Premium Presentation',
    icon: FileSpreadsheet,
  },
];

export function ModelSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeModel, setModel } = useModelStore();

  return (
    <div
      role="group"
      aria-labelledby="model-switcher-label"
      className="rounded-xl border border-app-border p-4 bg-app-surface"
    >
      {!compact && (
        <p
          id="model-switcher-label"
          className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-3"
        >
          Calculation Engine
        </p>
      )}

      <div className="flex gap-2" role="radiogroup">
        {models.map(({ id, label, sublabel, icon: Icon }) => (
          <button
            key={id}
            role="radio"
            aria-checked={activeModel === id}
            onClick={() => setModel(id)}
            className={[
              'flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orchid/50',
              activeModel === id
                ? 'border-orchid bg-orchid/10 text-orchid shadow-sm shadow-orchid/10'
                : 'border-app-border bg-transparent text-app-muted hover:bg-app-hover hover:text-app-text',
            ].join(' ')}
          >
            <Icon size={14} />
            <div className="text-left">
              <div className="text-xs font-bold">{label}</div>
              {!compact && (
                <div className="text-[10px] opacity-70">{sublabel}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {!compact && (
        <p className="mt-3 text-[10px] text-app-muted leading-relaxed">
          <strong className="font-semibold text-app-text">Trial period:</strong>{' '}
          Both models are available for evaluation. Final model selection after
          the April–May 2026 user trial. Compare outputs before use in
          production submissions.
        </p>
      )}
    </div>
  );
}
