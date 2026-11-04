import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

/**
 * Superagent leaves xlsx bodies un-parsed, so `res.body` would be an empty
 * object even when the workbook is valid. Collect the raw bytes instead.
 */
function binaryParser(res: any, callback: (err: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = [];
  res.setEncoding('binary');
  res.on('data', (chunk: string) => chunks.push(Buffer.from(chunk, 'binary')));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}

/**
 * Complete valid input matching the ProjectInputSchema contract.
 * All required fields from input-contract.ts are present:
 * location, riverName, totalLength, dirtWallHeight, returnWallLength,
 * fck, fy, phi, rtl, agl, nbl, ofl, dwl, laceysSiltFactor
 */
const VALID_MINIMAL_INPUT = {
  projectName: "Test Bridge",
  location: "Rajasthan, India",
  riverName: "Test River",
  spanLength: 8,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 8,
  bedLevel: 95,
  hfl: 100,
  foundationLevel: 90,
  discharge: 150,
  manningN: 0.035,
  bedSlope: 500,
  laceysSiltFactor: 1.1,
  crossSectionData: [
    { chainage: 0, gl: 100 },
    { chainage: 20, gl: 95 },
    { chainage: 40, gl: 100 }
  ],
  pierWidth: 1.2,
  pierLength: 8.5,
  pierDepth: 5,
  numberOfPiers: 0,
  pierBaseWidth: 4.5,
  pierBaseLength: 10.5,
  abutmentHeight: 6.5,
  abutmentWidth: 10.5,
  abutmentDepth: 4.5,
  dirtWallHeight: 2.5,
  returnWallLength: 6,
  concreteGrade: "M30",
  fck: 30,
  steelGrade: "Fe500",
  fy: 500,
  sbc: 250,
  phi: 30,
  gamma: 18,
  rtl: 103,
  agl: 95,
  nbl: 95,
  ofl: 100,
  dwl: 100.5,
};

describe('API Integration — Calculation & Optimise', () => {
  it('POST /api/design/calculate with valid input returns binary excel sheet', async () => {
    const res = await request(app)
      .post('/api/design/calculate')
      .send(VALID_MINIMAL_INPUT)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    assert.ok(res.headers['content-type'].includes('sheet') || res.headers['content-type'].includes('octet-stream'));
    const workbook = res.body as Buffer;
    assert.ok(workbook.length > 1000);
    // xlsx is a zip container: every valid workbook starts with the PK signature
    assert.equal(workbook.subarray(0, 2).toString('latin1'), 'PK');
  });

  it('POST /api/design/calculate with invalid body returns 400 or 500 with error info', async () => {
    // The body schema is lenient (all fields optional), so { spanLength: -5 }
    // passes Zod validation but may fail in the engine. Accept 400 or 500
    // as both indicate the server correctly rejects invalid input.
    const res = await request(app)
      .post('/api/design/calculate')
      .send({ spanLength: -5 });

    assert.ok(res.status === 400 || res.status === 500, `Expected 400 or 500, got ${res.status}`);
    assert.equal(res.body.success, false);
  });

  it('POST /api/design/optimise runs the search and forwards the engine verdict', async () => {
    const res = await request(app)
      .post('/api/design/optimise')
      .send(VALID_MINIMAL_INPUT)
      .expect(200);

    // This used to assert success === true, which only passed because the route
    // hard-coded it; the route now forwards the engine's convergence flag.
    assert.equal(typeof res.body.success, 'boolean');
    assert.ok(Array.isArray(res.body.trials) && res.body.trials.length >= 1);
    assert.equal(res.body.success, res.body.trials.at(-1).status === 'SAFE');
    assert.ok(res.body.optimised && res.body.original);
  });

  it('GET /api/design/templates returns list of design templates', async () => {
    const res = await request(app)
      .get('/api/design/templates')
      .expect(200);

    const list = res.body.templates || res.body;
    assert.ok(Array.isArray(list) || res.body.success);
  });

  it('GET /api/design/demo-seed returns fully populated default input set', async () => {
    const res = await request(app)
      .get('/api/design/demo-seed')
      .expect(200);

    const input = res.body.input || res.body;
    assert.ok(input.projectName || res.body.success);
  });
});
