# Milestone W04 — Formula validation: Manning & Lacey (instruction-note 6 start)

**Week:** 4 of 15  
**Instruction note:** 6 Formula validation protocol; 4 hydraulic names; key formulas (Manning, Lacey).

## Purpose

Build **repeatable formula audit** across reference JSONL dumps. Establish **canonical** Manning and Lacey expressions and note **variants** with triggers.

## Entry criteria

- Phase Zero full (or sufficient) extracts for ≥3 workbooks with HYDRAULICS / afflux logic.
- W02 matrix identifies which sheets contain discharge / scour.

## Tasks

- [x] From JSONL, collect cells whose `f` contains Manning-related refs or area/velocity pattern; normalize formula text (sheet names, row refs).
- [x] Compare **V** and **Q** derivation across books; document **identical** vs **different** formula strings.
- [x] Repeat for **Lacey scour** (`dsm`, `Ksf`, `Db` patterns per IRC:78).
- [x] Propose additions to **canonical variable list** if a cell semantic has no instruction-note 4 name (client approval per instruction-note 6).
- [x] Update **formula validation report** draft (instruction-note 8 item 4) — partial hydraulic core in artifact.

## Deliverables

| Artifact | Note |
|----------|------|
| [`artifacts/W04-formula-manning-lacey.md`](./artifacts/W04-formula-manning-lacey.md) | Tables: workbook × formula variant; engine gaps; replay grep paths |
| Script optional | Not added — replay instructions in artifact §2 |

## Verification

- Engine `verify:engine` still green; hydraulics snapshots unchanged unless intentional.

```bash
npm run verify:engine
```

## Exit criteria

- Manning + Lacey **audited** on ≥**3** workbooks; variants either **unified** in plan or **documented with trigger**.

## Handoff / discontinuity

**If stopped:** Store **path to JSONL folders** and **grep patterns** used in W04 artifact so next owner can replay audit.
