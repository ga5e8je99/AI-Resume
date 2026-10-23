import mongoose, { Schema, Document, Model } from 'mongoose';
import { ATSAnalysisResult } from '../lib/atsAnalyzer';

export interface IAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resumeFileName: string;
  targetRole: string;
  targetJobDescription?: string;
  overallScore: number;
  grade: string;
  rankPercentile: string;
  matchLabel: string;
  subScores: {
    keywordsMatch: number;
    formatting: number;
    structure: number;
    contentQuality: number;
  };
  result: ATSAnalysisResult;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeFileName: {
      type: String,
      default: 'Uploaded_Resume.pdf',
    },
    targetRole: {
      type: String,
      default: 'Full-Stack Developer',
    },
    targetJobDescription: {
      type: String,
      default: '',
    },
    overallScore: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      default: 'B+',
    },
    rankPercentile: {
      type: String,
      default: 'Top 25%',
    },
    matchLabel: {
      type: String,
      default: 'Strong Match',
    },
    subScores: {
      keywordsMatch: Number,
      formatting: Number,
      structure: Number,
      contentQuality: Number,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Analysis: Model<IAnalysis> =
  mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export default Analysis;
