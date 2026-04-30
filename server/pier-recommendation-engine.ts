import type { PierTemplateType } from './pier-case-engine';

export interface PierMasterVariables {
  pierType?: PierTemplateType;
  height: number;
  width: number;
  length: number;
  numberOfColumns: number;
  stemThickness: number;
  capBeamWidth: number;
  capBeamDepth: number;
  foundationType: 'open' | 'pile' | 'raft' | 'well';
  seismicZone: 'II' | 'III' | 'IV' | 'V';
  windZone: 'low' | 'moderate' | 'high' | 'very-high';
  bearingType: 'elastomeric' | 'pot-ptfe' | 'spherical' | 'fixed';
  skewAngle: number;
  roadWidth: number;
  spanLength: number;
  crossingType: 'river' | 'road-over-road' | 'rail-over-road' | 'viaduct';
  concreteGrade: string;
  steelGrade: string;
  clearCover: number;
  reinforcementPreference: 'economy' | 'balanced' | 'heavy-duty';
  ircIsLoadClass: 'IRC-CLASS-A' | 'IRC-70R' | 'IRC-SV' | 'NHAI-SPECIAL';
}

export interface PierRecommendation {
  recommendedType: PierTemplateType;
  confidence: number;
  reasons: string[];
  warnings: string[];
  stabilityHints: string[];
}

export const PIER_MASTER_SCHEMA = {
  type: 'object',
  required: [
    'height',
    'width',
    'length',
    'numberOfColumns',
    'stemThickness',
    'capBeamWidth',
    'capBeamDepth',
    'foundationType',
    'seismicZone',
    'windZone',
    'bearingType',
    'skewAngle',
    'roadWidth',
    'spanLength',
    'crossingType',
    'concreteGrade',
    'steelGrade',
    'clearCover',
    'reinforcementPreference',
    'ircIsLoadClass',
  ],
  properties: {
    pierType: { type: 'string' },
    height: { type: 'number', minimum: 1 },
    width: { type: 'number', minimum: 0.5 },
    length: { type: 'number', minimum: 0.5 },
    numberOfColumns: { type: 'integer', minimum: 1, maximum: 8 },
    stemThickness: { type: 'number', minimum: 0.2 },
    capBeamWidth: { type: 'number', minimum: 0.3 },
    capBeamDepth: { type: 'number', minimum: 0.3 },
    foundationType: { type: 'string', enum: ['open', 'pile', 'raft', 'well'] },
    seismicZone: { type: 'string', enum: ['II', 'III', 'IV', 'V'] },
    windZone: { type: 'string', enum: ['low', 'moderate', 'high', 'very-high'] },
    bearingType: { type: 'string', enum: ['elastomeric', 'pot-ptfe', 'spherical', 'fixed'] },
    skewAngle: { type: 'number', minimum: 0, maximum: 60 },
    roadWidth: { type: 'number', minimum: 3 },
    spanLength: { type: 'number', minimum: 3, maximum: 80 },
    crossingType: { type: 'string', enum: ['river', 'road-over-road', 'rail-over-road', 'viaduct'] },
    concreteGrade: { type: 'string' },
    steelGrade: { type: 'string' },
    clearCover: { type: 'number', minimum: 25, maximum: 100 },
    reinforcementPreference: { type: 'string', enum: ['economy', 'balanced', 'heavy-duty'] },
    ircIsLoadClass: { type: 'string', enum: ['IRC-CLASS-A', 'IRC-70R', 'IRC-SV', 'NHAI-SPECIAL'] },
  },
};

function addWarning(warnings: string[], cond: boolean, msg: string): void {
  if (cond) warnings.push(msg);
}

export function recommendPierType(v: PierMasterVariables): PierRecommendation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const stabilityHints: string[] = [];

  const slenderness = v.height / Math.max(v.width, 0.001);
  addWarning(warnings, slenderness > 8, 'High slenderness ratio; add stiffness or increase section.');
  addWarning(warnings, v.seismicZone === 'V' && v.foundationType === 'open', 'Zone V with open footing is risky; check dynamic soil-structure interaction.');
  addWarning(warnings, v.skewAngle > 25, 'High skew angle; verify torsion and bearing eccentricity.');
  addWarning(warnings, v.windZone === 'very-high' && v.height > 12, 'Tall pier in very-high wind zone; verify vortex and serviceability drift.');

  let recommendedType: PierTemplateType = 'single-column';
  let confidence = 0.75;

  if (v.crossingType === 'viaduct' && v.height >= 15) {
    recommendedType = 'tall-viaduct';
    reasons.push('Viaduct crossing with tall pier height prefers viaduct-type pier system.');
    confidence = 0.9;
  } else if (v.numberOfColumns >= 2 && v.spanLength >= 18) {
    recommendedType = 'twin-column';
    reasons.push('Two-column arrangement improves transverse stiffness for medium/long spans.');
    confidence = 0.86;
  } else if (v.spanLength >= 30 && (v.windZone === 'high' || v.seismicZone === 'V')) {
    recommendedType = 'portal';
    reasons.push('Long span with high lateral demand benefits from portal action.');
    confidence = 0.82;
  } else if (v.foundationType === 'pile' && v.crossingType === 'river') {
    recommendedType = 'pile-cap-supported';
    reasons.push('River crossing with pile foundation naturally maps to pile-cap-supported pier.');
    confidence = 0.88;
  } else if (v.width / Math.max(v.length, 0.001) > 1.8) {
    recommendedType = 'wall';
    reasons.push('Wide section ratio indicates wall-type pier behavior.');
    confidence = 0.8;
  } else if (v.pierType) {
    recommendedType = v.pierType;
    reasons.push('User-selected pier type kept as governing preference.');
    confidence = 0.78;
  } else {
    reasons.push('Defaulted to single-column based on moderate geometry and loading context.');
  }

  if (v.foundationType === 'open') stabilityHints.push('Check base pressure envelope: qmax <= SBC, qmin >= 0.');
  if (v.foundationType === 'pile') stabilityHints.push('Check group efficiency, lateral pile deflection, and cap shear.');
  if (v.seismicZone === 'IV' || v.seismicZone === 'V') stabilityHints.push('Run ductility detailing and capacity design checks for plastic hinge zones.');
  if (v.bearingType !== 'fixed') stabilityHints.push('Check bearing seat length and seismic stopper requirements.');
  stabilityHints.push('Run minimum longitudinal/transverse steel checks as per IRC/IS detailing clauses.');
  stabilityHints.push('Run sliding, overturning, and serviceability drift checks for governing combinations.');

  return { recommendedType, confidence, reasons, warnings, stabilityHints };
}
