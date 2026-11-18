# generated/

Build output that is produced from a declared input and can be deleted without
loss. Nothing authored by hand lives here.

Planned contents, by owning week:

| Artefact | Produced by | Week |
| --- | --- | --- |
| registries derived from the source workbooks | the registry generator | W00 onward |
| the README module map | the readme-map generator | W00 onward |

Two rules apply to everything in this directory:

1. **A generated file names its input.** If a file here cannot say which command
   produced it and from what, it is not generated output, it is an untracked
   source file that has been parked in the wrong place.
2. **Generated output is never the oracle.** Numbers are checked against
   `corpus/oracle/GOLDEN-ORACLE.json`, never against a previous run's output.
   Anything regenerated from the code proves the code is self-consistent and
   nothing more.

`generated/**` is tier 3 (DELIVERABLE) in `containment/ARTIFACT-TIERS.json`.
