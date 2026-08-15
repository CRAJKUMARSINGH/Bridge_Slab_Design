import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import type { EnhancedProjectInput } from '../bridge-excel-generator/types';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import { generateHTMLDesignReport } from '../server/design-report';
import { generateComprehensivePDF } from '../server/comprehensive-pdf-export';
import { mergeProjectInput, PHASE1_QUICK_TEMPLATES } from '../server/default-project-inputs';
import { generateBridgeDXF } from '../server/dxf-export';
import { generateDesignPDF } from '../server/pdf-export';
import { validateDesign, generateValidationHTML } from '../server/claude-validator';
import { calculateReinforcement, generateReinforcementDetailSVG, generateReinforcementSectionSVG } from '../server/reinforcement-drawings';
import { calculateDetailedAbutmentDesign, calculateDetailedEstimation, calculateDeckAnchorage } from '../server/remote-app-adapter';
import { generateAbutmentSvg, generateGADSvg, generatePierSvg, generateSlabSvg } from '../server/svg-diagrams';
import { buildSingleWorkbookSheetPreview, buildWorkbookSheetPreviews, STABILITY_CHECK_PIER_SHEET_NAME } from '../server/workbook-sheets-preview';
import { generateGADCSV, generateGADJSON } from './generate-gad-csv';

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
}

function timestampTag(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}${min}${ss}`;
}

function resolveTemplateId(argv: string[]): string {
  const arg = argv.find((a) => a.startsWith('--template='))?.split('=')[1];
  return arg && arg.length > 0 ? arg : 'kherwara-golden';
}

async function writeSvgPngPair(dirSvg: string, dirPng: string, stem: string, svg: string): Promise<void> {
  writeFileSync(join(dirSvg, `${stem}.svg`), svg, 'utf-8');
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(dirPng, `${stem}.png`), png);
}

async function main(): Promise<void> {
  const templateId = resolveTemplateId(process.argv.slice(2));
  const template = PHASE1_QUICK_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    console.error(
      `Unknown template "${templateId}". Available: ${PHASE1_QUICK_TEMPLATES.map((t) => t.id).join(', ')}`,
    );
    process.exit(1);
  }

  const input = mergeProjectInput(template.input);
  const design = calculateCompleteDesign(input, { quiet: true });
  const enhanced = { ...input, ...design } as EnhancedProjectInput;

  const projectTag = safeName(input.projectName || template.id || 'sample-bridge');
  const stamp = timestampTag();
  const baseDir = join(process.cwd(), 'outputs', projectTag, stamp);

  const dirs = {
    design: join(baseDir, 'design'),
    excel: join(baseDir, 'excel'),
    pdf: join(baseDir, 'pdf'),
    html: join(baseDir, 'html'),
    validation: join(baseDir, 'validation'),
    analytics: join(baseDir, 'analytics'),
    reinforcement: join(baseDir, 'reinforcement'),
    svg: join(baseDir, 'drawings', 'svg'),
    png: join(baseDir, 'drawings', 'png'),
    dxf: join(baseDir, 'drawings', 'dxf'),
  };
  Object.values(dirs).forEach((d) => mkdirSync(d, { recursive: true }));

  writeFileSync(join(dirs.design, 'project-input.json'), JSON.stringify(input, null, 2));
  writeFileSync(join(dirs.design, 'design-results.json'), JSON.stringify(design, null, 2));
  writeFileSync(join(dirs.design, 'gad-data.json'), JSON.stringify(generateGADJSON(input), null, 2));
  writeFileSync(join(dirs.design, 'gad-data.csv'), generateGADCSV(input), 'utf-8');
  writeFileSync(join(dirs.analytics, 'workbook-previews.json'), JSON.stringify(await buildWorkbookSheetPreviews(input), null, 2));
  writeFileSync(
    join(dirs.analytics, `workbook-sheet-preview-${safeName(STABILITY_CHECK_PIER_SHEET_NAME)}.json`),
    JSON.stringify(await buildSingleWorkbookSheetPreview(input, STABILITY_CHECK_PIER_SHEET_NAME), null, 2),
  );

  const excelBuffer = await generateCompleteExcel(input);
  writeFileSync(join(dirs.excel, `${projectTag}_design.xlsx`), excelBuffer);

  const shortPdf = await generateDesignPDF(enhanced);
  const comprehensivePdf = await generateComprehensivePDF(enhanced);
  writeFileSync(join(dirs.pdf, `${projectTag}_report-short.pdf`), shortPdf);
  writeFileSync(join(dirs.pdf, `${projectTag}_report-comprehensive.pdf`), comprehensivePdf);
  writeFileSync(join(dirs.html, `${projectTag}_report.html`), generateHTMLDesignReport(enhanced), 'utf-8');

  writeFileSync(
    join(dirs.dxf, `${projectTag}_acad_AC1018.dxf`),
    generateBridgeDXF(enhanced, { acadVersion: 'AC1018' }),
    'utf-8',
  );
  writeFileSync(
    join(dirs.dxf, `${projectTag}_acad_AC1021.dxf`),
    generateBridgeDXF(enhanced, { acadVersion: 'AC1021' }),
    'utf-8',
  );

  await writeSvgPngPair(dirs.svg, dirs.png, 'gad', generateGADSvg(enhanced));
  await writeSvgPngPair(dirs.svg, dirs.png, 'pier', generatePierSvg(enhanced));
  await writeSvgPngPair(dirs.svg, dirs.png, 'abutment', generateAbutmentSvg(enhanced));
  await writeSvgPngPair(dirs.svg, dirs.png, 'slab', generateSlabSvg(enhanced));
  await writeSvgPngPair(dirs.svg, dirs.png, 'reinforcement-pier-detail', generateReinforcementDetailSVG(enhanced, 'pier'));
  await writeSvgPngPair(
    dirs.svg,
    dirs.png,
    'reinforcement-abutment-type1-detail',
    generateReinforcementDetailSVG(enhanced, 'abutment-type1'),
  );
  await writeSvgPngPair(
    dirs.svg,
    dirs.png,
    'reinforcement-abutment-c1-detail',
    generateReinforcementDetailSVG(enhanced, 'abutment-c1'),
  );
  await writeSvgPngPair(dirs.svg, dirs.png, 'reinforcement-pier-section', generateReinforcementSectionSVG(enhanced, 'pier'));
  await writeSvgPngPair(
    dirs.svg,
    dirs.png,
    'reinforcement-abutment-section',
    generateReinforcementSectionSVG(enhanced, 'abutment'),
  );

  const validation = validateDesign(input, design);
  writeFileSync(join(dirs.validation, `${projectTag}_validation.json`), JSON.stringify(validation, null, 2));
  writeFileSync(join(dirs.validation, `${projectTag}_validation.html`), generateValidationHTML(validation), 'utf-8');

  const reinforcement = calculateReinforcement(enhanced);
  const detailedAbutmentType1 = calculateDetailedAbutmentDesign(input, 'TYPE1');
  const detailedAbutmentC1 = calculateDetailedAbutmentDesign(input, 'C1');
  const detailedEstimation = calculateDetailedEstimation(input, design);
  const deckAnchorage = calculateDeckAnchorage(input, design);
  writeFileSync(join(dirs.reinforcement, `${projectTag}_reinforcement-schedule.json`), JSON.stringify(reinforcement, null, 2));
  writeFileSync(join(dirs.analytics, `${projectTag}_detailed-abutment-type1.json`), JSON.stringify(detailedAbutmentType1, null, 2));
  writeFileSync(join(dirs.analytics, `${projectTag}_detailed-abutment-c1.json`), JSON.stringify(detailedAbutmentC1, null, 2));
  writeFileSync(join(dirs.analytics, `${projectTag}_detailed-estimation.json`), JSON.stringify(detailedEstimation, null, 2));
  writeFileSync(join(dirs.analytics, `${projectTag}_deck-anchorage.json`), JSON.stringify(deckAnchorage, null, 2));

  writeFileSync(
    join(baseDir, 'README.txt'),
    [
      `Project: ${input.projectName}`,
      `Template ID: ${templateId}`,
      `Bridge type: ${input.bridgeType ?? 'submersible'}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      'Contents:',
      '- design/: project input, engine results, GAD data JSON/CSV',
      '- analytics/: workbook previews + detailed analyses',
      '- excel/: full workbook',
      '- pdf/: short + comprehensive report',
      '- html/: HTML design report',
      '- validation/: validation JSON + HTML',
      '- reinforcement/: reinforcement schedule JSON',
      '- drawings/svg/: geometry and reinforcement SVG outputs',
      '- drawings/png/: geometry and reinforcement PNG outputs',
      '- drawings/dxf/: AC1018 + AC1021 variants',
      '',
      'Re-run with:',
      `npm run export:sample-bundle -- --template=${templateId}`,
    ].join('\n'),
    'utf-8',
  );

  console.log(`Export bundle created: ${baseDir}`);
}

void main();
