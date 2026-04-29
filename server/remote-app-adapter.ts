/**
 * REMOTE_APP Adapter
 * Wires valuable modules from REMOTE_APP to main app
 * Abutment Design, Estimation Module, Deck Anchorage
 */

import type { ProjectInput, EnhancedProjectInput, BOQItem } from '../bridge-excel-generator/types';

// Types from REMOTE_APP modules
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

interface DetailedEstimationResult {
  quantities: {
    concrete: {
      m25: number;
      m30: number;
      m35: number;
    };
    steel: {
      fe415: number;
      fe500: number;
    };
    formwork: number;
    excavation: {
      ordinary: number;
      hardRock: number;
    };
    backfill: number;
    pccBlinding: number;
    wearingCoat: number;
    expansionJoints: number;
    bearings: number;
  };
  costs: {
    concrete: number;
    steel: number;
    formwork: number;
    excavation: number;
    backfill: number;
    pccBlinding: number;
    wearingCoat: number;
    expansionJoints: number;
    bearings: number;
    total: number;
  };
  boqItems: BOQItem[];
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
function toDeckAnchorageInput(input: ProjectInput, designResults: any): DeckAnchorageInput {
  const deckVolume = input.totalLength * input.carriageWidth * 0.25;
  
  return {
    deckGeometry: {
      length: input.totalLength,
      width: input.carriageWidth,
      thickness: 0.25,
      volume: deckVolume,
    },
    waterLevels: {
      hfl: input.hfl,
      deckTopLevel: input.rtl,
      deckBottomLevel: input.rtl - 0.25,
    },
    hydraulics: {
      velocity: designResults.hydraulics?.velocity || 1.8,
      discharge: designResults.hydraulics?.discharge || 900,
    },
    loads: {
      deckDeadLoad: deckVolume * 25,
      wearingCoatLoad: input.totalLength * input.carriageWidth * 0.05 * 22,
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
  type: 'TYPE1' | 'C1'
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
  const phiRad = phi * Math.PI / 180;
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
  const basePressureMax = (totalWeight / area) * (1 + 6 * eccentricity / B);
  
  const status = (overturningFOS >= 1.5 && slidingFOS >= 1.5 && basePressureMax <= input.sbc) 
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
      concrete: (t * H * 10) + (B * input.abutmentDepth * 10),
      steel: (t * H * 10 * 80), // 80 kg/m³ typical
    },
  };
}

/**
 * Calculate detailed estimation with all items
 */
export function calculateDetailedEstimation(input: ProjectInput, designResults: any): DetailedEstimationResult {
  // Concrete quantities
  const pierConcrete = input.numberOfPiers * input.pierWidth * input.pierLength * input.pierDepth;
  const abutmentConcrete = 2 * input.abutmentWidth * input.abutmentHeight * 10;
  const footingConcrete = input.numberOfPiers * input.pierBaseWidth * input.pierBaseLength * 1.0 + 
                          2 * (input.abutmentWidth + 1.5) * input.abutmentDepth * 10;
  const deckConcrete = input.totalLength * input.carriageWidth * 0.25;
  
  const totalConcrete = pierConcrete + abutmentConcrete + footingConcrete + deckConcrete;
  
  // Steel quantities (kg)
  const pierSteel = pierConcrete * 80;
  const abutmentSteel = abutmentConcrete * 60;
  const footingSteel = footingConcrete * 50;
  const deckSteel = deckConcrete * 100;
  
  const totalSteel = pierSteel + abutmentSteel + footingSteel + deckSteel;
  
  // Formwork
  const formwork = (input.numberOfPiers * 2 * (input.pierWidth + input.pierLength) * input.pierDepth) +
                   (2 * 2 * (input.abutmentWidth + input.abutmentHeight) * 10);
  
  // Excavation
  // NOTE: keep excavation depth non-negative. Some templates have foundationLevel
  // above bedLevel by inputs noise; negative excavation makes BOQ invalid.
  const excavationDepth = Math.max(0, input.foundationLevel - input.bedLevel + 1);
  const excavation =
    input.numberOfPiers * input.pierBaseWidth * input.pierBaseLength * excavationDepth +
    2 * (input.abutmentWidth + 1.5) * 10 * excavationDepth;
  
  // Backfill
  const backfill = excavation * 0.4;
  
  // PCC Blinding
  const pccBlinding = (input.numberOfPiers * input.pierBaseWidth * input.pierBaseLength * 0.1) +
                      (2 * (input.abutmentWidth + 1.5) * 10 * 0.1);
  
  // Wearing coat
  const wearingCoat = input.totalLength * input.carriageWidth * 0.05;
  
  // Expansion joints (at abutments)
  const expansionJoints = 2 * input.carriageWidth;
  
  // Bearings (at piers)
  const bearings = input.numberOfPiers * 2;
  
  // Costs
  const concreteRate = input.concreteGrade === 'M25' ? 6500 : 
                      input.concreteGrade === 'M30' ? 7000 : 7500;
  const steelRate = input.steelGrade === 'Fe415' ? 65000 : 70000;
  
  const costs = {
    concrete: totalConcrete * concreteRate,
    steel: (totalSteel / 1000) * steelRate,
    formwork: formwork * 350,
    excavation: excavation * 250,
    backfill: backfill * 180,
    pccBlinding: pccBlinding * 5000,
    wearingCoat: wearingCoat * 8000,
    expansionJoints: expansionJoints * 5000,
    bearings: bearings * 25000,
    total: 0,
  };
  
  costs.total = Object.values(costs).reduce((a, b) => a + b, 0) - costs.total;
  
  // BOQ Items
  const boqItems: BOQItem[] = [
    { itemNo: '1', description: `Concrete ${input.concreteGrade}`, unit: 'm³', quantity: totalConcrete, rate: concreteRate, amount: costs.concrete },
    { itemNo: '2', description: `Steel ${input.steelGrade}`, unit: 'MT', quantity: totalSteel / 1000, rate: steelRate, amount: costs.steel },
    { itemNo: '3', description: 'Formwork', unit: 'm²', quantity: formwork, rate: 350, amount: costs.formwork },
    { itemNo: '4', description: 'Excavation', unit: 'm³', quantity: excavation, rate: 250, amount: costs.excavation },
    { itemNo: '5', description: 'Backfill', unit: 'm³', quantity: backfill, rate: 180, amount: costs.backfill },
    { itemNo: '6', description: 'PCC Blinding', unit: 'm³', quantity: pccBlinding, rate: 5000, amount: costs.pccBlinding },
    { itemNo: '7', description: 'Wearing Coat', unit: 'm³', quantity: wearingCoat, rate: 8000, amount: costs.wearingCoat },
    { itemNo: '8', description: 'Expansion Joints', unit: 'm', quantity: expansionJoints, rate: 5000, amount: costs.expansionJoints },
    { itemNo: '9', description: 'Bearings', unit: 'nos', quantity: bearings, rate: 25000, amount: costs.bearings },
    { itemNo: '10', description: 'TOTAL', unit: '', quantity: 0, rate: 0, amount: costs.total },
  ];
  
  return {
    quantities: {
      concrete: { m25: input.concreteGrade === 'M25' ? totalConcrete : 0, m30: input.concreteGrade === 'M30' ? totalConcrete : 0, m35: input.concreteGrade === 'M35' ? totalConcrete : 0 },
      steel: { fe415: input.steelGrade === 'Fe415' ? totalSteel / 1000 : 0, fe500: input.steelGrade === 'Fe500' ? totalSteel / 1000 : 0 },
      formwork,
      excavation: { ordinary: excavation, hardRock: 0 },
      backfill,
      pccBlinding,
      wearingCoat,
      expansionJoints,
      bearings,
    },
    costs,
    boqItems,
  };
}

/**
 * Calculate deck anchorage (submersible: uplift / buoyancy critical; high-level: typically not required when soffit is above DWL).
 */
export function calculateDeckAnchorage(input: ProjectInput, designResults: any): {
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
  const deckVolume = input.totalLength * input.carriageWidth * 0.25;
  const deckWeight = deckVolume * 25;
  const deckThk = input.deckSlabThickness ?? 0.25;
  const soffitLevel = input.deckSoffitLevel ?? (input.rtl - deckThk);
  const dwl = designResults.hydraulics?.designWaterLevel ?? input.hfl;

  if (input.bridgeType === 'high-level' && soffitLevel >= dwl - 0.05) {
    const wearingCoat = input.totalLength * input.carriageWidth * 0.05 * 22;
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

  const waterDepth = input.hfl - input.rtl + 0.25; // submersion depth
  
  // Buoyancy force (Archimedes)
  const submergedVolume = input.totalLength * input.carriageWidth * Math.min(waterDepth, 0.25);
  const buoyancy = submergedVolume * 9.81;
  
  // Hydrodynamic uplift (simplified)
  const velocity = designResults.hydraulics?.velocity || 1.8;
  const hydrodynamic = 0.5 * 1000 * velocity * velocity * input.carriageWidth * input.totalLength * 0.001;
  
  const totalUplift = buoyancy + hydrodynamic;
  
  // Resisting forces
  const wearingCoat = input.totalLength * input.carriageWidth * 0.05 * 22;
  const parapet = input.totalLength * 2 * 1.5;
  const friction = deckWeight * 0.6; // friction coefficient
  
  const totalResisting = deckWeight + wearingCoat + parapet + friction;
  
  const safetyFactor = totalResisting / totalUplift;
  const status = safetyFactor >= 1.2 ? 'SAFE' : 'UNSAFE';
  const anchorageRequired = status === 'UNSAFE' || waterDepth > 0.1;
  
  // Bolt recommendation
  const boltForce = anchorageRequired ? (totalUplift - totalResisting) * 1.5 : 0;
  const boltCapacity = 45.2; // 20mm grade 8.8 bolt capacity in kN
  const numberOfBolts = Math.ceil(boltForce / boltCapacity);
  
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
      number: Math.max(numberOfBolts, 4),
      grade: '8.8',
    },
  };
}

export {
  type AbutmentDesignInput,
  type DetailedEstimationResult,
  type DeckAnchorageInput,
  toAbutmentInput,
  toDeckAnchorageInput,
};
