import { readFileSync } from 'node:fs';
import { z } from 'zod';

const Confidence = z.number().min(0).max(1);
const Status = z.enum(['auto', 'review', 'approved', 'rejected']);
const CellRef = z.string().regex(/^[A-Za-z_]+!?\$?[A-Z]{1,3}\$?\d+$/, 'must look like Sheet!B12');

const CoefficientsFile = z.object({
  factor_and_limit_cells: z.array(z.object({
    id: CellRef,
    sheet: z.string().min(1),
    cell: z.string().min(1),
    label: z.string().min(1),
    units: z.string(),
    value: z.number(),
    referenced_by: z.array(CellRef).min(1),
    confidence: Confidence,
    status: Status,
  })).min(1),
  embedded_literals: z.array(z.object({
    literal: z.string().min(1),
    occurrences: z.number().int().positive(),
    used_in: z.array(z.object({
      cell: CellRef,
      label: z.string().min(1),
      formula: z.string().min(1),
    })).min(1),
  })).min(1),
});

const ConstraintsFile = z.array(z.object({
  id: CellRef,
  label: z.string().min(1),
  kind: z.enum(['pairwise', 'if_check']),
  inequality: z.string().min(1),
  inequality_raw: z.string(),
  g_form: z.string(),
  value: z.union([z.number(), z.string()]),
  formula: z.string().min(1),
  confidence: Confidence,
  status: Status,
})).min(1);

// variables.json and registry.json shapes not yet confirmed — loose now, tighten after first run.
const Loose = z.union([z.array(z.record(z.unknown())), z.record(z.unknown())]);

const TARGETS: [string, z.ZodTypeAny][] = [
  ['docs/week-0/coefficients.json', CoefficientsFile],
  ['docs/week-0/constraints.json', ConstraintsFile],
  ['docs/week-0/variables.json', Loose],
  ['docs/week-0/registry.json', Loose],
];

let bad = 0;
for (const [file, schema] of TARGETS) {
  const parsed = schema.safeParse(JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')));
  if (!parsed.success) {
    bad++;
    console.error(`FAIL ${file}`);
    console.error(JSON.stringify(parsed.error.issues.slice(0, 8), null, 2));
  } else {
    console.log(`PASS ${file}`);
  }
}
if (bad) process.exit(1);
