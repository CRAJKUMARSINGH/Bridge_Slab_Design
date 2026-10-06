/**
 * Shared SheetJS reader for the office reference workbooks.
 *
 * Why this exists: every `*.xls` / `*.xlsx` in this repository is stored through Git LFS
 * (see .gitattributes). A checkout that skipped the smudge filter leaves a 132-byte pointer
 * file on disk where the workbook should be. SheetJS does not reject that text — it parses it
 * as a one-sheet, four-cell workbook, so the assimilation scripts used to "succeed" against an
 * empty reference and report that the office standard had no labels to match.
 *
 * Reading through here turns that silent failure into an error naming the file and the fix.
 */

import fs from 'node:fs';
import * as XLSX from 'xlsx';

const LFS_POINTER_PREFIX = 'version https://git-lfs';

export class LfsPointerError extends Error {
  constructor(filePath: string, oidSize: number | null) {
    super(
      `${filePath} is a Git LFS pointer, not the workbook (expected ${
        oidSize === null ? 'the binary file' : `${oidSize} bytes`
      }).\n` +
        `    Fetch the real content first:\n` +
        `      git lfs pull --include="${filePath}"`
    );
    this.name = 'LfsPointerError';
  }
}

/** Throw if `buf` is LFS pointer text rather than workbook bytes. */
export function assertNotLfsPointer(buf: Buffer, filePath: string): void {
  const head = buf.subarray(0, LFS_POINTER_PREFIX.length).toString('utf8');
  if (head !== LFS_POINTER_PREFIX) return;
  const sizeMatch = /\bsize (\d+)/.exec(buf.subarray(0, 512).toString('utf8'));
  throw new LfsPointerError(filePath, sizeMatch ? Number(sizeMatch[1]) : null);
}

/** Read a reference workbook from disk, rejecting LFS pointer stubs. */
export function readOfficeWorkbook(filePath: string): XLSX.WorkBook {
  const buf = fs.readFileSync(filePath);
  assertNotLfsPointer(buf, filePath);
  return XLSX.read(buf, { type: 'buffer', cellDates: true });
}
