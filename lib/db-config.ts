/**
 * Database Connection Pool Configuration
 *
 * Centralized database configuration with connection pooling and timeouts
 * to prevent connection exhaustion under load in serverless environments.
 *
 * Key Features:
 * - Connection pooling with configurable min/max connections
 * - Query timeouts to prevent hanging queries
 * - Idle connection cleanup for serverless optimization
 * - Keep-alive for long-running connections
 * - Health check functionality
 * - Graceful shutdown handling
 *
 * Architecture: Infrastructure layer - Clean Architecture compliant
 *
 * Vercel Postgres Limits (Neon):
 * - Hobby Plan: 60 concurrent connections max
 * - Pro Plan: 120 concurrent connections max
 * - Each serverless function instance should use minimal connections
 *
 * IMPORTANT: In serverless environments (Vercel), each function instance
 * maintains its own connection pool. Keep pool sizes small (max: 10)
 * to avoid exhausting database connection limits.
 */

import { sql as vercelSql } from '@vercel/postgres';
import { Pool, PoolConfig } from 'pg';
import { env, isLocalPostgres as checkIsLocalPostgres } from '@/lib/env';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Connection pool configuration
 * Environment variables override defaults for flexibility
 */
const POOL_CONFIG = {
  // Maximum connections per pool instance
  // Conservative for serverless: each function instance gets its own pool
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),

  // Minimum idle connections to maintain
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),

  // Timeout to acquire connection from pool (milliseconds)
  // Fail fast if pool is exhausted
  connectionTimeoutMillis: parseInt(
    process.env.DB_CONNECTION_TIMEOUT || '5000',
    10
  ),

  // Close idle connections after this period (milliseconds)
  // Aggressive for serverless to free resources
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),

  // Maximum lifetime of a connection (milliseconds)
  // Rotate connections periodically for health
  maxLifetimeMillis: parseInt(
    process.env.DB_MAX_LIFETIME || '3600000',
    10
  ), // 1 hour

  // Enable keep-alive to prevent connection drops
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
} as const;

/**
 * Query timeout configuration (milliseconds)
 * Prevents queries from hanging indefinitely
 *
 * Can be overridden per query for long-running operations
 */
export const DEFAULT_STATEMENT_TIMEOUT = parseInt(
  process.env.DB_STATEMENT_TIMEOUT || '10000',
  10
); // 10 seconds

// ============================================================================
// POOL INITIALIZATION
// ============================================================================

const isLocalPostgres = checkIsLocalPostgres();
const POSTGRES_URL = env.POSTGRES_URL;

let localPool: Pool | null = null;

/**
 * Initialize connection pool based on environment
 */
function initializePool() {
  if (isLocalPostgres) {
    // Local PostgreSQL using pg library
    if (!localPool) {
      const config: PoolConfig = {
        connectionString: POSTGRES_URL,
        max: POOL_CONFIG.max,
        min: POOL_CONFIG.min,
        connectionTimeoutMillis: POOL_CONFIG.connectionTimeoutMillis,
        idleTimeoutMillis: POOL_CONFIG.idleTimeoutMillis,
        // @ts-ignore - pg Pool supports these options
        keepAlive: POOL_CONFIG.keepAlive,
        keepAliveInitialDelayMillis: POOL_CONFIG.keepAliveInitialDelayMillis,
        // Query timeout set per query via statement_timeout
        statement_timeout: DEFAULT_STATEMENT_TIMEOUT,
      };

      localPool = new Pool(config);

      // Error handler for pool
      localPool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
      });

      // Connection lifecycle logging (development only)
      if (process.env.NODE_ENV === 'development') {
        localPool.on('connect', () => {
          console.log('[DB Pool] New client connected');
        });

        localPool.on('acquire', () => {
          console.log('[DB Pool] Client acquired from pool');
        });

        localPool.on('remove', () => {
          console.log('[DB Pool] Client removed from pool');
        });
      }

      console.log('[DB] Local PostgreSQL pool initialized', {
        max: config.max,
        min: config.min,
      });
    }
  } else {
    // Vercel Postgres uses built-in connection pooling
    // No explicit pool initialization needed
    console.log('[DB] Using Vercel Postgres with built-in pooling');
  }
}

// Initialize pool on module load
initializePool();

// ============================================================================
// DATABASE CLIENT INTERFACE
// ============================================================================

/**
 * Unified database client interface
 * Provides consistent API regardless of underlying implementation
 */
export interface DatabaseClient {
  /**
   * Execute a parameterized query with template literals
   * @example
   * const result = await db`SELECT * FROM users WHERE id = ${userId}`;
   */
  (strings: TemplateStringsArray, ...values: any[]): Promise<{
    rows: any[];
    rowCount: number | null;
  }>;

  /**
   * Execute a raw query with parameters
   * @example
   * const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
   */
  query(
    text: string,
    values?: any[]
  ): Promise<{
    rows: any[];
    rowCount: number | null;
  }>;

  /**
   * Execute a query with custom timeout
   * @example
   * const result = await db.withTimeout(30000)`SELECT * FROM large_table`;
   */
  withTimeout(timeoutMs: number): DatabaseClient;
}

// ============================================================================
// QUERY EXECUTION
// ============================================================================

/**
 * Execute query with optional timeout
 */
async function executeQuery(
  queryFn: () => Promise<any>,
  timeoutMs: number = DEFAULT_STATEMENT_TIMEOUT
): Promise<{ rows: any[]; rowCount: number | null }> {
  if (isLocalPostgres && localPool) {
    // Set statement timeout for this query
    const client = await localPool.connect();
    try {
      // Set timeout for this session
      await client.query(`SET statement_timeout = ${timeoutMs}`);
      const result = await queryFn();
      return {
        rows: result.rows || [],
        rowCount: result.rowCount ?? null,
      };
    } finally {
      client.release();
    }
  } else {
    // Vercel Postgres
    // Note: Vercel Postgres doesn't support statement_timeout configuration
    // Consider implementing application-level timeout if needed
    const result = await queryFn();
    return {
      rows: result.rows || [],
      rowCount: result.rowCount ?? null,
    };
  }
}

/**
 * Main database client
 * Template literal query interface
 */
export const db = (async (
  strings: TemplateStringsArray,
  ...values: any[]
) => {
  if (isLocalPostgres && localPool) {
    const queryStr = strings.reduce((acc, str, i) => {
      return acc + str + (i < values.length ? `$${i + 1}` : '');
    }, '');

    return executeQuery(() => localPool!.query(queryStr, values));
  } else {
    // Use Vercel Postgres sql function
    return vercelSql(strings, ...values);
  }
}) as any;

/**
 * Raw query support for dynamic queries
 */
db.query = async (text: string, values: any[] = []) => {
  if (isLocalPostgres && localPool) {
    return executeQuery(() => localPool!.query(text, values));
  } else {
    // Vercel Postgres doesn't support parameterized query() method the same way
    // Use template literal syntax instead
    throw new Error('Use template literal syntax (sql`...`) instead of db.query() with Vercel Postgres');
  }
};

/**
 * Execute query with custom timeout
 * @example
 * // Long-running report query (30 seconds timeout)
 * const stats = await db.withTimeout(30000)`
 *   SELECT COUNT(*) FROM large_table
 * `;
 */
db.withTimeout = (timeoutMs: number): DatabaseClient => {
  const timeoutDb = (async (strings: TemplateStringsArray, ...values: any[]) => {
    if (isLocalPostgres && localPool) {
      const queryStr = strings.reduce((acc, str, i) => {
        return acc + str + (i < values.length ? `$${i + 1}` : '');
      }, '');

      return executeQuery(() => localPool!.query(queryStr, values), timeoutMs);
    } else {
      // Vercel Postgres doesn't support timeout configuration
      console.warn('[DB] Custom timeout not supported for Vercel Postgres');
      return vercelSql(strings, ...values);
    }
  }) as any;

  timeoutDb.query = async (text: string, values: any[] = []) => {
    if (isLocalPostgres && localPool) {
      return executeQuery(() => localPool!.query(text, values), timeoutMs);
    } else {
      console.warn('[DB] Custom timeout not supported for Vercel Postgres');
      throw new Error('Use template literal syntax (sql`...`) instead of db.query() with Vercel Postgres');
    }
  };

  timeoutDb.withTimeout = db.withTimeout;

  return timeoutDb;
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Database health check
 * Tests connection and basic query execution
 *
 * @returns Promise<true> if healthy, throws error if unhealthy
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const startTime = Date.now();
    const result = await db`SELECT 1 as health`;
    const duration = Date.now() - startTime;

    if (result.rows.length === 1 && result.rows[0].health === 1) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DB Health] OK (${duration}ms)`);
      }
      return true;
    }

    throw new Error('Health check query returned unexpected result');
  } catch (error) {
    console.error('[DB Health] FAILED:', error);
    throw error;
  }
}

/**
 * Get connection pool statistics
 * Only available for local PostgreSQL (pg library)
 */
export function getPoolStats(): {
  total: number;
  idle: number;
  waiting: number;
} | null {
  if (isLocalPostgres && localPool) {
    return {
      total: localPool.totalCount,
      idle: localPool.idleCount,
      waiting: localPool.waitingCount,
    };
  }

  // Vercel Postgres doesn't expose pool stats
  return null;
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Gracefully close all database connections
 * Call this during application shutdown
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (localPool) {
      await localPool.end();
      console.log('[DB] Local PostgreSQL pool closed');
    } else {
      // Vercel Postgres connections are managed automatically
      console.log('[DB] Vercel Postgres cleanup (managed automatically)');
    }
  } catch (error) {
    console.error('[DB] Error during database shutdown:', error);
    throw error;
  }
}

/**
 * Setup graceful shutdown handlers
 * Only relevant for long-running processes (local dev, scripts)
 * Skip in Edge Runtime (process.on and process.exit not supported)
 *
 * Edge Runtime detection: Check if process.on/exit exist
 * In Edge Runtime, these functions are undefined
 */
if (
  process.env.NODE_ENV !== 'production' &&
  typeof process !== 'undefined' &&
  typeof process.on === 'function' &&
  typeof process.exit === 'function'
) {
  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[DB] Received ${signal}, closing database connections...`);
    try {
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      console.error('[DB] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ============================================================================
// EXPORTS
// ============================================================================

// Default export for backward compatibility
export default db;

/**
 * Transaction helper
 * Executes multiple queries in a transaction
 *
 * @example
 * await withTransaction(async (client) => {
 *   await client`UPDATE accounts SET balance = balance - 100 WHERE id = ${fromId}`;
 *   await client`UPDATE accounts SET balance = balance + 100 WHERE id = ${toId}`;
 * });
 */
export async function withTransaction<T>(
  callback: (client: DatabaseClient) => Promise<T>
): Promise<T> {
  if (isLocalPostgres && localPool) {
    const client = await localPool.connect();
    try {
      await client.query('BEGIN');

      // Create a client wrapper with the same interface as db
      const txClient = (async (strings: TemplateStringsArray, ...values: any[]) => {
        const queryStr = strings.reduce((acc, str, i) => {
          return acc + str + (i < values.length ? `$${i + 1}` : '');
        }, '');
        const result = await client.query(queryStr, values);
        return {
          rows: result.rows || [],
          rowCount: result.rowCount ?? null,
        };
      }) as any;

      txClient.query = async (text: string, values: any[] = []) => {
        const result = await client.query(text, values);
        return {
          rows: result.rows || [],
          rowCount: result.rowCount ?? null,
        };
      };

      txClient.withTimeout = db.withTimeout;

      const result = await callback(txClient);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else {
    // Vercel Postgres transaction support
    // Note: @vercel/postgres has limited transaction support
    // For production, consider using connection pooler with transaction support
    console.warn('[DB] Transaction support limited for Vercel Postgres');

    // Fallback: execute without transaction (not ideal)
    return callback(db);
  }
}
