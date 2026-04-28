# TEST MATRIX — Phase 0
**Date:** 2026-04-25  
**Status:** DRAFT — Pending test framework approval

---

## Test Framework Recommendation

**Proposed:** Vitest (already used in SECONDARY app)  
**Rationale:**
- Already in SECONDARY's `pnpm` workspace — proven working
- Compatible with the PRIMARY app's Vite/TypeScript stack
- Zero-config for TypeScript
- Fast (native ESM, no transpile overhead)
- Non-disruptive: add as `devDependency`, tests run with `vitest --run`

**Install command (PRIMARY app):**
```bash
npm install --save-dev vitest @vitest/ui
```

**Test location:** `client/src/report-engine/lib/__tests__/`

---

## Test Categories

### Category A: Ported from SECONDARY (immediate, low risk)

These tests already exist in SECONDARY and pass. Port them to PRIMARY with adjusted import paths.

| Test ID | Test Name | Source File | Target File | Status |
|---|---|---|---|---|
| A01 | Cross-section from survey points | `astra-improvements.test.ts` | `__tests__/hydraulicCalc.test.ts` | Port |
| A02 | Legacy inputs fallback | `astra-improvements.test.ts` | `__tests__/hydraulicCalc.test.ts` | Port |
| A03 | Dual discharge check (max method) | `astra-improvements.test.ts` | `__tests__/hydraulicCalc.test.ts` | Port |
| A04 | F1 factor for foundation discharge | `astra-improvements.test.ts` | `__tests__/hydraulicCalc.test.ts` | Port |
| A05 | 1.272× max scour factor | `astra-improvements.test.ts` | `__tests__/hydraulicCalc.test.ts` | Port |
| A06 | F2 factor for foundation depth | `astra-improvements.test.ts` | `__tests__/hydraulicCalc.test.ts` | Port |
| A07 | IRC slab effective span | `astra-improvements.test.ts` | `__tests__/ircSlabCalc.test.ts` | Port |
| A08 | 45° dispersion | `astra-improvements.test.ts` | `__tests__/ircSlabCalc.test.ts` | Port |
| A09 | K factor from IRC 21:2000 table | `astra-improvements.test.ts` | `__tests__/ircSlabCalc.test.ts` | Port |
| A10 | Working stress design (M25/Fe415) | `astra-improvements.test.ts` | `__tests__/ircSlabCalc.test.ts` | Port |
| A11 | Distribution steel (0.2M1 + 0.3M2) | `astra-improvements.test.ts` | `__tests__/ircSlabCalc.test.ts` | Port |
| A12 | ASTRA linear impact factor | `astra-improvements.test.ts` | `__tests__/ircSlabCalc.test.ts` | Port |
| A13 | Class A vehicle geometry | `astra-improvements.test.ts` | `__tests__/loadCalc.test.ts` | Port |
| A14 | 70R Track geometry | `astra-improvements.test.ts` | `__tests__/loadCalc.test.ts` | Port |
| A15 | 70R Wheel geometry | `astra-improvements.test.ts` | `__tests__/loadCalc.test.ts` | Port |
| A16 | All 16 vehicle types defined | `astra-improvements.test.ts` | `__tests__/loadCalc.test.ts` | Port |
| A17 | Live load moment calculation | `astra-improvements.test.ts` | `__tests__/loadCalc.test.ts` | Port |

---

### Category B: New Tests for PRIMARY-only Modules

| Test ID | Test Name | Module | Priority |
|---|---|---|---|
| B01 | IS 456 two-way slab — interior panel coefficients | `slabCalc.ts` | High |
| B02 | IS 456 two-way slab — span ratio > 2 → one-way | `slabCalc.ts` | High |
| B03 | IS 456 one-way slab — simply supported moment | `slabCalc.ts` | High |
| B04 | IS 456 one-way slab — cantilever moment | `slabCalc.ts` | Medium |
| B05 | Deflection check — span/depth ratio | `slabCalc.ts` | Medium |
| B06 | Min steel 0.12% | `slabCalc.ts` | Medium |
| B07 | Pier 5 load cases — all SAFE for default input | `pierCalc.ts` | High |
| B08 | Pier governing case = LC3 (seismic) for default | `pierCalc.ts` | High |
| B09 | Pier footing qmax ≤ SBC | `pierCalc.ts` | High |
| B10 | Pier steel Ast_req > 0 | `pierCalc.ts` | Medium |

---

### Category C: Golden-Value Regression Tests (Kherwara Reference Case)

These tests lock in the current output of the PRIMARY app's design engine against the known reference workbook output. They serve as regression guards — any change that breaks these requires explicit justification.

| Test ID | Test Name | Input | Expected Output | Module |
|---|---|---|---|---|
| C01 | Kherwara hydraulics — discharge | Kherwara input | Q ≈ 969 cumecs (from golden xlsx) | `design-engine.ts` |
| C02 | Kherwara hydraulics — velocity | Kherwara input | V ≈ 2.2 m/s | `design-engine.ts` |
| C03 | Kherwara hydraulics — scour depth | Kherwara input | dsm ≈ 3.8 m | `design-engine.ts` |
| C04 | Kherwara hydraulics — afflux | Kherwara input | h ≈ 0.15 m | `design-engine.ts` |
| C05 | Kherwara pier — all 5 LCs SAFE | Kherwara input | status = SAFE | `design-engine.ts` |
| C06 | Kherwara estimation — total cost | Kherwara input | Within ±5% of reference | `design-engine.ts` |

*Note: Golden values must be extracted from `TEST_CURRENT_OUTPUT.xlsx` and `scripts/verify-kherwara-excel-golden.ts` before these tests can be written.*

---

### Category D: Cross-Check Tests (Engine Consistency)

These tests expose the known inconsistency between `design-engine.ts` and `hydraulicCalc.ts`. They are NOT pass/fail tests — they document the difference and require engineer sign-off.

| Test ID | Test Name | Purpose |
|---|---|---|
| D01 | Same input → `hydraulicCalc` vs `design-engine` scour depth | Document 2.0× vs 1.272× difference |
| D02 | Same input → `hydraulicCalc` vs `design-engine` afflux | Document obstruction model difference |
| D03 | Same input → `hydraulicCalc` vs `design-engine` discharge | Document F1 application difference |

---

### Category E: Boundary Value Tests

| Test ID | Test Name | Input | Expected Behavior |
|---|---|---|---|
| E01 | Zero discharge | Q=0 | No division by zero; graceful error |
| E02 | Single cross-section point | 1 point | Returns zero area/perimeter |
| E03 | Span ratio exactly 2.0 | ly/lx = 2.0 | Two-way slab (not one-way) |
| E04 | Span ratio 2.001 | ly/lx = 2.001 | One-way slab |
| E05 | Very short span (L=1m) | L=1m | Impact factor = 50% (IRC:6) |
| E06 | Very long span (L=50m) | L=50m | Impact factor = 10% (IRC:6) |
| E07 | Zero piers | numPiers=0 | No pier obstruction in afflux |
| E08 | Negative qmin (tension) | High moment | qmin clamped to 0 |
| E09 | SBC exceeded | qmax > SBC | bearOK = false |
| E10 | Sliding FOS < 1.5 | Low friction | slidOK = false |

---

### Category F: Unit Consistency Tests

| Test ID | Test Name | Check |
|---|---|---|
| F01 | Manning velocity in m/s | V > 0 for valid inputs |
| F02 | Discharge in cumecs (m³/s) | Q = A × V |
| F03 | Scour depth in metres | d2 > 0 |
| F04 | Afflux in metres | h ≥ 0 |
| F05 | Moments in kN·m | M > 0 for loaded span |
| F06 | Steel area in mm²/m | Ast > 0 |
| F07 | Footing pressure in kPa | qmax > 0 |

---

### Category G: Invalid Input Tests

| Test ID | Test Name | Input | Expected |
|---|---|---|---|
| G01 | Negative slope | slope = -100 | Error or NaN guard |
| G02 | Zero rugosity | n = 0 | Division by zero guard |
| G03 | HFL below bed level | hfl < bedLevel | Negative depth → guard |
| G04 | Zero span length | spanLength = 0 | Guard |
| G05 | Negative silt factor | Ksf < 0 | Guard |

---

## Test Execution Plan

### Phase 0 (immediate)
1. Install Vitest in PRIMARY app
2. Port Category A tests (already written, just change imports)
3. Run: `npx vitest --run`
4. All Category A tests must pass before any code changes

### Phase 0 (after Category A passes)
5. Write Category B tests for `slabCalc.ts` and `pierCalc.ts`
6. Write Category D cross-check tests to document engine inconsistencies
7. Write Category E boundary value tests

### Phase 0 (after engineering verification)
8. Write Category C golden-value tests once engineer confirms reference values
9. Write Category G invalid input tests and add guards to engines

### Phase 1 (post-consolidation)
10. Write Category F unit consistency tests
11. Add CI pipeline (GitHub Actions) to run `vitest --run` on every commit

---

## Regression Cases Where Both Apps Currently Differ

| Case | `hydraulicCalc.ts` result | `design-engine.ts` result | Difference |
|---|---|---|---|
| Kherwara scour (default F1=1.3, 1.272×) | d2 × 1.272 | d2 × 2.0 | ~57% deeper in engine |
| Kherwara afflux (deck 0.83m vs actual) | Uses actual deckThickness | Uses 0.83m hardcode | Depends on actual thickness |
| Kherwara F1 application | F1 on scour only | F1 on total discharge | Different Q downstream |

*These differences must be resolved by engineer before the engines are unified.*
