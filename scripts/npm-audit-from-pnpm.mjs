/**
 * npm-audit-from-pnpm.mjs
 *
 * Runs a real `npm audit` against this pnpm workspace by:
 *   1. Extracting every resolved package@version from pnpm-lock.yaml
 *   2. Writing a temporary package.json + package-lock.json (v2 format)
 *      that npm audit can consume — no catalog: references, no workspace
 *      protocol, just flat resolved package names and versions.
 *   3. Running `npm audit --json` in a temp dir and printing the result.
 *   4. Cleaning up the temp dir.
 *
 * Usage:  node scripts/npm-audit-from-pnpm.mjs [--json] [--summary]
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    json:    { type: "boolean", default: false },
    summary: { type: "boolean", default: false },
  },
});

// ── 1. Parse pnpm-lock.yaml with a minimal line-based extractor ─────────────
//
// We don't want to add a YAML parser dependency, so we extract the
// `resolution:` blocks ourselves. pnpm v9 lockfile lines look like:
//
//   /package@1.2.3:       (top-level key — the package id)
//     resolution: {integrity: sha512-...}
//
// We only need the package id line; versions are embedded in the key.

const lockfilePath = new URL("../pnpm-lock.yaml", import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, "$1"); // fix Windows /C:/... -> C:/...

const lockContent = readFileSync(lockfilePath, "utf8");

const packages = new Map(); // "name@version" -> { name, version }

// pnpm v9/v10 lockfiles indent package keys by exactly two spaces, both under
// the `packages:` section and the `snapshots:` section (which lists the same
// ids). Lines indented four or more spaces are properties, not keys.
const pkgLineRe = /^ {2}(?:'([^']+)'|"([^"]+)"|([^\s].*?)):$/;

for (const raw of lockContent.split("\n")) {
  const m = raw.trimEnd().match(pkgLineRe);
  if (!m) continue;
  const key = (m[1] ?? m[2] ?? m[3]).trim();
  // Drop peer-dependency suffixes, e.g. react-dom@19.2.0(react@19.2.0)
  const base = key.split("(")[0];
  if (base.startsWith("link:") || base.startsWith("file:") || base.includes(":")) continue;
  const at = base.lastIndexOf("@");
  if (at <= 0) continue; // importer keys like "." or "artifacts/foo" have no version
  const name = base.slice(0, at);
  const version = base.slice(at + 1);
  if (!/^\d/.test(version)) continue;
  packages.set(`${name}@${version}`, { name, version });
}

if (packages.size === 0) {
  console.error("Could not extract any packages from pnpm-lock.yaml.");
  process.exit(1);
}

// ── 2. Build a minimal package-lock.json (v2) ───────────────────────────────

const deps = {};
const lockPkgs = { "": { name: "audit-bridge", version: "0.0.0", dependencies: {} } };

for (const { name, version } of packages.values()) {
  const rootPath = `node_modules/${name}`;
  // A name can resolve to several versions in a pnpm tree; keep one at the root
  // slot and nest the rest so npm's arborist still sees (and audits) them.
  const path = lockPkgs[rootPath] ? `node_modules/.pnpm/${name}@${version}/node_modules/${name}` : rootPath;
  lockPkgs[path] = { version, resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz` };
  if (path === rootPath) {
    deps[name] = version;
    lockPkgs[""].dependencies[name] = version;
  }
}

const fakePkg = {
  name: "audit-bridge",
  version: "0.0.0",
  dependencies: deps,
};

const fakeLock = {
  name: "audit-bridge",
  version: "0.0.0",
  lockfileVersion: 2,
  requires: true,
  packages: lockPkgs,
};

// ── 3. Write to temp dir and run npm audit ───────────────────────────────────

const tmpDir = join(tmpdir(), `npm-audit-pnpm-${Date.now()}`);
mkdirSync(tmpDir, { recursive: true });

writeFileSync(join(tmpDir, "package.json"),      JSON.stringify(fakePkg,  null, 2));
writeFileSync(join(tmpDir, "package-lock.json"), JSON.stringify(fakeLock, null, 2));

let auditOutput = "";
let exitCode = 0;

try {
  auditOutput = execSync("npm audit --json", {
    cwd: tmpDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
} catch (err) {
  // npm audit exits non-zero when vulnerabilities exist; stdout still has the JSON
  auditOutput = err.stdout ?? "";
  exitCode = err.status ?? 1;
}

// ── 4. Clean up ──────────────────────────────────────────────────────────────

try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

// ── 5. Parse and display ─────────────────────────────────────────────────────

if (!auditOutput.trim()) {
  console.error("npm audit returned no output.");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(auditOutput);
} catch {
  console.error("Failed to parse npm audit JSON:", auditOutput.slice(0, 500));
  process.exit(1);
}

if (args.json) {
  console.log(auditOutput);
  process.exit(exitCode);
}

// Human-readable summary
const meta = report.metadata?.vulnerabilities ?? {};
const vulns = report.vulnerabilities ?? {};
const advisories = report.advisories ?? {};

const critical = meta.critical ?? 0;
const high     = meta.high     ?? 0;
const moderate = meta.moderate ?? 0;
const low      = meta.low      ?? 0;
const info     = meta.info     ?? 0;
const total    = critical + high + moderate + low + info;

console.log("╔══════════════════════════════════════════════════════╗");
console.log("║          npm audit (via pnpm-lock.yaml)              ║");
console.log("╠══════════════════════════════════════════════════════╣");
console.log(`║  Packages audited : ${String(packages.size).padStart(6)}                          ║`);
console.log(`║  Critical         : ${String(critical).padStart(6)}                          ║`);
console.log(`║  High             : ${String(high).padStart(6)}                          ║`);
console.log(`║  Moderate         : ${String(moderate).padStart(6)}                          ║`);
console.log(`║  Low              : ${String(low).padStart(6)}                          ║`);
console.log(`║  Info             : ${String(info).padStart(6)}                          ║`);
console.log(`║  Total            : ${String(total).padStart(6)}                          ║`);
console.log("╚══════════════════════════════════════════════════════╝");

if (total === 0) {
  console.log("\n✅  No vulnerabilities found.\n");
  process.exit(0);
}

if (args.summary) process.exit(exitCode);

// Detail view — works for both npm audit formats (v6 advisory / v7 vulnerabilities)
const rows = [];

// npm v7+ format
for (const [pkg, info] of Object.entries(vulns)) {
  const via = Array.isArray(info.via) ? info.via : [];
  for (const v of via) {
    if (typeof v === "object" && v.severity) {
      rows.push({ severity: v.severity, pkg, title: v.title ?? "(no title)", url: v.url ?? "" });
    }
  }
}

// npm v6 format
for (const adv of Object.values(advisories)) {
  rows.push({ severity: adv.severity, pkg: adv.module_name, title: adv.title, url: adv.url ?? "" });
}

const order = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
rows.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

// Deduplicate
const seen = new Set();
for (const r of rows) {
  const key = `${r.severity}|${r.pkg}|${r.title}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const badge = r.severity.toUpperCase().padEnd(8);
  console.log(`\n[${badge}] ${r.pkg}`);
  console.log(`  ${r.title}`);
  if (r.url) console.log(`  ${r.url}`);
}

console.log(`\nRun with --json for full machine-readable output.\n`);
process.exit(exitCode);
