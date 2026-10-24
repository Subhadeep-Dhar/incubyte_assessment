import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../../src/models/user.model.js';

describe('User Model (Unit & Persistence Integration Test)', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a valid user with default role "customer"', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'SecurePassword123!',
    });

    expect(user._id).toBeDefined();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john.doe@example.com');
    expect(user.role).toBe('customer');
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('should normalize email to lowercase and trim whitespace', async () => {
    const user = await User.create({
      name: 'Jane Doe',
      email: '  JANE.DOE@Example.COM  ',
      password: 'SecurePassword123!',
    });

    expect(user.email).toBe('jane.doe@example.com');
  });

  it('should verify correct password using comparePassword method', async () => {
    const user = await User.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'MyPassword123!',
    });

    const isMatch = await user.comparePassword('MyPassword123!');
    const isWrong = await user.comparePassword('WrongPassword!');

    expect(isMatch).toBe(true);
    expect(isWrong).toBe(false);
  });

  it('should strip passwordHash from toJSON serialization', async () => {
    const user = await User.create({
      name: 'Bob Jones',
      email: 'bob@example.com',
      password: 'SecretBobPassword123!',
    });

    const json = user.toJSON();

    expect(json.passwordHash).toBeUndefined();
    expect(json.email).toBe('bob@example.com');
    expect(json.name).toBe('Bob Jones');
    expect(json.role).toBe('customer');
    expect(json.id).toBeDefined();
  });

  it('should reject invalid role not in enum', async () => {
    await expect(
      User.create({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password123!',
        // @ts-expect-error testing invalid role
        role: 'superadmin',
      }),
    ).rejects.toThrow();
  });

  it('should enforce unique email constraint at database level', async () => {
    await User.create({
      name: 'First User',
      email: 'unique@example.com',
      password: 'Password123!',
    });

    // Ensure indexes are built
    await User.init();

    await expect(
      User.create({
        name: 'Second User',
        email: 'UNIQUE@example.com', // same normalized email
        password: 'Password123!',
      }),
    ).rejects.toThrow();
  });
});
