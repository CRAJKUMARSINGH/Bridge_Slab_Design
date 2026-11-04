# G-12 — SUCCESSION: HANDOVER TO THE NEXT ENGINEER
Prereq: W12A | Feeds: post-release
This is the file that protects the work when you are no longer the one maintaining it.

## CODE — docs/adr/TEMPLATE.md
```markdown
# ADR-NNNN — title
Date: | Status: Proposed | Accepted | Superseded by ADR-NNNN
Deciders:
## Context
## Decision
## Consequences (good / bad / neutral)
## Alternatives considered and why rejected
## Evidence (test, oracle, clause, measurement)
## Revisit trigger
```

## CODE — scripts/build-handover.ts
```ts
const SECTIONS = [
  { src: "docs/phase-2/ARCHITECTURE.md",           as: "01-architecture.md" },
  { src: "docs/phase-2/DATA-MODEL.md",             as: "02-data-model.md" },
  { src: "docs/phase-2/week-04/SECURITY.md",       as: "03-security.md" },
  { src: "docs/phase-2/RUNBOOK.md",                as: "04-runbook.md" },
  { src: "docs/phase-2/specs/",                    as: "05-engine-specs/", dir: true },
  { src: "corpus/oracle/GOLDEN-ORACLE.json",       as: "06-golden-oracle.json" },
  { src: "docs/phase-2/week-02A/SOURCE-DEFECT-REGISTER.md", as: "07-source-defects.md" },
  { src: "docs/phase-2/KNOWN-LIMITATIONS.md",      as: "08-known-limitations.md" },
  { src: "docs/phase-2/SCORECARD.md",              as: "09-scorecard.md" },
  { src: "docs/adr/",                              as: "10-decisions/", dir: true },
  { src: "docs/phase-2/GOVERNANCE.md",             as: "11-governance.md" },
];

export async function buildHandover() {
  const zip = archiver("zip");
  zip.append(HOW_TO_ADD_A_BRIDGE_FAMILY(), { name: "00-add-a-bridge-family.md" });
  zip.append(HANDOVER_README(), { name: "README.md" });
  for (const s of SECTIONS) {
    if (!existsSync(s.src)) throw new Error(`handover missing: ${s.src}`);
    if (s.dir) zip.directory(s.src, s.as.replace(/\/$/, ""));
    else zip.append(await readFile(s.src), { name: s.as });
  }
  zip.finalize();
}
```

## CODE — HANDOVER README contents (generated, not written by hand)
The generator emits: what this is, who to contact, the 5 commands to run first, the
current scorecard, every unresolved defect and its owner, every Deferred item with its
trigger, and the single paragraph: **"what a new maintainer must not break."**

## 00-add-a-bridge-family.md — the walkthrough
1. Copy the workbook into `corpus/raw/<CODE>/`, hash it.
2. Run the extractor; add oracle entries with cells and tolerances.
3. Register any new defect; decide COPY/CORRECT/WARN/REJECT.
4. Add the input contract fields with units, ranges, clause refs.
5. Add engine functions; add clause-registry entries; add tests.
6. Add golden case; `gate:oracle` must pass before anything else.
7. Add the report chapter, the drawing set, and the BOQ item mapping.
8. Add the assumption register; get the engineer's review; bump the engine minor.
9. Add a UAT scenario and a demo seed.
10. Update MODULE-MATRIX, SCORECARD and creat.md.

## CODE — scripts/gates/gate-handover.ts
```ts
const REQUIRED = ["00-add-a-bridge-family.md","01-architecture.md","02-data-model.md","03-security.md",
  "04-runbook.md","06-golden-oracle.json","07-source-defects.md","08-known-limitations.md",
  "09-scorecard.md","11-governance.md"];
for (const r of REQUIRED) if (!zipHas(r)) fail(`handover missing ${r}`);
const adrCount = await countFiles("docs/adr");
if (adrCount < 8) fail(`only ${adrCount} ADRs; expected >= 8 for the decisions this project made`);
pass(`handover complete, ${adrCount} ADRs`);
```

## Exit gate
[ ] Handover zip builds and contains every required section
[ ] 00-add-a-bridge-family.md is followed literally by a second person, and their
    friction notes are appended to it
[ ] Every unresolved defect and Deferred item has an owner and a trigger
[ ] At least 8 ADRs written for the real decisions (engine consolidation, unit registry,
    Ka handling, oracle tolerances, compute topology, auth model, .xls strategy, DSC modes)
[ ] "What a new maintainer must not break" is one page, plain language
[ ] gate:handover green
