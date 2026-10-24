import { z } from 'zod';
import mongoose from 'mongoose';
import { VEHICLE_CATEGORIES } from '../../models/vehicle.model';

export const catalogQuerySchema = z.object({
  page: z.coerce
    .number()
    .int({ message: 'Page must be an integer' })
    .min(1, { message: 'Page must be at least 1' })
    .default(1),
  limit: z.coerce
    .number()
    .int({ message: 'Limit must be an integer' })
    .min(1, { message: 'Limit must be at least 1' })
    .max(50, { message: 'Limit cannot exceed 50' })
    .default(10),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export const searchVehiclesQuerySchema = z
  .object({
    make: z.string().trim().optional(),
    model: z.string().trim().optional(),
    category: z.string().trim().optional(),
    minPrice: z.coerce
      .number({ message: 'minPrice must be a valid number' })
      .min(0, { message: 'minPrice cannot be negative' })
      .optional(),
    maxPrice: z.coerce
      .number({ message: 'maxPrice must be a valid number' })
      .min(0, { message: 'maxPrice cannot be negative' })
      .optional(),
    page: z.coerce
      .number()
      .int({ message: 'Page must be an integer' })
      .min(1, { message: 'Page must be at least 1' })
      .default(1),
    limit: z.coerce
      .number()
      .int({ message: 'Limit must be an integer' })
      .min(1, { message: 'Limit must be at least 1' })
      .max(50, { message: 'Limit cannot exceed 50' })
      .default(10),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'minPrice cannot be greater than maxPrice',
      path: ['minPrice'],
    },
  );

export type SearchVehiclesQuery = z.infer<typeof searchVehiclesQuerySchema>;

export const createVehicleSchema = z.object({
  make: z
    .string({ required_error: 'Vehicle make is required' })
    .trim()
    .min(1, { message: 'Vehicle make cannot be empty' }),
  model: z
    .string({ required_error: 'Vehicle model is required' })
    .trim()
    .min(1, { message: 'Vehicle model cannot be empty' }),
  category: z.enum(VEHICLE_CATEGORIES, {
    errorMap: () => ({
      message: `Invalid category. Must be one of: ${VEHICLE_CATEGORIES.join(', ')}`,
    }),
  }),
  price: z
    .number({ required_error: 'Vehicle price is required' })
    .positive({ message: 'Vehicle price must be greater than zero' }),
  quantityInStock: z
    .number({ required_error: 'Quantity in stock is required' })
    .int({ message: 'Quantity in stock must be an integer' })
    .min(0, { message: 'Quantity in stock cannot be negative' }),
  year: z
    .number()
    .int()
    .min(1900, { message: 'Year must be 1900 or later' })
    .optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().strict();

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export const vehicleIdParamSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid vehicle ID format',
  }),
});

export type VehicleIdParam = z.infer<typeof vehicleIdParamSchema>;
