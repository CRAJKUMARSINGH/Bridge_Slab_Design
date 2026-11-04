import { readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type PierTemplateType =
  | 'single-column'
  | 'twin-column'
  | 'wall'
  | 'hammerhead'
  | 'portal'
  | 'tall-viaduct'
  | 'circular'
  | 'hollow'
  | 'pile-cap-supported'
  | 'open-foundation'
  | 'unknown';

export type PierDrawingBucket =
  | 'geometry'
  | 'reinforcement'
  | 'foundations'
  | 'sections'
  | 'elevations'
  | 'notes'
  | 'special-cases';

export interface PierCaseFile {
  path: string;
  name: string;
  ext: string;
  templateType: PierTemplateType;
  bucket: PierDrawingBucket;
  score: number;
  scoreBreakup: {
    detailQuality: number;
    dimensionalClarity: number;
    reinforcementPracticality: number;
    economy: number;
    constructability: number;
    penalties: number;
  };
}

export interface PierCaseCatalog {
  root: string;
  totalFiles: number;
  files: PierCaseFile[];
  bestDefaults: Partial<Record<PierTemplateType, PierCaseFile>>;
  templateCoverage: Array<{
    templateType: Exclude<PierTemplateType, 'unknown'>;
    sourceBacked: boolean;
    bestCase?: PierCaseFile;
    note: string;
  }>;
  masterVariables: string[];
}

export const PIER_TEMPLATE_TYPES: Array<Exclude<PierTemplateType, 'unknown'>> = [
  'single-column',
  'twin-column',
  'wall',
  'hammerhead',
  'portal',
  'tall-viaduct',
  'circular',
  'hollow',
  'pile-cap-supported',
  'open-foundation',
];

const ALLOWED_EXT = new Set([
  '.dwg',
  '.dxf',
  '.pdf',
]);

const MASTER_VARIABLES = [
  'pierType',
  'height',
  'width',
  'length',
  'numberOfColumns',
  'stemThickness',
  'capBeamWidth',
  'capBeamDepth',
  'foundationType',
  'pileOrOpenFooting',
  'seismicZone',
  'windZone',
  'bearingType',
  'skewAngle',
  'roadWidth',
  'spanLength',
  'crossingType',
  'concreteGrade',
  'steelGrade',
  'clearCover',
  'reinforcementPreferences',
  'ircIsLoadClass',
];

function walkFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(abs);
      else out.push(abs);
    }
  }
  return out;
}

function templateTypeFromName(name: string): PierTemplateType {
  const n = name.toLowerCase();
  if (/\btwin\b|\b2\s*column\b|\bdouble\b/.test(n)) return 'twin-column';
  if (/\bsingle\b|\b1\s*column\b|\bpier1\b|llcalpier1/.test(n)) return 'single-column';
  if (/\bwall\b|retaining wall|retwall|dirt wall/.test(n)) return 'wall';
  if (/\bhammerhead\b|\bcap\b/.test(n)) return 'hammerhead';
  if (/\bportal\b/.test(n)) return 'portal';
  if (/\bviaduct\b|\btall\b|high level/.test(n)) return 'tall-viaduct';
  if (/\bcircular\b|\bcircle\b/.test(n)) return 'circular';
  if (/\bhollow\b/.test(n)) return 'hollow';
  if (/\bpile\b/.test(n)) return 'pile-cap-supported';
  if (/\bopen\b|\bfooting\b|\bfoundation\b/.test(n)) return 'open-foundation';
  if (/\bpier\b/.test(n)) return 'single-column';
  return 'unknown';
}

function bucketFromPath(relPath: string): PierDrawingBucket {
  const p = relPath.toLowerCase();
  if (/\breinforcement\b|reinf|bar bending|bbs/.test(p)) return 'reinforcement';
  if (/\bfoundation\b|pile cap|footing/.test(p)) return 'foundations';
  if (/\bsection\b/.test(p)) return 'sections';
  if (/\belevation\b/.test(p)) return 'elevations';
  if (/\bnote\b/.test(p)) return 'notes';
  if (/\bgeometry\b|\bplan\b|\bdimension\b/.test(p)) return 'geometry';
  return 'special-cases';
}

function computeScore(name: string, bucket: PierDrawingBucket): PierCaseFile['scoreBreakup'] {
  const n = name.toLowerCase();
  const detailQuality =
    (/\bsection\b/.test(n) ? 20 : 0) +
    (/\bplan\b/.test(n) ? 15 : 0) +
    (/\belevation\b/.test(n) ? 15 : 0) +
    (/\breinf|reinforcement\b/.test(n) ? 10 : 0);

  const dimensionalClarity = /\bdimension|dim\b/.test(n) ? 20 : /\bgeometry\b/.test(n) ? 12 : 6;
  const reinforcementPracticality = /\breinf|bar|steel|schedule\b/.test(n) ? 20 : bucket === 'reinforcement' ? 12 : 4;
  const economy = /\brect\b|\bstandard\b/.test(n) ? 12 : /\bcircular|hollow\b/.test(n) ? 8 : 10;
  const constructability = /\bfoundation|footing|cap\b/.test(n) ? 15 : 8;
  const penalties = /\bdup\d*\b|__dup/.test(n) ? 12 : 0;

  return {
    detailQuality,
    dimensionalClarity,
    reinforcementPracticality,
    economy,
    constructability,
    penalties,
  };
}

function totalScore(parts: PierCaseFile['scoreBreakup']): number {
  return (
    parts.detailQuality +
    parts.dimensionalClarity +
    parts.reinforcementPracticality +
    parts.economy +
    parts.constructability -
    parts.penalties
  );
}

export function isExistingDirectory(abs: string): boolean {
  try {
    return statSync(abs).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Repo root derived from this module, not from `process.cwd()`: a server started from a different
 * directory (systemd unit, container WORKDIR, `node dist/...`) used to resolve the asset library to
 * a path that did not exist and answer 500.
 */
function resolutionBases(): string[] {
  const bases = [resolve(dirname(fileURLToPath(import.meta.url)), '..'), resolve(process.cwd())];
  return bases.filter((base, index) => bases.indexOf(base) === index);
}

/** Sub-paths of a base that hold pier drawings, in preference order. */
const ASSET_LEAVES = [
  ['assets', 'COMPONENT_DRAWINGS_SORTED', 'Pier Geometry & Dimensions'],
  ['Attached_Assets'],
];

/** Asset library trees a `?root=` request may point inside. */
export function pierAssetTrees(): string[] {
  return resolutionBases()
    .flatMap((base) => [join(base, 'assets'), join(base, 'Attached_Assets')])
    .filter(isExistingDirectory);
}

/**
 * The pier drawing library to catalog. Returns null when nothing is present — callers must answer
 * "library not installed" rather than cataloguing a path that does not exist.
 */
export function resolveDefaultPierAssetRoot(): string | null {
  const envRoot = process.env.PIER_ASSET_ROOT?.trim();
  if (envRoot) {
    const configured = resolve(envRoot);
    return isExistingDirectory(configured) ? configured : null;
  }
  return resolutionBases()
    .flatMap((base) => ASSET_LEAVES.map((leaf) => join(base, ...leaf)))
    .find(isExistingDirectory) ?? null;
}

export function buildPierCaseCatalog(root: string): PierCaseCatalog {
  if (!isExistingDirectory(root)) {
    throw new Error(`Pier asset root is not a directory: ${root}`);
  }

  const files: PierCaseFile[] = walkFiles(root)
    .filter((abs) => ALLOWED_EXT.has(extname(abs).toLowerCase()))
    .map((abs) => {
      const rel = relative(root, abs).replace(/\\/g, '/');
      const name = rel.split('/').pop() ?? rel;
      const bucket = bucketFromPath(rel);
      const templateType = templateTypeFromName(rel);
      const scoreBreakup = computeScore(name, bucket);
      return {
        path: rel,
        name,
        ext: extname(abs).toLowerCase(),
        templateType,
        bucket,
        scoreBreakup,
        score: totalScore(scoreBreakup),
      };
    })
    .sort((a, b) => b.score - a.score);

  const bestDefaults: Partial<Record<PierTemplateType, PierCaseFile>> = {};
  for (const file of files) {
    if (!bestDefaults[file.templateType]) bestDefaults[file.templateType] = file;
  }
  const fallbackCase = files.find((file) => file.templateType !== 'unknown') ?? files[0];
  const templateCoverage = PIER_TEMPLATE_TYPES.map((templateType) => {
    const bestCase = bestDefaults[templateType] ?? fallbackCase;
    const sourceBacked = Boolean(bestDefaults[templateType]);
    return {
      templateType,
      sourceBacked,
      bestCase,
      note: sourceBacked
        ? 'Best standard case selected from matching pier asset library evidence.'
        : 'Parametric template is available; no exact source drawing name was found, so the engine uses computed geometry/BBS rules and the closest available bridge asset as reference evidence.',
    };
  });

  return {
    root,
    totalFiles: files.length,
    files,
    bestDefaults,
    templateCoverage,
    masterVariables: MASTER_VARIABLES,
  };
}
