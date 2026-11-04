# P2-W04 — SECURITY HARDENING (evidence narrative)

Week: W04 — Security hardening & .xls survival | Agent: Devin | Verifier: Antigravity (pending)
Gate: `gate:security` (`package.json:34` → `node scripts/gates/gate-security.mjs`).

This document is the hardening evidence narrative for W04. It records **what was
changed**, **where**, and **which command proves it**. The live policy tables
(threat model, RBAC matrix, secret inventory, upload rules, OWASP position) live in
[`docs/phase-2/SECURITY.md`](../SECURITY.md); this file does not duplicate them — it
cross-references them.

The single design decision behind the whole week: the hardening rules are extracted
into **one dependency-free module** ([`server/security.ts`](../../../server/security.ts))
that imports nothing. Because it imports nothing it loads under Node's native
type-stripping with no `express`/`exceljs`/`zod` tree present, so the gate can assert
against the **shipping** code rather than a copy of it (escape **E-008** — this worktree
has no `tsx` and a broken `pnpm` shim). Every consumer — `server/app-factory.ts`,
`server/api-routes.ts`, `server/excel-parser.ts`, the gate and the test lane — calls that
one module. There is no second implementation to drift.

## 1. Supply chain: `.xlsx` migrated, `.xls` preserved (T4.1, T4.9, T4.10, T4.11)

**T4.1 — `.xlsx` off `xlsx@0.18.5`.** The shipped `.xlsx` read path now runs through
**ExcelJS** (`exceljs ^4.4.0`, `server/excel-parser.ts`), not SheetJS. SheetJS is
retained *only* to keep the `.xls` (BIFF8) capability alive, because ExcelJS cannot open
BIFF8 and the entire legacy corpus is `.xls`.

- SheetJS is pinned to **`xlsx@0.20.3` from the SheetJS CDN**
  (`package.json:149` → `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), not the
  frozen npm `0.18.5`. The unpinned-0.18.5 finding is therefore closed by *replacement*,
  not by suppression.
- It is a **root `devDependencies`** entry and is imported **only from `scripts/**`**.
  `scripts/check-audit-threshold.mjs` (`IMPORT_RULES`) fails the audit gate if `server/`,
  `client/src/`, `bridge-excel-generator/`, `pipeline/`, `lib/`, `artifacts/`, `api/` or
  `shared/` ever import `xlsx`.
- The dependency-free BIFF8 reader itself lives in
  [`lib/engine/src/io/xls.ts`](../../../lib/engine/src/io/xls.ts) (owned by W02A per
  [XLS-STRATEGY.md](../week-02A/XLS-STRATEGY.md) §13); the pinned SheetJS decoder is the
  externalised port [`scripts/assimilate/sheetjs-xls-decoder.ts`](../../../scripts/assimilate/sheetjs-xls-decoder.ts).
  W04 did **not** rewrite the reader — it is the survival path T4.1 is required to protect.

**T4.9 — `ACCEPTED_HIGH` re-justified.** Because `.xls` still needs SheetJS, the `xlsx`
entry is *retained but re-justified*, satisfying the exit-gate's "removed **or** exception
has expiry + owner" branch. Every `ACCEPTED_HIGH` entry in
[`scripts/check-audit-threshold.mjs`](../../../scripts/check-audit-threshold.mjs#L18-L70)
carries a `reason`, a `control`, an `owner` (`RAJKUMAR SINGH CHAUHAN`) and a
`reviewBy: "2027-01-31"` expiry.

**T4.10 / T4.11 — transitive patches.**
`pnpm-workspace.yaml` overrides pin `dompurify: "^3.4.16"` (XSS) and `fast-uri: "^3.1.8"`
(SSRF); `pnpm-lock.yaml` resolves `dompurify@3.4.16` and `fast-uri@3.1.8`.

Evidence:

```
$ node scripts/check-audit-threshold.mjs
Audit policy OK (npm): critical=0, high=0, accepted-high=[brace-expansion, braces, fast-uri, js-yaml, nanoid, xlsx], next review=2027-01-31, import scan=xlsx confined to [scripts]
EXIT=0
```

## 2. Response headers (T4.4)

`server/security.ts` declares and `applySecurityHeaders()` writes five headers on every
response via the `securityHeaders()` middleware mounted first in `server/app-factory.ts`:

| Header | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (disables the legacy auditor; correct modern posture) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | a multi-line directive array joined with `'; '` |

Proven behaviourally in `gate-security` group D1 (the module is imported and driven with a
fake response sink) and in `tests/integration/security-hardening.test.ts`.

## 3. No stack traces in production (T4.5)

`buildErrorPayload(err, nodeEnv)` attaches `stack` **only** when
`shouldIncludeStack(nodeEnv)` — i.e. `nodeEnv === "development"`. In production the payload
keeps `error` and `status` and omits `stack`. `server/app-factory.ts`'s error handler calls
`buildErrorPayload`. Proven in `gate-security` D2 and the test lane.

## 4. CORS (T4.2)

`resolveCorsOrigin(raw, nodeEnv)` is **default-deny**:

| `ALLOWED_ORIGINS` | production | development |
| --- | --- | --- |
| unset/empty | `false` (deny) | `true` (reflect) |
| a list | the list | the list |
| `*` | **throws** | `true` |

`server/app-factory.ts` consumes `resolveCorsOrigin`; `credentials: true` is set. The
"wildcard in production is refused" assertion is emphasised in `gate-security` D3.

## 5. Upload guard (T4.6 — closes U-1)

`POST /api/design/upload-excel` (`server/api-routes.ts`) calls `validateUpload` before
base64-decoding:

- **Missing** `body.file` → 400.
- **Declared MIME** outside `UPLOAD_MIME_ALLOWLIST`
  (`…spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/octet-stream`) → 415.
- **Size** above `MAX_UPLOAD_XLSX_BYTES = 10 * 1024 * 1024` → 413 (checked against base64
  length, then decoded length).
- **Magic bytes** — `isLikelyXlsxZip()` must pass, else 400.

**U-1 closure:** the 10 MB ceiling was previously unreachable behind the global 200 kB
`express.json()` parser. `server/app-factory.ts` now mounts a dedicated **14 MB**
`jsonUpload` parser on the upload route alone (leaving every other route at 200 kB), so
the ceiling is enforceable. `gate-security` group B asserts the upload route gets its own
parser; group D4 asserts each outcome.

## 6. SSRF guard (T4.6 / KERO-005)

`guardProxyUrl(rawUrl, nodeEnv)`: refuses any non-`http(s)` scheme; in **production** it
refuses loopback and the metadata addresses in `BLOCKED_PROXY_HOSTS`
(`169.254.169.254`, `metadata.google.internal`). In development loopback is allowed because
the SlabDraw default target is `http://localhost:8000`. `server/api-routes.ts` routes the
proxy target through it. Proven in `gate-security` D5.

## 7. RBAC matrix + secret inventory (T4.7, T4.8)

Both are authored in [`docs/phase-2/SECURITY.md`](../SECURITY.md):

- **RBAC matrix** — four roles (viewer / engineer / reviewer / admin) crossed with the
  three endpoint groups (`/api/design`, `/api`, root), each with an "Enforced now" column.
  Honest state: **anonymous allowed** everywhere, because auth is unwired (**U-5**).
- **Secret inventory** — `DATABASE_URL`, `ALLOWED_ORIGINS`, `NODE_ENV`, `SLABDRAW_URL`
  with consumer, "committed?" (`no`), rotation cadence and owner.

`gate-security` group E asserts the document names all four roles and carries a secret
inventory with rotation and owner.

## 8. Secret scan (T4.3)

`pnpm run scan:secrets` → [`scripts/gates/scan-secrets.mjs`](../../../scripts/gates/scan-secrets.mjs).
It scans git-tracked text with `git grep -I -E` (C-fast, binary-aware) for AWS `AKIA…`,
PEM private keys, GitHub `gh[pousr]_…`, Google `AIza…`, Slack `xox[baprs]-…`, Stripe
`sk_live_…` and assigned `secret`/`password`/`api_key`/`token` literals. Three bulk
**binary** corpora (`assets/`, `Attached_Assets/`, `reference-design-examples/`) are
excluded by explicit pathspec **and asserted present on disk**, so the exclusion is
declared, not silent. Non-vacuity is proven by writing a synthetic `AKIA…` canary inside
the repo and confirming `git grep --untracked` flags it. It is a **working-tree** scanner,
**not** a history scanner (residual — see §9).

## 9. Residual risk (honest)

- **U-5 — auth is still unwired.** W04 *defines* RBAC; it does not enforce it. Every
  endpoint remains anonymous-reachable until the D4 auth work lands.
- **Working-tree-only secret scan.** No history scanner (TruffleHog/gitleaks) is
  installed; "no secrets" means "none in the working tree".
- **E-008.** Verdicts derived from a dirty-tree gate run are provisional.
- **D-18.** Three corpus workbooks are password-protected; the reader fails them cleanly
  (never a silent pass) and they are registered in `SOURCE-DEFECT-REGISTER.md`.

All W04 artefacts are **DRAFT** pending licensed-engineer sign-off.
