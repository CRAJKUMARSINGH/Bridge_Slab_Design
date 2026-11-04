// gate:boq — gate stub (NOT IMPLEMENTED)
// Owning week will replace this stub with real assertions.
// CONTRACT: exit 0=PASS, 1=FAIL, 2=NOT IMPLEMENTED
//           last stdout line = "GATE gate-boq: PASS|FAIL <n> assertions"
//           writes scripts/gates/.out/gate-boq.json
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const GATE_NAME = "gate-boq";
const outDir = join(dirname(fileURLToPath(import.meta.url)), ".out");
mkdirSync(outDir, { recursive: true });

const result = { name: GATE_NAME, ts: new Date().toISOString(), commit: null, pass: 0, fail: 0, detail: [] };
writeFileSync(join(outDir, `${GATE_NAME}.json`), JSON.stringify(result, null, 2));
console.log(`GATE ${GATE_NAME}: NOT IMPLEMENTED 0 assertions`);
process.exit(2);
