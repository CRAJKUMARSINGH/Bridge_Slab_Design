# GOLDEN ORACLE TABLE — tolerance policy + seeded entries

P2-W02A · Status: **DRAFT** · Owner: Devin · Verifier: Antigravity

| Part | Task | State |
|---|---|---|
| §1 Tolerance policy | T2A.6 | **COMPLETE** (this document) |
| §2 Category assignment procedure | T2A.6 | **COMPLETE** (this document) |
| §3 Oracle table | T2A.4 | **FROZEN** — 55 rows, every row carries its source cell; `gate:oracle` **PASS** (270 assertions) |

This document is the human-readable counterpart of
[corpus/oracle/GOLDEN-ORACLE.json](file:///c:/Users/Rajkumar/Bridge_Slab_Design/corpus/oracle/GOLDEN-ORACLE.json).
The JSON is the machine source of truth; this table is the reviewed narrative for it.

---

## §1 Tolerance policy (T2A.6)

Three bands. There is no fourth band, and no band is ever widened to close a gap:
a value outside its band is a **registered defect** (see
[SOURCE-DEFECT-REGISTER.md](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md)),
never a re-categorised value.

The pass predicate for every oracle value is:

```
within  ⇔  |computed − oracle|  ≤  rtol · max(1, |oracle|)
```

`max(1, |oracle|)` makes each band **absolute** below a magnitude of 1 and **relative**
above it, so a band means "1e-6 absolute or relative, whichever is looser" without a
second rule. This is the same predicate `gate:parity` uses for its fixture baseline; only
`rtol` differs.

### ARITH — `rtol = 1e-6`

For a value the app computes by a **closed-form arithmetic expression** that the source
workbook also computes by the same expression. The source cell holds a full-precision
Excel `double`, so a correct port must agree to floating-point rounding of a double and
nothing more.

Examples: cross-section area `A`, wetted perimeter `P`, `A_unobstructed`, deck
obstruction area (including the exact `0` for BED-HL).

Why not 0: any re-association of the same arithmetic (`a+b+c` vs `(a+b)+c`) changes the
last bits of a double. 1e-6 is ~2⁴⁰ ULPs at magnitude 1 — loose enough to survive
re-association, far too tight to absorb a swapped operand.

### ROUNDED — `rtol = 1e-4`

For a value the source reports **after a rounding, interpolation or table/chart lookup**:
Manning velocity `V`, discharge `Q`, regime width, anything read off SP-16 or a stress
table. 1e-4 absorbs the source's own display rounding (typically 3–6 significant figures)
without absorbing a real method difference.

**This band is load-bearing and is NOT slack.** `SD-02` (SOM-LAR `V`, `Q`) sits at
**2.30e-4** — 2.3× this band — because the source's wetted-perimeter convention differs
from the engine's polyline sum. That delta is deliberately left **outside** the band and
registered. Widening ROUNDED to 1e-3 to make it green is exactly the failure this policy
exists to prevent.

### HAND — `rtol = 2e-2` (2 %)

For a value the source **typed or eyeballed by hand**, or carried between sheets with
manual rounding: afflux `h`, depth of scour `dsm`, drag factor of safety, `FS_overturning`,
`FS_sliding`, `Ka`. 2 % is the honest precision of a hand-carried figure.

### Cross-reference: two different questions

| Question | Band | Where |
|---|---|---|
| Did the engine port **move**? (byte-identity vs the frozen baseline) | `rtol 1e-9` | `gate:parity` |
| Does the engine **agree with the source workbook**? | ARITH / ROUNDED / HAND | `gate:oracle`, this table |

`gate:parity` at 1e-9 is a *regression* band: it makes any drift visible. `gate:oracle`'s
bands are *agreement* bands: they say how close the port is allowed to be to a hand-typed
number. A value can be inside its regression band and outside its agreement band at the
same time — that is the SD-02 case, and it is reported as such.

### The bands are frozen in JSON, and the gate polices them

`GOLDEN-ORACLE.json.toleranceCategories` is the single source of truth
(`{ "ARITH": 1e-6, "ROUNDED": 1e-4, "HAND": 2e-2 }`). `gate:oracle` asserts that object
**deep-equals** the canonical triple, so a band cannot be loosened by editing the oracle:
loosening the JSON turns the gate RED. Any change to a band requires an edit to this
document **and** to the gate's `CANONICAL_TOLERANCES`, i.e. a reviewed decision, not a
quiet number change.

---

## §2 Category assignment procedure (T2A.6)

Assign in this order and stop at the first match:

1. Source cell is a **formula** whose result the app reproduces by the same closed form
   → **ARITH**.
2. Source cell is a **literal number** the author typed, or a chart/table lookup, or a
   formula result the author then **rounded in a later cell**
   → **ROUNDED** if it carries ≥4 significant figures, otherwise **HAND**.
3. Source cell is a figure carried **between sheets** with manual rounding, or a
   stability/unit factor-of-safety → **HAND**.
4. Ambiguous → **HAND** (the loosest band). Never default to ARITH; a value asserted
   tighter than its provenance supports produces false REDs downstream.

The currently frozen 55 values were assigned as recorded in the `Category` column of §3.

---

## §3 Oracle table

Every row is a frozen entry in `GOLDEN-ORACLE.json` and carries its **source cell**.
The JSON holds the full-precision source `double`; the `Value` column below shows it
rounded for reading. `gate:oracle` asserts value + unit + sheet + cell + tolerance on
**every** row. Independent cross-check (T2A.4): all 55 `(sheet, cell)` pairs were
re-resolved against the emitted `corpus/oracle/<bridge>.json` and agree within their band
— **55/55, 0 mismatches**.

### SOM-KHW — `Stability Analysis SUBMERSIBLE BRIDGE ACROSS SOM RIVER 1.xls` (21 rows)

| Quantity | Value | Unit | Sheet | Cell | Tolerance | Category |
|---|---|---|---|---|---|---|
| A | 490.300 | m2 | HYDRAULICS | F27 | 1e-6 | ARITH |
| P | 190.707 | m | HYDRAULICS | G27 | 1e-6 | ARITH |
| R | 2.570955 | m | HYDRAULICS | C31 | 1e-6 | ARITH |
| V | 1.835468 | m/s | HYDRAULICS | C34 | 1e-4 | ROUNDED |
| Q | 899.930 | cumecs | HYDRAULICS | C35 | 1e-4 | ROUNDED |
| L_regime | 144.180 | m | afflux calculation | C17 | 1e-4 | ROUNDED |
| Db | 11.06 | cumecs/m | afflux calculation | C32 | 1e-4 | ROUNDED |
| A_waterway | 474.000 | m2 | afflux calculation | G45 | 1e-6 | ARITH |
| a | 337.916 | m2 | afflux calculation | C77 | 1e-6 | ARITH |
| hfl | 100.600 | m | afflux calculation | B49 | 1e-6 | ARITH |
| deckTop | 101.600 | m | afflux calculation | B50 | 1e-6 | ARITH |
| slabThk | 0.830 | m | afflux calculation | B51 | 2e-2 | HAND |
| AFL | 100.830 | m | afflux calculation | F79 | 2e-2 | HAND |
| dsm | 5.820 | m | afflux calculation | B33 | 2e-2 | HAND |
| afflux | 0.230 | m | afflux calculation | B78 | 2e-2 | HAND |
| Ka | 0.496 | - | STABILITY CHECK ABUTMENT | C54 | 1e-4 | ROUNDED |
| dragFS | 34.59 | - | Deck Anchorage | H36 | 2e-2 | HAND |
| Pmax | 137.304 | kN/m2 | STABILITY CHECK FOR PIER | M68 | 1e-4 | ROUNDED |
| FS_overturning | 8.77 | - | STABILITY CHECK ABUTMENT | G79 | 2e-2 | HAND |
| FS_sliding | 3.10 | - | STABILITY CHECK ABUTMENT | G144 | 2e-2 | HAND |
| Ash | 35.836 | mm2 | STEEL IN FLARED  PIER BASE  | D87 | 1e-4 | ROUNDED |

### SOM-LAR — `Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls` (17 rows)

| Quantity | Value | Unit | Sheet | Cell | Tolerance | Category |
|---|---|---|---|---|---|---|
| A | 440.825 | m2 | HYDRAULICS | F23 | 1e-6 | ARITH |
| P | 117.016 | m | HYDRAULICS | C26 | 1e-6 | ARITH |
| V | 2.410981 | m/s | HYDRAULICS | C30 | 1e-4 | ROUNDED |
| Q | 1062.821 | cumecs | HYDRAULICS | C31 | 1e-4 | ROUNDED |
| L_regime | 156.780 | m | afflux calculation | C17 | 1e-4 | ROUNDED |
| Db | 12.89 | cumecs/m | afflux calculation | C32 | 1e-4 | ROUNDED |
| deckObstruction | 78.684 | m2 | afflux calculation | C55 | 1e-6 | ARITH |
| a | 318.330 | m2 | afflux calculation | C77 | 1e-6 | ARITH |
| hfl | 99.500 | m | afflux calculation | B49 | 1e-6 | ARITH |
| AFL | 99.820 | m | afflux calculation | F79 | 2e-2 | HAND |
| obstructedVelocity | 3.36 | m/s | afflux calculation | C82 | 1e-4 | ROUNDED |
| dsm | 6.440 | m | afflux calculation | B33 | 2e-2 | HAND |
| afflux | 0.320 | m | afflux calculation | B78 | 2e-2 | HAND |
| FS_overturning | 5.09 | - | STABILITY CHECK ABUTMENT | G79 | 2e-2 | HAND |
| FS_sliding | 2.44 | - | STABILITY CHECK ABUTMENT | G144 | 2e-2 | HAND |
| dragFS | 15.70 | - | Deck Anchorage | H36 | 2e-2 | HAND |
| Pmax | 153.891 | kN/m2 | STABILITY CHECK FOR PIER | M68 | 1e-4 | ROUNDED |

### BED-HL — `plus Stability Analysis HIGH LEVEL BRIDGE - BEDACH.xls` (17 rows)

| Quantity | Value | Unit | Sheet | Cell | Tolerance | Category |
|---|---|---|---|---|---|---|
| A | 613.895 | m2 | HYDRAULICS | F48 | 1e-6 | ARITH |
| P | 210.566 | m | afflux calculation | C8 | 1e-6 | ARITH |
| V | 2.146601 | m/s | HYDRAULICS | C55 | 1e-4 | ROUNDED |
| Q | 1317.788 | cumecs | HYDRAULICS | C56 | 1e-4 | ROUNDED |
| L_regime | 174.390 | m | afflux calculation | C18 | 1e-4 | ROUNDED |
| Db | 8.34 | cumecs/m | afflux calculation | C36 | 1e-4 | ROUNDED |
| deckObstruction | 0 | m2 | afflux calculation | C59 | 1e-6 | ARITH |
| a | 783.470 | m2 | afflux calculation | C85 | 1e-6 | ARITH |
| hfl | 442.500 | m | afflux calculation | B53 | 2e-2 | HAND |
| deckTop | 444.530 | m | afflux calculation | B54 | 2e-2 | HAND |
| slabThk | 0.830 | m | afflux calculation | B55 | 2e-2 | HAND |
| AFL | 442.590 | m | afflux calculation | F87 | 2e-2 | HAND |
| dsm | 4.820 | m | afflux calculation | B37 | 2e-2 | HAND |
| afflux | 0.090 | m | afflux calculation | B86 | 2e-2 | HAND |
| FS_overturning | 3.69 | - | STABILITY CHECK ABUTMENT | G79 | 2e-2 | HAND |
| FS_sliding | 1.76 | - | STABILITY CHECK ABUTMENT | G138 | 2e-2 | HAND |
| Pmax | 192.152 | kN/m2 | STABILITY CHECK FOR PIER | M68 | 1e-4 | ROUNDED |

**Total frozen: 55 rows** (SOM-KHW 21, SOM-LAR 17, BED-HL 17) — the values in
`GOLDEN-ORACLE.json` v1.1.0, above the 48-row floor by 7.

Tolerance categories: ARITH 1e-6 | ROUNDED 1e-4 | HAND 2e-2.
Coverage rule: every engine module in [MODULE-MATRIX](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/MODULE-MATRIX.md) must have ≥3 oracle entries.

---

## §4 Residual gaps after T2A.4

The 48-row floor is met (55 rows). The list T2A.4 was asked to cover resolves as follows.

**Covered, each with its source cell in §3** — verified against the emitted extract:

- E-01: `R` 2.570955 and `L` 144.180 (SOM-KHW); `P` 117.016 (SOM-LAR); `P` 210.566 (BED-HL).
- E-02: `a` 337.916 / 318.330 / 783.470, `AFL` 100.83 / 99.82 / 442.59, obstructed velocity
  3.36 (SOM-LAR).
- E-03: `Db` 11.06 / 12.89 / 8.34.
- E-06: `Pmax` third case 192.152 (BED-HL); the full `FS_overturning` set 8.77 / 5.09 / 3.69;
  the full `FS_sliding` set 3.10 / 2.44 / 1.76; `Ash` 35.836.

**Located but not frozen — the value is not a clean numeric cell** (a finding, recorded in
[SOURCE-DEFECT-REGISTER.md](file:///c:/Users/Rajkumar/Bridge_Slab_Design/docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md) §5, not silently omitted):

- E-05 SOM water-current pair `16.5736` / `17.2753` **is** in the corpus at
  `STABILITY CHECK FOR PIER!M106` and `!M147`, but neither row carries a label in the R1C1
  dump, so the quantity name would be a guess. Held for T6A.11 (numeric-agreement pass),
  which will freeze them once the E-05 engine module names them.
- E-05 BED-HL water-current set (77.6352 / 67.232 / 43.2337) and the E-10 `LLOAD` set
  (788.266 kN, 244.253 kNm, 2247.881 kNm) appear **nowhere** as cells in the three bridges —
  verified by an exact-and-tolerant sweep of every sheet. These are engine-derived targets
  from E-05/E-10, not source literals; they belong to T6A.11, which compares engine output
  to the spec value, not to a workbook cell.
- E-2/T7A.3 Bedach skew angle: `30` occurs only in label-bearing cells
  (`HYDRAULICS!A9`, `CROSS SECTION!A9`), not as a standalone numeric input; deferred to
  T7A.3 rather than frozen here as a bare `30`.
