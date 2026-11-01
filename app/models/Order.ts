import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus =
  | 'created'
  | 'awaiting_payment'
  | 'pending_review'
  | 'paid'
  | 'expired'
  | 'rejected'
  | 'refunded';

export type PaymentMethodType = 'lemonsqueezy' | 'paymob' | 'stripe';
export type OrderCurrency = 'EGP' | 'USD';

export interface IOrderAuditEntry {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  actor?: string;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  userEmail: string;
  planId: 'pro' | 'payg';
  billingCycle: 'monthly' | 'annual' | 'once';
  baseAmount: number;
  amount: number;
  currency: OrderCurrency;
  method: PaymentMethodType;
  network?: string | null;
  status: OrderStatus;
  txid?: string | null;
  reference: string;
  recipientAddress?: string;
  expiresAt: Date;
  paidAt?: Date | null;
  proExpiresAt?: Date | null;
  auditLog: IOrderAuditEntry[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderAuditSchema = new Schema<IOrderAuditEntry>(
  {
    status: {
      type: String,
      enum: ['created', 'awaiting_payment', 'pending_review', 'paid', 'expired', 'rejected', 'refunded'],
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
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    planId: {
      type: String,
      enum: ['pro', 'payg'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'once'],
      required: true,
    },
    baseAmount: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ['EGP', 'USD'],
      default: 'USD',
      required: true,
    },
    method: {
      type: String,
      enum: ['lemonsqueezy', 'paymob', 'stripe'],
      required: true,
    },
    network: {
      type: String,
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'awaiting_payment', 'pending_review', 'paid', 'expired', 'rejected', 'refunded'],
      default: 'awaiting_payment',
      index: true,
    },
    txid: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipientAddress: {
      type: String,
      default: '',
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
      type: [OrderAuditSchema],
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

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
