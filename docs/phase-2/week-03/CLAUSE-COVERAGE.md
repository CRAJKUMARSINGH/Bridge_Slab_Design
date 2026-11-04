<!-- docs/phase-2/week-03/CLAUSE-COVERAGE.md — W03 T3.3 -->
# CLAUSE COVERAGE — P2-W03

Every IRC/IS clause the W02 engine package (`lib/engine/src`) cites, the module that
implements it, and the test that exercises it. This table is **generated from the
registry**, not maintained by hand: `lib/engine/src/clause-registry.ts` is the single
source of truth and `scripts/gates/verify-clauses.mjs` is the gate that enforces it.

- Registry: `lib/engine/src/clause-registry.ts` — 9 entries, ids `REGISTERED_CLAUSE_IDS`.
- Gate: `scripts/gates/verify-clauses.mjs` — **`GATE verify-clauses: PASS 42 assertions`** (exit 0).
- Scan root: `lib/engine/src` (22 `.ts` files, 22 citation tokens, **0 orphans**).

## Clause table

| # | Clause id | Standard | What the engine uses it for | Implementing module(s) | Test file | Status |
|---|---|---|---|---|---|---|
| 1 | `SP:13` | IRC:SP:13 (2004) | Area-velocity method, regime waterway; skew moment projection beyond 30° needs sign-off | `lib/engine/src/hydraulics/index.ts`, `lib/engine/src/stability/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 2 | `IS:7784` | IS:7784 (Part-I) | Molesworth afflux formula for a waterway constriction | `lib/engine/src/hydraulics/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 3 | `IRC:78` | IRC:78 (1983, 2000) | Mean/maximum scour depth; passive earth-resistance cap | `lib/engine/src/hydraulics/index.ts`, `lib/engine/src/stability/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 4 | `IS:875` | IS:875 (Part-3) | Wind load — design wind speed and pressure | `lib/engine/src/loads/index.ts`, `lib/engine/src/stability/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 5 | `IS:1893` | IS:1893 (2002) | Seismic zone factor and horizontal seismic coefficient | `lib/engine/src/loads/index.ts`, `lib/engine/src/stability/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 6 | `IRC:112` | IRC:112 (2015) | Concrete road bridges — limit-state basis referenced by the rebar module | `lib/engine/src/rebar/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 7 | `IRC:21` | IRC:21 (2000) | Cement concrete road bridges — working-stress design of deck steel | `lib/engine/src/loads/index.ts`, `lib/engine/src/rebar/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 8 | `IS:456` | IS:456 (2000) | Permissible stresses (Table 21), modular ratio (Cl. B-1.3), steel from Mu (Cl. G-1) | `lib/engine/src/rebar/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |
| 9 | `IRC:6` | IRC:6 (2016, 2017) | Live-load impact (Cl.208), water current (Cl.213), braking (Cl.214), wind (Cl.209), traffic surcharge, drag, stability acceptance | `lib/engine/src/loads/index.ts`, `lib/engine/src/stability/index.ts` | `tests/integration/clause-coverage.test.ts` | **PASS** |

**9 of 9 clauses PASS.** Each row's "PASS" is the conjunction of the four per-entry
assertions the gate runs (id well-formed; declared modules exist; every verbatim citation
appears in a declared module; the test file exists and names `[<id>]`) plus the registry-level
`no orphan citation` assertion.

## The gate's 42 assertions

| Group | Count | What is asserted |
|---|---|---|
| Load / non-vacuity | 5 | registry loads under plain Node; registry non-empty; scan root exists; ≥5 files scanned; ≥1 citation found |
| Orphan scan | 1 | every citation token under `lib/engine/src` resolves to a registry id |
| Per clause | 36 | 9 clauses × 4 (id well-formed · modules exist · citation verbatim · test names `[<id>]`) |

The `testFile` for every entry is the same file, `tests/integration/clause-coverage.test.ts`,
which additionally re-asserts the registry's `symbols` list against the modules' exports from
the test lane (12 tests, `pass 12 / fail 0`).

## Residual — what this gate does NOT judge

Stated so the coverage number is not over-read:

1. **The gate does not judge correctness of the clause's application**, only that the
   citation exists in the declared module and has a named test. A clause that is cited and
   tested but applied on a wrong assumption still passes `verify:clauses`. Method
   correctness is the business of the E-spec / PARITY lanes, not of this gate.
2. **Scope is `lib/engine/src` only.** The scan root deliberately excludes
   `bridge-excel-generator/**` (the ADR-0013-locked `authoritativeEngine`) and
   `client/src/report-engine/lib/**` (the parity source). Those carry their own IRC citations
   in comments which this gate does **not** register or check; their integrity is owned by
   `gate:contracts` and `gate:parity`. A citation added there will not be seen here.
3. **`MODULE-MATRIX.md` "Clauses" cells for the non-`lib/engine` modules stay `—`.**
   Registering those is not W03's scope.
4. **A token in a string literal is not a citation.** The scanner blanks the contents of
   single- and double-quoted strings before scanning, so citation strings stored as *data*
   (e.g. the `citations: [...]` arrays in the registry itself, or `"IRC:6-2017 cl.214.3"` in
   `lib/engine/src/contracts.ts`) are not treated as live citations. Only comment text is
   scanned. This was proven by the RED→GREEN probe in `docs/phase-2/week-03/EXIT-GATE-EVIDENCE.md` §4.3.
5. **`editions` is recorded but not enforced.** The registry lists the editions observed in
   the engine's comments (e.g. `IRC:6` → 2016, 2017). Whether an item's basis predates the
   current edition is the D-12 REVIEW validation's job
   (`lib/engine/src/validations/source-defects.ts`), not this gate's.
