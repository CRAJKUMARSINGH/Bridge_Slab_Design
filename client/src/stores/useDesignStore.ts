import { create } from 'zustand';
import type { CompleteDesignResult } from '../../../bridge-excel-generator/types';

type DesignState = {
  results: CompleteDesignResult | null;
  setResults: (r: CompleteDesignResult | null) => void;
  hydrateFromStorage: () => void;
};

const STORAGE_KEY = 'lastDesignResults';

function readStoredResults(): CompleteDesignResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { results?: CompleteDesignResult };
    return parsed?.results ?? null;
  } catch {
    return null;
  }
}

export const useDesignStore = create<DesignState>((set) => ({
  // Read at store creation: the previous effect-based hydration painted one empty frame
  // before the stored design appeared.
  results: readStoredResults(),

  setResults: (results) => {
    set({ results });
    if (results) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ results }));
      } catch {
        /* ignore quota */
      }
    }
  },

  hydrateFromStorage: () => {
    const stored = readStoredResults();
    if (stored) set({ results: stored });
  },
}));
