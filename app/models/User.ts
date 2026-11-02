import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserPlan = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual' | 'lifetime' | 'none';
export type PaymentProvider = 'lemonsqueezy' | 'stripe' | 'paymob' | 'paddle' | 'none';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'none';
export type UserAccountType = 'candidate' | 'employer' | 'both';
export type UserAccountRole = 'candidate' | 'employer';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin';
  accountType?: UserAccountType;
  accountTypes?: UserAccountRole[];
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
  lemonCustomerId: string;
  lemonSubscriptionId: string;
  subscriptionStatus?: SubscriptionStatus;
  paymentFailedAt?: Date | null;
  emailVerified?: Date | null;
  emailVerifyTokenHash?: string | null;
  emailVerifyExpires?: Date | null;
  termsAcceptedAt?: Date | null;
  termsVersion?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  // User Profile & Onboarding fields (1:1 embedded on User)
  fullName?: string;
  headline?: string;
  targetRole?: string;
  seniority?: 'student' | 'junior' | 'mid' | 'senior' | 'lead' | null;
  yearsOfExperience?: number | null;
  industries?: string[];
  skills?: string[];
  country?: string;
  city?: string;
  willingToRelocate?: boolean;
  remotePreference?: 'onsite' | 'hybrid' | 'remote' | 'any';
  employmentTypes?: ('full-time' | 'part-time' | 'contract' | 'internship')[];
  expectedSalary?: {
    min: number | null;
    max: number | null;
    currency: string;
    visible: boolean;
  };
  languages?: string[];
  phone?: string;
  phoneVisible?: boolean;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  profileCompletion?: number;
  onboardingCompletedAt?: Date | null;
  onboardingSkippedAt?: Date | null;
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
    accountType: {
      type: String,
      enum: ['candidate', 'employer', 'both'],
      default: 'candidate',
      index: true,
    },
    accountTypes: {
      type: [String],
      enum: ['candidate', 'employer'],
      default: ['candidate'],
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
      enum: ['lemonsqueezy', 'stripe', 'paymob', 'paddle', 'none'],
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
    lemonCustomerId: {
      type: String,
      default: '',
      index: true,
    },
    lemonSubscriptionId: {
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
    emailVerified: {
      type: Date,
      default: null,
    },
    emailVerifyTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    emailVerifyExpires: {
      type: Date,
      default: null,
    },
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
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
    fullName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Full name cannot exceed 120 characters'],
    },
    headline: {
      type: String,
      default: '',
      trim: true,
      maxlength: [160, 'Headline cannot exceed 160 characters'],
    },
    targetRole: {
      type: String,
      default: '',
      trim: true,
      maxlength: [160, 'Target role cannot exceed 160 characters'],
    },
    seniority: {
      type: String,
      enum: ['student', 'junior', 'mid', 'senior', 'lead', null],
      default: null,
    },
    yearsOfExperience: {
      type: Number,
      default: null,
      min: 0,
      max: 60,
    },
    industries: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => !Array.isArray(arr) || arr.length <= 30,
        message: 'Skills cannot exceed 30 items',
      },
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    willingToRelocate: {
      type: Boolean,
      default: false,
    },
    remotePreference: {
      type: String,
      enum: ['onsite', 'hybrid', 'remote', 'any'],
      default: 'any',
    },
    employmentTypes: {
      type: [String],
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: [],
    },
    expectedSalary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: 'USD' },
      visible: { type: Boolean, default: false },
    },
    languages: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    phoneVisible: {
      type: Boolean,
      default: false,
    },
    links: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
    },
    onboardingSkippedAt: {
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
