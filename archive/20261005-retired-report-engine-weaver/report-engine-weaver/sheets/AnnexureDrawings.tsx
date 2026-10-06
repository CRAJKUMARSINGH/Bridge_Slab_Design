import React from "react";
import { Inputs, Derived } from "../BridgeSlabReport";
import {
  SectionHead,
  SubHead,
  SummaryTable,
  Page,
  CalcBlock,
  fv,
} from "./ReportUI";

export function AnnexureDrawings({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <div className="annexure-section">
      <Page>
        <div id="s-annexure-drawings">
          <SectionHead>
            ANNEXURE: REINFORCEMENT DETAILS & SCHEMATIC DRAWINGS
          </SectionHead>
          <SubHead>Drawing No. D-01: Pier Reinforcement Detail</SubHead>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div
              className="drawing-container"
              style={{
                border: "1px solid #ccc",
                background: "#fff",
                padding: 10,
              }}
            >
              <PierDrawing i={i} d={d} />
            </div>
            <div className="bbs-summary" style={{ flex: 1 }}>
              <SummaryTable
                head={[
                  "Mark",
                  "Description",
                  "Dia",
                  "Nos",
                  "Length",
                  "Weight (kg)",
                ]}
                rows={d.bbs_pier.map((bar) => [
                  bar.mark,
                  bar.desc,
                  bar.dia + " mm",
                  bar.nos,
                  bar.len.toFixed(2) + " m",
                  bar.wt.toFixed(1),
                ])}
              />
              <CalcBlock
                rows={[
                  {
                    where: "Total Steel (Pier Body)",
                    result: fv(
                      d.bbs_pier.reduce((s, b) => s + b.wt, 0),
                      1,
                    ),
                    unit: "kg",
                    bold: true,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </Page>

      <Page>
        <SubHead>Drawing No. D-02: Abutment Cross-Section (Type 1)</SubHead>
        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{
              border: "1px solid #ccc",
              background: "#fff",
              padding: 10,
            }}
          >
            <AbutmentDrawing i={i} d={d} />
          </div>
          <div style={{ flex: 1 }}>
            <Prose>
              Drawing depicts the stem reinforcement and footing mesh as per the
              structural analysis in Sheets 21-24. Main bars are provided on the
              earth face to resist the active soil pressure {fv(d.Ka, 3)}.
            </Prose>
          </div>
        </div>
        <SubHead>Drawing No. D-03: Deck Slab BBS Schematic</SubHead>
        <div
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            padding: 20,
            minHeight: 300,
          }}
        >
          <DeckSlabDrawing i={i} d={d} />
        </div>
      </Page>

      <Page>
        <SubHead>Drawing No. D-04: Hydraulic Profile & Scour Diagram</SubHead>
        <div
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            padding: 20,
          }}
        >
          <ScourProfileDrawing i={i} d={d} />
        </div>
        <Prose>
          Long-section showing HFL line, design water level (HFL + h), bed level
          and the parabolic local scour cones at each pier nose. The mean scour
          d<sub>sm</sub> = {fv(d.dsm, 3)} m is from Lacey&rsquo;s formula and the
          design pier scour D<sub>max</sub> = {fv(d.max_dsm, 3)} m applies the
          ASTRA factor 1.272. Founding RL is set at {fv(d.foundingRL, 3)} m, well
          below the design scour line per IRC:78-2014 Cl.706.
        </Prose>
        <SubHead>Drawing No. D-05: Pier Stability Free-Body Diagram</SubHead>
        <div
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            padding: 20,
          }}
        >
          <PierStabilityDrawing i={i} d={d} />
        </div>
        <Prose>
          Free-body diagram of one pier with vertical loads (DL, LL+I) at the
          cap and lateral forces (water current, hydrodynamic, seismic,
          braking/wind) acting at their respective heights. The trapezoidal
          base-pressure distribution is drawn qualitatively; q<sub>max</sub> is
          checked against the adopted SBC of {fv(d.SBC, 0)} kN/m² and the
          sliding factor of safety against the IRC:78 floor of 1.50 for every
          load combination tabulated in the Pier Stability sheet.
        </Prose>
      </Page>

      <Page>
        <SubHead>Drawing No. D-06: Abutment Earth-Pressure Diagram</SubHead>
        <div
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            padding: 20,
          }}
        >
          <AbutmentPressureDrawing i={i} d={d} />
        </div>
        <Prose>
          Rankine active earth-pressure triangle on the abutment stem with
          K<sub>a</sub> = {fv(d.Ka, 3)} from φ = {i.abt_phi}° and γ ={" "}
          {i.abt_gamma} kN/m³. Total active thrust per metre run P<sub>a</sub>{" "}
          = ½·K<sub>a</sub>·γ·H² = {fv(0.5 * d.Ka * i.abt_gamma * i.abt_H * i.abt_H, 1)}{" "}
          kN/m, acting at H/3 above the base. This thrust drives the
          overturning, sliding and bearing checks documented in the Abutment
          Stability sheet.
        </Prose>
        <SubHead>Drawing No. D-07: Deck Slab Reinforcement Plan</SubHead>
        <div
          style={{
            border: "1px solid #ccc",
            background: "#fff",
            padding: 20,
          }}
        >
          <SlabReinfPlanDrawing i={i} d={d} />
        </div>
        <Prose>
          Plan view of one span with main steel (longitudinal, bottom face)
          provided as 20φ @ {d.sp_main ?? 150} mm c/c and distribution steel
          (transverse, both faces) as 12φ @ 200 mm c/c. The dispersal-corrected
          effective width b<sub>e</sub> = {fv(d.sl66_be, 3)} m and effective
          span l<sub>eff</sub> = {fv(d.sl_leff, 3)} m drive the moment envelope
          tabulated in the Deck Slab sheet.
        </Prose>
      </Page>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Engineering diagrams (Phase 3) — deterministic SVGs derived from i + d
   ────────────────────────────────────────────────────────────────────────── */

function ScourProfileDrawing({ i, d }: { i: Inputs; d: Derived }) {
  const totalL = i.spans * i.spanL;
  const nPiers = Math.max(0, i.spans - 1);
  const w = 720;
  const margin = 56;
  const drawW = w - 2 * margin;
  const sx = drawW / Math.max(totalL, 0.001);

  const SCALE = 30;
  const waterH = (i.HFL - i.bedRL) * SCALE;
  const deckY = 60;
  const hflY = deckY + 28;
  const bedY = hflY + waterH;
  const dsmY = bedY + d.dsm * SCALE;
  const dMaxY = bedY + d.max_dsm * SCALE;
  const foundY = bedY + (i.bedRL - d.foundingRL) * SCALE;
  const h = Math.max(360, dMaxY + 80);
  const toX = (x: number) => margin + x * sx;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} fill="#fff" />
      <text x={w / 2} y={20} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1F496B">
        Hydraulic Profile & Scour Diagram
      </text>
      {/* Water body */}
      <rect x={margin} y={hflY} width={drawW} height={waterH} fill="#bbdefb" opacity={0.55} />
      {/* HFL */}
      <line x1={margin} y1={hflY} x2={w - margin} y2={hflY} stroke="#1976d2" strokeWidth={2} strokeDasharray="6,4" />
      <text x={w - margin + 4} y={hflY + 3} fontSize={9} fill="#1976d2">HFL {fv(i.HFL, 2)}</text>
      {/* Bed */}
      <line x1={margin} y1={bedY} x2={w - margin} y2={bedY} stroke="#795548" strokeWidth={2} />
      <text x={w - margin + 4} y={bedY + 3} fontSize={9} fill="#795548">Bed {fv(i.bedRL, 2)}</text>
      {/* Mean scour */}
      <line x1={margin} y1={dsmY} x2={w - margin} y2={dsmY} stroke="#ef6c00" strokeWidth={1} strokeDasharray="4,3" />
      <text x={margin - 4} y={dsmY + 3} textAnchor="end" fontSize={9} fill="#ef6c00">d_sm</text>
      {/* Pier scour cones + pier shafts */}
      {Array.from({ length: nPiers }).map((_, idx) => {
        const px = toX((idx + 1) * i.spanL);
        const half = i.pierW * sx * 1.4;
        const dipDepth = d.max_dsm * SCALE;
        return (
          <g key={idx}>
            <path
              d={`M ${px - half * 1.6} ${bedY} Q ${px} ${bedY + dipDepth} ${px + half * 1.6} ${bedY}`}
              fill="#ffe0b2"
              stroke="#bf360c"
              strokeWidth={1.4}
              opacity={0.85}
            />
            <rect
              x={px - (i.pierW * sx) / 2}
              y={deckY}
              width={i.pierW * sx}
              height={dsmY - deckY}
              fill="#cfd8dc"
              stroke="#37474f"
              strokeWidth={1.2}
            />
            <text x={px} y={deckY + 11} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#263238">
              P{idx + 1}
            </text>
            <text x={px + 6} y={bedY + dipDepth - 4} fontSize={8} fill="#bf360c">
              D={fv(d.max_dsm, 2)}m
            </text>
          </g>
        );
      })}
      {/* Deck slab */}
      <rect x={toX(0) - 4} y={deckY - 12} width={drawW + 8} height={12} fill="#90a4ae" stroke="#37474f" strokeWidth={1.4} />
      {/* Founding RL */}
      <line x1={margin} y1={foundY} x2={w - margin} y2={foundY} stroke="#d32f2f" strokeWidth={1.4} strokeDasharray="8,3" />
      <text x={w - margin + 4} y={foundY + 3} fontSize={9} fontWeight="bold" fill="#d32f2f">
        Found {fv(d.foundingRL, 2)}
      </text>
    </svg>
  );
}

function PierStabilityDrawing({ i, d }: { i: Inputs; d: Derived }) {
  const w = 620;
  const h = 420;
  const cx = w / 2;
  const baseY = h - 80;
  const scale = 32;
  const pxPierH = i.pierH * scale;
  const pxPierW = i.pierW * scale;
  const pxFtgW = i.ftgPW * scale;
  const pxFtgT = i.ftgPT * scale;
  const topY = baseY - pxPierH - pxFtgT;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} fill="#fff" />
      <text x={w / 2} y={20} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1F496B">
        Pier Stability Free-Body Diagram
      </text>
      <defs>
        <marker id="vArrCl" markerWidth="10" markerHeight="10" refX="5" refY="9" orient="auto">
          <polygon points="0,0 10,0 5,9" fill="#1565c0" />
        </marker>
        <marker id="hArrCl" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <polygon points="0,0 0,10 9,5" fill="#d32f2f" />
        </marker>
      </defs>
      {/* Pier */}
      <rect x={cx - pxPierW / 2} y={topY} width={pxPierW} height={pxPierH} fill="#e3f2fd" stroke="#1565c0" strokeWidth={1.4} />
      {/* Footing */}
      <rect x={cx - pxFtgW / 2} y={baseY - pxFtgT} width={pxFtgW} height={pxFtgT} fill="#fff3e0" stroke="#ef6c00" strokeWidth={1.4} />
      <text x={cx + pxFtgW / 2 + 4} y={baseY - pxFtgT / 2 + 3} fontSize={9} fill="#ef6c00">
        B={fv(i.ftgPW, 2)}m
      </text>
      {/* Ground */}
      <line x1={cx - pxFtgW / 2 - 50} y1={baseY} x2={cx + pxFtgW / 2 + 50} y2={baseY} stroke="#5d4037" strokeWidth={2} />
      {/* Vertical loads */}
      <line x1={cx - 28} y1={topY - 50} x2={cx - 28} y2={topY - 6} stroke="#1565c0" strokeWidth={2.4} markerEnd="url(#vArrCl)" />
      <text x={cx - 60} y={topY - 28} fontSize={10} fontWeight="bold" fill="#1565c0">DL</text>
      <line x1={cx + 28} y1={topY - 50} x2={cx + 28} y2={topY - 6} stroke="#1565c0" strokeWidth={2.4} markerEnd="url(#vArrCl)" />
      <text x={cx + 36} y={topY - 28} fontSize={10} fontWeight="bold" fill="#1565c0">LL+I</text>
      {/* Horizontal forces */}
      {[
        { y: topY + pxPierH * 0.20, lbl: "Wind/Brake", side: "right" },
        { y: topY + pxPierH * 0.45, lbl: "Seismic",    side: "left" },
        { y: topY + pxPierH * 0.65, lbl: "Hydro",      side: "right" },
        { y: topY + pxPierH * 0.85, lbl: "Current",    side: "left" },
      ].map((l) =>
        l.side === "right" ? (
          <g key={l.lbl}>
            <line x1={cx + pxPierW / 2 + 56} y1={l.y} x2={cx + pxPierW / 2 + 4} y2={l.y} stroke="#d32f2f" strokeWidth={2} markerEnd="url(#hArrCl)" />
            <text x={cx + pxPierW / 2 + 60} y={l.y - 3} fontSize={9} fill="#d32f2f">{l.lbl}</text>
          </g>
        ) : (
          <g key={l.lbl}>
            <line x1={cx - pxPierW / 2 - 56} y1={l.y} x2={cx - pxPierW / 2 - 4} y2={l.y} stroke="#d32f2f" strokeWidth={2} markerStart="url(#hArrCl)" />
            <text x={cx - pxPierW / 2 - 95} y={l.y - 3} fontSize={9} fill="#d32f2f">{l.lbl}</text>
          </g>
        ),
      )}
      <text x={cx} y={baseY + 24} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#37474f">
        Σ q ≤ SBC ({fv(d.SBC, 0)} kN/m²) &nbsp;|&nbsp; FOS_slide ≥ 1.5 &nbsp;|&nbsp; e ≤ B/6
      </text>
    </svg>
  );
}

function AbutmentPressureDrawing({ i, d }: { i: Inputs; d: Derived }) {
  const w = 620;
  const h = 420;
  const margin = 40;
  const scale = 30;
  const baseY = h - 80;
  const stemX = margin + 160;
  const pxH = i.abt_H * scale;
  const pxBw = i.abt_tstem * scale;
  const pxB = i.abt_Bbase * scale;
  const Pa = 0.5 * d.Ka * i.abt_gamma * i.abt_H * i.abt_H;
  const yPa = i.abt_H / 3;
  const baseP = d.Ka * i.abt_gamma * i.abt_H * 3.5;
  const yPaPx = baseY - yPa * scale;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} fill="#fff" />
      <text x={w / 2} y={20} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1F496B">
        Abutment Earth-Pressure Diagram (K_a = {fv(d.Ka, 3)})
      </text>
      <defs>
        <marker id="paArrCl" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <polygon points="0,0 0,10 9,5" fill="#d32f2f" />
        </marker>
      </defs>
      {/* Ground */}
      <line x1={margin} y1={baseY} x2={w - margin} y2={baseY} stroke="#5d4037" strokeWidth={2} />
      {/* Stem */}
      <rect x={stemX} y={baseY - pxH} width={pxBw} height={pxH} fill="#e3f2fd" stroke="#1565c0" strokeWidth={1.4} />
      {/* Footing */}
      <rect x={stemX - (pxB - pxBw) * 0.5} y={baseY} width={pxB} height={20} fill="#fff3e0" stroke="#ef6c00" strokeWidth={1.4} />
      <text x={stemX + pxBw / 2} y={baseY + 36} textAnchor="middle" fontSize={9} fill="#ef6c00">
        B = {fv(i.abt_Bbase, 2)} m
      </text>
      {/* Backfill hatching */}
      {Array.from({ length: 12 }).map((_, r) => {
        const yy = baseY - (r * pxH) / 12;
        return (
          <line key={r} x1={stemX + pxBw} y1={yy} x2={stemX + pxBw + 80} y2={yy + 16} stroke="#a1887f" strokeWidth={0.5} />
        );
      })}
      {/* Pressure triangle */}
      <polygon
        points={`${stemX + pxBw},${baseY - pxH} ${stemX + pxBw},${baseY} ${stemX + pxBw + baseP},${baseY}`}
        fill="#ffcdd2"
        stroke="#c62828"
        strokeWidth={1.2}
        opacity={0.85}
      />
      {Array.from({ length: 6 }).map((_, k) => {
        const fr = (k + 1) / 7;
        const yy = baseY - pxH + fr * pxH;
        const len = baseP * fr;
        return (
          <line key={k} x1={stemX + pxBw + len} y1={yy} x2={stemX + pxBw + 2} y2={yy} stroke="#d32f2f" strokeWidth={1.2} markerEnd="url(#paArrCl)" />
        );
      })}
      {/* Resultant */}
      <line x1={stemX + pxBw + baseP + 50} y1={yPaPx} x2={stemX + pxBw + 4} y2={yPaPx} stroke="#b71c1c" strokeWidth={3} markerEnd="url(#paArrCl)" />
      <text x={stemX + pxBw + baseP + 55} y={yPaPx - 5} fontSize={10} fontWeight="bold" fill="#b71c1c">
        P_a = {fv(Pa, 1)} kN/m  @  H/3
      </text>
      {/* H dim */}
      <line x1={stemX - 14} y1={baseY - pxH} x2={stemX - 14} y2={baseY} stroke="#37474f" strokeWidth={1} />
      <text x={stemX - 18} y={baseY - pxH / 2} textAnchor="end" fontSize={10} fill="#37474f">
        H = {fv(i.abt_H, 2)} m
      </text>
    </svg>
  );
}

function SlabReinfPlanDrawing({ i, d }: { i: Inputs; d: Derived }) {
  const w = 720;
  const margin = 50;
  const scale = Math.min(540 / Math.max(i.spanL, 0.1), 200 / Math.max(i.totalW, 0.1), 32);
  const pxL = i.spanL * scale;
  const pxW = i.totalW * scale;
  const slabX = (w - pxL) / 2;
  const slabY = 60;
  const h = slabY + pxW + 80;
  const mainSp = Math.max(8, scale * 0.150);
  const distSp = Math.max(10, scale * 0.200);
  const nMain = Math.max(2, Math.floor(pxW / mainSp));
  const nDist = Math.max(2, Math.floor(pxL / distSp));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <rect width={w} height={h} fill="#fff" />
      <text x={w / 2} y={20} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1F496B">
        Deck Slab Reinforcement Plan (L = {i.spanL} m × W = {fv(i.totalW, 2)} m)
      </text>
      <rect x={slabX} y={slabY} width={pxL} height={pxW} fill="#e3f2fd" stroke="#1565c0" strokeWidth={2} />
      {Array.from({ length: nMain }).map((_, m) => {
        const yy = slabY + (m + 0.5) * (pxW / nMain);
        return <line key={`m${m}`} x1={slabX + 6} y1={yy} x2={slabX + pxL - 6} y2={yy} stroke="#d32f2f" strokeWidth={0.6} />;
      })}
      {Array.from({ length: nDist }).map((_, k) => {
        const xx = slabX + (k + 0.5) * (pxL / nDist);
        return <line key={`d${k}`} x1={xx} y1={slabY + 6} x2={xx} y2={slabY + pxW - 6} stroke="#1976d2" strokeWidth={0.6} />;
      })}
      <text x={slabX + pxL / 2} y={slabY + pxW + 18} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#d32f2f">
        Main steel: 20φ @ {d.sp_main ?? 150} mm c/c — bottom face
      </text>
      <text x={slabX + pxL / 2} y={slabY + pxW + 32} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#1976d2">
        Distribution steel: 12φ @ 200 mm c/c — both faces
      </text>
      {/* Span dimension */}
      <line x1={slabX} y1={slabY - 14} x2={slabX + pxL} y2={slabY - 14} stroke="#333" strokeWidth={1} />
      <text x={slabX + pxL / 2} y={slabY - 18} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#333">
        L = {i.spanL} m
      </text>
      {/* Bearings */}
      {[0, 1].map((s) => (
        <rect key={s} x={(s === 0 ? slabX : slabX + pxL) - 6} y={slabY + pxW + 4} width={12} height={8} fill="#37474f" />
      ))}
    </svg>
  );
}

function PierDrawing({ i, d }: { i: Inputs; d: Derived }) {
  const scale = 40;
  const w = i.pierW * scale;
  const h = i.pierH * scale;
  const capW = i.capW * scale;
  const capD = i.capD * scale;

  return (
    <svg width={300} height={400} viewBox="0 0 300 400">
      {/* Pier Cap */}
      <rect
        x={150 - capW / 2}
        y={50}
        width={capW}
        height={capD}
        fill="#e1f5fe"
        stroke="#01579b"
        strokeWidth={2}
      />
      <text x={150} y={45} textAnchor="middle" fontSize={10} fill="#01579b">
        Pier Cap ({i.capW}m)
      </text>

      {/* Pier Body */}
      <rect
        x={150 - w / 2}
        y={50 + capD}
        width={w}
        height={h}
        fill="#f1f8e9"
        stroke="#2e7d32"
        strokeWidth={2}
      />

      {/* Main Bars (Schematic) */}
      <line
        x1={150 - w / 2 + 5}
        y1={50 + capD}
        x2={150 - w / 2 + 5}
        y2={50 + capD + h}
        stroke="#d32f2f"
        strokeWidth={1}
      />
      <line
        x1={150 + w / 2 - 5}
        y1={50 + capD}
        x2={150 + w / 2 - 5}
        y2={50 + capD + h}
        stroke="#d32f2f"
        strokeWidth={1}
      />
      <text
        x={150 - w / 2 - 10}
        y={150}
        textAnchor="end"
        fontSize={8}
        fill="#d32f2f"
      >
        P-V1 (25Ï†)
      </text>

      {/* Footing */}
      <rect
        x={150 - (i.ftgPW * scale) / 2}
        y={50 + capD + h}
        width={i.ftgPW * scale}
        height={i.ftgPT * scale}
        fill="#fff3e0"
        stroke="#ef6c00"
        strokeWidth={2}
      />
      <text
        x={150}
        y={50 + capD + h + 25}
        textAnchor="middle"
        fontSize={10}
        fill="#ef6c00"
      >
        Footing ({fv(i.ftgPW, 1)}m x {fv(i.ftgPT, 1)}m)
      </text>
    </svg>
  );
}

function AbutmentDrawing({ i, d }: { i: Inputs; d: Derived }) {
  const scale = 30;
  const h = i.abt_H * scale;
  const tw = i.abt_tstem * scale;
  const bw = i.abt_Bbase * scale;

  return (
    <svg width={300} height={400} viewBox="0 0 300 400">
      {/* Ground Line */}
      <line
        x1={20}
        y1={300}
        x2={280}
        y2={300}
        stroke="#8d6e63"
        strokeWidth={1}
        strokeDasharray="5,3"
      />

      {/* Abutment Stem */}
      <path
        d={`M 150 ${300 - h} L 150 ${300} L ${150 + tw} ${300} L ${150 + tw} ${300 - h} Z`}
        fill="#f3e5f5"
        stroke="#7b1fa2"
        strokeWidth={2}
      />

      {/* Footing */}
      <rect
        x={150 - (bw - tw) / 2}
        y={300}
        width={bw}
        height={i.abt_tftg * scale}
        fill="#eeeeee"
        stroke="#424242"
        strokeWidth={2}
      />

      {/* Dirt Wall */}
      <rect
        x={150}
        y={300 - h - i.slab_t / 10}
        width={i.dirtWallT * scale}
        height={i.slab_t / 10}
        fill="#fce4ec"
        stroke="#c2185b"
        strokeWidth={1}
      />

      {/* Main Steel (Earth Face) */}
      <line
        x1={150 + tw - 5}
        y1={300 - h}
        x2={150 + tw - 5}
        y2={300 + 10}
        stroke="#d32f2f"
        strokeWidth={1.5}
      />
      <text x={150 + tw + 10} y={300 - h / 2} fontSize={8} fill="#d32f2f">
        A-V1 (20Ï†)
      </text>
    </svg>
  );
}

function DeckSlabDrawing({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <svg width={600} height={200} viewBox="0 0 600 200">
      <rect
        x={50}
        y={50}
        width={500}
        height={100}
        fill="#e0f2f1"
        stroke="#004d40"
        strokeWidth={2}
      />
      <text x={300} y={40} textAnchor="middle" fontSize={12} fill="#004d40">
        DECK SLAB REINFORCEMENT (Span = {i.spanL}m)
      </text>

      {/* Longitudinal Main Steel */}
      {[...Array(10)].map((_, j) => (
        <line
          key={j}
          x1={50}
          y1={60 + j * 8}
          x2={550}
          y2={60 + j * 8}
          stroke="#d32f2f"
          strokeWidth={0.5}
        />
      ))}
      <text x={300} y={165} textAnchor="middle" fontSize={9} fill="#d32f2f">
        Main Steel: 20Ï† @ {d.sp_main}mm c/c
      </text>

      {/* Distribution Steel */}
      {[...Array(20)].map((_, j) => (
        <line
          key={j}
          x1={60 + j * 24}
          y1={50}
          x2={60 + j * 24}
          y2={150}
          stroke="#1976d2"
          strokeWidth={0.5}
        />
      ))}
      <text x={300} y={180} textAnchor="middle" fontSize={9} fill="#1976d2">
        Distribution Steel: 12Ï† @ 200mm c/c
      </text>
    </svg>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        lineHeight: 1.5,
        color: "#444",
        fontStyle: "italic",
        marginTop: 10,
      }}
    >
      {children}
    </div>
  );
}



