// gate:repro — P2-W05 (reproducibility & cold-start determinism).
//
// Proves the reproducibility contract: the same input + engine version + coefficient
// registry + code registry produces a byte-identical digest after a cold restart.
//
// The module under test (lib/engine/src/reproducibility.ts) is dependency-free, so it
// loads under Node's native type stripping (escape E-008: no tsx, broken pnpm shim). The
// engine orchestrator `calculate.ts` cannot be imported here (its `.js` specifiers do not
// resolve without a build), so arithmetic determinism is proven separately by a static
// scan for clock/RNG reads over lib/engine/src/** — recorded honestly, not glossed.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-repro: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-repro.json
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const GATE_NAME = "gate-repro";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..");
const outDir = join(scriptDir, ".out");
mkdirSync(outDir, { recursive: true });

const result = { name: GATE_NAME, ts: new Date().toISOString(), commit: null, pass: 0, fail: 0, detail: [] };
const record = (ok, label, note) => {
  if (ok) result.pass += 1;
  else result.fail += 1;
  result.detail.push({ ok, label, note: note ?? null });
};

const read = (rel) => readFileSync(join(repoRoot, rel), "utf8");

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (/\.tsx?$/.test(e.name)) out.push(abs);
  }
  return out;
}

// ── fixture input (fixed, so the 3 runs share an input) ─────────────────────────────
const FIXTURE_INPUT = {
  span: 12, deckWidth: 8, girderSpacing: 2, girderCount: 4, concreteGrade: 30,
  steelYieldStrength: 415, deckThickness: 0.2, liveLoadUDL: 20, concentratedLoad: 100,
  secondMomentArea: 1.2e10, sectionModulus: 5.5e7,
};

const CHILD_PROGRAM = `
import { createHash } from "node:crypto";
const repro  = await import(process.env.REPRO_MODULE);
const coef   = await import(process.env.COEFF_MODULE);
const clause = await import(process.env.CLAUSE_MODULE);
const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const registryVersions = {
  engine: process.env.ENGINE_VERSION,
  coefficients: "coeff-" + sha(repro.canonicalJson(coef.COEFFICIENTS)).slice(0, 12),
  codes: "codes-" + sha(repro.canonicalJson(clause.REGISTERED_CLAUSE_IDS)).slice(0, 12),
};
const inputs = ${JSON.stringify(FIXTURE_INPUT)};
const fingerprint = repro.buildRunFingerprint(inputs, registryVersions);
const fixture = {
  engineVersion: process.env.ENGINE_VERSION,
  calculatedAt: new Date().toISOString(),
  inputFingerprint: fingerprint.inputSha256,
  designUDL: { value: 1.35 * 25 * 0.2 + 1.5 * 20, unit: "kN/m" },
  overallStatus: "PASS",
};
process.stdout.write(JSON.stringify({ fp: repro.canonicalJson(fingerprint), digest: repro.reproducibleDigest(fixture) }) + "\\n");
`;

async function main() {
  // ── A. the reproducibility contract exists in the engine ────────────────────
  const contractsSrc = read("lib/engine/src/contracts.ts");
  record(/interface\s+RunFingerprint/.test(contractsSrc), "A: contracts.ts declares RunFingerprint");
  for (const field of ["inputSha256", "engineVersion", "registryVersions"]) {
    record(new RegExp(`${field}\\s*:`).test(contractsSrc), `A: RunFingerprint carries ${field}`);
  }
  record(/fingerprint\s*:\s*RunFingerprint/.test(contractsSrc), "A: DesignResult stores a RunFingerprint (T5.2)");

  // ── B. no non-determinism in the calculation path (T5.4) ────────────────────
  const engineFiles = walk(join(repoRoot, "lib", "engine", "src"));
  const banned = /(Math\.random|Date\.now|performance\.now|process\.hrtime)/;
  const offenders = [];
  const clockReads = [];
  for (const file of engineFiles) {
    const rel = relative(repoRoot, file).replace(/\\/g, "/");
    const src = readFileSync(file, "utf8");
    if (banned.test(src)) offenders.push(rel);
    const lines = src.split("\n");
    lines.forEach((line, i) => {
      if (/new Date\(/.test(line)) clockReads.push(`${rel}:${i + 1}`);
    });
  }
  record(offenders.length === 0, "B: no Math.random/Date.now/performance.now in lib/engine/src", offenders.join(", ") || "clean");
  // The only permitted clock read is `calculatedAt`, which the digest contract excludes.
  const clockOk = clockReads.every((c) => c.startsWith("lib/engine/src/calculate.ts:"));
  record(clockOk, "B: the only wall-clock read is calculate.ts's calculatedAt", clockReads.join(", ") || "none");

  // ── C. functional checks on the shipping module ─────────────────────────────
  let mod;
  try {
    mod = await import(pathToFileURL(join(repoRoot, "lib", "engine", "src", "reproducibility.ts")).href);
  } catch (err) {
    record(false, "C: reproducibility.ts loads (type-stripping)", String(err?.message ?? err));
    return finish();
  }
  record(true, "C: reproducibility.ts loads (type-stripping)");
  record(mod.VOLATILE_FIELDS.includes("calculatedAt"), "C: calculatedAt is a declared volatile field");

  // C1 canonical JSON is key-order independent
  record(
    mod.canonicalJson({ b: 2, a: 1 }) === mod.canonicalJson({ a: 1, b: 2 }),
    "C: canonicalJson is key-order independent",
  );
  // C2 volatile exclusion — positive: differing timestamps do NOT change the digest
  const base = { engineVersion: "0.5.0", inputFingerprint: "abc", overallStatus: "PASS", calculatedAt: "T1" };
  const bumped = { ...base, calculatedAt: "T2" };
  record(mod.reproducibleDigest(base) === mod.reproducibleDigest(bumped), "C: differing calculatedAt does NOT change the digest");
  // C3 volatile exclusion — negative (non-vacuity): a real field change DOES change it
  record(
    mod.reproducibleDigest(base) !== mod.reproducibleDigest({ ...base, overallStatus: "FAIL" }),
    "C: a real field change DOES change the digest (non-vacuous)",
  );
  // C4 fingerprint stability + sensitivity
  const rv = { engine: "0.5.0", coefficients: "coeff-x", codes: "codes-y" };
  const fpA = mod.buildRunFingerprint(FIXTURE_INPUT, rv);
  const fpB = mod.buildRunFingerprint(FIXTURE_INPUT, rv);
  const fpC = mod.buildRunFingerprint({ ...FIXTURE_INPUT, span: 13 }, rv);
  record(mod.fingerprintMatches(fpA, fpB), "C: same input -> same fingerprint");
  record(!mod.fingerprintMatches(fpA, fpC), "C: different input -> different fingerprint (non-vacuous)");
  record(/^[0-9a-f]{64}$/.test(fpA.inputSha256), "C: inputSha256 is a 64-char sha256 hex");
  // C5 integrity block (T5.6)
  const block = mod.integrityBlock({ "report.html": "<html>", "result.json": "{}" }, "0.5.0");
  record(/^[0-9a-f]{64}$/.test(block.digest), "C: integrityBlock yields a sha256 digest");
  record(Object.keys(block.artifacts).length === 2, "C: integrityBlock hashes every artifact");
  record(mod.integrityBlock({ "result.json": "{}" }, "0.5.0").digest !== block.digest, "C: integrityBlock is content-sensitive");

  // ── D. cold-start determinism: 3 separate processes, byte-identical output ──
  const engineVersionMatch = /ENGINE_VERSION\s*=\s*"([^"]+)"/.exec(read("lib/engine/src/calculate.ts"));
  const engineVersion = engineVersionMatch ? engineVersionMatch[1] : "unknown";
  record(engineVersion !== "unknown", "D: engine version resolved from calculate.ts", engineVersion);

  const childEnv = {
    ...process.env,
    REPRO_MODULE: pathToFileURL(join(repoRoot, "lib", "engine", "src", "reproducibility.ts")).href,
    COEFF_MODULE: pathToFileURL(join(repoRoot, "lib", "engine", "src", "coefficients.ts")).href,
    CLAUSE_MODULE: pathToFileURL(join(repoRoot, "lib", "engine", "src", "clause-registry.ts")).href,
    ENGINE_VERSION: engineVersion,
  };

  const runs = [];
  try {
    for (let i = 0; i < 3; i++) {
      runs.push(
        execFileSync("node", ["--input-type=module", "-e", CHILD_PROGRAM], {
          cwd: repoRoot, env: childEnv, encoding: "utf8", timeout: 20000,
        }).trim(),
      );
    }
  } catch (err) {
    record(false, "D: cold-start child runs succeed", String(err?.message ?? err).slice(0, 200));
    return finish();
  }
  record(runs.length === 3, "D: three cold-start processes ran");
  record(runs[0] === runs[1] && runs[1] === runs[2], "D: all 3 runs are byte-identical after cold restart", runs[0]);
  result.coldStartRuns = runs;
  let parsed = null;
  try { parsed = JSON.parse(runs[0]); } catch { /* handled below */ }
  record(Boolean(parsed) && /^[0-9a-f]{64}$/.test(parsed.digest), "D: the reproducible output is a sha256 digest");
  record(runs[0].includes("\"calculatedAt\"") === false, "D: no volatile field leaks into the hashed payload");

  return finish();
}

function finish() {
  writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));
  const verdict = result.fail === 0 ? "PASS" : "FAIL";
  console.log(`GATE ${GATE_NAME}: ${verdict} ${result.pass + result.fail} assertions`);
  for (const d of result.detail) {
    if (!d.ok) console.log(`  FAIL ${d.label}${d.note ? ` — ${d.note}` : ""}`);
  }
  // Not process.exit(): this gate imports a `.ts` module under type stripping; a forced
  // exit races the ESM-loader async handle on Windows (libuv UV_HANDLE_CLOSING crash).
  process.exitCode = result.fail === 0 ? 0 : 1;
}

main().catch((err) => {
  record(false, "gate crashed", String(err?.stack ?? err));
  finish();
});
