import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function bootstrap(): Promise<void> {
  try {
    console.info('Connecting to MongoDB...');
    await connectDatabase();
    console.info('Connected to MongoDB successfully.');

    app.listen(env.PORT, () => {
      console.info(`Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
