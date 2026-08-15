# Repository baseline manifest

This manifest records the actual current workspace rather than the future
architecture described by the attached plans.

## Active paths

| Path | Role |
|---|---|
| `inputs/` | Prototype input and provenance registries |
| `lib/engine/` | Single calculation core |
| `lib/narrative/` | Report prose generation |
| `lib/report/` | HTML report rendering |
| `artifacts/api-server/` | Express API transport |
| `scripts/src/` | CLI and metadata-only assimilation |
| `tests/golden/kherwara/` | Demo parity expectations |

## Deferred or blocked paths

| Area | Current truth |
|---|---|
| Full Office assimilation | Blocked by absence of the described corpus in the uploaded workspace |
| Canonical Kherwara/Kharka project | Open decision |
| PDF binary export | Browser-print HTML fallback only in this increment |
| Run persistence | Not implemented |
| Workbook upload/intake | Not implemented |
| Engineering approval | Not obtained |

## Verification commands

```bash
pnpm run typecheck
pnpm run verify:golden
pnpm run design -- --input inputs/KHERWARA.json --out out/KHERWARA-report.html
```