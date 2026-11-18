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

This directory is **no longer empty.** The W00 enrichment pass placed the verifier
protocol here together with the nine verification scopes, and each file is owned by
exactly one week — recorded in [PATH-MANIFEST.json](../../../PATH-MANIFEST.json).
Ownership, not authorship, is the claim being made: the scope exists now, and the
week named beside it is the week that has to satisfy it.

| Artefact | Scope it verifies | Owning week |
| --- | --- | --- |
| [VERIFIER-PROTOCOL.md](VERIFIER-PROTOCOL.md) | the universal protocol — read before any scope below | W01 |
| [V-02/VERIFICATION-INSTRUCTIONS.md](V-02/VERIFICATION-INSTRUCTIONS.md) | engine and server consolidation | W02 |
| [V-02A/VERIFICATION-INSTRUCTIONS.md](V-02A/VERIFICATION-INSTRUCTIONS.md) | corpus and oracle | W02A |
| [V-03/VERIFICATION-INSTRUCTIONS.md](V-03/VERIFICATION-INSTRUCTIONS.md) | engineering correctness | W03 |
| [V-04/VERIFICATION-INSTRUCTIONS.md](V-04/VERIFICATION-INSTRUCTIONS.md) | security | W04 |
| [V-06A/VERIFICATION-INSTRUCTIONS.md](V-06A/VERIFICATION-INSTRUCTIONS.md) | hydraulic and scour parity | W06A |
| [V-07A/VERIFICATION-INSTRUCTIONS.md](V-07A/VERIFICATION-INSTRUCTIONS.md) | design parity | W07A |
| [V-08A/VERIFICATION-INSTRUCTIONS.md](V-08A/VERIFICATION-INSTRUCTIONS.md) | drawings | W08A |
| [V-09A/VERIFICATION-INSTRUCTIONS.md](V-09A/VERIFICATION-INSTRUCTIONS.md) | estimation and DPR | W09A |
| [V-11/VERIFICATION-INSTRUCTIONS.md](V-11/VERIFICATION-INSTRUCTIONS.md) | accessibility and UX | W11 |

A scope is an instruction to the verifier, not a verification record. The records
themselves are written beside the week that produced them and follow the rule above:
raw stdout, re-runnable, never a verdict on its own. W00's own record is
[../week-00/EXIT-GATE-EVIDENCE.md](../week-00/EXIT-GATE-EVIDENCE.md), kept beside
the instructions it evidences rather than here.

How the scopes were placed, and why the placement rule is "keep the guide's own
paths", is recorded in
[docs/adr/0011-spec-corpus-placement.md](../../adr/0011-spec-corpus-placement.md).
