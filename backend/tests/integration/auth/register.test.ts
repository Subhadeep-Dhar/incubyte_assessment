import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app.js';
import { User } from '../../../src/models/user.model.js';

describe('POST /api/auth/register - User Registration Integration Test', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  const validPayload = {
    name: 'Emily Blunt',
    email: 'emily.blunt@example.com',
    password: 'StrongPassword123!',
  };

  it('should register a new customer successfully with 201 Created and safe user object', async () => {
    const response = await request(app).post('/api/auth/register').send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('token');

    const { user, token } = response.body.data;
    expect(user.name).toBe('Emily Blunt');
    expect(user.email).toBe('emily.blunt@example.com');
    expect(user.role).toBe('customer');
    expect(user.id).toBeDefined();

    // CRITICAL SECURITY ASSERTION: Password and passwordHash must NEVER be returned
    expect(user.password).toBeUndefined();
    expect(user.passwordHash).toBeUndefined();
    expect(typeof token).toBe('string');

    // Verify user is persisted in real MongoDB instance
    const dbUser = await User.findOne({ email: 'emily.blunt@example.com' });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe('customer');
    expect(dbUser?.passwordHash).toBeDefined();
  });

  it('should normalize email address (case-insensitive and trimmed)', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Emily Blunt',
      email: '   EMILY.BLUNT@Example.COM   ',
      password: 'StrongPassword123!',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe('emily.blunt@example.com');

    const dbUser = await User.findOne({ email: 'emily.blunt@example.com' });
    expect(dbUser).not.toBeNull();
  });

  it('should return 409 Conflict when attempting to register with an existing email', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(validPayload);

    // Duplicate registration attempt with different casing
    const duplicateResponse = await request(app).post('/api/auth/register').send({
      name: 'Another Emily',
      email: 'EMILY.BLUNT@EXAMPLE.COM',
      password: 'DifferentPassword123!',
    });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toHaveProperty('success', false);
    expect(duplicateResponse.body.error).toHaveProperty('code', 'EMAIL_ALREADY_EXISTS');
  });

  it('should reject attempted role escalation by ignoring client-supplied role', async () => {
    const maliciousPayload = {
      ...validPayload,
      role: 'admin', // Malicious attempt to self-promote to administrator
    };

    const response = await request(app).post('/api/auth/register').send(maliciousPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('customer');

    // Confirm database record role is strictly customer
    const dbUser = await User.findOne({ email: validPayload.email });
    expect(dbUser?.role).toBe('customer');
  });

  it('should return 400 Bad Request when required fields are missing', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'only-email@example.com',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('should return 400 Bad Request when email is invalid', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Emily Blunt',
      email: 'invalid-email-string',
      password: 'StrongPassword123!',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 Bad Request when password does not meet security criteria', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Emily Blunt',
      email: 'emily@example.com',
      password: 'weak',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
