#!/usr/bin/env tsx
// gate-readme — a generated document that nobody regenerates is just a
// hand-written document with extra steps.
// 1 assertion: regenerating the README module map changes nothing — or the
// README's absence is declared, owned and explained in containment/VACUITY.json.
//
// The gate never reads the README itself. It runs the generator in `--check`
// mode and reads the generator's exit code, for two reasons:
//
//   * README.md is a tier-4 (narrative) artefact. gate-tiers assertion 2 and
//     preflight P-14 both fail a gate that decides anything from tier-4 prose,
//     and this gate must not be the exception that makes the rule untrue.
//   * The check must not be able to write. The poison pill that proves this gate
//     RED corrupts the generator, so a poisoned run that could write would edit
//     the README on its way to failing.
//
// The documentation purge of 2026-11-19 removed README.md. A generator that has
// no document to write to cannot be verified, so — as with gate-docs and its
// doc root — the absence is declared in containment/VACUITY.json rather than
// left as a gate that fails on a file the repository chose to remove. The
// declaration is what keeps the failure meaningful: an UNDECLARED disappearance
// still fails here.
import { run, is, declaredEmpty } from "./_lib";
import { execFileSync } from "node:child_process";

await run("gate-readme", 1, async () => {
  const emp = await declaredEmpty();
  let problem = "";
  if (emp.hit("README.md")) {
    console.log("  advisory: README.md is declared absent in containment/VACUITY.json — there is no module map to verify");
  } else {
    let stale = "";
    try {
      execFileSync(process.execPath, ["--import", "tsx", "scripts/gen-readme-map.ts", "--check"], {
        stdio: "pipe",
      });
    } catch (e: unknown) {
      const out = (e as { stdout?: Buffer }).stdout?.toString().trim();
      stale = `README module map is stale — run: pnpm run gen:readme${out ? `\n  ${out}` : ""}`;
    }
    problem = stale;
  }
  is(
    problem === "" && emp.broken.length === 0,
    "the README module map is regenerated, or the README's absence is declared",
    [problem, ...emp.broken].filter(Boolean).join("\n"),
  );
});
