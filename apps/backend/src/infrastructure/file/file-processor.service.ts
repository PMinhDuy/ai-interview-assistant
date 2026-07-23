import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

// ── Allowed MIME types with their magic byte signatures ────────
// CRITICAL: Never trust the file extension alone.
// Attackers can rename malware.exe to resume.pdf.
// We validate the actual file bytes (magic bytes / file signature).
const ALLOWED_TYPES: Record<string, { mime: string; ext: string; magic: number[] }[]> = {
  'application/pdf': [
    { mime: 'application/pdf', ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: '.docx',
      magic: [0x50, 0x4b, 0x03, 0x04], // PK.. (ZIP format — DOCX is a ZIP)
    },
  ],
  'application/msword': [
    { mime: 'application/msword', ext: '.doc', magic: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2 compound
  ],
};

export type ExtractedDocument = {
  text: string;
  pageCount?: number;
  wordCount: number;
  characterCount: number;
};

export type ValidatedFile = {
  buffer: Buffer;
  mimeType: string;
  ext: string;
  size: number;
  originalName: string;
};

/**
 * FileProcessorService
 *
 * Responsibilities:
 *   1. Validate uploaded files (magic bytes, size, type)
 *   2. Extract text from PDF and DOCX files
 *   3. Generate document statistics (word count, page count)
 *
 * Security principles:
 *   - Never trust the claimed MIME type from the HTTP request
 *   - Validate magic bytes from the actual file buffer
 *   - Limit file size to prevent DoS
 *   - Never execute uploaded files
 *
 * AIP-C01 relevance:
 *   Extracted text is the INPUT to the embedding pipeline.
 *   Quality of text extraction directly impacts RAG accuracy.
 */
@Injectable()
export class FileProcessorService {
  private readonly logger = new Logger(FileProcessorService.name);
  private readonly maxSizeBytes: number;

  constructor(private readonly config: ConfigService) {
    const maxMb = config.get<number>('MAX_FILE_SIZE_MB', 10);
    this.maxSizeBytes = maxMb * 1024 * 1024;
  }

  // ── Validation ───────────────────────────────────────────────

  /**
   * Validate a file by:
   * 1. Size check
   * 2. Magic byte detection (not extension or claimed MIME)
   * 3. Allowed type check
   *
   * Returns a validated file object with the TRUE mime type.
   */
  async validateFile(buffer: Buffer, originalName: string, claimedMime?: string): Promise<ValidatedFile> {
    // Step 1: Size check
    if (buffer.length > this.maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxSizeBytes / 1024 / 1024}MB`,
      );
    }

    if (buffer.length === 0) {
      throw new BadRequestException('Empty file is not allowed');
    }

    // Step 2: Detect actual type from magic bytes
    const detectedType = this.detectMimeFromMagicBytes(buffer);

    if (!detectedType) {
      throw new BadRequestException(
        `File type not supported. Allowed types: PDF, DOCX, DOC`,
      );
    }

    // Step 3: Log if claimed MIME doesn't match detected (potential manipulation)
    if (claimedMime && claimedMime !== detectedType.mime) {
      this.logger.warn(
        `MIME mismatch: claimed=${claimedMime}, detected=${detectedType.mime}, file=${originalName}`,
      );
    }

    this.logger.debug(
      `File validated: ${originalName} (${detectedType.mime}, ${buffer.length} bytes)`,
    );

    return {
      buffer,
      mimeType: detectedType.mime,
      ext: detectedType.ext,
      size: buffer.length,
      originalName: this.sanitizeFilename(originalName),
    };
  }

  // ── Text Extraction ──────────────────────────────────────────

  async extractText(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
    const startMs = Date.now();

    let result: ExtractedDocument;

    if (mimeType === 'application/pdf') {
      result = await this.extractFromPdf(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      result = await this.extractFromDocx(buffer);
    } else {
      throw new BadRequestException(`Cannot extract text from mime type: ${mimeType}`);
    }

    this.logger.debug(
      `Text extraction complete in ${Date.now() - startMs}ms: ${result.wordCount} words`,
    );

    return result;
  }

  // ── Private Helpers ──────────────────────────────────────────

  private async extractFromPdf(buffer: Buffer): Promise<ExtractedDocument> {
    // Dynamic import — pdf-parse is only loaded when processing PDFs
    const pdfParse = await import('pdf-parse');
    const parse = pdfParse.default ?? pdfParse;

    const data = await (parse as unknown as (buffer: Buffer) => Promise<{ text: string; numpages: number }>)(buffer);

    const text = this.cleanExtractedText(data.text);

    return {
      text,
      pageCount: data.numpages,
      wordCount: this.countWords(text),
      characterCount: text.length,
    };
  }

  private async extractFromDocx(buffer: Buffer): Promise<ExtractedDocument> {
    // Dynamic import — mammoth is only loaded when processing DOCX files
    const mammoth = await import('mammoth');

    const { value: text } = await mammoth.extractRawText({ buffer });
    const cleaned = this.cleanExtractedText(text);

    return {
      text: cleaned,
      wordCount: this.countWords(cleaned),
      characterCount: cleaned.length,
    };
  }

  private detectMimeFromMagicBytes(buffer: Buffer): { mime: string; ext: string } | null {
    for (const variants of Object.values(ALLOWED_TYPES)) {
      for (const variant of variants) {
        const magic = variant.magic;
        const match = magic.every((byte, i) => buffer[i] === byte);
        if (match) {
          return { mime: variant.mime, ext: variant.ext };
        }
      }
    }
    return null;
  }

  private cleanExtractedText(text: string): string {
    return text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace (more than 2 consecutive newlines)
      .replace(/\n{3,}/g, '\n\n')
      // Remove null bytes
      .replace(/\0/g, '')
      // Trim
      .trim();
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  /**
   * Sanitize filename to prevent path traversal attacks.
   * e.g. "../../etc/passwd.pdf" → "etc-passwd.pdf"
   */
  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);

    // Remove dangerous characters
    const safe = base
      .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
      .replace(/\.\./g, '')
      .trim()
      .substring(0, 200); // max length

    return `${safe || 'document'}${ext}`;
  }
}
