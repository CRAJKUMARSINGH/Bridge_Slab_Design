# Archived probe scratch — DUE-7 / DUE-8 work session (2026-10-06)

53 files. These are throwaway probe outputs and one-off rewrite scripts from the DUE-7 bookkeeping and the
DUE-8 root-scripts typecheck lane: `tmp-due7-*` (census dumps, gate transcripts, the BOM-preserving
register rewriter) and `tmp-due8-*` (the LFS census script, candidate/verify/check exit captures, section
extracts, the Turn 20 chat-log draft), plus `tmp-parity-dump/` (per-page HTML/PDF text dumps from the §N
parity gate).

Nothing in the build depends on them. They are kept here rather than deleted because Bash stdout is
routinely dropped in this environment, so the redirected files were the only record of several gate runs —
and a few of the numbers quoted in `august-due.md` §O/§P were read out of them.

Restore path, if ever needed: copy the files back to the repository root. To re-derive the numbers rather
than trust these dumps, use `pnpm run check`, `pnpm run verify`, `pnpm run candidate`, and the LFS census
recipe in `august-due.md` §P-6.
