import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  make: string;
  model: string;
  category: string;
  price: number;
  quantityInStock: number;
  year?: number;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>({
  make: { type: String },
  model: { type: String },
  category: { type: String },
  price: { type: Number },
  quantityInStock: { type: Number },
});

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
