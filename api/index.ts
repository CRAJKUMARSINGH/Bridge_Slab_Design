/**
 * Vercel Serverless Function entry point.
 *
 * Wraps the Express app so Vercel can invoke it as a serverless function.
 * All /api/* requests are routed here via vercel.json rewrites.
 *
 * Environment variables required (set in Vercel dashboard):
 *   DATABASE_URL   — Neon PostgreSQL connection string
 *   NODE_ENV       — set to "production" automatically
 *   ALLOWED_ORIGINS — comma-separated list of allowed CORS origins (optional)
 */
import { createApp } from '../server/app-factory';

const app = createApp({
  cors: true,
  logging: false, // pino-http is noisy in serverless logs; disable for Vercel
});

export default app;
