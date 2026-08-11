# User Manual ΓÇö Bridge Report Studio

**Version:** 0.15.0-rc  
**Status:** DRAFT

---

## 1. Purpose

Bridge Report Studio calculates bridge slab design checks and produces a
narrative HTML/PDF design report. All outputs are DRAFT until a licensed
engineer records review status.

---

## 2. Quick start

```bash
npm install
npm run dev              # starts development server on port 5000
```

---

## 3. Running a calculation

### Via API
```bash
curl -X POST http://localhost:5000/api/calculate \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-change-before-production" \
  -d @tests/golden/kherwara/inputs-calculation.json
```

The response contains:
- `overallStatus` ΓÇö PASS or FAIL
- `failedChecks` ΓÇö list of failed check IDs
- `intermediates` ΓÇö all calculated values with trace metadata
- `constraints` ΓÇö all check results
- `traceRecords` ΓÇö formula + source cell for each result
- `assumptions` ΓÇö list of documented assumptions
- `reviewChecklist` ΓÇö engineering review questions

### Via HTML report
```bash
curl -X POST http://localhost:5000/api/report/html \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-change-before-production" \
  -d @tests/golden/kherwara/inputs-calculation.json \
  -o report.html
```
Open `report.html` in a browser and use File ΓåÆ Print ΓåÆ Save as PDF.

---

## 4. Input contract

All inputs follow `lib/api-zod/src/input-schema.ts` (schema version 0.4.0).

| Field | Unit | Source cell | Notes |
|---|---|---|---|
| spanLength | m | Inputs!B3 | Effective span |
| deckWidth | m | Inputs!B4 | Total deck width |
| girderSpacing | m | Inputs!B5 | Centre-to-centre |
| girderCount | ΓÇö | Inputs!B6 | Integer |
| concreteStrength | MPa | Inputs!B7 | fck |
| steelGrade | MPa | Inputs!B8 | fy |
| deckThickness | m | Inputs!B9 | |
| liveLoadUdl | kN/m | Inputs!B10 | |
| liveLoadPoint | kN | Inputs!B11 | Set 0 if not applicable |
| secondMoment | mmΓü┤ | Inputs!B12 | |
| sectionModulus | mm┬│ | Calc!B9 | Chosen section modulus |
| alpha | ΓÇö | Calc!B13 | Default 0.9 |
| correctionK3 | ΓÇö | Calc!B21 | Default 1.2, see AMB-001 |

---

## 5. Running parity tests

```bash
# Week 0 hydraulics regression (must always pass)
npx tsx scripts/week0/verify-golden.ts

# Week 6 calculation parity (must pass; --tamper must fail)
npx tsx scripts/week6/verify-golden.ts
npx tsx scripts/week6/verify-golden.ts --tamper
```

---

## 6. Adding a new project

1. Create `tests/golden/<project-key>/inputs-calculation.json`
2. Run `npx tsx scripts/week6/verify-golden.ts --update` to generate snapshot
3. Engineering owner reviews and approves the snapshot
4. Add snapshot to version control with a decision-log entry

---

## 7. Important engineering notes

- All outputs are DRAFT until a licensed engineer records sign-off
- Failed checks are NEVER suppressed ΓÇö they appear in UI and report
- `creat.md` is the project charter ΓÇö update it at every milestone
- Do not treat a passing software test as an approved engineering design
