#!/usr/bin/env tsx
// gate-deps — the "assumed but not installed" class, closed.
// 4 assertions:
//   1. every bare import anywhere in the code lanes resolves to a declared
//      dependency, a workspace package, a builtin or a declared alias;
//   2. every entry in .deps-plan.json carries a well-formed owning week;
//   3. the allowlist may only shrink — a package that is now installed may not
//      still be allowlisted as absent;
//   4. an allowlist entry whose owning week has gone GREEN is a hard failure,
//      because the week that owed the install has already been signed off.
import { run, is, walk, json, read } from "./_lib";
import { existsSync } from "node:fs";
import { builtinModules } from "node:module";

const SCAN_DIRS = ["lib", "server", "client/src", "scripts", "shared", "api", "pipeline", "src", "artifacts", "bridge-excel-generator"];
// Path aliases are declared in tsconfig.base.json / tsconfig.client.json and
// mirrored in vite.config.ts: `@/*` -> client/src, `@shared/*` -> shared,
// `@assets/*` -> attached_assets, `@workspace/*` -> lib/*.
const ALIAS = new Set(["@", "@assets", "@client", "@drawing", "@engine", "@shared", "@trust", "@units", "@workspace"]);
const WEEK = /^W\d{2}[A-Z]?$/;

/** Package name of a bare specifier (`@scope/name`, or `.` / `/` for a relative path). */
function specifierName(spec: string): string {
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
}

/** Alias key: the first segment, so `@shared/foo` matches the `@shared` alias. */
const aliasKey = (spec: string): string => spec.split("/")[0];

await run("gate-deps", 4, async () => {
  const pkg = JSON.parse(await read("package.json"));
  const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  // `walk` prunes node_modules, scratch trees and the local pnpm store, so the
  // manifests below are the ones that actually declare what the tree imports.
  for (const manifest of await walk(".", /^package\.json$/)) {
    try {
      const p = JSON.parse(await read(manifest));
      for (const k of [
        ...Object.keys(p.dependencies ?? {}),
        ...Object.keys(p.devDependencies ?? {}),
        ...Object.keys(p.peerDependencies ?? {}),
      ])
        declared.add(k);
      if (p.name) declared.add(p.name);
    } catch {
      /* malformed manifest is gate-scripts' finding, not this one */
    }
  }

  const plan: Record<string, string> = existsSync(".deps-plan.json") ? await json<Record<string, string>>(".deps-plan.json") : {};
  const allow = Object.keys(plan).filter((k) => !k.startsWith("_"));
  const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);

  // 1. every bare import resolves
  // Only code is scanned. A bare specifier only exists in an import statement,
  // so reading `.json`/`.md` here can only produce false positives — the poison
  // pills declare their own replacement token inside scripts/gates/.pills.json,
  // and tier-4 prose must never be parsed by a gate at all.
  const CODE = /\.(ts|tsx|mts|cts|mjs|cjs|js|jsx)$/;
  const unresolved: string[] = [];
  const expected: string[] = [];
  for (const dir of SCAN_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of await walk(dir, CODE)) {
      for (const m of (await read(f)).matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
        const spec = m[1];
        if (spec.startsWith(".") || spec.startsWith("/") || builtins.has(spec)) continue;
        const name = specifierName(spec);
        if (ALIAS.has(aliasKey(spec)) || ALIAS.has(name) || declared.has(name)) continue;
        if (allow.includes(name)) expected.push(`${f} -> ${spec}`);
        else unresolved.push(`${f} -> ${spec}`);
      }
    }
  }
  if (expected.length) console.log(`  expected-red (${new Set(expected.map((e) => e.split("-> ")[1].split("/")[0])).size} pkg): e.g. ${[...new Set(expected)].slice(0, 3).join(" | ")}`);
  is(
    unresolved.length === 0,
    "every bare import resolves",
    `unresolved imports (asserted but never declared, and not allowlisted):\n${[...new Set(unresolved)].slice(0, 25).join("\n")}`,
  );

  // 2. every allowlist entry owns a week
  const malformed = allow.filter((k) => !WEEK.test(plan[k] ?? ""));
  is(
    malformed.length === 0,
    "every .deps-plan.json entry owns a week",
    `.deps-plan.json entries without a well-formed week: ${malformed.map((k) => `${k}=${plan[k] ?? "?"}`).join(", ")}`,
  );

  // 3. the allowlist may only shrink
  const stale = allow.filter((k) => declared.has(k));
  is(
    stale.length === 0,
    "the allowlist may only shrink",
    `allowlisted as absent but present in a manifest — remove from .deps-plan.json: ${stale.join(", ")}`,
  );

  // 4. the week that owed the install may not already be signed off
  const ledger: Record<string, string> = existsSync("containment/GATE-LEDGER.json")
    ? await json<Record<string, string>>("containment/GATE-LEDGER.json")
    : {};
  const outlived = allow.filter((k) => ledger[plan[k]] === "GREEN");
  is(
    outlived.length === 0,
    "no allowlist entry outlived its week",
    `allowlist outlived its week: ${outlived.map((k) => `${k} (${plan[k]} GREEN)`).join(", ")}`,
  );
});
