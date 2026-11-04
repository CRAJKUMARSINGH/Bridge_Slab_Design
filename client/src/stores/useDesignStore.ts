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
    const results = parsed?.results;
    // A payload saved before the response carried its acceptance rule (§Y-5) has verdicts with no
    // limits to gauge them against; treat it as absent so the app refetches instead of painting
    // gauges whose pass mark is invisible.
    if (!results?.stabilityAcceptance) return null;
    return results;
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
