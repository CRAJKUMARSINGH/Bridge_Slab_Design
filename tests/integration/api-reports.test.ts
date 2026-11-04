import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

const VALID_INPUT = {
  projectName: "Kherwara Integration Test",
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

describe('API Integration — Report Generation', () => {
  let validPayload: any = { ...VALID_INPUT };

  it('POST /api/design/report/html returns full HTML report', async () => {
    const seedRes = await request(app).get('/api/design/demo-seed');
    if (seedRes.body?.input) validPayload = seedRes.body.input;

    const res = await request(app)
      .post('/api/design/report/html')
      .send(validPayload)
      .expect(200);

    assert.ok(res.text.includes('<html') || res.text.includes('<!DOCTYPE html>') || res.text.includes('<div'));
  });

  it('POST /api/design/validate returns validation results JSON', async () => {
    const res = await request(app)
      .post('/api/design/validate')
      .send(validPayload)
      .expect(200);

    assert.ok(res.body.overallStatus || res.body.validations || res.body.success);
  });

  it('POST /api/design/validate/html returns validation checklist HTML', async () => {
    const res = await request(app)
      .post('/api/design/validate/html')
      .send(validPayload)
      .expect(200);

    assert.ok(res.text.includes('<html') || res.text.includes('<div'));
  });

  it('POST /api/design/checklist/html returns raw structural audit checklist', async () => {
    const res = await request(app)
      .post('/api/design/checklist/html')
      .send(validPayload)
      .expect(200);

    assert.ok(res.text.includes('<html') || res.text.includes('<div'));
  });

  it('POST /api/design/report-model returns clean structured report JSON', async () => {
    const res = await request(app)
      .post('/api/design/report-model')
      .send(validPayload)
      .expect(200);

    assert.ok(res.body.sections || res.body.metadata || res.body.model || res.body.success);
  });
});
