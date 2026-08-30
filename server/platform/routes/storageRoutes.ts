import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth } from '../auth.ts';
import { getStorageService } from '../storage/service.ts';
import type { StorageResourceType } from '../types.ts';

export const storageRouter = express.Router();

// Require valid authentication for all storage routes
storageRouter.use(requireAuth);

/**
 * Authorization helper: verifies if current user has permission to upload for a given resource.
 */
function checkUploadAuthorization(
  req: PlatformRequest,
  resourceType: StorageResourceType,
  resourceId: string
): { allowed: boolean; reason?: string } {
  const user = req.user!;
  const orgId = req.organization!.id;

  // Super Admin & Org Admin have full access across the tenant
  if (user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN') {
    return { allowed: true };
  }

  switch (resourceType) {
    case 'avatar': {
      // Users can upload their own avatar, or parents for their linked children
      if (resourceId === user.id) return { allowed: true };
      if (user.role === 'PARENT') {
        const links = db.getParentStudentLinks(orgId, { parentId: user.id });
        const isChild = links.some((l) => l.studentId === resourceId);
        if (isChild) return { allowed: true };
      }
      return { allowed: false, reason: 'FORBIDDEN_AVATAR_UPLOAD' };
    }

    case 'student_document': {
      // Student themselves, parent of student, or teacher
      if (user.role === 'TEACHER') return { allowed: true };
      if (user.role === 'STUDENT' && resourceId === user.id) return { allowed: true };
      if (user.role === 'PARENT') {
        const links = db.getParentStudentLinks(orgId, { parentId: user.id });
        if (links.some((l) => l.studentId === resourceId)) return { allowed: true };
      }
      return { allowed: false, reason: 'FORBIDDEN_STUDENT_DOC_UPLOAD' };
    }

    case 'assignment_attachment': {
      // Only Teachers and Admins can attach files to assignments
      if (user.role === 'TEACHER') return { allowed: true };
      return { allowed: false, reason: 'FORBIDDEN_ASSIGNMENT_ATTACHMENT' };
    }

    case 'assignment_submission': {
      // Students can submit for themselves
      if (user.role === 'STUDENT') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'FORBIDDEN_SUBMISSION_UPLOAD' };
    }

    case 'curriculum_document':
    case 'report_card': {
      // Only Teachers and Admins can upload curriculum documents and report cards
      if (user.role === 'TEACHER') return { allowed: true };
      return { allowed: false, reason: 'FORBIDDEN_TEACHER_RESOURCE_UPLOAD' };
    }

    case 'general_asset': {
      // Only Org Admins / Super Admins can upload general assets
      return { allowed: false, reason: 'FORBIDDEN_GENERAL_ASSET_UPLOAD' };
    }

    default:
      return { allowed: false, reason: 'UNKNOWN_RESOURCE_TYPE' };
  }
}

/**
 * Authorization helper: verifies if current user has permission to download/view a storage object.
 */
function checkDownloadAuthorization(
  req: PlatformRequest,
  record: any
): { allowed: boolean; reason?: string } {
  const user = req.user!;
  const orgId = req.organization!.id;

  // Tenant match is strictly required
  if (record.organizationId !== orgId) {
    return { allowed: false, reason: 'TENANT_MISMATCH' };
  }

  // Admins have full read access within their tenant
  if (user.role === 'SUPER_ADMIN' || user.role === 'ORG_ADMIN') {
    return { allowed: true };
  }

  // Uploader always has read access
  if (record.uploadedBy === user.id) {
    return { allowed: true };
  }

  switch (record.resourceType) {
    case 'avatar':
    case 'general_asset':
      // Public to all authenticated users within the school
      return { allowed: true };

    case 'assignment_attachment':
    case 'curriculum_document':
      // Accessible to all teachers and students in the school
      return { allowed: true };

    case 'assignment_submission': {
      // Accessible to teacher, uploader student, or uploader's parent
      if (user.role === 'TEACHER') return { allowed: true };
      if (user.role === 'STUDENT' && record.uploadedBy === user.id) return { allowed: true };
      if (user.role === 'PARENT') {
        const links = db.getParentStudentLinks(orgId, { parentId: user.id });
        if (links.some((l) => l.studentId === record.uploadedBy || l.studentId === record.resourceId)) {
          return { allowed: true };
        }
      }
      return { allowed: false, reason: 'FORBIDDEN_SUBMISSION_ACCESS' };
    }

    case 'student_document':
    case 'report_card': {
      if (user.role === 'TEACHER') return { allowed: true };
      if (user.role === 'STUDENT' && record.resourceId === user.id) return { allowed: true };
      if (user.role === 'PARENT') {
        const links = db.getParentStudentLinks(orgId, { parentId: user.id });
        if (links.some((l) => l.studentId === record.resourceId)) return { allowed: true };
      }
      return { allowed: false, reason: 'FORBIDDEN_STUDENT_DATA_ACCESS' };
    }

    default:
      return { allowed: true };
  }
}

/**
 * POST /api/v1/storage/upload-url
 * Step 1: Initiates secure upload flow and generates a presigned PUT URL.
 */
storageRouter.post('/upload-url', async (req: PlatformRequest, res: express.Response) => {
  try {
    const { resourceType, resourceId, filename, contentType, sizeBytes, customMetadata } = req.body;

    if (!resourceType || !resourceId || !filename || !contentType || !sizeBytes) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'الحقول المطلوبة: resourceType, resourceId, filename, contentType, sizeBytes',
      });
    }

    const orgId = req.organization!.id;
    const authCheck = checkUploadAuthorization(req, resourceType as StorageResourceType, resourceId);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: authCheck.reason || 'لا تملك الصلاحية لرفع ملفات لهذا المورد',
      });
    }

    const storageService = getStorageService();
    const result = await storageService.createUploadUrl({
      organizationId: orgId,
      resourceType: resourceType as StorageResourceType,
      resourceId,
      filename,
      contentType,
      sizeBytes: Number(sizeBytes),
      uploadedBy: req.user!.id,
      customMetadata,
    });

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'STORAGE_UPLOAD_URL_REQUESTED',
      resourceType,
      result.storageObjectId,
      { filename, contentType, sizeBytes }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const status = err.message?.startsWith('INVALID_CONTENT_TYPE') || err.message?.startsWith('FILE_SIZE_EXCEEDED') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: err.message?.split(':')[0] || 'STORAGE_ERROR',
      message: err.message,
    });
  }
});

/**
 * POST /api/v1/storage/finalize/:id
 * Step 2: Finalizes upload, verifies object presence in bucket, and updates status to UPLOADED.
 */
storageRouter.post('/finalize/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const storageObjectId = req.params.id;
    const orgId = req.organization!.id;

    const storageService = getStorageService();
    const updated = await storageService.finalizeUpload(storageObjectId, orgId, req.user!);

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'STORAGE_OBJECT_UPLOAD_FINALIZED',
      updated.resourceType,
      updated.id,
      { sizeBytes: updated.sizeBytes, checksum: updated.checksum }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    const status = err.message?.startsWith('OBJECT_NOT_FOUND')
      ? 404
      : err.message?.startsWith('UNAUTHORIZED')
      ? 403
      : 400;
    res.status(status).json({
      success: false,
      error: err.message?.split(':')[0] || 'FINALIZE_ERROR',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/storage/download-url/:id
 * Generates a secure, short-lived presigned GET URL for downloading or viewing an object.
 */
storageRouter.get('/download-url/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const storageObjectId = req.params.id;
    const orgId = req.organization!.id;
    const dispositionFilename = req.query.filename as string | undefined;

    const storageService = getStorageService();
    const metadata = storageService.getMetadata(storageObjectId, orgId);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'OBJECT_NOT_FOUND',
        message: 'الملف غير موجود أو تم حذفه',
      });
    }

    const authCheck = checkDownloadAuthorization(req, metadata);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'لا تملك صلاحية الوصول لهذا الملف',
      });
    }

    const result = await storageService.createDownloadUrl({
      organizationId: orgId,
      storageObjectId,
      dispositionFilename,
    });

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'STORAGE_DOWNLOAD_URL_REQUESTED',
      metadata.resourceType,
      metadata.id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const status = err.message?.startsWith('OBJECT_NOT_FOUND') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: err.message?.split(':')[0] || 'DOWNLOAD_ERROR',
      message: err.message,
    });
  }
});

/**
 * GET /api/v1/storage/metadata/:id
 * Retrieves metadata for a specific storage object.
 */
storageRouter.get('/metadata/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const storageObjectId = req.params.id;
    const orgId = req.organization!.id;

    const storageService = getStorageService();
    const metadata = storageService.getMetadata(storageObjectId, orgId);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'OBJECT_NOT_FOUND',
        message: 'الملف غير موجود',
      });
    }

    const authCheck = checkDownloadAuthorization(req, metadata);
    if (!authCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'لا تملك صلاحية الاطلاع على بيانات هذا الملف',
      });
    }

    res.json({
      success: true,
      data: metadata,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * GET /api/v1/storage/resource/:resourceType/:resourceId
 * Lists storage objects associated with a specific business entity.
 */
storageRouter.get('/resource/:resourceType/:resourceId', async (req: PlatformRequest, res: express.Response) => {
  try {
    const { resourceType, resourceId } = req.params;
    const orgId = req.organization!.id;

    const storageService = getStorageService();
    const objects = storageService.getObjectsForResource(
      resourceType as StorageResourceType,
      resourceId,
      orgId
    );

    // Filter objects user has access to
    const accessible = objects.filter((o) => checkDownloadAuthorization(req, o).allowed);

    res.json({
      success: true,
      data: accessible,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * DELETE /api/v1/storage/:id
 * Deletes an object from storage bucket and marks metadata as DELETED.
 */
storageRouter.delete('/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const storageObjectId = req.params.id;
    const orgId = req.organization!.id;

    const storageService = getStorageService();
    const success = await storageService.deleteObject(storageObjectId, orgId, req.user!);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'OBJECT_NOT_FOUND',
        message: 'الملف غير موجود أو تعذر حذفه',
      });
    }

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'STORAGE_OBJECT_DELETED',
      'storage_object',
      storageObjectId
    );

    res.json({
      success: true,
      message: 'تم حذف الملف بنجاح',
    });
  } catch (err: any) {
    const status = err.message?.startsWith('UNAUTHORIZED') ? 403 : 500;
    res.status(status).json({
      success: false,
      error: err.message?.split(':')[0] || 'DELETE_ERROR',
      message: err.message,
    });
  }
});
