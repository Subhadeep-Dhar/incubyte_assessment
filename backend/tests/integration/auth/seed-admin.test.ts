import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../../../src/models/user.model.js';
import { seedAdmin } from '../../../src/scripts/seed-admin.js';
import request from 'supertest';
import app from '../../../src/app.js';

describe('Admin Provisioning CLI Seed (Integration Test)', () => {
  const adminCredentials = {
    name: 'Root Administrator',
    email: 'admin.seed@dealership.com',
    password: 'SeedAdminPassword123!',
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should provision a new administrator account when none exists', async () => {
    const result = await seedAdmin(adminCredentials);

    expect(result.status).toBe('created');
    expect(result.user.email).toBe('admin.seed@dealership.com');
    expect(result.user.name).toBe('Root Administrator');
    expect(result.user.role).toBe('admin');

    // Verify in database
    const dbUser = await User.findOne({ email: 'admin.seed@dealership.com' });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.role).toBe('admin');
    expect(await dbUser?.comparePassword(adminCredentials.password)).toBe(true);
  });

  it('should be strictly idempotent: running multiple times does not duplicate admin', async () => {
    // First run creates
    const firstRun = await seedAdmin(adminCredentials);
    expect(firstRun.status).toBe('created');

    // Second run skips gracefully
    const secondRun = await seedAdmin(adminCredentials);
    expect(secondRun.status).toBe('skipped');

    // Verify exactly one admin exists in database
    const adminCount = await User.countDocuments({ email: 'admin.seed@dealership.com' });
    expect(adminCount).toBe(1);
  });

  it('should not overwrite an existing administrator password on subsequent seed runs', async () => {
    // Initial provisioning
    await seedAdmin(adminCredentials);

    // Attempt second seed with a different password
    const secondRun = await seedAdmin({
      ...adminCredentials,
      password: 'AttemptedNewPassword999!',
    });

    expect(secondRun.status).toBe('skipped');

    // Verify original password is still intact and the new password was NOT written
    const dbUser = await User.findOne({ email: 'admin.seed@dealership.com' });
    expect(await dbUser?.comparePassword(adminCredentials.password)).toBe(true);
    expect(await dbUser?.comparePassword('AttemptedNewPassword999!')).toBe(false);
  });

  it('should throw an error when required bootstrap credentials are not provided', async () => {
    await expect(
      seedAdmin({
        name: 'Incomplete Admin',
        email: '',
        password: '',
      }),
    ).rejects.toThrow('Missing required administrator credentials');
  });

  it('should allow the seeded administrator to authenticate via POST /api/auth/login and receive admin role', async () => {
    await seedAdmin(adminCredentials);

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: adminCredentials.email,
      password: adminCredentials.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.role).toBe('admin');
    expect(typeof loginResponse.body.data.token).toBe('string');
  });
});
