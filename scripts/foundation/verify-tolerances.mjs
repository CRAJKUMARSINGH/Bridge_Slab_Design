#!/usr/bin/env node
/**
 * F-tol — every registered tolerance must carry an approver, and PENDING must be visible.
 *
 * A widened tolerance with no licensed-engineer ruling is a guess, and a guess
 * inside a numeric-regression gate is a silent pass. This script makes both
 * states loud: `--strict` (the wired default) exits non-zero for any entry that
 * is missing approvedBy/approvedOn or still marked PENDING.
 *
 * Usage: node scripts/foundation/verify-tolerances.mjs [--strict]
 */
import { readFileSync } from 'node:fs';

const STRICT = process.argv.includes('--strict');
const reg = JSON.parse(readFileSync('foundation/tolerances.json', 'utf8').replace(/^\uFEFF/, ''));

const bad = [];
for (const [k, t] of Object.entries(reg.quantities ?? {})) {
  if (!t.approvedBy || !t.approvedOn) bad.push(`${k}: missing approvedBy/approvedOn`);
  else if (/PENDING/i.test(t.approvedBy)) bad.push(`${k}: approvedBy="${t.approvedBy}"`);
}
const d = reg.default;
if (!d?.approvedBy || !d?.approvedOn) bad.push('default: missing approvedBy/approvedOn');

console.log(
  `verify:tolerances — ${Object.keys(reg.quantities ?? {}).length} registered, ` +
  `${bad.length} unapproved${STRICT ? '' : ' (report-only)'}`,
);
bad.forEach((b) => console.log('  ' + b));
if (bad.length && STRICT) process.exit(1);
