/**
 * POST /api/report/html — Week 10 HTML report
 * POST /api/report/pdf  — PDF via Puppeteer (if available)
 */
import type { Request, Response } from "express";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../../../");

async function getModules() {
  const schema    = await import(join(ROOT, "lib/engine/src-local/api-zod/input-schema.js")).catch(() => ({ validateInputs: (r: unknown) => ({ valid: false, inputs: null, errors: [{ path: "root", message: "schema not found" }] }) }));
  const engine    = await import(join(ROOT, "lib/engine/src/calculate.ts"));
  const narrative = await import(join(ROOT, "lib/engine/src/narrative.ts"));
  const html      = await import(join(ROOT, "lib/engine/src/html-report.ts"));
  return { schema, engine, narrative, html };
}

function mapInputs(i: Record<string,unknown>) {
  return {
    span: i["spanLength"], deckWidth: i["deckWidth"], girderSpacing: i["girderSpacing"],
    girderCount: i["girderCount"], concreteGrade: i["concreteStrength"], steelYieldStrength: i["steelGrade"],
    deckThickness: i["deckThickness"], liveLoadUDL: i["liveLoadUdl"],
    concentratedLoad: (i["liveLoadPoint"] as number) ?? 0, secondMomentArea: i["secondMoment"],
    sectionModulus: i["sectionModulus"], alpha: (i["alpha"] as number) ?? 0.9, correctionK3: (i["correctionK3"] as number) ?? 1.2,
  };
}

export async function handleReportHtml(req: Request, res: Response): Promise<void> {
  try {
    const { schema, engine, narrative, html } = await getModules();
    const validation = schema.validateInputs(req.body);
    if (!validation.valid) { res.status(400).json({ error: "Invalid inputs", details: validation.errors }); return; }
    const result  = engine.calculate(mapInputs(validation.inputs as Record<string,unknown>) as Parameters<typeof engine.calculate>[0]);
    const inputs  = validation.inputs as Record<string,string>;
    const report  = narrative.generateReport(result, inputs["projectCode"] ?? "UNKNOWN", inputs["projectName"] ?? "Bridge Design", inputs["revision"] ?? "R0");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html.renderHtmlReport(report));
  } catch (err) {
    res.status(500).json({ error: "Report generation failed", message: (err as Error).message });
  }
}

export async function handleReportPdf(req: Request, res: Response): Promise<void> {
  try {
    let puppeteer: typeof import("puppeteer") | null = null;
    try { puppeteer = await import("puppeteer"); } catch { /* not installed */ }
    if (!puppeteer) {
      res.status(501).json({ error: "PDF not available", note: "Use /api/report/html and print from browser." });
      return;
    }
    let htmlContent = "";
    const fakeRes = { setHeader: () => {}, send: (s: string) => { htmlContent = s; }, status: () => fakeRes, json: () => {} } as unknown as Response;
    await handleReportHtml(req, fakeRes);
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page    = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A3", landscape: true, printBackground: true });
    await browser.close();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=bridge-report.pdf");
    res.send(Buffer.from(pdf));
  } catch (err) {
    res.status(500).json({ error: "PDF failed", message: (err as Error).message });
  }
}
