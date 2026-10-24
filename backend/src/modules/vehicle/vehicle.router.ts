import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { authenticateJwt, requireRole } from '../../middleware/auth.middleware';
import {
  catalogQuerySchema,
  searchVehiclesQuerySchema,
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
} from './vehicle.schema';

const router = Router();

// Public vehicle search and filtering
router.get(
  '/search',
  validateRequest({ query: searchVehiclesQuerySchema }),
  vehicleController.searchVehicles,
);

// Public catalog listing
router.get(
  '/',
  validateRequest({ query: catalogQuerySchema }),
  vehicleController.getCatalog,
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

export const vehicleRouter = router;
