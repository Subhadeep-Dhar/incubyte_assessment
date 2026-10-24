import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';

import { User } from '../src/models/user.model.js';

const TEST_MONGODB_URI =
  process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/dealership_test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGODB_URI);
  }
  // Ensure indexes are built deterministically for tests
  await User.syncIndexes();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
