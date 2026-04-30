/**
 * Typed accessors for narrative generation — avoids pier/abutment key collisions in merged result bags.
 */

import type { AbutmentDesignResult, LoadCase, PierDesignResult, ProjectInput } from '../types';
import { computeDeckNarrativeBundle, type DeckNarrativeBundle } from './deck-narrative-math';

export function fmt(x: unknown, decimals = 2, fallback = '—'): string {
  if (typeof x === 'number' && Number.isFinite(x)) return x.toFixed(decimals);
  return fallback;
}

export function deckBundle(inp: ProjectInput, r: Record<string, unknown>): DeckNarrativeBundle {
  const cached = r.deckNarrative as DeckNarrativeBundle | undefined;
  if (cached) return cached;
  return computeDeckNarrativeBundle(inp);
}

export function getPier(r: Record<string, unknown>): PierDesignResult | undefined {
  return (r.pierData as PierDesignResult | undefined) ?? (r.pier as PierDesignResult | undefined);
}

export function getAbutT1(r: Record<string, unknown>): AbutmentDesignResult | undefined {
  return (r.abutmentT1Data as AbutmentDesignResult | undefined) ?? (r.abutmentType1 as AbutmentDesignResult | undefined);
}

export function getAbutC1(r: Record<string, unknown>): AbutmentDesignResult | undefined {
  return (r.abutmentC1Data as AbutmentDesignResult | undefined) ?? (r.abutmentC1 as AbutmentDesignResult | undefined);
}

export function minFosCase(cases: LoadCase[] | undefined, key: 'slidingFOS' | 'overturningFOS' | 'bearingFOS'): LoadCase | undefined {
  if (!cases?.length) return undefined;
  return cases.reduce((a, b) => (a[key] <= b[key] ? a : b));
}

export function allCasesSafe(cases: LoadCase[] | undefined): boolean {
  if (!cases?.length) return true;
  return cases.every((c) => c.status === 'SAFE' || c.status === 'CHECK');
}

/** IRC:6 Cl.208 impact % for simply supported span L (m), same form as ircSlabCalc. */
export function impactPercentIRC6(L: number): number {
  if (L <= 3) return 50;
  if (L <= 45) return (1 + 4.5 / (6 + L)) * 100;
  return 10;
}
