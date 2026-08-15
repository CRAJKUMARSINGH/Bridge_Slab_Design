# Week 15 ΓÇö Release Candidate, Sign-Off Gate, and Handover

**Status:** Release Candidate ΓÇö Prototype/Review Build  
**Date:** 11 August 2026

## Release candidate freeze checklist

| Gate | Result |
|---|---|
| TypeScript typecheck (all packages) | Γ£ö PASS |
| Workspace build (engine + api-server + mockup-sandbox) | Γ£ö PASS |
| Golden regression (18 tests, 0 failures) | Γ£ö PASS |
| Tamper test (different inputs ΓåÆ different fingerprint) | Γ£ö PASS |
| HTML report renders for PASS and FAIL results | Γ£ö PASS |
| PDF export (browser print path) | Γ£ö PASS |
| API server health endpoint | Γ£ö PASS |
| Security headers (Helmet.js) | Γ£ö PASS |
| Rate limiting | Γ£ö PASS |
| Structured logging | Γ£ö PASS |

## Canonical input/result bundle

| File | Location |
|---|---|
| Kherwara golden inputs | `lib/engine/src/tests/calculate.test.ts` (BASE_INPUTS) |
| Engine source | `lib/engine/src/` |
| Test evidence | `pnpm --filter @workspace/engine test` |

## Release notes

**Version:** 0.1.0-rc1  
**Date:** 11 August 2026  
**Status:** PROTOTYPE ΓÇö not approved for engineering reliance

### What is working

- Full calculation pipeline: loads ΓåÆ resistance ΓåÆ serviceability.
- Narrative HTML report with chapter structure and traceability.
- SVG cross-section renderer.
- Project/run persistence (in-memory, session-only).
- Workbook upload and ambiguity confirmation flow.
- API server with health, calculate, projects, uploads, and report endpoints.
- React mockup sandbox (design workspace).

### Known limitations (first release candidate)

1. **In-memory only** ΓÇö all project/run data is lost on server restart.
2. **PDF via browser print only** ΓÇö server-side Puppeteer PDF is not installed.
3. **Auth stub** ΓÇö any non-empty X-Api-Key is accepted; no project ACLs.
4. **Classifier integration** ΓÇö `classify_cells.py` must be run manually;
   automatic classifier-on-upload is deferred.
5. **Single bridge type** ΓÇö only simply-supported composite slab covered.
6. **Engineering sign-off not yet obtained** ΓÇö this is a prototype.

## Handover package

| Item | Location |
|---|---|
| Project charter | `creat.md` |
| Weekly deliverable docs | `docs/week-1/` through `docs/week-15/` |
| Engine source | `lib/engine/src/` |
| API server source | `artifacts/api-server/src/` |
| Zod schemas | `lib/api-zod/src/` |
| Design workspace | `artifacts/mockup-sandbox/` |
| Origin weekly plan | `origin-weekly-plan.md` |
| README | `README.md` |

## Next-quarter roadmap (Weeks 16ΓÇô24)

- Drizzle/SQLite database persistence.
- JWT authentication and project-level ACLs.
- Puppeteer PDF generation on the server.
- Automatic `classify_cells.py` integration on workbook upload.
- Additional bridge types (continuous span, pre-stressed).
- Load combination options (EC2, IS:456, IRC).
- Full 200-page legacy-format report option.

## Engineering sign-off

> **Status: NOT YET SIGNED OFF**
>
> This software produces calculation results that have been regression-tested
> against representative Kherwara inputs. The software has NOT been reviewed
> or approved by a licensed engineer. All results must be independently verified
> before use in any engineering design or submission.
>
> Reviewer: [NAME TO BE INSERTED]  
> Date: [DATE TO BE INSERTED]  
> Status: [ ] Approved for prototype demonstration only  
>         [ ] Approved for limited internal use  
>         [ ] Not approved ΓÇö see findings register
