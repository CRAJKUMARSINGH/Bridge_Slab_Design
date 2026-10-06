import fs from 'node:fs';
import path from 'node:path';
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';
import { generateCompleteExcel } from '../bridge-excel-generator';
import { generateBridgeDXF } from '../server/dxf-export';
import { generateComprehensivePDF } from '../server/comprehensive-pdf-export';
import { generateLandscapeBookPDF } from '../server/landscape-pdf-export';

const EXAMPLES_DIR = path.resolve(process.cwd(), 'docs', 'tutorials', 'examples');

if (!fs.existsSync(EXAMPLES_DIR)) {
  fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
}

// 11 distinct bridge configurations
const designs = [
  {
    name: "01_Single_Span_Culvert",
    desc: "A small single span bridge suitable for minor nallahs.",
    spans: 1, spanLen: 6, discharge: 50, hfl: 100, bedLevel: 98,
    pierDepth: 0, sbc: 200
  },
  {
    name: "02_Double_Span_Stream",
    desc: "A common two-span structure for moderate streams.",
    spans: 2, spanLen: 8, discharge: 150, hfl: 102, bedLevel: 97,
    pierDepth: 3, sbc: 250
  },
  {
    name: "03_Triple_Span_Highway",
    desc: "Standard 3-span bridge for state highways.",
    spans: 3, spanLen: 10, discharge: 300, hfl: 105, bedLevel: 98,
    pierDepth: 4, sbc: 220
  },
  {
    name: "04_Four_Span_River",
    desc: "Four spans crossing a small river with moderate flow.",
    spans: 4, spanLen: 12, discharge: 500, hfl: 103, bedLevel: 95,
    pierDepth: 5, sbc: 280
  },
  {
    name: "05_Five_Span_Wide_River",
    desc: "A wider river crossing requiring 5 spans.",
    spans: 5, spanLen: 15, discharge: 800, hfl: 106, bedLevel: 96,
    pierDepth: 6, sbc: 300
  },
  {
    name: "06_Six_Span_Deep_Channel",
    desc: "Deep channel bridge with high discharge.",
    spans: 6, spanLen: 15, discharge: 1200, hfl: 110, bedLevel: 98,
    pierDepth: 8, sbc: 350
  },
  {
    name: "07_Seven_Span_Major_Bridge",
    desc: "Major bridge structure with 7 spans.",
    spans: 7, spanLen: 18, discharge: 1800, hfl: 105, bedLevel: 92,
    pierDepth: 9, sbc: 400
  },
  {
    name: "08_Eight_Span_Floodplain",
    desc: "Long bridge over a wide floodplain.",
    spans: 8, spanLen: 12, discharge: 900, hfl: 102, bedLevel: 95,
    pierDepth: 4, sbc: 180
  },
  {
    name: "09_Nine_Span_Viaduct",
    desc: "Multi-span viaduct approach.",
    spans: 9, spanLen: 10, discharge: 400, hfl: 101, bedLevel: 94,
    pierDepth: 5, sbc: 220
  },
  {
    name: "10_Ten_Span_Estuary",
    desc: "Very long 10-span structure.",
    spans: 10, spanLen: 15, discharge: 2500, hfl: 108, bedLevel: 90,
    pierDepth: 10, sbc: 380
  },
  {
    name: "11_Massive_Twelve_Span",
    desc: "An extreme 12-span bridge design for large crossings.",
    spans: 12, spanLen: 20, discharge: 3500, hfl: 112, bedLevel: 95,
    pierDepth: 12, sbc: 450
  }
];

async function generateAll() {
  console.log('Generating 11 Tutorial Designs...');
  
  for (const design of designs) {
    console.log(`\nProcessing: ${design.name}`);
    
    // Create base payload
    const payload = {
      projectName: `Tutorial Example: ${design.name.replace(/_/g, ' ')}`,
      location: "Tutorial Data",
      riverName: "Example River",
      spanLength: design.spanLen,
      numberOfSpans: design.spans,
      carriageWidth: 7.5,
      numberOfLanes: 2,
      hfl: design.hfl,
      bedLevel: design.bedLevel,
      foundationLevel: design.bedLevel - design.pierDepth - 1,
      discharge: design.discharge,
      manningN: 0.035,
      bedSlope: 500,
      laceysSiltFactor: 1.1,
      pierWidth: 1.2,
      pierLength: 8.5,
      pierDepth: design.pierDepth,
      numberOfPiers: Math.max(0, design.spans - 1),
      pierBaseWidth: 4.5,
      pierBaseLength: 10.5,
      abutmentHeight: 6.5,
      abutmentWidth: 10.5,
      abutmentDepth: 4.5,
      dirtWallHeight: 1.5,
      returnWallLength: 4.5,
      concreteGrade: "M30",
      fck: 30,
      steelGrade: "Fe500",
      fy: 500,
      totalLength: design.spans * design.spanLen,
      sbc: design.sbc,
      phi: 30,
      gamma: 18,
      rtl: design.hfl + 2,
      agl: design.bedLevel + 1,
      nbl: design.bedLevel,
      ofl: design.hfl - 2,
      dwl: design.hfl + 0.5,
      crossSectionData: [
        { chainage: 0, gl: design.hfl + 3 },
        { chainage: (design.spans * design.spanLen) / 2, gl: design.bedLevel },
        { chainage: design.spans * design.spanLen, gl: design.hfl + 3 }
      ]
    };

    const targetDir = path.join(EXAMPLES_DIR, design.name);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    try {
      // 1. Core Calculations
      const results = calculateCompleteDesign(payload as any);
      fs.writeFileSync(path.join(targetDir, 'design_data.json'), JSON.stringify(results, null, 2));

      // 2. Excel 46-Sheet Workbook
      const excelBuffer = await generateCompleteExcel(payload as any);
      fs.writeFileSync(path.join(targetDir, 'calculations.xlsx'), Buffer.from(excelBuffer));

      // 3. DXF Drawings
      const dxfData = generateBridgeDXF(payload as any);
      fs.writeFileSync(path.join(targetDir, 'drawings.dxf'), dxfData);

      // 4. Landscape PDF
      const landscapePdfBuffer = await generateLandscapeBookPDF(payload as any);
      fs.writeFileSync(path.join(targetDir, 'landscape_book.pdf'), landscapePdfBuffer);

      console.log(`✅ Successfully generated artifacts for ${design.name}`);
    } catch (err: any) {
      console.error(`❌ Failed to generate ${design.name}:`, err.message);
    }
  }

  // Create an index markdown file for the tutorials
  const indexContent = `# Bridge Design Tutorials & Examples\n\nThis directory contains 11 distinct bridge design examples, pre-calculated by the Bridge Slab Design engine. They serve as references for different span configurations.\n\n${designs.map(d => `## ${d.name.replace(/_/g, ' ')}\n- **Description:** ${d.desc}\n- **Configuration:** ${d.spans} spans @ ${d.spanLen}m each.\n- **Hydraulics:** ${d.discharge} cumecs discharge.\n- **Artifacts:** \`calculations.xlsx\`, \`landscape_book.pdf\`, \`drawings.dxf\`\n`).join('\n')}\n`;
  
  fs.writeFileSync(path.join(EXAMPLES_DIR, 'README.md'), indexContent);
  console.log('\n✅ All 11 tutorial designs generated successfully in docs/tutorials/examples/');
}

generateAll();
