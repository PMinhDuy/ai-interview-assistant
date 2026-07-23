import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { LoggerService } from '../../infrastructure/logger/logger.service';

// ── Mocks ─────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockRedis = {
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

const mockJwt = {
  signAsync: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-secret-64-chars-minimum-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      JWT_REFRESH_SECRET: 'refresh-secret-64-chars-minimum-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    };
    return map[key] ?? 'default';
  }),
  get: jest.fn((key: string, fallback?: string) => fallback ?? 'default'),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// ── Tests ──────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();

    // Default mock implementations
    mockJwt.signAsync.mockResolvedValue('mock.jwt.token');
    mockRedis.setex.mockResolvedValue('OK');
  });

  // ── register ───────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-123',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'USER',
        createdAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register(dto);

      expect(result.user.email).toBe(dto.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should store email as lowercase', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'USER',
        createdAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({});

      await service.register({ ...dto, email: 'TEST@EXAMPLE.COM' });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@example.com' }),
        }),
      );
    });
  });

  // ── login ──────────────────────────────────────────────────

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const hash = await bcrypt.hash('SecurePass123!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: hash,
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct-password', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-123',
        passwordHash: hash,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date(),
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Even for non-existent user, bcrypt.compare runs (timing attack prevention)
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notexist@example.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ─────────────────────────────────────────────────

  describe('logout', () => {
    it('should invalidate tokens on logout', async () => {
      mockPrisma.user.update.mockResolvedValue({});
      mockRedis.del.mockResolvedValue(1);

      await service.logout('uuid-123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { refreshTokenHash: null },
        }),
      );
      expect(mockRedis.del).toHaveBeenCalled();
    });
  });
});
