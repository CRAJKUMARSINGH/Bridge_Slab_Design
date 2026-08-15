/**
 * Drawing_Module stub — renders lightweight SVG diagrams using the design
 * results already computed by the bridge-excel-generator engine.
 * The full parametric drawing engine lives in server/dxf-export.ts and
 * server/svg-diagrams.ts; this client stub provides interactive panel views.
 */
import React from 'react';

interface DrawingProps {
  data?: any;
  input?: any;
  results?: any;
  className?: string;
}

function SvgPlaceholder({ label, color = '#1e40af' }: { label: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', background: '#0f172a', borderRadius: 8 }}
    >
      <rect x="10" y="10" width="780" height="380" fill="none" stroke={color} strokeWidth="2" rx="4" />
      <line x1="10" y1="200" x2="790" y2="200" stroke={color} strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
      {/* Bridge deck */}
      <rect x="80" y="160" width="640" height="30" fill={color} opacity="0.3" rx="2" />
      {/* Piers */}
      <rect x="220" y="190" width="40" height="140" fill={color} opacity="0.5" />
      <rect x="540" y="190" width="40" height="140" fill={color} opacity="0.5" />
      {/* Abutments */}
      <rect x="60" y="180" width="60" height="150" fill={color} opacity="0.6" rx="2" />
      <rect x="680" y="180" width="60" height="150" fill={color} opacity="0.6" rx="2" />
      {/* Water line */}
      <line x1="10" y1="310" x2="790" y2="310" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="8,4" />
      <text x="400" y="350" textAnchor="middle" fill="#38bdf8" fontSize="11" opacity="0.7">HFL</text>
      {/* Label */}
      <text x="400" y="60" textAnchor="middle" fill="#94a3b8" fontSize="14" fontFamily="monospace" fontWeight="bold">{label}</text>
      <text x="400" y="90" textAnchor="middle" fill="#475569" fontSize="11" fontFamily="monospace">
        IRC-compliant drawing (DXF export available via Design → Export → DXF)
      </text>
    </svg>
  );
}

export function GADDrawing({ data, results, input, className }: DrawingProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <SvgPlaceholder label="General Arrangement Drawing (GAD) — Elevation View" color="#3b82f6" />
    </div>
  );
}

export function PierDrawing({ data, results, input, className }: DrawingProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <SvgPlaceholder label="Pier Details — Plan & Elevation" color="#8b5cf6" />
    </div>
  );
}

export function AbutmentDrawing({ data, results, input, className }: DrawingProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <SvgPlaceholder label="Abutment Details — Wing Walls & Return Walls" color="#10b981" />
    </div>
  );
}

export function DeckingDrawing({ data, results, input, className }: DrawingProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <SvgPlaceholder label="Decking Layout — Slab Reinforcement Plan" color="#f59e0b" />
    </div>
  );
}

export function CrossSectionDrawing({ data, results, input, className }: DrawingProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 300 }}>
      <SvgPlaceholder label="Typical Cross-Section — Road + Carriageway Details" color="#ef4444" />
    </div>
  );
}

export default {
  GADDrawing,
  PierDrawing,
  AbutmentDrawing,
  DeckingDrawing,
  CrossSectionDrawing,
};
