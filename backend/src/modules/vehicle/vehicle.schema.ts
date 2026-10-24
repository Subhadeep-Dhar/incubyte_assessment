import { z } from 'zod';

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

