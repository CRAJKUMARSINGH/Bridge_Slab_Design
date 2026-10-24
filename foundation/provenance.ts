/**
 * F4 — Provenance guard.
 * The #1 silent-pass mechanism in this repo: every module exports a DEFAULT_* object
 * that is a real Som River bridge. Omit a field, get a plausible number, never an error.
 */
export type Sourced<T> = { value: T; provenance: 'provided' | 'default'; from: string };

export function req<T>(name: string, v: T | undefined | null): Sourced<T> {
  if (v === undefined || v === null) throw new Error(`[provenance] REQUIRED input missing: ${name}`);
  if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`[provenance] not finite: ${name} = ${v}`);
  if (typeof v === 'string' && v.trim() === '') throw new Error(`[provenance] blank: ${name}`);
  return { value: v, provenance: 'provided', from: name };
}

export function opt<T>(name: string, v: T | undefined | null, fallback: T): Sourced<T> {
  return v === undefined || v === null
    ? { value: fallback, provenance: 'default', from: `${name} ← built-in default` }
    : { value: v, provenance: 'provided', from: name };
}

/** Names every input that was silently filled by a default. Surface this in the report. */
export function silentlyDefaulted(parts: Record<string, Sourced<unknown>>): string[] {
  return Object.entries(parts)
    .filter(([, s]) => s.provenance === 'default')
    .map(([k, s]) => `${k} (${s.from})`);
}
