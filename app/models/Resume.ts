import mongoose, { Schema, Document, Model } from 'mongoose';
import { ResumeData, TemplateId, ThemeConfig } from '../builder/types';

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  templateId: TemplateId;
  theme: ThemeConfig;
  data: ResumeData;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'My ATS Resume',
      trim: true,
    },
    templateId: {
      type: String,
      default: 'compact',
    },
    theme: {
      accentColor: { type: String, default: '#2563eb' },
      fontFamily: { type: String, default: 'var(--font-sans), sans-serif' },
      fontSize: { type: String, default: 'base' },
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ResumeSchema.index({ userId: 1, updatedAt: -1 });

const Resume: Model<IResume> = mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

export default Resume;
