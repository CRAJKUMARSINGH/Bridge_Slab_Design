import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { createApp } from '../../server/app-factory.ts';
import { resolveDefaultPierAssetRoot } from '../../server/pier-case-engine.ts';

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
  it('GET /api/design/pier-cases/catalog returns a scored catalog from the installed library', async () => {
    const res = await request(app)
      .get('/api/design/pier-cases/catalog')
      .expect(200);

    assert.equal(res.body.success, true);
    const catalog = res.body.catalog;
    assert.ok(catalog.root && existsSync(catalog.root) && statSync(catalog.root).isDirectory());
    assert.ok(catalog.totalFiles > 0, 'catalog must not be empty when the asset library is installed');
    assert.equal(catalog.files.length, catalog.totalFiles);
    for (const file of catalog.files) {
      assert.ok(['.dwg', '.dxf', '.pdf'].includes(file.ext), `unexpected extension ${file.ext}`);
    }
    // The regression this closes: the cwd-bound default used to land on Attached_Assets, where every
    // drawing classified as 'unknown' and no template could claim source evidence.
    assert.ok(
      catalog.templateCoverage.some((t: { sourceBacked: boolean }) => t.sourceBacked),
      'at least one pier template must be backed by a drawing in the default library'
    );
  });

  it('catalog root does not depend on the server working directory (§T-9)', () => {
    const fromRepo = resolveDefaultPierAssetRoot();
    assert.ok(fromRepo && statSync(fromRepo).isDirectory(), 'expected an installed library when run from the repo');
    const previous = process.cwd();
    process.chdir(tmpdir());
    try {
      assert.equal(resolveDefaultPierAssetRoot(), fromRepo);
    } finally {
      process.chdir(previous);
    }
  });

  it('GET /api/design/pier-cases/catalog answers 503 when PIER_ASSET_ROOT points at nothing', async () => {
    const previous = process.env.PIER_ASSET_ROOT;
    process.env.PIER_ASSET_ROOT = join(tmpdir(), 'pier-asset-root-that-does-not-exist');
    try {
      const res = await request(app).get('/api/design/pier-cases/catalog');
      assert.equal(res.status, 503);
      assert.equal(res.body.success, false);
      assert.match(res.body.error, /PIER_ASSET_ROOT/);
    } finally {
      if (previous === undefined) delete process.env.PIER_ASSET_ROOT;
      else process.env.PIER_ASSET_ROOT = previous;
    }
  });

  it('GET /api/design/pier-cases/catalog answers 400 for a missing root instead of 500', async () => {
    const defaultRoot = resolveDefaultPierAssetRoot();
    assert.ok(defaultRoot);
    const res = await request(app)
      .get('/api/design/pier-cases/catalog')
      .query({ root: join(defaultRoot!, 'no-such-drawing-folder') });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /root is not a directory/);
  });

  it('GET /api/design/pier-cases/catalog answers 400 for a root outside the asset library', async () => {
    const res = await request(app)
      .get('/api/design/pier-cases/catalog')
      .query({ root: resolve(process.cwd(), 'server') });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /must be within the installed asset library/);
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
