#!/usr/bin/env node
/** F10 — one authoritative engine; no file may deep-import an engine module unless allowlisted. */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, relative, extname } from 'node:path';

const WRITE = process.argv.includes('--write');
const ALLOW_PATH = 'foundation/imports.allow.json';
const manifest = JSON.parse(readFileSync('foundation/manifest.json', 'utf8').replace(/^\uFEFF/, ''));
const ENGINE = new Set(manifest.engineModules.map((p) => p.replace(/\.ts$/, '')));

/**
 * FIX #2: an absent mirror is honest ("ABSENT"), not a silently-passing pair.
 * Derive the pairs from the manifest instead of a hand-written phantom path.
 */
const MIRROR_PAIRS = manifest.mirrors.flatMap((mirrorRoot) =>
  manifest.engineModules
    .filter((p) => p.startsWith('client/src/report-engine/'))
    .map((p) => [p, p.replace('client/src/report-engine/', `${mirrorRoot}/`)]),
);

/**
 * FIX #1: the allowlist is now enforced, not decorative.
 * It holds the reviewed baseline of files permitted to import an engine module
 * directly (foundation/imports.allow.json). A NEW deep importer fails until it is
 * reviewed and the baseline is re-seeded with `--write` — the same tripwire model
 * the literal-guard uses for numbers.
 */
const allow = existsSync(ALLOW_PATH)
  ? JSON.parse(readFileSync(ALLOW_PATH, 'utf8').replace(/^\uFEFF/, ''))
  : { allowed: [] };
const allowSet = new Set(allow.allowed ?? []);

const SCAN_ROOTS = ['client/src', 'scripts', 'tests', 'server', 'bridge-excel-generator', 'api', 'foundation'];
const SKIP = new Set(['node_modules', 'dist', 'build', '.out']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx', '.mts'].includes(extname(p))) out.push(p);
  }
  return out;
}

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const problems = [];

// ── A. mirrors must be byte-identical, or absent ────────────────────────────
for (const [a, b] of MIRROR_PAIRS) {
  if (!existsSync(a)) { problems.push(`source missing: ${a}`); continue; }
  if (!existsSync(b)) { console.log(`ABSENT    ${b}  (no mirror to diverge from)`); continue; }
  const same = sha(a) === sha(b);
  console.log(`${same ? 'IDENTICAL' : 'DIVERGED '} ${b}`);
  if (!same) problems.push(`${b} diverged from ${a} — make one a re-export of the other`);
}

// ── B. deep-import allowlist is enforced (FIX #1) ───────────────────────────
const IMPORT_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
const scanned = SCAN_ROOTS.flatMap((r) => walk(r));
let deepImports = 0, allowHits = 0;
const offenders = new Set();

for (const file of scanned) {
  const rel = relative('.', file).replace(/\\/g, '/');
  if (rel.startsWith('client/src/report-engine/lib/')) continue; // the engine itself
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue;
    const target = resolve(dirname(file), spec).replace(/\\/g, '/').replace(/\.(ts|tsx)$/, '');
    const repoRel = relative(resolve('.'), target).replace(/\\/g, '/');
    if (!ENGINE.has(repoRel)) continue;
    deepImports++;
    offenders.add(rel);
    if (allowSet.has(rel)) { allowHits++; continue; }
    problems.push(
      `${rel} deep-imports ${repoRel} — review it, then re-seed the baseline with: ` +
      `node scripts/foundation/import-guard.mjs --write`,
    );
  }
}

const stale = [...allowSet].filter((f) => !offenders.has(f));

if (WRITE) {
  const next = [...offenders].sort();
  writeFileSync(ALLOW_PATH, JSON.stringify({
    _doc: 'Reviewed baseline of files permitted to deep-import an engine module. A NEW importer fails the guard until it is reviewed and this list is re-seeded: node scripts/foundation/import-guard.mjs --write',
    allowed: next,
  }, null, 2) + '\n');
  console.log(`F10 import-guard: wrote ${next.length} reviewed importers to ${ALLOW_PATH}`);
} else {
  console.log(
    `\nF10 import-guard: ${scanned.length} files scanned, ${deepImports} deep imports ` +
    `(${allowHits} allowlisted), ${MIRROR_PAIRS.length} mirror pairs, ` +
    `${problems.length} new, ${stale.length} stale allowlist entries`,
  );
  if (problems.length) {
    problems.forEach((p) => console.log('  ' + p));
    process.exit(1);
  }
  if (stale.length) {
    console.log(`  stale (no longer deep-imports — re-seed): ${stale.slice(0, 10).join(', ')}`);
  }
}
