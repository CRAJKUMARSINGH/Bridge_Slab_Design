// gate:security — P2-W04.
//
// Behavioural + structural assertions over the dependency-free hardening module
// (server/security.ts) and the code that consumes it (server/app-factory.ts,
// server/api-routes.ts, server/excel-parser.ts).
//
// The gate loads server/security.ts directly under Node's native type-stripping, so
// the assertions run the *shipping* code rather than a copy of it. No express tree is
// required because the hardening module imports nothing.
//
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-security: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-security.json
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GATE_NAME = "gate-security";
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

function read(rel) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

/** Every source file under a directory (skips node_modules / dotdirs). */
function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

const REQUIRED_HEADERS = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "X-XSS-Protection",
  "Referrer-Policy",
  "Content-Security-Policy",
];

async function main() {
  // ── A. Headers are declared and applied ────────────────────────────────────
  const securitySrc = read("server/security.ts");
  for (const header of REQUIRED_HEADERS) {
    const line = securitySrc.split("\n").find((l) => l.includes(`'${header}'`));
    record(Boolean(line) && /'[^']+':/.test(line ?? ""), `A: header declared — ${header}`, line?.trim() ?? "absent");
  }

  // ── B. Structural wiring in the consumed code ──────────────────────────────
  const appFactorySrc = read("server/app-factory.ts");
  record(/securityHeaders\s*\(\)/.test(appFactorySrc), "B: app-factory applies securityHeaders()");
  record(/buildErrorPayload\s*\(/.test(appFactorySrc), "B: app-factory error handler uses buildErrorPayload");
  record(/resolveCorsOrigin\s*\(/.test(appFactorySrc), "B: app-factory uses resolveCorsOrigin");
  record(
    /jsonUpload/.test(appFactorySrc) && /upload-excel/.test(appFactorySrc),
    "B: upload route gets its own body parser (U-1: 10 MB ceiling reachable)",
  );

  const apiRoutesSrc = read("server/api-routes.ts");
  record(/validateUpload\s*\(/.test(apiRoutesSrc), "B: upload route calls validateUpload");
  record(/guardProxyUrl\s*\(/.test(apiRoutesSrc), "B: slabdraw proxy calls guardProxyUrl (KERO-005)");

  // ── C. No stack leak outside the guarded helper ────────────────────────────
  const stackOffenders = [];
  for (const file of walk(join(repoRoot, "server"))) {
    const rel = relative(repoRoot, file).replace(/\\/g, "/");
    if (rel === "server/security.ts") continue; // the one place allowed to attach a stack
    const src = readFileSync(file, "utf8");
    if (/stack\s*:/.test(src) || /\.stack\b/.test(src)) {
      // pier-case-engine's `stack` is a DFS worklist, not an error stack.
      if (rel === "server/pier-case-engine.ts") continue;
      stackOffenders.push(rel);
    }
  }
  record(stackOffenders.length === 0, "C: no stack trace attached outside server/security.ts", stackOffenders.join(", ") || "clean");

  // ── D. Behavioural assertions against the shipping module ──────────────────
  let mod;
  try {
    mod = await import(pathToFileURL(join(repoRoot, "server", "security.ts")).href);
  } catch (err) {
    record(false, "D: server/security.ts loads (type-stripping)", String(err?.message ?? err));
    return finish();
  }
  record(true, "D: server/security.ts loads (type-stripping)");

  // D1 headers applied to a response sink
  const sink = { headers: {}, setHeader(name, value) { this.headers[name] = value; } };
  mod.applySecurityHeaders(sink);
  for (const header of REQUIRED_HEADERS) {
    const value = sink.headers[header];
    record(typeof value === "string" && value.length > 0, `D1: applySecurityHeaders sets ${header}`, value ?? "missing");
  }

  // D2 no stack in production; stack only in development
  const boom = Object.assign(new Error("boom"), { stack: "Error: boom\n  at x" });
  const prod = mod.buildErrorPayload(boom, "production");
  const dev = mod.buildErrorPayload(boom, "development");
  record(prod.body.stack === undefined, "D2: production error payload omits stack");
  record(prod.body.error === "boom" && prod.status === 500, "D2: production error payload keeps message + status");
  record(typeof dev.body.stack === "string", "D2: development error payload includes stack");

  // D3 CORS
  record(mod.resolveCorsOrigin("", "production") === false, "D3: production + empty origins denies");
  record(JSON.stringify(mod.resolveCorsOrigin("https://a.example", "production")) === '["https://a.example"]', "D3: production + list returns the list");
  record(mod.resolveCorsOrigin("", "development") === true, "D3: development + empty origins reflects origin");
  let wildcardThrew = false;
  try { mod.resolveCorsOrigin("*", "production"); } catch { wildcardThrew = true; }
  record(wildcardThrew, "D3: production + wildcard is refused (throws)");

  // D4 upload guard
  const empty = mod.validateUpload(undefined, "application/vnd.ms-excel");
  record(empty.ok === false && empty.status === 400, "D4: missing upload -> 400");
  const badMime = mod.validateUpload(Buffer.from("x").toString("base64"), "text/plain");
  record(badMime.ok === false && badMime.status === 415, "D4: disallowed MIME -> 415");
  const zipB64 = Buffer.from([0x50, 0x4b, 0x03, 0x04]).toString("base64");
  const okZip = mod.validateUpload(zipB64, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  record(okZip.ok === true, "D4: valid zip + allowed MIME -> ok");
  const notZip = mod.validateUpload(Buffer.from("not a zip").toString("base64"), "application/vnd.ms-excel");
  record(notZip.ok === false && notZip.status === 400, "D4: magic-byte mismatch -> 400");
  const huge = "A".repeat(mod.MAX_UPLOAD_BASE64_CHARS + 4);
  const tooBig = mod.validateUpload(huge, "application/vnd.ms-excel");
  record(tooBig.ok === false && tooBig.status === 413, "D4: oversize base64 -> 413");

  // D5 proxy guard (KERO-005)
  let ssrfThrew = false;
  try { mod.guardProxyUrl("http://169.254.169.254/latest", "production"); } catch { ssrfThrew = true; }
  record(ssrfThrew, "D5: production blocks metadata address");
  let loopbackThrew = false;
  try { mod.guardProxyUrl("http://localhost:8000", "production"); } catch { loopbackThrew = true; }
  record(loopbackThrew, "D5: production blocks loopback");
  record(mod.guardProxyUrl("http://localhost:8000", "development") === "http://localhost:8000", "D5: development allows loopback (SlabDraw default)");
  let schemeThrew = false;
  try { mod.guardProxyUrl("ftp://evil.example", "development"); } catch { schemeThrew = true; }
  record(schemeThrew, "D5: non-http(s) scheme refused");

  // ── E. RBAC matrix + secret inventory present in SECURITY.md ───────────────
  const securityMd = read("docs/phase-2/SECURITY.md");
  for (const role of ["viewer", "engineer", "reviewer", "admin"]) {
    record(new RegExp(`\\b${role}\\b`, "i").test(securityMd), `E: SECURITY.md names role — ${role}`);
  }
  record(/secret inventory/i.test(securityMd), "E: SECURITY.md has a secret inventory");
  record(/rotation/i.test(securityMd), "E: secret inventory documents rotation");
  record(/owner/i.test(securityMd), "E: secret inventory documents owner");

  return finish();
}

function finish() {
  writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));
  const verdict = result.fail === 0 ? "PASS" : "FAIL";
  console.log(`GATE ${GATE_NAME}: ${verdict} ${result.pass + result.fail} assertions`);
  for (const d of result.detail) {
    if (!d.ok) console.log(`  FAIL ${d.label}${d.note ? ` — ${d.note}` : ""}`);
  }
  // Do NOT call process.exit(): this gate dynamically imports a `.ts` module under
  // Node type-stripping, and a forced exit races the ESM-loader async handle on
  // Windows (libuv `UV_HANDLE_CLOSING` assertion, exit 0xC0000409). Setting the
  // exit code lets the loop drain cleanly and still yields the same status.
  process.exitCode = result.fail === 0 ? 0 : 1;
}

main().catch((err) => {
  record(false, "gate crashed", String(err?.stack ?? err));
  finish();
});
