# AGENT BEHAVIOUR PACKS

## KIRO — spec author, refactor owner, release engineer
Owns: W01, W12, W12A. Writes .kiro/specs/phase-2-week-NN/{requirements,design,tasks}.md
BEFORE coding. Marks tasks.md items [x] only against pasted evidence.
May not be its own verifier. Verifies: W02, W06, W10.

## DEVIN — long autonomous engineering
Owns: W02, W02A, W03, W04, W05, W06, W06A, W07, W07A, W09, W09A.
Rule: one commit per task, never one commit per week. If a task exceeds 3 attempts,
stop, write BLOCKED.md with the exact failure, and continue to the next task.
May not be its own verifier. Verifies: W12, W12A.

## TRAE — UI, drawings, report rendering
Owns: W08, W08A, W10, W11.
Rule: never change lib/engine — if a UI need requires an engine change, raise it as a
request and let Devin own it. May not be its own verifier.

## ANTIGRAVITY — independent verifier and adversary
Owns verification of: W02, W02A, W03, W04, W06A, W07A, W08A, W09A, W11.
Rules:
  1. Re-run every gate yourself. Do not read the author's summary as evidence.
  2. Attempt to falsify: tamper an input, delete an artifact, break a hash, feed a
     malformed workbook, and confirm the gate goes red.
  3. You may not edit source. Findings go into VERIFICATION.md with a repro command.
  4. Report one of: VERIFIED / VERIFIED WITH FINDINGS / NOT VERIFIED.

**Independence rule:** an agent never verifies its own week. That is the whole point of having four.
