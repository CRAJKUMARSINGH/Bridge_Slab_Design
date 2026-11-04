/**
 * input-dictionary coverage test — W03 T3.8.
 *
 * `docs/phase-2/INPUT-DICTIONARY.md` documents the runtime input contract field by
 * field, and asserts the contract is `ProjectInputSchema` in
 * `bridge-excel-generator/input-contract.ts`. T3.8 requires that every field in the
 * dictionary actually has a Zod schema: this test is the mechanical link between the
 * two, so a field documented but not implemented (or renamed in the schema) fails
 * rather than drifts.
 *
 * WHAT THIS TEST PROVES
 *   - the dictionary documents a non-trivial field set (>= 50 fields);
 *   - every documented field is declared as a key in `ProjectInputSchema`;
 *   - every documented field carries a non-empty "Range / rule" cell (a field with
 *     no documented rule is an undocumented validation);
 *   - a behavioural Zod validation test for the contract exists
 *     (`tests/integration/zod-contract.test.ts`, which imports the live schema).
 *
 * WHAT IT DOES NOT PROVE — and cannot, in this worktree
 *   That `ProjectInputSchema.safeParse` enforces each rule at runtime. That needs
 *   `zod`, which is not resolvable here (escape E-008: the worktree has only the
 *   pnpm store). The behavioural proof lives in `zod-contract.test.ts`, which cannot
 *   run in this worktree either; both are recorded under E-008 in the W03
 *   EXIT-GATE-EVIDENCE. This test is deliberately static so that it *does* run.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DICT = join(repoRoot, 'docs', 'phase-2', 'INPUT-DICTIONARY.md');
const CONTRACT = join(repoRoot, 'bridge-excel-generator', 'input-contract.ts');
const ZOD_TEST = join(repoRoot, 'tests', 'integration', 'zod-contract.test.ts');

/** Rows of the form `| \`field\` | type | unit | range/rule | ... |` in the dictionary. */
function documentedFields(md: string): { name: string; rule: string }[] {
  const out: { name: string; rule: string }[] = [];
  for (const line of md.split('\n')) {
    const m = /^\|\s*`([a-zA-Z][a-zA-Z0-9_]*)`\s*\|/.exec(line);
    if (!m) continue;
    const cells = line.split('|');
    out.push({ name: m[1], rule: (cells[4] ?? '').trim() });
  }
  return out;
}

test('INPUT-DICTIONARY.md documents a non-trivial field set', () => {
  assert.ok(existsSync(DICT), 'docs/phase-2/INPUT-DICTIONARY.md must exist');
  const fields = documentedFields(readFileSync(DICT, 'utf8'));
  assert.ok(
    fields.length >= 50,
    `expected >= 50 documented fields, found ${fields.length} — the dictionary is a burn-down, but it may not shrink silently`,
  );
});

test('every documented field is declared as a key in ProjectInputSchema', () => {
  assert.ok(existsSync(CONTRACT), 'bridge-excel-generator/input-contract.ts must exist');
  const src = readFileSync(CONTRACT, 'utf8');
  const missing = documentedFields(readFileSync(DICT, 'utf8'))
    .map((f) => f.name)
    .filter((name) => !new RegExp(`^\\s*${name}:`, 'm').test(src));
  assert.deepEqual(missing, [], `documented but not declared in ProjectInputSchema: ${missing.join(', ')}`);
});

test('every documented field carries a documented rule', () => {
  const ruleless = documentedFields(readFileSync(DICT, 'utf8'))
    .filter((f) => f.rule.length === 0)
    .map((f) => f.name);
  assert.deepEqual(ruleless, [], `documented with no range/rule: ${ruleless.join(', ')}`);
});

test('a behavioural Zod validation test for the contract exists', () => {
  assert.ok(existsSync(ZOD_TEST), 'tests/integration/zod-contract.test.ts must exist');
  const src = readFileSync(ZOD_TEST, 'utf8');
  assert.match(src, /projectInputBodySchema/, 'the contract test must import the live Zod schema');
  const laneFiles = readdirSync(join(repoRoot, 'tests', 'integration')).filter((f) => f.endsWith('.test.ts'));
  assert.ok(laneFiles.length > 0, 'the integration lane must not be empty');
});
