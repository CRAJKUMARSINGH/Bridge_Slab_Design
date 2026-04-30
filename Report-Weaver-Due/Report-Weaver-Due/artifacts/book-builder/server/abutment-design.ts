/**
 * ABUTMENT DESIGN MODULE
 * IRC:78-1983 (Foundations & Substructure)
 * IRC:112-2015 (Concrete Bridge Design)
 */

import { z } from 'zod';

// Input Schema
export const AbutmentInputSchema = z.object({
  geometry: z.object({
    abutmentHeight: z.number().min(1).max(20), // meters
    dirtWallHeight: z.number().min(0).max(5),
    capWidth: z.number().min(0.5).max(3),
    capLength: z.number().min(5).max(30),
    footingLength: z.number().min(5).max(30),
    footingWidth: z.number().min(2).max(10),
    footingThickness: z.number().min(0.5).max(2),
  }),
  materials: z.object({
    concrete: z.enum(['M25', 'M30', 'M35']),
    steel: z.enum(['Fe415', 'Fe500']),
  }),
  soilProperties: z.object({
    phi: z.number().min(20).max(40), // degrees
    gamma: z.number().min(16).max(22), // kN/m³
    gammaSat: z.number().min(18).max(24), // kN/m³
    sbc: z.number().min(100).max(500), // kN/m²
    mu: z.number().min(0.4).max(0.7), // friction coefficient
  }),
  loads: z.object({
    deadLoad: z.number(), // kN
    liveLoad: z.number(), // kN
    soilSurcharge: z.number().min(0).max(20), // kN/m²
  }),
  waterLevels: z.object({
    hfl: z.number(),
    foundationLevel: z.number(),
  }),
});

export type AbutmentInput = z.infer<typeof AbutmentInputSchema>;

// Output Interface
export interface AbutmentDesignResult {
  // Earth Pressure Analysis
  earthPressure: {
    ka: number; // Active earth pressure coefficient
    kp: number; // Passive earth pressure coefficient
    activeForce: number; // kN
    passiveForce: number; // kN
    resultantLocation: number; // m from base
  };
  
  // Water Pressure
  waterPressure: {
    force: number; // kN
    location: number; // m from base
  };
  
  // Stability Analysis
  stability: {
    overturning: {
      resistingMoment: number; // kNm
      overturningMoment: number; // kNm
      fos: number;
      status: 'SAFE' | 'UNSAFE';
      minRequired: 1.5;
    };
    sliding: {
      resistingForce: number; // kN
      slidingForce: number; // kN
      fos: number;
      status: 'SAFE' | 'UNSAFE';
      minRequired: 1.5;
    };
    basePressure: {
      max: number; // kN/m²
      min: number; // kN/m²
      eccentricity: number; // m
      status: 'SAFE' | 'UNSAFE';
      allowable: number; // kN/m²
    };
  };
  
  // Reinforcement Design
  reinforcement: {
    abutmentBody: {
      vertical: {
        area: number; // mm²/m
        barDiameter: number; // mm
        spacing: number; // mm
        numberOfBars: number;
      };
      horizontal: {
        area: number; // mm²/m
        barDiameter: number; // mm
        spacing: number; // mm
      };
    };
    dirtWall: {
      mainSteel: {
        area: number; // mm²/m
        barDiameter: number; // mm
        spacing: number; // mm
      };
      distributionSteel: {
        area: number; // mm²/m
        barDiameter: number; // mm
        spacing: number; // mm
      };
    };
    footing: {
      mainSteel: {
        area: number; // mm²/m
        barDiameter: number; // mm
        spacing: number; // mm
      };
      distributionSteel: {
        area: number; // mm²/m
        barDiameter: number; // mm
        spacing: number; // mm
      };
    };
    abutmentCap: {
      mainSteel: {
        area: number; // mm²
        barDiameter: number; // mm
        numberOfBars: number;
      };
      stirrups: {
        diameter: number; // mm
        spacing: number; // mm
      };
    };
  };
  
  // Quantities
  quantities: {
    concrete: {
      abutment: number; // m³
      footing: number; // m³
      cap: number; // m³
      dirtWall: number; // m³
      total: number; // m³
    };
    steel: {
      abutment: number; // kg
      footing: number; // kg
      cap: number; // kg
      dirtWall: number; // kg
      total: number; // kg
    };
    formwork: number; // m²
    excavation: number; // m³
  };
}

/**
 * Main Abutment Design Function
 */
export function designAbutment(input: AbutmentInput): AbutmentDesignResult {
  // Material properties
  const fck = input.materials.concrete === 'M25' ? 25 : input.materials.concrete === 'M30' ? 30 : 35;
  const fy = input.materials.steel === 'Fe415' ? 415 : 500;
  
  // STEP 1: EARTH PRESSURE CALCULATION (Rankine's Theory)
  const phiRad = input.soilProperties.phi * (Math.PI / 180);
  const ka = Math.tan(Math.PI / 4 - phiRad / 2) ** 2;
  const kp = Math.tan(Math.PI / 4 + phiRad / 2) ** 2;
  
  // Active earth pressure
  const H = input.geometry.abutmentHeight;
  const activeForce = 0.5 * input.soilProperties.gamma * H * H * ka;
  const activeLocation = H / 3;
  
  // Passive earth pressure (in front of footing)
  const passiveForce = 0.5 * input.soilProperties.gamma * input.geometry.footingThickness * input.geometry.footingThickness * kp;
  
  // STEP 2: WATER PRESSURE CALCULATION
  const waterHeight = Math.max(0, input.waterLevels.hfl - input.waterLevels.foundationLevel);
  const waterForce = 0.5 * 9.81 * waterHeight * waterHeight; // γ_water = 9.81 kN/m³
  const waterLocation = waterHeight / 3;
  
  // STEP 3: STABILITY ANALYSIS
  
  // Total vertical loads
  const abutmentWeight = input.geometry.abutmentHeight * input.geometry.capWidth * 1 * 25; // 25 kN/m³ for concrete
  const footingWeight = input.geometry.footingLength * input.geometry.footingWidth * input.geometry.footingThickness * 25;
  const capWeight = input.geometry.capLength * input.geometry.capWidth * 0.8 * 25; // Assume 0.8m cap height
  const soilWeight = (input.geometry.footingLength - input.geometry.capWidth) * input.geometry.footingWidth * input.geometry.abutmentHeight * input.soilProperties.gamma;
  
  const totalVerticalLoad = abutmentWeight + footingWeight + capWeight + soilWeight + input.loads.deadLoad + input.loads.liveLoad;
  
  // Overturning check
  const resistingMoment = 
    abutmentWeight * (input.geometry.footingLength / 2) +
    footingWeight * (input.geometry.footingLength / 2) +
    capWeight * (input.geometry.footingLength / 2) +
    soilWeight * (input.geometry.capWidth + (input.geometry.footingLength - input.geometry.capWidth) / 2) +
    input.loads.deadLoad * (input.geometry.footingLength / 2) +
    input.loads.liveLoad * (input.geometry.footingLength / 2);
  
  const overturningMoment = activeForce * activeLocation + waterForce * waterLocation;
  const fosOverturning = resistingMoment / overturningMoment;
  
  // Sliding check
  const resistingForce = input.soilProperties.mu * totalVerticalLoad + passiveForce;
  const slidingForce = activeForce + waterForce;
  const fosSliding = resistingForce / slidingForce;
  
  // Base pressure check
  const netMoment = resistingMoment - overturningMoment;
  const eccentricity = (input.geometry.footingLength / 2) - (netMoment / totalVerticalLoad);
  
  const sigmaMax = (totalVerticalLoad / (input.geometry.footingLength * input.geometry.footingWidth)) * 
                   (1 + (6 * eccentricity / input.geometry.footingLength));
  const sigmaMin = (totalVerticalLoad / (input.geometry.footingLength * input.geometry.footingWidth)) * 
                   (1 - (6 * eccentricity / input.geometry.footingLength));
  
  // STEP 4: REINFORCEMENT DESIGN
  
  // Abutment body - vertical steel (minimum 0.3% of gross area)
  const abutmentArea = input.geometry.abutmentHeight * input.geometry.capWidth * 1000 * 1000; // mm²
  const minVerticalSteel = 0.003 * abutmentArea;
  const verticalBarDia = 16;
  const verticalBarArea = Math.PI * (verticalBarDia / 2) ** 2;
  const verticalSpacing = Math.floor((verticalBarArea * 1000) / minVerticalSteel);
  const numberOfVerticalBars = Math.floor(1000 / verticalSpacing);
  
  // Horizontal steel (0.2% of gross area)
  const minHorizontalSteel = 0.002 * abutmentArea;
  const horizontalBarDia = 12;
  const horizontalBarArea = Math.PI * (horizontalBarDia / 2) ** 2;
  const horizontalSpacing = Math.floor((horizontalBarArea * 1000) / minHorizontalSteel);
  
  // Dirt wall reinforcement (cantilever design)
  const dirtWallMoment = 0.5 * input.soilProperties.gamma * ka * input.geometry.dirtWallHeight ** 3 / 3;
  const dirtWallEffectiveDepth = 200 - 40; // Assume 200mm thick, 40mm cover
  const dirtWallMainSteel = (dirtWallMoment * 1e6) / (0.87 * fy * 0.9 * dirtWallEffectiveDepth);
  const dirtWallBarDia = 12;
  const dirtWallSpacing = Math.floor((Math.PI * (dirtWallBarDia / 2) ** 2 * 1000) / dirtWallMainSteel);
  
  // Distribution steel (0.12% of gross area)
  const dirtWallDistSteel = 0.0012 * 200 * 1000;
  const dirtWallDistBarDia = 10;
  const dirtWallDistSpacing = Math.floor((Math.PI * (dirtWallDistBarDia / 2) ** 2 * 1000) / dirtWallDistSteel);
  
  // Footing reinforcement
  const footingProjection = (input.geometry.footingLength - input.geometry.capWidth) / 2;
  const footingMoment = sigmaMax * footingProjection ** 2 / 2;
  const footingEffectiveDepth = input.geometry.footingThickness * 1000 - 75;
  const footingMainSteel = (footingMoment * 1e6) / (0.87 * fy * 0.9 * footingEffectiveDepth);
  const footingBarDia = 16;
  const footingSpacing = Math.floor((Math.PI * (footingBarDia / 2) ** 2 * 1000) / footingMainSteel);
  
  const footingDistSteel = 0.0012 * input.geometry.footingThickness * 1000 * 1000;
  const footingDistBarDia = 12;
  const footingDistSpacing = Math.floor((Math.PI * (footingDistBarDia / 2) ** 2 * 1000) / footingDistSteel);
  
  // Abutment cap reinforcement
  const capMoment = input.loads.liveLoad * input.geometry.capLength / 8; // Simply supported beam
  const capEffectiveDepth = 800 - 50; // Assume 800mm depth, 50mm cover
  const capMainSteel = (capMoment * 1e6) / (0.87 * fy * 0.9 * capEffectiveDepth);
  const capBarDia = 20;
  const capBarArea = Math.PI * (capBarDia / 2) ** 2;
  const capNumberOfBars = Math.ceil(capMainSteel / capBarArea);
  
  // Stirrups (0.4% of web area)
  const stirrupDia = 10;
  const stirrupSpacing = 150;
  
  // STEP 5: QUANTITY CALCULATIONS
  
  const concreteAbutment = input.geometry.abutmentHeight * input.geometry.capWidth * 1;
  const concreteFoot = input.geometry.footingLength * input.geometry.footingWidth * input.geometry.footingThickness;
  const concreteCap = input.geometry.capLength * input.geometry.capWidth * 0.8;
  const concreteDirtWall = input.geometry.dirtWallHeight * 0.2 * input.geometry.capLength;
  const concreteTotal = concreteAbutment + concreteFoot + concreteCap + concreteDirtWall;
  
  const steelDensity = 7850; // kg/m³
  const steelAbutment = (minVerticalSteel + minHorizontalSteel) * input.geometry.abutmentHeight * steelDensity / 1e9;
  const steelFooting = (footingMainSteel + footingDistSteel) * input.geometry.footingLength * steelDensity / 1e9;
  const steelCap = capMainSteel * input.geometry.capLength * steelDensity / 1e9;
  const steelDirtWall = (dirtWallMainSteel + dirtWallDistSteel) * input.geometry.capLength * steelDensity / 1e9;
  const steelTotal = steelAbutment + steelFooting + steelCap + steelDirtWall;
  
  const formwork = 2 * (input.geometry.abutmentHeight * 1 + input.geometry.abutmentHeight * input.geometry.capWidth) +
                   2 * (input.geometry.footingLength * input.geometry.footingThickness + input.geometry.footingWidth * input.geometry.footingThickness);
  
  const excavation = input.geometry.footingLength * input.geometry.footingWidth * (input.geometry.abutmentHeight + input.geometry.footingThickness);
  
  return {
    earthPressure: {
      ka,
      kp,
      activeForce,
      passiveForce,
      resultantLocation: activeLocation,
    },
    waterPressure: {
      force: waterForce,
      location: waterLocation,
    },
    stability: {
      overturning: {
        resistingMoment,
        overturningMoment,
        fos: fosOverturning,
        status: fosOverturning >= 1.5 ? 'SAFE' : 'UNSAFE',
        minRequired: 1.5,
      },
      sliding: {
        resistingForce,
        slidingForce,
        fos: fosSliding,
        status: fosSliding >= 1.5 ? 'SAFE' : 'UNSAFE',
        minRequired: 1.5,
      },
      basePressure: {
        max: sigmaMax,
        min: sigmaMin,
        eccentricity,
        status: sigmaMax <= input.soilProperties.sbc && sigmaMin >= 0 ? 'SAFE' : 'UNSAFE',
        allowable: input.soilProperties.sbc,
      },
    },
    reinforcement: {
      abutmentBody: {
        vertical: {
          area: minVerticalSteel,
          barDiameter: verticalBarDia,
          spacing: verticalSpacing,
          numberOfBars: numberOfVerticalBars,
        },
        horizontal: {
          area: minHorizontalSteel,
          barDiameter: horizontalBarDia,
          spacing: horizontalSpacing,
        },
      },
      dirtWall: {
        mainSteel: {
          area: dirtWallMainSteel,
          barDiameter: dirtWallBarDia,
          spacing: dirtWallSpacing,
        },
        distributionSteel: {
          area: dirtWallDistSteel,
          barDiameter: dirtWallDistBarDia,
          spacing: dirtWallDistSpacing,
        },
      },
      footing: {
        mainSteel: {
          area: footingMainSteel,
          barDiameter: footingBarDia,
          spacing: footingSpacing,
        },
        distributionSteel: {
          area: footingDistSteel,
          barDiameter: footingDistBarDia,
          spacing: footingDistSpacing,
        },
      },
      abutmentCap: {
        mainSteel: {
          area: capMainSteel,
          barDiameter: capBarDia,
          numberOfBars: capNumberOfBars,
        },
        stirrups: {
          diameter: stirrupDia,
          spacing: stirrupSpacing,
        },
      },
    },
    quantities: {
      concrete: {
        abutment: concreteAbutment,
        footing: concreteFoot,
        cap: concreteCap,
        dirtWall: concreteDirtWall,
        total: concreteTotal,
      },
      steel: {
        abutment: steelAbutment,
        footing: steelFooting,
        cap: steelCap,
        dirtWall: steelDirtWall,
        total: steelTotal,
      },
      formwork,
      excavation,
    },
  };
}
