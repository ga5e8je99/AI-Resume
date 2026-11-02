import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  sanitizeJobMarkdown,
  generateEmployerJobSlug,
  type EmployerJobStatus,
  type EmployerJobSeniority,
  type EmployerJobSalary,
} from '@/lib/hr';
import type { EmploymentType } from '@/lib/profile';

export interface IEmployerJob extends Document {
  _id: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  seniority: EmployerJobSeniority;
  salary: EmployerJobSalary;
  screeningQuestions: string[];
  applyMode: 'internal';
  status: EmployerJobStatus;
  moderationFlags: string[];
  paidWithCredit: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  applicantsCount: number;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployerJobSchema = new Schema<IEmployerJob>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [160, 'Job title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      set: (val: string) => sanitizeJobMarkdown(val, 15000),
    },
    requirements: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    remote: {
      type: Boolean,
      default: false,
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship'],
      default: 'full-time',
    },
    seniority: {
      type: String,
      enum: ['student', 'junior', 'mid', 'senior', 'lead', 'any'],
      default: 'any',
    },
    salary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: 'USD', trim: true },
      visible: { type: Boolean, default: false },
    },
    screeningQuestions: {
      type: [String],
      default: [],
    },
    applyMode: {
      type: String,
      enum: ['internal'],
      default: 'internal',
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'closed', 'expired'],
      default: 'draft',
      index: true,
    },
    moderationFlags: {
      type: [String],
      default: [],
    },
    paidWithCredit: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    applicantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EmployerJobSchema.pre('validate', function () {
  if (this.description) {
    this.description = sanitizeJobMarkdown(this.description, 15000);
  }
  if (!this.slug && this.title) {
    this.slug = generateEmployerJobSlug(this.title);
  }
});

// Compound indexes for HR dashboard & public job board queries
EmployerJobSchema.index({ orgId: 1, status: 1, createdAt: -1 });
EmployerJobSchema.index({ status: 1, publishedAt: -1 });
EmployerJobSchema.index({ skills: 1 });

const EmployerJob: Model<IEmployerJob> =
  mongoose.models.EmployerJob ||
  mongoose.model<IEmployerJob>('EmployerJob', EmployerJobSchema);

export default EmployerJob;

