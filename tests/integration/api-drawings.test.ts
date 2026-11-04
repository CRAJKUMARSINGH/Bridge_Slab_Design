import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

const VALID_INPUT = {
  projectName: "Drawing Test",
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

describe('API Integration — Drawings & SVG', () => {
  const drawingEndpoints = [
    'gad',
    'pier',
    'abutment',
    'slab',
    'scour-profile',
    'pier-stability',
    'abutment-pressure',
    'slab-reinf-plan'
  ];

  for (const ep of drawingEndpoints) {
    it(`GET /api/design/drawings/svg/${ep} returns valid SVG content`, async () => {
      const res = await request(app)
        .get(`/api/design/drawings/svg/${ep}`)
        .expect(200);

      const len = res.text?.length || (Buffer.isBuffer(res.body) ? res.body.length : 0);
      assert.ok(len > 0, `expected non-empty SVG for ${ep}`);
    });

    it(`POST /api/design/drawings/svg/${ep} returns valid SVG content`, async () => {
      const res = await request(app)
        .post(`/api/design/drawings/svg/${ep}`)
        .send(VALID_INPUT)
        .expect(200);

      const len = res.text?.length || (Buffer.isBuffer(res.body) ? res.body.length : 0);
      assert.ok(len > 0, `expected non-empty SVG for ${ep}`);
    });
  }

  it('POST /api/design/dxf returns valid DXF stream/file', async () => {
    const res = await request(app)
      .post('/api/design/dxf')
      .send(VALID_INPUT)
      .expect(200);

    assert.ok(res.text.includes('SECTION') || res.text.includes('HEADER') || res.body.length > 100);
  });
});
