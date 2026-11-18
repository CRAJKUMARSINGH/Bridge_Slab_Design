<!-- V-03/VERIFICATION-INSTRUCTIONS.md -->
# V-03 — VERIFY ENGINEERING CORRECTNESS
Re-run: check, test, gate:parity, verify:clauses, coverage.
Falsify: F-14 (zero geometry), plus: set every load factor to 1.0 and confirm the
governing case changes; set phi to 0 and confirm checks do not NaN.
Then:
  - print the 5 abutment load cases side by side and confirm every force differs
  - confirm every check returns a CheckResult with codeRef and a non-empty trace
  - confirm no test was weakened: compare assertion counts before/after
  - confirm verify:clauses fails when you add a fake clause citation
  - confirm REVIEW status blocks a REVIEWED transition
Fail if: any two load cases share a force value, or a check returns only a number,
or coverage on lib/engine is below 90%.
