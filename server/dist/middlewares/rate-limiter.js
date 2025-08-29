"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageLimiter = exports.uploadLimiter = exports.wsLimiter = exports.apiLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const cache_service_1 = require("../services/cache.service");
const logger_service_1 = require("../services/logger.service");
// Rate limiter for authentication endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    store: new rate_limit_redis_1.default({
        client: cache_service_1.cacheService.getRedisClient(),
        prefix: 'auth-limit:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_service_1.logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many login attempts, please try again after 15 minutes'
        });
    }
});
// Rate limiter for API endpoints
exports.apiLimiter = (0, express_rate_limit_1.default)({
    store: new rate_limit_redis_1.default({
        client: cache_service_1.cacheService.getRedisClient(),
        prefix: 'api-limit:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_service_1.logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many requests, please try again later'
        });
    }
});
// Rate limiter for WebSocket connections
exports.wsLimiter = (0, express_rate_limit_1.default)({
    store: new rate_limit_redis_1.default({
        client: cache_service_1.cacheService.getRedisClient(),
        prefix: 'ws-limit:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 connections per minute
    message: 'Too many WebSocket connections, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_service_1.logger.warn(`WebSocket rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many WebSocket connections, please try again later'
        });
    }
});
// Rate limiter for file uploads
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    store: new rate_limit_redis_1.default({
        client: cache_service_1.cacheService.getRedisClient(),
        prefix: 'upload-limit:'
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_service_1.logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many file uploads, please try again later'
        });
    }
});
// Rate limiter for message sending
exports.messageLimiter = (0, express_rate_limit_1.default)({
    store: new rate_limit_redis_1.default({
        client: cache_service_1.cacheService.getRedisClient(),
        prefix: 'message-limit:'
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 messages per minute
    message: 'Too many messages, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_service_1.logger.warn(`Message rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Too many messages, please try again later'
        });
    }
});
