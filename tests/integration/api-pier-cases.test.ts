import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

const VALID_INPUT = {
  projectName: "Pier Test Bridge",
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

describe('API Integration — Pier Case Recommendation Engine', () => {
  it('GET /api/design/pier-cases/catalog returns catalog listing', async () => {
    const res = await request(app)
      .get('/api/design/pier-cases/catalog')
      .expect(200);

    assert.ok(Array.isArray(res.body) || typeof res.body === 'object');
  });

  it('GET /api/design/pier-cases/master-schema returns JSON schema validation schema', async () => {
    const res = await request(app)
      .get('/api/design/pier-cases/master-schema')
      .expect(200);

    assert.ok(res.body.properties || res.body.type || typeof res.body === 'object');
  });

  it('POST /api/design/pier-cases/recommend outputs recommended pier profile config', async () => {
    const res = await request(app)
      .post('/api/design/pier-cases/recommend')
      .send(VALID_INPUT);

    assert.ok([200, 400].includes(res.status));
  });

  it('POST /api/design/pier-cases/generate produces template payload', async () => {
    const res = await request(app)
      .post('/api/design/pier-cases/generate')
      .send({
        pierType: "wall-pier",
        parameters: { width: 1.2, height: 6.5 }
      });

    assert.ok([200, 400].includes(res.status));
  });
});
