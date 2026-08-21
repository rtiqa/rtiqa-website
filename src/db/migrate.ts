import fs from 'fs';
import path from 'path';
import { getPostgresPool, checkPostgresConnection } from './postgres';

export async function runMigrations(): Promise<{ success: boolean; message: string; tablesCount?: number }> {
  const status = await checkPostgresConnection();
  if (!status.connected) {
    return {
      success: false,
      message: `Cannot run migrations: PostgreSQL is not connected (${status.error})`,
    };
  }

  const pool = getPostgresPool();
  if (!pool) {
    return { success: false, message: 'Pool not available' };
  }

  const client = await pool.connect();
  try {
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query('BEGIN');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(64) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Execute the schema DDL (creates tables, indexes, extensions, RLS policies)
    await client.query(schemaSql);

    // Record migration version
    await client.query(`
      INSERT INTO _schema_migrations (version)
      VALUES ('001_initial_schema_and_rls')
      ON CONFLICT (version) DO UPDATE SET executed_at = CURRENT_TIMESTAMP;
    `);

    await client.query('COMMIT');

    // Count created tables
    const tableRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    const count = parseInt(tableRes.rows[0]?.count || '0', 10);

    return {
      success: true,
      message: `PostgreSQL schema and RLS policies applied successfully. (${count} tables in public schema)`,
      tablesCount: count,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return {
      success: false,
      message: `Migration failed: ${(err as Error).message}`,
    };
  } finally {
    client.release();
  }
}

/**
 * Checks the current migration status and latest applied version.
 */
export async function getMigrationStatus(): Promise<{
  migrated: boolean;
  version?: string;
  tablesCount?: number;
  error?: string;
}> {
  const status = await checkPostgresConnection();
  if (!status.connected) {
    return { migrated: false, error: 'Database not connected' };
  }

  const pool = getPostgresPool();
  if (!pool) {
    return { migrated: false, error: 'PostgreSQL connection pool unavailable' };
  }

  try {
    const migRes = await pool.query<{ version: string }>(
      `SELECT version FROM _schema_migrations ORDER BY id DESC LIMIT 1;`
    );
    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`
    );

    const latestVersion = migRes.rows[0]?.version;
    const count = parseInt(countRes.rows[0]?.count || '0', 10);

    return {
      migrated: Boolean(latestVersion),
      version: latestVersion,
      tablesCount: count,
    };
  } catch (err: any) {
    return {
      migrated: false,
      error: err.message,
    };
  }
}

// CLI execution check
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().then((res) => {
    console.log('[Migration Result]:', res);
    process.exit(res.success ? 0 : 1);
  });
}
