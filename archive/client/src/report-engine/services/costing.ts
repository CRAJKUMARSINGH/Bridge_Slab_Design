import { Inputs } from '../types/bridgeTypes';

export interface CostingResults {
  boqQty: any;
  boqAmt: any;
  boqSub: number;
  boqCont: number;
  boqProfit: number;
  boqGST: number;
  boqGrand: number;
  boqPerRM: number;
  boqPerSqm: number;
}

/**
 * COSTING SERVICE - Automated Material Rates (REF-APP Absorption)
 * No manual rate input required (surgical integration with Abstract templates)
 */
export function calculateCosting(i: Inputs, d: any): CostingResults {
  // 1. REF-APP Automated Rates (Standardized from Abstract)
  const REF_RATES = {
    earthwork: 320, // Avg of 68-364
    pcc: 3863,
    m25: 4800,
    m30: 5200,
    m35: 5600,
    steel: 65000, // per MT
    railing: 2500,
    wc: 1500,
    pitching: 1200,
    backfill: 850
  };

  // 2. Quantities (Existing Logic Preservation)
  const boqQty = { 
    earthwork: i.qty_earthwork, 
    pcc: i.qty_pcc, 
    m25: i.qty_m25, 
    m30: i.qty_m30, 
    m35: i.qty_m35, 
    steel: i.qty_steel, 
    railing: i.qty_railing, 
    wc: i.qty_wc, 
    pitching: i.qty_pitching, 
    backfill: i.qty_backfill 
  };

  // 3. Amount Calculation
  const boqAmt: any = {};
  Object.keys(boqQty).forEach(k => {
    // If user provided a specific rate override, use it, otherwise use REF_RATES
    const rate = (i as any)[`rate_${k}`] || (REF_RATES as any)[k];
    boqAmt[k] = (boqQty as any)[k] * rate;
  });

  const boqSub = Object.values(boqAmt).reduce((s, v) => (s as number) + (v as number), 0) as number;
  
  // 4. Overheads
  const boqCont = Math.round(boqSub * 0.03);
  const boqProfit = Math.round(boqSub * 0.1);
  const boqGST = Math.round((boqSub + boqCont + boqProfit) * 0.18);
  const boqGrand = boqSub + boqCont + boqProfit + boqGST;

  // 5. Unit Metrics
  const totalL = i.spans * i.spanL;
  const boqPerRM = Math.round(boqGrand / Math.max(1, totalL));
  const boqPerSqm = Math.round(boqGrand / Math.max(1, totalL * i.totalW));

  return { boqQty, boqAmt, boqSub, boqCont, boqProfit, boqGST, boqGrand, boqPerRM, boqPerSqm };
}
