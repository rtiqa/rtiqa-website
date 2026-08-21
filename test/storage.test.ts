import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { StorageService } from '../server/platform/storage/service.ts';
import { MockStorageProvider } from '../server/platform/storage/mockProvider.ts';
import { S3StorageProvider } from '../server/platform/storage/s3Provider.ts';

describe('Rtiqa Phase 3.0: Production Multi-Tenant Object Storage Foundation', () => {
  let server: any;
  let baseUrl: string;

  const orgAId = 'org_horizon_001';
  const orgBId = 'org_elite_002';

  let tokenAdminA: string;
  let tokenTeacherA: string;
  let tokenStudentA: string;
  let tokenTeacherB: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SECRET = 'test_secret_key_32_characters_long_rtiqa_2026';
    const app = await createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Login Org A Admin
    const resAdmin = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
    });
    const dataAdmin = await resAdmin.json();
    tokenAdminA = dataAdmin.token;

    // Login Org A Teacher
    const resTeacher = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
    });
    const dataTeacher = await resTeacher.json();
    tokenTeacherA = dataTeacher.token;

    // Login Org A Student
    const resStudent = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'student', tenantSlug: 'horizon' }),
    });
    const dataStudent = await resStudent.json();
    tokenStudentA = dataStudent.token;

    // Login Org B Teacher
    const resTeacherB = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'elite' }),
    });
    const dataTeacherB = await resTeacherB.json();
    tokenTeacherB = dataTeacherB.token;
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('1. Storage Provider Abstraction & Security Utilities', () => {
    it('initializes with MockStorageProvider and sanitizes malicious filenames', () => {
      const mockProvider = new MockStorageProvider();
      const service = new StorageService({ provider: 'memory' }, mockProvider);
      assert.strictEqual(service.sanitizeFilename('../../etc/passwd'), '____etc_passwd');
      assert.strictEqual(service.sanitizeFilename('report\x00\x1F_2026.pdf'), 'report_2026.pdf');
      assert.strictEqual(service.sanitizeFilename('ملف_الواجب.pdf'), 'ملف_الواجب.pdf');
    });

    it('builds immutable tenant-scoped object keys', () => {
      const service = new StorageService({ provider: 'memory' });
      const key = service.generateObjectKey(
        orgAId,
        'assignment_submission',
        'sub_123',
        'obj_456',
        'math_homework.pdf'
      );
      assert.strictEqual(key, `${orgAId}/assignment_submission/sub_123/obj_456_math_homework.pdf`);
    });

    it('S3StorageProvider implements IStorageProvider interface', () => {
      const s3Provider = new S3StorageProvider({
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'AKIA_TEST_KEY',
        secretAccessKey: 'SECRET_TEST_KEY',
        presignedUrlTtlSeconds: 900,
        maxUploadSizeBytes: 52428800,
      });

      assert.strictEqual(typeof s3Provider.createPresignedUploadUrl, 'function');
      assert.strictEqual(typeof s3Provider.createPresignedDownloadUrl, 'function');
      assert.strictEqual(typeof s3Provider.headObject, 'function');
      assert.strictEqual(typeof s3Provider.deleteObject, 'function');
    });
  });

  describe('2. Multi-Tenant Presigned Upload URL Flow', () => {
    it('rejects unauthenticated upload requests (401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_123',
          filename: 'worksheet.pdf',
          contentType: 'application/pdf',
          sizeBytes: 102400,
        }),
      });

      assert.strictEqual(res.status, 401);
    });

    it('allows teacher to request presigned upload URL for assignment attachment', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_test_01',
          filename: 'physics_lab_guide.pdf',
          contentType: 'application/pdf',
          sizeBytes: 524288,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.uploadUrl);
      assert.ok(body.data.storageObjectId);
      assert.ok(body.data.objectKey.includes(`${orgAId}/assignment_attachment/asg_test_01/`));

      // Verify metadata in DB
      const meta = db.getStorageObjectById(body.data.storageObjectId, orgAId);
      assert.ok(meta);
      assert.strictEqual(meta?.status, 'PENDING');
      assert.strictEqual(meta?.organizationId, orgAId);
    });

    it('allows student to request presigned upload URL for assignment submission', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_submission',
          resourceId: 'sub_test_01',
          filename: 'my_solution.pdf',
          contentType: 'application/pdf',
          sizeBytes: 204800,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.uploadUrl);
    });

    it('rejects student attempting to upload teacher curriculum document (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({
          resourceType: 'curriculum_document',
          resourceId: 'cur_001',
          filename: 'lesson_plan.pdf',
          contentType: 'application/pdf',
          sizeBytes: 102400,
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });
  });

  describe('3. Content-Type & Size Defensive Security Checks', () => {
    it('rejects disallowed dangerous content types (e.g., shell script / executable)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_01',
          filename: 'exploit.sh',
          contentType: 'application/x-sh',
          sizeBytes: 1024,
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.includes('INVALID_CONTENT_TYPE'));
    });

    it('rejects file sizes exceeding the resource quota (e.g., avatar > 5MB)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdminA}`,
        },
        body: JSON.stringify({
          resourceType: 'avatar',
          resourceId: 'usr_horizon_admin',
          filename: 'huge_avatar.png',
          contentType: 'image/png',
          sizeBytes: 10 * 1024 * 1024, // 10MB
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.error.includes('FILE_SIZE_EXCEEDED'));
    });
  });

  describe('4. Upload Finalization & Verification Flow', () => {
    it('finalizes upload and transitions metadata to UPLOADED status', async () => {
      const uploadRes = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_02',
          filename: 'quiz_instructions.pdf',
          contentType: 'application/pdf',
          sizeBytes: 256000,
        }),
      });

      const uploadData = await uploadRes.json();
      const storageObjectId = uploadData.data.storageObjectId;

      const finalizeRes = await fetch(`${baseUrl}/api/v1/storage/finalize/${storageObjectId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenTeacherA}`,
        },
      });

      assert.strictEqual(finalizeRes.status, 200);
      const finalizeData = await finalizeRes.json();
      assert.strictEqual(finalizeData.success, true);
      assert.strictEqual(finalizeData.data.status, 'UPLOADED');

      const updatedMeta = db.getStorageObjectById(storageObjectId, orgAId);
      assert.strictEqual(updatedMeta?.status, 'UPLOADED');
    });
  });

  describe('5. Secure Presigned Download URL & Strict Tenant Isolation', () => {
    let testStorageObjectId: string;

    before(async () => {
      const uploadRes = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'curriculum_document',
          resourceId: 'cur_01',
          filename: 'physics_curriculum.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1024000,
        }),
      });

      const uploadData = await uploadRes.json();
      testStorageObjectId = uploadData.data.storageObjectId;

      await fetch(`${baseUrl}/api/v1/storage/finalize/${testStorageObjectId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenTeacherA}` },
      });
    });

    it('allows authorized user in Org A to generate presigned download URL', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/download-url/${testStorageObjectId}`, {
        headers: { Authorization: `Bearer ${tokenTeacherA}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.downloadUrl);
      assert.strictEqual(body.data.originalFilename, 'physics_curriculum.pdf');
    });

    it('STRICT TENANT ISOLATION: User in Org B cannot download Org A object (404)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/download-url/${testStorageObjectId}`, {
        headers: { Authorization: `Bearer ${tokenTeacherB}` },
      });

      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    it('STRICT TENANT ISOLATION: User in Org B cannot view metadata of Org A object (404)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/storage/metadata/${testStorageObjectId}`, {
        headers: { Authorization: `Bearer ${tokenTeacherB}` },
      });

      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });
  });

  describe('6. Object Deletion & Soft-Delete Lifecycle', () => {
    it('allows uploader or admin to delete storage object', async () => {
      const uploadRes = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_del',
          filename: 'old_file.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1024,
        }),
      });

      const uploadData = await uploadRes.json();
      const storageObjectId = uploadData.data.storageObjectId;

      const delRes = await fetch(`${baseUrl}/api/v1/storage/${storageObjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenTeacherA}` },
      });

      assert.strictEqual(delRes.status, 200);
      const delData = await delRes.json();
      assert.strictEqual(delData.success, true);

      const meta = db.getStorageObjectById(storageObjectId, orgAId);
      assert.strictEqual(meta?.status, 'DELETED');
    });

    it('rejects cross-tenant object deletion attempts (404)', async () => {
      const uploadRes = await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'assignment_attachment',
          resourceId: 'asg_del2',
          filename: 'file.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1024,
        }),
      });

      const uploadData = await uploadRes.json();
      const storageObjectId = uploadData.data.storageObjectId;

      const delRes = await fetch(`${baseUrl}/api/v1/storage/${storageObjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenTeacherB}` },
      });

      assert.strictEqual(delRes.status, 404);
    });
  });

  describe('7. Resource Object Listing', () => {
    it('lists storage objects for a given resource', async () => {
      const resourceId = 'course_physics_101';

      await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'curriculum_document',
          resourceId,
          filename: 'chapter1.pdf',
          contentType: 'application/pdf',
          sizeBytes: 102400,
        }),
      });

      await fetch(`${baseUrl}/api/v1/storage/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenTeacherA}`,
        },
        body: JSON.stringify({
          resourceType: 'curriculum_document',
          resourceId,
          filename: 'chapter2.pdf',
          contentType: 'application/pdf',
          sizeBytes: 204800,
        }),
      });

      const listRes = await fetch(
        `${baseUrl}/api/v1/storage/resource/curriculum_document/${resourceId}`,
        {
          headers: { Authorization: `Bearer ${tokenTeacherA}` },
        }
      );

      assert.strictEqual(listRes.status, 200);
      const listData = await listRes.json();
      assert.strictEqual(listData.success, true);
      assert.strictEqual(listData.data.length, 2);
    });
  });
});
