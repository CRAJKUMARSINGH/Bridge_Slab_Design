/**
 * Design History Store
 * Persists the last 30 calculation runs in localStorage so engineers can
 * track how a design evolved and restore any previous state.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectInput } from '../../../bridge-excel-generator/types';

export type HistoryVerdict = 'PASS' | 'WARN' | 'FAIL';

export interface HistoryEntry {
  id: string;
  timestamp: number;

  // Identity
  projectName: string;
  bridgeType: string;
  templateId: string | null;

  // Key inputs
  discharge: number;
  numberOfSpans: number;
  spanLength: number;

  // Key hydraulic results
  afflux: number;
  velocity: number;
  scourDepth: number;
  froudeNumber: number;
  waterwayRatio: number;    // provided / Lacey's

  // Worst pier stability FOS
  pierSlidingFOS: number;
  pierOverturningFOS: number;

  // IRC compliance summary
  verdict: HistoryVerdict;
  passCount: number;
  warnCount: number;
  failCount: number;

  // Seismic check (Zone III default — IRC:6-2016 Cl. 219)
  seismicAh?: number;
  seismicPierSlideFOS?: number;
  seismicPierOTFOS?: number;
  seismicVerdict?: HistoryVerdict;

  // Wind load check (Vb default — IRC:6-2016 Cl. 212)
  windVd?: number;
  windPd?: number;
  windPierSlideFOS?: number;
  windVerdict?: HistoryVerdict;

  // Full draft snapshot for restoration
  draft: ProjectInput;
}

const MAX_ENTRIES = 30;

interface DesignHistoryStore {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

export const useDesignHistory = create<DesignHistoryStore>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const filtered = state.entries.filter(
            (e) =>
              // deduplicate: don't add if the last entry has the same project
              // and identical key results (prevents double-recording on rerenders)
              !(
                e.projectName === entry.projectName &&
                Math.abs(e.timestamp - entry.timestamp) < 2000 &&
                e.afflux === entry.afflux
              )
          );
          const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
          return { entries: next };
        }),

      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

      clearAll: () => set({ entries: [] }),
    }),
    { name: 'bridge-design-history-v1' }
  )
);
