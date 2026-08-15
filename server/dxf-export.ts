/**
 * DXF Export — Professional AutoCAD-Compatible Bridge Drawing Engine
 * ══════════════════════════════════════════════════════════════════════
 * Generates a multi-view DXF with proper entity handles, layers, linetypes,
 * hatch patterns, dimension entities, and title block.
 *
 * Views: Elevation (side) + Plan (top) + Cross-Section
 * Supports: Submersible and High-Level slab bridges.
 *
 * DXF version: AC1021 (R2010) or AC1018 (R2007) — configurable.
 * Reference: Bridge_GAD_Yogendra_Borse-main/generate_bridge_demo.py patterns.
 */

import type { EnhancedProjectInput } from '../bridge-excel-generator/types';

// ── Configuration ─────────────────────────────────────────────────────────────

export type DxfCompatibilityProfile = {
  acadVersion: 'AC1018' | 'AC1021';
  includeHatch: boolean;
  units: 'm' | 'mm';
  includeXSection: boolean;
  includeTitleBlock: boolean;
};

const DEFAULT_PROFILE: DxfCompatibilityProfile = {
  acadVersion: 'AC1021',
  includeHatch: true,
  units: 'm',
  includeXSection: true,
  includeTitleBlock: true,
};

// ── Handle Registry ───────────────────────────────────────────────────────────

class HandleRegistry {
  private next = 0x100;
  next_handle(): string {
    return (this.next++).toString(16).toUpperCase();
  }
}

// ── DXF Number Formatting ─────────────────────────────────────────────────────

function dN(v: number): string {
  if (!Number.isFinite(v)) return '0.0';
  return Number(v.toFixed(6)).toString();
}

// ── DXF Sanitisation ──────────────────────────────────────────────────────────

const DXF_MAX_LAYER = 31;

function layerSafe(name: string): string {
  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (cleaned || '0').slice(0, DXF_MAX_LAYER);
}

function textSafe(t: string): string {
  return t
    .replace(/\r?\n/g, ' ')
    .replace(/\^/g, '')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u00B2/g, '2')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

// ── ACI Colour Palette ────────────────────────────────────────────────────────
// Standard AutoCAD Color Index values used for layer definitions.

const ACI = {
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
  CYAN: 4,
  BLUE: 5,
  MAGENTA: 6,
  WHITE: 7,
  GRAY: 8,
  BROWN: 30,
  DARK_BROWN: 32,
  ORANGE: 40,
  EARTH: 42,
  LIGHT_BLUE: 150,
  HATCH_GRAY: 253,
} as const;

// ── Layer Definitions ─────────────────────────────────────────────────────────

interface LayerDef {
  name: string;
  color: number;
  linetype: string;
  lineweight: number; // 1/100th mm: 25 = 0.25mm, 50 = 0.50mm
  description: string;
}

const LAYERS: LayerDef[] = [
  { name: '0',           color: ACI.WHITE,      linetype: 'CONTINUOUS', lineweight: 25,  description: 'Default' },
  { name: 'S-DECK',      color: ACI.CYAN,       linetype: 'CONTINUOUS', lineweight: 50,  description: 'Deck slab outline' },
  { name: 'S-PIER',      color: ACI.GREEN,      linetype: 'CONTINUOUS', lineweight: 50,  description: 'Pier body' },
  { name: 'S-ABUT',      color: ACI.BLUE,       linetype: 'CONTINUOUS', lineweight: 50,  description: 'Abutments' },
  { name: 'S-FNDTN',     color: ACI.YELLOW,     linetype: 'HIDDEN',    lineweight: 35,  description: 'Foundation/footing' },
  { name: 'S-BEARING',   color: ACI.MAGENTA,    linetype: 'CONTINUOUS', lineweight: 30,  description: 'Bearing pads' },
  { name: 'S-PIERCAP',   color: ACI.GREEN,      linetype: 'CONTINUOUS', lineweight: 40,  description: 'Pier cap' },
  { name: 'S-KERB',      color: ACI.GRAY,       linetype: 'CONTINUOUS', lineweight: 25,  description: 'Kerbs and railing' },
  { name: 'A-GRID',      color: ACI.GRAY,       linetype: 'CENTER',    lineweight: 15,  description: 'Grid/centre lines' },
  { name: 'A-DIM',       color: ACI.RED,        linetype: 'CONTINUOUS', lineweight: 18,  description: 'Dimensions' },
  { name: 'A-TEXT',       color: ACI.WHITE,      linetype: 'CONTINUOUS', lineweight: 18,  description: 'General text' },
  { name: 'A-TITLE',     color: ACI.WHITE,      linetype: 'CONTINUOUS', lineweight: 25,  description: 'Title block' },
  { name: 'G-NGL',       color: ACI.BROWN,      linetype: 'DASHED',    lineweight: 25,  description: 'Natural Ground Level' },
  { name: 'G-HFL',       color: ACI.LIGHT_BLUE, linetype: 'DASHED',    lineweight: 25,  description: 'High Flood Level' },
  { name: 'G-BED',       color: ACI.DARK_BROWN, linetype: 'CONTINUOUS', lineweight: 25, description: 'Bed level' },
  { name: 'H-CONC',      color: ACI.HATCH_GRAY, linetype: 'CONTINUOUS', lineweight: 15,  description: 'Concrete hatch' },
  { name: 'H-EARTH',     color: ACI.EARTH,      linetype: 'CONTINUOUS', lineweight: 15,  description: 'Earth fill hatch' },
  { name: 'X-REBAR',     color: ACI.RED,        linetype: 'CONTINUOUS', lineweight: 18,  description: 'Reinforcement' },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

export function generateBridgeDXF(
  input: EnhancedProjectInput,
  profile: Partial<DxfCompatibilityProfile> = {},
): string {
  const cfg: DxfCompatibilityProfile = { ...DEFAULT_PROFILE, ...profile };
  const H = new HandleRegistry();
  const S_SCALE = cfg.units === 'mm' ? 1000 : 1;

  // ── Extract Design Variables ──────────────────────────────────────────────
  const {
    totalLength: _L, spanLength: _S, carriageWidth: _cW,
    hfl: _hfl, ofl: _ofl, nbl: _nbl, bedLevel: _bed,
    agl: _agl, skew = 0, projectName, location,
    concreteGrade, steelGrade, numberOfSpans: nS, numberOfPiers: nP,
    crossSectionData = [],
  } = input;

  // Scale all geometry variables up front
  const L = _L * S_SCALE;
  const S = _S * S_SCALE;
  const cW = _cW * S_SCALE;
  const hfl = _hfl * S_SCALE;
  const bed = _bed * S_SCALE;
  const agl = _agl * S_SCALE;
  const rtl = (input.rtl ?? _agl + 4) * S_SCALE;
  const foundationLevel = (input.foundationLevel ?? _agl - 4) * S_SCALE;
  const deckThk = (input.deckSlabThickness ?? 0.25) * S_SCALE;
  const soffitLevel = (input.hydraulics?.soffitLevel ?? (_L * S_SCALE - deckThk / S_SCALE)) * S_SCALE; // Scaled

  const skewRad = (skew * Math.PI) / 180;
  const tanSkew = Math.tan(skewRad);
  const shiftFull = cW * tanSkew;

  // Pier dimensions from design results or inputs
  const pierW = (input.pier?.geometry.width ?? input.pierWidth ?? 1.2) * S_SCALE;
  const pierL = (input.pier?.geometry.length ?? input.pierLength ?? 3.6) * S_SCALE;
  const pierD = (input.pier?.geometry.depth ?? input.pierDepth ?? 3.0) * S_SCALE;
  const pierCapW = (input.pier?.pierCap.width ?? (input.pierWidth ?? 1.2) + 0.6) * S_SCALE;
  const pierCapT = (input.pier?.pierCap.thickness ?? 0.8) * S_SCALE;
  const pierBaseW = (input.pier?.footing.width ?? input.pierBaseWidth ?? 3.0) * S_SCALE;
  const pierBaseL = (input.pier?.footing.length ?? input.pierBaseLength ?? 5.0) * S_SCALE;
  const pierBaseT = (input.pier?.footing.thickness ?? 1.0) * S_SCALE;

  // Abutment dimensions
  const abtH = (input.abutmentType1?.geometry.height ?? input.abutmentHeight ?? 4.0) * S_SCALE;
  const abtW = (input.abutmentType1?.geometry.width ?? input.abutmentWidth ?? 1.5) * S_SCALE;
  const abtBaseW = (input.abutmentType1?.geometry.baseWidth ?? (input.abutmentWidth ?? 1.5) + 1.5) * S_SCALE;
  const dirtWallH = (input.abutmentType1?.geometry.dirtWallHeight ?? input.dirtWallHeight ?? 0.6) * S_SCALE;

  // High-level vs submersible detection
  const isHighLevel = (input.bridgeType === 'high-level');
  /** Policy freeboard (above HFL) */
  const freeboardAboveHfl = (input.hydraulics?.freeboardAboveHfl ?? 1.2) * S_SCALE;
  /** Vertical clearance above DWL (HFL + afflux) */
  const freeboardAboveDwl = (input.hydraulics?.freeboard ?? (soffitLevel / S_SCALE - hfl / S_SCALE)) * S_SCALE;

  // Kerb dimensions
  const kerbW = 0.45 * S_SCALE;
  const kerbH = 0.225 * S_SCALE;
  const wearingCoat = 0.075 * S_SCALE;
  
  // Scour and Foundation Parity
  const designScourLevel = (input.hydraulics?.designScourDepth ? _bed - input.hydraulics.designScourDepth : (_bed - 2.0)) * S_SCALE;
  const actualFoundationLevel = (input.foundationLevel ?? (_bed - 4.0)) * S_SCALE;
  const actualBedLevel = _bed * S_SCALE;

  // Standard offsets for views
  const EV_Y = 20 * S_SCALE; 
  const PV_Y = -10 * S_SCALE;
  const XS_Y = (hfl / S_SCALE + 10) * S_SCALE; 

  // ── Assemble DXF ─────────────────────────────────────────────────────────
  let dxf = '';

  // ─── 1. HEADER ────────────────────────────────────────────────────────────
  dxf += '  0\nSECTION\n  2\nHEADER\n';
  dxf += headerVar('$ACADVER', '1', cfg.acadVersion);
  dxf += headerVar('$INSUNITS', '70', cfg.units === 'mm' ? '4' : '6'); // 4=mm, 6=metres
  dxf += headerPt('$EXTMIN', -30 * S_SCALE, -80 * S_SCALE, 0);
  dxf += headerPt('$EXTMAX', L + 50 * S_SCALE, cW + 100 * S_SCALE, 0);
  dxf += headerVar('$LTSCALE', '40', (1.0 * S_SCALE).toString());
  dxf += headerVar('$DIMSCALE', '40', (1.0 * S_SCALE).toString());
  dxf += headerVar('$CLAYER', '1', '0');
  dxf += headerVar('$TEXTSTYLE', '7', 'STANDARD');
  dxf += '  0\nENDSEC\n';

  // ─── 2. TABLES ────────────────────────────────────────────────────────────
  dxf += '  0\nSECTION\n  2\nTABLES\n';

  // 2a. VPORT table (required by AutoCAD)
  dxf += `  0\nTABLE\n  2\nVPORT\n  5\n${H.next_handle()}\n 70\n1\n`;
  dxf += `  0\nVPORT\n  5\n${H.next_handle()}\n  2\n*ACTIVE\n 70\n0\n`;
  dxf += ' 10\n0\n 20\n0\n 11\n1\n 21\n1\n';
  dxf += ` 12\n${dN(L / 2)}\n 22\n${dN(cW / 2)}\n`;
  dxf += ` 40\n${dN(Math.max(L, cW) * 1.5)}\n 41\n1.6\n`;
  dxf += '  0\nENDTAB\n';

  // 2b. LTYPE table
  const ltypes: [string, string, number[]][] = [
    ['CONTINUOUS', 'Solid line', []],
    ['DASHED', '_ _ _ _', [0.5, -0.25]],
    ['CENTER', '_ . _ .', [1.25, -0.25, 0.25, -0.25]],
    ['HIDDEN', '_ _ _', [0.25, -0.125]],
    ['DOT', '. . . .', [0, -0.25]],
  ];
  dxf += `  0\nTABLE\n  2\nLTYPE\n  5\n${H.next_handle()}\n 70\n${ltypes.length}\n`;
  for (const [ltName, ltDesc, ltPat] of ltypes) {
    const totalLen = ltPat.reduce((s, v) => s + Math.abs(v), 0) || 0;
    dxf += `  0\nLTYPE\n  5\n${H.next_handle()}\n  2\n${ltName}\n 70\n0\n  3\n${ltDesc}\n 72\n65\n 73\n${ltPat.length}\n 40\n${dN(totalLen)}\n`;
    for (const p of ltPat) dxf += ` 49\n${dN(p)}\n 74\n0\n`;
  }
  dxf += '  0\nENDTAB\n';

  // 2c. LAYER table
  dxf += `  0\nTABLE\n  2\nLAYER\n  5\n${H.next_handle()}\n 70\n${LAYERS.length}\n`;
  for (const ly of LAYERS) {
    dxf += `  0\nLAYER\n  5\n${H.next_handle()}\n  2\n${layerSafe(ly.name)}\n 70\n0\n 62\n${ly.color}\n  6\n${layerSafe(ly.linetype)}\n370\n${ly.lineweight}\n`;
  }
  dxf += '  0\nENDTAB\n';

  // 2d. STYLE table
  dxf += `  0\nTABLE\n  2\nSTYLE\n  5\n${H.next_handle()}\n 70\n2\n`;
  dxf += `  0\nSTYLE\n  5\n${H.next_handle()}\n  2\nSTANDARD\n 70\n0\n 40\n0\n 41\n1\n 50\n0\n 71\n0\n 42\n0.2\n  3\ntxt\n  4\n\n`;
  dxf += `  0\nSTYLE\n  5\n${H.next_handle()}\n  2\nTITLES\n 70\n0\n 40\n0\n 41\n1\n 50\n0\n 71\n0\n 42\n0.35\n  3\nsimplex.shx\n  4\n\n`;
  dxf += '  0\nENDTAB\n';

  // 2e. DIMSTYLE table
  const dimstyleHandle = H.next_handle();
  dxf += `  0\nTABLE\n  2\nDIMSTYLE\n  5\n${H.next_handle()}\n 70\n1\n`;
  dxf += `  0\nDIMSTYLE\n105\n${dimstyleHandle}\n  2\nSTANDARD\n 70\n0\n`;
  dxf += ' 41\n0.18\n 42\n0\n 44\n0.18\n140\n0.18\n141\n0.09\n144\n1\n 77\n1\n 78\n1\n176\n1\n';
  dxf += '  0\nENDTAB\n';

  // 2f. APPID table
  dxf += `  0\nTABLE\n  2\nAPPID\n  5\n${H.next_handle()}\n 70\n1\n`;
  dxf += `  0\nAPPID\n  5\n${H.next_handle()}\n  2\nACAD\n 70\n0\n`;
  dxf += '  0\nENDTAB\n';

  dxf += '  0\nENDSEC\n';

  // ─── 3. BLOCKS ────────────────────────────────────────────────────────────
  dxf += '  0\nSECTION\n  2\nBLOCKS\n';
  // *Model_Space
  const msBlockH = H.next_handle();
  dxf += `  0\nBLOCK\n  5\n${msBlockH}\n  8\n0\n  2\n*MODEL_SPACE\n 70\n0\n 10\n0\n 20\n0\n 30\n0\n`;
  dxf += `  0\nENDBLK\n  5\n${H.next_handle()}\n  8\n0\n`;
  // *Paper_Space
  const psBlockH = H.next_handle();
  dxf += `  0\nBLOCK\n  5\n${psBlockH}\n  8\n0\n  2\n*PAPER_SPACE\n 70\n0\n 10\n0\n 20\n0\n 30\n0\n`;
  dxf += `  0\nENDBLK\n  5\n${H.next_handle()}\n  8\n0\n`;
  dxf += '  0\nENDSEC\n';

  // ─── 4. ENTITIES ──────────────────────────────────────────────────────────
  dxf += '  0\nSECTION\n  2\nENTITIES\n';

  // ═══ ELEVATION VIEW (Side View) ═══════════════════════════════════════════

  // ── Road Top Level (RTL) line ──
  dxf += eLine(H, 0, EV_Y + rtl, L, EV_Y + rtl, 'S-DECK');

  // ── Deck slab in elevation ──
  dxf += ePoly(H, [
    [0, EV_Y + rtl],
    [L, EV_Y + rtl],
    [L, EV_Y + rtl - deckThk],
    [0, EV_Y + rtl - deckThk],
  ], 'S-DECK', true);

  // ── Wearing coat on top of deck ──
  dxf += ePoly(H, [
    [0, EV_Y + rtl + wearingCoat],
    [L, EV_Y + rtl + wearingCoat],
    [L, EV_Y + rtl],
    [0, EV_Y + rtl],
  ], 'S-KERB', true);

  // Hatch the deck slab (concrete)
  if (cfg.includeHatch) {
    dxf += eHatch(H, [
      [0, EV_Y + rtl],
      [L, EV_Y + rtl],
      [L, EV_Y + rtl - deckThk],
      [0, EV_Y + rtl - deckThk],
    ], 'H-CONC', 'ANSI31', 0.05);
  }

  // ── Abutments (Elevation) ──
  const drawAbutmentElev = (xStart: number, isLeft: boolean) => {
    const abTop = EV_Y + rtl;
    const abBot = EV_Y + actualFoundationLevel;
    const stemW = abtW;
    const baseW2 = abtBaseW;
    const baseT = 1.0 * S_SCALE;

    // Check if C1 (Cantilever) or Type 1
    const isC1 = (input.abutmentC1 !== undefined);
    
    if (isC1) {
      // C1 Cantilever Profile
      const heelL = (input.abutmentC1?.geometry.baseWidth ?? abtBaseW) * 0.6 * S_SCALE;
      const toeL = (input.abutmentC1?.geometry.baseWidth ?? abtBaseW) - heelL - abtW;
      
      const stemX = isLeft ? xStart : xStart; // Simplified for now
      
      // Stem
      dxf += ePoly(H, [
        [xStart, abTop],
        [xStart + stemW, abTop],
        [xStart + stemW, abBot + baseT],
        [xStart, abBot + baseT],
      ], 'S-ABUT', true);

      // Footing (Heel + Toe)
      const fBaseX = isLeft ? xStart - toeL : xStart - heelL;
      dxf += ePoly(H, [
        [fBaseX, abBot + baseT],
        [fBaseX + abtBaseW, abBot + baseT],
        [fBaseX + abtBaseW, abBot],
        [fBaseX, abBot],
      ], 'S-FNDTN', true);
    } else {
      // Standard Type 1 Profile
      dxf += ePoly(H, [
        [xStart, abTop],
        [xStart + stemW, abTop],
        [xStart + stemW, abBot + baseT],
        [xStart, abBot + baseT],
      ], 'S-ABUT', true);

      const footOffset = (baseW2 - stemW) / 2;
      dxf += ePoly(H, [
        [xStart - footOffset, abBot + baseT],
        [xStart + stemW + footOffset, abBot + baseT],
        [xStart + stemW + footOffset, abBot],
        [xStart - footOffset, abBot],
      ], 'S-FNDTN', true);
    }

    // Hatch footing
    if (cfg.includeHatch) {
      if (isC1) {
        const heelL = (input.abutmentC1?.geometry.baseWidth ?? abtBaseW) * 0.6 * S_SCALE;
        const toeL = (input.abutmentC1?.geometry.baseWidth ?? abtBaseW) - heelL - abtW;
        const fBaseX = isLeft ? xStart - toeL : xStart - heelL;
        dxf += eHatch(H, [
          [fBaseX, abBot + baseT],
          [fBaseX + abtBaseW, abBot + baseT],
          [fBaseX + abtBaseW, abBot],
          [fBaseX, abBot],
        ], 'H-CONC', 'ANSI32', 0.08);
      } else {
        const footOffset = (baseW2 - stemW) / 2;
        dxf += eHatch(H, [
          [xStart - footOffset, abBot + baseT],
          [xStart + stemW + footOffset, abBot + baseT],
          [xStart + stemW + footOffset, abBot],
          [xStart - footOffset, abBot],
        ], 'H-CONC', 'ANSI32', 0.08);
      }
    }

    // Dirt wall
    const dwX = isLeft ? xStart : xStart + stemW - stemW * 0.4;
    const dwW = stemW * 0.4;
    dxf += ePoly(H, [
      [dwX, abTop],
      [dwX + dwW, abTop],
      [dwX + dwW, abTop + dirtWallH],
      [dwX, abTop + dirtWallH],
    ], 'S-ABUT', true);

    // Bearing pad
    const bpW = 0.3;
    const bpH = 0.05;
    const bpX = isLeft ? xStart + stemW - bpW - 0.1 : xStart + 0.1;
    dxf += ePoly(H, [
      [bpX, abTop - deckThk],
      [bpX + bpW, abTop - deckThk],
      [bpX + bpW, abTop - deckThk - bpH],
      [bpX, abTop - deckThk - bpH],
    ], 'S-BEARING', true);

    // Label
    const cx = xStart + stemW / 2;
    dxf += eText(H, cx, (abTop + abBot) / 2, isLeft ? 'ABT-L' : 'ABT-R', 0.4, 'A-TEXT');
  };

    drawAbutmentElev(-abtW, true);
    drawAbutmentElev(L, false);

    // ── Approach Slabs (Elevation) ──
    const apSlabL = 3.5 * S_SCALE;
    const apSlabT = 0.3 * S_SCALE;
    // Left
    dxf += ePoly(H, [
      [-apSlabL, EV_Y + rtl],
      [0, EV_Y + rtl],
      [0, EV_Y + rtl - apSlabT],
      [-apSlabL, EV_Y + rtl - apSlabT],
    ], 'S-DECK', true);
    // Right
    dxf += ePoly(H, [
      [L, EV_Y + rtl],
      [L + apSlabL, EV_Y + rtl],
      [L + apSlabL, EV_Y + rtl - apSlabT],
      [L, EV_Y + rtl - apSlabT],
    ], 'S-DECK', true);

  // ── Piers (Elevation with Cap) ──
  for (let i = 1; i <= nP; i++) {
    const px = i * S;
    const pierTop = EV_Y + rtl - deckThk;
    const pierBot = EV_Y + foundationLevel;

    // Pier cap
    const capHalfW = pierCapW / 2;
    dxf += ePoly(H, [
      [px - capHalfW, pierTop],
      [px + capHalfW, pierTop],
      [px + capHalfW, pierTop - pierCapT],
      [px - capHalfW, pierTop - pierCapT],
    ], 'S-PIERCAP', true);

    // Pier body (rectangular, no batter for slab bridges)
    const bodyTop = pierTop - pierCapT;
    const halfW = pierW / 2;
    dxf += ePoly(H, [
      [px - halfW, bodyTop],
      [px + halfW, bodyTop],
      [px + halfW, pierBot + pierBaseT],
      [px - halfW, pierBot + pierBaseT],
    ], 'S-PIER', true);

    // Pier footing
    const pfHalfW = pierBaseW / 2;
    dxf += ePoly(H, [
      [px - pfHalfW, pierBot + pierBaseT],
      [px + pfHalfW, pierBot + pierBaseT],
      [px + pfHalfW, pierBot],
      [px - pfHalfW, pierBot],
    ], 'S-FNDTN', true);

    // Hatch pier body
    if (cfg.includeHatch) {
      dxf += eHatch(H, [
        [px - halfW, bodyTop],
        [px + halfW, bodyTop],
        [px + halfW, pierBot + pierBaseT],
        [px - halfW, pierBot + pierBaseT],
      ], 'H-CONC', 'ANSI31', 0.04);
    }

    // Bearing pads on pier cap
    const bpW = 0.3;
    const bpH = 0.05;
    dxf += ePoly(H, [
      [px - capHalfW + 0.15, pierTop],
      [px - capHalfW + 0.15 + bpW, pierTop],
      [px - capHalfW + 0.15 + bpW, pierTop + bpH],
      [px - capHalfW + 0.15, pierTop + bpH],
    ], 'S-BEARING', true);
    dxf += ePoly(H, [
      [px + capHalfW - 0.15 - bpW, pierTop],
      [px + capHalfW - 0.15, pierTop],
      [px + capHalfW - 0.15, pierTop + bpH],
      [px + capHalfW - 0.15 - bpW, pierTop + bpH],
    ], 'S-BEARING', true);

    // Pier label
    dxf += eText(H, px, (bodyTop + pierBot + pierBaseT) / 2, `P${i}`, 0.35, 'A-TEXT');
  }

  // ── Water levels (Elevation) ──
  // HFL
  dxf += eLine(H, -abtW - 5, EV_Y + hfl, L + abtW + 5, EV_Y + hfl, 'G-HFL', 'DASHED');
  dxf += eText(H, L + abtW + 6, EV_Y + hfl, `HFL ${hfl.toFixed(3)}`, 0.3, 'G-HFL');

  // Bed Level
  dxf += eLine(H, -abtW - 5, EV_Y + actualBedLevel, L + abtW + 5, EV_Y + actualBedLevel, 'G-BED');
  dxf += eText(H, L + abtW + 6, EV_Y + actualBedLevel, `BL ${actualBedLevel.toFixed(3)}`, 0.3 * S_SCALE, 'G-BED');

  // Design Scour Level
  dxf += eLine(H, -abtW - 10, EV_Y + designScourLevel, L + abtW + 10, EV_Y + designScourLevel, 'G-BED', 'DASHED');
  dxf += eText(H, L + abtW + 11, EV_Y + designScourLevel, `DESIGN SCOUR LEVEL ${(_L - (input.hydraulics?.designScourDepth ?? 0)).toFixed(3)}`, 0.25 * S_SCALE, 'G-BED');

  // Foundation Level
  dxf += eLine(H, -abtW - 5, EV_Y + actualFoundationLevel, L + abtW + 5, EV_Y + actualFoundationLevel, 'S-FNDTN', 'HIDDEN');
  dxf += eText(H, L + abtW + 6, EV_Y + actualFoundationLevel, `FL ${actualFoundationLevel.toFixed(3)}`, 0.3 * S_SCALE, 'A-TEXT');

  // RTL
  dxf += eText(H, L + abtW + 6, EV_Y + rtl, `RTL ${rtl.toFixed(3)}`, 0.3 * S_SCALE, 'A-TEXT');

  // NGL Profile (if cross-section data available)
  if (crossSectionData.length >= 2) {
    const pts: number[][] = crossSectionData.map(p => [p.chainage, EV_Y + p.gl]);
    dxf += ePoly(H, pts, 'G-NGL', false, 'DASHED');
  }

  // ── Dimension entities (Elevation) ──
  // Total length
  const dimY = EV_Y + foundationLevel - 3;
  dxf += eDimAligned(H, 0, dimY, L, dimY, 0, dimY - 1.5, `${L.toFixed(1)}m TOTAL LENGTH`, 'A-DIM');

  // Individual spans
  for (let i = 0; i < nS; i++) {
    const x1 = i * S;
    const x2 = (i + 1) * S;
    const dy = rtl + 2.5 * S_SCALE + i * 1.2 * S_SCALE + EV_Y;
    dxf += eDimAligned(H, x1, dy, x2, dy, (x1 + x2) / 2, dy + 1 * S_SCALE, `SPAN ${i + 1}: ${(S / S_SCALE).toFixed(1)}m`, 'A-DIM');
  }

  // Pier depth dimension (on first pier)
  if (nP >= 1) {
    const px = S;
    const dimX = px + pierBaseW / 2 + 2;
    dxf += eDimAligned(H, dimX, EV_Y + rtl - deckThk - pierCapT, dimX, EV_Y + foundationLevel + pierBaseT,
      dimX + 1.5, (EV_Y + rtl - deckThk - pierCapT + EV_Y + foundationLevel + pierBaseT) / 2,
      `${pierD.toFixed(1)}m`, 'A-DIM');
  }

  // Bridge type annotation
  const bridgeTypeLabel = isHighLevel
    ? `HIGH-LEVEL SLAB BRIDGE (Clearance: ${(freeboardAboveHfl / S_SCALE).toFixed(2)}m above HFL | ${(freeboardAboveDwl / S_SCALE).toFixed(2)}m above DWL)`
    : 'SUBMERSIBLE BRIDGE';
  dxf += eText(H, L / 2, rtl + 5 * S_SCALE + EV_Y, bridgeTypeLabel, 0.5 * S_SCALE, 'A-TEXT');

  // ═══ PLAN VIEW (Top-down with Skew) ═══════════════════════════════════════

  // Deck outline (skewed)
  const skewShift = cW * tanSkew;
  dxf += ePoly(H, [
    [0, PV_Y],
    [L, PV_Y],
    [L + skewShift, PV_Y + cW],
    [skewShift, PV_Y + cW],
  ], 'S-DECK', true);

  // Centre line of carriageway
  dxf += eLine(H, -3 * S_SCALE, PV_Y + cW / 2, L + 3 * S_SCALE + shiftFull, PV_Y + cW / 2, 'A-GRID', 'CENTER');
  dxf += eText(H, L / 2, PV_Y + cW / 2 - 1 * S_SCALE, 'C/L OF CARRIAGEWAY', 0.25 * S_SCALE, 'A-GRID');

  // Expansion Joints in Plan
  for (let i = 0; i <= nS; i++) {
    const xj = i * S;
    const shift = (cW / 2) * tanSkew;
    dxf += eLine(H, xj, PV_Y - 0.5 * S_SCALE, xj + shiftFull, PV_Y + cW + 0.5 * S_SCALE, 'A-DIM', 'CONTINUOUS');
    dxf += eText(H, xj + shift, PV_Y + cW + 1 * S_SCALE, 'EXP. JOINT', 0.2 * S_SCALE, 'A-DIM');
  }

  // Pier lines in plan
  for (let i = 1; i <= nP; i++) {
    const px = i * S;
    const shift1 = 0 * tanSkew;
    const shift2 = cW * tanSkew;
    dxf += eLine(H, px + shift1, PV_Y, px + shift2, PV_Y + cW, 'S-PIER');
    dxf += eText(H, px + shift2 / 2, PV_Y - 1, `P${i}`, 0.3, 'A-TEXT');
  }

  // Abutment lines in plan
  dxf += eLine(H, 0, PV_Y, shiftFull, PV_Y + cW, 'S-ABUT');
  dxf += eLine(H, L, PV_Y, L + shiftFull, PV_Y + cW, 'S-ABUT');

  // Foundation rectangles in plan
  const fndPlanW = pierBaseW;
  const fndPlanL = pierBaseL;
  for (let i = 1; i <= nP; i++) {
    const px = i * S;
    const shift = (cW / 2) * tanSkew;
    const cx = px + shift;
    const cy = PV_Y + cW / 2;
    dxf += ePoly(H, [
      [cx - fndPlanW / 2, cy - fndPlanL / 2],
      [cx + fndPlanW / 2, cy - fndPlanL / 2],
      [cx + fndPlanW / 2, cy + fndPlanL / 2],
      [cx - fndPlanW / 2, cy + fndPlanL / 2],
    ], 'S-FNDTN', true, 'HIDDEN');
  }

  // Abutment foundations in plan
  const isAbutC1 = (input.abutmentC1 !== undefined);
  const baseW = isAbutC1 ? (input.abutmentC1?.geometry.baseWidth ?? abtBaseW) * S_SCALE : abtBaseW;
  const heelL = isAbutC1 ? (input.abutmentC1?.geometry.baseWidth ?? abtBaseW) * 0.6 * S_SCALE : (abtBaseW - abtW) / 2;
  const toeL = isAbutC1 ? baseW - heelL - abtW : (abtBaseW - abtW) / 2;

  // Left Abutment Foundation
  const axL = -toeL;
  const shiftL = (cW / 2) * tanSkew;
  dxf += ePoly(H, [
    [axL + shiftL, PV_Y + cW * 0.15],
    [axL + baseW + shiftL, PV_Y + cW * 0.15],
    [axL + baseW + shiftL, PV_Y + cW * 0.85],
    [axL + shiftL, PV_Y + cW * 0.85],
  ], 'S-FNDTN', true, 'HIDDEN');

  // Right Abutment Foundation
  const axR = L - heelL; // For right abutment, heel is usually towards the fill (outward)
  const shiftR = (cW / 2) * tanSkew;
  dxf += ePoly(H, [
    [axR + shiftR, PV_Y + cW * 0.15],
    [axR + baseW + shiftR, PV_Y + cW * 0.15],
    [axR + baseW + shiftR, PV_Y + cW * 0.85],
    [axR + shiftR, PV_Y + cW * 0.85],
  ], 'S-FNDTN', true, 'HIDDEN');

  // Plan view label
  dxf += eText(H, L / 2, PV_Y - 4, 'PLAN VIEW', 0.7, 'A-TEXT');

  // ═══ CROSS-SECTION VIEW ═══════════════════════════════════════════════════
  if (cfg.includeXSection) {
    const XS_X = -25 * S_SCALE; // X offset for cross-section

    // Deck slab
    dxf += ePoly(H, [
      [XS_X, XS_Y],
      [XS_X + cW, XS_Y],
      [XS_X + cW, XS_Y - deckThk],
      [XS_X, XS_Y - deckThk],
    ], 'S-DECK', true);

    if (cfg.includeHatch) {
      dxf += eHatch(H, [
        [XS_X, XS_Y],
        [XS_X + cW, XS_Y],
        [XS_X + cW, XS_Y - deckThk],
        [XS_X, XS_Y - deckThk],
      ], 'H-CONC', 'ANSI31', 0.03);
    }

    // Wearing coat
    dxf += ePoly(H, [
      [XS_X + kerbW, XS_Y],
      [XS_X + cW - kerbW, XS_Y],
      [XS_X + cW - kerbW, XS_Y + wearingCoat],
      [XS_X + kerbW, XS_Y + wearingCoat],
    ], 'S-KERB', true);

    // Left kerb
    dxf += ePoly(H, [
      [XS_X, XS_Y],
      [XS_X + kerbW, XS_Y],
      [XS_X + kerbW, XS_Y + kerbH],
      [XS_X, XS_Y + kerbH],
    ], 'S-KERB', true);

    // Right kerb
    dxf += ePoly(H, [
      [XS_X + cW - kerbW, XS_Y],
      [XS_X + cW, XS_Y],
      [XS_X + cW, XS_Y + kerbH],
      [XS_X + cW - kerbW, XS_Y + kerbH],
    ], 'S-KERB', true);

    // Centre line
    dxf += eLine(H, XS_X + cW / 2, XS_Y - deckThk - 1, XS_X + cW / 2, XS_Y + kerbH + 1, 'A-GRID', 'CENTER');
    dxf += eText(H, XS_X + cW / 2, XS_Y + kerbH + 1.5, 'C/L', 0.25, 'A-GRID');

    // Reinforcement circles (schematic)
    const barSpacing = 0.15; // 150mm c/c
    const nMainBars = Math.floor(cW / barSpacing);
    for (let i = 0; i < nMainBars; i++) {
      const bx = XS_X + barSpacing / 2 + i * barSpacing;
      const by = XS_Y - deckThk + 0.04; // 40mm cover
      dxf += eCircle(H, bx, by, 0.01, 'X-REBAR');
    }

    // Distribution bars (top face)
    const nDistBars = Math.floor(cW / 0.2);
    for (let i = 0; i < nDistBars; i++) {
      const bx = XS_X + 0.1 + i * 0.2;
      const by = XS_Y - 0.04; // 40mm cover top
      dxf += eCircle(H, bx, by, 0.008, 'X-REBAR');
    }

    // Width dimension
    dxf += eDimAligned(H, XS_X, XS_Y - deckThk - 2, XS_X + cW, XS_Y - deckThk - 2,
      XS_X + cW / 2, XS_Y - deckThk - 3, `${cW.toFixed(1)}m WIDTH`, 'A-DIM');

    // Thickness dimension
    dxf += eDimAligned(H, XS_X - 2, XS_Y, XS_X - 2, XS_Y - deckThk,
      XS_X - 3, XS_Y - deckThk / 2, `${(deckThk * 1000).toFixed(0)}mm`, 'A-DIM');

    // Labels
    dxf += eText(H, XS_X + cW / 2, XS_Y + kerbH + 3, 'CROSS-SECTION VIEW', 0.7, 'A-TEXT');
    dxf += eText(H, XS_X + cW / 2, XS_Y - deckThk / 2, 'DECK SLAB', 0.2, 'A-TEXT');
    dxf += eText(H, XS_X + kerbW / 2, XS_Y + kerbH + 0.4, 'KERB', 0.15, 'A-TEXT');
    dxf += eText(H, XS_X + cW / 2, XS_Y - deckThk - 4.5,
      `${concreteGrade} | ${steelGrade} | Span ${S}m`, 0.25, 'A-TEXT');
  }

  // ═══ TITLE BLOCK ══════════════════════════════════════════════════════════
  if (cfg.includeTitleBlock) {
    const tbX = L - 22 * S_SCALE;
    const tbY = foundationLevel + EV_Y - 10 * S_SCALE;
    const tbW = 20 * S_SCALE;
    const tbH = 8 * S_SCALE;

    // Outer border
    dxf += ePoly(H, [
      [tbX, tbY],
      [tbX + tbW, tbY],
      [tbX + tbW, tbY + tbH],
      [tbX, tbY + tbH],
    ], 'A-TITLE', true);

    // Horizontal dividers
    dxf += eLine(H, tbX, tbY + tbH * 0.6, tbX + tbW, tbY + tbH * 0.6, 'A-TITLE');
    dxf += eLine(H, tbX, tbY + tbH * 0.35, tbX + tbW, tbY + tbH * 0.35, 'A-TITLE');

    // Vertical divider
    dxf += eLine(H, tbX + tbW * 0.55, tbY, tbX + tbW * 0.55, tbY + tbH * 0.6, 'A-TITLE');

    // Title text
    dxf += eText(H, tbX + 0.3, tbY + tbH - 0.8, 'PROJECT:', 0.2, 'A-TITLE');
    dxf += eText(H, tbX + 0.3, tbY + tbH - 1.5, textSafe(projectName), 0.3, 'A-TITLE');
    dxf += eText(H, tbX + 0.3, tbY + tbH - 2.2, textSafe(location || ''), 0.2, 'A-TITLE');

    dxf += eText(H, tbX + 0.3, tbY + tbH * 0.6 - 0.7, 'DRAWING TITLE:', 0.18, 'A-TITLE');
    dxf += eText(H, tbX + 0.3, tbY + tbH * 0.6 - 1.4, 'GENERAL ARRANGEMENT DRAWING', 0.25, 'A-TITLE');

    dxf += eText(H, tbX + tbW * 0.55 + 0.3, tbY + tbH * 0.6 - 0.7, 'SCALE', 0.18, 'A-TITLE');
    dxf += eText(H, tbX + tbW * 0.55 + 0.3, tbY + tbH * 0.6 - 1.4, '1:100 (on A1)', 0.2, 'A-TITLE');

    dxf += eText(H, tbX + 0.3, tbY + 0.8, 'IRC:6-2016 / IRC:112-2015 / IS:456-2000', 0.15, 'A-TITLE');
    dxf += eText(H, tbX + 0.3, tbY + 0.3, 'Bridge Slab Design Suite', 0.15, 'A-TITLE');

    // Date
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    dxf += eText(H, tbX + tbW * 0.55 + 0.3, tbY + 0.8, `DATE: ${dateStr}`, 0.15, 'A-TITLE');
  }

  // ═══ ELEVATION VIEW TITLE ═════════════════════════════════════════════════
  dxf += eText(H, L / 2, rtl + 7 * S_SCALE + EV_Y, `${textSafe(projectName)} — GENERAL ARRANGEMENT`, 0.8 * S_SCALE, 'A-TEXT');
  dxf += eText(H, L / 2, rtl + 6 * S_SCALE + EV_Y, `Total: ${(L / S_SCALE).toFixed(1)}m | ${nS} Spans @ ${(S / S_SCALE).toFixed(1)}m | Skew: ${skew}°`, 0.35 * S_SCALE, 'A-TEXT');

  dxf += '  0\nENDSEC\n';

  // ─── 5. OBJECTS ───────────────────────────────────────────────────────────
  dxf += '  0\nSECTION\n  2\nOBJECTS\n';
  const dictHandle = H.next_handle();
  dxf += `  0\nDICTIONARY\n  5\n${dictHandle}\n330\n0\n100\nAcDbDictionary\n281\n1\n`;
  dxf += '  0\nENDSEC\n';

  // ─── EOF ──────────────────────────────────────────────────────────────────
  dxf += '  0\nEOF\n';

  return dxf;
}

// ══════════════════════════════════════════════════════════════════════════════
// DXF ENTITY HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function headerVar(name: string, groupCode: string, value: string): string {
  return `  9\n${name}\n  ${groupCode}\n${value}\n`;
}

function headerPt(name: string, x: number, y: number, z: number): string {
  return `  9\n${name}\n 10\n${dN(x)}\n 20\n${dN(y)}\n 30\n${dN(z)}\n`;
}

/** LINE entity with handle and lineweight */
function eLine(H: HandleRegistry, x1: number, y1: number, x2: number, y2: number,
  layer: string, lt = 'CONTINUOUS'): string {
  return `  0\nLINE\n  5\n${H.next_handle()}\n  8\n${layerSafe(layer)}\n  6\n${layerSafe(lt)}\n` +
    ` 10\n${dN(x1)}\n 20\n${dN(y1)}\n 30\n0\n 11\n${dN(x2)}\n 21\n${dN(y2)}\n 31\n0\n`;
}

/** LWPOLYLINE entity */
function ePoly(H: HandleRegistry, pts: number[][], layer: string, closed = true,
  lt = 'CONTINUOUS'): string {
  let s = `  0\nLWPOLYLINE\n  5\n${H.next_handle()}\n100\nAcDbEntity\n  8\n${layerSafe(layer)}\n  6\n${layerSafe(lt)}\n100\nAcDbPolyline\n`;
  s += ` 90\n${pts.length}\n 70\n${closed ? 1 : 0}\n`;
  for (const [x, y] of pts) {
    s += ` 10\n${dN(x)}\n 20\n${dN(y)}\n`;
  }
  return s;
}

/** TEXT entity (single-line) */
function eText(H: HandleRegistry, x: number, y: number, text: string,
  height: number, layer: string): string {
  const safe = textSafe(text);
  return `  0\nTEXT\n  5\n${H.next_handle()}\n100\nAcDbEntity\n  8\n${layerSafe(layer)}\n100\nAcDbText\n` +
    `  7\nSTANDARD\n 10\n${dN(x)}\n 20\n${dN(y)}\n 30\n0\n 40\n${dN(height)}\n  1\n${safe}\n` +
    ` 72\n1\n100\nAcDbText\n 11\n${dN(x)}\n 21\n${dN(y)}\n 31\n0\n 73\n0\n`;
}

/** CIRCLE entity */
function eCircle(H: HandleRegistry, cx: number, cy: number, r: number, layer: string): string {
  return `  0\nCIRCLE\n  5\n${H.next_handle()}\n100\nAcDbEntity\n  8\n${layerSafe(layer)}\n100\nAcDbCircle\n` +
    ` 10\n${dN(cx)}\n 20\n${dN(cy)}\n 30\n0\n 40\n${dN(r)}\n`;
}

/** HATCH entity — creates a filled boundary with a standard AutoCAD pattern */
function eHatch(H: HandleRegistry, pts: number[][], layer: string,
  patternName: string, patternScale: number): string {
  let s = `  0\nHATCH\n  5\n${H.next_handle()}\n100\nAcDbEntity\n  8\n${layerSafe(layer)}\n100\nAcDbHatch\n`;
  s += ' 10\n0\n 20\n0\n 30\n0\n';  // Elevation point
  s += '210\n0\n220\n0\n230\n1\n';   // Normal vector
  s += `  2\n${patternName}\n`;       // Pattern name
  s += ' 70\n0\n';                     // Solid fill = 0 (pattern)
  s += ' 71\n1\n';                     // Associative = 1
  s += ' 91\n1\n';                     // Number of boundary paths

  // Boundary path (polyline)
  s += ' 92\n7\n';                     // Path type: polyline + external + derived
  s += ' 72\n1\n';                     // Has bulge
  s += ' 73\n1\n';                     // Is closed
  s += ` 93\n${pts.length}\n`;         // Number of vertices

  for (const [x, y] of pts) {
    s += ` 10\n${dN(x)}\n 20\n${dN(y)}\n 42\n0\n`;
  }

  s += ' 97\n0\n';                     // Number of source boundary objects
  s += ' 75\n0\n';                     // Hatch style: normal
  s += ' 76\n1\n';                     // Pattern type: predefined
  s += ` 52\n0\n`;                     // Pattern angle
  s += ` 41\n${dN(patternScale)}\n`;   // Pattern scale
  s += ' 77\n0\n';                     // Pattern double flag
  s += ' 47\n1\n';                     // Pixel size
  s += ' 98\n1\n';                     // Number of seed points
  s += ` 10\n${dN((pts[0][0] + pts[2][0]) / 2)}\n 20\n${dN((pts[0][1] + pts[2][1]) / 2)}\n`;

  return s;
}

/**
 * DIMENSION entity (aligned) — annotated measurement line
 * Emits extension lines + text via DXF DIMENSION entity
 */
function eDimAligned(H: HandleRegistry, x1: number, y1: number, x2: number, y2: number,
  textX: number, textY: number, text: string, layer: string): string {
  let s = `  0\nDIMENSION\n  5\n${H.next_handle()}\n100\nAcDbEntity\n  8\n${layerSafe(layer)}\n100\nAcDbDimension\n`;
  // Definition point (extension line 2 end)
  s += ` 10\n${dN(x2)}\n 20\n${dN(y2)}\n 30\n0\n`;
  // Middle of dimension text
  s += ` 11\n${dN(textX)}\n 21\n${dN(textY)}\n 31\n0\n`;
  s += ' 70\n1\n'; // Aligned dimension type
  s += `  1\n${textSafe(text)}\n`;
  s += '  3\nSTANDARD\n'; // DIMSTYLE name
  s += '100\nAcDbAlignedDimension\n';
  // Extension line 1 start
  s += ` 13\n${dN(x1)}\n 23\n${dN(y1)}\n 33\n0\n`;
  // Extension line 2 start
  s += ` 14\n${dN(x2)}\n 24\n${dN(y2)}\n 34\n0\n`;
  return s;
}
