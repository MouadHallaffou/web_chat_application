import Redis from 'ioredis';
import { logger } from './logger.service';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour

  private constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.redis.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  public async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.set(key, serializedValue, 'EX', ttl);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  public async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  public async flush(): Promise<void> {
    try {
      await this.redis.flushall();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const fresh = await fetchFn();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      return fetchFn();
    }
  }

  public async increment(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  public async decrement(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      logger.error('Cache decrement error:', error);
      return 0;
    }
  }

  public async setHash(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      logger.error('Cache setHash error:', error);
    }
  }

  public async getHash<T>(key: string, field: string): Promise<T | null> {
    try {
      const data = await this.redis.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache getHash error:', error);
      return null;
    }
  }

  public async getAllHash<T>(key: string): Promise<Record<string, T>> {
    try {
      const data = await this.redis.hgetall(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache getAllHash error:', error);
      return {};
    }
  }
}

export const cacheService = CacheService.getInstance(); 