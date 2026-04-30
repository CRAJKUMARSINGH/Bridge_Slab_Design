/**
 * Wide shallow prism (2 GL points), steep slope, low n → Fr > 1 (Supercritical).
 * Covers the flowType branch opposite Kherwara / minimal-channel.
 */

import type { ProjectInput } from '../../bridge-excel-generator/types';

export const SUPERCRITICAL_SLOT_PROJECT_INPUT: ProjectInput = {
  projectName: 'Fixture — supercritical slot hydraulics',
  location: 'scripts/fixtures',
  riverName: 'TEST',

  spanLength: 8,
  numberOfSpans: 1,
  carriageWidth: 7.5,
  numberOfLanes: 2,
  totalLength: 8,

  hfl: 100.5,
  bedLevel: 100.0,
  foundationLevel: 97.0,
  discharge: 40.0,
  manningN: 0.02,
  bedSlope: 50,
  laceysSiltFactor: 1.2,

  crossSectionData: [
    { chainage: 0, gl: 100.0 },
    { chainage: 80, gl: 100.0 },
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

  rtl: 101.2,
  agl: 100.2,
  nbl: 100.0,
  ofl: 100.4,
  dwl: 100.52,
};
