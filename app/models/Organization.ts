import mongoose, { Schema, Document, Model } from 'mongoose';
import type { OrgMemberRole, OrganizationSize } from '@/lib/hr';

export interface IOrganizationMember {
  userId: mongoose.Types.ObjectId | string;
  role: OrgMemberRole;
  addedAt: Date;
}

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  website: string;
  logo: string;
  industry: string;
  size: OrganizationSize | string;
  country: string;
  verified: boolean;
  workEmail?: string;
  verificationTokenHash?: string | null;
  verificationExpiresAt?: Date | null;
  verifiedAt?: Date | null;
  ownerId: mongoose.Types.ObjectId | string;
  members: IOrganizationMember[];
  hrCredits: number;
  creditBalance: number;
  monthlySpendCap?: number | null;
  lowBalanceThreshold?: number;
  lowBalanceAlertEnabled?: boolean;
  lastLowBalanceAlertAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'recruiter'],
      default: 'recruiter',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
      trim: true,
    },
    industry: {
      type: String,
      default: '',
      trim: true,
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', ''],
      default: '1-10',
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    workEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    verificationTokenHash: {
      type: String,
      default: null,
    },
    verificationExpiresAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [OrganizationMemberSchema],
      default: [],
    },
    hrCredits: {
      type: Number,
      default: 0,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
    monthlySpendCap: {
      type: Number,
      default: null,
    },
    lowBalanceThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    lowBalanceAlertEnabled: {
      type: Boolean,
      default: true,
    },
    lastLowBalanceAlertAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

OrganizationSchema.pre('validate', function () {
  // Keep hrCredits and creditBalance synchronized (allows negative balance when provider refunds an already-spent pack)
  if (typeof this.hrCredits === 'number' && Number.isFinite(this.hrCredits)) {
    this.creditBalance = this.hrCredits;
  } else if (typeof this.creditBalance === 'number' && Number.isFinite(this.creditBalance)) {
    this.hrCredits = this.creditBalance;
  } else {
    this.hrCredits = 0;
    this.creditBalance = 0;
  }
});

// Indexes for fast lookup by owner and team members
OrganizationSchema.index({ ownerId: 1, createdAt: -1 });
OrganizationSchema.index({ 'members.userId': 1 });

const Organization: Model<IOrganization> =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;

