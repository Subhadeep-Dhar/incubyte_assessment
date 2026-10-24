import { Request, Response, NextFunction } from 'express';
import { vehicleService } from './vehicle.service';
import { CatalogQuery, SearchVehiclesQuery } from './vehicle.schema';

export class VehicleController {
  async getCatalog(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query as unknown as CatalogQuery;
      const result = await vehicleService.getCatalog(query);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchVehicles(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = req.query as unknown as SearchVehiclesQuery;
      const result = await vehicleService.searchVehicles(query);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleController = new VehicleController();
