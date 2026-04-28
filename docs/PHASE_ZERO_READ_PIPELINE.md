# Phase Zero — read pipeline (Excel & Word → text / JSON)

**Purpose:** Turn binary `.xls`, `.xlsx`, `.doc`, and `.docx` reference files into **structured artifacts** that can be searched, diffed, and reviewed in the IDE or fed to an assistant — without opening Excel or Word manually for every cell.

This is **Phase Zero** of the workbook-generator programme: establish a repeatable extract before claiming sheet-by-sheet parity.

## Command

```bash
npm run phase-zero -- --root Attached_Assets
```

Output directory (default): `archive/phase-zero-extract/`

### Useful options

| Flag | Meaning |
|------|---------|
| `--out <dir>` | Override output root |
| `--file <path>` | Single file instead of scanning |
| `--max-rows <n>` | Cap rows per sheet (default **2000**); use **0** for no cap |
| `--max-cols <n>` | Cap cols per sheet (default **52**); use **0** for no cap |
| `--no-word` / `--no-excel` | Process only spreadsheets or only Word |

Full grid (large disk use):

```bash
npm run phase-zero:full
```

(equivalent to `npm run phase-zero -- --root Attached_Assets --out archive/phase-zero-extract-full --max-rows 0 --max-cols 0`)

## What is produced

- **`manifest.json`** — every source file, pass/fail, timing, path to subdirectory.
- **Per Excel workbook** — subdirectory containing:
  - `workbook-summary.json` — sheet names, `!ref`, merge ranges, non-empty and formula counts.
  - `sheets/<Sheet Name>.jsonl` — **one JSON object per line** per non-blank cell: `a` (A1 address), `r`, `c`, `t`, `v`, optional `w` (display), optional **`f` (formula string)**.
  - `INDEX.md` — quick human table of sheets.
- **Per Word document** — subdirectory containing:
  - `extracted.txt` — plain text body.
  - `word-summary.json` — character and paragraph counts.

## Implementation notes

- **Excel:** [SheetJS](https://sheetjs.com/) (`xlsx` package), same family as `scripts/assimilate-sheet-by-sheet.ts`, reads **legacy `.xls`** and **`.xlsx`** with formula strings where the file stores them.
- **Word:** [word-extractor](https://www.npmjs.com/package/word-extractor) — no Microsoft Word install; may fail on severely corrupted or password-protected files (see `ERROR.txt` in that run’s folder).

## Workflow

1. Run Phase Zero after adding or updating reference workbooks under `Attached_Assets/`.
2. Use `manifest.json` to see failures; fix paths or split huge books if memory becomes an issue.
3. Use **JSONL** for formula audits (grep `HYDRAULICS!`, count `"f":`, diff two runs).
4. Fill the **assessment matrix** and prose templates using `extracted.txt` + cell dumps alongside `Attached_Assets/instructions.md`.

## Code location

- `scripts/phase-zero/cli.ts` — CLI entry
- `scripts/phase-zero/extract-excel.ts` — workbook dump
- `scripts/phase-zero/extract-word.ts` — Word text
- `scripts/phase-zero/types.ts` — shared types

Also indexed from [`docs/INSTRUCTIONS_ALIGNMENT.md`](./INSTRUCTIONS_ALIGNMENT.md).
