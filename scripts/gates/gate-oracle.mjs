// gate:oracle — corpus provenance + GOLDEN-ORACLE reachability & completeness.
//
// WHAT THIS GATE IS (and is not)
// -----------------------------
// It enforces the two things the whole of Phase 2 rests on, and nothing more:
//
//   1. PROVENANCE. Every workbook frozen in corpus/raw/manifest.json is re-hashed
//      here (sha256 + byte length) and must still match the manifest. If a corpus
//      byte changes, the gate goes RED naming the file and both hashes. This is
//      what makes "every extracted number carries a sha256 of the source"
//      verifiable rather than aspirational.
//
//   2. REACHABILITY & COMPLETENESS of corpus/oracle/GOLDEN-ORACLE.json. Every
//      oracle bridge must resolve to a real corpus file — by bridge code, by its
//      declared `sourceFile`, and by that name being one of the manifest's
//      `fileName`s — and every frozen value must carry the provenance T2A.4
//      requires: quantity, value, unit, sheet, source CELL, and a tolerance drawn
//      from the frozen category set.
//
// It does NOT re-extract the workbooks. That is T2A.3's emit-oracle.ts, a `.ts`
// script needing tsx + xlsx, which does not run in every checkout. So a green
// gate means "the corpus is the corpus the manifest says it is, and the oracle is
// fully referenced against it" — NOT "the oracle values are numerically right".
// Numeric agreement is W06A/W07A/W09A's job (T6A.11 extends this gate then).
//
// The completeness assertions are part of THIS gate on purpose: while
// GOLDEN-ORACLE.json still lacks source cells and sits below the freeze floor it
// must be RED, never quietly green. A gate that can pass while the deliverable it
// guards is half-written is a silent pass.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-oracle: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-oracle.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const GATE_NAME = "gate-oracle";
const dir = dirname(fileURLToPath(import.meta.url));
const repo = join(dir, "..", "..");
const outDir = join(dir, ".out");
mkdirSync(outDir, { recursive: true });

const RAW_DIR = join(repo, "corpus", "raw");
const MANIFEST = join(RAW_DIR, "manifest.json");
const ORACLE = join(repo, "corpus", "oracle", "GOLDEN-ORACLE.json");

// The frozen tolerance bands. Editing GOLDEN-ORACLE.json.toleranceCategories
// without a reviewed change to this constant turns the gate RED by design — a
// band may never be widened to close a gap.
const CANONICAL_TOLERANCES = { ARITH: 1e-6, ROUNDED: 1e-4, HAND: 2e-2 };
// T2A.4's freeze floor (exit gate: "48+ entries").
const MIN_VALUES = 48;
// The provenance every frozen value must carry (T2A.4: value + unit + cell + tol).
const REQUIRED_FIELDS = ["q", "v", "u", "sheet", "cell", "tol"];

const pass = [];
const fail = [];
const reg = (ok, check, detail) => (ok ? pass : fail).push({ check, ...(ok ? {} : { error: detail }) });
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
const readJson = (p) => {
  try {
    return { value: JSON.parse(readFileSync(p, "utf8")) };
  } catch (e) {
    return { error: e.message };
  }
};

// ── A. corpus provenance: re-hash every frozen workbook ──────────────────────
const manifestRead = existsSync(MANIFEST) ? readJson(MANIFEST) : { error: "missing" };
const manifest = manifestRead.value ?? null;
reg(manifest !== null, "corpus/raw/manifest.json present and parseable", `${MANIFEST}: ${manifestRead.error ?? ""}`);

const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
reg(entries.length > 0, "manifest declares at least one corpus entry", "entries[] is empty");

let hashed = 0;
for (const entry of entries) {
  const code = entry.bridgeCode ?? "(no bridgeCode)";
  reg(isNonEmptyString(entry.bridgeCode), `corpus: ${code} declares a bridgeCode`, "entry has no bridgeCode");
  reg(
    isNonEmptyString(entry.sha256) && /^[0-9a-f]{64}$/.test(entry.sha256),
    `corpus: ${code} declares a sha256`,
    `sha256="${entry.sha256}"`,
  );

  const rel = entry.relativePath ?? entry.fileName ?? "";
  const abs = join(RAW_DIR, rel);
  if (!existsSync(abs)) {
    reg(false, `corpus: ${code} bytes present at corpus/raw/${rel}`, `${abs} not found`);
    continue;
  }
  const bytes = readFileSync(abs);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  reg(
    sha256 === entry.sha256,
    `corpus: ${code} sha256 matches manifest`,
    `${rel}: on disk ${sha256} vs manifest ${entry.sha256}`,
  );
  reg(
    bytes.length === entry.bytes,
    `corpus: ${code} byte length matches manifest`,
    `${rel}: on disk ${bytes.length} vs manifest ${entry.bytes}`,
  );
  hashed += 1;
}

// ── B. oracle present; the frozen tolerance bands must not drift ─────────────
const oracleRead = existsSync(ORACLE) ? readJson(ORACLE) : { error: "missing" };
const oracle = oracleRead.value ?? null;
reg(oracle !== null, "corpus/oracle/GOLDEN-ORACLE.json present and parseable", `${ORACLE}: ${oracleRead.error ?? ""}`);

const tc = oracle?.toleranceCategories ?? {};
const sameBands =
  JSON.stringify(Object.keys(tc).sort()) === JSON.stringify(Object.keys(CANONICAL_TOLERANCES).sort()) &&
  Object.keys(CANONICAL_TOLERANCES).every((k) => tc[k] === CANONICAL_TOLERANCES[k]);
reg(
  sameBands,
  "toleranceCategories match the frozen bands (ARITH 1e-6 / ROUNDED 1e-4 / HAND 2e-2)",
  `oracle has ${JSON.stringify(tc)} — a band may not be widened to close a gap`,
);

// ── C. reachability: every oracle bridge resolves to a corpus file ───────────
const byCode = new Map(entries.map((e) => [e.bridgeCode, e]));
const fileNames = new Set(entries.map((e) => e.fileName));
const bridges = oracle?.bridges && typeof oracle.bridges === "object" ? oracle.bridges : {};
const codes = Object.keys(bridges);
reg(codes.length > 0, "oracle declares at least one bridge (not vacuous)", "bridges{} is empty");

let valueCount = 0;
for (const code of codes) {
  const b = bridges[code] ?? {};
  const entry = byCode.get(code);
  reg(entry !== undefined, `reach: ${code} has a corpus entry`, `corpus/raw/manifest.json has no bridgeCode "${code}"`);
  reg(
    entry === undefined || b.sourceFile === entry.fileName,
    `reach: ${code} sourceFile resolves to its corpus file`,
    `oracle sourceFile "${b.sourceFile}" != manifest fileName "${entry?.fileName}"`,
  );
  reg(
    isNonEmptyString(b.sourceFile) && fileNames.has(b.sourceFile),
    `reach: ${code} sourceFile names a frozen corpus file`,
    `"${b.sourceFile}" is not among the ${fileNames.size} manifest fileNames`,
  );

  const values = Array.isArray(b.values) ? b.values : [];
  reg(values.length > 0, `reach: ${code} declares at least one value`, "values[] is empty");
  valueCount += values.length;

  // ── D. completeness: every value carries its full provenance ───────────────
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i] ?? {};
    const label = `${code}[${i}] ${v.q ?? "?"}`;
    const missing = REQUIRED_FIELDS.filter((f) => v[f] === undefined || v[f] === null || v[f] === "");
    reg(
      missing.length === 0,
      `value: ${label} carries all required provenance fields`,
      `missing [${missing.join(", ")}] (need ${REQUIRED_FIELDS.join(", ")})`,
    );
    reg(
      typeof v.v === "number" && Number.isFinite(v.v),
      `value: ${label} v is a finite number`,
      `v=${JSON.stringify(v.v)}`,
    );
    reg(
      isNonEmptyString(v.cell),
      `value: ${label} names its source cell`,
      `cell=${JSON.stringify(v.cell)} — T2A.4 requires a source cell on every entry`,
    );
    reg(
      Object.prototype.hasOwnProperty.call(tc, v.tol),
      `value: ${label} tolerance is a frozen category`,
      `tol="${v.tol}" is not one of [${Object.keys(tc).join(", ")}]`,
    );
  }
}

// ── E. the freeze floor (exit gate: "48+ entries") ───────────────────────────
reg(
  valueCount >= MIN_VALUES,
  `oracle holds >= ${MIN_VALUES} frozen values`,
  `found ${valueCount} — GOLDEN-ORACLE.json is not yet frozen (T2A.4)`,
);

// ── report ───────────────────────────────────────────────────────────────────
const result = {
  name: GATE_NAME,
  ts: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? "local",
  pass: pass.length,
  fail: fail.length,
  skipped: 0,
  egress: "none",
  detail: [...pass.map((p) => ({ ...p, verdict: "PASS" })), ...fail.map((f) => ({ ...f, verdict: "FAIL" }))],
};
writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));

console.log(
  `gate-oracle: ${hashed}/${entries.length} corpus hashes verified, ${codes.length} bridges, ${valueCount} oracle values`,
);
for (const f of fail) console.log(`  FAIL ${f.check}: ${f.error}`);

const ok = fail.length === 0;
console.log(`GATE ${GATE_NAME}: ${ok ? "PASS" : "FAIL"} ${pass.length + fail.length} assertions`);
process.exit(ok ? 0 : 1);
