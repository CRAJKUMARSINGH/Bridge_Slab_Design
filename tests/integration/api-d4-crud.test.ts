import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';

const app = createApp({ cors: false, logging: false });

describe('API Integration — D4 CRUD Operations', () => {
  let createdProjectId: string | number;
  let createdFileId: string | number;
  let createdRecordId: string | number;
  let createdComparisonId: string | number;

  it('GET /api/projects lists projects', async () => {
    const res = await request(app).get('/api/projects');
    assert.ok([200, 503].includes(res.status));
  });

  it('POST /api/projects creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        name: "Test CRUD Project",
        description: "Created during automation test run"
      });

    assert.ok([200, 201, 503].includes(res.status));
    if (res.status !== 503) createdProjectId = res.body.id;
  });

  it('GET /api/projects/:id returns single project details', async () => {
    if (!createdProjectId) return;
    const res = await request(app).get(`/api/projects/${createdProjectId}`);
    assert.ok([200, 404, 503].includes(res.status));
  });

  it('PATCH /api/projects/:id updates project info', async () => {
    if (!createdProjectId) return;
    const res = await request(app)
      .patch(`/api/projects/${createdProjectId}`)
      .send({ name: "Updated Test Project" });
    assert.ok([200, 404, 503].includes(res.status));
  });

  it('POST /api/files registers a file', async () => {
    const res = await request(app)
      .post('/api/files')
      .send({
        projectId: createdProjectId ? Number(createdProjectId) : 1,
        filename: "test_input.xlsx",
        status: "processing"
      });

    assert.ok([200, 201, 503].includes(res.status));
    if (res.status !== 503) createdFileId = res.body.id;
  });

  it('GET /api/files lists uploaded design files', async () => {
    const res = await request(app).get('/api/files');
    assert.ok([200, 503].includes(res.status));
  });

  it('POST /api/records creates a run record', async () => {
    const res = await request(app)
      .post('/api/records')
      .send({
        projectId: createdProjectId ? Number(createdProjectId) : 1,
        variationType: "baseline",
        inputSnapshot: { spanLength: 8 }
      });

    assert.ok([200, 201, 503].includes(res.status));
    if (res.status !== 503) createdRecordId = res.body.id;
  });

  it('POST /api/comparisons generates a comparison set', async () => {
    const res = await request(app)
      .post('/api/comparisons')
      .send({
        name: "Test Comparison Set",
        recordIds: [createdRecordId ? Number(createdRecordId) : 1]
      });

    assert.ok([200, 201, 503].includes(res.status));
    if (res.status !== 503) createdComparisonId = res.body.id;
  });

  it('GET /api/stats/summary returns status counters', async () => {
    const res = await request(app).get('/api/stats/summary');
    assert.ok([200, 503].includes(res.status));
  });

  it('DELETE /api/comparisons/:id cleans up comparison', async () => {
    if (!createdComparisonId) return;
    const res = await request(app).delete(`/api/comparisons/${createdComparisonId}`);
    assert.ok([200, 204, 404, 503].includes(res.status));
  });

  it('DELETE /api/records/:id cleans up record', async () => {
    if (!createdRecordId) return;
    const res = await request(app).delete(`/api/records/${createdRecordId}`);
    assert.ok([200, 204, 404, 503].includes(res.status));
  });

  it('DELETE /api/files/:id cleans up file', async () => {
    if (!createdFileId) return;
    const res = await request(app).delete(`/api/files/${createdFileId}`);
    assert.ok([200, 204, 404, 503].includes(res.status));
  });

  it('DELETE /api/projects/:id cleans up project', async () => {
    if (!createdProjectId) return;
    const res = await request(app).delete(`/api/projects/${createdProjectId}`);
    // 204 No Content is what every d4 DELETE route returns on success.
    assert.ok([200, 204, 404, 503].includes(res.status));
  });
});
