/**
 * T4.12 — corpus fuzz over the BIFF8 / OOXML reader.
 *
 * Runs the frozen reader contract against all 8 real workbooks listed in
 * corpus/raw/manifest.json and asserts the four W04 obligations:
 *   - no exception (a broken cell never aborts the read),
 *   - partial row returned (the row carrying an error cell is retained whole),
 *   - REVIEW flag raised (the matrix surfaces the error, it is not swallowed),
 *   - source cell preserved (the offending cell keeps its literal / value).
 *
 * Provenance is re-verified first: every file's bytes are sha256-checked against the
 * manifest before it is read, so the fuzz is over the *frozen* corpus, not a worktree copy.
 *
 * Three workbooks (REF-PIERCAP-1, REF-PIERCAP-2, REF-FOOTING) are password-protected
 * (D-18 in SOURCE-DEFECT-REGISTER.md) and are a *source* limit, not a toolchain limit.
 * The fuzz asserts those fail **cleanly with a named error** — never a silent pass — and
 * are recorded as deferred rather than pretended green.
 *
 * Runner: node:test (integration lane). Directly:
 *   node --test tests/integration/xls-fuzz-corpus.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  assertBiff8,
  columnLetter,
  readXlsMatrix,
  LfsPointerError,
  XlsFormatError,
} from '../../lib/engine/src/io/xls.ts';
import type { XlsWorkbookMatrix } from '../../lib/engine/src/io/xls.ts';
import { sheetJsXlsDecoder } from '../../scripts/assimilate/sheetjs-xls-decoder.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const corpusRoot = join(repoRoot, 'corpus', 'raw');

interface ManifestEntry {
  bridgeCode: string;
  fileName: string;
  relativePath: string;
  format: 'biff8' | 'xlsx';
  bytes: number;
  sha256: string;
}
const manifest = JSON.parse(
  readFileSync(join(corpusRoot, 'manifest.json'), 'utf8'),
) as { entries: ManifestEntry[] };

/** D-18: password-protected in the source; the protection is never bypassed. */
const PASSWORD_PROTECTED = new Set(['REF-PIERCAP-1', 'REF-PIERCAP-2', 'REF-FOOTING']);

function absOf(entry: ManifestEntry): string {
  return join(corpusRoot, entry.relativePath);
}

describe('T4.12 — corpus provenance (all 8 workbooks)', () => {
  it('every listed workbook exists and its bytes hash to the manifest sha256', () => {
    assert.equal(manifest.entries.length, 8, 'manifest lists 8 workbooks');
    for (const entry of manifest.entries) {
      const abs = absOf(entry);
      assert.ok(existsSync(abs), `${entry.relativePath} exists`);
      const bytes = readFileSync(abs);
      assert.equal(bytes.length, entry.bytes, `${entry.bridgeCode} byte length matches`);
      const sha = createHash('sha256').update(bytes).digest('hex');
      assert.equal(sha, entry.sha256, `${entry.bridgeCode} sha256 matches the frozen manifest`);
    }
  });
});

describe('T4.12 — container guard on the frozen corpus', () => {
  it('the single .xlsx workbook is rejected by name as OOXML, not read as BIFF8', () => {
    const entry = manifest.entries.find((e) => e.format === 'xlsx');
    assert.ok(entry, 'an .xlsx workbook is in the corpus');
    const abs = absOf(entry);
    assert.throws(
      () => readXlsMatrix(abs, sheetJsXlsDecoder),
      (err: unknown) => err instanceof XlsFormatError && /OOXML/.test((err as Error).message),
      '.xlsx must be rejected with a named OOXML error, not silently read',
    );
  });

  it('an LFS pointer stub is rejected with the fetch hint (never a silent pass)', () => {
    const lfs = Buffer.from(
      'version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 123456\n',
      'utf8',
    );
    assert.throws(() => assertBiff8(lfs, 'corpus/raw/X.xls'), LfsPointerError);
  });
});

describe('T4.12 — fuzz every readable workbook (no exception + invariants)', () => {
  const readable = manifest.entries.filter(
    (e) => e.format === 'biff8' && !PASSWORD_PROTECTED.has(e.bridgeCode),
  );

  it('the readable set is the 4 non-protected BIFF8 workbooks', () => {
    assert.equal(readable.length, 4, '4 readable BIFF8 workbooks');
  });

  for (const entry of readable) {
    it(`${entry.bridgeCode}: reads without throwing and keeps a positional matrix`, () => {
      const abs = absOf(entry);

      let matrix: XlsWorkbookMatrix;
      assert.doesNotThrow(() => {
        matrix = readXlsMatrix(abs, sheetJsXlsDecoder);
      }, `${entry.bridgeCode} must not throw on the frozen bytes`);

      matrix = readXlsMatrix(abs, sheetJsXlsDecoder);
      assert.equal(matrix.schemaVersion, 'xls-matrix.v1');
      assert.equal(matrix.sha256, entry.sha256, 'provenance preserved through the read');
      assert.equal(matrix.bytes, entry.bytes);
      assert.ok(matrix.sheetCount > 0, 'at least one sheet decoded');
      assert.ok(matrix.sheets.length === matrix.sheetCount);

      // Every retained row keeps its 1-based number and every cell its A1 address, and
      // no retained row is empty — a blank row would not have been emitted.
      let errorCells = 0;
      for (const sheet of matrix.sheets) {
        for (const row of sheet.rows) {
          assert.ok(row.row >= 1, 'row number is 1-based');
          assert.ok(row.cells.length > 0, 'retained rows are non-empty (partial rows kept whole)');
          for (const cell of row.cells) {
            assert.equal(
              cell.address,
              `${columnLetter(cell.col)}${cell.row}`,
              'A1 address reconstructs from (row, col)',
            );
            if (cell.kind === 'error') {
              errorCells += 1;
              // Source cell preserved: the literal and/or the raw value survives.
              const preserved =
                (typeof cell.errorCode === 'string' && cell.errorCode.length > 0) ||
                cell.value !== null;
              assert.ok(preserved, `error cell ${sheet.name}!${cell.address} preserves its source`);
            }
          }
        }
        assert.equal(
          sheet.hasErrors,
          sheet.rows.some((r) => r.cells.some((c) => c.kind === 'error')),
          'hasErrors agrees with the cells present',
        );
      }

      // REVIEW is raised exactly when error cells exist — never swallowed.
      assert.equal(
        matrix.review.flag,
        errorCells > 0,
        'REVIEW flag tracks the presence of error cells',
      );
      assert.equal(matrix.review.errorCells.length, errorCells, 'every error cell is listed');
      if (errorCells > 0) {
        assert.ok(matrix.review.reasons.length > 0, 'a raised REVIEW carries a reason');
      }
    });
  }

  it('at least one real workbook raises REVIEW with preserved error literals (non-vacuous)', () => {
    const flagged = readable
      .map((e) => readXlsMatrix(absOf(e), sheetJsXlsDecoder))
      .filter((m) => m.review.flag);
    assert.ok(flagged.length > 0, 'the corpus exercises the error path for real');
    const literals = flagged.flatMap((m) =>
      m.sheets
        .flatMap((s) => s.rows.flatMap((r) => r.cells))
        .filter((c) => c.kind === 'error')
        .map((c) => c.errorCode)
        .filter((v): v is string => typeof v === 'string'),
    );
    assert.ok(literals.length > 0, 'error literals are preserved in the matrix');
    assert.ok(
      literals.some((l) => /^#/.test(l)),
      `error literals look like Excel errors — saw ${literals.slice(0, 5).join(', ')}`,
    );
  });
});

describe('T4.12 — password-protected workbooks fail cleanly (D-18, deferred)', () => {
  for (const entry of manifest.entries.filter((e) => PASSWORD_PROTECTED.has(e.bridgeCode))) {
    it(`${entry.bridgeCode}: raises a clean Error (never a silent pass)`, () => {
      const abs = absOf(entry);
      const bytes = readFileSync(abs);
      assert.ok(bytes.length > 0, 'the protected file is present and non-empty');
      assert.throws(
        () => readXlsMatrix(abs, sheetJsXlsDecoder),
        (err: unknown) =>
          err instanceof Error && /password-protected/i.test(err.message),
        'a protected workbook must fail with the named password error, not return an empty matrix',
      );
    });
  }
});
