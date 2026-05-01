import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateCompleteExcel } from '../bridge-excel-generator/index';
import calculateCompleteDesign from '../bridge-excel-generator/design-engine';
import { generateBridgeDXF } from '../server/dxf-export';
import { generateHTMLDesignReport } from '../server/design-report';
import type { EnhancedProjectInput, ProjectInput } from '../bridge-excel-generator/types';
import { buildElevenBridgeCases } from './eleven-bridge-cases';

type SeededRng = () => number;

function makeRng(seed: number): SeededRng {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function randomInRange(rng: SeededRng, min: number, max: number): number {
  return min + (max - min) * rng();
}

function varyInput(base: ProjectInput, rng: SeededRng): ProjectInput {
  const dischargeFactor = randomInRange(rng, 0.9, 1.1);
  const manningFactor = randomInRange(rng, 0.97, 1.03);
  const bedSlopeFactor = randomInRange(rng, 0.95, 1.05);
  const sbcFactor = randomInRange(rng, 0.95, 1.1);
  const spanJitter = randomInRange(rng, -0.2, 0.2);
  const hflJitter = randomInRange(rng, -0.3, 0.3);

  return {
    ...base,
    discharge: Number((base.discharge * dischargeFactor).toFixed(3)),
    manningN: Number((base.manningN * manningFactor).toFixed(5)),
    bedSlope: Number((base.bedSlope * bedSlopeFactor).toFixed(3)),
    sbc: Number((base.sbc * sbcFactor).toFixed(3)),
    spanLength: Number((base.spanLength + spanJitter).toFixed(3)),
    hfl: Number((base.hfl + hflJitter).toFixed(3)),
  };
}

async function main() {
  const seedArg = process.argv.find((arg) => arg.startsWith('--seed='));
  const seed = seedArg ? Number(seedArg.split('=')[1]) : Date.now();
  const rng = makeRng(seed);
  const baseCases = buildElevenBridgeCases();

  const outRoot = join(process.cwd(), 'sample', 'merged-15-random-full');
  mkdirSync(outRoot, { recursive: true });

  const totalRuns = 15;
  let ok = 0;
  console.log(`Using RNG seed: ${seed}`);

  for (let i = 0; i < totalRuns; i += 1) {
    const baseCase = baseCases[Math.floor(rng() * baseCases.length)];
    const scenarioId = `random-${String(i + 1).padStart(2, '0')}-${safeName(baseCase.id)}`;
    const userDir = join(outRoot, scenarioId);
    mkdirSync(userDir, { recursive: true });

    try {
      const input = varyInput(baseCase.input, rng);
      const design = calculateCompleteDesign(input, { quiet: true });
      const enhanced = { ...input, ...design } as EnhancedProjectInput;
      const workbook = await generateCompleteExcel(input);

      writeFileSync(join(userDir, 'input.json'), JSON.stringify(input, null, 2));
      writeFileSync(join(userDir, 'design-results.json'), JSON.stringify(design, null, 2));
      writeFileSync(join(userDir, 'estimation.json'), JSON.stringify(design.estimation ?? null, null, 2));
      writeFileSync(join(userDir, `${scenarioId}_design.xlsx`), workbook);
      writeFileSync(join(userDir, `${scenarioId}_drawing.dxf`), generateBridgeDXF(enhanced, { acadVersion: 'AC1018' }), 'utf-8');
      writeFileSync(join(userDir, `${scenarioId}_report.html`), generateHTMLDesignReport(enhanced), 'utf-8');

      ok += 1;
      console.log(`OK   ${scenarioId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${scenarioId}: ${message}`);
      process.exitCode = 1;
    }
  }

  console.log(`\nDone: ${ok}/${totalRuns} generated`);
  console.log(`Output: ${outRoot}`);
}

void main();
