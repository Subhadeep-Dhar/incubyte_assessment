import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { catalogQuerySchema, searchVehiclesQuerySchema } from './vehicle.schema';

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

export const vehicleRouter = router;
