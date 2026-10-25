import { Request, Response, NextFunction } from 'express';
import { vehicleService } from './vehicle.service.js';
import {
  CatalogQuery,
  SearchVehiclesQuery,
  CreateVehicleInput,
  UpdateVehicleInput,
  RestockVehicleInput,
} from './vehicle.schema.js';

export class VehicleController {
  async getCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async searchVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async getVehicleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const vehicle = await vehicleService.getVehicleById(id);

      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
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

  async deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await vehicleService.deleteVehicle(id);

      res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async purchaseVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
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

  async restockVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
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

  async getMyPurchases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await vehicleService.getUserPurchases(userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.purchases,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleController = new VehicleController();
