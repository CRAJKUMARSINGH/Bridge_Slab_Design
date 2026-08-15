import type { EnhancedProjectInput } from '../bridge-excel-generator/types';

const SCALE = 40;
const TITLE_FILL = '#1F496B';

function svgShell(width: number, height: number, title: string, body: string): string {
  return [
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`,
    `<rect width="${width}" height="${height}" fill="#f8f9fa"/>`,
    `<text x="${width / 2}" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="${TITLE_FILL}">${escapeXml(title)}</text>`,
    body,
    '</svg>',
  ].join('');
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function n(value: number | undefined, digits = 2): string {
  const safe = value === undefined || value === null || Number.isNaN(value) ? 0 : value;
  return safe.toFixed(digits);
}

export function generateGADSvg(input: EnhancedProjectInput): string {
  const bridgeType = input.bridgeType === 'high-level' ? 'HIGH-LEVEL' : 'SUBMERSIBLE';
  const totalL = input.totalLength;
  const nPiers = input.numberOfPiers;
  const spanL = input.spanLength;
  const hfl = input.hfl;
  const bed = input.bedLevel;
  const abtW = input.abutmentType1?.geometry.width ?? input.abutmentWidth;
  const pierW = input.pierWidth;
  const pierD = input.pierDepth;
  const svgW = 800;
  const margin = 60;
  const drawW = svgW - 2 * margin;
  const scaleX = drawW / Math.max(totalL + 2 * abtW, 1);
  const waterH = hfl - bed;
  const slabThk = input.deckSlabThickness ?? 0.35;
  const reqFb = input.hydraulics?.requiredFreeboardAboveHfl ?? (input.freeboardAboveHfl ?? 1.2);
  const soffitLevel = input.bridgeType === 'high-level' ? (input.deckSoffitLevel ?? input.hfl + reqFb) : input.hfl;
  const freeboardPx = input.bridgeType === 'high-level' ? (soffitLevel - hfl) * SCALE : 0;
  const deckY = 80;
  const hflY = deckY + freeboardPx;
  const bedY = hflY + waterH * SCALE;
  const foundY = bedY + 40;
  const svgH = Math.max(400, (bedY - deckY) + 150);
  const toX = (x: number) => margin + (x + abtW) * scaleX;

  let body = '';
  body += `<text x="${svgW / 2}" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#455A64">${bridgeType} SLAB BRIDGE</text>`;
  body += `<line x1="${margin}" y1="${hflY}" x2="${svgW - margin}" y2="${hflY}" stroke="#1976d2" stroke-width="2" stroke-dasharray="6,4"/>`;
  body += `<text x="${margin - 5}" y="${hflY - 4}" text-anchor="end" font-size="9" fill="#1976d2">HFL ${n(hfl)}</text>`;
  body += `<line x1="${margin}" y1="${bedY}" x2="${svgW - margin}" y2="${bedY}" stroke="#8d6e63" stroke-width="2"/>`;
  body += `<text x="${margin - 5}" y="${bedY + 4}" text-anchor="end" font-size="9" fill="#8d6e63">BL ${n(bed)}</text>`;

  const deckThk = Math.max(8, slabThk * SCALE);
  body += `<rect x="${toX(0)}" y="${deckY - deckThk}" width="${totalL * scaleX}" height="${deckThk}" fill="#b0bec5" stroke="#546e7a" stroke-width="1.5"/>`;
  body += `<text x="${toX(totalL) + 8}" y="${deckY - 3}" font-size="8" fill="#546e7a">Soffit ${n(soffitLevel)}</text>`;

  if (input.bridgeType === 'high-level' && freeboardPx > 5) {
    const dimX = toX(totalL) + 20;
    body += `<line x1="${dimX}" y1="${deckY}" x2="${dimX}" y2="${hflY}" stroke="#555" stroke-width="1"/>`;
    body += `<text x="${dimX + 4}" y="${(deckY + hflY) / 2 + 4}" font-size="8" fill="#555">${n(soffitLevel - hfl)}m Freeboard</text>`;
  }

  const abtH = waterH * SCALE;
  const abtPxW = abtW * scaleX;
  body += `<rect x="${toX(-abtW)}" y="${deckY}" width="${abtPxW}" height="${abtH}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  body += `<rect x="${toX(totalL)}" y="${deckY}" width="${abtPxW}" height="${abtH}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  body += `<text x="${toX(-abtW / 2)}" y="${deckY + abtH / 2}" text-anchor="middle" font-size="8" fill="#1565c0">ABT-L</text>`;
  body += `<text x="${toX(totalL + abtW / 2)}" y="${deckY + abtH / 2}" text-anchor="middle" font-size="8" fill="#1565c0">ABT-R</text>`;

  const pierPxW = pierW * scaleX;
  for (let i = 1; i <= nPiers; i += 1) {
    const px = i * spanL;
    const pierX = toX(px) - pierPxW / 2;
    body += `<rect x="${pierX}" y="${deckY}" width="${pierPxW}" height="${pierD * SCALE}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/>`;
    body += `<text x="${toX(px)}" y="${deckY + (pierD * SCALE) / 2}" text-anchor="middle" font-size="8" fill="#2e7d32">P${i}</text>`;
  }

  for (let i = 0; i <= nPiers; i += 1) {
    const x1 = toX(i * spanL);
    const x2 = toX((i + 1) * spanL);
    const dimY = deckY - 20;
    body += `<line x1="${x1}" y1="${dimY}" x2="${x2}" y2="${dimY}" stroke="#555" stroke-width="1"/>`;
    body += `<text x="${(x1 + x2) / 2}" y="${dimY - 4}" text-anchor="middle" font-size="8" fill="#333">${n(spanL)}m</text>`;
  }

  body += `<line x1="${toX(0)}" y1="${foundY + 10}" x2="${toX(totalL)}" y2="${foundY + 10}" stroke="#333" stroke-width="1"/>`;
  body += `<text x="${toX(totalL / 2)}" y="${foundY + 22}" text-anchor="middle" font-size="9" font-weight="bold" fill="#333">Total Length = ${n(totalL)}m</text>`;
  return svgShell(svgW, svgH, `GENERAL ARRANGEMENT DRAWING - ${input.projectName}`, body);
}

export function generatePierSvg(input: EnhancedProjectInput): string {
  const pier = input.pier;
  const pierW = pier?.geometry.width ?? input.pierWidth;
  const pierL = pier?.geometry.length ?? input.pierLength;
  const pierD = pier?.geometry.depth ?? input.pierDepth;
  const baseW = pier?.footing.width ?? input.pierBaseWidth;
  const baseL = pier?.footing.length ?? input.pierBaseLength;
  const baseT = pier?.footing.thickness ?? 1.0;
  const capW = pier?.pierCap.width ?? (pierW + 0.5);
  const capT = pier?.pierCap.thickness ?? 0.8;
  const hfl = input.hfl;
  const bed = input.bedLevel;
  const waterH = hfl - bed;
  const svgW = 600;
  const svgH = 700;
  const cx = svgW / 2;
  const deckY = 80;
  const bedY = deckY + waterH * SCALE;
  const footY = bedY + pierD * SCALE;
  const pxW = pierW * SCALE;
  const pxBaseW = baseW * SCALE;
  const pxCapW = capW * SCALE;
  const arrowY = deckY + (waterH * SCALE) / 2;

  let body = '';
  body += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#d32f2f"/></marker></defs>`;
  body += `<rect x="${cx - pxCapW / 2}" y="${deckY}" width="${pxCapW}" height="${capT * SCALE}" fill="#cfd8dc" stroke="#546e7a" stroke-width="1.5"/>`;
  body += `<text x="${cx}" y="${deckY + (capT * SCALE) / 2 + 4}" text-anchor="middle" font-size="8" fill="#333">Pier Cap</text>`;
  body += `<rect x="${cx - pxW / 2}" y="${deckY + capT * SCALE}" width="${pxW}" height="${pierD * SCALE}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/>`;
  body += `<rect x="${cx - pxBaseW / 2}" y="${footY}" width="${pxBaseW}" height="${baseT * SCALE}" fill="#fff9c4" stroke="#f57f17" stroke-width="1.5"/>`;
  body += `<line x1="30" y1="${deckY}" x2="${svgW - 30}" y2="${deckY}" stroke="#1976d2" stroke-width="2" stroke-dasharray="6,4"/>`;
  body += `<text x="28" y="${deckY - 4}" text-anchor="end" font-size="9" fill="#1976d2">HFL ${n(hfl)}</text>`;
  body += `<line x1="30" y1="${bedY}" x2="${svgW - 30}" y2="${bedY}" stroke="#8d6e63" stroke-width="2"/>`;
  body += `<text x="28" y="${bedY + 4}" text-anchor="end" font-size="9" fill="#8d6e63">BL ${n(bed)}</text>`;
  body += `<line x1="${cx + pxW / 2 + 5}" y1="${arrowY}" x2="${cx + pxW / 2 + 55}" y2="${arrowY}" stroke="#d32f2f" stroke-width="2" marker-end="url(#arr)"/>`;
  body += `<text x="${cx + pxW / 2 + 10}" y="${arrowY - 5}" font-size="8" fill="#d32f2f">Drag</text>`;
  body += `<text x="${cx}" y="${footY + baseT * SCALE + 20}" text-anchor="middle" font-size="9" fill="#333">Base: ${n(baseW)}m x ${n(baseL)}m x ${n(baseT)}m</text>`;
  body += `<text x="${cx}" y="${deckY + capT * SCALE + (pierD * SCALE) / 2 + 4}" text-anchor="middle" font-size="9" fill="#2e7d32">${n(pierW)}m x ${n(pierL)}m x ${n(pierD)}m</text>`;
  return svgShell(svgW, svgH, `PIER ELEVATION - ${input.projectName}`, body);
}

export function generateAbutmentSvg(input: EnhancedProjectInput): string {
  const abt = input.abutmentType1;
  const h = abt?.geometry.height ?? input.abutmentHeight;
  const t = abt?.geometry.width ?? input.abutmentWidth;
  const base = abt?.geometry.baseWidth ?? (t + 1.5);
  const dw = abt?.geometry.dirtWallHeight ?? input.dirtWallHeight;
  const phi = input.phi;
  const gamma = input.gamma;
  const phiRad = (phi * Math.PI) / 180;
  const ka = Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2);
  const pa = 0.5 * ka * gamma * h * h;
  const svgW = 700;
  const svgH = 600;
  const cx = 250;
  const deckY = 80;
  const baseY = deckY + h * SCALE;
  const pxT = t * SCALE;
  const pxB = base * SCALE;
  const arrowY = deckY + (h * SCALE * 2) / 3;

  let body = '';
  body += `<defs><marker id="arr2" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#d32f2f"/></marker></defs>`;
  body += `<rect x="${cx - pxT / 2}" y="${deckY - 12}" width="${pxT + 20}" height="12" fill="#b0bec5" stroke="#546e7a" stroke-width="1.5"/>`;
  body += `<rect x="${cx - pxT / 2}" y="${deckY}" width="${pxT}" height="${h * SCALE}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  body += `<rect x="${cx - pxT / 2 - pxB * 0.4}" y="${baseY}" width="${pxB}" height="20" fill="#fff9c4" stroke="#f57f17" stroke-width="1.5"/>`;
  body += `<rect x="${cx + pxT / 2}" y="${deckY - dw * SCALE}" width="${pxT * 0.5}" height="${dw * SCALE}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1"/>`;
  body += `<text x="${cx}" y="${deckY + (h * SCALE) / 2 + 4}" text-anchor="middle" font-size="9" fill="#1565c0">H=${n(h)}m</text>`;
  for (let i = 0; i < 6; i += 1) {
    const hy = deckY + (i * h * SCALE) / 6;
    body += `<line x1="${cx + pxT / 2}" y1="${hy}" x2="${cx + pxT / 2 + 60}" y2="${hy + 15}" stroke="#a1887f" stroke-width="0.5"/>`;
  }
  body += `<line x1="${cx + pxT / 2 + 65}" y1="${arrowY}" x2="${cx + pxT / 2 + 5}" y2="${arrowY}" stroke="#d32f2f" stroke-width="2" marker-end="url(#arr2)"/>`;
  body += `<text x="${cx + pxT / 2 + 70}" y="${arrowY - 4}" font-size="8" fill="#d32f2f">Pa=${n(pa, 0)} kN/m</text>`;
  body += `<text x="${cx}" y="${baseY + 35}" text-anchor="middle" font-size="9" fill="#333">Ka=${n(ka, 3)} phi=${n(phi)} deg gamma=${n(gamma)} kN/m3</text>`;
  return svgShell(svgW, svgH, `TYPE-1 ABUTMENT SECTION - ${input.projectName}`, body);
}

export function generateSlabSvg(input: EnhancedProjectInput): string {
  const cW = input.carriageWidth;
  const thk = input.deckSlabThickness ?? 0.25;
  const spanL = input.spanLength;
  const svgW = 800;
  const svgH = 400;
  const slabX = 60;
  const slabY = 100;
  const pxW = cW * SCALE;
  const pxThk = thk * SCALE;
  let body = '';
  body += `<rect x="${slabX}" y="${slabY}" width="${pxW}" height="${pxThk}" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>`;
  body += `<rect x="${slabX}" y="${slabY}" width="${pxW}" height="3" fill="#b0bec5" stroke="none"/>`;
  body += `<text x="${slabX + pxW / 2}" y="${slabY - 5}" text-anchor="middle" font-size="8" fill="#546e7a">Wearing Coat 75 mm</text>`;
  const barSpacing = 15;
  const nBars = Math.floor(pxW / barSpacing);
  for (let i = 0; i < nBars; i += 1) {
    body += `<circle cx="${slabX + barSpacing / 2 + i * barSpacing}" cy="${slabY + pxThk - 8}" r="3" fill="#d32f2f"/>`;
  }
  body += `<text x="${slabX + pxW / 2}" y="${slabY + pxThk + 15}" text-anchor="middle" font-size="8" fill="#d32f2f">Main Steel</text>`;
  const nDistBars = Math.floor(pxW / 20);
  for (let i = 0; i < nDistBars; i += 1) {
    body += `<circle cx="${slabX + 10 + i * 20}" cy="${slabY + 8}" r="2.5" fill="#1976d2"/>`;
  }
  body += `<text x="${slabX + pxW / 2}" y="${slabY - 15}" text-anchor="middle" font-size="8" fill="#1976d2">Distribution Steel</text>`;
  body += `<line x1="${slabX}" y1="${slabY + pxThk + 25}" x2="${slabX + pxW}" y2="${slabY + pxThk + 25}" stroke="#333" stroke-width="1"/>`;
  body += `<text x="${slabX + pxW / 2}" y="${slabY + pxThk + 38}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">Width = ${n(cW)}m</text>`;
  body += `<line x1="${slabX - 15}" y1="${slabY}" x2="${slabX - 15}" y2="${slabY + pxThk}" stroke="#333" stroke-width="1"/>`;
  body += `<text x="${slabX - 18}" y="${slabY + pxThk / 2 + 4}" text-anchor="end" font-size="9" fill="#333">${n(thk * 1000, 0)} mm</text>`;
  body += `<text x="${svgW / 2}" y="${svgH - 20}" text-anchor="middle" font-size="10" fill="#333">Span = ${n(spanL)}m | Concrete: ${escapeXml(input.concreteGrade)} | Steel: ${escapeXml(input.steelGrade)}</text>`;
  return svgShell(svgW, svgH, `DECK SLAB CROSS-SECTION - ${input.projectName}`, body);
}

export function generateScourProfileSvg(input: EnhancedProjectInput): string {
  const totalL = input.totalLength;
  const nPiers = input.numberOfPiers;
  const spanL = input.spanLength;
  const pierW = input.pierWidth;
  const hfl = input.hfl;
  const bed = input.bedLevel;
  const dsm = input.hydraulics?.scourDepth ?? 1;
  const dMax = input.hydraulics?.designScourDepth ?? dsm * 1.272;
  const afflux = input.hydraulics?.afflux ?? 0;
  const svgW = 820;
  const margin = 70;
  const drawW = svgW - 2 * margin;
  const scaleX = drawW / Math.max(totalL, 1);
  const hflY = 100;
  const dwlY = hflY - afflux * SCALE * 0.5;
  const bedY = hflY + (hfl - bed) * SCALE;
  const scourMaxY = bedY + dMax * SCALE + 35;
  const svgH = scourMaxY + 80;
  const toX = (x: number) => margin + x * scaleX;

  let body = '';
  body += `<line x1="${margin}" y1="${hflY}" x2="${svgW - margin}" y2="${hflY}" stroke="#1976d2" stroke-width="2" stroke-dasharray="6,4"/>`;
  body += `<text x="${margin - 8}" y="${hflY - 4}" text-anchor="end" font-size="9" fill="#1976d2">HFL ${n(hfl)}</text>`;
  body += `<line x1="${margin}" y1="${dwlY}" x2="${svgW - margin}" y2="${dwlY}" stroke="#42a5f5" stroke-width="1.5" stroke-dasharray="3,3"/>`;
  body += `<text x="${margin - 8}" y="${dwlY - 4}" text-anchor="end" font-size="9" fill="#42a5f5">DWL ${n(input.hydraulics?.designWaterLevel ?? (hfl + afflux))}</text>`;
  body += `<line x1="${margin}" y1="${bedY}" x2="${svgW - margin}" y2="${bedY}" stroke="#6d4c41" stroke-width="2"/>`;
  body += `<text x="${margin - 8}" y="${bedY + 4}" text-anchor="end" font-size="9" fill="#6d4c41">Bed ${n(bed)}</text>`;

  for (let i = 0; i <= nPiers + 1; i += 1) {
    const x = i === 0 ? 0 : i === nPiers + 1 ? totalL : i * spanL;
    body += `<line x1="${toX(x)}" y1="${hflY - 12}" x2="${toX(x)}" y2="${scourMaxY}" stroke="#d0d7de" stroke-width="0.8"/>`;
  }

  let meanPath = `M ${toX(0)} ${bedY + dsm * SCALE}`;
  let designPath = `M ${toX(0)} ${bedY + dMax * SCALE}`;
  for (let i = 1; i <= nPiers; i += 1) {
    const centerX = toX(i * spanL);
    const halfPier = (pierW * scaleX) / 2;
    meanPath += ` L ${centerX - halfPier} ${bedY + dsm * SCALE} Q ${centerX} ${bedY + (dsm + 0.4) * SCALE} ${centerX + halfPier} ${bedY + dsm * SCALE}`;
    designPath += ` L ${centerX - halfPier} ${bedY + dMax * SCALE} Q ${centerX} ${bedY + (dMax + 0.5) * SCALE} ${centerX + halfPier} ${bedY + dMax * SCALE}`;
  }
  meanPath += ` L ${toX(totalL)} ${bedY + dsm * SCALE}`;
  designPath += ` L ${toX(totalL)} ${bedY + dMax * SCALE}`;
  body += `<path d="${meanPath}" fill="none" stroke="#ff8f00" stroke-width="2"/>`;
  body += `<path d="${designPath}" fill="none" stroke="#d32f2f" stroke-width="2.4"/>`;
  body += `<text x="${svgW - margin}" y="${bedY + dsm * SCALE - 8}" text-anchor="end" font-size="9" fill="#ff8f00">Mean scour dsm = ${n(dsm, 3)} m</text>`;
  body += `<text x="${svgW - margin}" y="${bedY + dMax * SCALE + 12}" text-anchor="end" font-size="9" fill="#d32f2f">Design scour Dmax = ${n(dMax, 3)} m</text>`;

  for (let i = 1; i <= nPiers; i += 1) {
    const centerX = toX(i * spanL);
    const pierPxW = pierW * scaleX;
    body += `<rect x="${centerX - pierPxW / 2}" y="${hflY}" width="${pierPxW}" height="${bedY - hflY}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.2"/>`;
    body += `<text x="${centerX}" y="${hflY - 8}" text-anchor="middle" font-size="8" fill="#2e7d32">Pier ${i}</text>`;
  }

  body += `<text x="${margin}" y="${svgH - 24}" font-size="10" fill="#455A64">Narrative: profile shows HFL, afflux-raised DWL, bed line, mean Lacey scour and ASTRA-amplified design scour around pier noses.</text>`;
  return svgShell(svgW, svgH, `D-04 HYDRAULIC PROFILE AND SCOUR DIAGRAM - ${input.projectName}`, body);
}

export function generatePierStabilitySvg(input: EnhancedProjectInput): string {
  const pier = input.pier;
  const loads = pier?.loads;
  const footing = pier?.footing;
  const svgW = 760;
  const svgH = 560;
  const cx = 240;
  const baseY = 410;
  const pierW = (pier?.geometry.width ?? input.pierWidth) * 65;
  const pierH = (pier?.geometry.depth ?? input.pierDepth) * 35;
  const footingW = (footing?.width ?? input.pierBaseWidth) * 55;
  const footingT = (footing?.thickness ?? 1) * 35;
  const qMax = footing?.basePressure.max ?? input.sbc * 0.8;
  const qMin = footing?.basePressure.min ?? Math.max(0, qMax * 0.45);

  let body = '';
  body += `<defs><marker id="arr-red" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#d32f2f"/></marker><marker id="arr-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#1565c0"/></marker></defs>`;
  body += `<rect x="${cx - pierW / 2}" y="${baseY - footingT - pierH}" width="${pierW}" height="${pierH}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="1.5"/>`;
  body += `<rect x="${cx - footingW / 2}" y="${baseY - footingT}" width="${footingW}" height="${footingT}" fill="#fff9c4" stroke="#f57f17" stroke-width="1.5"/>`;
  body += `<line x1="80" y1="${baseY}" x2="680" y2="${baseY}" stroke="#6d4c41" stroke-width="2"/>`;
  body += `<text x="82" y="${baseY - 6}" font-size="9" fill="#6d4c41">Footing base</text>`;

  const vertTop = baseY - footingT - pierH - 55;
  body += `<line x1="${cx}" y1="${vertTop}" x2="${cx}" y2="${baseY - footingT - pierH}" stroke="#1565c0" stroke-width="2" marker-end="url(#arr-blue)"/>`;
  body += `<text x="${cx + 6}" y="${vertTop + 14}" font-size="9" fill="#1565c0">W = ${n(loads?.deadLoad)} + ${n(loads?.liveLoad)} kN</text>`;

  const horY = baseY - footingT - pierH / 2;
  body += `<line x1="${cx + pierW / 2 + 10}" y1="${horY}" x2="${cx + pierW / 2 + 110}" y2="${horY}" stroke="#d32f2f" stroke-width="2" marker-end="url(#arr-red)"/>`;
  body += `<text x="${cx + pierW / 2 + 14}" y="${horY - 6}" font-size="9" fill="#d32f2f">H = ${n(loads?.dragForce)} + ${n(loads?.hydrostaticForce)} kN</text>`;

  const pressureX = 470;
  const pressureBaseY = baseY;
  const pressureTopLeft = pressureBaseY - 30;
  const pressureTopRight = pressureBaseY - 70;
  body += `<polygon points="${pressureX},${pressureBaseY} ${pressureX + 120},${pressureBaseY} ${pressureX + 120},${pressureTopRight} ${pressureX},${pressureTopLeft}" fill="rgba(255,152,0,0.18)" stroke="#ef6c00" stroke-width="1.5"/>`;
  body += `<text x="${pressureX + 60}" y="${pressureBaseY + 18}" text-anchor="middle" font-size="9" fill="#ef6c00">Base pressure trapezoid</text>`;
  body += `<text x="${pressureX - 8}" y="${pressureTopLeft + 4}" text-anchor="end" font-size="8" fill="#ef6c00">qmin ${n(qMin)}</text>`;
  body += `<text x="${pressureX + 128}" y="${pressureTopRight + 4}" font-size="8" fill="#ef6c00">qmax ${n(qMax)}</text>`;

  body += `<text x="70" y="470" font-size="10" fill="#455A64">Narrative: vertical restoring force, lateral hydraulic force and resulting footing pressure are shown on the same sketch so the equilibrium story remains auditable.</text>`;
  return svgShell(svgW, svgH, `D-05 PIER STABILITY FREE-BODY - ${input.projectName}`, body);
}

export function generateAbutmentPressureSvg(input: EnhancedProjectInput): string {
  const abt = input.abutmentType1 ?? input.abutmentC1;
  const h = abt?.geometry.height ?? input.abutmentHeight;
  const phi = input.phi;
  const gamma = input.gamma;
  const ka = abt?.earthPressure?.ka ?? Math.pow(Math.tan(Math.PI / 4 - ((phi * Math.PI) / 180) / 2), 2);
  const pa = abt?.earthPressure?.pa ?? (0.5 * ka * gamma * h * h);
  const svgW = 760;
  const svgH = 540;
  const baseY = 420;
  const stemX = 240;
  const stemTopY = baseY - h * 55;

  let body = '';
  body += `<defs><marker id="arr-pa" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#d32f2f"/></marker></defs>`;
  body += `<rect x="${stemX}" y="${stemTopY}" width="48" height="${h * 55}" fill="#e3f2fd" stroke="#1565c0" stroke-width="1.5"/>`;
  body += `<rect x="${stemX - 70}" y="${baseY}" width="200" height="20" fill="#fff9c4" stroke="#f57f17" stroke-width="1.5"/>`;
  body += `<polygon points="${stemX + 150},${baseY} ${stemX + 150},${stemTopY} ${stemX + 270},${baseY}" fill="rgba(244,67,54,0.18)" stroke="#d32f2f" stroke-width="1.5"/>`;
  body += `<line x1="${stemX + 150}" y1="${baseY - (h * 55) / 3}" x2="${stemX + 70}" y2="${baseY - (h * 55) / 3}" stroke="#d32f2f" stroke-width="2" marker-end="url(#arr-pa)"/>`;
  body += `<text x="${stemX + 158}" y="${baseY - (h * 55) / 3 - 8}" font-size="9" fill="#d32f2f">Pa = ${n(pa)} kN/m at H/3</text>`;
  body += `<text x="${stemX + 182}" y="${stemTopY - 10}" text-anchor="middle" font-size="9" fill="#795548">Rankine triangle</text>`;
  body += `<text x="${stemX - 14}" y="${(stemTopY + baseY) / 2}" text-anchor="end" font-size="9" fill="#1565c0">H = ${n(h)} m</text>`;
  body += `<text x="80" y="472" font-size="10" fill="#455A64">Narrative: active earth pressure is idealised as a Rankine triangle, with resultant Pa acting at one-third the retained height above footing level.</text>`;
  body += `<text x="80" y="490" font-size="9" fill="#455A64">Ka = ${n(ka, 3)}, phi = ${n(phi)} deg, gamma = ${n(gamma)} kN/m3.</text>`;
  return svgShell(svgW, svgH, `D-06 ABUTMENT EARTH-PRESSURE DIAGRAM - ${input.projectName}`, body);
}

export function generateSlabReinfPlanSvg(input: EnhancedProjectInput): string {
  const span = input.spanLength;
  const width = input.carriageWidth;
  const svgW = 860;
  const svgH = 500;
  const planX = 80;
  const planY = 90;
  const planW = Math.max(360, span * 40);
  const planH = Math.max(140, width * 35);
  const clearCover = 40;
  const mainSpacing = 150;
  const distSpacing = 200;
  const mainBars = Math.max(4, Math.floor(planW / 24));
  const distBars = Math.max(4, Math.floor(planH / 26));

  let body = '';
  body += `<rect x="${planX}" y="${planY}" width="${planW}" height="${planH}" fill="#eef5ff" stroke="#1565c0" stroke-width="2"/>`;
  for (let i = 0; i < mainBars; i += 1) {
    const x = planX + clearCover + (i * (planW - 2 * clearCover)) / Math.max(mainBars - 1, 1);
    body += `<line x1="${x}" y1="${planY + 16}" x2="${x}" y2="${planY + planH - 16}" stroke="#d32f2f" stroke-width="2"/>`;
  }
  for (let i = 0; i < distBars; i += 1) {
    const y = planY + clearCover + (i * (planH - 2 * clearCover)) / Math.max(distBars - 1, 1);
    body += `<line x1="${planX + 16}" y1="${y}" x2="${planX + planW - 16}" y2="${y}" stroke="#1976d2" stroke-width="1.5" stroke-dasharray="5,3"/>`;
  }
  body += `<text x="${planX + planW / 2}" y="${planY - 12}" text-anchor="middle" font-size="10" fill="#d32f2f">Main bars along span (dispersal-corrected design strip)</text>`;
  body += `<text x="${planX + planW / 2}" y="${planY + planH + 20}" text-anchor="middle" font-size="10" fill="#1976d2">Distribution bars across width</text>`;
  body += `<line x1="${planX}" y1="${planY + planH + 42}" x2="${planX + planW}" y2="${planY + planH + 42}" stroke="#333" stroke-width="1"/>`;
  body += `<text x="${planX + planW / 2}" y="${planY + planH + 56}" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">Span = ${n(span)} m</text>`;
  body += `<line x1="${planX + planW + 28}" y1="${planY}" x2="${planX + planW + 28}" y2="${planY + planH}" stroke="#333" stroke-width="1"/>`;
  body += `<text x="${planX + planW + 22}" y="${planY + planH / 2}" text-anchor="end" font-size="10" fill="#333">Width = ${n(width)} m</text>`;
  body += `<text x="530" y="155" font-size="10" fill="#455A64">Main reinforcement</text>`;
  body += `<text x="530" y="174" font-size="9" fill="#d32f2f">Adopted note: approximately 20 mm dia @ ${mainSpacing} mm c/c</text>`;
  body += `<text x="530" y="212" font-size="10" fill="#455A64">Distribution reinforcement</text>`;
  body += `<text x="530" y="231" font-size="9" fill="#1976d2">Adopted note: approximately 12 mm dia @ ${distSpacing} mm c/c</text>`;
  body += `<text x="530" y="275" font-size="10" fill="#455A64">Audit note</text>`;
  body += `<text x="530" y="294" font-size="9" fill="#455A64">Plan is schematic, but dimensions and strip orientation are taken from the same bridge geometry that drives the slab design report.</text>`;
  return svgShell(svgW, svgH, `D-07 SLAB REINFORCEMENT PLAN - ${input.projectName}`, body);
}
