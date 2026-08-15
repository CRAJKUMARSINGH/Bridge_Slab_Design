import type { PierTemplateType } from './pier-case-engine';
import type { PierMasterVariables } from './pier-recommendation-engine';

export interface PierGeneratedPayload {
  selectedTemplate: PierTemplateType;
  geometry: Record<string, number | string>;
  reinforcement: {
    longitudinalBarDiaMm: number;
    longitudinalBarCount: number;
    tieBarDiaMm: number;
    tieSpacingMm: number;
    clearCoverMm: number;
  };
  foundation: {
    type: string;
    widthM: number;
    lengthM: number;
    depthM: number;
    pileCount?: number;
  };
  quantities: {
    concreteM3: number;
    steelKg: number;
    formworkM2: number;
  };
  boq: Array<{ item: string; qty: number; unit: string }>;
  bbs: Array<{ mark: string; diaMm: number; count: number; lengthM: number; weightKg: number }>;
  notes: string[];
  designSummary: string;
}

const densitySteelKgPerM3 = 7850;

function round(v: number, d = 2): number {
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
}

function selectTemplate(v: PierMasterVariables): PierTemplateType {
  if (v.pierType && v.pierType !== 'unknown') return v.pierType;
  if (v.crossingType === 'viaduct' && v.height >= 15) return 'tall-viaduct';
  if (v.numberOfColumns >= 2) return 'twin-column';
  if (v.foundationType === 'pile') return 'pile-cap-supported';
  return 'single-column';
}

function templateFactors(t: PierTemplateType): { steelFactor: number; concreteFactor: number } {
  switch (t) {
    case 'twin-column':
      return { steelFactor: 1.2, concreteFactor: 1.1 };
    case 'wall':
      return { steelFactor: 1.1, concreteFactor: 1.25 };
    case 'hammerhead':
      return { steelFactor: 1.25, concreteFactor: 1.15 };
    case 'portal':
      return { steelFactor: 1.35, concreteFactor: 1.3 };
    case 'tall-viaduct':
      return { steelFactor: 1.45, concreteFactor: 1.2 };
    case 'circular':
      return { steelFactor: 1.15, concreteFactor: 1.05 };
    case 'hollow':
      return { steelFactor: 1.3, concreteFactor: 0.8 };
    case 'pile-cap-supported':
      return { steelFactor: 1.25, concreteFactor: 1.2 };
    case 'open-foundation':
      return { steelFactor: 1.05, concreteFactor: 1.15 };
    default:
      return { steelFactor: 1.0, concreteFactor: 1.0 };
  }
}

export function generatePierPayload(v: PierMasterVariables): PierGeneratedPayload {
  const t = selectTemplate(v);
  const f = templateFactors(t);

  const pierArea = v.width * v.length;
  const pierConcrete = pierArea * v.height * f.concreteFactor;
  const footingWidth = v.width + 1.5;
  const footingLength = v.length + 1.5;
  const footingDepth = v.foundationType === 'pile' ? 1.8 : 1.2;
  const footingConcrete = footingWidth * footingLength * footingDepth;
  const concreteM3 = round(pierConcrete + footingConcrete);

  const steelRatio = (v.seismicZone === 'V' ? 0.018 : 0.014) * f.steelFactor;
  const steelKg = round(concreteM3 * steelRatio * densitySteelKgPerM3);
  const formworkM2 = round((2 * (v.width + v.length) * v.height + footingWidth * footingLength) * 0.9);

  const longBarDia = v.seismicZone === 'V' ? 25 : 20;
  const longBarCount = Math.max(8, Math.ceil((v.width + v.length) * 4));
  const tieDia = 12;
  const tieSpacing = v.seismicZone === 'V' ? 100 : 150;

  const bbsMainLen = round(v.height + 1.2, 3);
  const wtPerM = round((Math.PI * Math.pow(longBarDia / 1000, 2) / 4) * densitySteelKgPerM3, 3);
  const mainWeight = round(longBarCount * bbsMainLen * wtPerM);
  const tieCount = Math.ceil((v.height * 1000) / tieSpacing);
  const tieLen = round(2 * (v.width + v.length) + 0.4, 3);
  const tieWtPerM = round((Math.PI * Math.pow(tieDia / 1000, 2) / 4) * densitySteelKgPerM3, 3);
  const tieWeight = round(tieCount * tieLen * tieWtPerM);

  const notes = [
    `Template selected: ${t}.`,
    `Auto-updated from master inputs (H=${v.height}m, W=${v.width}m, L=${v.length}m, columns=${v.numberOfColumns}).`,
    'Verify slenderness, seismic detailing zones, and bearing seat check before issue.',
    'BOQ/BBS is preliminary parametric output; final IFC issue must pass project checker.',
  ];

  return {
    selectedTemplate: t,
    geometry: {
      heightM: v.height,
      widthM: v.width,
      lengthM: v.length,
      columns: v.numberOfColumns,
      capBeamWidthM: v.capBeamWidth,
      capBeamDepthM: v.capBeamDepth,
      skewAngleDeg: v.skewAngle,
    },
    reinforcement: {
      longitudinalBarDiaMm: longBarDia,
      longitudinalBarCount: longBarCount,
      tieBarDiaMm: tieDia,
      tieSpacingMm: tieSpacing,
      clearCoverMm: v.clearCover,
    },
    foundation: {
      type: v.foundationType,
      widthM: round(footingWidth),
      lengthM: round(footingLength),
      depthM: footingDepth,
      pileCount: v.foundationType === 'pile' ? Math.max(4, v.numberOfColumns * 4) : undefined,
    },
    quantities: { concreteM3, steelKg, formworkM2 },
    boq: [
      { item: 'PCC / RCC Concrete for Pier + Foundation', qty: concreteM3, unit: 'm3' },
      { item: 'Reinforcement Steel', qty: steelKg, unit: 'kg' },
      { item: 'Formwork', qty: formworkM2, unit: 'm2' },
    ],
    bbs: [
      { mark: 'P1-MAIN', diaMm: longBarDia, count: longBarCount, lengthM: bbsMainLen, weightKg: mainWeight },
      { mark: 'P1-TIES', diaMm: tieDia, count: tieCount, lengthM: tieLen, weightKg: tieWeight },
    ],
    notes,
    designSummary: `Parametric ${t} pier generated for span ${v.spanLength}m and ${v.ircIsLoadClass} loading with ${v.foundationType} foundation.`,
  };
}
