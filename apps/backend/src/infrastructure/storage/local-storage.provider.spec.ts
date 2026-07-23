import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('file-content')),
  unlink: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
}));

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  const mockUploadDir = './test-uploads';
  const mockAppUrl = 'http://test-server';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'UPLOAD_DIR') return mockUploadDir;
              if (key === 'APP_URL') return mockAppUrl;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<LocalStorageProvider>(LocalStorageProvider);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('should write file to local filesystem and return the key', async () => {
      const buffer = Buffer.from('hello-world');
      const key = 'resumes/user1/file.pdf';
      const result = await provider.upload(key, buffer, 'application/pdf');

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.dirname(path.join(mockUploadDir, key)),
        { recursive: true }
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockUploadDir, key),
        buffer
      );
      expect(result).toBe(key);
    });
  });

  describe('download', () => {
    it('should read file from filesystem', async () => {
      const key = 'resumes/user1/file.pdf';
      const result = await provider.download(key);

      expect(fs.readFile).toHaveBeenCalledWith(path.join(mockUploadDir, key));
      expect(result.toString()).toBe('file-content');
    });
  });

  describe('delete', () => {
    it('should delete file from filesystem', async () => {
      const key = 'resumes/user1/file.pdf';
      await provider.delete(key);

      expect(fs.unlink).toHaveBeenCalledWith(path.join(mockUploadDir, key));
    });

    it('should ignore ENOENT error when deleting a non-existent file', async () => {
      const error: NodeJS.ErrnoException = new Error('File not found');
      error.code = 'ENOENT';
      (fs.unlink as jest.Mock).mockRejectedValueOnce(error);

      const key = 'resumes/user1/non-existent.pdf';
      await expect(provider.delete(key)).resolves.not.toThrow();
    });

    it('should throw other errors when deleting a file', async () => {
      const error: NodeJS.ErrnoException = new Error('Permission denied');
      error.code = 'EACCES';
      (fs.unlink as jest.Mock).mockRejectedValueOnce(error);

      const key = 'resumes/user1/file.pdf';
      await expect(provider.delete(key)).rejects.toThrow('Permission denied');
    });
  });

  describe('getUrl', () => {
    it('should return a formatted static file serving URL', () => {
      const key = 'resumes/user1/file.pdf';
      const result = provider.getUrl(key);

      expect(result).toBe(`${mockAppUrl}/api/v1/files/${key}`);
    });
  });

  describe('exists', () => {
    it('should return true if file is accessible', async () => {
      const key = 'resumes/user1/file.pdf';
      const result = await provider.exists(key);

      expect(fs.access).toHaveBeenCalledWith(path.join(mockUploadDir, key));
      expect(result).toBe(true);
    });

    it('should return false if file is not accessible', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('not accessible'));
      const key = 'resumes/user1/file.pdf';
      const result = await provider.exists(key);

      expect(result).toBe(false);
    });
  });
});
