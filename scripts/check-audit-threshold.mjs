import { execSync } from "node:child_process";

const ALLOWED_HIGH_PACKAGES = new Set(["xlsx"]);
const FAIL_ON_CRITICAL = true;

function runAudit() {
  try {
    const output = execSync("npm audit --json", {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });
    return JSON.parse(output);
  } catch (error) {
    const stdout = error?.stdout?.toString?.() ?? "";
    if (!stdout) throw error;
    return JSON.parse(stdout);
  }
}

function main() {
  const audit = runAudit();
  const meta = audit.metadata?.vulnerabilities ?? {};
  const vulnerabilities = audit.vulnerabilities ?? {};

  const critical = Number(meta.critical ?? 0);
  const high = Number(meta.high ?? 0);
  const disallowedHighPackages = [];

  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    if (info?.severity === "high" && !ALLOWED_HIGH_PACKAGES.has(pkg)) {
      disallowedHighPackages.push(pkg);
    }
  }

  if (FAIL_ON_CRITICAL && critical > 0) {
    throw new Error(`Audit policy failed: critical vulnerabilities = ${critical}`);
  }
  if (disallowedHighPackages.length > 0) {
    throw new Error(
      `Audit policy failed: disallowed high vulnerabilities in [${disallowedHighPackages.join(", ")}]`,
    );
  }

  console.log(
    `Audit policy OK: critical=${critical}, high=${high}, allowed-high=[${[
      ...ALLOWED_HIGH_PACKAGES,
    ].join(", ")}]`,
  );
}

main();
