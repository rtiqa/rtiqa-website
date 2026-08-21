# RTIQA — Cloud Run Production Deployment Guide

## 1. Overview
The RTIQA education platform runs as a stateless containerized service on **Google Cloud Run**, connecting to **Google Cloud SQL for PostgreSQL 16+** (via Cloud SQL Auth Proxy / native Unix domain socket) and **Cloudflare R2** for S3-compatible private object storage.

## 2. Resource Sizing & Concurrency
- **CPU Limits:** 1 vCPU (`1000m`), 500m request
- **RAM Limits:** 1 GiB (`1024Mi`), 512 MiB request
- **Container Concurrency:** 80 concurrent requests per instance
- **Min Instances:** 1 (eliminates cold starts during active school hours)
- **Max Instances:** 10 (caps maximum database pool connections to `10 * 20 = 200`, well within Cloud SQL db-custom-2-7680 limits)
- **Ingress Port:** 3000

## 3. Deployment Workflow
1. Build and push container to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag europe-west1-docker.pkg.dev/$PROJECT_ID/rtiqa-repo/rtiqa-app:$VERSION
   ```
2. Apply database migrations before deploying new code (see `deploy/gcp/migrate.sh`).
3. Deploy updated service descriptor:
   ```bash
   gcloud run services replace deploy/cloudrun/service.yaml --region europe-west1
   ```
4. Verify deployment health:
   ```bash
   curl -f https://<SERVICE_URL>/api/health
   ```
