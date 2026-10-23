# docs/phase-2/verification/

Verification records: what was checked, against what, by which command, and what
the command printed.

The rule for this directory is the same one the gates enforce: **evidence, not a
summary of evidence.** A file here that says "oracle verified" is worthless; a
file here that contains the raw output of the command that verified it can be
re-run and contradicted.

What belongs here, per week:

| Artefact | Contents |
| --- | --- |
| `<week>-exit-gate.md` | raw stdout of the week's gate run, unedited |
| `<week>-oracle-diff.md` | numeric diffs against `corpus/oracle/GOLDEN-ORACLE.json` |
| `<week>-parity.md` | HTML/PDF parity results, with the differing values named |

Two things that do **not** belong here:

1. A verdict without its command. "PASS" is not evidence.
2. A number copied from a previous run. A verification record that quotes an
   earlier verification is a claim about that claim.

This directory is empty at W00 by design; W00's own record is
[../week-00/EXIT-GATE-EVIDENCE.md](../week-00/EXIT-GATE-EVIDENCE.md), kept beside
the instructions it evidences rather than here.
