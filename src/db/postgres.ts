import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;
let isInitialized = false;

export interface PostgresStatus {
  connected: boolean;
  engine: 'POSTGRESQL' | 'MEMORY';
  connectionUrlConfigured: boolean;
  fallbackToMemory: boolean;
  version?: string;
  error?: string;
  message: string;
}

/**
 * Initializes or returns the PostgreSQL Connection Pool.
 * Uses DATABASE_URL or individual PG* environment variables.
 * In production mode, PostgreSQL is mandatory and must not silently fall back.
 */
export function getPostgresPool(): Pool | null {
  if (pool) return pool;
  if (isInitialized) return null;

  const isProduction = process.env.NODE_ENV === 'production';
  const connectionString = process.env.DATABASE_URL;
  const hasDiscreteConfig = Boolean(process.env.PGHOST && process.env.PGDATABASE);

  if (!connectionString && !hasDiscreteConfig) {
    if (isProduction) {
      console.error('[FATAL PRODUCTION ERROR]: DATABASE_URL is missing in production environment. PostgreSQL is the mandatory production source of truth.');
    }
    isInitialized = true;
    return null;
  }

  try {
    const sslConfig =
      process.env.PGSSLMODE === 'require' || (connectionString && connectionString.includes('sslmode=require'))
        ? { rejectUnauthorized: false }
        : undefined;

    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: sslConfig,
      max: parseInt(process.env.PGMAX_POOL || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
    });

    isInitialized = true;
    return pool;
  } catch (err) {
    console.error('[PostgreSQL Init Error]:', (err as Error).message);
    isInitialized = true;
    return null;
  }
}

/**
 * Asserts PostgreSQL connectivity for production runtime.
 * Throws a descriptive error if running in production without an active PostgreSQL database.
 */
export async function assertProductionPostgres(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return;

  const status = await checkPostgresConnection();
  if (!status.connected) {
    throw new Error(
      `[FATAL PRODUCTION CONFIGURATION ERROR]: Production startup failed because PostgreSQL is unavailable. ` +
      `DATABASE_URL must be configured and point to a healthy PostgreSQL instance. Reason: ${status.error || status.message}`
    );
  }
}

/**
 * Checks connection to PostgreSQL database.
 */
export async function checkPostgresConnection(): Promise<PostgresStatus> {
  const currentPool = getPostgresPool();
  const hasConfig = Boolean(process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGDATABASE));

  if (!currentPool) {
    return {
      connected: false,
      engine: 'MEMORY',
      connectionUrlConfigured: hasConfig,
      fallbackToMemory: true,
      error: hasConfig ? 'Failed to initialize pool' : 'DATABASE_URL not configured',
      message: 'PostgreSQL connection not configured. Running with in-memory multi-tenant storage.',
    };
  }

  try {
    const client = await currentPool.connect();
    try {
      const res = await client.query('SELECT version();');
      const version = res.rows[0]?.version || 'PostgreSQL';
      return {
        connected: true,
        engine: 'POSTGRESQL',
        connectionUrlConfigured: true,
        fallbackToMemory: false,
        version: String(version).split(' on ')[0],
        message: 'Connected successfully to PostgreSQL database with Row-Level Security.',
      };
    } finally {
      client.release();
    }
  } catch (err) {
    return {
      connected: false,
      engine: 'MEMORY',
      connectionUrlConfigured: true,
      fallbackToMemory: true,
      error: (err as Error).message,
      message: `PostgreSQL connection error: ${(err as Error).message}. Operating with in-memory multi-tenant storage.`,
    };
  }
}

/**
 * Executes a callback within a client transaction where PostgreSQL Row-Level Security (RLS)
 * is activated by setting `SET LOCAL app.current_tenant_id = $1`.
 */
export async function withTenantClient<T>(
  tenantId: string | null | undefined,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const currentPool = getPostgresPool();
  if (!currentPool) {
    throw new Error('POSTGRES_POOL_UNAVAILABLE');
  }

  const client = await currentPool.connect();
  try {
    await client.query('BEGIN');
    if (tenantId) {
      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    } else {
      await client.query("SELECT set_config('app.current_tenant_id', '', true)");
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Direct query helper on pool without tenant binding (for migrations, global health, seeds).
 */
export async function queryGlobal<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  const currentPool = getPostgresPool();
  if (!currentPool) {
    throw new Error('POSTGRES_POOL_UNAVAILABLE');
  }
  return currentPool.query<R>(text, params);
}

/**
 * Closes the PostgreSQL connection pool cleanly.
 */
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end().catch(() => {});
    pool = null;
    isInitialized = false;
  }
}
