#!/usr/bin/env bash
# =====================================================================
# RTIQA Education Platform - Google Cloud Production Setup Script
# Target: Cloud Run, Cloud SQL (PostgreSQL 16), Secret Manager, Artifact Registry
# =====================================================================

set -euo pipefail

# Mandatory Environment Variables Check
if [ -z "${PROJECT_ID:-}" ]; then
  echo "[ERROR] PROJECT_ID environment variable is required."
  echo "Usage: PROJECT_ID=my-gcp-project REGION=europe-west1 bash deploy/gcp/setup.sh"
  exit 1
fi

REGION="${REGION:-europe-west1}"
DB_INSTANCE_NAME="${DB_INSTANCE_NAME:-rtiqa-db-primary}"
DB_NAME="${DB_NAME:-rtiqa}"
DB_USER="${DB_USER:-rtiqa_app_user}"
REPO_NAME="${REPO_NAME:-rtiqa-repo}"
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-rtiqa-cloudrun-sa}"

echo "====================================================================="
echo " RTIQA GCP INFRASTRUCTURE SETUP"
echo " Project:          $PROJECT_ID"
echo " Region:           $REGION"
echo " Database Instance: $DB_INSTANCE_NAME"
echo " Service Account:  $SERVICE_ACCOUNT_NAME"
echo "====================================================================="

# 1. Set Google Cloud Project
gcloud config set project "$PROJECT_ID"

# 2. Enable Required Google Cloud APIs
echo "[1/7] Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  iam.googleapis.com

# 3. Create Artifact Registry Repository
echo "[2/7] Creating Artifact Registry repository..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Rtiqa Production Docker Images"
  echo "Artifact Registry repository created."
else
  echo "Artifact Registry repository already exists."
fi

# 4. Create Dedicated Service Account
echo "[3/7] Creating Cloud Run Service Account..."
SA_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$SA_EMAIL" &>/dev/null; then
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="Rtiqa Cloud Run Runtime SA"
  echo "Service account created."
else
  echo "Service account already exists."
fi

# 5. Grant IAM Roles to Service Account
echo "[4/7] Granting IAM permissions to service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.client" --condition=None >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" --condition=None >/dev/null

# 6. Create Cloud SQL PostgreSQL 16+ Instance
echo "[5/7] Provisioning Cloud SQL PostgreSQL 16 Instance..."
if ! gcloud sql instances describe "$DB_INSTANCE_NAME" &>/dev/null; then
  echo "Creating instance $DB_INSTANCE_NAME (this may take 5-10 minutes)..."
  gcloud sql instances create "$DB_INSTANCE_NAME" \
    --database-version=POSTGRES_16 \
    --tier=db-custom-2-7680 \
    --region="$REGION" \
    --storage-size=20GB \
    --storage-auto-increase \
    --storage-type=SSD \
    --backup-start-time=02:00 \
    --enable-point-in-time-recovery \
    --database-flags=cloudsql.iam_authentication=on,max_connections=250 \
    --ssl-mode=ENCRYPTED_ONLY
  echo "Cloud SQL instance provisioned."
else
  echo "Cloud SQL instance already exists."
fi

# 7. Create Database and Dedicated App User
echo "[6/7] Configuring Database & Dedicated User..."
if ! gcloud sql databases describe "$DB_NAME" --instance="$DB_INSTANCE_NAME" &>/dev/null; then
  gcloud sql databases create "$DB_NAME" --instance="$DB_INSTANCE_NAME"
  echo "Database '$DB_NAME' created."
fi

if ! gcloud sql users list --instance="$DB_INSTANCE_NAME" | grep -q "$DB_USER"; then
  echo "Generating random password for $DB_USER..."
  DB_PASS=$(openssl rand -base64 32)
  gcloud sql users create "$DB_USER" \
    --instance="$DB_INSTANCE_NAME" \
    --password="$DB_PASS"
  echo "User '$DB_USER' created. Securely store password in Secret Manager."
fi

# 8. Setup Secret Manager Secrets Placeholders
echo "[7/7] Initializing Secret Manager placeholders..."
SECRETS=(
  "rtiqa-database-url"
  "rtiqa-auth-secret"
  "rtiqa-r2-bucket"
  "rtiqa-r2-endpoint"
  "rtiqa-r2-access-key-id"
  "rtiqa-r2-secret-access-key"
  "rtiqa-gemini-api-key"
  "rtiqa-form-webhook-url"
)

for secret in "${SECRETS[@]}"; do
  if ! gcloud secrets describe "$secret" &>/dev/null; then
    gcloud secrets create "$secret" --replication-policy="automatic"
    echo "Secret '$secret' created. (Add version with real value via 'gcloud secrets versions add $secret --data-file=...')"
  else
    echo "Secret '$secret' already exists."
  fi
done

echo "====================================================================="
echo " SETUP COMPLETED SUCCESSFULLY."
echo " Next Steps:"
echo " 1. Populate secrets in Secret Manager (AUTH_SECRET, R2 credentials, DATABASE_URL)"
echo " 2. Run database migrations: bash deploy/gcp/migrate.sh"
echo " 3. Build & Deploy to Cloud Run"
echo "====================================================================="
