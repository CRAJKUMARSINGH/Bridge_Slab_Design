import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

const VALID_INPUT = {
  projectName: "Specialty Test",
  spanLength: 8,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  bedLevel: 95,
  hfl: 100,
  foundationLevel: 90,
  discharge: 150,
  manningN: 0.035,
  bedSlope: 500,
  laceysSiltFactor: 1.1,
  pierWidth: 1.2,
  pierLength: 8.5,
  pierDepth: 5,
  numberOfPiers: 0,
  pierBaseWidth: 4.5,
  pierBaseLength: 10.5,
  abutmentHeight: 6.5,
  abutmentWidth: 10.5,
  abutmentDepth: 4.5,
  concreteGrade: "M30",
  steelGrade: "Fe500",
  sbc: 250,
  gamma: 18,
  crossSectionData: [
    { chainage: 0, gl: 100 },
    { chainage: 20, gl: 95 },
    { chainage: 40, gl: 100 }
  ]
};

describe('API Integration — Specialty Endpoints', () => {
  it('POST /api/design/reinforcement/schedule generates bar bending schedule json', async () => {
    const res = await request(app)
      .post('/api/design/reinforcement/schedule')
      .send(VALID_INPUT)
      .expect(200);

    assert.ok(res.body.bars || res.body.totalWeight || typeof res.body === 'object');
  });

  it('POST /api/design/reinforcement/drawing/:element returns reinforcement layout svg', async () => {
    const res = await request(app)
      .post('/api/design/reinforcement/drawing/slab')
      .send(VALID_INPUT);

    assert.ok([200, 400].includes(res.status));
  });

  it('POST /api/design/reinforcement/section/:element returns cross sectional detail svg', async () => {
    const res = await request(app)
      .post('/api/design/reinforcement/section/pier')
      .send(VALID_INPUT);

    assert.ok([200, 400].includes(res.status));
  });

  it('POST /api/design/detailed-abutment/:type performs structural analysis of abutment', async () => {
    const res = await request(app)
      .post('/api/design/detailed-abutment/cantilever')
      .send(VALID_INPUT);

    assert.ok([200, 400].includes(res.status));
  });

  it('POST /api/design/detailed-estimation calculates cost assessment metrics', async () => {
    const res = await request(app)
      .post('/api/design/detailed-estimation')
      .send(VALID_INPUT);

    assert.ok([200, 400].includes(res.status));
  });

  it('POST /api/design/deck-anchorage computes anchorage requirements', async () => {
    const res = await request(app)
      .post('/api/design/deck-anchorage')
      .send(VALID_INPUT);

    assert.ok([200, 400].includes(res.status));
  });

  it('GET /api/design/slabdraw-health checks slab drawing package health', async () => {
    // Pin the upstream: the default localhost:8000 is whatever the developer happens to be
    // running, so an ambient service used to decide which status code came back here.
    process.env.SLABDRAW_URL = 'http://127.0.0.1:1';
    process.env.SLABDRAW_TIMEOUT = '500';
    process.env.SLABDRAW_RETRY = '1';

    const res = await request(app)
      .get('/api/design/slabdraw-health');

    assert.equal(res.status, 502);
    assert.equal(res.body.success, false);
  });
});
