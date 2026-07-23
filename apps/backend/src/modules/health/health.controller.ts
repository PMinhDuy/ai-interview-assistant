import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@SkipThrottle() // Health checks should never be rate limited
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? '1.0.0',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependency status' })
  async detailed() {
    const [dbHealthy, redisHealthy] = await Promise.all([
      this.prisma.isHealthy(),
      this.redis.isHealthy(),
    ]);

    const aiProvider = this.config.get('AI_PROVIDER', 'local');
    const ollamaUrl = this.config.get('OLLAMA_BASE_URL', 'http://localhost:11434');

    return {
      status: dbHealthy && redisHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: { status: dbHealthy ? 'healthy' : 'unhealthy' },
        redis: { status: redisHealthy ? 'healthy' : 'unhealthy' },
        aiProvider: {
          type: aiProvider,
          url: aiProvider === 'local' ? ollamaUrl : 'Amazon Bedrock',
        },
      },
      environment: this.config.get('NODE_ENV'),
    };
  }
}
