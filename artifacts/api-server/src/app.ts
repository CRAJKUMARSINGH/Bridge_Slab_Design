/**
 * Express app factory — Week 13
 */
import express from "express";
import { correlationId, securityHeaders, largePayloadGuard } from "./lib/auth.js";
import { createRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.use(securityHeaders);
  app.use(correlationId);
  app.use(express.json({ limit: "5mb" }));
  app.use(largePayloadGuard);
  app.use("/", createRouter());
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[unhandled]", err.message);
    res.status(500).json({ error: "Internal server error", message: err.message });
  });
  return app;
}
