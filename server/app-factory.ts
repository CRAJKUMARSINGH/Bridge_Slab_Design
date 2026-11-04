import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import apiRoutes from "./api-routes";
import d4Routes from "./d4-routes";
import logger from "./logger";
import {
  buildErrorPayload,
  resolveCorsOrigin,
  securityHeaders,
} from "./security";

export interface AppOptions {
  cors?: boolean;
  logging?: boolean;
  staticServe?: boolean;
}

/**
 * Shared app factory to ensure consistency between dev and prod.
 * Fixes: DRIFT-1, BUG-2, RISK-1.
 */
export function createApp(options: AppOptions = {}) {
  const app = express();

  // Security response headers - applied before any route can answer (P2-W04 T4.4).
  app.use(securityHeaders());

  // CORS - RISK-1 fix: use configurable origins.
  // A wildcard is refused in production (T4.4/KERO-003); see server/security.ts.
  if (options.cors) {
    app.use(cors({
      origin: resolveCorsOrigin(process.env.ALLOWED_ORIGINS, process.env.NODE_ENV),
      credentials: true
    }));
  }

  // Body limits - RISK-1 fix: drop the default from 50mb to 200kb, but keep the
  // workbook-upload route reachable. U-1 (W01 SECURITY.md) found the 10 MB ceiling
  // declared in excel-parser.ts was unreachable because this global parser rejected
  // anything over 200 kB first. The upload path therefore gets its own, larger
  // parser; every other route keeps the small limit.
  const jsonDefault = express.json({ limit: '200kb' });
  const jsonUpload = express.json({ limit: '14mb' });
  app.use((req, res, next) => {
    const isUpload = req.path === '/api/design/upload-excel';
    (isUpload ? jsonUpload : jsonDefault)(req, res, next);
  });
  app.use(express.urlencoded({ extended: false, limit: '200kb' }));

  // Structured logging - DRIFT-1 alignment
  if (options.logging) {
    app.use(pinoHttp({ 
      logger,
      // In dev, we might want to log the response body for API routes
      customProps: (req) => {
        return { isApi: req.url.startsWith('/api') };
      }
    }));
  }

  // Unified health check - BUG-2 fix
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      features: {
        calculations: true,
        excelGeneration: true,
        formulas: '1,482+',
        sheets: 47,
      },
    });
  });

  // Legacy health check (deprecated)
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', note: 'Use /api/health instead' });
  });

  // Mount API routes
  app.use('/api/design', apiRoutes);
  app.use('/api', d4Routes);

  // Serve OpenAPI 3.1 spec — Requirement 8.4
  app.get('/api/openapi.yaml', (_req, res) => {
    try {
      const yaml = readFileSync(join(process.cwd(), 'openapi', 'bridge-suite.yaml'), 'utf-8');
      res.setHeader('Content-Type', 'application/yaml');
      res.send(yaml);
    } catch {
      res.status(404).json({ success: false, error: 'OpenAPI spec not found' });
    }
  });

  // Global error handler — stack traces only in development (P2-W04 T4.5, KERO-002).
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, 'Server error');
    const { status, body } = buildErrorPayload(err, process.env.NODE_ENV);
    res.status(status).json(body);
  });

  return app;
}
