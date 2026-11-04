// gate:parity — golden corpus result equality at rtol 1e-9.
//
// WHAT THIS GATE IS (and is not)
// -----------------------------
// It is a REGRESSION BASELINE. For each frozen golden fixture it re-runs the
// consolidated engine port on the fixture's own embedded inputs and requires the
// output to equal the frozen `baseline` at rtol 1e-9. Its job is to make a silent
// numeric drift impossible: change a formula, a constant or DEFAULT_HYDRAULIC and
// this gate goes RED naming the quantity and the delta.
//
// It is NOT a proof that the engine agrees with the oracle. That is a different
// question with a different answer, and the answer is currently "not everywhere".
// So the gate also performs the two checks that stop the honest gaps from being
// silently absorbed here:
//
//   * a fixture that cannot be compared (no matching repository input) MUST say so
//     in `inputSnapshotGap` and is counted as an explicit SKIP — never a pass;
//   * every MEASURED disagreement (`oracleVsComputed[].within === false`) and every
//     SKIP must have a token `[<BRIDGE_CODE>/<QUANTITY>]` in
//     docs/phase-2/SOURCE-DEFECT-REGISTER.md.
//
// Without the second rule a green gate would read as "everything matches", which
// is false. With it, green means: "nothing has moved, and every place where the
// engine does not match the oracle is registered, owned and visible."
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-parity: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-parity.json
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GATE_NAME = "gate-parity";
const dir = dirname(fileURLToPath(import.meta.url));
const repo = join(dir, "..", "..");
const outDir = join(dir, ".out");
mkdirSync(outDir, { recursive: true });

const GOLDEN_DIR = join(repo, "corpus", "golden");
const ORACLE = join(repo, "corpus", "oracle", "GOLDEN-ORACLE.json");
const PORT = join(repo, "lib", "engine", "src", "hydraulics", "index.ts");
const REGISTER = join(repo, "docs", "phase-2", "SOURCE-DEFECT-REGISTER.md");

const RTOL = 1e-9;

const pass = [];
const fail = [];
const skips = [];
const parity = [];
const reg = (ok, check, detail) => (ok ? pass : fail).push({ check, ...(ok ? {} : { error: detail }) });
const num = (v) => (typeof v === "number" ? v.toPrecision(12) : String(v));

const goldenFiles = existsSync(GOLDEN_DIR)
  ? readdirSync(GOLDEN_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];
const oracle = existsSync(ORACLE) ? JSON.parse(readFileSync(ORACLE, "utf8")) : { bridges: {} };

// The port is dependency-free by construction (W02 hard constraint: lib/engine
// must not import from client/ or server/), which is what lets a plain-node gate
// load it directly under Node's type-stripping loader.
let port = null;
try {
  port = await import(pathToFileURL(PORT).href);
} catch (e) {
  reg(false, "engine-port-loadable", `${PORT} failed to load: ${e.message}`);
}

const register = existsSync(REGISTER) ? readFileSync(REGISTER, "utf8") : "";
// Only the TABLE ROWS count. Scanning the whole file would let the convention
// paragraph in the register's own header — which has to show what a token looks
// like — satisfy the check for a token whose real row was deleted. A token in
// prose is documentation; a token in a row is a registration.
const registerRows = register
  .split(/\r?\n/)
  .filter((l) => l.trimStart().startsWith("|"))
  .join("\n");
const registered = (token) => registerRows.includes(token);

if (port) {
  reg(true, "engine-port-loadable");
}

// ── A. structure of every frozen fixture ─────────────────────────────────────
const docs = [];
for (const file of goldenFiles) {
  const code = basename(file, ".json");
  let doc = null;
  try {
    doc = JSON.parse(readFileSync(join(GOLDEN_DIR, file), "utf8"));
  } catch (e) {
    reg(false, `${code}: parseable`, `corpus/golden/${file}: ${e.message}`);
    continue;
  }
  docs.push(doc);
  reg(typeof doc.schemaVersion === "string", `${code}: schemaVersion declared`, `missing schemaVersion`);
  reg(doc.bridgeCode === code, `${code}: bridgeCode matches filename`, `bridgeCode="${doc.bridgeCode}"`);
  const expect = doc.gateParityExpectation;
  reg(
    expect === "ASSERT" || expect === "SKIP",
    `${code}: gateParityExpectation declared`,
    `gateParityExpectation="${expect}" (must be ASSERT or SKIP)`,
  );

  if (expect === "ASSERT") {
    const keys = doc.baselinedKeys ?? [];
    const have = doc.baseline?.hydraulics ?? {};
    const complete = keys.length > 0 && keys.every((k) => typeof have[k] === "number");
    reg(
      complete && Object.keys(have).length === keys.length,
      `${code}: baseline complete for every baselined key`,
      `baselinedKeys=${keys.length} baselineKeys=${Object.keys(have).length} missing=[${keys.filter((k) => typeof have[k] !== "number")}]`,
    );
  } else if (expect === "SKIP") {
    reg(
      typeof doc.inputSnapshotGap === "string" && doc.inputSnapshotGap.length > 200,
      `${code}: SKIP carries a declared, owned reason`,
      "a SKIP without inputSnapshotGap would be a silent pass",
    );
  }
}

// ── B. coverage: the corpus must account for every oracle bridge ─────────────
const codes = Object.keys(oracle.bridges ?? {});
reg(codes.length > 0, "oracle declares at least one bridge", "corpus/oracle/GOLDEN-ORACLE.json has no bridges");
const fixtureCodes = new Set(docs.map((d) => d.bridgeCode));
for (const code of codes) {
  reg(fixtureCodes.has(code), `coverage: ${code} has a frozen fixture`, `corpus/golden/${code}.json missing`);
}
reg(
  docs.every((d) => codes.includes(d.bridgeCode)),
  "coverage: no fixture without an oracle entry",
  `unknown fixture(s): ${docs.filter((d) => !codes.includes(d.bridgeCode)).map((d) => d.bridgeCode)}`,
);
const asserted = docs.filter((d) => d.gateParityExpectation === "ASSERT");
reg(asserted.length > 0, "not vacuous: at least one fixture is actually asserted", "every fixture is SKIP");

// ── C. the actual parity assertion — engine output vs frozen baseline ────────
for (const doc of asserted) {
  // Rebuilt exactly as the fixture was frozen: parsed reference inputs, with the
  // UNAVAILABLE fields taken from DEFAULT_HYDRAULIC. Declared in the fixture.
  const inputs = {
    ...port.DEFAULT_HYDRAULIC,
    ...doc.inputs.hydraulics,
    crossSectionalArea: undefined,
    perimeter: undefined,
  };
  const r = port.computeHydraulics(inputs);
  const frozen = doc.baseline.hydraulics;
  for (const key of doc.baselinedKeys) {
    const want = frozen[key];
    const got = r[key];
    const tol = RTOL * Math.max(1, Math.abs(want));
    const ok = typeof got === "number" && Math.abs(got - want) <= tol;
    reg(
      ok,
      `${doc.bridgeCode}: ${key} == frozen baseline (rtol ${RTOL})`,
      `${key}: computed ${num(got)} vs frozen ${num(want)} (|Δ| ${
        typeof got === "number" ? Math.abs(got - want).toExponential(3) : "n/a"
      }, tol ${tol.toExponential(3)})`,
    );
  }
}

// ── D. nothing measured may be absorbed silently ─────────────────────────────
for (const doc of docs) {
  // A whole-bridge token `[CODE/*]` subsumes the per-quantity tokens: when the
  // fixture has no usable input at all, the per-quantity deltas are consequences
  // of that one cause and do not need their own register rows.
  const wholeBridge = registered(`[${doc.bridgeCode}/*]`);
  if (doc.gateParityExpectation === "SKIP") {
    skips.push({ bridgeCode: doc.bridgeCode, reason: doc.inputSnapshotGap });
    reg(
      wholeBridge,
      `${doc.bridgeCode}: SKIP is registered in SOURCE-DEFECT-REGISTER.md`,
      `docs/phase-2/SOURCE-DEFECT-REGISTER.md has no token [${doc.bridgeCode}/*]`,
    );
  }
  for (const row of doc.oracleVsComputed ?? []) {
    parity.push({ bridgeCode: doc.bridgeCode, ...row });
    if (!row.within && !wholeBridge) {
      reg(
        registered(`[${doc.bridgeCode}/${row.label}]`),
        `${doc.bridgeCode}: measured ${row.label} delta is registered`,
        `relErr ${row.relErr.toExponential(3)} > rtol ${row.rtol.toExponential(3)} and ` +
          `SOURCE-DEFECT-REGISTER.md has no token [${doc.bridgeCode}/${row.label}]`,
      );
    }
  }
}

// ── E. the register itself is a real artefact, not an empty file ─────────────
reg(
  register.length > 200 && register.includes("|"),
  "SOURCE-DEFECT-REGISTER.md exists and is a populated table",
  `${REGISTER} is missing or degenerate`,
);

// ── report ───────────────────────────────────────────────────────────────────
const result = {
  name: GATE_NAME,
  ts: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? "local",
  pass: pass.length,
  fail: fail.length,
  skipped: skips.length,
  egress: "none",
  detail: [...pass.map((p) => ({ ...p, verdict: "PASS" })), ...fail.map((f) => ({ ...f, verdict: "FAIL" }))],
};
writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));

console.log(`gate-parity: ${asserted.length} asserted, ${skips.length} skipped of ${docs.length} frozen fixtures`);
for (const s of skips) console.log(`  SKIP ${s.bridgeCode}: ${s.reason.slice(0, 120)}…`);
if (parity.length) {
  console.log("  oracle vs computed (measured):");
  for (const p of parity) {
    console.log(
      `    ${p.bridgeCode} ${p.label}: computed ${num(p.computed)} vs oracle ${num(p.oracle)} ` +
        `relErr ${p.relErr.toExponential(3)} (rtol ${p.rtol.toExponential(3)}) ${p.within ? "OK" : "OUT"}`,
    );
  }
}
for (const f of fail) console.log(`  FAIL ${f.check}: ${f.error}`);

const ok = fail.length === 0;
console.log(`GATE ${GATE_NAME}: ${ok ? "PASS" : "FAIL"} ${pass.length + fail.length} assertions`);
process.exit(ok ? 0 : 1);
