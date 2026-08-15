import { toast } from 'sonner';
import type { CompleteDesignResult } from '../../../bridge-excel-generator/types';
import { useDesignStore } from '@/stores/useDesignStore';

const FIRST_SEED_FLAG = 'bridgeDesignW16FirstSeed';

/**
 * Load Kherwara golden input from the API, persist for Drawing/Estimate, optionally hydrate the design store.
 * @param force — replace existing `lastDesignInput` and refresh results (e.g. Landing “View demo” button).
 */
export async function applyKherwaraDemoSeed(force = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (force) {
    localStorage.removeItem(FIRST_SEED_FLAG);
  }

  try {
    const res = await fetch('/api/design/demo-seed');
    if (!res.ok) return false;
    const data = (await res.json()) as {
      success?: boolean;
      templateId?: string;
      input?: Record<string, unknown>;
    };
    if (!data.success || !data.input) return false;

    localStorage.setItem('lastDesignInput', JSON.stringify(data.input));
    if (data.templateId) {
      localStorage.setItem('designLastTemplateId', data.templateId);
    }

    const r2 = await fetch('/api/design/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.input),
    });

    if (r2.ok) {
      const out = (await r2.json()) as { success?: boolean; results?: CompleteDesignResult };
      if (out.success && out.results) {
        useDesignStore.getState().setResults(out.results);
      }
    }

    localStorage.setItem(FIRST_SEED_FLAG, '1');

    if (r2.ok) {
      toast.success('Kherwara demo design loaded — Estimate, Drawing, and Pier stability are ready.');
    } else {
      toast.message('Demo input saved. Open Design and run an export if results did not load.');
    }
    return true;
  } catch {
    return false;
  }
}

/** When there is no saved input, fetch demo seed once (first visit with API available). */
export async function installFirstRunDemoIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('lastDesignInput')) return;
  if (localStorage.getItem(FIRST_SEED_FLAG) === '1') return;
  await applyKherwaraDemoSeed(false);
}
