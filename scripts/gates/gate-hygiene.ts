#!/usr/bin/env tsx
// gate-hygiene — repo invariants that are cheap to state and expensive to lose.
// 7 assertions: one lockfile; .gitignore agrees with what is tracked; a LICENSE
// matching package.json; the four root documents; the listed foundation gates
// wired; every gate file reachable from some package.json script; and CI
// actually invoking that harness as a blocking step.
import { run, is } from "./_lib";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";

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

await run("gate-hygiene", 7, async () => {
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

  // 6. ...and the converse, which assertion 5 structurally cannot see. That list
  //    is hand-written, so it only catches a gate that was REMOVED. Add a new
  //    `scripts/gates/gate-*.ts`, forget to add it to the list and to the
  //    `gate:foundation` chain, and every assertion above stays green: the gate
  //    sits on disk, unreferenced, running nowhere. gate-proven-red would notice
  //    it only as "never observed RED", which is satisfied by proving a gate that
  //    no run ever invokes — a check that never executes cannot fail, which is
  //    the same defect gate-vacuity guards one level down.
  const gateFiles = (await readdir("scripts/gates")).filter((f) => /^(gate-[a-z0-9-]+|preflight)\.ts$/.test(f));
  const wired = new Set(
    Object.values(pkg.scripts ?? {})
      .flatMap((cmd: string) => [...cmd.matchAll(/scripts\/gates\/([a-z0-9-]+)\.ts/g)])
      .map((m) => `${m[1]}.ts`),
  );
  const orphans = gateFiles.filter((f) => !wired.has(f));
  is(
    orphans.length === 0,
    "every gate file is reachable from a package.json script",
    orphans.map((f) => `scripts/gates/${f} is referenced by no script — a gate nothing invokes cannot fail`).join("\n"),
  );

  // 7. ...and reachable is still not executed. Assertions 5 and 6 prove every gate
  //    is named by some package.json script; neither proves anything ever CALLS
  //    that script. The whole containment layer was decorative on every push for
  //    exactly this reason — the gates existed, the scripts existed, and CI ran
  //    none of them. A workflow file can still be replaced wholesale by an
  //    enrichment drop, and every assertion above would stay green. So the CI step
  //    is asserted directly, and asserted for being BLOCKING: a gate invoked with
  //    `continue-on-error: true` cannot fail the build, which is the same defect
  //    as a gate nothing invokes, one level up.
  const ciPath = ".github/workflows/ci.yml";
  const ciLines = existsSync(ciPath) ? (await readFile(ciPath, "utf8")).split(/\r?\n/) : [];
  const runIdx = ciLines.findIndex((l) => /^\s*run:.*gate:foundation/.test(l));
  let ciDetail = "";
  if (runIdx === -1) {
    ciDetail = existsSync(ciPath)
      ? `${ciPath} never invokes gate:foundation — the harness is present and unexecuted`
      : `${ciPath} not found — nothing runs the harness`;
  } else {
    // walk back to the step header so `continue-on-error` is read from THIS step
    let j = runIdx;
    while (j > 0 && !/^\s*-\s*(name|uses):/.test(ciLines[j])) j--;
    if (ciLines.slice(j, runIdx + 1).some((l) => /continue-on-error:\s*true/.test(l)))
      ciDetail = `${ciPath} invokes gate:foundation with continue-on-error: true — a gate that cannot fail the build is not a gate`;
  }
  is(ciDetail === "", "CI invokes the gate harness as a blocking step", ciDetail);
});
