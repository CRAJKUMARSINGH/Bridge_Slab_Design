#!/usr/bin/env tsx
// gate-proven-red — no stub gates.
// 2 assertions: every gate in this directory has been observed RED at least once,
// and GREEN at least once. A gate nobody has seen fail is a gate nobody can
// trust; the `.proven.json` pair is the whole point.
//
// RED is written by `gate-prove <gate>` (see below). GREEN is written by
// `_lib.run()` on every green execution, so the pair closes itself.
//
// Adaptation: the reference pills shelled out to `bash -c` and `git checkout`.
// Neither is dependable on a Windows checkout, and `git checkout` would discard
// unrelated work. The pills here are plain string substitutions declared in
// scripts/gates/.pills.json, applied and reverted in-process from the original
// bytes, so a failed proof can never leave the tree corrupted.
import { run, json, fail, read, PROVEN, gateFiles, gateName } from "./_lib";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const PILLS = "scripts/gates/.pills.json";
type Pill = { gate: string; file: string; find?: string; replace?: string; write?: string };
type Proven = Record<string, { redAt?: string; greenAt?: string }>;

const SELF = "gate-proven-red";
const argv = process.argv.slice(2);
if (argv[0] === "--prove") {
  await proveAll(argv[1]);
  process.exit(0);
}

await run(SELF, 2, async () => {
  const gates = await gateFiles();
  const proven = await json<Proven>(PROVEN).catch(() => ({}) as Proven);
  const neverRed: string[] = [];
  const neverGreen: string[] = [];
  for (const g of gates) {
    const name = gateName(g);
    // A gate cannot have observed its own GREEN before the run that produces it,
    // so it is exempt from auditing itself. Its RED is the poisoned run recorded
    // by `gate-prove`, and its GREEN is this very passing run — both are still
    // required in .proven.json (preflight P-10 checks them), they are just not
    // this assertion's business.
    if (name === SELF) continue;
    if (!proven[name]?.redAt) neverRed.push(name);
    if (!proven[name]?.greenAt) neverGreen.push(name);
  }
  console.log(`  ${gates.length} gate(s): ${gates.map(gateName).join(", ")}`);
  if (neverRed.length || neverGreen.length)
    fail(
      [
        neverRed.length ? `never observed RED: ${neverRed.join(", ")}` : "",
        neverGreen.length ? `never observed GREEN: ${neverGreen.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
});

/** Run a gate out-of-process and return its exit code. */
async function runGate(name: string): Promise<number> {
  try {
    execFileSync(process.execPath, ["--import", "tsx", `scripts/gates/${name}.ts`], { stdio: "pipe" });
    return 0;
  } catch (e: unknown) {
    return (e as { status?: number }).status ?? 1;
  }
}

async function proveAll(only?: string) {
  const pills = await json<Record<string, Pill>>(PILLS);
  const gateNames = new Set((await gateFiles()).map(gateName));
  const targets = Object.entries(pills)
    .filter(
      ([k, v]) =>
        !k.startsWith("_") && v && typeof v === "object" && "file" in v && typeof v.gate === "string",
    )
    .filter(([k, v]) => !only || k === only || v.gate === only)
    // Prove the auditor of the ledger LAST: by then every other gate already has
    // its redAt+greenAt pair, so its restored run can actually pass.
    .sort(([, a], [, b]) => (a.gate === SELF ? 1 : b.gate === SELF ? -1 : a.gate.localeCompare(b.gate)));
  if (!targets.length) {
    console.error(only ? `no poison pill for ${only}` : "no poison pills declared");
    process.exit(1);
  }
  const failures: string[] = [];
  for (const [pillId, pill] of targets) {
    // The pill names the gate it guards; the file is `scripts/gates/<gate>.ts`.
    // Running the pill id as the file name would invoke a module that does not
    // exist and read every gate as permanently RED.
    const gate = pill.gate;
    if (!gateNames.has(gate)) {
      failures.push(`${pillId}: names a gate that does not exist (${gate})`);
      continue;
    }
    const original = await readFile(pill.file, "utf8");
    let corrupted: string;
    if (pill.write !== undefined) corrupted = pill.write;
    else if (pill.find !== undefined && pill.replace !== undefined) {
      if (!original.includes(pill.find)) {
        failures.push(`${pillId}: pill anchor not found in ${pill.file}`);
        continue;
      }
      corrupted = original.replace(pill.find, pill.replace);
    } else {
      failures.push(`${pillId}: pill needs either "write" or "find"+"replace"`);
      continue;
    }
    if (corrupted === original) {
      failures.push(`${pillId}: pill is a no-op for ${pill.file}`);
      continue;
    }

    let redCode = -1;
    try {
      await writeFile(pill.file, corrupted);
      redCode = await runGate(gate);
    } finally {
      await writeFile(pill.file, original);
    }

    // Record RED after the restore, never before it. The ledger's own pill wipes
    // `.proven.json`; if RED were written into the wiped file the restore would
    // undo it, and `proven-red` could never pass its own restored run.
    if (redCode === 1) {
      const proven: Proven = JSON.parse(await readFile(PROVEN, "utf8").catch(() => "{}"));
      proven[gate] = { ...(proven[gate] ?? {}), redAt: new Date().toISOString() };
      await writeFile(PROVEN, JSON.stringify(proven, null, 2));
    }

    const greenCode = await runGate(gate);
    if (redCode !== 1) failures.push(`${pillId}: ${gate} did not go RED when poisoned (exit ${redCode})`);
    else if (greenCode !== 0)
      failures.push(`${pillId}: ${gate} went RED, but not GREEN when restored (exit ${greenCode})`);
    else console.log(`${pillId}: ${gate} RED (poisoned) -> GREEN (restored) — recorded`);
  }
  if (failures.length) {
    console.error(`\n${failures.length} gate(s) could not be proven:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`\n${targets.length} gate(s) proven RED then GREEN`);
}
