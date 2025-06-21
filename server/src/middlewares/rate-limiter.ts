import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { cacheService } from '../services/cache.service';
import { logger } from '../services/logger.service';

// Rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: cacheService.getRedisClient(),
    prefix: 'auth-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts, please try again after 15 minutes'
    });
  }
});

// Rate limiter for API endpoints
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: cacheService.getRedisClient(),
    prefix: 'api-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
  }
});

// Rate limiter for WebSocket connections
export const wsLimiter = rateLimit({
  store: new RedisStore({
    client: cacheService.getRedisClient(),
    prefix: 'ws-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 connections per minute
  message: 'Too many WebSocket connections, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`WebSocket rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many WebSocket connections, please try again later'
    });
  }
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    client: cacheService.getRedisClient(),
    prefix: 'upload-limit:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many file uploads, please try again later'
    });
  }
});

// Rate limiter for message sending
export const messageLimiter = rateLimit({
  store: new RedisStore({
    client: cacheService.getRedisClient(),
    prefix: 'message-limit:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
  message: 'Too many messages, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Message rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many messages, please try again later'
    });
  }
}); 