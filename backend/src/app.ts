import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';

import { authRouter } from './modules/auth/auth.router.js';
import { vehicleRouter } from './modules/vehicle/vehicle.router.js';
import { AppError } from './utils/errors.js';

export const app = express();

// Security and utility middleware
app.use(helmet());

const configuredOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',')
      .map(url => url.trim().replace(/\/$/, ''))
      .filter(Boolean)
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, uptime/health checks)
      if (!requestOrigin) {
        return callback(null, true);
      }
      const normalized = requestOrigin.replace(/\/$/, '');
      if (
        configuredOrigins.includes('*') ||
        configuredOrigins.includes(normalized) ||
        configuredOrigins.some(
          allowed => allowed.includes('.vercel.app') && normalized.endsWith('.vercel.app'),
        ) ||
        (env.NODE_ENV !== 'production' && normalized.includes('localhost'))
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());

// Health & dependency check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'incubyte-dealership-backend',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);

// Fallback 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API route was not found on this server.',
    },
  });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
    },
  });
});

export default app;
