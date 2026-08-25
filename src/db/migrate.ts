import fs from 'fs';
import path from 'path';
import { getPostgresPool, checkPostgresConnection } from './postgres';

export async function runMigrations(): Promise<{ success: boolean; message: string; tablesCount?: number; appliedMigrations?: string[] }> {
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
    await client.query('BEGIN');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(64) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Get list of already applied migrations
    const appliedRes = await client.query<{ version: string }>(
      `SELECT version FROM _schema_migrations;`
    );
    const appliedSet = new Set(appliedRes.rows.map((r) => r.version));
    const appliedMigrations: string[] = [];

    // 1. Run base schema if 001 not recorded
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    if (!appliedSet.has('001_initial_schema') && fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      await client.query(
        `INSERT INTO _schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING;`,
        ['001_initial_schema']
      );
      appliedMigrations.push('001_initial_schema');
    }

    // 2. Run versioned migrations from migrations directory
    const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const version = path.basename(file, '.sql');
        if (!appliedSet.has(version) && !appliedMigrations.includes(version)) {
          const filePath = path.join(migrationsDir, file);
          const sql = fs.readFileSync(filePath, 'utf8');
          if (sql.trim()) {
            await client.query(sql);
          }
          await client.query(
            `INSERT INTO _schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING;`,
            [version]
          );
          appliedMigrations.push(version);
        }
      }
    }

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
      message: `PostgreSQL schema and migrations applied successfully. (${count} tables in public schema)`,
      tablesCount: count,
      appliedMigrations,
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
