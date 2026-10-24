import { Vehicle, IVehicle } from '../../models/vehicle.model';
import { CatalogQuery } from './vehicle.schema';

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
}

export const vehicleService = new VehicleService();
