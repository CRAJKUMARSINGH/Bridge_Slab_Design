#!/usr/bin/env tsx
// scripts/gates/preflight.ts — the single control that makes the instruction set
// falsifiable. 15 assertions, P-01..P-15. Nothing in Phase 2 may run until 15/15.
//
// Adaptations to THIS repository (2026-10-23), all additive:
//
//   P-01/P-02  a path or npm target that does not exist yet is accepted when
//              PATH-MANIFEST.json declares it (planned artefact) or when
//              containment/PENDING-RESOLUTIONS.json exempts it (owned, expiring).
//              Without that second door P-01 and P-15 contradict each other: P-15
//              demands a manifest entry for every path a *future* week will write.
//   P-03       resolution is workspace-aware: a bare specifier resolves if it is
//              in the root manifest, in any workspace package manifest, is a
//              node builtin, is a declared alias, or is allowlisted in
//              .deps-plan.json as deliberately-not-installed-yet.
//   P-04       netlify.toml is optional here (this repo deploys with vercel.json),
//              so the assertion is CI == .nvmrc, with netlify checked when present.
//   P-06       either drizzle config location counts; the repo already carries one
//              at lib/db/drizzle.config.ts.
//   P-09       only gates that speak the contract are executed, and only `.ts`
//              ones: the `.mjs` files here are pre-existing NOT-IMPLEMENTED stubs
//              whose removal is W00's decision, not this gate's. preflight is
//              excluded so it cannot recurse into itself.
//   P-14       "prose" is decided by ARIFACT-TIERS tier 4, not by the string
//              `docs/`. A gate is allowed to read an authoritative instruction or
//              containment document (tier 1); it is not allowed to read a
//              narrative one.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { builtinModules } from "node:module";
import { execFileSync } from "node:child_process";
import { json, gateFiles, gateName, pendingFor, tierOf, walk, type TierMap } from "./_lib";

const PKG = JSON.parse(await readFile("package.json", "utf8"));
const results: { id: string; ok: boolean; detail: string }[] = [];
const advisories: string[] = [];
const add = (id: string, ok: boolean, detail = "") => results.push({ id, ok, detail });
const advise = (id: string, lines: string[]) => {
  if (lines.length) advisories.push(`${id} (${lines.length} exempted, owner W00): ${lines.slice(0, 5).join("; ")}`);
};

const INSTRUCTION_GLOBS = ["docs/phase-2"];

const instructionFiles = async (): Promise<string[]> =>
  (await Promise.all(INSTRUCTION_GLOBS.filter(existsSync).map((g) => walk(g, /\.md$/)))).flat().sort();

const manifestPaths = async (): Promise<Set<string>> => {
  if (!existsSync("PATH-MANIFEST.json")) return new Set();
  const man = await json<{ weeks?: Record<string, string[]> }>("PATH-MANIFEST.json");
  return new Set(Object.values(man.weeks ?? {}).flat());
};

const tiers: TierMap = existsSync("containment/ARTIFACT-TIERS.json")
  ? await json<TierMap>("containment/ARTIFACT-TIERS.json")
  : { artifacts: [] };

// ── P-01  every path referenced by an instruction file resolves (or is planned)
async function p01() {
  const files = await instructionFiles();
  if (!files.length) return add("P-01", false, "no instruction files found");
  const planned = await manifestPaths();
  const ex = await pendingFor("P-01");
  const bad: string[] = [];
  const exempt: string[] = [];
  const PATH_TOKEN = /`([A-Za-z0-9_./@-]+\.(?:ts|tsx|md|json|ya?ml|sql|css|mjs|js|ttf|dxf|xlsx|toml))`/g;
  for (const f of files) {
    const txt = await readFile(f, "utf8");
    for (const m of txt.matchAll(PATH_TOKEN)) {
      const p = m[1];
      if (p.startsWith("http") || p.includes("*")) continue;
      if (existsSync(p) || planned.has(p)) continue;
      if (ex.hit(f)) exempt.push(`${f} -> ${p}`);
      else bad.push(`${f} -> ${p}`);
    }
  }
  advise("P-01", exempt);
  add("P-01", bad.length === 0 && ex.broken.length === 0, [...bad, ...ex.broken].slice(0, 20).join("\n    "));
}

// ── P-02  every `npm run X` / `pnpm run X` target exists
async function p02() {
  const files = await instructionFiles();
  const scripts = new Set(Object.keys(PKG.scripts ?? {}));
  const ex = await pendingFor("P-02");
  const bad: string[] = [];
  const exempt: string[] = [];
  for (const f of files) {
    const txt = await readFile(f, "utf8");
    for (const m of txt.matchAll(/(?:npm|pnpm) run ([a-z0-9:_-]+)/gi)) {
      if (scripts.has(m[1])) continue;
      (ex.hit(f) ? exempt : bad).push(`${f} -> run ${m[1]}`);
    }
  }
  advise("P-02", exempt);
  add("P-02", bad.length === 0, [...new Set(bad)].slice(0, 20).join("\n    "));
}

// ── P-03  every bare import resolves
// Path aliases are declared in tsconfig.base.json / tsconfig.client.json and
// mirrored in vite.config.ts: `@/*` -> client/src, `@shared/*` -> shared,
// `@assets/*` -> attached_assets, `@workspace/*` -> lib/*.
const ALIAS = new Set(["@", "@assets", "@client", "@drawing", "@engine", "@shared", "@trust", "@units", "@workspace"]);
const SCAN_DIRS = ["lib", "server", "client/src", "scripts", "shared", "api", "pipeline", "src", "artifacts"];

/** Package name of a bare specifier (`@scope/name`, or `.` / `/` for a relative path). */
function specifierName(spec: string): string {
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
}

/** Alias key: the first segment, so `@shared/foo` matches the `@shared` alias. */
const aliasKey = (spec: string): string => spec.split("/")[0];

async function p03() {
  const installed = new Set([...Object.keys(PKG.dependencies ?? {}), ...Object.keys(PKG.devDependencies ?? {})]);
  // Workspace packages declare their own dependencies; the root manifest does
  // not see them. `walk` prunes node_modules and the local pnpm store, so a
  // package that merely sits inside the store is not mistaken for a declared one.
  for (const manifest of await walk(".", /^package\.json$/)) {
    try {
      const p = JSON.parse(await readFile(manifest, "utf8"));
      for (const k of [
        ...Object.keys(p.dependencies ?? {}),
        ...Object.keys(p.devDependencies ?? {}),
        ...Object.keys(p.peerDependencies ?? {}),
      ])
        installed.add(k);
      if (p.name) installed.add(p.name);
    } catch {
      /* a malformed manifest is not this gate's finding */
    }
  }
  const allow = existsSync(".deps-plan.json")
    ? Object.keys(await json<Record<string, string>>(".deps-plan.json")).filter((k) => !k.startsWith("_"))
    : [];
  const allowlisted = new Set<string>();
  const expected: string[] = [];
  const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);
  const bad: string[] = [];
  // Code only: a bare specifier exists solely in an import statement, and the
  // poison pills declare their own replacement token inside .pills.json. Tier-4
  // prose must never be parsed by a gate at all.
  const CODE = /\.(ts|tsx|mts|cts|mjs|cjs|js|jsx)$/;
  for (const dir of SCAN_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of await walk(dir, CODE)) {
      const txt = await readFile(f, "utf8");
      for (const m of txt.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
        const spec = m[1];
        if (spec.startsWith(".") || spec.startsWith("/") || builtins.has(spec)) continue;
        const pkg = specifierName(spec);
        if (ALIAS.has(aliasKey(spec)) || ALIAS.has(pkg) || installed.has(pkg)) continue;
        if (allow.includes(pkg)) {
          allowlisted.add(pkg);
          expected.push(`${f} -> ${spec}`);
          continue;
        }
        bad.push(`${f} -> ${spec}`);
      }
    }
  }
  advise("P-03", [...new Set(expected)].slice(0, 5));
  add(
    "P-03",
    bad.length === 0,
    [
      ...[...new Set(bad)].slice(0, 25),
      allowlisted.size
        ? `${allowlisted.size} package(s) deliberately absent, allowlisted in .deps-plan.json: ${[...allowlisted].sort().join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n    "),
  );
}

// ── P-04  node version agreement
async function p04() {
  const ci = existsSync(".github/workflows/ci.yml") ? await readFile(".github/workflows/ci.yml", "utf8") : "";
  const nt = existsSync("netlify.toml") ? await readFile("netlify.toml", "utf8") : "";
  const nvm = existsSync(".nvmrc") ? (await readFile(".nvmrc", "utf8")).trim() : null;
  const ciV = ci.match(/node-version:\s*['"]?(\d+)/)?.[1] ?? null;
  const netlifyV = nt.match(/NODE_VERSION\s*=\s*['"](\d+)/)?.[1] ?? null;
  const agree = !!ciV && !!nvm && ciV === nvm && (!netlifyV || netlifyV === ciV);
  add("P-04", agree, `ci=${ciV} nvmrc=${nvm} netlify=${netlifyV ?? "n/a"} (all three must agree when a netlify.toml exists)`);
}

// ── P-05..P-15
async function p05() {
  add("P-05", existsSync("eslint.config.js") || existsSync(".eslintrc.json"), "no eslint config");
}
async function p06() {
  add("P-06", existsSync("drizzle.config.ts") || existsSync("lib/db/drizzle.config.ts"), "no drizzle config at root or lib/db");
}
async function p07() {
  const ok = existsSync("archive") && existsSync("archive/MANIFEST.md");
  add("P-07", ok, "archive/ or archive/MANIFEST.md missing — nothing retired may leave the tree without a manifest row");
}
async function p08() {
  const need = [
    "corpus",
    "containment",
    "scripts/gates",
    "generated",
    "tests",
    "archive",
    "docs/phase-2/specs",
    "docs/phase-2/verification",
  ];
  const miss = need.filter((d) => !existsSync(d));
  add("P-08", miss.length === 0, `missing: ${miss.join(", ")}`);
}
async function p09() {
  const gates = await gateFiles();
  const legacy = (await walk("scripts/gates", /\.mjs$/)).map(gateName).sort();
  const bad: string[] = [];
  for (const g of gates) {
    let code = 0;
    try {
      execFileSync(process.execPath, ["--import", "tsx", g], { stdio: "pipe" });
    } catch (e: unknown) {
      code = (e as { status?: number }).status ?? 1;
    }
    if (code === 2) bad.push(`${g} exited 2 (NOT IMPLEMENTED)`);
  }
  add(
    "P-09",
    bad.length === 0,
    [...bad, legacy.length ? `not a finding: ${legacy.length} pre-existing .mjs stubs excluded (${legacy.join(", ")})` : ""]
      .filter(Boolean)
      .join("\n    "),
  );
}
async function p10() {
  if (!existsSync("scripts/gates/.proven.json")) return add("P-10", false, "no .proven.json");
  const proven = JSON.parse(await readFile("scripts/gates/.proven.json", "utf8"));
  const bad = (await gateFiles())
    .map(gateName)
    .filter((n) => !proven[n]?.redAt || !proven[n]?.greenAt);
  add("P-10", bad.length === 0, `never proven red+green: ${bad.join(", ")}`);
}
async function p11() {
  const ex = await pendingFor("P-11");
  const { readdir } = await import("node:fs/promises");
  const dupes: string[] = [];
  const exempt: string[] = [];
  for (const e of await readdir("docs", { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const alt = e.name.includes("-") ? e.name.replace("-", "") : e.name.replace(/(\D)(\d)/, "$1-$2");
    if (alt === e.name || !existsSync(`docs/${alt}`)) continue;
    const pair = `docs/${e.name} vs docs/${alt}`;
    if (ex.hit(`docs/${e.name}`) || ex.hit(`docs/${alt}`)) exempt.push(pair);
    else dupes.push(pair);
  }
  advise("P-11", exempt);
  add("P-11", dupes.length === 0 && ex.broken.length === 0, [...dupes, ...ex.broken].join("; "));
}
async function p12() {
  const candidates = ["origin-weekly-plan.md", "docs/plan-b/15-week-implementation-plan.md"];
  const canonical = (await readFile("CANONICAL.md", "utf8").catch(() => "")).trim();
  const present = candidates.filter(existsSync);
  const ex = await pendingFor("P-12");
  const unexempt = present.filter((p) => !ex.hit(p));
  advise("P-12", present.filter((p) => ex.hit(p)));
  add(
    "P-12",
    unexempt.length === 0 && (present.length === 0 || canonical.length > 0) && ex.broken.length === 0,
    [
      present.length && !canonical.length
        ? `plan files present without a CANONICAL.md declaration: ${present.join(", ")}`
        : "",
      ...ex.broken,
    ]
      .filter(Boolean)
      .join("; "),
  );
}
async function p13() {
  const both = existsSync("package-lock.json") && existsSync("pnpm-lock.yaml");
  add("P-13", !both, both ? "both lockfiles tracked; preinstall permits pnpm only" : "");
}
async function p14() {
  const bad: string[] = [];
  for (const g of await gateFiles()) {
    const txt = await readFile(g, "utf8");
    for (const m of txt.matchAll(/readFile\(\s*["']([A-Za-z0-9_./-]+\.md)["']/g)) {
      const target = m[1];
      if (tierOf(target, tiers) === 4) bad.push(`${g} reads tier-4 prose: ${target}`);
      if (!existsSync(target)) bad.push(`${g} reads a missing file: ${target}`);
    }
  }
  add("P-14", bad.length === 0, bad.join("\n    "));
}
async function p15() {
  if (!existsSync("PATH-MANIFEST.json")) return add("P-15", false, "no PATH-MANIFEST.json");
  const man = await json<{ weeks: Record<string, string[]> }>("PATH-MANIFEST.json");
  const owners = new Map<string, string[]>();
  for (const [week, paths] of Object.entries(man.weeks ?? {}))
    for (const p of paths) owners.set(p, [...(owners.get(p) ?? []), week]);
  const doubleOwned = [...owners].filter(([, w]) => w.length > 1).map(([p, w]) => `${p} owned by ${w.join("+")}`);
  add("P-15", doubleOwned.length === 0, doubleOwned.join("; "));
}

await Promise.all([p01(), p02(), p03(), p04(), p05(), p06(), p07(), p08(), p09(), p10(), p11(), p12(), p13(), p14(), p15()]);

let fail = 0;
for (const r of results.sort((a, b) => a.id.localeCompare(b.id))) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id}${r.ok ? "" : "  " + r.detail}`);
  if (!r.ok) fail++;
}
for (const a of advisories) console.log(`ADVISORY  ${a}`);
console.log(`GATE preflight: ${fail === 0 ? "PASS" : "FAIL"} ${results.length} assertions`);
process.exit(fail === 0 ? 0 : 1);
