import { describe, it, expect, beforeEach } from 'vitest';
import { Vehicle } from '../../../src/models/vehicle.model';

describe('Vehicle Model (Unit & Persistence Integration Test)', () => {
  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  it('should successfully create and persist a valid vehicle with all required fields', async () => {
    const vehicleData = {
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 26000,
      quantityInStock: 5,
      year: 2023,
    };

    const vehicle = await Vehicle.create(vehicleData);

    expect(vehicle).toBeDefined();
    expect(vehicle._id).toBeDefined();
    expect(vehicle.make).toBe('Toyota');
    expect(vehicle.model).toBe('Camry');
    expect(vehicle.category).toBe('Sedan');
    expect(vehicle.price).toBe(26000);
    expect(vehicle.quantityInStock).toBe(5);
    expect(vehicle.year).toBe(2023);
    expect(vehicle.createdAt).toBeInstanceOf(Date);
    expect(vehicle.updatedAt).toBeInstanceOf(Date);
  });

  it('should trim make and model string values', async () => {
    const vehicle = await Vehicle.create({
      make: '  Honda  ',
      model: '  Civic  ',
      category: 'Sedan',
      price: 24000,
      quantityInStock: 3,
    });

    expect(vehicle.make).toBe('Honda');
    expect(vehicle.model).toBe('Civic');
  });

  it('should reject vehicle creation when make or model is missing or empty', async () => {
    await expect(
      Vehicle.create({
        make: '',
        model: 'Accord',
        category: 'Sedan',
        price: 28000,
        quantityInStock: 2,
      }),
    ).rejects.toThrow();

    await expect(
      Vehicle.create({
        make: 'Honda',
        model: '',
        category: 'Sedan',
        price: 28000,
        quantityInStock: 2,
      }),
    ).rejects.toThrow();
  });

  it('should reject invalid or unsupported category', async () => {
    await expect(
      Vehicle.create({
        make: 'Ford',
        model: 'F-150',
        category: 'Spaceship',
        price: 35000,
        quantityInStock: 4,
      }),
    ).rejects.toThrow();
  });

  it('should reject non-positive price (zero or negative)', async () => {
    await expect(
      Vehicle.create({
        make: 'Tesla',
        model: 'Model 3',
        category: 'EV',
        price: 0,
        quantityInStock: 2,
      }),
    ).rejects.toThrow();

    await expect(
      Vehicle.create({
        make: 'Tesla',
        model: 'Model 3',
        category: 'EV',
        price: -100,
        quantityInStock: 2,
      }),
    ).rejects.toThrow();
  });

  it('should reject negative or fractional quantityInStock', async () => {
    await expect(
      Vehicle.create({
        make: 'BMW',
        model: 'M3',
        category: 'Coupe',
        price: 75000,
        quantityInStock: -1,
      }),
    ).rejects.toThrow();

    await expect(
      Vehicle.create({
        make: 'BMW',
        model: 'M3',
        category: 'Coupe',
        price: 75000,
        quantityInStock: 2.5,
      }),
    ).rejects.toThrow();
  });

  it('should allow quantityInStock to be zero (out of stock)', async () => {
    const vehicle = await Vehicle.create({
      make: 'Porsche',
      model: '911',
      category: 'Coupe',
      price: 110000,
      quantityInStock: 0,
    });

    expect(vehicle.quantityInStock).toBe(0);
  });
});
