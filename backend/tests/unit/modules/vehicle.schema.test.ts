import { describe, it, expect } from 'vitest';
import {
  catalogQuerySchema,
  searchVehiclesQuerySchema,
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  restockVehicleSchema,
} from '../../../src/modules/vehicle/vehicle.schema';

describe('Vehicle Schemas (Unit Test)', () => {
  describe('catalogQuerySchema', () => {
    it('should apply default values when query is empty', () => {
      const parsed = catalogQuerySchema.parse({});
      expect(parsed).toEqual({ page: 1, limit: 10 });
    });

    it('should coerce valid numeric strings', () => {
      const parsed = catalogQuerySchema.parse({ page: '3', limit: '25' });
      expect(parsed).toEqual({ page: 3, limit: 25 });
    });

    it('should reject non-positive page', () => {
      expect(() => catalogQuerySchema.parse({ page: 0 })).toThrow();
      expect(() => catalogQuerySchema.parse({ page: -1 })).toThrow();
    });

    it('should reject limit exceeding 50', () => {
      expect(() => catalogQuerySchema.parse({ limit: 51 })).toThrow();
    });
  });

  describe('searchVehiclesQuerySchema', () => {
    it('should parse valid search query parameters', () => {
      const parsed = searchVehiclesQuerySchema.parse({
        make: '  Toyota ',
        model: 'Camry',
        category: 'Sedan',
        minPrice: '20000',
        maxPrice: '30000',
      });

      expect(parsed.make).toBe('Toyota');
      expect(parsed.minPrice).toBe(20000);
      expect(parsed.maxPrice).toBe(30000);
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
    });

    it('should reject when minPrice > maxPrice', () => {
      expect(() =>
        searchVehiclesQuerySchema.parse({
          minPrice: 40000,
          maxPrice: 30000,
        }),
      ).toThrow(/minPrice cannot be greater than maxPrice/);
    });
  });

  describe('createVehicleSchema', () => {
    it('should parse valid vehicle creation data', () => {
      const parsed = createVehicleSchema.parse({
        make: 'BMW',
        model: '330i',
        category: 'Sedan',
        price: 45000,
        quantityInStock: 2,
        year: 2023,
      });

      expect(parsed.make).toBe('BMW');
      expect(parsed.price).toBe(45000);
    });

    it('should reject missing required fields', () => {
      expect(() => createVehicleSchema.parse({})).toThrow();
      expect(() =>
        createVehicleSchema.parse({
          make: 'BMW',
          model: '330i',
          category: 'Sedan',
          // missing price and quantityInStock
        }),
      ).toThrow();
    });

    it('should reject zero or negative price', () => {
      expect(() =>
        createVehicleSchema.parse({
          make: 'BMW',
          model: '330i',
          category: 'Sedan',
          price: 0,
          quantityInStock: 1,
        }),
      ).toThrow();
    });
  });

  describe('updateVehicleSchema', () => {
    it('should allow partial updates', () => {
      const parsed = updateVehicleSchema.parse({
        price: 46000,
      });
      expect(parsed.price).toBe(46000);
    });

    it('should reject unknown or immutable fields via strict validation', () => {
      expect(() =>
        updateVehicleSchema.parse({
          price: 46000,
          _id: 'cannot-modify-id',
        }),
      ).toThrow();
    });
  });

  describe('vehicleIdParamSchema', () => {
    it('should accept valid 24-character hexadecimal MongoDB ObjectId', () => {
      const parsed = vehicleIdParamSchema.parse({
        id: '6adcef3a243e4150eb3cad01',
      });
      expect(parsed.id).toBe('6adcef3a243e4150eb3cad01');
    });

    it('should reject malformed ID strings', () => {
      expect(() =>
        vehicleIdParamSchema.parse({
          id: 'not-a-valid-id',
        }),
      ).toThrow(/Invalid vehicle ID format/);
    });
  });

  describe('restockVehicleSchema', () => {
    it('should accept valid positive integer quantity', () => {
      const parsed = restockVehicleSchema.parse({ quantity: 10 });
      expect(parsed.quantity).toBe(10);
    });

    it('should reject non-positive or fractional quantities', () => {
      expect(() => restockVehicleSchema.parse({ quantity: 0 })).toThrow();
      expect(() => restockVehicleSchema.parse({ quantity: -5 })).toThrow();
      expect(() => restockVehicleSchema.parse({ quantity: 3.5 })).toThrow();
    });

    it('should reject excessive quantities exceeding safety maximum', () => {
      expect(() => restockVehicleSchema.parse({ quantity: 10001 })).toThrow();
    });
  });
});
