/**
 * CLI — GENERATE THE 56-SHEET EXECUTIVE ENGINEERING PDF BOOK
 * Usage:
 *   pnpm book:56
 *   pnpm book:56 -- --out out/my-custom.pdf
 *   pnpm book:56 -- --seed-json inputs/KHERWARA.json
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ProjectInput } from '../bridge-excel-generator/types';
import { generateFiftysixSheetBookPDF } from '../server/fiftysix-sheet-book-pdf';
import { generateRoboticProjectInput } from '../bridge-excel-generator/robotic-input';

function parseArgs(argv: string[]): { out: string; seedJson: string | undefined } {
  const out = { out: path.resolve(process.cwd(), 'out', 'robotic-56sheet-book.pdf'), seedJson: undefined as string | undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out' && argv[i + 1]) {
      out.out = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (a === '--seed-json' && argv[i + 1]) {
      out.seedJson = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

async function main(): Promise<number> {
  const started = performance.now();
  const args = parseArgs(process.argv.slice(2));
  let input: ProjectInput | undefined;

  if (args.seedJson) {
    if (!fs.existsSync(args.seedJson)) {
      console.error(`❌ seed JSON not found: ${args.seedJson}`);
      return 2;
    }
    const raw = fs.readFileSync(args.seedJson, 'utf-8');
    let seed: Partial<ProjectInput>;
    try {
      seed = JSON.parse(raw) as Partial<ProjectInput>;
    } catch (err) {
      console.error('❌ seed JSON parse error:', err instanceof Error ? err.message : String(err));
      return 3;
    }
    console.log(`🌱 Seed provided: ${args.seedJson} → merging with robotic defaults`);
    input = generateRoboticProjectInput(seed);
  } else {
    console.log('🤖 No seed — running in fully robotic mode.');
  }

  console.log('📘 Generating 56-sheet executive engineering book …');
  const result = await generateFiftysixSheetBookPDF(input, {
    outDir: path.dirname(args.out),
  });

  if (args.out && path.resolve(args.out) !== path.resolve(result.pdfPath)) {
    fs.mkdirSync(path.dirname(args.out), { recursive: true });
    fs.copyFileSync(result.pdfPath, args.out);
    result.pdfPath = args.out;
  }

  const durationMs = Math.round(performance.now() - started);
  console.log('✅ Book generated.');
  console.log(JSON.stringify({
    pdfPath: result.pdfPath,
    sheetCount: result.sheetCount,
    pageCount: result.pageCount,
    roboticMode: result.roboticMode,
    durationMs,
    pdfSizeKB: Math.round(result.pdf.length / 1024),
  }, null, 2));

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('💥 FATAL: generate-56sheet-book failed:');
    console.error(err instanceof Error ? err.stack : String(err));
    process.exit(1);
  });
