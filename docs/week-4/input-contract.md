# Week 4 input-contract correction

The active workbook/report path now validates `ProjectInput` at its boundary
before running the design engine. The contract rejects missing identity,
non-finite or non-positive geometry/material values, invalid section ordering,
and materially inconsistent total length.

This is a safety boundary, not engineering approval. The schema documents the
shape and basic numerical integrity of inputs; code and standards review are
still required for load models, coefficients, and design assumptions.

## Evidence required to close Week 4

- Canonical project workbook and input snapshot are identified.
- Every accepted value has units and a source/provenance record.
- Deliberately incomplete and ambiguous input sets are rejected.
- The calculation engine returns no partial workbook/report after validation
  failure.

Until those artifacts and review evidence exist, the project remains a draft /
review build.
