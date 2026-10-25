import { Router } from 'express';
import { vehicleController } from '../vehicle/vehicle.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { catalogQuerySchema } from '../vehicle/vehicle.schema.js';

export const purchaseRouter = Router();

// GET /api/purchases - Authenticated customer's purchase history
purchaseRouter.get(
  '/',
  authenticateJwt,
  validateRequest({ query: catalogQuerySchema }),
  vehicleController.getMyPurchases,
);

// GET /api/purchases/me - Alias for authenticated customer's purchase history
purchaseRouter.get(
  '/me',
  authenticateJwt,
  validateRequest({ query: catalogQuerySchema }),
  vehicleController.getMyPurchases,
);

export default purchaseRouter;
