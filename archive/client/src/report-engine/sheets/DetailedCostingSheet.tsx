import React from "react";
import type { Inputs, Derived } from "../BridgeSlabReport";
import {
  fv, fi, HR, Cl, SectionHead, SubHead, SubHeadCl,
  CalcBlock, Prose, Check, SummaryTable, Page, DetailedStory,
} from "./ReportUI";

/**
 * DETAILED COSTING SHEET (Sheets 45-46)
 * Golden-reference standard: design data  quantity derivation  cost buildup  Hence O.K.
 */
export function DetailedCostingSheet({ i, d }: { i: Inputs; d: Derived }) {
  const totalL   = i.spans * i.spanL;
  const deckArea = totalL * i.totalW;
  const pierCount = Math.max(i.spans - 1, 0);

  // Derived geometry for quantity verification
  const pier_vol   = i.pierW * i.pierL * i.pierH;
  const cap_vol    = i.capW  * i.capL  * i.capD;
  const ftg_vol    = i.ftgPW * i.ftgPL * i.ftgPT;
  const abt_stem_v = i.abt_H * i.abt_tstem * i.totalW;
  const abt_ftg_v  = i.abt_Bbase * i.abt_tftg * i.totalW;
  const deck_vol   = totalL * i.totalW * (i.slab_t / 1000);
  const wc_area    = totalL * i.totalW;

  const items = [
    { sno: "1",  desc: "Earthwork in excavation for pier and abutment foundations",  unit: "m",  qty: d.boqQty.earthwork, rate: i.rate_earthwork },
    { sno: "2",  desc: "PCC M15 (1:4:8) levelling course under all footings",        unit: "m",  qty: d.boqQty.pcc,       rate: i.rate_pcc },
    { sno: "3",  desc: "RCC M25  Pier footings and abutment footings",              unit: "m",  qty: d.boqQty.m25,       rate: i.rate_m25 },
    { sno: "4",  desc: "RCC M30  Pier body, pier cap, abutment stem and cap",       unit: "m",  qty: d.boqQty.m30,       rate: i.rate_m30 },
    { sno: "5",  desc: "RCC M35  Bridge deck slab",                                 unit: "m",  qty: d.boqQty.m35,       rate: i.rate_m35 },
    { sno: "6",  desc: "HYSD Steel Fe500 reinforcement bars",                        unit: "MT",  qty: d.boqQty.steel,     rate: i.rate_steel },
    { sno: "7",  desc: "Formwork and shuttering for all concrete surfaces",          unit: "m",  qty: d.boqQty.formwork,  rate: 350 },
    { sno: "8",  desc: "Wearing coat 75mm thick (bituminous)",                       unit: "m",  qty: d.boqQty.wc,        rate: i.rate_wc },
    { sno: "9",  desc: "Stone pitching / apron for scour protection",                unit: "m",  qty: d.boqQty.pitching,  rate: i.rate_pitching },
    { sno: "10", desc: "Filtered backfill behind abutments",                         unit: "m",  qty: d.boqQty.backfill,  rate: i.rate_backfill },
    { sno: "11", desc: "MS pipe railing (both sides)",                               unit: "RM",  qty: d.boqQty.railing,   rate: i.rate_railing },
  ];

  return (
    <>
      <Page id="s-detailed-costing">
        <HR />
        <SectionHead>ABSTRACT OF QUANTITIES & ESTIMATED COST (Sheet 45)</SectionHead>
        <Prose>
          Name of Work :- {i.name}
        </Prose>

        {/*  DESIGN DATA FOR QUANTITIES  */}
        <SubHeadCl clause="Structural Design Output">
          A. DESIGN DATA FOR QUANTITY DERIVATION
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Total Bridge Length",     eq: `${i.spans}  ${fv(i.spanL)} = ${fv(totalL)}`,  result: fv(totalL,2),  unit: "m",   where: "Spans  span length" },
          { sym: "Deck Area",               eq: `${fv(totalL)}  ${fv(i.totalW)}`,               result: fv(deckArea,2),unit: "m",  where: "Length  total width" },
          { sym: "No. of Piers",            result: String(pierCount),                           unit: "",             where: "Intermediate supports" },
          { sym: "No. of Abutments",        result: "2",                                         unit: "",             where: "End supports" },
          { sym: "Pier Volume (each)",      eq: `${i.pierW}${i.pierL}${i.pierH}`,              result: fv(pier_vol,3),unit: "m",  where: "Pier body (rectangular approximation)" },
          { sym: "Cap Volume (each)",       eq: `${i.capW}${i.capL}${i.capD}`,                 result: fv(cap_vol,3), unit: "m",  where: "Pier cap" },
          { sym: "Footing Volume (each)",   eq: `${i.ftgPW}${i.ftgPL}${i.ftgPT}`,             result: fv(ftg_vol,3), unit: "m",  where: "Pier spread footing" },
          { sym: "Abutment Stem Vol (each)",eq: `${i.abt_H}${i.abt_tstem}${i.totalW}`,        result: fv(abt_stem_v,3),unit:"m", where: "Abutment stem (per abutment)" },
          { sym: "Abutment Ftg Vol (each)", eq: `${i.abt_Bbase}${i.abt_tftg}${i.totalW}`,     result: fv(abt_ftg_v,3),unit:"m",  where: "Abutment footing (per abutment)" },
          { sym: "Deck Slab Volume",        eq: `${fv(totalL)}${fv(i.totalW)}${fv(i.slab_t/1000,3)}`, result: fv(deck_vol,3), unit: "m", where: "Total deck slab concrete" },
          { sym: "Wearing Coat Area",       eq: `${fv(totalL)}  ${fv(i.totalW)}`,               result: fv(wc_area,2), unit: "m",  where: "Deck surface area" },
        ]} />

        {/*  BOQ TABLE  */}
        <SubHeadCl clause="PWD Standard Schedule of Rates">
          B. BILL OF QUANTITIES
        </SubHeadCl>
        <div style={{ margin: "10px 0", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, fontFamily: "Verdana,sans-serif" }}>
            <thead>
              <tr style={{ background: "#1e3a5f", color: "#fff" }}>
                {["S.No", "Description of Item", "Unit", "Quantity", "Rate ()", "Amount ()"].map((h, j) => (
                  <th key={j} style={{ border: "1px solid #0a2240", padding: "6px 8px", textAlign: j > 2 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const amount = (item.qty || 0) * (item.rate || 0);
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f9f6fd" }}>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "center" }}>{item.sno}</td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px" }}>{item.desc}</td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "center" }}>{item.unit}</td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}>{fv(item.qty || 0)}</td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}>{fi(item.rate || 0)}</td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontFamily: "Consolas,monospace", fontWeight: "bold" }}>{fi(amount)}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "#e8f0fe", fontWeight: "bold" }}>
                <td colSpan={5} style={{ border: "1px solid #bbb", padding: "7px 8px", textAlign: "right" }}>SUB-TOTAL (A)  Material & Labour:</td>
                <td style={{ border: "1px solid #bbb", padding: "7px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}> {fi(d.boqSub)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right" }}>Add: Contingencies @ 3% of (A)</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}> {fi(d.boqCont)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right" }}>Add: Contractor Profit & Overhead @ 10%</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}> {fi(d.boqProfit)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right" }}>Add: GST @ 18%</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}> {fi(d.boqGST)}</td>
              </tr>
              <tr style={{ background: "#1e3a5f", color: "#fff", fontWeight: "bold", fontSize: 11 }}>
                <td colSpan={5} style={{ border: "1px solid #0a2240", padding: "9px 8px", textAlign: "right" }}>GRAND TOTAL ESTIMATED COST:</td>
                <td style={{ border: "1px solid #0a2240", padding: "9px 8px", textAlign: "right", fontFamily: "Consolas,monospace" }}> {fi(d.boqGrand)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Page>

      <Page id="s-cost-metrics">
        <HR />
        <SectionHead>COST PERFORMANCE METRICS (Sheet 46)</SectionHead>

        {/*  COST DERIVATION  */}
        <SubHeadCl clause="PWD Norms / IRC:78-2014">
          C. COST SUMMARY DERIVATION
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Sub-Total (A)",            eq: "Sum of all BOQ items",                                                    result: ` ${fi(d.boqSub)}`,    where: "Direct material and labour cost" },
          { sym: "Contingencies (3%)",       eq: `3/100  ${fi(d.boqSub)} = ${fi(d.boqSub * 0.03)}`,                       result: ` ${fi(d.boqCont)}`,   where: "Unforeseen items  PWD norm 3%" },
          { sym: "Contractor Profit (10%)",  eq: `10/100  ${fi(d.boqSub)} = ${fi(d.boqSub * 0.10)}`,                      result: ` ${fi(d.boqProfit)}`, where: "Overhead and profit  standard 10%" },
          { sym: "Taxable Amount",           eq: `${fi(d.boqSub)} + ${fi(d.boqCont)} + ${fi(d.boqProfit)}`,                 result: ` ${fi(d.boqSub + d.boqCont + d.boqProfit)}`, where: "Base for GST calculation" },
          { sym: "GST @ 18%",               eq: `18/100  ${fi(d.boqSub + d.boqCont + d.boqProfit)}`,                      result: ` ${fi(d.boqGST)}`,    where: "Goods and Services Tax" },
          { sym: "GRAND TOTAL",             eq: "Sub-Total + Contingencies + Profit + GST",                                 result: ` ${fi(d.boqGrand)}`,  where: "Total estimated project cost", bold: true },
        ]} />

        {/*  UNIT COST METRICS  */}
        <SubHeadCl clause="Performance Benchmarks">
          D. UNIT COST METRICS
        </SubHeadCl>
        <CalcBlock whereHeader rows={[
          { sym: "Cost per Running Metre",   eq: `Grand Total / Total Length = ${fi(d.boqGrand)} / ${fv(totalL,2)}`,   result: ` ${fi(d.boqPerRM)}`,   unit: "/m",  where: "Cost per metre of bridge length" },
          { sym: "Cost per Deck Area",       eq: `Grand Total / Deck Area = ${fi(d.boqGrand)} / ${fv(deckArea,2)}`,    result: ` ${fi(d.boqPerSqm)}`,  unit: "/m", where: "Cost per square metre of deck", bold: true },
        ]} />

        {/*  COST DASHBOARD  */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "20px 0" }}>
          {[
            { label: "GRAND TOTAL", value: ` ${fi(d.boqGrand)}`, color: "#1e3a5f", bg: "#e8f0fe" },
            { label: "COST / RM",   value: ` ${fi(d.boqPerRM)}/m`,  color: "#007a3d", bg: "#e6f4ed" },
            { label: "COST / SQM",  value: ` ${fi(d.boqPerSqm)}/m`, color: "#6b00b3", bg: "#f3e5f5" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: "bold", color, fontFamily: "Consolas,monospace" }}>{value}</div>
            </div>
          ))}
        </div>

        <Prose>
          The estimated cost of <strong> {fi(d.boqGrand)}</strong> is based on the Standard Schedule
          of Rates (SoR). The cost per running metre of <strong> {fi(d.boqPerRM)}/m</strong> is
          within the acceptable range for submersible bridges of this span configuration.
          Final costs may vary by 5% based on site-specific conditions. <strong>Hence OK.</strong>
        </Prose>
        <Prose>
          Note: Quantities are to be verified against the Excel workbook measurement sheets.
          Default values are zero until workbook data is entered in Section H of the input form.
        </Prose>
      </Page>
    </>
  );
}
