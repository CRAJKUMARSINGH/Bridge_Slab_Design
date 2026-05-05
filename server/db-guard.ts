import type { Request, Response, NextFunction } from 'express';
import { db } from '../shared/db';

/**
 * Express middleware that returns HTTP 503 when the database is not configured
 * (i.e., DATABASE_URL environment variable is not set).
 *
 * Apply this as the first middleware on any router that requires a DB connection.
 */
export function dbGuard(_req: Request, res: Response, next: NextFunction): void {
  if (!db) {
    res.status(503).json({ success: false, error: 'Database not configured' });
    return;
  }
  next();
}
