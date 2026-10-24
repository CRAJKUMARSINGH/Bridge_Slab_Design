#!/usr/bin/env node
/**
 * GATE G1 — structure, engine pin, lockfile discipline, LFS resolution, anti-vacuity.
 * Prints OK only if every assertion actually executed.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const failures = [];
const checks = [];
let assertionsRun = 0;

function assert(cond, msg) {
  assertionsRun++;
  checks.push(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures.push(msg);
}

const manifest = JSON.parse(readFileSync('foundation/manifest.json', 'utf8'));
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

// 1. required paths
for (const p of manifest.requiredPaths) assert(existsSync(p), `required path exists: ${p}`);

// 2. charter drift is documented, not rediscovered every week
for (const p of manifest.charterClaimsAbsentPaths)
  assert(!existsSync(p), `charter-claimed-but-absent path still absent: ${p}`);

// 3. engine pin
if (!existsSync('foundation/engine.lock.json')) {
  assert(false, 'engine.lock.json exists — run: node scripts/foundation/lock-engine.mjs');
} else {
  const lock = JSON.parse(readFileSync('foundation/engine.lock.json', 'utf8'));
  for (const rel of manifest.engineModules) {
    if (!existsSync(rel)) { assert(false, `engine module present: ${rel}`); continue; }
    assert(lock[rel] === sha256(rel), `engine hash matches lock: ${rel}`);
  }
  for (const rel of Object.keys(lock))
    assert(manifest.engineModules.includes(rel), `no orphan entries in lock: ${rel}`);
}

// 4. exactly the declared lockfiles (and nothing else)
const ALL_LOCKFILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
const present = ALL_LOCKFILES.filter(existsSync);
const expected = manifest.expectedLockfiles ?? [];
const extra = present.filter(f => !expected.includes(f));
const missing = expected.filter(f => !present.includes(f));
assert(
  extra.length === 0 && missing.length === 0,
  `lockfiles: expected [${expected.join(', ')}], found [${present.join(', ')}]` +
  (extra.length ? ` — unexpected: ${extra.join(', ')}` : '') +
  (missing.length ? ` — missing: ${missing.join(', ')}` : ''),
);

// 5. LFS must be resolved (CI checkout without lfs:true yields 130-byte pointers)
let pointerCount = 0;
for (const f of manifest.lfsWatch) {
  if (!existsSync(f)) { assert(false, `lfs-watched file present: ${f}`); continue; }
  let isPointer = false;
  try {
    const head = readFileSync(f, { encoding: 'utf8', flag: 'r' }).slice(0, 50);
    isPointer = head.startsWith('version https://git-lfs');
  } catch { /* binary files are fine — not a pointer */ }
  if (isPointer) pointerCount++;
  assert(!isPointer, `LFS resolved (not a pointer): ${f}`);
}

// 6. registries parse and are non-empty
for (const r of manifest.registries) {
  if (!existsSync(r)) { assert(false, `registry present: ${r}`); continue; }
  let ok = false, n = 0;
  try {
    const j = JSON.parse(readFileSync(r, 'utf8').replace(/^\uFEFF/, ''));
    n = Array.isArray(j) ? j.length : Object.keys(j).length;
    ok = n > 0;
  } catch { ok = false; }
  assert(ok, `registry parses and is non-empty: ${r} (${n} entries)`);
}

// 7. anti-vacuity — a gate that ran no assertions must not print OK
assert(assertionsRun > 20, `assertions actually executed (ran ${assertionsRun})`);

console.log(checks.join('\n'));
console.log(
  `\nG1 verify-foundation: ${failures.length ? 'FAILED' : 'OK'} ` +
  `(${assertionsRun} assertions, ${failures.length} failures, ${pointerCount} LFS pointers)`,
);
if (failures.length) process.exit(1);
