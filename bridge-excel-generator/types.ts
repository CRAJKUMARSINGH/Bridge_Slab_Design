/**
 * TYPE DEFINITIONS FOR BRIDGE EXCEL GENERATOR
 * All interfaces matching FINAL_RESULT.xls structure
 */

export interface ProjectInput {
  // Project Information
  projectName: string;
  location: string;
  riverName: string;
  bridgeType?: string;
  jobNumber?: string;
  issuingAuthority?: string;
  hardRockAvailable?: boolean;
  
  // Bridge Geometry
  spanLength: number;           // meters
  numberOfSpans: number;        // count
  numberOfLanes?: number;
  carriageWidth: number;        // meters
  totalLength: number;          // meters (calculated)
  bridgeLength?: number;
  bridgeWidth?: number;
  skew?: number;
  deckSlabThickness?: number;
  deckSoffitLevel?: number;
  freeboardAboveHfl?: number;
  pierDesign?: {
    effectiveSpan?: number;
    spanCC?: number;
  };
  hydraulics?: Partial<HydraulicsResult> & { hfl?: number };
  
  // Hydraulic Data
  hfl: number;                  // Highest Flood Level (m MSL)
  bedLevel: number;             // Average bed level (m MSL)
  foundationLevel: number;      // Foundation level (m MSL)
  discharge: number;            // Design discharge (cumecs)
  manningN: number;             // Rugosity coefficient (0.033)
  bedSlope: number;             // Bed slope (1 in X)
  laceysSiltFactor: number;     // Silt factor (1.5)
  
  // Cross Section Data
  crossSectionData: CrossSectionPoint[];
  
  // Pier Data
  pierWidth: number;            // Width across flow (m)
  pierLength: number;           // Length along bridge (m)
  pierDepth: number;            // Depth from bed (m)
  numberOfPiers: number;        // Count
  pierBaseWidth: number;        // Base width (m)
  pierBaseLength: number;       // Base length (m)
  
  // Abutment Data
  abutmentHeight: number;       // Height (m)
  abutmentWidth: number;        // Width (m)
  abutmentDepth: number;        // Depth (m)
  dirtWallHeight: number;       // Dirt wall height (m)
  returnWallLength: number;     // Return wall length (m)
  
  // Material Properties
  concreteGrade: string;        // M25, M30, M35
  fck: number;                  // Concrete strength (MPa)
  steelGrade: string;           // Fe415, Fe500
  fy: number;                   // Steel yield strength (MPa)
  
  // Soil Properties
  sbc: number;                  // Safe bearing capacity (kPa)
  phi: number;                  // Angle of internal friction (degrees)
  gamma: number;                // Unit weight of soil (kN/m³)
  
  // Design Levels
  rtl: number;                  // Road top level (m MSL)
  agl: number;                  // Average ground level (m MSL)
  nbl: number;                  // Normal bed level (m MSL)
  ofl: number;                  // Ordinary flood level (m MSL)
  dwl: number;                  // Design Water Level (m MSL)
  
  // Optional Specific Concrete Grades
  concreteGradeFoundation?: string;
  concreteGradePier?: string;
  concreteGradeAbutment?: string;
  concreteGradeDeck?: string;
  concreteGradeWearing?: string;
}

export interface CrossSectionPoint {
  chainage: number;             // Distance (m)
  gl: number;                   // Ground level (m MSL)
}

export interface HydraulicsResult {
  // Area-Velocity Method
  crossSectionalArea: number;   // A (m²)
  wettedPerimeter: number;      // P (m)
  hydraulicRadius: number;      // R = A/P (m)
  velocity: number;             // V (m/s)
  discharge: number;            // Q = A × V (cumecs)
  
  // Linear Waterway
  regimeWidth: number;          // L = 4.8√Q (m)
  effectiveWaterway: number;    // Actual waterway (m)
  
  // Scour Depth
  scourDepth: number;           // dsm (m)
  designScourDepth: number;     // 2 × dsm (m)
  
  // Afflux
  afflux: number;               // Afflux (m)
  designWaterLevel: number;     // HFL + afflux (m MSL)
  hfl?: number;
  
  // Flow Characteristics
  froudeNumber: number;         // Fr = V/√(gh)
  flowType: string;             // Subcritical/Supercritical
  foundationDepth?: number;
  foundationLevel?: number;
  soffitLevel?: number;
  freeboard?: number;
  freeboardAboveHfl?: number;
  ircMinimumFreeboardAboveHfl?: number;
  requiredFreeboardAboveHfl?: number;
  isFreeboardSafe?: boolean;
}

export interface PierDesignResult {
  // Geometry
  geometry: {
    width: number;
    length: number;
    depth: number;
    baseWidth: number;
    baseLength: number;
    spacing: number;
  };
  
  // Loads
  loads: {
    deadLoad: number;           // kN
    liveLoad: number;           // kN
    hydrostaticForce: number;   // kN
    dragForce: number;          // kN
    windForce?: number;         // kN
    totalHorizontalForce: number; // kN
    buoyancy: number;           // kN
  };
  
  // Stability (5 Load Cases)
  loadCases: LoadCase[];
  
  // Reinforcement
  reinforcement: {
    mainSteel: SteelDetails;
    linkSteel: SteelDetails;
    flaredBase: SteelDetails;
  };
  
  // Footing
  footing: {
    length: number;
    width: number;
    thickness: number;
    reinforcement: SteelDetails;
    basePressure: {
      max: number;
      min: number;
      distribution: number[];
    };
  };
  
  // Pier Cap
  pierCap: {
    length: number;
    width: number;
    thickness: number;
    reinforcement: SteelDetails;
  };
}

export interface LoadCase {
  caseNumber: number;
  description: string;
  deadLoadFactor: number;
  liveLoadFactor: number;
  windLoadFactor: number;
  buoyancyFactor: number;
  
  // Forces
  verticalForce: number;
  horizontalForce: number;
  moment: number;
  
  // Stability Factors
  slidingFOS: number;           // ≥ 1.5
  overturningFOS: number;       // ≥ 1.8
  bearingFOS: number;           // ≥ 2.5
  
  // Status
  status: 'SAFE' | 'UNSAFE' | 'CHECK';
}

export interface SteelDetails {
  diameter: number;             // mm
  spacing: number;              // mm c/c
  numberOfBars: number;         // count
  area: number;                 // mm²
  weight: number;               // kg
}

export interface AbutmentDesignResult {
  // Geometry
  geometry: {
    height: number;
    width: number;
    depth: number;
    baseWidth: number;
    baseLength: number;
    dirtWallHeight: number;
    returnWallLength: number;
  };
  
  // Earth Pressure
  earthPressure: {
    ka: number;                 // Active earth pressure coefficient
    pa: number;                 // Total active earth pressure (kN)
    location: number;           // Distance from base (m)
  };
  
  // Loads
  loads: {
    deadLoad: number;
    liveLoad: number;
    earthPressure: number;
    soilSurcharge: number;
    waterPressure: number;
  };
  
  // Stability
  loadCases: LoadCase[];
  
  // Reinforcement
  reinforcement: {
    abutmentBody: SteelDetails;
    dirtWall: SteelDetails;
    returnWall: SteelDetails;
    footing: SteelDetails;
    abutmentCap: SteelDetails;
  };
}

export interface EstimationResult {
  // Quantities
  quantities: {
    concrete: {
      m25: number;              // m³
      m30: number;              // m³
      m35: number;              // m³
      total: number;            // m³
    };
    steel: {
      fe415: number;            // MT
      fe500: number;            // MT
      total: number;            // MT
    };
    formwork: number;           // m²
    excavation: {
      ordinary: number;         // m³
      hardRock: number;         // m³
      total: number;            // m³
    };
    backfill: number;           // m³
  };
  
  // Bill of Quantities
  boq: BOQItem[];
  
  // Cost Summary
  cost: {
    subtotal: number;           // ₹
    profit: number;             // ₹
    overhead: number;           // ₹
    gst: number;                // ₹
    total: number;              // ₹
    ratePerMeter: number;       // ₹/m
    ratePerSqm?: number;        // ₹/m²
  };
}

export interface BOQItem {
  itemNo: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface CompleteDesignResult {
  input: ProjectInput;
  hydraulics: HydraulicsResult;
  pier: PierDesignResult;
  abutmentType1: AbutmentDesignResult;
  abutmentC1: AbutmentDesignResult;
  estimation?: EstimationResult;
}

// Enhanced input with calculated results
export interface EnhancedProjectInput extends ProjectInput {
  hydraulics?: HydraulicsResult;
  pier?: PierDesignResult;
  abutmentType1?: AbutmentDesignResult;
  abutmentC1?: AbutmentDesignResult;
  estimation?: EstimationResult;
  pierDesign?: {
    spanCC?: number;
  };
}

