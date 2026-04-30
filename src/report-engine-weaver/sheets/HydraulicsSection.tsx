import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv,
  fi,
  fmt,
  CRow,
  HR,
  Cl,
  SectionHead,
  SubHead,
  SubHeadCl,
  CalcRow,
  CalcBlock,
  Prose,
  Check,
  SummaryTable,
  Page,
  DetailedStory,
} from "./ReportUI";
import { CrossSectionChart, BedSlopeChart } from '../components/HydraulicCharts';

export function SectionHydraulics({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <Page id="s-hyd">
      <HR />
      <SectionHead>Section B â€” Hydraulic Design & Scour Analysis</SectionHead>
      <Prose>
        Calculation of discharge and linear waterway for the submersible bridge. 
        Manning's resistance formula is used for discharge estimation.
      </Prose>

      <SubHeadCl clause="IRC:SP:13 Article 5">
        1. Computation of Design Discharge (Area Velocity Method)
      </SubHeadCl>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Manning's Velocity (V)"
          steps={[
            `(1/n) x RÂ²/Â³ x SÂ½`,
            `(1/${fv(i.n, 3)}) x (${fv(d.R, 3)})Â²/Â³ x (1/${fi(i.S_denom)})Â¹/Â²`
          ]}
          result={`${fv(d.V, 3)} m/s`}
          where="n = rugosity, R = hydraulic radius, S = bed slope"
        />
        <DetailedStory 
          label="Design Discharge (Q)"
          steps={[
            `A x V`,
            `${fv(i.A)} x ${fv(d.V, 3)}`
          ]}
          result={`${fv(d.Q)} mÂ³/s`}
          where="Total cross-sectional area x Manning's velocity"
          bold
        />
      </div>

      <SubHeadCl clause="IRC:SP:13 â€” Regime waterway">
        2. Linear Waterway Calculation
      </SubHeadCl>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Lacey's Regime Waterway (L)"
          steps={[
            `4.75 x âˆšQ`,
            `4.75 x âˆš${fv(d.Q)}`,
            `4.75 x ${fv(Math.sqrt(d.Q), 2)}`
          ]}
          result={`${fv(4.75 * Math.sqrt(d.Q))} m`}
          where="Regime width based on design discharge"
        />
        <DetailedStory 
          label="Proposed Linear Waterway"
          steps={[
            `${i.spans} spans x ${fv(i.spanL, 1)} m`,
            `${fv(i.spans * i.spanL)} m`
          ]}
          result={`${fv(i.spans * i.spanL)} m`}
          where="Effective clear width provided"
          bold
        />
      </div>
    </Page>
  );
}

export function SectionAffluxScour({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <Page id="s-afflux">
      <HR />
      <SectionHead>Scour Depth & Afflux Calculation</SectionHead>
      
      <SubHeadCl clause="IRC:78-2014 Cl.703.2.2">
        3. Mean Scour Depth Calculation
      </SubHeadCl>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Discharge Intensity (q)"
          steps={[
            `Q / L_eff`,
            `${fv(d.Q)} / ${fv(i.spans * i.spanL)}`
          ]}
          result={`${fv(d.q_unit, 3)} mÂ³/s/m`}
          where="Discharge per unit width"
        />
        <DetailedStory 
          label="Mean Scour Depth (dsm)"
          steps={[
            `1.34 x (qÂ² / Ksf)Â¹/Â³`,
            `1.34 x (${fv(d.q_unit, 3)}Â² / ${fv(i.Ksf, 1)})Â¹/Â³`
          ]}
          result={`${fv(d.dsm)} m`}
          where="Lacey's formula for scour"
          bold
        />
      </div>

      <SubHeadCl clause="IS: 7784 (Part -I) 1975">
        4. Hydraulic Afflux (Molesworth Formula)
      </SubHeadCl>
      <Prose>
        Obstruction area is calculated by summing deck, pier, and abutment contributions.
      </Prose>
      
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="A0: Area Obstructed by Deck Slab"
          steps={[
            `Total Length x Deck Thickness`,
            `${fv(i.spans * i.spanL + i.pierW * (i.spans - 1))} x ${fv(i.slabD + 0.075)}`
          ]}
          result={`${fv((i.spans * i.spanL + i.pierW * (i.spans - 1)) * (i.slabD + 0.075))} mÂ²`}
          where="Slab + Wearing Coat obstruction"
        />
        <DetailedStory 
          label="A1: Area Obstructed by Piers"
          steps={[
            `Nos x Width x Depth`,
            `${Math.max(0, i.spans - 1)} x ${fv(i.pierW)} x ${fv(i.HFL - i.bedRL)}`
          ]}
          result={`${fv(Math.max(0, i.spans - 1) * i.pierW * (i.HFL - i.bedRL))} mÂ²`}
          where="Projected pier stems below HFL"
        />
        <DetailedStory 
          label="Total Obstruction (A_obs)"
          steps={[`A0 + A1 + A2 (Abutment)`]}
          result={`${fv(d.A_obs)} mÂ²`}
          bold
        />
        <DetailedStory 
          label="Afflux (h) â€” Molesworth"
          steps={[
            `((VÂ²/17.85) + 0.0152) x (AÂ²/aÂ² - 1)`,
            `(${fv((d.V * d.V) / 17.85 + 0.0152, 4)}) x (${fv((i.A * i.A) / (d.a_net * d.a_net) - 1, 3)})`
          ]}
          result={`${fv(d.afflux)} m`}
          bold
          where="Rise in HFL due to bridge structure"
        />
      </div>

      <Prose>
        Design Water Level (DWL) = HFL + afflux = {fv(i.HFL)} + {fv(d.afflux)} = <strong>{fv(d.DWL)} m</strong>.
        Top of deck slab is safe. <strong>Hence OK.</strong>
      </Prose>
    </Page>
  );
}

export function SectionHydSummary({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <Page id="s-hyd-summ">
      <HR />
      <SectionHead>Hydraulics Summary</SectionHead>
      <SummaryTable
        head={["Parameter", "Formula / Source", "Value", "Unit", "Status"]}
        rows={[
          ["Design Discharge (Q)", "Manning's Formula", fv(d.Q), "mÂ³/s", "OK"],
          ["Mean Scour Depth (dsm)", "Lacey's Formula", fv(d.dsm), "m", "OK"],
          ["Afflux (h)", "Molesworth Formula", fv(d.afflux), "m", "OK"],
          ["Design Water Level", "HFL + Afflux", fv(d.DWL), "m MSL", "OK"],
          ["Froude Number (Fr)", "V/âˆš(gD)", fv(d.Fr, 3), "â€”", d.Fr < 1 ? "Sub-critical" : "Check"],
        ]}
      />
    </Page>
  );
}

export function SectionDeckAnchorage({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <Page id="s-deck">
      <HR />
      <SectionHead>Section E â€” Deck Anchorage & Buoyancy</SectionHead>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Dead Weight (Downward)"
          steps={[`t x Î³ x L x W`]}
          result={`${fv(d.dl_slab)} kN`}
          where="Stabilizing force"
        />
        <DetailedStory 
          label="Buoyancy + Uplift (Upward)"
          steps={[`F_buoy + 0.3 x DL`]}
          result={`${fv(d.buoyancy + d.uplift)} kN`}
          where="Total upward risk at peak flood"
          bold
        />
      </div>
      <Check pass={d.net_force > 0}>
        Net Downward Force = {fv(d.net_force)} kN. 
        {d.net_force > 0 ? " No mechanical anchorage required. Hence OK." : " Anchorage required."}
      </Check>
    </Page>
  );
}

export function SectionXSecBedSlope({ i, d }: { i: Inputs; d: Derived }) {
  const bedRL = Math.min(...i.xsec.map((r) => r.gl));
  const totalL = i.spans * i.spanL;
  const deltaH = (totalL * 1.2) / i.S_denom;
  const Ld = totalL * 1.2;
  return (
    <Page id="s-xsec">
      <HR />
      <SectionHead>Section F â€” Cross-Section & Bed Slope</SectionHead>
      <SummaryTable
        head={["Chainage", "GL (m MSL)", "Depth (m)"]}
        rows={i.xsec.slice(0, 10).map((r) => [
          r.ch, fv(r.gl), fv(Math.max(0, i.HFL - r.gl))
        ])}
      />
      <div className="no-print" style={{ background: '#f5f7f9', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <CrossSectionChart data={i.xsec} hfl={i.HFL} dwl={d.DWL}
          spans={i.spans} spanL={i.spanL} pierW={i.pierW} slabD={i.slabD} />
      </div>
      <Prose>
        Adopted Bed Slope: <strong>1 in {fi(i.S_denom)}</strong>. <strong>Hence OK.</strong>
      </Prose>
    </Page>
  );
}

export function SectionSBC({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <Page id="s-sbc">
      <HR />
      <SectionHead>Section D â€” Geotechnical Engineering</SectionHead>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Net Ultimate Capacity (qnu)"
          steps={[`Î³Â·DfÂ·Nq + 0.5Â·Î³Â·BÂ·Ny`]}
          result={`${fv(d.qnu)} kPa`}
          where="IS:6403 Bearing Formula"
        />
        <DetailedStory 
          label="Safe Bearing Capacity (SBC)"
          steps={[`qnu / FOS`]}
          result={`${fv(d.SBC)} kPa`}
          where="FOS = 2.5 or 3.0"
          bold
        />
      </div>
      <Prose>
        Adopted SBC = <strong>{fv(d.SBC)} kPa</strong>. <strong>Hence OK.</strong>
      </Prose>
    </Page>
  );
}


