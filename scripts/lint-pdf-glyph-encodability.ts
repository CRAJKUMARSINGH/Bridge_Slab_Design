/**
 * PDF glyph lint: every character that reaches a PDF text operator must exist in the font.
 *
 * The exporters draw pages with jsPDF's standard 14 fonts (Helvetica), which are WinAnsi/cp1252
 * encoded. A character outside that repertoire — φ, γ, μ, ≥, ≤, →, ₹, ⚠, 〔, ─ — is not dropped:
 * jsPDF writes whatever byte its encoder falls back to, so the page prints a different, unrelated
 * glyph. The result reads as letter-spaced noise ("P h i ( ? ) :") or stray punctuation, and it
 * lands on the acceptance lines of a signed deliverable: the FOS criteria, the friction coefficient
 * in the sliding derivation, the rupee column headers.
 *
 * No existing gate caught this: the numbers are correct, the sheets link, the geometry sits inside
 * the margins. Only rendering showed it, so this lane makes the rule static instead.
 *
 * Scope is string and template literals only. Comments legitimately carry Greek (mu, gamma) as
 * prose, and the HTML, SVG and Excel writers are UTF-8 and may keep every symbol.
 *
 * Fix a violation by writing the engineering meaning in ASCII ("Phi (phi)", "mu", ">=", "Rs"), or,
 * when a symbol genuinely must print, embed a Unicode font in that exporter and prove it renders.
 *
 * Run: npx tsx scripts/lint-pdf-glyph-encodability.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const TARGETS = [
  'server/comprehensive-pdf-export.ts',
  'server/pdf-export.ts',
  'server/landscape-pdf-export.ts',
  'server/fiftysix-sheet-book-pdf.ts',
  'server/pdf-input-template-sheets.ts',
];

/** Unicode code points cp1252 reaches beyond Latin-1, via bytes 0x80-0x9F. */
const CP1252_BEYOND_LATIN1 = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161,
  0x203a, 0x0153, 0x017e, 0x0178,
]);

function isEncodable(cp: number): boolean {
  if (cp <= 0xff) return cp < 0x80 || cp >= 0xa0;
  return CP1252_BEYOND_LATIN1.has(cp);
}

/** String and template-literal bodies with their source offsets, skipping comments entirely. */
function stringBodies(source: string): Array<{ text: string; start: number }> {
  const bodies: Array<{ text: string; start: number }> = [];
  let i = 0;

  const readQuoted = (quote: string) => {
    const start = i + 1;
    i += 1;
    while (i < source.length) {
      if (source[i] === '\\') i += 2;
      else if (source[i] === quote || source[i] === '\n') break;
      else i += 1;
    }
    bodies.push({ text: source.slice(start, i), start });
    i += 1;
  };

  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
    } else if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
    } else if (ch === "'" || ch === '"') {
      readQuoted(ch);
    } else if (ch === '`') {
      readQuoted(ch);
    } else {
      i += 1;
    }
  }
  return bodies;
}

function lineAndColumn(source: string, index: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, column: index - lineStart + 1 };
}

let stringCount = 0;
const findings: string[] = [];

for (const target of TARGETS) {
  const source = readFileSync(join(root, target), 'utf8');
  const bodies = stringBodies(source);
  if (!bodies.length) {
    console.error(`lint-pdf-glyphs: ${target} has no string literals — the scan matched nothing.`);
    process.exit(1);
  }
  stringCount += bodies.length;
  for (const body of bodies) {
    for (let i = 0; i < body.text.length; i += 1) {
      const ch = body.text[i]!;
      const cp = ch.codePointAt(0)!;
      if (isEncodable(cp)) continue;
      const { line, column } = lineAndColumn(source, body.start + i);
      findings.push(`${target}:${line}:${column} U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${JSON.stringify(ch)}`);
    }
  }
}

if (findings.length) {
  console.error(
    `lint-pdf-glyphs: ${findings.length} character(s) in PDF exporter strings cannot be encoded by the standard Helvetica font and print as the wrong glyph.`,
  );
  for (const finding of findings) console.error(`  ${finding}`);
  process.exit(1);
}

console.log(`lint-pdf-glyphs: OK — ${stringCount} string literals across ${TARGETS.length} PDF exporters are cp1252-encodable.`);
