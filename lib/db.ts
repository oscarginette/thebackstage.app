/**
 * Database connection wrapper
 * Supports both Vercel Postgres (Neon) and local PostgreSQL
 */

import { sql as vercelSql } from '@vercel/postgres';
import { Pool } from 'pg';

const POSTGRES_URL = process.env.POSTGRES_URL;

// Check if we're using local PostgreSQL (no password in URL)
const isLocalPostgres = POSTGRES_URL && !POSTGRES_URL.includes(':@') && !POSTGRES_URL.includes('neon.tech');

let localPool: Pool | null = null;

if (isLocalPostgres) {
  localPool = new Pool({
    connectionString: POSTGRES_URL,
  });
}

/**
 * SQL template tag for database queries
 * Automatically uses local pg or Vercel Postgres based on connection string
 */
export const sql = (async (strings: TemplateStringsArray, ...values: any[]) => {
  if (isLocalPostgres && localPool) {
    const queryStr = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '');
    }, '');

    const result = await localPool.query(queryStr, values);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
    };
  } else {
    return vercelSql(strings, ...values);
  }
}) as any;

/**
 * Raw query support for dynamic queries
 */
sql.query = async (text: string, values: any[]) => {
  if (isLocalPostgres && localPool) {
    const result = await localPool.query(text, values);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
    };
  } else {
    // For Vercel, we need to use the raw query method if available or fallback
    // @vercel/postgres doesn't expose a simple .query(text, values) on the default export
    // but the underlying pool/client does. For now, we'll use localPool if available or error.
    if (!isLocalPostgres) {
        // vercelSql has a .query method for raw queries
        return (vercelSql as any).query(text, values);
    }
    
    throw new Error('Database query method not supported in this environment');
  }
};

export default sql;
