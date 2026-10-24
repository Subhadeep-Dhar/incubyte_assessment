import { Vehicle, IVehicle } from '../../models/vehicle.model';
import { escapeRegex } from '../../utils/regex.util';
import { CatalogQuery, SearchVehiclesQuery } from './vehicle.schema';

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

  async searchVehicles(
    query: SearchVehiclesQuery,
  ): Promise<PaginatedResult<IVehicle>> {
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
      Vehicle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
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
}

export const vehicleService = new VehicleService();
