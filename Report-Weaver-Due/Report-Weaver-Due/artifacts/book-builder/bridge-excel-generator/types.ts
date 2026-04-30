/**
 * TYPE DEFINITIONS FOR BRIDGE EXCEL GENERATOR
 * All interfaces matching FINAL_RESULT.xls structure
 */

export interface ProjectInput {
  // Project Information
  projectName: string;
  location: string;
  riverName: string;
  /** Dual mode support: submersible (legacy default) or high-level slab bridge. */
  bridgeType?: 'submersible' | 'high-level';
  
  // Bridge Geometry
  spanLength: number;           // meters
  numberOfSpans: number;        // count
  skew: number;                 // skew angle in degrees (0 = orthogonal)
  carriageWidth: number;        // meters
  numberOfLanes: number;        // traffic lanes (IRC live load)
  totalLength: number;          // meters (calculated)
  
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
  dwl: number;                  // Deep water level (m MSL)
  /** Deck slab thickness for geometry/render defaults (m). */
  deckSlabThickness?: number;
  /** For high-level bridges: desired minimum clearance above HFL (m). */
  freeboardAboveHfl?: number;
  /** For high-level bridges: explicit deck soffit level override (m MSL). */
  deckSoffitLevel?: number;

  // ASTRA Enhancements
  f1Factor?: number;            // Catchment characteristic factor F1 — applied to total adopted discharge (default: 1.0)
  f2Factor?: number;            // Catchment characteristic factor F2 (default: 1.0)
  maxScourMultiplier?: number;  // Design scour depth multiplier — IRC:78-1983 (default: 2.0)
  v_observed?: number;          // Observed velocity (m/s)

  // Live Load
  /** Design live load intensity per metre of span (kN/m). Default 50 kN/m (IRC Class AA equivalent). */
  liveLoadPerMetre?: number;

  /** Client / department line on TechNote & Tech Report (assessment matrix). */
  issuingAuthority?: string;
  /** Job / estimate / file number for office records. */
  jobNumber?: string;
  /** Switches foundation narrative on TechNote / Tech Report (instruction assessment matrix). */
  hardRockAvailable?: boolean;
  /** Optional concrete grade overrides; when omitted, Tech sheets use concreteGrade. */
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
  
  // Flow Characteristics
  froudeNumber: number;         // Fr = V/√(gh)
  flowType: string;             // Subcritical/Supercritical
  
  // High-Level Bridge specific
  soffitLevel?: number;         // m MSL
  /** Clearance: deck soffit minus DWL (HFL + afflux). */
  freeboard?: number;           // m
  /** Clearance: deck soffit minus HFL (policy check for high-level). */
  freeboardAboveHfl?: number;   // m
  /** IRC:5-style minimum freeboard above HFL from design discharge Q (high-level). */
  ircMinimumFreeboardAboveHfl?: number;
  /** Governing minimum above HFL: max(IRC table, project freeboardAboveHfl). */
  requiredFreeboardAboveHfl?: number;
  isFreeboardSafe?: boolean;
  foundationLevel: number;      // m MSL
  foundationDepth: number;      // m
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
    pierSelfWeight: number;     // kN
    deckDeadLoad: number;       // kN
    deadLoad: number;           // kN (Total DL = Pier + Deck)
    liveLoad: number;           // kN
    hydrostaticForce: number;   // kN
    dragForce: number;          // kN
    totalHorizontalForce: number; // kN
    buoyancy: number;           // kN
    windForce?: number;          // kN (for high-level bridges)
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
    profit: number;             // ₹ (10%)
    overhead: number;           // ₹ (8%)
    gst: number;                // ₹ (18%)
    total: number;              // ₹ (grand total)
    ratePerMeter: number;       // ₹/m of bridge length
    ratePerSqm: number;         // ₹/m² deck (carriageway × total length)
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

/** Cell references on sheet INPUT-HYDRAULICS for cross-sheet formulas (ESTIMATION, abstracts). */
export interface InputHydraulicsTemplateRefs {
  spanLengthRef: string;
  numberOfSpansRef: string;
  carriageWidthRef: string;
  totalLengthRef: string;
}

// Enhanced input with calculated results
export interface EnhancedProjectInput extends ProjectInput {
  hydraulics?: HydraulicsResult;
  pier?: PierDesignResult;
  abutmentType1?: AbutmentDesignResult;
  abutmentC1?: AbutmentDesignResult;
  estimation?: EstimationResult;   // ← linked from design engine
  pierDesign?: {
    spanCC?: number;
  };
}
