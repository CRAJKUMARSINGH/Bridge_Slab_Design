import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // Health check endpoint
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

  const httpServer = createServer(app);
  return httpServer;
}
