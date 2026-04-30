/**
 * ProjectInput aligned with `Attached_Assets/Stability Analysis SUBMERSIBLE BRIDGE ACROSS LARATHI SOM RIVER.xls`
 * (HYDRAULICS upstream section + afflux sheet key values: Q, n, spans, HFL, chainage/GL).
 */

import type { ProjectInput } from '../../bridge-excel-generator/types';

export const LARATHI_STABIL_REFERENCE_INPUT: ProjectInput = {
  projectName: 'Construction of Submersible Bridge on Larathi to Larathi B Road, across Som River',
  location: 'Larathi to Larathi B Road, Som River',
  riverName: 'Som',

  spanLength: 8,
  numberOfSpans: 12,
  skew: 0,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 96,

  hfl: 99.5,
  bedLevel: 96.17,
  foundationLevel: 92.0,
  discharge: 1066.8,
  manningN: 0.033,
  bedSlope: 926,
  laceysSiltFactor: 1.5,

  crossSectionData: [
    { chainage: 0, gl: 99.35 },
    { chainage: 5, gl: 98.08 },
    { chainage: 10, gl: 94.39 },
    { chainage: 20, gl: 93.84 },
    { chainage: 30, gl: 92.69 },
    { chainage: 40, gl: 93.59 },
    { chainage: 50, gl: 94.02 },
    { chainage: 60, gl: 94.62 },
    { chainage: 70, gl: 94.34 },
    { chainage: 80, gl: 95.58 },
    { chainage: 90, gl: 97.61 },
    { chainage: 95, gl: 98.98 },
    { chainage: 100, gl: 99.49 },
    { chainage: 105, gl: 99.78 },
    { chainage: 110, gl: 100.12 },
    { chainage: 115, gl: 100.573 },
  ],

  pierWidth: 1.2,
  pierLength: 3.5,
  pierDepth: 4.0,
  numberOfPiers: 11,
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

  rtl: 101.6,
  agl: 96.6,
  nbl: 96.6,
  ofl: 100.6,
  dwl: 100.83,

  issuingAuthority: 'PWD / Employer records (Larathi Som sample)',
  jobNumber: 'LARATHI-SOM-STAB-REF',
  hardRockAvailable: true,
};
