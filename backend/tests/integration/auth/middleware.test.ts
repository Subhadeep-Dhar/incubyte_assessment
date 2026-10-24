import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import app from '../../../src/app.js';
import { User, IUser } from '../../../src/models/user.model.js';
import { signToken } from '../../../src/utils/jwt.util.js';
import { authenticateJwt, requireRole } from '../../../src/middleware/auth.middleware.js';
import { env } from '../../../src/config/env.js';
import jwt from 'jsonwebtoken';

describe('Auth & RBAC Middleware Integration Tests', () => {
  let customerUser: IUser;
  let adminUser: IUser;
  let customerToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await User.deleteMany({});

    customerUser = await User.create({
      name: 'Regular Customer',
      email: 'customer@test.com',
      password: 'CustomerPassword123!',
      role: 'customer',
    });

    adminUser = await User.create({
      name: 'Executive Admin',
      email: 'admin@test.com',
      password: 'AdminPassword123!',
      role: 'admin',
    });

    customerToken = signToken({
      userId: customerUser._id.toString(),
      email: customerUser.email,
      role: customerUser.role,
    });

    adminToken = signToken({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
    });
  });

  describe('GET /api/auth/me - Authenticated Identity Context', () => {
    it('should return current authenticated user profile for valid customer token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user).toMatchObject({
        email: 'customer@test.com',
        name: 'Regular Customer',
        role: 'customer',
      });
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject request when Authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
      expect(response.body.error.message).toContain('missing or malformed');
    });

    it('should reject request when token is malformed (not Bearer format)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Basic ${customerToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request when token signature is invalid or tampered', async () => {
      const tamperedToken = customerToken.slice(0, -5) + 'xxxxx';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toContain('invalid or has expired');
    });

    it('should reject request when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: customerUser._id.toString(), email: customerUser.email, role: 'customer' },
        env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '-1s' },
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Role-Based Authorization Primitives (requireRole)', () => {
    // Dedicated test express app to verify requireRole in isolation without cluttering domain routes
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      '/test/customer-area',
      authenticateJwt,
      requireRole('customer', 'admin'),
      (req: Request, res: Response) => {
        res.status(200).json({ success: true, message: 'Welcome customer', user: req.user });
      },
    );

    testApp.get(
      '/test/admin-only',
      authenticateJwt,
      requireRole('admin'),
      (req: Request, res: Response) => {
        res.status(200).json({ success: true, message: 'Welcome administrator', user: req.user });
      },
    );

    it('allows customer access to customer-permitted endpoints', async () => {
      const response = await request(testApp)
        .get('/test/customer-area')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.role).toBe('customer');
    });

    it('strictly FORBIDS customer access to admin-only endpoints (403 Forbidden)', async () => {
      const response = await request(testApp)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
      expect(response.body.error.message).toContain(
        'Access denied. Requires one of the following roles: [admin]',
      );
    });

    it('allows legitimately provisioned administrator access to admin-only endpoints (200 OK)', async () => {
      const response = await request(testApp)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user.role).toBe('admin');
    });

    it('rejects unauthenticated user from protected routes (401 Unauthorized)', async () => {
      const response = await request(testApp).get('/test/admin-only');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects tokens where role claim was tampered without matching secret signature', async () => {
      // Craft a fake token signed with an unauthorized secret
      const forgedAdminToken = jwt.sign(
        { userId: customerUser._id.toString(), email: customerUser.email, role: 'admin' },
        'attacker_forged_secret_key_1234567890',
        { algorithm: 'HS256' },
      );

      const response = await request(testApp)
        .get('/test/admin-only')
        .set('Authorization', `Bearer ${forgedAdminToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
