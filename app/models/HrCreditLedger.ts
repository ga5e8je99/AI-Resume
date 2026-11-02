import mongoose, { Schema, Document, Model } from 'mongoose';
import type { HrCreditReason } from '@/lib/hr';

export interface IHrCreditLedger extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId | string;
  delta: number;
  balanceAfter: number;
  reason: HrCreditReason;
  refId: string;
  actorId?: mongoose.Types.ObjectId | string | null;
  createdAt: Date;
}

const HrCreditLedgerSchema = new Schema<IHrCreditLedger>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    delta: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    refId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for ledger audit queries by organization and reference ID
HrCreditLedgerSchema.index({ orgId: 1, createdAt: -1 });
HrCreditLedgerSchema.index({ orgId: 1, reason: 1, refId: 1 });

const HrCreditLedger: Model<IHrCreditLedger> =
  mongoose.models.HrCreditLedger ||
  mongoose.model<IHrCreditLedger>('HrCreditLedger', HrCreditLedgerSchema);

export default HrCreditLedger;

