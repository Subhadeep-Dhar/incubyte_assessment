import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseVehicleSnapshot {
  make: string;
  model: string;
  year?: number;
  category: string;
  imageUrl?: string;
  description?: string;
}

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleDetails?: IPurchaseVehicleSnapshot;
  priceAtPurchase: number;
  quantity: number;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    vehicleDetails: {
      make: { type: String, trim: true },
      model: { type: String, trim: true },
      year: { type: Number },
      category: { type: String, trim: true },
      imageUrl: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    priceAtPurchase: {
      type: Number,
      required: [true, 'Price at purchase is required'],
      min: [0.01, 'Price at purchase must be positive'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
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

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);
