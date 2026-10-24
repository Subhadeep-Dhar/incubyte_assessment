import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rate-limiter.middleware.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  (req, res, next) => authController.register(req, res, next),
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  (req, res, next) => authController.login(req, res, next),
);

authRouter.get('/me', authenticateJwt, (req, res, next) => authController.getMe(req, res, next));

export default authRouter;
