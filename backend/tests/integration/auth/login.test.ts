import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { User } from '../../../src/models/user.model.js';
import { verifyToken } from '../../../src/utils/jwt.util.js';

describe('POST /api/auth/login - User Login Integration Test', () => {
  const registeredEmail = 'customer@dealership.com';
  const rawPassword = 'CorrectPassword123!';

  beforeEach(async () => {
    await User.deleteMany({});

    // Register a valid customer account directly
    await User.create({
      name: 'Registered Customer',
      email: registeredEmail,
      password: rawPassword,
      role: 'customer',
    });
  });

  it('should authenticate valid credentials and return 200 OK with JWT and safe user profile', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: registeredEmail,
      password: rawPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');

    const { user, token } = response.body.data;
    expect(user.email).toBe(registeredEmail);
    expect(user.name).toBe('Registered Customer');
    expect(user.role).toBe('customer');
    expect(user.id).toBeDefined();

    // Security assertion: no hash in response
    expect(user.password).toBeUndefined();
    expect(user.passwordHash).toBeUndefined();

    // Verify token validity and claims
    const verified = verifyToken(token);
    expect(verified.userId).toBe(user.id);
    expect(verified.email).toBe(registeredEmail);
    expect(verified.role).toBe('customer');
  });

  it('should support case-insensitive and trimmed email authentication', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: '  CUSTOMER@DEALERSHIP.COM  ',
      password: rawPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(registeredEmail);
  });

  it('should return 401 Unauthorized for incorrect password with generic error message', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: registeredEmail,
      password: 'IncorrectPassword999!',
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('should return identical 401 Unauthorized for non-existent account to prevent user enumeration', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'unknown-account@dealership.com',
      password: rawPassword,
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('should return 400 Bad Request when password is missing', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: registeredEmail,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 Bad Request when email is malformed', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'invalid-email-format',
      password: rawPassword,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
