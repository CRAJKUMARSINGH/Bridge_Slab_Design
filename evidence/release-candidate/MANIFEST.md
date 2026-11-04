# Release candidate — evidence bundle

Generated 2026-10-16T04:19:17.937Z at commit `dcbbbd95f2b78958df492c613c8db097d754930d`
Working tree had uncommitted changes when this bundle was assembled.
Toolchain: Node v24.14.0, pnpm 10.33.0.

## Gate runs

| Command | Exit | Transcript |
| --- | --- | --- |
| `pnpm run check` | 0 | `gates/check.txt` |
| `pnpm run verify` | 0 | `gates/verify.txt` |
| `pnpm run test` | 0 | `gates/test.txt` |
| `pnpm run audit:policy` | 0 | `gates/audit-policy.txt` |

Every gate above passed, which is why this file exists: a failing lane leaves the previous manifest
untouched rather than dressing up a broken tree as a candidate.

## Deliverables

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `deliverables/design-workbook.xlsx` | 1,11,404 | `8372c1d5865ea2b7f96b4bd6ae4c69cce2f2d811a1c0e298be39c3bc3bacf0c8` |
| `deliverables/sheet-book.pdf` | 27,41,527 | `6e1db12d132645f5e1ccdd8eb2b8f3563ef6d2079cd2403d90e7c990532d9393` |
| `deliverables/comprehensive-report.pdf` | 92,18,343 | `d6a5647001e6abfa1ff88587f28019bee0f4c5975162eb4ee7ef54c2686f96de` |
| `deliverables/short-design-report.pdf` | 2,25,252 | `bbd7f6d9cc81bc5294d5724b3ea3c757cb8fb00b7b830c4ad056ef5cb0a73a18` |
| `deliverables/design-report.html` | 3,81,558 | `c05dc571439e20efeb7d6203b32af6f6c83d0707bff396e1da010e21bd9e2648` |
| `deliverables/irc-checklist.html` | 39,965 | `1bbfe7bf152af2640ddc476c8b57e6af9b21706ea0fd7a98bd33af6afd657440` |

Copied from `test-output/`, which is written by `pnpm run deliverables` (Kherwara golden project).

## What this bundle does not say

**It is not an engineering clearance.** The gates above certify that the machinery reports honestly
and that the two report formats agree; they do not certify that the bridge stands.
Of 300 pier load cases across 20 templates, the engine verdicts are **195 SAFE and 105 UNSAFE**, and every template carries at least one unsafe case.

Open sign-off questions, each of which moves verdicts and none of which code can settle (§M of
`august-due.md`): the bearing acceptance factor (2.5 against the conventional `pressure ≤ SBC`, on
which 184 cases turn), the governing water level, the legacy hydraulics block the comprehensive PDF
prints beside the engine figures, and which discharge is the design discharge.

A licensed engineer must review the numbers before any artefact here is issued externally.
