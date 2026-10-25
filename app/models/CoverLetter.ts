import mongoose, { Schema, Document, Model } from 'mongoose';
import { CoverLetterTone, CoverLetterLanguage } from '../cover-letter/types';

export interface ICoverLetter extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  extractedKeywords: string[];
  tone: CoverLetterTone;
  language: CoverLetterLanguage;
  status: 'draft' | 'saved' | 'archived';
  isArchived: boolean;
  sender: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  recipient: {
    companyName: string;
    hiringManager?: string;
    department?: string;
    jobTitle: string;
    location?: string;
  };
  content: {
    subject?: string;
    salutation: string;
    introduction: string;
    bodyParagraphs: string[];
    conclusion: string;
    signOff: string;
    fullText: string;
  };
  templateId: string;
  linkedResumeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CoverLetterSchema = new Schema<ICoverLetter>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'My Cover Letter',
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters'],
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },
    jobDescription: {
      type: String,
      default: '',
      maxlength: [30000, 'Job description cannot exceed 30,000 characters'],
    },
    extractedKeywords: {
      type: [String],
      default: [],
    },
    tone: {
      type: String,
      enum: ['formal', 'technical', 'leadership', 'enthusiastic'],
      default: 'formal',
      index: true,
    },
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'saved', 'archived'],
      default: 'saved',
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    sender: {
      type: Schema.Types.Mixed,
      required: true,
    },
    recipient: {
      type: Schema.Types.Mixed,
      required: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    templateId: {
      type: String,
      default: 'compact',
    },
    linkedResumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant query patterns & user isolation
CoverLetterSchema.index({ userId: 1, updatedAt: -1 });
CoverLetterSchema.index({ userId: 1, isArchived: 1, updatedAt: -1 });
CoverLetterSchema.index({ userId: 1, companyName: 1 });
CoverLetterSchema.index({ companyName: 'text', jobTitle: 'text', title: 'text' });

const CoverLetter: Model<ICoverLetter> =
  mongoose.models.CoverLetter || mongoose.model<ICoverLetter>('CoverLetter', CoverLetterSchema);

export default CoverLetter;
