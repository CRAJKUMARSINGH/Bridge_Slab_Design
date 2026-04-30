import { create } from 'zustand';
import type { CompleteDesignResult } from '../../../bridge-excel-generator/types';

type DesignState = {
  results: CompleteDesignResult | null;
  setResults: (r: CompleteDesignResult | null) => void;
  hydrateFromStorage: () => void;
};

const STORAGE_KEY = 'lastDesignResults';

export const useDesignStore = create<DesignState>((set) => ({
  results: null,

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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { results?: CompleteDesignResult };
      if (parsed?.results) set({ results: parsed.results });
    } catch {
      /* ignore */
    }
  },
}));
