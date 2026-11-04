/**
 * Dependency audit policy gate.
 *
 * Fails on any critical advisory, on any high advisory that is not explicitly accepted
 * below, and on a tooling-only dependency imported from a shipped lane. Every accepted
 * entry carries a reason, an owner and a review date, so the exemption has to be
 * re-justified instead of rotting into a permanent silence.
 *
 * Run: pnpm run audit:policy   (pnpm-first; npm audit is used only as a fallback)
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const FAIL_ON_CRITICAL = true;

/** High-severity advisories accepted with a documented reason. */
const ACCEPTED_HIGH = [
  {
    pkg: "fast-uri",
    reason: "Reaches the tree only through orval → @scalar/openapi-parser → ajv (OpenAPI codegen, build time).",
    control: "Codegen is run manually by the maintainer; generated artefacts are committed and CI never re-runs orval.",
    owner: "RAJKUMAR SINGH CHAUHAN",
    reviewBy: "2027-01-31",
  },
  {
    pkg: "brace-expansion",
    reason: "Transitive via minimatch (typedoc docs build) and via exceljs → archiver → glob (workbook zip packaging).",
    control: "Patterns are compiled from fixed paths in this repo, never from uploaded file names or user input.",
    owner: "RAJKUMAR SINGH CHAUHAN",
    reviewBy: "2027-01-31",
  },
  {
    pkg: "js-yaml",
    reason: "Transitive via orval (OpenAPI parsing) only; the app does not parse YAML from untrusted sources.",
    control: "The single YAML endpoint serves the repo's own committed spec.",
    owner: "RAJKUMAR SINGH CHAUHAN",
    reviewBy: "2027-01-31",
  },
  {
    pkg: "nanoid",
    reason: "Transitive via vite → postcss (dev server / CSS toolchain).",
    control: "Production builds use the committed bundle; nanoid ids here are non-security labels.",
    owner: "RAJKUMAR SINGH CHAUHAN",
    reviewBy: "2027-01-31",
  },
  {
    pkg: "braces",
    reason: "Transitive via fast-glob in the mockup-sandbox dev server.",
    control: "mockup-sandbox is a local design preview and is not deployed.",
    owner: "RAJKUMAR SINGH CHAUHAN",
    reviewBy: "2027-01-31",
  },
  {
    pkg: "xlsx",
    reason:
      "Legacy BIFF .xls ingestion: SheetJS is the only reader in this tree that opens the .xls files under " +
      "Attached_Assets (ExcelJS cannot). npm releases stop at 0.18.5, so the prototype-pollution and ReDoS " +
      "highs have no patched npm version to move to.",
    control:
      "Declared in root devDependencies and imported only from scripts/** — the IMPORT_RULES source scan " +
      "below fails the gate if server/, client/src/, bridge-excel-generator/, pipeline/, lib/, artifacts/, " +
      "api/ or shared/ ever import it. All shipped workbook generation and .xlsx reading uses ExcelJS.",
    owner: "RAJKUMAR SINGH CHAUHAN",
    reviewBy: "2027-01-31",
  },
];

/** Dependency import rules enforced from source, not from the audit tree. */
const IMPORT_RULES = [
  {
    // Legacy BIFF .xls ingestion (read-office-workbook.ts, assimilate-sheet-by-sheet.ts) is
    // the one thing that can open the corpus, so the package stays — in dev tooling only.
    // Its npm releases stop at 0.18.5, so the prototype-pollution and ReDoS highs below can
    // never be patched here; what this repo controls is where it may be imported from.
    pkg: "xlsx",
    allowedDirs: ["scripts"],
    scannedDirs: [
      "server",
      "client/src",
      "bridge-excel-generator",
      "pipeline",
      "lib",
      "artifacts",
      "api",
      "shared",
    ],
  },
];

const acceptedHighNames = new Set(ACCEPTED_HIGH.map((e) => e.pkg));

function walkFiles(dir, out, depth = 0) {
  if (depth > 8) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // directory absent on this checkout
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, out, depth + 1);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

/** Names any file under a scanned root that imports a package reserved for tooling. */
function findForbiddenImports(repoRoot) {
  const offenders = [];
  for (const rule of IMPORT_RULES) {
    const pattern = new RegExp(`from ["']${rule.pkg}["']|require\\(["']${rule.pkg}["']\\)`);
    const allowed = new Set(rule.allowedDirs);
    for (const root of rule.scannedDirs) {
      if (allowed.has(root)) continue;
      for (const file of walkFiles(join(repoRoot, root), [])) {
        const rel = relative(repoRoot, file).replace(/\\/g, "/");
        if (rel.split("/").some((part) => allowed.has(part))) continue;
        if (pattern.test(readFileSync(file, "utf8"))) offenders.push(`${rel} imports ${rule.pkg}`);
      }
    }
  }
  return offenders;
}

function runCommand(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // npm and pnpm both exit non-zero when advisories exist but still print the report.
    const stdout = error?.stdout?.toString?.() ?? "";
    if (!stdout) return null;
    return stdout;
  }
}

function runAudit() {
  const pnpmOut = runCommand("pnpm audit --json");
  if (pnpmOut) {
    try {
      return { tool: "pnpm", report: JSON.parse(pnpmOut) };
    } catch {
      /* fall through to npm */
    }
  }
  const npmOut = runCommand("npm audit --json");
  if (!npmOut) throw new Error("Could not run `pnpm audit --json` or `npm audit --json`; check registry access.");
  return { tool: "npm", report: JSON.parse(npmOut) };
}

/** Package names carrying a given severity, from either report shape. */
function packagesWithSeverity(report, severity) {
  const names = new Set();
  for (const advisory of Object.values(report.advisories ?? {})) {
    if (advisory?.severity === severity && advisory.module_name) names.add(advisory.module_name);
  }
  for (const [pkg, info] of Object.entries(report.vulnerabilities ?? {})) {
    const list = Array.isArray(info?.vulnerabilities) ? info.vulnerabilities : [info];
    if (list.some((v) => v?.severity === severity)) names.add(pkg);
  }
  return [...names].sort();
}

function main() {
  const { tool, report } = runAudit();
  const meta = report.metadata?.vulnerabilities ?? {};
  const critical = Number(meta.critical ?? 0);
  const high = Number(meta.high ?? 0);

  const highPackages = packagesWithSeverity(report, "high");
  const disallowedHighPackages = highPackages.filter((pkg) => !acceptedHighNames.has(pkg));
  const importOffenders = findForbiddenImports(join(import.meta.dirname, ".."));

  const today = new Date().toISOString().slice(0, 10);
  const expired = ACCEPTED_HIGH.filter((e) => e.reviewBy < today);

  if (FAIL_ON_CRITICAL && critical > 0) {
    throw new Error(`Audit policy failed (${tool}): critical vulnerabilities = ${critical}`);
  }
  if (importOffenders.length > 0) {
    throw new Error(
      `Audit policy failed: tooling-only dependency imported by shipped code:\n  ${importOffenders.join("\n  ")}`,
    );
  }
  if (disallowedHighPackages.length > 0) {
    throw new Error(
      `Audit policy failed (${tool}): unaccepted high vulnerabilities in [${disallowedHighPackages.join(", ")}]`,
    );
  }
  if (expired.length > 0) {
    throw new Error(
      `Audit policy failed: accepted-high exemptions past review date (${today}): ${expired
        .map((e) => `${e.pkg} (${e.reviewBy})`)
        .join(", ")}`,
    );
  }

  console.log(
    `Audit policy OK (${tool}): critical=${critical}, high=${high}, ` +
      `accepted-high=[${[...acceptedHighNames].sort().join(", ")}], next review=${[...new Set(ACCEPTED_HIGH.map((e) => e.reviewBy))].sort().join(", ")}, ` +
      `import scan=${IMPORT_RULES.map((r) => r.pkg).join(", ")} confined to [${[...new Set(IMPORT_RULES.flatMap((r) => r.allowedDirs))].join(", ")}]`,
  );
}

main();
