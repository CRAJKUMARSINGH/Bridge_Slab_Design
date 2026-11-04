/**
 * Model Store — Zustand store for Model A/B toggle
 * ───────────────────────────────────────────────────
 * MERGE NOTE: New component per Genius Prompt Rule 6.
 * Persists user preference in localStorage.
 * Trial period: April–May 2026. Final selection after user evaluation.
 *
 * Model A = "Industrial Core" — SheetJS-based, raw data precision
 * Model B = "Premium Presentation" — ExcelJS-based, Som River benchmark styling
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
