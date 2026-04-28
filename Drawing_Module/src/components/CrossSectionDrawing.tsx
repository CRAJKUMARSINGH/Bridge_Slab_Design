import type { ReactElement } from "react";
import {
  DrawingDefs, DrawingBorder, TitleBlock, ScaleBar,
  dimH, dimV, COLORS, scaledStroke,
} from "../lib/drawing-utils";
import type { CompleteDesignResult } from "../../../bridge-excel-generator/types";

export function CrossSectionDrawing({ results }: { results: CompleteDesignResult }): ReactElement {
  const { input } = results;

  const {
    carriageWidth,
    projectName, location,
    spanLength,
  } = input;

  const totalWidth = carriageWidth + 0.9;

  // Derived geometry
  const slabDepth = Math.min(1.20, Math.max(0.35,
    Math.round(((spanLength * 1000) / 15 / 50)) * 50 / 1000));
  const wearCoat = 0.075;
  const kerbWidth = (totalWidth - carriageWidth) / 2;
  const kerbHeight = 0.225;
  const railingHeight = 1.10;

  // Canvas
  const W = 1440;
  const H = 900;
  const BDR = 12;
  const TOP_BAR = 44;
  const BOT_BAR = 80;

  // Center the cross-section
  const S = 80; // 1m = 80px (1:12.5 scale approx)
  const OX = W / 2;
  const OY = H / 2 - 50;

  const ex = (x: number) => OX + x * S;
  const ey = (y: number) => OY + y * S;

  const today = new Date().toLocaleDateString("en-IN",
    { day: "2-digit", month: "short", year: "numeric" });

  const heavy = scaledStroke(2.5, W);
  const mid = scaledStroke(1.5, W);

  return (
    <div className="cross-section-drawing">
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
          TYPICAL CROSS-SECTION OF BRIDGE DECK
        </text>

        {/* ── CROSS-SECTION GEOMETRY ───────────────────────────────── */}
        <g>
          {/* Deck Slab */}
          <rect x={ex(-totalWidth / 2)} y={ey(wearCoat)} width={totalWidth * S} height={slabDepth * S}
            fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={heavy} />
          
          {/* Wearing Coat (with Camber) */}
          <polygon points={`
            ${ex(-carriageWidth / 2)},${ey(wearCoat)}
            ${ex(0)},${ey(0)}
            ${ex(carriageWidth / 2)},${ey(wearCoat)}
            ${ex(carriageWidth / 2)},${ey(wearCoat + 0.02)}
            ${ex(-carriageWidth / 2)},${ey(wearCoat + 0.02)}
          `} fill="#78909c" stroke={COLORS.STRUCTURE} strokeWidth="0.8" />
          
          {/* Kerbs */}
          {/* Left Kerb */}
          <rect x={ex(-totalWidth / 2)} y={ey(wearCoat - kerbHeight)} width={kerbWidth * S} height={kerbHeight * S}
            fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
          {/* Right Kerb */}
          <rect x={ex(totalWidth / 2 - kerbWidth)} y={ey(wearCoat - kerbHeight)} width={kerbWidth * S} height={kerbHeight * S}
            fill="url(#p-conc)" stroke={COLORS.STRUCTURE} strokeWidth={mid} />
          
          {/* Railings (Simplified) */}
          <g stroke={COLORS.STRUCTURE} strokeWidth="2">
            {/* Left */}
            <line x1={ex(-totalWidth / 2 + 0.1)} y1={ey(wearCoat - kerbHeight)} x2={ex(-totalWidth / 2 + 0.1)} y2={ey(wearCoat - kerbHeight - railingHeight)} />
            <line x1={ex(-totalWidth / 2 + 0.1)} y1={ey(wearCoat - kerbHeight - railingHeight)} x2={ex(-totalWidth / 2 + 0.4)} y2={ey(wearCoat - kerbHeight - railingHeight)} />
            {/* Right */}
            <line x1={ex(totalWidth / 2 - 0.1)} y1={ey(wearCoat - kerbHeight)} x2={ex(totalWidth / 2 - 0.1)} y2={ey(wearCoat - kerbHeight - railingHeight)} />
            <line x1={ex(totalWidth / 2 - 0.1)} y1={ey(wearCoat - kerbHeight - railingHeight)} x2={ex(totalWidth / 2 - 0.4)} y2={ey(wearCoat - kerbHeight - railingHeight)} />
          </g>

          {/* Labels */}
          <text x={ex(0)} y={ey(slabDepth + 0.5)} textAnchor="middle" fontSize="10" fontWeight="bold" fill={COLORS.STRUCTURE}>
            TYPICAL CROSS SECTION
          </text>
          <text x={ex(0)} y={ey(0.1)} textAnchor="middle" fontSize="7" fill={COLORS.SECONDARY}>
            2.5% CAMBER
          </text>

          {/* Dimensions */}
          {/* Horizontal */}
          {dimH(ex(-totalWidth / 2), ey(-1.5), ex(totalWidth / 2), `${totalWidth}m OVERALL WIDTH`, { offset: 20, fontSize: 9 })}
          {dimH(ex(-carriageWidth / 2), ey(-0.8), ex(carriageWidth / 2), `${carriageWidth}m CARRIAGEWAY`, { offset: 20, fontSize: 8 })}
          {dimH(ex(-totalWidth / 2), ey(wearCoat - kerbHeight), ex(-totalWidth / 2 + kerbWidth), `${Math.round(kerbWidth * 1000)}mm`, { offset: 10, fontSize: 7 })}
          
          {/* Vertical */}
          {dimV(ex(-totalWidth / 2) - 30, ey(wearCoat), ey(wearCoat + slabDepth), `${Math.round(slabDepth * 1000)}mm`, { offset: 15, fontSize: 8 })}
          {dimV(ex(-totalWidth / 2) - 15, ey(wearCoat - kerbHeight), ey(wearCoat), `${Math.round(kerbHeight * 1000)}mm`, { offset: 15, fontSize: 7 })}
          {dimV(ex(totalWidth / 2) + 30, ey(wearCoat - kerbHeight - railingHeight), ey(wearCoat - kerbHeight), `${Math.round(railingHeight * 1000)}mm`, { offset: -15, fontSize: 7 })}
        </g>

        {/* Scale bar */}
        <ScaleBar x={BDR + 40} y={H - BDR - BOT_BAR - 20}
          scale={20} pixPerMetre={S} />

        {/* Title block */}
        <TitleBlock
          x={BDR + 10} y={H - BDR - BOT_BAR + 2} w={W - BDR * 2 - 20} h={BOT_BAR - 6}
          project={projectName} location={location}
          title="TYPICAL CROSS-SECTION OF BRIDGE DECK"
          drawNo="SEC-01" scale="1:20 (A1)"
          date={today} rev="0"
        />
      </svg>
    </div>
  );
}
