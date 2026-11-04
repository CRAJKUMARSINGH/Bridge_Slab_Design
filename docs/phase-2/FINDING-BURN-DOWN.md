# FINDING BURN-DOWN

The board's **FINDING BURNDOWN** tab carries all 50 audit findings mapped to a
week and an owner, filterable by severity. That tab is the burn-down of record.

Distribution, as recorded there:

| Severity | Count | Critical allocation |
| --- | --- | --- |
| Critical | 6 | W02 x2, W04 x2, W06 x1, W02 x1 |
| High | 18 | — |
| Medium | 18 | — |
| Low | 8 | — |
| **Total** | **50** | |

Four of the Low findings were not individually enumerated in `AUDIT-REPORT-v1.0.md`.
The board therefore carries **46 named + 4 unenumerated**, and the four
unenumerated rows are a real state of the register rather than a rounding error:
they are findings the audit knows about and did not describe.

W12 T12.10 requires all 50 to be **Closed** or **Deferred-with-reason** before
`AUDIT-REPORT-v2.0.md` can ship. A deferred finding is not a closed finding, and
the burn-down is the artefact that keeps the difference visible: a week may defer,
but it may not defer silently, and a deferral without a reason does not count
against the total.

## Why this is a record and not a chart

A percentage burn-down can be improved by reclassifying a finding, which changes
the denominator rather than the tree. This file records the two numbers that
cannot be gamed that way — the total, and how many are named — and leaves the
per-finding status to the tab that owns it. When a finding is closed, the tree
contains the fix and a gate that would fail without it; when it is deferred, there
is a row with an owner and a trigger. Neither of those is a percentage.
