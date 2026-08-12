/**
 * HTML report renderer — landscape A3, print-ready — Week 10
 */
import type { DesignReport } from "./narrative.js";

const CSS = `
@page{size:A3 landscape;margin:20mm 18mm}
body{font-family:"Segoe UI",Arial,sans-serif;font-size:10pt;color:#222}
h1{font-size:16pt;color:#1a3a5c;border-bottom:2pt solid #1a3a5c;padding-bottom:4pt}
h2{font-size:13pt;color:#1a3a5c;margin-top:18pt}
h3{font-size:11pt;color:#2c5f8a;margin-top:12pt}
.cover{page-break-after:always}.chapter{page-break-before:auto}
.section p{white-space:pre-wrap;line-height:1.5}
.pass{color:#1a7a3a;font-weight:bold}.fail{color:#b20000;font-weight:bold}
.banner{background:#fff3cd;border:1pt solid #ffc107;padding:6pt 10pt;margin-bottom:16pt;font-weight:bold}
.meta{border-collapse:collapse;width:100%;margin-bottom:14pt}
.meta td,.meta th{border:0.5pt solid #ccc;padding:4pt 8pt}
.meta th{background:#e9f0f8}
.failed-list{background:#fff0f0;border-left:3pt solid #b20000;padding:6pt 12pt}
@media screen{body{max-width:1100px;margin:auto;padding:20px}}
`;

const esc=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const badge=(s:string)=>`<span class="${s==="PASS"?"pass":"fail"}">${s}</span>`;

export function renderHtmlReport(report: DesignReport): string {
  const failBanner = report.failedChecks.length > 0
    ? `<div class="failed-list"><strong>Failed checks (must not be disregarded):</strong><ul>${report.failedChecks.map(f=>`<li>${esc(f)}</li>`).join("")}</ul></div>`
    : "";
  const chaptersHtml = report.chapters.map(ch=>
    `<div class="chapter"><h2>${esc(ch.title)}</h2>${ch.sections.map(s=>
      `<div class="section"><h3>${esc(s.heading)}</h3><p>${esc(s.body)}</p></div>`
    ).join("")}</div>`
  ).join("");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${esc(report.projectCode)} — Bridge Design Report</title>
<style>${CSS}</style></head><body>
<div class="cover">
<h1>Bridge Slab Design Report</h1>
<div class="banner">⚠ ${esc(report.reviewState.toUpperCase())} — Not approved for engineering reliance until licensed-engineer review is recorded.</div>
<table class="meta">
<tr><th>Project Code</th><td>${esc(report.projectCode)}</td><th>Revision</th><td>${esc(report.revision)}</td></tr>
<tr><th>Project Name</th><td colspan="3">${esc(report.projectName)}</td></tr>
<tr><th>Status</th><td>${badge(report.overallStatus)}</td><th>Generated</th><td>${esc(report.generatedAt)}</td></tr>
<tr><th>Engine</th><td>${esc(report.engineVersion)}</td><th>Fingerprint</th><td><code>${esc(report.inputFingerprint)}</code></td></tr>
</table>${failBanner}</div>
${chaptersHtml}
</body></html>`;
}
