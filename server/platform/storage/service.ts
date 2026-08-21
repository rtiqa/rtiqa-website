import crypto from 'crypto';
import type {
  StorageConfig,
  IStorageProvider,
  CreateUploadUrlOptions,
  UploadUrlResult,
  CreateDownloadUrlOptions,
  DownloadUrlResult,
  StorageProviderType,
} from './types.ts';
import { S3StorageProvider } from './s3Provider.ts';
import { MockStorageProvider } from './mockProvider.ts';
import { db } from '../db.ts';
import type { StorageObjectMetadata, StorageResourceType, User } from '../types.ts';

// Allowed MIME types whitelist per resource category to prevent arbitrary/executable uploads
const ALLOWED_CONTENT_TYPES: Record<StorageResourceType, string[]> = {
  avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  student_document: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  assignment_attachment: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
  ],
  assignment_submission: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
  ],
  curriculum_document: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
  ],
  report_card: ['application/pdf'],
  general_asset: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
  ],
};

// Size limits per resource category (in bytes)
const MAX_FILE_SIZES: Record<StorageResourceType, number> = {
  avatar: 5 * 1024 * 1024, // 5 MB
  student_document: 25 * 1024 * 1024, // 25 MB
  assignment_attachment: 50 * 1024 * 1024, // 50 MB
  assignment_submission: 50 * 1024 * 1024, // 50 MB
  curriculum_document: 100 * 1024 * 1024, // 100 MB
  report_card: 20 * 1024 * 1024, // 20 MB
  general_asset: 20 * 1024 * 1024, // 20 MB
};

export class StorageService {
  private provider: IStorageProvider;
  private config: StorageConfig;

  constructor(customConfig?: Partial<StorageConfig>, customProvider?: IStorageProvider) {
    this.config = this.resolveConfig(customConfig);

    if (process.env.NODE_ENV === 'production') {
      this.assertProductionStorageConfig(this.config);
    }

    if (customProvider) {
      this.provider = customProvider;
    } else if (this.config.provider === 'memory' || process.env.NODE_ENV === 'test') {
      this.provider = new MockStorageProvider(this.config.endpoint);
    } else {
      this.provider = new S3StorageProvider(this.config);
    }
  }

  private resolveConfig(custom?: Partial<StorageConfig>): StorageConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    const providerType = (custom?.provider !== undefined
      ? custom.provider
      : process.env.STORAGE_PROVIDER ||
        (isTest ? 'memory' : isProduction ? 's3' : 'memory')) as StorageProviderType;

    return {
      provider: providerType,
      endpoint: custom?.endpoint !== undefined ? custom.endpoint : process.env.S3_ENDPOINT,
      region: custom?.region !== undefined ? custom.region : process.env.S3_REGION || 'us-east-1',
      bucket: custom?.bucket !== undefined ? custom.bucket : process.env.S3_BUCKET || 'rtiqa-storage',
      accessKeyId: custom?.accessKeyId !== undefined ? custom.accessKeyId : process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: custom?.secretAccessKey !== undefined ? custom.secretAccessKey : process.env.S3_SECRET_ACCESS_KEY,
      forcePathStyle:
        custom?.forcePathStyle !== undefined
          ? custom.forcePathStyle
          : process.env.S3_FORCE_PATH_STYLE === 'true',
      presignedUrlTtlSeconds:
        custom?.presignedUrlTtlSeconds ||
        (process.env.STORAGE_URL_TTL ? parseInt(process.env.STORAGE_URL_TTL, 10) : 900), // 15 min default
      maxUploadSizeBytes:
        custom?.maxUploadSizeBytes ||
        (process.env.STORAGE_MAX_BYTES ? parseInt(process.env.STORAGE_MAX_BYTES, 10) : 52428800), // 50MB default
    };
  }

  private assertProductionStorageConfig(config: StorageConfig): void {
    if (process.env.NODE_ENV !== 'production') return;

    if (!config.bucket || config.bucket.trim() === '') {
      throw new Error(
        '[FATAL STORAGE CONFIG ERROR]: S3_BUCKET is missing in production environment. A valid object storage bucket must be configured.'
      );
    }

    if (config.provider === 'memory') {
      throw new Error(
        '[FATAL STORAGE CONFIG ERROR]: Memory storage provider is strictly forbidden in production. Production must use S3/R2/MinIO object storage.'
      );
    }

    // If explicit discrete credentials are required (non-IAM role)
    if (!config.accessKeyId || !config.secretAccessKey) {
      console.warn(
        '[StorageService] Warning: S3_ACCESS_KEY_ID or S3_SECRET_ACCESS_KEY not provided; assuming cloud container IAM role authentication.'
      );
    }
  }

  /**
   * Sanitizes a client-provided filename, stripping directory traversal and malicious characters.
   */
  sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') return 'file.bin';

    // Remove path separators and traversal attempts
    let cleaned = filename.replace(/[/\\]/g, '_').replace(/\.\./g, '_').trim();

    // Remove ASCII control characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

    // Truncate to reasonable length preserving extension
    if (cleaned.length > 128) {
      const extIdx = cleaned.lastIndexOf('.');
      if (extIdx !== -1 && extIdx > cleaned.length - 10) {
        const ext = cleaned.substring(extIdx);
        cleaned = cleaned.substring(0, 120) + ext;
      } else {
        cleaned = cleaned.substring(0, 128);
      }
    }

    return cleaned || 'file.bin';
  }

  /**
   * Builds an immutable, tenant-scoped object key.
   * Format: {organizationId}/{resourceType}/{resourceId}/{safeObjectId}_{sanitizedFilename}
   */
  generateObjectKey(
    organizationId: string,
    resourceType: StorageResourceType,
    resourceId: string,
    storageObjectId: string,
    filename: string
  ): string {
    const safeOrg = organizationId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeType = resourceType.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeResId = resourceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = this.sanitizeFilename(filename);

    return `${safeOrg}/${safeType}/${safeResId}/${storageObjectId}_${safeFilename}`;
  }

  /**
   * Validates content type against allowed whitelist for the resource type.
   */
  validateContentType(resourceType: StorageResourceType, contentType: string): boolean {
    const allowed = ALLOWED_CONTENT_TYPES[resourceType] || [];
    const normalized = (contentType || '').trim().toLowerCase().split(';')[0];
    return allowed.includes(normalized);
  }

  /**
   * Validates file size against limits for the resource type.
   */
  validateFileSize(resourceType: StorageResourceType, sizeBytes: number): { isValid: boolean; maxSizeBytes: number } {
    const maxSizeBytes = MAX_FILE_SIZES[resourceType] || this.config.maxUploadSizeBytes;
    return {
      isValid: sizeBytes > 0 && sizeBytes <= maxSizeBytes,
      maxSizeBytes,
    };
  }

  /**
   * Step 1: Initiates secure presigned upload flow.
   * Generates a unique object key, inserts a PENDING metadata record, and returns a short-lived presigned URL.
   */
  async createUploadUrl(options: CreateUploadUrlOptions): Promise<UploadUrlResult> {
    const {
      organizationId,
      resourceType,
      resourceId,
      filename,
      contentType,
      sizeBytes,
      uploadedBy,
      customMetadata,
    } = options;

    if (!organizationId) {
      throw new Error('TENANT_REQUIRED: Organization context is mandatory.');
    }

    // 1. Validate Content Type
    if (!this.validateContentType(resourceType, contentType)) {
      throw new Error(
        `INVALID_CONTENT_TYPE: Content type '${contentType}' is not permitted for resource '${resourceType}'.`
      );
    }

    // 2. Validate File Size
    const sizeCheck = this.validateFileSize(resourceType, sizeBytes);
    if (!sizeCheck.isValid) {
      throw new Error(
        `FILE_SIZE_EXCEEDED: File size of ${sizeBytes} bytes exceeds maximum allowed limit of ${sizeCheck.maxSizeBytes} bytes.`
      );
    }

    // 3. Generate Storage Object ID and Safe Object Key
    const storageObjectId = `obj_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const sanitizedFilename = this.sanitizeFilename(filename);
    const objectKey = this.generateObjectKey(
      organizationId,
      resourceType,
      resourceId,
      storageObjectId,
      sanitizedFilename
    );

    // 4. Generate Presigned Upload URL from Provider
    const uploadUrl = await this.provider.createPresignedUploadUrl(
      objectKey,
      contentType,
      this.config.presignedUrlTtlSeconds
    );

    const expiresAt = new Date(
      Date.now() + this.config.presignedUrlTtlSeconds * 1000
    ).toISOString();

    // 5. Record metadata in PostgreSQL database (state: PENDING)
    db.createStorageObject({
      id: storageObjectId,
      organizationId,
      objectKey,
      originalFilename: sanitizedFilename,
      contentType,
      sizeBytes,
      resourceType,
      resourceId,
      uploadedBy,
      status: 'PENDING',
      metadata: customMetadata || {},
    });

    return {
      uploadUrl,
      storageObjectId,
      objectKey,
      expiresAt,
      maxSizeBytes: sizeCheck.maxSizeBytes,
      contentType,
    };
  }

  /**
   * Step 2: Finalizes upload after client finishes PUT request to S3.
   * Verifies object presence in storage provider, updates status to UPLOADED.
   */
  async finalizeUpload(
    storageObjectId: string,
    organizationId: string,
    currentUser: User
  ): Promise<StorageObjectMetadata> {
    const record = db.getStorageObjectById(storageObjectId, organizationId);
    if (!record) {
      throw new Error('OBJECT_NOT_FOUND: Storage object metadata does not exist or tenant mismatch.');
    }

    // Ensure only uploader, admin, or teacher can finalize
    if (
      record.uploadedBy !== currentUser.id &&
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.role !== 'ORG_ADMIN' &&
      currentUser.role !== 'TEACHER'
    ) {
      throw new Error('UNAUTHORIZED_ACTION: Insufficient permission to finalize this object.');
    }

    // Verify object existence in Object Storage via HEAD request
    const headResult = await this.provider.headObject(record.objectKey);
    if (!headResult.exists) {
      // Mark as failed if not found in bucket
      db.updateStorageObject(storageObjectId, organizationId, { status: 'FAILED' });
      throw new Error('UPLOAD_VERIFICATION_FAILED: Object was not found in storage bucket.');
    }

    // Update metadata to UPLOADED with verified size & ETag
    const updated = db.updateStorageObject(storageObjectId, organizationId, {
      status: 'UPLOADED',
      sizeBytes: headResult.sizeBytes || record.sizeBytes,
      checksum: headResult.etag ? headResult.etag.replace(/"/g, '') : record.checksum,
    });

    if (!updated) {
      throw new Error('FAILED_TO_UPDATE_METADATA');
    }

    return updated;
  }

  /**
   * Generates a secure, short-lived presigned download URL for an authorized tenant object.
   */
  async createDownloadUrl(options: CreateDownloadUrlOptions): Promise<DownloadUrlResult> {
    const { organizationId, storageObjectId, dispositionFilename, expiresInSeconds } = options;

    const record = db.getStorageObjectById(storageObjectId, organizationId);
    if (!record) {
      throw new Error('OBJECT_NOT_FOUND: Requested storage object does not exist or tenant mismatch.');
    }

    if (record.status === 'DELETED') {
      throw new Error('OBJECT_DELETED: Requested storage object has been deleted.');
    }

    const ttl = expiresInSeconds || this.config.presignedUrlTtlSeconds;
    const filenameToUse = dispositionFilename || record.originalFilename;

    const downloadUrl = await this.provider.createPresignedDownloadUrl(
      record.objectKey,
      ttl,
      filenameToUse
    );

    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    return {
      downloadUrl,
      storageObjectId: record.id,
      objectKey: record.objectKey,
      originalFilename: record.originalFilename,
      contentType: record.contentType,
      sizeBytes: record.sizeBytes,
      expiresAt,
    };
  }

  /**
   * Deletes an object: removes from S3 and marks metadata as DELETED.
   */
  async deleteObject(
    storageObjectId: string,
    organizationId: string,
    currentUser: User
  ): Promise<boolean> {
    const record = db.getStorageObjectById(storageObjectId, organizationId);
    if (!record) {
      return false;
    }

    // Permission check: only uploader, admin, or teacher can delete
    if (
      record.uploadedBy !== currentUser.id &&
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.role !== 'ORG_ADMIN' &&
      currentUser.role !== 'TEACHER'
    ) {
      throw new Error('UNAUTHORIZED_ACTION: Insufficient permission to delete this object.');
    }

    // 1. Delete from Object Storage bucket
    await this.provider.deleteObject(record.objectKey);

    // 2. Soft-delete metadata in database
    return db.deleteStorageObject(storageObjectId, organizationId);
  }

  /**
   * Retrieves metadata for a storage object.
   */
  getMetadata(storageObjectId: string, organizationId: string): StorageObjectMetadata | undefined {
    return db.getStorageObjectById(storageObjectId, organizationId);
  }

  /**
   * Lists storage objects associated with a specific business resource.
   */
  getObjectsForResource(
    resourceType: StorageResourceType,
    resourceId: string,
    organizationId: string
  ): StorageObjectMetadata[] {
    return db.getStorageObjectsByResource(resourceType, resourceId, organizationId);
  }

  /**
   * Safe health check for Object Storage infrastructure without secret exposure.
   */
  getHealth(): {
    provider: StorageProviderType;
    bucket: string;
    region: string;
    endpointConfigured: boolean;
    forcePathStyle: boolean;
    credentialsConfigured: boolean;
    status: 'READY' | 'MOCK' | 'UNCONFIGURED';
  } {
    const isMock = this.provider instanceof MockStorageProvider;
    const credsConfigured = Boolean(this.config.accessKeyId && this.config.secretAccessKey);
    return {
      provider: this.config.provider,
      bucket: this.config.bucket,
      region: this.config.region || 'us-east-1',
      endpointConfigured: Boolean(this.config.endpoint && this.config.endpoint.trim() !== ''),
      forcePathStyle: Boolean(this.config.forcePathStyle),
      credentialsConfigured: credsConfigured,
      status: isMock ? 'MOCK' : this.config.bucket ? 'READY' : 'UNCONFIGURED',
    };
  }
}

// Singleton storage service instance
let globalStorageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!globalStorageService) {
    globalStorageService = new StorageService();
  }
  return globalStorageService;
}

export function resetStorageServiceForTesting(customConfig?: Partial<StorageConfig>, customProvider?: IStorageProvider): StorageService {
  globalStorageService = new StorageService(customConfig, customProvider);
  return globalStorageService;
}
