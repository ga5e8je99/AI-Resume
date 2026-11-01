import mongoose, { Schema, Document, Model } from 'mongoose';

export type AiUsageStatus = 'hit' | 'fallback';

export interface IAiUsage extends Omit<Document, 'model'> {
  _id: mongoose.Types.ObjectId;
  userId: string;
  endpoint: string;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  costUsd: number;
  latency: number;
  latencyMs: number;
  status: AiUsageStatus;
  fallbackReason?: string;
  provider?: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiUsageSchema = new Schema<IAiUsage>(
  {
    userId: {
      type: String,
      required: true,
      default: 'anonymous',
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    tokens: {
      type: Number,
      required: true,
      default: 0,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      required: true,
      default: 0,
    },
    costUsd: {
      type: Number,
      required: true,
      default: 0,
    },
    latency: {
      type: Number,
      required: true,
      default: 0,
    },
    latencyMs: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['hit', 'fallback'],
      required: true,
      index: true,
    },
    fallbackReason: {
      type: String,
      default: undefined,
    },
    provider: {
      type: String,
      default: 'built-in-ats-engine',
    },
    model: {
      type: String,
      default: 'gpt-4o-mini',
    },
  },
  {
    timestamps: true,
    collection: 'ai_usages',
  }
);

AiUsageSchema.index({ createdAt: -1 });
AiUsageSchema.index({ userId: 1, createdAt: -1 });
AiUsageSchema.index({ endpoint: 1, createdAt: -1 });

const AiUsage: Model<IAiUsage> =
  (mongoose.models.AiUsage as Model<IAiUsage>) ||
  mongoose.model<IAiUsage>('AiUsage', AiUsageSchema);

export default AiUsage;
