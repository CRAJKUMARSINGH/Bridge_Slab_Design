# SOURCE DEFECT REGISTER

Rule: a source value is never silently "fixed". It is registered, then a reviewed
decision chooses the app behaviour.

## Machine-readable token convention

`gate:parity` reads this file. Every unresolved parity gap carries a token at the
start of its **Defect** cell:

- `[<BRIDGE_CODE>/<QUANTITY>]` — one measured quantity disagrees with the oracle
  (so `[SOM` + `-LAR/V]` is what SD-02's token looks like, literally).
- `[<BRIDGE_CODE>/*]` — the whole bridge cannot be compared, because no repository
  input reproduces the oracle. This **subsumes** the per-quantity tokens: when the
  input is the problem, every quantity follows from that one cause and does not
  need its own row.

Removing a token without removing the disagreement turns `gate:parity` RED. That
is the point: a green parity gate means "nothing has moved, and every place where
the engine does not match the oracle is registered, owned and visible."

## Defects

| ID | Defect | Evidence (file / sheet / cell) | Required app behaviour | Decision | Owner | Status |
|---|---|---|---|---|---|---|
| SD-01 | `[SOM-KHW/*]` — the only repository input for this bridge does not reproduce the oracle, and the oracle itself already declares that input superseded. Computed A 141.500 m² vs oracle 490.300 m² (rel 7.114e-1); V 1.718090 vs 1.835468 m/s (rel 6.395e-2); Q 243.110 vs 899.930 cumecs (rel 7.299e-1); P 60.773 vs 190.707 m. | `corpus/oracle/GOLDEN-ORACLE.json` → `superseded[0]` ("A=141.5 vs 490.30; Q=243.1 vs 899.93"); `scripts/fixtures/kherwara-project-input.ts`; `scripts/fixtures/kherwara-hydraulics-snapshot.json`; `corpus/golden/SOM-KHW.json` | WARN — a golden fixture whose own input is known-wrong must be reported as SKIP, never as a pass | WARN | W02 verifier (Kiro) | OPEN |
| SD-02 | `[SOM-LAR/V]` `[SOM-LAR/Q]` — velocity and discharge disagree with the oracle by 2.30e-4, i.e. 2.3× the oracle's own ROUNDED tolerance (1e-4). Root cause is the wetted-perimeter definition, not the Manning code: the cross-section polyline yields P = 117.0568 m while the oracle's own V implies P = 117.0163 m (rel 3.457e-4), and Manning V ∝ P^(−2/3) propagates exactly (2/3)×3.457e-4 = 2.305e-4 into both V and Q. | `corpus/golden/SOM-LAR.json` → `oracleVsComputed`, `perimeterRootCause`; sheet `HYDRAULICS` (P not stated by the oracle); `client/src/report-engine/lib/hydraulicCalc.ts` `computeCrossSection` | WARN — carry the oracle's own p (which the workbook must state) or adopt the workbook's perimeter definition | WARN | W02 verifier (Kiro) | OPEN |
| SD-03 | `[BED-HL/*]` — no repository input snapshot matches this bridge, so it cannot be compared at all. The oracle is hfl 442.5 / 18 spans / spanLength 10.8 m / skew 30°, whereas `scripts/fixtures/high-level-project-input.ts` is hfl 286.5 / 4 spans / spanLength 12 m / skew 0 (a different bridge). | `corpus/oracle/GOLDEN-ORACLE.json` → `bridges["BED-HL"]`, `superseded[1]`; `corpus/golden/BED-HL.json` → `inputSnapshotGap` | WARN — frozen as expectations only; reported as SKIP until a matching input snapshot is supplied | WARN | W02 verifier (Kiro) | OPEN |

## Decision log

### SD-02 — wetted perimeter definition (Manning velocity / discharge)

**Decision:** LEAVE OPEN, pending a licensed engineer's adjudication of the correct
wetted-perimeter definition. The engine is NOT to be adjusted to close this gap:
the delta is 2.3e-4, inside the HAND band (2e-2) and therefore immaterial to the
design output, but it is outside the ARITH/ROUNDED bands the oracle declares for
these quantities, so it may not be silently absorbed by widening a tolerance.

**Rationale:** the two candidate definitions are (a) the length of the whole
cross-section polyline between the first and last surveyed point — what the code
does today, which counts the dry segments above HFL — and (b) the wetted perimeter
only. Neither matches: the polyline sum is 117.0568 m, wetted-only is 102.018 m,
and the oracle implies 117.0163 m. The oracle is a third thing: a nearly-full
polyline with a ~0.04 m difference, which is the size of one survey point. The
placeholder value carried in the code defaults (`perimeter: 117.02`) is closer to
the oracle than either computed definition, which suggests the workbook's P was
taken from a survey sheet rather than integrated from `crossSectionData`.

**IRC/clause basis:** IRC SP-13 Art. 5 (area-velocity method); IRC:78-1983
Cl. 703.2.2.1. Manning's equation is `V = (1/n)·(A/P)^(2/3)·√S`; the definition of
`P` is a *measurement* convention, not a formula, which is why it cannot be
resolved from the code alone.

**Approved by:** — (pending) | **Date:** —

### SD-01, SD-03 — unusable repository inputs

**Decision:** REGISTER as fixture defects. No engine change is implied or permitted:
in both cases the engine computes correctly from the input it is given. The fix is
to supply a corrected/verified input snapshot.

**Rationale:** registering these as engine defects would invite exactly the failure
mode this register exists to prevent — "fixing" the code to match a number that is
itself unverified. `gate:parity` treats both as explicit SKIPs with a declared
reason, never as passes.

**Approved by:** — (pending) | **Date:** —

## Sign-off

This register is DRAFT. It becomes binding only when a licensed engineer records a
decision in the log above with name, date and registration number.
