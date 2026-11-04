// verify:clauses — W03 (T3.2) gate. Clause coverage & source-defect traceability.
//
// WHAT THIS GATE IS (and is not)
// ------------------------------
// `contracts.ts` has carried the sentence "verify:clauses fails if any codeRef is
// unregistered" since W02, with nothing behind it. This gate is that promise made
// executable. It enforces exactly two things and says plainly what it does not do:
//
//   A. NO ORPHAN CITATION. Every clause citation token under `lib/engine/src` must
//      resolve to a `CLAUSE_REGISTRY` entry. The engine cites clauses in prose
//      comments ("IRC:6 Cl.208", "IS 456:2000 Table 21") where nothing could check
//      them; this turns those citations into a scanned, falsifiable surface. A new
//      unregistered citation turns the gate RED naming the file and the token.
//
//   B. EVERY CITED CLAUSE HAS AN IMPLEMENTING TEST. Each registry entry names the
//      module that cites it, the verbatim citation strings, and the test file that
//      must name `[<id>]`. The gate asserts the module exists and carries the
//      citation verbatim, and that the test names the clause id.
//
// It does NOT judge whether the clause number is the *correct* clause for the
// quantity, nor whether the implementing test asserts the right numeric value.
// Those are review obligations (V-03), not something a string scan can settle. The
// residual is recorded in docs/phase-2/week-03/CLAUSE-COVERAGE.md rather than hidden.
//
// SCOPE. The scan root is `lib/engine/src` — the package the CheckResult.codeRef
// contract lives in. It deliberately does NOT scan `bridge-excel-generator/**` (the
// ADR-0013 byte-locked authoritativeEngine) or `client/src/report-engine/lib/**`
// (the parity source): those are separate surfaces owned by gate:contracts and
// gate:parity, and a clause gate has no business rewriting their comments.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE verify-clauses: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/verify-clauses.json
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GATE_NAME = "verify-clauses";
const dir = dirname(fileURLToPath(import.meta.url));
const repo = join(dir, "..", "..");
const outDir = join(dir, ".out");
mkdirSync(outDir, { recursive: true });

const pass = [];
const fail = [];
const reg = (ok, check, error) =>
  (ok ? pass : fail).push(ok ? { check, verdict: "PASS" } : { check, error, verdict: "FAIL" });

// A green gate over an empty scan is a silent pass. The root holds ~20 `.ts` files;
// five is a floor that cannot be met by a broken walk.
const MIN_SCANNED_FILES = 5;

/**
 * Blank the CONTENTS of '...' and "..." string literals, preserving length and any
 * newline, so a citation stored as data (this registry's own `citations: [...]`) or
 * shown as a syntax example (`contracts.ts`'s `"IRC:6-2017 cl.214.3"`) is not read
 * as a live citation. Comment text is left intact — that is where the engine's real
 * citations live.
 */
function blankStringContents(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      out += c;
      i += 1;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") {
          out += "  ";
          i += 2;
          continue;
        }
        out += src[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      if (i < src.length) {
        out += c;
        i += 1;
      }
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

/** Walk `root` for `.ts` files, recursively, POSIX-relative paths, sorted. */
function walkTs(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name.endsWith(".ts")) out.push(p);
    }
  }
  return out.sort();
}

const posixRel = (p) => relative(repo, p).split("\\").join("/");

// ── A. load the registry ─────────────────────────────────────────────────────
let REG = null;
let loadError = "";
try {
  REG = await import(pathToFileURL(join(repo, "lib/engine/src/clause-registry.ts")).href);
} catch (e) {
  loadError = e instanceof Error ? e.message : String(e);
}

reg(
  REG !== null,
  "clause-registry.ts loads under plain Node (type-stripped)",
  `import failed: ${loadError}`,
);
const registry = Array.isArray(REG?.CLAUSE_REGISTRY) ? REG.CLAUSE_REGISTRY : [];
const REG_IDS = Array.isArray(REG?.REGISTERED_CLAUSE_IDS) ? REG.REGISTERED_CLAUSE_IDS : [];
reg(registry.length > 0, "clause-registry declares at least one clause", "CLAUSE_REGISTRY is empty");

// ── A. scan the tree for citations ───────────────────────────────────────────
const scanRoot = REG?.CLAUSE_SCAN_ROOT ?? "lib/engine/src";
const absRoot = join(repo, scanRoot);
reg(existsSync(absRoot), `scan root ${scanRoot} exists`, `${absRoot} not found`);

const files = existsSync(absRoot) ? walkTs(absRoot) : [];
reg(
  files.length >= MIN_SCANNED_FILES,
  `scan covers at least ${MIN_SCANNED_FILES} source files (not vacuous)`,
  `only ${files.length} .ts file(s) under ${scanRoot}`,
);

const orphans = [];
let citations = 0;
if (REG) {
  for (const f of files) {
    const src = blankStringContents(readFileSync(f, "utf8"));
    const re = new RegExp(REG.CLAUSE_TOKEN_PATTERN, "g");
    for (const m of src.matchAll(re)) {
      citations += 1;
      const id = REG.normaliseClauseToken(m[1], m[2]);
      if (!REG_IDS.includes(id)) orphans.push(`${posixRel(f)}: "${m[0].trim()}" -> ${id} (unregistered)`);
    }
  }
}
reg(citations > 0, "the scan finds at least one citation (not vacuous)", "no clause tokens matched");
reg(
  orphans.length === 0,
  "no orphan citation: every token under the scan root resolves to the registry",
  `${orphans.length} orphan citation(s):\n    ${orphans.slice(0, 20).join("\n    ")}`,
);

// ── B. per-entry: module, verbatim citations, and an implementing test ───────
for (const c of registry) {
  const id = c?.id ?? "(no id)";

  reg(
    typeof c?.id === "string" && /^(IRC|IS|SP):\d{1,4}$/.test(c.id),
    `entry ${id}: id is well-formed [KIND:number]`,
    `id "${id}" does not match KIND:number`,
  );

  const modules = Array.isArray(c?.modules) ? c.modules : [];
  const missingModules = modules.filter((m) => !existsSync(join(repo, m)));
  reg(
    modules.length > 0 && missingModules.length === 0,
    `entry ${id}: declares modules that exist`,
    missingModules.length ? `missing: ${missingModules.join(", ")}` : `entry ${id} declares no modules`,
  );

  // Each verbatim citation must appear in one of the entry's declared modules.
  const moduleText = modules
    .filter((m) => existsSync(join(repo, m)))
    .map((m) => readFileSync(join(repo, m), "utf8"))
    .join("\n");
  const citations0 = Array.isArray(c?.citations) ? c.citations : [];
  const unmatched = citations0.filter((s) => !moduleText.includes(s));
  reg(
    citations0.length > 0 && unmatched.length === 0,
    `entry ${id}: every verbatim citation appears in a declared module`,
    unmatched.length
      ? `not found in modules: ${unmatched.map((s) => JSON.stringify(s)).join(", ")}`
      : `entry ${id} declares no citations`,
  );

  // The implementing test must exist AND name the clause as [<id>].
  const testFile = c?.testFile ?? "";
  const testAbs = join(repo, testFile);
  const testExists = testFile !== "" && existsSync(testAbs);
  const namesId = testExists && readFileSync(testAbs, "utf8").includes(`[${id}]`);
  reg(
    testExists && namesId,
    `entry ${id}: implementing test ${testFile} exists and names [${id}]`,
    !testExists
      ? `test file "${testFile}" not found`
      : `test ${testFile} does not contain the token [${id}]`,
  );
}

// ── report ───────────────────────────────────────────────────────────────────
const total = pass.length + fail.length;
const result = {
  name: GATE_NAME,
  ts: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? "local",
  pass: pass.length,
  fail: fail.length,
  assertions: total,
  scannedFiles: files.length,
  citations,
  detail: [...pass, ...fail],
};
writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));

console.log(
  `verify-clauses: ${registry.length} registered clauses, ${citations} citations in ${files.length} files, ${orphans.length} orphan(s)`,
);
for (const f of fail) console.log(`  FAIL ${f.check}: ${f.error}`);

const ok = fail.length === 0;
console.log(`GATE ${GATE_NAME}: ${ok ? "PASS" : "FAIL"} ${total} assertions`);
process.exit(ok ? 0 : 1);
