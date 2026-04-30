import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import apiRoutes from "./api-routes";
import logger from "./logger";

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

  // CORS - RISK-1 fix: use configurable origins
  if (options.cors) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    app.use(cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true
    }));
  }

  // Body limit - RISK-1 fix: drop from 50mb to 200kb
  app.use(express.json({ limit: '200kb' }));
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

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    logger.error({ err }, 'Server error');
    
    res.status(status).json({ 
      success: false, 
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  return app;
}
