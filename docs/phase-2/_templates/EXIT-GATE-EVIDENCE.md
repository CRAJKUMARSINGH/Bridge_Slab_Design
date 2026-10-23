<!-- _templates/EXIT-GATE-EVIDENCE.md — the universal one, used by every week -->
# P2-W{{WW}} EXIT GATE EVIDENCE
Week: {{WEEK_TITLE}} | Agent: {{AGENT}} | Verifier: {{VERIFIER}} | Date: {{DATE}}
Baseline commit: {{SHA_BEFORE}} | Final commit: {{SHA_AFTER}}

## Gate checklist (copied verbatim from the instruction file)
| # | Gate item | Result | Evidence (file:line or command) |
|---|---|---|---|
| 1 | {{GATE_ITEM_1}} | PASS/FAIL | {{EVIDENCE}} |

## Command log (raw, untrimmed)
### npm run check
{{PASTE}}
### npm run test
{{PASTE_SUMMARY_TOTALS}}
### npm run gate:{{WEEK_GATE}}
{{PASTE}}
### npm run build && npm run build:netlify
{{PASTE_TAIL}}

## Artifacts produced
| Path | sha256 | Bytes |

## Deviations
| Item | Expected | Actual | Reason | Registered where |

## Declarations
- [ ] No test was weakened to make a gate pass.
- [ ] No file was deleted; everything retired is in archive/ with a manifest row.
- [ ] Every deliverable in section 6 of the instruction file exists and is non-empty.
- [ ] creat.md §8 chat log updated; entries older than 24h removed.
