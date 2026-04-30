/**
 * Design-engine smoke inputs: every Phase-1 quick template plus six minor
 * variations on the Kherwara golden payload (sensitivity sanity).
 */
import type { ProjectInput } from '../bridge-excel-generator/types';
import { mergeProjectInput, PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs';

/** Number of Kherwara-only perturbation cases appended after all quick templates. */
export const DESIGN_SMOKE_KHERWARA_VARIATIONS = 6;

export function expectedDesignSmokeCaseCount(): number {
  return PHASE1_QUICK_TEMPLATES.length + DESIGN_SMOKE_KHERWARA_VARIATIONS;
}

export function cloneProjectInput(input: ProjectInput): ProjectInput {
  return JSON.parse(JSON.stringify(input)) as ProjectInput;
}

export type ElevenBridgeCase = { id: string; input: ProjectInput };

export function buildElevenBridgeCases(): ElevenBridgeCase[] {
  const list: ElevenBridgeCase[] = PHASE1_QUICK_TEMPLATES.map((t) => ({
    id: `template:${t.id}`,
    input: cloneProjectInput(t.input),
  }));

  const kher = PHASE1_QUICK_TEMPLATES.find((t) => t.id === 'kherwara-golden');
  if (!kher) throw new Error('kherwara-golden template missing from PHASE1_QUICK_TEMPLATES');

  const k = cloneProjectInput(kher.input);
  const extras: ElevenBridgeCase[] = [
    {
      id: 'var:kherwara-discharge+3%',
      input: mergeProjectInput({ ...k, discharge: +(k.discharge * 1.03).toFixed(4) }),
    },
    {
      id: 'var:kherwara-discharge-3%',
      input: mergeProjectInput({ ...k, discharge: +(k.discharge * 0.97).toFixed(4) }),
    },
    {
      id: 'var:kherwara-span+0.25m',
      input: mergeProjectInput({ ...k, spanLength: +(k.spanLength + 0.25).toFixed(3) }),
    },
    {
      id: 'var:kherwara-manning+0.0005',
      input: mergeProjectInput({ ...k, manningN: +(k.manningN + 0.0005).toFixed(6) }),
    },
    {
      id: 'var:kherwara-bedSlope+40',
      input: mergeProjectInput({ ...k, bedSlope: k.bedSlope + 40 }),
    },
    {
      id: 'var:kherwara-sbc+8',
      input: mergeProjectInput({ ...k, sbc: k.sbc + 8 }),
    },
  ];

  list.push(...extras);
  return list;
}
