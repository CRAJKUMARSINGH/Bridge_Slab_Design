# Controlled asset assimilation

`inventory.py` is the safe entry point for the legacy Office corpus. It hashes
and classifies source files without modifying them. The generated register is
review metadata, not an engineering decision.

Run from the repository root:

```bash
python scripts/assimilate/inventory.py \
  --root Attached_Assets \
  --out evidence/asset-register.json
```

The intended order is:

1. **Inventory** immutable source files and hashes.
2. **Normalize** legacy `.xls`/`.doc` files into a separate working area.
3. **Extract** formulas, cached values, text, and drawing metadata.
4. **Classify** cells against the approved input contract and ambiguity register.
5. **Map** approved source material into the single calculation/report pipeline.

No source workbook is deleted, overwritten, or treated as authoritative merely
because its filename looks familiar. A project owner must confirm the canonical
workbook, report set, drawing set, and disposition before later stages are used.
