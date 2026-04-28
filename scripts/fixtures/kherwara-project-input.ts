/**
 * Reference ProjectInput aligned with legacy FINAL_RESULT / KHERWARA sample.
 * Used by scripts/test-excel-generator.ts — not bundled in the web app.
 */

import type { ProjectInput } from '../../bridge-excel-generator/types';

export const KHERWARA_REFERENCE_PROJECT_INPUT: ProjectInput = {
  projectName: 'Construction of Submersible Bridge on KHERWARA - JAWAS - SUVERI ROAD',
  location: 'KM 9/000, KHERWARA - JAWAS - SUVERI ROAD',
  riverName: 'SOM',

  spanLength: 8,
  numberOfSpans: 12,
  skew: 0,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 96,

  hfl: 100.6,
  bedLevel: 96.6,
  foundationLevel: 92.6,
  discharge: 902.15,
  manningN: 0.033,
  bedSlope: 960,
  laceysSiltFactor: 1.5,

  crossSectionData: [
    { chainage: 0, gl: 100.5 },
    { chainage: 10, gl: 98.2 },
    { chainage: 20, gl: 96.6 },
    { chainage: 30, gl: 96.8 },
    { chainage: 40, gl: 97.5 },
    { chainage: 50, gl: 99.8 },
    { chainage: 60, gl: 101.2 },
  ],

  pierWidth: 1.2,
  pierLength: 3.5,
  pierDepth: 4.0,
  numberOfPiers: 11,
  pierBaseWidth: 2.5,
  pierBaseLength: 4.5,

  abutmentHeight: 5.0,
  abutmentWidth: 0.575,
  abutmentDepth: 3.0,
  dirtWallHeight: 3.5,
  returnWallLength: 6.0,

  concreteGrade: 'M25',
  fck: 25,
  steelGrade: 'Fe415',
  fy: 415,

  sbc: 150,
  phi: 30,
  gamma: 18,

  rtl: 101.6,
  agl: 96.6,
  nbl: 96.6,
  ofl: 100.6,
  dwl: 100.83,

  issuingAuthority: 'PWD / Employer records (Kherwara sample)',
  jobNumber: 'KHERWARA-SUBM-REF',
  hardRockAvailable: false,
};
