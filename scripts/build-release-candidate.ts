/**
 * Release-candidate bundle.
 *
 * Week 0 of the plan asks for `evidence/release-candidate/`: not the deliverables themselves (those live
 * in `test-output/`) but the record that a specific commit produced them under a specific gate run, with
 * digests so a reviewer can prove the file in the bundle is the file the pipeline wrote.
 *
 * Two rules shape this script:
 *
 * 1. It runs the gates, it does not trust a transcript. A bundle assembled from yesterday's console
 *    scrollback says nothing about today's tree, so `check`, `verify`, `test` and `audit:policy` are
 *    executed here and their full output is captured into the bundle.
 * 2. A red run produces no bundle. If any lane fails, the script writes what it captured, names the
 *    failure and exits non-zero without refreshing the manifest — so `evidence/release-candidate/` can
 *    never silently contain a candidate built from broken code.
 *
 * The bundle is evidence about the *machinery*. It is not an engineering clearance: the stability-outcome
 * gate reports the design UNSAFE on most load cases (see §L-2 of august-due.md), and the standing
 * sign-off questions (§M) are unresolved. Both facts are printed into MANIFEST.md rather than left for a
 * reviewer to discover.
 *
 * Run: npx tsx scripts/build-release-candidate.ts [--skip-gates]
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(repoRoot, 'evidence', 'release-candidate');
const deliverablesDir = join(outDir, 'deliverables');
const gatesDir = join(outDir, 'gates');
const sourceDir = join(repoRoot, 'test-output');

/** The six files `pnpm run deliverables` writes, in the order a reviewer reads them. */
const DELIVERABLES = [
  'design-workbook.xlsx',
  'sheet-book.pdf',
  'comprehensive-report.pdf',
  'short-design-report.pdf',
  'design-report.html',
  'irc-checklist.html',
];

/**
 * The chains whose exit code defines whether this tree is bundle-able. CI runs all four, so the
 * bundle must not be buildable on a tree CI would reject: `check` and `verify` are local aggregates,
 * while `test` (13 API/report lanes) and `audit:policy` (dependency policy) existed only in CI.
 */
const GATE_CHAINS = ['check', 'verify', 'test', 'audit:policy'];

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function run(cmd: string[], label: string): { cmd: string; exit: number; output: string } {
  const started = Date.now();
  const result = spawnSync(cmd[0], cmd.slice(1), { cwd: repoRoot, encoding: 'buffer', shell: process.platform === 'win32', maxBuffer: 64 * 1024 * 1024 });
  const output = Buffer.concat([result.stdout ?? Buffer.alloc(0), result.stderr ?? Buffer.alloc(0)]).toString('utf-8');
  const ms = Date.now() - started;
  console.log(`  ${label}: exit ${result.status ?? 'signal'} in ${(ms / 1000).toFixed(1)} s`);
  return { cmd: cmd.join(' '), exit: result.status ?? -1, output };
}

function gitRef(): string {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf-8' });
  return r.status === 0 ? r.stdout.trim() : 'not-a-git-checkout';
}

function gitDirty(): boolean {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf-8' });
  return r.status === 0 && r.stdout.trim().length > 0;
}

mkdirSync(deliverablesDir, { recursive: true });
mkdirSync(gatesDir, { recursive: true });

const skipGates = process.argv.includes('--skip-gates');
const gateRuns = skipGates
  ? []
  : GATE_CHAINS.map((script) => {
      const result = run(['pnpm', 'run', script], script);
      // A colon is not legal in a Windows file name, and one chain is called `audit:policy`.
      return { ...result, script, transcript: `gates/${script.replace(/:/g, '-')}.txt` };
    });
const failed = gateRuns.filter((g) => g.exit !== 0);

if (gateRuns.length) {
  for (const gate of gateRuns) writeFileSync(join(gatesDir, basename(gate.transcript)), gate.output, 'utf-8');
}

const missing = DELIVERABLES.filter((name) => !existsSync(join(sourceDir, name)));
if (missing.length) {
  console.error(`Refusing to bundle: test-output/ is missing ${missing.join(', ')} — run \`pnpm run deliverables\` first.`);
  process.exitCode = 1;
} else if (failed.length && !skipGates) {
  console.error(
    `Refusing to bundle: ${failed.map((g) => `${g.cmd} (exit ${g.exit})`).join(', ')} failed.\n` +
    'Nothing was written to MANIFEST.md; the captured output is in evidence/release-candidate/gates/ for diagnosis.',
  );
  process.exitCode = 1;
} else {
  const bundleEvidence = join(repoRoot, 'evidence', 'stability-outcomes.json');
  const entries = DELIVERABLES.map((name) => {
    const from = join(sourceDir, name);
    copyFileSync(from, join(deliverablesDir, name));
    return { name, bytes: statSync(from).size, sha256: sha256(from) };
  });

  const outcomes = existsSync(bundleEvidence) ? JSON.parse(readFileSync(bundleEvidence, 'utf-8')) : null;
  const manifest = {
    generatedAt: new Date().toISOString(),
    commit: gitRef(),
    workingTreeDirty: gitDirty(),
    toolchain: { node: process.version, pnpm: run(['pnpm', '--version'], 'pnpm --version').output.trim() },
    gates: gateRuns.map((g) => ({ command: g.cmd, exit: g.exit, transcript: g.transcript })),
    deliverables: entries,
    engineeringOutcomes: outcomes
      ? { totals: outcomes.totals, thresholds: outcomes.thresholds, file: 'gates/verify.txt' }
      : 'evidence/stability-outcomes.json not found — run `pnpm run verify:outcomes`',
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  const lines = [
    '# Release candidate — evidence bundle',
    '',
    `Generated ${manifest.generatedAt} at commit \`${manifest.commit}\``,
    `Working tree ${manifest.workingTreeDirty ? 'had uncommitted changes' : 'was clean'} when this bundle was assembled.`,
    `Toolchain: Node ${manifest.toolchain.node}, pnpm ${manifest.toolchain.pnpm}.`,
    '',
    '## Gate runs',
    '',
    manifest.gates.length
      ? ['| Command | Exit | Transcript |', '| --- | --- | --- |', ...manifest.gates.map((g) => `| \`${g.command}\` | ${g.exit} | \`${g.transcript}\` |`)].join('\n')
      : 'Gates were skipped (`--skip-gates`). This bundle records artefact digests only and is not gate evidence.',
    '',
    'Every gate above passed, which is why this file exists: a failing lane leaves the previous manifest',
    'untouched rather than dressing up a broken tree as a candidate.',
    '',
    '## Deliverables',
    '',
    '| File | Bytes | SHA-256 |',
    '| --- | --- | --- |',
    ...entries.map((e) => `| \`deliverables/${e.name}\` | ${e.bytes.toLocaleString('en-IN')} | \`${e.sha256}\` |`),
    '',
    'Copied from `test-output/`, which is written by `pnpm run deliverables` (Kherwara golden project).',
    '',
    '## What this bundle does not say',
    '',
    '**It is not an engineering clearance.** The gates above certify that the machinery reports honestly',
    'and that the two report formats agree; they do not certify that the bridge stands.',
    outcomes?.totals
      ? `Of 300 pier load cases across 20 templates, the engine verdicts are **${outcomes.totals.safe ?? '?'} SAFE and ${outcomes.totals.unsafe ?? '?'} UNSAFE**, and every template carries at least one unsafe case.`
      : 'Stability outcomes were not available when this bundle was written.',
    '',
    'Open sign-off questions, each of which moves verdicts and none of which code can settle (§M of',
    '`august-due.md`): the bearing acceptance factor (2.5 against the conventional `pressure ≤ SBC`, on',
    'which 184 cases turn), the governing water level, the legacy hydraulics block the comprehensive PDF',
    'prints beside the engine figures, and which discharge is the design discharge.',
    '',
    'A licensed engineer must review the numbers before any artefact here is issued externally.',
    '',
  ];
  writeFileSync(join(outDir, 'MANIFEST.md'), lines.join('\n'), 'utf-8');

  console.log(`\nBundle: ${entries.length} deliverables + gate transcripts at ${outDir}`);
  console.log(`Commit ${manifest.commit.slice(0, 12)} | gates ${manifest.gates.map((g) => `${g.command.split(' ').pop()}=${g.exit}`).join(' ') || 'skipped'}`);
}
