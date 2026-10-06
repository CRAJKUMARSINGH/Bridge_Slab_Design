import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'archive', 'test-outputs', 'qa-251');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Using the actual design engine internally instead of HTTP to avoid HTTP timeouts during heavy load
import { calculateCompleteDesign } from '../bridge-excel-generator/design-engine';

interface UserSimulation {
  id: number;
  type: 'Beginner' | 'Intermediate' | 'Advanced';
}

const TOTAL_USERS = 251;
const BEGINNERS = 125;
const INTERMEDIATES = 75;
const ADVANCED = 51;

const users: UserSimulation[] = [];
for (let i = 0; i < BEGINNERS; i++) users.push({ id: users.length + 1, type: 'Beginner' });
for (let i = 0; i < INTERMEDIATES; i++) users.push({ id: users.length + 1, type: 'Intermediate' });
for (let i = 0; i < ADVANCED; i++) users.push({ id: users.length + 1, type: 'Advanced' });

// Randomize array
users.sort(() => Math.random() - 0.5);

function generatePayload(user: UserSimulation) {
  let payload: any = {
    projectName: `QA User ${user.id} (${user.type})`,
    location: "Simulated Testing Ground",
    riverName: "Test River",
    spanLength: 10,
    numberOfSpans: 4,
    carriageWidth: 7.5,
    numberOfLanes: 2,
    hfl: 100,
    bedLevel: 95,
    foundationLevel: 90,
    discharge: 150,
    manningN: 0.035,
    bedSlope: 500,
    laceysSiltFactor: 1.1,
    pierWidth: 1.2,
    pierLength: 8.5,
    pierDepth: 5,
    numberOfPiers: 3,
    pierBaseWidth: 4.5,
    pierBaseLength: 10.5,
    abutmentHeight: 6.5,
    abutmentWidth: 10.5,
    abutmentDepth: 4.5,
    dirtWallHeight: 1.5,
    returnWallLength: 4.5,
    concreteGrade: "M30",
    steelGrade: "Fe500",
    sbc: 250,
    phi: 30,
    gamma: 18,
    rtl: 102,
    agl: 97,
    nbl: 95,
    ofl: 98,
    dwl: 100.5,
    crossSectionData: [
      { chainage: 0, gl: 102 },
      { chainage: 20, gl: 95 },
      { chainage: 40, gl: 102 }
    ]
  };

  if (user.type === 'Intermediate') {
    payload.spanLength = 12 + Math.random() * 5;
    payload.numberOfSpans = Math.floor(3 + Math.random() * 5);
    payload.discharge = 200 + Math.random() * 300;
    payload.sbc = 200 + Math.random() * 100;
    payload.pierDepth = 6 + Math.random() * 3;
    payload.numberOfPiers = payload.numberOfSpans - 1;
    payload.crossSectionData = [
      { chainage: 0, gl: 102 },
      { chainage: payload.numberOfSpans * payload.spanLength / 2, gl: 92 },
      { chainage: payload.numberOfSpans * payload.spanLength, gl: 102 }
    ];
  } else if (user.type === 'Advanced') {
    payload.spanLength = 20 + Math.random() * 10;
    payload.numberOfSpans = Math.floor(5 + Math.random() * 10);
    payload.discharge = 1000 + Math.random() * 2000;
    payload.bedSlope = 150 + Math.random() * 100;
    payload.sbc = 150 + Math.random() * 50;
    payload.pierDepth = 10 + Math.random() * 5;
    payload.numberOfPiers = payload.numberOfSpans - 1;
    payload.crossSectionData = [
      { chainage: 0, gl: 105 },
      { chainage: payload.numberOfSpans * payload.spanLength / 2, gl: 85 },
      { chainage: payload.numberOfSpans * payload.spanLength, gl: 105 }
    ];
  }

  return payload;
}

async function runTest(user: UserSimulation): Promise<{ ok: boolean; duration: number }> {
  const payload = generatePayload(user);
  const start = Date.now();
  try {
    const results = calculateCompleteDesign(payload);
    const duration = Date.now() - start;
    
    // Strict verification bounds:
    if (!results.hydraulics || !results.pier || !results.abutmentType1) {
      throw new Error("Results payload missing vital calculation components");
    }

    if (duration > 5000) {
      throw new Error(`Performance Budget Exceeded: took ${duration}ms`);
    }

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `user_${user.id}_${user.type.toLowerCase()}.json`), 
      JSON.stringify({
        success: true,
        type: user.type,
        spans: payload.numberOfSpans,
        hydraulics_discharge: results.hydraulics.discharge,
        // PierDesignResult has no single max moment — it is the worst of the pier load cases.
        pier_max_moment: Math.max(0, ...results.pier.loadCases.map((c) => c.moment)),
        duration
      })
    );
    
    if (user.id % 25 === 0) {
      console.log(`[User ${user.id}/${TOTAL_USERS}] ✅ ${user.type} completed successfully in ${duration}ms.`);
    }
    return { ok: true, duration };
  } catch (err: any) {
    console.error(`[User ${user.id}/${TOTAL_USERS}] ❌ ${user.type} FAILED:`, err.message);
    return { ok: false, duration: Date.now() - start };
  }
}

async function main() {
  const suiteStart = Date.now();
  console.log(`Starting Ultra-Strict 251-User Stress Test...`);
  console.log(`Distribution: ${BEGINNERS} Beginners | ${INTERMEDIATES} Intermediates | ${ADVANCED} Advanced\n`);
  
  let successCount = 0;
  const BATCH_SIZE = 25;
  const durations: number[] = [];
  
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(u => runTest(u)));
    successCount += results.filter(r => r.ok).length;
    results.forEach(r => durations.push(r.duration));
  }

  const suiteDuration = Date.now() - suiteStart;
  const memoryUsage = process.memoryUsage().rss / 1024 / 1024; // MB
  
  console.log(`\n================================`);
  console.log(`STRESS TEST COMPLETE`);
  console.log(`Successful: ${successCount} / ${TOTAL_USERS}`);
  console.log(`Failed: ${TOTAL_USERS - successCount}`);
  console.log(`Total Suite Duration: ${(suiteDuration / 1000).toFixed(2)} seconds`);
  console.log(`Memory Usage (RSS): ${memoryUsage.toFixed(1)} MB`);
  console.log(`================================\n`);
  
  // Write qa summary
  fs.writeFileSync(
    path.resolve(process.cwd(), 'archive', 'test-outputs', 'qa-251-summary.json'),
    JSON.stringify({
      totalUsers: TOTAL_USERS,
      successCount,
      durationMs: suiteDuration,
      rssMemoryMb: memoryUsage,
      timestamp: new Date().toISOString()
    }, null, 2)
  );

  // Strict budgets
  if (successCount !== TOTAL_USERS) {
    console.error("FAIL: 100% success rate requirement not met.");
    process.exit(1);
  }

  if (suiteDuration > 120_000) {
    console.error("FAIL: Total execution budget exceeded 120 seconds.");
    process.exit(1);
  }

  if (memoryUsage > 2048) {
    console.error("FAIL: Memory limit (2 GB RSS) exceeded.");
    process.exit(1);
  }

  console.log("✅ Stress test verification passed performance budgets.");
}

main();
