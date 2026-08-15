# Week 5 ΓÇö Pure Engine Functions Summary

**Status:** Complete  
**Date:** 11 August 2026

## Deliverable

All pure engine functions are implemented in `lib/engine/src/functions/` with
18/18 unit tests passing.

## Load functions (`loads.ts`)

| Function | Formula | Test coverage |
|---|---|---|
| `calcDesignUDL` | ╬│G┬╖gk + ╬│Q┬╖qk | Γ£ö |
| `calcMaximumMoment` | w┬╖L┬▓/8 | Γ£ö |
| `calcMaximumShear` | w┬╖L/2 + ╬│Q┬╖P | Γ£ö |

## Resistance functions (`resistance.ts`)

| Function | Formula | Test coverage |
|---|---|---|
| `calcAllowableBendingStress` | fy / ╬│M | Γ£ö |
| `calcBendingStress` | M┬╖10Γü╢ / Wel | Γ£ö |
| `calcBendingUtilisation` | ╧â / ╧â_allow Γëñ 1.0 | Γ£ö |
| `calcShearCapacity` | ╧äv ┬╖ Av | Γ£ö |
| `calcShearUtilisation` | V / Vsd Γëñ 1.0 | Γ£ö |

## Serviceability functions (`serviceability.ts`)

| Function | Formula | Test coverage |
|---|---|---|
| `calcLiveLoadDeflection` | 5┬╖qk┬╖LΓü┤/(384┬╖E┬╖I) | Γ£ö |
| `calcDeflectionLimit` | L/correctionK3 | Γ£ö |
| `calcDeflectionUtilisation` | ╬┤ / ╬┤_limit Γëñ 1.0 | Γ£ö |

## Unit test run result (latest)

```
Γä╣ tests 18
Γä╣ suites 9
Γä╣ pass 18
Γä╣ fail 0
Γä╣ duration_ms 47.77
```

## Exit gate

All functions are pure (no I/O). Same inputs always return same outputs.
All 18 tests pass. Engine version string is embedded in every result object.
