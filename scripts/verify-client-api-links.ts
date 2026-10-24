/**
 * Client link gate: every /api/... path the browser advertises must be served by the API.
 *
 * A dead link in this app is not cosmetic. Two failure modes hide it:
 *  - the SPA catch-all (server/vite.ts) answers any unmatched path with index.html and status 200,
 *    so a broken document link opens the application shell instead of the document;
 *  - everything under /api passes dbGuard (server/d4-routes.ts), which answers 503
 *    "Database not configured" whenever DATABASE_URL is unset — measured 2026-10-16 by booting
 *    server/index.ts and requesting /api/reports/som-river-kherwara.html.
 *
 * The gate reads the routes the server really registers, reads the literals the client prints, and
 * matches them segment by segment. Unknown-link debt is listed in KNOWN_UNSERVED with a reason, so
 * it is reported today but a NEW broken link fails the build instead of joining the silent majority.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const clientDir = join(repoRoot, 'client', 'src');
const factoryFile = join(repoRoot, 'server', 'app-factory.ts');

type Route = { segments: string[]; methods: Set<string>; path: string; source: string };

function segmentsOf(path: string): string[] {
  return path.split('?')[0].split('#')[0].replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

/** A segment matches anything when it is an Express parameter, an interpolated client hole, or a splat. */
function isWildcard(segment: string): boolean {
  return /^:[A-Za-z0-9_]+$/.test(segment) || /^\$\{[^}]*\}$/.test(segment) || segment === '*';
}

function segmentsMatch(routeSegments: string[], linkSegments: string[]): boolean {
  if (routeSegments.length !== linkSegments.length) return false;
  return routeSegments.every((s, i) => s === linkSegments[i] || isWildcard(s) || isWildcard(linkSegments[i]));
}

function collectRoutes(): Route[] {
  const routes: Route[] = [];
  const add = (fullPath: string, method: string, source: string) => {
    const path = `/${segmentsOf(fullPath).join('/')}`;
    const existing = routes.find((r) => r.path === path);
    if (existing) {
      existing.methods.add(method.toUpperCase());
      return;
    }
    routes.push({ segments: segmentsOf(path), methods: new Set([method.toUpperCase()]), path, source });
  };

  const factory = readFileSync(factoryFile, 'utf8');
  for (const m of factory.matchAll(/app\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)) {
    add(m[2], m[1], 'server/app-factory.ts');
  }

  const localImports = new Map<string, string>();
  for (const m of factory.matchAll(/import\s+(\w+)\s+from\s+["']\.\/([\w./-]+)["']/g)) {
    localImports.set(m[1], join(repoRoot, 'server', `${m[2]}.ts`));
  }

  for (const m of factory.matchAll(/app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/g)) {
    const mount = m[1];
    const file = localImports.get(m[2]);
    if (!file) continue; // third-party middleware: cors, pino-http, express.json
    if (!existsSync(file)) {
      console.error(`verify-client-api-links: ${mount} is mounted from ./${m[2]}, which is not on disk.`);
      process.exit(1);
    }
    const rel = relative(repoRoot, file).split('\\').join('/');
    for (const r of readFileSync(file, 'utf8').matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)) {
      add(`${mount}${r[2]}`, r[1], rel);
    }
  }

  return routes;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out.sort();
}

const LINK_RE = /["'`](\/api\/[^"'`]*)["'`]/g;
/** Anchor targets are followed by the browser with GET; fetch() calls may legitimately use another verb. */
const GET_CONTEXT = /href|url:|window\.open|location\.assign|navigate\(/;

/**
 * Links the client advertises that nothing serves, admitted as debt rather than fixed silently.
 * Each entry carries why it is owed, so retiring it is a decision with a reason, not a deletion.
 */
const KNOWN_UNSERVED: Array<{ prefix: string; dir: string; reason: string }> = [
  {
    prefix: '/api/reports/',
    dir: 'design-reports',
    reason:
      'design-reports/*.html are hand-transcribed legacy design files (the Parwan sheet self-dates to 19-09-2006 and ' +
      'quotes "as stated in design DOC"). No router mounts them: artifacts/api-server/src/routes/reports.ts exists but ' +
      'that app never imports it, and server/app-factory.ts serves only /api/design and /api. Their numbers disagree ' +
      'with the engine inputs for the same bridges (Kherwara Q 899.93 vs 902.15, SBC 200 vs 150, bed 96.47 vs 96.6), ' +
      'so making the links work would publish superseded values as current design output.',
  },
];

/**
 * A link is admitted debt only if it names a document that is really sitting in the legacy folder.
 * Without that tie the prefix would excuse any typo under /api/reports/, and the gate would be
 * measuring its own quarantine list instead of the corpus.
 */
function isAdmittedDebt(literal: string): boolean {
  const entry = KNOWN_UNSERVED.find((k) => literal.startsWith(k.prefix));
  if (!entry) return false;
  const folder = join(repoRoot, entry.dir);
  const leaf = literal.slice(entry.prefix.length).split('?')[0].split('/').pop() ?? '';
  if (leaf === '') return existsSync(folder);
  return /\.html$/.test(leaf) && existsSync(join(folder, leaf));
}

function main(): void {
  const routes = collectRoutes();
  if (routes.length === 0) {
    console.error('verify-client-api-links: no routes were read from the server — the gate would call every link dead.');
    process.exit(1);
  }

  const files = sourceFiles(clientDir);
  if (files.length === 0) {
    console.error(`verify-client-api-links: no client sources under ${relative(repoRoot, clientDir)} — the gate measured nothing.`);
    process.exit(1);
  }

  const links: Array<{ literal: string; where: string; getOnly: boolean }> = [];
  for (const file of files) {
    const rel = relative(repoRoot, file).split('\\').join('/');
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line, index) => {
        for (const m of line.matchAll(LINK_RE)) {
          links.push({ literal: m[1], where: `${rel}:${index + 1}`, getOnly: GET_CONTEXT.test(line) });
        }
      });
  }
  if (links.length === 0) {
    console.error('verify-client-api-links: the client advertises no /api/ link at all — check the scanner before believing this.');
    process.exit(1);
  }

  const served: string[] = [];
  const quarantined: string[] = [];
  const wrongVerb: string[] = [];
  const dead: string[] = [];

  for (const link of links) {
    const match = routes.find((r) => segmentsMatch(r.segments, segmentsOf(link.literal)));
    const label = `${link.where}  ${link.literal}`;
    if (!match) {
      if (isAdmittedDebt(link.literal)) quarantined.push(label);
      else dead.push(label);
      continue;
    }
    if (link.getOnly && !match.methods.has('GET')) {
      wrongVerb.push(`${label} -> ${match.path} registers ${[...match.methods].join('/')}, the browser asks for GET`);
    } else {
      served.push(`${label} -> ${match.path} [${[...match.methods].join('/')}]`);
    }
  }

  served.forEach((l) => console.log(`  OK     ${l}`));
  quarantined.forEach((l) => console.log(`  DEBT   ${l}`));
  wrongVerb.forEach((l) => console.log(`  VERB   ${l}`));
  dead.forEach((l) => console.log(`  DEAD   ${l}`));

  if (quarantined.length > 0) {
    console.log(`\nAdmitted debt — ${quarantined.length} link(s) the server does not serve. Owner decision (publish, regenerate or unpublish):`);
    KNOWN_UNSERVED.filter((k) => quarantined.some((q) => q.includes(k.prefix))).forEach((k) => console.log(`  - ${k.reason}`));
  }

  const bad = dead.length + wrongVerb.length;
  console.log(
    `\nRoutes registered: ${routes.length} | client /api links: ${links.length} | served: ${served.length} | ` +
      `quarantined: ${quarantined.length} | dead: ${dead.length} | wrong verb: ${wrongVerb.length}`,
  );
  if (bad > 0) {
    console.error(`verify-client-api-links: ${bad} client link(s) the browser cannot use.`);
    process.exitCode = 1;
  } else {
    console.log('verify-client-api-links: OK — every client link outside the admitted debt resolves to a registered route.');
  }
}

main();
