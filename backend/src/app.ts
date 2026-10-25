import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';

import { authRouter } from './modules/auth/auth.router.js';
import { vehicleRouter } from './modules/vehicle/vehicle.router.js';
import { AppError } from './utils/errors.js';

export const app = express();

// Safe origin matching regex patterns
export const VERCEL_PROJECT_ORIGIN_REGEX =
  /^https:\/\/incubyte-assessment(-[a-z0-9-]+)?\.vercel\.app$/i;
export const LOCALHOST_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://incubyte-assessment-ruby.vercel.app',
  'http://localhost:5173',
];

export const configuredOrigins = [
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(env.CLIENT_URL
    ? env.CLIENT_URL.split(',')
        .map(url => url.trim().replace(/\/$/, ''))
        .filter(Boolean)
    : []),
];

export function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  const normalized = origin.trim().replace(/\/$/, '');

  // 1. Explicit configured origins (env.CLIENT_URL or default production domain)
  if (configuredOrigins.includes(normalized)) {
    return true;
  }

  // 2. Legitimate Vercel production & preview deployment URLs for this project
  if (VERCEL_PROJECT_ORIGIN_REGEX.test(normalized)) {
    return true;
  }

  // 3. Localhost development origins
  if (LOCALHOST_ORIGIN_REGEX.test(normalized)) {
    return true;
  }

  return false;
}

export const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow non-browser requests with no origin (e.g. mobile apps, curl, uptime monitors, health checks)
    if (!requestOrigin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(requestOrigin)) {
      return callback(null, true);
    }

    // Unapproved origins are omitted from Access-Control-Allow-Origin
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

// Mount CORS middleware at the very top of the stack before routes and other middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security headers with cross-origin resource policy permitting cross-origin API consumption
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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
