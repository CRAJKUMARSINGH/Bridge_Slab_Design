# P2-W09 — ESTIMATION ENGINE & RATE REGISTRY
Primary: Devin | Verifier: Antigravity | Prereq: W07A | Gate: verify:rates

## 0. READ FIRST
lib/estimation/** | docs/phase-2/_templates/MEASUREMENT-RULES.md
corpus/oracle/BED-HL.json (General Abs., Tech Report sheets)

## 1. OBJECTIVE
Build the estimation engine: MoRTH item codes, measurement rules, rate registry,
and the charge stack. Establish verify:rates as the validation gate.

## 2. HARD CONSTRAINTS
- Every rate has a source, a date, and an owner.
- Every BOQ line resolves to one row in MEASUREMENT-RULES.md.
- No hardcoded total — the estimate is computed from the BOQ.

## 3. TASKS
T9.1 Create docs/phase-2/_templates/MEASUREMENT-RULES.md (filled) with item code,
     description, formula, unit, rounding, wastage %, clause, and deduction rule.
T9.2 Implement the item-code registry: 1.1.4, 1.1.5, 1.3.2, 1.4.1, B-2/6.3, and the
     numbered 5-35 series, each mapped to a measurement rule and a clause.
T9.3 Implement the rate registry: BSR Road 2022 (Rajasthan) as a dated, versioned,
     sourced registry.
T9.4 Implement the charge stack: Quality Control 1%, Contingency 1.5%, Prorata 13%,
     configurable per state and year. Flag zero-valued charge lines as suspect.
T9.5 Implement verify:rates — asserts every rate has a source + date + owner.
T9.6 Create docs/phase-2/week-09/ITEM-REGISTRY.md listing all item codes and their
     measurement rules.

## 4. EVIDENCE
verify:rates output, ITEM-REGISTRY.md, MEASUREMENT-RULES.md (filled).

## 5. EXIT GATE
[ ] Item-code registry complete with measurement rules and clauses
[ ] Rate registry with sources and dates
[ ] Charge stack configurable with zero-line flags
[ ] verify:rates green
[ ] ITEM-REGISTRY.md written
[ ] MEASUREMENT-RULES.md filled

## 6. DELIVERABLES
lib/estimation/{items,measurements,charges}/** |
docs/phase-2/week-09/{ITEM-REGISTRY,EXIT-GATE-EVIDENCE}.md |
docs/phase-2/_templates/MEASUREMENT-RULES.md

## 7/8/9. CLOSE-OUT / REPORT / ROLLBACK
Standard.
