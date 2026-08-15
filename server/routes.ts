import type { Express } from "express";
import { createServer, type Server } from "http";

/**
 * Wraps the Express app in an HTTP server.
 * All API routes are mounted by `createApp` in `app-factory.ts` at `/api/design`.
 */
export function registerRoutes(app: Express): Server {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      features: {
        calculations: true,
        excelGeneration: true,
        formulas: "1,482+",
        sheets: 47,
      },
    });
  });

  return createServer(app);
}
