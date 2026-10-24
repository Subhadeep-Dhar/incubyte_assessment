import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for sensitive authentication endpoints (login, register).
 * Throttles brute-force attempts while remaining transparent during tests.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 20, // 20 attempts per 15m in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip rate limiting during test executions
});
