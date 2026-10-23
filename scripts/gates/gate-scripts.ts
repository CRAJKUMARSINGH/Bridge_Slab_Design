#!/usr/bin/env tsx
// gate-scripts — a broken path in package.json is a build failure, not a surprise.
// 2 assertions: every file a script points at exists; every script a script
// invokes exists. This is the gate that would have caught
// `manifest.gates.map(g => g.cmd)` shipping before its target did.
import { run, read, fail } from "./_lib";
import { existsSync } from "node:fs";

const TARGET = /^(?:tsx|node|ts-node)\s+([^\s"']+)/;

await run("gate-scripts", 2, async () => {
  const pkg = JSON.parse(await read("package.json"));
  const scripts: Record<string, string> = pkg.scripts ?? {};

  // 1. every referenced file exists
  const missing: string[] = [];
  for (const [name, cmd] of Object.entries(scripts)) {
    for (const part of cmd.split(/&&|;/)) {
      const m = TARGET.exec(part.trim());
      if (!m) continue;
      const file = m[1].replace(/^"|"$/g, "");
      if (file.includes("$") || file.includes("*")) continue;
      if (!existsSync(file)) missing.push(`${name} -> ${file}`);
    }
  }
  if (missing.length) fail(`package.json scripts point at absent files:\n${missing.join("\n")}`);

  // 2. every invoked script exists
  const invoked: string[] = [];
  for (const [name, cmd] of Object.entries(scripts))
    for (const m of cmd.matchAll(/(?:npm|pnpm) run ([a-z0-9:_-]+)/gi)) if (!scripts[m[1]]) invoked.push(`${name} -> run ${m[1]}`);
  if (invoked.length) fail(`package.json scripts invoke absent scripts:\n${[...new Set(invoked)].join("\n")}`);
});
