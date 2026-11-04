// gate:all-stubs — verifies every gate script exists and exits deterministically
// This is the FOUNDATION CHECK. If this gate is broken, nothing below it can be trusted.
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-all-stubs: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-all-stubs.json
import { writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const GATE_NAME = "gate-all-stubs";
const dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(dir, ".out");
mkdirSync(outDir, { recursive: true });

const EXPECTED_GATES = [
  "gate-docs", "gate-oracle", "gate-parity", "verify-clauses",
  "gate-security", "gate-repro", "gate-perf", "verify-dxf",
  "verify-rates", "gate-boq", "verify-report", "gate-a11y",
  "gate-full", "scan-secrets",
  // gate-all-stubs does not check itself
];

const pass = [];
const fail = [];

for (const name of EXPECTED_GATES) {
  const file = join(dir, `${name}.mjs`);
  // Assertion 1: file exists
  if (!existsSync(file)) {
    fail.push({ gate: name, check: "exists", error: "file not found" });
    continue;
  }
  // Assertion 2: file is non-trivial (>200 bytes — not an empty placeholder)
  const size = statSync(file).size;
  if (size < 200) {
    fail.push({ gate: name, check: "size", error: `file is ${size} bytes, expected >200` });
    continue;
  }
  // Assertion 3: exits deterministically (not hanging, not crashing with unhandled error)
  try {
    execFileSync("node", [file], {
      cwd: dir,
      timeout: 10000,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });
    // Exit 0 is unexpected for stubs but valid for implemented gates
    pass.push({ gate: name, check: "deterministic-exit", exitCode: 0 });
  } catch (err) {
    const code = err.status ?? null;
    if (code === 0 || code === 1 || code === 2) {
      // 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED — all deterministic
      pass.push({ gate: name, check: "deterministic-exit", exitCode: code });
    } else {
      fail.push({ gate: name, check: "deterministic-exit", error: `exit code ${code}: ${err.message?.slice(0, 100)}` });
    }
  }
}

// Assertion 4: .out JSON files are produced
let outCount = 0;
try {
  outCount = readdirSync(outDir).filter(f => f.endsWith(".json")).length;
} catch { /* .out may not exist yet */ }
if (outCount >= EXPECTED_GATES.length) {
  pass.push({ check: "json-output-count", count: outCount });
} else {
  fail.push({ check: "json-output-count", expected: EXPECTED_GATES.length, actual: outCount });
}

const result = {
  name: GATE_NAME,
  ts: new Date().toISOString(),
  commit: null,
  pass: pass.length,
  fail: fail.length,
  detail: [...pass.map(p => ({ ...p, verdict: "PASS" })), ...fail.map(f => ({ ...f, verdict: "FAIL" }))],
};
writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));

const verdict = fail.length === 0 ? "PASS" : "FAIL";
console.log(`GATE ${GATE_NAME}: ${verdict} ${pass.length + fail.length} assertions`);
process.exit(fail.length === 0 ? 0 : 1);
