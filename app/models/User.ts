import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserPlan = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual' | 'lifetime' | 'none';
export type PaymentProvider = 'stripe' | 'paymob' | 'paddle' | 'binance' | 'none';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'none';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin';
  isDemo?: boolean;
  plan: UserPlan;
  aiCredits: number;
  aiResumeGenerationsCount?: number;
  jobMatchFreeUsed?: number;
  billingCycle: BillingCycle;
  planExpiresAt: Date | null;
  proExpiresAt: Date | null;
  paymentProvider: PaymentProvider;
  providerCustomerId: string;
  providerSubscriptionId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus?: SubscriptionStatus;
  paymentFailedAt?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    aiCredits: {
      type: Number,
      default: 3,
    },
    aiResumeGenerationsCount: {
      type: Number,
      default: 0,
    },
    jobMatchFreeUsed: {
      type: Number,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual', 'lifetime', 'none'],
      default: 'none',
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    proExpiresAt: {
      type: Date,
      default: null,
    },
    paymentProvider: {
      type: String,
      enum: ['stripe', 'paymob', 'paddle', 'binance', 'none'],
      default: 'none',
    },
    providerCustomerId: {
      type: String,
      default: '',
    },
    providerSubscriptionId: {
      type: String,
      default: '',
    },
    stripeCustomerId: {
      type: String,
      default: '',
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: '',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'expired', 'none'],
      default: 'none',
    },
    paymentFailedAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      index: true,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js development hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
