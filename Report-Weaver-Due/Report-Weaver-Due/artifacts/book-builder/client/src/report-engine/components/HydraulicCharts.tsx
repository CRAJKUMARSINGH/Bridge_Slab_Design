/**
 * HydraulicCharts.tsx — Enhanced HTML/SVG charts for hydraulic design
 * Replaces recharts with pure SVG for print-safe, zero-dependency rendering.
 *
 * CrossSectionChart: River cross-section with:
 *   - Bed profile (brown fill)
 *   - Water fill up to HFL (blue)
 *   - DWL line (red dashed)
 *   - Bridge deck overlay (grey)
 *   - Pier positions
 *   - Labelled axes
 *
 * BedSlopeChart: Longitudinal bed slope with:
 *   - Slope line with gradient fill
 *   - HFL and DWL reference lines
 *   - Annotated fall and length
 */

import React from 'react';
import { XSecRow } from '../types/bridgeTypes';

/* ── helpers ──────────────────────────────────────────────────────────────── */
const f2 = (n: number) => (isNaN(n) || !isFinite(n) ? '—' : n.toFixed(2));
const f3 = (n: number) => (isNaN(n) || !isFinite(n) ? '—' : n.toFixed(3));

const parseChainage = (ch: string): number => {
  const parts = ch.split('+');
  if (parts.length < 2) return parseFloat(ch) || 0;
  return parseFloat(parts[0]) * 1000 + parseFloat(parts[1]);
};

/* ── SVG coordinate helpers ───────────────────────────────────────────────── */
function makeScale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  return (v: number) => rangeMin + ((v - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

/* ═══════════════════════════════════════════════════════════════════════════
   CROSS SECTION CHART
═══════════════════════════════════════════════════════════════════════════ */
interface CrossSectionProps {
  data: XSecRow[];
  hfl: number;
  dwl: number;
  spans?: number;
  spanL?: number;
  pierW?: number;
  slabD?: number;
}

export const CrossSectionChart: React.FC<CrossSectionProps> = ({
  data, hfl, dwl,
  spans = 3, spanL = 12.2, pierW = 1.2, slabD = 0.35,
}) => {
  const W = 820, H = 380;
  const PAD = { top: 30, right: 40, bottom: 50, left: 60 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const pts = data
    .map(d => ({ ch: parseChainage(d.ch), gl: d.gl, label: d.ch }))
    .sort((a, b) => a.ch - b.ch);

  if (pts.length < 2) return <div style={{ color: '#888', fontSize: 11 }}>No cross-section data</div>;

  const xMin = pts[0].ch, xMax = pts[pts.length - 1].ch;
  const glMin = Math.min(...pts.map(p => p.gl));
  const glMax = Math.max(...pts.map(p => p.gl), dwl + 1.5);
  const yMin = glMin - 1.5, yMax = glMax + 0.5;

  const sx = makeScale(xMin, xMax, 0, plotW);
  const sy = makeScale(yMin, yMax, plotH, 0);  // inverted: higher RL = lower y

  // Bed profile polygon
  const bedPts = pts.map(p => `${sx(p.ch)},${sy(p.gl)}`).join(' ');
  const bedPoly = `${sx(xMin)},${plotH} ${bedPts} ${sx(xMax)},${plotH}`;

  // Water fill up to HFL
  const waterPts = pts.map(p => `${sx(p.ch)},${sy(Math.min(p.gl, hfl))}`).join(' ');
  const waterPoly = `${sx(xMin)},${sy(hfl)} ${waterPts} ${sx(xMax)},${sy(hfl)}`;

  // Bridge deck: centred over the cross-section
  const bridgeTotalL = spans * spanL;
  const bridgeCentreX = (xMin + xMax) / 2;
  const bridgeLeft = bridgeCentreX - bridgeTotalL / 2;
  const bridgeRight = bridgeCentreX + bridgeTotalL / 2;
  const deckTopRL = hfl + 0.05;  // soffit just above HFL for submersible
  const deckBotRL = deckTopRL - slabD;

  // Pier positions
  const pierPositions: number[] = [];
  for (let p = 1; p < spans; p++) {
    pierPositions.push(bridgeLeft + p * spanL);
  }

  // Y-axis ticks
  const yTicks: number[] = [];
  const yStep = (yMax - yMin) > 10 ? 2 : 1;
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) yTicks.push(y);

  // X-axis ticks
  const xTicks = pts.map(p => p.ch);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', marginBottom: 6 }}>
        River Cross-Section Profile — {f2(hfl)} m HFL · {f2(dwl)} m DWL
      </div>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto', fontFamily: 'Verdana,sans-serif' }}>
        <defs>
          <linearGradient id="bedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5a2b" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#c8a06a" stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1565c0" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#42a5f5" stopOpacity={0.25} />
          </linearGradient>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#888" strokeWidth="1" />
          </pattern>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines */}
          {yTicks.map(y => (
            <line key={y} x1={0} y1={sy(y)} x2={plotW} y2={sy(y)}
              stroke="#e0e0e0" strokeWidth={0.5} />
          ))}

          {/* Water fill */}
          <polygon points={waterPoly} fill="url(#waterGrad)" />

          {/* Bed profile */}
          <polygon points={bedPoly} fill="url(#bedGrad)" />
          <polyline points={bedPts} fill="none" stroke="#5d4037" strokeWidth={2} />

          {/* HFL line */}
          <line x1={0} y1={sy(hfl)} x2={plotW} y2={sy(hfl)}
            stroke="#00796b" strokeWidth={1.5} strokeDasharray="8,4" />
          <text x={plotW + 3} y={sy(hfl) + 4} fontSize={9} fill="#00796b" fontWeight="bold">
            HFL {f2(hfl)}
          </text>

          {/* DWL line */}
          {Math.abs(dwl - hfl) > 0.01 && (
            <>
              <line x1={0} y1={sy(dwl)} x2={plotW} y2={sy(dwl)}
                stroke="#d32f2f" strokeWidth={1.5} strokeDasharray="4,3" />
              <text x={plotW + 3} y={sy(dwl) + 4} fontSize={9} fill="#d32f2f" fontWeight="bold">
                DWL {f2(dwl)}
              </text>
            </>
          )}

          {/* Bridge deck */}
          {bridgeLeft >= xMin && bridgeRight <= xMax && (
            <>
              <rect
                x={sx(bridgeLeft)} y={sy(deckTopRL)}
                width={sx(bridgeRight) - sx(bridgeLeft)}
                height={sy(deckBotRL) - sy(deckTopRL)}
                fill="#90a4ae" fillOpacity={0.85} stroke="#455a64" strokeWidth={1.5}
              />
              <text
                x={(sx(bridgeLeft) + sx(bridgeRight)) / 2}
                y={sy(deckTopRL) - 4}
                fontSize={8.5} fill="#455a64" textAnchor="middle" fontWeight="bold"
              >
                Deck slab ({spans}×{spanL}m)
              </text>
            </>
          )}

          {/* Piers */}
          {pierPositions.map((px, idx) => {
            const pierX = sx(px);
            const pierTop = sy(deckBotRL);
            const pierBot = sy(glMin - 0.5);
            const pw = Math.max(4, sx(px + pierW / 2) - sx(px - pierW / 2));
            return (
              <rect key={idx}
                x={pierX - pw / 2} y={pierTop}
                width={pw} height={pierBot - pierTop}
                fill="url(#hatch)" stroke="#455a64" strokeWidth={1}
              />
            );
          })}

          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={plotH} stroke="#333" strokeWidth={1.5} />
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="#333" strokeWidth={1.5} />

          {/* Y-axis ticks & labels */}
          {yTicks.map(y => (
            <g key={y}>
              <line x1={-4} y1={sy(y)} x2={0} y2={sy(y)} stroke="#333" strokeWidth={1} />
              <text x={-7} y={sy(y) + 3.5} fontSize={8.5} fill="#333" textAnchor="end">{y}</text>
            </g>
          ))}
          <text
            x={-40} y={plotH / 2} fontSize={9} fill="#333"
            transform={`rotate(-90,-40,${plotH / 2})`} textAnchor="middle"
          >
            Elevation (m RL)
          </text>

          {/* X-axis ticks & labels */}
          {xTicks.map((x, i) => (
            <g key={i}>
              <line x1={sx(x)} y1={plotH} x2={sx(x)} y2={plotH + 4} stroke="#333" strokeWidth={1} />
              <text x={sx(x)} y={plotH + 14} fontSize={7.5} fill="#333" textAnchor="middle">
                {pts[i]?.label ?? x}
              </text>
            </g>
          ))}
          <text x={plotW / 2} y={plotH + 36} fontSize={9} fill="#333" textAnchor="middle">
            Chainage (m)
          </text>

          {/* Legend */}
          <g transform={`translate(10, 8)`}>
            {[
              { color: '#8b5a2b', label: 'Bed Level' },
              { color: '#1565c0', label: 'Water (HFL)', opacity: 0.55 },
              { color: '#00796b', label: 'HFL', dash: '8,4' },
              { color: '#d32f2f', label: 'DWL', dash: '4,3' },
              { color: '#90a4ae', label: 'Bridge Deck' },
            ].map((item, idx) => (
              <g key={idx} transform={`translate(${idx * 110}, 0)`}>
                <line x1={0} y1={6} x2={18} y2={6}
                  stroke={item.color} strokeWidth={2.5}
                  strokeDasharray={item.dash}
                  strokeOpacity={item.opacity ?? 1}
                />
                <text x={22} y={10} fontSize={8} fill="#333">{item.label}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   BED SLOPE CHART
═══════════════════════════════════════════════════════════════════════════ */
interface BedSlopeProps {
  s_denom: number;
  totalL: number;
  bedRL: number;
  hfl?: number;
  dwl?: number;
}

export const BedSlopeChart: React.FC<BedSlopeProps> = ({ s_denom, totalL, bedRL, hfl, dwl }) => {
  const W = 700, H = 220;
  const PAD = { top: 30, right: 60, bottom: 50, left: 70 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const reach = totalL * 1.2;
  const fall = reach / s_denom;

  const xMin = -reach / 2, xMax = reach / 2;
  const yBedLeft = bedRL + fall / 2;
  const yBedRight = bedRL - fall / 2;

  const allY = [yBedLeft, yBedRight, hfl ?? bedRL, dwl ?? bedRL];
  const yMin = Math.min(...allY) - 0.5;
  const yMax = Math.max(...allY) + 1.0;

  const sx = makeScale(xMin, xMax, 0, plotW);
  const sy = makeScale(yMin, yMax, plotH, 0);

  const yTicks: number[] = [];
  const yStep = (yMax - yMin) > 8 ? 2 : 1;
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) yTicks.push(y);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ fontSize: 12, fontWeight: 'bold', color: '#1e3a5f', textAlign: 'center', marginBottom: 6 }}>
        Longitudinal Bed Slope — 1 in {s_denom} · Fall = {f3(fall)} m over {f2(reach)} m reach
      </div>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto', fontFamily: 'Verdana,sans-serif' }}>
        <defs>
          <linearGradient id="slopeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5a2b" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#d2b48c" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid */}
          {yTicks.map(y => (
            <line key={y} x1={0} y1={sy(y)} x2={plotW} y2={sy(y)}
              stroke="#e0e0e0" strokeWidth={0.5} />
          ))}

          {/* Slope fill */}
          <polygon
            points={`${sx(xMin)},${plotH} ${sx(xMin)},${sy(yBedLeft)} ${sx(xMax)},${sy(yBedRight)} ${sx(xMax)},${plotH}`}
            fill="url(#slopeGrad)"
          />
          {/* Slope line */}
          <line
            x1={sx(xMin)} y1={sy(yBedLeft)}
            x2={sx(xMax)} y2={sy(yBedRight)}
            stroke="#5d4037" strokeWidth={3}
          />
          <circle cx={sx(xMin)} cy={sy(yBedLeft)} r={5} fill="#5d4037" />
          <circle cx={sx(xMax)} cy={sy(yBedRight)} r={5} fill="#5d4037" />

          {/* Labels at endpoints */}
          <text x={sx(xMin) - 4} y={sy(yBedLeft) - 8} fontSize={9} fill="#5d4037" textAnchor="end">
            {f2(yBedLeft)} m RL
          </text>
          <text x={sx(xMax) + 4} y={sy(yBedRight) - 8} fontSize={9} fill="#5d4037" textAnchor="start">
            {f2(yBedRight)} m RL
          </text>

          {/* HFL line */}
          {hfl !== undefined && (
            <>
              <line x1={0} y1={sy(hfl)} x2={plotW} y2={sy(hfl)}
                stroke="#00796b" strokeWidth={1.5} strokeDasharray="8,4" />
              <text x={plotW + 4} y={sy(hfl) + 4} fontSize={9} fill="#00796b" fontWeight="bold">
                HFL {f2(hfl)}
              </text>
            </>
          )}

          {/* DWL line */}
          {dwl !== undefined && Math.abs(dwl - (hfl ?? 0)) > 0.01 && (
            <>
              <line x1={0} y1={sy(dwl)} x2={plotW} y2={sy(dwl)}
                stroke="#d32f2f" strokeWidth={1.5} strokeDasharray="4,3" />
              <text x={plotW + 4} y={sy(dwl) + 4} fontSize={9} fill="#d32f2f" fontWeight="bold">
                DWL {f2(dwl)}
              </text>
            </>
          )}

          {/* Fall annotation */}
          <line
            x1={sx(xMax) + 10} y1={sy(yBedLeft)}
            x2={sx(xMax) + 10} y2={sy(yBedRight)}
            stroke="#1e3a5f" strokeWidth={1} markerEnd="url(#arrow)"
          />
          <text x={sx(xMax) + 14} y={(sy(yBedLeft) + sy(yBedRight)) / 2 + 4}
            fontSize={8.5} fill="#1e3a5f">
            ΔH={f3(fall)}m
          </text>

          {/* Slope label */}
          <text
            x={(sx(xMin) + sx(xMax)) / 2}
            y={(sy(yBedLeft) + sy(yBedRight)) / 2 - 10}
            fontSize={10} fill="#1e3a5f" textAnchor="middle" fontWeight="bold"
          >
            S = 1 in {s_denom}
          </text>

          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={plotH} stroke="#333" strokeWidth={1.5} />
          <line x1={0} y1={plotH} x2={plotW} y2={plotH} stroke="#333" strokeWidth={1.5} />

          {/* Y-axis */}
          {yTicks.map(y => (
            <g key={y}>
              <line x1={-4} y1={sy(y)} x2={0} y2={sy(y)} stroke="#333" strokeWidth={1} />
              <text x={-7} y={sy(y) + 3.5} fontSize={8.5} fill="#333" textAnchor="end">{y}</text>
            </g>
          ))}
          <text x={-50} y={plotH / 2} fontSize={9} fill="#333"
            transform={`rotate(-90,-50,${plotH / 2})`} textAnchor="middle">
            Elevation (m RL)
          </text>

          {/* X-axis labels */}
          <text x={sx(xMin)} y={plotH + 16} fontSize={8.5} fill="#333" textAnchor="middle">
            U/S ({f2(reach / 2)} m)
          </text>
          <text x={sx(0)} y={plotH + 16} fontSize={8.5} fill="#333" textAnchor="middle">
            Bridge Site
          </text>
          <text x={sx(xMax)} y={plotH + 16} fontSize={8.5} fill="#333" textAnchor="middle">
            D/S ({f2(reach / 2)} m)
          </text>
          <text x={plotW / 2} y={plotH + 36} fontSize={9} fill="#333" textAnchor="middle">
            Distance from Bridge Centre (m)
          </text>
        </g>
      </svg>
    </div>
  );
};
