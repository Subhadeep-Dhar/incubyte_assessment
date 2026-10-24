import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { Vehicle } from '../../../src/models/vehicle.model';
import { signToken } from '../../../src/utils/jwt.util';

describe('POST /api/vehicles/:id/restock - Admin Restocking (Integration Test)', () => {
  const adminToken = signToken({
    userId: '6adcef3a243e4150eb3cad01',
    email: 'admin@dealership.com',
    role: 'admin',
  });

  const customerToken = signToken({
    userId: '6adcef3a243e4150eb3cad02',
    email: 'customer@dealership.com',
    role: 'customer',
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  it('should successfully restock an existing vehicle when requested by an administrator (200 OK)', async () => {
    const vehicle = await Vehicle.create({
      make: 'Toyota',
      model: 'Highlander',
      category: 'SUV',
      price: 43000,
      quantityInStock: 2,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quantityInStock).toBe(7);

    // Verify database state
    const inDb = await Vehicle.findById(vehicle._id);
    expect(inDb?.quantityInStock).toBe(7);
  });

  it('should forbid customer accounts from restocking vehicles (403 Forbidden)', async () => {
    const vehicle = await Vehicle.create({
      make: 'Toyota',
      model: 'Highlander',
      category: 'SUV',
      price: 43000,
      quantityInStock: 2,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);

    // Verify stock is untouched
    const inDb = await Vehicle.findById(vehicle._id);
    expect(inDb?.quantityInStock).toBe(2);
  });

  it('should reject unauthenticated restock requests with 401 Unauthorized', async () => {
    const vehicle = await Vehicle.create({
      make: 'Toyota',
      model: 'Highlander',
      category: 'SUV',
      price: 43000,
      quantityInStock: 2,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .send({ quantity: 5 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-positive or fractional restock quantities with 400 Bad Request', async () => {
    const vehicle = await Vehicle.create({
      make: 'Toyota',
      model: 'Highlander',
      category: 'SUV',
      price: 43000,
      quantityInStock: 2,
    });

    const zeroRes = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 0 });
    expect(zeroRes.status).toBe(400);

    const negativeRes = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: -3 });
    expect(negativeRes.status).toBe(400);

    const fractionalRes = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 2.5 });
    expect(fractionalRes.status).toBe(400);

    const excessiveRes = await request(app)
      .post(`/api/vehicles/${vehicle._id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 100000 });
    expect(excessiveRes.status).toBe(400);
  });

  it('should return 404 Not Found for non-existent vehicle ID restock', async () => {
    const nonExistentId = '6adcef3a243e4150eb3cad99';

    const res = await request(app)
      .post(`/api/vehicles/${nonExistentId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 Bad Request for malformed vehicle ID restock', async () => {
    const res = await request(app)
      .post('/api/vehicles/invalid-id/restock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
