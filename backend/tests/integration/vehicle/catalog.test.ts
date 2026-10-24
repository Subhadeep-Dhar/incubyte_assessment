import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { Vehicle } from '../../../src/models/vehicle.model';

describe('GET /api/vehicles - Public Vehicle Catalog (Integration Test)', () => {
  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  it('should return 200 OK with an empty array when inventory is empty', async () => {
    const res = await request(app).get('/api/vehicles');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('should allow public access to browse catalog without authentication', async () => {
    await Vehicle.create({
      make: 'Honda',
      model: 'Accord',
      category: 'Sedan',
      price: 28000,
      quantityInStock: 3,
    });

    const res = await request(app).get('/api/vehicles');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].make).toBe('Honda');
    expect(res.body.data[0].model).toBe('Accord');
    expect(res.body.data[0].__v).toBeUndefined();
  });

  it('should list both in-stock and zero-stock vehicles with accurate quantity', async () => {
    await Vehicle.create([
      {
        make: 'Toyota',
        model: 'RAV4',
        category: 'SUV',
        price: 32000,
        quantityInStock: 4,
      },
      {
        make: 'Mazda',
        model: 'CX-5',
        category: 'SUV',
        price: 30000,
        quantityInStock: 0, // Out of stock
      },
    ]);

    const res = await request(app).get('/api/vehicles');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);

    const outOfStock = res.body.data.find((v: { model: string }) => v.model === 'CX-5');
    expect(outOfStock).toBeDefined();
    expect(outOfStock.quantityInStock).toBe(0);
  });

  it('should support pagination via page and limit query parameters', async () => {
    await Vehicle.create([
      {
        make: 'Vehicle1',
        model: 'M1',
        category: 'Sedan',
        price: 20000,
        quantityInStock: 1,
      },
      {
        make: 'Vehicle2',
        model: 'M2',
        category: 'Sedan',
        price: 21000,
        quantityInStock: 1,
      },
      {
        make: 'Vehicle3',
        model: 'M3',
        category: 'Sedan',
        price: 22000,
        quantityInStock: 1,
      },
    ]);

    const res = await request(app).get('/api/vehicles?page=2&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('should reject invalid page or limit values with 400 Bad Request', async () => {
    const invalidPageRes = await request(app).get('/api/vehicles?page=0');
    expect(invalidPageRes.status).toBe(400);
    expect(invalidPageRes.body.success).toBe(false);

    const negativePageRes = await request(app).get('/api/vehicles?page=-2');
    expect(negativePageRes.status).toBe(400);

    const excessiveLimitRes = await request(app).get('/api/vehicles?limit=500');
    expect(excessiveLimitRes.status).toBe(400);

    const invalidLimitRes = await request(app).get('/api/vehicles?limit=abc');
    expect(invalidLimitRes.status).toBe(400);
  });

  describe('GET /api/vehicles/:id - Single Vehicle Details', () => {
    it('should return vehicle details for a valid ID (200 OK)', async () => {
      const vehicle = await Vehicle.create({
        make: 'Subaru',
        model: 'Outback',
        category: 'SUV',
        price: 33000,
        quantityInStock: 2,
      });

      const res = await request(app).get(`/api/vehicles/${vehicle._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.make).toBe('Subaru');
      expect(res.body.data.model).toBe('Outback');
    });

    it('should return 404 Not Found for non-existent vehicle ID', async () => {
      const nonExistentId = '6adcef3a243e4150eb3cad99';
      const res = await request(app).get(`/api/vehicles/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request for malformed vehicle ID', async () => {
      const res = await request(app).get('/api/vehicles/invalid-id-format');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
