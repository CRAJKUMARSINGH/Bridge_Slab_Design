<!-- V-11/VERIFICATION-INSTRUCTIONS.md -->
# V-11 — VERIFY ACCESSIBILITY & UX
Re-run: gate:a11y, gate:perf.
Falsify: F-18, plus: navigate the whole primary flow with keyboard only and record
every step; zoom to 200%; force a route error and confirm the boundary recovers.
Then:
  - run axe yourself on all 6 routes and paste the raw report
  - confirm every engineering input has a unit, a range hint, and inline validation
  - confirm the onboarding tour is keyboard-operable and dismissible
  - confirm the offline banner appears and results are labelled local-until-saved
  - confirm contrast >= 4.5:1 on the light theme too, not just dark
Fail if: any critical/serious violation remains, or a field lacks a unit, or the
light theme was never actually tested.
