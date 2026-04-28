/**
 * DECK ANCHORAGE MODULE
 * Prevents deck uplift during submersion
 * IRC:6-2017 (Loads & Stresses)
 */

import { z } from 'zod';

export const DeckAnchorageInputSchema = z.object({
  deckGeometry: z.object({
    length: z.number(),
    width: z.number(),
    thickness: z.number(), // m
    volume: z.number(), // m³
  }),
  waterLevels: z.object({
    hfl: z.number(), // m
    deckTopLevel: z.number(), // m
    deckBottomLevel: z.number(), // m
  }),
  hydraulics: z.object({
    velocity: z.number(), // m/s
    discharge: z.number(), // cumecs
  }),
  loads: z.object({
    deckDeadLoad: z.number(), // kN
    wearingCoatLoad: z.number(), // kN
    parapetLoad: z.number(), // kN
  }),
  materials: z.object({
    concrete: z.enum(['M25', 'M30', 'M35']),
    boltGrade: z.enum(['4.6', '8.8', '10.9']),
  }),
});

export type DeckAnchorageInput = z.infer<typeof DeckAnchorageInputSchema>;

export interface DeckAnchorageResult {
  // Uplift Forces
  upliftForces: {
    buoyancy: {
      force: number; // kN
      calculation: string;
    };
    hydrodynamic: {
      force: number; // kN
      calculation: string;
    };
    total: number; // kN
  };
  
  // Resisting Forces
  resistingForces: {
    deadLoad: number; // kN
    wearingCoat: number; // kN
    parapet: number; // kN
    friction: number; // kN
    total: number; // kN
  };
  
  // Net Uplift
  netUplift: {
    force: number; // kN
    requiresAnchorage: boolean;
  };
  
  // Anchorage Design
  anchorage: {
    required: boolean;
    design: {
      boltDiameter: number; // mm
      boltGrade: string;
      tensileStrength: number; // MPa
      allowableLoad: number; // kN per bolt
      numberOfBolts: number;
      spacing: number; // mm
      embedmentLength: number; // mm
      totalCapacity: number; // kN
    } | null;
  };
  
  // Safety Check
  safety: {
    fos: number;
    status: 'SAFE' | 'UNSAFE' | 'ANCHORAGE_REQUIRED';
    minRequired: 1.5;
  };
}

/**
 * Design Deck Anchorage
 */
export function designDeckAnchorage(input: DeckAnchorageInput): DeckAnchorageResult {
  // Constants
  const GAMMA_WATER = 9.81; // kN/m³
  const GAMMA_CONCRETE = 25; // kN/m³
  const MU_FRICTION = 0.4; // Friction coefficient
  
  // STEP 1: CALCULATE UPLIFT FORCES
  
  // Buoyancy force (Archimedes principle)
  const submergenceDepth = Math.max(0, input.waterLevels.hfl - input.waterLevels.deckBottomLevel);
  const submergedVolume = input.deckGeometry.volume * Math.min(1, submergenceDepth / input.deckGeometry.thickness);
  const buoyancyForce = GAMMA_WATER * submergedVolume;
  
  // Hydrodynamic uplift force (Bernoulli's equation)
  // F = 0.5 × ρ × v² × A × Cd
  const Cd = 1.2; // Drag coefficient for rectangular section
  const deckArea = input.deckGeometry.length * input.deckGeometry.width;
  const hydrodynamicForce = 0.5 * (GAMMA_WATER / 9.81) * input.hydraulics.velocity ** 2 * deckArea * Cd;
  
  const totalUplift = buoyancyForce + hydrodynamicForce;
  
  // STEP 2: CALCULATE RESISTING FORCES
  
  const deadLoad = input.loads.deckDeadLoad;
  const wearingCoat = input.loads.wearingCoatLoad;
  const parapet = input.loads.parapetLoad;
  const friction = MU_FRICTION * (deadLoad + wearingCoat + parapet);
  
  const totalResisting = deadLoad + wearingCoat + parapet + friction;
  
  // STEP 3: NET UPLIFT
  
  const netUplift = totalUplift - totalResisting;
  const requiresAnchorage = netUplift > 0;
  
  // STEP 4: ANCHORAGE DESIGN (if required)
  
  let anchorageDesign = null;
  
  if (requiresAnchorage) {
    // Bolt properties based on grade
    const boltGradeMap = {
      '4.6': { tensile: 400, yield: 240 },
      '8.8': { tensile: 800, yield: 640 },
      '10.9': { tensile: 1000, yield: 900 },
    };
    
    const boltGrade = input.materials.boltGrade;
    const tensileStrength = boltGradeMap[boltGrade].tensile;
    
    // Try different bolt diameters
    const boltDiameters = [16, 20, 24, 30, 36]; // mm
    let selectedDiameter = 20;
    let numberOfBolts = 0;
    let allowableLoad = 0;
    
    for (const dia of boltDiameters) {
      const boltArea = Math.PI * (dia / 2) ** 2; // mm²
      const ultimateLoad = (tensileStrength * boltArea) / 1000; // kN
      allowableLoad = ultimateLoad / 2.5; // FOS = 2.5 for bolts
      
      numberOfBolts = Math.ceil(netUplift / allowableLoad);
      
      // Check if spacing is reasonable (min 150mm, max 300mm)
      const spacing = input.deckGeometry.length * 1000 / numberOfBolts;
      
      if (spacing >= 150 && spacing <= 300) {
        selectedDiameter = dia;
        break;
      }
    }
    
    // Embedment length (15 × diameter minimum)
    const embedmentLength = 15 * selectedDiameter;
    
    // Spacing
    const spacing = input.deckGeometry.length * 1000 / numberOfBolts;
    
    // Total capacity
    const totalCapacity = numberOfBolts * allowableLoad;
    
    anchorageDesign = {
      boltDiameter: selectedDiameter,
      boltGrade,
      tensileStrength,
      allowableLoad,
      numberOfBolts,
      spacing: Math.round(spacing),
      embedmentLength,
      totalCapacity,
    };
  }
  
  // STEP 5: SAFETY CHECK
  
  let fos: number;
  let status: 'SAFE' | 'UNSAFE' | 'ANCHORAGE_REQUIRED';
  
  if (!requiresAnchorage) {
    fos = totalResisting / totalUplift;
    status = fos >= 1.5 ? 'SAFE' : 'UNSAFE';
  } else {
    if (anchorageDesign) {
      fos = (totalResisting + anchorageDesign.totalCapacity) / totalUplift;
      status = fos >= 1.5 ? 'SAFE' : 'ANCHORAGE_REQUIRED';
    } else {
      fos = 0;
      status = 'UNSAFE';
    }
  }
  
  return {
    upliftForces: {
      buoyancy: {
        force: buoyancyForce,
        calculation: `γ_water × V_submerged = ${GAMMA_WATER} × ${submergedVolume.toFixed(2)} = ${buoyancyForce.toFixed(2)} kN`,
      },
      hydrodynamic: {
        force: hydrodynamicForce,
        calculation: `0.5 × ρ × v² × A × Cd = 0.5 × ${(GAMMA_WATER / 9.81).toFixed(2)} × ${input.hydraulics.velocity}² × ${deckArea.toFixed(2)} × ${Cd} = ${hydrodynamicForce.toFixed(2)} kN`,
      },
      total: totalUplift,
    },
    resistingForces: {
      deadLoad,
      wearingCoat,
      parapet,
      friction,
      total: totalResisting,
    },
    netUplift: {
      force: netUplift,
      requiresAnchorage,
    },
    anchorage: {
      required: requiresAnchorage,
      design: anchorageDesign,
    },
    safety: {
      fos,
      status,
      minRequired: 1.5,
    },
  };
}
