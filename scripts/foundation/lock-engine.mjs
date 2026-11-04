#!/usr/bin/env node
/**
 * F1b — Pins the exact bytes of every calculation module.
 * Any change to engine math MUST be accompanied by `npm run lock:engine`.
 * This is what makes "silently patched a formula" impossible.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(readFileSync('foundation/manifest.json', 'utf8'));
const lock = {};
for (const rel of manifest.engineModules) {
  lock[rel] = createHash('sha256').update(readFileSync(rel)).digest('hex');
}
writeFileSync('foundation/engine.lock.json', JSON.stringify(lock, null, 2) + '\n');
console.log(`engine.lock.json written — ${Object.keys(lock).length} modules pinned`);
