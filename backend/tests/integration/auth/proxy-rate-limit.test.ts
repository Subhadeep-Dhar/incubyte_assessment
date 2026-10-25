import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import app from '../../../src/app.js';

describe('Express Trust Proxy & Rate Limiting Behind Reverse Proxy', () => {
  it('should have trust proxy configured to 1 on the Express application', () => {
    // Verifies app.set('trust proxy', 1) is active
    expect(app.get('trust proxy')).toBe(1);
  });

  it('should correctly resolve req.ip to the client IP through the trusted single proxy hop', async () => {
    let capturedIp = '';
    const testApp = express();
    testApp.set('trust proxy', 1);
    testApp.get('/test-ip', (req: Request, res: Response) => {
      capturedIp = req.ip || '';
      res.json({ ip: req.ip });
    });

    const clientIp = '203.0.113.50';
    const response = await request(testApp).get('/test-ip').set('X-Forwarded-For', clientIp);

    expect(response.status).toBe(200);
    expect(capturedIp).toBe(clientIp);
  });

  it('should ignore spoofed prepended IPs in X-Forwarded-For and select the IP added by the trusted proxy', async () => {
    let capturedIp = '';
    const testApp = express();
    testApp.set('trust proxy', 1);
    testApp.get('/test-ip', (req: Request, res: Response) => {
      capturedIp = req.ip || '';
      res.json({ ip: req.ip });
    });

    const spoofedIp = '198.51.100.99';
    const legitimateClientIp = '203.0.113.77';

    // X-Forwarded-For: <spoofed_client_ip>, <trusted_proxy_appended_ip>
    const response = await request(testApp)
      .get('/test-ip')
      .set('X-Forwarded-For', `${spoofedIp}, ${legitimateClientIp}`);

    expect(response.status).toBe(200);
    // Express with trust proxy: 1 inspects 1 hop from the right
    expect(capturedIp).toBe(legitimateClientIp);
    expect(capturedIp).not.toBe(spoofedIp);
  });

  describe('Rate Limiter Behavior Behind Proxy (No ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)', () => {
    let originalTestRateLimit: string | undefined;

    beforeEach(() => {
      originalTestRateLimit = process.env.TEST_RATE_LIMIT;
    });

    afterEach(() => {
      if (originalTestRateLimit !== undefined) {
        process.env.TEST_RATE_LIMIT = originalTestRateLimit;
      } else {
        delete process.env.TEST_RATE_LIMIT;
      }
    });

    it('should process authentication requests with X-Forwarded-For without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.88')
        .send({
          email: 'test.proxy@dealership.com',
          password: 'SomePassword123!',
        });

      // Returns 401 (invalid credentials) rather than 500 or rate-limit validation error
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should isolate rate limiting per client IP behind proxy and return 429 when threshold exceeded', async () => {
      const proxyApp = express();
      proxyApp.set('trust proxy', 1);

      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many authentication attempts.',
          },
        },
      });

      proxyApp.use(limiter);
      proxyApp.get('/api/test-limit', (_req: Request, res: Response) => {
        res.json({ success: true });
      });

      const clientA = '203.0.113.101';
      const clientB = '203.0.113.102';

      // Client A uses all 3 attempts
      await request(proxyApp).get('/api/test-limit').set('X-Forwarded-For', clientA);
      await request(proxyApp).get('/api/test-limit').set('X-Forwarded-For', clientA);
      await request(proxyApp).get('/api/test-limit').set('X-Forwarded-For', clientA);

      // Client A 4th attempt is rate-limited (429)
      const clientARateLimited = await request(proxyApp)
        .get('/api/test-limit')
        .set('X-Forwarded-For', clientA);

      expect(clientARateLimited.status).toBe(429);
      expect(clientARateLimited.body.error.code).toBe('TOO_MANY_REQUESTS');

      // Client B is NOT rate-limited (isolated IP buckets behind proxy)
      const clientBResponse = await request(proxyApp)
        .get('/api/test-limit')
        .set('X-Forwarded-For', clientB);

      expect(clientBResponse.status).toBe(200);
      expect(clientBResponse.body.success).toBe(true);
    });

    it('should prevent an attacker from bypassing rate limiting by prepending spoofed IPs to X-Forwarded-For', async () => {
      const proxyApp = express();
      proxyApp.set('trust proxy', 1);

      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
      });

      proxyApp.use(limiter);
      proxyApp.get('/api/test-spoof', (_req: Request, res: Response) => {
        res.json({ success: true });
      });

      const attackerRealIp = '198.51.100.200';

      // Attacker attempts with spoofed header
      await request(proxyApp)
        .get('/api/test-spoof')
        .set('X-Forwarded-For', `1.1.1.1, ${attackerRealIp}`);
      await request(proxyApp)
        .get('/api/test-spoof')
        .set('X-Forwarded-For', `2.2.2.2, ${attackerRealIp}`);

      // 3rd attempt with different spoofed IP prefix should still be throttled
      const response = await request(proxyApp)
        .get('/api/test-spoof')
        .set('X-Forwarded-For', `3.3.3.3, ${attackerRealIp}`);

      expect(response.status).toBe(429);
    });
  });
});
