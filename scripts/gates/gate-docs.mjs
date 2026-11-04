// gate:docs — asserts no unfilled {{...}} templates in week folders and
// every declared deliverable exists and is >200 bytes.
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-docs: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-docs.json
import { writeFileSync, mkdirSync, readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const GATE_NAME = "gate-docs";
const dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(dir, ".out");
mkdirSync(outDir, { recursive: true });

const repoRoot = join(dir, "..", "..");
const phase2Dir = join(repoRoot, "docs", "phase-2");

const pass = [];
const fail = [];

// Assertion 1: No unfilled {{PLACEHOLDER}} in any .md under docs/phase-2/week-*/
const weekDirs = readdirSync(phase2Dir, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name.startsWith("week-"))
  .map(e => join(phase2Dir, e.name));

let placeholderCount = 0;
for (const weekDir of weekDirs) {
  const files = readdirSync(weekDir).filter(f => f.endsWith(".md"));
  for (const file of files) {
    const content = readFileSync(join(weekDir, file), "utf-8");
    const matches = content.match(/\{\{[A-Z_][A-Z0-9_]*\}\}/g);
    if (matches) {
      placeholderCount += matches.length;
      fail.push({ file: `docs/phase-2/${weekDir.split("\\").pop()}/${file}`, check: "no-placeholders", placeholders: matches.slice(0, 5) });
    }
  }
}
if (placeholderCount === 0) {
  pass.push({ check: "no-unfilled-placeholders", weekDirs: weekDirs.length });
}

// Assertion 2: Every AGENT-INSTRUCTIONS.md exists and is >200 bytes
let instrCount = 0;
for (const weekDir of weekDirs) {
  const instrFile = join(weekDir, "AGENT-INSTRUCTIONS.md");
  if (existsSync(instrFile)) {
    const size = statSync(instrFile).size;
    if (size > 200) {
      instrCount++;
    } else {
      fail.push({ file: `docs/phase-2/${weekDir.split("\\").pop()}/AGENT-INSTRUCTIONS.md`, check: "size", size });
    }
  } else {
    fail.push({ file: `docs/phase-2/${weekDir.split("\\").pop()}/AGENT-INSTRUCTIONS.md`, check: "exists" });
  }
}
if (instrCount === weekDirs.length) {
  pass.push({ check: "all-instruction-files-present", count: instrCount });
}

// Assertion 3: Template kit exists with all 22 templates
const templateDir = join(phase2Dir, "_templates");
if (existsSync(templateDir)) {
  const templates = readdirSync(templateDir).filter(f => f.endsWith(".md"));
  if (templates.length >= 22) {
    pass.push({ check: "template-kit-complete", count: templates.length });
  } else {
    fail.push({ check: "template-kit-complete", expected: 22, actual: templates.length });
  }
} else {
  fail.push({ check: "template-kit-exists", error: "docs/phase-2/_templates/ not found" });
}

// Assertion 4: GOLDEN-ORACLE.json exists and is valid JSON
const oracleFile = join(repoRoot, "corpus", "oracle", "GOLDEN-ORACLE.json");
if (existsSync(oracleFile)) {
  try {
    const oracle = JSON.parse(readFileSync(oracleFile, "utf-8"));
    const bridges = Object.keys(oracle.bridges ?? {});
    if (bridges.length >= 3) {
      pass.push({ check: "golden-oracle-valid", bridges: bridges.length });
    } else {
      fail.push({ check: "golden-oracle-bridges", expected: 3, actual: bridges.length });
    }
  } catch (err) {
    fail.push({ check: "golden-oracle-parse", error: err.message.slice(0, 100) });
  }
} else {
  fail.push({ check: "golden-oracle-exists", error: "corpus/oracle/GOLDEN-ORACLE.json not found" });
}

// Assertion 5: contracts.ts exists and exports CheckResult
const contractsFile = join(repoRoot, "lib", "engine", "src", "contracts.ts");
if (existsSync(contractsFile)) {
  const content = readFileSync(contractsFile, "utf-8");
  if (content.includes("CheckResult") && content.includes("FormulaTrace")) {
    pass.push({ check: "contracts-ts-valid" });
  } else {
    fail.push({ check: "contracts-ts-exports", error: "missing CheckResult or FormulaTrace" });
  }
} else {
  fail.push({ check: "contracts-ts-exists", error: "lib/engine/src/contracts.ts not found" });
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
  console.log("  FAILED:");
  for (const f of fail) {
    console.log(`    - ${f.check}: ${f.error ?? JSON.stringify(f.placeholders ?? f.actual ?? "")}`);
  }
}
process.exit(fail.length === 0 ? 0 : 1);
