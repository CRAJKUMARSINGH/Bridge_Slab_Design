/**
 * Netlify Function entry point — Bridge Design Suite API
 *
 * Uses @netlify/functions serverless-http adapter to wrap the Express app.
 * All /api/* requests are proxied here via netlify.toml redirects.
 *
 * Environment variables (set in Netlify dashboard → Site settings → Env vars):
 *   DATABASE_URL      Neon PostgreSQL connection string
 *   NODE_ENV          production
 *   ALLOWED_ORIGINS   https://your-site.netlify.app
 */
import serverless from 'serverless-http';
import { createApp } from '../../server/app-factory';

const app = createApp({
  cors: true,
  logging: false,
});

// serverless-http wraps Express for AWS Lambda / Netlify Functions
export const handler = serverless(app);
