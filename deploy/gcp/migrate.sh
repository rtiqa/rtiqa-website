#!/usr/bin/env bash
# =====================================================================
# RTIQA Education Platform - Production Database Migration Job
# Executes src/db/migrate.ts against managed PostgreSQL (Cloud SQL)
# =====================================================================

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[FATAL ERROR]: DATABASE_URL is missing."
  echo "Usage: DATABASE_URL=\"postgresql://user:pass@host:5432/rtiqa?sslmode=require\" bash deploy/gcp/migrate.sh"
  exit 1
fi

echo "====================================================================="
echo " RTIQA PRODUCTION DATABASE MIGRATION EXECUTION"
echo " Target: Managed PostgreSQL (PostgreSQL 16+)"
echo " Engine: src/db/migrate.ts -> src/db/schema.sql"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "====================================================================="

# Execute migration in production mode
NODE_ENV=production npx tsx src/db/migrate.ts

echo "====================================================================="
echo " Migration finished. Verifying migration tracking table..."
echo "====================================================================="
