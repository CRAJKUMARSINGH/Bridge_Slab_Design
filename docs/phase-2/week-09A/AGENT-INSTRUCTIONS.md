# P2-W09A — DPR & MoRTH ESTIMATION PARITY
Primary: Devin | Verifier: Antigravity | Prereq: P2-W09 gate GREEN

## 0. READ FIRST
lib/estimation/** | sheets: Abstract, Bridge measurements, General Abs., Tech Report
corpus/oracle/BED-HL.json | SOURCE-DEFECT-REGISTER.md D-08, D-09

## 1. OBJECTIVE
Produce a DPR-grade estimate: MoRTH item codes, item-wise measurements, deduction
lines, charge stack, and a technical report bound to the computed total.

## 2. HARD CONSTRAINTS
- No hardcoded total. The DPR cost line is computed from the BOQ.
- Every item carries a MoRTH/BSR code and a clause reference.
- Deduction lines are first-class, so PCC net quantities are right.

## 3. TASKS
T9A.1 Item-code registry from the source: 1.1.4, 1.1.5, 1.3.2, 1.4.1, B-2/6.3, and the
      numbered 5-35 series. Map each to a measurement rule and a clause.
T9A.2 Bridge measurements sheet: per-item dimensional breakdown (nos x L x B x D) with
      sub-totals and deduction blocks, not just net totals. Reproduce the annular-filling
      and foundation-deduction lines.
T9A.3 Charge stack: Quality Control 1%, Contingency 1.5%, Prorata 13%, configurable per
      state and year. Flag zero-valued charge lines as suspect (D-08).
T9A.4 Rate set: BSR Road 2022 (Rajasthan) as a dated, versioned, sourced registry.
T9A.5 General Abstract with sub-total, charge stack, grand total in figures and words.
T9A.6 Technical Report template: necessity, specification clauses A-K, decking
      arrangement, design loads, SBC basis, scour, foundation depth rationale,
      reinforcement reference, bearing, approach slab, cap detail, job number,
      estimated cost. Bind the cost to the BOQ (D-09) and fail on mismatch.
T9A.7 Cross-checks: steel from BBS == BOQ steel; concrete from geometry == BOQ concrete;
      excavation from levels == BOQ excavation. Deductions must reconcile.
T9A.8 Emit BOQ Excel with live formulas, BOQ PDF, and boq.json.

## 4. EVIDENCE
BOQ for BED-HL: item list, measurements, deductions, totals, charge stack, grand total.
Paste the DPR cost vs BOQ total reconciliation.

## 5. EXIT GATE
[ ] Every item has a code and a clause reference
[ ] Measurement sheet shows dimensions and deductions
[ ] Charge stack configurable; zero-line flags working
[ ] DPR cost equals BOQ grand total
[ ] Steel/concrete/excavation cross-checks pass
[ ] Excel + PDF + JSON reproducible

## 6. DELIVERABLES
lib/estimation/{items,measurements,charges}/** | docs/phase-2/week-09A/{ITEM-REGISTRY,DPR-TEMPLATE,EXIT-GATE-EVIDENCE}.md
