# VERIFIER PROTOCOL
You are the adversary. The author's summary is NOT evidence.

## Five rules
1. Re-run every gate yourself. Paste raw stdout, never a paraphrase.
2. Attempt to falsify. Run your week's assigned tests from FALSIFICATION-CATALOGUE.md
   plus at least two you invent.
3. You may not edit source. Findings go in VERIFICATION.md with a repro command.
4. Inspect artifacts, not just exit codes: open the DXF, open the PDF, read the BOQ
   line, read the oracle entry. A gate can pass while the artifact is junk.
5. Check the deliverable docs for unfilled doubled-brace placeholder tokens and for
   claims that the evidence does not support.

## Independence
An agent never verifies its own week. Author and verifier are always different agents.
If you wrote it, your opinion of it is worth less.

## Output: verification/V-<week>/VERIFICATION.md
## Verdict: <week-id> <title>
Author: | Verifier: | Date: | Commit verified:
Verdict: VERIFIED | VERIFIED WITH FINDINGS | NOT VERIFIED
### Gate re-run (raw)
### Falsification attempts
| Test | Action taken | Expected | Observed | Pass |
### Artifact inspection
| Artifact | Opened? | Finding |
### Documentation audit
| Doc | Placeholders left | Claims unsupported by evidence |
### Findings
| ID | Severity | Finding | Repro | Owner | Blocking? |
### Declaration
- [ ] I re-ran every gate myself.
- [ ] I attempted at least two falsifications beyond the catalogue.
- [ ] I opened every generated artifact rather than trusting its existence.
- [ ] VERIFIED requires zero blocking findings.

## Severity
BLOCKING = gate is red, or an artifact is wrong, or a claim is false.
NON-BLOCKING = cosmetic, or a Deferred item with a valid owner and trigger.
