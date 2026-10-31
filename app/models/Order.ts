import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus =
  | 'created'
  | 'awaiting_payment'
  | 'pending_review'
  | 'paid'
  | 'expired'
  | 'rejected';

export type PaymentMethodType = 'binance_pay' | 'manual_crypto' | 'paymob' | 'stripe';
export type CryptoNetwork = 'BEP20' | 'TRC20' | 'binance' | 'paymob' | 'stripe';
export type OrderCurrency = 'USDT' | 'EGP' | 'USD';

export interface IOrderAuditLog {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  actor?: string; // 'system' | 'user' | 'admin' | 'binance_webhook' | 'paymob_webhook'
}

export interface IOrder extends Document {
  userId: string;
  userEmail: string;
  planId: 'pro' | 'payg';
  billingCycle: 'monthly' | 'annual' | 'once';
  baseAmount: number;
  amount: number; // e.g. 9.14 USDT or 199 EGP
  currency: OrderCurrency;
  method: PaymentMethodType;
  network: CryptoNetwork;
  status: OrderStatus;
  txid?: string | null;
  reference: string;
  recipientAddress?: string;
  expiresAt: Date;
  paidAt?: Date | null;
  proExpiresAt?: Date | null;
  auditLog: IOrderAuditLog[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderAuditLogSchema = new Schema<IOrderAuditLog>(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
    actor: {
      type: String,
      default: 'system',
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      index: true,
    },
    userEmail: {
      type: String,
      required: [true, 'userEmail is required'],
      lowercase: true,
      trim: true,
    },
    planId: {
      type: String,
      enum: ['pro', 'payg'],
      required: [true, 'planId is required'],
      index: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'once'],
      required: [true, 'billingCycle is required'],
    },
    baseAmount: {
      type: Number,
      required: [true, 'baseAmount is required'],
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
    },
    currency: {
      type: String,
      enum: ['USDT', 'EGP', 'USD'],
      default: 'USDT',
      required: true,
    },
    method: {
      type: String,
      enum: ['binance_pay', 'manual_crypto', 'paymob', 'stripe'],
      required: true,
      index: true,
    },
    network: {
      type: String,
      enum: ['BEP20', 'TRC20', 'binance', 'paymob', 'stripe'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['created', 'awaiting_payment', 'pending_review', 'paid', 'expired', 'rejected'],
      default: 'awaiting_payment',
      index: true,
    },
    txid: {
      type: String,
      unique: true,
      sparse: true, // Only enforces uniqueness when txid is non-null
      trim: true,
      lowercase: true,
    },
    reference: {
      type: String,
      required: [true, 'reference is required'],
      unique: true,
      trim: true,
      index: true,
    },
    recipientAddress: {
      type: String,
      default: '',
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    proExpiresAt: {
      type: Date,
      default: null,
    },
    auditLog: {
      type: [OrderAuditLogSchema],
      default: [],
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

OrderSchema.index({ status: 1, expiresAt: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

// Prevent re-compilation of model in Next.js development hot reload
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
