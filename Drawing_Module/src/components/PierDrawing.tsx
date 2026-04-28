import type { ReactElement } from "react";
import { DrawingDefs, DrawingBorder, TitleBlock, ScaleBar, dimH, dimV, rlLine, COLORS, scaledStroke } from "../lib/drawing-utils";
import type { CompleteDesignResult } from "../../../bridge-excel-generator/types";

/* Bar layout helper */
function barRow(
  cx: number, y: number, n: number, spacing: number, dia: number, S: number,
  stroke = "#c62828"
) {
  const r = Math.max(2, (dia / 2) * S * 0.9);
  const totalW = (n - 1) * spacing * S;
  return Array.from({ length: n }, (_, i) => {
    const bx = cx - totalW / 2 + i * spacing * S;
    return (
      <g key={i}>
        <circle cx={bx} cy={y} r={r} fill={stroke} />
        <circle cx={bx} cy={y} r={r * 0.4} fill="#fff" opacity={0.5} />
      </g>
    );
  });
}

interface PierSectionProps { pierNo: number; chainageX: number; results: CompleteDesignResult; }

export function PierSection({ pierNo, chainageX, results }: PierSectionProps): ReactElement {
  const { input, pier } = results;
  // geometry
  const {
    pierWidth: pW, pierLength: pL, pierDepth: pD,
    pierBaseWidth: bW, pierBaseLength: bL,
    rtl, hfl, bedLevel: bed, foundationLevel: fnd,
    concreteGrade, steelGrade, fck, fy, sbc,
    projectName, location,
  } = input;

  const capDepth  = pier?.pierCap?.thickness ?? 0.50;
  const capOvhg   = ((pier?.pierCap?.width ?? input.pierWidth) - input.pierWidth) / 2 || 0.30;
  const slabDepth = Math.min(1.20, Math.max(0.35, Math.round(((input.spanLength * 1000) / 15 / 50)) * 50 / 1000));
  const wearCoat  = 0.075;
  const rccFndDepth = pier?.footing?.thickness ?? 1.00;
  const pccDepth    = 0.15;
  const totalFndDepth = rccFndDepth + pccDepth;
  const cover     = 0.040;  // clear cover m (consistent with deck narrative)

  const W = 900;
  const H = 820;
  const BDR = 12;
  const TOP_BAR = 44;
  const BOT_BAR = 80;
  const L_MARGIN = 70;
  const R_MARGIN = 200;  // right panel: reinforcement schedule

  const drawW = W - BDR * 2 - L_MARGIN - R_MARGIN;
  const drawH = H - BDR * 2 - TOP_BAR - BOT_BAR - 8;

  // Vertical extent
  const topLevel = rtl + wearCoat + 0.5;
  const botLevel = fnd - totalFndDepth - 0.5;
  const vertRange = topLevel - botLevel;

  const S = Math.min(drawW / (pW + 6), drawH / vertRange);  // px/m
  // Horizontal: centre of pier
  const cx = BDR + L_MARGIN + drawW / 2;
  // Vertical
  const ey = (lvl: number) =>
    BDR + TOP_BAR + 4 + (topLevel - lvl) * S;

  // Key y coords
  const yDeckT = ey(rtl + wearCoat);
  const yRTL   = ey(rtl);
  const yDeckB = ey(rtl - slabDepth);
  const yCapT  = yDeckB;
  const yCapB  = ey(rtl - slabDepth - capDepth);
  const yHFL   = ey(hfl);
  const yBed   = ey(bed);
  
  // Foundation logic: FL is RCC bottom
  const yFndRCCBot = ey(fnd);
  const yFndRCCTop = ey(fnd + rccFndDepth);
  const yPccBot    = ey(fnd - pccDepth);

  // Widths in pixels
  const pxPW  = pW * S;
  const pxCapW = (pier?.pierCap?.width ?? (pW + 2 * capOvhg)) * S;
  const pxBW  = bW * S;

  // Bar layout
  const mainDia   = (pier?.reinforcement?.mainSteel?.diameter ?? 25) / 1000;   // T25
  const nMainEach = pier?.reinforcement?.mainSteel?.numberOfBars 
    ? Math.ceil(pier.reinforcement.mainSteel.numberOfBars / 2) 
    : Math.max(4, Math.ceil(pW / 0.20));
  const stirSpac  = (pier?.reinforcement?.linkSteel?.spacing ?? 200) / 1000;

  // Right panel x start
  const RP_X = BDR + L_MARGIN + drawW + 10;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // Scale for print
  const scaleVal = Math.round((1000 / S) / 5) * 5;
  const heavy = scaledStroke(2, W);
  const mid = scaledStroke(1.2, W);

  return (
    <div className="pier-section-drawing mb-8">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg" className="block mx-auto bg-white shadow-md border border-border rounded-lg">
        <defs>
          <DrawingDefs />
          <clipPath id={`pier-clip-${pierNo}`}>
            <rect x={BDR + L_MARGIN - 5} y={BDR + TOP_BAR}
              width={drawW + 10} height={drawH + 10} />
          </clipPath>
        </defs>

        <DrawingBorder w={W} h={H} />

        {/* Title bar */}
        <rect x={BDR} y={BDR} width={W - BDR * 2} height={TOP_BAR - 4}
          fill={COLORS.STRUCTURE} />
        <text x={W / 2} y={BDR + 17} textAnchor="middle" fontSize="12" fontWeight="bold"
          fill="#fff" fontFamily="Arial,sans-serif">
          PIER CROSS-SECTION - P{pierNo}
        </text>
        <text x={W / 2} y={BDR + 31} textAnchor="middle" fontSize="8" fill="#b8d4e8"
          fontFamily="Arial,sans-serif">
          {projectName} &nbsp;|&nbsp; Chainage: {chainageX.toFixed(2)} m from A1
          &nbsp;|&nbsp; {concreteGrade} / {steelGrade}
        </text>
        <text x={W / 2} y={BDR + 42} textAnchor="middle" fontSize="7.5" fill="#90b8d0"
          fontFamily="Arial,sans-serif">
          Pier size: {pW}m x {pL}m x {pD}m (W x L x D) &nbsp;|&nbsp;
          Footing: {bW}m x {bL}m x {rccFndDepth}m RCC + {pccDepth}m PCC &nbsp;|&nbsp; SBC={sbc} kN/m2
        </text>

        {/* Divider label */}
        <text x={BDR + L_MARGIN - 5} y={BDR + TOP_BAR + 12}
          fontSize="8" fontWeight="bold" fill={COLORS.STRUCTURE} fontFamily="Arial,sans-serif">
          ELEVATION (TRANSVERSE SECTION - VIEW FROM UPSTREAM)
        </text>

        {/* Soil strata */}
        {(((input as any).soilLayers) ?? [
          { description: "Alluvium", thickness: 3, color: "#c8a96e" },
          { description: "Gravel", thickness: 3, color: "#b0875a" },
          { description: "Rock", thickness: 5, color: "#9e9e9e" },
        ]).reduce((acc: any[], sl: any) => {
          const prev = acc.length > 0 ? acc[acc.length - 1].endLevel : bed;
          const endLevel = prev - sl.thickness;
          acc.push({ ...sl, topLevel: prev, endLevel, si: acc.length });
          return acc;
        }, []).map((sl: any) => {
          const y1 = ey(sl.topLevel);
          const y2 = ey(Math.max(sl.endLevel, botLevel));
          const pId = sl.si === 0 ? "p-gravel" : sl.si >= 2 ? "p-rock" : "p-clay";
          return (
            <g key={sl.si} clipPath={`url(#pier-clip-${pierNo})`}>
              <rect x={BDR + L_MARGIN - 5} y={y1} width={drawW + 10}
                height={Math.max(0, y2 - y1)}
                fill={sl.color} opacity={0.20} />
              <rect x={BDR + L_MARGIN - 5} y={y1} width={drawW + 10}
                height={Math.max(0, y2 - y1)}
                fill={`url(#${pId})`} opacity={0.55} />
            </g>
          );
        })}

        {/* Deck / approach slab */}
        <rect x={cx - pxCapW / 2 - 50} y={yDeckT}
          width={pxCapW + 100} height={wearCoat * S}
          fill="#78909c" stroke="#455a64" strokeWidth="1" />
        <rect x={cx - pxCapW / 2 - 50} y={yRTL}
          width={pxCapW + 100} height={slabDepth * S}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />

        {/* Pier cap */}
        <rect x={cx - pxCapW / 2} y={yCapT} width={pxCapW} height={capDepth * S}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
        {/* Cap outline marking */}
        <line x1={cx - pxCapW / 2} y1={yCapT}
          x2={cx - pxPW / 2} y2={yCapB}
          stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        <line x1={cx + pxCapW / 2} y1={yCapT}
          x2={cx + pxPW / 2} y2={yCapB}
          stroke={COLORS.STRUCTURE} strokeWidth={mid} />

        {/* Pier shaft (body) */}
        <rect x={cx - pxPW / 2} y={yCapB} width={pxPW} height={Math.max(0, yFndRCCTop - yCapB)}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />

        {/* Main reinforcement in shaft */}
        {/* Cover bar outline */}
        <rect x={cx - pxPW / 2 + cover * S} y={yCapB + cover * S}
          width={pxPW - 2 * cover * S} height={Math.max(0, yBed - yCapB - 2 * cover * S)}
          fill="none" stroke="#c62828" strokeWidth="0.8" strokeDasharray="4 2" />
        {/* Main bars (both faces - section through width) */}
        {barRow(cx, yCapB + cover * S + 6, nMainEach, pW / (nMainEach + 1), mainDia, S)}
        {barRow(cx, yBed - cover * S - 6, nMainEach, pW / (nMainEach + 1), mainDia, S)}
        
        {/* Stirrups in shaft */}
        {Array.from({ length: Math.min(12, Math.floor(pD / stirSpac)) }, (_, j) => {
          const sy = yCapB + cover * S + j * stirSpac * S + 10;
          if (sy >= yBed - cover * S - 4) return null;
          return (
            <rect key={j} x={cx - pxPW / 2 + cover * S} y={sy}
              width={pxPW - 2 * cover * S} height={stirSpac * S * 0.85}
              fill="none" stroke="#1565c0" strokeWidth="0.9" />
          );
        })}

        {/* HFL line */}
        {rlLine(BDR + L_MARGIN - 5, yHFL, RP_X - 4, hfl, "HFL",
          { color: COLORS.WATER, dash: "8 3", weight: 1.2 })}

        {/* Footing - RCC */}
        <rect x={cx - pxBW / 2 - 8} y={yFndRCCTop} width={pxBW + 16}
          height={yFndRCCBot - yFndRCCTop}
          fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
        {/* PCC blinding */}
        <rect x={cx - pxBW / 2 - 11} y={yFndRCCBot} width={pxBW + 22}
          height={yPccBot - yFndRCCBot}
          fill="url(#p-pcc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
        
        {/* Footing bottom bars - in RCC zone */}
        {barRow(cx, yFndRCCBot - cover * S - 4,
          Math.max(4, Math.ceil(bW / 0.25)), bW / Math.max(3, Math.ceil(bW / 0.25) - 1),
          0.016, S, "#e65100")}

        {/* RL lines */}
        {rlLine(BDR + L_MARGIN - 5, yRTL, RP_X - 4, rtl, "RTL",
          { color: "#1a237e", dash: "4 2", weight: 0.9 })}
        {rlLine(BDR + L_MARGIN - 5, yBed, RP_X - 4, bed, "BL",
          { color: COLORS.GROUND, dash: "none", weight: 1.2 })}
        {rlLine(BDR + L_MARGIN - 5, yFndRCCTop, RP_X - 4, fnd + rccFndDepth, "Ftg.Top",
          { color: "#bf360c", dash: "5 2", weight: 0.8 })}
        {rlLine(BDR + L_MARGIN - 5, yFndRCCBot, RP_X - 4, fnd, "FND (RCC.Bot)",
          { color: "#bf360c", dash: "4 2", weight: 0.9 })}
        {rlLine(BDR + L_MARGIN - 5, yPccBot, RP_X - 4, fnd - pccDepth, "PCC.Bot",
          { color: "#78909c", dash: "3 2", weight: 0.7 })}

        {/* Dimension lines */}
        {/* Pier width */}
        {dimH(cx - pxPW / 2, yBed + 10, cx + pxPW / 2,
          `${pW.toFixed(2)} m (pier width)`,
          { offset: -28, color: "#333", fontSize: 7.5 })}
        
        {/* Pier depth */}
        {dimV(cx - pxPW / 2 - 10, yCapB, yBed,
          `${pD.toFixed(2)} m`,
          { offset: 26, fontSize: 7.5 })}

        {/* Scale bar */}
        <ScaleBar x={RP_X + 6} y={H - BDR - BOT_BAR - 25}
          scale={scaleVal} pixPerMetre={S}
          label={`1:${scaleVal} (on A1)`} />

        {/* Title block */}
        <TitleBlock
          x={BDR + 10} y={H - BDR - BOT_BAR + 2} w={W - BDR * 2 - 20} h={BOT_BAR - 6}
          project={projectName} location={location}
          title={`PIER P${pierNo} - CROSS-SECTION & REINFORCEMENT DETAILS`}
          drawNo={`PCS-0${pierNo}`} scale={`1:${scaleVal} (A1)`}
          date={today} rev="0"
        />
      </svg>
    </div>
  );
}

export function PierDrawing({ results }: { results: CompleteDesignResult }): ReactElement {
  return (
    <div className="pier-drawings space-y-8">
      {Array.from({ length: results.input.numberOfPiers }, (_, i) => (
        <PierSection
          key={i}
          pierNo={i + 1}
          chainageX={results.input.abutmentWidth + (i + 1) * results.input.spanLength}
          results={results}
        />
      ))}
    </div>
  );
}

