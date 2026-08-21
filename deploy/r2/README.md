# RTIQA — Cloudflare R2 Production Storage Setup

## 1. Overview
Rtiqa utilizes **Cloudflare R2** for multi-tenant private file storage. The service interacts with R2 through the existing `S3StorageProvider` implementation (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`).

## 2. Bucket Creation & Privacy
1. Log into Cloudflare Dashboard -> **R2 Object Storage**.
2. Create Bucket: `rtiqa-production-storage`.
3. **Public Access:** Ensure "Allow Public Access" is **Disabled** (Default).
4. **Location Hint:** Choose closest region or `auto`.

## 3. CORS Configuration
Add the following CORS policy to `rtiqa-production-storage` in Cloudflare R2:
```json
[
  {
    "AllowedOrigins": [
      "https://rtiqa.com",
      "https://www.rtiqa.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Authorization",
      "x-amz-date",
      "x-amz-content-sha256",
      "x-amz-user-agent"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

## 4. API Token Generation (Least Privilege)
1. Navigate to **R2 -> Manage R2 API Tokens** -> **Create API Token**.
2. **Permissions:** `Object Read & Write` (scoped to `rtiqa-production-storage` bucket only).
3. **TTL:** Permanent or periodic rotation.
4. Record credentials into Google Secret Manager:
   - `S3_ENDPOINT`: `https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `S3_ACCESS_KEY_ID`: `<R2_ACCESS_KEY_ID>`
   - `S3_SECRET_ACCESS_KEY`: `<R2_SECRET_ACCESS_KEY>`
   - `S3_BUCKET`: `rtiqa-production-storage`
   - `S3_REGION`: `auto`
   - `S3_FORCE_PATH_STYLE`: `false`
