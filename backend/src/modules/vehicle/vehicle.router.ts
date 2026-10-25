import { Router } from 'express';
import { vehicleController } from './vehicle.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticateJwt, requireRole } from '../../middleware/auth.middleware.js';
import {
  catalogQuerySchema,
  searchVehiclesQuerySchema,
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  restockVehicleSchema,
} from './vehicle.schema.js';

const router = Router();

// Public vehicle search and filtering
router.get(
  '/search',
  validateRequest({ query: searchVehiclesQuerySchema }),
  vehicleController.searchVehicles,
);

// Public catalog listing
router.get('/', validateRequest({ query: catalogQuerySchema }), vehicleController.getCatalog);

// Authenticated user purchase history
router.get(
  '/purchases/me',
  authenticateJwt,
  validateRequest({ query: catalogQuerySchema }),
  vehicleController.getMyPurchases,
);

// Public single vehicle detail
router.get(
  '/:id',
  validateRequest({ params: vehicleIdParamSchema }),
  vehicleController.getVehicleById,
);

// Admin-only vehicle creation
router.post(
  '/',
  authenticateJwt,
  requireRole('admin'),
  validateRequest({ body: createVehicleSchema }),
  vehicleController.createVehicle,
);

// Admin-only vehicle update
router.put(
  '/:id',
  authenticateJwt,
  requireRole('admin'),
  validateRequest({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
  vehicleController.updateVehicle,
);

// Admin-only vehicle deletion
router.delete(
  '/:id',
  authenticateJwt,
  requireRole('admin'),
  validateRequest({ params: vehicleIdParamSchema }),
  vehicleController.deleteVehicle,
);

// Authenticated vehicle purchasing (customer or admin)
router.post(
  '/:id/purchase',
  authenticateJwt,
  validateRequest({ params: vehicleIdParamSchema }),
  vehicleController.purchaseVehicle,
);

// Admin-only vehicle restocking
router.post(
  '/:id/restock',
  authenticateJwt,
  requireRole('admin'),
  validateRequest({ params: vehicleIdParamSchema, body: restockVehicleSchema }),
  vehicleController.restockVehicle,
);

export const vehicleRouter = router;
