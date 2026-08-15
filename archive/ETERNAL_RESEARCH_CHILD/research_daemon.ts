/**
 * ETERNAL_RESEARCH_CHILD — Bridge Slab Design research daemon
 *
 * Continuously scans Attached_Assets/ for legacy bridge design spreadsheets and
 * documents, then proposes focused improvements to hydraulics, structural,
 * slab, Excel/report pipelines, and UI—aligned with CURSOR SLAB DESIGN.
 *
 * Runs every 15 minutes. Prompts for approval before logging a proposal as
 * “approved” (implementation stays manual / PR-based—see objective.md).
 *
 * Usage (from repo root):
 *   npm run research          — start the daemon
 *   npm run research:once     — run one cycle and exit
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPO_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(REPO_ROOT, 'Attached_Assets');
const RESOURCES_TXT = path.join(ASSETS_DIR, '0 commands only', 'assets directory.txt');
const ENGINE_LIB = path.join(REPO_ROOT, 'client', 'src', 'report-engine', 'lib');
const ENGINE_SERVICES = path.join(REPO_ROOT, 'client', 'src', 'report-engine', 'services');
const LOG_FILE = path.join(__dirname, 'research_log.jsonl');
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const ONE_SHOT = process.argv.includes('--once');
/** Optional: force asset path for demos (match slash style from getLegacyFiles), e.g. `0 commands only/assets directory.txt` */
const FORCE_REL = process.env.RESEARCH_FORCE_REL?.trim().replace(/\\/g, '/');

interface ResearchProposal {
  timestamp: string;
  sourceFile: string;
  category: ProposalCategory;
  title: string;
  description: string;
  targetFile: string;
  approved: boolean | null;
}

type ProposalCategory =
  | 'hydraulics_legacy'
  | 'structural_stability'
  | 'live_load_traffic'
  | 'substructure'
  | 'slab_deck'
  | 'costing_estimate'
  | 'excel_workbook_golden'
  | 'narrative_report'
  | 'ui_design_drawing'
  | 'standards_traceability'
  | 'ecosystem_repos';

function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
}

function getEngineLibFiles(): string[] {
  return listTsFiles(ENGINE_LIB).map((f) => `client/src/report-engine/lib/${f}`);
}

function getEngineServiceFiles(): string[] {
  return listTsFiles(ENGINE_SERVICES).map((f) => `client/src/report-engine/services/${f}`);
}

function getAllEngineTargets(): string[] {
  return [...getEngineLibFiles(), ...getEngineServiceFiles()];
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

const LEGACY_EXT = /\.(xlsx|xls|doc|docx|txt|jpeg|jpg|png|pdf|htm|html)$/i;

function walkLegacyFiles(dir: string, baseRel = ''): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = baseRel ? path.join(baseRel, name) : name;
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...walkLegacyFiles(full, rel));
    } else if (LEGACY_EXT.test(name)) {
      out.push(rel.split(path.sep).join('/'));
    }
  }
  return out;
}

function getLegacyFiles(): string[] {
  return walkLegacyFiles(ASSETS_DIR);
}

let cachedGithubUrls: string[] | null = null;

function getGithubUrlsFromResources(): string[] {
  if (cachedGithubUrls) return cachedGithubUrls;
  try {
    if (!fs.existsSync(RESOURCES_TXT)) {
      cachedGithubUrls = [];
      return cachedGithubUrls;
    }
    const text = fs.readFileSync(RESOURCES_TXT, 'utf8');
    cachedGithubUrls = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^https:\/\/github\.com\//i.test(l));
    return cachedGithubUrls;
  } catch {
    cachedGithubUrls = [];
    return cachedGithubUrls;
  }
}

function appendResourceCue(description: string): string {
  const urls = getGithubUrlsFromResources();
  const cue = pickRandom(urls);
  if (!cue) return description;
  return (
    description +
    `\n\nEcosystem link (Attached_Assets/0 commands only/assets directory.txt): ${cue}`
  );
}

function generateProposal(sourceFile: string): ResearchProposal {
  const ext = path.extname(sourceFile).toLowerCase();
  const base = path.basename(sourceFile, ext).toLowerCase();
  const ts = new Date().toISOString();
  const randomTarget = pickRandom(getAllEngineTargets()) ?? 'client/src/report-engine/lib/hydraulicCalc.ts';
  const normSource = sourceFile.replace(/\\/g, '/').toLowerCase();

  const mentions = (words: string[]) => words.some((w) => base.includes(w));

  if (normSource.endsWith('assets directory.txt')) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'ecosystem_repos',
      title: 'Cross-repository bridge ecosystem alignment',
      description:
        `This manifest lists sibling GitHub repos (M2–M4, D1–D4, Dwg-Dxf-Record-Keeper, drawing tools) and optional local study/software paths. ` +
        `Keep ETERNAL_RESEARCH_CHILD/linked-resources.md aligned with it; use repos for parity reviews and regression ideas—never merge unchecked proprietary data. ` +
        `Primary upstream for this workspace: https://github.com/CRAJKUMARSINGH/Bridge_Slab_Design`,
      targetFile: 'ETERNAL_RESEARCH_CHILD/linked-resources.md',
      approved: null,
    };
  }

  if (ext === '.jpeg' || ext === '.jpg' || ext === '.png' || ext === '.pdf') {
    return {
      timestamp: ts,
      sourceFile,
      category: 'ui_design_drawing',
      title: 'Trace asset to UI or drawing export behaviour',
      description:
        `Binary reference "${sourceFile}" may show typical drawings, title blocks, or details. ` +
        `Decide whether to link it in USER_MANUAL.md, add a regression fixture under Git LFS, ` +
        `or extract checklist items for client/src/pages/Drawing.tsx and Design.tsx (labels, units, legends). ` +
        `Keep large files on Git LFS per root .gitattributes.`,
      targetFile: 'client/src/pages/Drawing.tsx',
      approved: null,
    };
  }

  if (mentions(['hydraulic', 'hydraulics', 'afflux', 'scour', 'manning', 'lacey', 'molesworth'])) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'hydraulics_legacy',
      title: 'Reconcile legacy hydraulic sheet with computeHydraulics',
      description:
        `Legacy asset "${sourceFile}" relates to hydraulics. Compare discharge, velocity, scour, ` +
        `and afflux assumptions against client/src/report-engine/lib/hydraulicCalc.ts and ` +
        `services/hydraulics.ts. Note IRC SP-13 / IRC:78 clause references for any proposed change. ` +
        `Run npm run verify:engine after adjustments.`,
      targetFile: 'client/src/report-engine/lib/hydraulicCalc.ts',
      approved: null,
    };
  }

  if (mentions(['stability', 'submersible', 'buoyancy'])) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'structural_stability',
      title: 'Cross-check stability workbook vs structural service',
      description:
        `"${sourceFile}" suggests pier/abutment or overall stability checks. Map load cases and factors ` +
        `to client/src/report-engine/services/structural.ts and related pier logic. ` +
        `Preserve golden-case parity (e.g. Kherwara/Larathi smoke paths). Document any new case in USER_MANUAL.md.`,
      targetFile: 'client/src/report-engine/services/structural.ts',
      approved: null,
    };
  }

  if (mentions(['liveload', 'live load', 'lane', 'llcal'])) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'live_load_traffic',
      title: 'Align live-load modelling with legacy lane tables',
      description:
        `Traffic/lane asset "${sourceFile}" may encode IRC Class A/A loading or impact assumptions. ` +
        `Compare with client/src/report-engine/lib/loadCalc.ts and slab inputs in bridgeDerivation.ts. ` +
        `Cite IRC:6 clauses if changing equivalent loads or dispersion.`,
      targetFile: 'client/src/report-engine/lib/loadCalc.ts',
      approved: null,
    };
  }

  if (mentions(['pier', 'pier cap', 'abutment', 'dirt wall', 'retaining', 'footing', 'ftg'])) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'substructure',
      title: 'Substructure comparison — pier/abutment spreadsheets',
      description:
        `"${sourceFile}" targets substructure. Review client/src/report-engine/lib/pierCalc.ts and ` +
        `structural integration in bridgeDerivation.ts for SBC, sliding, and moment paths. ` +
        `Any new coefficient should be tied to a cited standard or verified project constant.`,
      targetFile: 'client/src/report-engine/lib/pierCalc.ts',
      approved: null,
    };
  }

  if (mentions(['slab', 'deck', 'irc', 'reinforcement', 'schedule of reinforcement', 'anchorage'])) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'slab_deck',
      title: 'Slab/deck validation vs IRC working-stress path',
      description:
        `"${sourceFile}" relates to deck slab or reinforcement. Cross-check effective span, impact factor, ` +
        `and K-factor usage in client/src/report-engine/lib/ircSlabCalc.ts against the workbook. ` +
        `Extend client tests under lib/__tests__/ when locking numeric behaviour.`,
      targetFile: 'client/src/report-engine/lib/ircSlabCalc.ts',
      approved: null,
    };
  }

  if (mentions(['estimate', 'quantity', 'bill', 'surveying', 'boq'])) {
    return {
      timestamp: ts,
      sourceFile,
      category: 'costing_estimate',
      title: 'Quantity / estimate lineage vs costing service',
      description:
        `Estimate-style asset "${sourceFile}" may inform quantity hooks. Review client/src/report-engine/services/costing.ts ` +
        `and Excel generator bridges for naming consistency; avoid silent BOQ changes without audit trail.`,
      targetFile: 'client/src/report-engine/services/costing.ts',
      approved: null,
    };
  }

  if (ext === '.xlsx' || ext === '.xls') {
    return {
      timestamp: ts,
      sourceFile,
      category: 'excel_workbook_golden',
      title: 'Golden workbook alignment',
      description:
        `Spreadsheet "${sourceFile}" can serve as a cross-check against bridge-excel-generator output. ` +
        `Consider npm run verify:excel / npm run test:excel and scripts/verify-kherwara-excel-golden.ts. ` +
        `Store bulky templates via Git LFS if committed.`,
      targetFile: 'scripts/verify-kherwara-excel-golden.ts',
      approved: null,
    };
  }

  if (ext === '.doc' || ext === '.docx' || ext === '.txt' || ext === '.htm' || ext === '.html') {
    return {
      timestamp: ts,
      sourceFile,
      category: 'narrative_report',
      title: 'Design notes → narrative depth and manual',
      description:
        `Document "${sourceFile}" may contain assumptions or prose useful for USER_MANUAL.md or ` +
        `report-engine narrative (npm run verify:narrative). Extract clarifications; avoid pasting proprietary text verbatim.`,
      targetFile: 'USER_MANUAL.md',
      approved: null,
    };
  }

  return {
    timestamp: ts,
    sourceFile,
    category: 'standards_traceability',
    title: `Engineering review hook for ${path.basename(sourceFile)}`,
    description:
      `General legacy asset "${sourceFile}". Inspect ${randomTarget} for consistency with IRC SP-13, IRC:6, IRC:78, IRC:112 ` +
      `as applicable. Log external references (MoRTH/IRC links or clause IDs) when proposing numeric updates.`,
    targetFile: randomTarget,
    approved: null,
  };
}

function logProposal(proposal: ResearchProposal): void {
  fs.appendFileSync(LOG_FILE, JSON.stringify(proposal) + '\n', 'utf8');
}

function getRecentLog(limit = 5): ResearchProposal[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map((l: string) => JSON.parse(l) as ResearchProposal);
}

function printStats(): void {
  const log = getRecentLog(100);
  const approved = log.filter((p) => p.approved === true).length;
  const rejected = log.filter((p) => p.approved === false).length;
  const pending = log.filter((p) => p.approved === null).length;
  console.log(
    `\n Research Stats: ${approved} approved | ${rejected} rejected | ${pending} pending (last 100)`
  );
}

let timer: ReturnType<typeof setTimeout> | null = null;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function analyzeAndPropose(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('[ETERNAL_RESEARCH_CHILD] Research cycle starting…');
  console.log('='.repeat(60));

  const files = getLegacyFiles();

  if (files.length === 0) {
    console.log(`No legacy assets found under Attached_Assets/ (${ASSETS_DIR})`);
    scheduleNext();
    return;
  }

  let sourceFile: string;
  if (FORCE_REL) {
    const hit = files.find((f) => f.replace(/\\/g, '/') === FORCE_REL);
    if (hit) {
      sourceFile = hit;
      console.log(`\n[RESEARCH_FORCE_REL] Using: ${sourceFile}`);
    } else {
      console.warn(`RESEARCH_FORCE_REL not found (try forward slashes): ${FORCE_REL}`);
      sourceFile = files[Math.floor(Math.random() * files.length)]!;
    }
  } else {
    sourceFile = files[Math.floor(Math.random() * files.length)]!;
  }
  console.log(`\nStudying: ${sourceFile}`);
  console.log(
    `Assets: ${files.length} | Engine TS targets: ${getAllEngineTargets().length}`
  );

  process.stdout.write('Analyzing');
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 300));
    process.stdout.write('.');
  }
  console.log(' done.\n');

  let proposal = generateProposal(sourceFile);
  proposal = { ...proposal, description: appendResourceCue(proposal.description) };

  console.log('--------------------------------------------------------------');
  console.log('RESEARCH PROPOSAL');
  console.log('--------------------------------------------------------------');
  console.log(`Category  : ${proposal.category}`);
  console.log(`Source    : ${proposal.sourceFile}`);
  console.log(`Target    : ${proposal.targetFile}`);
  console.log(`Title     : ${proposal.title}`);
  console.log('--------------------------------------------------------------');
  console.log(proposal.description);
  console.log('--------------------------------------------------------------');

  printStats();

  const interactive = process.stdin.isTTY === true;

  if (!interactive) {
    proposal.approved = null;
    console.log('\nNon-interactive stdin — logged as skipped (no prompt). Use a real terminal for y/N.');
    logProposal(proposal);
    if (ONE_SHOT) {
      console.log('\n[--once mode] Single cycle complete. Exiting.');
      process.exit(0);
    }
    scheduleNext();
    return;
  }

  await new Promise<void>((resolve) => {
    rl.question('\nApprove this research proposal? (y/N/skip): ', (answer: string) => {
      const a = answer.trim().toLowerCase();
      if (a === 'y' || a === 'yes') {
        proposal.approved = true;
        console.log('\nApproved — logged for implementation.');
        console.log(`Review ${proposal.targetFile} and apply via PR with tests where applicable.`);
        console.log(`Full proposal saved to: ETERNAL_RESEARCH_CHILD/research_log.jsonl`);
      } else if (a === 'skip' || a === 's') {
        proposal.approved = null;
        console.log('\nSkipped — will revisit in a later cycle.');
      } else {
        proposal.approved = false;
        console.log('\nRejected — logged.');
      }
      logProposal(proposal);
      resolve();
    });
  });

  if (ONE_SHOT) {
    console.log('\n[--once mode] Single cycle complete. Exiting.');
    rl.close();
    return;
  }

  scheduleNext();
}

function scheduleNext(): void {
  const nextRun = new Date(Date.now() + CHECK_INTERVAL_MS);
  console.log(`\nNext research cycle at: ${nextRun.toLocaleTimeString()}`);
  timer = setTimeout(analyzeAndPropose, CHECK_INTERVAL_MS);
}

process.on('SIGINT', () => {
  console.log('\n[ETERNAL_RESEARCH_CHILD] Shutting down…');
  if (timer) clearTimeout(timer);
  rl.close();
  printStats();
  process.exit(0);
});

console.log('');
console.log('='.repeat(60));
console.log('  ETERNAL_RESEARCH_CHILD — CURSOR SLAB DESIGN');
console.log('='.repeat(60));
console.log(`  Repo root : ${REPO_ROOT}`);
console.log(`  Assets    : ${ASSETS_DIR}`);
console.log(`  Log file  : ${LOG_FILE}`);
console.log(`  Resource manifest : ${RESOURCES_TXT}`);
console.log(`  GitHub URLs loaded: ${getGithubUrlsFromResources().length}`);
console.log(`  Interval  : 15 minutes`);
console.log(`  Mode      : ${ONE_SHOT ? 'Single cycle (--once)' : 'Continuous daemon'}`);
console.log('='.repeat(60));
console.log('');
console.log(`Legacy files (recursive) under Attached_Assets/: ${getLegacyFiles().length}`);
console.log(`Engine targets (lib + services): ${getAllEngineTargets().length}`);
console.log('');
console.log('Press Ctrl+C to stop.');

analyzeAndPropose();
