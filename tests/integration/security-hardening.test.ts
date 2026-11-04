/**
 * W04 — security hardening lane (product surface).
 *
 * The `gate:security` gate asserts the same contract at the gate layer; this lane is the
 * node:test product surface that a regression in `server/security.ts` must fail. The module
 * imports nothing (see its header), so the lane runs without an Express/exceljs tree.
 *
 * Runner: node:test (integration lane). Directly:
 *   node --test tests/integration/security-hardening.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SECURITY_HEADERS,
  applySecurityHeaders,
  buildErrorPayload,
  guardProxyUrl,
  resolveCorsOrigin,
  validateUpload,
  MAX_UPLOAD_BASE64_CHARS,
} from '../../server/security.ts';

const REQUIRED_HEADERS = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Referrer-Policy',
  'Content-Security-Policy',
];

describe('W04 T4.4 — security headers', () => {
  it('applies every required header with a non-empty value', () => {
    const seen: Record<string, string> = {};
    applySecurityHeaders({ setHeader: (name, value) => (seen[name] = value) });
    for (const header of REQUIRED_HEADERS) {
      assert.equal(typeof seen[header], 'string', `${header} is set`);
      assert.ok(seen[header].length > 0, `${header} is non-empty`);
    }
    assert.equal(seen['X-Frame-Options'], 'DENY');
    assert.equal(seen['X-Content-Type-Options'], 'nosniff');
    assert.equal(SECURITY_HEADERS['X-XSS-Protection'], '0');
    assert.match(seen['Content-Security-Policy'], /default-src 'self'/);
  });
});

describe('W04 T4.5 — no stack traces in production', () => {
  const boom = Object.assign(new Error('boom'), { stack: 'Error: boom\n  at secret' });

  it('omits the stack in production but keeps the message and status', () => {
    const { status, body } = buildErrorPayload(boom, 'production');
    assert.equal(status, 500);
    assert.equal(body.success, false);
    assert.equal(body.error, 'boom');
    assert.equal(body.stack, undefined, 'no stack leaks in production');
  });

  it('includes the stack only in development', () => {
    const dev = buildErrorPayload(boom, 'development');
    assert.equal(typeof dev.body.stack, 'string');
    assert.equal(buildErrorPayload(boom, undefined).body.stack, undefined);
  });

  it('honours an explicit status on the error and falls back safely on non-errors', () => {
    const { status } = buildErrorPayload(Object.assign(new Error('nope'), { status: 418 }), 'production');
    assert.equal(status, 418);
    const { status: fallback, body } = buildErrorPayload('a string', 'production');
    assert.equal(fallback, 500);
    assert.equal(body.error, 'Internal Server Error');
  });
});

describe('W04 T4.2 — CORS resolution', () => {
  it('refuses a wildcard in production and allows it in development', () => {
    assert.throws(() => resolveCorsOrigin('*', 'production'), /wildcard/i);
    assert.equal(resolveCorsOrigin('*', 'development'), true);
  });

  it('denies cross-origin in production when unset, reflects it in development', () => {
    assert.equal(resolveCorsOrigin('', 'production'), false);
    assert.equal(resolveCorsOrigin(undefined, 'production'), false);
    assert.equal(resolveCorsOrigin('', 'development'), true);
  });

  it('returns the explicit origin list when configured', () => {
    assert.deepEqual(resolveCorsOrigin('https://a.example, https://b.example', 'production'), [
      'https://a.example',
      'https://b.example',
    ]);
  });
});

describe('W04 T4.6 — upload guard (MIME + magic bytes + size)', () => {
  const zipB64 = Buffer.from([0x50, 0x4b, 0x03, 0x04]).toString('base64');

  it('rejects a missing field with 400', () => {
    const d = validateUpload(undefined, 'application/vnd.ms-excel');
    assert.equal(d.ok, false);
    assert.equal(d.ok === false && d.status, 400);
  });

  it('rejects a disallowed declared MIME with 415 before reading bytes', () => {
    const d = validateUpload(zipB64, 'text/plain');
    assert.equal(d.ok === false && d.status, 415);
  });

  it('accepts a zip with an allowed MIME', () => {
    const d = validateUpload(
      zipB64,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    assert.equal(d.ok, true);
  });

  it('rejects an oversize base64 body with 413', () => {
    const huge = 'A'.repeat(MAX_UPLOAD_BASE64_CHARS + 4);
    const d = validateUpload(huge, 'application/vnd.ms-excel');
    assert.equal(d.ok === false && d.status, 413);
  });

  it('rejects a non-zip payload with 400 (magic-byte mismatch)', () => {
    const d = validateUpload(Buffer.from('not a zip at all').toString('base64'), 'application/vnd.ms-excel');
    assert.equal(d.ok === false && d.status, 400);
  });
});

describe('W04 T4.2 — proxy guard (KERO-005, SSRF)', () => {
  it('blocks loopback and metadata addresses in production', () => {
    assert.throws(() => guardProxyUrl('http://localhost:8000', 'production'), /blocked/i);
    assert.throws(() => guardProxyUrl('http://169.254.169.254/latest', 'production'), /blocked/i);
  });

  it('allows loopback in development so the SlabDraw default works', () => {
    assert.equal(guardProxyUrl('http://localhost:8000', 'development'), 'http://localhost:8000');
  });

  it('refuses non-http(s) schemes and non-absolute URLs', () => {
    assert.throws(() => guardProxyUrl('ftp://evil.example', 'development'), /http\(s\)/i);
    assert.throws(() => guardProxyUrl('not a url', 'development'), /valid absolute URL/i);
  });
});
