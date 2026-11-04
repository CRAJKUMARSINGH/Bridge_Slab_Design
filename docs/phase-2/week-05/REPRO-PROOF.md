# P2-W05 — REPRODUCIBILITY PROOF

Week: W05 —Reproducibility & cold-start determinism | Agent: Devin | Verifier: Kiro (pending)
Gate: `gate:repro` (`package.json` → `node scripts/gates/gate-repro.mjs`).

## The contract

> A run reproduces **iff** `inputSha256` **AND** `engineVersion` **AND** the coefficient
> registry version **AND** the code registry version all match.

Implemented in [`lib/engine/src/reproducibility.ts`](../../../lib/engine/src/reproducibility.ts)
(T5.1), a dependency-free module (only `node:crypto` plus erased type-only imports) so it
loads under Node's native type stripping with no build — the same escape-tolerant posture
as `server/security.ts`. The type contract lives in
[`contracts.ts`](../../../lib/engine/src/contracts.ts#L43-L47) (`RunFingerprint`) and is
stored on `DesignResult.fingerprint` (T5.2).

## Method

1. **Input** — one fixed `BridgeInputs` fixture (`span 12 m`, `deckThickness 0.2 m`,
   `liveLoadUDL 20 kN/m`, …), identical across runs.
2. **Registry versions** — derived from the real registries, not hand-written:
   - `engine` = `ENGINE_VERSION` read from `calculate.ts` (`"0.5.0"`);
   - `coefficients` = `coeff-` + first 12 hex of `sha256(canonicalJson(COEFFICIENTS))`;
   - `codes` = `codes-` + first 12 hex of `sha256(canonicalJson(REGISTERED_CLAUSE_IDS))`.
3. **Digest** — `reproducibleDigest(result)` = `sha256(canonicalJson(stripVolatile(result)))`.
   `stripVolatile` removes wall-clock/run-id keys (`calculatedAt`, `producedAt`, `runId`, …)
   so **file timestamps and ordering cannot affect the hash** (T5.4).
4. **Cold start** — the gate spawns **three separate `node` processes**. Each imports the
   module fresh, recomputes the fingerprint and the digest, and prints one JSON line. The
   gate compares the three lines **byte-for-byte**.

## The 3-run comparison

Raw output of the three cold-start processes (`scripts/gates/.out/gate-repro.json` →
`coldStartRuns`), unescaped:

| Field | Run 1 | Run 2 | Run 3 |
| --- | --- | --- | --- |
| `inputSha256` | `e639058da28678bed106c4f8eacdff0dd9768c08e39133c2aa14149cb4960b50` | *(identical)* | *(identical)* |
| `coefficients` registry | `coeff-bb71b204f310` | *(identical)* | *(identical)* |
| `codes` registry | `codes-4b9a4227c2e1` | *(identical)* | *(identical)* |
| `engine` version | `0.5.0` | *(identical)* | *(identical)* |
| **reproducible digest** | `3babbb49aa6b034403390b31f89a6f16546dd933170851124bcc6f3fbb6d7f86` | **same** | **same** |

The three stdout lines are byte-identical. A per-run `calculatedAt` (fresh
`new Date().toISOString()` inside each process) was present in the hashed object and did
**not** change the digest — proving the volatile exclusion is effective, not accidental.

```
$ node scripts/gates/gate-repro.mjs
GATE gate-repro: PASS 23 assertions
EXIT=0
```

## Non-determinism audit (T5.4)

`gate:repro` group B walks `lib/engine/src/**` and asserts:

- **no** `Math.random` / `Date.now` / `performance.now` / `process.hrtime` anywhere — clean;
- the **only** wall-clock read is `calculatedAt: new Date().toISOString()` in
  [`calculate.ts:42`](../../../lib/engine/src/calculate.ts#L42), and that key is in the
  volatile-exclusion set, so it never enters a reproducibility hash.

## Export integrity block (T5.6)

`integrityBlock(artifacts, engineVersion)` returns a `sha256` for every named artifact
(HTML, PDF, each figure, input JSON, result JSON) plus the engine version, and a single
digest over the block. Asserted content-sensitive and engine-version-sensitive in the lane
`tests/integration/reproducibility.test.ts` (15/15), and in `gate:repro` group C.

## DB-backed reproduction (T5.7)

Round-trip only: `fingerprintMatches(fp, JSON.parse(JSON.stringify(fp)))` holds, so a
fingerprint persisted in a DB record reloads to the same values. A live DB write/read is
**not** exercised here (no DB in this worktree, escape E-008) — see limitations.

## Limitations (honest)

- **The engine orchestrator is not executed by this proof.** `calculate.ts` and
  `functions/*.ts` use `.js` import specifiers that do not resolve without a build, so
  under E-008 they cannot be imported from a plain-Node gate. The cold-start proof
  therefore exercises the **fingerprint + canonical-digest machinery** and the **real
  coefficient/registry data**; the **arithmetic** is shown deterministic *statically*
  (no clock/RNG reads) rather than by executing `calculate()`. When the build lane
  returns, the orchestrator should be added to the 3-run comparison.
- **Live DB reproduction is structural only.** T5.7 is proven at the serialisation
  round-trip level, not against a running database.
- All W05 artefacts are **DRAFT** pending licensed-engineer sign-off.
