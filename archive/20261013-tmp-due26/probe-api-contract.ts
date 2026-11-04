/**
 * Read-only probe: does the API input contract still accept the inputs the repo actually ships?
 * Feeds every PHASE1_QUICK_TEMPLATES entry plus the default seed through server/project-input-zod.ts
 * and reports rejections per field. Writes nothing.
 */
import { PHASE1_QUICK_TEMPLATES, PHASE1_DEFAULT_PROJECT_INPUT } from '../../server/default-project-inputs.ts';
import { projectInputBodySchema } from '../../server/project-input-zod.ts';

type Row = { name: string; issues: string[] };

function check(name: string, input: unknown): Row {
  const parsed = projectInputBodySchema.safeParse(input);
  if (parsed.success) return { name, issues: [] };
  const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`);
  return { name, issues };
}

const rows: Row[] = [];
rows.push(check('<PHASE1_DEFAULT_PROJECT_INPUT>', PHASE1_DEFAULT_PROJECT_INPUT));
for (const t of PHASE1_QUICK_TEMPLATES) rows.push(check(t.id, t.input));

const rejected = rows.filter((r) => r.issues.length > 0);
console.log(`templates probed: ${rows.length}`);
console.log(`rejected by the API contract: ${rejected.length}`);

const byField = new Map<string, number>();
for (const r of rejected) {
  for (const i of r.issues) {
    const field = i.split(':')[0]!;
    byField.set(field, (byField.get(field) ?? 0) + 1);
  }
}
console.log('\n--- rejection counts by field ---');
for (const [field, n] of [...byField].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(3)}  ${field}`);

console.log('\n--- ALL issues per input, with the repo value that trips it ---');
const fields = ['bedSlope', 'deckSlabThickness', 'dwl', 'hfl', 'numberOfLanes', 'carriageWidth'] as const;
for (const src of [
  { name: '<DEFAULT>', input: PHASE1_DEFAULT_PROJECT_INPUT as never },
  ...PHASE1_QUICK_TEMPLATES.map((t) => ({ name: t.id, input: t.input as never })),
]) {
  const parsed = projectInputBodySchema.safeParse(src.input);
  if (parsed.success) { console.log(`${src.name}: ACCEPTED`); continue; }
  const obj = src.input as Record<string, unknown>;
  const values = fields.map((f) => `${f}=${JSON.stringify(obj[f])}`).join(' ');
  console.log(`\n${src.name}`);
  console.log(`  values: ${values}`);
  for (const i of parsed.error.issues) console.log(`  ISSUE ${i.path.join('.')}: ${i.message}`);
}
