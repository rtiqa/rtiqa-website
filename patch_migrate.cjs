const fs = require('fs');
const file = 'src/db/migrate.ts';
let content = fs.readFileSync(file, 'utf8');

const newImports = `import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { getPostgresPool, checkPostgresConnection } from './postgres';`;
content = content.replace(/import fs from 'fs';\nimport path from 'path';\nimport \{ getPostgresPool, checkPostgresConnection \} from '\.\/postgres';/, newImports);

const oldRunMigrations = `export async function runMigrations(): Promise<{
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
      : \`VERCEL_ENV is "\${process.env.VERCEL_ENV || 'local'}" (requires "production")\`;
    return {
      success: true,
      message: \`[Migration]: Skipped. Migrations strictly run only on Vercel Production. (\${reason})\`,
    };
  }

  // 2. فحص الاتصال التمهيدي
  const status = await checkPostgresConnection();
  if (!status.connected) {
    return {
      success: false,
      message: \`Cannot run migrations: PostgreSQL connection failed. (\${status.message || 'Unknown error'})\`,
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
    console.log('[Migration]: Advisory lock acquired successfully.');`;

const newRunMigrations = `export async function runMigrations(): Promise<{
  success: boolean;
  message: string;
  tablesCount?: number;
  appliedMigrations?: string[];
}> {
  const runMigrationsFlag = process.env.RUN_MIGRATIONS === 'true';
  const directUrl = process.env.DIRECT_DATABASE_URL;

  // 1. Explicit Migration Execution Flag
  if (!runMigrationsFlag) {
    return {
      success: true,
      message: \`[Migration]: Skipped. RUN_MIGRATIONS is not "true". Preview environments and local development do not run migrations automatically.\`,
    };
  }

  // 2. Validate Direct Database Connection String
  if (!directUrl) {
    return {
      success: false,
      message: \`Cannot run migrations: RUN_MIGRATIONS is true but DIRECT_DATABASE_URL is missing. Migrations require a direct database connection.\`,
    };
  }

  // 3. Create a dedicated client for migrations using DIRECT_DATABASE_URL
  const client = new pg.Client({
    connectionString: directUrl,
    ssl: process.env.PGSSLMODE === 'require' || directUrl.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : undefined,
  });

  let lockAcquired = false;
  const appliedMigrations: string[] = [];

  try {
    await client.connect();

    // 4. الحصول على Advisory Lock على مستوى الـ Session
    console.log('[Migration]: Acquiring PostgreSQL advisory lock...');
    await client.query('SELECT pg_advisory_lock($1);', [RTIQA_MIGRATION_ADVISORY_LOCK_ID]);
    lockAcquired = true;
    console.log('[Migration]: Advisory lock acquired successfully.');`;

content = content.replace(oldRunMigrations, newRunMigrations);

const oldCatchTx = `    } catch (txError) {
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
        message: \`Migration failed: \${errorMsg}\`,
      };
    }`;
const newCatchTx = `    } catch (txError) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('[Migration Fatal]: Failed to rollback transaction:', rollbackErr);
      }
      const errorMsg = txError instanceof Error ? txError.message : String(txError);
      console.error('[Migration Error]: Transaction failed. Details:', errorMsg);
      return {
        success: false,
        message: \`Migration failed: \${errorMsg}\`,
      };
    }`;
content = content.replace(oldCatchTx, newCatchTx);

const oldFinally = `  } finally {
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
}`;
const newFinally = `  } finally {
    // 7. تحرير القفل وإغلاق الاتصال المباشر
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock($1);', [RTIQA_MIGRATION_ADVISORY_LOCK_ID]);
        console.log('[Migration]: Advisory lock released successfully.');
      } catch (unlockErr) {
        console.error('[Migration Fatal]: Failed to release advisory lock:', unlockErr);
      }
    }

    try {
      await client.end();
      console.log('[Migration]: Client connection closed safely.');
    } catch (endErr) {
      console.error('[Migration Error]: Failed to close client connection:', endErr);
    }
  }
}`;
content = content.replace(oldFinally, newFinally);

fs.writeFileSync(file, content, 'utf8');
console.log('Migration patched successfully');
