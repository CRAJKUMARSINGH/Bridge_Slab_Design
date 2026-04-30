import { Inputs } from '../types/bridgeTypes';

export interface HydraulicsResults {
  totalL: number; R: number; V: number; Q: number; L_lacey: number;
  q_unit: number; dsm: number; A_obs: number; a_net: number; afflux: number;
  Qf: number; d2: number; max_dsm: number; foundingRL: number;
  DWL: number; V_obst: number; Fr: number;
}

import { computeHydraulics, HydraulicInputs } from '../lib/hydraulicCalc';

export function calculateHydraulics(i: Inputs): HydraulicsResults {
  const hInputs: HydraulicInputs = {
    workName: i.name,
    crossSectionPoints: i.xsec.map(pt => ({
      chainage: parseFloat(pt.ch.replace('0+', '')),
      bedLevel: pt.gl
    })),
    crossSectionalArea: i.A,
    perimeter: i.P_,
    slope: i.S_denom,
    rugosity: i.n,
    observedVelocity: i.v_observed,
    dischargeMethod: 'max',
    numSpans: i.spans,
    spanLength: i.spanL,
    numPiers: Math.max(i.spans - 1, 0),
    pierWidth: i.pierW,
    numAbutments: 2,
    abutTopWidth: i.abt_tstem,
    abutBottomWidth: i.abt_tstem * 1.5, // approximation for trapezoidal abutment
    hfl: i.HFL,
    avgRiverBedLevel: i.bedRL,
    lwl: i.bedRL + 1.0,
    lbl: i.bedRL,
    sofitLevel: i.HFL + 0.1, // default if not specified
    topOfDeck: i.HFL + 1.0,
    deckThickness: i.slab_t / 1000 + i.slab_wc / 1000,
    siltFactor: i.Ksf,
    F1: i.f1Factor ?? 1.3,
    F2: i.f2Factor ?? 1.33,
  };

  const res = computeHydraulics(hInputs);

  return {
    totalL: res.effectiveWaterway,
    R: res.dischargeManning / (res.velocityManning * res.inputs.rugosity), // approximate R from V
    V: res.velocityManning,
    Q: res.discharge,
    L_lacey: res.regimeWidth,
    q_unit: res.dischargePerMetre,
    dsm: res.meanScourDepth,
    Qf: res.discharge * (i.f1Factor ?? 1.3),
    d2: res.meanScourDepth,
    max_dsm: res.maxScourDepth,
    foundingRL: res.foundationLevel ?? 0,
    A_obs: res.totalObstruction,
    a_net: res.actualFlowArea,
    afflux: res.afflux,
    DWL: res.affluxFloodLevel,
    V_obst: res.obstructedVelocity,
    Fr: 0.3, // placeholder or calculated
  };
}
