const fs = require('fs');
const file = '.env.example';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
# -----------------------------------------------------------------------------
# DATABASE CONFIGURATION
# -----------------------------------------------------------------------------
# RUN_MIGRATIONS: Set to 'true' in Vercel Production to execute schema changes.
RUN_MIGRATIONS=false

# DIRECT_DATABASE_URL: Used ONLY for migrations (src/db/migrate.ts). Must be a direct connection (port 5432).
DIRECT_DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# DATABASE_URL: Used for application runtime (src/db/postgres.ts). Should be a pooled connection (Supavisor port 6543) for Serverless.
DATABASE_URL=postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
`;

content = content.replace(/DATABASE_URL=.*\n/, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('env patched successfully');
