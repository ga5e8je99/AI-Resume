import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobCache extends Document {
  cacheKey: string;
  query: string;
  location: string;
  remote: boolean;
  country: string;
  data: any;
  expiresAt: Date;
  createdAt: Date;
}

const JobCacheSchema = new Schema<IJobCache>(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    query: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    remote: {
      type: Boolean,
      default: false,
    },
    country: {
      type: String,
      default: '',
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index auto-deletes expired docs
    },
  },
  {
    timestamps: true,
  }
);

const JobCache: Model<IJobCache> =
  mongoose.models.JobCache || mongoose.model<IJobCache>('JobCache', JobCacheSchema);

export default JobCache;
