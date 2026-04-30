/**
 * OptimisationAtAGlance â€” Floating live recalculation dashboard
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Shows real-time pass/fail for all three design domains.
 * "Fix" buttons scroll to the relevant optimiser panel.
 * Minimises to a pill when not needed.
 */
import React, { useState, useCallback } from 'react';
import { Inputs, Derived } from '../BridgeSlabReport';

interface Props {
  i: Inputs;
  d: Derived;
  onApply: (updates: Partial<Inputs>) => void;
}

const C = {
  header:  '#0a2240',
  green:   '#007a3d',
  red:     '#b00020',
  amber:   '#b07000',
  bgGreen: '#e6f4ed',
  bgRed:   '#fce8ec',
  bgAmber: '#fef3e2',
  border:  '#c8d8e8',
};

function StatusBadge({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const bg = ok ? C.green : warn ? C.amber : C.red;
  const label = ok ? 'SAFE' : warn ? 'WARN' : 'FAIL';
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 'bold',
      color: '#fff', background: bg, letterSpacing: 0.5,
    }}>
      {label}
    </span>
  );
}

function Row({ label, value, ok, warn, note }: {
  label: string; value: string; ok: boolean; warn?: boolean; note?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 0', borderBottom: `1px solid ${C.border}`,
      background: ok ? undefined : warn ? C.bgAmber : C.bgRed,
    }}>
      <span style={{ fontSize: 9.5, color: '#444', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 9.5, fontFamily: 'Consolas,monospace', color: '#111', flex: 1 }}>{value}</span>
      <StatusBadge ok={ok} warn={warn} />
      {note && <span style={{ fontSize: 8, color: '#666', marginLeft: 4 }}>{note}</span>}
    </div>
  );
}

export const OptimisationAtAGlance: React.FC<Props> = ({ i, d, onApply }) => {
  // Start minimized so the front-matter (cover, foreword, ToC) is unobstructed.
  const [minimized, setMinimized] = useState(true);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // â”€â”€ Hydraulics checks â”€â”€
  const waterwayOK = (i.spans * i.spanL) >= d.L_lacey * 0.95;
  const affluxOK   = d.afflux <= 0.30;
  const affluxWarn = d.afflux > 0.30 && d.afflux <= 0.60;
  const frOK       = d.Fr < 1.0;
  const hydOK      = waterwayOK && affluxOK && frOK;

  // â”€â”€ Pier checks â”€â”€
  const isSeismic = [false, false, true, true, false];
  const pierOK = d.pierLCs.every((lc: any, idx: number) => {
    const slidMin = isSeismic[idx] ? 1.25 : 1.50;
    const otMin   = isSeismic[idx] ? 1.50 : 2.00;
    return lc.qmax <= d.SBC && lc.slidFOS >= slidMin && lc.otFOS >= otMin;
  });
  const govQmax   = Math.max(...d.pierLCs.map((lc: any) => lc.qmax));
  const worstSlid = Math.min(...d.pierLCs.map((lc: any) => lc.slidFOS));
  const worstOT   = Math.min(...d.pierLCs.map((lc: any) => lc.otFOS));

  // â”€â”€ Abutment checks â”€â”€
  const abtOK = d.abtCases.every((lc: any) => lc.bearOK && lc.slidOK && lc.otOK);

  // â”€â”€ Overall â”€â”€
  const overallOK = hydOK && pierOK && abtOK;

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 20, right: 20,
          background: overallOK ? C.green : C.red,
          color: '#fff', padding: '10px 16px', borderRadius: 30,
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          zIndex: 1000, fontWeight: 'bold', fontSize: 11,
          fontFamily: 'Verdana,sans-serif', letterSpacing: 0.3,
        }}
      >
        {overallOK ? 'âœ“' : 'âœ—'} Optimisation Dashboard
      </div>
    );
  }

  return (
    <div className="no-print" style={{
      position: 'fixed', bottom: 20, right: 20,
      width: 340, background: '#fff',
      border: `2px solid ${overallOK ? C.green : C.red}`,
      borderRadius: 6, boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
      zIndex: 1000, overflow: 'hidden',
      fontFamily: 'Verdana,sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: overallOK ? '#0a3d22' : '#6b0012',
        color: '#fff', padding: '8px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 'bold' }}>
            {overallOK ? 'âœ“ ALL CHECKS PASS' : 'âœ— REVIEW REQUIRED'}
          </div>
          <div style={{ fontSize: 8, color: overallOK ? '#a8e6c3' : '#f4b8c4', marginTop: 1 }}>
            {i.river} Â· {i.spans}Ã—{i.spanL}m Â· Q={d.Q.toFixed(1)} mÂ³/s
          </div>
        </div>
        <button onClick={() => setMinimized(true)} style={{
          background: 'none', border: 'none', color: '#fff',
          cursor: 'pointer', fontSize: 18, lineHeight: 1,
        }}>âˆ’</button>
      </div>

      <div style={{ padding: '8px 12px' }}>
        {/* Hydraulics */}
        <div style={{ fontSize: 9, fontWeight: 'bold', color: C.header,
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
          Hydraulics
        </div>
        <Row label="Waterway" value={`${(i.spans * i.spanL).toFixed(1)} m vs ${d.L_lacey.toFixed(1)} m Lacey`}
          ok={waterwayOK} note={waterwayOK ? undefined : 'Add spans'} />
        <Row label="Afflux" value={`h = ${d.afflux.toFixed(3)} m â†’ DWL ${d.DWL.toFixed(2)} m`}
          ok={affluxOK} warn={affluxWarn} note={affluxOK ? undefined : '> 0.30 m'} />
        <Row label="Froude No." value={`Fr = ${d.Fr.toFixed(3)}`}
          ok={frOK} note={frOK ? 'Sub-critical' : 'Supercritical!'} />

        {/* Pier */}
        <div style={{ fontSize: 9, fontWeight: 'bold', color: C.header,
          textTransform: 'uppercase', letterSpacing: 0.5, margin: '6px 0 3px' }}>
          Pier Footing ({i.ftgPW.toFixed(2)}Ã—{i.ftgPL.toFixed(2)} m)
        </div>
        <Row label="Bearing qmax" value={`${govQmax.toFixed(1)} kPa vs SBC ${d.SBC.toFixed(0)} kPa`}
          ok={govQmax <= d.SBC} />
        <Row label="Sliding FOS" value={`${worstSlid.toFixed(2)} (min 1.25/1.50)`}
          ok={worstSlid >= 1.25} warn={worstSlid >= 1.25 && worstSlid < 1.50} />
        <Row label="OT FOS" value={`${worstOT.toFixed(2)} (min 1.50/2.00)`}
          ok={worstOT >= 1.50} warn={worstOT >= 1.50 && worstOT < 2.00} />

        {/* Abutment */}
        <div style={{ fontSize: 9, fontWeight: 'bold', color: C.header,
          textTransform: 'uppercase', letterSpacing: 0.5, margin: '6px 0 3px' }}>
          Abutment (Bbase {i.abt_Bbase.toFixed(2)} m)
        </div>
        {d.abtCases.map((lc: any, idx: number) => (
          <Row key={idx}
            label={`LC${idx + 1} ${lc.seismic ? '(Seis)' : ''}`}
            value={`slid=${lc.slidFOS.toFixed(2)} ot=${lc.otFOS.toFixed(2)} q=${lc.qmax.toFixed(0)}`}
            ok={lc.slidOK && lc.otOK && lc.bearOK}
          />
        ))}

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 8 }}>
          <button onClick={() => scrollTo('s-hyd-opt')} style={{
            padding: '5px 4px', background: hydOK ? '#e8f5e9' : C.amber,
            color: hydOK ? C.green : '#fff', border: `1px solid ${hydOK ? C.green : C.amber}`,
            borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 'bold',
          }}>
            {hydOK ? 'âœ“' : 'â–¶'} Hydraulics
          </button>
          <button onClick={() => scrollTo('s-pier-opt')} style={{
            padding: '5px 4px', background: pierOK ? '#e8f5e9' : C.red,
            color: pierOK ? C.green : '#fff', border: `1px solid ${pierOK ? C.green : C.red}`,
            borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 'bold',
          }}>
            {pierOK ? 'âœ“' : 'â–¶'} Pier
          </button>
          <button onClick={() => scrollTo('s-abt-opt')} style={{
            padding: '5px 4px', background: abtOK ? '#e8f5e9' : C.red,
            color: abtOK ? C.green : '#fff', border: `1px solid ${abtOK ? C.green : C.red}`,
            borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 'bold',
          }}>
            {abtOK ? 'âœ“' : 'â–¶'} Abutment
          </button>
        </div>

        <div style={{ fontSize: 8, color: '#888', marginTop: 6, textAlign: 'center' }}>
          Click â–¶ to jump to optimiser Â· Apply updates inputs Â· Re-compute to refresh
        </div>
      </div>
    </div>
  );
};


