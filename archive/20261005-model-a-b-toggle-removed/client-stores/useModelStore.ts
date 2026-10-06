/**
 * Model Store — Zustand store for Model A/B toggle
 * ───────────────────────────────────────────────────
 * MERGE NOTE: New component per Genius Prompt Rule 6.
 * Persists user preference in localStorage.
 * Trial period: April–May 2026 (closed without a recorded decision).
 *
 * Model A = "Industrial Core" — raw-data-first preference
 * Model B = "Premium Presentation" — styled-report preference
 * Both preferences currently produce the same ExcelJS workbook; the generator has
 * no second engine, so this store records a user preference only.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelVariant = 'model-a' | 'model-b';

interface ModelStore {
  activeModel: ModelVariant;
  setModel: (model: ModelVariant) => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      activeModel: 'model-a',
      setModel: (model) => set({ activeModel: model }),
    }),
    { name: 'bridge-slab-model-preference' }
  )
);
