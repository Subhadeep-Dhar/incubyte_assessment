import { Request, Response, NextFunction } from 'express';
import { vehicleService } from './vehicle.service';
import {
  CatalogQuery,
  SearchVehiclesQuery,
  CreateVehicleInput,
  UpdateVehicleInput,
  RestockVehicleInput,
} from './vehicle.schema';

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

  async getVehicleById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);

      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body as CreateVehicleInput;
      const vehicle = await vehicleService.createVehicle(data);

      res.status(201).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateVehicleInput;
      const updated = await vehicleService.updateVehicle(id, data);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      await vehicleService.deleteVehicle(id);

      res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async purchaseVehicle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await vehicleService.purchaseVehicle(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async restockVehicle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity } = req.body as RestockVehicleInput;

      const updated = await vehicleService.restockVehicle(id, quantity);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleController = new VehicleController();
