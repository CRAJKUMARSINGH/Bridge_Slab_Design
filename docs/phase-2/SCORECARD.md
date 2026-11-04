# PRODUCTION READINESS SCORECARD

**Status note.** Scores below are the **W01 author's provisional assessment**, anchored
to the rubric in this file and to evidence that exists in the repo on 2026-10-30.
They are **not** a licensed-engineer sign-off and **not** a measured release result.
The signed scorecard is a W12 deliverable
(`docs/phase-2/week-12/SCORECARD-SUMMARY.md`, deliverable-contract row W12).

Scoring rule: 5 = rubric anchor 5 fully met; 3 = anchor 3 met; 1 = anchor 1 met;
intermediate values where a domain sits between anchors.

| # | Domain | Score | Anchor matched | Evidence | Owner | Trend |
|---|---|---|---|---|---|---|
| 1 | Architecture | 3.0 | one engine, some leakage | `foundation/manifest.json` names `bridge-excel-generator/design-engine.ts` as `authoritativeEngine`; `scripts/foundation/import-guard.mjs` enforces the deep-import allowlist. ESLint rule `no-restricted-imports` for `lib/engine/**` is **inert** (`eslint.config.js` deps not installed). | W02 | flat |
| 2 | Engineering correctness | 3.0 | golden cases pass | `corpus/oracle/GOLDEN-ORACLE.json` (3 bridges). But `baselineTestCountProvenance` records **11 failing tests** (kherwara golden 3, pbt-stats 4, ircSlabCalc 2, tamper-goes-red 1, engineConsistency 1). | W03 | flat |
| 3 | Test depth | 3.0 | unit + golden | Unit + golden + a PBT lane exist (`pbt-stats`). Property/boundary/negative/tamper coverage is partial, and the stress lane is RED. | W03 | flat |
| 4 | Security | 1.0 | no auth | `docs/phase-2/SECURITY.md`: there is **no auth layer at all**; routes are open. Upload caps exist but U-1 shows the reachable cap is the 200 kB JSON limit. | W04 | flat |
| 5 | Durability | 2.5 | between in-memory and DB+migrations | Four `pgTable`s in `shared/schema.ts`; local JSON fallback (`data/projects-local.json`, LOVABLE-003). Migrations **not established**; backup/restore **NOT RECORDED**. | W05 | flat |
| 6 | Compute reliability | 2.0 | between sync blocking and memoised+budget | Run is synchronous; `vercel.json` caps `maxDuration:60`, `memory:1024`. No 202/job/cancel; budget guard **not implemented**. | W06 | flat |
| 7 | Observability | 2.5 | between console and structured+correlation | Structured logs via `pino` (`server/logger.ts`). Correlation-id handling **not inspected**; no alerts, no on-call, no soak evidence. | W06/W11 | flat |
| 8 | Design module | 2.0 | between partial and all-families | Multiple families in `PHASE1_QUICK_TEMPLATES` (20). **No clause registry** exists; `scripts/gates/verify-clauses.mjs` is a NOT-IMPLEMENTED stub, so clause citation is unenforced. | W07 | flat |
| 9 | Drawing module | 2.5 | between decorative SVG and valid DXF+register | `server/dxf-export.ts` produces DXF; SVG generators exist. No drawing register; BBS-vs-BOQ reconciliation not demonstrated. | W08 | flat |
| 10 | Estimation | 1.5 | between totals-only and measurement-rules | Estimation produces totals (`calculateDetailedEstimation`). Measurement rules and rate registry are W09 deliverables; `verify-rates` gate exists but MoRTH binding is not recorded. | W09 | flat |
| 11 | Deliverable integrity | 2.5 | between export-works and manifests+hashes | Export works; `foundation/engine.lock.json` pins engine bytes (ADR-0013); `verify:report` reproducibility not yet demonstrated. | W10 | flat |
| 12 | UX / docs / release | 2.5 | between usable and WCAG+handover | Docs present (this kit). A11y gate (`gate-a11y`) exists but has not been run to green; PWA and handover pack pending. | W11 | flat |

Target >=4.5. Floor 4.0. Any domain <4.0 freezes feature work.

> Reading the table: **10 of 12 domains are below the 4.0 floor**, which under this
> rubric's own rule means feature work is frozen and the correctness/security/durability
> weeks (W03–W09) are the unblocking path. Only Architecture (#1) and the near-floor
> domains #5/#7/#9/#11/#12 sit at or just under the floor; none reaches the 4.5 target.

## Gap to week

| Domain | Current | Target | Week that closes it |
|---|---|---|---|
| Architecture | 3.0 | 4.5 | W02 — engine consolidation + shared contracts |
| Engineering correctness | 3.0 | 4.5 | W03 — clause coverage + reality audit (parity: W02A/W06A/W07A) |
| Test depth | 3.0 | 4.5 | W03 — property, boundary, negative, tamper lanes |
| Security | 1.0 | 4.5 | W04 — security hardening |
| Durability | 2.5 | 4.5 | W05 — repro-proof, migrations, restore drill |
| Compute reliability | 2.0 | 4.5 | W06 — perf baseline + budget guard |
| Observability | 2.5 | 4.5 | W06 (budget/logging) → W11 (alerts, on-call) |
| Design module | 2.0 | 4.5 | W07 — load combinations + checks |
| Drawing module | 2.5 | 4.5 | W08 — DXF writer, layer enforcement, drawing register |
| Estimation | 1.5 | 4.5 | W09 — item registry, measurement rules, rate registry |
| Deliverable integrity | 2.5 | 4.5 | W10 — report validation |
| UX / docs / release | 2.5 | 4.5 | W11 — a11y report, user guide, handover |

## Rubric (0-5 anchors)

| Domain | 1 | 3 | 5 |
|---|---|---|---|
| Architecture | multiple engines, dead routers | one engine, some leakage | engine has zero outward deps; ESLint-enforced |
| Engineering correctness | formulas unverified | golden cases pass | 3 families pass, every clause cited and tested |
| Test depth | happy path only | unit + golden | + property, boundary, negative, tamper |
| Security | no auth | auth + RBAC + upload caps | OWASP clean, tested, no exceptions |
| Durability | in-memory | DB + migrations | restore drill, immutability, reproducibility proofs |
| Compute reliability | sync blocking | memoised + budget guard | 202/job/cancel + measured p95 budget in CI |
| Observability | console logs | structured + correlation id | alerts, on-call, soak evidence |
| Design module | partial | all families, clause-referenced | oracle-verified + assumptions + REVIEW handling |
| Drawing module | decorative SVG | valid DXF + register | BBS == BOQ, figure per case, revision control |
| Estimation | totals only | measurement rules + rates | MoRTH codes, deductions, DPR bound to BOQ |
| Deliverable integrity | export works | manifests + hashes | verify:report reproducible, TOC exact |
| UX / docs / release | usable | a11y clean, docs present | WCAG 2.2 AA, PWA, handover pack, signed release |
