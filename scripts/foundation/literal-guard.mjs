#!/usr/bin/env node
/**
 * F5b — No unexplained numeric literal in the engine.
 *
 * A literal is allowed only if:
 *   - its line carries //@k:KEY or //@lit, or
 *   - its content-addressed id (sha1 of the trimmed code line + '|' + literal)
 *     is listed in foundation/literals.allow.json.
 *
 * Content addressing, not line numbers: inserting a line above does not rot the file.
 * Engine file list is read from foundation/manifest.json — one definition of the engine.
 *
 * Usage: node scripts/foundation/literal-guard.mjs [--write]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const WRITE = process.argv.includes('--write');
const ALLOW_PATH = 'foundation/literals.allow.json';
const manifest = JSON.parse(readFileSync('foundation/manifest.json', 'utf8').replace(/^\uFEFF/, ''));

// FIX #7: single source of truth, and only the .ts engine modules.
const FILES = manifest.engineModules.filter((f) => f.endsWith('.ts'));

// FIX #4: 0 and 1 only. 1000, 2, 0.5 are real coefficients and must be named.
const TRIVIAL = new Set(['0', '1']);

/**
 * Blank out comments AND string contents, preserving newlines so line numbers hold.
 * FIX #5: handles block comments, not just `//`.
 */
function blankNonCode(src) {
  let out = '', i = 0, state = 'code';
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (state === 'code') {
      if (c === '/' && n === '/') { out += '  '; i += 2; state = 'line'; continue; }
      if (c === '/' && n === '*') { out += '  '; i += 2; state = 'block'; continue; }
      if (c === "'" || c === '"' || c === '`') { out += c; i++; state = c; continue; }
      out += c; i++; continue;
    }
    if (state === 'line') { out += c === '\n' ? '\n' : ' '; i++; if (c === '\n') state = 'code'; continue; }
    if (state === 'block') {
      if (c === '*' && n === '/') { out += '  '; i += 2; state = 'code'; continue; }
      out += c === '\n' ? '\n' : ' '; i++; continue;
    }
    // inside a string/template literal
    if (c === '\\') { out += '  '; i += 2; continue; }
    if (c === state) { out += c; i++; state = 'code'; continue; }
    out += c === '\n' ? '\n' : ' '; i++;
  }
  return out;
}

// FIX #3: one token for 1e6 / 1.5e-3 / .5 — the exponent branch is part of the token.
const NUM = /(?<![\w.$])(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

const allow = existsSync(ALLOW_PATH)
  ? JSON.parse(readFileSync(ALLOW_PATH, 'utf8'))
  : { allowed: [] };
const allowSet = new Set(allow.allowed ?? []);
const id = (codeLine, literal) =>
  createHash('sha1').update(`${codeLine.trim()}|${literal}`).digest('hex').slice(0, 16);

const failures = [];
const foundIds = new Set();
let scanned = 0, literals = 0;

for (const f of FILES) {
  if (!existsSync(f)) { failures.push(`missing engine file: ${f}`); continue; }
  const raw = readFileSync(f, 'utf8').split('\n');
  const code = blankNonCode(readFileSync(f, 'utf8')).split('\n');
  for (let i = 0; i < code.length; i++) {
    if (!code[i].trim()) continue;
    // Suppression markers live in comments, so read the RAW line for them.
    if (/\/\/\s*@(k:|lit)\b/.test(raw[i])) continue;
    scanned++;
    for (const tok of code[i].match(NUM) ?? []) {
      literals++;
      if (TRIVIAL.has(tok)) continue;
      const key = id(code[i], tok);
      foundIds.add(key);
      if (!allowSet.has(key)) {
        failures.push(`${f}:${i + 1}  bare literal ${tok}  id=${key}  →  ${raw[i].trim()}`);
      }
    }
  }
}

const stale = [...allowSet].filter((k) => !foundIds.has(k));

if (WRITE) {
  // Seed the baseline: every literal the engine currently carries, plus anything
  // already recorded. Re-running after a deliberate edit adds the new ones.
  const next = [...new Set([...foundIds, ...allowSet])].sort();
  writeFileSync(ALLOW_PATH, JSON.stringify({
    _doc: 'Content-addressed allowlist. id = sha1("<trimmed code line>|<literal>")[0..16]. Regenerate: node scripts/foundation/literal-guard.mjs --write',
    allowed: next,
  }, null, 2) + '\n');
  console.log(`F5b literal-guard: wrote ${next.length} entries to ${ALLOW_PATH}`);
} else {
  console.log(
    `F5b literal-guard: ${FILES.length} engine files, ${scanned} code lines, ` +
    `${literals} literals, ${failures.length} unexplained, ${stale.length} stale allowlist entries`,
  );
  failures.slice(0, 30).forEach((x) => console.log('  ' + x));
  if (failures.length > 30) console.log(`  ... and ${failures.length - 30} more`);
  if (stale.length) {
    console.log(`  stale (literal no longer present — delete or re-bless): ${stale.slice(0, 10).join(', ')}`);
  }
  if (failures.length) process.exit(1);
}
