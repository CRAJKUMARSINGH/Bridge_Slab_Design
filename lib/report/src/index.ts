import type { BridgeCalculationResult } from "@workspace/engine";
import { buildNarrative } from "@workspace/narrative";

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function format(value: number | string | boolean, digits = 3): string {
  if (typeof value !== "number") return String(value);
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function renderHtmlReport(result: BridgeCalculationResult): string {
  const chapters = buildNarrative(result);
  const statusClass = result.overallStatus === "PASS" ? "pass" : "fail";
  const constraintRows = result.constraints
    .map(
      (constraint) => `
        <tr class="${constraint.status === "PASS" ? "pass" : "fail"}">
          <td>${escapeHtml(constraint.label)}</td>
          <td>${escapeHtml(format(constraint.value))}</td>
          <td>${escapeHtml(constraint.inequality)}</td>
          <td>${escapeHtml(constraint.status)}</td>
          <td>${escapeHtml(constraint.sourceCell)}</td>
        </tr>`,
    )
    .join("");
  const traceRows = result.traceRecords
    .map(
      (record) => `
        <tr>
          <td>${escapeHtml(record.label)}</td>
          <td>${escapeHtml(format(record.value))}</td>
          <td>${escapeHtml(record.units)}</td>
          <td>${escapeHtml(record.sourceCell ?? "")}</td>
          <td>${escapeHtml(record.formula ?? record.source ?? "")}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(result.project.projectName)} — Draft design report</title>
  <style>
    @page { size: A4 landscape; margin: 16mm 14mm 16mm; }
    :root { color-scheme: light; font-family: Georgia, "Times New Roman", serif; color: #1d2b2f; background: #f4f1ea; }
    body { margin: 0; background: #f4f1ea; }
    main { max-width: 1200px; margin: 0 auto; padding: 42px 52px 72px; background: #fffdf8; }
    header { border-bottom: 4px solid #b56d3c; padding-bottom: 24px; margin-bottom: 28px; }
    .eyebrow { color: #b56d3c; font: 700 12px/1.2 Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 10px 0 8px; font: 700 34px/1.05 Georgia, serif; }
    h2 { margin: 30px 0 12px; color: #244b51; font: 700 22px/1.15 Georgia, serif; break-after: avoid; }
    p { max-width: 940px; font-size: 15px; line-height: 1.65; }
    .meta { color: #5d6a6c; font: 13px/1.5 Arial, sans-serif; }
    .status { display: inline-block; margin-top: 16px; padding: 8px 13px; border-radius: 999px; font: 700 12px Arial, sans-serif; letter-spacing: .08em; }
    .status.pass, tr.pass td:last-child { color: #135d42; background: #dff2e8; }
    .status.fail, tr.fail td:last-child { color: #8a301d; background: #f8dfd8; }
    .callout { border-left: 4px solid #b56d3c; background: #f4eee5; padding: 12px 16px; margin: 18px 0; font: 13px/1.5 Arial, sans-serif; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0 26px; font: 12px/1.35 Arial, sans-serif; break-inside: avoid; }
    th { text-align: left; color: #fffdf8; background: #244b51; padding: 9px 8px; }
    td { border-bottom: 1px solid #e3ded3; padding: 8px; vertical-align: top; }
    tr.fail td { background: #fff0eb; }
    section { break-inside: avoid; }
    .trace td, .trace th { font-size: 10px; }
    footer { margin-top: 42px; border-top: 1px solid #d9d1c4; padding-top: 14px; color: #6b7778; font: 11px/1.45 Arial, sans-serif; }
    @media print { main { max-width: none; padding: 0; } body { background: #fffdf8; } }
  </style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow">Bridge Report Studio · ${escapeHtml(result.reviewStatus)}</div>
    <h1>${escapeHtml(result.project.projectName)}</h1>
    <div class="meta">Project ${escapeHtml(result.project.projectCode)} · Revision ${escapeHtml(result.project.revision)} · Schema ${escapeHtml(result.schemaVersion)}</div>
    <div class="status ${statusClass}">OVERALL ${escapeHtml(result.overallStatus)} · ${result.failedChecks.length} FAILED CHECK${result.failedChecks.length === 1 ? "" : "S"}</div>
  </header>
  <div class="callout"><strong>Review notice.</strong> This report is a draft calculation record. Failed checks remain visible and must be resolved or accepted by a qualified engineer. Excel remains the parity reference until an approved canonical workbook is selected.</div>
  ${chapters
    .map(
      (chapter) => `
        <section>
          <h2>${escapeHtml(chapter.title)}</h2>
          ${chapter.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </section>`,
    )
    .join("")}
  <section>
    <h2>Constraint register</h2>
    <table>
      <thead><tr><th>Check</th><th>Value</th><th>Inequality</th><th>Status</th><th>Source</th></tr></thead>
      <tbody>${constraintRows}</tbody>
    </table>
  </section>
  <section>
    <h2>Calculation trace</h2>
    <table class="trace">
      <thead><tr><th>Field</th><th>Value</th><th>Units</th><th>Source cell</th><th>Formula / provenance</th></tr></thead>
      <tbody>${traceRows}</tbody>
    </table>
  </section>
  <footer>
    Software-calculated draft only. This record states what the migrated formula path calculated, what it did not assess, and what a qualified engineer must confirm before reliance.
  </footer>
</main>
</body>
</html>`;
}