# End-to-End Acceptance Report ΓÇö Week 14

**Status:** DRAFT ΓÇö acceptance criteria defined; results to be populated after live run  
**Date:** 2026-08-10

## Acceptance scenarios

| # | Scenario | Expected | Actual | Pass? |
|---|---|---|---|---|
| A-001 | POST /api/calculate with valid Kherwara inputs returns FAIL (deflection) | overallStatus: FAIL | ΓÇö | pending |
| A-002 | POST /api/calculate with deliberately invalid input (span < 0) returns 400 | 400 + field errors | ΓÇö | pending |
| A-003 | POST /api/report/html returns valid HTML containing project code | 200 + HTML | ΓÇö | pending |
| A-004 | GET /health returns 200 with engineVersion | 200 + JSON | ΓÇö | pending |
| A-005 | POST /api/projects then POST /api/projects/:id/runs saves run | 201 + run id | ΓÇö | pending |
| A-006 | GET /api/projects/:id/runs/:runId returns identical inputs + result | same fingerprint | ΓÇö | pending |
| A-007 | npx tsx scripts/week0/verify-golden.ts exits 0 (hydraulics) | exit 0 | ΓÇö | pending |
| A-008 | npx tsx scripts/week6/verify-golden.ts --tamper exits 1 | exit 1 | ΓÇö | pending |
| A-009 | Failed checks (bendingUtilisation, deflectionCheck) visible in HTML report | FAIL labels present | ΓÇö | pending |
| A-010 | POST /api/intake/upload + /confirm accepts ambiguity decisions | 201 + reviewed state | ΓÇö | pending |

## Known deviations
1. PDF generation requires Puppeteer ΓÇö not available in all environments; browser print is fallback.
2. Parity against canonical Kherwara workbook not yet established (OQ-002 open).
3. DB persistence uses in-memory store ΓÇö Drizzle + Postgres schema defined but not migrated.
4. Authentication uses API key stub ΓÇö production OAuth not yet implemented.

## Deferred work register
| Item | Deferred to |
|---|---|
| DB migration + Postgres connection | Week 16 |
| OAuth/JWT authentication | Week 16 |
| Puppeteer PDF in CI | Week 16 |
| Full golden parity once OQ-002 resolved | Week 6 gate re-run |
| Chart rendering in HTML report | Week 9 follow-up |
