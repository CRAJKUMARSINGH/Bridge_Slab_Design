# P2-W12A — PRODUCTION CUTOVER, LAUNCH EVIDENCE & POST-RELEASE VERIFICATION
Primary: Kiro | Verifier: Devin | Effort: 5 days | Prereq: P2-W12 gate GREEN

## 0. READ FIRST
docs/phase-2/week-12/{GATE-LOG,UAT-RESULTS,RELEASE-NOTES}.md | creat.md §8, §13, §14
docs/phase-2/RUNBOOK.md | netlify.toml | .env.example | docs/phase-2/SCORECARD.md

## 1. OBJECTIVE
Actually cut over. W12 proved the release is fit; W12A puts it in front of users,
watches it, and writes the launch evidence into creat.md. The charter says the project
is not complete until launch evidence is recorded — this week records it.

## 2. HARD CONSTRAINTS
- Deploy from a signed tag only. No deploy from a working branch.
- Monitoring must be live BEFORE the cutover, not after.
- If the soak finds a critical, roll back first and diagnose second.
- creat.md status stays DRAFT unless a licensed engineer has signed.

## 3. TASKS
T12A.1 Pre-cutover rehearsal: deploy the release tag to a staging site, run the full
       40-scenario UAT there, and confirm the production env var set is complete and
       distinct from staging. Record in CUTOVER-PLAN.md with a rollback decision point.
T12A.2 Environment freeze: capture the production env var names (never values), confirm
       DATABASE_URL points at the production database, confirm ALLOWED_ORIGINS is the
       production origin, confirm NODE_ENV=production.
T12A.3 Observability soak setup: uptime check every minute on /api/health, error alert
       threshold, log retention confirmed, and a named on-call window.
T12A.4 Cutover: deploy the tag, run the route smoke test, run the 3 golden projects
       end-to-end IN PRODUCTION, and confirm the generated PDF/DXF/BOQ hashes match the
       pre-release evidence bundle. Any hash mismatch aborts the cutover.
T12A.5 72-hour soak: monitor error rate, p95 latency, function timeout count, DB
       connection saturation, and cold-start frequency. Record a reading every 12 hours
       in SOAK-LOG.md. Threshold breaches get an incident entry.
T12A.6 Post-release verification: re-run gate:full against the deployed commit, re-run
       gate:oracle, and confirm the scorecard still holds with production timings.
T12A.7 Launch evidence into creat.md §14: launch date, released version, tag sha,
       deployed URL, environment, verification commands + results, known limitations
       reference, and the engineering review status. Update the §8 chat log.
T12A.8 Handover pack: ARCHITECTURE.md, RUNBOOK.md, DATA-MODEL.md, SECURITY.md,
       ENGINEERING-REVIEW-GUIDE.md, KNOWN-LIMITATIONS.md, DEMO-SCRIPT.md, and a
       "how to add the next bridge family" walkthrough — assembled into
       docs/phase-2/HANDOVER/ with an index.
T12A.9 Post-release backlog: docs/phase-2/POST-RELEASE-BACKLOG.md containing every
       Deferred item from MODULE-MATRIX, KNOWN-DEVIATIONS, KNOWN-LIMITATIONS and
       SOURCE-DEFECT-REGISTER, each with an owner, a trigger, and a rough size.
T12A.10 Phase-3 proposal: docs/phase-2/PHASE-3-PROPOSAL.md covering the Week 75 horizon
       from creat.md §6A — new bridge families, comparison/sensitivity, team review
       workflows, and the governed coefficient registry. Gated on W12A evidence.

## 4. EVIDENCE
CUTOVER-PLAN.md, SOAK-LOG.md (6 readings), production smoke output, production golden
run hashes vs pre-release hashes, and the creat.md §14 block.

## 5. EXIT GATE
[ ] Staging rehearsal passed all 40 UAT scenarios
[ ] Production env vars complete and distinct from staging
[ ] Route smoke test 200 on every client route in production
[ ] 3 golden projects run in production with matching artifact hashes
[ ] 72-hour soak logged with 6 readings and zero unresolved incident
[ ] Monitoring + alerting live with a named on-call
[ ] creat.md §14 launch evidence recorded with a release decision
[ ] HANDOVER/ complete with index
[ ] POST-RELEASE-BACKLOG.md and PHASE-3-PROPOSAL.md written

## 6. DELIVERABLES
docs/phase-2/week-12A/{CUTOVER-PLAN,SOAK-LOG,LAUNCH-EVIDENCE,EXIT-GATE-EVIDENCE}.md
docs/phase-2/HANDOVER/** | docs/phase-2/{POST-RELEASE-BACKLOG,PHASE-3-PROPOSAL}.md
creat.md §14

## 7. CLOSE-OUT / 8. REPORT / 9. ROLLBACK
Standard, plus: report the release decision verbatim and the soak verdict.
Rollback: redeploy the previous tag; the previous tag stays deployed-ready for 30 days.
