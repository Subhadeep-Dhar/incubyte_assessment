import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../src/app';
import { Vehicle } from '../../../src/models/vehicle.model';
import { signToken } from '../../../src/utils/jwt.util';

describe('Admin Vehicle CRUD (Integration Test)', () => {
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

  describe('POST /api/vehicles - Admin Vehicle Creation', () => {
    it('should create a vehicle when requested by an authorized administrator (201 Created)', async () => {
      const payload = {
        make: 'Audi',
        model: 'A4',
        category: 'Sedan',
        price: 42000,
        quantityInStock: 3,
        year: 2024,
      };

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.make).toBe('Audi');
      expect(res.body.data.model).toBe('A4');
      expect(res.body.data.price).toBe(42000);
      expect(res.body.data._id).toBeDefined();

      const inDb = await Vehicle.findById(res.body.data._id);
      expect(inDb).not.toBeNull();
    });

    it('should forbid customer accounts from creating vehicles (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          make: 'Audi',
          model: 'A4',
          category: 'Sedan',
          price: 42000,
          quantityInStock: 3,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated requests to create vehicles (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/vehicles').send({
        make: 'Audi',
        model: 'A4',
        category: 'Sedan',
        price: 42000,
        quantityInStock: 3,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: '',
          model: 'A4',
          category: 'InvalidCategory',
          price: -500,
          quantityInStock: -1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/vehicles/:id - Admin Vehicle Update', () => {
    it('should update vehicle details when requested by administrator (200 OK)', async () => {
      const vehicle = await Vehicle.create({
        make: 'Toyota',
        model: 'Corolla',
        category: 'Sedan',
        price: 22000,
        quantityInStock: 4,
      });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 23500,
          quantityInStock: 6,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(23500);
      expect(res.body.data.quantityInStock).toBe(6);

      const inDb = await Vehicle.findById(vehicle._id);
      expect(inDb?.price).toBe(23500);
    });

    it('should forbid customer accounts from updating vehicles (403 Forbidden)', async () => {
      const vehicle = await Vehicle.create({
        make: 'Toyota',
        model: 'Corolla',
        category: 'Sedan',
        price: 22000,
        quantityInStock: 4,
      });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ price: 21000 });

      expect(res.status).toBe(403);
    });

    it('should return 404 Not Found for non-existent vehicle ID', async () => {
      const nonExistentId = '6adcef3a243e4150eb3cad99';

      const res = await request(app)
        .put(`/api/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 25000 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 Bad Request for malformed vehicle ID', async () => {
      const res = await request(app)
        .put('/api/vehicles/not-a-valid-object-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 25000 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/vehicles/:id - Admin Vehicle Deletion', () => {
    it('should delete vehicle when requested by administrator (200 OK)', async () => {
      const vehicle = await Vehicle.create({
        make: 'Ford',
        model: 'Mustang',
        category: 'Coupe',
        price: 45000,
        quantityInStock: 2,
      });

      const res = await request(app)
        .delete(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDb = await Vehicle.findById(vehicle._id);
      expect(inDb).toBeNull();
    });

    it('should forbid customer accounts from deleting vehicles (403 Forbidden)', async () => {
      const vehicle = await Vehicle.create({
        make: 'Ford',
        model: 'Mustang',
        category: 'Coupe',
        price: 45000,
        quantityInStock: 2,
      });

      const res = await request(app)
        .delete(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 Not Found for non-existent vehicle ID deletion', async () => {
      const nonExistentId = '6adcef3a243e4150eb3cad99';

      const res = await request(app)
        .delete(`/api/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 Bad Request for malformed vehicle ID deletion', async () => {
      const res = await request(app)
        .delete('/api/vehicles/malformed-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });
});
