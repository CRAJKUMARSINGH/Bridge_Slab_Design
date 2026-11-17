import { PHASE1_QUICK_TEMPLATES, PHASE1_DEFAULT_PROJECT_INPUT } from '../../server/default-project-inputs.ts';
const all: any[] = [...(PHASE1_QUICK_TEMPLATES as any[]), PHASE1_DEFAULT_PROJECT_INPUT];
for (const t of all) {
  const cw = t.carriageWidth, nl = t.numberOfLanes;
  if (cw !== undefined && nl !== undefined && nl * 3.75 > cw * 1.2)
    console.log(`HIT ${t.projectName} | lanes=${nl} cw=${cw} | ${nl * 3.75} > ${cw * 1.2}`);
}
console.log('done', all.length);
