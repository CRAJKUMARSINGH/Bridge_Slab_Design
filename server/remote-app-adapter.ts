/**
 * REMOTE_APP Adapter
 * Wires valuable modules from REMOTE_APP to main app
 * Abutment Design, Estimation Module, Deck Anchorage
 *
 * Pure constants, the DetailedEstimationResult type, buildOverheadLadder and
 * calculateDetailedEstimation now live in shared/design-engine-types.ts so the
 * bridge-excel-generator can import them without pulling in the server layer.
 * Everything is re-exported here so existing callers (api-routes, scripts) need
 * no changes.
 */

import type {
  ProjectInput,
  CompleteDesignResult,
} from '../bridge-excel-generator/types';
import {
  WEARING_COAT_THICKNESS_M,
} from '../bridge-excel-generator/material-rates';
import { deckSlabThicknessOf } from '../bridge-excel-generator/input-contract';

// ── Re-export everything that moved to shared/ ────────────────────────────────
export {
  BEARINGS_PER_PIER,
  OVERHEAD_RATES,
  ABUTMENT_BAND_LENGTH_M,
  ABUTMENT_FOOTING_EXTRA_WIDTH_M,
  PIER_FOOTING_THICKNESS_M,
  BLINDING_THICKNESS_M,
  EXCAVATION_OVERDIG_M,
  SOFT_ROCK_BAND_THICKNESS_M,
  WEEP_HOLE_SPACING_M,
  RETURN_WALL_THICKNESS_M,
  WALL_BACKFILL_WIDTH_M,
  WALL_FILTER_THICKNESS_M,
  APPROACH_SLAB_LENGTH_M,
  APPROACH_SLAB_THICKNESS_M,
  APPROACH_LEVELLING_THICKNESS_M,
  MARKING_LINES,
  MARKING_LINE_WIDTH_M,
  CATS_EYE_SPACING_M,
  INFO_BOARDS,
  NAME_BOARDS,
  buildOverheadLadder,
  calculateDetailedEstimation,
  type DetailedEstimationResult,
} from '../shared/design-engine-types';

// ── Private types used only within this adapter ───────────────────────────────

interface AbutmentDesignInput {
  geometry: {
    abutmentHeight: number;
    dirtWallHeight: number;
    capWidth: number;
    capLength: number;
    footingLength: number;
    footingWidth: number;
    footingThickness: number;
  };
  materials: {
    concrete: 'M25' | 'M30' | 'M35';
    steel: 'Fe415' | 'Fe500';
  };
  soilProperties: {
    phi: number;
    gamma: number;
    gammaSat: number;
    sbc: number;
    mu: number;
  };
  loads: {
    deadLoad: number;
    liveLoad: number;
    soilSurcharge: number;
  };
  waterLevels: {
    hfl: number;
    foundationLevel: number;
  };
}

interface DeckAnchorageInput {
  deckGeometry: {
    length: number;
    width: number;
    thickness: number;
    volume: number;
  };
  waterLevels: {
    hfl: number;
    deckTopLevel: number;
    deckBottomLevel: number;
  };
  hydraulics: {
    velocity: number;
    discharge: number;
  };
  loads: {
    deckDeadLoad: number;
    wearingCoatLoad: number;
    parapetLoad: number;
  };
  materials: {
    concrete: 'M25' | 'M30' | 'M35';
    boltGrade: '4.6' | '8.8' | '10.9';
  };
}

/**
 * Convert ProjectInput to AbutmentDesignInput format
 */
function toAbutmentInput(input: ProjectInput): AbutmentDesignInput {
  return {
    geometry: {
      abutmentHeight: input.abutmentHeight,
      dirtWallHeight: input.dirtWallHeight,
      capWidth: input.abutmentWidth + 0.5,
      capLength: 10, // typical abutment width
      footingLength: input.abutmentWidth + 1.5,
      footingWidth: 10,
      footingThickness: input.abutmentDepth,
    },
    materials: {
      concrete: input.concreteGrade as 'M25' | 'M30' | 'M35',
      steel: input.steelGrade as 'Fe415' | 'Fe500',
    },
    soilProperties: {
      phi: input.phi,
      gamma: input.gamma,
      gammaSat: input.gamma + 2,
      sbc: input.sbc,
      mu: 0.5,
    },
    loads: {
      deadLoad: 0, // calculated internally
      liveLoad: 0, // calculated internally
      soilSurcharge: 10,
    },
    waterLevels: {
      hfl: input.hfl,
      foundationLevel: input.foundationLevel,
    },
  };
}

/**
 * Convert ProjectInput to DeckAnchorageInput format
 */
function toDeckAnchorageInput(
  input: ProjectInput,
  designResults: Partial<CompleteDesignResult>,
): DeckAnchorageInput {
  const deckThk = deckSlabThicknessOf(input);
  const deckVolume = input.totalLength * input.carriageWidth * deckThk;

  return {
    deckGeometry: {
      length: input.totalLength,
      width: input.carriageWidth,
      thickness: deckThk,
      volume: deckVolume,
    },
    waterLevels: {
      hfl: input.hfl,
      deckTopLevel: input.rtl,
      deckBottomLevel: input.rtl - deckThk,
    },
    hydraulics: {
      velocity: designResults.hydraulics?.velocity || 1.8,
      discharge: designResults.hydraulics?.discharge || 900,
    },
    loads: {
      deckDeadLoad: deckVolume * 25,
      wearingCoatLoad:
        input.totalLength * input.carriageWidth * WEARING_COAT_THICKNESS_M * 22,
      parapetLoad: input.totalLength * 2 * 1.5,
    },
    materials: {
      concrete: input.concreteGrade as 'M25' | 'M30' | 'M35',
      boltGrade: '8.8' as const,
    },
  };
}

/**
 * Calculate detailed abutment design with earth pressure and stability
 */
export function calculateDetailedAbutmentDesign(
  input: ProjectInput,
  type: 'TYPE1' | 'C1',
): {
  earthPressure: {
    ka: number;
    kp: number;
    activeForce: number;
    resultantLocation: number;
  };
  stability: {
    overturningFOS: number;
    slidingFOS: number;
    basePressureMax: number;
    status: 'SAFE' | 'UNSAFE';
  };
  reinforcement: {
    mainSteelDiameter: number;
    mainSteelSpacing: number;
    distributionSteelDiameter: number;
    distributionSteelSpacing: number;
  };
  quantities: {
    concrete: number;
    steel: number;
  };
} {
  const H = input.abutmentHeight;
  const t = input.abutmentWidth;
  const B = t + 1.5;
  const phi = input.phi;
  const gamma = input.gamma;

  // Earth pressure coefficient (Rankine)
  const phiRad = (phi * Math.PI) / 180;
  const Ka = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const Kp = Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);

  // Active earth pressure force
  const Pa = 0.5 * Ka * gamma * H * H * 10; // 10m width
  const resultantLocation = H / 3;

  // Stability calculations
  const abutmentWeight = t * H * 10 * 25;
  const footingWeight = B * input.abutmentDepth * 10 * 25;
  const totalWeight = abutmentWeight + footingWeight;

  // Overturning stability
  const overturningMoment = Pa * resultantLocation;
  const resistingMoment = totalWeight * (B / 2);
  const overturningFOS = resistingMoment / overturningMoment;

  // Sliding stability
  const slidingForce = Pa;
  const resistingForce = totalWeight * 0.5; // mu = 0.5
  const slidingFOS = resistingForce / slidingForce;

  // Base pressure
  const area = B * 10;
  const moment = overturningMoment - resistingMoment;
  const eccentricity = Math.abs(moment) / totalWeight;
  const basePressureMax = (totalWeight / area) * (1 + (6 * eccentricity) / B);

  const status =
    overturningFOS >= 1.5 && slidingFOS >= 1.5 && basePressureMax <= input.sbc
      ? 'SAFE'
      : 'UNSAFE';

  return {
    earthPressure: {
      ka: Ka,
      kp: Kp,
      activeForce: Pa,
      resultantLocation,
    },
    stability: {
      overturningFOS,
      slidingFOS,
      basePressureMax,
      status,
    },
    reinforcement: {
      mainSteelDiameter: 25,
      mainSteelSpacing: 150,
      distributionSteelDiameter: 12,
      distributionSteelSpacing: 150,
    },
    quantities: {
      concrete: t * H * 10 + B * input.abutmentDepth * 10,
      steel: t * H * 10 * 80, // 80 kg/m³ typical
    },
  };
}

/**
 * Calculate deck anchorage (submersible: uplift / buoyancy critical;
 * high-level: typically not required when soffit is above DWL).
 */
export function calculateDeckAnchorage(
  input: ProjectInput,
  designResults: Partial<CompleteDesignResult>,
): {
  upliftForces: {
    buoyancy: number;
    hydrodynamic: number;
    total: number;
  };
  resistingForces: {
    deadLoad: number;
    wearingCoat: number;
    parapet: number;
    friction: number;
    total: number;
  };
  safetyFactor: number;
  status: 'SAFE' | 'UNSAFE';
  anchorageRequired: boolean;
  boltRecommendation: {
    diameter: number;
    number: number;
    grade: string;
  };
} {
  const deckThk = deckSlabThicknessOf(input);
  const deckArea = input.totalLength * input.carriageWidth;
  const deckVolume = deckArea * deckThk;
  const deckWeight = deckVolume * 25;
  const soffitLevel = input.deckSoffitLevel ?? input.rtl - deckThk;
  const dwl = designResults.hydraulics?.designWaterLevel ?? input.hfl;

  if (input.bridgeType === 'high-level' && soffitLevel >= dwl - 0.05) {
    const wearingCoat = deckArea * WEARING_COAT_THICKNESS_M * 22;
    const parapet = input.totalLength * 2 * 1.5;
    const friction = deckWeight * 0.6;
    const totalResisting = deckWeight + wearingCoat + parapet + friction;
    return {
      upliftForces: { buoyancy: 0, hydrodynamic: 0, total: 0 },
      resistingForces: {
        deadLoad: deckWeight,
        wearingCoat,
        parapet,
        friction,
        total: totalResisting,
      },
      safetyFactor: 99,
      status: 'SAFE',
      anchorageRequired: false,
      boltRecommendation: { diameter: 20, number: 0, grade: '8.8' },
    };
  }

  // Buoyancy can only act on the part of the deck below the design water level
  const submergedDepth = Math.max(0, Math.min(dwl - soffitLevel, deckThk));
  const submergedVolume = deckArea * submergedDepth;
  const buoyancy = submergedVolume * 9.81;

  // Hydrodynamic uplift (simplified)
  const velocity = designResults.hydraulics?.velocity || 1.8;
  const hydrodynamic =
    0.5 * 1000 * velocity * velocity * input.carriageWidth * input.totalLength * 0.001;

  const totalUplift = buoyancy + hydrodynamic;

  // Resisting forces
  const wearingCoat = deckArea * WEARING_COAT_THICKNESS_M * 22;
  const parapet = input.totalLength * 2 * 1.5;
  const friction = deckWeight * 0.6;
  const totalResisting = deckWeight + wearingCoat + parapet + friction;

  const safetyFactor = totalUplift > 0 ? totalResisting / totalUplift : 99;
  const status = safetyFactor >= 1.2 ? 'SAFE' : 'UNSAFE';
  const anchorageRequired = status === 'UNSAFE' || submergedDepth > 0.1;

  // Bolt recommendation
  const boltForce = anchorageRequired
    ? Math.max(0, totalUplift - totalResisting) * 1.5
    : 0;
  const boltCapacity = 45.2; // 20mm grade 8.8 bolt capacity in kN
  const minimumBolts = submergedDepth > 0.1 ? 4 : 0;
  const numberOfBolts = Math.max(Math.ceil(boltForce / boltCapacity), minimumBolts);

  return {
    upliftForces: {
      buoyancy,
      hydrodynamic,
      total: totalUplift,
    },
    resistingForces: {
      deadLoad: deckWeight,
      wearingCoat,
      parapet,
      friction,
      total: totalResisting,
    },
    safetyFactor,
    status,
    anchorageRequired,
    boltRecommendation: {
      diameter: 20,
      number: numberOfBolts,
      grade: '8.8',
    },
  };
}

export {
  type AbutmentDesignInput,
  type DeckAnchorageInput,
  toAbutmentInput,
  toDeckAnchorageInput,
};
