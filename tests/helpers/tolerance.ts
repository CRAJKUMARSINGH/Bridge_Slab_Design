import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

type Tol = { rtol: number; atol: number; approvedBy?: string; approvedOn?: string; note?: string };
type Reg = { default: Tol; quantities: Record<string, Tol> };

const reg = JSON.parse(readFileSync('foundation/tolerances.json', 'utf8').replace(/^\uFEFF/, '')) as Reg;

/**
 * Quantities compared under the blanket `default` tolerance.
 * Non-empty is a FINDING, not a failure: it says "these leaves have no
 * quantity-specific tolerance yet". The golden test surfaces the list.
 */
const fellThrough = new Set<string>();
export const unregisteredQuantities = (): string[] => [...fellThrough].sort();

function assertApproved(key: string, t: Tol): void {
  if (!t.approvedBy || !t.approvedOn) {
    throw new Error(
      `[tolerances] "${key}" has no approvedBy/approvedOn. ` +
      `A widened tolerance without an approver is a guess.`,
    );
  }
  if (/PENDING/i.test(t.approvedBy)) {
    throw new Error(
      `[tolerances] "${key}" is still approvedBy="${t.approvedBy}". ` +
      `Get the licensed engineer's ruling and replace it.`,
    );
  }
}

/** Resolves a registered tolerance. Falls back to `default`, and records the fall-through. */
export function toleranceFor(key: string): Tol {
  if (key === 'default') return reg.default;
  const t = reg.quantities[key];
  if (!t) {
    fellThrough.add(key);
    return reg.default;
  }
  assertApproved(key, t);
  return { ...reg.default, ...t };
}

export function expectWithin(key: string, actual: number, expected: number): void {
  const { rtol, atol } = toleranceFor(key);
  const diff = Math.abs(actual - expected);
  const allowed = atol + rtol * Math.abs(expected);
  expect(
    diff <= allowed,
    `[${key}] |${actual} - ${expected}| = ${diff} exceeds allowed ${allowed} (rtol=${rtol}, atol=${atol})`,
  ).toBe(true);
}
