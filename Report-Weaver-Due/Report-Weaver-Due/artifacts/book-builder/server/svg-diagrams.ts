/**
 * SVG Diagram Generators — parametric, all dimensions from EnhancedProjectInput
 */

import type { EnhancedProjectInput } from '../bridge-excel-generator/types';

const SCALE = 40; // pixels per metre

// ── General Arrangement Drawing ───────────────────────────────────────────────
export function generateGADSvg(input: EnhancedProjectInput): string {
  const bridgeType = input.bridgeType === 'high-level' ? 'HIGH-LEVEL' : 'SUBMERSIBLE';
  const totalL  = input.totalLength;
  const nPiers  = input.numberOfPiers;
  const spanL   = input.spanLength;
  const cW      = input.carriageWidth;
  const hfl     = input.hfl;
  const bed     = input.bedLevel;
  const abtW    = (input.abutmentType1?.geometry.width ?? input.abutmentWidth);
  const pierW   = input.pierWidth;
  const pierD   = input.pierDepth;

  const svgW    = 800;
  const margin  = 60;
  const drawW   = svgW - 2 * margin;
  const scaleX  = drawW / (totalL + 2 * abtW);

  const waterH  = hfl - bed;
  const slabThk = input.deckSlabThickness ?? 0.35;
  const reqFbHfl =
    input.hydraulics?.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2);
  const soffitLevel =
    input.bridgeType === 'high-level'
      ? (input.deckSoffitLevel ?? input.hfl + reqFbHfl)
      : input.hfl;
  
  // High-level: pull deck up to create visual gap from HFL
  const freeboardPx = input.bridgeType === 'high-level' ? (soffitLevel - hfl) * SCALE : 0;
  const deckY   = 80;
  const hflY    = deckY + freeboardPx;
  const bedY    = hflY + waterH * SCALE;
  const foundY  = bedY + 40;

  const svgH    = Math.max(400, (bedY - deckY) + 150);
  const toX = (x: number) => margin + (x + abtW) * scaleX;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;

  // Title
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#1F496B">GENERAL ARRANGEMENT DRAWING — ${input.projectName}</text>`;
  svg += `<text x="${svgW/2}" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#455A64">${bridgeType} SLAB BRIDGE</text>`;

  // Water level line
  svg += `<line x1="${margin}" y1="${hflY}" x2="${svgW - margin}" y2="${hflY}" stroke="#1976d2" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<text x="${margin - 5}" y="${hflY - 4}" text-anchor="end" font-size="9" fill="#1976d2">HFL ${hfl.toFixed(2)}</text>`;

  // Bed level line
  svg += `<line x1="${margin}" y1="${bedY}" x2="${svgW - margin}" y2="${bedY}" stroke="#8d6e63" stroke-width="2"/>`;
  svg += `<text x="${margin - 5}" y="${bedY + 4}" text-anchor="end" font-size="9" fill="#8d6e63">BL ${bed.toFixed(2)}</text>`;

  // Deck slab
  const deckThk = Math.max(8, slabThk * SCALE);
  svg += `<rect x="${toX(0)}" y="${deckY - deckThk}" width="${totalL * scaleX}" height="${deckThk}" fill="#b0bec5" stroke="#546e7a" stroke-width="1.5"/>`;
  svg += `<text x="${toX(totalL) + 8}" y="${deckY - 3}" font-size="8" fill="#546e7a">Soffit ${soffitLevel.toFixed(2)}</text>`;

  // Freeboard dimension if high-level
  if (input.bridgeType === 'high-level' && freeboardPx > 5) {
    const dimX = toX(totalL) + 20;
    svg += `<line x1="${dimX}" y1="${deckY}" x2="${dimX}" y2="${hflY}" stroke="#555" stroke-width="1"/>`;
    svg += `<text x="${dimX + 4}" y="${(deckY + hflY) / 2 + 4}" font-size="8" fill="#555">${(soffitLevel - hfl).toFixed(2)}m Freeboard</text>`;
  }

  // Abutments
  const abtH = waterH * SCALE;
  const abtPxW = abtW * scaleX;
  svg += `<rect x="${toX(-abtW)}" y="${deckY}" width="${abtPxW}" height="${abtH}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  svg += `<rect x="${toX(totalL)}" y="${deckY}" width="${abtPxW}" height="${abtH}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  svg += `<text x="${toX(-abtW/2)}" y="${deckY + abtH/2}" text-anchor="middle" font-size="8" fill="#1565c0">ABT-L</text>`;
  svg += `<text x="${toX(totalL + abtW/2)}" y="${deckY + abtH/2}" text-anchor="middle" font-size="8" fill="#1565c0">ABT-R</text>`;

  // Piers
  const pierPxW = pierW * scaleX;
  for (let i = 1; i <= nPiers; i++) {
    const px = i * spanL;
    const pierX = toX(px) - pierPxW / 2;
    svg += `<rect x="${pierX}" y="${deckY}" width="${pierPxW}" height="${pierD * SCALE}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/>`;
    svg += `<text x="${toX(px)}" y="${deckY + pierD * SCALE / 2}" text-anchor="middle" font-size="8" fill="#2e7d32">P${i}</text>`;
  }

  // Span dimensions
  for (let i = 0; i <= nPiers; i++) {
    const x1 = toX(i * spanL);
    const x2 = toX((i + 1) * spanL);
    const dimY = deckY - 20;
    svg += `<line x1="${x1}" y1="${dimY}" x2="${x2}" y2="${dimY}" stroke="#555" stroke-width="1"/>`;
    svg += `<text x="${(x1+x2)/2}" y="${dimY - 4}" text-anchor="middle" font-size="8" fill="#333">${spanL}m</text>`;
  }

  // Total length dimension
  svg += `<line x1="${toX(0)}" y1="${foundY + 10}" x2="${toX(totalL)}" y2="${foundY + 10}" stroke="#333" stroke-width="1"/>`;
  svg += `<text x="${toX(totalL/2)}" y="${foundY + 22}" text-anchor="middle" font-size="9" font-weight="bold" fill="#333">Total Length = ${totalL}m</text>`;

  svg += '</svg>';
  return svg;
}

// ── Pier Elevation ────────────────────────────────────────────────────────────
export function generatePierSvg(input: EnhancedProjectInput): string {
  const pier   = input.pier;
  const pierW  = pier?.geometry.width  ?? input.pierWidth;
  const pierL  = pier?.geometry.length ?? input.pierLength;
  const pierD  = pier?.geometry.depth  ?? input.pierDepth;
  const baseW  = pier?.footing.width   ?? input.pierBaseWidth;
  const baseL  = pier?.footing.length  ?? input.pierBaseLength;
  const baseT  = pier?.footing.thickness ?? 1.0;
  const capW   = pier?.pierCap.width   ?? (pierW + 0.5);
  const capT   = pier?.pierCap.thickness ?? 0.8;
  const hfl    = input.hfl;
  const bed    = input.bedLevel;
  const waterH = hfl - bed;

  const svgW   = 600;
  const svgH   = 700;
  const cx     = svgW / 2;
  const deckY  = 80;
  const bedY   = deckY + waterH * SCALE;
  const footY  = bedY + pierD * SCALE;

  const pxW    = pierW * SCALE;
  const pxBaseW = baseW * SCALE;
  const pxCapW  = capW * SCALE;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#1F496B">PIER ELEVATION — ${input.projectName}</text>`;

  // Pier cap
  svg += `<rect x="${cx - pxCapW/2}" y="${deckY}" width="${pxCapW}" height="${capT * SCALE}" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.5"/>`;
  svg += `<text x="${cx}" y="${deckY + capT * SCALE / 2 + 4}" text-anchor="middle" font-size="8" fill="#333">Pier Cap</text>`;

  // Pier body
  const bodyTop = deckY + capT * SCALE;
  svg += `<rect x="${cx - pxW/2}" y="${bodyTop}" width="${pxW}" height="${pierD * SCALE}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/>`;

  // Footing
  svg += `<rect x="${cx - pxBaseW/2}" y="${footY}" width="${pxBaseW}" height="${baseT * SCALE}" fill="#fff9c4" stroke="#f57f17" stroke-width="1.5"/>`;

  // Water level
  svg += `<line x1="30" y1="${deckY}" x2="${svgW - 30}" y2="${deckY}" stroke="#1976d2" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<text x="28" y="${deckY - 4}" text-anchor="end" font-size="9" fill="#1976d2">HFL ${hfl.toFixed(2)}</text>`;

  // Bed level
  svg += `<line x1="30" y1="${bedY}" x2="${svgW - 30}" y2="${bedY}" stroke="#8d6e63" stroke-width="2"/>`;
  svg += `<text x="28" y="${bedY + 4}" text-anchor="end" font-size="9" fill="#8d6e63">BL ${bed.toFixed(2)}</text>`;

  // Drag force arrow
  const arrowY = deckY + waterH * SCALE / 2;
  svg += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#d32f2f"/></marker></defs>`;
  svg += `<line x1="${cx + pxW/2 + 5}" y1="${arrowY}" x2="${cx + pxW/2 + 55}" y2="${arrowY}" stroke="#d32f2f" stroke-width="2" marker-end="url(#arr)"/>`;
  svg += `<text x="${cx + pxW/2 + 10}" y="${arrowY - 5}" font-size="8" fill="#d32f2f">Drag</text>`;

  // Dimensions
  svg += `<text x="${cx}" y="${footY + baseT * SCALE + 20}" text-anchor="middle" font-size="9" fill="#333">Base: ${baseW}m × ${baseL}m × ${baseT}m</text>`;
  svg += `<text x="${cx}" y="${bodyTop + pierD * SCALE / 2 + 4}" text-anchor="middle" font-size="9" fill="#2e7d32">${pierW}m × ${pierL}m × ${pierD}m</text>`;

  svg += '</svg>';
  return svg;
}

// ── Abutment Section ──────────────────────────────────────────────────────────
export function generateAbutmentSvg(input: EnhancedProjectInput): string {
  const abt    = input.abutmentType1;
  const H      = abt?.geometry.height    ?? input.abutmentHeight;
  const t      = abt?.geometry.width     ?? input.abutmentWidth;
  const B      = abt?.geometry.baseWidth ?? (t + 1.5);
  const Dw     = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const phi    = input.phi;
  const gamma  = input.gamma;
  const phiRad = phi * Math.PI / 180;
  const Ka     = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);

  const svgW   = 700;
  const svgH   = 600;
  const cx     = 250;
  const deckY  = 80;
  const baseY  = deckY + H * SCALE;
  const pxT    = t * SCALE;
  const pxB    = B * SCALE;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#1F496B">TYPE-1 ABUTMENT SECTION — ${input.projectName}</text>`;

  // Deck
  svg += `<rect x="${cx - pxT/2}" y="${deckY - 12}" width="${pxT + 20}" height="12" fill="#b0bec5" stroke="#546e7a" stroke-width="1.5"/>`;

  // Abutment stem
  svg += `<rect x="${cx - pxT/2}" y="${deckY}" width="${pxT}" height="${H * SCALE}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  svg += `<text x="${cx}" y="${deckY + H * SCALE / 2 + 4}" text-anchor="middle" font-size="9" fill="#1565c0">H=${H}m</text>`;

  // Footing
  svg += `<rect x="${cx - pxT/2 - pxB * 0.4}" y="${baseY}" width="${pxB}" height="20" fill="#fff9c4" stroke="#f57f17" stroke-width="1.5"/>`;
  svg += `<text x="${cx - pxT/2 - pxB * 0.4 + pxB/2}" y="${baseY + 14}" text-anchor="middle" font-size="8" fill="#f57f17">B=${B}m</text>`;

  // Dirt wall
  svg += `<rect x="${cx + pxT/2}" y="${deckY - Dw * SCALE}" width="${pxT * 0.5}" height="${Dw * SCALE}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1"/>`;
  svg += `<text x="${cx + pxT/2 + pxT * 0.25}" y="${deckY - Dw * SCALE / 2}" text-anchor="middle" font-size="7" fill="#2e7d32">DW</text>`;

  // Backfill hatch
  for (let i = 0; i < 6; i++) {
    const hy = deckY + i * H * SCALE / 6;
    svg += `<line x1="${cx + pxT/2}" y1="${hy}" x2="${cx + pxT/2 + 60}" y2="${hy + 15}" stroke="#a1887f" stroke-width="0.5"/>`;
  }
  svg += `<text x="${cx + pxT/2 + 30}" y="${deckY + H * SCALE * 0.6}" text-anchor="middle" font-size="8" fill="#795548">Backfill</text>`;

  // Earth pressure arrow
  const Pa = 0.5 * Ka * gamma * H * H;
  const arrowY = deckY + H * SCALE * 2 / 3;
  svg += `<defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#d32f2f"/></marker></defs>`;
  svg += `<line x1="${cx + pxT/2 + 65}" y1="${arrowY}" x2="${cx + pxT/2 + 5}" y2="${arrowY}" stroke="#d32f2f" stroke-width="2" marker-end="url(#arr2)"/>`;
  svg += `<text x="${cx + pxT/2 + 70}" y="${arrowY - 4}" font-size="8" fill="#d32f2f">Pa=${Pa.toFixed(0)}kN/m</text>`;

  // Dimensions
  svg += `<text x="${cx - pxT/2 - 5}" y="${deckY + H * SCALE / 2}" text-anchor="end" font-size="9" fill="#333">H=${H}m</text>`;
  svg += `<text x="${cx}" y="${baseY + 35}" text-anchor="middle" font-size="9" fill="#333">Ka=${Ka.toFixed(3)}  φ=${phi}°  γ=${gamma}kN/m³</text>`;

  svg += '</svg>';
  return svg;
}

// ── Deck Slab Cross-Section ───────────────────────────────────────────────────
export function generateSlabSvg(input: EnhancedProjectInput): string {
  const cW     = input.carriageWidth;
  const thk    = 0.25;
  const spanL  = input.spanLength;

  const svgW   = 800;
  const svgH   = 400;
  const slabX  = 60;
  const slabY  = 100;
  const pxW    = cW * SCALE;
  const pxThk  = thk * SCALE;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#1F496B">DECK SLAB CROSS-SECTION — ${input.projectName}</text>`;

  // Slab outline
  svg += `<rect x="${slabX}" y="${slabY}" width="${pxW}" height="${pxThk}" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>`;

  // Wearing coat
  svg += `<rect x="${slabX}" y="${slabY}" width="${pxW}" height="3" fill="#b0bec5" stroke="none"/>`;
  svg += `<text x="${slabX + pxW/2}" y="${slabY - 5}" text-anchor="middle" font-size="8" fill="#546e7a">Wearing Coat 75mm</text>`;

  // Main reinforcement bars (schematic)
  const barSpacing = 15;
  const nBars = Math.floor(pxW / barSpacing);
  for (let i = 0; i < nBars; i++) {
    const bx = slabX + barSpacing / 2 + i * barSpacing;
    svg += `<circle cx="${bx}" cy="${slabY + pxThk - 8}" r="3" fill="#d32f2f"/>`;
  }
  svg += `<text x="${slabX + pxW/2}" y="${slabY + pxThk + 15}" text-anchor="middle" font-size="8" fill="#d32f2f">Main Steel (20φ@150)</text>`;

  // Distribution bars (schematic, top)
  const nDistBars = Math.floor(pxW / 20);
  for (let i = 0; i < nDistBars; i++) {
    const bx = slabX + 10 + i * 20;
    svg += `<circle cx="${bx}" cy="${slabY + 8}" r="2.5" fill="#1976d2"/>`;
  }
  svg += `<text x="${slabX + pxW/2}" y="${slabY - 15}" text-anchor="middle" font-size="8" fill="#1976d2">Distribution Steel (12φ@200)</text>`;

  // Width dimension
  svg += `<line x1="${slabX}" y1="${slabY + pxThk + 25}" x2="${slabX + pxW}" y2="${slabY + pxThk + 25}" stroke="#333" stroke-width="1"/>`;
  svg += `<text x="${slabX + pxW/2}" y="${slabY + pxThk + 38}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">Width = ${cW}m</text>`;

  // Thickness dimension
  svg += `<line x1="${slabX - 15}" y1="${slabY}" x2="${slabX - 15}" y2="${slabY + pxThk}" stroke="#333" stroke-width="1"/>`;
  svg += `<text x="${slabX - 18}" y="${slabY + pxThk/2 + 4}" text-anchor="end" font-size="9" fill="#333">${thk*1000}mm</text>`;

  // Span info
  svg += `<text x="${svgW/2}" y="${svgH - 20}" text-anchor="middle" font-size="10" fill="#333">Span = ${spanL}m  |  Concrete: ${input.concreteGrade}  |  Steel: ${input.steelGrade}</text>`;

  svg += '</svg>';
  return svg;
}

// ── Hydraulic Profile + Scour Diagram ──────────────────────────────────────────
/**
 * Long-section showing HFL, bed level, mean and design scour curves
 * around each pier nose. Used as an annexure illustration of the
 * Lacey + ASTRA scour calculation.
 */
export function generateScourProfileSvg(input: EnhancedProjectInput): string {
  const a       = input as any;
  const totalL  = input.totalLength;
  const nPiers  = input.numberOfPiers;
  const spanL   = input.spanLength;
  const pierW   = input.pierWidth;
  const hfl     = input.hfl;
  const bed     = input.bedLevel;
  const dsm     = input.hydraulics?.scourDepth ?? 1.0;
  const dMax    = input.hydraulics?.designScourDepth ?? dsm * 1.272;
  const afflux  = input.hydraulics?.afflux ?? 0;

  const svgW    = 820;
  const margin  = 70;
  const drawW   = svgW - 2 * margin;
  const scaleX  = drawW / totalL;

  const waterH  = (hfl - bed) * SCALE;
  const deckY   = 70;
  const hflY    = deckY + 30;
  const dwlY    = hflY - afflux * SCALE * 0.5;
  const bedY    = hflY + waterH;
  const scourMaxY = bedY + dMax * SCALE;
  const svgH    = scourMaxY + 80;
  const toX = (x: number) => margin + x * scaleX;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#1F496B">HYDRAULIC PROFILE & SCOUR DIAGRAM — ${input.projectName}</text>`;
  svg += `<text x="${svgW/2}" y="38" text-anchor="middle" font-size="10" fill="#455A64">Lacey mean d_sm = ${dsm.toFixed(3)} m   |   ASTRA design D_max = ${dMax.toFixed(3)} m   |   Afflux h = ${afflux.toFixed(3)} m</text>`;

  // Water body fill
  svg += `<rect x="${margin}" y="${hflY}" width="${drawW}" height="${waterH}" fill="#bbdefb" opacity="0.5"/>`;

  // DWL (HFL+afflux) dashed
  if (afflux > 0) {
    svg += `<line x1="${margin}" y1="${dwlY}" x2="${svgW - margin}" y2="${dwlY}" stroke="#0d47a1" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg += `<text x="${svgW - margin + 5}" y="${dwlY + 3}" font-size="9" fill="#0d47a1">DWL ${(hfl + afflux).toFixed(2)}</text>`;
  }

  // HFL line
  svg += `<line x1="${margin}" y1="${hflY}" x2="${svgW - margin}" y2="${hflY}" stroke="#1976d2" stroke-width="2" stroke-dasharray="6,4"/>`;
  svg += `<text x="${svgW - margin + 5}" y="${hflY + 3}" font-size="9" fill="#1976d2">HFL ${hfl.toFixed(2)}</text>`;

  // Bed level line
  svg += `<line x1="${margin}" y1="${bedY}" x2="${svgW - margin}" y2="${bedY}" stroke="#795548" stroke-width="2"/>`;
  svg += `<text x="${svgW - margin + 5}" y="${bedY + 3}" font-size="9" fill="#795548">Bed ${bed.toFixed(2)}</text>`;

  // Mean scour line
  const meanScourY = bedY + dsm * SCALE;
  svg += `<line x1="${margin}" y1="${meanScourY}" x2="${svgW - margin}" y2="${meanScourY}" stroke="#ef6c00" stroke-width="1" stroke-dasharray="4,3"/>`;
  svg += `<text x="${margin - 5}" y="${meanScourY + 3}" text-anchor="end" font-size="9" fill="#ef6c00">d_sm</text>`;

  // Pier scour curves (parabolic dip around each pier)
  for (let i = 1; i <= nPiers; i++) {
    const px = toX(i * spanL);
    const half = pierW * scaleX * 1.4;
    // Parabolic scour cone going from bed → max at pier
    const dipDepth = dMax * SCALE;
    svg += `<path d="M ${px - half * 1.6} ${bedY} Q ${px} ${bedY + dipDepth} ${px + half * 1.6} ${bedY}" fill="#ffe0b2" stroke="#bf360c" stroke-width="1.5" opacity="0.85"/>`;

    // Pier shaft from deck to scoured bed
    svg += `<rect x="${px - pierW * scaleX / 2}" y="${deckY}" width="${pierW * scaleX}" height="${meanScourY - deckY}" fill="#cfd8dc" stroke="#37474f" stroke-width="1.5"/>`;
    svg += `<text x="${px}" y="${deckY + 12}" text-anchor="middle" font-size="9" font-weight="bold" fill="#263238">P${i}</text>`;

    // Scour-depth arrow at pier
    svg += `<line x1="${px}" y1="${bedY}" x2="${px}" y2="${bedY + dipDepth}" stroke="#bf360c" stroke-width="1.2" stroke-dasharray="2,2"/>`;
    svg += `<text x="${px + 8}" y="${bedY + dipDepth - 4}" font-size="9" fill="#bf360c">D=${dMax.toFixed(2)}m</text>`;
  }

  // Deck
  svg += `<rect x="${toX(0) - 5}" y="${deckY - 12}" width="${drawW + 10}" height="12" fill="#90a4ae" stroke="#37474f" stroke-width="1.5"/>`;
  svg += `<text x="${toX(0) + 4}" y="${deckY - 3}" font-size="9" fill="#263238">Deck Slab</text>`;

  // Founding RL marker
  const foundingRL = a.foundingLevel ?? a.foundationLevel ?? bed - dMax - 1;
  const foundY = bedY + (bed - foundingRL) * SCALE;
  if (foundY > bedY && foundY < svgH - 30) {
    svg += `<line x1="${margin}" y1="${foundY}" x2="${svgW - margin}" y2="${foundY}" stroke="#d32f2f" stroke-width="1.5" stroke-dasharray="8,3"/>`;
    svg += `<text x="${svgW - margin + 5}" y="${foundY + 3}" font-size="9" font-weight="bold" fill="#d32f2f">Found ${foundingRL.toFixed(2)}</text>`;
  }

  // Legend
  const legY = svgH - 40;
  svg += `<rect x="${margin}" y="${legY}" width="${drawW}" height="32" fill="#fff" stroke="#bdbdbd" stroke-width="0.5"/>`;
  svg += `<text x="${margin + 8}" y="${legY + 12}" font-size="9" fill="#333"><tspan fill="#1976d2">— HFL</tspan>   <tspan fill="#0d47a1">--- DWL (HFL+h)</tspan>   <tspan fill="#795548">— Bed</tspan>   <tspan fill="#ef6c00">--- Mean scour d_sm</tspan>   <tspan fill="#bf360c">— Pier scour D_max</tspan>   <tspan fill="#d32f2f">--- Founding RL</tspan></text>`;
  svg += `<text x="${margin + 8}" y="${legY + 26}" font-size="9" fill="#555">Founding level set HFL − F2·D_max per IRC:78-2014 Cl.706 (ASTRA factor 1.272 applied to Lacey mean scour).</text>`;

  svg += '</svg>';
  return svg;
}

// ── Pier Stability Free-Body Diagram ───────────────────────────────────────────
/**
 * Free-body diagram of a single pier showing all governing forces
 * (vertical: DL+LL+self; horizontal: water current, hydrodynamic, braking,
 * seismic) and the resultant overturning/sliding pair at footing base.
 */
export function generatePierStabilitySvg(input: EnhancedProjectInput): string {
  const a     = input as any;
  const pierW = input.pierWidth;
  const pierH = input.pierDepth;
  const ftgW  = a.pierFootingWidth ?? a.footingPierWidth ?? a.ftgPW ?? pierW + 2;
  const ftgT  = a.pierFootingThickness ?? a.footingPierThickness ?? a.ftgPT ?? 0.8;

  const svgW = 720;
  const svgH = 460;
  const cx   = svgW / 2;
  const baseY = svgH - 90;
  const scale = 35;
  const pxPierH = pierH * scale;
  const pxPierW = pierW * scale;
  const pxFtgW  = ftgW * scale;
  const pxFtgT  = ftgT * scale;
  const topY = baseY - pxPierH - pxFtgT;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#1F496B">PIER STABILITY FREE-BODY DIAGRAM — ${input.projectName}</text>`;
  svg += `<text x="${svgW/2}" y="38" text-anchor="middle" font-size="10" fill="#455A64">All forces at footing base — sliding, overturning and base-pressure check (IRC:78-2014)</text>`;

  // Defs (arrow heads)
  svg += `<defs>
    <marker id="vArr" markerWidth="10" markerHeight="10" refX="5" refY="9" orient="auto"><polygon points="0,0 10,0 5,9" fill="#1565c0"/></marker>
    <marker id="hArr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><polygon points="0,0 0,10 9,5" fill="#d32f2f"/></marker>
    <marker id="qArr" markerWidth="8" markerHeight="8" refX="4" refY="0" orient="auto"><polygon points="0,8 8,8 4,0" fill="#2e7d32"/></marker>
  </defs>`;

  // Pier shaft
  svg += `<rect x="${cx - pxPierW/2}" y="${topY}" width="${pxPierW}" height="${pxPierH}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  svg += `<text x="${cx}" y="${topY + pxPierH/2 + 4}" text-anchor="middle" font-size="9" fill="#1565c0">Pier ${pierW}×${pierH}m</text>`;

  // Footing
  svg += `<rect x="${cx - pxFtgW/2}" y="${baseY - pxFtgT}" width="${pxFtgW}" height="${pxFtgT}" fill="#fff3e0" stroke="#ef6c00" stroke-width="1.5"/>`;
  svg += `<text x="${cx + pxFtgW/2 + 5}" y="${baseY - pxFtgT/2 + 3}" font-size="9" fill="#ef6c00">B=${ftgW}m</text>`;

  // Ground (founding level)
  svg += `<line x1="${cx - pxFtgW/2 - 50}" y1="${baseY}" x2="${cx + pxFtgW/2 + 50}" y2="${baseY}" stroke="#5d4037" stroke-width="2"/>`;
  for (let g = -3; g < 4; g++) {
    const gx = cx + g * 30;
    svg += `<line x1="${gx}" y1="${baseY}" x2="${gx + 8}" y2="${baseY + 10}" stroke="#5d4037" stroke-width="0.7"/>`;
  }

  // Vertical loads (DL + LL) at pier top
  svg += `<line x1="${cx - 30}" y1="${topY - 60}" x2="${cx - 30}" y2="${topY - 8}" stroke="#1565c0" stroke-width="2.5" marker-end="url(#vArr)"/>`;
  svg += `<text x="${cx - 65}" y="${topY - 35}" font-size="10" font-weight="bold" fill="#1565c0">DL</text>`;
  svg += `<line x1="${cx + 30}" y1="${topY - 60}" x2="${cx + 30}" y2="${topY - 8}" stroke="#1565c0" stroke-width="2.5" marker-end="url(#vArr)"/>`;
  svg += `<text x="${cx + 38}" y="${topY - 35}" font-size="10" font-weight="bold" fill="#1565c0">LL+I</text>`;

  // Horizontal forces (water current, hydrodynamic, seismic, braking)
  const labels = [
    { y: topY + pxPierH * 0.20, lbl: 'Wind/Brake', side: 'right' },
    { y: topY + pxPierH * 0.45, lbl: 'Seismic',    side: 'left'  },
    { y: topY + pxPierH * 0.65, lbl: 'Hydro',      side: 'right' },
    { y: topY + pxPierH * 0.85, lbl: 'Current',    side: 'left'  },
  ];
  for (const l of labels) {
    if (l.side === 'right') {
      svg += `<line x1="${cx + pxPierW/2 + 60}" y1="${l.y}" x2="${cx + pxPierW/2 + 4}" y2="${l.y}" stroke="#d32f2f" stroke-width="2" marker-end="url(#hArr)"/>`;
      svg += `<text x="${cx + pxPierW/2 + 65}" y="${l.y - 3}" font-size="9" fill="#d32f2f">${l.lbl}</text>`;
    } else {
      svg += `<line x1="${cx - pxPierW/2 - 60}" y1="${l.y}" x2="${cx - pxPierW/2 - 4}" y2="${l.y}" stroke="#d32f2f" stroke-width="2" marker-start="url(#hArr)"/>`;
      svg += `<text x="${cx - pxPierW/2 - 100}" y="${l.y - 3}" font-size="9" fill="#d32f2f">${l.lbl}</text>`;
    }
  }

  // Resultant moment / sliding pair at base
  svg += `<text x="${cx}" y="${baseY + 24}" text-anchor="middle" font-size="10" font-weight="bold" fill="#37474f">Σ Moments &amp; ΣV at footing base ⇒ q_max, q_min, FOS_slide</text>`;

  // Base pressure trapezoid (qualitative)
  const trapY = baseY + 38;
  const trapW = pxFtgW * 0.95;
  svg += `<polygon points="${cx - trapW/2},${trapY} ${cx + trapW/2},${trapY} ${cx + trapW/2 - 8},${trapY + 28} ${cx - trapW/2 + 8},${trapY + 38}" fill="#c8e6c9" stroke="#2e7d32" stroke-width="1.2"/>`;
  // pressure arrows
  for (let p = 0; p < 6; p++) {
    const px = cx - trapW/2 + 6 + p * (trapW - 12) / 5;
    const tipY = trapY + 28 + (p / 5) * 10;
    svg += `<line x1="${px}" y1="${trapY}" x2="${px}" y2="${tipY}" stroke="#2e7d32" stroke-width="1" marker-end="url(#qArr)"/>`;
  }
  svg += `<text x="${cx - trapW/2 - 5}" y="${trapY + 50}" text-anchor="end" font-size="9" fill="#2e7d32">q_min</text>`;
  svg += `<text x="${cx + trapW/2 + 5}" y="${trapY + 50}" font-size="9" fill="#2e7d32">q_max</text>`;
  svg += `<text x="${cx}" y="${svgH - 8}" text-anchor="middle" font-size="9" fill="#1F496B">Verify q_max ≤ SBC, FOS_slide ≥ 1.5, e ≤ B/6 across all IRC:6 load combinations</text>`;

  svg += '</svg>';
  return svg;
}

// ── Abutment Earth-Pressure Diagram ───────────────────────────────────────────
/**
 * Cantilever-stem abutment with the Rankine active-pressure triangle drawn
 * to scale, water table (when partial submergence), surcharge, and the
 * resultant thrust at H/3 from the base.
 */
export function generateAbutmentPressureSvg(input: EnhancedProjectInput): string {
  const a     = input as any;
  const aT1   = a.abutmentType1 ?? {};
  const geom  = aT1.geometry ?? {};
  const ftg   = aT1.footing ?? {};
  const H     = geom.height ?? a.abt_H ?? 6;
  const Bw    = geom.width  ?? a.abt_tstem ?? 1;
  const Bbase = ftg.width   ?? geom.baseWidth ?? a.abt_Bbase ?? Math.max(0.6 * H, Bw + 1.0);
  const phi   = geom.phi    ?? a.abt_phi ?? a.phi ?? 30;
  const gamma = geom.gamma  ?? a.abt_gamma ?? 18;
  const Ka    = (1 - Math.sin((phi * Math.PI) / 180)) / (1 + Math.sin((phi * Math.PI) / 180));
  const Pa    = 0.5 * Ka * gamma * H * H;
  const yPa   = H / 3;

  const svgW = 760;
  const svgH = 480;
  const margin = 50;
  const scale = 38;
  const baseY = svgH - 80;
  const stemX = margin + 200;
  const pxH   = H * scale;
  const pxBw  = Bw * scale;
  const pxB   = Bbase * scale;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#1F496B">ABUTMENT EARTH PRESSURE DIAGRAM — ${input.projectName}</text>`;
  svg += `<text x="${svgW/2}" y="38" text-anchor="middle" font-size="10" fill="#455A64">Rankine active thrust (φ=${phi}°, γ=${gamma} kN/m³)   ⇒   K_a = ${Ka.toFixed(3)},  P_a = ½·K_a·γ·H² = ${Pa.toFixed(1)} kN/m</text>`;

  svg += `<defs><marker id="paArr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><polygon points="0,0 0,10 9,5" fill="#d32f2f"/></marker></defs>`;

  // Ground hatch
  svg += `<line x1="${margin}" y1="${baseY}" x2="${svgW - margin}" y2="${baseY}" stroke="#5d4037" stroke-width="2"/>`;

  // Stem
  svg += `<rect x="${stemX}" y="${baseY - pxH}" width="${pxBw}" height="${pxH}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  svg += `<text x="${stemX + pxBw/2}" y="${baseY - pxH/2}" text-anchor="middle" font-size="9" fill="#1565c0">Stem</text>`;

  // Footing
  svg += `<rect x="${stemX - (pxB - pxBw) * 0.5}" y="${baseY}" width="${pxB}" height="22"  fill="#fff3e0" stroke="#ef6c00" stroke-width="1.5"/>`;
  svg += `<text x="${stemX + pxBw/2}" y="${baseY + 38}" text-anchor="middle" font-size="9" fill="#ef6c00">B = ${Bbase.toFixed(2)} m</text>`;

  // Backfill (right of stem)
  for (let r = 0; r < 12; r++) {
    const yy = baseY - r * pxH / 12;
    svg += `<line x1="${stemX + pxBw}" y1="${yy}" x2="${stemX + pxBw + 90}" y2="${yy + 18}" stroke="#a1887f" stroke-width="0.5"/>`;
  }
  svg += `<text x="${stemX + pxBw + 50}" y="${baseY - pxH * 0.55}" text-anchor="middle" font-size="9" fill="#795548">Backfill</text>`;

  // Pressure triangle (Ka·γ·z) on stem earth face
  const baseP = Ka * gamma * H * 4; // pixel scale
  svg += `<polygon points="${stemX + pxBw},${baseY - pxH} ${stemX + pxBw},${baseY} ${stemX + pxBw + baseP},${baseY}" fill="#ffcdd2" stroke="#c62828" stroke-width="1.2" opacity="0.85"/>`;
  // arrows along the triangle
  for (let k = 0; k < 6; k++) {
    const fr = (k + 1) / 7;
    const yy = baseY - pxH + fr * pxH;
    const len = baseP * fr;
    svg += `<line x1="${stemX + pxBw + len}" y1="${yy}" x2="${stemX + pxBw + 2}" y2="${yy}" stroke="#d32f2f" stroke-width="1.4" marker-end="url(#paArr)"/>`;
  }
  // Resultant Pa at H/3 above base
  const yPaPx = baseY - yPa * scale;
  svg += `<line x1="${stemX + pxBw + baseP + 60}" y1="${yPaPx}" x2="${stemX + pxBw + 4}" y2="${yPaPx}" stroke="#b71c1c" stroke-width="3" marker-end="url(#paArr)"/>`;
  svg += `<text x="${stemX + pxBw + baseP + 65}" y="${yPaPx - 6}" font-size="10" font-weight="bold" fill="#b71c1c">P_a = ${Pa.toFixed(1)} kN/m  @  H/3</text>`;

  // H dimension
  svg += `<line x1="${stemX - 18}" y1="${baseY - pxH}" x2="${stemX - 18}" y2="${baseY}" stroke="#37474f" stroke-width="1"/>`;
  svg += `<text x="${stemX - 22}" y="${baseY - pxH/2}" text-anchor="end" font-size="10" fill="#37474f">H = ${H.toFixed(2)} m</text>`;

  // Stability summary line
  svg += `<text x="${svgW/2}" y="${svgH - 12}" text-anchor="middle" font-size="9" fill="#1F496B">Stability ⇒ FOS_overturn ≥ 2.0 (no LL),  FOS_slide ≥ 1.5,  q_max ≤ SBC,  e ≤ B/6   (IRC:78-2014 Cl.710)</text>`;

  svg += '</svg>';
  return svg;
}

// ── Slab Reinforcement Plan View ──────────────────────────────────────────────
/**
 * Plan view of a single deck slab span showing the dispersal-corrected
 * reinforcement layout (main + distribution bars, both faces).
 */
export function generateSlabReinfPlanSvg(input: EnhancedProjectInput): string {
  const a     = input as any;
  const spanL = input.spanLength;
  const cW    = input.carriageWidth;
  const tW    = a.totalWidth ?? a.deckWidth ?? cW + 1.5;

  const svgW = 820;
  const margin = 60;
  const scale = Math.min(540 / spanL, 220 / tW, 36);
  const pxL = spanL * scale;
  const pxW = tW * scale;
  const slabX = (svgW - pxL) / 2;
  const slabY = 80;

  const svgH = slabY + pxW + 110;

  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  svg += `<text x="${svgW/2}" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="#1F496B">DECK SLAB REINFORCEMENT PLAN — ${input.projectName}</text>`;
  svg += `<text x="${svgW/2}" y="38" text-anchor="middle" font-size="10" fill="#455A64">Single span: L = ${spanL} m  ×  W = ${tW} m  |  Concrete: ${input.concreteGrade}  |  Steel: ${input.steelGrade}</text>`;

  // Slab outline
  svg += `<rect x="${slabX}" y="${slabY}" width="${pxL}" height="${pxW}" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>`;

  // Main steel (parallel to span — across width) — closer spacing
  const mainSpacing = Math.max(8, scale * 0.150);
  const nMain = Math.floor(pxW / mainSpacing);
  for (let m = 0; m < nMain; m++) {
    const yy = slabY + (m + 0.5) * (pxW / nMain);
    svg += `<line x1="${slabX + 6}" y1="${yy}" x2="${slabX + pxL - 6}" y2="${yy}" stroke="#d32f2f" stroke-width="0.6"/>`;
  }
  svg += `<text x="${slabX + pxL/2}" y="${slabY + pxW + 18}" text-anchor="middle" font-size="10" font-weight="bold" fill="#d32f2f">Main steel (longitudinal): 20φ @ 150 c/c — bottom face</text>`;

  // Distribution steel (across) — perpendicular to main
  const dSpacing = Math.max(10, scale * 0.200);
  const nDist = Math.floor(pxL / dSpacing);
  for (let dx = 0; dx < nDist; dx++) {
    const xx = slabX + (dx + 0.5) * (pxL / nDist);
    svg += `<line x1="${xx}" y1="${slabY + 6}" x2="${xx}" y2="${slabY + pxW - 6}" stroke="#1976d2" stroke-width="0.6"/>`;
  }
  svg += `<text x="${slabX + pxL/2}" y="${slabY + pxW + 32}" text-anchor="middle" font-size="10" font-weight="bold" fill="#1976d2">Distribution steel (transverse): 12φ @ 200 c/c — both faces</text>`;

  // Carriageway markers (centre line of carriageway — shoulders shown if total > cw)
  const fpEach = (tW - cW) / 2 * scale;
  if (fpEach > 0) {
    svg += `<line x1="${slabX}" y1="${slabY + fpEach}" x2="${slabX + pxL}" y2="${slabY + fpEach}" stroke="#37474f" stroke-width="1" stroke-dasharray="6,3"/>`;
    svg += `<line x1="${slabX}" y1="${slabY + pxW - fpEach}" x2="${slabX + pxL}" y2="${slabY + pxW - fpEach}" stroke="#37474f" stroke-width="1" stroke-dasharray="6,3"/>`;
    svg += `<text x="${slabX - 6}" y="${slabY + pxW/2 + 4}" text-anchor="end" font-size="9" fill="#37474f">cw ${cW}m</text>`;
  }

  // Span dimension
  svg += `<line x1="${slabX}" y1="${slabY - 16}" x2="${slabX + pxL}" y2="${slabY - 16}" stroke="#333" stroke-width="1"/>`;
  svg += `<line x1="${slabX}" y1="${slabY - 20}" x2="${slabX}" y2="${slabY - 12}" stroke="#333" stroke-width="1"/>`;
  svg += `<line x1="${slabX + pxL}" y1="${slabY - 20}" x2="${slabX + pxL}" y2="${slabY - 12}" stroke="#333" stroke-width="1"/>`;
  svg += `<text x="${slabX + pxL/2}" y="${slabY - 22}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">L = ${spanL} m (effective span)</text>`;

  // Width dimension
  svg += `<line x1="${slabX + pxL + 18}" y1="${slabY}" x2="${slabX + pxL + 18}" y2="${slabY + pxW}" stroke="#333" stroke-width="1"/>`;
  svg += `<text x="${slabX + pxL + 22}" y="${slabY + pxW/2}" font-size="10" font-weight="bold" fill="#333" transform="rotate(90 ${slabX + pxL + 22} ${slabY + pxW/2})">W = ${tW} m</text>`;

  // Bearing markers at supports
  for (let s = 0; s < 2; s++) {
    const sx = s === 0 ? slabX : slabX + pxL;
    svg += `<rect x="${sx - 6}" y="${slabY + pxW + 4}" width="12" height="8" fill="#37474f"/>`;
    svg += `<text x="${sx}" y="${slabY + pxW + 22}" text-anchor="middle" font-size="9" fill="#37474f">Bearing</text>`;
  }

  svg += '</svg>';
  return svg;
}
