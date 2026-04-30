import type { ReactElement } from "react";

// ── Professional Engineering Colors ───────────────────────────────────────
export const COLORS = {
  STRUCTURE: "#2C3E50", // Dark blue-gray for primary structure
  SECONDARY: "#34495E", // Medium gray for secondary elements
  DIMENSION: "#000000", // Black for text and dimensions
  HIGHLIGHT: "#E74C3C", // Red for bearings or critical points
  GROUND:    "#6d4c41", // Brown for NGL/Soil
  WATER:     "#039be5", // Blue for HFL/Water
};

// Keep lineweights readable across different canvas sizes.
export function scaledStroke(base: number, canvasWidth: number): number {
  const factor = Math.max(0.85, Math.min(1.5, canvasWidth / 1200));
  return Number((base * factor).toFixed(2));
}

export function DrawingDefs(): ReactElement {
  return (
    <>
      {/* Dimension tick (oblique) */}
      <marker id="dtick" markerWidth="4" markerHeight="8" refX="2" refY="4" orient="auto">
        <line x1="3" y1="0" x2="1" y2="8" stroke="#333" strokeWidth="1.2" />
      </marker>
      {/* Dimension arrow (filled) */}
      <marker id="darr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
        <polygon points="0 0,8 3,0 6" fill="#333" />
      </marker>
      <marker id="darrL" markerWidth="8" markerHeight="6" refX="1" refY="3" orient="auto">
        <polygon points="8 0,0 3,8 6" fill="#333" />
      </marker>
      {/* RL tick mark */}
      <marker id="rltick" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="0">
        <path d="M0,4 L8,4 M4,0 L4,8" stroke="#333" strokeWidth="0.8" />
      </marker>
      {/* North arrow pointer */}
      <marker id="northarr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <polygon points="3 0,6 6,3 4,0 6" fill="#1F496B" />
      </marker>

      {/* Stability Schematic Arrows */}
      <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
        <polygon points="0 0,10 5,0 10,2 5" fill="#d32f2f" />
      </marker>
      <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
        <polygon points="0 0,10 5,0 10,2 5" fill="#2e7d32" />
      </marker>

      {/* ── Hatch patterns ────────────────────────────────────────── */}

      {/* Concrete — 45° diagonal lines, standard IS symbology */}
      <pattern id="p-conc" patternUnits="userSpaceOnUse" width="5.6" height="5.6"
        patternTransform="rotate(45 0 0)">
        <line x1="0" y1="0" x2="0" y2="5.6" stroke="#9e9e9e" strokeWidth="0.65" />
      </pattern>

      {/* Lean concrete / PCC — wider spaced */}
      <pattern id="p-pcc" patternUnits="userSpaceOnUse" width="8" height="8"
        patternTransform="rotate(45 0 0)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#bdbdbd" strokeWidth="0.55" />
      </pattern>

      {/* Earth fill — inverted-V (IRC symbol) */}
      <pattern id="p-earth" patternUnits="userSpaceOnUse" width="14" height="9">
        <path d="M0,9 L7,1 L14,9" fill="none" stroke="#8B6914" strokeWidth="0.75" />
      </pattern>

      {/* Embankment / compacted earth — denser inverted-V with base line */}
      <pattern id="p-embank" patternUnits="userSpaceOnUse" width="12" height="8">
        <path d="M0,8 L6,1 L12,8" fill="none" stroke="#795548" strokeWidth="0.7" />
        <line x1="0" y1="8" x2="12" y2="8" stroke="#795548" strokeWidth="0.4" />
      </pattern>

      {/* Rock — horizontal broken lines + zig-zag (IS symbol) */}
      <pattern id="p-rock" patternUnits="userSpaceOnUse" width="20" height="10">
        <path d="M0,3 L5,0 L10,3 L15,0 L20,3" fill="none" stroke="#757575" strokeWidth="0.7" />
        <path d="M0,8 L5,5 L10,8 L15,5 L20,8" fill="none" stroke="#757575" strokeWidth="0.7" />
      </pattern>

      {/* Alluvium / gravel (rounded stones) */}
      <pattern id="p-gravel" patternUnits="userSpaceOnUse" width="14" height="9">
        <ellipse cx="4" cy="4.5" rx="3" ry="2" fill="none" stroke="#8d6e63" strokeWidth="0.6" />
        <ellipse cx="11" cy="4.5" rx="2.5" ry="1.7" fill="none" stroke="#8d6e63" strokeWidth="0.6" />
        <ellipse cx="7.5" cy="7.5" rx="2" ry="1.4" fill="none" stroke="#8d6e63" strokeWidth="0.5" />
      </pattern>

      {/* Sandy clay — horizontal dashed with small dots */}
      <pattern id="p-clay" patternUnits="userSpaceOnUse" width="12" height="7">
        <line x1="0" y1="3.5" x2="12" y2="3.5" stroke="#a1887f" strokeWidth="0.5" strokeDasharray="4 2" />
        <circle cx="6" cy="3.5" r="0.8" fill="#a1887f" />
      </pattern>

      {/* Water — horizontal wavy blue */}
      <pattern id="p-water" patternUnits="userSpaceOnUse" width="24" height="7">
        <path d="M0,3.5 Q6,0 12,3.5 Q18,7 24,3.5" fill="none" stroke="#90caf9" strokeWidth="0.9" />
      </pattern>

      {/* Steel reinforcement fill */}
      <pattern id="p-steel" patternUnits="userSpaceOnUse" width="4" height="4"
        patternTransform="rotate(45 0 0)">
        <rect width="4" height="4" fill="#546e7a" />
        <rect width="2" height="4" fill="#cfd8dc" />
      </pattern>
    </>
  );
}

// ── Dimension helpers ──────────────────────────────────────────────────────
interface DimOpts {
  color?: string;
  fontSize?: number;
  extLen?: number;
  offset?: number;
}

/**
 * Horizontal engineering dimension line.
 * y = level of the element being dimensioned.
 * Dimension line drawn at y - offset (above the element).
 * extLen = length of extension (witness) lines beyond dim line.
 */
export function dimH(
  x1: number, y: number, x2: number, label: string,
  opts: DimOpts = {}
): ReactElement {
  const { color = "#333", fontSize = 8, extLen = 6, offset = 18 } = opts;
  const dy = y - offset;
  const mid = (x1 + x2) / 2;
  return (
    <g>
      <line x1={x1} y1={y} x2={x1} y2={dy - extLen} stroke={color} strokeWidth="0.5" />
      <line x1={x2} y1={y} x2={x2} y2={dy - extLen} stroke={color} strokeWidth="0.5" />
      <line x1={x1} y1={dy} x2={x2} y2={dy} stroke={color} strokeWidth="0.7"
        markerStart="url(#darr)" markerEnd="url(#darr)" />
      <rect x={mid - label.length * fontSize * 0.28} y={dy - fontSize - 1}
        width={label.length * fontSize * 0.55} height={fontSize + 1}
        fill="white" />
      <text x={mid} y={dy - 2} textAnchor="middle" fontSize={fontSize}
        fontFamily="Arial,sans-serif" fill={color}>{label}</text>
    </g>
  );
}

/**
 * Vertical engineering dimension line.
 * x = horizontal position of the element face.
 * Dimension line drawn at x - offset (left of element).
 */
export function dimV(
  x: number, y1: number, y2: number, label: string,
  opts: DimOpts = {}
): ReactElement {
  const { color = "#333", fontSize = 8, extLen = 6, offset = 20 } = opts;
  const dx = x - offset;
  const mid = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x} y1={y1} x2={dx - extLen} y2={y1} stroke={color} strokeWidth="0.5" />
      <line x1={x} y1={y2} x2={dx - extLen} y2={y2} stroke={color} strokeWidth="0.5" />
      <line x1={dx} y1={y1} x2={dx} y2={y2} stroke={color} strokeWidth="0.7"
        markerStart="url(#darr)" markerEnd="url(#darr)" />
      <rect x={dx - label.length * fontSize * 0.28 - 2} y={mid - fontSize / 2 - 1}
        width={label.length * fontSize * 0.56 + 4} height={fontSize + 2}
        fill="white" />
      <text x={dx} y={mid + fontSize * 0.35} textAnchor="middle" fontSize={fontSize}
        fontFamily="Arial,sans-serif" fill={color}
        transform={`rotate(-90,${dx},${mid})`}>{label}</text>
    </g>
  );
}

/**
 * RL level marker — triangle tick on structure + horizontal leader to margin.
 */
export function rlMark(
  x: number, y: number, rl: number, label: string,
  toX: number, opts: { color?: string; fontSize?: number } = {}
): ReactElement {
  const { color = "#333", fontSize = 7.5 } = opts;
  return (
    <g>
      {/* Small triangle tick */}
      <polygon points={`${x - 6},${y - 5} ${x + 6},${y - 5} ${x},${y + 1}`}
        fill={color} opacity={0.85} />
      {/* Horizontal leader */}
      <line x1={x + 6} y1={y - 3} x2={toX - 2} y2={y - 3} stroke={color} strokeWidth="0.5" />
      {/* Label */}
      <text x={toX + 2} y={y} fontSize={fontSize} fontFamily="Arial,sans-serif" fill={color}>
        {label}: {rl.toFixed(3)} m
      </text>
    </g>
  );
}

/**
 * RL horizontal datum line across the drawing
 */
export function rlLine(
  x1: number, y: number, x2: number, rl: number, label: string,
  opts: { color?: string; dash?: string; weight?: number } = {}
): ReactElement {
  const { color = "#555", dash = "6 3", weight = 0.8 } = opts;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={weight}
        strokeDasharray={dash} />
      <text x={x1 - 3} y={y + 3} textAnchor="end" fontSize="7.5"
        fontFamily="Arial,sans-serif" fill={color}>{label} {rl.toFixed(3)}</text>
    </g>
  );
}

/**
 * Bar mark circle — circular symbol with bar mark label inside
 */
export function barMark(cx: number, cy: number, mark: string, r = 8): ReactElement {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#c62828" strokeWidth="0.8" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="7"
        fontFamily="Arial,sans-serif" fontWeight="bold" fill="#c62828">{mark}</text>
    </g>
  );
}

/**
 * Reinforcement bar cross-section symbol (filled black circle for bar in section)
 */
export function barSection(cx: number, cy: number, dia: number, scale: number): ReactElement {
  const r = Math.max(1.5, dia * scale * 0.4);
  return (
    <circle cx={cx} cy={cy} r={r} fill="#212121" />
  );
}

// ── North Arrow ────────────────────────────────────────────────────────────
export function NorthArrow({ cx, cy, r = 18 }: { cx: number; cy: number; r?: number }): ReactElement {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#1F496B" strokeWidth="1.2" />
      {/* North half (filled) */}
      <polygon points={`${cx},${cy - r + 3} ${cx - 5},${cy + 3} ${cx},${cy} ${cx + 5},${cy + 3}`}
        fill="#1F496B" />
      {/* South half (outline) */}
      <polygon points={`${cx},${cy + r - 3} ${cx - 5},${cy - 3} ${cx},${cy} ${cx + 5},${cy - 3}`}
        fill="white" stroke="#1F496B" strokeWidth="0.8" />
      <text x={cx} y={cy - r - 3} textAnchor="middle" fontSize="9" fontWeight="bold"
        fontFamily="Arial,sans-serif" fill="#1F496B">N</text>
    </g>
  );
}

// ── Scale Bar ─────────────────────────────────────────────────────────────
export function ScaleBar({
  x, y, scale, pixPerMetre, label
}: {
  x: number; y: number; scale: number; pixPerMetre: number; label?: string;
}): ReactElement {
  // Draw a 20m scale bar (or shorter if scale is large)
  const barM = scale <= 100 ? 10 : scale <= 200 ? 20 : 50;
  const barPx = barM * pixPerMetre;
  const h = 5;
  const segments = 4;
  const segPx = barPx / segments;
  const segM = barM / segments;
  return (
    <g fontFamily="Arial,sans-serif">
      <text x={x} y={y - 3} fontSize="7.5" fill="#333">
        {label ?? `SCALE 1:${scale} (on A1 print)`}
      </text>
      {Array.from({ length: segments }, (_, i) => (
        <rect key={i} x={x + i * segPx} y={y}
          width={segPx} height={h}
          fill={i % 2 === 0 ? "#333" : "#fff"}
          stroke="#333" strokeWidth="0.5" />
      ))}
      {/* Tick labels */}
      {[0, segM, 2 * segM, 3 * segM, barM].map((m, i) => (
        <text key={i} x={x + i * segPx} y={y + h + 8}
          textAnchor="middle" fontSize="7" fill="#333">{m}</text>
      ))}
      <text x={x + barPx / 2} y={y + h + 17} textAnchor="middle" fontSize="7" fill="#333">
        metres
      </text>
    </g>
  );
}

// ── Standard IRC Title Block ───────────────────────────────────────────────
export function TitleBlock({
  x, y, w, h,
  project, location, title, drawNo, scale, date, rev = "0"
}: {
  x: number; y: number; w: number; h: number;
  project: string; location: string; title: string;
  drawNo: string; scale: string; date: string; rev?: string;
}): ReactElement {
  const fs = 7.5;
  const lh = 13;
  const col1 = w * 0.42;
  const col2 = w * 0.20;
  const col3 = w * 0.22;
  const col4 = w * 0.16;

  return (
    <g fontFamily="Arial,sans-serif">
      {/* Outer border */}
      <rect x={x} y={y} width={w} height={h} fill="#f8f9fa" stroke="#1F496B" strokeWidth="1.5" />

      {/* Col dividers */}
      <line x1={x + col1} y1={y} x2={x + col1} y2={y + h} stroke="#1F496B" strokeWidth="0.7" />
      <line x1={x + col1 + col2} y1={y} x2={x + col1 + col2} y2={y + h} stroke="#1F496B" strokeWidth="0.7" />
      <line x1={x + col1 + col2 + col3} y1={y} x2={x + col1 + col2 + col3} y2={y + h} stroke="#1F496B" strokeWidth="0.7" />

      {/* Row 1: Project / Title */}
      <line x1={x} y1={y + lh * 2.4} x2={x + w} y2={y + lh * 2.4} stroke="#1F496B" strokeWidth="0.5" />
      <text x={x + 5} y={y + lh * 0.9} fontSize={fs + 1} fontWeight="bold" fill="#1F496B">PROJECT:</text>
      <text x={x + 5} y={y + lh * 1.85} fontSize={fs} fill="#333">{project}</text>
      <text x={x + 5} y={y + lh * 2.2} fontSize={fs - 1} fill="#555">{location}</text>

      {/* Drawing title in col1, rows 1-3 */}
      {/* Row 2: header fields */}
      <text x={x + col1 + 5} y={y + lh * 0.9} fontSize={fs} fill="#555">DRAWING NO.</text>
      <text x={x + col1 + 5} y={y + lh * 1.9} fontSize={fs + 0.5} fontWeight="bold" fill="#1F496B">{drawNo}</text>

      <text x={x + col1 + col2 + 5} y={y + lh * 0.9} fontSize={fs} fill="#555">SCALE</text>
      <text x={x + col1 + col2 + 5} y={y + lh * 1.9} fontSize={fs} fontWeight="bold" fill="#333">{scale}</text>

      <text x={x + col1 + col2 + col3 + 5} y={y + lh * 0.9} fontSize={fs} fill="#555">REV.</text>
      <text x={x + col1 + col2 + col3 + 5} y={y + lh * 1.9} fontSize={fs + 1} fontWeight="bold" fill="#c62828">{rev}</text>

      {/* Row 2 */}
      <text x={x + 5} y={y + lh * 3.0} fontSize={fs} fill="#555">DRAWING TITLE:</text>
      <text x={x + 5} y={y + lh * 3.85} fontSize={fs + 1} fontWeight="bold" fill="#1F496B">{title}</text>

      <text x={x + col1 + 5} y={y + lh * 3.0} fontSize={fs} fill="#555">DATE</text>
      <text x={x + col1 + 5} y={y + lh * 3.85} fontSize={fs} fill="#333">{date}</text>

      <text x={x + col1 + col2 + 5} y={y + lh * 3.0} fontSize={fs} fill="#555">DRAWN BY</text>
      <text x={x + col1 + col2 + 5} y={y + lh * 3.85} fontSize={fs} fill="#333">Bridge_Slab_Design</text>

      <text x={x + col1 + col2 + col3 + 5} y={y + lh * 3.0} fontSize={fs} fill="#555">CHK'D</text>
      <text x={x + col1 + col2 + col3 + 5} y={y + lh * 3.85} fontSize={fs} fill="#333">___</text>

      <line x1={x} y1={y + lh * 4.3} x2={x + w} y2={y + lh * 4.3} stroke="#1F496B" strokeWidth="0.5" />

      {/* Row 3: codes */}
      <text x={x + 5} y={y + h - 5} fontSize={fs - 0.5} fill="#555">
        IRC:6-2016 / IRC:112-2015 / IS:456-2000 / IRC:SP:13 / IRC:5-2015
      </text>
      <text x={x + col1 + 5} y={y + h - 5} fontSize={fs - 0.5} fill="#555">
        SHEET 1 OF 1
      </text>
    </g>
  );
}

// ── Drawing border ─────────────────────────────────────────────────────────
export function DrawingBorder({ w, h }: { w: number; h: number }): ReactElement {
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} fill="#fff" />
      <rect x={3} y={3} width={w - 6} height={h - 6} fill="none"
        stroke="#1F496B" strokeWidth="2.5" />
      <rect x={10} y={10} width={w - 20} height={h - 20} fill="none"
        stroke="#1F496B" strokeWidth="0.7" />
    </g>
  );
}
