import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { Vehicle } from '../../../src/models/vehicle.model';
import { Purchase } from '../../../src/models/purchase.model';
import { signToken } from '../../../src/utils/jwt.util';

describe('Purchase History API - GET /api/purchases & GET /api/vehicles/purchases/me', () => {
  const userAId = '6adcef3a243e4150eb3cad01';
  const userAToken = signToken({
    userId: userAId,
    email: 'userA@dealership.com',
    role: 'customer',
  });

  const userBId = '6adcef3a243e4150eb3cad02';
  const userBToken = signToken({
    userId: userBId,
    email: 'userB@dealership.com',
    role: 'customer',
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
    await Purchase.deleteMany({});
  });

  it('should return empty list when authenticated customer has no purchases (200 OK)', async () => {
    const res = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
    expect(res.body.pagination.page).toBe(1);
  });

  it('should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/purchases');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should record vehicle snapshot at purchase time and return in history', async () => {
    // 1. Create a vehicle
    const vehicle = await Vehicle.create({
      make: 'Porsche',
      model: '911 Carrera',
      year: 2024,
      category: 'Coupe',
      price: 114000,
      quantityInStock: 2,
      imageUrl: 'https://images.unsplash.com/photo-porsche',
      description: 'Iconic rear-engine sports car',
    });

    // 2. User A purchases the vehicle
    const purchaseRes = await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send();

    expect(purchaseRes.status).toBe(200);

    // 3. Admin modifies the vehicle (price increase, different make/model)
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      make: 'Porsche Modified',
      model: '911 Turbo S',
      price: 198000,
    });

    // 4. User A fetches their purchase history
    const historyRes = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.length).toBe(1);

    const record = historyRes.body.data[0];
    expect(record.userId).toBe(userAId);
    expect(record.priceAtPurchase).toBe(114000); // Historical price preserved!
    expect(record.vehicleDetails).toBeDefined();
    expect(record.vehicleDetails.make).toBe('Porsche');
    expect(record.vehicleDetails.model).toBe('911 Carrera');
    expect(record.vehicleDetails.year).toBe(2024);
    expect(record.vehicleDetails.category).toBe('Coupe');
    expect(record.quantity).toBe(1);
    expect(record.purchasedAt).toBeDefined();
  });

  it('should retain purchase history even after vehicle is deleted from inventory', async () => {
    // 1. Create and purchase vehicle
    const vehicle = await Vehicle.create({
      make: 'Audi',
      model: 'RS6 Avant',
      year: 2023,
      category: 'Sedan',
      price: 125000,
      quantityInStock: 1,
    });

    await request(app)
      .post(`/api/vehicles/${vehicle._id}/purchase`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send();

    // 2. Delete vehicle completely from inventory
    await Vehicle.findByIdAndDelete(vehicle._id);

    // 3. User A still has purchase history with preserved details
    const historyRes = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].vehicleDetails.make).toBe('Audi');
    expect(historyRes.body.data[0].vehicleDetails.model).toBe('RS6 Avant');
    expect(historyRes.body.data[0].priceAtPurchase).toBe(125000);
  });

  it('should strictly isolate customer purchase records (User B cannot see User A purchases)', async () => {
    // Vehicle purchased by User A
    const v1 = await Vehicle.create({
      make: 'Tesla',
      model: 'Model S Plaid',
      category: 'EV',
      price: 89000,
      quantityInStock: 2,
    });

    // Vehicle purchased by User B
    const v2 = await Vehicle.create({
      make: 'Rivian',
      model: 'R1T',
      category: 'Truck',
      price: 73000,
      quantityInStock: 2,
    });

    await request(app)
      .post(`/api/vehicles/${v1._id}/purchase`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send();

    await request(app)
      .post(`/api/vehicles/${v2._id}/purchase`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send();

    // User A fetches history
    const resA = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBe(1);
    expect(resA.body.data[0].vehicleDetails.make).toBe('Tesla');

    // User B fetches history
    const resB = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(1);
    expect(resB.body.data[0].vehicleDetails.make).toBe('Rivian');
  });

  it('should support pagination on purchase history', async () => {
    // User A purchases 3 vehicles
    for (let i = 1; i <= 3; i++) {
      const v = await Vehicle.create({
        make: 'Make' + i,
        model: 'Model' + i,
        category: 'Sedan',
        price: 50000 + i * 1000,
        quantityInStock: 1,
      });

      await request(app)
        .post(`/api/vehicles/${v._id}/purchase`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send();
    }

    // Page 1, limit 2
    const page1Res = await request(app)
      .get('/api/purchases?page=1&limit=2')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.data.length).toBe(2);
    expect(page1Res.body.pagination.total).toBe(3);
    expect(page1Res.body.pagination.page).toBe(1);
    expect(page1Res.body.pagination.limit).toBe(2);
    expect(page1Res.body.pagination.totalPages).toBe(2);

    // Page 2, limit 2
    const page2Res = await request(app)
      .get('/api/purchases?page=2&limit=2')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.data.length).toBe(1);
    expect(page2Res.body.pagination.page).toBe(2);
  });

  it('should also be accessible via /api/vehicles/purchases/me', async () => {
    const v = await Vehicle.create({
      make: 'Mercedes-Benz',
      model: 'AMG GT',
      category: 'Coupe',
      price: 140000,
      quantityInStock: 1,
    });

    await request(app)
      .post(`/api/vehicles/${v._id}/purchase`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send();

    const res = await request(app)
      .get('/api/vehicles/purchases/me')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].vehicleDetails.make).toBe('Mercedes-Benz');
  });
});
