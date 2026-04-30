import type { ReactElement } from "react";
import {
  DrawingDefs, DrawingBorder, TitleBlock, ScaleBar, NorthArrow,
  dimH, dimV, rlLine, COLORS, scaledStroke,
} from "../lib/drawing-utils";
import type { CompleteDesignResult } from "../../../bridge-excel-generator/types";

export function AbutmentDrawing({ results }: { results: CompleteDesignResult }): ReactElement {
  const { input, abutmentType1 } = results;
  const {
    abutmentWidth, abutmentHeight,
    returnWallLength, dirtWallHeight,
    carriageWidth,
    rtl, hfl, bedLevel, foundationLevel, agl,
    projectName, location,
    concreteGrade, steelGrade, sbc,
    phi, gamma,
  } = input;

  const rwL = abutmentType1?.geometry?.returnWallLength ?? returnWallLength;
  const fndDepth = abutmentType1?.geometry?.depth ?? 0.80;
  const rwThk = 0.40;    // return wall thickness (m)
  const abtThk = abutmentType1?.geometry?.width ?? abutmentWidth;

  // ── Canvas ────────────────────────────────────────────────────────────────
  const W = 1200;
  const H = 900;
  const BDR = 12;
  const TOP_BAR = 44;
  const BOT_BAR = 80;

  // Two panels side by side: LEFT=Plan, RIGHT=Elevation
  const PANEL_W = (W - BDR * 2 - 20) / 2;
  const PANEL_H = H - BDR * 2 - TOP_BAR - BOT_BAR - 8;
  const PLAN_X  = BDR + 10;
  const ELEV_X  = BDR + 10 + PANEL_W + 12;

  // ── PLAN SCALE ────────────────────────────────────────────────────────────
  const planHoriz  = abtThk + rwL + 4;    // total horizontal extent
  const planVert   = carriageWidth + rwL + 4;  // total transverse extent
  const planS      = Math.min((PANEL_W - 80) / planHoriz, (PANEL_H - 60) / planVert);

  const planOX  = PLAN_X + 50;
  const planMidY = BDR + TOP_BAR + 8 + PANEL_H / 2;

  const ppx = (x: number) => planOX + x * planS;   // x from abutment back face
  const ppy = (y: number) => planMidY + y * planS;  // y from bridge CL

  // ── ELEVATION SCALE ───────────────────────────────────────────────────────
  const topLvl = rtl + dirtWallHeight + 1.0;
  const botLvl = foundationLevel - fndDepth - 0.5;
  const elevVert = topLvl - botLvl;
  const elevHoriz = rwL + abtThk + 3;
  const elevS = Math.min((PANEL_W - 70) / elevHoriz, (PANEL_H - 40) / elevVert);

  const elevOX  = ELEV_X + 55;
  const elevBotY = BDR + TOP_BAR + 8 + PANEL_H - 20;

  const epx = (x: number) => elevOX + x * elevS;
  const epy = (lvl: number) => elevBotY - (lvl - botLvl) * elevS;

  // Key y levels (elevation)
  const yRTL  = epy(rtl);
  const yWCT  = epy(rtl + 0.075);
  const yHFL  = epy(hfl);
  const yBed  = epy(bedLevel);
  const yFndBot = epy(foundationLevel);
  const yFndTop = epy(foundationLevel + fndDepth);
  const yGrd  = epy(agl);
  const yDW   = epy(rtl + dirtWallHeight);

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const scaleVal = Math.round(1000 / (planS * 841 / W) / 5) * 5;
  const heavy = scaledStroke(2, W);
  const mid = scaledStroke(1.2, W);

  return (
    <div className="abutment-drawing">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg" className="block mx-auto bg-white shadow-lg border border-border rounded-lg">
        <defs>
          <DrawingDefs />
        </defs>

        <DrawingBorder w={W} h={H} />

        {/* Title bar */}
        <rect x={BDR} y={BDR} width={W - BDR * 2} height={TOP_BAR - 4} fill={COLORS.STRUCTURE} />
        <text x={W / 2} y={BDR + 17} textAnchor="middle" fontSize="13" fontWeight="bold"
          fill="#fff" fontFamily="Arial,sans-serif">
          ABUTMENT & WING WALL — PLAN & ELEVATION
        </text>
        <text x={W / 2} y={BDR + 31} textAnchor="middle" fontSize="8.5" fill="#b8d4e8"
          fontFamily="Arial,sans-serif">
          {projectName} &nbsp;|&nbsp; {location}
        </text>
        <text x={W / 2} y={BDR + 42} textAnchor="middle" fontSize="8" fill="#90b8d0"
          fontFamily="Arial,sans-serif">
          {concreteGrade} / {steelGrade} &nbsp;|&nbsp; SBC = {sbc} kN/m²
          &nbsp;|&nbsp; φ = {phi}° &nbsp;|&nbsp; γ = {gamma} kN/m³
        </text>

        {/* Panel divider */}
        <line x1={ELEV_X - 6} y1={BDR + TOP_BAR} x2={ELEV_X - 6} y2={H - BDR - BOT_BAR}
          stroke={COLORS.STRUCTURE} strokeWidth="0.7" opacity="0.3" />

        {/* ── PLAN PANEL LABEL ──────────────────────────────────────── */}
        <text x={PLAN_X + 10} y={BDR + TOP_BAR + 14} fontSize="9" fontWeight="bold"
          fill={COLORS.STRUCTURE} fontFamily="Arial,sans-serif">PLAN  (AT FOUNDATION LEVEL)</text>

        {/* ── PLAN VIEW ─────────────────────────────────────────────── */}
        {/* Road embankment fill */}
        <rect x={ppx(abtThk)} y={ppy(-carriageWidth / 2 - 1)}
          width={rwL * planS} height={(carriageWidth + 2) * planS}
          fill="url(#p-embank)" opacity={0.65} />

        {/* Abutment body (plan) */}
        <rect x={ppx(0)} y={ppy(-carriageWidth / 2 - 0.5)}
          width={abtThk * planS} height={(carriageWidth + 1) * planS}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
        
        {/* Return walls (plan) */}
        <rect x={ppx(abtThk)} y={ppy(-carriageWidth / 2 - 0.5 - rwThk)}
          width={rwL * planS} height={rwThk * planS}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        <rect x={ppx(abtThk)} y={ppy(carriageWidth / 2 + 0.5)}
          width={rwL * planS} height={rwThk * planS}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />

        {/* Centreline */}
        <line x1={ppx(-1)} y1={planMidY} x2={ppx(abtThk + rwL + 1)} y2={planMidY}
          stroke="#e53935" strokeWidth="0.9" strokeDasharray="10 4 2 4" />

        {/* Plan dims */}
        {dimH(ppx(abtThk), ppy(-carriageWidth / 2 - 0.5 - rwThk), ppx(abtThk + rwL),
          `Return wall L = ${rwL.toFixed(2)} m`,
          { offset: 24, fontSize: 7.5, color: "#1F496B" })}
        {dimV(ppx(0) - 10, ppy(-carriageWidth / 2 - 0.5), ppy(carriageWidth / 2 + 0.5),
          `${(carriageWidth + 1).toFixed(2)} m`,
          { offset: 16, fontSize: 7.5 })}

        {/* North arrow */}
        <NorthArrow cx={PLAN_X + PANEL_W - 30} cy={BDR + TOP_BAR + 30} r={18} />

        {/* ── ELEVATION PANEL LABEL ─────────────────────────────────── */}
        <text x={ELEV_X + 10} y={BDR + TOP_BAR + 14} fontSize="9" fontWeight="bold"
          fill="#1F496B" fontFamily="Arial,sans-serif">
          ELEVATION  (SIDE VIEW THROUGH RETURN WALL)
        </text>

        {/* ── ELEVATION VIEW ─────────────────────────────────────────── */}
        {/* Soil strata behind wall */}
        <rect x={epx(abtThk)} y={yRTL} width={rwL * elevS} height={Math.max(0, yGrd - yRTL)}
          fill="url(#p-earth)" opacity={0.8} />

        {/* Abutment body (elevation) */}
        <rect x={epx(0)} y={yDW} width={abtThk * elevS}
          height={yFndTop - yDW}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
        {/* Dirt wall */}
        <rect x={epx(0)} y={yDW} width={abtThk * elevS}
          height={yWCT - yDW}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        
        {/* Abutment footing */}
        <rect x={epx(-0.4)} y={yFndTop} width={(abtThk + 0.8) * elevS}
          height={yFndBot - yFndTop}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />

        {/* Return wall (elevation — side view) */}
        <rect x={epx(abtThk)} y={yRTL} width={rwL * elevS}
          height={yFndBot - yRTL}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />

        {/* RL lines (elevation) */}
        {rlLine(epx(-1), yWCT, epx(abtThk + rwL + 2), rtl + 0.075, "WC top",
          { color: COLORS.SECONDARY, dash: "3 2", weight: 0.6 })}
        {rlLine(epx(-1), yRTL, epx(abtThk + rwL + 2), rtl, "RTL",
          { color: "#1a237e", dash: "4 2", weight: 0.9 })}
        {rlLine(epx(-1), yHFL, epx(abtThk + rwL + 2), hfl, "HFL",
          { color: COLORS.WATER, dash: "8 3", weight: 1.2 })}
        {rlLine(epx(-1), yBed, epx(abtThk + rwL + 2), bedLevel, "BL",
          { color: COLORS.GROUND, dash: "none", weight: 1.2 })}
        {rlLine(epx(-1), yFndTop, epx(abtThk + rwL + 2), foundationLevel + fndDepth, "Ftg.Top",
          { color: "#bf360c", dash: "6 3", weight: 0.8 })}
        {rlLine(epx(-1), yFndBot, epx(abtThk + rwL + 2), foundationLevel, "FND (RCC.Bot)",
          { color: "#bf360c", dash: "5 2", weight: 0.9 })}

        {/* ── STABILITY SCHEMATIC (Arrows) ────────────────────────── */}
        {(() => {
          const xPa = epx(abtThk);
          const yPa = epy(foundationLevel + (abutmentType1?.earthPressure?.location ?? 3.0));
          const xW  = epx(abtThk / 2);
          const yW  = epy(rtl + dirtWallHeight + 2);
          return (
            <g opacity="0.8">
              {/* Earth Pressure Arrow */}
              <line x1={xPa + 40} y1={yPa} x2={xPa + 5} y2={yPa} 
                stroke="#d32f2f" strokeWidth="2" markerEnd="url(#arrow-red)" />
              <text x={xPa + 45} y={yPa + 4} fontSize="9" fill="#d32f2f" fontWeight="bold">Pa</text>
              
              {/* Vertical Load Arrow */}
              <line x1={xW} y1={yW - 40} x2={xW} y2={yW - 5} 
                stroke="#2e7d32" strokeWidth="2" markerEnd="url(#arrow-green)" />
              <text x={xW - 10} y={yW - 45} fontSize="9" fill="#2e7d32" fontWeight="bold">W</text>
            </g>
          );
        })()}

        {/* Scale bar */}
        <ScaleBar x={PLAN_X + 10} y={H - BDR - BOT_BAR - 10}
          scale={scaleVal} pixPerMetre={planS} label={`SCALE 1:${scaleVal} (A1)`} />

        {/* Title block */}
        <TitleBlock
          x={BDR + 10} y={H - BDR - BOT_BAR + 2} w={W - BDR * 2 - 20} h={BOT_BAR - 6}
          project={projectName} location={location}
          title="ABUTMENT & WING WALL DETAILS"
          drawNo="WW-01" scale={`1:${scaleVal} (A1)`}
          date={today} rev="0"
        />
      </svg>
    </div>
  );
}
