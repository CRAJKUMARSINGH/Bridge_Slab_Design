// Re-measure the client threshold surface with the SAME matcher `verify:outcomes` arm 6b uses,
// so the register's count is the gate's count rather than two different scans conflated.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'client', 'src');
const STABILITY_COMPARE = /\b([\w.]*(?:FOS|slid|overturn|qmax|bear)[\w.]*)\s*(>=|<=|>|<)\s*([0-9]+\.[0-9]+)\b/gi;

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) found.push(...walk(p));
    else if (/\.tsx?$/.test(e.name)) found.push(p);
  }
  return found;
}

const lines: string[] = [];
let totalLines = 0;
let totalLiterals = 0;
let totalFiles = 0;
for (const f of walk(root).sort()) {
  const rel = f.slice(join(process.cwd()).length + 1).replace(/\\/g, '/');
  const src = readFileSync(f, 'utf8');
  let fileLines = 0;
  let fileLits = 0;
  for (const raw of src.split('\n')) {
    const hits = [...raw.matchAll(STABILITY_COMPARE)].map((m) => m[3]);
    if (hits.length) { fileLines++; fileLits += hits.length; }
  }
  if (fileLines) {
    totalFiles++; totalLines += fileLines; totalLiterals += fileLits;
    const uniq = [...new Set([...src.matchAll(STABILITY_COMPARE)].map((m) => m[3]))].sort();
    lines.push(`${String(fileLines).padStart(3)} lines  ${String(fileLits).padStart(2)} literals  ${rel}  unique=[${uniq.join(', ')}]`);
  }
}
lines.push('');
lines.push(`TOTAL files=${totalFiles} comparisonLines=${totalLines} literalOccurrences=${totalLiterals}`);
console.log(lines.join('\n'));
