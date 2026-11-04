#!/usr/bin/env node
/**
 * GATE G1 — structure, engine pin, lockfile discipline, LFS resolution, anti-vacuity.
 * Prints OK only if every assertion actually executed.
 */
import { readFileSync, existsSync, readdirSync, openSync, readSync, closeSync } from 'node:fs';
import { createHash } from 'node:crypto';

const failures = [];
const checks = [];
let assertionsRun = 0;

function assert(cond, msg) {
  assertionsRun++;
  checks.push(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures.push(msg);
}

/** Every manifest read goes through here so a BOM can never break a gate. */
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

const manifest = readJson('foundation/manifest.json');
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// ── 1. required paths ───────────────────────────────────────────────────────
assert(Array.isArray(manifest.requiredPaths) && manifest.requiredPaths.length > 0,
  'manifest.requiredPaths is a non-empty array');
for (const p of manifest.requiredPaths) assert(existsSync(p), `required path exists: ${p}`);

// ── 2. charter drift is documented, not rediscovered every week ─────────────
// FIX #8: an empty list is a legitimate state ("no recorded drift"). What was
// dishonest is that emptiness was invisible: the loop silently ran zero times
// and nothing said so. Require the field to be an explicit array, and keep the
// per-entry check, so the record is either declared-empty on purpose or wrong.
assert(Array.isArray(manifest.charterClaimsAbsentPaths),
  `manifest.charterClaimsAbsentPaths is an array (recorded drift: ${Array.isArray(manifest.charterClaimsAbsentPaths) ? manifest.charterClaimsAbsentPaths.length : 'n/a'} entries)`);
for (const p of manifest.charterClaimsAbsentPaths)
  assert(!existsSync(p), `charter-claimed-but-absent path still absent: ${p}`);

// ── 3. engine pin ───────────────────────────────────────────────────────────
assert(Array.isArray(manifest.engineModules) && manifest.engineModules.length > 0,
  'manifest.engineModules is a non-empty array');
if (!existsSync('foundation/engine.lock.json')) {
  assert(false, 'engine.lock.json exists — run: node scripts/foundation/lock-engine.mjs');
} else {
  const lock = readJson('foundation/engine.lock.json');
  for (const rel of manifest.engineModules) {
    if (!existsSync(rel)) { assert(false, `engine module present: ${rel}`); continue; }
    assert(lock[rel] === sha256(rel), `engine hash matches lock: ${rel}`);
  }
  for (const rel of Object.keys(lock))
    assert(manifest.engineModules.includes(rel), `no orphan entries in lock: ${rel}`);
}

// ── 4. exactly the declared lockfiles, and nothing that merely looks like one ─
// FIX #10: match by prefix, so `pnpm-lock.yaml.2557159217` is caught.
const KNOWN = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'];
const rootFiles = readdirSync('.').filter((f) => !f.startsWith('.'));
const present = rootFiles.filter((f) => KNOWN.some((k) => f === k || f.startsWith(`${k}.`)));
const expected = manifest.expectedLockfiles ?? [];
const extra = present.filter((f) => !expected.includes(f));
const missing = expected.filter((f) => !present.includes(f));
assert(
  extra.length === 0 && missing.length === 0,
  `lockfiles: expected [${expected.join(', ')}], found [${present.join(', ')}]` +
  (extra.length ? ` — unexpected/stray: ${extra.join(', ')}` : '') +
  (missing.length ? ` — missing: ${missing.join(', ')}` : ''),
);

// ── 5. LFS must be resolved ─────────────────────────────────────────────────
// FIX: read only the first 200 bytes; a 10 MB xlsx must not be decoded to check 50 chars.
function isPointer(p) {
  const fd = openSync(p, 'r');
  try {
    const buf = Buffer.alloc(200);
    const n = readSync(fd, buf, 0, 200, 0);
    return buf.subarray(0, n).toString('utf8').startsWith('version https://git-lfs');
  } finally { closeSync(fd); }
}
let pointerCount = 0;
assert(Array.isArray(manifest.lfsWatch) && manifest.lfsWatch.length > 0,
  'manifest.lfsWatch is a non-empty array');
for (const f of manifest.lfsWatch) {
  if (!existsSync(f)) { assert(false, `lfs-watched file present: ${f}`); continue; }
  const ptr = isPointer(f);
  if (ptr) pointerCount++;
  assert(!ptr, `LFS resolved (not a pointer): ${f} — run: git lfs pull`);
}

// ── 6. registries parse and are non-empty ───────────────────────────────────
for (const r of manifest.registries) {
  if (!existsSync(r)) { assert(false, `registry present: ${r}`); continue; }
  let ok = false, n = 0;
  try {
    const j = readJson(r);
    n = Array.isArray(j) ? j.length : Object.keys(j).length;
    ok = n > 0;
  } catch { ok = false; }
  assert(ok, `registry parses and is non-empty: ${r} (${n} entries)`);
}

// ── 7. anti-vacuity, budgeted from the manifest rather than hard-coded ──────
// FIX #11: the floor is derived, so it tracks the real size of the declaration
// instead of a magic `> 20` that a shrinking manifest walks straight past.
// `fixed` counts the structural assertions that do not come from a list:
// requiredPaths-array, charterClaimsAbsentPaths-array, engineModules-array,
// lockfiles-exact, lfsWatch-array, and this budget assertion itself.
// `engineModules.length * 2` because each module produces BOTH a hash-check and
// an orphan-check assertion (gate-contracts guarantees lock keys == engineModules).
const fixed = 6;
const budget =
  manifest.requiredPaths.length +
  manifest.charterClaimsAbsentPaths.length +
  manifest.engineModules.length * 2 +
  manifest.lfsWatch.length +
  manifest.registries.length +
  fixed;
assert(
  assertionsRun >= budget,
  `assertion budget met (ran ${assertionsRun}, budget ${budget}) — a lower count means a loop did not execute`,
);

console.log(checks.join('\n'));
console.log(
  `\nG1 verify-foundation: ${failures.length ? 'FAILED' : 'OK'} ` +
  `(${assertionsRun} assertions, ${failures.length} failures, ${pointerCount} LFS pointers)`,
);
if (failures.length) process.exit(1);
