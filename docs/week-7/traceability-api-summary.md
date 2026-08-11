# Week 7 ΓÇö Traceability API and Assumption Register

**Status:** Complete  
**Date:** 11 August 2026

## Deliverable

Traceability module implemented in `lib/engine/src/traceability.ts`.

## Traceability API

Every `calculate()` result includes a `trace` object with one entry per
intermediate value:

```typescript
interface TraceEntry {
  label: string;        // human-readable name
  value: number;        // computed value
  unit: string;         // SI / engineering unit
  formula: string;      // symbolic formula
  sourceCell: string;   // originating workbook cell (e.g. "Calc!D14")
  inputs: string[];     // field names consumed
}
```

## Trace entries (full pipeline)

| Entry | Source cell | Formula |
|---|---|---|
| designUDL | `Calc!D8` | ╬│G┬╖gk + ╬│Q┬╖qk |
| maximumMoment | `Calc!D14` | w┬╖L┬▓/8 |
| maximumShear | `Calc!D20` | w┬╖L/2 + ╬│Q┬╖P |
| bendingStress | `Calc!D26` | M┬╖10Γü╢ / Wel |
| allowableBendingStress | `Factors!B5` | fy / ╬│M |
| bendingUtilisation | `Calc!D30` | ╧â / ╧â_allow |
| liveLoadDeflection | `Calc!D38` | 5┬╖qk┬╖LΓü┤/(384┬╖E┬╖I) |
| deflectionLimit | `Calc!D42` | L┬╖1000 / correctionK3 |
| deflectionUtilisation | `Calc!D44` | ╬┤ / ╬┤_limit |

## Assumption register

Every `calculate()` result also includes an `assumptions` array:

1. Dead load = concrete self-weight only (╬│c = 25 kN/m┬│).
2. Simply-supported span; no continuity or redistribution applied.
3. Elastic section modulus used throughout; no plastic reserve.
4. Load combination: 1.35┬╖Gk + 1.5┬╖Qk (EC2/EC3 pattern).
5. Shear capacity checked via uniform ╧ä assumption on gross section.
6. Deflection: mid-span live-load formula only; dead-load creep not included.
7. alpha (╧êΓéÇ factor) = 0.9 unless engineer-specified.
8. correctionK3 (deflection divisor) = 1.2 unless engineer-specified.

## Review checklist

- [ ] All trace source cells verified against canonical workbook.
- [ ] Assumptions signed-off by licensed engineer.
- [ ] No intermediate value is unexplained in the report.

## Exit gate

Every intermediate value in the pipeline has a trace entry with a source cell.
Assumptions array is non-empty and human-readable. Review checklist completed
before engineering sign-off.
