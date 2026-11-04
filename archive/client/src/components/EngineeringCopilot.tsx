import type { CompleteDesignResult, ProjectInput } from '../../../bridge-excel-generator/types';
import { Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type InsightLevel = 'info' | 'ok' | 'warn' | 'alert';

interface Insight {
  level: InsightLevel;
  code: string;
  message: string;
}

function iconFor(level: InsightLevel) {
  if (level === 'ok')    return <CheckCircle2  className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'rgb(16 185 129)' }} />;
  if (level === 'warn')  return <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'rgb(245 158 11)' }} />;
  if (level === 'alert') return <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'rgb(239 68 68)' }} />;
  return <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'rgb(100 116 139)' }} />;
}

function bgFor(level: InsightLevel): string {
  if (level === 'ok')    return 'bg-emerald-500/5 border-emerald-500/20';
  if (level === 'warn')  return 'bg-amber-500/5 border-amber-500/20';
  if (level === 'alert') return 'bg-red-500/5 border-red-500/20';
  return 'bg-white/3 border-white/10';
}

function siltFactor(f: number): string {
  if (f <= 0.9) return 'very fine silt/clay';
  if (f <= 1.2) return 'fine sand';
  if (f <= 1.5) return 'medium sand';
  if (f <= 1.75) return 'coarse sand';
  return 'coarse gravel';
}

function manningDescription(n: number): string {
  if (n <= 0.025) return 'clean natural channel';
  if (n <= 0.033) return 'natural channel with some weeds';
  if (n <= 0.040) return 'irregular channel with heavy vegetation';
  return 'rough, irregular channel';
}

function buildInsights(draft: ProjectInput, results: CompleteDesignResult): Insight[] {
  const hyd  = results.hydraulics;
  const pier = results.pier;
  const abt1 = results.abutmentType1;
  const ins: Insight[] = [];
  const isHL = draft.bridgeType === 'high-level';

  // ── HYDRAULICS ──────────────────────────────────────────────────────────────

  // Flow regime
  const fr = hyd.froudeNumber;
  const isSubcrit = fr < 1;
  ins.push({
    level: isSubcrit ? 'ok' : 'warn',
    code: 'IRC SP-13 Cl. 3.2',
    message: `Froude number Fr = ${fr.toFixed(3)} — ${isSubcrit ? 'subcritical (tranquil) flow; bridge geometry acceptable' : 'supercritical flow detected — verify hydraulic jump location downstream and deck submersion risk'}.`,
  });

  // Afflux
  const affluxLimit = isHL ? 0.50 : 0.30;
  const affluxMargin = ((affluxLimit - hyd.afflux) / affluxLimit * 100).toFixed(0);
  ins.push({
    level: hyd.afflux <= affluxLimit * 0.8 ? 'ok' : hyd.afflux <= affluxLimit ? 'warn' : 'alert',
    code: isHL ? 'IRC:6-2016 Cl. 214.1' : 'IRC SP-13 Cl. 5.3',
    message: `Afflux = ${hyd.afflux.toFixed(3)} m vs limit ${affluxLimit} m — ${hyd.afflux <= affluxLimit ? `${affluxMargin}% margin remaining` : 'EXCEEDS limit — increase waterway or recheck Manning\'s n'}.`,
  });

  // Lacey's waterway
  const laceyW  = 4.75 * Math.sqrt(draft.discharge ?? 0);
  const provided = draft.numberOfSpans * draft.spanLength;
  const pct      = (provided / laceyW * 100).toFixed(1);
  ins.push({
    level: provided >= laceyW * 0.9 ? 'ok' : provided >= laceyW * 0.75 ? 'warn' : 'alert',
    code: 'IRC SP-13 Cl. 4.2',
    message: `Provided waterway ${provided.toFixed(1)} m = ${pct}% of Lacey's regime width ${laceyW.toFixed(1)} m for Q = ${(draft.discharge ?? 0).toFixed(1)} m³/s. ${provided >= laceyW * 0.9 ? 'Compliant ≥ 90%.' : 'Below 90% threshold — add a span or increase span length.'}`,
  });

  // Scour
  const scourDepth = hyd.scourDepth;
  const designScour = hyd.designScourDepth ?? (scourDepth * 2);
  const bed = draft.bedLevel ?? 0;
  const foundLvl = draft.foundationLevel ?? 0;
  const depthBelowScour = bed - scourDepth - foundLvl;
  ins.push({
    level: depthBelowScour >= 2.0 ? 'ok' : depthBelowScour >= 1.2 ? 'warn' : 'alert',
    code: 'IRC:78-1983 Cl. 706.1',
    message: `Normal scour depth = ${scourDepth.toFixed(2)} m; design scour = ${designScour.toFixed(2)} m. Foundation is ${Math.abs(depthBelowScour).toFixed(2)} m ${depthBelowScour >= 0 ? 'below' : 'above (INSUFFICIENT)'} scour level. ${depthBelowScour >= 1.2 ? 'Depth meets code.' : 'Lower foundation level by at least ' + (1.2 - depthBelowScour).toFixed(2) + ' m.'}`,
  });

  // Manning / silt factor
  ins.push({
    level: 'info',
    code: 'IRC SP-13 Table 1 & 2',
    message: `Manning's n = ${draft.manningN ?? 0.033} (${manningDescription(draft.manningN ?? 0.033)}); Lacey silt factor f = ${draft.laceysSiltFactor ?? 1.5} (${siltFactor(draft.laceysSiltFactor ?? 1.5)}). Verify these against site soil report.`,
  });

  // Buoyancy
  const buoy = pier.loads?.buoyancy ?? 0;
  const dl   = pier.loads?.deadLoad ?? 1;
  const buoyPct = (buoy / dl * 100).toFixed(1);
  if (buoy > 0) {
    ins.push({
      level: buoy / dl < 0.25 ? 'ok' : 'warn',
      code: 'IRC:6-2016 Cl. 213.7',
      message: `Pier buoyancy force = ${buoy.toFixed(1)} kN = ${buoyPct}% of dead load. ${buoy / dl < 0.25 ? 'Net downward load maintained — OK.' : 'High buoyancy ratio — check uplift condition in full-buoyancy load case.'}`,
    });
  }

  // Wind force
  const wind = pier.loads?.windForce ?? 0;
  if (wind > 0) {
    ins.push({
      level: 'info',
      code: 'IRC:6-2016 Cl. 209',
      message: `Wind force on pier = ${wind.toFixed(1)} kN included in lateral load combinations. Governing wind pressure per IRC:6-2016 Annex C zone mapping.`,
    });
  }

  // ── STABILITY ───────────────────────────────────────────────────────────────

  // Pier critical case
  const pierCritical = [...pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
  if (pierCritical) {
    const worstSlide = pierCritical.slidingFOS;
    const worstOvert = pierCritical.overturningFOS;
    ins.push({
      level: worstSlide >= 1.5 && worstOvert >= 1.8 ? 'ok' : 'alert',
      code: 'IRC:6-2016 Cl. 202.3',
      message: `Pier critical case: "${pierCritical.description}" — Sliding FOS = ${worstSlide.toFixed(2)} (req ≥ 1.5), Overturning FOS = ${worstOvert.toFixed(2)} (req ≥ 1.8). ${worstSlide >= 1.5 && worstOvert >= 1.8 ? 'All stability checks passed.' : 'FAILS stability — increase base width or add cut-off wall.'}`,
    });
  }

  // Abutment critical
  const abtCritical = [...abt1.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
  if (abtCritical) {
    const ws = abtCritical.slidingFOS;
    const wo = abtCritical.overturningFOS;
    ins.push({
      level: ws >= 1.5 && wo >= 1.8 ? 'ok' : 'alert',
      code: 'IRC:6-2016 Cl. 202.3',
      message: `Abutment critical case: "${abtCritical.description}" — Sliding = ${ws.toFixed(2)}, Overturning = ${wo.toFixed(2)}. ${ws >= 1.5 && wo >= 1.8 ? 'Abutment stable in all cases.' : 'Abutment FAILS — check earth pressure coefficient and base shear key.'}`,
    });
  }

  // ── MATERIALS ────────────────────────────────────────────────────────────────

  // Concrete grade
  const fck = draft.fck ?? 25;
  ins.push({
    level: fck >= 30 ? 'ok' : fck >= 25 ? 'ok' : 'warn',
    code: 'IRC:112-2015 Cl. 14.3.2',
    message: `M${fck} concrete specified. ${fck >= 25 ? 'Meets minimum M25 for moderate exposure (bridge substructure). ' : 'Below minimum — upgrade to M25. '}${fck >= 30 ? 'M30+ gives improved durability for aggressive environments.' : ''}`,
  });

  // Rebar grade
  const fy = draft.fy ?? 415;
  ins.push({
    level: 'info',
    code: 'IS:1786-2008',
    message: `Fe${fy} ${fy >= 500 ? 'HYSD' : 'TMT'} rebar specified. ${fy >= 500 ? 'Fe500D preferred for seismic zones — check elongation ≥ 16% (IS:1786 Table 1).' : 'Fe415 acceptable; Fe500 reduces steel quantum by ~17%.'}`,
  });

  // ── HIGH-LEVEL SPECIFIC ───────────────────────────────────────────────────

  if (isHL) {
    const fb = hyd.freeboardAboveHfl ?? 0;
    const fbReq = hyd.requiredFreeboardAboveHfl ?? 1.2;
    ins.push({
      level: fb >= fbReq ? 'ok' : 'alert',
      code: 'IRC:5-2015 Cl. 106.3',
      message: `Freeboard above HFL = ${fb.toFixed(3)} m vs required ${fbReq.toFixed(2)} m. ${fb >= fbReq ? 'Clearance satisfied — soffit safely above design flood level.' : `Insufficient by ${(fbReq - fb).toFixed(3)} m — raise deck soffit level.`}`,
    });
  }

  // ── GEOMETRY ─────────────────────────────────────────────────────────────────

  // Span geometry insight
  const slenderness = draft.spanLength / Math.max(0.15, 0.15);
  ins.push({
    level: 'info',
    code: 'IRC:112-2015 Cl. 12.3',
    message: `${draft.numberOfSpans}×${draft.spanLength} m = ${provided} m total length across ${draft.numberOfPiers ?? (draft.numberOfSpans - 1)} piers. Effective span / depth ratio should be ≤ 12–16 for solid slabs (IRC:112-2015 Cl. 12.3.1).`,
  });

  return ins;
}

export function EngineeringCopilot({
  draft,
  results,
}: {
  draft: ProjectInput;
  results: CompleteDesignResult;
}) {
  const insights = buildInsights(draft, results);
  const alerts = insights.filter(i => i.level === 'alert').length;
  const warns  = insights.filter(i => i.level === 'warn').length;
  const oks    = insights.filter(i => i.level === 'ok').length;

  return (
    <section className="rounded-2xl border border-[var(--app-glass-border)] bg-app-card/50 p-5 backdrop-blur-sm md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-app-accent" />
          <h3 className="text-base font-semibold text-app-fg">Engineering Co-pilot Insights</h3>
          <span className="rounded-full border border-[var(--app-glass-border)] bg-app-card/70 px-2 py-0.5 text-[10px] text-app-muted">IRC rule-based</span>
        </div>
        <div className="flex gap-3 text-[11px] font-semibold">
          {alerts > 0 && <span style={{ color: 'rgb(239 68 68)' }}>{alerts} action required</span>}
          {warns  > 0 && <span style={{ color: 'rgb(245 158 11)' }}>{warns} review</span>}
          {oks    > 0 && <span style={{ color: 'rgb(16 185 129)' }}>{oks} checks passed</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={`flex gap-2 rounded-xl border p-3 ${bgFor(ins.level)}`}
          >
            {iconFor(ins.level)}
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-semibold text-app-muted">{ins.code} &mdash; </span>
              <span className="text-[11px] text-app-fg leading-relaxed">{ins.message}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
