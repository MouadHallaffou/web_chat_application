"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_service_1 = require("./logger.service");
class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1 hour
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        this.redis.on('error', (error) => {
            logger_service_1.logger.error('Redis error:', error);
        });
        this.redis.on('connect', () => {
            logger_service_1.logger.info('Redis connected successfully');
        });
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_service_1.logger.error('Cache get error:', error);
            return null;
        }
    }
    async set(key, value, ttl = this.defaultTTL) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redis.set(key, serializedValue, 'EX', ttl);
        }
        catch (error) {
            logger_service_1.logger.error('Cache set error:', error);
        }
    }
    async del(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            logger_service_1.logger.error('Cache delete error:', error);
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_service_1.logger.error('Cache exists error:', error);
            return false;
        }
    }
    async flush() {
        try {
            await this.redis.flushall();
        }
        catch (error) {
            logger_service_1.logger.error('Cache flush error:', error);
        }
    }
    async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            const fresh = await fetchFn();
            await this.set(key, fresh, ttl);
            return fresh;
        }
        catch (error) {
            logger_service_1.logger.error('Cache getOrSet error:', error);
            return fetchFn();
        }
    }
    async increment(key) {
        try {
            return await this.redis.incr(key);
        }
        catch (error) {
            logger_service_1.logger.error('Cache increment error:', error);
            return 0;
        }
    }
    async decrement(key) {
        try {
            return await this.redis.decr(key);
        }
        catch (error) {
            logger_service_1.logger.error('Cache decrement error:', error);
            return 0;
        }
    }
    async setHash(key, field, value) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redis.hset(key, field, serializedValue);
        }
        catch (error) {
            logger_service_1.logger.error('Cache setHash error:', error);
        }
    }
    async getHash(key, field) {
        try {
            const data = await this.redis.hget(key, field);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_service_1.logger.error('Cache getHash error:', error);
            return null;
        }
    }
    async getAllHash(key) {
        try {
            const data = await this.redis.hgetall(key);
            const result = {};
            for (const [field, value] of Object.entries(data)) {
                result[field] = JSON.parse(value);
            }
            return result;
        }
        catch (error) {
            logger_service_1.logger.error('Cache getAllHash error:', error);
            return {};
        }
    }
}
exports.CacheService = CacheService;
exports.cacheService = CacheService.getInstance();
