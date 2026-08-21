import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createApp } from '../server.ts';
import { StorageService } from '../server/platform/storage/service.ts';
import { S3StorageProvider } from '../server/platform/storage/s3Provider.ts';

describe('Rtiqa Infrastructure Foundation & Deployment Readiness Test Suite', () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  const orgAId = 'org_horizon_001';
  const orgBId = 'org_elite_002';
  let tokenTeacherA: string;
  let tokenTeacherB: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SECRET = 'test_secret_key_32_characters_long_rtiqa_2026';
    app = await createApp();

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Obtain token for Teacher in Org A
    const resA = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
    });
    const dataA = (await resA.json()) as any;
    tokenTeacherA = dataA.token;

    // Obtain token for Teacher in Org B
    const resB = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'elite' }),
    });
    const dataB = (await resB.json()) as any;
    tokenTeacherB = dataB.token;
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  // =========================================================================
  // 1. Health & Readiness Observability Gate
  // =========================================================================
  describe('1. Health and Readiness Observability', () => {
    it('serves /api/health with structured diagnostic data without exposing secrets', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = (await res.json()) as any;

      assert.equal(data.status, 'ok');
      assert.equal(data.service, 'rtiqa-api-gateway');
      assert.ok(typeof data.uptimeSeconds === 'number');
      assert.ok(data.timestamp);

      // Database health
      assert.ok(data.database);
      assert.ok('connected' in data.database);
      assert.ok('engine' in data.database);
      assert.ok('migration' in data.database);

      // Storage health
      assert.ok(data.storage);
      assert.ok('provider' in data.storage);
      assert.ok('bucket' in data.storage);
      assert.ok('status' in data.storage);

      // SEC-01: Zero Secrets Leaked in Payload
      const stringified = JSON.stringify(data);
      assert.ok(!stringified.includes('password'));
      assert.ok(!stringified.includes('secret'));
      assert.ok(!stringified.includes('AUTH_SECRET'));
      assert.ok(!stringified.includes('S3_SECRET_ACCESS_KEY'));
      assert.ok(!stringified.includes('DATABASE_URL'));
      assert.ok(!stringified.includes('postgresql://'));
    });

    it('serves /api/v1/health with platform engine and storage status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);
      const data = (await res.json()) as any;

      assert.equal(data.service, 'rtiqa-platform-api');
      assert.equal(data.version, '1.0.0');
      assert.ok(data.database);
      assert.ok(data.storage);
      assert.ok(data.timestamp);
    });
  });

  // =========================================================================
  // 2. Schema DDL & Row-Level Security (RLS) Verification
  // =========================================================================
  describe('2. Schema DDL & Row-Level Security Verification', () => {
    it('verifies schema.sql contains all essential academic, SIS, and storage tables', () => {
      const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
      assert.ok(fs.existsSync(schemaPath), 'schema.sql must exist');

      const sql = fs.readFileSync(schemaPath, 'utf8');

      // Core tables
      const expectedTables = [
        'organizations',
        'users',
        'academic_years',
        'terms',
        'grade_levels',
        'classrooms',
        'subjects',
        'courses',
        'lessons',
        'student_records',
        'student_behavior_records',
        'student_lifecycle_events',
        'attendance_sessions',
        'attendance_records',
        'assessments',
        'assessment_grades',
        'assignments',
        'submissions',
        'storage_objects',
        '_schema_migrations',
      ];

      for (const table of expectedTables) {
        assert.ok(
          sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`) || sql.includes(`CREATE TABLE ${table}`),
          `schema.sql must contain table definition for ${table}`
        );
      }

      // RLS Policy checks
      assert.ok(
        sql.includes('ALTER TABLE storage_objects ENABLE ROW LEVEL SECURITY;'),
        'RLS must be enabled on storage_objects'
      );
      assert.ok(
        sql.includes('CREATE POLICY tenant_isolation_storage_objects ON storage_objects'),
        'tenant_isolation_storage_objects policy must be declared'
      );
    });
  });

  // =========================================================================
  // 3. Storage Service S3 & MinIO Configuration Compatibility
  // =========================================================================
  describe('3. Storage Service S3 & MinIO Configuration Compatibility', () => {
    it('initializes S3StorageProvider with MinIO custom endpoint and path style', () => {
      const minioConfig = {
        provider: 's3' as const,
        endpoint: 'http://localhost:9000',
        region: 'us-east-1',
        bucket: 'rtiqa-storage',
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin_local_secret',
        forcePathStyle: true,
        presignedUrlTtlSeconds: 900,
        maxUploadSizeBytes: 52428800,
      };

      const s3Provider = new S3StorageProvider(minioConfig);
      assert.ok(s3Provider, 'S3StorageProvider must initialize successfully with MinIO config');

      const storageService = new StorageService(minioConfig, s3Provider);
      const health = storageService.getHealth();

      assert.equal(health.provider, 's3');
      assert.equal(health.bucket, 'rtiqa-storage');
      assert.equal(health.endpointConfigured, true);
      assert.equal(health.forcePathStyle, true);
      assert.equal(health.credentialsConfigured, true);
      assert.equal(health.status, 'READY');
    });

    it('enforces production fail-fast rules on missing S3 bucket or memory provider in production', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';

        // 1. Missing bucket in production must throw
        assert.throws(() => {
          new StorageService({
            provider: 's3',
            bucket: '',
            accessKeyId: 'test',
            secretAccessKey: 'test',
          });
        }, /FATAL STORAGE CONFIG ERROR/);

        // 2. Memory provider in production must throw
        assert.throws(() => {
          new StorageService({
            provider: 'memory',
            bucket: 'my-bucket',
          });
        }, /Memory storage provider is strictly forbidden in production/);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // =========================================================================
  // 4. Multi-Tenant Data & Storage Object Lifecycle Persistence Flow
  // =========================================================================
  describe('4. Multi-Tenant Data & Storage Object Lifecycle Persistence Flow', () => {
    it('executes full upload intent -> finalize -> download -> delete lifecycle within tenant isolation', async () => {
      // Step 1: Teacher A requests presigned upload URL for curriculum guide
      const uploadRes = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_infra_01',
          filename: 'math_curriculum_2026.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1048576, // 1MB
        }),
      });

      assert.equal(uploadRes.status, 200);
      const uploadBody = (await uploadRes.json()) as any;
      assert.equal(uploadBody.success, true);
      assert.ok(uploadBody.data.storageObjectId);
      assert.ok(uploadBody.data.uploadUrl);
      assert.ok(uploadBody.data.objectKey.startsWith(`${orgAId}/assignment_attachment/asg_infra_01/`));

      const storageObjectId = uploadBody.data.storageObjectId;

      // Step 2: Finalize upload
      const finalizeRes = await fetch(`${baseUrl}/api/v1/storage/finalize/${storageObjectId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenTeacherA}`,
        },
      });

      assert.equal(finalizeRes.status, 200);
      const finalizeData = (await finalizeRes.json()) as any;
      assert.equal(finalizeData.success, true);
      assert.equal(finalizeData.data.status, 'UPLOADED');

      // Step 3: Teacher A generates download URL (Allowed)
      const downloadResA = await fetch(`${baseUrl}/api/v1/storage/download-url/${storageObjectId}`, {
        headers: {
          Authorization: `Bearer ${tokenTeacherA}`,
        },
      });

      assert.equal(downloadResA.status, 200);
      const downloadDataA = (await downloadResA.json()) as any;
      assert.ok(downloadDataA.data.downloadUrl);

      // Step 4: Cross-Tenant Isolation: Teacher B in Org B cannot download Org A object (404)
      const downloadResB = await fetch(`${baseUrl}/api/v1/storage/download-url/${storageObjectId}`, {
        headers: {
          Authorization: `Bearer ${tokenTeacherB}`,
        },
      });

      assert.equal(downloadResB.status, 404);

      // Step 5: Soft-delete object by authorized Teacher A
      const deleteRes = await fetch(`${baseUrl}/api/v1/storage/${storageObjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenTeacherA}`,
        },
      });

      assert.equal(deleteRes.status, 200);
      const deleteData = (await deleteRes.json()) as any;
      assert.equal(deleteData.success, true);
    });
  });
});
