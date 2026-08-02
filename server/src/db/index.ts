import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema, logger: process.env.NODE_ENV === 'development' });

export type DB = typeof db;

// Ensure email_assistant schema exists
export async function initSchema() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS email_assistant`);
  console.log('[DB] email_assistant schema ready');
}

export { pool };
