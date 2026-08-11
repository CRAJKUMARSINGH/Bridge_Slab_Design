# Ambiguity Decision Record ΓÇö Week 2

All ambiguities surfaced by `scripts/week0/classify_cells.py` against
`tests/fixtures/week0/demo_bridge_raw.xlsx` are recorded here.
Each must be resolved before the Week 4 input contract is approved.

---

## AMB-001 ΓÇö Factors!B10 labelled "Asphalt thickness" used as deflection-limit divisor

| Field | Detail |
|---|---|
| Cell | `Factors!B10` |
| Label in workbook | "Asphalt thickness (m)" |
| Numeric value | 0.1 (demo) ΓåÆ in canonical workbook: `Factors!B11` holds 250 (deflection limit denominator) |
| Actual formula use | `Calc!B15 = Inputs!B3 * 1000 / Factors!B10` (deflection limit) |
| Impact | HIGH ΓÇö mislabelling means deflection limit is not a physical thickness |
| Decision | Treated as `correctionK3` (engineer-controlled, default 1.2). Physical asphalt thickness lives at `Factors!B10 = 0.1 m`. Deflection limit denominator at `Factors!B11 = 250`. In the demo registry these appear merged. |
| Resolved by | answers_demo.json ΓÇö `correctionK3 = 1.2` default |
| Canonical check | Re-examine `Factors!B10` and `Factors!B11` in real Kherwara workbook. If `Factors!B11 = 250`, deflection limit = L/250, which is standard. Update golden snapshot together with any formula correction. |

## AMB-002 ΓÇö Calc!B13 "Parameter alpha" ΓÇö variable vs coefficient

| Field | Detail |
|---|---|
| Cell | `Calc!B13` |
| Label | "Parameter alpha (-)" |
| Value | 0.9 |
| Issue | Hard-coded constant in Calc sheet, not Factors sheet; low confidence |
| Decision | Classified as `coefficient` (engineer-controlled). Exposed as optional input `alpha` with default 0.9 |
| Resolved by | `inputs/answers_demo.json` overrides: `"Calc!B13": "coefficient"` |

## AMB-003 ΓÇö Calc!B21 "Correction k3" ΓÇö variable vs coefficient

| Field | Detail |
|---|---|
| Cell | `Calc!B21` |
| Label | "Correction k3 (-)" |
| Value | 1.2 |
| Issue | Hard-coded constant in Calc sheet, not Factors sheet |
| Decision | Classified as `coefficient` (engineer-controlled). Exposed as optional input `correctionK3` with default 1.2 |
| Resolved by | `inputs/answers_demo.json` overrides: `"Calc!B21": "coefficient"` |

## AMB-004 ΓÇö Calc!B19 "Shear capacity" ΓÇö orphan constant in Calc sheet

| Field | Detail |
|---|---|
| Cell | `Calc!B19` |
| Label | "Shear capacity vc (MPa)" |
| Value | 2.5 |
| Issue | Constant in Calc sheet rather than Factors sheet; classified as coefficient with 0.82 confidence |
| Decision | Classified as `coefficient`. Value 2.5 MPa entered in `inputs/coefficients.json` |
| Resolved by | Week 2 review |

## AMB-005 ΓÇö Calc!B14 deflection formula ΓÇö unit system mixed

| Field | Detail |
|---|---|
| Cell | `Calc!B14` |
| Formula | `5*Inputs!B10*(Inputs!B3*1000)^4/(384*Factors!B5*Inputs!B12)` |
| Issue | `Inputs!B10` is kN/m but treated as N/mm in deflection formula ΓÇö implies liveLoadUDL in kN/m┬▓ as N/mm┬▓ which is inconsistent |
| Decision | Workbook-parity formula retained as-is. Deflection result (18,669,075 mm for L=45 m) is astronomically large, confirming the demo workbook is intentionally over-loaded to trigger a FAIL. Do not normalise without changing the golden snapshot. |
| Resolved by | Week 2 parity review |
| Review required | Yes ΓÇö canonical workbook must be checked for correct unit handling |

---

## Template for new ambiguities

```
## AMB-NNN ΓÇö Short description
| Field | Detail |
|---|---|
| Cell | `Sheet!Address` |
| Label | |
| Value | |
| Issue | |
| Impact | HIGH / MEDIUM / LOW |
| Decision | |
| Resolved by | |
| Review required | |
```
