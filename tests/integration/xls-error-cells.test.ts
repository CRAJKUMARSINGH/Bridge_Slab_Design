/**
 * T2A.7 — broken formula cells must produce a partial row plus a REVIEW flag, never an
 * exception. Covers both broken-formula spellings:
 *   - the source's textual tokens `#ERR:Ref` / `#ERR:Name` (legacy converter leftovers), and
 *   - genuine BIFF error cells (`#REF!`, `#VALUE!`) in the real corpus.
 *
 * Three layers are proven:
 *   1. `matrixFromDecoded` (dependency-free) keeps an error row whole and flags REVIEW.
 *   2. `sheetJsXlsDecoder` classifies a `#ERR:Ref` / `#ERR:Name` *text* cell as an error.
 *   3. `readXlsMatrix` over the real Bedach workbook — `loadsumm ` and `Deck Anchorage`
 *      both carry live error cells — must not throw, must retain the affected rows, and
 *      must name them in `review.errorCells`.
 *
 * Exit-gate item: "#ERR cells tolerated (test-proven)".
 * Runner: node:test (integration lane). Directly:
 *   node --test tests/integration/xls-error-cells.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as XLSX from 'xlsx';
import { matrixFromDecoded, readXlsMatrix } from '../../lib/engine/src/io/xls.ts';
import type { RawCell, RawDecodedWorkbook } from '../../lib/engine/src/io/xls.ts';
import { sheetJsXlsDecoder } from '../../scripts/assimilate/sheetjs-xls-decoder.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BEDACH = join(
  repoRoot,
  'corpus',
  'raw',
  'BED-HL',
  'plus Stability Analysis HIGH LEVEL BRIDGE - BEDACH.xls',
);

describe('T2A.7 — matrixFromDecoded tolerates #ERR:Ref / #ERR:Name', () => {
  it('keeps the partial row, records the literal and raises REVIEW (never throws)', () => {
    const rows: (RawCell | null)[][] = [
      [
        { kind: 'text', value: 'Pier' },
        { kind: 'number', value: 1 },
        { kind: 'number', value: 2 },
      ],
      [
        { kind: 'error', value: null, errorCode: '#ERR:Ref' },
        { kind: 'number', value: 3 },
        { kind: 'error', value: null, errorCode: '#ERR:Name' },
      ],
      [null, null, null], // entirely blank → dropped, must not shift row addressing
    ];
    const raw: RawDecodedWorkbook = { sheets: [{ name: 'loadsumm', rows }] };

    const m = matrixFromDecoded(raw, 'synthetic.xls', 'deadbeef', 0);

    const sheet = m.sheets[0];
    assert.equal(sheet.rows.length, 2, 'blank row dropped, error row retained');
    const errRow = sheet.rows[1];
    assert.equal(errRow.row, 2, 'row keeps its 1-based number (partial, not shifted)');
    assert.equal(errRow.cells.length, 3, 'partial row kept whole');
    assert.equal(errRow.cells[0].kind, 'error');
    assert.equal(errRow.cells[0].errorCode, '#ERR:Ref');
    assert.equal(errRow.cells[1].kind, 'number', 'a good value beside the error survives');
    assert.equal(errRow.cells[2].kind, 'error');
    assert.equal(errRow.cells[2].errorCode, '#ERR:Name');

    assert.equal(sheet.hasErrors, true);
    assert.equal(m.review.flag, true);
    assert.ok(m.review.errorCells.includes('loadsumm!A2'));
    assert.ok(m.review.errorCells.includes('loadsumm!C2'));
  });
});

describe('T2A.7 — decoder classifies the #ERR:Ref / #ERR:Name text tokens', () => {
  it('turns a text cell carrying #ERR:Ref or #ERR:Name into kind "error"', () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['pier', 1],
      ['#ERR:Ref', 2],
      ['#ERR:Name', 3],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'loadsumm');
    const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const raw = sheetJsXlsDecoder.decode(bytes, 'synthetic-memory');
    const sheet = raw.sheets[0];
    const literals = sheet.rows
      .flat()
      .filter((c): c is RawCell => c !== null && c.kind === 'error')
      .map((c) => c.errorCode);

    assert.deepEqual(literals.sort(), ['#ERR:Name', '#ERR:Ref']);
  });
});

describe('T2A.7 — real Bedach workbook reads without throwing', () => {
  it('loadsumm and Deck Anchorage keep error rows and flag REVIEW', () => {
    const m = readXlsMatrix(BEDACH, sheetJsXlsDecoder);

    assert.equal(m.review.flag, true, 'workbook flagged for review');
    assert.ok(m.review.errorCells.length > 0, 'error cells are listed');

    const deck = m.sheets.find((s) => s.name === 'Deck Anchorage');
    assert.ok(deck, 'Deck Anchorage sheet present');
    assert.equal(deck.hasErrors, true);
    const deckErrorRows = deck.rows.filter((r) =>
      r.cells.some((c) => c.kind === 'error'),
    );
    assert.ok(deckErrorRows.length > 0, 'Deck Anchorage keeps its error rows');
    assert.ok(
      m.review.errorCells.some((loc) => loc.startsWith('Deck Anchorage!')),
      'Deck Anchorage error cells named in the review list',
    );

    const loadsumm = m.sheets.find((s) => s.name.trim() === 'loadsumm');
    assert.ok(loadsumm, 'loadsumm sheet present');
    assert.equal(loadsumm.hasErrors, true);
    assert.ok(
      m.review.errorCells.some((loc) => loc.startsWith('loadsumm')),
      'loadsumm error cells named in the review list',
    );

    // Provenance must be intact: the reader hashes the exact bytes it read.
    assert.equal(m.sha256.length, 64);
    assert.equal(m.sourcePath, BEDACH);
  });
});
