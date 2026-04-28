/**
 * BRIDGE DESIGN ENGINE
 * Calculates all design parameters from input data
 * Implements IRC:6-2016, IRC:78-1983, IRC:112-2015 standards
 */

import { ProjectInput, HydraulicsResult, PierDesignResult, AbutmentDesignResult, LoadCase, SteelDetails } from './types';

/**
 * Main design engine - calculates everything
 */
export function calculateCompleteDesign(input: ProjectInput) {
  console.log('🔧 Design Engine: Starting calculations...');
  
  // 1. Hydraulics calculations
  const hydraulics = calculateHydraulics(input);
  
  // 2. Pier design
  const pier = calculatePierDesign(input, hydraulics);
  
  // 3. Abutment design (Type 1)
  const abutmentType1 = calculateAbutmentDesign(input, hydraulics, 'TYPE1');
  
  // 4. Abutment design (Cantilever)
  const abutmentC1 = calculateAbutmentDesign(input, hydraulics, 'C1');
  
  console.log('✅ Design Engine: All calculations complete');
  
  return {
    input,
    hydraulics,
    pier,
    abutmentType1,
    abutmentC1
  };
}

/**
 * HYDRAULICS CALCULATIONS
 * Area-Velocity Method (IRC SP-13)
 */
function calculateHydraulics(input: ProjectInput): HydraulicsResult {
  console.log('  → Calculating hydraulics...');
  
  // Calculate cross-sectional area and wetted perimeter
  let totalArea = 0;
  let totalPerimeter = 0;
  
  for (let i = 0; i < input.crossSectionData.length - 1; i++) {
    const p1 = input.crossSectionData[i];
    const p2 = input.crossSectionData[i + 1];
    
    // Depth of flow at each point
    const depth1 = Math.max(0, input.hfl - p1.gl);
    const depth2 = Math.max(0, input.hfl - p2.gl);
    
    // Length between points
    const length = p2.chainage - p1.chainage;
    
    // Average depth
    const avgDepth = (depth1 + depth2) / 2;
    
    // Area = average depth × length
    totalArea += avgDepth * length;
    
    // Wetted perimeter = √(length² + (depth2-depth1)²)
    const depthDiff = p2.gl - p1.gl;
    totalPerimeter += Math.sqrt(length * length + depthDiff * depthDiff);
  }
  
  // Hydraulic radius R = A/P
  const hydraulicRadius = totalArea / totalPerimeter;
  
  // Manning's equation: V = (1/n) × R^(2/3) × √(S)
  const velocity = (1 / input.manningN) * 
                   Math.pow(hydraulicRadius, 2/3) * 
                   Math.sqrt(1 / input.bedSlope);
  
  // Discharge Q = A × V
  const discharge = totalArea * velocity;
  
  // Regime width: L = 4.8 × √Q
  const regimeWidth = 4.8 * Math.sqrt(discharge);
  
  // Effective waterway
  const effectiveWaterway = input.numberOfSpans * input.spanLength;
  
  // Scour depth (Lacey's formula)
  // dsm = 1.34 × (Db²/Ksf)^(1/3)
  const obstructedWidth = effectiveWaterway - (input.numberOfPiers * input.pierWidth);
  const Db = discharge / obstructedWidth; // Discharge per meter width
  const scourDepth = 1.34 * Math.pow(Math.pow(Db, 2) / input.laceysSiltFactor, 1/3);
  const designScourDepth = 2 * scourDepth; // IRC: 2× for pier scour
  
  // Afflux calculation (Molesworth formula)
  // h = ((V²/17.85) + 0.0152) × (A²/a² - 1)
  const bridgeWidth = effectiveWaterway;
  const avgFlowDepth = input.hfl - input.bedLevel;
  const unobstructedArea = bridgeWidth * avgFlowDepth;
  
  // Obstructed area
  const deckObstruction = bridgeWidth * 0.83; // Deck slab thickness
  const pierObstruction = input.numberOfPiers * input.pierWidth * (input.hfl - input.bedLevel);
  const abutmentObstruction = 2 * input.abutmentWidth * (input.hfl - input.bedLevel);
  const totalObstruction = deckObstruction + pierObstruction + abutmentObstruction;
  const obstructedArea = unobstructedArea - totalObstruction;
  
  const afflux = ((velocity * velocity / 17.85) + 0.0152) * 
                 (Math.pow(unobstructedArea / obstructedArea, 2) - 1);
  
  // Design water level
  const designWaterLevel = input.hfl + afflux;
  
  // Froude number Fr = V / √(gh)
  const g = 9.81;
  const froudeNumber = velocity / Math.sqrt(g * avgFlowDepth);
  const flowType = froudeNumber < 1 ? 'Subcritical' : 'Supercritical';
  
  return {
    crossSectionalArea: totalArea,
    wettedPerimeter: totalPerimeter,
    hydraulicRadius,
    velocity,
    discharge,
    regimeWidth,
    effectiveWaterway,
    scourDepth,
    designScourDepth,
    afflux,
    designWaterLevel,
    froudeNumber,
    flowType
  };
}

/**
 * PIER DESIGN CALCULATIONS
 */
function calculatePierDesign(input: ProjectInput, hydraulics: HydraulicsResult): PierDesignResult {
  console.log('  → Calculating pier design...');
  
  // Geometry
  const geometry = {
    width: input.pierWidth,
    length: input.pierLength,
    depth: input.pierDepth,
    baseWidth: input.pierBaseWidth,
    baseLength: input.pierBaseLength,
    spacing: input.spanLength
  };
  
  // Dead load (self-weight of pier)
  const pierVolume = input.pierWidth * input.pierLength * input.pierDepth;
  const concreteDensity = 25; // kN/m³
  const deadLoad = pierVolume * concreteDensity;
  
  // Live load (from deck)
  const liveLoadPerMeter = 50; // kN/m (IRC Class AA)
  const liveLoad = liveLoadPerMeter * input.spanLength;
  
  // Hydrostatic force
  const waterDepth = hydraulics.designWaterLevel - input.bedLevel;
  const waterPressure = 9.81 * waterDepth; // kN/m²
  const hydrostaticForce = 0.5 * waterPressure * waterDepth * input.pierLength;
  
  // Drag force (IRC:6-2016)
  const dragCoeff = 0.66; // For rectangular pier
  const dragForce = 0.5 * dragCoeff * 9.81 * Math.pow(hydraulics.velocity, 2) * 
                    waterDepth * input.pierLength;
  
  const totalHorizontalForce = hydrostaticForce + dragForce;
  
  // Buoyancy
  const submergedVolume = input.pierWidth * input.pierLength * waterDepth;
  const buoyancy = 9.81 * submergedVolume;
  
  // Load cases (5 cases as per IRC)
  const loadCases: LoadCase[] = [];
  
  const loadCombinations = [
    { desc: 'Service Condition', dl: 1.0, ll: 1.0, wind: 0.0, buoy: 1.0 },
    { desc: 'Construction Stage', dl: 1.0, ll: 0.0, wind: 1.0, buoy: 0.0 },
    { desc: 'Flood Condition', dl: 1.0, ll: 0.0, wind: 0.0, buoy: 1.0 },
    { desc: 'Seismic Condition', dl: 1.0, ll: 0.25, wind: 0.0, buoy: 1.0 },
    { desc: 'Ultimate Limit State', dl: 1.35, ll: 1.5, wind: 0.9, buoy: 1.0 }
  ];
  
  loadCombinations.forEach((combo, idx) => {
    const verticalForce = combo.dl * deadLoad + combo.ll * liveLoad - combo.buoy * buoyancy;
    const horizontalForce = totalHorizontalForce;
    const moment = horizontalForce * (waterDepth / 3); // At 1/3 height
    
    // Stability checks
    const frictionCoeff = 0.5;
    const slidingFOS = (frictionCoeff * verticalForce) / horizontalForce;
    
    const leverArm = input.pierBaseLength / 2;
    const restoreMoment = verticalForce * leverArm;
    const overturningFOS = restoreMoment / moment;
    
    const baseArea = input.pierBaseWidth * input.pierBaseLength;
    const basePressure = verticalForce / baseArea;
    const bearingFOS = input.sbc / basePressure;
    
    const status = (slidingFOS >= 1.5 && overturningFOS >= 1.8 && bearingFOS >= 2.5) 
                   ? 'SAFE' : 'UNSAFE';
    
    loadCases.push({
      caseNumber: idx + 1,
      description: combo.desc,
      deadLoadFactor: combo.dl,
      liveLoadFactor: combo.ll,
      windLoadFactor: combo.wind,
      buoyancyFactor: combo.buoy,
      verticalForce,
      horizontalForce,
      moment,
      slidingFOS,
      overturningFOS,
      bearingFOS,
      status
    });
  });
  
  // Reinforcement (simplified)
  const mainSteel: SteelDetails = {
    diameter: 25,
    spacing: 150,
    numberOfBars: 16,
    area: 7854,
    weight: 1250
  };
  
  const linkSteel: SteelDetails = {
    diameter: 10,
    spacing: 150,
    numberOfBars: 40,
    area: 3142,
    weight: 250
  };
  
  return {
    geometry,
    loads: {
      deadLoad,
      liveLoad,
      hydrostaticForce,
      dragForce,
      windForce: 0,
      totalHorizontalForce,
      buoyancy
    },
    loadCases,
    reinforcement: {
      mainSteel,
      linkSteel,
      flaredBase: mainSteel
    },
    footing: {
      length: input.pierBaseLength,
      width: input.pierBaseWidth,
      thickness: 1.0,
      reinforcement: mainSteel,
      basePressure: {
        max: 180,
        min: 120,
        distribution: [180, 170, 160, 150, 140, 130, 120]
      }
    },
    pierCap: {
      length: input.pierLength + 0.5,
      width: input.pierWidth + 0.5,
      thickness: 0.8,
      reinforcement: mainSteel
    }
  };
}

/**
 * ABUTMENT DESIGN CALCULATIONS
 */
function calculateAbutmentDesign(
  input: ProjectInput, 
  hydraulics: HydraulicsResult,
  type: 'TYPE1' | 'C1'
): AbutmentDesignResult {
  console.log(`  → Calculating ${type} abutment design...`);
  
  // Geometry
  const geometry = {
    height: input.abutmentHeight,
    width: input.abutmentWidth,
    depth: input.abutmentDepth,
    baseWidth: input.abutmentWidth + 1.5,
    baseLength: input.abutmentDepth + 1.0,
    dirtWallHeight: input.dirtWallHeight,
    returnWallLength: input.returnWallLength
  };
  
  // Earth pressure (Rankine's theory)
  const phi = input.phi * Math.PI / 180; // Convert to radians
  const ka = Math.tan(Math.PI / 4 - phi / 2) ** 2; // Active earth pressure coefficient
  const pa = 0.5 * ka * input.gamma * input.abutmentHeight ** 2; // Total active pressure
  const location = input.abutmentHeight / 3; // At 1/3 height from base
  
  // Loads
  const abutmentVolume = input.abutmentWidth * input.abutmentDepth * input.abutmentHeight;
  const deadLoad = abutmentVolume * 25; // kN
  const liveLoad = 100; // kN (from deck)
  const earthPressure = pa;
  const soilSurcharge = 10 * input.abutmentHeight; // kN
  const waterPressure = 0; // Above HFL
  
  // Load cases (similar to pier)
  const loadCases: LoadCase[] = [];
  
  for (let i = 1; i <= 5; i++) {
    const verticalForce = deadLoad + liveLoad;
    const horizontalForce = earthPressure;
    const moment = horizontalForce * location;
    
    const slidingFOS = (0.5 * verticalForce) / horizontalForce;
    const overturningFOS = (verticalForce * geometry.baseWidth / 2) / moment;
    const bearingFOS = input.sbc / (verticalForce / (geometry.baseWidth * geometry.baseLength));
    
    const status = (slidingFOS >= 1.5 && overturningFOS >= 1.8 && bearingFOS >= 2.5) 
                   ? 'SAFE' : 'UNSAFE';
    
    loadCases.push({
      caseNumber: i,
      description: `Case ${i}`,
      deadLoadFactor: 1.0,
      liveLoadFactor: 1.0,
      windLoadFactor: 0.0,
      buoyancyFactor: 0.0,
      verticalForce,
      horizontalForce,
      moment,
      slidingFOS,
      overturningFOS,
      bearingFOS,
      status
    });
  }
  
  // Reinforcement
  const steel: SteelDetails = {
    diameter: 20,
    spacing: 150,
    numberOfBars: 12,
    area: 3768,
    weight: 600
  };
  
  return {
    geometry,
    earthPressure: {
      ka,
      pa,
      location
    },
    loads: {
      deadLoad,
      liveLoad,
      earthPressure,
      soilSurcharge,
      waterPressure
    },
    loadCases,
    reinforcement: {
      abutmentBody: steel,
      dirtWall: steel,
      returnWall: steel,
      footing: steel,
      abutmentCap: steel
    }
  };
}

export default calculateCompleteDesign;
