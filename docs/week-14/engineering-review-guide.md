# Engineering Review Guide ΓÇö Week 14

**For:** Licensed engineer reviewing Bridge Report Studio outputs  
**Status:** DRAFT

---

## What the software computes

The Week 5 engine covers a six-check simply-supported beam design sequence:

1. Design UDL (dead + factored live)
2. Maximum bending moment (wL┬▓/8)
3. Maximum shear force (wL/2 + ╬│Q┬╖P)
4. Bending stress and utilisation
5. Live-load deflection and deflection limit check
6. Shear stress check
7. Governing and adjusted governing utilisation

All intermediate values are reported with source cell references, formula
descriptions, and coefficient names. Nothing is hard-coded without documentation.

---

## What the software does NOT compute

- Punching shear
- Fatigue
- Bearing design
- Seismic / dynamic loads
- Thermal effects
- Multi-span or continuous beam effects
- Any check beyond the six Week 0 constraints

---

## Review checklist

Work through `STANDARD_REVIEW_CHECKLIST` returned in every `/api/calculate` response:

| ID | Question |
|---|---|
| R-001 | All required inputs present and within engineering ranges |
| R-002 | Units consistent (m/kN system) |
| R-003 | Partial factors ╬│G, ╬│Q, ╬│M match applicable design code |
| R-004 | alpha and correctionK3 defaults reviewed and approved |
| R-005 | Dead load UDL includes all relevant components |
| R-006 | Deflection limit formula appropriate for bridge type and code |
| R-007 | Shear area assumption confirmed for this cross-section |
| R-008 | All FAIL constraints understood |
| R-009 | Governing utilisation consistent with critical check |
| R-010 | Simply-supported model appropriate for this span |
| R-011 | AMB-001 deflection limit denominator resolved |
| R-012 | Input fingerprint matches source input file |
| R-013 | Engine version matches parity-tested version |
| R-014 | Licensed engineer signs off |

---

## Sign-off block

**I confirm that I have reviewed this calculation, the inputs, the
assumptions, the limitations, and the results. I accept or note exceptions as
recorded below.**

Project code: ____________________  
Revision: ____________________  
Engine version: ____________________  
Input fingerprint: ____________________  

Review decision:
- [ ] Accepted ΓÇö all checks satisfactory
- [ ] Accepted with conditions ΓÇö conditions recorded below
- [ ] Not accepted ΓÇö findings recorded below

Reviewer name: ____________________  
Qualification: ____________________  
Date: ____________________  
Signature: ____________________

Findings / conditions:

_______________________________________________________________

_______________________________________________________________
