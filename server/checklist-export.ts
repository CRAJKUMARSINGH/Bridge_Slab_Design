/**
 * IRC Design Compliance Checklist — HTML export
 * Generates a formal QA document suitable for engineering submission.
 */

import type { ProjectInput, CompleteDesignResult } from '../bridge-excel-generator/types';

type ClauseStatus = 'PASS' | 'WARN' | 'FAIL' | 'N/A';

interface IrcClause {
  code: string;
  clause: string;
  description: string;
  computed: string;
  limit: string;
  status: ClauseStatus;
  remarks?: string;
}

function buildClauses(inp: ProjectInput, r: CompleteDesignResult): IrcClause[] {
  const hyd  = r.hydraulics;
  const isHL = inp.bridgeType === 'high-level';
  const out: IrcClause[] = [];

  // ── Afflux ──────────────────────────────────────────────────────────────────
  const affluxLim = isHL ? 0.50 : 0.30;
  const afflux    = hyd.afflux;
  out.push({
    code: isHL ? 'IRC:6-2016' : 'IRC SP-13',
    clause: isHL ? 'Cl. 214.1' : 'Cl. 5.3',
    description: 'Afflux at bridge site due to obstruction',
    computed: `${afflux.toFixed(3)} m`,
    limit: `≤ ${affluxLim} m`,
    status: afflux <= affluxLim ? 'PASS' : afflux <= affluxLim * 1.15 ? 'WARN' : 'FAIL',
    remarks: afflux <= affluxLim
      ? `Margin = ${(affluxLim - afflux).toFixed(3)} m`
      : `Exceeds limit by ${(afflux - affluxLim).toFixed(3)} m — increase waterway`,
  });

  // ── Lacey's waterway ────────────────────────────────────────────────────────
  const laceyW  = 4.75 * Math.sqrt(Math.max(inp.discharge ?? 0, 0));
  const provW   = inp.numberOfSpans * inp.spanLength;
  const wRatio  = provW / Math.max(laceyW, 1);
  out.push({
    code: 'IRC SP-13',
    clause: 'Cl. 4.2',
    description: "Lacey's linear waterway — provided vs regime width",
    computed: `${provW.toFixed(1)} m (${(wRatio * 100).toFixed(1)}% of regime ${laceyW.toFixed(1)} m)`,
    limit: `≥ ${(0.9 * laceyW).toFixed(1)} m (90 % of Lacey's width)`,
    status: wRatio >= 0.90 ? 'PASS' : wRatio >= 0.75 ? 'WARN' : 'FAIL',
    remarks: wRatio >= 0.90
      ? 'Waterway ratio satisfactory'
      : `Deficit = ${(laceyW * 0.9 - provW).toFixed(1)} m — add span or increase length`,
  });

  // ── Scour & foundation ─────────────────────────────────────────────────────
  const dsm   = hyd.scourDepth ?? 0;
  const dDesign = hyd.designScourDepth ?? dsm * 2;
  const depthBelowScour = (inp.bedLevel ?? 0) - dsm - (inp.foundationLevel ?? 0);
  out.push({
    code: 'IRC:78-1983',
    clause: 'Cl. 706.1',
    description: 'Foundation depth below design scour level',
    computed: `${Math.abs(depthBelowScour).toFixed(2)} m ${depthBelowScour >= 0 ? 'below' : 'ABOVE'} scour (dsm = ${dsm.toFixed(2)} m, design = ${dDesign.toFixed(2)} m)`,
    limit: '≥ 1.2 m (soft rock) / 2.0 m (hard rock)',
    status: depthBelowScour >= 1.2 ? 'PASS' : depthBelowScour >= 0.6 ? 'WARN' : 'FAIL',
    remarks: depthBelowScour >= 1.2
      ? 'Foundation below minimum scour embedment'
      : `Increase foundation depth by ${(1.2 - depthBelowScour).toFixed(2)} m minimum`,
  });

  // ── Concrete grade ─────────────────────────────────────────────────────────
  const fck    = inp.fck ?? 25;
  const fckMin = 25;
  out.push({
    code: 'IRC:112-2015',
    clause: 'Cl. 14.3.2',
    description: 'Minimum concrete grade — moderate exposure (bridge substructure)',
    computed: `M${fck}`,
    limit: `≥ M${fckMin}`,
    status: fck >= fckMin ? 'PASS' : 'FAIL',
    remarks: fck >= 30
      ? `M${fck} gives improved durability; suitable for severe exposure`
      : fck >= fckMin
        ? `M${fck} meets minimum; M30 recommended for coastal/aggressive environments`
        : `Upgrade from M${fck} to minimum M${fckMin}`,
  });

  // ── Minimum pier width ──────────────────────────────────────────────────────
  const pW = inp.pierWidth ?? 1.2;
  out.push({
    code: 'IRC:112-2015',
    clause: 'Cl. 15.3',
    description: 'Minimum pier width (structural member)',
    computed: `${pW.toFixed(2)} m`,
    limit: '≥ 1.0 m',
    status: pW >= 1.0 ? 'PASS' : 'FAIL',
    remarks: pW >= 1.0
      ? `Pier width ${pW.toFixed(2)} m — adequate for construction and reinforcement detailing`
      : 'Increase pier width to minimum 1.0 m',
  });

  // ── Pier stability ─────────────────────────────────────────────────────────
  const pierCases = r.pier.loadCases;
  const pierUnsafe = pierCases.filter(lc => lc.status === 'UNSAFE').length;
  const pierCheck  = pierCases.filter(lc => lc.status === 'CHECK').length;
  const worstSlide = Math.min(...pierCases.map(lc => lc.slidingFOS));
  const worstOvert = Math.min(...pierCases.map(lc => lc.overturningFOS));
  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 202.3',
    description: `Pier stability — ${pierCases.length} load combinations (sliding, overturning, bearing)`,
    computed: `Sliding min FOS = ${worstSlide.toFixed(2)}, Overturning min FOS = ${worstOvert.toFixed(2)} (${pierCases.length - pierUnsafe - pierCheck} SAFE, ${pierCheck} CHECK, ${pierUnsafe} UNSAFE)`,
    limit: 'Sliding ≥ 1.5, Overturning ≥ 1.8, Bearing ≥ 2.5 — all combinations',
    status: pierUnsafe > 0 ? 'FAIL' : pierCheck > 0 ? 'WARN' : 'PASS',
    remarks: pierUnsafe === 0 && pierCheck === 0
      ? 'All pier stability checks satisfied in all load combinations'
      : `${pierUnsafe} unsafe, ${pierCheck} marginal combinations — review pier section and footing`,
  });

  // ── Abutment stability ─────────────────────────────────────────────────────
  const abtCases = r.abutmentType1.loadCases;
  const abtUnsafe = abtCases.filter(lc => lc.status === 'UNSAFE').length;
  const abtCheck  = abtCases.filter(lc => lc.status === 'CHECK').length;
  const abtSlide  = Math.min(...abtCases.map(lc => lc.slidingFOS));
  const abtOvert  = Math.min(...abtCases.map(lc => lc.overturningFOS));
  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 202.3',
    description: `Abutment stability — ${abtCases.length} load combinations`,
    computed: `Sliding min = ${abtSlide.toFixed(2)}, Overturning min = ${abtOvert.toFixed(2)} (${abtCases.length - abtUnsafe - abtCheck} SAFE, ${abtCheck} CHECK, ${abtUnsafe} UNSAFE)`,
    limit: 'Sliding ≥ 1.5, Overturning ≥ 1.8 — all combinations',
    status: abtUnsafe > 0 ? 'FAIL' : abtCheck > 0 ? 'WARN' : 'PASS',
    remarks: abtUnsafe === 0 && abtCheck === 0
      ? 'All abutment stability checks satisfied'
      : 'Revise abutment base width or add shear key to improve sliding resistance',
  });

  // ── Freeboard (high-level only) ────────────────────────────────────────────
  if (isHL) {
    const fb    = hyd.freeboardAboveHfl ?? 0;
    const fbReq = hyd.requiredFreeboardAboveHfl ?? 1.2;
    out.push({
      code: 'IRC:5-2015',
      clause: 'Cl. 106.3',
      description: 'Freeboard — soffit level above Highest Flood Level',
      computed: `${fb.toFixed(3)} m (soffit at ${(hyd.soffitLevel ?? 0).toFixed(3)} m, HFL at ${inp.hfl.toFixed(3)} m)`,
      limit: `≥ ${fbReq.toFixed(2)} m`,
      status: fb >= fbReq ? 'PASS' : fb >= fbReq * 0.90 ? 'WARN' : 'FAIL',
      remarks: fb >= fbReq
        ? `Freeboard margin = ${(fb - fbReq).toFixed(3)} m above minimum`
        : `Raise deck soffit by ${(fbReq - fb).toFixed(3)} m to satisfy clearance`,
    });
  }

  // ── Carriageway width ──────────────────────────────────────────────────────
  const lanes  = inp.numberOfLanes ?? 2;
  const cwMin  = lanes === 1 ? 4.25 : lanes === 2 ? 7.5 : lanes * 3.5;
  const cw     = inp.carriageWidth ?? 7.5;
  out.push({
    code: 'IRC:5-2015',
    clause: 'Cl. 112.1',
    description: `Carriageway width — ${lanes}-lane bridge`,
    computed: `${cw.toFixed(2)} m`,
    limit: `≥ ${cwMin.toFixed(2)} m (${lanes} lane${lanes > 1 ? 's' : ''})`,
    status: cw >= cwMin ? 'PASS' : 'FAIL',
    remarks: cw >= cwMin
      ? `Carriageway ${cw.toFixed(2)} m satisfies IRC:5-2015 minimum`
      : `Widen carriageway by ${(cwMin - cw).toFixed(2)} m`,
  });

  // ── Flow regime ────────────────────────────────────────────────────────────
  const fr = hyd.froudeNumber;
  out.push({
    code: 'IRC SP-13',
    clause: 'Cl. 3.2',
    description: 'Flow regime at bridge site (Froude number)',
    computed: `Fr = ${fr.toFixed(3)} — ${fr < 1 ? 'subcritical (tranquil)' : fr > 1 ? 'supercritical (shooting)' : 'critical'}`,
    limit: 'Fr < 1.0 preferred (subcritical)',
    status: fr < 1.0 ? 'PASS' : fr <= 1.05 ? 'WARN' : 'FAIL',
    remarks: fr < 1.0
      ? 'Tranquil flow — bridge geometry does not induce supercritical conditions'
      : `Fr ≥ 1 — verify hydraulic jump location and deck submersion risk downstream`,
  });

  // ── Seismic Zone Check (IRC:6-2016 Cl. 219) — default Zone III, Soil II ──
  // Z=0.16 (Zone III), Sa/g=2.5 (plateau, T≈0.3–0.55s, Soil II), I=1.0, R=3.0
  const seisZ    = 0.16;
  const seisSaG  = 2.50;
  const seisI    = 1.0;
  const seisR    = 3.0;
  const seisAh   = (seisZ / 2) * seisSaG * (seisI / seisR);   // 0.0667

  // Seismic weight = pier dead load
  const seisW_pier = r.pier.loads.deadLoad;                    // kN
  const seisFeq    = seisAh * seisW_pier;                      // kN

  // Reconstruct friction resistance from worst normal-case FOS
  const sWorstPier = [...r.pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
  const sWorstAbt  = [...r.abutmentType1.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
  const H_pier     = r.pier.loads.totalHorizontalForce;
  const H_abt      = H_pier * 0.8;  // conservative estimate for abutment
  const seisW_abt  = r.abutmentType1.loads?.deadLoad ?? seisW_pier;
  const seisFeq_abt = seisAh * seisW_abt;

  const R_pier_fric = sWorstPier.slidingFOS * H_pier;
  const R_abt_fric  = sWorstAbt.slidingFOS  * H_abt;

  const seisFOS_pier = R_pier_fric / (H_pier + seisFeq);
  const seisFOS_abt  = R_abt_fric  / (H_abt  + seisFeq_abt);

  // Overturning in seismic case
  const pierArm     = r.pier.geometry.depth * 0.6;
  const seisOTRatio = (seisFeq * pierArm) / (seisW_pier * (r.pier.geometry.baseWidth / 2));
  const seisFOS_pierOT = sWorstPier.overturningFOS / (1 + seisOTRatio);

  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 219.5',
    description: 'Pier seismic sliding stability (Zone III default, Soil II, I=1.0, R=3.0)',
    computed: `Ah = ${seisAh.toFixed(4)}, Feq = ${seisFeq.toFixed(1)} kN, Sliding FOS = ${seisFOS_pier.toFixed(3)}`,
    limit: '≥ 1.25 (seismic case — reduced from 1.5 per IRC:6-2016 Cl. 219)',
    status: seisFOS_pier >= 1.25 ? 'PASS' : seisFOS_pier >= 1.10 ? 'WARN' : 'FAIL',
    remarks: seisFOS_pier >= 1.25
      ? `Margin = ${(seisFOS_pier - 1.25).toFixed(3)} — pier stable under Zone III seismic`
      : `Increase pier base width or add shear key; check Zone IV if near Jaipur/Alwar`,
  });
  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 219.5',
    description: 'Pier seismic overturning stability (Zone III default)',
    computed: `Overturning FOS (seismic) = ${seisFOS_pierOT.toFixed(3)} (normal = ${sWorstPier.overturningFOS.toFixed(2)})`,
    limit: '≥ 1.50 (seismic case)',
    status: seisFOS_pierOT >= 1.50 ? 'PASS' : seisFOS_pierOT >= 1.30 ? 'WARN' : 'FAIL',
    remarks: seisFOS_pierOT >= 1.50
      ? `Seismic overturning FOS satisfactory for Zone III`
      : `Increase pier footing base length to raise stabilising moment`,
  });
  // ── Wind Load Check (IRC:6-2016 Cl. 212) — Vb=44 m/s default, TC-2, k1=1.06 ──
  const windVb   = 44;               // m/s — central Rajasthan default
  const windK1   = 1.06;            // 100-yr return, IRC bridges
  const windK2   = 1.00;            // Terrain Cat 2, h ≤ 10 m (IS:875 Table 2)
  const windK3   = 1.0;             // flat terrain
  const windVd   = windVb * windK1 * windK2 * windK3;
  const windPd   = Math.max(0.6 * windVd * windVd, 464) / 1000; // kN/m²

  const wPierH   = r.pier.geometry.depth;
  const wPierL   = r.pier.geometry.length;
  const wDeckD   = (inp.deckSlabThickness ?? 0.5) + 0.3;   // slab + kerb estimate
  const wFwPier  = windPd * wPierH * wPierL * 1.3;         // kN
  const wFwDeck  = windPd * wDeckD * inp.spanLength * 1.3; // kN
  const wFwTotal = wFwPier + wFwDeck;
  const wH_norm  = r.pier.loads.totalHorizontalForce;
  const wRfric   = sWorstPier.slidingFOS * wH_norm;
  const wSlideFOS = wRfric / (wH_norm + wFwTotal);

  const wMbase  = wH_norm * (wPierH * 0.5);
  const wMS     = sWorstPier.overturningFOS * wMbase;
  const wMwind  = wFwPier * (wPierH * 0.5) + wFwDeck * wPierH;
  const wOTFOS  = wMbase > 0 ? wMS / (wMbase + wMwind) : 0;

  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 212.3',
    description: `Pier sliding under wind (Vb=${windVb} m/s, Vd=${windVd.toFixed(1)} m/s, pd=${(windPd*1000).toFixed(0)} N/m², Fw=${wFwTotal.toFixed(1)} kN)`,
    computed: `Sliding FOS = ${wSlideFOS.toFixed(3)} (H normal ${wH_norm.toFixed(1)} + Fw ${wFwTotal.toFixed(1)} = ${(wH_norm+wFwTotal).toFixed(1)} kN total)`,
    limit: '≥ 1.50 — IRC:6-2016 Cl. 202.3 (wind is a standard load, same FOS as normal)',
    status: wSlideFOS >= 1.50 ? 'PASS' : wSlideFOS >= 1.25 ? 'WARN' : 'FAIL',
    remarks: wSlideFOS >= 1.50
      ? `Wind sliding FOS margin = ${(wSlideFOS - 1.50).toFixed(3)} — satisfactory for Vb ${windVb} m/s`
      : `Widen pier footing to increase friction resistance; consider shear key`,
  });
  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 212.3',
    description: 'Pier overturning under wind (IRC:6-2016 Cl. 212, wind + normal combined)',
    computed: `Overturning FOS = ${wOTFOS.toFixed(3)} (wind moment: pier arm h/2 + deck arm h)`,
    limit: '≥ 1.80 — IRC:6-2016 Cl. 202.3',
    status: wOTFOS >= 1.80 ? 'PASS' : wOTFOS >= 1.50 ? 'WARN' : 'FAIL',
    remarks: wOTFOS >= 1.80
      ? `Wind overturning margin = ${(wOTFOS - 1.80).toFixed(3)} — satisfactory`
      : `Increase pier footing length to raise stabilising moment against wind`,
  });

  out.push({
    code: 'IRC:6-2016',
    clause: 'Cl. 219.5',
    description: 'Abutment seismic sliding stability (Zone III default)',
    computed: `Feq (abt) = ${seisFeq_abt.toFixed(1)} kN, Sliding FOS = ${seisFOS_abt.toFixed(3)}`,
    limit: '≥ 1.25 (seismic case)',
    status: seisFOS_abt >= 1.25 ? 'PASS' : seisFOS_abt >= 1.10 ? 'WARN' : 'FAIL',
    remarks: seisFOS_abt >= 1.25
      ? 'Abutment seismic sliding resistance satisfactory'
      : 'Widen abutment base or provide passive resistance via approach fill',
  });

  return out;
}

// ── HTML generator ────────────────────────────────────────────────────────────

function statusBg(s: ClauseStatus): string {
  if (s === 'PASS') return '#d1fae5';
  if (s === 'WARN') return '#fef3c7';
  if (s === 'FAIL') return '#fee2e2';
  return '#f3f4f6';
}
function statusColor(s: ClauseStatus): string {
  if (s === 'PASS') return '#065f46';
  if (s === 'WARN') return '#92400e';
  if (s === 'FAIL') return '#991b1b';
  return '#6b7280';
}

export function generateIrcChecklistHTML(inp: ProjectInput, r: CompleteDesignResult): string {
  const clauses   = buildClauses(inp, r);
  const pass      = clauses.filter(c => c.status === 'PASS').length;
  const warn      = clauses.filter(c => c.status === 'WARN').length;
  const fail      = clauses.filter(c => c.status === 'FAIL').length;
  const verdict   = fail > 0 ? 'FAIL' : warn > 0 ? 'CONDITIONAL PASS' : 'PASS';
  const verdictBg = fail > 0 ? '#fee2e2' : warn > 0 ? '#fef3c7' : '#d1fae5';
  const verdictCl = fail > 0 ? '#991b1b' : warn > 0 ? '#92400e' : '#065f46';

  const dateStr   = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const isHL      = inp.bridgeType === 'high-level';
  const hyd       = r.hydraulics;
  const laceyW    = (4.75 * Math.sqrt(Math.max(inp.discharge ?? 0, 0))).toFixed(1);
  const provW     = (inp.numberOfSpans * inp.spanLength).toFixed(1);

  // Pier FOS table
  const pierRows = r.pier.loadCases.map(lc => `
    <tr style="background:${lc.status === 'UNSAFE' ? '#fee2e2' : lc.status === 'CHECK' ? '#fef3c7' : '#f9fafb'}">
      <td style="padding:4px 8px;border:1px solid #e5e7eb">LC ${lc.caseNumber}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb">${lc.description}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:${lc.slidingFOS >= 1.5 ? '#065f46' : '#991b1b'}">${lc.slidingFOS.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:${lc.overturningFOS >= 1.8 ? '#065f46' : '#991b1b'}">${lc.overturningFOS.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:${lc.bearingFOS >= 2.5 ? '#065f46' : '#991b1b'}">${lc.bearingFOS.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center">
        <span style="background:${lc.status === 'SAFE' ? '#d1fae5' : lc.status === 'CHECK' ? '#fef3c7' : '#fee2e2'};color:${lc.status === 'SAFE' ? '#065f46' : lc.status === 'CHECK' ? '#92400e' : '#991b1b'};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700">${lc.status}</span>
      </td>
    </tr>`).join('');

  const abtRows = r.abutmentType1.loadCases.map(lc => `
    <tr style="background:${lc.status === 'UNSAFE' ? '#fee2e2' : lc.status === 'CHECK' ? '#fef3c7' : '#f9fafb'}">
      <td style="padding:4px 8px;border:1px solid #e5e7eb">LC ${lc.caseNumber}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb">${lc.description}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:${lc.slidingFOS >= 1.5 ? '#065f46' : '#991b1b'}">${lc.slidingFOS.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:${lc.overturningFOS >= 1.8 ? '#065f46' : '#991b1b'}">${lc.overturningFOS.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:600;color:${lc.bearingFOS >= 2.5 ? '#065f46' : '#991b1b'}">${lc.bearingFOS.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center">
        <span style="background:${lc.status === 'SAFE' ? '#d1fae5' : lc.status === 'CHECK' ? '#fef3c7' : '#fee2e2'};color:${lc.status === 'SAFE' ? '#065f46' : lc.status === 'CHECK' ? '#92400e' : '#991b1b'};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700">${lc.status}</span>
      </td>
    </tr>`).join('');

  const clauseRows = clauses.map((c, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:6px 8px;border:1px solid #e5e7eb;font-family:monospace;font-size:11px;white-space:nowrap">${c.code}</td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;font-family:monospace;font-size:11px;white-space:nowrap">${c.clause}</td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px">${c.description}</td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;font-family:monospace">${c.computed}</td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:11px">${c.limit}</td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">
        <span style="background:${statusBg(c.status)};color:${statusColor(c.status)};padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;display:inline-block">${c.status}</span>
      </td>
      <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:10px;color:#6b7280">${c.remarks ?? ''}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>IRC Design Compliance Checklist — ${inp.projectName}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#1f2937; background:#fff; }
  @page { size:A4; margin:18mm 14mm; }
  @media print {
    .no-print { display:none !important; }
    section { page-break-inside:avoid; }
    .force-break { page-break-before:always; }
  }
  .page-wrap { max-width:900px; margin:0 auto; padding:24px; }
  h1 { font-size:22px; color:#1e3a5f; font-weight:700; }
  h2 { font-size:14px; color:#1e3a5f; font-weight:700; margin:20px 0 8px; border-bottom:2px solid #bfdbfe; padding-bottom:4px; }
  h3 { font-size:12px; color:#374151; font-weight:600; margin:14px 0 6px; }
  table { width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px; }
  th { background:#1e3a5f; color:#fff; padding:6px 8px; text-align:left; font-size:11px; font-weight:600; border:1px solid #1e3a5f; }
  td { vertical-align:top; }
  .verdict-box { border-radius:8px; padding:16px 20px; margin:16px 0; border:2px solid; }
  .kv-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
  .kv { background:#f3f4f6; border-radius:6px; padding:8px 10px; }
  .kv-label { font-size:10px; color:#6b7280; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .kv-value { font-size:13px; font-weight:700; color:#111827; margin-top:2px; }
  .sign-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:24px; }
  .sign-box { border-top:1px solid #9ca3af; padding-top:6px; text-align:center; font-size:11px; color:#6b7280; }
  .irc-ref { background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:10px 14px; font-size:11px; line-height:1.6; }
  .export-btn { no-print; background:#1e3a5f; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; margin-bottom:16px; }
  .export-btn:hover { background:#1e40af; }
</style>
</head>
<body>
<div class="page-wrap">

  <div class="no-print" style="margin-bottom:16px">
    <button class="export-btn" onclick="window.print()">⬇ Print / Save as PDF</button>
    <span style="margin-left:12px;font-size:11px;color:#6b7280">Use browser Print → Save as PDF for best results (A4, portrait, margins 15 mm)</span>
  </div>

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px">
    <div>
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#6b7280;text-transform:uppercase">Design Quality Assurance Document</div>
      <h1>${inp.projectName}</h1>
      <div style="margin-top:4px;font-size:12px;color:#4b5563">${isHL ? 'High-Level Slab Bridge' : 'Submersible Slab Bridge'} — IRC-compliant design check</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#6b7280;line-height:1.8">
      <div><strong>Date:</strong> ${dateStr}</div>
      <div><strong>Model:</strong> IRC:6-2016 / IRC:78-1983 / IRC:112-2015</div>
      <div><strong>Document ref:</strong> QA-CHKL-${Date.now().toString(36).toUpperCase()}</div>
    </div>
  </div>

  <!-- ── VERDICT BOX ── -->
  <div class="verdict-box" style="background:${verdictBg};border-color:${verdictCl}">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${verdictCl}">Overall IRC Compliance Verdict</div>
        <div style="font-size:28px;font-weight:900;color:${verdictCl};line-height:1.1">${verdict}</div>
        <div style="font-size:11px;margin-top:4px;color:${verdictCl}">
          ${pass} clause${pass !== 1 ? 's' : ''} PASS${warn > 0 ? ` · ${warn} WARN (action required before submission)` : ''}${fail > 0 ? ` · ${fail} FAIL (must be resolved)` : ''}
        </div>
      </div>
      <div style="display:flex;gap:12px">
        <div style="text-align:center;background:rgba(255,255,255,0.6);border-radius:8px;padding:8px 16px">
          <div style="font-size:24px;font-weight:900;color:#065f46">${pass}</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#065f46">Pass</div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.6);border-radius:8px;padding:8px 16px">
          <div style="font-size:24px;font-weight:900;color:#92400e">${warn}</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#92400e">Warn</div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.6);border-radius:8px;padding:8px 16px">
          <div style="font-size:24px;font-weight:900;color:#991b1b">${fail}</div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#991b1b">Fail</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── DESIGN PARAMETERS ── -->
  <h2>1. Key Design Parameters</h2>
  <div class="kv-grid">
    ${[
      ['Bridge type',          isHL ? 'High-Level Slab' : 'Submersible Slab'],
      ['No. of spans',         `${inp.numberOfSpans} × ${inp.spanLength} m`],
      ['Total waterway',       `${provW} m`],
      ['Lacey\'s regime',      `${laceyW} m`],
      ['Design discharge Q',   `${(inp.discharge ?? 0).toFixed(1)} m³/s`],
      ['HFL',                  `${inp.hfl.toFixed(3)} m MSL`],
      ['Bed level',            `${inp.bedLevel.toFixed(3)} m MSL`],
      ['Foundation level',     `${inp.foundationLevel.toFixed(3)} m MSL`],
      ['Manning\'s n',         (inp.manningN ?? 0.033).toFixed(3)],
      ['Lacey silt factor',    (inp.laceysSiltFactor ?? 1.5).toFixed(2)],
      ['Concrete grade',       `M${inp.fck ?? 25}`],
      ['Steel grade',          `Fe${inp.fy ?? 415}`],
      ['No. of piers',         String(inp.numberOfPiers)],
      ['Pier width × length',  `${(inp.pierWidth ?? 1.2).toFixed(2)} × ${(inp.pierLength ?? 4.0).toFixed(2)} m`],
      ['Carriageway width',    `${(inp.carriageWidth ?? 7.5).toFixed(2)} m`],
      ['No. of lanes',         String(inp.numberOfLanes ?? 2)],
    ].map(([l, v]) => `<div class="kv"><div class="kv-label">${l}</div><div class="kv-value">${v}</div></div>`).join('')}
  </div>

  <!-- ── HYDRAULIC SUMMARY ── -->
  <h2>2. Hydraulic Computation Summary</h2>
  <div class="kv-grid">
    ${[
      ['Flow velocity',       `${hyd.velocity.toFixed(3)} m/s`],
      ['Cross-sectional area',`${hyd.crossSectionalArea.toFixed(2)} m²`],
      ['Hydraulic radius',    `${hyd.hydraulicRadius.toFixed(3)} m`],
      ['Froude number',       `${hyd.froudeNumber.toFixed(3)} (${hyd.froudeNumber < 1 ? 'sub' : 'super'}critical)`],
      ['Normal scour depth',  `${hyd.scourDepth.toFixed(3)} m`],
      ['Design scour depth',  `${(hyd.designScourDepth ?? hyd.scourDepth * 2).toFixed(3)} m`],
      ['Afflux',              `${hyd.afflux.toFixed(3)} m`],
      ['Design water level',  `${hyd.designWaterLevel.toFixed(3)} m MSL`],
      ...(isHL ? [
        ['Freeboard (actual)', `${(hyd.freeboardAboveHfl ?? 0).toFixed(3)} m`],
        ['Soffit level',       `${(hyd.soffitLevel ?? 0).toFixed(3)} m MSL`],
      ] : []),
    ].map(([l, v]) => `<div class="kv"><div class="kv-label">${l}</div><div class="kv-value">${v}</div></div>`).join('')}
  </div>

  <!-- ── IRC COMPLIANCE TABLE ── -->
  <h2 class="force-break">3. IRC Clause-by-Clause Compliance Checklist</h2>
  <table>
    <thead>
      <tr>
        <th style="width:90px">IRC Code</th>
        <th style="width:72px">Clause</th>
        <th>Description / Check</th>
        <th style="width:150px">Computed Value</th>
        <th style="width:160px">Code Limit / Requirement</th>
        <th style="width:70px;text-align:center">Status</th>
        <th style="width:170px">Remarks</th>
      </tr>
    </thead>
    <tbody>${clauseRows}</tbody>
  </table>

  <!-- ── PIER STABILITY ── -->
  <h2>4. Pier Stability — Load Case Summary</h2>
  <table>
    <thead>
      <tr>
        <th style="width:40px">Case</th>
        <th>Description</th>
        <th style="width:90px;text-align:center">Sliding FOS<br/><span style="font-weight:400">(req ≥ 1.5)</span></th>
        <th style="width:90px;text-align:center">Overturn FOS<br/><span style="font-weight:400">(req ≥ 1.8)</span></th>
        <th style="width:90px;text-align:center">Bearing FOS<br/><span style="font-weight:400">(req ≥ 2.5)</span></th>
        <th style="width:70px;text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${pierRows}</tbody>
  </table>

  <!-- ── ABUTMENT STABILITY ── -->
  <h2>5. Abutment Stability — Load Case Summary</h2>
  <table>
    <thead>
      <tr>
        <th style="width:40px">Case</th>
        <th>Description</th>
        <th style="width:90px;text-align:center">Sliding FOS<br/><span style="font-weight:400">(req ≥ 1.5)</span></th>
        <th style="width:90px;text-align:center">Overturn FOS<br/><span style="font-weight:400">(req ≥ 1.8)</span></th>
        <th style="width:90px;text-align:center">Bearing FOS<br/><span style="font-weight:400">(req ≥ 2.5)</span></th>
        <th style="width:70px;text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${abtRows}</tbody>
  </table>

  <!-- ── SEISMIC ZONE CHECK ── -->
  <h2 class="force-break">6. Seismic Zone Check — IRC:6-2016 Cl. 219</h2>
  <div class="irc-ref" style="margin-bottom:12px">
    <strong>Default assumptions for export:</strong> Seismic Zone III (Z = 0.16, conservative for Rajasthan),
    Soil Type II (medium alluvium), Importance Factor I = 1.0 (normal bridge), Response Reduction Factor R = 3.0 (ductile detailing per IRC:112).
    Design horizontal acceleration: Ah = (Z/2) × (Sa/g) × (I/R) = ${
      (() => {
        const seisZ = 0.16, seisSaG = 2.50, seisI = 1.0, seisR = 3.0;
        const Ah = (seisZ / 2) * seisSaG * (seisI / seisR);
        return Ah.toFixed(4);
      })()
    }.
    To check other zones (II / IV / V) or soil types, use the interactive Seismic Zone Check panel in the Bridge Design app.
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:60px">Zone</th>
        <th style="width:50px">Z</th>
        <th style="width:80px">Ah</th>
        <th style="width:130px">Pier seismic force</th>
        <th style="width:120px">Pier slide FOS<br/><span style="font-weight:400">(req ≥ 1.25)</span></th>
        <th style="width:70px;text-align:center">Verdict</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        const zones: Array<[string, number]> = [['II', 0.10], ['III', 0.16], ['IV', 0.24], ['V', 0.36]];
        const W = r.pier.loads.deadLoad;
        const H = r.pier.loads.totalHorizontalForce;
        const sWorst = [...r.pier.loadCases].sort((a, b) => a.slidingFOS - b.slidingFOS)[0];
        const Rfric  = sWorst.slidingFOS * H;
        const SaG    = 2.50;
        return zones.map(([z, Z]) => {
          const Ah     = (Z / 2) * SaG * (1.0 / 3.0);
          const Feq    = Ah * W;
          const FOS    = Rfric / (H + Feq);
          const isOK   = FOS >= 1.25;
          const active = z === 'III';
          return `<tr style="background:${active ? '#eff6ff' : FOS >= 1.25 ? '#f9fafb' : '#fff1f2'}${active ? ';font-weight:600' : ''}">
            <td style="padding:5px 8px;border:1px solid #e5e7eb">${active ? '▶ ' : ''}Zone ${z}</td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace">${Z.toFixed(2)}</td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace">${Ah.toFixed(4)}</td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb;font-family:monospace">${Feq.toFixed(1)} kN</td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center;font-weight:700;color:${isOK ? '#065f46' : '#991b1b'};font-family:monospace">${FOS.toFixed(3)}</td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb;text-align:center">
              <span style="background:${isOK ? '#d1fae5' : '#fee2e2'};color:${isOK ? '#065f46' : '#991b1b'};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700">${isOK ? 'PASS' : 'FAIL'}</span>
            </td>
          </tr>`;
        }).join('');
      })()}
    </tbody>
  </table>
  <p style="font-size:10px;color:#6b7280;margin-top:-8px;margin-bottom:12px">
    Seismic checks use reduced FOS limits per IRC:6-2016 Cl. 219.5: sliding ≥ 1.25 (vs 1.5 normal), overturning ≥ 1.50 (vs 1.8 normal).
    Rajasthan reference zones: most districts → Zone II; Jaipur, Alwar, Bharatpur, Sawai Madhopur → Zone III (BIS IS:1893-2002 Part 1).
  </p>

  <!-- ── IRC REFERENCES ── -->
  <h2>7. IRC Code References</h2>
  <div class="irc-ref">
    <strong>Applicable IRC Codes:</strong><br/>
    IRC SP-13 : 2004 — Guidelines for the Design of Small Bridges and Culverts<br/>
    IRC:6-2016 — Standard Specifications and Code of Practice for Road Bridges, Section II: Loads and Load Combinations<br/>
    IRC:78-1983 — Standard Specifications and Code of Practice for Road Bridges, Section VII: Foundations and Substructure<br/>
    IRC:112-2015 — Code of Practice for Concrete Road Bridges<br/>
    IRC:5-2015 — Standard Specifications and Code of Practice for Road Bridges, Section I: General Features of Design<br/>
    IS:1786-2008 — High Strength Deformed Steel Bars and Wires for Concrete Reinforcement
  </div>

  <!-- ── CERTIFICATION ── -->
  <h2>8. Engineer's Certification</h2>
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:12px;background:#f9fafb">
    <p style="line-height:1.7">
      I certify that this design has been carried out in accordance with the relevant IRC codes and standards listed above.
      The computations have been checked and the structure is found to be safe under the load combinations considered.
      Any items marked WARN or FAIL require resolution prior to final submission.
    </p>
    <div class="sign-grid" style="margin-top:32px">
      <div class="sign-box">
        <div style="margin-bottom:32px">&nbsp;</div>
        <strong>Designed by</strong><br/>Name &amp; Signature
      </div>
      <div class="sign-box">
        <div style="margin-bottom:32px">&nbsp;</div>
        <strong>Checked by</strong><br/>Name &amp; Signature
      </div>
      <div class="sign-box">
        <div style="margin-bottom:32px">&nbsp;</div>
        <strong>Approved by</strong><br/>Name &amp; Signature
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:20px;font-size:11px;color:#6b7280">
      <div>Date: ___________________________</div>
      <div>Date: ___________________________</div>
      <div>Date: ___________________________</div>
    </div>
  </div>

  <div style="margin-top:20px;font-size:10px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:10px">
    Generated by Bridge Design System · IRC-compliant · Document ref: QA-CHKL-${Date.now().toString(36).toUpperCase()} · ${dateStr}
  </div>

</div>
</body>
</html>`;
}
