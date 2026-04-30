/**
 * Golden hydraulics: committed JSON snapshots + algebraic identities.
 * Run: npm run verify:engine
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { HydraulicsResult, ProjectInput } from '../bridge-excel-generator/types';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';
import { HIGH_LEVEL_REFERENCE_PROJECT_INPUT } from './fixtures/high-level-project-input';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from './fixtures/kherwara-project-input';
import { MINIMAL_CHANNEL_PROJECT_INPUT } from './fixtures/minimal-channel-project-input';
import { SUPERCRITICAL_SLOT_PROJECT_INPUT } from './fixtures/supercritical-slot-project-input';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EPS = 1e-6;

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPS * (1 + Math.abs(b));
}

/** Relative tolerance for products/quotients (cumulative FP noise). */
const REL = 1e-9;

function assertClose(name: string, a: number, b: number): boolean {
  const ok = Math.abs(a - b) <= REL * (1 + Math.abs(a) + Math.abs(b));
  if (!ok) console.error(`  ${name}: expected ${b}, got ${a} (diff ${a - b})`);
  return ok;
}

function verifySnapshot(hydraulics: HydraulicsResult, snapshot: Record<string, unknown>): boolean {
  const keys = Object.keys(snapshot) as (keyof HydraulicsResult)[];
  let failed = false;

  for (const k of keys) {
    const exp = snapshot[k as string];
    const act = hydraulics[k];
    if (k === 'flowType' || k === 'isFreeboardSafe') {
      if (act !== exp) {
        console.error(`  Mismatch ${k}: expected ${exp}, got ${act}`);
        failed = true;
      }
      continue;
    }
    if (typeof exp !== 'number' || typeof act !== 'number') {
      console.error(`  Bad type for ${k}`);
      failed = true;
      continue;
    }
    if (!close(act, exp)) {
      console.error(`  Mismatch ${k}: expected ${exp}, got ${act}`);
      failed = true;
    }
  }
  return !failed;
}

function verifyIdentities(h: HydraulicsResult, input: ProjectInput): boolean {
  let idFailed = false;
  idFailed ||= !assertClose('R = A/P', h.hydraulicRadius, h.crossSectionalArea / h.wettedPerimeter);
  idFailed ||= !assertClose('Q = A×V', h.discharge, h.crossSectionalArea * h.velocity);
  idFailed ||= !assertClose('design scour = 2×dsm', h.designScourDepth, 2 * h.scourDepth);
  idFailed ||= !assertClose('DWL = HFL + afflux', h.designWaterLevel, input.hfl + h.afflux);
  const avgDepth = input.hfl - input.bedLevel;
  const frExpect = h.velocity / Math.sqrt(9.81 * avgDepth);
  idFailed ||= !assertClose('Froude = V/√(gh)', h.froudeNumber, frExpect);
  const flowExpect = h.froudeNumber < 1 ? 'Subcritical' : 'Supercritical';
  if (h.flowType !== flowExpect) {
    console.error(`  flowType: expected ${flowExpect} from Fr, got ${h.flowType}`);
    idFailed = true;
  }
  return !idFailed;
}

function runCase(label: string, projectInput: ProjectInput, snapshotFile: string): boolean {
  const snapshotPath = join(__dirname, 'fixtures', snapshotFile);
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8')) as Record<string, unknown>;
  const { hydraulics, input } = calculateCompleteDesign(projectInput, { quiet: true });

  console.log(`— ${label}`);

  if (!verifySnapshot(hydraulics, snapshot)) {
    console.error(`verify:engine FAILED (${label} — snapshot)`);
    return false;
  }
  if (!verifyIdentities(hydraulics, input)) {
    console.error(`verify:engine FAILED (${label} — identities)`);
    return false;
  }
  console.log(`  OK (snapshot + identities)`);
  return true;
}

const ok =
  runCase('Kherwara reference', KHERWARA_REFERENCE_PROJECT_INPUT, 'kherwara-hydraulics-snapshot.json') &&
  runCase('High-level reference', HIGH_LEVEL_REFERENCE_PROJECT_INPUT, 'high-level-hydraulics-snapshot.json') &&
  runCase('Minimal channel (synthetic)', MINIMAL_CHANNEL_PROJECT_INPUT, 'minimal-channel-hydraulics-snapshot.json') &&
  runCase('Supercritical slot (synthetic)', SUPERCRITICAL_SLOT_PROJECT_INPUT, 'supercritical-slot-hydraulics-snapshot.json');

if (!ok) process.exit(1);
console.log('verify:engine OK — all hydraulics fixtures passed');
