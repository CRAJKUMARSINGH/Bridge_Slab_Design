/**
 * Synthetic minimal cross-section (4 points, flat channel) + short single-span deck.
 * Exercises hydraulics with different A/P/Q scale than Kherwara — regression only.
 */

import type { ProjectInput } from '../../bridge-excel-generator/types';

export const MINIMAL_CHANNEL_PROJECT_INPUT: ProjectInput = {
  projectName: 'Fixture — minimal channel hydraulics',
  location: 'scripts/fixtures',
  riverName: 'TEST',

  spanLength: 12,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 12,

  hfl: 105.0,
  bedLevel: 100.0,
  foundationLevel: 97.0,
  discharge: 120.0,
  manningN: 0.03,
  bedSlope: 500,
  laceysSiltFactor: 1.2,

  crossSectionData: [
    { chainage: 0, gl: 104.0 },
    { chainage: 30, gl: 100.0 },
    { chainage: 70, gl: 100.0 },
    { chainage: 100, gl: 104.0 },
  ],

  pierWidth: 1.0,
  pierLength: 2.5,
  pierDepth: 3.5,
  numberOfPiers: 0,
  pierBaseWidth: 2.0,
  pierBaseLength: 3.0,

  abutmentHeight: 5.0,
  abutmentWidth: 0.6,
  abutmentDepth: 2.5,
  dirtWallHeight: 3.0,
  returnWallLength: 5.0,

  concreteGrade: 'M25',
  fck: 25,
  steelGrade: 'Fe415',
  fy: 415,

  sbc: 180,
  phi: 32,
  gamma: 18,

  rtl: 106.0,
  agl: 101.0,
  nbl: 100.0,
  ofl: 104.5,
  dwl: 105.2,
};
