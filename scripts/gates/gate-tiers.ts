#!/usr/bin/env tsx
// gate-tiers — prose stays harmless.
// 3 assertions: every artefact in the tree has a declared tier; no gate reads a
// tier-4 (NARRATIVE) artefact; no tier-2 artefact lives under prose.
//
// Adaptation: the reference walk skipped only node_modules/dist/.git. This tree
// carries vendor and scratch trees (VENICE-REFERENCES, merge-refs, Attached_Assets,
// _tmp_*, .trae, ...); they are read from the `ignored` array of
// containment/ARTIFACT-TIERS.json so the exemption is declared data, not a
// hardcoded skip.
import { run, walk, read, json, fail, tierOf, isIgnored, type TierMap } from "./_lib";

await run("gate-tiers", 3, async () => {
  const map = await json<TierMap>("containment/ARTIFACT-TIERS.json");

  // 1. no undeclared artifact
  const undeclared: string[] = [];
  for (const f of await walk(".", /\.(ts|tsx|json|sql|md|mjs|js)$/)) {
    if (isIgnored(f, map)) continue;
    if (tierOf(f, map) === null) undeclared.push(f);
  }
  console.log(`  ${map.artifacts.length} tier rule(s), ${map.ignored?.length ?? 0} ignored tree(s)`);
  if (undeclared.length) fail(`undeclared artifacts:\n${undeclared.slice(0, 25).join("\n")}`);

  // 2. no gate *reads* prose. The assertion is about reading, not mentioning: a
  // gate is allowed to check that a narrative file exists (`existsSync`), and is
  // allowed to read an authoritative document (tier 1). It is not allowed to
  // decide anything from narrative text.
  const prose: string[] = [];
  for (const g of await walk("scripts/gates", /\.ts$/)) {
    const txt = await read(g);
    for (const m of txt.matchAll(/read(?:File)?\(\s*["']([A-Za-z0-9_./-]+\.md)["']/g))
      if (tierOf(m[1], map) === 4) prose.push(`${g} reads tier-4 prose: ${m[1]}`);
  }
  if (prose.length) fail(prose.join("\n"));

  // 3. no Tier 2 artifact descends from Tier 4
  const desc: string[] = [];
  for (const f of await walk("lib", /\.ts$/)) if (f.includes("README") || f.includes("docs/")) desc.push(f);
  if (desc.length) fail(`Tier 2 artifacts under prose: ${desc.join(", ")}`);
});
