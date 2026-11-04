# P2-W11 — ACCESSIBILITY, UX & DOCUMENTATION
Primary: Trae | Verifier: Antigravity | Prereq: W10 | Gate: gate:a11y

## 0. READ FIRST
docs/phase-2/_templates/A11Y-REPORT.md | docs/phase-2/UAT-PLAN.md
client/src/** | docs/phase-2/SCORECARD.md

## 1. OBJECTIVE
Achieve WCAG 2.2 AA compliance on all client routes, produce the accessibility report,
and complete user documentation. Establish gate:a11y as the validation gate.

## 2. HARD CONSTRAINTS
- Zero axe critical and serious violations on 6 core routes.
- Keyboard navigation must work on every interactive element.
- 200% zoom must not break layout or functionality.
- Color contrast must meet WCAG AA (4.5:1 for normal text, 3:1 for large text).

## 3. TASKS
T11.1 Run axe accessibility audit on 6 core routes: home, design input, results,
      projects, reports, health.
T11.2 Fix all axe critical and serious violations.
T11.3 Keyboard navigation: every interactive element reachable and operable via keyboard.
T11.4 200% zoom: layout and functionality must not break.
T11.5 Color contrast audit: fix any violations against WCAG AA.
T11.6 Implement gate:a11y — asserts zero axe critical/serious on 6 routes.
T11.7 Create docs/phase-2/week-11/A11Y-REPORT.md (filled from template) with axe results,
      keyboard walkthrough, and Lighthouse scores.
T11.8 PWA compliance: manifest, service worker, offline capability.
T11.9 Create docs/phase-2/week-11/USER-GUIDE.md with screenshots and step-by-step
      instructions for the primary user flows.
T11.10 Create docs/phase-2/HANDOVER/DEMO-SCRIPT.md with a guided demo walkthrough.

## 4. EVIDENCE
gate:a11y output, A11Y-REPORT.md, Lighthouse scores, keyboard walkthrough results.

## 5. EXIT GATE
[ ] Zero axe critical/serious on 6 core routes
[ ] Keyboard navigation works on all interactive elements
[ ] 200% zoom does not break layout
[ ] Color contrast meets WCAG AA
[ ] gate:a11y green
[ ] A11Y-REPORT.md filled
[ ] USER-GUIDE.md written
[ ] DEMO-SCRIPT.md written

## 6. DELIVERABLES
docs/phase-2/week-11/{A11Y-REPORT,USER-GUIDE,EXIT-GATE-EVIDENCE}.md |
docs/phase-2/HANDOVER/DEMO-SCRIPT.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
