import { StorageProvider } from '../providers/provider.interface';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * LocalStorageProvider
 *
 * Stores files on the local filesystem under UPLOAD_DIR.
 * Implements the StorageProvider interface — business logic
 * is completely unaware this is local storage vs S3.
 *
 * Directory structure:
 *   uploads/
 *   └── {sourceType}/     (e.g., resumes, job-descriptions)
 *       └── {userId}/
 *           └── {uuid}.{ext}
 *
 * AIP-C01 Note:
 *   Amazon S3 is the managed equivalent. Our S3Provider will
 *   implement the exact same interface. Switching is one env var.
 *   Cost: Local = $0 vs S3 = ~$0.023/GB/month
 */
@Injectable()
export class LocalStorageProvider extends StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
    this.baseUrl = config.get<string>('APP_URL', 'http://localhost:3001');
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    this.logger.debug(`Stored file locally: ${filePath}`);
    return key; // return the key (relative path) as the stored reference
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      // Ignore "file not found" errors — idempotent delete
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  getUrl(key: string): string {
    // Expose file via the backend's static file serving
    return `${this.baseUrl}/api/v1/files/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Build a structured key for deterministic file paths
   * e.g.: resumes/user-uuid/file-uuid.pdf
   */
  static buildKey(folder: string, userId: string, originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    return `${folder}/${userId}/${uuidv4()}${ext}`;
  }
}
