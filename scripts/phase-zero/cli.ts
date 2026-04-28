/**
 * Phase Zero CLI — turn binary Office references into text/JSON the repo (and AI) can read.
 *
 * Usage:
 *   npm run phase-zero -- --root Attached_Assets
 *   npm run phase-zero -- --root Attached_Assets --out archive/phase-zero-extract
 *   npm run phase-zero -- --file "Attached_Assets/plus Stability Analysis SUBMERSIBLE BRIDGE - BEDACH.xlsx"
 *
 * Options:
 *   --root <dir>     Scan directory recursively (repeatable)
 *   --file <path>    Single file
 *   --out <dir>      Output root (default: archive/phase-zero-extract)
 *   --max-rows <n>   Cap rows per sheet (0 = unlimited; default 2000)
 *   --max-cols <n>   Cap cols per sheet (0 = unlimited; default 52)
 *   --no-excel       Skip spreadsheets
 *   --no-word        Skip Word documents
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { ManifestFileEntry, PhaseZeroManifest } from './types';
import { extractWorkbookToDir } from './extract-excel';
import { extractWordToDir } from './extract-word';

const TOOL_VERSION = '1.0.0';

const EXCEL_EXT = new Set(['.xlsx', '.xls', '.xlsm']);
const WORD_EXT = new Set(['.doc', '.docx']);

function parseArgs(argv: string[]) {
  const roots: string[] = [];
  const files: string[] = [];
  let outDir = path.resolve('archive', 'phase-zero-extract');
  let maxRows = 2000;
  let maxCols = 52;
  let excel = true;
  let word = true;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root' && argv[i + 1]) {
      roots.push(argv[++i]);
    } else if (a === '--file' && argv[i + 1]) {
      files.push(argv[++i]);
    } else if (a === '--out' && argv[i + 1]) {
      outDir = path.resolve(argv[++i]);
    } else if (a === '--max-rows' && argv[i + 1]) {
      maxRows = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a === '--max-cols' && argv[i + 1]) {
      maxCols = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a === '--no-excel') {
      excel = false;
    } else if (a === '--no-word') {
      word = false;
    } else if (a === '--help' || a === '-h') {
      console.log(`Phase Zero — see header comment in scripts/phase-zero/cli.ts`);
      console.log(`Example: npm run phase-zero -- --root Attached_Assets`);
      process.exit(0);
    }
  }

  if (!roots.length && !files.length) {
    roots.push('Attached_Assets');
  }

  return { roots, files, outDir, maxRows, maxCols, excel, word };
}

function walkFiles(dir: string, acc: string[]) {
  if (!fs.existsSync(dir)) return;
  const st = fs.statSync(dir);
  if (!st.isDirectory()) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
}

function extOf(p: string): string {
  return path.extname(p).toLowerCase();
}

function slugFromRelative(rel: string): string {
  const h = crypto.createHash('sha1').update(rel).digest('hex').slice(0, 12);
  const base = path.basename(rel, path.extname(rel));
  const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 60);
  return `${safe}__${h}`;
}

async function main() {
  const { roots, files, outDir, maxRows, maxCols, excel, word } = parseArgs(process.argv);

  const toProcess: string[] = [];
  for (const f of files) {
    const abs = path.resolve(f);
    if (fs.existsSync(abs)) toProcess.push(abs);
    else console.warn('Missing file:', abs);
  }
  for (const r of roots) {
    const abs = path.resolve(r);
    walkFiles(abs, toProcess);
  }

  const uniq = [...new Set(toProcess)].sort();
  const manifestFiles: ManifestFileEntry[] = [];

  fs.mkdirSync(outDir, { recursive: true });

  for (const abs of uniq) {
    const ext = extOf(abs);
    const kind =
      excel && EXCEL_EXT.has(ext) ? 'excel' : word && WORD_EXT.has(ext) ? 'word' : 'skipped';

    if (kind === 'skipped') continue;

    let relativePath = abs;
    try {
      relativePath = path.relative(process.cwd(), abs);
    } catch {
      /* keep abs */
    }

    const sub = slugFromRelative(relativePath);
    const fileOut = path.join(outDir, sub);
    const t0 = Date.now();
    let ok = false;
    let error: string | undefined;
    let summary: ManifestFileEntry['summary'];

    try {
      if (kind === 'excel') {
        fs.mkdirSync(fileOut, { recursive: true });
        summary = extractWorkbookToDir(abs, relativePath, fileOut, { maxRows, maxCols });
        writeWorkbookIndexMd(fileOut, summary as import('./types').WorkbookExtractSummary);
        ok = true;
      } else {
        fs.mkdirSync(fileOut, { recursive: true });
        summary = await extractWordToDir(abs, relativePath, fileOut);
        ok = true;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      try {
        fs.mkdirSync(fileOut, { recursive: true });
        let body = error;
        if (kind === 'word') {
          body += `\n\nHint: word-extractor only handles standard .doc/.docx. Try opening in Word and Save As .docx, or use LibreOffice to export plain text.`;
        }
        fs.writeFileSync(path.join(fileOut, 'ERROR.txt'), body, 'utf8');
      } catch {
        /* ignore */
      }
    }

    manifestFiles.push({
      inputPath: abs,
      relativePath,
      kind,
      outputSubdir: sub,
      ok,
      error,
      durationMs: Date.now() - t0,
      summary,
    });

    const status = ok ? 'ok' : 'FAIL';
    console.log(`[${status}] ${relativePath} -> ${sub}`);
  }

  const manifest: PhaseZeroManifest = {
    generatedAt: new Date().toISOString(),
    toolVersion: TOOL_VERSION,
    argv: process.argv.slice(2),
    rootDirs: roots.map((r) => path.resolve(r)),
    outDir,
    options: { maxRows, maxCols, excel, word },
    files: manifestFiles,
  };

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  writeRootReadme(outDir, manifest);

  console.log('');
  console.log(`Phase Zero complete. ${manifestFiles.filter((f) => f.ok).length}/${manifestFiles.length} ok`);
  console.log(`Output: ${outDir}`);
  console.log(`Manifest: ${path.join(outDir, 'manifest.json')}`);
}

function writeWorkbookIndexMd(outDir: string, s: import('./types').WorkbookExtractSummary) {
  const lines: string[] = [
    `# ${s.fileName}`,
    '',
    `- Relative path: \`${s.relativePath}\``,
    `- Sheets: ${s.sheetNames.length}`,
    s.truncated
      ? `- **Truncated** to max ${s.maxRowsApplied} rows × ${s.maxColsApplied} cols per sheet (use \`--max-rows 0 --max-cols 0\` for full range).`
      : '- Full used range scanned (within caps if any).',
    '',
    '## Sheets',
    '',
    '| Sheet | Range | Non-empty cells | Formula cells |',
    '|-------|-------|-----------------|---------------|',
  ];
  for (const sh of s.sheets) {
    lines.push(
      `| ${sh.name} | ${sh.ref ?? '—'} | ${sh.nonEmptyCellCount} | ${sh.formulaCellCount} |`,
    );
  }
  lines.push('', '## Cell dump', '', 'One JSON object per line per sheet under `sheets/*.jsonl`. Fields: `a` (address), `r`, `c`, `t`, `v`, optional `w`, optional `f` (formula).');
  lines.push('', 'Merges: see `workbook-summary.json` → `sheets[].merges`.');
  fs.writeFileSync(path.join(outDir, 'INDEX.md'), lines.join('\n'), 'utf8');
}

function writeRootReadme(outDir: string, m: PhaseZeroManifest) {
  const lines = [
    '# Phase Zero extract',
    '',
    `Generated: ${m.generatedAt}`,
    '',
    'This folder is **machine-generated**. Re-run `npm run phase-zero` after adding reference workbooks.',
    '',
    '## Contents',
    '',
    '- `manifest.json` — index of every source file and pass/fail status.',
    '- One subdirectory per source file — `sheets/*.jsonl` (Excel) or `extracted.txt` (Word).',
    '',
    '## Re-run',
    '',
    '```bash',
    'npm run phase-zero -- --root Attached_Assets',
    '```',
    '',
    'Full sheet depth (large outputs):',
    '',
    '```bash',
    'npm run phase-zero -- --root Attached_Assets --max-rows 0 --max-cols 0',
    '```',
    '',
  ];
  fs.writeFileSync(path.join(outDir, 'README.md'), lines.join('\n'), 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
