import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

dotenv.config();

export interface SeedAdminInput {
  name?: string;
  email?: string;
  password?: string;
  resetPassword?: boolean;
}

export interface SeedAdminResult {
  status: 'created' | 'skipped' | 'updated';
  user: Record<string, unknown>;
}

/**
 * Idempotently provisions the initial administrator account.
 * Reads credentials strictly from environment variables or explicit parameters.
 * Supports secure password reset via resetPassword option, ADMIN_RESET_PASSWORD=true, or --reset-password CLI flag.
 * Never logs or exposes passwords or hashes.
 */
export async function seedAdmin(input?: SeedAdminInput): Promise<SeedAdminResult> {
  const name =
    input?.name !== undefined
      ? input.name
      : (process.env.ADMIN_INITIAL_NAME ?? 'System Administrator');
  const email = input?.email ?? process.env.ADMIN_INITIAL_EMAIL;
  const password = input?.password ?? process.env.ADMIN_INITIAL_PASSWORD;

  if (
    !name ||
    name.trim() === '' ||
    !email ||
    !password ||
    email.trim() === '' ||
    password.trim() === ''
  ) {
    throw new Error(
      'Missing required administrator credentials. Ensure ADMIN_INITIAL_NAME, ADMIN_INITIAL_EMAIL, and ADMIN_INITIAL_PASSWORD are provided.',
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const shouldReset =
    input?.resetPassword === true ||
    process.env.ADMIN_RESET_PASSWORD === 'true' ||
    process.argv.includes('--reset-password');

  // Check if administrator already exists
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (shouldReset) {
      existingUser.password = password; // triggers virtual setter and pre-validate hashing hook
      if (name && name.trim()) {
        existingUser.name = name.trim();
      }
      existingUser.role = 'admin';
      await existingUser.save();

      console.info(
        `[Admin Seed] Account with email "${normalizedEmail}" already exists. Password successfully reset.`,
      );
      return {
        status: 'updated',
        user: existingUser.toJSON(),
      };
    }

    console.info(
      `[Admin Seed] Account with email "${normalizedEmail}" already exists. Skipping provisioning.`,
    );
    return {
      status: 'skipped',
      user: existingUser.toJSON(),
    };
  }

  // Create new administrator account
  const newAdmin = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'admin',
  });

  console.info(
    `[Admin Seed] Successfully provisioned administrator account for: ${normalizedEmail}`,
  );

  return {
    status: 'created',
    user: newAdmin.toJSON(),
  };
}

// Standalone CLI runner entry point
async function runStandalone(): Promise<void> {
  try {
    console.info('[Admin Seed] Initializing database connection...');
    await connectDatabase();

    const result = await seedAdmin();
    console.info(`[Admin Seed] Operation completed with status: ${result.status}`);

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('[Admin Seed] Failed to provision administrator:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

// Check if file is being executed directly via tsx/node
const isDirectRun =
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('seed-admin.ts') ||
  process.argv[1]?.endsWith('seed-admin.js');

if (isDirectRun) {
  runStandalone();
}
