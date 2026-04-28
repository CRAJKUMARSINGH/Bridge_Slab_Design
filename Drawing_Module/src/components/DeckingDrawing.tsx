import type { ReactElement } from "react";
import {
  DrawingDefs, DrawingBorder, TitleBlock, ScaleBar,
  dimH, dimV, COLORS, scaledStroke,
} from "../lib/drawing-utils";
import type { CompleteDesignResult } from "../../../bridge-excel-generator/types";

export function DeckingDrawing({ results }: { results: CompleteDesignResult }): ReactElement {
  const { input } = results;

  const {
    spanLength, numberOfSpans,
    carriageWidth,
    projectName, location,
  } = input;

  const totalWidth = carriageWidth + 0.9;
  const totalLength = spanLength * numberOfSpans;

  // Derived geometry
  const slabDepth = Math.min(1.20, Math.max(0.35,
    Math.round(((spanLength * 1000) / 15 / 50)) * 50 / 1000));
  const wearCoat = 0.075;

  // Canvas
  const W = 1440;
  const H = 900;
  const BDR = 12;
  const TOP_BAR = 44;
  const BOT_BAR = 80;
  const L_MARGIN = 60;
  const R_MARGIN = 60;

  // Panels
  const PANEL_H = (H - BDR * 2 - TOP_BAR - BOT_BAR - 40) / 2;
  const drawW = W - BDR * 2 - L_MARGIN - R_MARGIN;

  // Scale
  const horizTotal = totalLength * 1.1; // 10% buffer
  const S = drawW / horizTotal;
  const OX = BDR + L_MARGIN + (drawW - totalLength * S) / 2;
  const OY_TOP = BDR + TOP_BAR + 60;
  const OY_BOT = OY_TOP + PANEL_H + 40;

  const ex = (x: number) => OX + x * S;
  const eyT = (y: number) => OY_TOP + y * S;
  const eyB = (y: number) => OY_BOT + y * S;

  const today = new Date().toLocaleDateString("en-IN",
    { day: "2-digit", month: "short", year: "numeric" });

  const heavy = scaledStroke(2, W);
  const mid = scaledStroke(1.2, W);

  return (
    <div className="decking-drawing">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block mx-auto bg-white shadow-lg border border-border rounded-lg">
        <defs>
          <DrawingDefs />
        </defs>

        <DrawingBorder w={W} h={H} />

        {/* Title bar */}
        <rect x={BDR} y={BDR} width={W - BDR * 2} height={TOP_BAR - 4} fill={COLORS.STRUCTURE} />
        <text x={W / 2} y={BDR + 25} textAnchor="middle" fontSize="14" fontWeight="bold"
          fill="#fff" fontFamily="Arial,sans-serif">
          DECKING ARRANGEMENT & LONGITUDINAL DETAILS
        </text>

        {/* ── 1. LONGITUDINAL SECTION OF DECK ────────────────────────── */}
        <g>
          <text x={BDR + L_MARGIN} y={OY_TOP - 20} fontSize="10" fontWeight="bold" fill={COLORS.STRUCTURE}>
            LONGITUDINAL SECTION OF DECK SLAB
          </text>

          {Array.from({ length: numberOfSpans }, (_, i) => {
            const x1 = ex(i * spanLength);
            const x2 = ex((i + 1) * spanLength);
            const y0 = OY_TOP;
            const y1 = y0 + wearCoat * S;
            const y2 = y1 + slabDepth * S;

            return (
              <g key={i}>
                {/* Wearing Coat */}
                <rect x={x1} y={y0} width={x2 - x1} height={y1 - y0}
                  fill="#78909c" stroke={COLORS.STRUCTURE} strokeWidth="0.5" />
                {/* Deck Slab */}
                <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1}
                  fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
                
                {/* Span Labels */}
                <text x={(x1 + x2) / 2} y={y2 + 20} textAnchor="middle" fontSize="9" fontWeight="bold" fill={COLORS.STRUCTURE}>
                  SPAN {i + 1}
                </text>
                
                {/* Dimensions */}
                {dimH(x1, y0 - 10, x2, `${spanLength}m`, { offset: 15, fontSize: 8 })}
              </g>
            );
          })}

          {/* Overall Dimensions */}
          {dimH(ex(0), OY_TOP - 40, ex(totalLength), `Total Deck Length = ${totalLength}m`, { offset: 15, fontSize: 9 })}
          
          {/* Thickness Dimensions */}
          {dimV(ex(0) - 10, OY_TOP, OY_TOP + wearCoat * S, `${Math.round(wearCoat * 1000)}mm WC`, { offset: 35, fontSize: 7 })}
          {dimV(ex(0) - 10, OY_TOP + wearCoat * S, OY_TOP + (wearCoat + slabDepth) * S, `${Math.round(slabDepth * 1000)}mm SLAB`, { offset: 35, fontSize: 7 })}
        </g>

        {/* ── 2. PLAN VIEW OF DECK ───────────────────────────────────── */}
        <g>
          <text x={BDR + L_MARGIN} y={OY_BOT - 20} fontSize="10" fontWeight="bold" fill={COLORS.STRUCTURE}>
            PLAN VIEW SHOWING CARRIAGEWAY & EXPANSION JOINTS
          </text>

          {(() => {
            const hw = (totalWidth / 2) * S;
            const cw = (carriageWidth / 2) * S;
            const x0 = ex(0);
            const x1 = ex(totalLength);
            const ym = OY_BOT + PANEL_H / 2;

            return (
              <g>
                {/* Outer Deck Outline */}
                <rect x={x0} y={ym - hw} width={x1 - x0} height={hw * 2}
                  fill="none" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
                
                {/* Carriageway Lines */}
                <line x1={x0} y1={ym - cw} x2={x1} y2={ym - cw}
                  stroke={COLORS.SECONDARY} strokeWidth={mid} strokeDasharray="5 2" />
                <line x1={x0} y1={ym + cw} x2={x1} y2={ym + cw}
                  stroke={COLORS.SECONDARY} strokeWidth={mid} strokeDasharray="5 2" />
                
                {/* Expansion Joints */}
                {Array.from({ length: numberOfSpans + 1 }, (_, i) => {
                  const xj = ex(i * spanLength);
                  return (
                    <g key={i}>
                      <line x1={xj} y1={ym - hw - 5} x2={xj} y2={ym + hw + 5}
                        stroke={COLORS.HIGHLIGHT} strokeWidth="2" />
                      <text x={xj} y={ym - hw - 10} textAnchor="middle" fontSize="7" fill={COLORS.HIGHLIGHT}>
                        {i === 0 || i === numberOfSpans ? "EXP. JOINT (ABT)" : "EXP. JOINT (PIER)"}
                      </text>
                    </g>
                  );
                })}

                {/* Centerline */}
                <line x1={x0 - 20} y1={ym} x2={x1 + 20} y2={ym}
                  stroke="#e53935" strokeWidth="1" strokeDasharray="10 4 2 4" />
                
                {/* Width Dimensions */}
                {dimV(x0 - 30, ym - hw, ym + hw, `${totalWidth}m OVERALL`, { offset: 15, fontSize: 8 })}
                {dimV(x0 - 15, ym - cw, ym + cw, `${carriageWidth}m C.W.`, { offset: 15, fontSize: 8 })}
              </g>
            );
          })()}
        </g>

        {/* Scale bar */}
        <ScaleBar x={BDR + L_MARGIN} y={H - BDR - BOT_BAR - 20}
          scale={100} pixPerMetre={S} />

        {/* Title block */}
        <TitleBlock
          x={BDR + 10} y={H - BDR - BOT_BAR + 2} w={W - BDR * 2 - 20} h={BOT_BAR - 6}
          project={projectName} location={location}
          title="DECKING ARRANGEMENT & LONGITUDINAL DETAILS"
          drawNo="DECK-01" scale="1:100 (A1)"
          date={today} rev="0"
        />
      </svg>
    </div>
  );
}
