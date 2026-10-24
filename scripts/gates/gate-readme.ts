#!/usr/bin/env tsx
// gate-readme — a generated document that nobody regenerates is just a
// hand-written document with extra steps.
// 1 assertion: regenerating the README module map changes nothing.
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
import { run, is } from "./_lib";
import { execFileSync } from "node:child_process";

await run("gate-readme", 1, async () => {
  let stale = "";
  try {
    execFileSync(process.execPath, ["--import", "tsx", "scripts/gen-readme-map.ts", "--check"], {
      stdio: "pipe",
    });
  } catch (e: unknown) {
    const out = (e as { stdout?: Buffer }).stdout?.toString().trim();
    stale = `README module map is stale — run: pnpm run gen:readme${out ? `\n  ${out}` : ""}`;
  }
  is(stale === "", "regenerating the README module map changes nothing", stale);
});
