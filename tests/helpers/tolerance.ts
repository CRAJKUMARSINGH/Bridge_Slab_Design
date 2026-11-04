import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

type Tol = { rtol: number; atol: number; approvedBy?: string; approvedOn?: string; note?: string };
type Pending = { quantity: string; owner: string; closingWeek: string; reason: string };
type Reg = { default: Tol; quantities: Record<string, Tol>; pendingApproval?: Pending[] };

const reg = JSON.parse(readFileSync('foundation/tolerances.json', 'utf8').replace(/^\uFEFF/, '')) as Reg;

/**
 * Recorded-pending tolerances, mirroring scripts/foundation/verify-tolerances.mjs.
 * An entry that is not yet approved is NOT automatically a failure — the registry
 * requires it to be recorded in `pendingApproval` (owner + closingWeek + reason),
 * and that record may only shrink. Both enforcement points must agree, or a
 * recorded debt would fail one and pass the other.
 */
const pending = new Map<string, Pending>();
for (const p of reg.pendingApproval ?? []) {
  if (p?.quantity) pending.set(p.quantity, p);
}

/**
 * Quantities compared under the blanket `default` tolerance.
 * Non-empty is a FINDING, not a failure: it says "these leaves have no
 * quantity-specific tolerance yet". The golden test surfaces the list.
 */
const fellThrough = new Set<string>();
export const unregisteredQuantities = (): string[] => [...fellThrough].sort();

/** Quantities compared under a tolerance that is still recorded-pending. Also a FINDING. */
const seenPending = new Set<string>();
export const recordedPendingQuantities = (): string[] => [...seenPending].sort();

function unapprovedReason(t: Tol): string | null {
  if (!t.approvedBy || !t.approvedOn) return 'has no approvedBy/approvedOn';
  if (/PENDING/i.test(t.approvedBy)) return `is still approvedBy="${t.approvedBy}"`;
  return null;
}

/** Resolves a registered tolerance. Falls back to `default`, and records the fall-through. */
export function toleranceFor(key: string): Tol {
  if (key === 'default') return reg.default;
  const t = reg.quantities[key];
  if (!t) {
    fellThrough.add(key);
    return reg.default;
  }
  const why = unapprovedReason(t);
  if (why) {
    const rec = pending.get(key);
    if (!rec || !rec.owner || !rec.closingWeek || !rec.reason) {
      throw new Error(
        `[tolerances] "${key}" ${why} and is not recorded in pendingApproval with ` +
        `owner+closingWeek+reason. A widened tolerance without an approver is a guess.`,
      );
    }
    seenPending.add(key);
  }
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
