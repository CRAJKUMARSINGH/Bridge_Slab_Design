# P2-W04 EXIT GATE EVIDENCE
Week: W04 — Security hardening & .xls survival | Agent: Devin | Verifier: Antigravity (pending) | Date: 2026-10-31
Baseline commit: `048eac075e33afe6dd550ad4d8db9783d2adebf4` | Branch: `foundation/set-one-hardening`
Final commit: worktree at the same HEAD (W04 artifacts are staged in the worktree; no W04 commit exists yet)

Week gates: `gate:security` (`package.json:34`) and `scan:secrets` (`package.json:43`);
supply-chain gate `audit:policy` (`package.json:29`).

## Gate checklist (copied verbatim from the instruction file §5)
| # | Gate item | Result | Evidence (file:line or command) |
|---|---|---|---|
| 1 | `.xlsx` path migrated off `xlsx@0.18.5`; `.xls` capability survives | PASS | `.xlsx` read path is **ExcelJS** (`exceljs ^4.4.0`, `server/excel-parser.ts`); SheetJS pinned to the CDN tarball `xlsx@0.20.3` (`package.json:149`), dev-only, imported only from `scripts/**` (`check-audit-threshold.mjs` `IMPORT_RULES`, asserted by the audit gate). BIFF8 survival: `lib/engine/src/io/xls.ts` + `tests/integration/xls-fuzz-corpus.test.ts` reads real `.xls`. |
| 2 | `gate:security` green | PASS | `GATE gate-security: PASS 41 assertions` (exit 0). |
| 3 | `scan:secrets` green | PASS | `GATE scan-secrets: PASS 4 assertions` (exit 0). |
| 4 | No stack traces in production error responses | PASS | `buildErrorPayload(err,"production").body.stack === undefined` — `gate-security` D2 (3 assertions) + `tests/integration/security-hardening.test.ts`. |
| 5 | RBAC matrix and secret inventory in SECURITY.md | PASS | `docs/phase-2/SECURITY.md` — 4-role × 3-endpoint matrix (viewer/engineer/reviewer/admin) + secret inventory with rotation/owner; `gate-security` group E (7 assertions). |
| 6 | `dompurify` and `fast-uri` patched | PASS | `pnpm-workspace.yaml` overrides `dompurify: "^3.4.16"`, `fast-uri: "^3.1.8"`; `pnpm-lock.yaml` resolves `dompurify@3.4.16`, `fast-uri@3.1.8`. |
| 7 | `xlsx` removed from `ACCEPTED_HIGH` or exception has expiry + owner | PASS (branch 2) | Retained because `.xls` still needs SheetJS; entry carries `reason`, `control`, `owner: RAJKUMAR SINGH CHAUHAN`, `reviewBy: "2027-01-31"` (`check-audit-threshold.mjs:54-69`). |
| 8 | Fuzz test over all 8 workbooks passes (no exception, partial row, REVIEW flag) | PASS | `tests/integration/xls-fuzz-corpus.test.ts` — 12/12: 8 workbooks present + hash-verified, OOXML rejected by name, LFS stub rejected, 4 readable BIFF8 workbooks fuzzed (positional matrix preserved, REVIEW raised, source literal kept), 3 password-protected fail cleanly (D-18). |

## Command log (raw, untrimmed)

### week gate — `gate:security` GREEN
```
$ node scripts/gates/gate-security.mjs; "EXIT=$LASTEXITCODE"
GATE gate-security: PASS 41 assertions
(node:12320) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///C:/Users/Rajkumar/Bridge_Slab_Design/server/security.ts is not specified …
EXIT=0
```
Note: this gate dynamically imports `server/security.ts` under Node type-stripping. A
forced `process.exit()` raced the ESM-loader async handle on Windows (libuv
`UV_HANDLE_CLOSING` assertion → exit `0xC0000409`); the gate now sets `process.exitCode`
and lets the loop drain, which yields the same status without the crash. See “Errors and
fixes” below.

### week gate — `scan:secrets` GREEN
```
$ node scripts/gates/scan-secrets.mjs; "EXIT=$LASTEXITCODE"
GATE scan-secrets: PASS 4 assertions
EXIT=0
```
Assertions: (A) `git ls-files` returns tracked files; (A) excluded corpora
(`assets/`, `Attached_Assets/`, `reference-design-examples/`) exist on disk so the
exclusion is declared, not silent; (B) no credential pattern in tracked source/config;
(C) **non-vacuity** — a synthetic `AKIAIOSFODNN7EXAMPLE` canary written inside the repo is
flagged by the same `git grep --untracked` engine.

### supply-chain gate — `audit:policy` GREEN
```
$ node scripts/check-audit-threshold.mjs; "EXIT=$LASTEXITCODE"
Audit policy OK (npm): critical=0, high=0, accepted-high=[brace-expansion, braces, fast-uri, js-yaml, nanoid, xlsx], next review=2027-01-31, import scan=xlsx confined to [scripts]
EXIT=0
```

### test lane (W04) — `node --test`
```
$ node --test tests/integration/security-hardening.test.ts tests/integration/xls-fuzz-corpus.test.ts tests/integration/xls-error-cells.test.ts; "EXIT=$LASTEXITCODE"
ℹ tests 30
ℹ suites 12
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
EXIT=0
```
Per-file split: `security-hardening` 15, `xls-fuzz-corpus` 12, `xls-error-cells` 3.

### harness — `gate-all-stubs` GREEN
```
$ node scripts/gates/gate-all-stubs.mjs; "EXIT=$LASTEXITCODE"
GATE gate-all-stubs: PASS 15 assertions
EXIT=0
```
(Every expected gate exists, is non-trivial, and exits 0/1/2 deterministically; the
`gate-security` crash and the `scan-secrets` timeout that previously failed this harness
are both fixed — the harness was `FAIL 15` before this session.)

### not run — and why
- `npm run check` / `pnpm run build` / `gate:full` via `pnpm`: the `pnpm` shim is broken
  and `tsx` is absent in this worktree (escape **E-008**, `GREEN_ONLY_IN_DIRTY_TREE`).
  `gate:full` inside `gate-all-stubs` reports exit 2 (NOT IMPLEMENTED) deterministically
  rather than a false green.
- `pnpm audit` live advisories: the advisory DB is not reachable offline; `audit:policy`
  runs against the committed policy + source import scan (E-008).

## Non-vacuity
- **`scan:secrets`** proves its own non-vacuity in assertion C: it writes a synthetic
  `AKIA…` canary inside the repository and confirms the same scanner flags it via
  `git grep --untracked`, then removes it in a `finally`.
- **`gate:security`** drives the *shipping* `server/security.ts` (imported, not copied) and
  asserts headers by exact value and error payloads by exact field, so a regression fails
  group A/D. An explicit RED→GREEN transcript for this gate was **not captured this
  session** — recorded here as a limitation rather than claimed.

## Artifacts produced
| Path | sha256 | Bytes |
|---|---|---|
| `server/security.ts` | `cf9a4684c5f192d198ce19874daf7c113c88ddb7043fe72aa4faf447b10b7c1d` | 9853 |
| `scripts/gates/gate-security.mjs` | `5298b89f1e602adca7fe91d4c52cb919676bea10c5835e81bcef086e9ccaba56` | 9417 |
| `scripts/gates/scan-secrets.mjs` | `dca4dda3f3fd4bf6bbe175b8ded734417d0d803e1327a3493763692b1846112e` | 6032 |
| `tests/integration/security-hardening.test.ts` | `f10741832f4c1cf8133936829f852fe4a882dd4d3bdf90ca95bc2fe9901f3ebe` | 5523 |
| `tests/integration/xls-fuzz-corpus.test.ts` | `042b0fbece08575da4d46d2a5d88b6adadd74c7f4d8bc1ed1f9985fd3ced4492` | 8306 |
| `docs/phase-2/SECURITY.md` (RBAC + secret inventory + upload/OWASP updates) | `35388e084a63cf99b33e97b7e09dc1a3fc674282e68244246fbb172506ce891c` | 10526 |
| `docs/phase-2/week-04/SECURITY-HARDENING.md` | `fa8a19bb33ff719bde39443d5ee74b6ff251ca985ce9ddad23c92221adb3ef97` | 8477 |
| `scripts/check-audit-threshold.mjs` (re-justified `xlsx`; import scan) | `a432cb65e5e7493d793582670e2f994169fb1e8bdd829a264774458d0bcc3cf0` | 9090 |
| `PATH-MANIFEST.json` (W04 ownership) | `99d505ee2c31a8a1f596f5436f0bc06431d7f499da9510ff72731b85c02eca91` | 7856 |
| `docs/phase-2/RISK-REGISTER.md` (R-04 ref corrected) | `17c9d90fd7e18cbdcc829e4de56289f914e0c48ef3a0c9120bfad0234663b340` | 2298 |
| `scripts/gates/.out/gate-security.json` | — | pass 41 / fail 0 |
| `scripts/gates/.out/scan-secrets.json` | — | pass 4 / fail 0 |
| `scripts/gates/.out/gate-all-stubs.json` | — | pass 15 / fail 0 |

## Deviations
| Item | Expected | Actual | Reason | Registered where |
|---|---|---|---|---|
| T4.1 `.xlsx` migration | "remove the permanent `ALLOWED_HIGH_PACKAGES` exception for xlsx" | exception **retained with expiry + owner** | `.xls` (BIFF8) still requires SheetJS and ExcelJS cannot open BIFF8; the exit-gate permits either removal or an expiring exception | this table + `check-audit-threshold.mjs:54-69` |
| T4.7 RBAC | "matrix per route" | matrix **defined, not enforced** | auth is unwired; W04 owns the *contract*, D4 owns the wiring | `docs/phase-2/SECURITY.md` U-5 |
| `gate-security` non-vacuity | RED→GREEN probe | measured structural assertions only | a temporary-probe run was declined this session | this section |

## Declarations
- [x] No test was weakened to make a gate pass.
- [x] No file was deleted; nothing was retired this week.
- [x] Every deliverable in section 6 of the instruction file exists and is non-empty
  (`docs/phase-2/week-04/{SECURITY-HARDENING,EXIT-GATE-EVIDENCE}.md`; `lib/engine/src/io/**`
  present and unchanged — owned by W02A, protected by T4.1).
- [x] `creat.md` §8 session log updated (session entry "P2-W04 CLOSE-OUT (ledger W04 = GREEN)").
- [ ] Licensed-engineer review recorded. (**Not recorded — all W04 artefacts remain DRAFT.**)

> **Honesty note.** Boxes 1–8 are backed by the raw `node` output above. The `.xlsx`→ExcelJS
> migration and the `.xls`-survival path are asserted at the manifest/import-scan level plus a
> real-corpus fuzz; no live `pnpm audit` advisory check was possible offline (E-008). RBAC is
> defined but **not enforced** (U-5); the secret scan is working-tree-only. The W04 deliverables
> are DRAFT; no sign-off is implied.
