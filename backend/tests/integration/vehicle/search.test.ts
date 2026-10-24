import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { Vehicle } from '../../../src/models/vehicle.model';

describe('GET /api/vehicles/search - Vehicle Search & Filtering (Integration Test)', () => {
  beforeEach(async () => {
    await Vehicle.deleteMany({});

    await Vehicle.create([
      {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 26000,
        quantityInStock: 5,
      },
      {
        make: 'Toyota',
        model: 'RAV4',
        category: 'SUV',
        price: 32000,
        quantityInStock: 3,
      },
      {
        make: 'Honda',
        model: 'Civic',
        category: 'Sedan',
        price: 24000,
        quantityInStock: 2,
      },
      {
        make: 'BMW',
        model: 'X5',
        category: 'SUV',
        price: 65000,
        quantityInStock: 1,
      },
    ]);
  });

  it('should search by make with case-insensitive matching', async () => {
    const res = await request(app).get('/api/vehicles/search?make=toyota');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((v: { make: string }) => v.make === 'Toyota')).toBe(true);
  });

  it('should search by model with case-insensitive matching', async () => {
    const res = await request(app).get('/api/vehicles/search?model=CIVIC');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].model).toBe('Civic');
  });

  it('should filter by category', async () => {
    const res = await request(app).get('/api/vehicles/search?category=SUV');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((v: { category: string }) => v.category === 'SUV')).toBe(true);
  });

  it('should filter by inclusive price boundaries (minPrice and maxPrice)', async () => {
    const res = await request(app).get('/api/vehicles/search?minPrice=25000&maxPrice=35000');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2); // Toyota Camry (26000) and RAV4 (32000)

    const prices = res.body.data.map((v: { price: number }) => v.price);
    expect(prices).toContain(26000);
    expect(prices).toContain(32000);
  });

  it('should combine multiple filters simultaneously (make, category, maxPrice)', async () => {
    const res = await request(app).get(
      '/api/vehicles/search?make=Toyota&category=Sedan&maxPrice=30000',
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].model).toBe('Camry');
  });

  it('should return 200 OK with empty data when no vehicles match the criteria', async () => {
    const res = await request(app).get('/api/vehicles/search?make=Ferrari');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('should reject when minPrice is greater than maxPrice with 400 Bad Request', async () => {
    const res = await request(app).get('/api/vehicles/search?minPrice=50000&maxPrice=20000');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid non-numeric price parameters with 400 Bad Request', async () => {
    const res = await request(app).get('/api/vehicles/search?minPrice=expensive');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should safely handle regex special characters in search parameters without crashing', async () => {
    const res = await request(app).get('/api/vehicles/search?make=Toyota.*(&model=Camry[');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
  });
});
