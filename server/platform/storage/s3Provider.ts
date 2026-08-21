import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { IStorageProvider, StorageConfig, StorageObjectHeadResult } from './types.ts';

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;

    const s3ClientConfig: any = {
      region: config.region || 'us-east-1',
    };

    if (config.endpoint && config.endpoint.trim() !== '') {
      s3ClientConfig.endpoint = config.endpoint.trim();
    }

    if (config.forcePathStyle !== undefined) {
      s3ClientConfig.forcePathStyle = config.forcePathStyle;
    }

    if (config.accessKeyId && config.secretAccessKey) {
      s3ClientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    this.client = new S3Client(s3ClientConfig);
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async createPresignedDownloadUrl(
    key: string,
    expiresInSeconds: number,
    dispositionFilename?: string
  ): Promise<string> {
    const params: any = {
      Bucket: this.bucket,
      Key: key,
    };

    if (dispositionFilename) {
      // Encode RFC 5987 / URL encoded filename to support Arabic and special characters safely
      const encodedFilename = encodeURIComponent(dispositionFilename);
      params.ResponseContentDisposition = `attachment; filename="${dispositionFilename.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`;
    }

    const command = new GetObjectCommand(params);

    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async headObject(key: string): Promise<StorageObjectHeadResult> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      return {
        exists: true,
        sizeBytes: response.ContentLength,
        contentType: response.ContentType,
        etag: response.ETag,
        lastModified: response.LastModified,
      };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return { exists: false };
      }
      // Re-throw genuine errors (network/auth failure)
      throw err;
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (err) {
      console.error(`[S3StorageProvider] Failed to delete object ${key}:`, (err as Error).message);
      return false;
    }
  }
}
