/**
 * VARIABLE SELECTION IMPLEMENTATION - OPTION B
 * Essential + Advanced Categories (70-80 inputs)
 * Creates dynamic input forms based on user selection
 */

interface VariableDefinition {
  name: string;
  defaultValue: any;
  unit: string;
  description: string;
  category: string;
  inputType: 'text' | 'number' | 'select' | 'date';
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    options?: string[];
  };
  helpText?: string;
}

// OPTION B SELECTION: Essential + Advanced Categories
const selectedVariables: VariableDefinition[] = [
  
  // ✅ 1. PROJECT INFO (all 11) - ESSENTIAL
  {
    name: 'projectName',
    defaultValue: 'Construction of Submersible Bridge',
    unit: '',
    description: 'Project identification name',
    category: 'PROJECT INFO',
    inputType: 'text',
    validation: { required: true },
    helpText: 'Enter the official name of your bridge project'
  },
  {
    name: 'location',
    defaultValue: 'Highway Project Location',
    unit: '',
    description: 'Project site location',
    category: 'PROJECT INFO',
    inputType: 'text',
    validation: { required: true },
    helpText: 'Specify the geographic location of the bridge'
  },
  {
    name: 'riverName',
    defaultValue: 'River Name',
    unit: '',
    description: 'Name of river being crossed',
    category: 'PROJECT INFO',
    inputType: 'text',
    validation: { required: true },
    helpText: 'Name of the water body being crossed'
  },
  {
    name: 'contractorName',
    defaultValue: 'ABC Construction Ltd',
    unit: '',
    description: 'Executing contractor name',
    category: 'PROJECT INFO',
    inputType: 'text',
    helpText: 'Name of the construction contractor'
  },
  {
    name: 'consultantName',
    defaultValue: 'XYZ Consultants',
    unit: '',
    description: 'Design consultant name',
    category: 'PROJECT INFO',
    inputType: 'text',
    helpText: 'Name of the design consulting firm'
  },
  {
    name: 'engineerName',
    defaultValue: 'Chief Engineer',
    unit: '',
    description: 'Responsible engineer name',
    category: 'PROJECT INFO',
    inputType: 'text',
    helpText: 'Name of the responsible design engineer'
  },
  {
    name: 'projectCode',
    defaultValue: 'BR-2024-001',
    unit: '',
    description: 'Unique project code',
    category: 'PROJECT INFO',
    inputType: 'text',
    validation: { required: true },
    helpText: 'Unique identifier for this project'
  },
  {
    name: 'drawingNumber',
    defaultValue: 'DWG-001',
    unit: '',
    description: 'Technical drawing reference',
    category: 'PROJECT INFO',
    inputType: 'text',
    helpText: 'Drawing number for technical documentation'
  },
  {
    name: 'revisionNumber',
    defaultValue: 'Rev-01',
    unit: '',
    description: 'Drawing revision number',
    category: 'PROJECT INFO',
    inputType: 'text',
    helpText: 'Current revision of the design'
  },
  {
    name: 'approvalDate',
    defaultValue: '2024-01-15',
    unit: '',
    description: 'Design approval date',
    category: 'PROJECT INFO',
    inputType: 'date',
    helpText: 'Date when design was approved'
  },
  {
    name: 'constructionDate',
    defaultValue: '2024-06-01',
    unit: '',
    description: 'Planned construction date',
    category: 'PROJECT INFO',
    inputType: 'date',
    helpText: 'Planned start date for construction'
  },

  // ✅ 2. BRIDGE GEOMETRY (all 12) - ESSENTIAL
  {
    name: 'spanLength',
    defaultValue: 10,
    unit: 'm',
    description: 'Individual span length',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 5, max: 50, required: true },
    helpText: 'Length of each individual span (5-50m typical)'
  },
  {
    name: 'numberOfSpans',
    defaultValue: 8,
    unit: 'nos',
    description: 'Total number of spans',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 1, max: 20, required: true },
    helpText: 'Total number of spans in the bridge'
  },
  {
    name: 'carriageWidth',
    defaultValue: 7.5,
    unit: 'm',
    description: 'Carriageway width',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 3.5, max: 15, required: true },
    helpText: 'Width of the traffic carriageway'
  },
  {
    name: 'numberOfLanes',
    defaultValue: 2,
    unit: 'nos',
    description: 'Number of traffic lanes',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 1, max: 6, required: true },
    helpText: 'Number of traffic lanes'
  },
  {
    name: 'shoulderWidth',
    defaultValue: 1.0,
    unit: 'm',
    description: 'Shoulder width each side',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 0.5, max: 3.0 },
    helpText: 'Width of shoulder on each side'
  },
  {
    name: 'sidewalkWidth',
    defaultValue: 1.5,
    unit: 'm',
    description: 'Pedestrian walkway width',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 0, max: 3.0 },
    helpText: 'Width of pedestrian walkway (0 if none)'
  },
  {
    name: 'medianWidth',
    defaultValue: 0.5,
    unit: 'm',
    description: 'Central median width',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 0, max: 2.0 },
    helpText: 'Width of central median (0 if none)'
  },
  {
    name: 'rtl',
    defaultValue: 287.0,
    unit: 'm MSL',
    description: 'Road Top Level',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { required: true },
    helpText: 'Road top level in meters above MSL'
  },
  {
    name: 'agl',
    defaultValue: 280.2,
    unit: 'm MSL',
    description: 'Average Ground Level',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { required: true },
    helpText: 'Average ground level in meters above MSL'
  },
  {
    name: 'nbl',
    defaultValue: 280.2,
    unit: 'm MSL',
    description: 'Natural Bed Level',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { required: true },
    helpText: 'Natural bed level of the river'
  },
  {
    name: 'bridgeGradient',
    defaultValue: 2.0,
    unit: '%',
    description: 'Longitudinal gradient',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 0, max: 8 },
    helpText: 'Longitudinal gradient of the bridge (0-8%)'
  },
  {
    name: 'crossFall',
    defaultValue: 2.5,
    unit: '%',
    description: 'Transverse gradient',
    category: 'BRIDGE GEOMETRY',
    inputType: 'number',
    validation: { min: 1.5, max: 4.0 },
    helpText: 'Transverse gradient for drainage (1.5-4%)'
  },

  // ✅ 3. HYDRAULICS (key 7) - ESSENTIAL
  {
    name: 'hfl',
    defaultValue: 285.5,
    unit: 'm MSL',
    description: 'Highest Flood Level',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { required: true },
    helpText: 'Highest flood level from hydrological studies'
  },
  {
    name: 'ofl',
    defaultValue: 284.8,
    unit: 'm MSL',
    description: 'Ordinary Flood Level',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { required: true },
    helpText: 'Ordinary flood level (annual flood)'
  },
  {
    name: 'foundationLevel',
    defaultValue: 276.5,
    unit: 'm MSL',
    description: 'Foundation Level',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { required: true },
    helpText: 'Level of foundation bottom'
  },
  {
    name: 'discharge',
    defaultValue: 1250.75,
    unit: 'cumecs',
    description: 'Design Discharge',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { min: 10, required: true },
    helpText: 'Design discharge for flood calculations'
  },
  {
    name: 'manningN',
    defaultValue: 0.035,
    unit: '-',
    description: 'Manning\'s Roughness Coefficient',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { min: 0.02, max: 0.08, required: true },
    helpText: 'Manning\'s roughness coefficient (0.02-0.08)'
  },
  {
    name: 'bedSlope',
    defaultValue: 1200,
    unit: '1 in n',
    description: 'Bed Slope',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { min: 100, max: 5000, required: true },
    helpText: 'Bed slope as 1 in n (e.g., 1200 means 1:1200)'
  },
  {
    name: 'laceysSiltFactor',
    defaultValue: 1.8,
    unit: '-',
    description: 'Lacey\'s Silt Factor',
    category: 'HYDRAULICS',
    inputType: 'number',
    validation: { min: 0.5, max: 3.0, required: true },
    helpText: 'Lacey\'s silt factor for scour calculations'
  },

  // ✅ 7. MATERIALS (key 5) - ESSENTIAL
  {
    name: 'concreteGrade',
    defaultValue: 'M30',
    unit: '',
    description: 'Concrete grade',
    category: 'MATERIALS',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['M20', 'M25', 'M30', 'M35', 'M40', 'M45', 'M50']
    },
    helpText: 'Grade of concrete (M20 to M50)'
  },
  {
    name: 'fck',
    defaultValue: 30,
    unit: 'MPa',
    description: 'Characteristic compressive strength',
    category: 'MATERIALS',
    inputType: 'number',
    validation: { min: 20, max: 50, required: true },
    helpText: 'Characteristic compressive strength of concrete'
  },
  {
    name: 'steelGrade',
    defaultValue: 'Fe500',
    unit: '',
    description: 'Steel grade',
    category: 'MATERIALS',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['Fe415', 'Fe500', 'Fe550']
    },
    helpText: 'Grade of reinforcement steel'
  },
  {
    name: 'fy',
    defaultValue: 500,
    unit: 'MPa',
    description: 'Yield strength',
    category: 'MATERIALS',
    inputType: 'number',
    validation: { min: 415, max: 550, required: true },
    helpText: 'Yield strength of reinforcement steel'
  },
  {
    name: 'concreteCover',
    defaultValue: 50,
    unit: 'mm',
    description: 'Concrete cover',
    category: 'MATERIALS',
    inputType: 'number',
    validation: { min: 25, max: 100, required: true },
    helpText: 'Concrete cover to reinforcement (25-100mm)'
  },

  // ✅ 8. SOIL PROPERTIES (key 7) - ESSENTIAL
  {
    name: 'sbc',
    defaultValue: 200,
    unit: 'kPa',
    description: 'Safe Bearing Capacity',
    category: 'SOIL PROPERTIES',
    inputType: 'number',
    validation: { min: 50, max: 1000, required: true },
    helpText: 'Safe bearing capacity of soil from soil investigation'
  },
  {
    name: 'phi',
    defaultValue: 32,
    unit: 'degrees',
    description: 'Angle of internal friction',
    category: 'SOIL PROPERTIES',
    inputType: 'number',
    validation: { min: 15, max: 45, required: true },
    helpText: 'Angle of internal friction of soil (15-45°)'
  },
  {
    name: 'cohesion',
    defaultValue: 0,
    unit: 'kPa',
    description: 'Soil cohesion',
    category: 'SOIL PROPERTIES',
    inputType: 'number',
    validation: { min: 0, max: 100 },
    helpText: 'Cohesion of soil (0 for sandy soils)'
  },
  {
    name: 'gamma',
    defaultValue: 19,
    unit: 'kN/m³',
    description: 'Unit weight of soil',
    category: 'SOIL PROPERTIES',
    inputType: 'number',
    validation: { min: 16, max: 25, required: true },
    helpText: 'Unit weight of soil (16-25 kN/m³)'
  },
  {
    name: 'gammaSat',
    defaultValue: 20,
    unit: 'kN/m³',
    description: 'Saturated unit weight',
    category: 'SOIL PROPERTIES',
    inputType: 'number',
    validation: { min: 18, max: 26, required: true },
    helpText: 'Saturated unit weight of soil'
  },
  {
    name: 'soilType',
    defaultValue: 'Sandy',
    unit: '',
    description: 'Type of soil',
    category: 'SOIL PROPERTIES',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['Sandy', 'Clayey', 'Silty', 'Gravelly', 'Mixed']
    },
    helpText: 'Predominant soil type at the site'
  },
  {
    name: 'surchargeLoad',
    defaultValue: 12,
    unit: 'kN/m²',
    description: 'Surcharge load',
    category: 'SOIL PROPERTIES',
    inputType: 'number',
    validation: { min: 0, max: 50 },
    helpText: 'Surcharge load from traffic/structures (0-50 kN/m²)'
  },

  // ✅ 9. SEISMIC DESIGN (all 6) - ESSENTIAL
  {
    name: 'seismicZone',
    defaultValue: 'III',
    unit: '',
    description: 'Seismic zone',
    category: 'SEISMIC DESIGN',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['II', 'III', 'IV', 'V']
    },
    helpText: 'Seismic zone as per IS 1893'
  },
  {
    name: 'seismicCoefficient',
    defaultValue: 0.12,
    unit: '-',
    description: 'Horizontal seismic coefficient',
    category: 'SEISMIC DESIGN',
    inputType: 'number',
    validation: { min: 0.05, max: 0.36, required: true },
    helpText: 'Horizontal seismic coefficient (αh)'
  },
  {
    name: 'importanceFactor',
    defaultValue: 1.5,
    unit: '-',
    description: 'Importance factor',
    category: 'SEISMIC DESIGN',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['1.0', '1.2', '1.5']
    },
    helpText: 'Importance factor (1.0=Normal, 1.2=Important, 1.5=Critical)'
  },
  {
    name: 'responseFactor',
    defaultValue: 3.0,
    unit: '-',
    description: 'Response reduction factor',
    category: 'SEISMIC DESIGN',
    inputType: 'number',
    validation: { min: 2.0, max: 5.0, required: true },
    helpText: 'Response reduction factor (R) - 3.0 for bridges'
  },
  {
    name: 'soilTypeSeismic',
    defaultValue: 'Medium',
    unit: '',
    description: 'Soil type for seismic analysis',
    category: 'SEISMIC DESIGN',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['Hard', 'Medium', 'Soft']
    },
    helpText: 'Soil type for seismic analysis'
  },

  // ⚡ 4. PIER DESIGN (selected 8) - ADVANCED
  {
    name: 'pierWidth',
    defaultValue: 1.5,
    unit: 'm',
    description: 'Pier width across flow',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 0.8, max: 3.0, required: true },
    helpText: 'Width of pier across the flow direction'
  },
  {
    name: 'pierLength',
    defaultValue: 4.0,
    unit: 'm',
    description: 'Pier length along bridge',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 2.0, max: 8.0, required: true },
    helpText: 'Length of pier along the bridge direction'
  },
  {
    name: 'pierDepth',
    defaultValue: 5.5,
    unit: 'm',
    description: 'Pier height from bed',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 3.0, max: 15.0, required: true },
    helpText: 'Height of pier from bed level to deck bottom'
  },
  {
    name: 'pierBaseWidth',
    defaultValue: 3.0,
    unit: 'm',
    description: 'Pier base width (flared)',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 1.5, max: 5.0 },
    helpText: 'Width of pier base (if flared)'
  },
  {
    name: 'pierBaseLength',
    defaultValue: 5.0,
    unit: 'm',
    description: 'Pier base length (flared)',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 3.0, max: 10.0 },
    helpText: 'Length of pier base (if flared)'
  },
  {
    name: 'foundationDepth',
    defaultValue: 4.0,
    unit: 'm',
    description: 'Foundation depth below bed',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 2.0, max: 10.0, required: true },
    helpText: 'Depth of foundation below bed level'
  },
  {
    name: 'foundationType',
    defaultValue: 'Shallow',
    unit: '',
    description: 'Type of foundation',
    category: 'PIER DESIGN',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['Shallow', 'Deep', 'Pile']
    },
    helpText: 'Type of foundation system'
  },
  {
    name: 'pierCapThickness',
    defaultValue: 0.8,
    unit: 'm',
    description: 'Pier cap thickness',
    category: 'PIER DESIGN',
    inputType: 'number',
    validation: { min: 0.5, max: 1.5 },
    helpText: 'Thickness of pier cap'
  },

  // ⚡ 5. DECK DESIGN (selected 6) - ADVANCED
  {
    name: 'deckThickness',
    defaultValue: 0.25,
    unit: 'm',
    description: 'Deck slab thickness',
    category: 'DECK DESIGN',
    inputType: 'number',
    validation: { min: 0.2, max: 0.5, required: true },
    helpText: 'Thickness of deck slab (200-500mm)'
  },
  {
    name: 'deckOverhang',
    defaultValue: 0.5,
    unit: 'm',
    description: 'Deck overhang beyond pier',
    category: 'DECK DESIGN',
    inputType: 'number',
    validation: { min: 0.3, max: 1.0 },
    helpText: 'Deck overhang beyond pier centerline'
  },
  {
    name: 'wearingCoatThickness',
    defaultValue: 0.075,
    unit: 'm',
    description: 'Wearing coat thickness',
    category: 'DECK DESIGN',
    inputType: 'number',
    validation: { min: 0.05, max: 0.15 },
    helpText: 'Thickness of wearing coat (50-150mm)'
  },
  {
    name: 'railingHeight',
    defaultValue: 1.2,
    unit: 'm',
    description: 'Railing height',
    category: 'DECK DESIGN',
    inputType: 'number',
    validation: { min: 1.0, max: 1.5 },
    helpText: 'Height of safety railing'
  },
  {
    name: 'railingType',
    defaultValue: 'RCC',
    unit: '',
    description: 'Type of railing',
    category: 'DECK DESIGN',
    inputType: 'select',
    validation: { 
      options: ['RCC', 'Steel', 'Precast', 'Composite']
    },
    helpText: 'Type of safety railing'
  },
  {
    name: 'expansionJointWidth',
    defaultValue: 0.05,
    unit: 'm',
    description: 'Expansion joint width',
    category: 'DECK DESIGN',
    inputType: 'number',
    validation: { min: 0.02, max: 0.15 },
    helpText: 'Width of expansion joints'
  },

  // ⚡ 6. ABUTMENT DESIGN (selected 6) - ADVANCED
  {
    name: 'abutmentType',
    defaultValue: 'TYPE1',
    unit: '',
    description: 'Type (TYPE1/Gravity or C1/Cantilever)',
    category: 'ABUTMENT DESIGN',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['TYPE1', 'C1']
    },
    helpText: 'TYPE1=Gravity type, C1=Cantilever type'
  },
  {
    name: 'abutmentHeight',
    defaultValue: 6.0,
    unit: 'm',
    description: 'Abutment height',
    category: 'ABUTMENT DESIGN',
    inputType: 'number',
    validation: { min: 3.0, max: 12.0, required: true },
    helpText: 'Total height of abutment'
  },
  {
    name: 'abutmentWidth',
    defaultValue: 0.8,
    unit: 'm',
    description: 'Abutment thickness',
    category: 'ABUTMENT DESIGN',
    inputType: 'number',
    validation: { min: 0.5, max: 2.0, required: true },
    helpText: 'Thickness of abutment stem'
  },
  {
    name: 'returnWallLength',
    defaultValue: 8.0,
    unit: 'm',
    description: 'Return wall length',
    category: 'ABUTMENT DESIGN',
    inputType: 'number',
    validation: { min: 4.0, max: 15.0 },
    helpText: 'Length of return walls'
  },
  {
    name: 'returnWallHeight',
    defaultValue: 4.0,
    unit: 'm',
    description: 'Return wall height',
    category: 'ABUTMENT DESIGN',
    inputType: 'number',
    validation: { min: 2.0, max: 8.0 },
    helpText: 'Height of return walls'
  },
  {
    name: 'approachSlabLength',
    defaultValue: 3.0,
    unit: 'm',
    description: 'Approach slab length',
    category: 'ABUTMENT DESIGN',
    inputType: 'number',
    validation: { min: 2.0, max: 6.0 },
    helpText: 'Length of approach slab'
  },

  // ⚡ 10. LOADING (selected 4) - ADVANCED
  {
    name: 'liveLoadClass',
    defaultValue: 'A',
    unit: '',
    description: 'Live load class',
    category: 'LOADING',
    inputType: 'select',
    validation: { 
      required: true,
      options: ['A', 'AA', '70R', 'Class B']
    },
    helpText: 'IRC live load class (A=Standard, AA=Heavy)'
  },
  {
    name: 'windPressure',
    defaultValue: 1.5,
    unit: 'kN/m²',
    description: 'Wind pressure',
    category: 'LOADING',
    inputType: 'number',
    validation: { min: 1.0, max: 3.0 },
    helpText: 'Design wind pressure (1.0-3.0 kN/m²)'
  },
  {
    name: 'temperatureRange',
    defaultValue: 30,
    unit: '°C',
    description: 'Temperature variation',
    category: 'LOADING',
    inputType: 'number',
    validation: { min: 20, max: 50 },
    helpText: 'Temperature variation range (20-50°C)'
  },
  {
    name: 'utilityLoad',
    defaultValue: 1.0,
    unit: 'kN/m',
    description: 'Utility load',
    category: 'LOADING',
    inputType: 'number',
    validation: { min: 0, max: 5.0 },
    helpText: 'Load from utilities (pipes, cables, etc.)'
  }
];

// Generate form configuration
const formConfig = {
  totalInputs: selectedVariables.length,
  categories: [...new Set(selectedVariables.map(v => v.category))],
  categoryGroups: {
    essential: ['PROJECT INFO', 'BRIDGE GEOMETRY', 'HYDRAULICS', 'MATERIALS', 'SOIL PROPERTIES', 'SEISMIC DESIGN'],
    advanced: ['PIER DESIGN', 'DECK DESIGN', 'ABUTMENT DESIGN', 'LOADING']
  },
  variables: selectedVariables
};

console.log('🎯 VARIABLE SELECTION COMPLETE - OPTION B');
console.log(`📊 Total Input Fields: ${formConfig.totalInputs}`);
console.log(`📋 Categories: ${formConfig.categories.length}`);
console.log('✅ Essential Categories:', formConfig.categoryGroups.essential.length);
console.log('⚡ Advanced Categories:', formConfig.categoryGroups.advanced.length);

// Export configuration for UI generation
export { formConfig, selectedVariables };
export type { VariableDefinition };

/**
 * NEXT STEPS:
 * 1. Generate React components for each category
 * 2. Create validation system
 * 3. Implement help system
 * 4. Connect to calculation engine
 * 5. Generate beautiful UI forms
 */