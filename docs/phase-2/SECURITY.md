<!-- docs/phase-2/SECURITY.md (filled from _templates/SECURITY.md, W01 T1.4) -->
# SECURITY

**Created by W01. Hardening evidence is owned by W04**
(`docs/phase-2/week-04/SECURITY-HARDENING.md`). Cells that W04 fills are marked
`(W04)`.

## Threat model

| Asset | Adversary | Vector | Control today | Verdict |
| --- | --- | --- | --- | --- |
| Design inputs / report output | Network attacker | Malformed JSON body | Zod `ProjectInputSchema`; `express.json({limit:'200kb'})` | covered |
| Uploaded `.xlsx` workbook | Network attacker | Zip bomb / prototype pollution / oversized payload | base64-in-JSON, declared-MIME allowlist, `MAX_UPLOAD_XLSX_BYTES = 10 MB`, `isLikelyXlsxZip(buffer)` magic check, dedicated 14 MB body parser on the upload route (W04 T4.6 — closes U-1) | covered |
| Dependency supply chain | Malicious package release | Typosquat / hijacked publish | `pnpm-workspace.yaml` `minimumReleaseAge: 1440` (1 day), `minimumReleaseAgeExclude` limited to `@replit/*`, `stripe-replit-sync`; a documented override block | covered |
| Origin integrity | Cross-site caller | CORS misconfiguration | `resolveCorsOrigin(ALLOWED_ORIGINS, NODE_ENV)` — **default deny** in production, reflect in dev, and a wildcard **throws in production** (W04 T4.2); `credentials: true` | covered, but see U-2 |
| Secrets (DB URL, API keys) | Repo reader | Commit of `.env` | `.env*` in `.gitignore`; `pnpm run scan:secrets` gate (real working-tree scanner, W04 T4.3) | covered (history not scanned — see below) |
| Error detail leakage | Unauthenticated caller | Stack traces in responses | error handler emits `stack` only when `NODE_ENV === 'development'` (W04 T4.5; `buildErrorPayload`) | covered |
| Server-side request forgery | Attacker-influenced proxy env | Outbound fetch to loopback / cloud metadata | `guardProxyUrl` refuses non-http(s) and, in production, loopback + `169.254.169.254` + `metadata.google.internal` (W04 T4.6/KERO-005) | covered |
| Project data in transit | Network attacker | Unencrypted DB link | `DATABASE_URL` (Neon serverless / node-postgres) | `(W04)` verify TLS |
| Server availability | Abusive caller | Synchronous blocking work in a handler | none measured | **open** — `(W04)`; see OWASP A05 |

Explicitly **out of scope** for this threat model: multi-tenant isolation, SSO,
and any hosted-service hardening, because the tool has no authentication layer
today (next section). Stating that is the honest position.

## Auth / RBAC matrix

**There is no authentication or authorisation layer enforced at runtime today.**
`server/app-factory.ts` mounts `app.use('/api/design', apiRoutes)` and
`app.use('/api', d4Routes)` with no auth middleware between them and the routes.
Every endpoint below is open to any caller that can reach the host. The matrix
below is the **defined target authorisation model** (W04 T4.7) that the D4 auth
wiring must implement; until that wiring lands, the "enforced now" column is the
honest state.

The four defined roles are **viewer** (read-only), **engineer** (author designs +
exports), **reviewer** (engineer capabilities plus approve/sign-off), and
**admin** (all capabilities plus user + configuration management).

| Endpoint group | Mount | viewer | engineer | reviewer | admin | Enforced now |
| --- | --- | --- | --- | --- | --- | --- |
| design calculation / report / export | `/api/design` | read | read + write | read + write + sign-off | all | **anonymous allowed** |
| projects / files / analyses / comparisons (D4 CRUD) | `/api` | read | read + write | read + write | read + write + admin | **anonymous allowed** |
| `/api/health`, `/health` | root | allowed | allowed | allowed | allowed | anonymous allowed |
| `/api/openapi.yaml` | root | allowed | allowed | allowed | allowed | anonymous allowed |

Auth **primitives** exist but are unwired: `lib/auth/scrypt.ts` (password hashing)
and `tests/auth/scrypt.test.ts`. Owning week for wiring RBAC: `(W04)`.

## Secret inventory

Every secret is read from the environment; none is committed. "Rotation" records
the intended rotation cadence, and "Owner" the accountable role for rotation and
for the `.env` value in each deployment.

| Secret | Env var | Consumer | Committed? | Rotation | Owner |
| --- | --- | --- | --- | --- | --- |
| Postgres connection string | `DATABASE_URL` | `shared/db.ts`, `lib/db/src/index.ts` (throws if unset) | no — `.gitignore` | rotate on personnel change or suspected exposure; provider console, then redeploy | admin |
| CORS allowlist | `ALLOWED_ORIGINS` | `server/app-factory.ts` | no | review on every origin change; rotate with each deployment review | admin |
| Node environment | `NODE_ENV` | error-handler stack gating | no | n/a (not a credential); set per deployment | admin |
| SlabDraw proxy target | `SLABDRAW_URL` | `server/api-routes.ts` (`guardProxyUrl`) | no | review alongside the SSRF guard; update on service move | engineer |
| Any other credential | — | — | none found | — | admin |

The working-tree secrets scan is now a real gate: `pnpm run scan:secrets`
(`scripts/gates/scan-secrets.mjs`, W04 T4.3) reads every git-tracked text file and
fails on AWS `AKIA…`, PEM private keys, GitHub `gh[pousr]_…`, Google `AIza…`, Slack
`xox[baprs]-…`, Stripe `sk_live_…` and assigned `secret`/`password`/`api_key`/`token`
literals; it also asserts its own non-vacuity. It reports **no hardcoded secrets** in
the tree as of W04. This is still a **working-tree** scanner, not a history scanner —
TruffleHog/gitleaks are not installed, so git **history** was never scanned. Installing
a history scanner remains an open `(W04)` item; treat "no secrets" as "none in the
working tree", not "none ever committed".

## Upload rules

One upload surface: `POST /api/design/upload-excel` (`server/api-routes.ts`).

| Rule | Value | Enforced by |
| --- | --- | --- |
| Transport | base64 string in `body.file` — not multipart | route handler |
| Missing field | 400 "No file provided (expected base64 in body.file)" | `server/security.ts` (`validateUpload`) |
| Declared MIME allowlist | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/octet-stream`; anything else → 415 | `server/security.ts` (`isAllowedUploadMime`) |
| Size ceiling | `MAX_UPLOAD_XLSX_BYTES = 10 * 1024 * 1024` (10 MB); oversize → 413 | `server/security.ts` (`validateUpload`), against base64 length then decoded length |
| Body-parser ceiling | the upload route alone gets a 14 MB JSON parser; every other route stays at 200 kB (closes U-1) | `server/app-factory.ts` |
| Magic check | `isLikelyXlsxZip(buffer)` must pass; a mismatch → 400 | `server/security.ts` |
| Empty payload | 400 "File too large or empty" | `server/security.ts` |
| Extension allowlist | **none** — a `.xlsx` zip is accepted by content, not by name | — |

## OWASP Top-10 (2021) position

| # | Category | Position |
| --- | --- | --- |
| A01 | Broken access control | **Open.** No authn/authz enforced at runtime. A four-role (viewer/engineer/reviewer/admin) RBAC matrix is now *defined* (W04 T4.7) but not wired — see U-5. |
| A02 | Cryptographic failures | No secrets in tree; password hashing via scrypt exists but unused. TLS on the DB link is `(W04)`. |
| A03 | Injection | SQL via Drizzle parameterised queries only; no string-built SQL observed. Zod validates every request body at the design boundary. |
| A04 | Insecure design | No threat modelling prior to this document; no rate limiting; no job queue. |
| A05 | Security misconfiguration | Body limit stays 200 kB except the upload route (14 MB). CORS defaults to **deny** and a wildcard **throws** in production. Security response headers applied globally (W04 T4.4). `eslint.config.js` is **inert** (packages uninstalled), so `no-explicit-any` and `no-sync` are not enforced. |
| A06 | Vulnerable components | 31 advisories at 2026-10-12 (19 High). Most pinned in `pnpm-workspace.yaml` overrides; `dompurify` ≥3.4.16 and `fast-uri` ≥3.1.8 pinned (W04 T4.10/T4.11); `xlsx` is now **dev-only** (pulled from `cdn.sheetjs.com`, `0.20.3`) and confined to `scripts/**`. |
| A07 | Identification/authentication failures | No auth to fail — the RBAC roles are documentation only (U-5). |
| A08 | Software/data integrity | Reproducibility via `RunFingerprint` (`inputSha256`, `engineVersion`, `registryVersions`). Gate harness exists; see E-008 below. |
| A09 | Logging/monitoring failures | `pino-http` structured logs with an `isApi` custom prop; `pino` is a root dependency in the same edit that added `pino-pretty`. No alerting and no on-call rotation are recorded anywhere. Correlation-id propagation was **not** inspected in this pass. |
| A10 | SSRF | The SlabDraw proxy target passes through `guardProxyUrl` (W04 T4.6/KERO-005), which refuses non-http(s) and, in production, loopback and the cloud metadata address. |

## Open findings raised by this document

| Id | Finding | Evidence |
| --- | --- | --- |
| U-1 | **CLOSED (W04 T4.6).** The 10 MB upload ceiling was unreachable behind the global 200 kB body parser. The upload route now has its own 14 MB JSON parser (`jsonUpload` in `server/app-factory.ts`), so `MAX_UPLOAD_XLSX_BYTES` is reachable. | `server/app-factory.ts` (dual parser), `server/security.ts` |
| U-2 | `credentials: true` with a deny default when `ALLOWED_ORIGINS` is unset denies cross-origin by default. Correct for safety, but it means a deployment that forgets the variable silently breaks the client — verify the intended origin in the deploy checklist. | `server/security.ts` (`resolveCorsOrigin`), `server/app-factory.ts` |
| U-3 | `eslint.config.js` is committed but inert; the containment layer rule the file describes is therefore **not** enforced by lint. The live enforcement is `verify:imports` (a tripwire allowlist), not ESLint. | `eslint.config.js:3-25` |
| U-4 | E-008: gates that pass in this working tree fail from a clean checkout. Any security verdict derived from a dirty-tree gate run is provisional. | `containment/escapes.json` (E-008) |
| U-5 | **Auth is still unwired (W04 did not add authentication).** The RBAC matrix above is a *target* model with four roles; no middleware enforces it, so every endpoint remains anonymous-reachable. Wiring it into `lib/auth/scrypt.ts` is owned by the D4 auth work, not by W04. | this document (Auth / RBAC matrix) |

U-1 was created by W01 and is **closed** by W04; U-2/U-3/U-4 remain open; U-5 is the
honest residual of W04 defining RBAC without enforcing it.
