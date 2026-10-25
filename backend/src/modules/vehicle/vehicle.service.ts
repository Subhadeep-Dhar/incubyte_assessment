import mongoose from 'mongoose';
import { Vehicle, IVehicle } from '../../models/vehicle.model.js';
import { Purchase, IPurchase } from '../../models/purchase.model.js';
import { escapeRegex } from '../../utils/regex.util.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import {
  CatalogQuery,
  SearchVehiclesQuery,
  CreateVehicleInput,
  UpdateVehicleInput,
} from './vehicle.schema.js';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class VehicleService {
  async getCatalog(query: CatalogQuery): Promise<PaginatedResult<IVehicle>> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Vehicle.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Vehicle.countDocuments().exec(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async searchVehicles(query: SearchVehiclesQuery): Promise<PaginatedResult<IVehicle>> {
    const filter: Record<string, unknown> = {};

    if (query.make) {
      filter.make = { $regex: new RegExp(escapeRegex(query.make), 'i') };
    }

    if (query.model) {
      filter.model = { $regex: new RegExp(escapeRegex(query.model), 'i') };
    }

    if (query.category) {
      filter.category = {
        $regex: new RegExp(`^${escapeRegex(query.category)}$`, 'i'),
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.minPrice !== undefined) {
        priceFilter.$gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        priceFilter.$lte = query.maxPrice;
      }
      filter.price = priceFilter;
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Vehicle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Vehicle.countDocuments(filter).exec(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getVehicleById(id: string): Promise<IVehicle> {
    const vehicle = await Vehicle.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID "${id}" was not found`);
    }
    return vehicle;
  }

  async createVehicle(data: CreateVehicleInput): Promise<IVehicle> {
    return await Vehicle.create(data);
  }

  async updateVehicle(id: string, data: UpdateVehicleInput): Promise<IVehicle> {
    const updated = await Vehicle.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();

    if (!updated) {
      throw new NotFoundError(`Vehicle with ID "${id}" was not found`);
    }

    return updated;
  }

  async deleteVehicle(id: string): Promise<void> {
    const deleted = await Vehicle.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundError(`Vehicle with ID "${id}" was not found`);
    }
  }

  async purchaseVehicle(
    vehicleId: string,
    userId: string,
  ): Promise<{ vehicle: IVehicle; purchase: IPurchase }> {
    // Atomic conditional decrement: matches vehicle ONLY if quantityInStock >= 1
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicleId, quantityInStock: { $gte: 1 } },
      { $inc: { quantityInStock: -1 } },
      { new: true },
    ).exec();

    if (!updatedVehicle) {
      // Differentiate between vehicle non-existence and out-of-stock
      const vehicleExists = await Vehicle.findById(vehicleId).exec();
      if (!vehicleExists) {
        throw new NotFoundError(`Vehicle with ID "${vehicleId}" was not found`);
      }
      throw new ConflictError('The requested vehicle is out of stock', 'INSUFFICIENT_STOCK');
    }

    try {
      // Record purchase audit record with immutable vehicle snapshot
      const purchase = await Purchase.create({
        userId: new mongoose.Types.ObjectId(userId),
        vehicleId: updatedVehicle._id,
        vehicleDetails: {
          make: updatedVehicle.make,
          model: updatedVehicle.model,
          year: updatedVehicle.year,
          category: updatedVehicle.category,
          imageUrl: updatedVehicle.imageUrl,
          description: updatedVehicle.description,
        },
        priceAtPurchase: updatedVehicle.price,
        quantity: 1,
        purchasedAt: new Date(),
      });

      return {
        vehicle: updatedVehicle,
        purchase,
      };
    } catch (auditError) {
      // Compensate: restore decremented stock if audit record persistence fails
      await Vehicle.findByIdAndUpdate(vehicleId, {
        $inc: { quantityInStock: 1 },
      }).exec();
      throw auditError;
    }
  }

  /**
   * Retrieves paginated purchase history for an authenticated user.
   * Strict server-side user filtering ensures complete tenant isolation.
   */
  async getUserPurchases(
    userId: string,
    query?: { page?: number; limit?: number },
  ): Promise<{
    purchases: IPurchase[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(50, Math.max(1, query?.limit || 10));
    const skip = (page - 1) * limit;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [total, rawPurchases] = await Promise.all([
      Purchase.countDocuments({ userId: userObjectId }).exec(),
      Purchase.find({ userId: userObjectId })
        .sort({ purchasedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vehicleId')
        .exec(),
    ]);

    // Backfill vehicleDetails if older record lacks snapshot
    const purchases = rawPurchases.map(p => {
      const doc = p.toObject() as unknown as IPurchase;
      if (!doc.vehicleDetails && doc.vehicleId && typeof doc.vehicleId === 'object') {
        const v = doc.vehicleId as unknown as {
          make?: string;
          model?: string;
          year?: number;
          category?: string;
          imageUrl?: string;
          description?: string;
        };
        doc.vehicleDetails = {
          make: v.make || 'Unknown',
          model: v.model || 'Vehicle',
          year: v.year,
          category: v.category || 'Sedan',
          imageUrl: v.imageUrl,
          description: v.description,
        };
      }
      return doc;
    });

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async restockVehicle(id: string, quantity: number): Promise<IVehicle> {
    const updated = await Vehicle.findByIdAndUpdate(
      id,
      { $inc: { quantityInStock: quantity } },
      { new: true, runValidators: true },
    ).exec();

    if (!updated) {
      throw new NotFoundError(`Vehicle with ID "${id}" was not found`);
    }

    return updated;
  }
}

export const vehicleService = new VehicleService();
