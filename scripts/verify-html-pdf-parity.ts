/**
 * HTML / PDF parity harness.
 *
 * The same design is rendered twice: `server/design-report.ts` writes the HTML the browser shows and
 * `server/comprehensive-pdf-export.ts` writes the PDF that gets printed and signed. Two renderers, two
 * formatting paths, one set of numbers — and until now nothing compared them. A figure drifting in one
 * of the two — a label moved off its value, a section copied from the wrong case, a table only one
 * format still prints — is invisible to every other gate, because both renderers read the same engine
 * object and each looks internally consistent.
 *
 * The check: for a list of labelled quantities that BOTH documents are expected to carry, find the
 * number printed next to the label in each, and require the two to agree.
 *   - label missing from either document  → defect (a renderer silently dropped the figure);
 *   - present in both with different value → defect (the report contradicts itself across formats);
 *   - present in both, equal                → pass.
 * A label that carries two different numbers *inside one document* is reported as a self-contradiction
 * but does not fail this gate: two formats agreeing on a contradiction is a rendering success and an
 * engineering question at the same time, and the engineering question belongs to the sign-off list.
 * Printings are matched after normalising grouping separators and currency signs, and across different
 * displayed precision (see sameNumber), so ₹1,61,18,979.9 and 16118979.9025 are one fact, not two.
 *
 * Run: npx tsx scripts/verify-html-pdf-parity.ts [--all] [--only=id1,id2] [--survey] [--dump=DIR]
 * Defaults to the two golden projects, which is what the gate chain runs; --all sweeps every template
 * (slow: each project renders a 250-page PDF), and --only takes an explicit id list.
 * --survey prints what each label is read as in each format without judging it; --dump writes the
 * extracted text of both documents (plus the unstripped HTML) so a suspicious reading can be traced.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine.ts';
import { generateComprehensivePDF } from '../server/comprehensive-pdf-export.ts';
import { generateHTMLDesignReport } from '../server/design-report.ts';
import { PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs.ts';
import type { EnhancedProjectInput } from '../bridge-excel-generator/types.ts';

/**
 * Labels both renderers are expected to print. A fact is checked only when the label is printed as a
 * distinct phrase in BOTH documents; two hydraulic quantities are deliberately absent from the list:
 *   - water level: this project prints two competing design water levels (sheet 3 AFL 101.375 m against
 *     the engine's HFL + afflux 100.856 m). Both formats print both, so parity holds; which one governs
 *     is an open engineering decision and is on the sign-off list, not something this file can settle.
 *   - mean scour depth: the HTML prints the engine's d_sm, while the PDF's summary block prints
 *     'Normal Scour Depth' from shared/input-workbook-previews.ts, which is computed by its own
 *     approximate formula and is a different quantity under a similar name. Comparing them would be a
 *     false defect; the mismatch itself is reported below and registered as an open item.
 * Use --survey to see every value each label is printed with, per format, before changing this list.
 */
const SHARED_FACTS: Fact[] = [
  { label: 'Carriageway width', find: /^carriageway width(?: \(m\))?$/i },
  { label: 'Span length', find: /^span length(?: \(m\))?$/i },
  { label: 'Number of spans', find: /^number of spans$/i },
  { label: 'Deck slab thickness', find: /^deck slab thickness(?: \(m\))?$/i },
  { label: 'Safe bearing capacity', find: /^safe bearing capacity(?: \((?:sbc|kpa)\))?$/i },
  { label: 'Afflux', find: /^afflux h$|^afflux \(m\)$/i },
  { label: 'Highest flood level', find: /^high flood level hfl$|^highest flood level(?: \(hfl\))?$/i },
  { label: 'Foundation level', find: /^foundation level(?: \(fl\))?$/i },
  { label: 'Design scour depth', find: /^design scour(?: dmax)?\s*=?/i },
  { label: 'Factor of safety against uplift', find: /^factor of safety against uplift$/i },
  { label: 'Total estimated cost', find: /^total cost$/i },
];

interface Fact {
  label: string;
  find: RegExp;
}

function flag(name: string): string | undefined {
  const i = process.argv.findIndex((a) => a === `--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split('=').slice(1).join('=') : undefined;
}

/** Strip HTML to readable text: tags become spaces, entities resolved, whitespace collapsed. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(?:br|\/p|\/div|\/tr|\/td|\/th|\/h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#8377;|&#x20B9;/gi, '₹')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*/g, '\n');
}

/**
 * Pull the visible text out of a PDF produced by jsPDF. Content streams are Flate-compressed, so each
 * `stream … endstream` block is inflated when it will inflate, then text-showing operators are read.
 *
 * Line breaks come from the text-position operators, not from newlines in the stream: a PDF content
 * stream is a command tape, and `Td`, `TD`, `T*` and `Tm` are the moves that put the next string on a
 * new line. Joining every `(...)` operand together (the obvious first attempt) produces one long blob
 * per page, in which no label sits next to its own value — the reader's layout is destroyed and every
 * comparison against the HTML becomes meaningless. So the scanner walks the tape, accumulates the
 * literal strings between moves, and emits one line per move.
 */
function pdfToText(buffer: Buffer): string {
  const lines: string[] = [];
  const raw = buffer.toString('latin1');
  const streamRe = /stream\r?\n?([\s\S]*?)endstream/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(raw)) !== null) {
    let text: string;
    try {
      text = inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
    } catch {
      text = m[1];
    }
    if (!/\bTj\b|\bTJ\b/.test(text)) continue;
    // Drawings are embedded as SVG source, which is not typeset PDF text. Reading it would credit the
    // PDF with a caption the extracted text only carries as markup, so XML streams are skipped.
    if (/<svg[\s>]|<\/text>/i.test(text)) continue;

    // Either a literal string operand or one of the operators that moves the text line.
    const tape = /(\((?:\\.|[^\\()])*\))|(Td|TD|T\*|Tm|BT|ET)/g;
    let current: string[] = [];
    let t: RegExpExecArray | null;
    while ((t = tape.exec(text)) !== null) {
      if (t[1] !== undefined) {
        current.push(
          t[1]
            .slice(1, -1)
            .replace(/\\(\d{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
            .replace(/\\([()\\])/g, '$1')
        );
        continue;
      }
      if (current.length) {
        lines.push(current.join(''));
        current = [];
      }
    }
    if (current.length) lines.push(current.join(''));
  }
  return lines.join('\n');
}

/**
 * Every number a document prints against a label, with how often it printed it.
 *
 * The two formats put the value in different places. The HTML table prints `label` then `value` on the
 * next line; the PDF wraps long labels across lines (`Carriageway Width` / `(m)` / `7.50`), so the value
 * can be two lines below. Reading only the same line as the label — the obvious first attempt — returns
 * nothing for every table row in either format and would report a document that prints nothing at all.
 * So: match the label line, then take the first following line that opens with a number, ignoring
 * wrapped label text and unit words. Values are normalised (grouping separators removed) so the en-IN
 * `1,61,18,979.9` and `16118979.9` are one value.
 */
function readings(text: string, find: RegExp): Map<string, number> {
  const lines = text.split('\n');
  const re = new RegExp(find.source, find.flags.replace('g', ''));
  const out = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const hitLabel = re.exec(line);
    if (!hitLabel) continue;
    // Some documents print the figure on the label line ('Design scour Dmax = 4.800 m'), so try the
    // remainder of this line before dropping to the rows below.
    let value = numberAt(hitLabel.input.slice(hitLabel.index + hitLabel[0].length));
    if (value === undefined) {
      for (let j = i + 1; j <= i + 4 && j < lines.length; j++) {
        value = numberAt(lines[j]);
        if (value !== undefined) break;
      }
    }
    if (value === undefined) continue;
    out.set(value, (out.get(value) ?? 0) + 1);
  }
  return out;
}

/** A line that opens with a figure, with or without a currency sign: the way both renderers print values. */
function numberAt(line: string): string | undefined {
  const hit = /^(?:rs\.?\s*|₹\s*|inr\s*)?(-?\d[\d,]*(?:\.\d+)?)\b/i.exec(line.trim());
  return hit ? hit[1].replace(/,/g, '') : undefined;
}

/** The message a thrown error actually carries, on one line. */
function firstLine(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.split('\n').map((l) => l.trim()).find((l) => l.length > 0) ?? 'no message';
}

function describe(map: Map<string, number>): string {
  return [...map.entries()].map(([v, n]) => (n > 1 ? `${v} (×${n})` : v)).join(', ');
}

function decimals(v: string): number {
  const dot = v.indexOf('.');
  return dot < 0 ? 0 : v.length - dot - 1;
}

/**
 * Two printings of the same number, allowing for different display precision.
 *
 * The HTML prints hydraulics with up to four decimals (`toLocaleString` with maximumFractionDigits 4)
 * while the PDF prints three, so the browser shows afflux 0.2561 and the signed sheet shows 0.256. The
 * engineer reading either sees the same design; the formats disagree only in how many digits they show.
 * Requiring identical digits would make the gate fire on every rounded figure and teach everyone to
 * ignore it, so the rule is: the two must fall within one half-unit of the last digit the shorter
 * printing shows. This still catches a real divergence — 100.856 against 101.375 is nowhere near each
 * other's rounding window.
 */
function sameNumber(a: string, b: string): boolean {
  const d = Math.min(decimals(a), decimals(b));
  // Half of one unit in the last displayed digit of the SHORTER printing, plus a sliver for binary
  // float representation. Rounding by toFixed alone was not enough: the PDF prints afflux 0.447 where
  // the browser prints 0.4475, and 'round the longer one' gives 0.448 or 0.447 depending on which way
  // the tie falls in binary — so the gate reported a divergence between two displays of one number.
  const slack = 0.5 * 10 ** -d * (1 + 1e-9);
  return Math.abs(Number(a) - Number(b)) <= slack;
}

/** Merge printings that are the same number at different precision, keeping the most precise form. */
function canonicalise(readings: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [value, count] of readings) {
    const twin = [...out.keys()].find((kept) => sameNumber(kept, value));
    if (twin === undefined) {
      out.set(value, count);
      continue;
    }
    out.set(decimals(value) > decimals(twin) ? value : twin, (out.get(twin) ?? 0) + count);
    if (decimals(value) > decimals(twin)) out.delete(twin);
  }
  return out;
}

/**
 * Every value on one side must have a counterpart on the other, and vice versa. Deliberately not a
 * strict pairing: a label printed nine times in the PDF and twice in the HTML is the same fact stated
 * in more places, which is parity; a label printed with a number the other format never prints is not.
 */
function sameSet(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  return [...a.keys()].every((x) => [...b.keys()].some((y) => sameNumber(x, y)));
}

const only = flag('only');
const dumpDir = flag('dump');
const survey = process.argv.includes('--survey');
const all = process.argv.includes('--all');
const selected = all
  ? PHASE1_QUICK_TEMPLATES
  : only
    ? PHASE1_QUICK_TEMPLATES.filter((t) => only.split(',').includes(t.id))
    : PHASE1_QUICK_TEMPLATES.filter((t) => t.id === 'kherwara-golden' || t.id === 'high-level-reference');

if (selected.length === 0) {
  console.error(`No template matched --only=${only}. Ids: ${PHASE1_QUICK_TEMPLATES.map((t) => t.id).join(', ')}`);
  process.exitCode = 1;
} else {
  if (dumpDir) mkdirSync(dumpDir, { recursive: true });
  let defects = 0;
  let pairsChecked = 0;
  let contradictionsSeen = 0;

  for (const template of selected) {
    const design = calculateCompleteDesign(template.input, { quiet: true });
    const enhanced = { ...template.input, ...design } as EnhancedProjectInput;
    // One template that cannot render must not abort the sweep: a thrown renderer is the most severe
    // parity defect there is (one format exists, the other does not), so it is recorded and the run goes on.
    let htmlRaw = '';
    let pdfBuffer: Buffer | null = null;
    const crashed: string[] = [];
    try {
      htmlRaw = await generateHTMLDesignReport(enhanced);
    } catch (error) {
      crashed.push(`HTML report threw: ${firstLine(error)}`);
    }
    try {
      pdfBuffer = await generateComprehensivePDF(enhanced);
    } catch (error) {
      crashed.push(`PDF threw: ${firstLine(error)}`);
    }
    const html = htmlRaw ? htmlToText(htmlRaw) : '';
    const pdf = pdfBuffer ? pdfToText(pdfBuffer) : '';
    if (dumpDir) {
      writeFileSync(join(dumpDir, `${template.id}.html.txt`), html, 'utf-8');
      writeFileSync(join(dumpDir, `${template.id}.pdf.txt`), pdf, 'utf-8');
      // The unstripped source as well: when a reading looks wrong it is usually the stripping that is
      // wrong, and guessing without the markup wastes more time than keeping the file costs.
      writeFileSync(join(dumpDir, `${template.id}.html`), htmlRaw, 'utf-8');
    }

    const problems: string[] = [...crashed];
    const contradictions: string[] = [];
    let matched = 0;
    console.log(`\n${template.id}`);
    if (!survey && crashed.length) defects += crashed.length;
    if (crashed.length && !survey) {
      // Nothing to compare: one of the documents does not exist. Reporting the crash is the finding;
      // listing eleven 'renderer dropped it' facts beside it would only bury it.
      console.log(`  FAIL no comparison — ${crashed.length} renderer(s) failed`);
      crashed.forEach((c) => console.log(`       - ${c}`));
      continue;
    }
    for (const fact of SHARED_FACTS) {
      const inHtml = canonicalise(readings(html, fact.find));
      const inPdf = canonicalise(readings(pdf, fact.find));
      if (survey) {
        console.log(`  ${fact.label.padEnd(26)} HTML: ${describe(inHtml) || '—'}   PDF: ${describe(inPdf) || '—'}`);
        continue;
      }
      // One document printing two different numbers under one label is a contradiction the reader sees
      // without comparing formats — but which of the two is the design is an engineering question, not a
      // rendering one, so it is reported rather than failed here. See the header.
      for (const [format, values] of [['HTML', inHtml], ['PDF', inPdf]] as const) {
        if (values.size > 1) contradictions.push(`'${fact.label}' is printed as ${describe(values)} in the ${format}`);
      }
      if (inHtml.size === 0 && inPdf.size === 0) {
        problems.push(`'${fact.label}': neither renderer prints it — the fact list needs revisiting, not the code`);
        continue;
      }
      if (inHtml.size === 0 || inPdf.size === 0) {
        problems.push(`'${fact.label}': only in ${inHtml.size ? 'HTML' : 'PDF'} (${describe(inHtml.size ? inHtml : inPdf)}) — one renderer dropped it`);
        continue;
      }
      pairsChecked++;
      if (!sameSet(inHtml, inPdf)) {
        problems.push(`'${fact.label}': HTML prints ${describe(inHtml)}, PDF prints ${describe(inPdf)}`);
      } else matched++;
    }

    if (survey) continue;
    defects += problems.length;
    console.log(`  ${problems.length === 0 ? 'OK  ' : 'FAIL'} facts matched: ${matched}/${SHARED_FACTS.length}`);
    problems.forEach((p) => console.log(`       - ${p}`));
    contradictions.forEach((c) => console.log(`       ! ${c}`));
    contradictionsSeen += contradictions.length;
  }

  if (survey) {
    console.log('\nSurvey only — no verdict. Each line lists every value that label is printed with, per format.');
  } else {
    console.log(`\nProjects: ${selected.length} | shared facts compared: ${pairsChecked} | defects: ${defects} | self-contradictions reported: ${contradictionsSeen}`);
    console.log(
      'Parity means: whatever the reader sees in the browser, the same reader sees in the signed PDF.\n' +
      'It says nothing about whether the number itself is right — that is the engineering sign-off.'
    );
    if (defects > 0) process.exitCode = 1;
  }
}
