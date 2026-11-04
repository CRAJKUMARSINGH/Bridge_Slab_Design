---
name: Engineering pipeline runtime
description: Environment and evidence constraints for the bridge-slab prototype.
---

The asset assimilation command is intentionally Python-based per the attached implementation plan; this runtime may need the Python module installed before that command can run. Workspace script forwarding can pass a literal `--` before arguments, so the inventory script should tolerate that wrapper convention and resolve paths from the workspace root when invoked through the scripts package.

**Why:** The first verification attempts exposed both runtime absence and workspace-relative path/argument forwarding issues.

**How to apply:** When running or extending `assimilate`, invoke it through the root command and preserve the script’s root-relative path handling; do not silently replace the metadata-only inventory with runtime trust.