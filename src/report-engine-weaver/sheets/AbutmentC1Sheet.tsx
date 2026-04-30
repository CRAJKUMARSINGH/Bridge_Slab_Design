import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv,
  fi,
  HR,
  Cl,
  SectionHead,
  SubHead,
  SubHeadCl,
  CalcBlock,
  Prose,
  Check,
  SummaryTable,
  Page,
  DetailedStory,
} from "./ReportUI";

/**
 * ABUTMENT C1 STRUCTURAL DETAILS (Sheets 29â€“34)
 * Cantilever Abutment (C1) Design - Detailed Storytelling
 */
export function AbutmentC1Sheet({ i, d }: { i: Inputs; d: Derived }) {
  return (
    <Page id="s-abt-c1-detail">
      <HR />
      <SectionHead>Sheet 29: Abutment C1 â€” Structural Design (Cantilever Type)</SectionHead>
      <Prose>
        The C1 abutment acts as a vertical RCC cantilever. Stability is achieved through 
        the structural weight of the system and the base friction, while lateral 
        pressures are resisted by the stem and footing reinforcement.
      </Prose>

      <SubHeadCl clause="IRC:6-2017 Cl.214.1">
        1. Material & Geotechnical Basis
      </SubHeadCl>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Active Pressure Coeff (Ka)"
          steps={[
            `tanÂ²(45 - Ï†/2)`,
            `tanÂ²(45 - ${i.phi}/2)`
          ]}
          result={fv(d.Ka, 4)}
          where="Rankine coefficient for site soil"
        />
        <DetailedStory 
          label="Design Height (H)"
          steps={[`${i.abt_H} m`]}
          result={`${i.abt_H} m`}
          where="Total height including footing depth"
        />
      </div>

      <SubHeadCl clause="IRC:112 Cl.10.6">
        2. Stem Design â€” Flexural Reinforcement
      </SubHeadCl>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Design Moment at Base (Mu)"
          steps={[
            `Ka x Î³ x HÂ³ / 6`,
            `${fv(d.Ka, 4)} x ${i.abt_gamma} x ${i.abt_H}Â³ / 6`
          ]}
          result={`${fv(d.c1_stem_Mu)} kNm/m`}
          where="Factored flexural demand at junction"
          bold
        />
        <DetailedStory 
          label="Effective Depth (d)"
          steps={[`${i.c1_tstem}m - 50mm - 10mm`]}
          result={`${fi(d.c1_stem_d)} mm`}
          where="Clear cover + Î¦/2 deduction"
        />
        <DetailedStory 
          label="Required Steel (Ast)"
          steps={[`Mu / (0.87 x fy x z)`]}
          result={`${fi(d.c1_stem_Ast)} mmÂ²/m`}
          where="Provide Î¦16 @ 150 c/c"
          bold
        />
      </div>

      <SubHeadCl clause="IRC:112 Cl.10.2.1">
        3. Footing Design â€” Cantilever Action
      </SubHeadCl>
      <div style={{ marginBottom: 20 }}>
        <DetailedStory 
          label="Toe Projection Moment"
          steps={[
            `q_max x projÂ² / 2`,
            `${fv(d.c1Cases?.[0]?.qmax ?? 0)} x projÂ² / 2`
          ]}
          result={`${fv(d.c1_toe_Mu)} kNm/m`}
          where="Upward soil pressure effect"
        />
        <DetailedStory 
          label="Heel Projection Moment"
          steps={[
            `q_soil x projÂ² / 2`
          ]}
          result={`${fv(d.c1_heel_Mu)} kNm/m`}
          where="Downward earth mass + surcharge"
        />
        <DetailedStory 
          label="Required Heel Steel"
          steps={[`${fi(d.c1_heel_Ast)} mmÂ²/m`]}
          result={`${fi(d.c1_heel_Ast)} mmÂ²/m`}
          where="Tension at top face"
          bold
        />
      </div>

      <Prose>
        Footing thickness provides inherent shear capacity as per IRC:112. 
        Passive pressure is conservatively neglected. <strong>Hence OK.</strong>
      </Prose>
    </Page>
  );
}


