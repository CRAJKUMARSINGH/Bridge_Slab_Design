/**
 * Reinforcement Drawing Generators
 * Detailed steel detail drawings with bar bending schedules
 * Wires design calculations to estimation quantities and visual drawings
 */

import type { EnhancedProjectInput, SteelDetails, BOQItem } from '../bridge-excel-generator/types';

// Bar weights in kg/m for standard diameters
const BAR_WEIGHTS: Record<number, number> = {
  8: 0.395, 10: 0.617, 12: 0.888, 16: 1.578, 20: 2.466,
  25: 3.854, 32: 6.313, 40: 9.864
};

interface ReinforcementBar {
  mark: string;
  description: string;
  diameter: number;
  numberOfBars: number;
  lengthPerBar: number;
  totalLength: number;
  unitWeight: number;
  totalWeight: number;
  shape?: string;
}

interface ReinforcementSchedule {
  element: string;
  bars: ReinforcementBar[];
  totalWeight: number;
  concreteVolume: number;
  steelRatio: number;
}

/**
 * Calculate reinforcement from design results
 */
function calculateReinforcementInternal(input: EnhancedProjectInput): {
  pier: ReinforcementSchedule;
  abutmentType1: ReinforcementSchedule;
  abutmentC1: ReinforcementSchedule;
  totalSteel: number;
  boqItems: BOQItem[];
} {
  const pierSchedule = calculatePierReinforcement(input);
  const abtType1Schedule = calculateAbutmentReinforcement(input, 'TYPE1');
  const abtC1Schedule = calculateAbutmentReinforcement(input, 'C1');
  
  const totalSteel = pierSchedule.totalWeight + abtType1Schedule.totalWeight + abtC1Schedule.totalWeight;
  
  // Generate BOQ items for steel
  const boqItems: BOQItem[] = [
    ...generateSteelBOQ(pierSchedule, 'Pier'),
    ...generateSteelBOQ(abtType1Schedule, 'Type1 Abutment'),
    ...generateSteelBOQ(abtC1Schedule, 'C1 Abutment'),
    {
      itemNo: 'S-TOTAL',
      description: 'Total Reinforcement Steel',
      unit: 'MT',
      quantity: totalSteel / 1000,
      rate: 85000,
      amount: (totalSteel / 1000) * 85000
    }
  ];
  
  return {
    pier: pierSchedule,
    abutmentType1: abtType1Schedule,
    abutmentC1: abtC1Schedule,
    totalSteel,
    boqItems
  };
}

function calculatePierReinforcement(input: EnhancedProjectInput): ReinforcementSchedule {
  const pier = input.pier;
  const pW = pier?.geometry.width ?? input.pierWidth;
  const pL = pier?.geometry.length ?? input.pierLength;
  const pD = pier?.geometry.depth ?? input.pierDepth;
  const baseW = pier?.footing.width ?? input.pierBaseWidth;
  const baseL = pier?.footing.length ?? input.pierBaseLength;
  const capW = pier?.pierCap.width ?? (pW + 0.5);
  const capL = pier?.pierCap.length ?? (pL + 0.5);
  
  const concreteVolume = (pW * pL * pD) + (baseW * baseL * 1.0) + (capW * capL * 0.8);
  
  const bars: ReinforcementBar[] = [
    // Main vertical bars in pier body
    {
      mark: 'P-V1',
      description: 'Vertical bars - Pier body',
      diameter: 25,
      numberOfBars: 32,
      lengthPerBar: pD + 0.5, // embedment into footing
      totalLength: 32 * (pD + 0.5),
      unitWeight: BAR_WEIGHTS[25],
      totalWeight: 32 * (pD + 0.5) * BAR_WEIGHTS[25],
      shape: 'Straight'
    },
    // Vertical bars in footing
    {
      mark: 'P-V2',
      description: 'Vertical bars - Footing',
      diameter: 20,
      numberOfBars: 24,
      lengthPerBar: 1.0 + 0.5, // footing thickness + development
      totalLength: 24 * 1.5,
      unitWeight: BAR_WEIGHTS[20],
      totalWeight: 24 * 1.5 * BAR_WEIGHTS[20],
      shape: 'Straight with L-bend at bottom'
    },
    // Horizontal ties in pier
    {
      mark: 'P-H1',
      description: 'Horizontal ties - Pier',
      diameter: 12,
      numberOfBars: Math.ceil(pD / 0.15),
      lengthPerBar: 2 * (pW + pL) + 0.2, // perimeter + hooks
      totalLength: Math.ceil(pD / 0.15) * (2 * (pW + pL) + 0.2),
      unitWeight: BAR_WEIGHTS[12],
      totalWeight: Math.ceil(pD / 0.15) * (2 * (pW + pL) + 0.2) * BAR_WEIGHTS[12],
      shape: 'Rectangular with 135° hooks'
    },
    // Pier cap main bars
    {
      mark: 'P-C1',
      description: 'Main bars - Pier cap',
      diameter: 20,
      numberOfBars: 16,
      lengthPerBar: capL + 0.6, // development length
      totalLength: 16 * (capL + 0.6),
      unitWeight: BAR_WEIGHTS[20],
      totalWeight: 16 * (capL + 0.6) * BAR_WEIGHTS[20],
      shape: 'Straight'
    },
    // Pier cap distribution bars
    {
      mark: 'P-C2',
      description: 'Distribution bars - Pier cap',
      diameter: 16,
      numberOfBars: 12,
      lengthPerBar: capW + 0.6,
      totalLength: 12 * (capW + 0.6),
      unitWeight: BAR_WEIGHTS[16],
      totalWeight: 12 * (capW + 0.6) * BAR_WEIGHTS[16],
      shape: 'Straight'
    },
    // Footing bottom mesh
    {
      mark: 'P-F1',
      description: 'Bottom mesh - Footing (long)',
      diameter: 16,
      numberOfBars: Math.ceil(baseL / 0.15),
      lengthPerBar: baseW,
      totalLength: Math.ceil(baseL / 0.15) * baseW,
      unitWeight: BAR_WEIGHTS[16],
      totalWeight: Math.ceil(baseL / 0.15) * baseW * BAR_WEIGHTS[16],
      shape: 'Straight'
    },
    {
      mark: 'P-F2',
      description: 'Bottom mesh - Footing (short)',
      diameter: 16,
      numberOfBars: Math.ceil(baseW / 0.15),
      lengthPerBar: baseL,
      totalLength: Math.ceil(baseW / 0.15) * baseL,
      unitWeight: BAR_WEIGHTS[16],
      totalWeight: Math.ceil(baseW / 0.15) * baseL * BAR_WEIGHTS[16],
      shape: 'Straight'
    }
  ];
  
  const totalWeight = bars.reduce((sum, b) => sum + b.totalWeight, 0);
  
  return {
    element: 'Pier (Body + Cap + Footing)',
    bars,
    totalWeight,
    concreteVolume,
    steelRatio: (totalWeight / concreteVolume) * 100
  };
}

function calculateAbutmentReinforcement(input: EnhancedProjectInput, type: 'TYPE1' | 'C1'): ReinforcementSchedule {
  const abt = type === 'TYPE1' ? input.abutmentType1 : input.abutmentC1;
  const H = abt?.geometry.height ?? input.abutmentHeight;
  const t = abt?.geometry.width ?? input.abutmentWidth;
  const B = abt?.geometry.baseWidth ?? (t + 1.5);
  const Df = abt?.geometry.depth ?? input.abutmentDepth;
  const dirtWallH = input.dirtWallHeight;
  const returnWallL = input.returnWallLength;
  
  const stemVolume = t * H * 10; // assuming 10m wide abutment
  const footingVolume = B * Df * 10;
  const dirtWallVolume = 0.3 * dirtWallH * 10;
  const concreteVolume = stemVolume + footingVolume + dirtWallVolume;
  
  const bars: ReinforcementBar[] = [
    // Main vertical bars in stem
    {
      mark: `A${type}-V1`,
      description: 'Vertical bars - Abutment stem',
      diameter: 25,
      numberOfBars: 40,
      lengthPerBar: H + Df + 0.5,
      totalLength: 40 * (H + Df + 0.5),
      unitWeight: BAR_WEIGHTS[25],
      totalWeight: 40 * (H + Df + 0.5) * BAR_WEIGHTS[25],
      shape: 'Straight with 90° bend at footing'
    },
    // Horizontal bars in stem
    {
      mark: `A${type}-H1`,
      description: 'Horizontal bars - Stem (earth face)',
      diameter: 16,
      numberOfBars: Math.ceil(H / 0.15),
      lengthPerBar: 10, // abutment width
      totalLength: Math.ceil(H / 0.15) * 10,
      unitWeight: BAR_WEIGHTS[16],
      totalWeight: Math.ceil(H / 0.15) * 10 * BAR_WEIGHTS[16],
      shape: 'Straight'
    },
    {
      mark: `A${type}-H2`,
      description: 'Horizontal bars - Stem (front face)',
      diameter: 12,
      numberOfBars: Math.ceil(H / 0.15),
      lengthPerBar: 10,
      totalLength: Math.ceil(H / 0.15) * 10,
      unitWeight: BAR_WEIGHTS[12],
      totalWeight: Math.ceil(H / 0.15) * 10 * BAR_WEIGHTS[12],
      shape: 'Straight'
    },
    // Footing bars
    {
      mark: `A${type}-F1`,
      description: 'Bottom bars - Footing',
      diameter: 20,
      numberOfBars: Math.ceil(10 / 0.15),
      lengthPerBar: B,
      totalLength: Math.ceil(10 / 0.15) * B,
      unitWeight: BAR_WEIGHTS[20],
      totalWeight: Math.ceil(10 / 0.15) * B * BAR_WEIGHTS[20],
      shape: 'Straight'
    },
    // Dirt wall bars
    {
      mark: `A${type}-DW1`,
      description: 'Vertical bars - Dirt wall',
      diameter: 16,
      numberOfBars: 20,
      lengthPerBar: dirtWallH + 0.5,
      totalLength: 20 * (dirtWallH + 0.5),
      unitWeight: BAR_WEIGHTS[16],
      totalWeight: 20 * (dirtWallH + 0.5) * BAR_WEIGHTS[16],
      shape: 'Straight with anchorage'
    },
    // Return wall bars
    {
      mark: `A${type}-RW1`,
      description: 'Main bars - Return wall',
      diameter: 16,
      numberOfBars: 16,
      lengthPerBar: returnWallL + 0.5,
      totalLength: 16 * (returnWallL + 0.5),
      unitWeight: BAR_WEIGHTS[16],
      totalWeight: 16 * (returnWallL + 0.5) * BAR_WEIGHTS[16],
      shape: 'Straight'
    }
  ];
  
  const totalWeight = bars.reduce((sum, b) => sum + b.totalWeight, 0);
  
  return {
    element: `${type} Abutment (Stem + Footing + Dirt Wall)`,
    bars,
    totalWeight,
    concreteVolume,
    steelRatio: (totalWeight / concreteVolume) * 100
  };
}

function generateSteelBOQ(schedule: ReinforcementSchedule, elementName: string): BOQItem[] {
  const items: BOQItem[] = [];
  
  // Group by diameter
  const byDiameter = schedule.bars.reduce((acc, bar) => {
    if (!acc[bar.diameter]) acc[bar.diameter] = [];
    acc[bar.diameter].push(bar);
    return acc;
  }, {} as Record<number, ReinforcementBar[]>);
  
  Object.entries(byDiameter).forEach(([dia, bars]) => {
    const totalWeight = bars.reduce((sum, b) => sum + b.totalWeight, 0);
    const totalLength = bars.reduce((sum, b) => sum + b.totalLength, 0);
    
    items.push({
      itemNo: `S-${elementName.substring(0, 3)}-${dia}mm`,
      description: `${elementName} - ${dia}mm φ bars (${bars.length} marks)`,
      unit: 'kg',
      quantity: Math.round(totalWeight),
      rate: 85,
      amount: Math.round(totalWeight) * 85
    });
  });
  
  return items;
}

/**
 * Generate Reinforcement Detail SVG Drawing
 */
export function generateReinforcementDetailSVG(input: EnhancedProjectInput, element: 'pier' | 'abutment-type1' | 'abutment-c1'): string {
  const reinforcement = calculateReinforcement(input);
  let schedule: ReinforcementSchedule;
  let title: string;
  
  if (element === 'pier') {
    schedule = reinforcement.pier;
    title = 'PIER REINFORCEMENT DETAILS';
  } else if (element === 'abutment-type1') {
    schedule = reinforcement.abutmentType1;
    title = 'TYPE-1 ABUTMENT REINFORCEMENT DETAILS';
  } else {
    schedule = reinforcement.abutmentC1;
    title = 'C1 CANTILEVER ABUTMENT REINFORCEMENT DETAILS';
  }
  
  const svgW = 900;
  const svgH = 700;
  
  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#f8f9fa"/>`;
  
  // Title
  svg += `<text x="${svgW/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1a237e">${title}</text>`;
  svg += `<text x="${svgW/2}" y="50" text-anchor="middle" font-size="12" fill="#666">${input.projectName}</text>`;
  
  // Bar Bending Schedule Table
  const tableY = 80;
  const rowH = 25;
  const colWidths = [50, 120, 50, 60, 80, 80, 60, 80];
  const headers = ['Mark', 'Description', 'Dia\n(mm)', 'No. of\nBars', 'Length\n(m)', 'Total\nLength', 'Unit Wt\n(kg/m)', 'Total Wt\n(kg)'];
  
  // Table header
  svg += `<rect x="30" y="${tableY}" width="${colWidths.reduce((a,b)=>a+b,0)}" height="${rowH*2}" fill="#1565c0"/>`;
  let x = 30;
  headers.forEach((h, i) => {
    const lines = h.split('\n');
    lines.forEach((line, li) => {
      svg += `<text x="${x + colWidths[i]/2}" y="${tableY + 15 + li*12}" text-anchor="middle" font-size="9" fill="white">${line}</text>`;
    });
    x += colWidths[i];
  });
  
  // Table rows
  schedule.bars.forEach((bar, idx) => {
    const y = tableY + rowH * 2 + idx * rowH;
    const bg = idx % 2 === 0 ? '#e3f2fd' : 'white';
    svg += `<rect x="30" y="${y}" width="${colWidths.reduce((a,b)=>a+b,0)}" height="${rowH}" fill="${bg}" stroke="#90caf9" stroke-width="0.5"/>`;
    
    const values = [
      bar.mark, bar.description, bar.diameter.toString(),
      bar.numberOfBars.toString(), bar.lengthPerBar.toFixed(2),
      bar.totalLength.toFixed(2), bar.unitWeight.toFixed(3),
      bar.totalWeight.toFixed(1)
    ];
    
    x = 30;
    values.forEach((v, i) => {
      svg += `<text x="${x + 5}" y="${y + 17}" font-size="9" fill="#333">${v}</text>`;
      x += colWidths[i];
    });
  });
  
  // Summary box
  const summaryY = tableY + rowH * 2 + schedule.bars.length * rowH + 20;
  svg += `<rect x="30" y="${summaryY}" width="400" height="80" fill="#fff3e0" stroke="#ff9800" stroke-width="1"/>`;
  svg += `<text x="40" y="${summaryY + 20}" font-size="11" font-weight="bold" fill="#e65100">REINFORCEMENT SUMMARY</text>`;
  svg += `<text x="40" y="${summaryY + 40}" font-size="10" fill="#333">Total Steel Weight: ${schedule.totalWeight.toFixed(1)} kg (${(schedule.totalWeight/1000).toFixed(2)} MT)</text>`;
  svg += `<text x="40" y="${summaryY + 55}" font-size="10" fill="#333">Concrete Volume: ${schedule.concreteVolume.toFixed(2)} m³</text>`;
  svg += `<text x="40" y="${summaryY + 70}" font-size="10" fill="#333">Steel Ratio: ${schedule.steelRatio.toFixed(2)}%</text>`;
  
  // Legend for bar shapes
  const legendY = summaryY + 100;
  svg += `<text x="30" y="${legendY}" font-size="11" font-weight="bold" fill="#1565c0">BAR SHAPE LEGEND</text>`;
  
  const shapes = [
    { y: legendY + 20, desc: 'Straight bar', d: 'M 50 0 L 150 0' },
    { y: legendY + 40, desc: 'L-bend (90°)', d: 'M 50 0 L 100 0 L 100 30' },
    { y: legendY + 60, desc: 'Hook (135°)', d: 'M 50 0 L 120 0 Q 140 0 140 20' }
  ];
  
  shapes.forEach(s => {
    svg += `<path d="${s.d}" transform="translate(0, ${s.y - 10})" fill="none" stroke="#333" stroke-width="2"/>`;
    svg += `<text x="160" y="${s.y}" font-size="9" fill="#333">${s.desc}</text>`;
  });
  
  // Drawing notes
  const notesY = legendY + 90;
  svg += `<text x="30" y="${notesY}" font-size="10" font-weight="bold" fill="#1565c0">NOTES:</text>`;
  const notes = [
    '1. All dimensions are in mm unless otherwise noted.',
    '2. Concrete grade: M30 as per IRC:112-2015.',
    '3. Steel grade: Fe500 with fy = 500 MPa.',
    '4. Development length: Ld = 45φ for M30 concrete.',
    '5. Cover to reinforcement: 50mm for footing, 40mm for pier/abutment.'
  ];
  notes.forEach((n, i) => {
    svg += `<text x="30" y="${notesY + 15 + i*14}" font-size="9" fill="#555">${n}</text>`;
  });
  
  svg += '</svg>';
  return svg;
}

/**
 * Generate Cross-section with reinforcement shown
 */
export function generateReinforcementSectionSVG(input: EnhancedProjectInput, element: 'pier' | 'abutment'): string {
  const pier = input.pier;
  const pW = pier?.geometry.width ?? input.pierWidth;
  const pL = pier?.geometry.length ?? input.pierLength;
  const baseW = pier?.footing.width ?? input.pierBaseWidth;
  const baseL = pier?.footing.length ?? input.pierBaseLength;
  
  const svgW = 600;
  const svgH = 500;
  const SCALE = 30; // pixels per meter
  
  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#fafafa"/>`;
  svg += `<text x="${svgW/2}" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a237e">${element === 'pier' ? 'PIER' : 'ABUTMENT'} CROSS-SECTION WITH REINFORCEMENT</text>`;
  
  const cx = svgW / 2;
  const cy = svgH / 2 + 50;
  
  if (element === 'pier') {
    // Pier body outline
    const pxW = pW * SCALE;
    const pxL = pL * SCALE;
    svg += `<rect x="${cx - pxW/2}" y="${cy - 100}" width="${pxW}" height="${200}" fill="#e8f5e9" stroke="#2e7d32" stroke-width="2"/>`;
    
    // Main bars (dots)
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 4; j++) {
        const bx = cx - pxW/2 + (i + 1) * pxW/9;
        const by = cy - 100 + (j + 1) * 200/5;
        svg += `<circle cx="${bx}" cy="${by}" r="3" fill="#d32f2f"/>`;
      }
    }
    
    // Stirrups (rectangles)
    svg += `<rect x="${cx - pxW/2 + 10}" y="${cy - 90}" width="${pxW - 20}" height="${180}" fill="none" stroke="#ff9800" stroke-width="1.5" stroke-dasharray="5,3"/>`;
    
    // Dimension lines
    svg += `<line x1="${cx - pxW/2}" y1="${cy + 120}" x2="${cx + pxW/2}" y2="${cy + 120}" stroke="#333" stroke-width="1"/>`;
    svg += `<text x="${cx}" y="${cy + 140}" text-anchor="middle" font-size="11" fill="#333">${pW}m</text>`;
    
    // Legend
    svg += `<rect x="30" y="${svgH - 80}" width="15" height="15" fill="#d32f2f"/>`;
    svg += `<text x="55" y="${svgH - 68}" font-size="10" fill="#333">Main bars (25mm φ)</text>`;
    svg += `<rect x="30" y="${svgH - 55}" width="15" height="15" fill="none" stroke="#ff9800" stroke-width="1.5" stroke-dasharray="3,2"/>`;
    svg += `<text x="55" y="${svgH - 43}" font-size="10" fill="#333">Stirrups (12mm φ @ 150c/c)</text>`;
  }
  
  svg += '</svg>';
  return svg;
}

export function calculateReinforcement(input: EnhancedProjectInput) {
  return calculateReinforcementInternal(input);
}

export type { ReinforcementBar, ReinforcementSchedule };
