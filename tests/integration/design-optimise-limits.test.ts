/**
 * GENSPARK-001 — the optimisation route runs the whole design engine once per trial, so
 * it must (a) schema-validate its payload, (b) bound the CPU time, and (c) report the
 * engine's own convergence verdict instead of hard-coding success.
 *
 * The router is mounted at /api/design (server/app-factory.ts) and body parsing is capped
 * at 200 kb there, so the oversized payload is exercised on the mounted path.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { optimiseBridgeDesign } from '../../server/optimisation-engine';
import { PHASE1_QUICK_TEMPLATES } from '../../server/default-project-inputs';
import { createApp } from '../../server/app-factory.ts';
import type { ProjectInput } from '../../bridge-excel-generator/types';

const input = PHASE1_QUICK_TEMPLATES[0]!.input as ProjectInput;
// Production shape: router mounted at /api/design with a 200 kb JSON body limit.
const app = createApp({ cors: false, logging: false });

test('optimiser reports non-convergence honestly instead of claiming success', async () => {
  const result = await optimiseBridgeDesign(input, { maxIterations: 2, deadlineMs: 120_000 });
  assert.equal(result.success, false);
  assert.equal(result.trials.length, 2);
  assert.match(result.message, /within 2 iterations/);
});

test('optimiser stops on its compute budget and reports the budget', async () => {
  const result = await optimiseBridgeDesign(input, { maxIterations: 500, deadlineMs: 0 });
  assert.equal(result.success, false);
  assert.equal(result.trials.length, 0);
  assert.match(result.message, /compute budget exhausted/);
});

test('POST /api/design/optimise rejects a payload the design contract rejects', async () => {
  const res = await request(app)
    .post('/api/design/optimise')
    .send({ projectName: 'x', numberOfSpans: 0, carriageWidth: -1 });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(Array.isArray(res.body.issues) && res.body.issues.length === 2);
});

test('POST /api/design/optimise mirrors the engine verdict rather than forcing success', async () => {
  const res = await request(app).post('/api/design/optimise').send(input);
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.success, 'boolean');
  assert.ok(Array.isArray(res.body.trials) && res.body.trials.length >= 1);
  assert.equal(res.body.success, res.body.trials.some((t: { status: string }) => t.status === 'SAFE'));
});

test('POST /api/design/optimise refuses a payload beyond the body cap', async () => {
  const huge = { ...input, crossSectionData: Array.from({ length: 40_000 }, (_, i) => ({ chainage: i, gl: 100 })) };
  const res = await request(app).post('/api/design/optimise').send(huge);
  assert.equal(res.status, 413);
});
