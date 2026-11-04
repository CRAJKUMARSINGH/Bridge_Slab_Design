/**
 * Test lane runner.
 *
 * vitest is not usable in this workspace, so the API/report/security contracts and the engine's
 * own numeric tests are checked with node:test through tsx (one process per test file keeps
 * failures legible).
 *
 * Two lanes run here. `tests/integration` is the product surface; `lib/engine/src/tests` is the
 * numeric regression of `@workspace/engine` — 79 assertions that until 2026-10-06 were invoked by
 * nothing in CI (`test` globbed only the integration folder, and the file that used to call them,
 * `scripts/qa-ultra-strict.ts`, is wired to no script). A green `pnpm run test` now means both.
 *
 * Run: npx tsx scripts/run-integration-tests.ts   (or: pnpm run test)
 */
import { readdirSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');

const lanes = [
  { label: 'Integration lane', dir: join('tests', 'integration') },
  { label: 'Engine unit lane', dir: join('lib', 'engine', 'src', 'tests') },
];

let totalFiles = 0;
let totalFailed = 0;

for (const lane of lanes) {
  const laneDir = join(repoRoot, lane.dir);
  const files = readdirSync(laneDir)
    .filter((name) => name.endsWith('.test.ts'))
    .sort();

  if (files.length === 0) {
    console.error(`No test files found in ${laneDir}`);
    process.exitCode = 1;
    continue;
  }

  const failures: string[] = [];
  for (const file of files) {
    const result = spawnSync(
      process.execPath,
      // One file per process is what keeps failures legible, so Node's own per-file
      // child is pure overhead here — and it is actively harmful: the design engine
      // writes hundreds of lines to stdout, and those frames reached the parent
      // corrupted once in four runs ("Unable to deserialize cloned data due to invalid
      // or unsupported version"), failing a file whose five tests all pass standalone.
      // `--test-isolation=none` keeps the file in this process, so there is no
      // serialization step to corrupt and the lane is deterministic under load.
      ['--import', 'tsx', '--test', '--test-isolation=none', join(lane.dir, file)],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_NO_WARNINGS: '1',
          // server/*.ts imports express, cors, pino … which are declared by the
          // artifacts/api-server workspace, not by the root package. pnpm keeps them in
          // its hidden store; pnpm exec adds that store to NODE_PATH, so do the same here
          // instead of duplicating every server dependency into the root manifest.
          NODE_PATH: [
            join(repoRoot, 'node_modules', '.pnpm', 'node_modules'),
            join(repoRoot, 'node_modules'),
            process.env.NODE_PATH,
          ]
            .filter(Boolean)
            .join(delimiter),
        },
      },
    );
    if (result.status !== 0) failures.push(file);
  }

  console.log(`\n${lane.label}: ${files.length - failures.length}/${files.length} files passed.`);
  if (failures.length > 0) {
    console.error(`Failed: ${failures.join(', ')}`);
    process.exitCode = 1;
  }
  totalFiles += files.length;
  totalFailed += failures.length;
}

console.log(`Test lanes: ${totalFiles - totalFailed}/${totalFiles} files passed in ${lanes.length} lanes.`);
if (totalFailed > 0) process.exitCode = 1;

