import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { catalogQuerySchema } from './vehicle.schema';

const router = Router();

// Public catalog listing
router.get(
  '/',
  validateRequest({ query: catalogQuerySchema }),
  vehicleController.getCatalog,
);

export const vehicleRouter = router;
