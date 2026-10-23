<!-- _templates/SCORECARD.md -->
# PRODUCTION READINESS SCORECARD
| # | Domain | Score | Anchor matched | Evidence | Owner | Trend |

Target >=4.5. Floor 4.0. Any domain <4.0 freezes feature work.

## Gap to week
| Domain | Current | Target | Week that closes it |

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
