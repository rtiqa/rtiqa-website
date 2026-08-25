import fs from 'fs';
import path from 'path';
import { getPostgresPool, checkPostgresConnection } from './postgres';

// معرف فريد ثابت لقفل ترحيلات ارتقاء لمنع التنفيذ المتزامن
const RTIQA_MIGRATION_ADVISORY_LOCK_ID = 8274619;

export async function runMigrations(): Promise<{
  success: boolean;
  message: string;
  tablesCount?: number;
  appliedMigrations?: string[];
}> {
  const isVercelProduction = process.env.VERCEL_ENV === 'production';
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  // 1. حظر التنفيذ بشكل قطعي خارج Vercel Production
  if (!isVercelProduction || !hasDatabaseUrl) {
    const reason = !hasDatabaseUrl
      ? 'DATABASE_URL is not configured'
      : `VERCEL_ENV is "${process.env.VERCEL_ENV || 'local'}" (requires "production")`;
    return {
      success: true,
      message: `[Migration]: Skipped. Migrations strictly run only on Vercel Production. (${reason})`,
    };
  }

  // 2. فحص الاتصال التمهيدي
  const status = await checkPostgresConnection();
  if (!status.connected) {
    return {
      success: false,
      message: `Cannot run migrations: PostgreSQL connection failed. (${status.message || 'Unknown error'})`,
    };
  }

  const pool = getPostgresPool();
  if (!pool) {
    return {
      success: false,
      message: 'Cannot run migrations: PostgreSQL pool is not initialized.',
    };
  }

  // 3. حجز Client فردي لضمان تنفيذ القفل والـ DDL على نفس الـ Session
  const client = await pool.connect();
  let lockAcquired = false;
  let clientDestroyRequired = false;
  const appliedMigrations: string[] = [];

  try {
    // 4. الحصول على Advisory Lock على مستوى الـ Session
    console.log('[Migration]: Acquiring PostgreSQL advisory lock...');
    await client.query('SELECT pg_advisory_lock($1);', [RTIQA_MIGRATION_ADVISORY_LOCK_ID]);
    lockAcquired = true;
    console.log('[Migration]: Advisory lock acquired successfully.');

    // 5. كتلة المعاملة البرمجية (Transaction Block)
    try {
      await client.query('BEGIN');

      // إنشاء جدول تتبع الترحيلات
      await client.query(`
        CREATE TABLE IF NOT EXISTS _schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(64) UNIQUE NOT NULL,
          executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      // جلب الترحيلات المطبقة مسبقاً
      const appliedRes = await client.query<{ version: string }>(
        `SELECT version FROM _schema_migrations;`
      );
      const appliedSet = new Set(appliedRes.rows.map((r) => r.version));

      // تطبيق الـ Schema الأساسي (001) إذا لم يسبق تسجيله
      const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
      if (!appliedSet.has('001_initial_schema') && fs.existsSync(schemaPath)) {
        console.log('[Migration]: Applying 001_initial_schema from schema.sql...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        await client.query(
          `INSERT INTO _schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING;`,
          ['001_initial_schema']
        );
        appliedMigrations.push('001_initial_schema');
        console.log('[Migration]: 001_initial_schema applied successfully.');
      }

      // تطبيق الترحيلات التتابعية من مجلد migrations (مثل 002)
      const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs
          .readdirSync(migrationsDir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        for (const file of migrationFiles) {
          const version = path.basename(file, '.sql');
          if (!appliedSet.has(version) && !appliedMigrations.includes(version)) {
            console.log(`[Migration]: Applying ${file}...`);
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
            console.log(`[Migration]: ${file} applied successfully.`);
          }
        }
      }

      // تثبيت المعاملة نهائياً
      await client.query('COMMIT');
      console.log('[Migration]: Transaction committed successfully.');
    } catch (txError) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('[Migration Fatal]: Failed to rollback transaction:', rollbackErr);
        clientDestroyRequired = true;
      }
      const errorMsg = txError instanceof Error ? txError.message : String(txError);
      console.error('[Migration Error]: Transaction failed. Details:', errorMsg);
      return {
        success: false,
        message: `Migration failed: ${errorMsg}`,
      };
    }

    // 6. فحص ما بعد التثبيت (Post-Commit Verification - منفصل تماماً عن الـ Transaction)
    let tablesCount = 0;
    try {
      const tablesRes = await client.query(`
        SELECT COUNT(*)::int as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE';
      `);
      tablesCount = tablesRes.rows[0]?.count || 0;
    } catch (verifyErr) {
      console.warn('[Migration Warning]: Post-commit table count check failed, but migrations are committed successfully.');
    }

    return {
      success: true,
      message: `PostgreSQL schema and migrations committed successfully. (${tablesCount} tables in public schema)`,
      tablesCount,
      appliedMigrations,
    };
  } finally {
    // 7. تحرير القفل أو تدمير الاتصال بالكامل لمنع ترك أي Session معلقة في الـ Pool
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1);', [RTIQA_MIGRATION_ADVISORY_LOCK_ID]);
        console.log('[Migration]: Advisory lock released successfully.');
      } catch (unlockErr) {
        console.error('[Migration Fatal]: Failed to release advisory lock. Destroying client connection to free locks:', unlockErr);
        clientDestroyRequired = true;
      }
    }

    if (clientDestroyRequired) {
      // تمرير true لـ node-postgres يقوم بإغلاق وتدمير الاتصال بدلاً من إعادته للـ Pool
      client.release(true);
      console.log('[Migration]: Client connection destroyed safely.');
    } else {
      client.release();
    }
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
  runMigrations()
    .then((res) => {
      console.log('[Migration Result]:', res);
      if (!res.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration Fatal]:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    });
}
