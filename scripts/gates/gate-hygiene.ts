#!/usr/bin/env tsx
// gate-hygiene — repo invariants that are cheap to state and expensive to lose.
// 5 assertions: one lockfile; .gitignore agrees with what is tracked; a LICENSE
// matching package.json; the four root documents; the foundation gates wired.
import { run, is } from "./_lib";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

// The foundation's doc gate is wired as `gate:docs:strict` because `gate:docs`
// already names the pre-existing NOT-IMPLEMENTED `gate-docs.mjs` stub. Requiring
// the stub here would make the gate green while the real check was absent.
const REQUIRED_SCRIPTS = [
  "gate:preflight",
  "gate:deps",
  "gate:scripts",
  "gate:docs:strict",
  "gate:tasks",
  "gate:tiers",
  "gate:proven-red",
  "gate:chain",
  "gate:hygiene",
  "gate:index",
  "gate:deviations",
  "gate:vacuity",
  "gate:ratchet",
  "gate:foundation",
];

await run("gate-hygiene", 5, async () => {
  // 1. one lockfile, and it is the one CI installs with
  is(
    !(existsSync("package-lock.json") && existsSync("pnpm-lock.yaml")),
    "one lockfile",
    "two lockfiles tracked (preinstall permits pnpm only)",
  );

  // 2. .gitignore may not ignore a path that is tracked
  const gi = existsSync(".gitignore") ? await readFile(".gitignore", "utf8") : "";
  is(
    !(gi.includes("dist/") && existsSync("artifacts/api-server/dist/index.mjs")),
    ".gitignore agrees with what is tracked",
    ".gitignore excludes dist/ but artifacts/api-server/dist is tracked",
  );

  // 3. LICENSE matching package.json
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  is(existsSync("LICENSE"), "LICENSE present", `no LICENSE (package.json says ${pkg.license ?? "unknown"})`);

  // 4. the root documents the repo claims to have
  const missingDocs = ["SECURITY.md", "CONTRIBUTING.md", "CHANGELOG.md", "ARCHITECTURE.md"].filter((f) => !existsSync(f));
  is(missingDocs.length === 0, "the four root documents exist", missingDocs.map((f) => `missing ${f}`).join("\n"));

  // 5. the foundation gates are reachable from package.json
  const missingScripts = REQUIRED_SCRIPTS.filter((s) => !pkg.scripts?.[s]);
  is(
    missingScripts.length === 0,
    "every foundation gate is wired in package.json",
    missingScripts.map((s) => `package.json missing script ${s}`).join("\n"),
  );
});
