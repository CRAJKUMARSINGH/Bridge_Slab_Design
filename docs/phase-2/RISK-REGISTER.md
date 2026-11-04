# RISK REGISTER

Fifteen risks with controls are on the board's **RISK REGISTER** tab: each row
carries the risk, the control that defeats it, and the week that owns the control.
That tab is the register of record; this file is the part of it that the repository
must be able to state without the board, because a control that exists only in a
tab is a control nobody can check.

Three of the fifteen are load-bearing, and they are the three a reader of this
repository most needs to know about. Each one is a risk that the tool *looks*
complete while it is not.

- **R-01 — empty deliverable docs.** A week publishes a document whose headings
  are all present and whose content is not. Defeated by `gate:docs` plus the
  template kit: `gate:docs` fails on a surviving doubled-brace placeholder token,
  on a file shorter than 200 bytes, and on a heading with nothing under it, and
  the template pack in `docs/phase-2/_templates/` is what makes "filled" a
  checkable state rather than an opinion.
- **R-04 — losing `.xls` in the W04 migration.** The legacy workbooks are the
  oracle's ancestry; a migration that converts them and drops the originals
  leaves every golden value unverifiable. Defeated by `docs/phase-2/week-02A/XLS-STRATEGY.md`
  plus the W04 T4.12 fuzz over all 8 real workbooks.
- **R-08 — copying source defects blindly.** The audit's findings were inferred
  from call sites, not read, and some are false positives. Defeated by making
  `docs/phase-2/_templates/SOURCE-DEFECT-REGISTER.md` a first-class deliverable
  with a *required behaviour* per defect — COPY, CORRECT, WARN or REJECT — so that
  a defect is adjudicated before it is inherited.

The remaining twelve risks are not enumerated here. They are named and owned on
the board, and enumerating them from memory would produce a register that is
longer than the one of record and no more true. The three above are the ones this
repository can already point at a control for.

## How a risk leaves this file

A risk is closed the same way a defect is: by the gate that detects it going red
on a reproduction, then green after the control lands. A risk whose control is
prose is not closed; it is deferred, and a deferred risk needs an owner and a
trigger or it belongs in the finding burn-down, not here.
