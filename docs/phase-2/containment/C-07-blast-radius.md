# C-07 — ARTIFACT TIERS & BLAST RADIUS MAP
## CODE — containment/ARTIFACT-TIERS.json
```json
{
  "version": "1.0.0",
  "artifacts": [
    { "glob": "corpus/raw/**",                    "tier": 0, "trust": "EXTERNAL" },
    { "glob": "corpus/oracle/GOLDEN-ORACLE.json",  "tier": 1, "trust": "VERIFIED", "derivedFrom": ["corpus/raw/**"] },
    { "glob": "lib/engine/src/contracts.ts",       "tier": 1, "trust": "VERIFIED", "derivedFrom": [] },
    { "glob": "lib/engine/src/coefficient-registry.ts", "tier": 1, "trust": "VERIFIED", "derivedFrom": ["docs/phase-2/specs/E-*.md#clauses"] },
    { "glob": "docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md", "tier": 1, "trust": "VERIFIED", "derivedFrom": ["corpus/raw/**"] },
    { "glob": "lib/engine/src/**",                 "tier": 2, "trust": "VERIFIED", "derivedFrom": ["lib/engine/src/contracts.ts"] },
    { "glob": "tests/**",                          "tier": 2, "trust": "VERIFIED" },
    { "glob": "scripts/gates/**",                  "tier": 2, "trust": "VERIFIED", "derivedFrom": ["corpus/oracle/GOLDEN-ORACLE.json"] },
    { "glob": "dist/**",                           "tier": 3, "trust": "VERIFIED" },
    { "glob": "generated/**",                      "tier": 3, "trust": "VERIFIED" },
    { "glob": "README.md",                         "tier": 4, "trust": "ASSERTED", "assertedBy": "W01" },
    { "glob": "creat.md",                          "tier": 4, "trust": "ASSERTED", "assertedBy": "W01" },
    { "glob": "docs/**",                           "tier": 4, "trust": "ASSERTED", "assertedBy": "various" }
  ]
}
```

## CODE — scripts/gates/gate-tiers.ts
```ts
for (const file of await trackedFiles()) {
  const t = tierOf(file);
  if (t === null) fail(`undeclared artifact: ${file}`);
}
// hard rules
assert(!readsProse("scripts/gates/**"), "a gate reads prose");
assert(noTier4Ancestor("lib/engine/**"), "an engine artifact descends from Tier 4");
pass(`${(await trackedFiles()).length} artifacts tiered`);
```

## Exit gate
[ ] Every tracked file matches exactly one tier glob
[ ] No gate reads a Tier 4 file
[ ] No Tier 2 artifact has a Tier 4 ancestor
[ ] ARTIFACT-TIERS.json is the single source for the blast-radius map in the board
