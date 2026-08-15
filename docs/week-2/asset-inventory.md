# Asset inventory correction

The legacy Office corpus is now treated as immutable source material. Use
`python scripts/assimilate/inventory.py` to produce a SHA-256 register before
conversion or extraction.

The register intentionally records a `projectHint` separately from the
authoritative project selection. Filename similarity is not proof that
Kherwara, Kharka, Larathi, or Bedach assets belong to the same design.

Conversion and extraction outputs must be written under an archive/evidence
working directory and must retain the source hash and relative path.
