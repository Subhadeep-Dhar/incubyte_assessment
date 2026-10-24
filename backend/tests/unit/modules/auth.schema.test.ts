import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../../src/modules/auth/auth.schema.js';

describe('Auth Validation Schemas (Unit Test)', () => {
  describe('registerSchema', () => {
    it('should validate a correct registration payload', () => {
      const input = {
        name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        password: 'Password123!',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('sarah.connor@example.com');
        expect(result.data.name).toBe('Sarah Connor');
      }
    });

    it('should normalize email to lowercase and trim spaces', () => {
      const input = {
        name: 'Sarah Connor',
        email: '  SARAH.CONNOR@Example.COM  ',
        password: 'Password123!',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('sarah.connor@example.com');
      }
    });

    it('should reject short name (< 2 characters)', () => {
      const input = {
        name: 'S',
        email: 'sarah@example.com',
        password: 'Password123!',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('name');
      }
    });

    it('should reject malformed email address', () => {
      const input = {
        name: 'Sarah Connor',
        email: 'not-an-email',
        password: 'Password123!',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('email');
      }
    });

    it('should enforce password complexity (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)', () => {
      const weakPasswords = [
        'short1!', // < 8 chars
        'alllowercase123!', // no uppercase
        'ALLUPPERCASE123!', // no lowercase
        'NoNumbersHere!!', // no number
        'NoSpecialChar123', // no special char
      ];

      for (const password of weakPasswords) {
        const result = registerSchema.safeParse({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password,
        });
        expect(result.success).toBe(false);
      }
    });

    it('should strip/ignore client-provided role attribute to prevent privilege escalation', () => {
      const input = {
        name: 'Attacker User',
        email: 'attacker@example.com',
        password: 'Password123!',
        role: 'admin', // Attempted role escalation
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        // Parsed output must NOT contain role
        expect((result.data as Record<string, unknown>).role).toBeUndefined();
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const input = {
        email: 'user@example.com',
        password: 'SomePassword123',
      };

      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty password or invalid email', () => {
      expect(loginSchema.safeParse({ email: 'bad-email', password: 'pw' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'ok@ex.com', password: '' }).success).toBe(false);
    });
  });
});
