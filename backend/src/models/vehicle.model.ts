import mongoose, { Document, Schema } from 'mongoose';

export const VEHICLE_CATEGORIES = [
  'Sedan',
  'SUV',
  'Truck',
  'Coupe',
  'Hatchback',
  'EV',
  'Convertible',
  'Van',
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export interface IVehicle extends Document {
  make: string;
  model: string;
  category: VehicleCategory;
  price: number;
  quantityInStock: number;
  year?: number;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
      minlength: [1, 'Vehicle make cannot be empty'],
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
      minlength: [1, 'Vehicle model cannot be empty'],
    },
    category: {
      type: String,
      required: [true, 'Vehicle category is required'],
      enum: {
        values: VEHICLE_CATEGORIES,
        message: 'Invalid vehicle category: {VALUE}',
      },
    },
    price: {
      type: Number,
      required: [true, 'Vehicle price is required'],
      min: [0.01, 'Vehicle price must be a positive amount'],
      validate: {
        validator: (value: number) => Number.isFinite(value) && value > 0,
        message: 'Vehicle price must be a valid finite positive number',
      },
    },
    quantityInStock: {
      type: Number,
      required: [true, 'Quantity in stock is required'],
      min: [0, 'Quantity in stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity in stock must be an integer',
      },
      default: 0,
    },
    year: {
      type: Number,
      required: false,
      min: [1900, 'Year must be 1900 or later'],
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  },
);

// Indexes supporting efficient catalog sorting, filtering, and stock lookups
vehicleSchema.index({ make: 1, model: 1 });
vehicleSchema.index({ category: 1 });
vehicleSchema.index({ price: 1 });
vehicleSchema.index({ quantityInStock: 1 });
vehicleSchema.index({ createdAt: -1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
