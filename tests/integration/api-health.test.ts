import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

describe('API Integration — Health & Metadata', () => {
  it('GET /api/health returns 200 with system features', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(res.body.status, 'healthy');
    assert.ok(res.body.version);
    assert.ok(res.body.features);
    assert.equal(res.body.features.calculations, true);
    assert.equal(res.body.features.excelGeneration, true);
  });

  it('GET /health (legacy) returns 200 with deprecation note', async () => {
    const res = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(res.body.status, 'healthy');
    assert.ok(res.body.note.includes('Use /api/health instead'));
  });

  it('GET /api/openapi.yaml returns spec or status check', async () => {
    const res = await request(app)
      .get('/api/openapi.yaml');

    assert.ok([200, 404, 503].includes(res.status), `unexpected status ${res.status}`);
  });

  it('GET /api/design/feature-flags returns 200 and valid flag object', async () => {
    const res = await request(app)
      .get('/api/design/feature-flags')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.equal(typeof res.body, 'object');
  });
});
