import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileProcessorService } from './file-processor.service';

// Mock dependencies if needed
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Extracted PDF text content',
    numpages: 2,
  });
});

jest.mock('mammoth', () => {
  return {
    extractRawText: jest.fn().mockResolvedValue({
      value: 'Extracted DOCX text content',
    }),
  };
});

describe('FileProcessorService', () => {
  let service: FileProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10), // 10MB
          },
        },
      ],
    }).compile();

    service = module.get<FileProcessorService>(FileProcessorService);
  });

  describe('validateFile', () => {
    it('should validate a PDF file successfully by magic bytes', async () => {
      // PDF Magic bytes: %PDF (25 50 44 46)
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x61, 0x62, 0x63]);
      const result = await service.validateFile(buffer, 'resume.pdf', 'application/pdf');

      expect(result.mimeType).toBe('application/pdf');
      expect(result.ext).toBe('.pdf');
      expect(result.originalName).toBe('resume.pdf');
    });

    it('should validate a DOCX file successfully by magic bytes', async () => {
      // DOCX Magic bytes: PK.. (50 4B 03 04)
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x61, 0x62, 0x63]);
      const result = await service.validateFile(buffer, 'resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(result.ext).toBe('.docx');
    });

    it('should throw BadRequestException if file exceeds size limit', async () => {
      // Let's instantiate a service with a very small size limit
      const localModule: TestingModule = await Test.createTestingModule({
        providers: [
          FileProcessorService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(0.00001), // tiny limit (approx 10 bytes)
            },
          },
        ],
      }).compile();
      const smallLimitService = localModule.get<FileProcessorService>(FileProcessorService);

      const buffer = Buffer.alloc(100); // 100 bytes
      await expect(
        smallLimitService.validateFile(buffer, 'resume.pdf', 'application/pdf'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if file format is unsupported', async () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]); // random bytes
      await expect(
        service.validateFile(buffer, 'malware.exe', 'application/octet-stream'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize dangerous filenames to prevent path traversal', async () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const result = await service.validateFile(pdfBuffer, '../../etc/passwd.pdf', 'application/pdf');
      expect(result.originalName).toBe('passwd.pdf');
    });
  });

  describe('extractText', () => {
    it('should extract text from a PDF file', async () => {
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const result = await service.extractText(buffer, 'application/pdf');

      expect(result.text).toContain('Extracted PDF text content');
      expect(result.pageCount).toBe(2);
      expect(result.wordCount).toBe(4);
    });

    it('should extract text from a DOCX file', async () => {
      const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const result = await service.extractText(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      expect(result.text).toContain('Extracted DOCX text content');
      expect(result.wordCount).toBe(4);
    });
  });
});
