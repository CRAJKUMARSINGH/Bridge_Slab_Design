// gate:full — runs every gate in CI order and aggregates results.
// FAILs if any sub-gate FAILs. FAILs if any sub-gate is NOT IMPLEMENTED (exit 2).
// This is the MASTER GATE. If it passes, the project is verified; if it fails,
// the failure detail names exactly which gate broke and why.
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-full: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-full.json
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const GATE_NAME = "gate-full";
const dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(dir, ".out");
mkdirSync(outDir, { recursive: true });

// CI order — each gate runs after its prerequisites
const GATES_IN_ORDER = [
  "gate-docs",
  "gate-oracle",
  "gate-parity",
  "verify-clauses",
  "gate-security",
  "gate:repro",  // note: file name is gate-repro
  "gate-perf",
  "verify-dxf",
  "verify-rates",
  "gate-boq",
  "verify-report",
  "gate-a11y",
  "scan-secrets",
  // audit:policy runs separately in CI (existing script, not a gate stub)
];

const pass = [];
const fail = [];

for (const gateName of GATES_IN_ORDER) {
  const file = join(dir, `${gateName}.mjs`);
  if (!existsSync(file)) {
    fail.push({ gate: gateName, error: "script not found" });
    continue;
  }

  let stdout = "";
  let exitCode = null;
  try {
    stdout = execFileSync("node", [file], {
      cwd: dir,
      timeout: 120000,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });
    exitCode = 0;
  } catch (err) {
    exitCode = err.status ?? -1;
    stdout = err.stdout ?? "";
  }

  // Read the gate's JSON output for structured detail
  const jsonPath = join(outDir, `${gateName}.json`);
  let gateResult = null;
  try {
    gateResult = JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch { /* gate may not have written JSON */ }

  if (exitCode === 0) {
    pass.push({ gate: gateName, exitCode, assertions: gateResult?.pass + gateResult?.fail ?? 0 });
  } else if (exitCode === 2) {
    // NOT IMPLEMENTED is a FAILURE for gate:full — the project is not verified
    fail.push({ gate: gateName, exitCode, error: "NOT IMPLEMENTED — gate is still a stub", detail: gateResult });
  } else {
    fail.push({ gate: gateName, exitCode, error: `gate exited with code ${exitCode}`, stdout: stdout.slice(-200), detail: gateResult });
  }
}

const result = {
  name: GATE_NAME,
  ts: new Date().toISOString(),
  commit: null,
  pass: pass.length,
  fail: fail.length,
  detail: [
    ...pass.map(p => ({ ...p, verdict: "PASS" })),
    ...fail.map(f => ({ ...f, verdict: "FAIL" })),
  ],
};
writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));

const verdict = fail.length === 0 ? "PASS" : "FAIL";
console.log(`GATE ${GATE_NAME}: ${verdict} ${pass.length + fail.length} assertions`);
if (fail.length > 0) {
  console.log("  FAILED gates:");
  for (const f of fail) {
    console.log(`    - ${f.gate}: ${f.error}`);
  }
}
process.exit(fail.length === 0 ? 0 : 1);
