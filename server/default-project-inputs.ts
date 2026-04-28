/**
 * Canonical Phase-1 inputs for the bridge Excel generator.
 * Default template values merged with partial API bodies until VARIABLE_SELECTION_SHEET.xlsx is finalized.
 */

import type { ProjectInput } from '../bridge-excel-generator/types';
import { HIGH_LEVEL_REFERENCE_PROJECT_INPUT } from '../scripts/fixtures/high-level-project-input';
import { KHERWARA_REFERENCE_PROJECT_INPUT } from '../scripts/fixtures/kherwara-project-input';
import { LARATHI_STABIL_REFERENCE_INPUT } from '../scripts/fixtures/larathi-stabil-project-input';

export const PHASE1_DEFAULT_PROJECT_INPUT: ProjectInput = {
  projectName: 'Sample Submersible Bridge',
  location: 'Rajasthan, India',
  riverName: 'Sample River',
  bridgeType: 'submersible',

  spanLength: 10,
  numberOfSpans: 4,
  skew: 0,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 40,

  hfl: 285.5,
  bedLevel: 280.2,
  foundationLevel: 276.5,
  discharge: 900,
  manningN: 0.033,
  bedSlope: 1200,
  laceysSiltFactor: 1.5,

  crossSectionData: [
    { chainage: 0, gl: 280.0 },
    { chainage: 20, gl: 279.2 },
    { chainage: 40, gl: 278.5 },
    { chainage: 60, gl: 279.0 },
    { chainage: 80, gl: 280.0 },
  ],

  pierWidth: 1.2,
  pierLength: 3.5,
  pierDepth: 4.0,
  numberOfPiers: 3,
  pierBaseWidth: 2.5,
  pierBaseLength: 4.5,

  abutmentHeight: 8,
  abutmentWidth: 3.5,
  abutmentDepth: 5,
  dirtWallHeight: 2.5,
  returnWallLength: 6,

  concreteGrade: 'M25',
  fck: 25,
  steelGrade: 'Fe415',
  fy: 415,

  sbc: 200,
  phi: 30,
  gamma: 18,

  rtl: 287.0,
  agl: 280.2,
  nbl: 280.2,
  ofl: 284.8,
  dwl: 285.75,
  deckSlabThickness: 0.25,
  freeboardAboveHfl: 1.0,

  /** Shown on TechNote / Tech Report; empty → generator default phrase. */
  issuingAuthority: '',
  jobNumber: '',
  hardRockAvailable: false,
};

function cloneCrossSection(data: ProjectInput['crossSectionData']) {
  return data.map((p) => ({ chainage: p.chainage, gl: p.gl }));
}

/** Merge partial JSON body onto defaults so POST /calculate works with incomplete payloads. */
export function mergeProjectInput(partial: Partial<ProjectInput> | null | undefined): ProjectInput {
  const base = PHASE1_DEFAULT_PROJECT_INPUT;
  if (!partial || typeof partial !== 'object') {
    return { ...base, crossSectionData: cloneCrossSection(base.crossSectionData) };
  }
  const merged: ProjectInput = {
    ...base,
    ...partial,
    crossSectionData:
      Array.isArray(partial.crossSectionData) && partial.crossSectionData.length > 0
        ? cloneCrossSection(partial.crossSectionData as ProjectInput['crossSectionData'])
        : cloneCrossSection(base.crossSectionData),
  };
  return merged;
}

export const PHASE1_QUICK_TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  input: ProjectInput;
}> = [
  {
    id: 'larathi-stabil',
    name: 'Larathi / Som (stabil*.xls seed)',
    description:
      'Values aligned with Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls (discharge, spans, cross-section, HFL)',
    input: mergeProjectInput(LARATHI_STABIL_REFERENCE_INPUT),
  },
  {
    id: 'kherwara-golden',
    name: 'Kherwara worksheet (reference)',
    description: 'Golden regression input aligned with the KHERWARA / FINAL_RESULT workbook (verify:excel)',
    input: mergeProjectInput(KHERWARA_REFERENCE_PROJECT_INPUT),
  },
  {
    id: 'high-level-reference',
    name: 'High-level slab bridge (starter)',
    description: 'Dual-mode high-level deck starter with freeboard above HFL and elevated deck levels',
    input: mergeProjectInput(HIGH_LEVEL_REFERENCE_PROJECT_INPUT),
  },
  {
    id: 'small-bridge',
    name: 'Small bridge (8 m span)',
    description: 'Narrow carriageway, low discharge',
    input: mergeProjectInput({
      projectName: 'Small Bridge Template',
      spanLength: 8,
      numberOfSpans: 3,
      carriageWidth: 4.5,
      numberOfLanes: 2,
      totalLength: 24,
      numberOfPiers: 2,
      hfl: 282,
      bedLevel: 277,
      nbl: 277,
      rtl: 285,
      agl: 278.5,
      ofl: 281.5,
      dwl: 282.25,
      foundationLevel: 273,
      discharge: 85,
      manningN: 0.03,
      bedSlope: 1000,
      crossSectionData: [
        { chainage: 0, gl: 277 },
        { chainage: 10, gl: 276 },
        { chainage: 20, gl: 275.5 },
        { chainage: 30, gl: 276 },
        { chainage: 40, gl: 277 },
      ],
      pierWidth: 1.0,
      pierLength: 3.0,
      pierDepth: 3.5,
      pierBaseWidth: 2.0,
      pierBaseLength: 3.5,
      abutmentHeight: 6,
      abutmentWidth: 3,
      abutmentDepth: 4,
      sbc: 150,
    }),
  },
  {
    id: 'medium-bridge',
    name: 'Medium bridge (12 m span)',
    description: 'Typical two-lane submersible',
    input: mergeProjectInput({
      projectName: 'Medium Bridge Template',
      spanLength: 12,
      numberOfSpans: 4,
      carriageWidth: 7.5,
      numberOfLanes: 2,
      totalLength: 48,
      numberOfPiers: 3,
      hfl: 288,
      bedLevel: 282,
      nbl: 282,
      rtl: 290,
      agl: 283,
      ofl: 286,
      dwl: 288.5,
      foundationLevel: 278,
      discharge: 650,
      manningN: 0.033,
      bedSlope: 1200,
      pierWidth: 1.2,
      pierLength: 3.5,
      pierDepth: 5,
      pierBaseWidth: 2.5,
      pierBaseLength: 4.5,
      abutmentHeight: 8,
      abutmentWidth: 3.5,
      abutmentDepth: 5,
      sbc: 200,
    }),
  },
  {
    id: 'large-bridge',
    name: 'Large bridge (16 m span)',
    description: 'Wider waterway, higher discharge',
    input: mergeProjectInput({
      projectName: 'Large Bridge Template',
      spanLength: 16,
      numberOfSpans: 5,
      carriageWidth: 10.5,
      numberOfLanes: 3,
      totalLength: 80,
      numberOfPiers: 4,
      hfl: 295,
      bedLevel: 288,
      nbl: 288,
      rtl: 298,
      agl: 289,
      ofl: 292,
      dwl: 295.5,
      foundationLevel: 283,
      discharge: 1800,
      manningN: 0.035,
      bedSlope: 1500,
      laceysSiltFactor: 1.65,
      pierWidth: 1.5,
      pierLength: 4.5,
      pierDepth: 6,
      pierBaseWidth: 3,
      pierBaseLength: 5.5,
      abutmentHeight: 10,
      abutmentWidth: 4.5,
      abutmentDepth: 6,
      sbc: 280,
      phi: 32,
    }),
  },
];
