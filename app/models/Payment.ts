import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';
export type PaymentProviderType = 'stripe' | 'paymob' | 'test';

export interface IPayment extends Document {
  userId: string;
  userEmail?: string;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  providerPaymentId?: string;
  planId: string;
  billingCycle: 'monthly' | 'annual' | 'none';
  status: PaymentStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      index: true,
    },
    userEmail: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['stripe', 'paymob', 'test'],
      required: [true, 'Payment provider is required'],
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: '',
      index: true,
    },
    planId: {
      type: String,
      required: [true, 'Plan ID is required'],
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'none'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
