# Repository Map ΓÇö Week 3

**Last updated:** 2026-08-10

```
Bridge_Slab_Design/
Γöé
Γö£ΓöÇΓöÇ lib/                          Shared libraries (pnpm workspace)
Γöé   Γö£ΓöÇΓöÇ engine/                   @workspace/engine ΓÇö ONE calculation pipeline
Γöé   Γöé   ΓööΓöÇΓöÇ src/
Γöé   Γöé       Γö£ΓöÇΓöÇ calculate.ts      Orchestrator ΓÇö calls load/resistance/serviceability
Γöé   Γöé       Γö£ΓöÇΓöÇ types.ts          BridgeInputs, CalculationResult, TracedValue
Γöé   Γöé       Γö£ΓöÇΓöÇ coefficients.ts   Named constant registry (no magic numbers)
Γöé   Γöé       Γö£ΓöÇΓöÇ fingerprint.ts    Deterministic input hash
Γöé   Γöé       Γö£ΓöÇΓöÇ index.ts          Public exports
Γöé   Γöé       Γö£ΓöÇΓöÇ functions/
Γöé   Γöé       Γöé   Γö£ΓöÇΓöÇ loads.ts      calcDesignUDL, calcMaxMoment, calcMaxShear
Γöé   Γöé       Γöé   Γö£ΓöÇΓöÇ resistance.ts calcBendingStress, calcBendingUtil, calcShear
Γöé   Γöé       Γöé   ΓööΓöÇΓöÇ serviceability.ts  calcDeflection, calcDeflLimit, calcGovUtil
Γöé   Γöé       Γö£ΓöÇΓöÇ tests/
Γöé   Γöé       Γöé   ΓööΓöÇΓöÇ calculate.test.ts  Node built-in test runner
Γöé   Γöé       ΓööΓöÇΓöÇ week0/            Week 0 JSON registries
Γöé   Γö£ΓöÇΓöÇ api-spec/                 OpenAPI YAML contract
Γöé   Γö£ΓöÇΓöÇ api-zod/                  Zod input schema + validation
Γöé   ΓööΓöÇΓöÇ db/                       Drizzle ORM schema (Week 11)
Γöé
Γö£ΓöÇΓöÇ artifacts/
Γöé   Γö£ΓöÇΓöÇ api-server/               Express 5 API server
Γöé   Γöé   ΓööΓöÇΓöÇ src/
Γöé   Γöé       Γö£ΓöÇΓöÇ app.ts
Γöé   Γöé       Γö£ΓöÇΓöÇ index.ts
Γöé   Γöé       Γö£ΓöÇΓöÇ lib/logger.ts
Γöé   Γöé       ΓööΓöÇΓöÇ routes/
Γöé   Γöé           Γö£ΓöÇΓöÇ index.ts
Γöé   Γöé           Γö£ΓöÇΓöÇ health.ts
Γöé   Γöé           Γö£ΓöÇΓöÇ reports.ts    (Week 8+)
Γöé   Γöé           ΓööΓöÇΓöÇ lfs-sync.ts
Γöé   ΓööΓöÇΓöÇ mockup-sandbox/           React/Vite UI + shadcn components
Γöé
Γö£ΓöÇΓöÇ scripts/
Γöé   Γö£ΓöÇΓöÇ week0/                    Foundation scripts
Γöé   Γöé   Γö£ΓöÇΓöÇ classify_cells.py
Γöé   Γöé   Γö£ΓöÇΓöÇ make_demo.py
Γöé   Γöé   ΓööΓöÇΓöÇ verify-golden.ts      Week 0 hydraulics harness
Γöé   Γö£ΓöÇΓöÇ week6/
Γöé   Γöé   ΓööΓöÇΓöÇ verify-golden.ts      Week 6+ calculation parity harness
Γöé   Γö£ΓöÇΓöÇ fixtures/                 Input fixtures (kherwara, channels)
Γöé   Γö£ΓöÇΓöÇ verify-engine-hydraulics.ts
Γöé   ΓööΓöÇΓöÇ verify-kherwara-excel-golden.ts
Γöé
Γö£ΓöÇΓöÇ tests/
Γöé   Γö£ΓöÇΓöÇ golden/
Γöé   Γöé   ΓööΓöÇΓöÇ kherwara/
Γöé   Γöé       Γö£ΓöÇΓöÇ inputs.json
Γöé   Γöé       Γö£ΓöÇΓöÇ expected-hydraulics.json
Γöé   Γöé       ΓööΓöÇΓöÇ expected-calculation-v0.5.0.json (Week 6)
Γöé   ΓööΓöÇΓöÇ fixtures/
Γöé       ΓööΓöÇΓöÇ week0/demo_bridge_raw.xlsx
Γöé
Γö£ΓöÇΓöÇ inputs/                       Foundation registries (Week 0 output)
Γöé   Γö£ΓöÇΓöÇ variables.json
Γöé   Γö£ΓöÇΓöÇ coefficients.json
Γöé   Γö£ΓöÇΓöÇ constraints.json
Γöé   Γö£ΓöÇΓöÇ registry.json
Γöé   Γö£ΓöÇΓöÇ schema.json
Γöé   ΓööΓöÇΓöÇ answers_demo.json
Γöé
Γö£ΓöÇΓöÇ project/                      Project governance docs
Γöé   Γö£ΓöÇΓöÇ decision-log.md
Γöé   Γö£ΓöÇΓöÇ golden-project-asset-register.md
Γöé   Γö£ΓöÇΓöÇ open-questions.md
Γöé   ΓööΓöÇΓöÇ versioning-conventions.md
Γöé
Γö£ΓöÇΓöÇ docs/                         Week deliverables
Γöé   Γö£ΓöÇΓöÇ week-0/ ΓÇª week-15/
Γöé
Γö£ΓöÇΓöÇ bridge-excel-generator/       Existing 25-sheet engine (retained until parity)
Γö£ΓöÇΓöÇ server/                       Existing prototype backend
Γö£ΓöÇΓöÇ client/                       Existing prototype UI
Γö£ΓöÇΓöÇ shared/                       Existing shared types
ΓööΓöÇΓöÇ creat.md                      Living project charter ΓÇö MUST stay current
```

## Status legend
| Symbol | Meaning |
|---|---|
| Γ£à | Complete |
| ≡ƒöº | In progress |
| ≡ƒôï | Planned |
| Γ¢ö | Blocked |
