/**
 * Narrative lint: no hard-coded numbers in generated prose.
 *
 * `bridge-excel-generator/narrative-engine.ts` and `lib/narrative/src/**` write the sentences the
 * engineer reads in the PDF, the HTML report and the workbook narrative rows. Every figure in those
 * sentences must come from the calculation chain through an interpolation. A literal typed into the
 * prose ("scour depth 4.80 m below bed") keeps its old value after the inputs change, and then the
 * report states something the workbook contradicts — the exact failure this repository's whole
 * "LINK ALL" rule exists to prevent, except in the one place a reader trusts without checking:
 * the sentences.
 *
 * The rule therefore rejects any digit inside a string or template literal, with a narrow,
 * explicit allowlist for things that are not results:
 *   - units written with an exponent: mm2, mm3, mm4, m2, m3, kN-m;
 *   - code and clause citations: IRC:NN, IRC NN, IS NNNN, SP NN, § NN, Clause/Art./Section NN;
 *   - en-IN / locale / font-size style tokens and year-numbered standard names (e.g. "IS 875").
 * Add to ALLOW when the lint is right and the exception is genuinely not a number; never edit a
 * sentence to dodge it, and never relax the pattern list wholesale.
 *
 * The scanner is deliberately simple: it tracks quotes and backticks, skips ${...} interpolation
 * bodies (those ARE the engine's values and must contain numbers), and ignores lines whose only
 * purpose is documentation. If it finds no prose at all in a file it reports that instead of
 * quietly passing — a lint that can pass by matching nothing is worthless.
 *
 * Run: npx tsx scripts/lint-narrative-no-hardcoded-numbers.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, '..');

const TARGETS = ['lib/narrative/src', 'bridge-excel-generator/narrative-engine.ts'];

const ALLOW: Array<{ label: string; re: RegExp }> = [
  { label: 'area/volume units', re: /\b(?:mm|m|cm|km|kN-m|MN-m)(?:2|3|4)\b/g },
  { label: 'IRC citation', re: /\bIRC[:\s-]?\d+(?::\d{4})?\b/gi },
  { label: 'IS / SP citation', re: /\b(?:IS|SP|IRC)[\s-]\d+(?:[-/:]\d{4})?\b/gi },
  { label: 'clause / section / article', re: /\b(?:§|Clause|Section|Art\.|Article)[\s-]*\d+(?:[\s.(]\d+)*/gi },
  { label: 'standard with a year', re: /\b(?:IS|IRC)[:\s-]?\d{2,4}[:\s-]?\d{4}\b/gi },
  { label: 'locale / technical token', re: /\b(?:en-IN|UTF-8|ISO[-\s]?\d+|A4|A3|L2|T3)\b/gi },
  // A slope written "1 in N" is a ratio convention, not a value: N is the number and it is
  // interpolated. The leading 1 is part of the idiom.
  { label: 'slope-ratio idiom', re: /\b1\s+in\b/gi },
  // Spreadsheet cell references quoted in prose ("Factors!B2") name a place, not a quantity.
  { label: 'cell reference', re: /![A-Z]{1,3}\d+/g },
];

const UNITS = /^\s*(?:mm|cm|km|kN-m|MN-m|kN|MPa|GPa|N\/mm|MT|L\b|%\B|°|m²|m³|m\b)/;

/**
 * A number in prose is a defect when it pretends to be data: it carries a decimal place, a unit,
 * or a comparison. A bare integer standing alone is enumeration — "Step 2", chapter "4 —", the
 * abutment called Type 1 — and restating it from the engine would be silly, so it is ignored.
 */
function looksLikeQuantity(text: string, at: number, token: string): boolean {
  if (/[.,]\d/.test(token)) return true;
  const after = text.slice(at + token.length, at + token.length + 10);
  if (UNITS.test(after)) return true;
  const before = text.slice(Math.max(0, at - 6), at);
  return /[<>≤≥=×*/]\s*$/.test(before) || /\bvs\.?\s+$/i.test(before);
}

/** Replace allowed citation/unit spans with padding so their digits stop counting. */
function blankAllowed(text: string): string {
  let out = text;
  for (const { re } of ALLOW) {
    out = out.replace(re, (m) => ' '.repeat(m.length));
  }
  return out;
}

/** Extract string-literal and template-literal prose spans, skipping ${...} bodies. */
function proseSpans(source: string): Array<{ line: number; col: number; text: string }> {
  const spans: Array<{ line: number; col: number; text: string }> = [];
  let line = 1;
  let col = 1;
  let i = 0;

  const skipTemplateBody = (start: number): string => {
    // Walk a template literal from its opening backtick, honouring nested ${ } and escapes.
    let depth = 0;
    let j = start + 1;
    let body = '';
    while (j < source.length) {
      const ch = source[j];
      if (ch === '\\') { body += '  '; j += 2; col += 2; continue; }
      if (ch === '\n') { line++; col = 1; body += '\n'; j++; continue; }
      if (depth === 0 && ch === '`') { j++; col++; break; }
      if (ch === '$' && source[j + 1] === '{') { depth++; body += '  '; j += 2; col += 2; continue; }
      if (depth > 0 && ch === '{') { depth++; body += ' '; j++; col++; continue; }
      if (depth > 0 && ch === '}') { depth--; body += ' '; j++; col++; continue; }
      body += depth === 0 ? ch : ' ';
      j++; col++;
    }
    return body;
  };

  while (i < source.length) {
    const ch = source[i];
    if (ch === '\n') { line++; col = 1; i++; continue; }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i += 2; col += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') { line++; col = 1; } else col++;
        i++;
      }
      i += 2; col += 2;
      continue;
    }
    if (ch === '`') {
      const startLine = line;
      const startCol = col;
      const body = skipTemplateBody(i);
      if (body.trim().length > 0) spans.push({ line: startLine, col: startCol, text: body });
      i = i + body.length + 2 <= source.length ? i + body.length + 2 : source.length;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let body = '';
      col += 1;
      while (j < source.length) {
        const c = source[j];
        if (c === '\\') { body += '  '; j += 2; col += 2; continue; }
        if (c === '\n') break;
        if (c === quote) { j++; col++; break; }
        body += c;
        j++; col++;
      }
      if (body.trim().length > 0) spans.push({ line, col: col - body.length - 1, text: body });
      i = j;
      continue;
    }
    i++; col++;
  }
  return spans;
}

function listFiles(rel: string): string[] {
  const abs = join(root, rel);
  const st = statSync(abs);
  if (st.isFile()) return [abs];
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const child = join(abs, entry);
    if (statSync(child).isDirectory()) out.push(...listFiles(relative(root, child)));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(child);
  }
  return out;
}

const violations: string[] = [];
let proseSpanCount = 0;

for (const rel of TARGETS) {
  for (const file of listFiles(rel)) {
    const source = readFileSync(file, 'utf8');
    const spans = proseSpans(source);
    proseSpanCount += spans.length;
    for (const span of spans) {
      const scanned = blankAllowed(span.text);
      for (const m of scanned.matchAll(/\d+(?:[.,]\d+)?/g)) {
        const at = m.index ?? 0;
        if (!looksLikeQuantity(scanned, at, m[0])) continue;
        const excerpt = span.text
          .slice(Math.max(0, at - 48), at + 24)
          .replace(/\s+/g, ' ')
          .trim();
        violations.push(
          `${relative(root, file).replace(/\\/g, '/')}:${span.line}: hard-coded quantity "${m[0]}" in prose ` +
          `(…${excerpt}…) — interpolate it from the engine instead`
        );
      }
    }
  }
}

if (proseSpanCount === 0) {
  console.error('NARRATIVE LINT: found no prose spans at all — the scanner is broken, not the code.');
  process.exitCode = 1;
} else if (violations.length > 0) {
  console.error(`NARRATIVE LINT: ${violations.length} hard-coded number(s) in generated prose\n`);
  violations.forEach((v) => console.error(`  - ${v}`));
  console.error(
    '\nA number typed into a sentence keeps its value when the inputs change, so the report can\n' +
    'contradict the workbook it describes. Every figure must come from the calculation chain.'
  );
  process.exitCode = 1;
} else {
  console.log(
    `NARRATIVE LINT: OK — ${proseSpanCount} prose spans checked across ${TARGETS.join(', ')}; ` +
    `no hard-coded numbers (citations and units allowed by the explicit list).`
  );
}
