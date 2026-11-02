import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  ApplicationStatus,
  ApplicationScreeningAnswer,
  ApplicationAnalysis,
} from '@/lib/hr';

export interface IApplicationConsent {
  sharedAt: Date;
  version: string;
  shareSalary?: boolean;
  sharePhone?: boolean;
}

export interface IApplicationAnalysis {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths?: string[];
  gaps?: string[];
  interviewQuestions?: string[];
  scoreBreakdown?: {
    skillsScore: number;
    experienceScore: number;
    roleFitScore: number;
    explanation: string;
  };
  jobDescriptionHash?: string;
  redactedCategories?: string[];
  summary: string;
  model: string;
  createdAt: Date;
  creditsUsed: number;
}

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId | string;
  orgId: mongoose.Types.ObjectId | string;
  candidateId: mongoose.Types.ObjectId | string;
  resumeSnapshot: Record<string, any>;
  coverLetter?: string;
  answers: ApplicationScreeningAnswer[];
  consent: IApplicationConsent;
  status: ApplicationStatus;
  notes: string; // Private to HR only
  manualRank?: number | null;
  analysis: IApplicationAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningAnswerSchema = new Schema<ApplicationScreeningAnswer>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ApplicationAnalysisSchema = new Schema<IApplicationAnalysis>(
  {
    score: { type: Number, required: true, min: 0, max: 100 },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    gaps: { type: [String], default: [] },
    interviewQuestions: { type: [String], default: [] },
    scoreBreakdown: {
      skillsScore: { type: Number, default: 0 },
      experienceScore: { type: Number, default: 0 },
      roleFitScore: { type: Number, default: 0 },
      explanation: { type: String, default: '' },
    },
    jobDescriptionHash: { type: String, default: '' },
    redactedCategories: { type: [String], default: [] },
    summary: { type: String, default: '' },
    model: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    creditsUsed: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'EmployerJob',
      required: true,
      index: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeSnapshot: {
      type: Schema.Types.Mixed,
      required: [true, 'A resume snapshot is required when applying'],
    },
    coverLetter: {
      type: String,
      default: '',
    },
    answers: {
      type: [ScreeningAnswerSchema],
      default: [],
    },
    consent: {
      sharedAt: { type: Date, required: true, default: Date.now },
      version: { type: String, required: true, default: '1.0' },
      shareSalary: { type: Boolean, default: false },
      sharePhone: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['new', 'shortlisted', 'interview', 'rejected', 'hired'],
      default: 'new',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    manualRank: {
      type: Number,
      default: null,
    },
    analysis: {
      type: ApplicationAnalysisSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate applications per candidate per job
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

// Indexes for HR pipeline filtering & candidate history
ApplicationSchema.index({ jobId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ orgId: 1, status: 1, createdAt: -1 });
ApplicationSchema.index({ candidateId: 1, createdAt: -1 });

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application;

