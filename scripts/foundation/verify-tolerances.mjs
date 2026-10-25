#!/usr/bin/env node
/**
 * F-tol — every registered tolerance must carry an approver, and PENDING must be visible.
 *
 * A widened tolerance with no licensed-engineer ruling is a guess, and a guess
 * inside a numeric-regression gate is a silent pass. `--strict` (how the harness
 * wires this script) exits non-zero for any entry that is missing
 * approvedBy/approvedOn or still marked PENDING — EXCEPT an entry named in the
 * registry's own `pendingApproval` list, which records an owner, a closing week
 * and a reason for the debt.
 *
 * That record is what separates a known, owned, expiring debt from an unnoticed
 * one — an unnoticed one is the silent pass this script exists to refuse.
 * A pending entry is still printed on every run; a malformed record (no
 * quantity/owner/closingWeek/reason) fails; and an entry that is BOTH approved
 * and recorded fails as stale — so the pending list may only shrink.
 *
 * Usage: node scripts/foundation/verify-tolerances.mjs [--strict]
 */
import { readFileSync } from 'node:fs';

const STRICT = process.argv.includes('--strict');
const reg = JSON.parse(readFileSync('foundation/tolerances.json', 'utf8').replace(/^\uFEFF/, ''));

const pending = new Map();
const malformed = [];
for (const p of reg.pendingApproval ?? []) {
  const missing = ['quantity', 'owner', 'closingWeek', 'reason'].filter((k) => !p?.[k]);
  if (missing.length) malformed.push(`pendingApproval entry "${p?.quantity ?? '(no quantity)'}": missing ${missing.join(', ')}`);
  else pending.set(p.quantity, p);
}

const bad = [];
const exempt = [];
for (const [k, t] of Object.entries(reg.quantities ?? {})) {
  const why = !t.approvedBy || !t.approvedOn
    ? 'missing approvedBy/approvedOn'
    : /PENDING/i.test(t.approvedBy)
      ? `approvedBy="${t.approvedBy}"`
      : null;
  if (!why) {
    if (pending.has(k)) bad.push(`${k}: approved AND still recorded in pendingApproval — delete the record`);
    continue;
  }
  const rec = pending.get(k);
  if (rec) exempt.push(`${k}: ${why} — recorded ${rec.owner}/${rec.closingWeek}`);
  else bad.push(`${k}: ${why}`);
}
const d = reg.default;
if (!d?.approvedBy || !d?.approvedOn) bad.push('default: missing approvedBy/approvedOn');

console.log(
  `verify:tolerances — ${Object.keys(reg.quantities ?? {}).length} registered, ` +
  `${bad.length} unapproved, ${exempt.length} recorded-pending${STRICT ? '' : ' (report-only)'}`,
);
bad.forEach((b) => console.log('  UNAPPROVED  ' + b));
exempt.forEach((e) => console.log('  PENDING     ' + e));
malformed.forEach((m) => console.log('  MALFORMED   ' + m));
if ((bad.length || malformed.length) && STRICT) process.exit(1);
