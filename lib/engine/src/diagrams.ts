/**
 * SVG cross-section renderer + chart contracts — Week 9
 */

export interface BarChartData {
  title: string; unit: string;
  bars: Array<{ label: string; value: number; limit?: number; status: string }>;
}

export function buildUtilisationChart(r: {
  bendingUtilisation:{value:number;status:string};
  deflectionCheck:{value:number;limit?:number;status:string};
  shearCheck:{value:number;limit?:number;status:string};
  governingUtilisation:{value:number;status:string};
}): BarChartData {
  return {
    title: "Design Check Utilisations", unit: "ratio (≤1.0 = PASS)",
    bars: [
      { label: "Bending",    value: r.bendingUtilisation.value,                                       limit: 1.0, status: r.bendingUtilisation.status },
      { label: "Deflection", value: r.deflectionCheck.value / (r.deflectionCheck.limit ?? 1),         limit: 1.0, status: r.deflectionCheck.status },
      { label: "Shear",      value: r.shearCheck.value / (r.shearCheck.limit ?? 2.5),                 limit: 1.0, status: r.shearCheck.status },
      { label: "Governing",  value: r.governingUtilisation.value,                                     limit: 1.0, status: r.governingUtilisation.status },
    ],
  };
}

export interface CrossSectionParams {
  deckWidth: number; deckThickness: number; girderCount: number; girderSpacing: number;
}

export function renderCrossSection(p: CrossSectionParams): string {
  const W=800, H=380, margin=60;
  const scale = (W-2*margin)/(p.deckWidth+2);
  const dW=p.deckWidth*scale, dH=p.deckThickness*scale*10;
  const dX=margin+scale, dY=H/2-dH/2;
  const gW=0.3*scale, gH=dH*2.5, gY=dY+dH;
  const gXs=Array.from({length:p.girderCount},(_,i)=>dX+i*p.girderSpacing*scale-gW/2);
  const lines=[
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial,sans-serif" font-size="11">`,
    `<rect width="${W}" height="${H}" fill="#f8f9fa"/>`,
    `<text x="${W/2}" y="20" text-anchor="middle" font-weight="bold" font-size="13">Typical Cross-Section — DRAFT</text>`,
    `<rect x="${dX}" y="${dY}" width="${dW}" height="${dH}" fill="#cce5ff" stroke="#333" stroke-width="1.5"/>`,
    `<text x="${dX+dW/2}" y="${dY-6}" text-anchor="middle" fill="#333">Deck t=${p.deckThickness}m</text>`,
    `<text x="${dX+dW/2}" y="${dY+dH+gH+42}" text-anchor="middle" fill="#555">W=${p.deckWidth}m</text>`,
    ...gXs.flatMap((gx,i)=>[
      `<rect x="${gx}" y="${gY}" width="${gW}" height="${gH}" fill="#99c2a2" stroke="#333" stroke-width="1"/>`,
      `<text x="${gx+gW/2}" y="${gY+gH+14}" text-anchor="middle" fill="#333" font-size="10">G${i+1}</text>`,
    ]),
    `<text x="${W-margin}" y="${H-8}" text-anchor="end" fill="#aaa" font-size="9">Bridge Report Studio — DRAFT</text>`,
    `</svg>`,
  ];
  return lines.join("\n");
}
