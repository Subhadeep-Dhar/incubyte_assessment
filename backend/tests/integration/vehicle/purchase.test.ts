import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { Vehicle } from '../../../src/models/vehicle.model';
import { Purchase } from '../../../src/models/purchase.model';
import { signToken } from '../../../src/utils/jwt.util';

describe('POST /api/vehicles/:id/purchase - Vehicle Purchasing & Concurrency (Integration Test)', () => {
  const customerId = '6adcef3a243e4150eb3cad10';
  const customerToken = signToken({
    userId: customerId,
    email: 'buyer@dealership.com',
    role: 'customer',
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
    await Purchase.deleteMany({});
  });

  it('should successfully purchase a vehicle when stock is available (200 OK)', async () => {
    const vehicle = await Vehicle.create({
      make: 'Honda',
      model: 'CR-V',
      category: 'SUV',
      price: 34000,
      quantityInStock: 3,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicle.quantityInStock).toBe(2);
    expect(res.body.data.purchase).toBeDefined();
    expect(res.body.data.purchase.vehicleId).toBe(String(vehicle._id));
    expect(res.body.data.purchase.userId).toBe(customerId);
    expect(res.body.data.purchase.priceAtPurchase).toBe(34000);

    // Verify database state
    const updatedInDb = await Vehicle.findById(vehicle._id);
    expect(updatedInDb?.quantityInStock).toBe(2);

    const auditInDb = await Purchase.findOne({ vehicleId: vehicle._id });
    expect(auditInDb).not.toBeNull();
    expect(auditInDb?.userId.toString()).toBe(customerId);
    expect(auditInDb?.priceAtPurchase).toBe(34000);
  });

  it('should reject unauthenticated purchase requests with 401 Unauthorized', async () => {
    const vehicle = await Vehicle.create({
      make: 'Honda',
      model: 'CR-V',
      category: 'SUV',
      price: 34000,
      quantityInStock: 3,
    });

    const res = await request(app).post(`/api/vehicles/${vehicle._id}/purchase`).send();

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);

    // Stock must remain unchanged
    const inDb = await Vehicle.findById(vehicle._id);
    expect(inDb?.quantityInStock).toBe(3);
  });

  it('should return 409 Conflict when vehicle is out of stock (quantityInStock = 0)', async () => {
    const vehicle = await Vehicle.create({
      make: 'Mazda',
      model: 'Miata',
      category: 'Coupe',
      price: 29000,
      quantityInStock: 0,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

    // Stock must remain 0 and no purchase audit record created
    const inDb = await Vehicle.findById(vehicle._id);
    expect(inDb?.quantityInStock).toBe(0);

    const auditCount = await Purchase.countDocuments({ vehicleId: vehicle._id });
    expect(auditCount).toBe(0);
  });

  it('should return 404 Not Found for non-existent vehicle ID', async () => {
    const nonExistentId = '6adcef3a243e4150eb3cad99';

    const res = await request(app)
      .post(`/api/vehicles/${nonExistentId}/purchase`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send();

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 Bad Request for malformed vehicle ID', async () => {
    const res = await request(app)
      .post('/api/vehicles/invalid-id/purchase')
      .set('Authorization', `Bearer ${customerToken}`)
      .send();

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should strictly derive purchaser identity from auth context (ignores client-supplied userId or price)', async () => {
    const vehicle = await Vehicle.create({
      make: 'Nissan',
      model: 'Altima',
      category: 'Sedan',
      price: 25000,
      quantityInStock: 2,
    });

    const res = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        userId: '6adcef3a243e4150eb3cad99', // Malicious client attempt to spoof purchaser
        priceAtPurchase: 1, // Malicious client attempt to buy for $1
      });

    expect(res.status).toBe(200);
    expect(res.body.data.purchase.userId).toBe(customerId);
    expect(res.body.data.purchase.priceAtPurchase).toBe(25000);
  });

  it('should safely handle concurrent purchase requests without overselling (Concurrency Test)', async () => {
    // Inventory starts with exactly 2 units in stock
    const vehicle = await Vehicle.create({
      make: 'Limited',
      model: 'Edition',
      category: 'Coupe',
      price: 80000,
      quantityInStock: 2,
    });

    // 5 concurrent shoppers attempt to purchase the 2 remaining vehicles at the exact same instant
    const purchasers = [
      signToken({ userId: '6adcef3a243e4150eb3cad21', email: 'user1@test.com', role: 'customer' }),
      signToken({ userId: '6adcef3a243e4150eb3cad22', email: 'user2@test.com', role: 'customer' }),
      signToken({ userId: '6adcef3a243e4150eb3cad23', email: 'user3@test.com', role: 'customer' }),
      signToken({ userId: '6adcef3a243e4150eb3cad24', email: 'user4@test.com', role: 'customer' }),
      signToken({ userId: '6adcef3a243e4150eb3cad25', email: 'user5@test.com', role: 'customer' }),
    ];

    const concurrentRequests = purchasers.map(token =>
      request(app)
        .post(`/api/vehicles/${vehicle._id}/purchase`)
        .set('Authorization', `Bearer ${token}`)
        .send(),
    );

    const results = await Promise.all(concurrentRequests);

    const successCount = results.filter(r => r.status === 200).length;
    const conflictCount = results.filter(r => r.status === 409).length;

    // Exactly 2 requests must succeed, and exactly 3 must receive 409 Conflict
    expect(successCount).toBe(2);
    expect(conflictCount).toBe(3);

    // Stock must be strictly 0 (never negative)
    const inDb = await Vehicle.findById(vehicle._id);
    expect(inDb?.quantityInStock).toBe(0);

    // Exactly 2 purchase audit logs must be recorded
    const auditLogs = await Purchase.find({ vehicleId: vehicle._id });
    expect(auditLogs.length).toBe(2);
  });
});
