# Security policy

This repository produces structural engineering deliverables. A wrong number is
a safety defect, so the security surface is wider than the HTTP layer.

## Reporting a vulnerability

Report privately — do not open a public issue for an exploitable defect.
Include the affected path, the commit, a reproduction, and the impact you
believe it has. Expect an acknowledgement before any public discussion.

## In scope

- **Server and API** — `server/`, `api/`, `artifacts/api-server/`: authentication,
  authorisation, input validation, injection, SSRF, path traversal.
- **Secrets and supply chain** — committed credentials, the `pnpm-lock.yaml`
  graph, the `minimumReleaseAge` policy in [pnpm-workspace.yaml](pnpm-workspace.yaml),
  and the overrides there that pin transitive dependencies.
- **Engineering correctness as a safety property** — a deliverable that is
  numerically wrong, or that silently substitutes a default for a missing input,
  is in scope and is treated as high severity. `pnpm run gate:oracle` and
  `pnpm run verify:golden` exist to catch exactly this class.

## Out of scope

- Findings that require an already-compromised developer machine.
- Reports against the vendor and scratch trees listed in the `ignored` array of
  [containment/ARTIFACT-TIERS.json](containment/ARTIFACT-TIERS.json)
  (`VENICE-REFERENCES/`, `merge-refs/`, `Attached_Assets/`, …). These are inputs
  and are not built or shipped.

## Existing controls

| Control | Where |
| --- | --- |
| pnpm-only installs | `preinstall` in [package.json](package.json) |
| Minimum release age for new packages | [pnpm-workspace.yaml](pnpm-workspace.yaml) |
| Secret scanning | `pnpm run scan:secrets` |
| Audit threshold | `pnpm run audit:policy` |
| Foundation gates | `pnpm run gate:foundation` |

## Known gaps

Recorded, not hidden: [.deps-plan.json](.deps-plan.json) lists packages that
referenced code imports but which are not installed, each with the week that owes
the install. `gate:deps` fails if such an entry outlives its week.
