import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { calculateBridgeDesign, type BridgeCalculationResult } from "@workspace/engine";

type Expected = {
  schemaVersion: string;
  projectCode: string;
  intermediates: Record<string, number>;
  constraintStatus: Record<string, string>;
  overallStatus: string;
  failedChecks: string[];
};

function relativeError(actual: number, expected: number): number {
  if (expected === 0) return Math.abs(actual);
  return Math.abs(actual - expected) / Math.abs(expected);
}

function assertGolden(result: BridgeCalculationResult, expected: Expected): void {
  const tolerance = 1e-6;
  if (result.schemaVersion !== expected.schemaVersion) {
    throw new Error(`Schema mismatch: ${result.schemaVersion} != ${expected.schemaVersion}`);
  }
  if (result.project.projectCode !== expected.projectCode) {
    throw new Error(`Project mismatch: ${result.project.projectCode} != ${expected.projectCode}`);
  }

  for (const [key, expectedValue] of Object.entries(expected.intermediates)) {
    const actualValue = result.intermediates[key as keyof BridgeCalculationResult["intermediates"]];
    if (typeof actualValue !== "number" || relativeError(actualValue, expectedValue) > tolerance) {
      throw new Error(`Golden mismatch ${key}: actual=${actualValue} expected=${expectedValue}`);
    }
  }

  const actualStatuses = Object.fromEntries(
    result.constraints.map((constraint) => [constraint.id, constraint.status]),
  );
  if (JSON.stringify(actualStatuses) !== JSON.stringify(expected.constraintStatus)) {
    throw new Error(
      `Constraint status mismatch:\nactual=${JSON.stringify(actualStatuses)}\nexpected=${JSON.stringify(expected.constraintStatus)}`,
    );
  }
  if (result.overallStatus !== expected.overallStatus) {
    throw new Error(`Overall status mismatch: ${result.overallStatus} != ${expected.overallStatus}`);
  }
  if (JSON.stringify(result.failedChecks) !== JSON.stringify(expected.failedChecks)) {
    throw new Error(
      `Failed-check mismatch: ${JSON.stringify(result.failedChecks)} != ${JSON.stringify(expected.failedChecks)}`,
    );
  }
}

const workspaceRoot = resolve(process.cwd(), "..");
const inputPath = resolve(workspaceRoot, "inputs/KHERWARA.json");
const expectedPath = resolve(workspaceRoot, "tests/golden/kherwara/expected.json");
const input = JSON.parse(await readFile(inputPath, "utf8")) as Record<string, unknown>;
const expected = JSON.parse(await readFile(expectedPath, "utf8")) as Expected;
assertGolden(calculateBridgeDesign(input), expected);

const tampered = { ...input, liveLoadUdl: Number(input.liveLoadUdl) + 1 };
const tamperedResult = calculateBridgeDesign(tampered);
if (tamperedResult.intermediates.designUdl === expected.intermediates.designUdl) {
  throw new Error("Tamper test did not change the design result");
}

process.stdout.write("Golden regression passed; tamper input changed the result as expected.\n");