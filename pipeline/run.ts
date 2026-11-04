/**
 * One-command design pipeline: inputs → calculate → workbook → PDF → HTML → checklist.
 *
 *   pnpm run pipeline                                     # every quick-template project
 *   pnpm run pipeline --only=kherwara-golden,small-bridge # a subset
 *   pnpm run pipeline --input=inputs/MY.json              # an ad-hoc ProjectInput file
 *   pnpm run pipeline --out=out/pipeline                  # destination folder
 *
 * Each project is written to <out>/<project-id>/ with the six review artefacts plus
 * input.json and design-results.json, and the run itself produces manifest.json listing
 * every stage, its status, wall time and output size.
 *
 * The narrative stage is reported as SKIPPED rather than faked: lib/narrative consumes
 * @workspace/engine's BridgeCalculationResult, a different domain model from this
 * pipeline's CompleteDesignResult. Joining them is the open engine-decoupling item.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine.ts';
import { generateCompleteExcel } from '../bridge-excel-generator/index.ts';
import { ProjectInputSchema } from '../bridge-excel-generator/input-contract.ts';
import { generateComprehensivePDF } from '../server/comprehensive-pdf-export.ts';
import { generateDesignPDF } from '../server/pdf-export.ts';
import { generateLandscapeBookPDF } from '../server/landscape-pdf-export.ts';
import { generateHTMLDesignReport } from '../server/design-report.ts';
import { generateIrcChecklistHTML } from '../server/checklist-export.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';
import type { EnhancedProjectInput, ProjectInput } from '../bridge-excel-generator/types.ts';

type Stage = { name: string; status: 'ok' | 'skipped' | 'failed'; ms: number; bytes?: number; detail?: string };
type ProjectRun = { id: string; name: string; folder: string; verdict: string; stages: Stage[] };

function flag(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : undefined;
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// tmp/ is git-ignored; out/ holds tracked reports, so batch runs must not land there by default.
const outDir = resolve(repoRoot, flag('out') ?? join('tmp', 'pipeline'));
const safeName = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, '_');

function selectProjects(): Array<{ id: string; name: string; input: ProjectInput }> {
  const inputPath = flag('input');
  if (inputPath) {
    const abs = resolve(repoRoot, inputPath);
    const parsed = ProjectInputSchema.safeParse(JSON.parse(readFileSync(abs, 'utf8')));
    if (!parsed.success) {
      throw new Error(`${abs} is not a valid ProjectInput: ${parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
    return [{ id: safeName(parsed.data.projectName), name: parsed.data.projectName, input: parsed.data }];
  }
  const only = flag('only')?.split(',').map((s) => s.trim()).filter(Boolean);
  const templates = only?.length
    ? PHASE1_QUICK_TEMPLATES.filter((t) => only.includes(t.id))
    : PHASE1_QUICK_TEMPLATES;
  if (only?.length) {
    const missing = only.filter((id) => !PHASE1_QUICK_TEMPLATES.some((t) => t.id === id));
    if (missing.length) throw new Error(`Unknown template id(s): ${missing.join(', ')}`);
  }
  return templates.map((t) => ({ id: t.id, name: t.name, input: t.input }));
}

async function runProject(project: { id: string; name: string; input: ProjectInput }): Promise<ProjectRun> {
  const folder = join(outDir, safeName(project.id));
  mkdirSync(folder, { recursive: true });
  const stages: Stage[] = [];
  const stage = async (name: string, write: () => Promise<number> | number) => {
    const started = Date.now();
    try {
      const bytes = await write();
      stages.push({ name, status: 'ok', ms: Date.now() - started, bytes });
    } catch (error) {
      stages.push({ name, status: 'failed', ms: Date.now() - started, detail: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  await stage('inputs', () => {
    writeFileSync(join(folder, 'input.json'), JSON.stringify(project.input, null, 2), 'utf-8');
    return 0;
  });

  let design!: ReturnType<typeof calculateCompleteDesign>;
  await stage('calculate', () => {
    design = calculateCompleteDesign(project.input, { quiet: true });
    writeFileSync(join(folder, 'design-results.json'), JSON.stringify(design, null, 2), 'utf-8');
    return 0;
  });
  const enhanced = { ...project.input, ...design } as EnhancedProjectInput;

  await stage('workbook', async () => {
    const buffer = await generateCompleteExcel(project.input);
    writeFileSync(join(folder, 'design-workbook.xlsx'), buffer);
    return buffer.length;
  });
  await stage('sheet-book-pdf', async () => {
    const buffer = await generateLandscapeBookPDF(project.input);
    writeFileSync(join(folder, 'sheet-book.pdf'), buffer);
    return buffer.length;
  });
  await stage('comprehensive-pdf', async () => {
    const buffer = await generateComprehensivePDF(enhanced);
    writeFileSync(join(folder, 'comprehensive-report.pdf'), buffer);
    return buffer.length;
  });
  await stage('short-pdf', async () => {
    const buffer = await generateDesignPDF(enhanced);
    writeFileSync(join(folder, 'short-design-report.pdf'), buffer);
    return buffer.length;
  });
  await stage('html-report', async () => {
    const html = await generateHTMLDesignReport(enhanced);
    writeFileSync(join(folder, 'design-report.html'), html, 'utf-8');
    return Buffer.byteLength(html, 'utf-8');
  });
  await stage('irc-checklist', () => {
    const html = generateIrcChecklistHTML(enhanced, design);
    writeFileSync(join(folder, 'irc-checklist.html'), html, 'utf-8');
    return Buffer.byteLength(html, 'utf-8');
  });
  stages.push({
    name: 'narrative',
    status: 'skipped',
    ms: 0,
    detail: 'lib/narrative reads @workspace/engine results, not CompleteDesignResult (engine decoupling is unresolved).',
  });

  const cases = [...design.pier.loadCases, ...design.abutmentType1.loadCases, ...design.abutmentC1.loadCases];
  const unsafe = cases.filter((c) => c.status !== 'SAFE').length;
  return {
    id: project.id,
    name: project.name,
    folder: `./${safeName(project.id)}`,
    verdict: unsafe === 0 ? 'ALL CASES SAFE' : `${unsafe}/${cases.length} case(s) not SAFE`,
    stages,
  };
}

// The root package is CommonJS, so this entry wraps its driver in main() rather than
// using top-level await.

// A headless run has no console attached to it: `pnpm run pipeline` is what a container, a cron job or
// a CI step sees when the design engine throws, so the stack goes to stderr with the message.
function describeError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
  return String(error);
}
async function main() {
  mkdirSync(outDir, { recursive: true });
  const projects = selectProjects();
  console.log(`Pipeline: ${projects.length} project(s) → ${outDir}`);

  const runs: ProjectRun[] = [];
  let failures = 0;
  for (const project of projects) {
    try {
      const run = await runProject(project);
      runs.push(run);
      const sizes = run.stages.filter((s) => s.status === 'ok').map((s) => `${s.name} ${(s.bytes ?? 0).toLocaleString('en-IN')}`).join(' · ');
      console.log(`✓ ${run.id} — ${run.verdict}\n    ${sizes}`);
    } catch (error) {
      failures += 1;
      runs.push({ id: project.id, name: project.name, folder: `./${safeName(project.id)}`, verdict: 'FAILED', stages: [] });
      console.error(`✖ ${project.id} — ${describeError(error)}`);
    }
  }

  writeFileSync(
    join(outDir, 'manifest.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        outDir,
        narrativeStage: 'skipped — see per-project stage list',
        failures,
        projects: runs,
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`\nWrote ${runs.length} project folder(s) and manifest.json to ${outDir}`);
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Pipeline failed: ${describeError(error)}`);
  process.exitCode = 1;
});
