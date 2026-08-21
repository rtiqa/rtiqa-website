import type { IStorageProvider, StorageObjectHeadResult } from './types.ts';

export class MockStorageProvider implements IStorageProvider {
  private objects: Map<string, { sizeBytes: number; contentType: string; etag: string; lastModified: Date }> = new Map();
  private baseEndpoint: string;

  constructor(endpoint = 'https://storage-mock.rtiqa.internal') {
    this.baseEndpoint = endpoint;
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number
  ): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const url = new URL(`${this.baseEndpoint}/upload/${encodeURIComponent(key)}`);
    url.searchParams.set('X-Amz-Expires', expiresInSeconds.toString());
    url.searchParams.set('X-Amz-Signature', 'mock_signature_test_token_123');
    url.searchParams.set('X-Amz-Date', new Date().toISOString());
    url.searchParams.set('contentType', contentType);
    url.searchParams.set('exp', expiresAt.toString());

    // Auto-register object in mock store when upload url is created for convenience in test mock flow
    this.objects.set(key, {
      sizeBytes: 1024,
      contentType,
      etag: '"mock-etag-hash-987654321"',
      lastModified: new Date(),
    });

    return url.toString();
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds: number,
    dispositionFilename?: string
  ): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const url = new URL(`${this.baseEndpoint}/download/${encodeURIComponent(key)}`);
    url.searchParams.set('X-Amz-Expires', expiresInSeconds.toString());
    url.searchParams.set('X-Amz-Signature', 'mock_download_signature_456');
    url.searchParams.set('exp', expiresAt.toString());
    if (dispositionFilename) {
      url.searchParams.set('filename', dispositionFilename);
    }
    return url.toString();
  }

  async headObject(key: string): Promise<StorageObjectHeadResult> {
    const obj = this.objects.get(key);
    if (!obj) {
      return { exists: false };
    }
    return {
      exists: true,
      sizeBytes: obj.sizeBytes,
      contentType: obj.contentType,
      etag: obj.etag,
      lastModified: obj.lastModified,
    };
  }

  async deleteObject(key: string): Promise<boolean> {
    return this.objects.delete(key);
  }

  // Test helper: manually simulate external upload
  simulateUpload(key: string, sizeBytes: number, contentType: string) {
    this.objects.set(key, {
      sizeBytes,
      contentType,
      etag: `"mock-etag-${Date.now()}"`,
      lastModified: new Date(),
    });
  }
}
