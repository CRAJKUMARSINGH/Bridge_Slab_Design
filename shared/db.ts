import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Drizzle ORM client singleton.
 * Exported as `null` when DATABASE_URL is not set so the server can start
 * without a database connection and return 503 from DB-dependent routes.
 */
export const db = DATABASE_URL
  ? drizzle(neon(DATABASE_URL), { schema })
  : null;

/**
 * Returns the db client or throws a 503 error if DATABASE_URL is not set.
 * Use this inside route handlers that require a database connection.
 */
export function requireDb() {
  if (!db) {
    throw Object.assign(new Error('Database not configured'), { status: 503 });
  }
  return db;
}

export type Db = NonNullable<typeof db>;
