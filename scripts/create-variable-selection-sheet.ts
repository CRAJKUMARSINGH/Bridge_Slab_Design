/**
 * CREATE VARIABLE SELECTION SHEET
 * Generates an Excel sheet with all variables for user selection
 * Delete rows for variables you want as user inputs
 * Keep rows for variables that should be fixed/calculated
 */

import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const variableSheetPath = path.join(scriptDir, '..', 'VARIABLE_SELECTION_SHEET.xlsx');

async function createVariableSelectionSheet() {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('VARIABLE SELECTION');
  
  // Set column widths
  ws.columns = [
    { width: 5 },   // S.No
    { width: 25 },  // Category
    { width: 35 },  // Variable Name
    { width: 15 },  // Default Value
    { width: 10 },  // Unit
    { width: 40 },  // Description
    { width: 15 },  // Type
    { width: 20 }   // Usage in Sheets
  ];
  
  // Header row
  const headerRow = ws.addRow([
    'S.No',
    'Category',
    'Variable Name',
    'Default Value',
    'Unit',
    'Description',
    'Type',
    'Used in Sheets'
  ]);
  
  // Format header
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  let sno = 1;
  
  // PROJECT INFORMATION VARIABLES
  const projectVars = [
    ['projectName', 'Construction of Submersible Bridge', '', 'Project identification name', 'INPUT', 'All sheets'],
    ['location', 'Highway Project Location', '', 'Project site location', 'INPUT', 'All sheets'],
    ['riverName', 'River Name', '', 'Name of river being crossed', 'INPUT', 'Hydraulics, Afflux'],
    ['contractorName', 'ABC Construction Ltd', '', 'Executing contractor name', 'INPUT', 'Cover, Index'],
    ['consultantName', 'XYZ Consultants', '', 'Design consultant name', 'INPUT', 'Cover, Index'],
    ['engineerName', 'Chief Engineer', '', 'Responsible engineer name', 'INPUT', 'Cover, Index'],
    ['projectCode', 'BR-2024-001', '', 'Unique project code', 'INPUT', 'All sheets'],
    ['drawingNumber', 'DWG-001', '', 'Technical drawing reference', 'INPUT', 'All sheets'],
    ['revisionNumber', 'Rev-01', '', 'Drawing revision number', 'INPUT', 'All sheets'],
    ['approvalDate', '2024-01-15', '', 'Design approval date', 'INPUT', 'Cover, Index'],
    ['constructionDate', '2024-06-01', '', 'Planned construction date', 'INPUT', 'Cover, Index']
  ];
  
  projectVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'PROJECT INFO', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    }
  });
  
  // BRIDGE GEOMETRY VARIABLES
  const geometryVars = [
    ['spanLength', 10, 'm', 'Individual span length', 'INPUT', 'All structural sheets'],
    ['numberOfSpans', 8, 'nos', 'Total number of spans', 'INPUT', 'All structural sheets'],
    ['totalLength', 80, 'm', 'Total bridge length (calculated)', 'CALCULATED', 'All sheets'],
    ['carriageWidth', 7.5, 'm', 'Carriageway width', 'INPUT', 'All sheets'],
    ['numberOfLanes', 2, 'nos', 'Number of traffic lanes', 'INPUT', 'Live load sheets'],
    ['laneWidth', 3.75, 'm', 'Individual lane width (calculated)', 'CALCULATED', 'Live load sheets'],
    ['shoulderWidth', 1.0, 'm', 'Shoulder width each side', 'INPUT', 'Geometry sheets'],
    ['sidewalkWidth', 1.5, 'm', 'Pedestrian walkway width', 'INPUT', 'Geometry sheets'],
    ['medianWidth', 0.5, 'm', 'Central median width', 'INPUT', 'Geometry sheets'],
    ['bridgeWidth', 10.5, 'm', 'Total bridge width (calculated)', 'CALCULATED', 'All sheets'],
    ['rtl', 287.0, 'm MSL', 'Road Top Level', 'INPUT', 'All sheets'],
    ['agl', 280.2, 'm MSL', 'Average Ground Level', 'INPUT', 'All sheets'],
    ['nbl', 280.2, 'm MSL', 'Natural Bed Level', 'INPUT', 'Hydraulics, Scour'],
    ['bridgeGradient', 2.0, '%', 'Longitudinal gradient', 'INPUT', 'Geometry sheets'],
    ['crossFall', 2.5, '%', 'Transverse gradient', 'INPUT', 'Deck design'],
    ['camber', 0.0, '%', 'Deck camber', 'INPUT', 'Deck design']
  ];
  
  geometryVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'BRIDGE GEOMETRY', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    }
  });
  
  // HYDRAULIC DESIGN VARIABLES
  const hydraulicVars = [
    ['hfl', 285.5, 'm MSL', 'Highest Flood Level', 'INPUT', 'Hydraulics, Afflux, Scour'],
    ['ofl', 284.8, 'm MSL', 'Ordinary Flood Level', 'INPUT', 'Hydraulics'],
    ['dwl', 285.75, 'm MSL', 'Design Water Level (calculated)', 'CALCULATED', 'All structural sheets'],
    ['bedLevel', 280.2, 'm MSL', 'Average Bed Level', 'INPUT', 'Hydraulics, Scour'],
    ['foundationLevel', 276.5, 'm MSL', 'Foundation Level', 'INPUT', 'Pier, Abutment design'],
    ['lwl', 282.0, 'm MSL', 'Low Water Level', 'INPUT', 'Hydraulics'],
    ['scourLevel', 275.0, 'm MSL', 'Scour Level (calculated)', 'CALCULATED', 'Foundation design'],
    ['discharge', 1250.75, 'cumecs', 'Design Discharge', 'INPUT', 'Hydraulics, Afflux'],
    ['velocity', 2.8, 'm/s', 'Flow Velocity (calculated)', 'CALCULATED', 'Hydraulics, Forces'],
    ['manningN', 0.035, '-', 'Manning\'s Roughness Coefficient', 'INPUT', 'Hydraulics'],
    ['bedSlope', 1200, '1 in n', 'Bed Slope', 'INPUT', 'Hydraulics'],
    ['laceysSiltFactor', 1.8, '-', 'Lacey\'s Silt Factor', 'INPUT', 'Scour calculation'],
    ['regimeWidth', 168.5, 'm', 'Regime Width (calculated)', 'CALCULATED', 'Hydraulics'],
    ['effectiveWaterway', 80, 'm', 'Effective Waterway (calculated)', 'CALCULATED', 'Afflux'],
    ['froudeNumber', 0.52, '-', 'Froude Number (calculated)', 'CALCULATED', 'Hydraulics'],
    ['reynoldsNumber', 147000, '-', 'Reynolds Number (calculated)', 'CALCULATED', 'Hydraulics'],
    ['crossSectionalArea', 425, 'm²', 'Flow Area (calculated)', 'CALCULATED', 'Hydraulics'],
    ['wettedPerimeter', 95, 'm', 'Wetted Perimeter (calculated)', 'CALCULATED', 'Hydraulics'],
    ['hydraulicRadius', 4.47, 'm', 'Hydraulic Radius (calculated)', 'CALCULATED', 'Hydraulics'],
    ['topWidth', 90, 'm', 'Top Width of Flow (calculated)', 'CALCULATED', 'Hydraulics'],
    ['meanDepth', 4.72, 'm', 'Mean Depth of Flow (calculated)', 'CALCULATED', 'Hydraulics'],
    ['afflux', 0.25, 'm', 'Afflux Value (calculated)', 'CALCULATED', 'Design levels'],
    ['affluxCoefficient', 1.2, '-', 'Afflux Coefficient', 'FIXED', 'Afflux calculation'],
    ['contractionRatio', 0.85, '-', 'Contraction Ratio (calculated)', 'CALCULATED', 'Afflux'],
    ['obstructionRatio', 0.15, '-', 'Obstruction Ratio (calculated)', 'CALCULATED', 'Afflux'],
    ['bridgeOpeningRatio', 0.85, '-', 'Bridge Opening Ratio (calculated)', 'CALCULATED', 'Afflux'],
    ['scourDepth', 3.2, 'm', 'Normal Scour Depth (calculated)', 'CALCULATED', 'Foundation design'],
    ['designScourDepth', 6.4, 'm', 'Design Scour Depth (calculated)', 'CALCULATED', 'Foundation design'],
    ['localScourDepth', 4.8, 'm', 'Local Scour Depth (calculated)', 'CALCULATED', 'Pier design'],
    ['generalScourDepth', 1.5, 'm', 'General Scour Depth (calculated)', 'CALCULATED', 'Foundation design'],
    ['scourProtectionDepth', 8.0, 'm', 'Scour Protection Depth (calculated)', 'CALCULATED', 'Protection design']
  ];
  
  hydraulicVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'HYDRAULICS', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // PIER DESIGN VARIABLES
  const pierVars = [
    ['pierWidth', 1.5, 'm', 'Pier width across flow', 'INPUT', 'Pier design, Hydraulics'],
    ['pierLength', 4.0, 'm', 'Pier length along bridge', 'INPUT', 'Pier design'],
    ['pierDepth', 5.5, 'm', 'Pier height from bed', 'INPUT', 'Pier design'],
    ['pierHeight', 11.0, 'm', 'Total pier height (calculated)', 'CALCULATED', 'Pier design'],
    ['numberOfPiers', 7, 'nos', 'Total number of piers (calculated)', 'CALCULATED', 'All pier sheets'],
    ['pierSpacing', 10, 'm', 'Center to center spacing (calculated)', 'CALCULATED', 'Pier design'],
    ['pierShape', 'Rectangular', '', 'Pier cross-section shape', 'FIXED', 'Pier design'],
    ['pierOrientation', 0, 'degrees', 'Pier orientation angle', 'INPUT', 'Pier design'],
    ['pierBaseWidth', 3.0, 'm', 'Pier base width (flared)', 'INPUT', 'Foundation design'],
    ['pierBaseLength', 5.0, 'm', 'Pier base length (flared)', 'INPUT', 'Foundation design'],
    ['pierBaseThickness', 1.0, 'm', 'Base slab thickness', 'INPUT', 'Foundation design'],
    ['foundationDepth', 4.0, 'm', 'Foundation depth below bed', 'INPUT', 'Foundation design'],
    ['foundationType', 'Shallow', '', 'Type of foundation', 'INPUT', 'Foundation design'],
    ['pileLength', 0, 'm', 'Pile length if applicable', 'INPUT', 'Pile design'],
    ['pileDiameter', 0, 'm', 'Pile diameter', 'INPUT', 'Pile design'],
    ['numberOfPiles', 0, 'nos', 'Number of piles per pier', 'INPUT', 'Pile design'],
    ['pierCapLength', 4.5, 'm', 'Pier cap length', 'INPUT', 'Pier cap design'],
    ['pierCapWidth', 2.0, 'm', 'Pier cap width', 'INPUT', 'Pier cap design'],
    ['pierCapThickness', 0.8, 'm', 'Pier cap thickness', 'INPUT', 'Pier cap design'],
    ['bearingPadLength', 0.6, 'm', 'Bearing pad length', 'INPUT', 'Bearing design'],
    ['bearingPadWidth', 0.4, 'm', 'Bearing pad width', 'INPUT', 'Bearing design'],
    ['bearingPadThickness', 0.05, 'm', 'Bearing pad thickness', 'INPUT', 'Bearing design']
  ];
  
  pierVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'PIER DESIGN', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // DECK DESIGN VARIABLES
  const deckVars = [
    ['deckThickness', 0.25, 'm', 'Deck slab thickness', 'INPUT', 'Deck design, Loads'],
    ['deckOverhang', 0.5, 'm', 'Deck overhang beyond pier', 'INPUT', 'Deck design'],
    ['deckSpan', 10, 'm', 'Effective deck span (calculated)', 'CALCULATED', 'Deck design'],
    ['deckWidth', 7.5, 'm', 'Effective deck width', 'INPUT', 'Deck design'],
    ['haunchDepth', 0.15, 'm', 'Haunch depth at support', 'INPUT', 'Deck design'],
    ['wearingCoatThickness', 0.075, 'm', 'Wearing coat thickness', 'INPUT', 'Dead load'],
    ['deckReinforcement', 'Fe500', '', 'Deck reinforcement grade', 'INPUT', 'Deck design'],
    ['deckConcrete', 'M30', '', 'Deck concrete grade', 'INPUT', 'Deck design'],
    ['deckFinish', 'Smooth', '', 'Deck surface finish', 'INPUT', 'Deck design'],
    ['expansionJointWidth', 0.05, 'm', 'Expansion joint width', 'INPUT', 'Joint design'],
    ['railingHeight', 1.2, 'm', 'Railing height', 'INPUT', 'Railing design'],
    ['railingType', 'RCC', '', 'Type of railing', 'INPUT', 'Railing design']
  ];
  
  deckVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'DECK DESIGN', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // ABUTMENT DESIGN VARIABLES
  const abutmentVars = [
    ['abutmentType', 'TYPE1', '', 'Type (TYPE1/Gravity or C1/Cantilever)', 'INPUT', 'Abutment design'],
    ['abutmentHeight', 6.0, 'm', 'Abutment height', 'INPUT', 'Abutment design'],
    ['abutmentWidth', 0.8, 'm', 'Abutment thickness', 'INPUT', 'Abutment design'],
    ['abutmentDepth', 4.5, 'm', 'Abutment depth along bridge', 'INPUT', 'Abutment design'],
    ['numberOfAbutments', 2, 'nos', 'Number of abutments', 'FIXED', 'All abutment sheets'],
    ['type1BaseWidth', 2.3, 'm', 'TYPE1 base width (calculated)', 'CALCULATED', 'TYPE1 design'],
    ['type1BaseLength', 5.5, 'm', 'TYPE1 base length (calculated)', 'CALCULATED', 'TYPE1 design'],
    ['type1BaseThickness', 1.0, 'm', 'TYPE1 base thickness', 'INPUT', 'TYPE1 design'],
    ['type1StemWidth', 0.8, 'm', 'TYPE1 stem width', 'INPUT', 'TYPE1 design'],
    ['type1BackFill', 5.0, 'm', 'TYPE1 backfill height', 'INPUT', 'TYPE1 design'],
    ['c1BaseWidth', 4.2, 'm', 'C1 cantilever base width (calculated)', 'CALCULATED', 'C1 design'],
    ['c1BaseLength', 5.5, 'm', 'C1 cantilever base length (calculated)', 'CALCULATED', 'C1 design'],
    ['c1BaseThickness', 0.8, 'm', 'C1 base slab thickness', 'INPUT', 'C1 design'],
    ['c1StemThickness', 0.8, 'm', 'C1 stem thickness', 'INPUT', 'C1 design'],
    ['c1HeelLength', 2.5, 'm', 'C1 heel length (calculated)', 'CALCULATED', 'C1 design'],
    ['c1ToeLength', 0.9, 'm', 'C1 toe length (calculated)', 'CALCULATED', 'C1 design'],
    ['dirtWallHeight', 4.0, 'm', 'Dirt wall height', 'INPUT', 'Approach design'],
    ['returnWallLength', 8.0, 'm', 'Return wall length', 'INPUT', 'Return wall design'],
    ['returnWallHeight', 4.0, 'm', 'Return wall height', 'INPUT', 'Return wall design'],
    ['returnWallThickness', 0.3, 'm', 'Return wall thickness', 'INPUT', 'Return wall design'],
    ['approachSlabLength', 3.0, 'm', 'Approach slab length', 'INPUT', 'Approach design'],
    ['approachSlabThickness', 0.2, 'm', 'Approach slab thickness', 'INPUT', 'Approach design']
  ];
  
  abutmentVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'ABUTMENT DESIGN', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // MATERIAL PROPERTIES VARIABLES
  const materialVars = [
    ['concreteGrade', 'M30', '', 'Concrete grade', 'INPUT', 'All structural sheets'],
    ['fck', 30, 'MPa', 'Characteristic compressive strength', 'INPUT', 'All structural sheets'],
    ['fct', 2.5, 'MPa', 'Characteristic tensile strength (calculated)', 'CALCULATED', 'Design sheets'],
    ['modulusOfElasticity', 31000, 'MPa', 'Elastic modulus (calculated)', 'CALCULATED', 'Design sheets'],
    ['poissonRatio', 0.2, '-', 'Poisson\'s ratio', 'FIXED', 'Design sheets'],
    ['concreteUnitWeight', 25, 'kN/m³', 'Unit weight of concrete', 'FIXED', 'Load calculations'],
    ['concreteCover', 50, 'mm', 'Concrete cover', 'INPUT', 'Reinforcement design'],
    ['shrinkageStrain', 0.0003, '-', 'Shrinkage strain', 'FIXED', 'Long-term effects'],
    ['creepCoefficient', 2.0, '-', 'Creep coefficient', 'FIXED', 'Long-term effects'],
    ['steelGrade', 'Fe500', '', 'Steel grade', 'INPUT', 'Reinforcement design'],
    ['fy', 500, 'MPa', 'Yield strength', 'INPUT', 'Reinforcement design'],
    ['fu', 545, 'MPa', 'Ultimate strength (calculated)', 'CALCULATED', 'Reinforcement design'],
    ['es', 200000, 'MPa', 'Elastic modulus of steel', 'FIXED', 'Design calculations'],
    ['steelUnitWeight', 78.5, 'kN/m³', 'Unit weight of steel', 'FIXED', 'Weight calculations'],
    ['mainBarDiameter', 25, 'mm', 'Main reinforcement diameter', 'INPUT', 'Reinforcement design'],
    ['mainBarSpacing', 150, 'mm', 'Main bar spacing', 'INPUT', 'Reinforcement design'],
    ['linkBarDiameter', 10, 'mm', 'Link/stirrup diameter', 'INPUT', 'Reinforcement design'],
    ['linkBarSpacing', 150, 'mm', 'Link spacing', 'INPUT', 'Reinforcement design'],
    ['numberOfBars', 16, 'nos', 'Number of reinforcement bars (calculated)', 'CALCULATED', 'Reinforcement design'],
    ['barLength', 12, 'm', 'Standard bar length', 'FIXED', 'Reinforcement design'],
    ['anchorageLength', 600, 'mm', 'Anchorage length (calculated)', 'CALCULATED', 'Reinforcement design'],
    ['lapLength', 900, 'mm', 'Lap splice length (calculated)', 'CALCULATED', 'Reinforcement design']
  ];
  
  materialVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'MATERIALS', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // SOIL PROPERTIES VARIABLES
  const soilVars = [
    ['sbc', 200, 'kPa', 'Safe Bearing Capacity', 'INPUT', 'Foundation design'],
    ['ultimateBearingCapacity', 500, 'kPa', 'Ultimate bearing capacity (calculated)', 'CALCULATED', 'Foundation design'],
    ['allowableBearingPressure', 200, 'kPa', 'Allowable bearing pressure', 'INPUT', 'Foundation design'],
    ['phi', 32, 'degrees', 'Angle of internal friction', 'INPUT', 'Earth pressure, Stability'],
    ['cohesion', 0, 'kPa', 'Soil cohesion', 'INPUT', 'Earth pressure'],
    ['gamma', 19, 'kN/m³', 'Unit weight of soil', 'INPUT', 'Earth pressure, Loads'],
    ['gammaSat', 20, 'kN/m³', 'Saturated unit weight', 'INPUT', 'Submerged conditions'],
    ['gammaSubmerged', 10, 'kN/m³', 'Submerged unit weight (calculated)', 'CALCULATED', 'Submerged conditions'],
    ['soilType', 'Sandy', '', 'Type of soil', 'INPUT', 'Design parameters'],
    ['plasticityIndex', 15, '%', 'Plasticity index', 'INPUT', 'Soil classification'],
    ['liquidLimit', 35, '%', 'Liquid limit', 'INPUT', 'Soil classification'],
    ['plasticLimit', 20, '%', 'Plastic limit', 'INPUT', 'Soil classification'],
    ['ka', 0.307, '-', 'Active earth pressure coefficient (calculated)', 'CALCULATED', 'Earth pressure'],
    ['kp', 3.255, '-', 'Passive earth pressure coefficient (calculated)', 'CALCULATED', 'Earth pressure'],
    ['ko', 0.470, '-', 'At-rest earth pressure coefficient (calculated)', 'CALCULATED', 'Earth pressure'],
    ['wallFrictionAngle', 21.3, 'degrees', 'Wall friction angle (calculated)', 'CALCULATED', 'Earth pressure'],
    ['backfillAngle', 0, 'degrees', 'Backfill slope angle', 'INPUT', 'Earth pressure'],
    ['surchargeLoad', 12, 'kN/m²', 'Surcharge load', 'INPUT', 'Earth pressure']
  ];
  
  soilVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'SOIL PROPERTIES', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // SEISMIC DESIGN VARIABLES
  const seismicVars = [
    ['seismicZone', 'III', '', 'Seismic zone', 'INPUT', 'Seismic analysis'],
    ['seismicCoefficient', 0.12, '-', 'Horizontal seismic coefficient', 'INPUT', 'Seismic analysis'],
    ['verticalSeismicCoeff', 0.06, '-', 'Vertical seismic coefficient (calculated)', 'CALCULATED', 'Seismic analysis'],
    ['importanceFactor', 1.5, '-', 'Importance factor', 'INPUT', 'Seismic analysis'],
    ['responseFactor', 3.0, '-', 'Response reduction factor', 'INPUT', 'Seismic analysis'],
    ['soilTypeSeismic', 'Medium', '', 'Soil type for seismic analysis', 'INPUT', 'Seismic analysis'],
    ['fundamentalPeriod', 0.8, 'seconds', 'Fundamental period (calculated)', 'CALCULATED', 'Seismic analysis'],
    ['designAcceleration', 0.18, 'g', 'Design acceleration (calculated)', 'CALCULATED', 'Seismic analysis']
  ];
  
  seismicVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'SEISMIC DESIGN', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // LOADING VARIABLES
  const loadVars = [
    ['deckDeadLoad', 6.25, 'kN/m²', 'Deck slab dead load (calculated)', 'CALCULATED', 'Load calculations'],
    ['wearingCoatLoad', 1.88, 'kN/m²', 'Wearing coat load (calculated)', 'CALCULATED', 'Load calculations'],
    ['railingLoad', 2.0, 'kN/m', 'Railing load', 'FIXED', 'Load calculations'],
    ['utilityLoad', 1.0, 'kN/m', 'Utility load', 'INPUT', 'Load calculations'],
    ['pierSelfWeight', 825, 'kN', 'Pier self weight (calculated)', 'CALCULATED', 'Pier design'],
    ['abutmentSelfWeight', 432, 'kN', 'Abutment self weight (calculated)', 'CALCULATED', 'Abutment design'],
    ['liveLoadClass', 'A', '', 'Live load class', 'INPUT', 'Live load analysis'],
    ['liveLoadIntensity', 5.7, 'kN/m²', 'Live load intensity', 'FIXED', 'Live load analysis'],
    ['impactFactor', 0.281, '-', 'Impact factor (calculated)', 'CALCULATED', 'Live load analysis'],
    ['distributionFactor', 0.8, '-', 'Load distribution factor (calculated)', 'CALCULATED', 'Live load analysis'],
    ['reductionFactor', 1.0, '-', 'Live load reduction factor', 'FIXED', 'Live load analysis'],
    ['wheelLoad', 57, 'kN', 'Concentrated wheel load', 'FIXED', 'Live load analysis'],
    ['axleLoad', 114, 'kN', 'Axle load', 'FIXED', 'Live load analysis'],
    ['vehicleLength', 15, 'm', 'Vehicle length', 'FIXED', 'Live load analysis'],
    ['vehicleWidth', 2.5, 'm', 'Vehicle width', 'FIXED', 'Live load analysis'],
    ['windPressure', 1.5, 'kN/m²', 'Wind pressure', 'INPUT', 'Wind load analysis'],
    ['windSpeed', 47, 'm/s', 'Design wind speed', 'INPUT', 'Wind load analysis'],
    ['temperatureRange', 30, '°C', 'Temperature variation', 'INPUT', 'Thermal analysis'],
    ['thermalCoefficient', 0.000012, '/°C', 'Coefficient of thermal expansion', 'FIXED', 'Thermal analysis'],
    ['hydrostaticPressure', 52, 'kN/m²', 'Hydrostatic pressure (calculated)', 'CALCULATED', 'Water forces'],
    ['buoyantForce', 0, 'kN', 'Buoyant force (calculated)', 'CALCULATED', 'Water forces'],
    ['dragForce', 180, 'kN', 'Drag force (calculated)', 'CALCULATED', 'Water forces'],
    ['dragCoefficient', 0.66, '-', 'Drag coefficient', 'FIXED', 'Water forces'],
    ['waterCurrentVelocity', 2.8, 'm/s', 'Water current velocity', 'CALCULATED', 'Water forces']
  ];
  
  loadVars.forEach(([name, value, unit, desc, type, usage]) => {
    const row = ws.addRow([sno++, 'LOADING', name, value, unit, desc, type, usage]);
    if (type === 'INPUT') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    } else if (type === 'CALCULATED') {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    } else {
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
    }
  });
  
  // Add instructions at the top
  ws.insertRow(1, ['INSTRUCTIONS FOR VARIABLE SELECTION']);
  ws.insertRow(2, ['1. RED rows = Variables you can make USER INPUTS (delete these rows to make them inputs)']);
  ws.insertRow(3, ['2. GREEN rows = Variables that will be CALCULATED automatically']);
  ws.insertRow(4, ['3. YELLOW rows = Variables that are FIXED values']);
  ws.insertRow(5, ['4. Keep rows for variables that should remain fixed/calculated']);
  ws.insertRow(6, ['5. Delete rows for variables you want users to input']);
  ws.insertRow(7, ['']);
  
  // Format instruction rows
  for (let i = 1; i <= 6; i++) {
    ws.getRow(i).font = { bold: true, size: 12 };
    if (i === 2) ws.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } };
    if (i === 3) ws.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFE6' } };
    if (i === 4) ws.getRow(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE6' } };
  }
  
  // Save the file
  await workbook.xlsx.writeFile(variableSheetPath);
  
  console.log('✅ Variable Selection Sheet Created!');
  console.log('📊 File:', variableSheetPath);
  console.log('📋 Total Variables: ' + (sno - 1));
  console.log('');
  console.log('🎯 INSTRUCTIONS:');
  console.log('1. Open VARIABLE_SELECTION_SHEET.xlsx');
  console.log('2. Review all variables with their default values');
  console.log('3. DELETE rows for variables you want as USER INPUTS');
  console.log('4. KEEP rows for variables that should be fixed/calculated');
  console.log('5. The remaining variables will be your final input set');
  console.log('');
  console.log('🔍 COLOR CODING:');
  console.log('   🔴 RED = Potential user inputs (delete to make input)');
  console.log('   🟢 GREEN = Auto-calculated values');
  console.log('   🟡 YELLOW = Fixed constants');
}

// Run the function
createVariableSelectionSheet().catch(console.error);