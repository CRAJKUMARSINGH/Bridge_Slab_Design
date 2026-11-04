/**
 * Clause coverage — the implementing test for every entry in the clause registry.
 *
 * WHAT THIS FILE PROVES (and what it does not)
 * --------------------------------------------
 * `lib/engine/src/clause-registry.ts` is the single source of truth for the IRC/IS
 * clauses the engine cites, and `scripts/gates/verify-clauses.mjs` enforces two
 * properties over it. This file is the test the registry names as its implementing
 * test, and it re-asserts those same properties from the test lane so a registry
 * that drifts is caught by `pnpm run test` as well as by the gate:
 *
 *   A. no orphan citation under the scan root, and
 *   B. each registered clause names modules that exist, carries its citation
 *      strings verbatim in those modules, and exports the symbols it declares.
 *
 * It does NOT assert that a clause number is the *correct* clause for a quantity,
 * nor any numeric result. That is a review obligation (V-03 REALITY-AUDIT), not
 * something a string or symbol scan can settle — this test cannot make that claim
 * and does not.
 *
 * The `COVERED` literals below are load-bearing: `verify:clauses` reads THIS FILE's
 * text looking for `[<id>]`. Replacing them with a loop over the registry would make
 * the gate blind to a registry that lost an entry.
 *
 * Runs under plain Node (type-stripping) as well as under tsx: the only relative
 * import is extension-qualified, and the registry itself has no imports.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLAUSE_REGISTRY,
  REGISTERED_CLAUSE_IDS,
  CLAUSE_SCAN_ROOT,
  CLAUSE_TOKEN_PATTERN,
  normaliseClauseToken,
} from '../../lib/engine/src/clause-registry.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Every clause id this file is the implementing test for, as the literal token the
 * gate looks for. `[SP:13]` `[IS:7784]` `[IRC:78]` `[IS:875]` `[IS:1893]`
 * `[IRC:112]` `[IRC:21]` `[IS:456]` `[IRC:6]`.
 */
const COVERED = [
  '[SP:13]',
  '[IS:7784]',
  '[IRC:78]',
  '[IS:875]',
  '[IS:1893]',
  '[IRC:112]',
  '[IRC:21]',
  '[IS:456]',
  '[IRC:6]',
];

/** Blank the contents of '...' and "..." so citation data is not read as a live
 * citation. Comment text is left intact — that is where the engine cites clauses. */
function blankStringContents(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      out += c;
      i += 1;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') {
          out += '  ';
          i += 2;
          continue;
        }
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < src.length) {
        out += c;
        i += 1;
      }
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

function walkTs(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.endsWith('.ts')) out.push(p);
    }
  }
  return out.sort();
}

test('registry is non-empty and its ids are unique', () => {
  assert.ok(CLAUSE_REGISTRY.length > 0, 'CLAUSE_REGISTRY must not be empty');
  assert.equal(
    new Set(REGISTERED_CLAUSE_IDS).size,
    REGISTERED_CLAUSE_IDS.length,
    'clause ids must be unique',
  );
});

test('this file covers every clause the registry declares', () => {
  assert.deepEqual(
    [...COVERED].sort(),
    REGISTERED_CLAUSE_IDS.map((id) => `[${id}]`).sort(),
    'COVERED must name exactly the registered clause ids',
  );
});

test('no orphan clause citation under the scan root', () => {
  const root = join(repoRoot, CLAUSE_SCAN_ROOT);
  const orphans: string[] = [];
  for (const f of walkTs(root)) {
    const src = blankStringContents(readFileSync(f, 'utf8'));
    const re = new RegExp(CLAUSE_TOKEN_PATTERN, 'g');
    for (const m of src.matchAll(re)) {
      const id = normaliseClauseToken(m[1], m[2]);
      if (!REGISTERED_CLAUSE_IDS.includes(id)) {
        orphans.push(`${f.replace(/\\/g, '/')}: "${m[0].trim()}" -> ${id}`);
      }
    }
  }
  assert.deepEqual(orphans, [], `orphan citations:\n${orphans.join('\n')}`);
});

for (const c of CLAUSE_REGISTRY) {
  test(`[${c.id}] ${c.title}`, () => {
    assert.ok(c.modules.length > 0, `[${c.id}] must declare at least one module`);
    for (const m of c.modules) {
      assert.ok(existsSync(join(repoRoot, m)), `[${c.id}] module ${m} must exist`);
    }

    const text = c.modules
      .filter((m) => existsSync(join(repoRoot, m)))
      .map((m) => readFileSync(join(repoRoot, m), 'utf8'))
      .join('\n');

    for (const s of c.citations) {
      assert.ok(
        text.includes(s),
        `[${c.id}] citation ${JSON.stringify(s)} must appear in ${c.modules.join(', ')}`,
      );
    }
    for (const sym of c.symbols) {
      assert.match(
        text,
        new RegExp(`export\\s+(function|const|let|type|interface)\\s+${sym}\\b`),
        `[${c.id}] symbol ${sym} must be exported by ${c.modules.join(', ')}`,
      );
    }
  });
}
