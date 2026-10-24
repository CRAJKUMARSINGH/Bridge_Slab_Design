import { readFileSync } from 'node:fs';
import { expect } from 'vitest';

type Tol = { rtol: number; atol: number; approvedBy?: string; approvedOn?: string; note?: string };
const reg = JSON.parse(readFileSync('foundation/tolerances.json', 'utf8')) as {
  default: Tol;
  quantities: Record<string, Tol>;
};

/** Throws if the quantity has no registered tolerance — no inventing numbers in tests. */
export function toleranceFor(key: string): Tol {
  if (key === 'default') return reg.default;
  const t = reg.quantities[key];
  if (!t) {
    throw new Error(
      `[tolerances] no registered tolerance for "${key}". Add it to foundation/tolerances.json ` +
      `with approvedBy/approvedOn instead of hard-coding a number in the test.`,
    );
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
