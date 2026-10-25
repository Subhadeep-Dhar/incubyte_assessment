import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { seedAdmin } from './scripts/seed-admin.js';

async function bootstrap(): Promise<void> {
  try {
    console.info('Connecting to MongoDB...');
    await connectDatabase();
    console.info('Connected to MongoDB successfully.');

    // Automatically seed or synchronize initial administrator if configured in environment
    if (process.env.ADMIN_INITIAL_EMAIL && process.env.ADMIN_INITIAL_PASSWORD) {
      try {
        const seedResult = await seedAdmin({
          name: process.env.ADMIN_INITIAL_NAME || 'System Administrator',
          email: process.env.ADMIN_INITIAL_EMAIL,
          password: process.env.ADMIN_INITIAL_PASSWORD,
          resetPassword: process.env.ADMIN_RESET_PASSWORD === 'true',
        });
        console.info(`[Bootstrap] Admin initialization status: ${seedResult.status}`);
      } catch (seedError) {
        console.warn(
          '[Bootstrap] Admin initialization warning:',
          seedError instanceof Error ? seedError.message : seedError,
        );
      }
    }

    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.info(`Server listening on port ${env.PORT} on 0.0.0.0 in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
