# Security Audit Report
**Project:** Bridge Slab Design  
**Date:** 2026-10-12  
**Auditor:** Kiro AI (automated)  
**Scope:** Python dependencies · Node/pnpm dependencies · Secrets scan · TypeScript strict check · npm audit

---

## Executive Summary

| Check | Status | Finding |
|---|---|---|
| Python pip-audit | ✅ PASS | No known vulnerabilities in `requirements.txt` |
| Node pnpm audit | ❌ FAIL | **31 vulnerabilities** — 19 High, 9 Moderate, 3 Low |
| Secrets scan (TruffleHog substitute) | ✅ PASS | No hardcoded credentials found; `.env` correctly in `.gitignore` |
| TypeScript strict check | ⚠️ PARTIAL | `strict: false` — 3 flags disabled; 0 type errors at current config |
| npm audit | ⚠️ N/A | Requires `package-lock.json`; project uses pnpm — covered by pnpm audit above |

---

## 1. Python Dependency Audit (`pip-audit`)

```
pip-audit -r requirements.txt
Result: No known vulnerabilities found
```

**Status: ✅ PASS**  
All Python packages in `requirements.txt` are clean against the OSV/PyPI advisory databases.

---

## 2. Node Dependency Audit (`pnpm audit`)

**Total deps scanned:** 657  
**Vulnerabilities:** 19 High · 9 Moderate · 3 Low · 0 Critical

### 🔴 HIGH Severity (19)

#### `xlsx` v0.18.5 — **CRITICAL RISK, NO FIX ON npm**
| CVE | Title | CVSS |
|---|---|---|
| CVE-2023-30533 | Prototype Pollution in SheetJS | 7.8 |
| CVE-2024-22363 | ReDoS (Regular Expression DoS) | 7.5 |

**Impact:** Prototype pollution allows attackers to inject properties into Object.prototype via malicious spreadsheet files. ReDoS can block the event loop.  
**Fix:** The `xlsx` npm package is **abandoned**. No patched version is available on npm. Migrate to [`exceljs`](https://www.npmjs.com/package/exceljs) (already a dependency) or download from https://cdn.sheetjs.com/ (v0.20.2+).  
**Action Required: REPLACE `xlsx` dependency.**

---

#### `brace-expansion` — Multiple versions affected
| Version | CVE | Fix |
|---|---|---|
| v1.1.18 | CVE-2026-102276, CVE-2026-102278, CVE-2026-102277 | Upgrade to ≥1.1.21 |
| v2.1.4 | CVE-2026-102276, CVE-2026-102278, CVE-2026-102277 | Upgrade to ≥2.1.7 |
| v5.0.8 | CVE-2026-69152, CVE-2026-102276, CVE-2026-102278, CVE-2026-102277 | Upgrade to ≥5.0.11 |

**Impact:** Stack-exhaustion and CPU DoS via deeply nested or malformed brace patterns.  
**Fix:** Run `pnpm update brace-expansion` — transitive, usually auto-resolved.

---

#### `fast-uri` v3.1.4 — Multiple SSRF/Host Confusion CVEs
| CVE | Title | Fix |
|---|---|---|
| CVE-2026-18446 | Host confusion via backslash authority introducer | ≥3.1.5 |
| CVE-2026-75931 | Host confusion via skipped IDN canonicalization | ≥3.1.6 |
| CVE-2026-75975 | SSRF via malformed IPv6 normalization | ≥3.1.6 |
| CVE-2026-75899 | SSRF via repeated hostname percent-decoding | ≥3.1.6 |
| CVE-2026-76172 | Host confusion via percent-encoded scheme normalization | ≥3.1.6 |
| CVE-2026-84292 | Authority injection via unvalidated port in serialize | ≥3.1.7 |

**Impact:** URL parsing inconsistency allows SSRF and host allowlist bypass — attacker can direct requests to unintended hosts.  
**Fix:** `pnpm update fast-uri` — transitive dep of `ajv`/`orval`. Pin to ≥3.1.7.

---

#### `js-yaml` v4.3.0
| CVE | Title | Fix |
|---|---|---|
| CVE-2026-59870 | Quadratic CPU consumption in `!!omap` | ≥4.3.1 |
| CVE-2026-84375 | `maxTotalMergeKeys` bypass — CPU DoS | ≥4.3.2 |

**Impact:** Processing attacker-controlled YAML can exhaust CPU.  
**Fix:** `pnpm update js-yaml` to ≥4.3.2.

---

#### `nanoid` v3.3.16 — CVE-2026-67213
**Impact:** Custom generators with `size = 0` loop indefinitely.  
**Fix:** `pnpm update nanoid` to ≥3.3.18.

---

#### `braces` v3.0.3 — CVE-2026-93687
**Impact:** Stack exhaustion via deeply nested brace patterns (no fix on npm currently).  
**Path:** transitive. Monitor for patch.

---

### 🟡 MODERATE Severity (9)

| Package | Version | CVE | Fix |
|---|---|---|---|
| `uuid` | 8.3.2 | CVE-2026-41907 | ≥11.1.1 (major bump — breaking change) |
| `qs` | 6.15.3 | CVE-2026-82562 | ≥6.16.0 |
| `qs` | 6.15.3 | CVE-2026-82417 | ≥6.16.0 |
| `markdown-it` | 14.3.0 | — | ≥14.3.1 |
| `fast-uri` | 3.1.4 | CVE-2026-86472 | ≥3.1.8 |
| `brace-expansion` (×3 versions) | — | CVE-2026-102277 | see HIGH table |
| `fast-copy` | 4.0.4 | — | ≥4.1.0 |

**Notable:** `uuid` fix requires a major version jump (v8→v11). Check for breaking API changes before upgrading.

---

### 🟢 LOW Severity (3)

| Package | Version | Title | Fix |
|---|---|---|---|
| `esbuild` | 0.27.3 | Arbitrary file read via backslash path traversal (Windows **dev server** only) | ≥0.28.1 |
| `dompurify` | 3.4.13 | DOM XSS via `IN_PLACE` afterSanitize hook (armed handlers) | ≥3.4.16 |
| `dompurify` | 3.4.13 | DOM XSS via force-removed rawtext root | ≥3.4.16 |

**Note on `esbuild`:** Only affects `--serve` / dev server mode on Windows. Not exploitable in production builds. Still worth patching as this is a Windows dev machine.  
**Note on `dompurify`:** XSS risk applies only when using `IN_PLACE` sanitization mode. Upgrade regardless.

---

### Recommended pnpm fix commands

```bash
# Auto-fixable transitive deps
pnpm update brace-expansion fast-uri js-yaml nanoid qs markdown-it fast-copy esbuild dompurify

# Verify after update
pnpm audit

# xlsx requires manual migration — cannot be auto-fixed
# Replace xlsx with exceljs (already installed) or cdn.sheetjs.com build
```

---

## 3. Secrets Scan (TruffleHog substitute — regex scan)

> Note: TruffleHog and gitleaks were not installed. A manual regex scan was performed against all non-binary, non-vendor files covering: AWS keys, GitHub PATs, Google API keys, Slack tokens, private key PEM blocks, and JWT tokens.

**Patterns checked:**
- `AKIA[0-9A-Z]{16}` — AWS Access Key
- `-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY` — PEM private keys  
- `gh[pousr]_[A-Za-z0-9]{36}` — GitHub PAT
- `AIza[0-9A-Za-z-_]{35}` — Google API Key
- `xox[baprs]-[0-9A-Za-z-]{10,}` — Slack token

**Status: ✅ PASS**

- No hardcoded secrets found in source files, configs, or scripts.
- `.env` is correctly listed in `.gitignore` (covers `.env`, `.env.local`, `.env.production`, `.env.development`, `.env.test`).
- No real `.env` files with live credentials found on disk.

**Recommendation:** Install TruffleHog for full git-history scanning:
```bash
pip install trufflehog3
trufflehog3 --rules rules.yml .
```
Or use [gitleaks](https://github.com/gitleaks/gitleaks) for deeper scanning including git history.

---

## 4. TypeScript Strict Check

**Command:** `npx tsc --noEmit --strict`  
**Errors:** 0  
**Warnings:** 0 (npm config warnings only — unrelated)

**Status: ⚠️ PARTIAL PASS** — TypeScript compiles clean, but `strict: true` is **not fully enabled**.

### Current `tsconfig.base.json` strict settings gap

| Flag | Status | Risk |
|---|---|---|
| `noImplicitAny` | ✅ true | Explicit — good |
| `strictNullChecks` | ✅ true | Explicit — good |
| `strictBindCallApply` | ✅ true | Explicit — good |
| `strictPropertyInitialization` | ✅ true | Explicit — good |
| `alwaysStrict` | ✅ true | Explicit — good |
| `useUnknownInCatchVariables` | ✅ true | Explicit — good |
| `noImplicitThis` | ✅ true | Explicit — good |
| `noImplicitReturns` | ✅ true | Explicit — good |
| **`strictFunctionTypes`** | ❌ **false** | Method parameter bivariance — type unsafety |
| **`noImplicitOverride`** | ❌ **false** | Accidental method overrides in subclasses |
| **`noUnusedLocals`** | ❌ **false** | Dead code accumulation |

### Recommended fix — update `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "strictFunctionTypes": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

> **Important:** Enabling `strictFunctionTypes: true` may surface type errors in callback/event handler signatures. Run `tsc --noEmit` after enabling and fix errors incrementally. `noUnusedLocals` may generate noise in files with deliberate unused imports (e.g. type-only re-exports) — add `// @ts-ignore` or `_` prefix as needed.

---

## 5. npm Audit

**Status: ⚠️ N/A (not applicable)**

`npm audit` requires a `package-lock.json`. This project uses **pnpm** with `pnpm-lock.yaml` as the lockfile. npm cannot read the pnpm lockfile format.

The pnpm audit in Section 2 is the authoritative Node dependency security check for this project. Do not switch to npm — it would break the workspace setup.

---

## Action Plan (Priority Order)

| Priority | Action | Effort |
|---|---|---|
| 🔴 P1 | **Migrate away from `xlsx`** — replace with `exceljs` (already installed) | Medium |
| 🔴 P1 | **Patch `dompurify`** to ≥3.4.16 (XSS risk) | Low |
| 🔴 P1 | **Patch `fast-uri`** to ≥3.1.7 (SSRF) | Low |
| 🟡 P2 | Update `brace-expansion`, `js-yaml`, `nanoid`, `qs`, `markdown-it`, `fast-copy`, `esbuild` | Low |
| 🟡 P2 | Upgrade `uuid` to v11.x (check for breaking changes first) | Medium |
| 🟢 P3 | Enable `strictFunctionTypes`, `noImplicitOverride`, `noUnusedLocals` in tsconfig | Low–Medium |
| 🟢 P3 | Install TruffleHog or gitleaks for full git-history secrets scan | Low |
| ℹ️ | `npm audit` — N/A, pnpm audit covers this | — |

---

## Tool Versions Used

| Tool | Version |
|---|---|
| pip-audit | 2.10.1 |
| pnpm audit | via pnpm (pnpm-lock.yaml) |
| tsc | from node_modules |
| TruffleHog | not installed — regex fallback used |
| npm audit | failed (no package-lock.json) |

---

*Report generated: 2026-10-12 by Kiro automated security audit*
