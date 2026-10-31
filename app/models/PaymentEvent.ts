import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentEventStatus = 'processed' | 'rejected';

export interface IPaymentEvent extends Document {
  eventId: string;
  provider: 'stripe' | 'paymob' | 'binance_pay' | 'test';
  eventType: string;
  status: PaymentEventStatus;
  processedAt: Date;
  payload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    eventId: {
      type: String,
      required: [true, 'eventId is required for idempotency'],
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['stripe', 'paymob', 'binance_pay', 'test'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['processed', 'rejected'],
      default: 'processed',
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const PaymentEvent: Model<IPaymentEvent> =
  mongoose.models.PaymentEvent ||
  mongoose.model<IPaymentEvent>('PaymentEvent', PaymentEventSchema);

export default PaymentEvent;
