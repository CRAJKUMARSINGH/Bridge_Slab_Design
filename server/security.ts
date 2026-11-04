/**
 * Security primitives for the API surface (P2-W04).
 *
 * This module is deliberately dependency-free: it imports nothing, so the
 * `gate:security` gate and the `tests/integration/security-hardening.test.ts` lane
 * can load it under Node's native type-stripping without an installed Express/exceljs
 * tree. `server/app-factory.ts` and `server/api-routes.ts` consume it so the shipping
 * behaviour and the tested behaviour are the same code, not two copies.
 *
 * Owning week: W04 (security hardening). See docs/phase-2/week-04/SECURITY-HARDENING.md.
 */

/** Response-header allowlist applied to every response. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  // Never let a browser MIME-sniff a response into something executable.
  'X-Content-Type-Options': 'nosniff',
  // The API is never meant to be framed.
  'X-Frame-Options': 'DENY',
  // Modern guidance (OWASP): disable the legacy XSS auditor rather than trust it.
  // The header is still sent because some scanners require its presence.
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

/** The minimum a response object must expose for {@link applySecurityHeaders}. */
export interface HeaderSink {
  setHeader(name: string, value: string): unknown;
}

/** Write every header in {@link SECURITY_HEADERS} onto a response-like object. */
export function applySecurityHeaders(res: HeaderSink): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
}

/**
 * Express middleware form. The parameter types are intentionally loose so this file
 * stays free of any `express` import (see the module note).
 */
export function securityHeaders() {
  return (_req: unknown, res: HeaderSink, next: () => void): void => {
    applySecurityHeaders(res);
    next();
  };
}

/** Split a comma-separated origin list, trimming blanks. */
export function parseAllowedOrigins(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Decide the value handed to the `cors` package.
 *
 * - a wildcard (`*`) is **refused in production** (throws, so the process fails to
 *   start rather than silently allowing every origin);
 * - in development a wildcard is allowed explicitly;
 * - in production an empty allowlist denies all cross-origin requests;
 * - in development an empty allowlist reflects any origin (the previous default
 *   silently broke local cross-origin development — audit KERO-003).
 */
export function resolveCorsOrigin(
  raw: string | undefined | null,
  nodeEnv: string | undefined | null,
): string[] | true | false {
  const origins = parseAllowedOrigins(raw);
  const isProduction = nodeEnv === 'production';

  if (origins.includes('*')) {
    if (isProduction) {
      throw new Error(
        "ALLOWED_ORIGINS must not contain '*' in production: a wildcard CORS origin " +
          'is forbidden. List the explicit origins instead.',
      );
    }
    return true;
  }
  if (origins.length > 0) return origins;
  return isProduction ? false : true;
}

/** True only in development — the one environment allowed to echo stack traces. */
export function shouldIncludeStack(nodeEnv: string | undefined | null): boolean {
  return nodeEnv === 'development';
}

export interface ErrorPayload {
  status: number;
  body: { success: false; error: string; stack?: string };
}

/**
 * Turn a thrown value into the response an error handler should send. The stack is
 * attached **only** when {@link shouldIncludeStack} says so, which is the whole point
 * of the extraction: a regression that leaks a stack in production fails a unit test
 * rather than shipping.
 */
export function buildErrorPayload(err: unknown, nodeEnv: string | undefined | null): ErrorPayload {
  const cause =
    err && typeof err === 'object'
      ? (err as { status?: number; statusCode?: number; message?: string; stack?: string })
      : {};
  const status = cause.status ?? cause.statusCode ?? 500;
  const message = cause.message ?? 'Internal Server Error';

  const body: ErrorPayload['body'] = { success: false, error: message };
  if (shouldIncludeStack(nodeEnv) && typeof cause.stack === 'string') {
    body.stack = cause.stack;
  }
  return { status, body };
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload guard (T4.6): MIME allowlist + magic-byte check + size cap
// ─────────────────────────────────────────────────────────────────────────────

/** 10 MB decoded ceiling for an uploaded workbook. */
export const MAX_UPLOAD_XLSX_BYTES = 10 * 1024 * 1024;

/** base64 inflates by 4/3; allow a small padding margin before decoding. */
export const MAX_UPLOAD_BASE64_CHARS = Math.ceil((MAX_UPLOAD_XLSX_BYTES * 4) / 3) + 16;

/**
 * MIME types the upload endpoint accepts. Previously **no** allowlist existed — a
 * payload was accepted purely because its magic bytes looked like a zip. The declared
 * type is now checked first, then the bytes must still prove themselves.
 */
export const UPLOAD_MIME_ALLOWLIST: readonly string[] = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/octet-stream',
];

/** Is `mime` (ignoring any `;charset=` parameter) on the allowlist? */
export function isAllowedUploadMime(mime: string | undefined | null): boolean {
  if (!mime) return false;
  const bare = mime.split(';')[0].trim().toLowerCase();
  return UPLOAD_MIME_ALLOWLIST.includes(bare);
}

/** ZIP local-file / central-directory signatures; an OOXML `.xlsx` is a zip. */
export function isLikelyXlsxZip(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08))
  );
}

export type UploadDecision =
  | { ok: true; buffer: Buffer }
  | { ok: false; status: number; error: string };

/**
 * Validate a base64 workbook upload. Enforces, in order: presence, declared-MIME
 * allowlist, base64-length ceiling, decodability, and the magic-byte container check.
 * Returns a discriminated result rather than throwing so the route can map it to a
 * status code directly.
 */
export function validateUpload(
  fileBase64: unknown,
  declaredMime: string | undefined | null,
): UploadDecision {
  if (!fileBase64 || typeof fileBase64 !== 'string') {
    return { ok: false, status: 400, error: 'No file provided (expected base64 in body.file)' };
  }
  if (!isAllowedUploadMime(declaredMime)) {
    return {
      ok: false,
      status: 415,
      error:
        'Unsupported media type. Allowed: ' +
        UPLOAD_MIME_ALLOWLIST.join(', ') +
        ' (received ' +
        (declaredMime ?? 'none') +
        ').',
    };
  }
  if (fileBase64.length > MAX_UPLOAD_BASE64_CHARS) {
    return {
      ok: false,
      status: 413,
      error: `File too large (max ${MAX_UPLOAD_XLSX_BYTES} bytes)`,
    };
  }
  const buffer = Buffer.from(fileBase64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_XLSX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `File too large or empty (max ${MAX_UPLOAD_XLSX_BYTES} bytes)`,
    };
  }
  if (!isLikelyXlsxZip(buffer)) {
    return { ok: false, status: 400, error: 'Invalid XLSX file payload' };
  }
  return { ok: true, buffer };
}

// ─────────────────────────────────────────────────────────────────────────────
// Proxy guard (audit KERO-005, SSRF): an outbound URL must stay sane
// ─────────────────────────────────────────────────────────────────────────────

/** Hosts that must never be reachable through a server-side proxy in production. */
const BLOCKED_PROXY_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS/GCP instance-metadata service
  'metadata.google.internal',
]);

/**
 * Validate a server-side proxy target. In production the URL must be http(s) and must
 * not point at loopback or the cloud instance-metadata endpoint; otherwise a
 * misconfigured (or attacker-influenced) `SLABDRAW_URL` becomes an SSRF gadget.
 */
export function guardProxyUrl(rawUrl: string, nodeEnv: string | undefined | null): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Proxy target is not a valid absolute URL: ${rawUrl}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Proxy target must be http(s), received ${parsed.protocol}`);
  }
  if (nodeEnv === 'production' && BLOCKED_PROXY_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Proxy target host ${parsed.hostname} is blocked in production (loopback / metadata address).`,
    );
  }
  return parsed.toString().replace(/\/$/, '');
}
