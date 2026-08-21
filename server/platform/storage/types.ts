import type { StorageResourceType, StorageObjectMetadata, StorageObjectStatus } from '../types.ts';

export type StorageProviderType = 's3' | 'r2' | 'minio' | 'memory';

export interface StorageConfig {
  provider: StorageProviderType;
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  presignedUrlTtlSeconds: number; // default 900 (15 min)
  maxUploadSizeBytes: number; // default 50MB (52428800)
}

export interface CreateUploadUrlOptions {
  organizationId: string;
  resourceType: StorageResourceType;
  resourceId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  customMetadata?: Record<string, unknown>;
}

export interface UploadUrlResult {
  uploadUrl: string;
  storageObjectId: string;
  objectKey: string;
  expiresAt: string;
  maxSizeBytes: number;
  contentType: string;
}

export interface CreateDownloadUrlOptions {
  organizationId: string;
  storageObjectId: string;
  dispositionFilename?: string;
  expiresInSeconds?: number;
}

export interface DownloadUrlResult {
  downloadUrl: string;
  storageObjectId: string;
  objectKey: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  expiresAt: string;
}

export interface StorageObjectHeadResult {
  exists: boolean;
  sizeBytes?: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
}

export interface IStorageProvider {
  createPresignedUploadUrl(key: string, contentType: string, expiresInSeconds: number): Promise<string>;
  createPresignedDownloadUrl(key: string, expiresInSeconds: number, dispositionFilename?: string): Promise<string>;
  headObject(key: string): Promise<StorageObjectHeadResult>;
  deleteObject(key: string): Promise<boolean>;
}
