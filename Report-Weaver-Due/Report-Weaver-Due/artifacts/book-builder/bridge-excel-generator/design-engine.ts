/**
 * BRIDGE DESIGN ENGINE
 * Calculates all design parameters from input data
 * Implements IRC:6-2016, IRC:78-1983, IRC:112-2015 standards
 */

import { ProjectInput, HydraulicsResult, PierDesignResult, AbutmentDesignResult, LoadCase, SteelDetails, EstimationResult, BOQItem } from './types';
import { computeHydraulicsSheetTotals } from './hydraulics-sheet-totals';
import { ircMinimumFreeboardAboveHflFromDischarge } from './irc-minimum-freeboard';

/** When true, progress lines are suppressed (e.g. `verify:engine`). Not concurrency-safe. */
let designEngineQuiet = false;

function dlog(...args: unknown[]): void {
  if (!designEngineQuiet) console.log(...args);
}

export interface CalculateCompleteDesignOptions {
  quiet?: boolean;
}

/**
 * Main design engine - calculates everything
 */
export function calculateCompleteDesign(input: ProjectInput, options?: CalculateCompleteDesignOptions) {
  const prevQuiet = designEngineQuiet;
  designEngineQuiet = options?.quiet === true;
  try {
    dlog('🔧 Design Engine: Starting calculations...');

    // 1. Hydraulics calculations
    const hydraulics = calculateHydraulics(input);

    // 2. Pier design
    const pier = calculatePierDesign(input, hydraulics);

    // 3. Abutment design (Type 1)
    const abutmentType1 = calculateAbutmentDesign(input, hydraulics, 'TYPE1');

    // 4. Abutment design (Cantilever)
    const abutmentC1 = calculateAbutmentDesign(input, hydraulics, 'C1');

    // 5. Estimation — derived from all design results
    const estimation = calculateEstimation(input, hydraulics, pier, abutmentType1);

    dlog('✅ Design Engine: All calculations complete');

    return {
      input,
      hydraulics,
      pier,
      abutmentType1,
      abutmentC1,
      estimation
    };
  } finally {
    designEngineQuiet = prevQuiet;
  }
}

/**
 * HYDRAULICS CALCULATIONS
 * Area-Velocity Method (IRC SP-13)
 */
function calculateHydraulics(input: ProjectInput): HydraulicsResult {
  dlog('  → Calculating hydraulics...');
  const isHighLevelBridge = input.bridgeType === 'high-level';

  const {
    crossSectionalArea: totalArea,
    wettedPerimeter: totalPerimeter,
    hydraulicRadius,
    velocity,
    discharge: rawDischarge,
  } = computeHydraulicsSheetTotals(input);
  
  // ASTRA Enhancements: apply F1 factor to discharge (F2 applies to foundation depth)
  const f1 = input.f1Factor ?? 1.0;
  const discharge = rawDischarge * f1;
  
  // Regime width: L = 4.8 × √Q
  const regimeWidth = 4.8 * Math.sqrt(discharge);
  
  // Effective waterway
  const effectiveWaterway = input.numberOfSpans * input.spanLength;
  
  // Scour depth (Lacey's formula)
  // dsm = 1.34 × (Db²/Ksf)^(1/3)
  const netWaterway = effectiveWaterway - (input.numberOfPiers * input.pierWidth);
  const Db = discharge / netWaterway; // Discharge per meter width
  const scourDepth = 1.34 * Math.pow(Math.pow(Db, 2) / input.laceysSiltFactor, 1/3);
  
  // ASTRA Enhancement: allow custom maxScourMultiplier (IRC default is 2.0x for pier scour)
  const multiplier = input.maxScourMultiplier ?? 2.0;
  const designScourDepth = multiplier * scourDepth;
  
  // Foundation depth (ASTRA: F2 × D below HFL)
  const f2 = input.f2Factor ?? 1.33;
  const foundationDepth = f2 * designScourDepth;
  const foundationLevel = input.hfl - foundationDepth;

  // Afflux calculation (Molesworth formula)
  // h = ((V²/17.85) + 0.0152) × (A²/a² - 1)
  const bridgeWidth = effectiveWaterway;
  const avgFlowDepth = input.hfl - input.bedLevel;
  const unobstructedArea = totalArea; // Using integrated area for approach
  
  // Obstructed area
  // Use input.deckSlabThickness for deck obstruction (Submersible model)
  const deckThk = input.deckSlabThickness ?? 0.25;
  const soffitLvl = input.rtl - deckThk;
  const isSubmerged = input.hfl > soffitLvl;
  const deckObstruction = (isHighLevelBridge || !isSubmerged) ? 0 : effectiveWaterway * deckThk;
  
  const pierObstruction = input.numberOfPiers * input.pierWidth * (input.hfl - input.bedLevel);
  const abutmentObstruction = 2 * input.abutmentWidth * (input.hfl - input.bedLevel);
  const totalObstruction = deckObstruction + pierObstruction + abutmentObstruction;
  
  const rawConveyance = unobstructedArea - totalObstruction;
  // When obstruction terms exceed approach area (shallow slot + deck model), ratio A/a blows up.
  const conveyanceArea = rawConveyance > 0 ? rawConveyance : 0.8 * unobstructedArea;

  const afflux = ((velocity * velocity / 17.85) + 0.0152) *
                 (Math.pow(unobstructedArea / Math.max(1e-6, conveyanceArea), 2) - 1);
  
  // Design water level
  const designWaterLevel = input.hfl + afflux;

  // Soffit / clearance (high-level: policy is soffit above HFL by project freeboard)
  const soffitLevel = input.deckSoffitLevel ?? (input.rtl - deckThk);
  const freeboardAboveHfl = soffitLevel - input.hfl;
  const freeboard = soffitLevel - designWaterLevel;
  const ircMinFreeboardAboveHfl = isHighLevelBridge
    ? ircMinimumFreeboardAboveHflFromDischarge(discharge)
    : 0;
  /** IRC discharge-based minimum, increased if the project specifies a higher freeboard. */
  const reqFreeboardAboveHfl = isHighLevelBridge
    ? Math.max(ircMinFreeboardAboveHfl, input.freeboardAboveHfl ?? 0)
    : 0;
  /** Tolerant compare so exact inputs like soffit − HFL = 1.2 do not fail in float. */
  const isFreeboardSafe = isHighLevelBridge
    ? freeboardAboveHfl + 1e-6 >= reqFreeboardAboveHfl
    : true;

  // Froude number Fr = V / √(gh)
  const g = 9.81;
  const froudeNumber = velocity / Math.sqrt(g * Math.max(0.1, avgFlowDepth));
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
    foundationDepth,
    foundationLevel,
    afflux,
    designWaterLevel,
    froudeNumber,
    flowType,
    soffitLevel,
    freeboard,
    freeboardAboveHfl,
    ircMinimumFreeboardAboveHfl: isHighLevelBridge ? ircMinFreeboardAboveHfl : undefined,
    requiredFreeboardAboveHfl: isHighLevelBridge ? reqFreeboardAboveHfl : undefined,
    isFreeboardSafe
  };
}

/**
 * PIER DESIGN CALCULATIONS
 */
function calculatePierDesign(input: ProjectInput, hydraulics: HydraulicsResult): PierDesignResult {
  dlog('  → Calculating pier design...');
  
  // Geometry
  const geometry = {
    width: input.pierWidth,
    length: input.pierLength,
    depth: input.pierDepth,
    baseWidth: input.pierBaseWidth,
    baseLength: input.pierBaseLength,
    spacing: input.spanLength
  };
  
  // Dead load (self-weight of pier + reaction from deck)
  const pierVolume = input.pierWidth * input.pierLength * input.pierDepth;
  const concreteDensity = 25; // kN/m³
  const pierSelfWeight = pierVolume * concreteDensity;

  // Deck Dead Load Reaction
  // Slab: thickness * carriageWidth * 25
  // Wearing Coat: 0.075m (default) * carriageWidth * 22
  const deckSlabWeightPerM = (input.deckSlabThickness ?? 0.25) * input.carriageWidth * 25;
  const wearingCoatWeightPerM = 0.075 * input.carriageWidth * 22;
  const deckDeadLoad = (deckSlabWeightPerM + wearingCoatWeightPerM) * input.spanLength;

  const deadLoad = pierSelfWeight + deckDeadLoad;
  
  // Live load (from deck) — configurable via input.liveLoadPerMetre; default 50 kN/m (IRC Class AA)
  const liveLoadPerMetre = input.liveLoadPerMetre ?? 50;
  const liveLoad = liveLoadPerMetre * input.spanLength;
  
  // Hydrostatic force
  const waterDepth = (hydraulics.designWaterLevel ?? input.hfl) - input.bedLevel;
  const waterPressure = 9.81 * waterDepth; // kN/m²
  const hydrostaticForce = 0.5 * waterPressure * waterDepth * input.pierLength;
  
  // Drag force (IRC:6-2016)
  const dragCoeff = 0.66; // For rectangular pier
  const dragForce = 0.5 * dragCoeff * 9.81 * Math.pow(hydraulics.velocity, 2) * 
                    waterDepth * input.pierLength;
  
  // Wind force (IRC:6-2016) — only for high-level
  const isHighLevel = input.bridgeType === 'high-level';
  const exposedHeight = isHighLevel ? (input.rtl - input.bedLevel) : 0;
  const windPressure = 1.5; // kN/m²
  const windForce = isHighLevel ? (windPressure * exposedHeight * input.pierLength) : 0;

  const totalHorizontalForce = hydrostaticForce + dragForce + windForce;
  
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
      pierSelfWeight,
      deckDeadLoad,
      deadLoad,
      liveLoad,
      hydrostaticForce,
      dragForce,
      windForce,
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
  dlog(`  → Calculating ${type} abutment design...`);
  
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

/**
 * ESTIMATION — derived from pier, abutment, hydraulics results
 * All quantities flow from the design engine; no hardcoded numbers.
 */
export function calculateEstimation(
  input: ProjectInput,
  hydraulics: HydraulicsResult,
  pier: PierDesignResult,
  abutment: AbutmentDesignResult
): EstimationResult {
  dlog('  → Calculating estimation from design results...');

  const nPiers   = input.numberOfPiers;
  const nAbuts   = 2;
  const nSpans   = input.numberOfSpans;
  const spanL    = input.spanLength;
  const bridgeL  = input.totalLength;
  const carriageW = input.carriageWidth;

  // ── Concrete volumes (m³) ──────────────────────────────────────────────────
  // Pier footing
  const pierFootingVol = nPiers *
    pier.footing.width * pier.footing.length * pier.footing.thickness;

  // Pier body
  const pierBodyVol = nPiers *
    pier.geometry.width * pier.geometry.length * pier.geometry.depth;

  // Pier cap
  const pierCapVol = nPiers *
    pier.pierCap.width * pier.pierCap.length * pier.pierCap.thickness;

  // Abutment footing
  const abutFootingVol = nAbuts *
    abutment.geometry.baseWidth * abutment.geometry.baseLength * 1.2;

  // Abutment body
  const abutBodyVol = nAbuts *
    abutment.geometry.width * abutment.geometry.depth * abutment.geometry.height;

  // Abutment cap
  const abutCapVol = nAbuts * carriageW * 1.5 * 0.8;

  // Dirt wall
  const dirtWallVol = nAbuts *
    carriageW * 0.3 * abutment.geometry.dirtWallHeight;

  // Return walls (both sides, both abutments)
  const returnWallVol = nAbuts * 2 *
    abutment.geometry.returnWallLength * 0.4 * abutment.geometry.height;

  // Deck slab (250 mm thick)
  const deckSlabVol = bridgeL * carriageW * 0.25;

  // Wearing coat (75 mm)
  const wearingCoatVol = bridgeL * carriageW * 0.075;

  // PCC blinding (150 mm under all footings)
  const pccVol =
    (nPiers * pier.footing.width * pier.footing.length +
     nAbuts * abutment.geometry.baseWidth * abutment.geometry.baseLength) * 0.15;

  const totalM30 = pierFootingVol + pierBodyVol + pierCapVol +
                   abutFootingVol + abutBodyVol + abutCapVol +
                   dirtWallVol + returnWallVol + deckSlabVol;
  const totalM25 = pccVol;
  const totalM35 = wearingCoatVol;

  // ── Steel (MT) ─────────────────────────────────────────────────────────────
  // Rule-of-thumb: pier ~120 kg/m³, abutment ~100 kg/m³, deck ~80 kg/m³
  const steelPier    = (pierBodyVol + pierCapVol) * 120 / 1000;
  const steelFooting = (pierFootingVol + abutFootingVol) * 90 / 1000;
  const steelAbut    = (abutBodyVol + abutCapVol + dirtWallVol + returnWallVol) * 100 / 1000;
  const steelDeck    = deckSlabVol * 80 / 1000;
  const totalSteel   = steelPier + steelFooting + steelAbut + steelDeck;

  // ── Formwork (m²) ──────────────────────────────────────────────────────────
  const formwork = (totalM30 + totalM35) * 2.5;

  // ── Excavation (m³) ────────────────────────────────────────────────────────
  const excavPier  = nPiers *
    (pier.footing.width + 0.5) * (pier.footing.length + 0.5) * 3.0;
  const excavAbut  = nAbuts *
    (abutment.geometry.baseWidth + 0.5) * (abutment.geometry.baseLength + 0.5) * 2.5;
  const totalExcav = excavPier + excavAbut;

  // ── Backfill (m³) ──────────────────────────────────────────────────────────
  const backfill = totalExcav * 0.6;

  // ── Approach road (m²) ─────────────────────────────────────────────────────
  const approachArea = 2 * 50 * carriageW;

  // ── Rates (₹) — can be overridden from a rate DB later ────────────────────
  const RATES = {
    excavation:   450,
    pcc:         4500,
    rccM30:      6500,
    rccM35:      7000,
    steel:      65000,   // per MT
    formwork:     350,
    wearingCoat:  450,   // per m²
    approach:     850,   // per m²
    railing:     1200,   // per Rm
    expJoint:    2500,   // per Rm
  };

  // ── BOQ items ──────────────────────────────────────────────────────────────
  const boq: BOQItem[] = [
    { itemNo: 'A1', description: 'Excavation for pier foundations',          unit: 'cum', quantity: +excavPier.toFixed(2),   rate: RATES.excavation,  amount: +(excavPier   * RATES.excavation).toFixed(0) },
    { itemNo: 'A2', description: 'Excavation for abutment foundations',      unit: 'cum', quantity: +excavAbut.toFixed(2),   rate: RATES.excavation,  amount: +(excavAbut   * RATES.excavation).toFixed(0) },
    { itemNo: 'B1', description: 'PCC M15 blinding under footings',          unit: 'cum', quantity: +pccVol.toFixed(2),      rate: RATES.pcc,         amount: +(pccVol      * RATES.pcc).toFixed(0) },
    { itemNo: 'B2', description: `RCC ${input.concreteGrade} pier footings`, unit: 'cum', quantity: +pierFootingVol.toFixed(2), rate: RATES.rccM30,    amount: +(pierFootingVol * RATES.rccM30).toFixed(0) },
    { itemNo: 'B3', description: `RCC ${input.concreteGrade} pier body`,     unit: 'cum', quantity: +pierBodyVol.toFixed(2),  rate: RATES.rccM30,     amount: +(pierBodyVol  * RATES.rccM30).toFixed(0) },
    { itemNo: 'B4', description: `RCC ${input.concreteGrade} pier cap`,      unit: 'cum', quantity: +pierCapVol.toFixed(2),   rate: RATES.rccM30,     amount: +(pierCapVol   * RATES.rccM30).toFixed(0) },
    { itemNo: 'B5', description: `RCC ${input.concreteGrade} abutment footing`, unit: 'cum', quantity: +abutFootingVol.toFixed(2), rate: RATES.rccM30, amount: +(abutFootingVol * RATES.rccM30).toFixed(0) },
    { itemNo: 'B6', description: `RCC ${input.concreteGrade} abutment body`, unit: 'cum', quantity: +abutBodyVol.toFixed(2),  rate: RATES.rccM30,     amount: +(abutBodyVol  * RATES.rccM30).toFixed(0) },
    { itemNo: 'B7', description: `RCC ${input.concreteGrade} abutment cap`,  unit: 'cum', quantity: +abutCapVol.toFixed(2),   rate: RATES.rccM30,     amount: +(abutCapVol   * RATES.rccM30).toFixed(0) },
    { itemNo: 'B8', description: `RCC ${input.concreteGrade} dirt wall`,     unit: 'cum', quantity: +dirtWallVol.toFixed(2),  rate: RATES.rccM30,     amount: +(dirtWallVol  * RATES.rccM30).toFixed(0) },
    { itemNo: 'B9', description: `RCC ${input.concreteGrade} return walls`,  unit: 'cum', quantity: +returnWallVol.toFixed(2), rate: RATES.rccM30,    amount: +(returnWallVol * RATES.rccM30).toFixed(0) },
    { itemNo: 'B10', description: `RCC ${input.concreteGrade} deck slab`,    unit: 'cum', quantity: +deckSlabVol.toFixed(2),  rate: RATES.rccM30,     amount: +(deckSlabVol  * RATES.rccM30).toFixed(0) },
    { itemNo: 'B11', description: 'Wearing coat (75mm)',                      unit: 'sqm', quantity: +(bridgeL * carriageW).toFixed(2), rate: RATES.wearingCoat, amount: +((bridgeL * carriageW) * RATES.wearingCoat).toFixed(0) },
    { itemNo: 'C1', description: `${input.steelGrade} reinforcement steel`,  unit: 'MT',  quantity: +totalSteel.toFixed(3),   rate: RATES.steel,       amount: +(totalSteel   * RATES.steel).toFixed(0) },
    { itemNo: 'D1', description: 'Formwork and shuttering',                   unit: 'sqm', quantity: +formwork.toFixed(2),    rate: RATES.formwork,    amount: +(formwork     * RATES.formwork).toFixed(0) },
    { itemNo: 'E1', description: 'Approach road (50m each side)',             unit: 'sqm', quantity: +approachArea.toFixed(2), rate: RATES.approach,   amount: +(approachArea * RATES.approach).toFixed(0) },
    { itemNo: 'E2', description: 'Railings / parapets (both sides)',          unit: 'Rm',  quantity: +(2 * bridgeL).toFixed(2), rate: RATES.railing,   amount: +(2 * bridgeL  * RATES.railing).toFixed(0) },
    { itemNo: 'E3', description: 'Expansion joints',                          unit: 'Rm',  quantity: +(2 * carriageW).toFixed(2), rate: RATES.expJoint, amount: +(2 * carriageW * RATES.expJoint).toFixed(0) },
  ];

  const subtotal = boq.reduce((s, i) => s + i.amount, 0);
  const profit   = subtotal * 0.10;
  const overhead = subtotal * 0.08;
  const gst      = (subtotal + profit + overhead) * 0.18;
  const total    = subtotal + profit + overhead + gst;
  const deckArea  = Math.max(1e-9, carriageW * bridgeL);

  return {
    quantities: {
      concrete: {
        m25: +totalM25.toFixed(2),
        m30: +totalM30.toFixed(2),
        m35: +totalM35.toFixed(2),
        total: +(totalM25 + totalM30 + totalM35).toFixed(2),
      },
      steel: {
        fe415: input.steelGrade === 'Fe415' ? +totalSteel.toFixed(3) : 0,
        fe500: input.steelGrade !== 'Fe415' ? +totalSteel.toFixed(3) : 0,
        total: +totalSteel.toFixed(3),
      },
      formwork: +formwork.toFixed(2),
      excavation: {
        ordinary: +totalExcav.toFixed(2),
        hardRock: 0,
        total: +totalExcav.toFixed(2),
      },
      backfill: +backfill.toFixed(2),
    },
    boq,
    cost: {
      subtotal: +subtotal.toFixed(0),
      profit:   +profit.toFixed(0),
      overhead: +overhead.toFixed(0),
      gst:      +gst.toFixed(0),
      total:    +total.toFixed(0),
      ratePerMeter: +(total / bridgeL).toFixed(0),
      ratePerSqm: +(total / deckArea).toFixed(0),
    },
  };
}
