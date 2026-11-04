# P2-W04 — SECURITY HARDENING & .XLS SURVIVAL
Primary: Devin | Verifier: Antigravity | Prereq: W03 | Gate: gate:security

## 0. READ FIRST
docs/phase-2/SECURITY.md | docs/phase-2/week-02A/XLS-STRATEGY.md
server/app-factory.ts | artifacts/api-server/src/lib/auth.ts
scripts/check-audit-threshold.mjs | .env.example

## 1. OBJECTIVE
Close every security finding from AUDIT-REPORT-v1.0.md, harden the API surface, and
migrate the .xlsx path off xlsx@0.18.5 without losing .xls (BIFF8) capability.

## 2. HARD CONSTRAINTS
- The .xls (BIFF8) capability must survive — the entire legacy corpus is .xls.
- No hardcoded secrets, tokens, or credentials in source.
- CORS must not use wildcard origins in production.
- Command execution must use argument arrays, never shell string interpolation.

## 3. TASKS
T4.1 (AMENDED) Migrate the .xlsx path off xlsx@0.18.5. HARD REQUIREMENT: the .xls (BIFF8)
     capability must survive, because the entire legacy corpus is .xls. Either keep a
     pinned .xls-only reader or add a controlled conversion step with originals
     preserved. Cross-reference docs/phase-2/week-02A/XLS-STRATEGY.md. Remove the
     permanent ALLOWED_HIGH_PACKAGES exception for xlsx and give any remaining
     exception an expiry date and an owner.
T4.2 Implement gate:security — headers, no stack in 500 responses, upload size rejection,
     RBAC matrix, CORS validation, secret scan.
T4.3 Implement scan:secrets — no secret pattern in tracked files.
T4.4 Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
     Referrer-Policy, Content-Security-Policy.
T4.5 Remove stack traces from error responses in production (NODE_ENV=production).
T4.6 Enforce upload MIME allowlist + magic-byte check + size cap.
T4.7 RBAC matrix in SECURITY.md: viewer, engineer, reviewer, admin per route.
T4.8 Secret inventory in SECURITY.md: name, location, rotation, owner.
T4.9 Update audit:policy gate — remove xlsx from ACCEPTED_HIGH if .xlsx migration
     is complete; give remaining exceptions expiry dates.
T4.10 Patch dompurify to >=3.4.16 (XSS risk from AUDIT-REPORT).
T4.11 Patch fast-uri to >=3.1.7 (SSRF from AUDIT-REPORT).
T4.12 Fuzz the workbook reader with all 8 real corpus workbooks, including the ones
      containing #ERR:Ref and #ERR:Name cells. Assert: no exception, partial row
      returned, REVIEW flag raised, source cell preserved.

## 4. EVIDENCE
gate:security output, scan:secrets output, audit:policy output, fuzz test results.

## 5. EXIT GATE
[ ] .xlsx path migrated off xlsx@0.18.5; .xls capability survives
[ ] gate:security green
[ ] scan:secrets green
[ ] No stack traces in production error responses
[ ] RBAC matrix and secret inventory in SECURITY.md
[ ] dompurify and fast-uri patched
[ ] xlsx removed from ACCEPTED_HIGH or exception has expiry + owner
[ ] Fuzz test over all 8 workbooks passes (no exception, partial row, REVIEW flag)

## 6. DELIVERABLES
docs/phase-2/week-04/{SECURITY-HARDENING,EXIT-GATE-EVIDENCE}.md | lib/engine/src/io/**

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
