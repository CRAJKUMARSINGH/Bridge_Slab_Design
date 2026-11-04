<!-- V-09A/VERIFICATION-INSTRUCTIONS.md -->
# V-09A — VERIFY ESTIMATION & DPR
Re-run: verify:rates, gate:boq.
Falsify: F-15, F-16, plus: remove a rate's date and confirm verify:rates goes red.
Then:
  - pick 3 BOQ lines and hand-check the measurement arithmetic against the sheet
  - confirm deduction lines reconcile (PCC net is right)
  - confirm the charge stack is configurable and that a zero charge line is flagged (D-08)
  - confirm the DPR cost line is computed from the BOQ, not typed (D-09)
  - confirm unmapped items are surfaced, not dropped
Fail if: a total is self-referential, a rate has no source or date, or the DPR cost
disagrees with the BOQ total.
