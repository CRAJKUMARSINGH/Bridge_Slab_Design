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
