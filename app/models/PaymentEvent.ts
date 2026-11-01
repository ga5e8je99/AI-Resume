import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentEventStatus = 'processed' | 'rejected';

export interface IPaymentEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: string;
  provider: 'lemonsqueezy' | 'stripe' | 'paymob' | 'test';
  eventType: string;
  status: PaymentEventStatus;
  processedAt: Date;
  payload?: Record<string, any>;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['lemonsqueezy', 'stripe', 'paymob', 'test'],
      required: true,
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
