import { memoryStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Multer Upload Configuration
 *
 * We use memoryStorage (not diskStorage) intentionally:
 *   - Files land in memory as Buffer
 *   - We validate magic bytes BEFORE saving to disk/S3
 *   - Prevents writing unvalidated files to the filesystem
 *
 * Size limit is enforced at the Multer level (first defense)
 * AND again in FileProcessorService (second defense).
 *
 * Security Note:
 *   In production, set a reasonable memory limit per instance
 *   and enforce via OS-level memory limits on containers.
 *   For large files (>10MB), use streaming upload directly to S3.
 */
export const multerConfig: MulterOptions = {
  storage: memoryStorage(), // buffer in memory — we validate before persisting
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB Multer limit (our service enforces 10MB)
    files: 1, // one file per request
  },
};

/**
 * File filter factory — only allow document MIME types at the HTTP level.
 * This is a quick pre-filter, NOT a security control.
 * Real validation happens via magic bytes in FileProcessorService.
 */
export function documentFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowed.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
}
