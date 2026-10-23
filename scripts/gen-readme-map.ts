#!/usr/bin/env tsx
// scripts/gen-readme-map.ts — the repository map in README.md is generated, not
// hand-maintained.
//
// H-13: the README carried a hand-written component table that described the
// tree as it had been months earlier (`Express 5`, a `sheets-extracted/`
// directory presented as live code). A hand-maintained map of a moving tree is a
// claim nobody re-checks, so it drifts silently. This script owns the block
// between the two GEN:module-map markers; `gate:readme` re-generates it and
// fails when the committed README disagrees.
//
//   node --import tsx scripts/gen-readme-map.ts          # write the block
//   node --import tsx scripts/gen-readme-map.ts --check  # verify, never write
//
// Two deviations from the guide's listing, both declared:
//
//   1. `--check` exists and never writes. `gate:readme` has to be able to verify
//      the README, and a verification that rewrites the file it is verifying
//      cannot fail. The poison pill that proves the gate RED corrupts this
//      script, so the corrupted run must not be able to touch the tree either.
//   2. The ignore set is read from containment/ARTIFACT-TIERS.json rather than
//      being "every visible directory". The guide counted with
//      `readdir(..., { recursive: true })`, which descends into a workspace
//      subdirectory's node_modules and makes the Size column depend on the
//      machine. The declared ignored set is the same one gate-tiers prunes by,
//      so a generated table and the gate harness cannot disagree.
import { readdir, readFile, writeFile } from "node:fs/promises";

const START = "<!-- GEN:module-map -->";
const END = "<!-- /GEN:module-map -->";
const README = "README.md";
const CHECK = process.argv.includes("--check");

/** What each top-level directory is for. A directory absent from this map still
 *  appears in the table, with `—` as its purpose: the table is the tree's shape,
 *  not a curated wish-list. */
const PURPOSE: Record<string, string> = {
  "lib": "authoritative engine surface (shim; migrates in W02)",
  "server": "Express 4 API server",
  "client": "React UI",
  "shared": "db, schema, feature flags",
  "bridge-excel-generator": "legacy engine (being absorbed into lib/engine)",
  "python_cad": "CAD adapter",
  "scripts": "tooling, gates, extractors",
  "corpus": "immutable source workbooks + frozen oracle",
  "containment": "trust tiers, contracts, claim ledger",
  "tests": "golden fixtures and integration tests",
  "docs": "phase deliverables",
  "inputs": "engine input contract (variables, coefficients, constraints)",
  "project": "canonical projects and asset catalogue",
  "pipeline": "pipeline entry point",
  "openapi": "OpenAPI description of the API",
  "Drawing_Module": "drawing components, reached through the @drawing/* alias",
  "engineering": "engineering knowledge audit and asset registry",
  "api": "serverless API entry point",
  "archive": "retired artefacts, one MANIFEST.md row each",
  "artifacts": "workspace app packages",
  "CODE-JUNCTION": "the Phase-2 enrichment drop this foundation is drawn from",
  "data": "local-only data, not shipped",
  "design-reports": "generated design report HTML",
  "evidence": "assimilation evidence bundles",
  "generated": "generated artefact root",
  "out": "generated reports and workbooks",
  "parity-dump": "golden parity dumps",
  "sample": "integration test logs",
  "src": "root-level extras",
  "test-output": "ad-hoc verification output",
};

const tiers = JSON.parse(await readFile("containment/ARTIFACT-TIERS.json", "utf8")) as {
  ignored?: string[];
};
const SKIP = new Set<string>([...(tiers.ignored ?? []), "node_modules"]);

/** Entries under `dir`, pruning the declared ignored trees and dot-directories,
 *  so the count is a property of the commit and not of the checkout. */
async function count(dir: string): Promise<number> {
  let n = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries;
    try {
      entries = await readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || SKIP.has(e.name)) continue;
      n++;
      if (e.isDirectory()) stack.push(`${cur}/${e.name}`);
    }
  }
  return n;
}

const top = (await readdir(".", { withFileTypes: true }))
  .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !SKIP.has(e.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const rows = await Promise.all(
  top.map(async (e) => `| \`${e.name}/\` | ${PURPOSE[e.name] ?? "—"} | ${await count(e.name)} entries |`),
);

const block = [START, "| Path | Purpose | Size |", "|---|---|---|", ...rows, END].join("\n");
const readme = await readFile(README, "utf8");
if (!readme.includes(START) || !readme.includes(END))
  throw new Error(`README is missing the GEN:module-map markers (${START} / ${END})`);

if (CHECK) {
  const current = readme.slice(readme.indexOf(START), readme.indexOf(END) + END.length);
  if (current !== block) {
    console.error("README module map is stale — run: pnpm run gen:readme");
    process.exit(1);
  }
  console.log(`module map verified: ${rows.length} entries`);
} else {
  await writeFile(README, readme.replace(new RegExp(`${START}[\\s\\S]*${END}`), block));
  console.log(`module map regenerated: ${rows.length} entries`);
}
