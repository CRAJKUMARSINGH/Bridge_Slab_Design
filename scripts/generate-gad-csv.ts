/**
 * GAD CSV Generator
 * Creates CSV for General Arrangement Drawing parameters
 * Can be used with external CAD tools or GAD generators
 */

import { writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import type { ProjectInput } from '../bridge-excel-generator/types';

interface GADParameters {
  // Bridge geometry
  projectName: string;
  totalLength: number;
  spanLength: number;
  numberOfSpans: number;
  bridgeWidth: number;
  carriageWidth: number;
  
  // Levels
  hfl: number;
  bedLevel: number;
  foundationLevel: number;
  rtl: number;
  agl: number;
  
  // Pier data
  numberOfPiers: number;
  pierWidth: number;
  pierLength: number;
  pierDepth: number;
  pierBaseWidth: number;
  pierBaseLength: number;
  
  // Abutment data
  abutmentWidth: number;
  abutmentHeight: number;
  abutmentDepth: number;
  dirtWallHeight: number;
  returnWallLength: number;
  
  // Hydraulic
  velocity: number;
  discharge: number;
  afflux: number;
  
  // Generated coordinates
  pierPositions: number[];
  abutmentPositions: { left: number; right: number };
}

/**
 * Generate GAD CSV from ProjectInput
 */
export function generateGADCSV(input: ProjectInput): string {
  const design = calculateCompleteDesign(input);
  
  // Calculate pier positions (at span centers)
  const pierPositions: number[] = [];
  for (let i = 1; i <= input.numberOfPiers; i++) {
    pierPositions.push(i * input.spanLength);
  }
  
  const params: GADParameters = {
    projectName: input.projectName,
    totalLength: input.totalLength,
    spanLength: input.spanLength,
    numberOfSpans: input.numberOfSpans,
    bridgeWidth: input.carriageWidth + 3, // Including kerbs
    carriageWidth: input.carriageWidth,
    
    hfl: input.hfl,
    bedLevel: input.bedLevel,
    foundationLevel: input.foundationLevel,
    rtl: input.rtl,
    agl: input.agl,
    
    numberOfPiers: input.numberOfPiers,
    pierWidth: input.pierWidth,
    pierLength: input.pierLength,
    pierDepth: input.pierDepth,
    pierBaseWidth: input.pierBaseWidth,
    pierBaseLength: input.pierBaseLength,
    
    abutmentWidth: input.abutmentWidth,
    abutmentHeight: input.abutmentHeight,
    abutmentDepth: input.abutmentDepth,
    dirtWallHeight: input.dirtWallHeight,
    returnWallLength: input.returnWallLength,
    
    velocity: design.hydraulics.velocity,
    discharge: design.hydraulics.discharge,
    afflux: design.hydraulics.afflux,
    
    pierPositions,
    abutmentPositions: { left: 0, right: input.totalLength }
  };
  
  // Build CSV content
  const headers = [
    'Parameter',
    'Value',
    'Unit',
    'Description',
    'CAD_Layer'
  ];
  
  const rows: string[][] = [
    // Project info
    ['PROJECT_NAME', params.projectName, '', 'Project identification', 'TEXT'],
    ['TOTAL_LENGTH', params.totalLength.toString(), 'm', 'Total bridge length', 'DIMENSIONS'],
    ['SPAN_LENGTH', params.spanLength.toString(), 'm', 'Individual span', 'DIMENSIONS'],
    ['NUMBER_OF_SPANS', params.numberOfSpans.toString(), 'nos', 'Span count', 'DIMENSIONS'],
    ['BRIDGE_WIDTH', params.bridgeWidth.toString(), 'm', 'Overall width', 'STRUCTURE'],
    ['CARRIAGE_WIDTH', params.carriageWidth.toString(), 'm', 'Carriageway', 'STRUCTURE'],
    
    // Levels
    ['HFL', params.hfl.toString(), 'm MSL', 'Highest Flood Level', 'WATER_LEVEL'],
    ['BED_LEVEL', params.bedLevel.toString(), 'm MSL', 'River bed level', 'STRUCTURE'],
    ['FOUNDATION_LEVEL', params.foundationLevel.toString(), 'm MSL', 'Foundation depth', 'STRUCTURE'],
    ['RTL', params.rtl.toString(), 'm MSL', 'Road Top Level', 'STRUCTURE'],
    ['AGL', params.agl.toString(), 'm MSL', 'Average Ground Level', 'STRUCTURE'],
    
    // Pier data
    ['NUMBER_OF_PIERS', params.numberOfPiers.toString(), 'nos', 'Pier count', 'PIERS'],
    ['PIER_WIDTH', params.pierWidth.toString(), 'm', 'Pier width (flow)', 'PIERS'],
    ['PIER_LENGTH', params.pierLength.toString(), 'm', 'Pier length (bridge)', 'PIERS'],
    ['PIER_DEPTH', params.pierDepth.toString(), 'm', 'Pier below bed', 'PIERS'],
    ['PIER_BASE_WIDTH', params.pierBaseWidth.toString(), 'm', 'Footing width', 'PIERS'],
    ['PIER_BASE_LENGTH', params.pierBaseLength.toString(), 'm', 'Footing length', 'PIERS'],
    
    // Pier positions (comma-separated for CAD)
    ['PIER_POSITIONS', params.pierPositions.join(','), 'm', 'Pier chainages', 'PIERS'],
    
    // Abutment data
    ['ABUTMENT_WIDTH', params.abutmentWidth.toString(), 'm', 'Abutment width', 'ABUTMENTS'],
    ['ABUTMENT_HEIGHT', params.abutmentHeight.toString(), 'm', 'Abutment height', 'ABUTMENTS'],
    ['ABUTMENT_DEPTH', params.abutmentDepth.toString(), 'm', 'Foundation depth', 'ABUTMENTS'],
    ['DIRT_WALL_HEIGHT', params.dirtWallHeight.toString(), 'm', 'Dirt wall', 'ABUTMENTS'],
    ['RETURN_WALL_LENGTH', params.returnWallLength.toString(), 'm', 'Return wall', 'ABUTMENTS'],
    ['ABUT_LEFT_POS', params.abutmentPositions.left.toString(), 'm', 'Left abutment chainage', 'ABUTMENTS'],
    ['ABUT_RIGHT_POS', params.abutmentPositions.right.toString(), 'm', 'Right abutment chainage', 'ABUTMENTS'],
    
    // Hydraulic results
    ['VELOCITY', params.velocity.toFixed(2), 'm/s', 'Design velocity', 'HYDRAULICS'],
    ['DISCHARGE', params.discharge.toFixed(2), 'cumecs', 'Design discharge', 'HYDRAULICS'],
    ['AFFLUX', params.afflux.toFixed(3), 'm', 'Afflux (head loss)', 'HYDRAULICS'],
    
    // Cross-section data summary
    ['CROSS_SECTION_POINTS', input.crossSectionData.length.toString(), 'nos', 'Survey points', 'DIMENSIONS'],
    ['FIRST_CHAINAGE', input.crossSectionData[0]?.chainage.toString() || '0', 'm', 'Start chainage', 'DIMENSIONS'],
    ['LAST_CHAINAGE', input.crossSectionData[input.crossSectionData.length - 1]?.chainage.toString() || '0', 'm', 'End chainage', 'DIMENSIONS'],
    
    // Drawing scale info for CAD
    ['SCALE_HORIZONTAL', '1', '', 'H scale (1:1000 typical)', 'SETUP'],
    ['SCALE_VERTICAL', '10', '', 'V exaggeration (10x)', 'SETUP'],
    ['DRAWING_UNITS', 'METERS', '', 'CAD units', 'SETUP']
  ];
  
  // Add cross-section points as individual rows for CAD import
  input.crossSectionData.forEach((point, idx) => {
    rows.push([
      `CS_POINT_${idx + 1}`,
      `${point.chainage},${point.gl}`,
      'm,m',
      `Chainage ${point.chainage.toFixed(2)}, GL ${point.gl.toFixed(2)}`,
      'CROSS_SECTION'
    ]);
  });
  
  // Build CSV string
  const csvLines = [
    headers.join(','),
    ...rows.map(r => r.map(escapeCsv).join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Save GAD CSV to file
 */
export function saveGADCSV(input: ProjectInput, outputDir: string = './output'): string {
  const csv = generateGADCSV(input);
  const safeName = input.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `gad_${safeName}_${Date.now()}.csv`;
  const filepath = join(outputDir, filename);
  
  writeFileSync(filepath, csv, 'utf-8');
  console.log(`✓ GAD CSV saved: ${filepath}`);
  
  return filepath;
}

/**
 * Generate GAD CSV with additional CAD metadata (JSON format)
 */
export function generateGADJSON(input: ProjectInput): object {
  const design = calculateCompleteDesign(input);
  
  return {
    project: {
      name: input.projectName,
      date: new Date().toISOString(),
      standard: 'IRC:6-2016, IRC:112-2015'
    },
    geometry: {
      type: 'SubmersibleBridge',
      totalLength: input.totalLength,
      spans: Array.from({ length: input.numberOfSpans }, (_, i) => ({
        spanNumber: i + 1,
        length: input.spanLength,
        startChainage: i * input.spanLength,
        endChainage: (i + 1) * input.spanLength
      })),
      width: input.carriageWidth + 3
    },
    piers: {
      count: input.numberOfPiers,
      spacing: input.spanLength,
      positions: Array.from({ length: input.numberOfPiers }, (_, i) => (i + 1) * input.spanLength),
      width: input.pierWidth,
      length: input.pierLength,
      depth: input.pierDepth,
      footing: {
        width: input.pierBaseWidth,
        length: input.pierBaseLength
      }
    },
    abutments: {
      left: {
        position: 0,
        width: input.abutmentWidth,
        height: input.abutmentHeight,
        depth: input.abutmentDepth
      },
      right: {
        position: input.totalLength,
        width: input.abutmentWidth,
        height: input.abutmentHeight,
        depth: input.abutmentDepth
      }
    },
    levels: {
      hfl: input.hfl,
      bedLevel: input.bedLevel,
      foundationLevel: input.foundationLevel,
      rtl: input.rtl,
      agl: input.agl
    },
    hydraulics: {
      velocity: design.hydraulics.velocity,
      discharge: design.hydraulics.discharge,
      afflux: design.hydraulics.afflux,
      area: design.hydraulics.crossSectionalArea,
      perimeter: design.hydraulics.wettedPerimeter
    },
    crossSection: input.crossSectionData
  };
}

function escapeCsv(value: string): string {
  // Escape quotes and wrap in quotes if contains comma or quote
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// CLI usage (Node ESM: this file was executed directly)
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (isDirectRun) {
  const sampleInput: ProjectInput = {
    projectName: 'Kherwara Bridge',
    location: 'Kherwara - Jawas Road',
    riverName: 'Som River',
    spanLength: 10,
    numberOfSpans: 8,
    skew: 0,
    carriageWidth: 7.5,
    numberOfLanes: 2,
    totalLength: 80,
    hfl: 100.6,
    bedLevel: 91.59,
    foundationLevel: 88.0,
    discharge: 900,
    manningN: 0.033,
    bedSlope: 4000,
    laceysSiltFactor: 1.5,
    crossSectionData: [
      { chainage: 0, gl: 92.0 },
      { chainage: 10, gl: 91.8 },
      { chainage: 20, gl: 91.6 },
      { chainage: 30, gl: 91.59 },
      { chainage: 40, gl: 91.6 },
      { chainage: 50, gl: 91.7 },
      { chainage: 60, gl: 91.9 }
    ],
    pierWidth: 1.5,
    pierLength: 3.5,
    pierDepth: 6.0,
    numberOfPiers: 7,
    pierBaseWidth: 3.5,
    pierBaseLength: 5.5,
    abutmentHeight: 4.0,
    abutmentWidth: 2.0,
    abutmentDepth: 3.5,
    dirtWallHeight: 1.5,
    returnWallLength: 3.0,
    concreteGrade: 'M30',
    fck: 30,
    steelGrade: 'Fe500',
    fy: 500,
    sbc: 200,
    phi: 30,
    gamma: 18,
    rtl: 287.0,
    agl: 280.2,
    nbl: 280.2,
    ofl: 95.0,
    dwl: 92.0
  };
  
  const csv = generateGADCSV(sampleInput);
  console.log(csv);
}
