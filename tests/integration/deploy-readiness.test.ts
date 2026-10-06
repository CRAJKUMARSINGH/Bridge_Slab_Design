import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '../..');
const atRoot = (p: string) => resolve(ROOT_DIR, p);

/** Major version named by a `node:` image tag, an .nvmrc line or a setup-node input. */
function nodeMajor(raw: string): string | null {
  const m = raw.match(/\b(\d+)(?:\.\d+)?/);
  return m ? m[1] : null;
}

describe('Deployment Configuration Readiness (Vercel is the only live lane)', () => {
  it('DEP-001: vercel.json exists and has valid rewrites', () => {
    const config = JSON.parse(readFileSync(atRoot('vercel.json'), 'utf-8'));
    assert.ok(config.rewrites, 'Should declare routes rewrites');
    assert.ok(config.rewrites.some((r: any) => r.source === '/api/(.*)'), 'Must map API endpoints');
  });

  /**
   * DUE-6 (§N-1) archived netlify.toml: it pointed `/api/*` at a function entry that was
   * never written and ran npm, which the root `preinstall` refuses. This lane keeps that
   * decision honest — the file must stay out of the root, and its quarantine folder must
   * still explain itself.
   */
  it('DEP-002: netlify.toml stays quarantined in archive/, not at the repo root', () => {
    assert.equal(
      existsSync(atRoot('netlify.toml')),
      false,
      'netlify.toml must not return to the root before the Netlify function entry exists',
    );
    const archiveDir = atRoot('archive/20261005-netlify-config-without-function-entry');
    assert.equal(existsSync(resolve(archiveDir, 'netlify.toml')), true, 'archived config must be kept, not deleted');
    const readme = readFileSync(resolve(archiveDir, 'README.md'), 'utf-8');
    assert.match(readme, /build:netlify/, 'quarantine note must name the missing build script');
    assert.match(readme, /netlify\/functions/, 'quarantine note must name the missing function entry');
  });

  /** A rewrite to a non-existent serverless entry is the exact defect that archived Netlify. */
  it('DEP-003: the Vercel API entry and build script referenced by vercel.json both exist', () => {
    const config = JSON.parse(readFileSync(atRoot('vercel.json'), 'utf-8'));
    assert.equal(existsSync(atRoot('api/index.ts')), true, 'api/index.ts must back the /api/(.*) rewrite');
    assert.match(config.installCommand, /^pnpm install --frozen-lockfile$/, 'npm is refused by the root preinstall');

    const entry = readFileSync(atRoot('api/index.ts'), 'utf-8');
    assert.match(entry, /app-factory/, 'the entry must mount the same Express app the tests exercise');

    const pkg = JSON.parse(readFileSync(atRoot('package.json'), 'utf-8'));
    const buildScript = String(config.buildCommand).replace('pnpm run ', '');
    assert.ok(pkg.scripts[buildScript], `${buildScript} must exist in the root manifest`);
    assert.match(pkg.scripts[buildScript], /build:client|vite build/);
    assert.match(pkg.scripts['build:client'], /vite build/, 'the client build is what produces the publish dir');
  });

  /** CI, the container image and .nvmrc must name one Node major, or "pinned" means three things. */
  it('DEP-004: node version is pinned to one major across nvmrc, CI and Docker', () => {
    const nvmrc = readFileSync(atRoot('.nvmrc'), 'utf-8').trim();
    const ci = readFileSync(atRoot('.github/workflows/ci.yml'), 'utf-8');
    const docker = readFileSync(atRoot('Dockerfile'), 'utf-8');

    const ciMajor = nodeMajor(ci.match(/node-version:\s*\S+/)?.[0] ?? '');
    const dockerMajor = nodeMajor(docker.match(/^FROM\s+node:[^\s]+/im)?.[0] ?? '');
    const nvmrcMajor = nodeMajor(nvmrc);

    assert.ok(nvmrcMajor, `.nvmrc must name a node major (found: ${nvmrc})`);
    assert.equal(ciMajor, nvmrcMajor, 'CI setup-node must match .nvmrc');
    assert.equal(dockerMajor, nvmrcMajor, 'Dockerfile base image must match .nvmrc');
  });
});
