import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken, AuthTokenPayload } from '../../../src/utils/jwt.util.js';
import { env } from '../../../src/config/env.js';

describe('JWT Utility (Unit Test)', () => {
  const samplePayload: AuthTokenPayload = {
    userId: '65f1234567890abcdef12345',
    email: 'buyer@example.com',
    role: 'customer',
  };

  it('should generate a valid JWT token signed with HS256', () => {
    const token = signToken(samplePayload);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
    expect(decoded?.payload).toMatchObject(samplePayload);
  });

  it('should verify and decode valid token back to payload', () => {
    const token = signToken(samplePayload);
    const verified = verifyToken(token);

    expect(verified.userId).toBe(samplePayload.userId);
    expect(verified.email).toBe(samplePayload.email);
    expect(verified.role).toBe(samplePayload.role);
    expect(verified.iat).toBeDefined();
    expect(verified.exp).toBeDefined();
  });

  it('should throw an error when token signature is tampered', () => {
    const token = signToken(samplePayload);
    const tamperedToken = token.slice(0, -6) + 'abcdef';

    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  it('should throw an error when token is signed with a different secret', () => {
    const invalidToken = jwt.sign(samplePayload, 'wrong_secret_key_12345678901234', {
      algorithm: 'HS256',
    });

    expect(() => verifyToken(invalidToken)).toThrow();
  });

  it('should reject tokens signed with "none" algorithm', () => {
    // Unsecured token test
    const unsignedToken = jwt.sign(samplePayload, '', { algorithm: 'none' });

    expect(() => verifyToken(unsignedToken)).toThrow();
  });

  it('should throw when token has expired', () => {
    const expiredToken = jwt.sign(samplePayload, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '-10s', // Already expired 10 seconds ago
    });

    expect(() => verifyToken(expiredToken)).toThrow();
  });
});
