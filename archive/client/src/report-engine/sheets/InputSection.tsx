import React, { useCallback } from 'react';
import { Inputs, XSecRow, MoSTRow } from '../BridgeSlabReport';

// Expert Audit Standards (Derived from Jakham/Som/Bedla Benchmarks)
const EXPERT_PRESETS: Record<string, Partial<Inputs>> = {
  "Jakham River": { pierW: 1.2, pierL: 8.5, abt_phi: 32, abt_gamma: 1.8, fy_pier: 500 },
  "Som River": { pierW: 1.3, pierL: 7.5, abt_phi: 30, abt_gamma: 1.8, fy_pier: 415 },
  "Bedla Bridge": { pierW: 1.2, pierL: 8.0, abt_phi: 35, abt_gamma: 2.0, fy_pier: 500 }
};

export const InputSection: React.FC<{
  inp: Inputs;
  setInp: React.Dispatch<React.SetStateAction<Inputs>>;
}> = ({ inp, setInp }) => {
  const set = useCallback(
    (k: keyof Inputs, v: string | number | boolean | XSecRow[] | MoSTRow[]) => {
      setInp((prev) => ({ ...prev, [k]: v }));
    },
    [setInp],
  );

  const num = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, parseFloat(e.target.value) || 0);

  const txt = (k: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, e.target.value);


  const labelStyle: React.CSSProperties = { fontSize: 10, fontFamily: "Verdana,sans-serif", color: "#444", display: "flex", flexDirection: "column", gap: 2 };
  const inputStyle: React.CSSProperties = { fontFamily: "Verdana,sans-serif", fontSize: 10.5, border: "1px solid #bbb", borderRadius: 2, padding: "3px 6px", width: "100%", background: "#fff" };
  const groupHead: React.CSSProperties = { fontFamily: "Verdana,sans-serif", fontSize: 11, fontWeight: "bold", color: "#1e3a5f", background: "#e8f0fa", padding: "5px 10px", borderLeft: "4px solid royalblue", marginBottom: 8, marginTop: 12 };
  const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 6 };

  return (
    <div className="input-panel" style={{ padding: 12, background: "#fdfdfd", border: "1px solid #ccc" }}>
      <div style={{ ...groupHead, borderLeftColor: "#f4511e", background: "#fff3e0" }}>
        âš¡ Expert Audit Presets (Jakham/Som/Bedla Benchmarks)
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, padding: "0 10px" }}>
        {Object.entries(EXPERT_PRESETS).map(([name, vals]) => (
          <button
            key={name}
            onClick={() => Object.entries(vals).forEach(([k, v]) => set(k as any, v as any))}
            style={{ fontSize: 10, padding: "4px 10px", background: "#fff", border: "1px solid #f4511e", borderRadius: 4, cursor: "pointer", fontWeight: "bold", color: "#f4511e" }}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={groupHead}>ðŸš€ Project Meta-Data</div>
      <div style={grid3}>
        <label style={labelStyle}>Bridge Name <input style={inputStyle} value={inp.name} onChange={txt("name")} /></label>
        <label style={labelStyle}>River / Stream <input style={inputStyle} value={inp.river} onChange={txt("river")} /></label>
        <label style={labelStyle}>Location <input style={inputStyle} value={inp.location} onChange={txt("location")} /></label>
      </div>

      <div style={groupHead}>ðŸŒŠ Hydraulics &amp; Scour (ASTRA Parity)</div>
      <div style={grid3}>
        <label style={labelStyle}>Catchment Area (A) <input style={inputStyle} type="number" value={inp.A} onChange={num("A")} /></label>
        <label style={labelStyle}>Wetted Perimeter (P) <input style={inputStyle} type="number" value={inp.P_} onChange={num("P_")} /></label>
        <label style={labelStyle}>Slope (1 in S) <input style={inputStyle} type="number" value={inp.S_denom} onChange={num("S_denom")} /></label>
        <label style={labelStyle}>Observed Vel (m/s) <input style={inputStyle} type="number" step="0.1" value={inp.v_observed ?? 0} onChange={num("v_observed")} /></label>
        <label style={labelStyle}>F1 (Q_found Factor) <input style={inputStyle} type="number" step="0.05" value={inp.f1Factor ?? 1.3} onChange={num("f1Factor")} /></label>
        <label style={labelStyle}>F2 (D_found Factor) <input style={inputStyle} type="number" step="0.05" value={inp.f2Factor ?? 1.33} onChange={num("f2Factor")} /></label>
        <label style={labelStyle}>Max Scour Multiplier <input style={inputStyle} type="number" step="0.01" value={inp.maxScourMultiplier ?? 1.272} onChange={num("maxScourMultiplier")} /></label>
      </div>

      <div style={groupHead}>ðŸ§± Pier &amp; Abutment Geometry</div>
      <div style={grid3}>
        <label style={labelStyle}>Pier Width (m) <input style={inputStyle} type="number" value={inp.pierW} onChange={num("pierW")} /></label>
        <label style={labelStyle}>Pier Height (m) <input style={inputStyle} type="number" value={inp.pierH} onChange={num("pierH")} /></label>
        <label style={labelStyle}>SBC (kPa) <input style={inputStyle} type="number" value={inp.SBC} onChange={num("SBC")} /></label>
        <label style={labelStyle}>Skew Angle (deg) <input style={inputStyle} type="number" min="0" max="60" step="1" value={inp.skewDeg ?? 0} onChange={num("skewDeg")} /></label>
      </div>

      <div style={groupHead}>ðŸ›¡ï¸ Seismic &amp; Pier Parameters (IRC:6)</div>
      <div style={grid3}>
        <label style={labelStyle}>Seismic Zone 
          <select style={inputStyle} value={inp.seismicZone ?? "III"} onChange={(e) => set("seismicZone", e.target.value as any)}>
            <option value="II">Zone II (0.10)</option>
            <option value="III">Zone III (0.16)</option>
            <option value="IV">Zone IV (0.24)</option>
            <option value="V">Zone V (0.36)</option>
          </select>
        </label>
        <label style={labelStyle}>Cd (Drag Coeff) <input style={inputStyle} type="number" step="0.01" value={inp.Cd ?? 0.7} onChange={num("Cd")} /></label>
        <label style={labelStyle}>R Factor <input style={inputStyle} type="number" step="0.1" value={inp.R_factor ?? 3.0} onChange={num("R_factor")} /></label>
        <label style={labelStyle}>I Factor <input style={inputStyle} type="number" step="0.1" value={inp.I_factor ?? 1.2} onChange={num("I_factor")} /></label>
      </div>

      <div style={{ padding: 8, marginTop: 12, background: "#e8f5e9", color: "#2e7d32", fontSize: 10, borderRadius: 4 }}>
        <strong>âœ“ ENGINE MODULARIZED:</strong> High-performance derivation engine active.
      </div>
    </div>
  );
};


