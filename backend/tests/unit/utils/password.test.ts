import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/utils/password.util.js';

describe('Password Utility (Unit Test)', () => {
  const plainPassword = 'SuperSecretPassword123!';

  it('should hash a plaintext password with bcrypt (12 salt rounds format)', async () => {
    const hash = await hashPassword(plainPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(plainPassword);
    // Bcrypt hash starts with $2a$ or $2b$ and has 60 characters
    expect(hash).toMatch(/^\$2[ab]\$12\$/);
  });

  it('should verify correct password against generated hash', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword(plainPassword, hash);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password against generated hash', async () => {
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword('WrongPassword999!', hash);

    expect(isValid).toBe(false);
  });

  it('should generate different salts for the same password', async () => {
    const hash1 = await hashPassword(plainPassword);
    const hash2 = await hashPassword(plainPassword);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(plainPassword, hash1)).toBe(true);
    expect(await verifyPassword(plainPassword, hash2)).toBe(true);
  });
});
