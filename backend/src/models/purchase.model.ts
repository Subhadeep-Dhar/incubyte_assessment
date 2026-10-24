import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  priceAtPurchase: number;
  purchasedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  priceAtPurchase: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
});

export const Purchase = mongoose.model<IPurchase>('Purchase', purchaseSchema);
