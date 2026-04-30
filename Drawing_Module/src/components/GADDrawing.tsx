import type { ReactElement } from "react";
import { useMemo } from "react";
import {
  DrawingDefs, DrawingBorder, TitleBlock, ScaleBar, NorthArrow,
  dimH, dimV, rlLine, COLORS, scaledStroke,
} from "../lib/drawing-utils";
import type { CompleteDesignResult } from "../../../bridge-excel-generator/types";

// Ground-level interpolation helper
function makeGetGL(crossSectionData: { chainage: number; gl: number }[], bedLevel: number) {
  return function getGL(x: number): number {
    if (!crossSectionData || crossSectionData.length === 0) return bedLevel;
    const sorted = [...crossSectionData].sort((a, b) => a.chainage - b.chainage);
    if (x <= sorted[0].chainage) return sorted[0].gl;
    if (x >= sorted[sorted.length - 1].chainage) return sorted[sorted.length - 1].gl;
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (x >= a.chainage && x <= b.chainage) {
        const t = (x - a.chainage) / (b.chainage - a.chainage);
        return a.gl + t * (b.gl - a.gl);
      }
    }
    return bedLevel;
  };
}

export function GADDrawing({ results }: { results: CompleteDesignResult }): ReactElement {
  const { input, pier, abutmentType1 } = results;

  const {
    spanLength, numberOfSpans,
    abutmentWidth, abutmentHeight,
    pierWidth, pierDepth,
    pierBaseWidth, pierBaseLength,
    dirtWallHeight,
    carriageWidth,
    rtl, hfl, bedLevel, foundationLevel,
    nbl, ofl, agl,
    projectName, location, riverName,
    concreteGrade, steelGrade, fck, fy, sbc,
    discharge, laceysSiltFactor,
    crossSectionData,
    numberOfPiers: nP,
    skew = 0,
  } = input;

  const totalLength = spanLength * numberOfSpans;

  // Derived geometry
  const slabDepth = Math.min(1.20, Math.max(0.35,
    Math.round(((spanLength * 1000) / 15 / 50)) * 50 / 1000));
  const wearCoat    = 0.075;
  const capDepth    = pier?.pierCap?.thickness ?? 0.50;
  const capOvhg     = ((pier?.pierCap?.width ?? (pierWidth + 0.6)) - pierWidth) / 2 || 0.30;
  const rccFndDepth = pier?.footing?.thickness ?? 1.00;
  const pccDepth    = 0.15;

  // Canvas
  const W = 1440;
  const H = 900;
  const BDR = 12;
  const TOP_BAR = 44;
  const BOT_BAR = 80;
  const L_MARGIN = 60;
  const R_MARGIN = 220;

  // Split into Elevation (Top) and Plan (Bottom)
  const PANEL_H = (H - BDR * 2 - TOP_BAR - BOT_BAR - 20) / 2;
  const drawW = W - BDR * 2 - L_MARGIN - R_MARGIN;
  const drawH = PANEL_H;

  // Scale
  const approach    = 3.0;
  const horizTotal  = totalLength + abutmentWidth * 2 + approach * 2;
  const vertTop     = rtl + dirtWallHeight + 1.5;
  const vertBot     = foundationLevel - pccDepth - 0.8;
  const vertTotal   = vertTop - vertBot;

  const S  = Math.min(drawW / horizTotal, drawH / vertTotal);
  const OX = BDR + L_MARGIN + approach * S;
  const OY = BDR + TOP_BAR + 4;

  const ex = (x: number) => OX + x * S;
  const ey = (lvl: number) => OY + (vertTop - lvl) * S;

  // Key coordinates
  const yRTL       = ey(rtl);
  const yDeckT     = ey(rtl + wearCoat);
  const yDeckB     = ey(rtl - slabDepth);
  const yCapB      = ey(rtl - slabDepth - capDepth);
  const yHFL       = ey(hfl);
  const yOFL       = ey(ofl);
  const yNBL       = ey(nbl);
  const yBed       = ey(bedLevel);
  const yFndRCCTop = ey(foundationLevel + rccFndDepth);
  const yFndRCCBot = ey(foundationLevel);
  const yPccBot    = ey(foundationLevel - pccDepth);

  // Abutment x-coords
  const xAbL1 = ex(0);
  const xAbL2 = ex(abutmentWidth);
  const xAbR1 = ex(abutmentWidth + totalLength);
  const xAbR2 = ex(abutmentWidth * 2 + totalLength);

  // Pier data
  const pierData = Array.from({ length: nP }, (_, i) => {
    const xCentre = abutmentWidth + spanLength * (i + 1);
    return { x: ex(xCentre), xm: xCentre };
  });

  // NGL variables
  const abtHeight     = abutmentType1?.geometry?.height    ?? abutmentHeight;
  const nglAbutment   = Number.isFinite(agl) ? agl : (rtl - abtHeight);
  const midPierLocalX = abutmentWidth + totalLength / 2;
  const getGL         = makeGetGL(crossSectionData ?? [], bedLevel);
  const xs0           = input.crossSectionData?.[0]?.chainage ?? 0;
  const midPierChainage = xs0 + totalLength / 2;
  const nglMidPier    = getGL(midPierChainage);
  const yNGLAbut      = ey(nglAbutment);
  const yNGLMidPier   = ey(nglMidPier);

  // Right panel x
  const RP_X = BDR + L_MARGIN + drawW + 10;
  const heavy = scaledStroke(2, W);
  const mid = scaledStroke(1.2, W);

  // Scale value for title block
  const pxPerMm  = W / 841;
  const scaleVal = Math.round((1000 / (S / pxPerMm)) / 5) * 5;

  const today = new Date().toLocaleDateString("en-IN",
    { day: "2-digit", month: "short", year: "numeric" });

  // RL table data
  const levels: [string, string, number][] = [
    ["RTL",  "Road Top Level",          rtl],
    ["HFL",  "Highest Flood Level",     hfl],
    ["OFL",  "Ordinary Flood Level",    ofl],
    ["NBL",  "Normal Bed Level",        nbl],
    ["BL",   "Average Bed Level",       bedLevel],
    ["FL",   "Foundation Level",        foundationLevel],
    ["NGL (Abutments)", "Natural Ground — A1 & A2", nglAbutment],
    ["NGL (Mid-Pier)", `Natural Ground — P${Math.ceil(nP / 2)}`, nglMidPier],
  ];

  // NGL Interpolation Helper
  const getGLLocal = (ch: number) => {
    if (!crossSectionData || crossSectionData.length === 0) return agl;
    const sorted = [...crossSectionData].sort((a, b) => a.chainage - b.chainage);
    if (ch <= sorted[0].chainage) return sorted[0].gl;
    if (ch >= sorted[sorted.length - 1].chainage) return sorted[sorted.length - 1].gl;
    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (ch >= p1.chainage && ch <= p2.chainage) {
        const r = (ch - p1.chainage) / (p2.chainage - p1.chainage);
        return p1.gl + r * (p2.gl - p1.gl);
      }
    }
    return agl;
  };

  const groundLinePoints = useMemo(() => {
    const pts: [number, number][] = [];
    const step = 1; // 1m intervals
    const startCh = -10;
    const endCh = totalLength + abutmentWidth * 2 + 10;
    for (let ch = startCh; ch <= endCh; ch += step) {
      pts.push([ex(ch), ey(getGLLocal(ch))]);
    }
    return pts.map(p => `${p[0]},${p[1]}`).join(" ");
  }, [totalLength, abutmentWidth, crossSectionData, agl, bedLevel]);

  // Skew calculations
  const skewRad = (skew * Math.PI) / 180;
  const skewShift = Math.sin(skewRad);
  const skewScale = 1 / Math.cos(skewRad);

  // ── GRID CALCULATIONS ────────────────────────────────────────────────────
  const xincr = 5; // 5m chainage increment
  const yincr = 1; // 1m RL increment
  const gridL = BDR + L_MARGIN;
  const gridR = RP_X - 10;
  const gridB = H - BDR - BOT_BAR - 10;
  const gridT = OY;

  return (
    <div className="gad-drawing">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block mx-auto bg-white shadow-lg border border-border rounded-lg">
        <defs>
          <DrawingDefs />
          <clipPath id="gad-clip">
            <rect x={BDR + L_MARGIN - 5} y={BDR + TOP_BAR}
              width={drawW + 10} height={drawH + 10} />
          </clipPath>
        </defs>

        <DrawingBorder w={W} h={H} />

        {/* ── 1. LAYOUT GRID (Chainage & RL) ────────────────────────── */}
        <g opacity="0.4">
          {/* Y-Axis (RL) */}
          <line x1={gridL} y1={ey(vertBot)} x2={gridL} y2={ey(vertTop)} stroke={COLORS.DIMENSION} strokeWidth="1" />
          {(() => {
            const startRL = Math.ceil(vertBot);
            const endRL   = Math.floor(vertTop);
            const ticks   = [];
            for (let r = startRL; r <= endRL; r += yincr) {
              const y = ey(r);
              ticks.push(
                <g key={r}>
                  <line x1={gridL - 4} y1={y} x2={gridL} y2={y} stroke={COLORS.DIMENSION} strokeWidth="0.8" />
                  <text x={gridL - 7} y={y + 3} textAnchor="end" fontSize="7" fill={COLORS.DIMENSION}>{r.toFixed(0)}</text>
                </g>
              );
            }
            return ticks;
          })()}

          {/* X-Axis (Chainage) */}
          <line x1={gridL} y1={gridB} x2={gridR} y2={gridB} stroke={COLORS.DIMENSION} strokeWidth="1" />
          {(() => {
            const spanDist = totalLength + abutmentWidth * 2;
            const ticks = [];
            for (let x = 0; x <= spanDist + approach * 2; x += xincr) {
              const xc = ex(x - approach);
              if (xc < gridL || xc > gridR) continue;
              ticks.push(
                <g key={x}>
                  <line x1={xc} y1={gridB} x2={xc} y2={gridB + 4} stroke={COLORS.DIMENSION} strokeWidth="0.8" />
                  <text x={xc} y={gridB + 12} textAnchor="middle" fontSize="7" fill={COLORS.DIMENSION} transform={`rotate(90, ${xc}, ${gridB + 12})`}>
                    {(xs0 + x - approach).toFixed(1)}
                  </text>
                </g>
              );
            }
            return ticks;
          })()}
        </g>

        {/* Title bar */}
        <rect x={BDR} y={BDR} width={W - BDR * 2} height={TOP_BAR - 4} fill={COLORS.STRUCTURE} />
        <text x={W / 2} y={BDR + 17} textAnchor="middle" fontSize="13" fontWeight="bold"
          fill="#fff" fontFamily="Arial,sans-serif">
          GENERAL ARRANGEMENT DRAWING — ELEVATION
        </text>
        <text x={W / 2} y={BDR + 31} textAnchor="middle" fontSize="8.5" fill="#b8d4e8"
          fontFamily="Arial,sans-serif">
          {projectName} &nbsp;|&nbsp; {riverName} at {location}
        </text>
        <text x={W / 2} y={BDR + 42} textAnchor="middle" fontSize="8" fill="#90b8d0"
          fontFamily="Arial,sans-serif">
          {numberOfSpans} x {spanLength}m = {totalLength}m &nbsp;|&nbsp;
          {nP} Piers &nbsp;|&nbsp; {concreteGrade}/{steelGrade} &nbsp;|&nbsp;
          Q = {discharge} cumecs &nbsp;|&nbsp; SBC = {sbc} kN/m2
        </text>

        {/* ── GROUND PROFILE (Interpolated NGL) ────────────────────── */}
        <polyline points={groundLinePoints} fill="none"
          stroke={COLORS.GROUND} strokeWidth={mid} strokeDasharray="8 4"
          clipPath="url(#gad-clip)" />

        {/* NGL markers at abutments and mid-pier */}
        {/* NGL at A1 (left abutment) */}
        <line x1={xAbL1 - 20} y1={yNGLAbut} x2={xAbL2 + 10} y2={yNGLAbut}
          stroke={COLORS.SECONDARY} strokeWidth={mid} strokeDasharray="6 3" />
        <text x={xAbL1 - 22} y={yNGLAbut - 3} textAnchor="end" fontSize="7"
          fill="#2e7d32" fontFamily="Arial,sans-serif">NGL A1 {nglAbutment.toFixed(3)}</text>
        {/* NGL at A2 (right abutment) */}
        <line x1={xAbR1 - 10} y1={yNGLAbut} x2={xAbR2 + 20} y2={yNGLAbut}
          stroke={COLORS.SECONDARY} strokeWidth={mid} strokeDasharray="6 3" />
        <text x={xAbR2 + 22} y={yNGLAbut - 3} fontSize="7"
          fill="#2e7d32" fontFamily="Arial,sans-serif">NGL A2 {nglAbutment.toFixed(3)}</text>
        {/* NGL at mid-pier */}
        {nP > 0 && (() => {
          const midIdx = Math.floor(nP / 2);
          const midPcx = pierData[midIdx]?.x ?? ex(midPierLocalX);
          return (
            <g>
              <line x1={midPcx - 30} y1={yNGLMidPier} x2={midPcx + 30} y2={yNGLMidPier}
                stroke={COLORS.HIGHLIGHT} strokeWidth={mid} strokeDasharray="5 3" />
              <text x={midPcx} y={yNGLMidPier - 4} textAnchor="middle" fontSize="7"
                fill="#e65100" fontFamily="Arial,sans-serif">
                NGL P{midIdx + 1} {nglMidPier.toFixed(3)}
              </text>
            </g>
          );
        })()}

        {/* LEFT ABUTMENT */}
        <rect x={ex(-approach)} y={yRTL}
          width={approach * S} height={Math.max(0, yFndRCCTop - yRTL)}
          fill="url(#p-embank)" opacity={0.5} />
        <rect x={xAbL1} y={ey(rtl + dirtWallHeight)}
          width={xAbL2 - xAbL1}
          height={Math.max(0, yFndRCCTop - ey(rtl + dirtWallHeight))}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
        <rect x={xAbL1 - 4} y={yFndRCCTop}
          width={xAbL2 - xAbL1 + 8} height={yFndRCCBot - yFndRCCTop}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        <rect x={xAbL1 - 7} y={yFndRCCBot}
          width={xAbL2 - xAbL1 + 14} height={yPccBot - yFndRCCBot}
          fill="url(#p-pcc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />

        {/* RIGHT ABUTMENT */}
        <rect x={xAbR1} y={ey(rtl + dirtWallHeight)}
          width={xAbR2 - xAbR1}
          height={Math.max(0, yFndRCCTop - ey(rtl + dirtWallHeight))}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
        <rect x={xAbR1 - 4} y={yFndRCCTop}
          width={xAbR2 - xAbR1 + 8} height={yFndRCCBot - yFndRCCTop}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        <rect x={xAbR1 - 7} y={yFndRCCBot}
          width={xAbR2 - xAbR1 + 14} height={yPccBot - yFndRCCBot}
          fill="url(#p-pcc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        <rect x={xAbR2} y={yRTL}
          width={approach * S} height={Math.max(0, yFndRCCTop - yRTL)}
          fill="url(#p-embank)" opacity={0.5} />

        {/* PIERS */}
        {pierData.map((pd, i) => {
          const pcx = pd.x;
          const hwTop = Math.max(3, (pierWidth / 2) * S);
          const batter = 0; // typed model does not expose pier batter
          const hDiff  = Math.max(0, (nglMidPier - foundationLevel - rccFndDepth));
          const hwBot  = hwTop + (batter > 0 ? (hDiff * S * batter) : 0);
          
          const bHW = Math.max(4, (pierBaseWidth / 2) * S);
          const capHW = Math.max(hwTop, hwTop + capOvhg * S);
          
          return (
            <g key={i}>
              {/* Pier cap */}
              <rect x={pcx - capHW} y={yDeckB}
                width={capHW * 2} height={capDepth * S}
                fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth="1.8" />
              
              {/* Pier shaft (Trapezoidal if batter exists) */}
              <polygon
                points={`${pcx - hwTop},${yCapB} ${pcx + hwTop},${yCapB} ${pcx + hwBot},${yFndRCCTop} ${pcx - hwBot},${yFndRCCTop}`}
                fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth="2" />
              
              {/* RCC Footing */}
              <rect x={pcx - bHW} y={yFndRCCTop}
                width={bHW * 2} height={yFndRCCBot - yFndRCCTop}
                fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth="1.8" />
              
              {/* PCC blinding */}
              <rect x={pcx - bHW - 3} y={yFndRCCBot}
                width={bHW * 2 + 6} height={yPccBot - yFndRCCBot}
                fill="url(#p-pcc)" stroke={COLORS.STRUCTURE} strokeWidth="1.2" />
              
              <text x={pcx} y={yCapB - 4} textAnchor="middle" fontSize="7.5"
                fontWeight="bold" fill={COLORS.STRUCTURE} fontFamily="Arial,sans-serif">
                P{i + 1}
              </text>
            </g>
          );
        })}

        {/* ── APPROACH SLABS ────────────────────────────────────────── */}
        {(() => {
          const laslab = 3.5; // Approach slab length
          const apthk  = 0.3;  // Approach slab thickness
          const ySlabT = ey(rtl);
          const ySlabB = ey(rtl - apthk);
          return (
            <g opacity="0.9">
              {/* Left Slab */}
              <rect x={ex(-laslab)} y={ySlabT} width={laslab * S} height={ySlabB - ySlabT}
                fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth="1" />
              {/* Right Slab */}
              <rect x={xAbR2} y={ySlabT} width={laslab * S} height={ySlabB - ySlabT}
                fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth="1" />
            </g>
          );
        })()}

        {/* HFL water fill */}
        <rect x={xAbL2} y={yHFL}
          width={xAbR1 - xAbL2} height={Math.max(0, yBed - yHFL)}
          fill="#bbdefb" opacity={0.45} clipPath="url(#gad-clip)" />

        {/* DECK */}
        <rect x={xAbL2} y={yDeckT}
          width={xAbR1 - xAbL2} height={wearCoat * S}
          fill="#78909c" stroke="#455a64" strokeWidth="0.8" />
        <rect x={xAbL2} y={yRTL}
          width={xAbR1 - xAbL2} height={slabDepth * S}
          fill="url(#p-conc)" stroke="#1565c0" strokeWidth="1.5" />

        {/* Bed line */}
        <line x1={BDR + L_MARGIN - 5} y1={yBed}
          x2={RP_X - 4} y2={yBed}
          stroke="#6d4c41" strokeWidth="1.5" />
        <text x={BDR + L_MARGIN - 8} y={yBed + 3} textAnchor="end" fontSize="7.5"
          fill="#6d4c41" fontFamily="Arial,sans-serif">BL {bedLevel.toFixed(3)}</text>

        {/* RL lines */}
        {rlLine(BDR + L_MARGIN - 5, yRTL, RP_X - 4, rtl, "RTL",
          { color: "#1a237e", dash: "4 2", weight: 0.9 })}
        {rlLine(BDR + L_MARGIN - 5, yHFL, RP_X - 4, hfl, "HFL",
          { color: "#1565c0", dash: "8 3", weight: 1.2 })}
        {rlLine(BDR + L_MARGIN - 5, yOFL, RP_X - 4, ofl, "OFL",
          { color: "#1976d2", dash: "6 3", weight: 0.8 })}
        {rlLine(BDR + L_MARGIN - 5, yNBL, RP_X - 4, nbl, "NBL",
          { color: "#0288d1", dash: "5 2", weight: 0.8 })}
        {rlLine(BDR + L_MARGIN - 5, yFndRCCTop, RP_X - 4, foundationLevel + rccFndDepth, "Ftg.Top",
          { color: "#bf360c", dash: "5 2", weight: 0.8 })}
        {rlLine(BDR + L_MARGIN - 5, yFndRCCBot, RP_X - 4, foundationLevel, "FND (RCC.Bot)",
          { color: "#bf360c", dash: "4 2", weight: 0.9 })}
        {rlLine(BDR + L_MARGIN - 5, yPccBot, RP_X - 4, foundationLevel - pccDepth, "PCC.Bot",
          { color: "#78909c", dash: "3 2", weight: 0.7 })}
        {rlLine(OX - 5, yNGLAbut, RP_X - 4, nglAbutment, "NGL (Abut)",
          { color: "#2e7d32", dash: "6 3", weight: 1.0 })}
        {rlLine(OX - 5, yNGLMidPier, RP_X - 4, nglMidPier, "NGL (Pier)",
          { color: "#e65100", dash: "5 3", weight: 1.0 })}

        {/* Dimension lines */}
        {Array.from({ length: numberOfSpans }, (_, i) => {
          const x1 = ex(abutmentWidth + i * spanLength);
          const x2 = ex(abutmentWidth + (i + 1) * spanLength);
          return dimH(x1, yDeckT - 4, x2, `${spanLength}m`,
            { offset: 20, color: "#1F496B", fontSize: 7.5 });
        })}
        {dimH(xAbL2, yDeckT - 28, xAbR1, `Total span = ${totalLength}m`,
          { offset: 20, color: "#1F496B", fontSize: 8 })}
        {dimH(xAbL1, yFndRCCBot + 8, xAbL2, `${abutmentWidth}m`,
          { offset: -22, color: "#333", fontSize: 7 })}
        {nP > 0 && dimV(pierData[0].x - (pierWidth / 2) * S - 8, yCapB, yBed,
          `${pierDepth}m`, { offset: 24, fontSize: 7 })}

        {/* RIGHT PANEL — RL Table */}
        <rect x={RP_X} y={BDR + TOP_BAR + 4}
          width={R_MARGIN - 14} height={drawH}
          fill="#f8f9fa" stroke="#1F496B" strokeWidth="0.8" />
        <text x={RP_X + (R_MARGIN - 14) / 2} y={BDR + TOP_BAR + 16}
          textAnchor="middle" fontSize="8" fontWeight="bold"
          fill="#1F496B" fontFamily="Arial,sans-serif">
          REDUCED LEVELS (m MSL)
        </text>
        <line x1={RP_X} y1={BDR + TOP_BAR + 20}
          x2={RP_X + R_MARGIN - 14} y2={BDR + TOP_BAR + 20}
          stroke="#1F496B" strokeWidth="0.6" />
        {levels.map(([abbr, desc, val], idx) => {
          const ty = BDR + TOP_BAR + 32 + idx * 18;
          return (
            <g key={abbr}>
              <text x={RP_X + 5} y={ty} fontSize="7.5" fontWeight="bold"
                fill="#1F496B" fontFamily="Arial,sans-serif">{abbr}</text>
              <text x={RP_X + 55} y={ty} fontSize="6.5"
                fill="#555" fontFamily="Arial,sans-serif">{desc}</text>
              <text x={RP_X + (R_MARGIN - 18)} y={ty} textAnchor="end"
                fontSize="7.5" fontWeight="bold"
                fill="#333" fontFamily="Arial,sans-serif">{val.toFixed(3)}</text>
              <line x1={RP_X} y1={ty + 4}
                x2={RP_X + R_MARGIN - 14} y2={ty + 4}
                stroke="#e0e0e0" strokeWidth="0.4" />
            </g>
          );
        })}

        {/* Design data block */}
        {(() => {
          const bY = BDR + TOP_BAR + 32 + levels.length * 18 + 10;
          return (
            <g>
              <text x={RP_X + 5} y={bY} fontSize="7.5" fontWeight="bold"
                fill="#1F496B" fontFamily="Arial,sans-serif">DESIGN DATA</text>
              {[
                ["Q (design)", `${discharge} cumecs`],
                ["Silt factor f", `${laceysSiltFactor}`],
                ["SBC", `${sbc} kN/m2`],
                ["Concrete", concreteGrade],
                ["Steel", steelGrade],
                ["fck", `${fck} MPa`],
                ["fy", `${fy} MPa`],
              ].map(([k, v], i) => (
                <g key={k}>
                  <text x={RP_X + 5} y={bY + 14 + i * 13} fontSize="7"
                    fill="#555" fontFamily="Arial,sans-serif">{k}:</text>
                  <text x={RP_X + (R_MARGIN - 18)} y={bY + 14 + i * 13}
                    textAnchor="end" fontSize="7" fontWeight="bold"
                    fill="#333" fontFamily="Arial,sans-serif">{v}</text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* Scale bar */}
        <ScaleBar x={BDR + L_MARGIN} y={H - BDR - BOT_BAR - 28}
          scale={scaleVal} pixPerMetre={S}
          label={`1:${scaleVal} (on A1)`} />

        {/* North arrow */}
        <NorthArrow cx={RP_X + 20} cy={H - BDR - BOT_BAR - 30} r={16} />

        {/* Title block */}
        <TitleBlock
          x={BDR + 10} y={H - BDR - BOT_BAR + 2} w={W - BDR * 2 - 20} h={BOT_BAR - 6}
          project={projectName} location={location}
          title="GENERAL ARRANGEMENT DRAWING — ELEVATION & PLAN"
          drawNo="GAD-01" scale={`1:${scaleVal} (A1)`}
          date={today} rev="0"
        />

        {/* ── 2. PLAN VIEW ───────────────────────────────────────────── */}
        <g transform={`translate(0, ${PANEL_H + 10})`}>
          <text x={BDR + L_MARGIN} y={OY - 10} fontSize="9" fontWeight="bold" fill={COLORS.STRUCTURE}>
            PLAN VIEW {skew !== 0 ? `(SKEW: ${skew}°)` : ""}
          </text>
          
          {/* Deck Outline (Skewed) */}
          {(() => {
            const yMid = OY + PANEL_H / 2;
            const hw   = (carriageWidth / 2) * S;
            const x0   = ex(0);
            const x1   = ex(totalLength + abutmentWidth * 2);
            
            // Vertices with skew shift: (x + y*tan(skew))
            const tanSkew = Math.tan(skewRad);
            const pts = [
              [x0 + hw * tanSkew, yMid - hw],
              [x1 + hw * tanSkew, yMid - hw],
              [x1 - hw * tanSkew, yMid + hw],
              [x0 - hw * tanSkew, yMid + hw],
            ];
            const ptsStr = pts.map(p => `${p[0]},${p[1]}`).join(" ");
            
            return (
              <g>
                <polygon points={ptsStr} fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth="2" />
                {/* Centerline */}
                <line x1={x0} y1={yMid} x2={x1} y2={yMid} stroke="#e53935" strokeWidth="1" strokeDasharray="10 4 2 4" />
              </g>
            );
          })()}

          {/* Pier Foundations in Plan */}
          {pierData.map((pd, i) => {
            const pcx = pd.x;
            const yMid = OY + PANEL_H / 2;
            const fW = (pierBaseWidth / 2) * S;
            const fL = (pierBaseLength / 2) * S;
            const tanSkew = Math.tan(skewRad);
            
            const fpts = [
              [pcx + fL * tanSkew - fW, yMid - fL],
              [pcx + fL * tanSkew + fW, yMid - fL],
              [pcx - fL * tanSkew + fW, yMid + fL],
              [pcx - fL * tanSkew - fW, yMid + fL],
            ];
            return (
              <polygon key={i} points={fpts.map(p => `${p[0]},${p[1]}`).join(" ")}
                fill="none" stroke={COLORS.STRUCTURE} strokeWidth="1" strokeDasharray="4 2" />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
