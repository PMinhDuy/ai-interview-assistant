import { StorageProvider } from '../providers/provider.interface';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * MinIOStorageProvider (S3-compatible)
 *
 * MinIO exposes an S3-compatible API, so this provider works
 * identically with real Amazon S3 by simply changing the endpoint.
 *
 * AIP-C01 Note:
 *   Amazon S3 is the most common object store for AI applications.
 *   - Resume PDFs, JD docs → S3 input bucket
 *   - Processed outputs → S3 output bucket
 *   - Bedrock Knowledge Base → S3 as data source
 *
 * Cost comparison:
 *   MinIO (self-hosted) = $0/month
 *   S3 Standard = $0.023/GB/month storage + $0.09/GB transfer out
 *   S3 Intelligent-Tiering = auto-moves to cheaper tiers after 30 days
 *
 * When to use S3 over local:
 *   - Multi-instance deployment (files must be shared)
 *   - Files > 5GB (S3 multipart upload)
 *   - CDN distribution (CloudFront)
 *   - Bedrock Knowledge Base data source
 *
 * Note: This provider uses the AWS SDK for S3 which works with MinIO.
 * We use dynamic import to avoid requiring @aws-sdk when STORAGE_PROVIDER=local.
 */
@Injectable()
export class S3StorageProvider extends StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private client: unknown = null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint: string | undefined;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket =
      config.get<string>('AWS_S3_BUCKET') ??
      config.get<string>('MINIO_BUCKET', 'ai-interview-uploads');
    this.region = config.get<string>('AWS_REGION', 'us-east-1');
    this.endpoint = config.get<string>('MINIO_ENDPOINT'); // undefined for real S3
    this.baseUrl = this.endpoint ?? `https://s3.${this.region}.amazonaws.com`;
  }

  private async getClient() {
    if (this.client) return this.client;

    // Dynamic import: only loads AWS SDK when S3 provider is active
    const { S3Client } = await import('@aws-sdk/client-s3');

    const clientConfig: Record<string, unknown> = {
      region: this.region,
    };

    // MinIO configuration: use custom endpoint + path-style addressing
    if (this.endpoint) {
      clientConfig['endpoint'] = this.endpoint;
      clientConfig['forcePathStyle'] = true;
      clientConfig['credentials'] = {
        accessKeyId: this.config.get('MINIO_ROOT_USER', 'minioadmin'),
        secretAccessKey: this.config.get('MINIO_ROOT_PASSWORD', 'minioadmin123'),
      };
    }

    this.client = new S3Client(clientConfig);
    return this.client;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Server-side encryption for S3 (not MinIO)
        ...(this.endpoint ? {} : { ServerSideEncryption: 'AES256' }),
      }),
    );

    this.logger.debug(`Uploaded to S3/MinIO: ${this.bucket}/${key}`);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (client as any).send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    // response.Body is a SDK stream helper in modern AWS SDK.
    // We can call transformToByteArray() to get Uint8Array.
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getUrl(key: string): string {
    if (this.endpoint) {
      // MinIO: http://localhost:9000/bucket/key
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    // Real S3: pre-signed URL would be better for private buckets
    // For now, return the public URL pattern (only works for public buckets)
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const { HeadObjectCommand, NotFound } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err: unknown) {
      if (err instanceof NotFound) return false;
      throw err;
    }
  }
}
