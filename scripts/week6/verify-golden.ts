#!/usr/bin/env npx tsx
/**
 * verify-golden.ts — Week 6 calculation parity harness
 *
 * Runs @workspace/engine against each project in tests/golden/
 * and compares results against frozen expected snapshots.
 *
 * Exit codes:
 *   0  All assertions passed
 *   1  One or more assertions failed
 *   2  Missing or unreadable fixture
 *
 * Usage:
 *   npx tsx scripts/week6/verify-golden.ts
 *   npx tsx scripts/week6/verify-golden.ts --update    # regenerate snapshots
 *   npx tsx scripts/week6/verify-golden.ts --tamper    # prove harness goes RED
 *   npx tsx scripts/week6/verify-golden.ts --project kherwara
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "../../");
const GOLDEN    = join(ROOT, "tests/golden");
const UPDATE    = process.argv.includes("--update");
const TAMPER    = process.argv.includes("--tamper");
const PROJECT   = (() => { const i = process.argv.indexOf("--project"); return i >= 0 ? process.argv[i+1] : null; })();

// ── Engine loader ──────────────────────────────────────────────────────────

type CalcFn = (inputs: Record<string, unknown>) => Record<string, unknown>;

async function loadEngine(): Promise<CalcFn> {
  const paths = [
    join(ROOT, "lib/engine/src/calculate.ts"),
    join(ROOT, "lib/engine/dist/calculate.js"),
  ];
  for (const p of paths) {
    try { const m = await import(p); return m.calculate as CalcFn; } catch { /* try next */ }
  }
  throw new Error("Could not load engine. Run from repo root with tsx installed.");
}

// ── Input field mapper: api-zod schema → engine BridgeInputs ──────────────

function mapToEngineInputs(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    span:               raw["spanLength"],
    deckWidth:          raw["deckWidth"],
    girderSpacing:      raw["girderSpacing"],
    girderCount:        raw["girderCount"],
    concreteGrade:      raw["concreteStrength"],
    steelYieldStrength: raw["steelGrade"],
    deckThickness:      raw["deckThickness"],
    liveLoadUDL:        raw["liveLoadUdl"],
    concentratedLoad:   (raw["liveLoadPoint"] as number) ?? 0,
    secondMomentArea:   raw["secondMoment"],
    sectionModulus:     raw["sectionModulus"],
    alpha:              (raw["alpha"] as number)       ?? 0.9,
    correctionK3:       (raw["correctionK3"] as number) ?? 1.2,
  };
}

// ── Tolerance check ────────────────────────────────────────────────────────

function withinTolerance(actual: number, expected: number, pct: number): boolean {
  if (Math.abs(expected) < 1e-12) return Math.abs(actual) < 1e-9;
  return (Math.abs(actual - expected) / Math.abs(expected)) * 100 <= pct;
}

interface Failure { field: string; expected: unknown; actual: unknown; msg: string; }

// ── Assert snapshot ────────────────────────────────────────────────────────

function assertSnapshot(
  result: Record<string, unknown>,
  snap: Record<string, unknown>,
  failures: Failure[],
): void {
  const exp    = snap["expected"] as Record<string, unknown>;
  const tolPct = ((snap["tolerances"] as Record<string, unknown>)?.["numeric_pct"] as number) ?? 0.1;
  if (!exp) { failures.push({ field: "expected", expected: "(present)", actual: "(missing)", msg: "snapshot has no 'expected' key" }); return; }

  for (const [key, expVal] of Object.entries(exp)) {
    if (key.startsWith("_")) continue;

    if (key === "failedChecksMin") {
      const fc = (result["failedChecks"] as string[]) ?? [];
      if (fc.length < (expVal as number))
        failures.push({ field: "failedChecks.length", expected: `>= ${expVal}`, actual: fc.length, msg: "too few failed checks" });
      continue;
    }

    const actual = result[key];
    if (expVal === null || expVal === undefined) continue;

    if (typeof expVal === "object" && expVal !== null) {
      const o = expVal as Record<string, unknown>;
      // Check numeric value
      if ("value" in o && typeof o["value"] === "number" && actual && typeof actual === "object") {
        const aVal = (actual as Record<string, unknown>)["value"] as number;
        if (!withinTolerance(aVal, o["value"] as number, tolPct))
          failures.push({ field: `${key}.value`, expected: o["value"], actual: aVal, msg: `numeric mismatch (tol ±${tolPct}%)` });
      }
      // Check status
      if ("status" in o && actual && typeof actual === "object") {
        const aStatus = (actual as Record<string, unknown>)["status"];
        if (aStatus !== o["status"])
          failures.push({ field: `${key}.status`, expected: o["status"], actual: aStatus, msg: "status mismatch" });
      }
    } else if (typeof expVal === "string" && actual !== expVal) {
      failures.push({ field: key, expected: expVal, actual, msg: "string mismatch" });
    }
  }
}

// ── Snapshot writer ────────────────────────────────────────────────────────

function writeSnapshot(dir: string, result: Record<string, unknown>, rawInputs: Record<string, unknown>): void {
  const v    = result["engineVersion"] as string;
  const path = join(dir, `expected-calculation-v${v}.json`);
  const snap = {
    _version:     v,
    _generatedAt: new Date().toISOString(),
    _status:      "GOLDEN-SNAPSHOT — regenerated by verify-golden --update",
    tolerances:   { numeric_pct: 0.1, status: "exact" },
    inputs:       rawInputs,
    expected: {
      designUDL:                    { value: (result["designUDL"] as Record<string,unknown>)["value"],          unit: (result["designUDL"] as Record<string,unknown>)["unit"] },
      maximumMoment:                { value: (result["maximumMoment"] as Record<string,unknown>)["value"],       unit: (result["maximumMoment"] as Record<string,unknown>)["unit"] },
      maximumShear:                 { value: (result["maximumShear"] as Record<string,unknown>)["value"],        unit: (result["maximumShear"] as Record<string,unknown>)["unit"] },
      bendingStress:                { value: (result["bendingStress"] as Record<string,unknown>)["value"],       unit: (result["bendingStress"] as Record<string,unknown>)["unit"] },
      deflectionLimit:              { value: (result["deflectionLimit"] as Record<string,unknown>)["value"],     unit: (result["deflectionLimit"] as Record<string,unknown>)["unit"] },
      shearStress:                  { value: (result["shearStress"] as Record<string,unknown>)["value"],         unit: (result["shearStress"] as Record<string,unknown>)["unit"] },
      bendingUtilisation:           { status: (result["bendingUtilisation"] as Record<string,unknown>)["status"] },
      deflectionCheck:              { status: (result["deflectionCheck"] as Record<string,unknown>)["status"] },
      shearCheck:                   { status: (result["shearCheck"] as Record<string,unknown>)["status"] },
      governingUtilisation:         { status: (result["governingUtilisation"] as Record<string,unknown>)["status"] },
      adjustedGoverningUtilisation: { status: (result["adjustedGoverningUtilisation"] as Record<string,unknown>)["status"] },
      overallStatus:                result["overallStatus"],
      failedChecksMin:              (result["failedChecks"] as string[]).length,
    },
  };
  writeFileSync(path, JSON.stringify(snap, null, 2), "utf8");
  console.log(`  ✅  Snapshot written: ${path}`);
}

// ── Fixture discovery ──────────────────────────────────────────────────────

interface Fixture { project: string; dir: string; inputFile: string; snapFile: string | null; }

function discoverFixtures(): Fixture[] {
  const dirs = readdirSync(GOLDEN).filter(d => {
    if (PROJECT && d !== PROJECT) return false;
    return statSync(join(GOLDEN, d)).isDirectory();
  });

  return dirs.flatMap(project => {
    const dir   = join(GOLDEN, project);
    const files = readdirSync(dir);
    const input = files.find(f => f === "inputs-calculation.json") ?? files.find(f => f === "inputs.json");
    if (!input) return [];
    const snap  = files.find(f => f.startsWith("expected-calculation") && f.endsWith(".json")) ?? null;
    return [{ project, dir, inputFile: join(dir, input), snapFile: snap ? join(dir, snap) : null }];
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`Bridge Report Studio — Week 6 Golden Regression`);
  console.log(`Mode: ${UPDATE ? "UPDATE" : TAMPER ? "TAMPER" : "VERIFY"}  Root: ${ROOT}`);
  console.log(`${"═".repeat(60)}\n`);

  const calculate = await loadEngine();
  const fixtures  = discoverFixtures();

  if (fixtures.length === 0) {
    console.error(`No golden fixtures found in ${GOLDEN}`);
    console.error(`Create tests/golden/<project>/inputs-calculation.json and run --update`);
    process.exit(2);
  }

  let passed = 0, failed = 0;

  for (const { project, dir, inputFile, snapFile } of fixtures) {
    console.log(`▶  ${project}`);

    // Load and map inputs
    let rawInputs: Record<string, unknown>;
    try { rawInputs = JSON.parse(readFileSync(inputFile, "utf8")); }
    catch { console.error(`  ✗  Cannot read ${inputFile}`); failed++; continue; }

    if (TAMPER) {
      rawInputs = { ...rawInputs, spanLength: ((rawInputs["spanLength"] as number) ?? 8) + 1 };
      console.log(`  [TAMPER] spanLength +1`);
    }

    const engineInputs = mapToEngineInputs(rawInputs);
    let result: Record<string, unknown>;
    try { result = calculate(engineInputs); }
    catch (e) { console.error(`  ✗  Engine error: ${(e as Error).message}`); failed++; continue; }

    // Update mode — write snapshot
    if (UPDATE) { writeSnapshot(dir, result, rawInputs); passed++; continue; }

    // Verify mode
    if (!snapFile) {
      console.log(`  ⚠  No snapshot found — run --update to create one`);
      continue;
    }

    let snap: Record<string, unknown>;
    try { snap = JSON.parse(readFileSync(snapFile, "utf8")); }
    catch { console.error(`  ✗  Cannot read snapshot: ${snapFile}`); failed++; continue; }

    const failures: Failure[] = [];
    assertSnapshot(result, snap, failures);

    if (TAMPER) {
      if (failures.length === 0) {
        console.error(`  ✗  TAMPER TEST FAILED — harness did not detect changed input`);
        failed++;
      } else {
        console.log(`  ✅  TAMPER DETECTED (${failures.length} difference(s)) — harness working correctly`);
        passed++;
      }
    } else {
      if (failures.length === 0) {
        console.log(`  ✅  All assertions passed`);
        passed++;
      } else {
        console.log(`  ✗   ${failures.length} failure(s):`);
        failures.forEach(f =>
          console.log(`      [${f.field}] ${f.msg} — expected=${JSON.stringify(f.expected)}  actual=${JSON.stringify(f.actual)}`));
        failed++;
      }
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Projects: ${passed + failed}   Passed: ${passed}   Failed: ${failed}`);

  if (failed > 0) {
    console.error("\nGolden regression FAILED");
    process.exit(1);
  }
  console.log("Golden regression PASSED\n");
}

main().catch(e => { console.error(e); process.exit(1); });
