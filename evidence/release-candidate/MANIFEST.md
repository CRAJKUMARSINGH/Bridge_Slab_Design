# Release candidate — evidence bundle

Generated 2026-10-06T12:30:52.416Z at commit `13cdf0b8b1dd30fc1df50d451d517a7b2d3afea9`
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
| `deliverables/design-workbook.xlsx` | 1,09,039 | `cf2b649aaf7a8204994a4ce3694903b2de924ae6ed163fa0b16819678f5101d1` |
| `deliverables/sheet-book.pdf` | 32,03,059 | `a0d4cdcd09d1866efdea3e73a696c0d5205f33fbeee4e69dac5249da6797d993` |
| `deliverables/comprehensive-report.pdf` | 49,13,586 | `9eee4c70e47110a0e93c7391b4a99c88f9905e08e8ff23acae6a47f3f375ea3e` |
| `deliverables/short-design-report.pdf` | 2,21,114 | `cd6058d18ae76027d9f9dfa3c47afe83423442c565c5a15590f3f4bf7884d7bc` |
| `deliverables/design-report.html` | 4,19,689 | `bca3fc2ab7bbf2f33f0beb9d34b5559788d4cb8ebabb32839487fc6a7c936df9` |
| `deliverables/irc-checklist.html` | 39,954 | `415e1ac5f31a0f51e5c9222c609ee2e5a887e46db75f20eeedcefb1eb02200ef` |

Copied from `test-output/`, which is written by `pnpm run deliverables` (Kherwara golden project).

## What this bundle does not say

**It is not an engineering clearance.** The gates above certify that the machinery reports honestly
and that the two report formats agree; they do not certify that the bridge stands.
Of 300 pier load cases across 20 templates, the engine verdicts are **4 SAFE and 296 UNSAFE**, and every template carries at least one unsafe case.

Open sign-off questions, each of which moves verdicts and none of which code can settle (§M of
`august-due.md`): the bearing acceptance factor (2.5 against the conventional `pressure ≤ SBC`, on
which 184 cases turn), the governing water level, the legacy hydraulics block the comprehensive PDF
prints beside the engine figures, and which discharge is the design discharge.

A licensed engineer must review the numbers before any artefact here is issued externally.
