# G-10 — TRAINING, DEMO & COMPETENCY
Prereq: W11 | Feeds: W12A

## CODE — client/src/tour/definition.ts
```ts
export interface TourStep { target: string; title: MsgKey; body: MsgKey; placement: "top" | "bottom" | "left" | "right"; requiredRole?: Role }
export interface Tour { id: string; title: MsgKey; steps: TourStep[]; estMinutes: number }

export const TOURS: Tour[] = [
  { id: "first-run", title: "tour.firstRun", estMinutes: 6, steps: [
    { target: "[data-tour=project-new]", title: "tour.step1.t", body: "tour.step1.b", placement: "bottom" },
    { target: "[data-tour=input-tabs]",  title: "tour.step2.t", body: "tour.step2.b", placement: "right" },
    { target: "[data-tour=validate]",    title: "tour.step3.t", body: "tour.step3.b", placement: "top" },
    { target: "[data-tour=checks]",      title: "tour.step4.t", body: "tour.step4.b", placement: "left" },
    { target: "[data-tour=report]",      title: "tour.step5.t", body: "tour.step5.b", placement: "left" },
    { target: "[data-tour=export]",      title: "tour.step6.t", body: "tour.step6.b", placement: "top" },
  ]},
  { id: "reviewer", title: "tour.reviewer", estMinutes: 4, steps: [
    { target: "[data-tour=trace]",    title: "tour.r1.t", body: "tour.r1.b", placement: "right", requiredRole: "reviewer" },
    { target: "[data-tour=stamp]",    title: "tour.r2.t", body: "tour.r2.b", placement: "top",    requiredRole: "reviewer" },
    { target: "[data-tour=conflict]", title: "tour.r3.t", body: "tour.r3.b", placement: "bottom", requiredRole: "reviewer" },
  ]},
];
```

## CODE — client/src/tour/useTour.ts
```ts
export function useTour(id: string) {
  const [step, setStep] = useState(0);
  const tour = TOURS.find(t => t.id === id)!;
  const steps = tour.steps.filter(s => !s.requiredRole || hasRole(s.requiredRole));
  const rect = useTargetRect(steps[step]?.target);
  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));
  const done = () => { setStep(0); markSeen(id); };
  useHotkeys({ ArrowRight: next, ArrowLeft: prev, Escape: done });
  return { tour, steps, step, rect, next, prev, done, active: !seen(id) };
}
```

## CODE — scripts/seed-demo.ts
```ts
// one command produces a demo-ready workspace with 3 golden projects, 1 failed check,
// 1 REVIEW item, 1 stale report and 1 conflict — so training covers the unhappy paths.
await seedUser({ email: "demo@pwd.gov.in", role: "engineer" });
await seedProject("SOM-KHW", { loadFromCorpus: true });
await seedProject("SOM-LAR", { loadFromCorpus: true });
await seedProject("BED-HL",  { loadFromCorpus: true, skewDeg: 30 });
await seedScenario("FAILED_CHECK", { project: "SOM-KHW", check: "DEFLECTION" });
await seedScenario("REVIEW_ITEM",  { project: "SOM-LAR", defect: "D-12" });
await seedScenario("STALE_REPORT", { project: "SOM-KHW", reason: "engine minor bump" });
```

## Deliverables
`docs/phase-2/week-11/DEMO-SCRIPT.md` (10 minutes, timed),
`docs/phase-2/week-11/TRAINING.md` (role-based, 4 roles),
`docs/phase-2/week-11/COMPETENCY-CHECKLIST.md` (can the user do X unaided),
`docs/phase-2/week-11/FAQ.md`, and a 90-second video script.

## Exit gate
[ ] Two tours, keyboard operable, dismissible, per-user persistence
[ ] Every one of the 20+ export buttons has contextual help
[ ] seed-demo produces the unhappy-path scenarios in one command
[ ] Demo script runs in 10 minutes and hits all three bridge families
[ ] Competency checklist has an observed-pass column
