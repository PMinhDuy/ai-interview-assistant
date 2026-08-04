import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null = null;
  private readonly inMemoryCache = new Map<string, { value: string; expiresAt?: number }>();

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 5) {
              this.logger.warn('Redis connection failed after 5 retries. Falling back to in-memory mode.');
              return null;
            }
            return Math.min(times * 100, 2000);
          },
        });

        this.client.on('connect', () => this.logger.log('✅ Redis connected'));
        this.client.on('error', (err: Error) => this.logger.warn(`Redis error: ${err.message}`));

        this.client.connect().catch((err: Error) => {
          this.logger.warn(`Failed to connect to Redis (${err.message}). Using in-memory fallback.`);
        });
      } catch (err) {
        this.logger.warn(`Failed to initialize Redis client: ${(err as Error).message}. Using in-memory fallback.`);
        this.client = null;
      }
    } else {
      this.logger.log('ℹ️ REDIS_URL not configured. Operating in in-memory cache mode.');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.logger.log('Redis disconnected');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.status === 'ready') {
      try {
        return await this.client.get(key);
      } catch {
        // fallback to memory
      }
    }
    const item = this.inMemoryCache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.set(key, value);
        return;
      } catch {
        // fallback to memory
      }
    }
    this.inMemoryCache.set(key, { value });
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.setex(key, ttlSeconds, value);
        return;
      } catch {
        // fallback to memory
      }
    }
    this.inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client && this.client.status === 'ready') {
      try {
        await this.client.del(key);
      } catch {
        // ignore
      }
    }
    this.inMemoryCache.delete(key);
  }

  async ping(): Promise<string> {
    if (this.client && this.client.status === 'ready') {
      return this.client.ping();
    }
    return 'PONG';
  }

  async setex_json(key: string, ttlSeconds: number, value: unknown): Promise<void> {
    await this.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async get_json<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async isHealthy(): Promise<boolean> {
    if (this.client && this.client.status === 'ready') {
      try {
        const result = await this.client.ping();
        return result === 'PONG';
      } catch {
        return false;
      }
    }
    return true;
  }
}
