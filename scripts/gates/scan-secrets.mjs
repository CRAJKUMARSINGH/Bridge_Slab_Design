// scan:secrets — P2-W04 (T4.3).
//
// Scans git-tracked source/config for hardcoded credential patterns using `git grep`
// (C-fast, binary-aware) so the whole-tree scan stays well inside the 10 s harness
// timeout. Three bulk *binary* corpora — `assets/`, `Attached_Assets/` and
// `reference-design-examples/` — are excluded by explicit pathspec and asserted to be
// present, so the exclusion is declared rather than silent. Everything else tracked,
// including `archive/`, `docs/` and `sample/`, is searched.
//
// This is a working-tree scanner (like the 2026-10-12 regex audit it replaces); it does
// NOT scan git history. Installing a history scanner is a residual `(W04)` item recorded
// in docs/phase-2/SECURITY.md.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE scan-secrets: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/scan-secrets.json
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const GATE_NAME = "scan-secrets";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..");
const outDir = join(scriptDir, ".out");
mkdirSync(outDir, { recursive: true });

const result = { name: GATE_NAME, ts: new Date().toISOString(), commit: null, pass: 0, fail: 0, detail: [] };
const record = (ok, label, note) => {
  if (ok) result.pass += 1;
  else result.fail += 1;
  result.detail.push({ ok, label, note: note ?? null });
};

/** Credential patterns in POSIX ERE (git grep -E). */
const ERE_PATTERNS = [
  { id: "aws-access-key", re: "AKIA[0-9A-Z]{16}" },
  { id: "private-key-pem", re: "-----BEGIN [A-Z ]*PRIVATE KEY-----" },
  { id: "github-token", re: "gh[pousr]_[A-Za-z0-9]{36,}" },
  { id: "google-api-key", re: "AIza[0-9A-Za-z_-]{35}" },
  { id: "slack-token", re: "xox[baprs]-[0-9A-Za-z-]{10,}" },
  { id: "stripe-live-key", re: "sk_live_[0-9A-Za-z]{24,}" },
  {
    id: "assigned-credential",
    re: "(secret|passwd|password|api[_-]?key|access[_-]?token|auth[_-]?token)[[:space:]]*[:=][[:space:]]*[\"'][A-Za-z0-9_./+-]{16,}[\"']",
  },
];

// Bulk binary corpora: no source, only images/workbooks/PDFs. Excluding them keeps the
// scan under the harness timeout; the assertion below proves they are present on disk.
const EXCLUDED_CORPORA = ["assets", "Attached_Assets", "reference-design-examples"];
const EXCLUDES = [
  ...EXCLUDED_CORPORA.map((dir) => `:(exclude)${dir}/**`),
  ":(exclude)scripts/gates/scan-secrets.mjs",
];

/** Run `git grep`; returns { code, out }. code 0 = matches, 1 = no match, >1 = error. */
function grep(paths, patterns, opts = {}) {
  const args = [
    "grep",
    "--no-color",
    "-I", // skip binary files
    "-n", // line numbers
    "-E",
    ...patterns.map((p) => ["-e", p.re]).flat(),
    ...(opts.untracked ? ["--untracked"] : []),
    "--",
    ...paths,
  ];
  try {
    return { code: 0, out: execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }) };
  } catch (err) {
    return { code: err.status ?? -1, out: (err.stdout ?? "").toString() };
  }
}

function main() {
  // ── A. the repo is scannable ───────────────────────────────────────────────
  let tracked = [];
  try {
    tracked = execFileSync("git", ["ls-files", "-z", "--full-name"], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
      .split("\0")
      .filter(Boolean);
  } catch (err) {
    record(false, "git ls-files is readable", String(err?.message ?? err));
    return finish();
  }
  record(tracked.length > 0, "git ls-files returns tracked files", `${tracked.length} files`);
  const missing = EXCLUDED_CORPORA.filter((dir) => !existsSync(join(repoRoot, dir)));
  record(missing.length === 0, "excluded corpora exist on disk (exclusion is declared, not silent)", missing.length ? `missing: ${missing.join(", ")}` : EXCLUDED_CORPORA.join(", "));

  // ── B. no credential pattern in the scanned tree ───────────────────────────
  const scan = grep([".", ...EXCLUDES], ERE_PATTERNS);
  if (scan.code > 1) {
    record(false, "git grep ran", `git grep exited ${scan.code}`);
    return finish();
  }
  const hits = scan.out.trim().length > 0 ? scan.out.trim().split("\n") : [];
  record(
    hits.length === 0,
    "no credential pattern in tracked source/config",
    hits.length === 0
      ? `clean (excluded binary corpora: ${EXCLUDED_CORPORA.join(", ")})`
      : hits.slice(0, 8).join(" | "),
  );

  // ── C. non-vacuity: the same engine must flag a synthetic canary ───────────
  // The canary is written inside the repo and scanned with `git grep --untracked`
  // (git grep refuses paths outside the work tree), then removed in `finally`.
  const canaryRel = "canary-scan-secrets.tmp";
  const canaryPath = join(repoRoot, canaryRel);
  try {
    writeFileSync(canaryPath, "const accessKeyId = 'AKIAIOSFODNN7EXAMPLE';\n", "utf8");
    const canary = grep([canaryRel], [{ id: "canary", re: ERE_PATTERNS[0].re }], { untracked: true });
    record(canary.code === 0 && canary.out.includes("AKIAIOSFODNN7EXAMPLE"), "scanner is non-vacuous (git grep detects a synthetic canary)", canary.code === 0 ? "matched" : `git grep exit ${canary.code}`);
  } finally {
    rmSync(canaryPath, { force: true });
  }

  return finish();
}

function finish() {
  writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));
  const verdict = result.fail === 0 ? "PASS" : "FAIL";
  console.log(`GATE ${GATE_NAME}: ${verdict} ${result.pass + result.fail} assertions`);
  for (const d of result.detail) {
    if (!d.ok) console.log(`  FAIL ${d.label}${d.note ? ` — ${d.note}` : ""}`);
  }
  process.exit(result.fail === 0 ? 0 : 1);
}

main();
