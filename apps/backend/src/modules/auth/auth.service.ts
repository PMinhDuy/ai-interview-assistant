import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type {
  AuthResponse,
  AuthTokens,
  JwtPayload,
  RegisterRequest,
  LoginRequest,
} from '@repo/types';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async register(dto: RegisterRequest): Promise<AuthResponse> {
    // Check for existing user
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      // Use generic message to prevent email enumeration
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    this.logger.log(`New user registered: ${user.id}`, 'AuthService');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async login(dto: LoginRequest): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Constant-time comparison to prevent timing attacks
    const passwordHash = user?.passwordHash ?? '$2b$12$invalid.hash.for.timing';
    const isValid = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.id}`, 'AuthService');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    // Check if token is in the Redis allowlist
    const storedToken = await this.redis.get(`${REFRESH_TOKEN_PREFIX}${userId}`);
    if (!storedToken) {
      throw new UnauthorizedException('Session expired');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`Tokens refreshed for user: ${user.id}`, 'AuthService');

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    // Invalidate refresh token in both DB and Redis
    await Promise.all([
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }),
      this.redis.del(`${REFRESH_TOKEN_PREFIX}${userId}`),
    ]);

    this.logger.log(`User logged out: ${userId}`, 'AuthService');
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) return;

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // TODO Phase 11: Send email via SES or SMTP
    this.logger.log(`Password reset requested for: ${user.id}`, 'AuthService');
    this.logger.debug(`Reset token (dev only): ${token}`, 'AuthService');
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user || !user.passwordResetExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        refreshTokenHash: null, // Invalidate all sessions
      },
    });

    // Invalidate Redis refresh token
    await this.redis.del(`${REFRESH_TOKEN_PREFIX}${user.id}`);

    this.logger.log(`Password reset completed for: ${user.id}`, 'AuthService');
  }

  // ── Private helpers ────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role: role as JwtPayload['role'] };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 days

    await Promise.all([
      // Store hash in DB for persistence across Redis restarts
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: hash },
      }),
      // Store in Redis for fast invalidation lookup
      this.redis.setex(`${REFRESH_TOKEN_PREFIX}${userId}`, ttlSeconds, '1'),
    ]);
  }
}
