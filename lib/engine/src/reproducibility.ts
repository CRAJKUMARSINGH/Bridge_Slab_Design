/**
 * Reproducibility contract (P2-W05 T5.1 / T5.6).
 *
 * The reproducibility rule: a run reproduces byte-for-byte iff
 *   inputSha256 AND engineVersion AND coefficient registry version AND code registry
 *   version all match.
 *
 * This module is deliberately dependency-free — it imports only `node:crypto` plus
 * *type-only* imports (erased by Node's type stripping) — so it loads under Node's
 * native type stripping with no build, exactly like `server/security.ts`. That is what
 * lets `gate:repro` and the test lane exercise the shipping code rather than a copy of
 * it (escape **E-008**: this worktree has no `tsx` and a broken `pnpm` shim).
 *
 * The engine's orchestrator (`calculate.ts`) cannot be imported under E-008 — its
 * internal `.js` specifiers do not resolve without a build — so the *arithmetic*
 * determinism is proven separately, by a static scan for clock/RNG reads over
 * `lib/engine/src/**` (see `scripts/gates/gate-repro.mjs`). This module proves the
 * *fingerprint + digest* machinery is cold-start deterministic.
 */
import { createHash } from "node:crypto";
import type { RunFingerprint, EngineVersion } from "./contracts.js";
import type { BridgeInputs } from "./types.js";

/**
 * Fields that legitimately vary run-to-run (wall-clock timestamps, run ids). They are
 * excluded from the reproducible digest — T5.4: "file timestamps … must not affect
 * output hashes". `calculate.ts` writes `calculatedAt`, which is the one clock read in
 * the calculation path and the reason this list exists.
 */
export const VOLATILE_FIELDS: readonly string[] = [
  "calculatedAt",
  "producedAt",
  "generatedAt",
  "runId",
  "ts",
  "createdAt",
];

/** Lower-case sha256 hex of a UTF-8 string. */
export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Deterministic JSON — object keys sorted recursively, `undefined` dropped. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalise(value));
}

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] === undefined) continue;
      out[key] = canonicalise(source[key]);
    }
    return out;
  }
  return value;
}

/** Recursively drop volatile fields so a digest is stable across runs. */
export function stripVolatile(
  value: unknown,
  volatile: readonly string[] = VOLATILE_FIELDS,
): unknown {
  if (Array.isArray(value)) return value.map((v) => stripVolatile(v, volatile));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (volatile.includes(key)) continue;
      out[key] = stripVolatile(v, volatile);
    }
    return out;
  }
  return value;
}

/**
 * Byte-identical digest of a calculation result. Two results that differ only in
 * volatile fields hash the same; any difference in a real field changes the digest.
 */
export function reproducibleDigest(result: unknown): string {
  return sha256Hex(canonicalJson(stripVolatile(result)));
}

/**
 * Build the `RunFingerprint` for a run (T5.1). The caller supplies the registry
 * versions (engine / coefficients / codes) because only the harness knows how they are
 * derived in this repo.
 */
export function buildRunFingerprint(
  inputs: BridgeInputs,
  registryVersions: Record<string, string>,
): RunFingerprint {
  const engineVersion: EngineVersion = {
    engine: registryVersions.engine ?? "unknown",
    coefficients: registryVersions.coefficients ?? "unknown",
    codes: registryVersions.codes ?? "unknown",
  };
  return {
    inputSha256: sha256Hex(canonicalJson(inputs)),
    engineVersion,
    registryVersions,
  };
}

/** True iff two fingerprints are equivalent under canonical serialisation (T5.7). */
export function fingerprintMatches(a: RunFingerprint, b: RunFingerprint): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

/**
 * Integrity block for exports (T5.6): the sha256 of each named artifact plus the engine
 * version, and a single digest over the whole block. `artifacts` maps an artifact name
 * (`"report.html"`, `"result.json"`, `"figure-1.dxf"`, …) to its content.
 */
export function integrityBlock(
  artifacts: Record<string, string>,
  engineVersion: string,
): { engineVersion: string; artifacts: Record<string, string>; digest: string } {
  const hashed: Record<string, string> = {};
  for (const name of Object.keys(artifacts).sort()) hashed[name] = sha256Hex(artifacts[name]);
  return {
    engineVersion,
    artifacts: hashed,
    digest: sha256Hex(canonicalJson({ engineVersion, artifacts: hashed })),
  };
}
