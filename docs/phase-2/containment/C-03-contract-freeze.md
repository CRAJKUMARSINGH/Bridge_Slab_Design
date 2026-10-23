# C-03 — CONTRACT FREEZE & BOUNDARY ENFORCEMENT
Why: Sets 2-5 must read each other only through declared contracts, or a defect tunnels sideways.

## CODE — containment/CONTRACT.md (hashed)
```markdown
# PHASE 2 INTER-SET CONTRACT — version 1.0.0
hash: <sha256 of this file, re-recorded whenever the file changes>
Frozen: <date> · Change requires an ADR and a minor version bump.

| From | To | Via | Allowed |
|---|---|---|---|
| lib/engine | lib/units | @units | yes |
| lib/engine | lib/trust | @trust | yes |
| lib/engine | node:crypto | builtin | yes |
| lib/engine | client/ | any | NO |
| lib/engine | server/ | any | NO |
| lib/drawing | lib/engine | @engine (read-only) | yes |
| client/ | lib/engine | @engine | yes |
| client/ | server/ | HTTP only | yes |
| server/ | lib/engine | @engine | yes |
| scripts/ | lib/engine | @engine | yes |
| any | README.md / docs/* | never parsed | NO |
```

## CODE — scripts/gates/gate-contracts.ts
```ts
const contract = parseContract(await readFile("containment/CONTRACT.md", "utf8"));
if (sha256(await readFile("containment/CONTRACT.md")) !== contract.hash)
  fail("CONTRACT.md changed without a hash update");

for (const file of await glob(["lib/**/*.ts", "server/**/*.ts", "client/src/**/*.ts"])) {
  const from = topLevel(file);
  for (const spec of importsOf(await readFile(file, "utf8"))) {
    const to = targetOf(spec);
    if (!to || to.startsWith("node:")) continue;
    const rule = contract.rules.find(r => r.from === from && matches(r.to, to));
    if (!rule) fail(`${file}: undeclared boundary ${from} -> ${to}`);
    if (rule.allowed === false) fail(`${file}: forbidden import ${spec}`);
  }
}
pass(`${contract.rules.length} boundary rules enforced`);
```

## Rule
An undeclared cross-boundary import is a build failure, not a style note. Adding one
requires editing CONTRACT.md, bumping its version, and recording an ADR.

## Exit gate
[ ] CONTRACT.md written, hashed, and frozen
[ ] gate:contracts green; adding `import {x} from "../../client"` inside lib/engine fails
[ ] Boundary violations across all of lib/, server/, client/src/ are zero
