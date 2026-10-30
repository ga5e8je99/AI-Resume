import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentEvent extends Document {
  eventId: string;
  provider: 'stripe' | 'paymob' | 'test';
  eventType: string;
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
      enum: ['stripe', 'paymob', 'test'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
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
