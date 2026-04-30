/**
 * Deck serviceability narratives (Sheets 46–50) — numbers aligned with IRC 21 strip / IS 456 checks.
 * Uses the same `designIRCSlab` engine as the web report (`client/src/report-engine/lib/ircSlabCalc.ts`).
 */

import type { ProjectInput } from '../types';
import {
  designIRCSlab,
  type ConcreteGrade,
  type IRCSlabInputs,
  type IRCSlabResult,
  type SteelGrade,
} from '../../client/src/report-engine/lib/ircSlabCalc.ts';

const CONCRETE: ConcreteGrade[] = ['M15', 'M20', 'M25', 'M30', 'M35', 'M40'];
const STEEL: SteelGrade[] = ['Fe250', 'Fe415', 'Fe500', 'Fe550'];

function parseConcrete(g: string | undefined): ConcreteGrade {
  const u = (g ?? 'M30').toUpperCase();
  return (CONCRETE.includes(u as ConcreteGrade) ? u : 'M30') as ConcreteGrade;
}

function parseSteel(g: string | undefined): SteelGrade {
  const u = (g ?? 'Fe500').toUpperCase();
  return (STEEL.includes(u as SteelGrade) ? u : 'Fe500') as SteelGrade;
}

/** Deck thickness (mm): Span/15 rounded to 50 mm, clamped — typical solid slab bridge proportioning for narrative audit. */
function deckThicknessMm(inp: ProjectInput): number {
  const spanM = inp.spanLength || 1;
  return Math.min(1200, Math.max(350, Math.round(((spanM * 1000) / 15 / 50)) * 50));
}

export function ircSlabInputsFromProject(inp: ProjectInput): IRCSlabInputs {
  const wc = 75;
  return {
    slabName: inp.projectName || 'Deck slab',
    concreteGrade: parseConcrete(inp.concreteGrade),
    steelGrade: parseSteel(inp.steelGrade),
    clearSpan: inp.spanLength,
    supportWidth: 0.45,
    slabThickness: deckThicknessMm(inp),
    wearingCoatThickness: wc,
    carriagewayWidth: inp.carriageWidth,
    footpathWidth: 0,
    cover: 40,
    barDia: 20,
    a1: 3.6,
    b1: 0.85,
    b2: 1.2,
    totalLiveLoad: 700,
    concreteUW: 24,
    wearingCoatUW: 22,
    impactMethod: 'irc6',
  };
}

export interface DeckNarrativeBundle {
  inputs: IRCSlabInputs;
  slab: IRCSlabResult;
  punching: {
    vuKn: number;
    uPerimeterM: number;
    tauPdNmm2: number;
    tauLimNmm2: number;
    ok: boolean;
  };
  deflection: {
    spanDepth: number;
    basicLimit: number;
    modFactor: number;
    permissible: number;
    ok: boolean;
  };
  bearing: {
    reactionKn: number;
    padLengthMm: number;
    padWidthMm: number;
    compressiveNmm2: number;
    allowableNmm2: number;
    ok: boolean;
  };
  expansion: {
    deckLengthM: number;
    thermalMm: number;
    shrinkCreepMm: number;
    designGapMm: number;
    ok: boolean;
  };
}

function punchingFromSlab(s: IRCSlabResult): DeckNarrativeBundle['punching'] {
  const dM = s.effectiveDepth / 1000;
  const a = s.dispersedLength;
  const b = s.dispersedWidthBw;
  // Critical perimeter at ~d from load periphery (rectangular footprint), IS 456 Cl.31.6 style audit.
  const u = 2 * (a + b + 4 * dM);
  const vuKn = s.totalLiveLoadWithImpact;
  const tauPdNmm2 = vuKn / (u * dM * 1000);
  const tauLimNmm2 = Math.min(0.32 * Math.sqrt(s.fck), s.tauC * 1.35);
  const ok = tauPdNmm2 <= tauLimNmm2;
  return { vuKn, uPerimeterM: u, tauPdNmm2, tauLimNmm2, ok };
}

function deflectionFromSlab(s: IRCSlabResult): DeckNarrativeBundle['deflection'] {
  const spanDepth = (s.effectiveSpan * 1000) / s.effectiveDepth;
  const basicLimit = 26;
  const pt = (s.providedSteel * 100) / (1000 * s.effectiveDepth);
  const modFactor = Math.min(2, 1.05 + 0.35 * Math.min(pt / 0.6, 1));
  const permissible = basicLimit * modFactor;
  const ok = spanDepth <= permissible;
  return { spanDepth, basicLimit, modFactor, permissible, ok };
}

function bearingFromSlab(s: IRCSlabResult): DeckNarrativeBundle['bearing'] {
  const reactionKn = s.shearForce;
  const allowableNmm2 = 10;
  const padLengthMm = 450;
  const areaNeedMm2 = (reactionKn * 1000) / allowableNmm2;
  let padWidthMm = Math.ceil(areaNeedMm2 / padLengthMm / 50) * 50;
  padWidthMm = Math.max(200, Math.min(900, padWidthMm));
  const compressiveNmm2 = (reactionKn * 1000) / (padLengthMm * padWidthMm);
  const ok = compressiveNmm2 <= allowableNmm2;
  return { reactionKn, padLengthMm, padWidthMm, compressiveNmm2, allowableNmm2, ok };
}

function expansionFromProject(inp: ProjectInput): DeckNarrativeBundle['expansion'] {
  const deckLengthM =
    inp.totalLength > 0 ? inp.totalLength : inp.numberOfSpans * inp.spanLength;
  const deltaT = 30;
  const thermalMm = 12e-6 * deltaT * deckLengthM * 1000;
  const shrinkCreepMm = 0.00025 * deckLengthM * 1000;
  const designGapMm = Math.ceil((thermalMm * 1.1 + shrinkCreepMm + 15) / 5) * 5;
  const ok = designGapMm >= 20 && designGapMm <= 160;
  return { deckLengthM, thermalMm, shrinkCreepMm, designGapMm, ok };
}

export function computeDeckNarrativeBundle(inp: ProjectInput): DeckNarrativeBundle {
  const inputs = ircSlabInputsFromProject(inp);
  const slab = designIRCSlab(inputs);
  return {
    inputs,
    slab,
    punching: punchingFromSlab(slab),
    deflection: deflectionFromSlab(slab),
    bearing: bearingFromSlab(slab),
    expansion: expansionFromProject(inp),
  };
}
