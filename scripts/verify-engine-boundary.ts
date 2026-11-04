/**
 * Engine-boundary gate — closes J-5 ("the golden harness guards a different engine than the
 * deliverables") by measuring the boundary instead of arguing about it.
 *
 * What the register claimed: `@workspace/engine` is golden-guarded while every artefact comes from
 * `bridge-excel-generator/design-engine.ts`, so the numeric regression protects unused code.
 *
 * What the code shows (2026-10-06): the two calculators are almost disjoint, not duplicates —
 * `lib/engine` owns the deck-slab UDL/BM/SF/deflection/utilisation checks (the Week-0 demo
 * workbook's Calc! sheet), `design-engine.ts` owns hydraulics, scour, pier/abutment stability,
 * reinforcement and the BOQ. Neither calls the other: `@workspace/engine` has zero importers under
 * `bridge-excel-generator/`, `pipeline/`, `server/`, `client/` or `shared/`. So the gap was never
 * "two engines disagree" — it was three narrower facts, and this gate checks all three:
 *
 *  A. BOUNDARY. Which modules the delivered artefacts actually compute from, read from the import
 *     graph rather than from prose; plus the assertion that `lib/engine` is still off that path.
 *     If someone moves a quantity into (or out of) `lib/engine`, this names the file and asks for
 *     the boundary record to be re-emitted — it is a tripwire on a claim, not a ban on a design.
 *  B. COVERAGE. Every module in the deliverable engine's own import closure that exports a
 *     `calculate*` function must appear in the golden's `covers` list. A third calculator added to
 *     the path with no numeric regression is exactly the J-5 defect, so it fails here.
 *  C. REGRESSION. A full snapshot of every scalar the deliverable engine returns for the Kherwara
 *     reference input, pinned in `tests/golden/deliverable-engine/kherwara.json`, with a tamper
 *     control proving the snapshot is live rather than self-satisfying.
 *
 * What this does NOT prove (stated so nobody reads a green exit as a design sign-off):
 *  - that the pinned numbers are *correct*. They are a regression baseline accepted on 2026-10-06,
 *    when the other ten gates were green; the verdict picture (§M-1: 4 SAFE of 300 cases) and every
 *    engineering input an engineer still owns are unchanged by this file.
 *  - anything about the workbook's cell-level linking (`verify:links`), costs tying
 *    (`verify:costing`) or the printed artefacts (`verify:parity`, `verify:presentation`).
 *
 * Run: npx tsx scripts/verify-engine-boundary.ts
 *      pnpm run verify:engine
 *      pnpm run verify:engine -- --emit    (re-accept the snapshot after a deliberate change)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input.ts';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const goldenPath = join(repoRoot, 'tests', 'golden', 'deliverable-engine', 'kherwara.json');
const evidencePath = join(repoRoot, 'evidence', 'engine-boundary.json');
const emit = process.argv.slice(2).includes('--emit');

/** Files whose closure defines "how an artefact gets its numbers". */
const DELIVERABLE_ENTRIES = [
  'pipeline/run.ts',
  'bridge-excel-generator/index.ts',
  'server/api-routes.ts',
  'scripts/regenerate-test-output.ts',
];
/** The module the artefacts compute from, and therefore the closure the snapshot must cover. */
const DELIVERABLE_ENGINE = 'bridge-excel-generator/design-engine.ts';

const SOURCE_FILE = 'bridge-excel-generator/design-engine.ts';
const GOLDEN_CALCULATOR = 'bridge-excel-generator/design-engine.ts#calculateCompleteDesign';

const defects: string[] = [];
function fail(message: string) {
  defects.push(message);
}

function repoPath(abs: string): string {
  return relative(repoRoot, abs).split('\\').join('/');
}

// ---------------------------------------------------------------------------
// A. import closure — static, textual, resolved the way tsx resolves it
// ---------------------------------------------------------------------------
const SPECIFIER = /(?:\bfrom\s+|\bimport\s*\(\s*)['"]([^'"]+)['"]/g;

/** Resolve a relative specifier to a repo file the way tsx would, or null if it leaves the repo. */
function resolveSpecifier(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null; // bare package specifier
  const base = resolve(dirname(join(repoRoot, fromFile)), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if (existsSync(candidate) && candidate.startsWith(repoRoot)) return repoPath(candidate);
  }
  return null;
}

function closureOf(entryFiles: string[]): string[] {
  const seen = new Set<string>();
  const queue = [...entryFiles];
  while (queue.length > 0) {
    const file = queue.shift() as string;
    if (seen.has(file) || !existsSync(join(repoRoot, file))) continue;
    seen.add(file);
    const text = readFileSync(join(repoRoot, file), 'utf8');
    for (const match of text.matchAll(SPECIFIER)) {
      const next = resolveSpecifier(file, match[1]);
      if (next && !seen.has(next)) queue.push(next);
    }
  }
  return [...seen].sort();
}

/** Module-level exported functions whose name starts with `calculate` — i.e. calculators. */
function exportedCalculators(file: string): string[] {
  const text = readFileSync(join(repoRoot, file), 'utf8');
  const names = new Set<string>();
  for (const m of text.matchAll(/export\s+(?:async\s+)?function\s+(calculate\w+)/g)) names.add(m[1]);
  for (const m of text.matchAll(/export\s+const\s+(calculate\w+)\s*=/g)) names.add(m[1]);
  return [...names].sort();
}

const deliverableClosure = closureOf(DELIVERABLE_ENTRIES);

if (!deliverableClosure.includes(SOURCE_FILE)) {
  fail(`A. ${SOURCE_FILE} is not reachable from any deliverable entry — the artefacts no longer ` +
       `compute from the engine this gate pins. Re-read pipeline/run.ts before trusting any number.`);
}

const engineOnDeliverablePath = deliverableClosure.filter((f) => f.startsWith('lib/engine/'));
if (engineOnDeliverablePath.length > 0) {
  fail(`A. The boundary moved: ${engineOnDeliverablePath.join(', ')} is now on the deliverable ` +
       `path. That may be the right design, but the golden harness and the artefacts then feed each ` +
       `other — re-check that each lib/engine entry point still has its own expected file, then run ` +
       `\`pnpm run verify:engine -- --emit\` to accept the new boundary.`);
}

const engineClosure = closureOf([DELIVERABLE_ENGINE]).filter(
  (f) => f.startsWith('bridge-excel-generator/') || f.startsWith('shared/') || f.startsWith('lib/'),
);
const calculatorsFound: Array<{ module: string; exports: string[] }> = [];
for (const file of engineClosure) {
  const names = exportedCalculators(file);
  if (names.length > 0) calculatorsFound.push({ module: file, exports: names });
}

// ---------------------------------------------------------------------------
// B/C. the snapshot
// ---------------------------------------------------------------------------
type Leaf = number | string | boolean;
type Golden = {
  schemaVersion: string;
  pinnedAt: string;
  toleranceRelative: number;
  provenance: string;
  input: string;
  calculator: string;
  covers: string[];
  boundary: { deliverableClosure: string[]; engineCalculators: Array<{ module: string; exports: string[] }> };
  values: Record<string, Leaf>;
};

/**
 * Flatten the engine's result. Objects recurse; arrays are pinned by length plus a per-key numeric
 * sum (so a reordered BOQ line is not a failure while any changed quantity is), except `loadCases`,
 * which is pinned case by case because a verdict flip must be read, not summarised away.
 */
function collect(node: unknown, path: string, out: Record<string, Leaf>) {
  if (typeof node === 'number') {
    if (!Number.isFinite(node)) {
      fail(`C. the engine emitted a non-finite value at ${path}: ${String(node)}`);
      return;
    }
    out[path] = node;
    return;
  }
  if (typeof node === 'string' || typeof node === 'boolean') {
    out[path] = node;
    return;
  }
  if (Array.isArray(node)) {
    out[`${path}.length`] = node.length;
    if (path.endsWith('loadCases')) {
      node.forEach((item, index) => collect(item, `${path}[${index}]`, out));
      return;
    }
    const sums = new Map<string, number>();
    for (const item of node) {
      if (typeof item === 'number' && Number.isFinite(item)) {
        sums.set('self', (sums.get('self') ?? 0) + item);
      } else if (item && typeof item === 'object') {
        for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            sums.set(key, (sums.get(key) ?? 0) + value);
          }
        }
      }
    }
    for (const [key, value] of [...sums].sort()) out[`${path}.sum.${key}`] = value;
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      collect(value, path ? `${path}.${key}` : key, out);
    }
  }
}

function pinned(result: Record<string, unknown>): Record<string, Leaf> {
  const out: Record<string, Leaf> = {};
  for (const key of ['hydraulics', 'pier', 'abutmentType1', 'abutmentC1', 'estimation']) {
    collect(result[key], key, out);
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function relativeError(actual: number, expected: number): number {
  if (expected === 0) return Math.abs(actual);
  return Math.abs(actual - expected) / Math.abs(expected);
}

const TOLERANCE = 1e-6;
const PROVENANCE =
  'Regression baseline accepted on 2026-10-06, when check / verify / test / audit:policy were all ' +
  'exit 0 (august-due.md §W). It pins that the deliverable engine keeps producing THESE numbers; it ' +
  'is not an independent authority that they are right, and it changes no verdict — the engineering ' +
  'items still owned by the signing engineer (§M-1 bearing acceptance, §M-3 legacy hydraulics block, ' +
  '§M-4 design discharge) are deliberately left as they were.';

const result = calculateCompleteDesign(KHERWARA_REFERENCE_PROJECT_INPUT, { quiet: true }) as unknown as Record<string, unknown>;
const actual = pinned(result);

if (emit) {
  const golden: Golden = {
    schemaVersion: 'deliverable-engine-golden.v1',
    pinnedAt: new Date().toISOString().slice(0, 10),
    toleranceRelative: TOLERANCE,
    provenance: PROVENANCE,
    input: 'scripts/fixtures/kherwara-project-input.ts',
    calculator: GOLDEN_CALCULATOR,
    covers: engineClosure,
    boundary: { deliverableClosure: deliverableClosure, engineCalculators: calculatorsFound },
    values: actual,
  };
  mkdirSync(dirname(goldenPath), { recursive: true });
  writeFileSync(goldenPath, JSON.stringify(golden, null, 2) + '\n', 'utf8');
  process.stdout.write(`Emitted ${Object.keys(actual).length} pinned values -> ${repoPath(goldenPath)}\n`);
}

if (!existsSync(goldenPath)) {
  fail(`B. no golden file at ${repoPath(goldenPath)}. Run \`pnpm run verify:engine -- --emit\` to ` +
       `create it, then review the diff before committing.`);
} else {
  const golden = JSON.parse(readFileSync(goldenPath, 'utf8')) as Golden;

  // B. coverage: every calculator in the engine closure must be declared.
  const missingCovers = calculatorsFound
    .filter((entry) => !golden.covers.includes(entry.module))
    .map((entry) => `${entry.module} (${entry.exports.join(', ')})`);
  if (missingCovers.length > 0) {
    fail(`B. the deliverable engine now computes through ${missingCovers.join('; ')}, which the ` +
         `golden does not cover. Either those numbers are already in the snapshot (re-emit to ` +
         `declare them) or a second calculator has entered the path without a regression — the J-5 ` +
         `defect this gate exists to catch.`);
  }
  const staleCovers = golden.covers.filter(
    (f) => !engineClosure.includes(f) && !deliverableClosure.includes(f),
  );
  if (staleCovers.length > 0) {
    fail(`B. the golden covers ${staleCovers.join(', ')}, which nothing on the deliverable path ` +
         `imports any more. Remove it from the boundary record (re-emit) rather than leaving a map ` +
         `of modules that no longer feed the artefacts.`);
  }

  // C. value-by-value regression.
  let checked = 0;
  const drift: string[] = [];
  for (const [path, expected] of Object.entries(golden.values)) {
    if (path === 'values') continue;
    const got = actual[path];
    checked += 1;
    if (got === undefined) {
      drift.push(`${path}: the engine no longer produces this output (was ${JSON.stringify(expected)})`);
      continue;
    }
    if (typeof got === 'number' && typeof expected === 'number') {
      const err = relativeError(got, expected);
      if (err > TOLERANCE) drift.push(`${path}: ${got} != ${expected} (rel ${err.toExponential(2)} > ${TOLERANCE})`);
    } else if (got !== expected) {
      drift.push(`${path}: ${JSON.stringify(got)} != ${JSON.stringify(expected)}`);
    }
  }
  const unpinned = Object.keys(actual).filter((p) => !(p in golden.values));
  for (const path of unpinned) {
    drift.push(`${path}: new output ${JSON.stringify(actual[path])} is not pinned`);
  }
  if (drift.length > 0) {
    fail(`C. ${drift.length} of ${checked + unpinned.length} pinned outputs moved:\n     ` +
         drift.slice(0, 25).join('\n     ') +
         (drift.length > 25 ? `\n     … and ${drift.length - 25} more` : '') +
         '\n     If the move is intended, re-accept with `pnpm run verify:engine -- --emit` and record ' +
         'what changed in august-due.md — numbers in this file are what an engineer reads in the PDF.');
  }

  // Tamper control: prove the snapshot can actually see a change.
  // `manningN` and not `discharge`, measured here: the deliverable engine computes Q from the
  // cross-section and its own velocity and never reads `ProjectInput.discharge`, which reaches the
  // workbook only through sheet 3's separate rows (august-due.md §M-4). Tampering that field moves
  // nothing — a finding about the engine, not a fault in this control.
  const tamperedInput = { ...KHERWARA_REFERENCE_PROJECT_INPUT, manningN: KHERWARA_REFERENCE_PROJECT_INPUT.manningN + 0.005 };
  const tampered = pinned(calculateCompleteDesign(tamperedInput, { quiet: true }) as unknown as Record<string, unknown>);
  const moved = Object.keys(tampered).filter(
    (p) => typeof tampered[p] === 'number' && typeof golden.values[p] === 'number' &&
           relativeError(tampered[p] as number, golden.values[p] as number) > TOLERANCE,
  );
  if (moved.length === 0) {
    fail('C. tamper control: raising Manning\'s n by 0.005 changed no pinned number, so the ' +
         'snapshot is not reading the engine it claims to guard.');
  }
  // Diagnostic, not a defect: what the artefacts do with the declared design discharge.
  const qInput = { ...KHERWARA_REFERENCE_PROJECT_INPUT, discharge: KHERWARA_REFERENCE_PROJECT_INPUT.discharge + 50 };
  const qTampered = pinned(calculateCompleteDesign(qInput, { quiet: true }) as unknown as Record<string, unknown>);
  const qMoved = Object.keys(qTampered).filter(
    (p) => typeof qTampered[p] === 'number' && typeof golden.values[p] === 'number' &&
           relativeError(qTampered[p] as number, golden.values[p] as number) > TOLERANCE,
  ).length;
  const shapeChanged = Object.keys(tampered).filter((p) => !(p in actual));
  if (shapeChanged.length > 0) {
    fail(`C. tamper control: the pinned key set changed shape (${shapeChanged.slice(0, 5).join(', ')}), ` +
         'so the flattener is not stable under input changes and a drift message could hide in it.');
  }

  process.stdout.write(
    `Golden: ${checked} outputs checked, ${drift.length} drifted, tamper moved ${moved.length} ` +
    `(tolerance ${TOLERANCE} relative).\n` +
    `Diagnostic: +50 m³/s on the declared ProjectInput.discharge moved ${qMoved} of ${checked} pinned ` +
    `outputs — the engine derives Q from the section and its own velocity and reads the field nowhere ` +
    `on this path; sheet 3 prints it separately (§M-4).\n`,
  );
}

// ---------------------------------------------------------------------------
// evidence + report
// ---------------------------------------------------------------------------
mkdirSync(dirname(evidencePath), { recursive: true });
writeFileSync(
  evidencePath,
  JSON.stringify(
    {
      schemaVersion: 'engine-boundary.v1',
      generatedBy: 'scripts/verify-engine-boundary.ts',
      deliverableEntries: DELIVERABLE_ENTRIES,
      deliverableClosure,
      libEngineOnDeliverablePath: engineOnDeliverablePath,
      engineClosure,
      engineCalculators: calculatorsFound,
      pinnedOutputs: Object.keys(actual).length,
      defects,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

process.stdout.write(
  `Boundary: ${deliverableClosure.length} modules feed the artefacts from ${DELIVERABLE_ENTRIES.length} ` +
  `entries; ${engineOnDeliverablePath.length} of them under lib/engine/.\n` +
  `Calculators in the engine closure: ${calculatorsFound.map((c) => `${c.module} [${c.exports.join(', ')}]`).join(', ')}.\n` +
  `Snapshot: ${Object.keys(actual).length} outputs pinned for ${repoPath(goldenPath)}.\n`,
);

if (defects.length > 0) {
  process.stdout.write(`\nENGINE BOUNDARY GATE: ${defects.length} defect(s)\n\n${defects.map((d, i) => ` ${i + 1}. ${d}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('verify-engine-boundary: OK (deliverable engine pinned, boundary measured, ' +
    'tamper control live). Green here does not certify the design — see §M-1.\n');
}
