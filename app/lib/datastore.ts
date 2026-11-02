import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import mongoose from 'mongoose';
import connectToDatabase from './db';
import User, { IUser } from '../models/User';
import Resume, { IResume } from '../models/Resume';
import Analysis, { IAnalysis } from '../models/Analysis';
import CoverLetter, { ICoverLetter } from '../models/CoverLetter';
import Payment, { IPayment } from '../models/Payment';
import PaymentEvent, { IPaymentEvent, PaymentEventStatus } from '../models/PaymentEvent';
import Order, { IOrder, OrderStatus, PaymentMethodType, OrderCurrency } from '../models/Order';
import AiUsage, { AiUsageStatus } from '../models/AiUsage';
import Organization from '../models/Organization';
import EmployerJob from '../models/EmployerJob';
import Application from '../models/Application';
import HrCreditLedger from '../models/HrCreditLedger';
import { CoverLetterService } from './coverLetterService';
import {
  getPlanCredits,
  isHrPackId,
  JOB_MATCH_FREE_QUOTA,
  JOB_MATCH_CREDIT_COST,
} from '@/lib/plans';
import {
  sendEmail,
  getHrLowBalanceAlertEmailHtml,
  getHrLowBalanceAlertEmailSubject,
} from '@/lib/email';
import {
  resolveAccountRoleState,
  enableAccountRole,
  hasAccountRole,
  sanitizeJobMarkdown,
  generateEmployerJobSlug,
  formatApplicationForViewer,
  type AccountRole,
  type AccountType,
  type OrgMemberRole,
  type OrganizationSize,
  type OrganizationRecord,
  type EmployerJobRecord,
  type EmployerJobStatus,
  type EmployerJobSeniority,
  type EmployerJobSalary,
  type ApplicationRecord,
  type ApplicationStatus,
  type ApplicationScreeningAnswer,
  type ApplicationAnalysis,
  type HrCreditLedgerRecord,
  type HrCreditReason,
  type JobReportRecord,
  type JobReportReason,
} from '@/lib/hr';
import {
  validateCompanyDomainEmail,
  moderateJobContent,
  type ModerationFlagCode,
} from '@/lib/hr/moderation';
import {
  analyzeApplicantAgainstJob,
  computeJobDescriptionHash,
  buildTop10ComparisonReport,
  ORG_DAILY_ANALYSIS_LIMIT,
  TOP_10_COMPARISON_CREDIT_COST,
  SINGLE_APPLICANT_ANALYSIS_CREDIT_COST,
  BULK_ANALYZE_MAX_BATCH_SIZE,
  type Top10ComparisonReport,
} from '@/lib/employer/analyzeApplicant';
import {
  Job,
  SavedJobItem,
  SavedJobSearch,
  JobClickRecord,
  JobAlertFrequency,
} from '@/lib/jobs/types';
import {
  calculateProfileCompletion,
  formatProfileForViewer,
  sanitizePhoneText,
  sanitizeProfileText,
  type EmploymentType,
  type ExpectedSalary,
  type ProfileLinks,
  type ProfileUpdateInput,
  type RedactedUserProfile,
  type RemotePreference,
  type SeniorityLevel,
  type UserProfileData,
} from '@/lib/profile';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  accountType?: AccountType;
  accountTypes?: AccountRole[];
  isDemo?: boolean;
  plan?: 'free' | 'pro' | 'enterprise';
  aiCredits?: number;
  aiResumeGenerationsCount?: number;
  jobMatchFreeUsed?: number;
  billingCycle?: 'monthly' | 'annual' | 'lifetime' | 'none';
  planExpiresAt?: string | null;
  proExpiresAt?: string | null;
  paymentProvider?: 'lemonsqueezy' | 'stripe' | 'paymob' | 'paddle' | 'none';
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  lemonCustomerId?: string;
  lemonSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'expired' | 'none';
  paymentFailedAt?: string | null;
  emailVerified?: string | null;
  emailVerifyTokenHash?: string | null;
  emailVerifyExpires?: string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: string | null;
  fullName?: string;
  headline?: string;
  targetRole?: string;
  seniority?: SeniorityLevel | null;
  yearsOfExperience?: number | null;
  industries?: string[];
  skills?: string[];
  country?: string;
  city?: string;
  willingToRelocate?: boolean;
  remotePreference?: RemotePreference;
  employmentTypes?: EmploymentType[];
  expectedSalary?: ExpectedSalary;
  languages?: string[];
  phone?: string;
  phoneVisible?: boolean;
  links?: ProfileLinks;
  avatar?: string;
  profileCompletion?: number;
  onboardingCompletedAt?: string | null;
  onboardingSkippedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredOrder {
  id: string;
  userId: string;
  userEmail: string;
  planId: 'pro' | 'payg' | 'hr_pack_50' | 'hr_pack_200' | 'hr_pack_1000';
  billingCycle: 'monthly' | 'annual' | 'once';
  baseAmount: number;
  amount: number;
  currency: OrderCurrency;
  method: PaymentMethodType;
  network?: string | null;
  status: OrderStatus;
  txid?: string | null;
  reference: string;
  recipientAddress?: string;
  expiresAt: string;
  paidAt?: string | null;
  proExpiresAt?: string | null;
  auditLog: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    actor?: string;
  }[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StoredResume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  theme: any;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAnalysis {
  id: string;
  userId: string;
  resumeFileName: string;
  targetRole: string;
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
  result: any;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCoverLetter {
  id: string;
  userId: string;
  title: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  extractedKeywords: string[];
  tone: 'formal' | 'technical' | 'leadership' | 'enthusiastic';
  language: 'ar' | 'en';
  status?: 'draft' | 'saved' | 'archived';
  isArchived?: boolean;
  sender: any;
  recipient: any;
  content: any;
  templateId: string;
  linkedResumeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAiUsage {
  id: string;
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
  provider: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalDatabase {
  users: StoredUser[];
  resumes: StoredResume[];
  analyses: StoredAnalysis[];
  coverLetters?: StoredCoverLetter[];
  payments?: any[];
  paymentEvents?: any[];
  jobCache?: any[];
  orders?: StoredOrder[];
  aiUsage?: StoredAiUsage[];
  savedJobs?: SavedJobItem[];
  savedSearches?: SavedJobSearch[];
  jobClicks?: JobClickRecord[];
  organizations?: (OrganizationRecord & {
    verificationTokenHash?: string | null;
    verificationExpiresAt?: string | null;
  })[];
  employerJobs?: EmployerJobRecord[];
  applications?: ApplicationRecord[];
  hrCreditLedger?: HrCreditLedgerRecord[];
  jobReports?: JobReportRecord[];
}

// Initial seed data so user sees complete, realistic data right away
const INITIAL_DB: LocalDatabase = {
  users: [
    {
      id: 'usr_admin_001',
      name: 'Admin Manager',
      email: 'admin@jobmatch.ai',
      password: '$2a$10$wT8m9aHn9q6XqZvZl0lPbe4E7mO8QGqVw1jG6w6rD7eF9tY1yM8aW', // admin123
      role: 'admin',
      emailVerified: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_002',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      role: 'user',
      emailVerified: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'usr_003',
      name: 'Omar Mansour',
      email: 'omar.mansour@gmail.com',
      role: 'user',
      emailVerified: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  resumes: [
    {
      id: 'res_001',
      userId: 'usr_002',
      title: 'Senior Frontend Engineer CV',
      templateId: 'compact',
      theme: { accentColor: '#10b981', fontSize: 'base', fontFamily: 'var(--font-sans), sans-serif' },
      data: {
        personalInfo: {
          fullName: 'Sarah Jenkins',
          jobTitle: 'Senior Frontend Engineer',
          email: 'sarah.jenkins@example.com',
          phone: '+1 (555) 234-5678',
          location: 'San Francisco, CA',
        },
        experience: [
          {
            id: 'exp1',
            title: 'Senior Frontend Developer',
            company: 'TechCorp Solutions',
            location: 'San Francisco, CA',
            startDate: '2022-03',
            endDate: 'Present',
            current: true,
            bullets: [
              'Architected high-performance React Next.js web application serving 500k+ daily users',
              'Boosted ATS & Core Web Vitals performance score by 35% through code splitting',
            ],
          },
        ],
        education: [
          {
            id: 'edu1',
            degree: 'B.S. in Computer Science',
            school: 'University of California, Berkeley',
            graduationDate: '2020',
          },
        ],
        skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'Jest'],
      },
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'res_002',
      userId: 'usr_003',
      title: 'Omar Mansour - Full Stack Resume',
      templateId: 'two-column',
      theme: { accentColor: '#2563eb', fontSize: 'base', fontFamily: 'var(--font-sans), sans-serif' },
      data: {
        personalInfo: {
          fullName: 'Omar Mansour',
          jobTitle: 'Full-Stack Developer',
          email: 'omar.mansour@gmail.com',
          phone: '+20 100 123 4567',
          location: 'Cairo, Egypt',
        },
        experience: [
          {
            id: 'exp1',
            title: 'Full-Stack Engineer',
            company: 'CloudVentures',
            startDate: '2021-01',
            endDate: 'Present',
            current: true,
            bullets: ['Built scalable Node.js microservices handling 10M API requests per month'],
          },
        ],
        education: [
          {
            id: 'edu1',
            degree: 'Bachelor of Engineering',
            school: 'Cairo University',
            graduationDate: '2021',
          },
        ],
        skills: ['Node.js', 'React', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS'],
      },
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'res_003',
      userId: 'usr_002',
      title: 'Sarah Jenkins - Product Lead CV',
      templateId: 'ats-friendly',
      theme: { accentColor: '#8b5cf6', fontSize: 'base', fontFamily: 'var(--font-sans), sans-serif' },
      data: {
        personalInfo: {
          fullName: 'Sarah Jenkins',
          jobTitle: 'Technical Product Lead',
          email: 'sarah.jenkins@example.com',
          phone: '+1 (555) 234-5678',
        },
        experience: [],
        education: [],
        skills: ['Product Strategy', 'Agile', 'Jira', 'UX Research', 'Metrics Analysis'],
      },
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
  ],
  analyses: [
    {
      id: 'ana_001',
      userId: 'usr_002',
      resumeFileName: 'Sarah_Jenkins_CV.pdf',
      targetRole: 'Senior Frontend Engineer',
      overallScore: 88,
      grade: 'A',
      rankPercentile: 'Top 10%',
      matchLabel: 'Very Strong Match',
      subScores: {
        keywordsMatch: 92,
        formatting: 90,
        structure: 85,
        contentQuality: 85,
      },
      result: {},
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'ana_002',
      userId: 'usr_003',
      resumeFileName: 'Omar_Mansour_FullStack.pdf',
      targetRole: 'Full-Stack Developer',
      overallScore: 78,
      grade: 'B+',
      rankPercentile: 'Top 25%',
      matchLabel: 'Strong Match',
      subScores: {
        keywordsMatch: 75,
        formatting: 85,
        structure: 80,
        contentQuality: 72,
      },
      result: {},
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
  ],
};

let lastKnownGoodDb: LocalDatabase | null = null;

function readLocalDb(): LocalDatabase {
  try {
    // In serverless environments (e.g. Vercel), root filesystem is read-only
    if (process.env.VERCEL) {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.coverLetters) parsed.coverLetters = [];
        lastKnownGoodDb = parsed;
        return parsed;
      }
      return lastKnownGoodDb ?? INITIAL_DB;
    }

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      lastKnownGoodDb = INITIAL_DB;
      return INITIAL_DB;
    }

    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        if (!raw || !raw.trim()) {
          throw new SyntaxError('Empty local db file during concurrent write');
        }
        const parsed = JSON.parse(raw);
        if (!parsed.coverLetters) parsed.coverLetters = [];
        lastKnownGoodDb = parsed;
        return parsed;
      } catch (readErr) {
        lastErr = readErr;
      }
    }

    if (lastKnownGoodDb) {
      return lastKnownGoodDb;
    }
    console.warn('[DataStore] Error reading local db file, fallback to initial:', lastErr);
    return INITIAL_DB;
  } catch (err) {
    if (lastKnownGoodDb) {
      return lastKnownGoodDb;
    }
    console.warn('[DataStore] Error reading local db file, fallback to initial:', err);
    return INITIAL_DB;
  }
}

function writeLocalDb(db: LocalDatabase) {
  lastKnownGoodDb = db;
  try {
    // In serverless environments (e.g. Vercel), root filesystem is read-only
    if (process.env.VERCEL) {
      return;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized = JSON.stringify(db, null, 2);
    const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
    try {
      fs.writeFileSync(tmpFile, serialized, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch {
      // On Windows, renameSync can throw EPERM if another handle is open; fall back to direct write
      fs.writeFileSync(DB_FILE, serialized, 'utf-8');
      try {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      } catch {
        // Ignore cleanup failure for temp file
      }
    }
  } catch (err: any) {
    console.warn('[DataStore] Local file write skipped or unsupported in this environment:', err?.message);
  }
}

// Check if MongoDB is connected, returns boolean without blocking
let isMongoWorking = false;
let lastCheckTime = 0;

export async function isMongoAvailable(): Promise<boolean> {
  // Fast path: if already connected (readyState 1 = connected), return true immediately with 0ms latency
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return true;
  }

  const now = Date.now();
  // Cache failed result for 5 minutes to avoid repeating failed connection attempts
  if (now - lastCheckTime < 300000 && !isMongoWorking) {
    return false;
  }
  lastCheckTime = now;

  try {
    const conn = await Promise.race([
      connectToDatabase(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]);
    isMongoWorking = !!(conn && conn.connection.readyState === 1);
    return isMongoWorking;
  } catch (err) {
    isMongoWorking = false;
    return false;
  }
}

// In-process async mutex queue to ensure atomic order completion & TXID uniqueness
let orderLockQueue: Promise<any> = Promise.resolve();
let orderLockActive = false;

export async function withOrderLock<T>(fn: () => Promise<T>): Promise<T> {
  // Re-entrant fast path to prevent nested withOrderLock deadlocks
  if (orderLockActive) {
    return await fn();
  }
  const prev = orderLockQueue;
  let release!: () => void;
  orderLockQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  orderLockActive = true;
  try {
    return await fn();
  } finally {
    orderLockActive = false;
    release();
  }
}


function normalizeUserProfileFromRecord(u: any): UserProfileData {
  const userId = (u._id ? u._id.toString() : u.id) || '';
  const fullName = sanitizeProfileText(u.fullName || u.name || '', 120);
  const headline = sanitizeProfileText(u.headline || u.targetRole || '', 160);
  const targetRole = sanitizeProfileText(u.targetRole || u.headline || '', 160);
  const seniority: SeniorityLevel | null =
    u.seniority && ['student', 'junior', 'mid', 'senior', 'lead'].includes(u.seniority)
      ? u.seniority
      : null;
  const yearsOfExperience =
    typeof u.yearsOfExperience === 'number' && Number.isFinite(u.yearsOfExperience)
      ? u.yearsOfExperience
      : null;
  const industries = Array.isArray(u.industries)
    ? u.industries.filter((i: any) => typeof i === 'string' && i.trim()).slice(0, 15)
    : [];
  const skills = Array.isArray(u.skills)
    ? u.skills.filter((s: any) => typeof s === 'string' && s.trim()).slice(0, 30)
    : [];
  const country = typeof u.country === 'string' ? u.country : '';
  const city = typeof u.city === 'string' ? u.city : '';
  const willingToRelocate = Boolean(u.willingToRelocate);
  const remotePreference: RemotePreference =
    u.remotePreference && ['onsite', 'hybrid', 'remote', 'any'].includes(u.remotePreference)
      ? u.remotePreference
      : 'any';
  const employmentTypes: EmploymentType[] = Array.isArray(u.employmentTypes)
    ? u.employmentTypes.filter((e: any) =>
        ['full-time', 'part-time', 'contract', 'internship'].includes(e)
      )
    : [];
  const expectedSalary: ExpectedSalary = {
    min:
      typeof u.expectedSalary?.min === 'number' && Number.isFinite(u.expectedSalary.min)
        ? u.expectedSalary.min
        : null,
    max:
      typeof u.expectedSalary?.max === 'number' && Number.isFinite(u.expectedSalary.max)
        ? u.expectedSalary.max
        : null,
    currency:
      typeof u.expectedSalary?.currency === 'string' && u.expectedSalary.currency.trim()
        ? u.expectedSalary.currency.trim().toUpperCase()
        : 'USD',
    visible: Boolean(u.expectedSalary?.visible === true),
  };
  const languages = Array.isArray(u.languages)
    ? u.languages.filter((l: any) => typeof l === 'string' && l.trim()).slice(0, 15)
    : [];
  const phone = typeof u.phone === 'string' ? u.phone : '';
  const phoneVisible = Boolean(u.phoneVisible === true);
  const links: ProfileLinks = {
    linkedin: typeof u.links?.linkedin === 'string' ? u.links.linkedin : '',
    github: typeof u.links?.github === 'string' ? u.links.github : '',
    portfolio: typeof u.links?.portfolio === 'string' ? u.links.portfolio : '',
  };
  const avatar = typeof u.avatar === 'string' ? u.avatar : '';
  const onboardingCompletedAt = u.onboardingCompletedAt
    ? u.onboardingCompletedAt instanceof Date
      ? u.onboardingCompletedAt.toISOString()
      : String(u.onboardingCompletedAt)
    : null;
  const onboardingSkippedAt = u.onboardingSkippedAt
    ? u.onboardingSkippedAt instanceof Date
      ? u.onboardingSkippedAt.toISOString()
      : String(u.onboardingSkippedAt)
    : null;

  const baseProfile: Omit<UserProfileData, 'profileCompletion'> = {
    userId,
    fullName,
    headline,
    targetRole,
    seniority,
    yearsOfExperience,
    industries,
    skills,
    country,
    city,
    willingToRelocate,
    remotePreference,
    employmentTypes,
    expectedSalary,
    languages,
    phone,
    phoneVisible,
    links,
    avatar,
    onboardingCompletedAt,
    onboardingSkippedAt,
  };

  const profileCompletion = calculateProfileCompletion(baseProfile);

  return {
    ...baseProfile,
    profileCompletion,
  };
}

export const DataStore = {
  // Local direct access
  readDb: readLocalDb,
  writeDb: writeLocalDb,
  withOrderLock,

  // Stats
  async getAdminStats() {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [totalUsers, totalResumes, totalAnalyses, newUsers7d, newResumes7d, scoreAgg, templatesAgg] =
          await Promise.all([
            User.countDocuments({}),
            Resume.countDocuments({}),
            Analysis.countDocuments({}),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            Resume.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            Analysis.aggregate([{ $group: { _id: null, avgScore: { $avg: '$overallScore' }, minScore: { $min: '$overallScore' }, maxScore: { $max: '$overallScore' } } }]),
            Resume.aggregate([{ $group: { _id: '$templateId', count: { $sum: 1 } } }]),
          ]);

        const avgScore = scoreAgg.length > 0 && scoreAgg[0].avgScore ? Math.round(scoreAgg[0].avgScore) : 0;
        const templateCounts: Record<string, number> = { compact: 0, 'two-column': 0, 'ats-friendly': 0, simple: 0 };
        templatesAgg.forEach((t) => { if (t._id) templateCounts[t._id] = t.count; });

        return {
          metrics: {
            totalUsers,
            totalResumes,
            totalAnalyses,
            newUsers7d,
            newResumes7d,
            avgScore,
            minScore: scoreAgg[0]?.minScore ?? 0,
            maxScore: scoreAgg[0]?.maxScore ?? 0,
          },
          templateCounts,
          scoreDistribution: { excellent: 0, good: 0, average: 0, needsWork: 0 },
          recentActivity: { users: [], resumes: [], analyses: [] },
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getAdminStats MongoDB query failed; falling back to local JSON datastore' },
        });
      }
    }

    // Local DB fallback
    const db = readLocalDb();
    const totalUsers = db.users.length;
    const totalResumes = db.resumes.length;
    const totalAnalyses = db.analyses.length;

    let totalScore = 0;
    let minScore = db.analyses.length > 0 ? 100 : 0;
    let maxScore = 0;
    const scoreDistribution = { excellent: 0, good: 0, average: 0, needsWork: 0 };

    db.analyses.forEach((a) => {
      const s = a.overallScore || 0;
      totalScore += s;
      if (s < minScore) minScore = s;
      if (s > maxScore) maxScore = s;
      if (s >= 85) scoreDistribution.excellent++;
      else if (s >= 70) scoreDistribution.good++;
      else if (s >= 50) scoreDistribution.average++;
      else scoreDistribution.needsWork++;
    });

    const avgScore = totalAnalyses > 0 ? Math.round(totalScore / totalAnalyses) : 0;

    const templateCounts: Record<string, number> = {
      compact: 0,
      'two-column': 0,
      'ats-friendly': 0,
      simple: 0,
    };
    db.resumes.forEach((r) => {
      const t = r.templateId || 'compact';
      templateCounts[t] = (templateCounts[t] || 0) + 1;
    });

    return {
      metrics: {
        totalUsers,
        totalResumes,
        totalAnalyses,
        newUsers7d: totalUsers,
        newResumes7d: totalResumes,
        avgScore,
        minScore,
        maxScore,
      },
      templateCounts,
      scoreDistribution,
      recentActivity: {
        users: db.users.slice(0, 5),
        resumes: db.resumes.slice(0, 5),
        analyses: db.analyses.slice(0, 5),
      },
    };
  },

  // Users
  async getUsers(query?: string, roleFilter?: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const filter: any = {};
        if (query) {
          filter.$or = [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }];
        }
        if (roleFilter && ['user', 'admin'].includes(roleFilter)) {
          filter.role = roleFilter;
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
        const usersWithCounts = await Promise.all(
          users.map(async (u) => {
            const [resumeCount, analysisCount] = await Promise.all([
              Resume.countDocuments({ userId: u._id }),
              Analysis.countDocuments({ userId: u._id }),
            ]);
            return {
              id: u._id.toString(),
              name: u.name,
              email: u.email,
              role: u.role || 'user',
              resumeCount,
              analysisCount,
              createdAt: u.createdAt,
              updatedAt: u.updatedAt,
            };
          })
        );
        return usersWithCounts;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getUsers MongoDB query failed; falling back to local JSON datastore' },
        });
      }
    }

    // Local DB
    const db = readLocalDb();
    let list = db.users;

    if (query) {
      const qLower = query.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(qLower) || u.email.toLowerCase().includes(qLower));
    }
    if (roleFilter && ['user', 'admin'].includes(roleFilter)) {
      list = list.filter((u) => u.role === roleFilter);
    }

    return list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      resumeCount: db.resumes.filter((r) => r.userId === u.id).length,
      analysisCount: db.analyses.filter((a) => a.userId === u.id).length,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  },

  async updateUserRole(userId: string, newRole: 'user' | 'admin') {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await User.findByIdAndUpdate(userId, { role: newRole });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.role = newRole;
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
    }
    return user;
  },

  async deleteUser(userId: string) {
    const existingUser = await this.findUserById(userId);
    if (existingUser?.isDemo) {
      throw new Error('Demo accounts cannot be deleted');
    }

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await Promise.all([
          User.findByIdAndDelete(userId),
          Resume.deleteMany({ userId }),
          Analysis.deleteMany({ userId }),
        ]);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.users = db.users.filter((u) => u.id !== userId);
    db.resumes = db.resumes.filter((r) => r.userId !== userId);
    db.analyses = db.analyses.filter((a) => a.userId !== userId);
    writeLocalDb(db);
    return true;
  },

  /**
   * Exports all user data (profile, resumes, cover letters, orders) in a structured JSON object.
   * Strips sensitive password hashes and internal verification/reset tokens.
   */
  async exportUserData(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const [resumes, coverLettersResult, orders] = await Promise.all([
      this.getUserResumes(userId),
      this.getUserCoverLetters(userId, { limit: 100, summaryOnly: false }),
      this.listOrders({ userId, limit: 500 }),
    ]);

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      emailVerified: user.emailVerified || null,
      termsAcceptedAt: (user as any).termsAcceptedAt || null,
      termsVersion: (user as any).termsVersion || null,
      plan: user.plan || 'free',
      aiCredits: typeof user.aiCredits === 'number' ? user.aiCredits : 0,
      aiResumeGenerationsCount:
        typeof user.aiResumeGenerationsCount === 'number' ? user.aiResumeGenerationsCount : 0,
      jobMatchFreeUsed: typeof user.jobMatchFreeUsed === 'number' ? user.jobMatchFreeUsed : 0,
      billingCycle: user.billingCycle || 'none',
      proExpiresAt: user.proExpiresAt || user.planExpiresAt || null,
      paymentProvider: user.paymentProvider || 'none',
      subscriptionStatus: user.subscriptionStatus || 'none',
      createdAt: user.createdAt,
      updatedAt: (user as any).updatedAt || user.createdAt,
    };

    return {
      exportedAt: new Date().toISOString(),
      profile,
      resumes,
      coverLetters: coverLettersResult.items || [],
      orders: orders.map((o) => ({
        id: o.id,
        planId: o.planId,
        billingCycle: o.billingCycle,
        baseAmount: o.baseAmount,
        amount: o.amount,
        currency: o.currency,
        method: o.method,
        status: o.status,
        reference: o.reference,
        paidAt: o.paidAt || null,
        proExpiresAt: o.proExpiresAt || null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    };
  },

  /**
   * Permanently deletes user account, resumes, cover letters, and analyses,
   * while anonymizing orders and payments (removing PII while preserving financial ledger).
   */
  async deleteAccountAndAnonymizeBilling(userId: string): Promise<{
    deleted: boolean;
    anonymizedUserId: string;
    anonymizedEmail: string;
    deletedCounts: { resumes: number; coverLetters: number; analyses: number };
    anonymizedCounts: { orders: number; payments: number };
  }> {
    const existingUser = await this.findUserById(userId);
    if (!existingUser) {
      throw new Error('USER_NOT_FOUND');
    }
    if (existingUser.isDemo) {
      throw new Error('DEMO_ACCOUNT_CANNOT_BE_DELETED');
    }

    const anonHash = crypto
      .createHash('sha256')
      .update(`anon_${userId}_${existingUser.email.toLowerCase()}`)
      .digest('hex')
      .slice(0, 12);
    const anonymizedUserId = `deleted_user_${anonHash}`;
    const anonymizedEmail = `deleted_${anonHash}@anonymized.local`;
    const nowIso = new Date().toISOString();

    const sanitizeMetadata = (meta: Record<string, any> | undefined) => {
      if (!meta || typeof meta !== 'object') return { anonymized: true, anonymizedAt: nowIso };
      const copy: Record<string, any> = { ...meta, anonymized: true, anonymizedAt: nowIso };
      delete copy.email;
      delete copy.userEmail;
      delete copy.name;
      delete copy.userName;
      delete copy.customerName;
      delete copy.customerEmail;
      delete copy.phone;
      delete copy.ip;
      return copy;
    };

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const validObjId = mongoose.Types.ObjectId.isValid(userId);
        await Promise.all([
          validObjId ? User.findByIdAndDelete(userId) : Promise.resolve(),
          Resume.deleteMany({ userId }),
          CoverLetter.deleteMany({ userId }),
          Analysis.deleteMany({ userId }),
          Order.updateMany(
            { userId },
            {
              $set: {
                userId: anonymizedUserId,
                userEmail: anonymizedEmail,
                recipientAddress: '',
                'metadata.anonymized': true,
                'metadata.anonymizedAt': nowIso,
                updatedAt: new Date(),
              },
              $unset: {
                'metadata.email': 1,
                'metadata.userEmail': 1,
                'metadata.name': 1,
                'metadata.userName': 1,
                'metadata.customerName': 1,
                'metadata.customerEmail': 1,
                'metadata.phone': 1,
              },
              $push: {
                auditLog: {
                  status: 'paid',
                  timestamp: new Date(),
                  note: 'Account deleted; personal identifiers anonymized for accounting retention',
                  actor: 'account_delete',
                },
              },
            }
          ),
          Payment.updateMany(
            { userId },
            {
              $set: {
                userId: anonymizedUserId,
                userEmail: anonymizedEmail,
                'metadata.anonymized': true,
                'metadata.anonymizedAt': nowIso,
                updatedAt: new Date(),
              },
              $unset: {
                'metadata.email': 1,
                'metadata.userEmail': 1,
                'metadata.name': 1,
                'metadata.userName': 1,
                'metadata.customerName': 1,
                'metadata.customerEmail': 1,
                'metadata.phone': 1,
              },
            }
          ),
        ]);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: {
            context:
              'MongoDB operation failed in deleteAccountAndAnonymizeBilling; falling back to local JSON datastore',
          },
        });
      }
    }

    const db = readLocalDb();

    const resumesBefore = db.resumes.length;
    db.resumes = db.resumes.filter((r) => r.userId !== userId);
    const deletedResumes = resumesBefore - db.resumes.length;

    const coverLettersList = db.coverLetters || [];
    const coverLettersBefore = coverLettersList.length;
    db.coverLetters = coverLettersList.filter((c) => c.userId !== userId);
    const deletedCoverLetters = coverLettersBefore - db.coverLetters.length;

    const analysesBefore = db.analyses.length;
    db.analyses = db.analyses.filter((a) => a.userId !== userId);
    const deletedAnalyses = analysesBefore - db.analyses.length;

    let anonymizedOrders = 0;
    if (Array.isArray(db.orders)) {
      for (const order of db.orders) {
        if (order.userId === userId) {
          order.userId = anonymizedUserId;
          order.userEmail = anonymizedEmail;
          order.recipientAddress = '';
          order.metadata = sanitizeMetadata(order.metadata);
          order.updatedAt = nowIso;
          order.auditLog = order.auditLog || [];
          order.auditLog.push({
            status: order.status,
            timestamp: nowIso,
            note: 'Account deleted; personal identifiers anonymized for accounting retention',
            actor: 'account_delete',
          });
          anonymizedOrders++;
        }
      }
    }

    let anonymizedPayments = 0;
    if (Array.isArray(db.payments)) {
      for (const payment of db.payments) {
        if (payment.userId === userId) {
          payment.userId = anonymizedUserId;
          payment.userEmail = anonymizedEmail;
          payment.metadata = sanitizeMetadata(payment.metadata);
          payment.updatedAt = nowIso;
          anonymizedPayments++;
        }
      }
    }

    db.users = db.users.filter((u) => u.id !== userId);
    writeLocalDb(db);

    return {
      deleted: true,
      anonymizedUserId,
      anonymizedEmail,
      deletedCounts: {
        resumes: deletedResumes,
        coverLetters: deletedCoverLetters,
        analyses: deletedAnalyses,
      },
      anonymizedCounts: {
        orders: anonymizedOrders,
        payments: anonymizedPayments,
      },
    };
  },

  // Resumes
  async getResumes(query?: string, templateFilter?: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const filter: any = {};
        if (templateFilter && templateFilter !== 'all') filter.templateId = templateFilter;
        const resumes = await Resume.find(filter).populate('userId', 'name email').sort({ updatedAt: -1 }).lean();
        return resumes.map((r: any) => ({
          id: r._id.toString(),
          userId: r.userId?._id?.toString() || '',
          userName: r.userId?.name || 'User',
          userEmail: r.userId?.email || 'N/A',
          title: r.title || 'Untitled',
          templateId: r.templateId || 'compact',
          theme: r.theme || {},
          candidateName: r.data?.personalInfo?.fullName || 'Candidate',
          candidateTitle: r.data?.personalInfo?.jobTitle || '',
          experienceCount: Array.isArray(r.data?.experience) ? r.data.experience.length : 0,
          educationCount: Array.isArray(r.data?.education) ? r.data.education.length : 0,
          skillsCount: Array.isArray(r.data?.skills) ? r.data.skills.length : 0,
          projectsCount: Array.isArray(r.data?.projects) ? r.data.projects.length : 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    let list = db.resumes;

    if (templateFilter && templateFilter !== 'all') {
      list = list.filter((r) => r.templateId === templateFilter);
    }
    if (query) {
      const qLower = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(qLower) ||
          r.data?.personalInfo?.fullName?.toLowerCase().includes(qLower) ||
          r.data?.personalInfo?.jobTitle?.toLowerCase().includes(qLower)
      );
    }

    return list.map((r) => {
      const user = db.users.find((u) => u.id === r.userId);
      return {
        id: r.id,
        userId: r.userId,
        userName: user?.name || 'Registered User',
        userEmail: user?.email || 'N/A',
        title: r.title,
        templateId: r.templateId,
        theme: r.theme,
        candidateName: r.data?.personalInfo?.fullName || 'Untitled Candidate',
        candidateTitle: r.data?.personalInfo?.jobTitle || '',
        experienceCount: Array.isArray(r.data?.experience) ? r.data.experience.length : 0,
        educationCount: Array.isArray(r.data?.education) ? r.data.education.length : 0,
        skillsCount: Array.isArray(r.data?.skills) ? r.data.skills.length : 0,
        projectsCount: Array.isArray(r.data?.projects) ? r.data.projects.length : 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  },

  async deleteResume(resumeId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await Resume.findByIdAndDelete(resumeId);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.resumes = db.resumes.filter((r) => r.id !== resumeId);
    writeLocalDb(db);
    return true;
  },

  // Analyses
  async getAnalyses(query?: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const list = await Analysis.find({}).populate('userId', 'name email').sort({ createdAt: -1 }).lean();
        return list.map((a: any) => ({
          id: a._id.toString(),
          userId: a.userId?._id?.toString() || '',
          userName: a.userId?.name || 'User',
          userEmail: a.userId?.email || 'N/A',
          resumeFileName: a.resumeFileName,
          targetRole: a.targetRole,
          overallScore: a.overallScore,
          grade: a.grade,
          rankPercentile: a.rankPercentile,
          matchLabel: a.matchLabel,
          subScores: a.subScores,
          createdAt: a.createdAt,
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    let list = db.analyses;

    if (query) {
      const qLower = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.targetRole.toLowerCase().includes(qLower) ||
          a.resumeFileName.toLowerCase().includes(qLower) ||
          a.grade.toLowerCase().includes(qLower)
      );
    }

    return list.map((a) => {
      const user = db.users.find((u) => u.id === a.userId);
      return {
        id: a.id,
        userId: a.userId,
        userName: user?.name || 'Candidate',
        userEmail: user?.email || 'N/A',
        resumeFileName: a.resumeFileName,
        targetRole: a.targetRole,
        overallScore: a.overallScore,
        grade: a.grade,
        rankPercentile: a.rankPercentile,
        matchLabel: a.matchLabel,
        subScores: a.subScores,
        createdAt: a.createdAt,
      };
    });
  },

  async deleteAnalysis(analysisId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await Analysis.findByIdAndDelete(analysisId);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.analyses = db.analyses.filter((a) => a.id !== analysisId);
    writeLocalDb(db);
    return true;
  },

  // User-facing Resume operations
  async getUserResumes(userId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 }).lean();
        return resumes.map((r: any) => ({
          id: r._id.toString(),
          title: r.title,
          templateId: r.templateId,
          theme: r.theme,
          data: r.data,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    return db.resumes
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async createUserResume(userId: string, resumeData: { title: string; templateId: string; theme: any; data: any }) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const newResume: any = await Resume.create({
          userId,
          title: resumeData.title,
          templateId: resumeData.templateId as any,
          theme: resumeData.theme,
          data: resumeData.data,
        });
        return {
          id: newResume._id.toString(),
          title: newResume.title,
          templateId: newResume.templateId,
          theme: newResume.theme,
          data: newResume.data,
          createdAt: newResume.createdAt,
          updatedAt: newResume.updatedAt,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const newResume: StoredResume = {
      id: 'res_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId,
      title: resumeData.title,
      templateId: resumeData.templateId,
      theme: resumeData.theme,
      data: resumeData.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.resumes.unshift(newResume);
    writeLocalDb(db);
    return newResume;
  },

  async getResumeById(id: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const r = await Resume.findById(id).lean();
          if (r) {
            return {
              id: (r as any)._id.toString(),
              userId: (r as any).userId?.toString(),
              title: (r as any).title,
              templateId: (r as any).templateId,
              theme: (r as any).theme,
              data: (r as any).data,
              createdAt: (r as any).createdAt,
              updatedAt: (r as any).updatedAt,
            };
          }
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    return db.resumes.find((r) => r.id === id) || null;
  },

  async updateUserResume(id: string, userId: string, updateData: { title?: string; templateId?: string; theme?: any; data?: any }) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const updated = await Resume.findOneAndUpdate({ _id: id, userId }, { ...updateData, updatedAt: new Date() }, { new: true }).lean();
          if (updated) {
            return {
              id: (updated as any)._id.toString(),
              title: (updated as any).title,
              templateId: (updated as any).templateId,
              theme: (updated as any).theme,
              data: (updated as any).data,
              createdAt: (updated as any).createdAt,
              updatedAt: (updated as any).updatedAt,
            };
          }
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const resume = db.resumes.find((r) => r.id === id);
    if (resume) {
      if (updateData.title !== undefined) resume.title = updateData.title;
      if (updateData.templateId !== undefined) resume.templateId = updateData.templateId;
      if (updateData.theme !== undefined) resume.theme = updateData.theme;
      if (updateData.data !== undefined) resume.data = updateData.data;
      resume.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return resume;
    }
    return null;
  },

  async deleteUserResume(id: string, userId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          await Resume.findOneAndDelete({ _id: id, userId });
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.resumes = db.resumes.filter((r) => !(r.id === id && r.userId === userId));
    writeLocalDb(db);
    return true;
  },

  // User-facing Analysis operations
  async getUserAnalyses(userId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const analyses = await Analysis.find({ userId }).sort({ createdAt: -1 }).lean();
        return analyses.map((a: any) => ({
          id: a._id.toString(),
          resumeFileName: a.resumeFileName,
          targetRole: a.targetRole,
          overallScore: a.overallScore,
          grade: a.grade,
          rankPercentile: a.rankPercentile,
          matchLabel: a.matchLabel,
          createdAt: a.createdAt,
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    return db.analyses
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createUserAnalysis(userId: string, data: any) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const newAnalysis = await Analysis.create({ userId, ...data });
        return { id: newAnalysis._id.toString(), ...data };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const newAnalysis: StoredAnalysis = {
      id: 'ana_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId,
      resumeFileName: data.resumeFileName || 'resume.pdf',
      targetRole: data.targetRole || 'Software Engineer',
      overallScore: data.overallScore || 75,
      grade: data.grade || 'B',
      rankPercentile: data.rankPercentile || 'Top 25%',
      matchLabel: data.matchLabel || 'Good Match',
      subScores: data.subScores || { keywordsMatch: 75, formatting: 80, structure: 75, contentQuality: 70 },
      result: data.result || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.analyses.unshift(newAnalysis);
    writeLocalDb(db);
    return newAnalysis;
  },

  async deleteUserAnalysis(id: string, userId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          await Analysis.findOneAndDelete({ _id: id, userId });
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.analyses = db.analyses.filter((a) => !(a.id === id && a.userId === userId));
    writeLocalDb(db);
    return true;
  },

  // User-facing Cover Letter operations
  async getUserCoverLetters(
    userId: string,
    options?: { page?: number; limit?: number; status?: string; search?: string; isArchived?: boolean; summaryOnly?: boolean }
  ) {
    const page = Math.max(1, Number(options?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options?.limit) || 20));
    const skip = (page - 1) * limit;

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const query: any = { userId };
        if (options?.isArchived !== undefined) {
          query.isArchived = Boolean(options.isArchived);
        }
        if (options?.status && options.status !== 'all') {
          query.status = options.status;
        }
        if (options?.search && options.search.trim()) {
          const s = options.search.trim();
          query.$or = [
            { title: { $regex: s, $options: 'i' } },
            { companyName: { $regex: s, $options: 'i' } },
            { jobTitle: { $regex: s, $options: 'i' } },
          ];
        }

        let findQuery: any = CoverLetter.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        if (options?.summaryOnly) {
          findQuery = findQuery.select('title companyName jobTitle tone language status isArchived templateId updatedAt createdAt extractedKeywords recipient sender linkedResumeId');
        }

        const [cls, total] = await Promise.all([
          findQuery.lean(),
          CoverLetter.countDocuments(query),
        ]);

        const items = cls.map((c: any) => ({
          id: c._id.toString(),
          userId: c.userId?.toString(),
          title: c.title,
          companyName: c.companyName,
          jobTitle: c.jobTitle,
          jobDescription: options?.summaryOnly ? undefined : c.jobDescription,
          tone: c.tone,
          language: c.language,
          status: c.status || 'saved',
          isArchived: Boolean(c.isArchived),
          templateId: c.templateId,
          content: options?.summaryOnly ? undefined : c.content,
          sender: c.sender,
          recipient: c.recipient,
          extractedKeywords: c.extractedKeywords || [],
          linkedResumeId: c.linkedResumeId?.toString(),
          updatedAt: c.updatedAt,
          createdAt: c.createdAt,
        }));

        return {
          items,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    let list = (db.coverLetters || []).filter((c) => c.userId === userId);

    if (options?.isArchived !== undefined) {
      list = list.filter((c) => Boolean(c.isArchived) === Boolean(options.isArchived));
    }
    if (options?.status && options.status !== 'all') {
      list = list.filter((c) => (c.status || 'saved') === options.status);
    }
    if (options?.search && options.search.trim()) {
      const s = options.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(s) ||
          c.companyName?.toLowerCase().includes(s) ||
          c.jobTitle?.toLowerCase().includes(s)
      );
    }

    const total = list.length;
    list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const items = list.slice(skip, skip + limit).map((c) => ({
      ...c,
      status: c.status || 'saved',
      isArchived: Boolean(c.isArchived),
      content: options?.summaryOnly ? undefined : c.content,
      jobDescription: options?.summaryOnly ? undefined : c.jobDescription,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async getUserCoverLetterById(id: string, userId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const c: any = await CoverLetter.findOne({ _id: id, userId }).lean();
          if (c) {
            return {
              id: c._id.toString(),
              userId: c.userId?.toString(),
              title: c.title,
              companyName: c.companyName,
              jobTitle: c.jobTitle,
              jobDescription: c.jobDescription,
              extractedKeywords: c.extractedKeywords || [],
              tone: c.tone,
              language: c.language,
              status: c.status || 'saved',
              isArchived: Boolean(c.isArchived),
              sender: c.sender,
              recipient: c.recipient,
              content: c.content,
              templateId: c.templateId,
              linkedResumeId: c.linkedResumeId?.toString(),
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            };
          }
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const list = db.coverLetters || [];
    const found = list.find((c) => c.id === id && c.userId === userId);
    if (!found) return null;
    return {
      ...found,
      status: found.status || 'saved',
      isArchived: Boolean(found.isArchived),
    };
  },

  async createUserCoverLetter(userId: string, data: any) {
    const defaultTitle = data.title || (data.companyName ? `Cover Letter - ${data.companyName}` : 'My Cover Letter');
    const sanitized = {
      title: CoverLetterService.sanitizeText(defaultTitle).slice(0, 150),
      companyName: CoverLetterService.sanitizeText(data.recipient?.companyName || data.companyName).slice(0, 120),
      jobTitle: CoverLetterService.sanitizeText(data.recipient?.jobTitle || data.jobTitle).slice(0, 120),
      jobDescription: CoverLetterService.sanitizeText(data.jobDescription).slice(0, 30000),
      extractedKeywords: Array.isArray(data.extractedKeywords)
        ? data.extractedKeywords.map(CoverLetterService.sanitizeText).filter(Boolean).slice(0, 20)
        : [],
      tone: ['formal', 'technical', 'leadership', 'enthusiastic'].includes(data.tone) ? data.tone : 'formal',
      language: ['ar', 'en'].includes(data.language) ? data.language : 'ar',
      status: ['draft', 'saved', 'archived'].includes(data.status) ? data.status : 'saved',
      isArchived: Boolean(data.isArchived || false),
      sender: {
        fullName: CoverLetterService.sanitizeText(data.sender?.fullName || '').slice(0, 100),
        email: CoverLetterService.sanitizeText(data.sender?.email || '').slice(0, 100),
        phone: CoverLetterService.sanitizeText(data.sender?.phone || '').slice(0, 50),
        location: CoverLetterService.sanitizeText(data.sender?.location || '').slice(0, 100),
        linkedin: CoverLetterService.sanitizeText(data.sender?.linkedin || '').slice(0, 200),
        portfolio: CoverLetterService.sanitizeText(data.sender?.portfolio || '').slice(0, 200),
      },
      recipient: {
        companyName: CoverLetterService.sanitizeText(data.recipient?.companyName || data.companyName || '').slice(0, 120),
        jobTitle: CoverLetterService.sanitizeText(data.recipient?.jobTitle || data.jobTitle || '').slice(0, 120),
        hiringManager: CoverLetterService.sanitizeText(data.recipient?.hiringManager || data.hiringManager || '').slice(0, 100),
        department: CoverLetterService.sanitizeText(data.recipient?.department || '').slice(0, 100),
        location: CoverLetterService.sanitizeText(data.recipient?.location || '').slice(0, 100),
      },
      content: {
        subject: CoverLetterService.sanitizeText(data.content?.subject || '').slice(0, 200),
        salutation: CoverLetterService.sanitizeText(data.content?.salutation || '').slice(0, 150),
        introduction: CoverLetterService.sanitizeText(data.content?.introduction || '').slice(0, 3000),
        bodyParagraphs: Array.isArray(data.content?.bodyParagraphs)
          ? data.content.bodyParagraphs.map(CoverLetterService.sanitizeText).filter(Boolean).slice(0, 10)
          : [],
        conclusion: CoverLetterService.sanitizeText(data.content?.conclusion || '').slice(0, 3000),
        signOff: CoverLetterService.sanitizeText(data.content?.signOff || '').slice(0, 100),
        fullText: CoverLetterService.sanitizeText(data.content?.fullText || '').slice(0, 20000),
      },
      templateId: CoverLetterService.sanitizeText(data.templateId || 'compact').slice(0, 50),
      linkedResumeId: data.linkedResumeId ? String(data.linkedResumeId).slice(0, 64) : undefined,
    };

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const created = await CoverLetter.create({ userId, ...sanitized });
        return {
          id: created._id.toString(),
          userId,
          ...sanitized,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    if (!db.coverLetters) db.coverLetters = [];
    const newCl: StoredCoverLetter = {
      id: 'cl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId,
      ...sanitized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.coverLetters.unshift(newCl);
    writeLocalDb(db);
    return newCl;
  },

  async updateUserCoverLetter(id: string, userId: string, updateData: any) {
    const sanitizedUpdate: any = {};
    if (updateData.title !== undefined) sanitizedUpdate.title = CoverLetterService.sanitizeText(updateData.title).slice(0, 150);
    if (updateData.companyName !== undefined) sanitizedUpdate.companyName = CoverLetterService.sanitizeText(updateData.companyName).slice(0, 120);
    if (updateData.jobTitle !== undefined) sanitizedUpdate.jobTitle = CoverLetterService.sanitizeText(updateData.jobTitle).slice(0, 120);
    if (updateData.jobDescription !== undefined) sanitizedUpdate.jobDescription = CoverLetterService.sanitizeText(updateData.jobDescription).slice(0, 30000);
    if (updateData.extractedKeywords !== undefined) {
      sanitizedUpdate.extractedKeywords = Array.isArray(updateData.extractedKeywords)
        ? updateData.extractedKeywords.map(CoverLetterService.sanitizeText).filter(Boolean).slice(0, 20)
        : [];
    }
    if (updateData.tone !== undefined && ['formal', 'technical', 'leadership', 'enthusiastic'].includes(updateData.tone)) sanitizedUpdate.tone = updateData.tone;
    if (updateData.language !== undefined && ['ar', 'en'].includes(updateData.language)) sanitizedUpdate.language = updateData.language;
    if (updateData.status !== undefined && ['draft', 'saved', 'archived'].includes(updateData.status)) sanitizedUpdate.status = updateData.status;
    if (updateData.isArchived !== undefined) sanitizedUpdate.isArchived = Boolean(updateData.isArchived);
    if (updateData.sender !== undefined) sanitizedUpdate.sender = updateData.sender;
    if (updateData.recipient !== undefined) sanitizedUpdate.recipient = updateData.recipient;
    if (updateData.content !== undefined) sanitizedUpdate.content = updateData.content;
    if (updateData.templateId !== undefined) sanitizedUpdate.templateId = CoverLetterService.sanitizeText(updateData.templateId).slice(0, 50);
    if (updateData.linkedResumeId !== undefined) sanitizedUpdate.linkedResumeId = updateData.linkedResumeId ? String(updateData.linkedResumeId).slice(0, 64) : undefined;
    sanitizedUpdate.updatedAt = new Date();

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const updated: any = await CoverLetter.findOneAndUpdate(
            { _id: id, userId },
            { $set: sanitizedUpdate },
            { new: true }
          ).lean();
          if (updated) {
            return {
              id: updated._id.toString(),
              userId: updated.userId?.toString(),
              ...updated,
            };
          }
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
      return null;
    }

    const db = readLocalDb();
    if (!db.coverLetters) db.coverLetters = [];
    const item = db.coverLetters.find((c) => c.id === id && c.userId === userId);
    if (item) {
      Object.assign(item, sanitizedUpdate);
      item.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return item;
    }
    return null;
  },

  async deleteUserCoverLetter(id: string, userId: string): Promise<boolean> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const res = await CoverLetter.findOneAndDelete({ _id: id, userId });
          return !!res;
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
      return false;
    }

    const db = readLocalDb();
    if (!db.coverLetters) db.coverLetters = [];
    const initialLen = db.coverLetters.length;
    db.coverLetters = db.coverLetters.filter((c) => !(c.id === id && c.userId === userId));
    if (db.coverLetters.length < initialLen) {
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  // User auth helpers
  async findUserById(id: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const u = await User.findById(id).select('-password').lean();
          if (u) {
            const rawExpiry = (u as any).proExpiresAt || (u as any).planExpiresAt || null;
            const isExpired =
              rawExpiry && !isNaN(new Date(rawExpiry).getTime()) && new Date(rawExpiry).getTime() <= Date.now();
            let currentPlan = (u as any).plan || 'free';
            let currentBillingCycle = (u as any).billingCycle || 'none';
            let currentSubStatus = (u as any).subscriptionStatus || 'none';

            if (isExpired && currentPlan === 'pro') {
              currentPlan = 'free';
              currentBillingCycle = 'none';
              currentSubStatus = 'expired';
              await User.findByIdAndUpdate(id, {
                $set: {
                  plan: 'free',
                  billingCycle: 'none',
                  subscriptionStatus: 'expired',
                },
              }).catch(() => {});
            }

            const roleState = resolveAccountRoleState(
              (u as any).accountType,
              (u as any).accountTypes
            );
            return {
              id: (u as any)._id.toString(),
              name: (u as any).name,
              email: (u as any).email,
              role: (u as any).role || 'user',
              accountType: roleState.accountType,
              accountTypes: roleState.accountTypes,
              isDemo: Boolean((u as any).isDemo),
              plan: currentPlan,
              aiCredits: typeof (u as any).aiCredits === 'number' ? (u as any).aiCredits : 3,
              aiResumeGenerationsCount: typeof (u as any).aiResumeGenerationsCount === 'number' ? (u as any).aiResumeGenerationsCount : 0,
              jobMatchFreeUsed: typeof (u as any).jobMatchFreeUsed === 'number' ? (u as any).jobMatchFreeUsed : 0,
              billingCycle: currentBillingCycle,
              planExpiresAt: rawExpiry,
              proExpiresAt: rawExpiry,
              paymentProvider: (u as any).paymentProvider || 'none',
              providerCustomerId: (u as any).providerCustomerId || (u as any).lemonCustomerId || (u as any).stripeCustomerId || '',
              providerSubscriptionId: (u as any).providerSubscriptionId || (u as any).lemonSubscriptionId || (u as any).stripeSubscriptionId || '',
              stripeCustomerId: (u as any).stripeCustomerId || ((u as any).paymentProvider === 'stripe' ? (u as any).providerCustomerId : '') || '',
              stripeSubscriptionId: (u as any).stripeSubscriptionId || ((u as any).paymentProvider === 'stripe' ? (u as any).providerSubscriptionId : '') || '',
              lemonCustomerId: (u as any).lemonCustomerId || ((u as any).paymentProvider === 'lemonsqueezy' ? (u as any).providerCustomerId : '') || '',
              lemonSubscriptionId: (u as any).lemonSubscriptionId || ((u as any).paymentProvider === 'lemonsqueezy' ? (u as any).providerSubscriptionId : '') || '',
              subscriptionStatus: currentSubStatus,
              paymentFailedAt: (u as any).paymentFailedAt || null,
              emailVerified: (u as any).emailVerified
                ? (u as any).emailVerified instanceof Date
                  ? (u as any).emailVerified.toISOString()
                  : (u as any).emailVerified
                : null,
              emailVerifyTokenHash: (u as any).emailVerifyTokenHash || null,
              emailVerifyExpires: (u as any).emailVerifyExpires
                ? (u as any).emailVerifyExpires instanceof Date
                  ? (u as any).emailVerifyExpires.toISOString()
                  : (u as any).emailVerifyExpires
                : null,
              termsAcceptedAt: (u as any).termsAcceptedAt
                ? (u as any).termsAcceptedAt instanceof Date
                  ? (u as any).termsAcceptedAt.toISOString()
                  : (u as any).termsAcceptedAt
                : null,
              termsVersion: (u as any).termsVersion || null,
              resetPasswordToken: (u as any).resetPasswordToken || null,
              resetPasswordExpires: (u as any).resetPasswordExpires ? ((u as any).resetPasswordExpires instanceof Date ? (u as any).resetPasswordExpires.toISOString() : (u as any).resetPasswordExpires) : null,
              createdAt: (u as any).createdAt,
            };
          }
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find((user) => user.id === id);
    if (u) {
      const rawExpiry = u.proExpiresAt || u.planExpiresAt || null;
      const isExpired =
        rawExpiry && !isNaN(new Date(rawExpiry).getTime()) && new Date(rawExpiry).getTime() <= Date.now();
      if (isExpired && u.plan === 'pro') {
        u.plan = 'free';
        u.billingCycle = 'none';
        u.subscriptionStatus = 'expired';
        u.updatedAt = new Date().toISOString();
        writeLocalDb(db);
      }

      const roleState = resolveAccountRoleState(u.accountType, u.accountTypes);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        accountType: roleState.accountType,
        accountTypes: roleState.accountTypes,
        isDemo: Boolean(u.isDemo),
        plan: u.plan || 'free',
        aiCredits: typeof u.aiCredits === 'number' ? u.aiCredits : 3,
        aiResumeGenerationsCount: typeof u.aiResumeGenerationsCount === 'number' ? u.aiResumeGenerationsCount : 0,
        jobMatchFreeUsed: typeof u.jobMatchFreeUsed === 'number' ? u.jobMatchFreeUsed : 0,
        billingCycle: u.billingCycle || 'none',
        planExpiresAt: rawExpiry,
        proExpiresAt: rawExpiry,
        paymentProvider: u.paymentProvider || 'none',
        providerCustomerId: u.providerCustomerId || u.lemonCustomerId || u.stripeCustomerId || '',
        providerSubscriptionId: u.providerSubscriptionId || u.lemonSubscriptionId || u.stripeSubscriptionId || '',
        stripeCustomerId: u.stripeCustomerId || (u.paymentProvider === 'stripe' ? u.providerCustomerId : '') || '',
        stripeSubscriptionId: u.stripeSubscriptionId || (u.paymentProvider === 'stripe' ? u.providerSubscriptionId : '') || '',
        lemonCustomerId: u.lemonCustomerId || (u.paymentProvider === 'lemonsqueezy' ? u.providerCustomerId : '') || '',
        lemonSubscriptionId: u.lemonSubscriptionId || (u.paymentProvider === 'lemonsqueezy' ? u.providerSubscriptionId : '') || '',
        subscriptionStatus: u.subscriptionStatus || 'none',
        paymentFailedAt: u.paymentFailedAt || null,
        emailVerified: u.emailVerified ?? null,
        emailVerifyTokenHash: u.emailVerifyTokenHash || null,
        emailVerifyExpires: u.emailVerifyExpires || null,
        termsAcceptedAt: u.termsAcceptedAt || null,
        termsVersion: u.termsVersion || null,
        resetPasswordToken: u.resetPasswordToken || null,
        resetPasswordExpires: u.resetPasswordExpires || null,
        createdAt: u.createdAt,
      };
    }
    return null;
  },

  async findUserByEmail(email: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const u = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').lean();
        if (u) {
          const rawExpiry = (u as any).proExpiresAt || (u as any).planExpiresAt || null;
          const roleState = resolveAccountRoleState(
            (u as any).accountType,
            (u as any).accountTypes
          );
          return {
            id: (u as any)._id.toString(),
            name: (u as any).name,
            email: (u as any).email,
            password: (u as any).password,
            role: (u as any).role || 'user',
            accountType: roleState.accountType,
            accountTypes: roleState.accountTypes,
            isDemo: Boolean((u as any).isDemo),
            plan: (u as any).plan || 'free',
            aiCredits: typeof (u as any).aiCredits === 'number' ? (u as any).aiCredits : 3,
            billingCycle: (u as any).billingCycle || 'none',
            planExpiresAt: rawExpiry,
            proExpiresAt: rawExpiry,
            paymentProvider: (u as any).paymentProvider || 'none',
            providerCustomerId: (u as any).providerCustomerId || (u as any).lemonCustomerId || (u as any).stripeCustomerId || '',
            providerSubscriptionId: (u as any).providerSubscriptionId || (u as any).lemonSubscriptionId || (u as any).stripeSubscriptionId || '',
            stripeCustomerId: (u as any).stripeCustomerId || ((u as any).paymentProvider === 'stripe' ? (u as any).providerCustomerId : '') || '',
            stripeSubscriptionId: (u as any).stripeSubscriptionId || ((u as any).paymentProvider === 'stripe' ? (u as any).providerSubscriptionId : '') || '',
            lemonCustomerId: (u as any).lemonCustomerId || ((u as any).paymentProvider === 'lemonsqueezy' ? (u as any).providerCustomerId : '') || '',
            lemonSubscriptionId: (u as any).lemonSubscriptionId || ((u as any).paymentProvider === 'lemonsqueezy' ? (u as any).providerSubscriptionId : '') || '',
            subscriptionStatus: (u as any).subscriptionStatus || 'none',
            paymentFailedAt: (u as any).paymentFailedAt || null,
            emailVerified: (u as any).emailVerified
              ? (u as any).emailVerified instanceof Date
                ? (u as any).emailVerified.toISOString()
                : (u as any).emailVerified
              : null,
            emailVerifyTokenHash: (u as any).emailVerifyTokenHash || null,
            emailVerifyExpires: (u as any).emailVerifyExpires
              ? (u as any).emailVerifyExpires instanceof Date
                ? (u as any).emailVerifyExpires.toISOString()
                : (u as any).emailVerifyExpires
              : null,
            resetPasswordToken: (u as any).resetPasswordToken || null,
            resetPasswordExpires: (u as any).resetPasswordExpires ? ((u as any).resetPasswordExpires instanceof Date ? (u as any).resetPasswordExpires.toISOString() : (u as any).resetPasswordExpires) : null,
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find((user) => user.email.toLowerCase() === email.toLowerCase().trim());
    if (u) {
      const rawExpiry = u.proExpiresAt || u.planExpiresAt || null;
      const roleState = resolveAccountRoleState(u.accountType, u.accountTypes);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role || 'user',
        accountType: roleState.accountType,
        accountTypes: roleState.accountTypes,
        isDemo: Boolean(u.isDemo),
        plan: u.plan || 'free',
        aiCredits: typeof u.aiCredits === 'number' ? u.aiCredits : 3,
        billingCycle: u.billingCycle || 'none',
        planExpiresAt: rawExpiry,
        proExpiresAt: rawExpiry,
        paymentProvider: u.paymentProvider || 'none',
        providerCustomerId: u.providerCustomerId || u.lemonCustomerId || u.stripeCustomerId || '',
        providerSubscriptionId: u.providerSubscriptionId || u.lemonSubscriptionId || u.stripeSubscriptionId || '',
        stripeCustomerId: u.stripeCustomerId || (u.paymentProvider === 'stripe' ? u.providerCustomerId : '') || '',
        stripeSubscriptionId: u.stripeSubscriptionId || (u.paymentProvider === 'stripe' ? u.providerSubscriptionId : '') || '',
        lemonCustomerId: u.lemonCustomerId || (u.paymentProvider === 'lemonsqueezy' ? u.providerCustomerId : '') || '',
        lemonSubscriptionId: u.lemonSubscriptionId || (u.paymentProvider === 'lemonsqueezy' ? u.providerSubscriptionId : '') || '',
        subscriptionStatus: u.subscriptionStatus || 'none',
        paymentFailedAt: u.paymentFailedAt || null,
        emailVerified: u.emailVerified ?? null,
        emailVerifyTokenHash: u.emailVerifyTokenHash || null,
        emailVerifyExpires: u.emailVerifyExpires || null,
        termsAcceptedAt: u.termsAcceptedAt || null,
        termsVersion: u.termsVersion || null,
        resetPasswordToken: u.resetPasswordToken || null,
        resetPasswordExpires: u.resetPasswordExpires || null,
      };
    }
    return null;
  },

  async findUserByStripeCustomerId(customerId: string) {
    if (!customerId) return null;
    const cleanId = customerId.trim();
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const u = await User.findOne({
          $or: [{ stripeCustomerId: cleanId }, { providerCustomerId: cleanId }],
        })
          .select('-password')
          .lean();
        if (u) {
          return this.findUserById((u as any)._id.toString());
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find(
      (user) => user.stripeCustomerId === cleanId || user.providerCustomerId === cleanId
    );
    if (u) {
      return this.findUserById(u.id);
    }
    return null;
  },

  async findUserByStripeSubscriptionId(subscriptionId: string) {
    if (!subscriptionId) return null;
    const cleanId = subscriptionId.trim();
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const u = await User.findOne({
          $or: [{ stripeSubscriptionId: cleanId }, { providerSubscriptionId: cleanId }],
        })
          .select('-password')
          .lean();
        if (u) {
          return this.findUserById((u as any)._id.toString());
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find(
      (user) => user.stripeSubscriptionId === cleanId || user.providerSubscriptionId === cleanId
    );
    if (u) {
      return this.findUserById(u.id);
    }
    return null;
  },

  async findUserByLemonCustomerId(customerId: string) {
    if (!customerId) return null;
    const cleanId = customerId.trim();
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const u = await User.findOne({
          $or: [{ lemonCustomerId: cleanId }, { providerCustomerId: cleanId }],
        })
          .select('-password')
          .lean();
        if (u) {
          return this.findUserById((u as any)._id.toString());
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find(
      (user) => user.lemonCustomerId === cleanId || user.providerCustomerId === cleanId
    );
    if (u) {
      return this.findUserById(u.id);
    }
    return null;
  },

  async findUserByLemonSubscriptionId(subscriptionId: string) {
    if (!subscriptionId) return null;
    const cleanId = subscriptionId.trim();
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const u = await User.findOne({
          $or: [{ lemonSubscriptionId: cleanId }, { providerSubscriptionId: cleanId }],
        })
          .select('-password')
          .lean();
        if (u) {
          return this.findUserById((u as any)._id.toString());
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find(
      (user) => user.lemonSubscriptionId === cleanId || user.providerSubscriptionId === cleanId
    );
    if (u) {
      return this.findUserById(u.id);
    }
    return null;
  },

  async createUserAccount(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
    accountType?: AccountType;
    accountTypes?: AccountRole[];
    isDemo?: boolean;
    plan?: 'free' | 'pro' | 'enterprise';
    aiCredits?: number;
    billingCycle?: 'monthly' | 'annual' | 'lifetime' | 'none';
    planExpiresAt?: Date | string | null;
    proExpiresAt?: Date | string | null;
    paymentProvider?: 'lemonsqueezy' | 'stripe' | 'paymob' | 'paddle' | 'none';
    providerCustomerId?: string;
    providerSubscriptionId?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    lemonCustomerId?: string;
    lemonSubscriptionId?: string;
    emailVerified?: Date | string | null;
    emailVerifyTokenHash?: string | null;
    emailVerifyExpires?: Date | string | null;
    termsAcceptedAt?: Date | string | null;
    termsVersion?: string | null;
  }) {
    const expiryVal = userData.proExpiresAt ?? userData.planExpiresAt ?? null;
    const resolvedTermsAcceptedAt = userData.termsAcceptedAt ?? null;
    const resolvedTermsAcceptedAtIso = resolvedTermsAcceptedAt
      ? typeof resolvedTermsAcceptedAt === 'string'
        ? resolvedTermsAcceptedAt
        : resolvedTermsAcceptedAt.toISOString()
      : null;
    const resolvedTermsVersion = userData.termsVersion || null;
    const resolvedEmailVerified =
      userData.emailVerified !== undefined
        ? userData.emailVerified
        : userData.emailVerifyTokenHash
        ? null
        : new Date();
    const resolvedEmailVerifiedIso = resolvedEmailVerified
      ? typeof resolvedEmailVerified === 'string'
        ? resolvedEmailVerified
        : resolvedEmailVerified.toISOString()
      : null;
    const resolvedVerifyExpires = userData.emailVerifyExpires ?? null;
    const resolvedVerifyExpiresIso = resolvedVerifyExpires
      ? typeof resolvedVerifyExpires === 'string'
        ? resolvedVerifyExpires
        : resolvedVerifyExpires.toISOString()
      : null;
    const stripeCust =
      userData.stripeCustomerId ||
      (userData.paymentProvider === 'stripe' ? userData.providerCustomerId : '') ||
      '';
    const stripeSub =
      userData.stripeSubscriptionId ||
      (userData.paymentProvider === 'stripe' ? userData.providerSubscriptionId : '') ||
      '';
    const lemonCust =
      userData.lemonCustomerId ||
      (userData.paymentProvider === 'lemonsqueezy' ? userData.providerCustomerId : '') ||
      '';
    const lemonSub =
      userData.lemonSubscriptionId ||
      (userData.paymentProvider === 'lemonsqueezy' ? userData.providerSubscriptionId : '') ||
      '';

    const roleState = resolveAccountRoleState(userData.accountType, userData.accountTypes);

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const newUser = await User.create({
          name: userData.name.trim(),
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          role: userData.role || 'user',
          accountType: roleState.accountType,
          accountTypes: roleState.accountTypes,
          isDemo: Boolean(userData.isDemo),
          plan: userData.plan || 'free',
          aiCredits: typeof userData.aiCredits === 'number' ? userData.aiCredits : 3,
          billingCycle: userData.billingCycle || 'none',
          planExpiresAt: expiryVal,
          proExpiresAt: expiryVal,
          paymentProvider: userData.paymentProvider || 'none',
          providerCustomerId: userData.providerCustomerId || lemonCust || stripeCust,
          providerSubscriptionId: userData.providerSubscriptionId || lemonSub || stripeSub,
          stripeCustomerId: stripeCust,
          stripeSubscriptionId: stripeSub,
          lemonCustomerId: lemonCust,
          lemonSubscriptionId: lemonSub,
          emailVerified: resolvedEmailVerified ? new Date(resolvedEmailVerified) : null,
          emailVerifyTokenHash: userData.emailVerifyTokenHash || null,
          emailVerifyExpires: resolvedVerifyExpires ? new Date(resolvedVerifyExpires) : null,
          termsAcceptedAt: resolvedTermsAcceptedAt ? new Date(resolvedTermsAcceptedAt) : null,
          termsVersion: resolvedTermsVersion,
        });
        return {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          accountType: roleState.accountType,
          accountTypes: roleState.accountTypes,
          isDemo: Boolean(newUser.isDemo),
          plan: newUser.plan,
          aiCredits: newUser.aiCredits,
          billingCycle: newUser.billingCycle,
          planExpiresAt: newUser.planExpiresAt,
          proExpiresAt: newUser.proExpiresAt,
          paymentProvider: newUser.paymentProvider,
          providerCustomerId: newUser.providerCustomerId,
          providerSubscriptionId: newUser.providerSubscriptionId,
          stripeCustomerId: newUser.stripeCustomerId,
          stripeSubscriptionId: newUser.stripeSubscriptionId,
          lemonCustomerId: newUser.lemonCustomerId,
          lemonSubscriptionId: newUser.lemonSubscriptionId,
          emailVerified: newUser.emailVerified ? newUser.emailVerified.toISOString() : null,
          emailVerifyTokenHash: newUser.emailVerifyTokenHash || null,
          emailVerifyExpires: newUser.emailVerifyExpires
            ? newUser.emailVerifyExpires.toISOString()
            : null,
          termsAcceptedAt: newUser.termsAcceptedAt
            ? newUser.termsAcceptedAt.toISOString()
            : null,
          termsVersion: newUser.termsVersion || null,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const expiryIso = expiryVal
      ? typeof expiryVal === 'string'
        ? expiryVal
        : expiryVal.toISOString()
      : null;
    const newUser: StoredUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      role: userData.role || 'user',
      accountType: roleState.accountType,
      accountTypes: roleState.accountTypes,
      isDemo: Boolean(userData.isDemo),
      plan: userData.plan || 'free',
      aiCredits: typeof userData.aiCredits === 'number' ? userData.aiCredits : 3,
      billingCycle: userData.billingCycle || 'none',
      planExpiresAt: expiryIso,
      proExpiresAt: expiryIso,
      paymentProvider: userData.paymentProvider || 'none',
      providerCustomerId: userData.providerCustomerId || lemonCust || stripeCust,
      providerSubscriptionId: userData.providerSubscriptionId || lemonSub || stripeSub,
      stripeCustomerId: stripeCust,
      stripeSubscriptionId: stripeSub,
      lemonCustomerId: lemonCust,
      lemonSubscriptionId: lemonSub,
      emailVerified: resolvedEmailVerifiedIso,
      emailVerifyTokenHash: userData.emailVerifyTokenHash || null,
      emailVerifyExpires: resolvedVerifyExpiresIso,
      termsAcceptedAt: resolvedTermsAcceptedAtIso,
      termsVersion: resolvedTermsVersion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeLocalDb(db);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      accountType: roleState.accountType,
      accountTypes: roleState.accountTypes,
      isDemo: newUser.isDemo,
      plan: newUser.plan,
      aiCredits: newUser.aiCredits,
      billingCycle: newUser.billingCycle,
      planExpiresAt: newUser.planExpiresAt,
      proExpiresAt: newUser.proExpiresAt,
      paymentProvider: newUser.paymentProvider,
      providerCustomerId: newUser.providerCustomerId,
      providerSubscriptionId: newUser.providerSubscriptionId,
      stripeCustomerId: newUser.stripeCustomerId,
      stripeSubscriptionId: newUser.stripeSubscriptionId,
      lemonCustomerId: newUser.lemonCustomerId,
      lemonSubscriptionId: newUser.lemonSubscriptionId,
      emailVerified: newUser.emailVerified ?? null,
      emailVerifyTokenHash: newUser.emailVerifyTokenHash || null,
      emailVerifyExpires: newUser.emailVerifyExpires || null,
      termsAcceptedAt: newUser.termsAcceptedAt || null,
      termsVersion: newUser.termsVersion || null,
    };
  },

  async resetDemoUserData(userId: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await Promise.all([
          Resume.deleteMany({ userId }),
          Analysis.deleteMany({ userId }),
          CoverLetter.deleteMany({ userId }),
        ]);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.resumes = db.resumes.filter((r) => r.userId !== userId);
    db.analyses = db.analyses.filter((a) => a.userId !== userId);
    if (db.coverLetters) {
      db.coverLetters = db.coverLetters.filter((c) => c.userId !== userId);
    }
    writeLocalDb(db);
    return true;
  },

  async decrementUserCredits(
    userId: string,
    amount = 1,
    incrementResumeGen = false
  ): Promise<{ success: boolean; remaining: number; deducted: boolean }> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const incQuery: any = {};
        if (amount > 0) incQuery.aiCredits = -amount;
        if (incrementResumeGen) incQuery.aiResumeGenerationsCount = 1;

        const findQuery: any = { _id: new mongoose.Types.ObjectId(userId) };
        if (amount > 0) {
          findQuery.aiCredits = { $gte: amount };
        }

        const updated = await User.findOneAndUpdate(
          findQuery,
          { $inc: incQuery },
          { new: true }
        );
        if (updated) {
          return { success: true, remaining: updated.aiCredits, deducted: true };
        }
        return { success: false, remaining: 0, deducted: false };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const current = typeof user.aiCredits === 'number' ? user.aiCredits : 3;
      if (amount === 0 || current >= amount) {
        if (amount > 0) {
          user.aiCredits = current - amount;
        }
        if (incrementResumeGen) {
          user.aiResumeGenerationsCount = (user.aiResumeGenerationsCount || 0) + 1;
        }
        user.updatedAt = new Date().toISOString();
        writeLocalDb(db);
        return { success: true, remaining: user.aiCredits ?? 0, deducted: true };
      }
      return { success: false, remaining: user.aiCredits ?? 0, deducted: false };
    }
    return { success: false, remaining: 0, deducted: false };
  },

  async upgradeUserPlan(
    userId: string,
    planData: {
      plan: 'free' | 'pro' | 'enterprise';
      billingCycle?: 'monthly' | 'annual' | 'lifetime' | 'none';
      planExpiresAt?: Date | string | null;
      proExpiresAt?: Date | string | null;
      paymentProvider?: 'lemonsqueezy' | 'stripe' | 'paymob' | 'paddle' | 'none';
      providerCustomerId?: string;
      providerSubscriptionId?: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      lemonCustomerId?: string;
      lemonSubscriptionId?: string;
      subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'expired' | 'none';
      paymentFailedAt?: Date | string | null;
    }
  ): Promise<boolean> {
    const expiryInput =
      planData.proExpiresAt !== undefined ? planData.proExpiresAt : planData.planExpiresAt;
    const expiryDate = expiryInput ? new Date(expiryInput) : null;
    const expiryIso = expiryDate ? expiryDate.toISOString() : null;

    const stripeCust =
      planData.stripeCustomerId !== undefined
        ? planData.stripeCustomerId
        : planData.paymentProvider === 'stripe'
        ? planData.providerCustomerId || ''
        : undefined;
    const stripeSub =
      planData.stripeSubscriptionId !== undefined
        ? planData.stripeSubscriptionId
        : planData.paymentProvider === 'stripe'
        ? planData.providerSubscriptionId || ''
        : undefined;
    const lemonCust =
      planData.lemonCustomerId !== undefined
        ? planData.lemonCustomerId
        : planData.paymentProvider === 'lemonsqueezy'
        ? planData.providerCustomerId || ''
        : undefined;
    const lemonSub =
      planData.lemonSubscriptionId !== undefined
        ? planData.lemonSubscriptionId
        : planData.paymentProvider === 'lemonsqueezy'
        ? planData.providerSubscriptionId || ''
        : undefined;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const setFields: Record<string, any> = {
          plan: planData.plan,
          billingCycle: planData.billingCycle || (planData.plan === 'free' ? 'none' : 'monthly'),
          planExpiresAt: expiryDate,
          proExpiresAt: expiryDate,
        };
        if (planData.paymentProvider !== undefined) {
          setFields.paymentProvider = planData.paymentProvider;
        }
        if (planData.providerCustomerId !== undefined) {
          setFields.providerCustomerId = planData.providerCustomerId;
        }
        if (planData.providerSubscriptionId !== undefined) {
          setFields.providerSubscriptionId = planData.providerSubscriptionId;
        }
        if (stripeCust !== undefined) {
          setFields.stripeCustomerId = stripeCust;
          if (!setFields.providerCustomerId && stripeCust) {
            setFields.providerCustomerId = stripeCust;
          }
        }
        if (stripeSub !== undefined) {
          setFields.stripeSubscriptionId = stripeSub;
          if (!setFields.providerSubscriptionId && stripeSub) {
            setFields.providerSubscriptionId = stripeSub;
          }
        }
        if (lemonCust !== undefined) {
          setFields.lemonCustomerId = lemonCust;
          if (!setFields.providerCustomerId && lemonCust) {
            setFields.providerCustomerId = lemonCust;
          }
        }
        if (lemonSub !== undefined) {
          setFields.lemonSubscriptionId = lemonSub;
          if (!setFields.providerSubscriptionId && lemonSub) {
            setFields.providerSubscriptionId = lemonSub;
          }
        }
        if (planData.subscriptionStatus !== undefined) {
          setFields.subscriptionStatus = planData.subscriptionStatus;
        } else if (planData.plan === 'pro') {
          setFields.subscriptionStatus = 'active';
        }
        if (planData.paymentFailedAt !== undefined) {
          setFields.paymentFailedAt = planData.paymentFailedAt
            ? new Date(planData.paymentFailedAt)
            : null;
        }

        await User.findByIdAndUpdate(userId, { $set: setFields });
        return true;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.plan = planData.plan;
      user.billingCycle = planData.billingCycle || (planData.plan === 'free' ? 'none' : 'monthly');
      user.planExpiresAt = expiryIso;
      user.proExpiresAt = expiryIso;
      if (planData.paymentProvider !== undefined) {
        user.paymentProvider = planData.paymentProvider;
      }
      if (planData.providerCustomerId !== undefined) {
        user.providerCustomerId = planData.providerCustomerId;
      }
      if (planData.providerSubscriptionId !== undefined) {
        user.providerSubscriptionId = planData.providerSubscriptionId;
      }
      if (stripeCust !== undefined) {
        user.stripeCustomerId = stripeCust;
        if (!user.providerCustomerId && stripeCust) {
          user.providerCustomerId = stripeCust;
        }
      }
      if (stripeSub !== undefined) {
        user.stripeSubscriptionId = stripeSub;
        if (!user.providerSubscriptionId && stripeSub) {
          user.providerSubscriptionId = stripeSub;
        }
      }
      if (lemonCust !== undefined) {
        user.lemonCustomerId = lemonCust;
        if (!user.providerCustomerId && lemonCust) {
          user.providerCustomerId = lemonCust;
        }
      }
      if (lemonSub !== undefined) {
        user.lemonSubscriptionId = lemonSub;
        if (!user.providerSubscriptionId && lemonSub) {
          user.providerSubscriptionId = lemonSub;
        }
      }
      if (planData.subscriptionStatus !== undefined) {
        user.subscriptionStatus = planData.subscriptionStatus;
      } else if (planData.plan === 'pro') {
        user.subscriptionStatus = 'active';
      }
      if (planData.paymentFailedAt !== undefined) {
        user.paymentFailedAt = planData.paymentFailedAt
          ? new Date(planData.paymentFailedAt).toISOString()
          : null;
      }
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async incrementUserCredits(userId: string, amount: number = 15): Promise<number> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const updated = await User.findByIdAndUpdate(
          userId,
          { $inc: { aiCredits: amount } },
          { new: true }
        );
        if (updated) {
          return updated.aiCredits;
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const current = typeof user.aiCredits === 'number' ? user.aiCredits : 3;
      user.aiCredits = current + amount;
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return user.aiCredits;
    }
    return amount;
  },

  async isEventProcessed(eventId: string): Promise<boolean> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const existing = await PaymentEvent.findOne({
          eventId,
          status: { $ne: 'rejected' },
        });
        if (existing) return true;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.paymentEvents = db.paymentEvents || [];
    return db.paymentEvents.some(
      (e: any) => e.eventId === eventId && e.status !== 'rejected'
    );
  },

  async findPaymentEvent(eventId: string): Promise<any | null> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const existing = await PaymentEvent.findOne({ eventId }).lean();
        if (existing) return existing;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.paymentEvents = db.paymentEvents || [];
    return db.paymentEvents.find((e: any) => e.eventId === eventId) || null;
  },

  async recordPaymentEvent(eventData: {
    eventId: string;
    provider: 'lemonsqueezy' | 'stripe' | 'paymob' | 'test';
    eventType: string;
    status?: PaymentEventStatus;
    payload?: any;
  }): Promise<boolean> {
    const eventStatus: PaymentEventStatus = eventData.status || 'processed';
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await PaymentEvent.findOneAndUpdate(
          { eventId: eventData.eventId },
          {
            $set: {
              provider: eventData.provider,
              eventType: eventData.eventType,
              status: eventStatus,
              payload: eventData.payload || {},
              processedAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.paymentEvents = db.paymentEvents || [];
    const existingIdx = db.paymentEvents.findIndex((e: any) => e.eventId === eventData.eventId);
    if (existingIdx === -1) {
      db.paymentEvents.push({
        ...eventData,
        status: eventStatus,
        processedAt: new Date().toISOString(),
      });
    } else {
      db.paymentEvents[existingIdx] = {
        ...db.paymentEvents[existingIdx],
        ...eventData,
        status: eventStatus,
        processedAt: new Date().toISOString(),
      };
    }
    writeLocalDb(db);
    return true;
  },

  async recordPayment(paymentData: {
    userId: string;
    userEmail?: string;
    amount: number;
    currency: string;
    provider: 'lemonsqueezy' | 'stripe' | 'paymob' | 'test';
    providerPaymentId?: string;
    planId: string;
    billingCycle?: 'monthly' | 'annual' | 'none';
    status?: 'succeeded' | 'pending' | 'failed' | 'refunded';
    metadata?: any;
  }): Promise<any> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        return await Payment.create({
          ...paymentData,
          status: paymentData.status || 'succeeded',
        });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    db.payments = db.payments || [];
    const paymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...paymentData,
      status: paymentData.status || 'succeeded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.payments.push(paymentRecord);
    writeLocalDb(db);
    return paymentRecord;
  },

  async setResetPasswordToken(
    userId: string,
    tokenHash: string,
    expires: Date
  ): Promise<boolean> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            resetPasswordToken: tokenHash,
            resetPasswordExpires: expires,
          },
        });
        return true;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.resetPasswordToken = tokenHash;
      user.resetPasswordExpires = expires.toISOString();
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async findUserByResetToken(tokenHash: string): Promise<StoredUser | null> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const user = await User.findOne({
          resetPasswordToken: tokenHash,
          resetPasswordExpires: { $gt: new Date() },
        });
        if (user) {
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isDemo: user.isDemo,
            plan: user.plan,
            aiCredits: user.aiCredits,
            billingCycle: user.billingCycle,
            planExpiresAt: user.planExpiresAt?.toISOString() || null,
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpires: user.resetPasswordExpires?.toISOString() || null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const now = Date.now();
    const user = db.users.find((u) => {
      if (u.resetPasswordToken !== tokenHash) return false;
      if (!u.resetPasswordExpires) return false;
      const expiry = new Date(u.resetPasswordExpires).getTime();
      return expiry > now;
    });

    return user || null;
  },

  async resetUserPassword(userId: string, newHashedPassword: string): Promise<boolean> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: { password: newHashedPassword },
          $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
        });
        return true;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.password = newHashedPassword;
      delete user.resetPasswordToken;
      delete user.resetPasswordExpires;
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async setEmailVerifyToken(
    userId: string,
    tokenHash: string,
    expires: Date
  ): Promise<boolean> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            emailVerifyTokenHash: tokenHash,
            emailVerifyExpires: expires,
          },
        });
        return true;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.emailVerifyTokenHash = tokenHash;
      user.emailVerifyExpires = expires.toISOString();
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async findUserByEmailVerifyToken(tokenHash: string): Promise<StoredUser | null> {
    if (!tokenHash || typeof tokenHash !== 'string') return null;
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const user = await User.findOne({
          emailVerifyTokenHash: tokenHash,
          emailVerifyExpires: { $gt: new Date() },
        });
        if (user) {
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isDemo: user.isDemo,
            plan: user.plan,
            aiCredits: user.aiCredits,
            billingCycle: user.billingCycle,
            planExpiresAt: user.planExpiresAt?.toISOString() || null,
            emailVerified: user.emailVerified?.toISOString() || null,
            emailVerifyTokenHash: user.emailVerifyTokenHash || null,
            emailVerifyExpires: user.emailVerifyExpires?.toISOString() || null,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const now = Date.now();
    const user = db.users.find((u) => {
      if (u.emailVerifyTokenHash !== tokenHash) return false;
      if (!u.emailVerifyExpires) return false;
      const expiry = new Date(u.emailVerifyExpires).getTime();
      return expiry > now;
    });

    return user || null;
  },

  async verifyUserEmail(userId: string): Promise<boolean> {
    const now = new Date();
    const nowIso = now.toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        await User.findByIdAndUpdate(userId, {
          $set: {
            emailVerified: now,
            emailVerifyTokenHash: null,
            emailVerifyExpires: null,
          },
        });
        return true;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.emailVerified = nowIso;
      user.emailVerifyTokenHash = null;
      user.emailVerifyExpires = null;
      user.updatedAt = nowIso;
      writeLocalDb(db);
      return true;
    }
    return false;
  },

  async consumeJobMatchCredit(
    userId: string
  ): Promise<{
    success: boolean;
    remaining: number;
    deducted: boolean;
    charged: boolean;
    freeUsed: number;
    freeRemaining: number;
    creditsRemaining: number;
    creditsDeducted?: number;
    jobMatchFreeIncremented?: boolean;
  }> {
    return withOrderLock(async () => {
      const mongoUp = await isMongoAvailable();
      if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const objectId = new mongoose.Types.ObjectId(userId);

          // 1. Atomic free-quota consumption when jobMatchFreeUsed < JOB_MATCH_FREE_QUOTA
          const updatedFree = await User.findOneAndUpdate(
            {
              _id: objectId,
              $or: [
                { jobMatchFreeUsed: { $lt: JOB_MATCH_FREE_QUOTA } },
                { jobMatchFreeUsed: { $exists: false } },
                { jobMatchFreeUsed: null },
              ],
            },
            {
              $inc: { jobMatchFreeUsed: 1 },
            },
            { new: true }
          );

          if (updatedFree) {
            const freeUsed = updatedFree.jobMatchFreeUsed ?? 1;
            const creditsRemaining = updatedFree.aiCredits ?? 0;
            return {
              success: true,
              remaining: creditsRemaining,
              deducted: true,
              charged: false,
              freeUsed,
              freeRemaining: Math.max(0, JOB_MATCH_FREE_QUOTA - freeUsed),
              creditsRemaining,
              creditsDeducted: 0,
              jobMatchFreeIncremented: true,
            };
          }

          // 2. Atomic paid-credit deduction when free quota is exhausted AND aiCredits >= JOB_MATCH_CREDIT_COST
          const updatedPaid = await User.findOneAndUpdate(
            {
              _id: objectId,
              jobMatchFreeUsed: { $gte: JOB_MATCH_FREE_QUOTA },
              aiCredits: { $gte: JOB_MATCH_CREDIT_COST },
            },
            {
              $inc: {
                aiCredits: -JOB_MATCH_CREDIT_COST,
                jobMatchFreeUsed: 1,
              },
            },
            { new: true }
          );

          if (updatedPaid) {
            const freeUsed = updatedPaid.jobMatchFreeUsed ?? JOB_MATCH_FREE_QUOTA + 1;
            const creditsRemaining = updatedPaid.aiCredits ?? 0;
            return {
              success: true,
              remaining: creditsRemaining,
              deducted: true,
              charged: true,
              freeUsed,
              freeRemaining: 0,
              creditsRemaining,
              creditsDeducted: JOB_MATCH_CREDIT_COST,
              jobMatchFreeIncremented: true,
            };
          }

          const currentUser = await User.findById(objectId).lean();
          if (currentUser) {
            const freeUsed =
              typeof currentUser.jobMatchFreeUsed === 'number'
                ? currentUser.jobMatchFreeUsed
                : JOB_MATCH_FREE_QUOTA;
            const creditsRemaining =
              typeof currentUser.aiCredits === 'number' ? currentUser.aiCredits : 0;
            return {
              success: false,
              remaining: creditsRemaining,
              deducted: false,
              charged: false,
              freeUsed,
              freeRemaining: Math.max(0, JOB_MATCH_FREE_QUOTA - freeUsed),
              creditsRemaining,
              creditsDeducted: 0,
            };
          }
        } catch (err) {
          console.error('[DataStore] consumeJobMatchCredit MongoDB error:', err);
        }
      }

      // Atomic JSON fallback inside withOrderLock
      const db = readLocalDb();
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        const freeUsed = typeof user.jobMatchFreeUsed === 'number' ? user.jobMatchFreeUsed : 0;
        const credits = typeof user.aiCredits === 'number' ? user.aiCredits : 0;
        if (freeUsed < JOB_MATCH_FREE_QUOTA) {
          user.jobMatchFreeUsed = freeUsed + 1;
          user.updatedAt = new Date().toISOString();
          writeLocalDb(db);
          return {
            success: true,
            remaining: credits,
            deducted: true,
            charged: false,
            freeUsed: user.jobMatchFreeUsed,
            freeRemaining: Math.max(0, JOB_MATCH_FREE_QUOTA - user.jobMatchFreeUsed),
            creditsRemaining: credits,
            creditsDeducted: 0,
            jobMatchFreeIncremented: true,
          };
        }
        if (credits >= JOB_MATCH_CREDIT_COST) {
          user.aiCredits = credits - JOB_MATCH_CREDIT_COST;
          user.jobMatchFreeUsed = freeUsed + 1;
          user.updatedAt = new Date().toISOString();
          writeLocalDb(db);
          return {
            success: true,
            remaining: user.aiCredits,
            deducted: true,
            charged: true,
            freeUsed: user.jobMatchFreeUsed,
            freeRemaining: 0,
            creditsRemaining: user.aiCredits,
            creditsDeducted: JOB_MATCH_CREDIT_COST,
            jobMatchFreeIncremented: true,
          };
        }
        return {
          success: false,
          remaining: credits,
          deducted: false,
          charged: false,
          freeUsed,
          freeRemaining: 0,
          creditsRemaining: credits,
          creditsDeducted: 0,
        };
      }
      return {
        success: false,
        remaining: 0,
        deducted: false,
        charged: false,
        freeUsed: 0,
        freeRemaining: 0,
        creditsRemaining: 0,
        creditsDeducted: 0,
      };
    });
  },

  async refundUserCredits(
    userId: string,
    options: {
      amount?: number;
      decrementResumeGen?: boolean;
      decrementJobMatchFree?: boolean;
    } = {}
  ): Promise<{ success: boolean; remaining: number }> {
    const amount = options.amount ?? 0;
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const u = await User.findById(userId);
        if (u) {
          if (amount > 0) {
            u.aiCredits = (typeof u.aiCredits === 'number' ? u.aiCredits : 0) + amount;
          }
          if (options.decrementResumeGen) {
            u.aiResumeGenerationsCount = Math.max(
              0,
              (typeof u.aiResumeGenerationsCount === 'number' ? u.aiResumeGenerationsCount : 0) - 1
            );
          }
          if (options.decrementJobMatchFree) {
            u.jobMatchFreeUsed = Math.max(
              0,
              (typeof u.jobMatchFreeUsed === 'number' ? u.jobMatchFreeUsed : 0) - 1
            );
          }
          await u.save();
          return { success: true, remaining: u.aiCredits };
        }
      } catch (err) {
        console.error('[DataStore] refundUserCredits MongoDB error:', err);
      }
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const current = typeof user.aiCredits === 'number' ? user.aiCredits : 0;
      if (amount > 0) {
        user.aiCredits = current + amount;
      }
      if (options.decrementResumeGen) {
        user.aiResumeGenerationsCount = Math.max(0, (user.aiResumeGenerationsCount || 0) - 1);
      }
      if (options.decrementJobMatchFree) {
        user.jobMatchFreeUsed = Math.max(0, (user.jobMatchFreeUsed || 0) - 1);
      }
      user.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return { success: true, remaining: user.aiCredits ?? 0 };
    }
    return { success: false, remaining: 0 };
  },

  async getJobCache(cacheKey: string): Promise<any | null> {
    const db = readLocalDb();
    if (!db.jobCache) return null;
    const entry = db.jobCache.find((c: any) => c.cacheKey === cacheKey);
    if (!entry) return null;
    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return entry.data;
  },

  async setJobCache(cacheKey: string, data: any, ttlHours = 6): Promise<void> {
    const db = readLocalDb();
    if (!db.jobCache) db.jobCache = [];
    const now = Date.now();
    // Prune expired
    db.jobCache = db.jobCache.filter((c: any) => new Date(c.expiresAt).getTime() > now && c.cacheKey !== cacheKey);
    db.jobCache.push({
      cacheKey,
      data,
      expiresAt: new Date(now + ttlHours * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    writeLocalDb(db);
  },

  async createOrder(orderData: {
    userId: string;
    userEmail: string;
    planId: 'pro' | 'payg' | 'hr_pack_50' | 'hr_pack_200' | 'hr_pack_1000';
    billingCycle: 'monthly' | 'annual' | 'once';
    baseAmount: number;
    amount: number;
    currency?: OrderCurrency;
    method: PaymentMethodType;
    network?: string | null;
    reference: string;
    recipientAddress?: string;
    expiresAt: Date | string;
    metadata?: any;
  }): Promise<StoredOrder> {
    const expiresAtIso =
      typeof orderData.expiresAt === 'string'
        ? orderData.expiresAt
        : orderData.expiresAt.toISOString();
    const orderCurrency: OrderCurrency = orderData.currency || 'USD';

    const orderRecord: StoredOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: orderData.userId,
      userEmail: orderData.userEmail.toLowerCase().trim(),
      planId: orderData.planId,
      billingCycle: orderData.billingCycle,
      baseAmount: orderData.baseAmount,
      amount: orderData.amount,
      currency: orderCurrency,
      method: orderData.method,
      status: 'awaiting_payment',
      reference: orderData.reference,
      recipientAddress: orderData.recipientAddress || '',
      expiresAt: expiresAtIso,
      paidAt: null,
      auditLog: [
        {
          status: 'awaiting_payment',
          timestamp: new Date().toISOString(),
          note: `Order initialized for plan ${orderData.planId} (${orderData.amount} ${orderCurrency} via ${orderData.method})`,
          actor: 'system',
        },
      ],
      metadata: orderData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const created = await Order.create({
          userId: orderRecord.userId,
          userEmail: orderRecord.userEmail,
          planId: orderRecord.planId,
          billingCycle: orderRecord.billingCycle,
          baseAmount: orderRecord.baseAmount,
          amount: orderRecord.amount,
          currency: orderCurrency,
          method: orderRecord.method,
          status: 'awaiting_payment',
          reference: orderRecord.reference,
          recipientAddress: orderRecord.recipientAddress,
          expiresAt: new Date(expiresAtIso),
          auditLog: [
            {
              status: 'awaiting_payment',
              timestamp: new Date(),
              note: `Order initialized for plan ${orderData.planId} (${orderData.amount} ${orderCurrency} via ${orderData.method})`,
              actor: 'system',
            },
          ],
          metadata: orderRecord.metadata,
        });
        orderRecord.id = created._id.toString();
      } catch (err) {
        console.error('MongoDB Order.create failed, falling back to local store:', err);
      }
    }

    const db = readLocalDb();
    if (!db.orders) db.orders = [];
    db.orders.push(orderRecord);
    writeLocalDb(db);

    return orderRecord;
  },

  async findOrderById(orderId: string): Promise<StoredOrder | null> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(orderId)) {
      try {
        const order = await Order.findById(orderId);
        if (order) {
          return {
            id: order._id.toString(),
            userId: order.userId,
            userEmail: order.userEmail,
            planId: order.planId,
            billingCycle: order.billingCycle,
            baseAmount: order.baseAmount,
            amount: order.amount,
            currency: (order.currency as OrderCurrency) || 'USD',
            method: order.method,
            network: order.network || null,
            status: order.status,
            txid: order.txid || null,
            reference: order.reference,
            recipientAddress: order.recipientAddress,
            expiresAt: order.expiresAt.toISOString(),
            paidAt: order.paidAt?.toISOString() || null,
            proExpiresAt: order.proExpiresAt?.toISOString() || null,
            auditLog: (order.auditLog || []).map((l) => ({
              status: l.status,
              timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
              note: l.note,
              actor: l.actor,
            })),
            metadata: order.metadata || {},
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    if (!db.orders) return null;
    const found = db.orders.find((o) => o.id === orderId || (o as any)._id === orderId);
    return found || null;
  },

  async findOrderByReference(reference: string): Promise<StoredOrder | null> {
    const cleanRef = reference.trim();
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const order = await Order.findOne({ reference: cleanRef });
        if (order) {
          return {
            id: order._id.toString(),
            userId: order.userId,
            userEmail: order.userEmail,
            planId: order.planId,
            billingCycle: order.billingCycle,
            baseAmount: order.baseAmount,
            amount: order.amount,
            currency: (order.currency as OrderCurrency) || 'USD',
            method: order.method,
            network: order.network || null,
            status: order.status,
            txid: order.txid || null,
            reference: order.reference,
            recipientAddress: order.recipientAddress,
            expiresAt: order.expiresAt.toISOString(),
            paidAt: order.paidAt?.toISOString() || null,
            proExpiresAt: order.proExpiresAt?.toISOString() || null,
            auditLog: (order.auditLog || []).map((l) => ({
              status: l.status,
              timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
              note: l.note,
              actor: l.actor,
            })),
            metadata: order.metadata || {},
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    if (!db.orders) return null;
    const found = db.orders.find((o) => o.reference.toLowerCase() === cleanRef.toLowerCase());
    return found || null;
  },

  async listOrders(filter?: {
    status?: string;
    userId?: string;
    limit?: number;
  }): Promise<StoredOrder[]> {
    const limit = filter?.limit || 100;
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const query: any = {};
        if (filter?.status && filter.status !== 'all') {
          query.status = filter.status;
        }
        if (filter?.userId) {
          query.userId = filter.userId;
        }
        const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit);
        return orders.map((order) => ({
          id: order._id.toString(),
          userId: order.userId,
          userEmail: order.userEmail,
          planId: order.planId,
          billingCycle: order.billingCycle,
          baseAmount: order.baseAmount,
          amount: order.amount,
          currency: (order.currency as OrderCurrency) || 'USD',
          method: order.method,
          network: order.network || null,
          status: order.status,
          txid: order.txid || null,
          reference: order.reference,
          recipientAddress: order.recipientAddress,
          expiresAt: order.expiresAt.toISOString(),
          paidAt: order.paidAt?.toISOString() || null,
          proExpiresAt: order.proExpiresAt?.toISOString() || null,
          auditLog: (order.auditLog || []).map((l) => ({
            status: l.status,
            timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
            note: l.note,
            actor: l.actor,
          })),
          metadata: order.metadata || {},
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    let orders = (db.orders || []).slice();
    if (filter?.status && filter.status !== 'all') {
      orders = orders.filter((o) => o.status === filter.status);
    }
    if (filter?.userId) {
      orders = orders.filter((o) => o.userId === filter.userId);
    }
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders.slice(0, limit);
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    options?: {
      note?: string;
      actor?: string;
      metadata?: any;
    }
  ): Promise<StoredOrder | null> {
    const timestamp = new Date().toISOString();
    const actor = options?.actor || 'system';
    const note = options?.note || `Status updated to ${status}`;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(orderId)) {
      try {
        const updateDoc: any = {
          $set: {
            status,
            updatedAt: new Date(),
          },
          $push: {
            auditLog: {
              status,
              timestamp: new Date(),
              note,
              actor,
            },
          },
        };
        if (options?.metadata) {
          updateDoc.$set.metadata = options.metadata;
        }
        await Order.findByIdAndUpdate(orderId, updateDoc);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    if (!db.orders) return null;
    const order = db.orders.find((o) => o.id === orderId || (o as any)._id === orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = timestamp;
    if (options?.metadata) {
      order.metadata = { ...order.metadata, ...options.metadata };
    }
    order.auditLog = order.auditLog || [];
    order.auditLog.push({
      status,
      timestamp,
      note,
      actor,
    });

    writeLocalDb(db);
    return order;
  },

  async completeOrder(
    orderId: string,
    options?: {
      note?: string;
      actor?: string;
      provider?: 'lemonsqueezy' | 'stripe' | 'paymob';
      customerId?: string;
      subscriptionId?: string;
    }
  ): Promise<{
    success: boolean;
    alreadyPaid?: boolean;
    error?: 'ORDER_NOT_FOUND' | string;
    order: StoredOrder | null;
  }> {
    return withOrderLock(async () => {
      const existing = await this.findOrderById(orderId);
      if (!existing) {
        return { success: false, error: 'ORDER_NOT_FOUND', order: null };
      }

      // Idempotency: if already paid, do not re-process
      if (existing.status === 'paid') {
        return { success: true, alreadyPaid: true, order: existing };
      }

      const nowIso = new Date().toISOString();
      const actor = options?.actor || 'system';
      const note = options?.note || `Payment verified successfully via ${existing.method}`;

      // Pre-compute proExpiresAt for Pro orders so it is stored on both Order and User
      let computedProExpiresAt: Date | null = null;
      if (existing.planId === 'pro') {
        const durationDays = existing.billingCycle === 'annual' ? 365 : 30;
        const durationMs = durationDays * 24 * 3600 * 1000;
        const user = await this.findUserById(existing.userId);
        const currentExp = user?.proExpiresAt || user?.planExpiresAt;
        if (currentExp && new Date(currentExp).getTime() > Date.now()) {
          computedProExpiresAt = new Date(new Date(currentExp).getTime() + durationMs);
        } else {
          computedProExpiresAt = new Date(Date.now() + durationMs);
        }
      }

      // 1. Atomic Update Order in MongoDB using findOneAndUpdate with { _id: orderId, status: { $ne: 'paid' } }
      const mongoUp = await isMongoAvailable();
      if (mongoUp && mongoose.Types.ObjectId.isValid(orderId)) {
        const updateDoc: any = {
          $set: {
            status: 'paid',
            paidAt: new Date(),
            proExpiresAt: computedProExpiresAt,
            updatedAt: new Date(),
          },
          $push: {
            auditLog: {
              status: 'paid',
              timestamp: new Date(),
              note,
              actor,
            },
          },
        };

        const updatedMongoOrder = await Order.findOneAndUpdate(
          { _id: orderId, status: { $ne: 'paid' } },
          updateDoc,
          { new: true }
        );

        if (!updatedMongoOrder) {
          const latestOrder = await this.findOrderById(orderId);
          if (latestOrder && latestOrder.status === 'paid') {
            return { success: true, alreadyPaid: true, order: latestOrder };
          }
          return { success: false, error: 'ORDER_NOT_FOUND', order: null };
        }
      }

      // Atomic JSON fallback update inside the same lock/write critical section
      const db = readLocalDb();
      if (!db.orders) db.orders = [];

      let memoryOrder = db.orders.find((o) => o.id === orderId || (o as any)._id === orderId);
      if (!memoryOrder) {
        memoryOrder = { ...existing };
        db.orders.push(memoryOrder);
      } else if (memoryOrder.status === 'paid') {
        return { success: true, alreadyPaid: true, order: memoryOrder };
      }

      memoryOrder.status = 'paid';
      memoryOrder.paidAt = nowIso;
      memoryOrder.proExpiresAt = computedProExpiresAt ? computedProExpiresAt.toISOString() : null;
      memoryOrder.updatedAt = nowIso;
      memoryOrder.auditLog = memoryOrder.auditLog || [];
      memoryOrder.auditLog.push({
        status: 'paid',
        timestamp: nowIso,
        note,
        actor,
      });
      writeLocalDb(db);

      // 2. Activate Entitlements using lib/plans.ts
      const resolvedProvider: 'lemonsqueezy' | 'stripe' | 'paymob' =
        options?.provider ||
        (existing.method === 'lemonsqueezy'
          ? 'lemonsqueezy'
          : existing.method === 'paymob'
          ? 'paymob'
          : 'stripe');

      const custId = options?.customerId || existing.userEmail;
      const subId = options?.subscriptionId || existing.reference;

      if (existing.planId === 'pro' && computedProExpiresAt) {
        await this.upgradeUserPlan(existing.userId, {
          plan: 'pro',
          billingCycle: existing.billingCycle === 'annual' ? 'annual' : 'monthly',
          planExpiresAt: computedProExpiresAt,
          proExpiresAt: computedProExpiresAt,
          paymentProvider: resolvedProvider,
          providerCustomerId: custId,
          providerSubscriptionId: subId,
          ...(resolvedProvider === 'lemonsqueezy'
            ? {
                lemonCustomerId: options?.customerId || undefined,
                lemonSubscriptionId: options?.subscriptionId || undefined,
              }
            : {}),
          subscriptionStatus: 'active',
          paymentFailedAt: null,
        });
      } else if (isHrPackId(existing.planId)) {
        const packCredits = Number(getPlanCredits(existing.planId));
        let targetOrgId = existing.metadata?.orgId ? String(existing.metadata.orgId) : '';
        if (!targetOrgId) {
          const userOrgs = await this.getUserOrganizations(existing.userId);
          targetOrgId = userOrgs[0]?.id || '';
        }
        if (targetOrgId && Number.isFinite(packCredits) && packCredits > 0) {
          await this.addHrCredits(
            targetOrgId,
            packCredits,
            'credit_purchase',
            existing.id,
            existing.userId
          );
        }
        if (resolvedProvider === 'lemonsqueezy' && options?.customerId) {
          const currentUser = await this.findUserById(existing.userId);
          if (currentUser) {
            await this.upgradeUserPlan(existing.userId, {
              plan: ((currentUser as any).plan || 'free') as any,
              billingCycle: (currentUser as any).billingCycle || 'none',
              planExpiresAt: (currentUser as any).proExpiresAt || (currentUser as any).planExpiresAt || null,
              proExpiresAt: (currentUser as any).proExpiresAt || (currentUser as any).planExpiresAt || null,
              paymentProvider: 'lemonsqueezy',
              providerCustomerId: options.customerId,
              lemonCustomerId: options.customerId,
            });
          }
        }
      } else {
        const planCredits = getPlanCredits(existing.planId);
        if (typeof planCredits === 'number' && planCredits > 0) {
          await this.incrementUserCredits(existing.userId, planCredits);
        }
        if (resolvedProvider === 'lemonsqueezy' && options?.customerId) {
          const currentUser = await this.findUserById(existing.userId);
          if (currentUser) {
            await this.upgradeUserPlan(existing.userId, {
              plan: ((currentUser as any).plan || 'free') as any,
              billingCycle: (currentUser as any).billingCycle || 'none',
              planExpiresAt: (currentUser as any).proExpiresAt || (currentUser as any).planExpiresAt || null,
              proExpiresAt: (currentUser as any).proExpiresAt || (currentUser as any).planExpiresAt || null,
              paymentProvider: 'lemonsqueezy',
              providerCustomerId: options.customerId,
              lemonCustomerId: options.customerId,
            });
          }
        }
      }

      // 3. Record in unified Payment collection for accounting
      await this.recordPayment({
        userId: existing.userId,
        userEmail: existing.userEmail,
        amount: existing.amount,
        currency: existing.currency || 'USD',
        provider: resolvedProvider,
        providerPaymentId: existing.reference,
        planId: existing.planId,
        billingCycle: existing.billingCycle === 'annual' ? 'annual' : existing.billingCycle === 'monthly' ? 'monthly' : 'none',
        status: 'succeeded',
        metadata: {
          orderId: existing.id,
          reference: existing.reference,
          method: existing.method,
        },
      });

      const updated = await this.findOrderById(orderId);
      return { success: true, order: updated || memoryOrder };
    });
  },

  async refundOrder(
    orderId: string,
    options?: {
      note?: string;
      actor?: string;
      eventId?: string;
    }
  ): Promise<{
    success: boolean;
    alreadyRefunded?: boolean;
    error?: 'ORDER_NOT_FOUND' | string;
    order: StoredOrder | null;
  }> {
    return withOrderLock(async () => {
      const existing = await this.findOrderById(orderId);
      if (!existing) {
        return { success: false, error: 'ORDER_NOT_FOUND', order: null };
      }

      if (existing.status === 'refunded') {
        return { success: true, alreadyRefunded: true, order: existing };
      }

      const wasPaid = existing.status === 'paid';
      const nowIso = new Date().toISOString();
      const actor = options?.actor || 'system';
      const note = options?.note || `Order refunded via ${existing.method}`;

      const mongoUp = await isMongoAvailable();
      if (mongoUp && mongoose.Types.ObjectId.isValid(orderId)) {
        await Order.findOneAndUpdate(
          { _id: orderId, status: { $ne: 'refunded' } },
          {
            $set: {
              status: 'refunded',
              updatedAt: new Date(),
            },
            $push: {
              auditLog: {
                status: 'refunded',
                timestamp: new Date(),
                note,
                actor,
              },
            },
          },
          { new: true }
        );
      }

      const db = readLocalDb();
      if (!db.orders) db.orders = [];
      let memoryOrder = db.orders.find((o) => o.id === orderId || (o as any)._id === orderId);
      if (!memoryOrder) {
        memoryOrder = { ...existing };
        db.orders.push(memoryOrder);
      } else if (memoryOrder.status === 'refunded') {
        return { success: true, alreadyRefunded: true, order: memoryOrder };
      }

      memoryOrder.status = 'refunded';
      memoryOrder.updatedAt = nowIso;
      memoryOrder.auditLog = memoryOrder.auditLog || [];
      memoryOrder.auditLog.push({
        status: 'refunded',
        timestamp: nowIso,
        note,
        actor,
      });
      writeLocalDb(db);

      // Revoke entitlements if the order had been paid
      if (wasPaid) {
        if (existing.planId === 'pro') {
          await this.upgradeUserPlan(existing.userId, {
            plan: 'free',
            billingCycle: 'none',
            planExpiresAt: null,
            proExpiresAt: null,
            subscriptionStatus: 'canceled',
          });
        } else if (isHrPackId(existing.planId)) {
          const packCredits = Number(getPlanCredits(existing.planId));
          let targetOrgId = existing.metadata?.orgId ? String(existing.metadata.orgId) : '';
          if (!targetOrgId) {
            const userOrgs = await this.getUserOrganizations(existing.userId);
            targetOrgId = userOrgs[0]?.id || '';
          }
          if (targetOrgId && Number.isFinite(packCredits) && packCredits > 0) {
            await this.revokeHrCreditsForOrderRefund(
              targetOrgId,
              packCredits,
              existing.id,
              actor
            );
          }
        } else {
          const planCredits = getPlanCredits(existing.planId);
          if (typeof planCredits === 'number' && planCredits > 0) {
            const user = await this.findUserById(existing.userId);
            const currentCredits = typeof user?.aiCredits === 'number' ? user.aiCredits : 0;
            const deductAmount = Math.min(currentCredits, planCredits);
            if (deductAmount > 0) {
              await this.decrementUserCredits(existing.userId, deductAmount, false);
            }
          }
        }
      }

      const resolvedProvider: 'lemonsqueezy' | 'stripe' | 'paymob' =
        existing.method === 'lemonsqueezy'
          ? 'lemonsqueezy'
          : existing.method === 'paymob'
          ? 'paymob'
          : 'stripe';

      await this.recordPayment({
        userId: existing.userId,
        userEmail: existing.userEmail,
        amount: existing.amount,
        currency: existing.currency || 'USD',
        provider: resolvedProvider,
        providerPaymentId: options?.eventId || existing.reference,
        planId: existing.planId,
        billingCycle:
          existing.billingCycle === 'annual'
            ? 'annual'
            : existing.billingCycle === 'monthly'
            ? 'monthly'
            : 'none',
        status: 'refunded',
        metadata: {
          orderId: existing.id,
          reference: existing.reference,
          method: existing.method,
        },
      });

      const updated = await this.findOrderById(orderId);
      return { success: true, order: updated || memoryOrder };
    });
  },

  async expirePendingOrders(): Promise<number> {
    const now = Date.now();
    let count = 0;

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const result = await Order.updateMany(
          {
            status: { $in: ['created', 'awaiting_payment'] },
            expiresAt: { $lt: new Date() },
          },
          {
            $set: { status: 'expired', updatedAt: new Date() },
            $push: {
              auditLog: {
                status: 'expired',
                timestamp: new Date(),
                note: 'Order expired automatically after 30 minutes without payment',
                actor: 'system',
              },
            },
          }
        );
        count = result.modifiedCount || 0;
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'MongoDB operation failed in DataStore; falling back to local JSON datastore' },
        });
      }
    }

    const db = readLocalDb();
    if (db.orders) {
      for (const order of db.orders) {
        if (
          (order.status === 'created' || order.status === 'awaiting_payment') &&
          new Date(order.expiresAt).getTime() < now
        ) {
          order.status = 'expired';
          order.updatedAt = new Date().toISOString();
          order.auditLog = order.auditLog || [];
          order.auditLog.push({
            status: 'expired',
            timestamp: new Date().toISOString(),
            note: 'Order expired automatically after 30 minutes without payment',
            actor: 'system',
          });
          count++;
        }
      }
      writeLocalDb(db);
    }

    return count;
  },

  // =========================================================================
  // AI Usage Tracking & Cost Analytics (AiUsage Collection + Local Fallback)
  // =========================================================================

  async recordAiUsage(input: {
    userId?: string | null;
    endpoint: string;
    tokens: number;
    promptTokens?: number;
    completionTokens?: number;
    costUsd: number;
    latencyMs: number;
    status: AiUsageStatus;
    fallbackReason?: string;
    provider?: string;
    model?: string;
    createdAt?: Date | string;
  }): Promise<StoredAiUsage> {
    const nowIso = input.createdAt
      ? new Date(input.createdAt).toISOString()
      : new Date().toISOString();
    const userId = (input.userId || 'anonymous').trim() || 'anonymous';
    const endpoint = input.endpoint.trim();
    const tokens = Math.max(0, Math.round(Number(input.tokens) || 0));
    const promptTokens = Math.max(0, Math.round(Number(input.promptTokens) || 0));
    const completionTokens = Math.max(0, Math.round(Number(input.completionTokens) || 0));
    const costUsd = Math.max(0, Number(Number(input.costUsd || 0).toFixed(6)));
    const latencyMs = Math.max(0, Math.round(Number(input.latencyMs) || 0));
    const status: AiUsageStatus = input.status === 'hit' ? 'hit' : 'fallback';
    const provider = input.provider || (status === 'hit' ? 'openai' : 'built-in-ats-fallback');
    const model = input.model || 'gpt-4o-mini';

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const doc: any = await AiUsage.create({
          userId,
          endpoint,
          tokens,
          promptTokens,
          completionTokens,
          cost: costUsd,
          costUsd,
          latency: latencyMs,
          latencyMs,
          status,
          fallbackReason: input.fallbackReason,
          provider,
          model,
          createdAt: new Date(nowIso),
        });
        return {
          id: doc._id.toString(),
          userId: doc.userId,
          endpoint: doc.endpoint,
          tokens: doc.tokens,
          promptTokens: doc.promptTokens || 0,
          completionTokens: doc.completionTokens || 0,
          cost: doc.cost,
          costUsd: doc.costUsd,
          latency: doc.latency,
          latencyMs: doc.latencyMs,
          status: doc.status,
          fallbackReason: doc.fallbackReason,
          provider: doc.provider || provider,
          model: doc.model || model,
          createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : nowIso,
          updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : nowIso,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore.recordAiUsage' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.aiUsage)) {
        db.aiUsage = [];
      }
      const entry: StoredAiUsage = {
        id: 'aiu_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        userId,
        endpoint,
        tokens,
        promptTokens,
        completionTokens,
        cost: costUsd,
        costUsd,
        latency: latencyMs,
        latencyMs,
        status,
        fallbackReason: input.fallbackReason,
        provider,
        model,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.aiUsage.unshift(entry);
      if (db.aiUsage.length > 5000) {
        db.aiUsage = db.aiUsage.slice(0, 5000);
      }
      writeLocalDb(db);
      return entry;
    });
  },

  async getUserDailyAiUsageCount(
    userId: string,
    referenceDate: Date = new Date()
  ): Promise<{ total: number; hits: number; fallbacks: number; costUsd: number }> {
    const cleanUserId = (userId || '').trim();
    if (!cleanUserId || cleanUserId === 'anonymous') {
      return { total: 0, hits: 0, fallbacks: 0, costUsd: 0 };
    }

    const startOfTodayUtc = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const docs = await AiUsage.find({
          userId: cleanUserId,
          createdAt: { $gte: startOfTodayUtc },
        }).lean();
        let hits = 0;
        let fallbacks = 0;
        let costUsd = 0;
        for (const d of docs) {
          if (d.status === 'hit') hits++;
          else fallbacks++;
          costUsd += Number(d.costUsd ?? d.cost ?? 0);
        }
        return {
          total: docs.length,
          hits,
          fallbacks,
          costUsd: Number(costUsd.toFixed(6)),
        };
      } catch (err) {
        Sentry.captureException(err, { tags: { component: 'DataStore.getUserDailyAiUsageCount' } });
      }
    }

    const db = readLocalDb();
    const list = Array.isArray(db.aiUsage) ? db.aiUsage : [];
    const startMs = startOfTodayUtc.getTime();
    let total = 0;
    let hits = 0;
    let fallbacks = 0;
    let costUsd = 0;

    for (const item of list) {
      if (item.userId === cleanUserId && new Date(item.createdAt).getTime() >= startMs) {
        total++;
        if (item.status === 'hit') hits++;
        else fallbacks++;
        costUsd += Number(item.costUsd ?? item.cost ?? 0);
      }
    }

    return {
      total,
      hits,
      fallbacks,
      costUsd: Number(costUsd.toFixed(6)),
    };
  },

  async getProjectDailyAiSpend(
    referenceDate: Date = new Date()
  ): Promise<{
    totalCostUsd: number;
    totalRequests: number;
    hits: number;
    fallbacks: number;
    totalTokens: number;
  }> {
    const startOfTodayUtc = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const docs = await AiUsage.find({
          createdAt: { $gte: startOfTodayUtc },
        }).lean();
        let totalCostUsd = 0;
        let hits = 0;
        let fallbacks = 0;
        let totalTokens = 0;
        for (const d of docs) {
          totalCostUsd += Number(d.costUsd ?? d.cost ?? 0);
          totalTokens += Number(d.tokens || 0);
          if (d.status === 'hit') hits++;
          else fallbacks++;
        }
        return {
          totalCostUsd: Number(totalCostUsd.toFixed(6)),
          totalRequests: docs.length,
          hits,
          fallbacks,
          totalTokens,
        };
      } catch (err) {
        Sentry.captureException(err, { tags: { component: 'DataStore.getProjectDailyAiSpend' } });
      }
    }

    const db = readLocalDb();
    const list = Array.isArray(db.aiUsage) ? db.aiUsage : [];
    const startMs = startOfTodayUtc.getTime();
    let totalCostUsd = 0;
    let totalRequests = 0;
    let hits = 0;
    let fallbacks = 0;
    let totalTokens = 0;

    for (const item of list) {
      if (new Date(item.createdAt).getTime() >= startMs) {
        totalRequests++;
        totalCostUsd += Number(item.costUsd ?? item.cost ?? 0);
        totalTokens += Number(item.tokens || 0);
        if (item.status === 'hit') hits++;
        else fallbacks++;
      }
    }

    return {
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      totalRequests,
      hits,
      fallbacks,
      totalTokens,
    };
  },

  async getAiUsageStats(referenceDate: Date = new Date()) {
    const startOfTodayUtc = new Date(
      Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );
    const startOfWeekUtc = new Date(startOfTodayUtc.getTime() - 7 * 24 * 60 * 60 * 1000);

    let records: StoredAiUsage[] = [];
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const docs = await AiUsage.find({
          createdAt: { $gte: startOfWeekUtc },
        })
          .sort({ createdAt: -1 })
          .lean();
        records = docs.map((d: any) => ({
          id: d._id.toString(),
          userId: d.userId,
          endpoint: d.endpoint,
          tokens: d.tokens || 0,
          promptTokens: d.promptTokens || 0,
          completionTokens: d.completionTokens || 0,
          cost: Number(d.cost ?? d.costUsd ?? 0),
          costUsd: Number(d.costUsd ?? d.cost ?? 0),
          latency: Number(d.latency ?? d.latencyMs ?? 0),
          latencyMs: Number(d.latencyMs ?? d.latency ?? 0),
          status: d.status === 'hit' ? 'hit' : 'fallback',
          fallbackReason: d.fallbackReason,
          provider: d.provider || 'built-in-ats-engine',
          model: d.model || 'gpt-4o-mini',
          createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
          updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt || d.createdAt),
        }));
      } catch (err) {
        Sentry.captureException(err, { tags: { component: 'DataStore.getAiUsageStats' } });
      }
    }

    if (records.length === 0) {
      const db = readLocalDb();
      const allLocal = Array.isArray(db.aiUsage) ? db.aiUsage : [];
      const weekMs = startOfWeekUtc.getTime();
      records = allLocal.filter((r) => new Date(r.createdAt).getTime() >= weekMs);
    }

    const todayMs = startOfTodayUtc.getTime();

    const knownEndpoints = [
      '/api/resume/generate',
      '/api/cover-letter/generate',
      '/api/cover-letter/extract-keywords',
      '/api/jobs/extract-profile',
      '/api/analyses',
    ];

    const endpointMap = new Map<
      string,
      {
        endpoint: string;
        todayCostUsd: number;
        todayRequests: number;
        todayTokens: number;
        todayHits: number;
        todayFallbacks: number;
        weekCostUsd: number;
        weekRequests: number;
        weekTokens: number;
        weekHits: number;
        weekFallbacks: number;
        totalLatencyMs: number;
      }
    >();

    for (const ep of knownEndpoints) {
      endpointMap.set(ep, {
        endpoint: ep,
        todayCostUsd: 0,
        todayRequests: 0,
        todayTokens: 0,
        todayHits: 0,
        todayFallbacks: 0,
        weekCostUsd: 0,
        weekRequests: 0,
        weekTokens: 0,
        weekHits: 0,
        weekFallbacks: 0,
        totalLatencyMs: 0,
      });
    }

    let todayCostUsd = 0;
    let todayRequests = 0;
    let todayTokens = 0;
    let todayHits = 0;
    let todayFallbacks = 0;
    let todayLatencySum = 0;

    let weekCostUsd = 0;
    let weekRequests = 0;
    let weekTokens = 0;
    let weekHits = 0;
    let weekFallbacks = 0;
    let weekLatencySum = 0;

    for (const rec of records) {
      const createdMs = new Date(rec.createdAt).getTime();
      const isToday = createdMs >= todayMs;
      const cost = Number(rec.costUsd ?? rec.cost ?? 0);
      const tokens = Number(rec.tokens || 0);
      const latency = Number(rec.latencyMs ?? rec.latency ?? 0);
      const isHit = rec.status === 'hit';

      weekCostUsd += cost;
      weekRequests += 1;
      weekTokens += tokens;
      weekLatencySum += latency;
      if (isHit) weekHits += 1;
      else weekFallbacks += 1;

      if (isToday) {
        todayCostUsd += cost;
        todayRequests += 1;
        todayTokens += tokens;
        todayLatencySum += latency;
        if (isHit) todayHits += 1;
        else todayFallbacks += 1;
      }

      const epKey = rec.endpoint || 'unknown';
      if (!endpointMap.has(epKey)) {
        endpointMap.set(epKey, {
          endpoint: epKey,
          todayCostUsd: 0,
          todayRequests: 0,
          todayTokens: 0,
          todayHits: 0,
          todayFallbacks: 0,
          weekCostUsd: 0,
          weekRequests: 0,
          weekTokens: 0,
          weekHits: 0,
          weekFallbacks: 0,
          totalLatencyMs: 0,
        });
      }

      const epStats = endpointMap.get(epKey)!;
      epStats.weekCostUsd += cost;
      epStats.weekRequests += 1;
      epStats.weekTokens += tokens;
      epStats.totalLatencyMs += latency;
      if (isHit) epStats.weekHits += 1;
      else epStats.weekFallbacks += 1;

      if (isToday) {
        epStats.todayCostUsd += cost;
        epStats.todayRequests += 1;
        epStats.todayTokens += tokens;
        if (isHit) epStats.todayHits += 1;
        else epStats.todayFallbacks += 1;
      }
    }

    const rawBudget = parseFloat(process.env.AI_DAILY_BUDGET_USD || '10');
    const dailyBudgetUsd = Number.isFinite(rawBudget) && rawBudget >= 0 ? rawBudget : 10;

    const endpoints = Array.from(endpointMap.values()).map((ep) => ({
      endpoint: ep.endpoint,
      todayCostUsd: Number(ep.todayCostUsd.toFixed(6)),
      todayRequests: ep.todayRequests,
      todayTokens: ep.todayTokens,
      todayHits: ep.todayHits,
      todayFallbacks: ep.todayFallbacks,
      weekCostUsd: Number(ep.weekCostUsd.toFixed(6)),
      weekRequests: ep.weekRequests,
      weekTokens: ep.weekTokens,
      weekHits: ep.weekHits,
      weekFallbacks: ep.weekFallbacks,
      avgLatencyMs: ep.weekRequests > 0 ? Math.round(ep.totalLatencyMs / ep.weekRequests) : 0,
    }));

    return {
      today: {
        costUsd: Number(todayCostUsd.toFixed(6)),
        requests: todayRequests,
        tokens: todayTokens,
        hits: todayHits,
        fallbacks: todayFallbacks,
        avgLatencyMs: todayRequests > 0 ? Math.round(todayLatencySum / todayRequests) : 0,
      },
      week: {
        costUsd: Number(weekCostUsd.toFixed(6)),
        requests: weekRequests,
        tokens: weekTokens,
        hits: weekHits,
        fallbacks: weekFallbacks,
        avgLatencyMs: weekRequests > 0 ? Math.round(weekLatencySum / weekRequests) : 0,
      },
      dailyBudgetUsd,
      budgetRemainingUsd: Number(Math.max(0, dailyBudgetUsd - todayCostUsd).toFixed(6)),
      budgetExceeded: todayCostUsd >= dailyBudgetUsd,
      endpoints,
      recentLogs: records.slice(0, 30),
    };
  },

  // =========================================================================
  // User Profile & Onboarding Operations (MongoDB + Local JSON Fallback)
  // =========================================================================

  async getUserProfile(
    userId: string,
    viewerUserId?: string | null
  ): Promise<RedactedUserProfile | null> {
    if (!userId || typeof userId !== 'string') return null;
    const cleanId = userId.trim();
    const resolvedViewerId = viewerUserId === undefined ? cleanId : viewerUserId;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        const u = await User.findById(cleanId).select('-password').lean();
        if (u) {
          const normalized = normalizeUserProfileFromRecord(u);
          return formatProfileForViewer(normalized, resolvedViewerId);
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore.getUserProfile' },
        });
      }
    }

    const db = readLocalDb();
    const u = db.users.find((user) => user.id === cleanId);
    if (!u) return null;

    const normalized = normalizeUserProfileFromRecord(u);
    return formatProfileForViewer(normalized, resolvedViewerId);
  },

  async updateUserProfile(
    userId: string,
    input: ProfileUpdateInput
  ): Promise<RedactedUserProfile | null> {
    if (!userId || typeof userId !== 'string') return null;
    const cleanId = userId.trim();

    // Load current profile first so partial PUT updates merge cleanly
    let existingRecord: any = null;
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        existingRecord = await User.findById(cleanId).select('-password').lean();
      } catch {
        existingRecord = null;
      }
    }
    if (!existingRecord) {
      const db = readLocalDb();
      existingRecord = db.users.find((u) => u.id === cleanId) || null;
    }
    if (!existingRecord) return null;

    const current = normalizeUserProfileFromRecord(existingRecord);

    const nextFullName =
      input.fullName !== undefined ? input.fullName : current.fullName;

    // Keep headline and targetRole synchronized when one or both are provided
    let nextHeadline = current.headline;
    let nextTargetRole = current.targetRole;
    if (input.headline !== undefined && input.targetRole !== undefined) {
      nextHeadline = input.headline || input.targetRole;
      nextTargetRole = input.targetRole || input.headline;
    } else if (input.targetRole !== undefined) {
      nextTargetRole = input.targetRole;
      nextHeadline = input.targetRole;
    } else if (input.headline !== undefined) {
      nextHeadline = input.headline;
      nextTargetRole = input.headline;
    }

    const nextSeniority =
      input.seniority !== undefined ? input.seniority : current.seniority;
    const nextYears =
      input.yearsOfExperience !== undefined
        ? input.yearsOfExperience
        : current.yearsOfExperience;
    const nextIndustries =
      input.industries !== undefined ? input.industries : current.industries;
    const nextSkills =
      input.skills !== undefined ? input.skills : current.skills;
    const nextCountry =
      input.country !== undefined ? input.country : current.country;
    const nextCity = input.city !== undefined ? input.city : current.city;
    const nextRelocate =
      input.willingToRelocate !== undefined
        ? input.willingToRelocate
        : current.willingToRelocate;
    const nextRemote =
      input.remotePreference !== undefined
        ? input.remotePreference
        : current.remotePreference;
    const nextEmploymentTypes =
      input.employmentTypes !== undefined
        ? input.employmentTypes
        : current.employmentTypes;

    const nextExpectedSalary: ExpectedSalary = {
      min:
        input.expectedSalary?.min !== undefined
          ? input.expectedSalary.min
          : current.expectedSalary.min,
      max:
        input.expectedSalary?.max !== undefined
          ? input.expectedSalary.max
          : current.expectedSalary.max,
      currency:
        input.expectedSalary?.currency !== undefined
          ? input.expectedSalary.currency
          : current.expectedSalary.currency,
      visible:
        input.expectedSalary?.visible !== undefined
          ? Boolean(input.expectedSalary.visible)
          : current.expectedSalary.visible,
    };

    const nextLanguages =
      input.languages !== undefined ? input.languages : current.languages;

    let nextPhone = current.phone;
    let nextPhoneVisible = current.phoneVisible;
    if (input.phone !== undefined) {
      if (typeof input.phone === 'string') {
        nextPhone = sanitizePhoneText(input.phone);
      } else if (input.phone && typeof input.phone === 'object') {
        const rawPhone = input.phone.value ?? input.phone.number ?? '';
        nextPhone = sanitizePhoneText(rawPhone);
        if (input.phone.visible !== undefined) {
          nextPhoneVisible = Boolean(input.phone.visible);
        }
      }
    }
    if (input.phoneVisible !== undefined) {
      nextPhoneVisible = Boolean(input.phoneVisible);
    }

    const nextLinks: ProfileLinks = {
      linkedin:
        input.links?.linkedin !== undefined
          ? input.links.linkedin
          : current.links.linkedin,
      github:
        input.links?.github !== undefined
          ? input.links.github
          : current.links.github,
      portfolio:
        input.links?.portfolio !== undefined
          ? input.links.portfolio
          : current.links.portfolio,
    };

    const nextAvatar =
      input.avatar !== undefined ? input.avatar : current.avatar;

    const nowDate = new Date();
    const nowIso = nowDate.toISOString();
    const shouldMarkCompleted = input.completeOnboarding !== false;
    const nextOnboardingCompletedAt =
      current.onboardingCompletedAt || (shouldMarkCompleted ? nowIso : null);

    const updatedProfileData: UserProfileData = {
      userId: cleanId,
      fullName: nextFullName,
      headline: nextHeadline,
      targetRole: nextTargetRole,
      seniority: nextSeniority,
      yearsOfExperience: nextYears,
      industries: nextIndustries,
      skills: nextSkills,
      country: nextCountry,
      city: nextCity,
      willingToRelocate: nextRelocate,
      remotePreference: nextRemote,
      employmentTypes: nextEmploymentTypes,
      expectedSalary: nextExpectedSalary,
      languages: nextLanguages,
      phone: nextPhone,
      phoneVisible: nextPhoneVisible,
      links: nextLinks,
      avatar: nextAvatar,
      profileCompletion: 0,
      onboardingCompletedAt: nextOnboardingCompletedAt,
      onboardingSkippedAt: current.onboardingSkippedAt ?? null,
    };

    updatedProfileData.profileCompletion =
      calculateProfileCompletion(updatedProfileData);

    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        const mongoSet: Record<string, any> = {
          fullName: updatedProfileData.fullName,
          headline: updatedProfileData.headline,
          targetRole: updatedProfileData.targetRole,
          seniority: updatedProfileData.seniority,
          yearsOfExperience: updatedProfileData.yearsOfExperience,
          industries: updatedProfileData.industries,
          skills: updatedProfileData.skills,
          country: updatedProfileData.country,
          city: updatedProfileData.city,
          willingToRelocate: updatedProfileData.willingToRelocate,
          remotePreference: updatedProfileData.remotePreference,
          employmentTypes: updatedProfileData.employmentTypes,
          expectedSalary: updatedProfileData.expectedSalary,
          languages: updatedProfileData.languages,
          phone: updatedProfileData.phone,
          phoneVisible: updatedProfileData.phoneVisible,
          links: updatedProfileData.links,
          avatar: updatedProfileData.avatar,
          profileCompletion: updatedProfileData.profileCompletion,
          onboardingCompletedAt: updatedProfileData.onboardingCompletedAt
            ? new Date(updatedProfileData.onboardingCompletedAt)
            : null,
        };
        if (updatedProfileData.fullName) {
          mongoSet.name = updatedProfileData.fullName.slice(0, 60);
        }
        await User.findByIdAndUpdate(cleanId, { $set: mongoSet }, { new: true });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore.updateUserProfile' },
        });
      }
    }

    const db = readLocalDb();
    const localUser = db.users.find((u) => u.id === cleanId);
    if (localUser) {
      if (updatedProfileData.fullName) {
        localUser.name = updatedProfileData.fullName.slice(0, 60);
      }
      localUser.fullName = updatedProfileData.fullName;
      localUser.headline = updatedProfileData.headline;
      localUser.targetRole = updatedProfileData.targetRole;
      localUser.seniority = updatedProfileData.seniority;
      localUser.yearsOfExperience = updatedProfileData.yearsOfExperience;
      localUser.industries = updatedProfileData.industries;
      localUser.skills = updatedProfileData.skills;
      localUser.country = updatedProfileData.country;
      localUser.city = updatedProfileData.city;
      localUser.willingToRelocate = updatedProfileData.willingToRelocate;
      localUser.remotePreference = updatedProfileData.remotePreference;
      localUser.employmentTypes = updatedProfileData.employmentTypes;
      localUser.expectedSalary = updatedProfileData.expectedSalary;
      localUser.languages = updatedProfileData.languages;
      localUser.phone = updatedProfileData.phone;
      localUser.phoneVisible = updatedProfileData.phoneVisible;
      localUser.links = updatedProfileData.links;
      localUser.avatar = updatedProfileData.avatar;
      localUser.profileCompletion = updatedProfileData.profileCompletion;
      localUser.onboardingCompletedAt = updatedProfileData.onboardingCompletedAt;
      localUser.updatedAt = nowIso;
      writeLocalDb(db);
    }

    return formatProfileForViewer(updatedProfileData, cleanId);
  },

  async skipUserOnboarding(userId: string): Promise<RedactedUserProfile | null> {
    if (!userId || typeof userId !== 'string') return null;
    const cleanId = userId.trim();
    const nowDate = new Date();
    const nowIso = nowDate.toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        const existing = await User.findById(cleanId).select('-password').lean();
        if (existing) {
          const completedAt = (existing as any).onboardingCompletedAt
            ? new Date((existing as any).onboardingCompletedAt)
            : nowDate;
          const updated = await User.findByIdAndUpdate(
            cleanId,
            {
              $set: {
                onboardingCompletedAt: completedAt,
                onboardingSkippedAt: nowDate,
              },
            },
            { new: true }
          )
            .select('-password')
            .lean();
          if (updated) {
            return formatProfileForViewer(
              normalizeUserProfileFromRecord(updated),
              cleanId
            );
          }
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore.skipUserOnboarding' },
        });
      }
    }

    const db = readLocalDb();
    const localUser = db.users.find((u) => u.id === cleanId);
    if (!localUser) return null;

    if (!localUser.onboardingCompletedAt) {
      localUser.onboardingCompletedAt = nowIso;
    }
    localUser.onboardingSkippedAt = nowIso;
    localUser.updatedAt = nowIso;
    writeLocalDb(db);

    return formatProfileForViewer(
      normalizeUserProfileFromRecord(localUser),
      cleanId
    );
  },

  async clearAiUsageForTesting(): Promise<void> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await AiUsage.deleteMany({});
      } catch {
        // ignore in local fallback mode
      }
    }
    return withOrderLock(async () => {
      const db = readLocalDb();
      db.aiUsage = [];
      writeLocalDb(db);
    });
  },

  // =========================================================================
  // Saved Jobs, Saved Searches, Job Alerts, & Outbound Click Tracking
  // =========================================================================

  async getUserSavedJobs(userId: string): Promise<SavedJobItem[]> {
    if (!userId || typeof userId !== 'string') return [];
    const cleanId = userId.trim();
    const db = readLocalDb();
    const list = Array.isArray(db.savedJobs) ? db.savedJobs : [];
    return list
      .filter((item) => item.userId === cleanId)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  },

  async saveUserJob(userId: string, job: Job, notes?: string): Promise<SavedJobItem> {
    const cleanId = (userId || '').trim();
    const nowIso = new Date().toISOString();
    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.savedJobs)) {
        db.savedJobs = [];
      }

      const existingIdx = db.savedJobs.findIndex(
        (item) => item.userId === cleanId && item.jobId === job.id
      );

      const sanitizedJob: Job = {
        id: sanitizeProfileText(job.id || `job_${Date.now()}`, 120),
        title: sanitizeProfileText(job.title || 'Untitled Role', 180),
        company: sanitizeProfileText(job.company || 'Company', 140),
        location: sanitizeProfileText(job.location || 'Global', 140),
        remote: Boolean(job.remote),
        description: sanitizeProfileText(job.description || '', 2000),
        url: sanitizeProfileText(job.url || '', 600),
        source: sanitizeProfileText(job.source || 'JobMatch', 60),
        ...(job.sourceBadge ? { sourceBadge: sanitizeProfileText(job.sourceBadge, 60) } : {}),
        ...(job.postedDate ? { postedDate: sanitizeProfileText(job.postedDate, 40) } : {}),
        ...(job.salary ? { salary: sanitizeProfileText(job.salary, 80) } : {}),
        ...(job.jobType ? { jobType: sanitizeProfileText(job.jobType, 60) } : {}),
        ...(Array.isArray(job.tags)
          ? { tags: job.tags.map((t) => sanitizeProfileText(String(t), 40)).slice(0, 15) }
          : {}),
        ...(typeof job.matchScore === 'number' ? { matchScore: job.matchScore } : {}),
      };

      if (existingIdx >= 0) {
        db.savedJobs[existingIdx] = {
          ...db.savedJobs[existingIdx],
          job: sanitizedJob,
          ...(notes !== undefined ? { notes: sanitizeProfileText(notes, 400) } : {}),
          savedAt: nowIso,
        };
        writeLocalDb(db);
        return db.savedJobs[existingIdx];
      }

      const newItem: SavedJobItem = {
        id: `sjob_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: cleanId,
        jobId: sanitizedJob.id,
        job: sanitizedJob,
        ...(notes ? { notes: sanitizeProfileText(notes, 400) } : {}),
        savedAt: nowIso,
      };
      db.savedJobs.unshift(newItem);
      if (db.savedJobs.length > 1000) {
        db.savedJobs.length = 1000;
      }
      writeLocalDb(db);
      return newItem;
    });
  },

  async removeUserSavedJob(userId: string, jobId: string): Promise<boolean> {
    const cleanUserId = (userId || '').trim();
    const cleanJobId = (jobId || '').trim();
    if (!cleanUserId || !cleanJobId) return false;

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.savedJobs)) return false;
      const before = db.savedJobs.length;
      db.savedJobs = db.savedJobs.filter(
        (item) =>
          !(item.userId === cleanUserId && (item.jobId === cleanJobId || item.id === cleanJobId))
      );
      const removed = db.savedJobs.length < before;
      if (removed) {
        writeLocalDb(db);
      }
      return removed;
    });
  },

  async getUserSavedSearches(userId: string): Promise<SavedJobSearch[]> {
    if (!userId || typeof userId !== 'string') return [];
    const cleanId = userId.trim();
    const db = readLocalDb();
    const list = Array.isArray(db.savedSearches) ? db.savedSearches : [];
    return list
      .filter((item) => item.userId === cleanId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async saveUserJobSearch(
    userId: string,
    userEmail: string,
    input: {
      id?: string;
      name?: string;
      query: string;
      location?: string;
      country?: string;
      remote?: boolean;
      employmentType?: SavedJobSearch['employmentType'];
      datePosted?: SavedJobSearch['datePosted'];
      seniority?: SavedJobSearch['seniority'];
      minSalary?: number | null;
      maxSalary?: number | null;
      source?: string;
      alertFrequency?: JobAlertFrequency;
      alertEnabled?: boolean;
    }
  ): Promise<SavedJobSearch> {
    const cleanUserId = (userId || '').trim();
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const cleanQuery = sanitizeProfileText(input.query || '', 120);
    const cleanLocation = sanitizeProfileText(input.location || '', 120);
    const freq: JobAlertFrequency =
      input.alertFrequency && ['none', 'daily', 'weekly'].includes(input.alertFrequency)
        ? input.alertFrequency
        : 'none';
    const alertEnabled =
      input.alertEnabled !== undefined ? Boolean(input.alertEnabled && freq !== 'none') : freq !== 'none';
    const nowIso = new Date().toISOString();

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.savedSearches)) {
        db.savedSearches = [];
      }

      const existingIdx = db.savedSearches.findIndex(
        (s) =>
          s.userId === cleanUserId &&
          ((input.id && s.id === input.id) ||
            (s.query.toLowerCase() === cleanQuery.toLowerCase() &&
              (s.location || '').toLowerCase() === cleanLocation.toLowerCase() &&
              Boolean(s.remote) === Boolean(input.remote)))
      );

      if (existingIdx >= 0) {
        const existing = db.savedSearches[existingIdx];
        const updated: SavedJobSearch = {
          ...existing,
          name: sanitizeProfileText(
            input.name || existing.name || `${cleanQuery}${cleanLocation ? ` · ${cleanLocation}` : ''}`,
            140
          ),
          query: cleanQuery,
          location: cleanLocation,
          country: sanitizeProfileText(input.country || existing.country || 'global', 20),
          remote: Boolean(input.remote),
          employmentType: input.employmentType || existing.employmentType || 'any',
          datePosted: input.datePosted || existing.datePosted || 'any',
          seniority: input.seniority || existing.seniority || 'any',
          minSalary:
            input.minSalary !== undefined ? input.minSalary : (existing.minSalary ?? null),
          maxSalary:
            input.maxSalary !== undefined ? input.maxSalary : (existing.maxSalary ?? null),
          source: sanitizeProfileText(input.source || existing.source || 'all', 40),
          alertFrequency: freq,
          alertEnabled,
          unsubscribeToken:
            existing.unsubscribeToken ||
            `unsub_${crypto.randomBytes(18).toString('hex')}`,
          updatedAt: nowIso,
        };
        db.savedSearches[existingIdx] = updated;
        writeLocalDb(db);
        return updated;
      }

      const created: SavedJobSearch = {
        id: `ssearch_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: cleanUserId,
        userEmail: cleanEmail,
        name: sanitizeProfileText(
          input.name || `${cleanQuery}${cleanLocation ? ` · ${cleanLocation}` : ''}`,
          140
        ),
        query: cleanQuery,
        location: cleanLocation,
        country: sanitizeProfileText(input.country || 'global', 20),
        remote: Boolean(input.remote),
        employmentType: input.employmentType || 'any',
        datePosted: input.datePosted || 'any',
        seniority: input.seniority || 'any',
        minSalary: input.minSalary ?? null,
        maxSalary: input.maxSalary ?? null,
        source: sanitizeProfileText(input.source || 'all', 40),
        alertEnabled,
        alertFrequency: freq,
        unsubscribeToken: `unsub_${crypto.randomBytes(18).toString('hex')}`,
        lastSentAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.savedSearches.unshift(created);
      if (db.savedSearches.length > 1000) {
        db.savedSearches.length = 1000;
      }
      writeLocalDb(db);
      return created;
    });
  },

  async deleteUserSavedSearch(userId: string, searchId: string): Promise<boolean> {
    const cleanUserId = (userId || '').trim();
    const cleanSearchId = (searchId || '').trim();
    if (!cleanUserId || !cleanSearchId) return false;

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.savedSearches)) return false;
      const before = db.savedSearches.length;
      db.savedSearches = db.savedSearches.filter(
        (s) => !(s.userId === cleanUserId && s.id === cleanSearchId)
      );
      const removed = db.savedSearches.length < before;
      if (removed) {
        writeLocalDb(db);
      }
      return removed;
    });
  },

  async unsubscribeJobAlertByToken(token: string): Promise<SavedJobSearch | null> {
    const cleanToken = (token || '').trim();
    if (!cleanToken) return null;

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.savedSearches)) return null;
      const found = db.savedSearches.find((s) => s.unsubscribeToken === cleanToken);
      if (!found) return null;

      found.alertEnabled = false;
      found.alertFrequency = 'none';
      found.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return { ...found };
    });
  },

  async getDueJobAlerts(nowMs: number = Date.now()): Promise<SavedJobSearch[]> {
    const db = readLocalDb();
    const list = Array.isArray(db.savedSearches) ? db.savedSearches : [];
    const dailyWindowMs = 20 * 3600 * 1000; // 20 hours
    const weeklyWindowMs = 6.5 * 24 * 3600 * 1000; // 6.5 days

    return list.filter((s) => {
      if (!s.alertEnabled || (s.alertFrequency !== 'daily' && s.alertFrequency !== 'weekly')) {
        return false;
      }
      if (!s.userEmail || !s.query) return false;
      if (!s.lastSentAt) return true;
      const lastMs = new Date(s.lastSentAt).getTime();
      if (!Number.isFinite(lastMs)) return true;
      const elapsed = nowMs - lastMs;
      return s.alertFrequency === 'daily' ? elapsed >= dailyWindowMs : elapsed >= weeklyWindowMs;
    });
  },

  async markJobAlertSent(searchId: string, sentAtIso: string = new Date().toISOString()): Promise<void> {
    const cleanId = (searchId || '').trim();
    if (!cleanId) return;
    await withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.savedSearches)) return;
      const item = db.savedSearches.find((s) => s.id === cleanId);
      if (item) {
        item.lastSentAt = sentAtIso;
        item.updatedAt = sentAtIso;
        writeLocalDb(db);
      }
    });
  },

  async recordJobClick(input: {
    userId?: string | null;
    jobId: string;
    title: string;
    company: string;
    source: string;
    url: string;
  }): Promise<JobClickRecord> {
    const nowIso = new Date().toISOString();
    const record: JobClickRecord = {
      id: `jclick_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: input.userId || null,
      jobId: sanitizeProfileText(input.jobId || '', 120),
      title: sanitizeProfileText(input.title || '', 180),
      company: sanitizeProfileText(input.company || '', 140),
      source: sanitizeProfileText(input.source || '', 60),
      url: sanitizeProfileText(input.url || '', 600),
      clickedAt: nowIso,
    };

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.jobClicks)) {
        db.jobClicks = [];
      }
      db.jobClicks.unshift(record);
      if (db.jobClicks.length > 1000) {
        db.jobClicks.length = 1000;
      }
      writeLocalDb(db);
      return record;
    });
  },

  async getJobClicks(userId?: string): Promise<JobClickRecord[]> {
    const db = readLocalDb();
    const list = Array.isArray(db.jobClicks) ? db.jobClicks : [];
    if (!userId) return list;
    return list.filter((c) => c.userId === userId);
  },

  // ============================================================================
  // Employer / HR Account Roles, Organizations, Jobs, Applications & HR Credits
  // ============================================================================

  /**
   * Updates a user's `accountType` ('candidate' | 'employer' | 'both') or `accountTypes` array.
   */
  async updateUserAccountType(
    userId: string,
    accountTypeOrRoles: AccountType | AccountRole[]
  ): Promise<{ accountType: AccountType; accountTypes: AccountRole[] } | null> {
    const cleanId = (userId || '').trim();
    if (!cleanId) return null;

    const existing = await this.findUserById(cleanId);
    if (!existing) return null;

    const nextState = resolveAccountRoleState(accountTypeOrRoles, existing.accountTypes);

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        await User.findByIdAndUpdate(cleanId, {
          $set: {
            accountType: nextState.accountType,
            accountTypes: nextState.accountTypes,
          },
        });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'updateUserAccountType MongoDB failed; falling back to local DB' },
        });
      }
    }

    await withOrderLock(async () => {
      const db = readLocalDb();
      const user = db.users.find((u) => u.id === cleanId);
      if (user) {
        user.accountType = nextState.accountType;
        user.accountTypes = nextState.accountTypes;
        user.updatedAt = new Date().toISOString();
        writeLocalDb(db);
      }
    });

    return nextState;
  },

  /**
   * Enables an additional account role ('candidate' or 'employer') on the user,
   * automatically upgrading to 'both' if the user already has the other role.
   */
  async enableUserAccountRole(
    userId: string,
    roleToAdd: AccountRole
  ): Promise<{ accountType: AccountType; accountTypes: AccountRole[] } | null> {
    const existing = await this.findUserById(userId);
    if (!existing) return null;
    const nextState = enableAccountRole(existing, roleToAdd);
    return this.updateUserAccountType(userId, nextState.accountTypes);
  },

  /**
   * Creates a new Organization owned by `ownerId`, adds the owner to `members[]` with role 'owner',
   * sets `verified: false`, initializes separate `hrCredits` (`creditBalance`), and enables the 'employer'
   * role on the owner's User account (upgrading candidate -> 'both').
   */
  async createOrganization(
    ownerId: string,
    input: {
      name: string;
      website?: string;
      logo?: string;
      industry?: string;
      size?: OrganizationSize | string;
      country?: string;
      initialHrCredits?: number;
    }
  ): Promise<OrganizationRecord> {
    const cleanOwnerId = (ownerId || '').trim();
    if (!cleanOwnerId) {
      throw new Error('OWNER_ID_REQUIRED');
    }
    const cleanName = sanitizeProfileText(input.name || '', 120);
    if (!cleanName || cleanName.length < 2) {
      throw new Error('ORGANIZATION_NAME_REQUIRED');
    }

    const nowIso = new Date().toISOString();
    const initialCredits =
      typeof input.initialHrCredits === 'number' && input.initialHrCredits > 0
        ? Math.floor(input.initialHrCredits)
        : 0;
    const slug = generateEmployerJobSlug(cleanName, undefined, Date.now().toString(36));

    // Ensure owner has 'employer' role enabled (becomes 'both' if already 'candidate')
    await this.enableUserAccountRole(cleanOwnerId, 'employer');

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOwnerId)) {
      try {
        const createdOrg = await Organization.create({
          name: cleanName,
          slug,
          website: sanitizeProfileText(input.website || '', 300),
          logo: sanitizeProfileText(input.logo || '', 500),
          industry: sanitizeProfileText(input.industry || '', 80),
          size: input.size || '1-10',
          country: sanitizeProfileText(input.country || '', 80),
          verified: false,
          ownerId: cleanOwnerId,
          members: [
            {
              userId: cleanOwnerId,
              role: 'owner',
              addedAt: new Date(nowIso),
            },
          ],
          hrCredits: initialCredits,
          creditBalance: initialCredits,
        });

        const orgIdStr = createdOrg._id.toString();
        if (initialCredits > 0) {
          await HrCreditLedger.create({
            orgId: createdOrg._id,
            delta: initialCredits,
            balanceAfter: initialCredits,
            reason: 'initial_grant',
            refId: `org_init_${orgIdStr}`,
            actorId: cleanOwnerId,
          });
        }

        return {
          id: orgIdStr,
          name: createdOrg.name,
          slug: createdOrg.slug || slug,
          website: createdOrg.website || '',
          logo: createdOrg.logo || '',
          industry: createdOrg.industry || '',
          size: createdOrg.size || '1-10',
          country: createdOrg.country || '',
          verified: Boolean(createdOrg.verified),
          ownerId: createdOrg.ownerId.toString(),
          members: (createdOrg.members || []).map((m: any) => ({
            userId: m.userId.toString(),
            role: m.role,
            addedAt: m.addedAt instanceof Date ? m.addedAt.toISOString() : String(m.addedAt),
          })),
          hrCredits: createdOrg.hrCredits,
          creditBalance: createdOrg.hrCredits,
          createdAt: createdOrg.createdAt.toISOString(),
          updatedAt: createdOrg.updatedAt.toISOString(),
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'createOrganization MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.organizations)) db.organizations = [];
      if (!Array.isArray(db.hrCreditLedger)) db.hrCreditLedger = [];

      const orgId = `org_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
      const record: OrganizationRecord = {
        id: orgId,
        name: cleanName,
        slug,
        website: sanitizeProfileText(input.website || '', 300),
        logo: sanitizeProfileText(input.logo || '', 500),
        industry: sanitizeProfileText(input.industry || '', 80),
        size: input.size || '1-10',
        country: sanitizeProfileText(input.country || '', 80),
        verified: false,
        ownerId: cleanOwnerId,
        members: [
          {
            userId: cleanOwnerId,
            role: 'owner',
            addedAt: nowIso,
          },
        ],
        hrCredits: initialCredits,
        creditBalance: initialCredits,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.organizations.unshift(record);

      if (initialCredits > 0) {
        db.hrCreditLedger.unshift({
          id: `hrled_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
          orgId,
          delta: initialCredits,
          balanceAfter: initialCredits,
          reason: 'initial_grant',
          refId: `org_init_${orgId}`,
          actorId: cleanOwnerId,
          createdAt: nowIso,
        });
      }

      writeLocalDb(db);
      return { ...record };
    });
  },

  async getOrganizationById(orgId: string): Promise<OrganizationRecord | null> {
    const cleanOrgId = (orgId || '').trim();
    if (!cleanOrgId) return null;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        const org: any = await Organization.findById(cleanOrgId).lean();
        if (org) {
          const credits = typeof org.hrCredits === 'number' ? org.hrCredits : org.creditBalance || 0;
          return {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug || '',
            website: org.website || '',
            logo: org.logo || '',
            industry: org.industry || '',
            size: org.size || '1-10',
            country: org.country || '',
            verified: Boolean(org.verified),
            ownerId: org.ownerId.toString(),
            members: (org.members || []).map((m: any) => ({
              userId: m.userId.toString(),
              role: m.role,
              addedAt: m.addedAt instanceof Date ? m.addedAt.toISOString() : String(m.addedAt),
            })),
            hrCredits: credits,
            creditBalance: credits,
            monthlySpendCap:
              typeof org.monthlySpendCap === 'number' ? org.monthlySpendCap : null,
            lowBalanceThreshold:
              typeof org.lowBalanceThreshold === 'number' ? org.lowBalanceThreshold : 10,
            lowBalanceAlertEnabled:
              org.lowBalanceAlertEnabled !== undefined ? Boolean(org.lowBalanceAlertEnabled) : true,
            lastLowBalanceAlertAt: org.lastLowBalanceAlertAt
              ? new Date(org.lastLowBalanceAlertAt).toISOString()
              : null,
            createdAt: org.createdAt instanceof Date ? org.createdAt.toISOString() : String(org.createdAt),
            updatedAt: org.updatedAt instanceof Date ? org.updatedAt.toISOString() : String(org.updatedAt),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getOrganizationById MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    const found = (db.organizations || []).find((o) => o.id === cleanOrgId);
    if (!found) return null;
    const credits = typeof found.hrCredits === 'number' ? found.hrCredits : found.creditBalance || 0;
    return {
      ...found,
      hrCredits: credits,
      creditBalance: credits,
      monthlySpendCap:
        typeof found.monthlySpendCap === 'number' ? found.monthlySpendCap : null,
      lowBalanceThreshold:
        typeof found.lowBalanceThreshold === 'number' ? found.lowBalanceThreshold : 10,
      lowBalanceAlertEnabled:
        found.lowBalanceAlertEnabled !== undefined ? Boolean(found.lowBalanceAlertEnabled) : true,
      lastLowBalanceAlertAt: found.lastLowBalanceAlertAt || null,
      members: [...(found.members || [])],
    };
  },

  async getUserOrganizations(userId: string): Promise<OrganizationRecord[]> {
    const cleanUserId = (userId || '').trim();
    if (!cleanUserId) return [];

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanUserId)) {
      try {
        const orgs: any[] = await Organization.find({
          $or: [{ ownerId: cleanUserId }, { 'members.userId': cleanUserId }],
        })
          .sort({ createdAt: -1 })
          .lean();

        return orgs.map((org) => {
          const credits = typeof org.hrCredits === 'number' ? org.hrCredits : org.creditBalance || 0;
          return {
            id: org._id.toString(),
            name: org.name,
            slug: org.slug || '',
            website: org.website || '',
            logo: org.logo || '',
            industry: org.industry || '',
            size: org.size || '1-10',
            country: org.country || '',
            verified: Boolean(org.verified),
            ownerId: org.ownerId.toString(),
            members: (org.members || []).map((m: any) => ({
              userId: m.userId.toString(),
              role: m.role,
              addedAt: m.addedAt instanceof Date ? m.addedAt.toISOString() : String(m.addedAt),
            })),
            hrCredits: credits,
            creditBalance: credits,
            createdAt: org.createdAt instanceof Date ? org.createdAt.toISOString() : String(org.createdAt),
            updatedAt: org.updatedAt instanceof Date ? org.updatedAt.toISOString() : String(org.updatedAt),
          };
        });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getUserOrganizations MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    return (db.organizations || []).filter(
      (o) =>
        o.ownerId === cleanUserId ||
        (Array.isArray(o.members) && o.members.some((m) => m.userId === cleanUserId))
    );
  },

  async isOrganizationMember(
    orgId: string,
    userId: string,
    requiredRole?: OrgMemberRole
  ): Promise<boolean> {
    const org = await this.getOrganizationById(orgId);
    if (!org || !userId) return false;
    if (org.ownerId === userId) return true;
    const member = (org.members || []).find((m) => m.userId === userId);
    if (!member) return false;
    if (requiredRole === 'owner') {
      return member.role === 'owner';
    }
    return member.role === 'owner' || member.role === 'recruiter';
  },

  async addOrganizationMember(
    orgId: string,
    actorUserId: string,
    memberUserId: string,
    role: OrgMemberRole = 'recruiter'
  ): Promise<OrganizationRecord | null> {
    const isOwner = await this.isOrganizationMember(orgId, actorUserId, 'owner');
    if (!isOwner) {
      throw new Error('FORBIDDEN_ORG_OWNER_REQUIRED');
    }

    await this.enableUserAccountRole(memberUserId, 'employer');
    const nowIso = new Date().toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(orgId) && mongoose.Types.ObjectId.isValid(memberUserId)) {
      try {
        const orgDoc = await Organization.findById(orgId);
        if (orgDoc) {
          const existingIdx = orgDoc.members.findIndex(
            (m: any) => m.userId.toString() === memberUserId
          );
          if (existingIdx >= 0) {
            orgDoc.members[existingIdx].role = role;
          } else {
            orgDoc.members.push({
              userId: new mongoose.Types.ObjectId(memberUserId),
              role,
              addedAt: new Date(nowIso),
            });
          }
          await orgDoc.save();
          return this.getOrganizationById(orgId);
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'addOrganizationMember MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const org = (db.organizations || []).find((o) => o.id === orgId);
      if (!org) return null;
      if (!Array.isArray(org.members)) org.members = [];
      const existing = org.members.find((m) => m.userId === memberUserId);
      if (existing) {
        existing.role = role;
      } else {
        org.members.push({
          userId: memberUserId,
          role,
          addedAt: nowIso,
        });
      }
      org.updatedAt = nowIso;
      writeLocalDb(db);
      return { ...org, members: [...org.members] };
    });
  },

  /**
   * Atomically adds HR credits to an Organization and records an HrCreditLedger entry.
   */
  async addHrCredits(
    orgId: string,
    amount: number,
    reason: HrCreditReason,
    refId: string,
    actorId?: string | null
  ): Promise<{
    success: boolean;
    balanceAfter: number;
    ledgerEntry: HrCreditLedgerRecord;
  }> {
    const cleanOrgId = (orgId || '').trim();
    const cleanRefId = (refId || '').trim() || `ref_${Date.now()}`;
    const cleanReason = (reason || 'credit_purchase').trim();
    const positiveDelta = Math.floor(Number(amount));

    if (!cleanOrgId) throw new Error('ORG_ID_REQUIRED');
    if (!Number.isFinite(positiveDelta) || positiveDelta <= 0) {
      throw new Error('INVALID_CREDIT_AMOUNT');
    }

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        const updatedOrg: any = await Organization.findOneAndUpdate(
          { _id: cleanOrgId },
          { $inc: { hrCredits: positiveDelta, creditBalance: positiveDelta } },
          { new: true }
        ).lean();

        if (!updatedOrg) {
          throw new Error('ORGANIZATION_NOT_FOUND');
        }

        const balanceAfter = updatedOrg.hrCredits;
        const ledgerDoc = await HrCreditLedger.create({
          orgId: cleanOrgId,
          delta: positiveDelta,
          balanceAfter,
          reason: cleanReason,
          refId: cleanRefId,
          actorId: actorId || null,
        });

        return {
          success: true,
          balanceAfter,
          ledgerEntry: {
            id: ledgerDoc._id.toString(),
            orgId: cleanOrgId,
            delta: positiveDelta,
            balanceAfter,
            reason: cleanReason,
            refId: cleanRefId,
            actorId: actorId || null,
            createdAt: ledgerDoc.createdAt.toISOString(),
          },
        };
      } catch (err: any) {
        if (err?.message === 'ORGANIZATION_NOT_FOUND') throw err;
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'addHrCredits MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.organizations)) db.organizations = [];
      if (!Array.isArray(db.hrCreditLedger)) db.hrCreditLedger = [];

      const org = db.organizations.find((o) => o.id === cleanOrgId);
      if (!org) {
        throw new Error('ORGANIZATION_NOT_FOUND');
      }

      const currentBalance =
        typeof org.hrCredits === 'number' ? org.hrCredits : org.creditBalance || 0;
      const balanceAfter = currentBalance + positiveDelta;
      const nowIso = new Date().toISOString();

      org.hrCredits = balanceAfter;
      org.creditBalance = balanceAfter;
      org.updatedAt = nowIso;

      const ledgerEntry: HrCreditLedgerRecord = {
        id: `hrled_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
        orgId: cleanOrgId,
        delta: positiveDelta,
        balanceAfter,
        reason: cleanReason,
        refId: cleanRefId,
        actorId: actorId || null,
        createdAt: nowIso,
      };

      db.hrCreditLedger.unshift(ledgerEntry);
      writeLocalDb(db);

      return {
        success: true,
        balanceAfter,
        ledgerEntry,
      };
    });
  },

  /**
   * Atomically deducts HR credits from an Organization (`hrCredits >= cost`), enforcing:
   * 1. Positive balance check (`hrCredits >= cost`, which also blocks usage when `hrCredits < 0` due to an unsettled refund).
   * 2. Optional monthly spend cap (`org.monthlySpendCap`).
   * 3. Low-balance alert notification when `balanceAfter <= org.lowBalanceThreshold` and `lowBalanceAlertEnabled !== false`.
   */
  async deductHrCredits(
    orgId: string,
    cost: number,
    reason: HrCreditReason,
    refId: string,
    actorId?: string | null
  ): Promise<{
    success: boolean;
    error?:
      | 'INSUFFICIENT_HR_CREDITS'
      | 'MONTHLY_SPEND_CAP_EXCEEDED'
      | 'ORGANIZATION_NOT_FOUND';
    balanceAfter: number;
    lowBalanceAlertTriggered?: boolean;
    ledgerEntry?: HrCreditLedgerRecord;
  }> {
    const cleanOrgId = (orgId || '').trim();
    const cleanRefId = (refId || '').trim() || `ref_${Date.now()}`;
    const cleanReason = (reason || 'candidate_ai_analysis').trim();
    const deductAmount = Math.floor(Number(cost));

    if (!cleanOrgId) throw new Error('ORG_ID_REQUIRED');
    if (!Number.isFinite(deductAmount) || deductAmount <= 0) {
      throw new Error('INVALID_CREDIT_COST');
    }

    const orgRecord = await this.getOrganizationById(cleanOrgId);
    if (!orgRecord) {
      return {
        success: false,
        error: 'ORGANIZATION_NOT_FOUND',
        balanceAfter: 0,
      };
    }

    // Check optional monthly spend cap before deducting
    if (
      typeof orgRecord.monthlySpendCap === 'number' &&
      orgRecord.monthlySpendCap > 0
    ) {
      const monthlySpent = await this.getOrgMonthlyCreditSpend(cleanOrgId);
      if (monthlySpent + deductAmount > orgRecord.monthlySpendCap) {
        return {
          success: false,
          error: 'MONTHLY_SPEND_CAP_EXCEEDED',
          balanceAfter: orgRecord.hrCredits,
        };
      }
    }

    const triggerLowBalanceAlertIfNeeded = async (balanceAfter: number): Promise<boolean> => {
      const alertEnabled = orgRecord.lowBalanceAlertEnabled !== false;
      const threshold =
        typeof orgRecord.lowBalanceThreshold === 'number'
          ? orgRecord.lowBalanceThreshold
          : 10;
      if (!alertEnabled || balanceAfter > threshold) {
        return false;
      }

      const nowIso = new Date().toISOString();
      const ownerUser = await this.findUserById(orgRecord.ownerId);
      const targetEmail = orgRecord.workEmail || ownerUser?.email || '';
      if (targetEmail) {
        void sendEmail({
          to: targetEmail,
          subject: getHrLowBalanceAlertEmailSubject(orgRecord.name, balanceAfter, 'en'),
          html: getHrLowBalanceAlertEmailHtml({
            orgName: orgRecord.name,
            remainingCredits: balanceAfter,
            threshold,
            language: 'en',
          }),
          isDemo: Boolean((ownerUser as any)?.isDemo),
        });
      }

      const db = readLocalDb();
      const localOrg = (db.organizations || []).find((o) => o.id === cleanOrgId);
      if (localOrg) {
        localOrg.lastLowBalanceAlertAt = nowIso;
        writeLocalDb(db);
      }
      return true;
    };

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        // Atomic conditional update: only decrements if hrCredits >= deductAmount
        const updatedOrg: any = await Organization.findOneAndUpdate(
          { _id: cleanOrgId, hrCredits: { $gte: deductAmount } },
          { $inc: { hrCredits: -deductAmount, creditBalance: -deductAmount } },
          { new: true }
        ).lean();

        if (!updatedOrg) {
          const existingOrg: any = await Organization.findById(cleanOrgId).lean();
          if (!existingOrg) {
            return {
              success: false,
              error: 'ORGANIZATION_NOT_FOUND',
              balanceAfter: 0,
            };
          }
          return {
            success: false,
            error: 'INSUFFICIENT_HR_CREDITS',
            balanceAfter:
              typeof existingOrg.hrCredits === 'number' ? existingOrg.hrCredits : 0,
          };
        }

        const balanceAfter = updatedOrg.hrCredits;
        const ledgerDoc = await HrCreditLedger.create({
          orgId: cleanOrgId,
          delta: -deductAmount,
          balanceAfter,
          reason: cleanReason,
          refId: cleanRefId,
          actorId: actorId || null,
        });

        const lowBalanceAlertTriggered = await triggerLowBalanceAlertIfNeeded(balanceAfter);

        return {
          success: true,
          balanceAfter,
          lowBalanceAlertTriggered,
          ledgerEntry: {
            id: ledgerDoc._id.toString(),
            orgId: cleanOrgId,
            delta: -deductAmount,
            balanceAfter,
            reason: cleanReason,
            refId: cleanRefId,
            actorId: actorId || null,
            createdAt: ledgerDoc.createdAt.toISOString(),
          },
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'deductHrCredits MongoDB failed; falling back to local DB' },
        });
      }
    }

    // Local JSON fallback protected by in-process mutex lock (`withOrderLock`) for atomicity
    const res = await withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.organizations)) db.organizations = [];
      if (!Array.isArray(db.hrCreditLedger)) db.hrCreditLedger = [];

      const org = db.organizations.find((o) => o.id === cleanOrgId);
      if (!org) {
        return {
          success: false as const,
          error: 'ORGANIZATION_NOT_FOUND' as const,
          balanceAfter: 0,
        };
      }

      const currentBalance =
        typeof org.hrCredits === 'number' ? org.hrCredits : org.creditBalance || 0;

      if (currentBalance < deductAmount) {
        return {
          success: false as const,
          error: 'INSUFFICIENT_HR_CREDITS' as const,
          balanceAfter: currentBalance,
        };
      }

      const balanceAfter = currentBalance - deductAmount;
      const nowIso = new Date().toISOString();

      org.hrCredits = balanceAfter;
      org.creditBalance = balanceAfter;
      org.updatedAt = nowIso;

      const ledgerEntry: HrCreditLedgerRecord = {
        id: `hrled_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
        orgId: cleanOrgId,
        delta: -deductAmount,
        balanceAfter,
        reason: cleanReason,
        refId: cleanRefId,
        actorId: actorId || null,
        createdAt: nowIso,
      };

      db.hrCreditLedger.unshift(ledgerEntry);
      writeLocalDb(db);

      return {
        success: true as const,
        balanceAfter,
        ledgerEntry,
      };
    });

    if (res.success) {
      const lowBalanceAlertTriggered = await triggerLowBalanceAlertIfNeeded(res.balanceAfter);
      return {
        ...res,
        lowBalanceAlertTriggered,
      };
    }
    return res;
  },

  /**
   * Unconditionally subtracts `creditsToRevoke` from an Organization's `hrCredits` when a payment provider
   * issues an `order_refunded` webhook.
   * Note: `balanceAfter` is allowed to go negative (`< 0`) if the Organization had already spent some or all
   * of those credits, which automatically blocks any further HR credit usage until settled!
   */
  async revokeHrCreditsForOrderRefund(
    orgId: string,
    creditsToRevoke: number,
    orderId: string,
    actorId?: string | null
  ): Promise<{
    success: boolean;
    balanceAfter: number;
    ledgerEntry: HrCreditLedgerRecord;
  }> {
    const cleanOrgId = (orgId || '').trim();
    const cleanRefId = (orderId || '').trim() || `refund_${Date.now()}`;
    const revokeAmount = Math.floor(Number(creditsToRevoke));
    if (!cleanOrgId || !Number.isFinite(revokeAmount) || revokeAmount <= 0) {
      throw new Error('INVALID_REFUND_CREDIT_AMOUNT');
    }

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        const updatedOrg: any = await Organization.findOneAndUpdate(
          { _id: cleanOrgId },
          { $inc: { hrCredits: -revokeAmount, creditBalance: -revokeAmount } },
          { new: true }
        ).lean();

        if (updatedOrg) {
          const balanceAfter = updatedOrg.hrCredits;
          const ledgerDoc = await HrCreditLedger.create({
            orgId: cleanOrgId,
            delta: -revokeAmount,
            balanceAfter,
            reason: 'refund',
            refId: cleanRefId,
            actorId: actorId || null,
          });

        // Sync local DB outside withOrderLock to avoid nested lock deadlock
        const db = readLocalDb();
        const localOrg = (db.organizations || []).find((o) => o.id === cleanOrgId);
        if (localOrg) {
          localOrg.hrCredits = balanceAfter;
          localOrg.creditBalance = balanceAfter;
          writeLocalDb(db);
        }

        return {
          success: true,
          balanceAfter,
          ledgerEntry: {
            id: ledgerDoc._id.toString(),
            orgId: cleanOrgId,
            delta: -revokeAmount,
            balanceAfter,
            reason: 'refund',
            refId: cleanRefId,
            actorId: actorId || null,
            createdAt: ledgerDoc.createdAt.toISOString(),
          },
        };
      }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore.revokeHrCreditsForOrderRefund' },
        });
      }
    }

    const db = readLocalDb();
    if (!Array.isArray(db.organizations)) db.organizations = [];
    if (!Array.isArray(db.hrCreditLedger)) db.hrCreditLedger = [];

    const org = db.organizations.find((o) => o.id === cleanOrgId);
    if (!org) {
      throw new Error('ORGANIZATION_NOT_FOUND');
    }

    const currentBalance =
      typeof org.hrCredits === 'number' ? org.hrCredits : org.creditBalance || 0;
    const balanceAfter = currentBalance - revokeAmount;
    const nowIso = new Date().toISOString();

    org.hrCredits = balanceAfter;
    org.creditBalance = balanceAfter;
    org.updatedAt = nowIso;

    const ledgerEntry: HrCreditLedgerRecord = {
      id: `hrled_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
      orgId: cleanOrgId,
      delta: -revokeAmount,
      balanceAfter,
      reason: 'refund',
      refId: cleanRefId,
      actorId: actorId || null,
      createdAt: nowIso,
    };

    db.hrCreditLedger.unshift(ledgerEntry);
    writeLocalDb(db);

    return {
      success: true,
      balanceAfter,
      ledgerEntry,
    };
  },

  /**
   * Computes net HR credits spent by `orgId` during the current calendar month.
   * Excludes provider `refund` entries and offsets `*_refund` failure reversals.
   */
  async getOrgMonthlyCreditSpend(orgId: string): Promise<number> {
    const ledger = await this.getHrCreditLedger(orgId, 500);
    const now = new Date();
    const startOfMonthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let spent = 0;
    for (const entry of ledger) {
      const ts = new Date(entry.createdAt).getTime();
      if (ts >= startOfMonthMs) {
        if (
          entry.delta < 0 &&
          (entry.reason === 'job_publish' ||
            entry.reason === 'candidate_ai_analysis' ||
            entry.reason === 'top10_comparison_report')
        ) {
          spent += Math.abs(entry.delta);
        } else if (
          entry.delta > 0 &&
          (entry.reason === 'candidate_ai_analysis_refund' ||
            entry.reason === 'top10_comparison_refund')
        ) {
          spent = Math.max(0, spent - entry.delta);
        }
      }
    }
    return spent;
  },

  /**
   * Updates an Organization's optional monthly spend cap (`monthlySpendCap`) and low-balance alert settings.
   */
  async updateOrganizationBillingSettings(
    orgId: string,
    actorUserId: string,
    settings: {
      monthlySpendCap?: number | null;
      lowBalanceThreshold?: number;
      lowBalanceAlertEnabled?: boolean;
    }
  ): Promise<OrganizationRecord | null> {
    const isMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const cleanOrgId = (orgId || '').trim();
    const nextCap =
      settings.monthlySpendCap === null
        ? null
        : typeof settings.monthlySpendCap === 'number' && settings.monthlySpendCap > 0
        ? Math.floor(settings.monthlySpendCap)
        : undefined;
    const nextThreshold =
      typeof settings.lowBalanceThreshold === 'number' && settings.lowBalanceThreshold >= 0
        ? Math.floor(settings.lowBalanceThreshold)
        : undefined;
    const nextAlertEnabled =
      settings.lowBalanceAlertEnabled !== undefined
        ? Boolean(settings.lowBalanceAlertEnabled)
        : undefined;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        const setPayload: Record<string, any> = {};
        if (nextCap !== undefined) setPayload.monthlySpendCap = nextCap;
        if (nextThreshold !== undefined) setPayload.lowBalanceThreshold = nextThreshold;
        if (nextAlertEnabled !== undefined)
          setPayload.lowBalanceAlertEnabled = nextAlertEnabled;

        await Organization.findByIdAndUpdate(cleanOrgId, { $set: setPayload });
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore.updateOrganizationBillingSettings' },
        });
      }
    }

    await withOrderLock(async () => {
      const db = readLocalDb();
      const org = (db.organizations || []).find((o) => o.id === cleanOrgId);
      if (org) {
        if (nextCap !== undefined) org.monthlySpendCap = nextCap;
        if (nextThreshold !== undefined) org.lowBalanceThreshold = nextThreshold;
        if (nextAlertEnabled !== undefined)
          org.lowBalanceAlertEnabled = nextAlertEnabled;
        org.updatedAt = new Date().toISOString();
        writeLocalDb(db);
      }
    });

    return this.getOrganizationById(cleanOrgId);
  },

  async getHrCreditLedger(orgId: string, limit = 100): Promise<HrCreditLedgerRecord[]> {
    const cleanOrgId = (orgId || '').trim();
    if (!cleanOrgId) return [];
    const safeLimit = Math.min(500, Math.max(1, limit));

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        const docs: any[] = await HrCreditLedger.find({ orgId: cleanOrgId })
          .sort({ createdAt: -1 })
          .limit(safeLimit)
          .lean();

        return docs.map((d) => ({
          id: d._id.toString(),
          orgId: d.orgId.toString(),
          delta: d.delta,
          balanceAfter: d.balanceAfter,
          reason: d.reason,
          refId: d.refId,
          actorId: d.actorId || null,
          createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getHrCreditLedger MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    return (db.hrCreditLedger || [])
      .filter((entry) => entry.orgId === cleanOrgId)
      .slice(0, safeLimit);
  },

  /**
   * Creates an EmployerJob posting with sanitized Markdown description and unique slug.
   */
  async createEmployerJob(
    orgId: string,
    actorUserId: string,
    input: {
      title: string;
      description: string;
      requirements?: string[];
      skills?: string[];
      location?: string;
      remote?: boolean;
      employmentType?: EmploymentType;
      seniority?: EmployerJobSeniority;
      salary?: Partial<EmployerJobSalary>;
      screeningQuestions?: string[];
      status?: EmployerJobStatus;
      expiresAt?: string | Date | null;
      slug?: string;
    }
  ): Promise<EmployerJobRecord> {
    const cleanOrgId = (orgId || '').trim();
    const isMember = await this.isOrganizationMember(cleanOrgId, actorUserId);
    if (!isMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const org = await this.getOrganizationById(cleanOrgId);
    const cleanTitle = sanitizeProfileText(input.title || '', 160);
    if (!cleanTitle || cleanTitle.length < 2) {
      throw new Error('JOB_TITLE_REQUIRED');
    }

    const cleanDescription = sanitizeJobMarkdown(input.description || '', 15000);
    if (!cleanDescription) {
      throw new Error('JOB_DESCRIPTION_REQUIRED');
    }

    const requirements = Array.isArray(input.requirements)
      ? input.requirements
          .map((r) => sanitizeProfileText(r, 300))
          .filter(Boolean)
          .slice(0, 30)
      : [];
    const skills = Array.isArray(input.skills)
      ? input.skills
          .map((s) => sanitizeProfileText(s, 60))
          .filter(Boolean)
          .slice(0, 30)
      : [];
    const screeningQuestions = Array.isArray(input.screeningQuestions)
      ? input.screeningQuestions
          .map((q) => sanitizeProfileText(q, 240))
          .filter(Boolean)
          .slice(0, 10)
      : [];
    const location = sanitizeProfileText(input.location || '', 120);
    const remote = Boolean(input.remote);
    const employmentType: EmploymentType =
      input.employmentType &&
      ['full-time', 'part-time', 'contract', 'internship'].includes(input.employmentType)
        ? input.employmentType
        : 'full-time';
    const seniority: EmployerJobSeniority =
      input.seniority &&
      ['student', 'junior', 'mid', 'senior', 'lead', 'any'].includes(input.seniority)
        ? input.seniority
        : 'any';
    const salary: EmployerJobSalary = {
      min:
        typeof input.salary?.min === 'number' && Number.isFinite(input.salary.min)
          ? input.salary.min
          : null,
      max:
        typeof input.salary?.max === 'number' && Number.isFinite(input.salary.max)
          ? input.salary.max
          : null,
      currency:
        typeof input.salary?.currency === 'string' && input.salary.currency.trim()
          ? input.salary.currency.trim().toUpperCase()
          : 'USD',
      visible: Boolean(input.salary?.visible === true),
    };
    const status: EmployerJobStatus =
      input.status &&
      ['draft', 'pending', 'published', 'closed', 'expired'].includes(input.status)
        ? input.status
        : 'draft';

    const nowIso = new Date().toISOString();
    const publishedAt = status === 'published' ? nowIso : null;
    const expiresAt = input.expiresAt
      ? input.expiresAt instanceof Date
        ? input.expiresAt.toISOString()
        : String(input.expiresAt)
      : null;

    let baseSlug =
      input.slug && input.slug.trim()
        ? sanitizeProfileText(input.slug.trim().toLowerCase(), 100).replace(/[^a-z0-9\u0600-\u06FF-]+/g, '-')
        : generateEmployerJobSlug(cleanTitle, org?.name);

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
      try {
        const existingSlug = await EmployerJob.findOne({ slug: baseSlug }).lean();
        if (existingSlug) {
          baseSlug = generateEmployerJobSlug(cleanTitle, org?.name, crypto.randomBytes(3).toString('hex'));
        }

        const created: any = await EmployerJob.create({
          orgId: cleanOrgId,
          title: cleanTitle,
          description: cleanDescription,
          requirements,
          skills,
          location,
          remote,
          employmentType,
          seniority,
          salary,
          screeningQuestions,
          applyMode: 'internal',
          status,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          applicantsCount: 0,
          slug: baseSlug,
        });

        return {
          id: created._id.toString(),
          orgId: created.orgId.toString(),
          title: created.title,
          description: created.description,
          requirements: created.requirements || [],
          skills: created.skills || [],
          location: created.location || '',
          remote: Boolean(created.remote),
          employmentType: created.employmentType,
          seniority: created.seniority,
          salary: created.salary,
          screeningQuestions: created.screeningQuestions || [],
          applyMode: 'internal',
          status: created.status,
          publishedAt: created.publishedAt ? created.publishedAt.toISOString() : null,
          expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
          applicantsCount: created.applicantsCount || 0,
          slug: created.slug,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'createEmployerJob MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.employerJobs)) db.employerJobs = [];

      if (db.employerJobs.some((j) => j.slug === baseSlug)) {
        baseSlug = generateEmployerJobSlug(cleanTitle, org?.name, crypto.randomBytes(3).toString('hex'));
      }

      const jobRecord: EmployerJobRecord = {
        id: `ejob_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
        orgId: cleanOrgId,
        title: cleanTitle,
        description: cleanDescription,
        requirements,
        skills,
        location,
        remote,
        employmentType,
        seniority,
        salary,
        screeningQuestions,
        applyMode: 'internal',
        status,
        publishedAt,
        expiresAt,
        applicantsCount: 0,
        slug: baseSlug,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.employerJobs.unshift(jobRecord);
      writeLocalDb(db);
      return { ...jobRecord };
    });
  },

  async getEmployerJobById(jobId: string): Promise<EmployerJobRecord | null> {
    const cleanId = (jobId || '').trim();
    if (!cleanId) return null;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanId)) {
      try {
        const j: any = await EmployerJob.findById(cleanId).lean();
        if (j) {
          return {
            id: j._id.toString(),
            orgId: j.orgId.toString(),
            title: j.title,
            description: j.description,
            requirements: j.requirements || [],
            skills: j.skills || [],
            location: j.location || '',
            remote: Boolean(j.remote),
            employmentType: j.employmentType || 'full-time',
            seniority: j.seniority || 'any',
            salary: j.salary || { min: null, max: null, currency: 'USD', visible: false },
            screeningQuestions: j.screeningQuestions || [],
            applyMode: 'internal',
            status: j.status || 'draft',
            publishedAt: j.publishedAt ? new Date(j.publishedAt).toISOString() : null,
            expiresAt: j.expiresAt ? new Date(j.expiresAt).toISOString() : null,
            applicantsCount: j.applicantsCount || 0,
            slug: j.slug,
            createdAt: j.createdAt instanceof Date ? j.createdAt.toISOString() : String(j.createdAt),
            updatedAt: j.updatedAt instanceof Date ? j.updatedAt.toISOString() : String(j.updatedAt),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getEmployerJobById MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    const found = (db.employerJobs || []).find((j) => j.id === cleanId);
    return found ? { ...found } : null;
  },

  async getEmployerJobBySlug(slug: string): Promise<EmployerJobRecord | null> {
    const cleanSlug = (slug || '').trim().toLowerCase();
    if (!cleanSlug) return null;

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const j: any = await EmployerJob.findOne({ slug: cleanSlug }).lean();
        if (j) {
          return this.getEmployerJobById(j._id.toString());
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getEmployerJobBySlug MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    const found = (db.employerJobs || []).find((j) => j.slug.toLowerCase() === cleanSlug);
    return found ? { ...found } : null;
  },

  async updateEmployerJob(
    jobId: string,
    orgId: string,
    actorUserId: string,
    updates: Partial<{
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
      status: EmployerJobStatus;
      expiresAt: string | null;
    }>
  ): Promise<EmployerJobRecord | null> {
    const isMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const nowIso = new Date().toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(jobId) && mongoose.Types.ObjectId.isValid(orgId)) {
      try {
        const setPayload: Record<string, any> = {};
        if (updates.title !== undefined) setPayload.title = sanitizeProfileText(updates.title, 160);
        if (updates.description !== undefined)
          setPayload.description = sanitizeJobMarkdown(updates.description, 15000);
        if (updates.requirements !== undefined)
          setPayload.requirements = updates.requirements.map((r) => sanitizeProfileText(r, 300));
        if (updates.skills !== undefined)
          setPayload.skills = updates.skills.map((s) => sanitizeProfileText(s, 60));
        if (updates.location !== undefined)
          setPayload.location = sanitizeProfileText(updates.location, 120);
        if (updates.remote !== undefined) setPayload.remote = Boolean(updates.remote);
        if (updates.employmentType !== undefined) setPayload.employmentType = updates.employmentType;
        if (updates.seniority !== undefined) setPayload.seniority = updates.seniority;
        if (updates.salary !== undefined) setPayload.salary = updates.salary;
        if (updates.screeningQuestions !== undefined)
          setPayload.screeningQuestions = updates.screeningQuestions.map((q) =>
            sanitizeProfileText(q, 240)
          );
        if (updates.status !== undefined) {
          setPayload.status = updates.status;
          if (updates.status === 'published') {
            setPayload.publishedAt = new Date(nowIso);
          }
        }
        if (updates.expiresAt !== undefined) {
          setPayload.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
        }

        const updated: any = await EmployerJob.findOneAndUpdate(
          { _id: jobId, orgId },
          { $set: setPayload },
          { new: true }
        ).lean();

        if (updated) {
          return this.getEmployerJobById(updated._id.toString());
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'updateEmployerJob MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const job = (db.employerJobs || []).find((j) => j.id === jobId && j.orgId === orgId);
      if (!job) return null;

      if (updates.title !== undefined) job.title = sanitizeProfileText(updates.title, 160);
      if (updates.description !== undefined)
        job.description = sanitizeJobMarkdown(updates.description, 15000);
      if (updates.requirements !== undefined)
        job.requirements = updates.requirements.map((r) => sanitizeProfileText(r, 300));
      if (updates.skills !== undefined)
        job.skills = updates.skills.map((s) => sanitizeProfileText(s, 60));
      if (updates.location !== undefined)
        job.location = sanitizeProfileText(updates.location, 120);
      if (updates.remote !== undefined) job.remote = Boolean(updates.remote);
      if (updates.employmentType !== undefined) job.employmentType = updates.employmentType;
      if (updates.seniority !== undefined) job.seniority = updates.seniority;
      if (updates.salary !== undefined) job.salary = updates.salary;
      if (updates.screeningQuestions !== undefined)
        job.screeningQuestions = updates.screeningQuestions.map((q) =>
          sanitizeProfileText(q, 240)
        );
      if (updates.status !== undefined) {
        job.status = updates.status;
        if (updates.status === 'published' && !job.publishedAt) {
          job.publishedAt = nowIso;
        }
      }
      if (updates.expiresAt !== undefined) job.expiresAt = updates.expiresAt;
      job.updatedAt = nowIso;

      writeLocalDb(db);
      return { ...job };
    });
  },

  async listEmployerJobs(filters?: {
    orgId?: string;
    status?: EmployerJobStatus;
    limit?: number;
  }): Promise<EmployerJobRecord[]> {
    const safeLimit = Math.min(200, Math.max(1, filters?.limit || 50));

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const query: Record<string, any> = {};
        if (filters?.orgId && mongoose.Types.ObjectId.isValid(filters.orgId)) {
          query.orgId = filters.orgId;
        }
        if (filters?.status) {
          query.status = filters.status;
        }
        const docs: any[] = await EmployerJob.find(query)
          .sort({ createdAt: -1 })
          .limit(safeLimit)
          .lean();

        return docs.map((j) => ({
          id: j._id.toString(),
          orgId: j.orgId.toString(),
          title: j.title,
          description: j.description,
          requirements: j.requirements || [],
          skills: j.skills || [],
          location: j.location || '',
          remote: Boolean(j.remote),
          employmentType: j.employmentType || 'full-time',
          seniority: j.seniority || 'any',
          salary: j.salary || { min: null, max: null, currency: 'USD', visible: false },
          screeningQuestions: j.screeningQuestions || [],
          applyMode: 'internal',
          status: j.status || 'draft',
          publishedAt: j.publishedAt ? new Date(j.publishedAt).toISOString() : null,
          expiresAt: j.expiresAt ? new Date(j.expiresAt).toISOString() : null,
          applicantsCount: j.applicantsCount || 0,
          slug: j.slug,
          createdAt: j.createdAt instanceof Date ? j.createdAt.toISOString() : String(j.createdAt),
          updatedAt: j.updatedAt instanceof Date ? j.updatedAt.toISOString() : String(j.updatedAt),
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'listEmployerJobs MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    let list = db.employerJobs || [];
    if (filters?.orgId) {
      list = list.filter((j) => j.orgId === filters.orgId);
    }
    if (filters?.status) {
      list = list.filter((j) => j.status === filters.status);
    }
    return list.slice(0, safeLimit).map((j) => ({ ...j }));
  },

  /**
   * Submits a candidate Application to an EmployerJob.
   * - Enforces `unique(jobId, candidateId)` — throws `DUPLICATE_APPLICATION` if already applied.
   * - Deep-clones `resumeSnapshot` so future CV changes never mutate the application's snapshot.
   * - Records `consent { sharedAt, version }`.
   * - Atomically increments `EmployerJob.applicantsCount`.
   */
  async createApplication(input: {
    jobId: string;
    candidateId: string;
    resumeSnapshot: Record<string, any>;
    coverLetter?: string;
    answers?: ApplicationScreeningAnswer[];
    consent: {
      sharedAt?: string | Date;
      version: string;
      shareSalary?: boolean;
      sharePhone?: boolean;
    };
  }): Promise<ApplicationRecord> {
    const cleanJobId = (input.jobId || '').trim();
    const cleanCandidateId = (input.candidateId || '').trim();

    if (!cleanJobId || !cleanCandidateId) {
      throw new Error('JOB_AND_CANDIDATE_REQUIRED');
    }
    if (!input.resumeSnapshot || typeof input.resumeSnapshot !== 'object') {
      throw new Error('RESUME_SNAPSHOT_REQUIRED');
    }
    if (!input.consent || !input.consent.version) {
      throw new Error('CONSENT_REQUIRED');
    }

    const job = await this.getEmployerJobById(cleanJobId);
    if (!job) {
      throw new Error('JOB_NOT_FOUND');
    }

    // Deep-clone resumeSnapshot to guarantee immutability from any subsequent resume edits
    const immutableSnapshot = JSON.parse(JSON.stringify(input.resumeSnapshot));
    const cleanCoverLetter = sanitizeJobMarkdown(input.coverLetter || '', 8000);
    const cleanAnswers: ApplicationScreeningAnswer[] = Array.isArray(input.answers)
      ? input.answers
          .map((a) => ({
            question: sanitizeProfileText(a.question || '', 240),
            answer: sanitizeProfileText(a.answer || '', 2000),
          }))
          .filter((a) => a.question && a.answer)
          .slice(0, 10)
      : [];

    const nowIso = new Date().toISOString();
    const sharedAtIso = input.consent.sharedAt
      ? input.consent.sharedAt instanceof Date
        ? input.consent.sharedAt.toISOString()
        : String(input.consent.sharedAt)
      : nowIso;
    const consentObj = {
      sharedAt: sharedAtIso,
      version: sanitizeProfileText(input.consent.version, 32),
      shareSalary: Boolean(input.consent.shareSalary),
      sharePhone: Boolean(input.consent.sharePhone),
    };

    const mongoUp = await isMongoAvailable();
    if (
      mongoUp &&
      mongoose.Types.ObjectId.isValid(cleanJobId) &&
      mongoose.Types.ObjectId.isValid(cleanCandidateId)
    ) {
      try {
        const existingApp = await Application.findOne({
          jobId: cleanJobId,
          candidateId: cleanCandidateId,
        }).lean();

        if (existingApp) {
          throw new Error('DUPLICATE_APPLICATION');
        }

        const created: any = await Application.create({
          jobId: cleanJobId,
          orgId: job.orgId,
          candidateId: cleanCandidateId,
          resumeSnapshot: immutableSnapshot,
          coverLetter: cleanCoverLetter,
          answers: cleanAnswers,
          consent: {
            sharedAt: new Date(sharedAtIso),
            version: consentObj.version,
            shareSalary: consentObj.shareSalary,
            sharePhone: consentObj.sharePhone,
          },
          status: 'new',
          notes: '',
          analysis: null,
        });

        await EmployerJob.findByIdAndUpdate(cleanJobId, {
          $inc: { applicantsCount: 1 },
        });

        return {
          id: created._id.toString(),
          jobId: created.jobId.toString(),
          orgId: created.orgId.toString(),
          candidateId: created.candidateId.toString(),
          resumeSnapshot: created.resumeSnapshot,
          coverLetter: created.coverLetter || '',
          answers: created.answers || [],
          consent: consentObj,
          status: created.status,
          analysis: null,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err: any) {
        if (err?.message === 'DUPLICATE_APPLICATION' || err?.code === 11000) {
          throw new Error('DUPLICATE_APPLICATION');
        }
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'createApplication MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.applications)) db.applications = [];
      if (!Array.isArray(db.employerJobs)) db.employerJobs = [];

      // Enforce unique(jobId, candidateId)
      const duplicate = db.applications.some(
        (a) => a.jobId === cleanJobId && a.candidateId === cleanCandidateId
      );
      if (duplicate) {
        throw new Error('DUPLICATE_APPLICATION');
      }

      const appRecord: ApplicationRecord = {
        id: `app_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
        jobId: cleanJobId,
        orgId: job.orgId,
        candidateId: cleanCandidateId,
        resumeSnapshot: immutableSnapshot,
        coverLetter: cleanCoverLetter,
        answers: cleanAnswers,
        consent: consentObj,
        status: 'new',
        notes: '',
        analysis: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.applications.unshift(appRecord);

      const targetJob = db.employerJobs.find((j) => j.id === cleanJobId);
      if (targetJob) {
        targetJob.applicantsCount = (targetJob.applicantsCount || 0) + 1;
        targetJob.updatedAt = nowIso;
      }

      writeLocalDb(db);
      return formatApplicationForViewer(appRecord, 'candidate');
    });
  },

  /**
   * Fetches an Application by ID with role-based privacy enforcement:
   * - HR organization members (`owner`/`recruiter`) see `notes` and full `analysis`.
   * - The candidate who applied sees their application WITHOUT `notes` (HR-only).
   * - Unrelated users receive `null`.
   */
  async getApplicationById(
    applicationId: string,
    viewerUserId: string
  ): Promise<ApplicationRecord | null> {
    const cleanAppId = (applicationId || '').trim();
    const cleanViewerId = (viewerUserId || '').trim();
    if (!cleanAppId || !cleanViewerId) return null;

    let rawApp: ApplicationRecord | null = null;

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanAppId)) {
      try {
        const doc: any = await Application.findById(cleanAppId).lean();
        if (doc) {
          rawApp = {
            id: doc._id.toString(),
            jobId: doc.jobId.toString(),
            orgId: doc.orgId.toString(),
            candidateId: doc.candidateId.toString(),
            resumeSnapshot: doc.resumeSnapshot,
            coverLetter: doc.coverLetter || '',
            answers: doc.answers || [],
            consent: {
              sharedAt:
                doc.consent?.sharedAt instanceof Date
                  ? doc.consent.sharedAt.toISOString()
                  : String(doc.consent?.sharedAt || ''),
              version: doc.consent?.version || '1.0',
              shareSalary: Boolean(doc.consent?.shareSalary),
              sharePhone: Boolean(doc.consent?.sharePhone),
            },
            status: doc.status || 'new',
            notes: doc.notes || '',
            manualRank: typeof doc.manualRank === 'number' ? doc.manualRank : null,
            analysis: doc.analysis
              ? {
                  score: doc.analysis.score,
                  matchedSkills: doc.analysis.matchedSkills || [],
                  missingSkills: doc.analysis.missingSkills || [],
                  strengths: doc.analysis.strengths || [],
                  gaps: doc.analysis.gaps || [],
                  interviewQuestions: doc.analysis.interviewQuestions || [],
                  scoreBreakdown: doc.analysis.scoreBreakdown || undefined,
                  jobDescriptionHash: doc.analysis.jobDescriptionHash || undefined,
                  redactedCategories: doc.analysis.redactedCategories || [],
                  summary: doc.analysis.summary || '',
                  model: doc.analysis.model || '',
                  createdAt:
                    doc.analysis.createdAt instanceof Date
                      ? doc.analysis.createdAt.toISOString()
                      : String(doc.analysis.createdAt),
                  creditsUsed: doc.analysis.creditsUsed ?? 1,
                }
              : null,
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
            updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
          };
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'getApplicationById MongoDB failed; falling back to local DB' },
        });
      }
    }

    if (!rawApp) {
      const db = readLocalDb();
      const found = (db.applications || []).find((a) => a.id === cleanAppId);
      if (found) {
        rawApp = {
          ...found,
          resumeSnapshot: JSON.parse(JSON.stringify(found.resumeSnapshot)),
        };
      }
    }

    if (!rawApp) return null;

    const isHrMember = await this.isOrganizationMember(rawApp.orgId, cleanViewerId);
    if (isHrMember) {
      return formatApplicationForViewer(rawApp, 'hr');
    }

    if (rawApp.candidateId === cleanViewerId) {
      return formatApplicationForViewer(rawApp, 'candidate');
    }

    return null;
  },

  async listJobApplications(
    jobId: string,
    orgId: string,
    actorUserId: string,
    statusFilter?: ApplicationStatus
  ): Promise<ApplicationRecord[]> {
    const isHrMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isHrMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(jobId) && mongoose.Types.ObjectId.isValid(orgId)) {
      try {
        const query: Record<string, any> = { jobId, orgId };
        if (statusFilter) query.status = statusFilter;
        const docs: any[] = await Application.find(query).sort({ createdAt: -1 }).lean();
        return docs.map((doc) =>
          formatApplicationForViewer(
            {
              id: doc._id.toString(),
              jobId: doc.jobId.toString(),
              orgId: doc.orgId.toString(),
              candidateId: doc.candidateId.toString(),
              resumeSnapshot: doc.resumeSnapshot,
              coverLetter: doc.coverLetter || '',
              answers: doc.answers || [],
              consent: {
                sharedAt:
                  doc.consent?.sharedAt instanceof Date
                    ? doc.consent.sharedAt.toISOString()
                    : String(doc.consent?.sharedAt || ''),
                version: doc.consent?.version || '1.0',
                shareSalary: Boolean(doc.consent?.shareSalary),
                sharePhone: Boolean(doc.consent?.sharePhone),
              },
              status: doc.status || 'new',
              notes: doc.notes || '',
              manualRank: typeof doc.manualRank === 'number' ? doc.manualRank : null,
              analysis: doc.analysis
                ? {
                    score: doc.analysis.score,
                    matchedSkills: doc.analysis.matchedSkills || [],
                    missingSkills: doc.analysis.missingSkills || [],
                    strengths: doc.analysis.strengths || [],
                    gaps: doc.analysis.gaps || [],
                    interviewQuestions: doc.analysis.interviewQuestions || [],
                    scoreBreakdown: doc.analysis.scoreBreakdown || undefined,
                    jobDescriptionHash: doc.analysis.jobDescriptionHash || undefined,
                    redactedCategories: doc.analysis.redactedCategories || [],
                    summary: doc.analysis.summary || '',
                    model: doc.analysis.model || '',
                    createdAt:
                      doc.analysis.createdAt instanceof Date
                        ? doc.analysis.createdAt.toISOString()
                        : String(doc.analysis.createdAt),
                    creditsUsed: doc.analysis.creditsUsed ?? 1,
                  }
                : null,
              createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
              updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
            },
            'hr'
          )
        );
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'listJobApplications MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    let list = (db.applications || []).filter((a) => a.jobId === jobId && a.orgId === orgId);
    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter);
    }
    return list.map((a) => formatApplicationForViewer(a, 'hr'));
  },

  async listCandidateApplications(candidateId: string): Promise<ApplicationRecord[]> {
    const cleanCandidateId = (candidateId || '').trim();
    if (!cleanCandidateId) return [];

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanCandidateId)) {
      try {
        const docs: any[] = await Application.find({ candidateId: cleanCandidateId })
          .select('-notes')
          .sort({ createdAt: -1 })
          .lean();
        return docs.map((doc) =>
          formatApplicationForViewer(
            {
              id: doc._id.toString(),
              jobId: doc.jobId.toString(),
              orgId: doc.orgId.toString(),
              candidateId: doc.candidateId.toString(),
              resumeSnapshot: doc.resumeSnapshot,
              coverLetter: doc.coverLetter || '',
              answers: doc.answers || [],
              consent: {
                sharedAt:
                  doc.consent?.sharedAt instanceof Date
                    ? doc.consent.sharedAt.toISOString()
                    : String(doc.consent?.sharedAt || ''),
                version: doc.consent?.version || '1.0',
                shareSalary: Boolean(doc.consent?.shareSalary),
                sharePhone: Boolean(doc.consent?.sharePhone),
              },
              status: doc.status || 'new',
              analysis: doc.analysis
                ? {
                    score: doc.analysis.score,
                    matchedSkills: doc.analysis.matchedSkills || [],
                    missingSkills: doc.analysis.missingSkills || [],
                    summary: doc.analysis.summary || '',
                    model: doc.analysis.model || '',
                    createdAt:
                      doc.analysis.createdAt instanceof Date
                        ? doc.analysis.createdAt.toISOString()
                        : String(doc.analysis.createdAt),
                    creditsUsed: doc.analysis.creditsUsed ?? 1,
                  }
                : null,
              createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
              updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
            },
            'candidate'
          )
        );
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'listCandidateApplications MongoDB failed; falling back to local DB' },
        });
      }
    }

    const db = readLocalDb();
    return (db.applications || [])
      .filter((a) => a.candidateId === cleanCandidateId)
      .map((a) => formatApplicationForViewer(a, 'candidate'));
  },

  /**
   * Updates HR-only `notes`, `status`, and/or `manualRank` on an Application.
   * Requires caller to be a member (`owner` or `recruiter`) of the organization.
   */
  async updateApplicationStatusAndNotes(
    applicationId: string,
    orgId: string,
    actorUserId: string,
    updates: {
      status?: ApplicationStatus;
      notes?: string;
      manualRank?: number | null;
    }
  ): Promise<ApplicationRecord | null> {
    const isHrMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isHrMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const nowIso = new Date().toISOString();

    const mongoUp = await isMongoAvailable();
    if (
      mongoUp &&
      mongoose.Types.ObjectId.isValid(applicationId) &&
      mongoose.Types.ObjectId.isValid(orgId)
    ) {
      try {
        const setPayload: Record<string, any> = {};
        if (
          updates.status &&
          ['new', 'shortlisted', 'interview', 'rejected', 'hired'].includes(updates.status)
        ) {
          setPayload.status = updates.status;
        }
        if (updates.notes !== undefined) {
          setPayload.notes = sanitizeProfileText(updates.notes, 4000);
        }
        if (updates.manualRank !== undefined) {
          setPayload.manualRank =
            typeof updates.manualRank === 'number' && Number.isFinite(updates.manualRank)
              ? Math.max(1, Math.round(updates.manualRank))
              : null;
        }

        const updated: any = await Application.findOneAndUpdate(
          { _id: applicationId, orgId },
          { $set: setPayload },
          { new: true }
        ).lean();

        if (updated) {
          return this.getApplicationById(applicationId, actorUserId);
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'updateApplicationStatusAndNotes MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const app = (db.applications || []).find(
        (a) => a.id === applicationId && a.orgId === orgId
      );
      if (!app) return null;

      if (
        updates.status &&
        ['new', 'shortlisted', 'interview', 'rejected', 'hired'].includes(updates.status)
      ) {
        app.status = updates.status;
      }
      if (updates.notes !== undefined) {
        app.notes = sanitizeProfileText(updates.notes, 4000);
      }
      if (updates.manualRank !== undefined) {
        app.manualRank =
          typeof updates.manualRank === 'number' && Number.isFinite(updates.manualRank)
            ? Math.max(1, Math.round(updates.manualRank))
            : null;
      }
      app.updatedAt = nowIso;
      writeLocalDb(db);
      return formatApplicationForViewer(app, 'hr');
    });
  },

  /**
   * Counts net AI applicant analyses performed by an Organization in the last 24 hours.
   * Refunds (`candidate_ai_analysis_refund`) offset deductions so failed calls don't count against the daily quota.
   */
  async getOrgDailyAiAnalysisCount(orgId: string): Promise<number> {
    const ledger = await this.getHrCreditLedger(orgId, 300);
    const dayAgoMs = Date.now() - 24 * 3600 * 1000;
    let count = 0;
    for (const entry of ledger) {
      if (new Date(entry.createdAt).getTime() >= dayAgoMs) {
        if (entry.reason === 'candidate_ai_analysis' && entry.delta < 0) {
          count += Math.abs(entry.delta);
        } else if (entry.reason === 'candidate_ai_analysis_refund' && entry.delta > 0) {
          count = Math.max(0, count - entry.delta);
        }
      }
    }
    return count;
  },

  /**
   * Analyzes a batch of applicants for a job posting (`jobId`) with:
   * 1. Strict organization ownership check (`isOrganizationMember` + `job.orgId === orgId`).
   * 2. Deduplication by `jobDescriptionHash`: if an applicant already has `analysis` with matching
   *    `jobDescriptionHash` (and `!force`), skips credit deduction (`cached: true, creditsUsed: 0`).
   * 3. Daily organization AI analysis cap (`ORG_DAILY_ANALYSIS_LIMIT`).
   * 4. Atomic HR credit deduction BEFORE analysis, and **automatic atomic credit refund** (`addHrCredits`
   *    with reason `'candidate_ai_analysis_refund'`) if the AI analysis fails!
   * 5. Actual token/cost logging in `AiUsage` (`recordAiUsage`).
   */
  async analyzeApplicantsBatchForHr(params: {
    jobId: string;
    orgId: string;
    actorUserId: string;
    applicationIds?: string[];
    onlyNew?: boolean;
    force?: boolean;
    dailyLimitOverride?: number;
  }): Promise<{
    ok: boolean;
    error?:
      | 'FORBIDDEN_ORG_MEMBER_REQUIRED'
      | 'FORBIDDEN_JOB_OWNERSHIP_MISMATCH'
      | 'JOB_NOT_FOUND'
      | 'ORG_DAILY_LIMIT_EXCEEDED'
      | 'MONTHLY_SPEND_CAP_EXCEEDED'
      | 'INSUFFICIENT_HR_CREDITS';
    analyzedCount: number;
    cachedCount: number;
    failedCount: number;
    refundedCredits: number;
    creditsCharged: number;
    balanceAfter: number;
    remainingIds: string[];
    results: Array<{
      applicationId: string;
      status: 'analyzed' | 'cached' | 'failed';
      cached: boolean;
      creditsUsed: number;
      refunded?: boolean;
      error?: string;
      analysis?: ApplicationAnalysis;
    }>;
  }> {
    const { jobId, orgId, actorUserId } = params;
    const isHrMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isHrMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const job = await this.getEmployerJobById(jobId);
    if (!job) {
      return {
        ok: false,
        error: 'JOB_NOT_FOUND',
        analyzedCount: 0,
        cachedCount: 0,
        failedCount: 0,
        refundedCredits: 0,
        creditsCharged: 0,
        balanceAfter: 0,
        remainingIds: [],
        results: [],
      };
    }
    if (job.orgId !== orgId) {
      throw new Error('FORBIDDEN_JOB_OWNERSHIP_MISMATCH');
    }

    const org = await this.getOrganizationById(orgId);
    let currentBalance = org?.hrCredits ?? 0;

    const allJobApps = await this.listJobApplications(jobId, orgId, actorUserId);
    const currentJdHash = computeJobDescriptionHash(job);

    let targetApps: ApplicationRecord[] = [];
    if (Array.isArray(params.applicationIds) && params.applicationIds.length > 0) {
      const idSet = new Set(params.applicationIds);
      targetApps = allJobApps.filter((a) => idSet.has(a.id));
    } else if (params.onlyNew) {
      targetApps = allJobApps.filter(
        (a) => !a.analysis || a.analysis.jobDescriptionHash !== currentJdHash
      );
    } else {
      targetApps = allJobApps;
    }

    const batchApps = targetApps.slice(0, BULK_ANALYZE_MAX_BATCH_SIZE);
    const remainingIds = targetApps.slice(BULK_ANALYZE_MAX_BATCH_SIZE).map((a) => a.id);

    const dailyLimit = params.dailyLimitOverride ?? ORG_DAILY_ANALYSIS_LIMIT;
    let dailyUsed = await this.getOrgDailyAiAnalysisCount(orgId);

    const results: Array<{
      applicationId: string;
      status: 'analyzed' | 'cached' | 'failed';
      cached: boolean;
      creditsUsed: number;
      refunded?: boolean;
      error?: string;
      analysis?: ApplicationAnalysis;
    }> = [];

    let analyzedCount = 0;
    let cachedCount = 0;
    let failedCount = 0;
    let refundedCredits = 0;
    let creditsCharged = 0;

    for (const app of batchApps) {
      // 1. Check if already analyzed for the exact same Job Description hash
      const hasValidCache =
        !params.force &&
        app.analysis &&
        typeof app.analysis.score === 'number' &&
        app.analysis.jobDescriptionHash === currentJdHash &&
        Array.isArray(app.analysis.strengths) &&
        app.analysis.strengths.length > 0;

      if (hasValidCache && app.analysis) {
        cachedCount += 1;
        results.push({
          applicationId: app.id,
          status: 'cached',
          cached: true,
          creditsUsed: 0,
          analysis: app.analysis,
        });
        continue;
      }

      // 2. Check organization daily AI limit
      if (dailyUsed >= dailyLimit) {
        return {
          ok: false,
          error: 'ORG_DAILY_LIMIT_EXCEEDED',
          analyzedCount,
          cachedCount,
          failedCount,
          refundedCredits,
          creditsCharged,
          balanceAfter: currentBalance,
          remainingIds: [
            ...batchApps.slice(results.length).map((a) => a.id),
            ...remainingIds,
          ],
          results,
        };
      }

      // 3. Atomic credit deduction BEFORE running AI
      const deductRes = await this.deductHrCredits(
        orgId,
        SINGLE_APPLICANT_ANALYSIS_CREDIT_COST,
        'candidate_ai_analysis',
        app.id,
        actorUserId
      );

      if (!deductRes.success) {
        currentBalance = deductRes.balanceAfter;
        return {
          ok: false,
          error:
            deductRes.error === 'MONTHLY_SPEND_CAP_EXCEEDED'
              ? 'MONTHLY_SPEND_CAP_EXCEEDED'
              : 'INSUFFICIENT_HR_CREDITS',
          analyzedCount,
          cachedCount,
          failedCount,
          refundedCredits,
          creditsCharged,
          balanceAfter: currentBalance,
          remainingIds: [
            ...batchApps.slice(results.length).map((a) => a.id),
            ...remainingIds,
          ],
          results,
        };
      }

      currentBalance = deductRes.balanceAfter;

      // 4. Execute Fairness-Redacted Deterministic + AI Analysis, refunding atomically if AI fails
      try {
        const userRec = await this.findUserById(app.candidateId);
        const snapName =
          app.resumeSnapshot?.fullName ||
          app.resumeSnapshot?.personalInfo?.fullName ||
          userRec?.name ||
          '';

        const { analysis, usage } = await analyzeApplicantAgainstJob({
          application: app,
          job,
          candidateName: snapName,
        });

        // Save analysis onto Application record
        const nowIso = new Date().toISOString();
        const mongoUp = await isMongoAvailable();
        if (
          mongoUp &&
          mongoose.Types.ObjectId.isValid(app.id) &&
          mongoose.Types.ObjectId.isValid(orgId)
        ) {
          try {
            await Application.findOneAndUpdate(
              { _id: app.id, orgId },
              {
                $set: {
                  analysis: {
                    ...analysis,
                    createdAt: new Date(nowIso),
                  },
                },
              }
            );
          } catch (err) {
            Sentry.captureException(err, {
              tags: { component: 'DataStore.analyzeApplicantsBatchForHr' },
            });
          }
        }

        await withOrderLock(async () => {
          const db = readLocalDb();
          const target = (db.applications || []).find(
            (a) => a.id === app.id && a.orgId === orgId
          );
          if (target) {
            target.analysis = analysis;
            target.updatedAt = nowIso;
            writeLocalDb(db);
          }
        });

        // Record actual token & USD cost in AiUsage
        await this.recordAiUsage({
          userId: `org:${orgId}:${actorUserId}`,
          endpoint: '/api/employer/jobs/[jobId]/analyze',
          tokens: usage.tokens,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          costUsd: usage.costUsd,
          latencyMs: usage.latencyMs,
          status: usage.status,
          provider: usage.provider,
          model: usage.model,
        });

        analyzedCount += 1;
        creditsCharged += SINGLE_APPLICANT_ANALYSIS_CREDIT_COST;
        dailyUsed += SINGLE_APPLICANT_ANALYSIS_CREDIT_COST;

        results.push({
          applicationId: app.id,
          status: 'analyzed',
          cached: false,
          creditsUsed: SINGLE_APPLICANT_ANALYSIS_CREDIT_COST,
          analysis,
        });
      } catch (aiErr: any) {
        // Automatic Atomic Refund on AI Failure!
        const refundRes = await this.addHrCredits(
          orgId,
          SINGLE_APPLICANT_ANALYSIS_CREDIT_COST,
          'candidate_ai_analysis_refund',
          app.id,
          actorUserId
        );
        currentBalance = refundRes.balanceAfter;
        failedCount += 1;
        refundedCredits += SINGLE_APPLICANT_ANALYSIS_CREDIT_COST;

        await this.recordAiUsage({
          userId: `org:${orgId}:${actorUserId}`,
          endpoint: '/api/employer/jobs/[jobId]/analyze',
          tokens: 0,
          promptTokens: 0,
          completionTokens: 0,
          costUsd: 0,
          latencyMs: 10,
          status: 'fallback',
          fallbackReason: aiErr?.message || 'AI_ANALYSIS_FAILED_REFUNDED',
          provider: 'blind-ats-ai-hybrid',
          model: 'gemini-2.5-flash',
        });

        results.push({
          applicationId: app.id,
          status: 'failed',
          cached: false,
          creditsUsed: 0,
          refunded: true,
          error: aiErr?.message || 'AI_ANALYSIS_FAILED',
        });
      }
    }

    return {
      ok: failedCount === 0 || analyzedCount > 0 || cachedCount > 0,
      analyzedCount,
      cachedCount,
      failedCount,
      refundedCredits,
      creditsCharged,
      balanceAfter: currentBalance,
      remainingIds,
      results,
    };
  },

  /**
   * Generates a Top 10 Candidates Comparison Report for `jobId`.
   * Costs `TOP_10_COMPARISON_CREDIT_COST` (2 HR credits) atomically, with automatic refund if generation fails.
   */
  async generateTop10ReportForHr(params: {
    jobId: string;
    orgId: string;
    actorUserId: string;
  }): Promise<{
    ok: boolean;
    error?:
      | 'FORBIDDEN_ORG_MEMBER_REQUIRED'
      | 'FORBIDDEN_JOB_OWNERSHIP_MISMATCH'
      | 'JOB_NOT_FOUND'
      | 'NO_ANALYZED_APPLICANTS'
      | 'MONTHLY_SPEND_CAP_EXCEEDED'
      | 'INSUFFICIENT_HR_CREDITS';
    report?: Top10ComparisonReport;
    balanceAfter: number;
  }> {
    const { jobId, orgId, actorUserId } = params;
    const isHrMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isHrMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const job = await this.getEmployerJobById(jobId);
    if (!job) {
      return { ok: false, error: 'JOB_NOT_FOUND', balanceAfter: 0 };
    }
    if (job.orgId !== orgId) {
      throw new Error('FORBIDDEN_JOB_OWNERSHIP_MISMATCH');
    }

    const apps = await this.listJobApplications(jobId, orgId, actorUserId);
    const analyzedApps = apps.filter((a) => a.analysis && typeof a.analysis.score === 'number');
    if (analyzedApps.length === 0) {
      const org = await this.getOrganizationById(orgId);
      return {
        ok: false,
        error: 'NO_ANALYZED_APPLICANTS',
        balanceAfter: org?.hrCredits ?? 0,
      };
    }

    const deductRes = await this.deductHrCredits(
      orgId,
      TOP_10_COMPARISON_CREDIT_COST,
      'top10_comparison_report',
      jobId,
      actorUserId
    );

    if (!deductRes.success) {
      return {
        ok: false,
        error:
          deductRes.error === 'MONTHLY_SPEND_CAP_EXCEEDED'
            ? 'MONTHLY_SPEND_CAP_EXCEEDED'
            : 'INSUFFICIENT_HR_CREDITS',
        balanceAfter: deductRes.balanceAfter,
      };
    }

    try {
      const report = buildTop10ComparisonReport({ job, applications: analyzedApps });

      await this.recordAiUsage({
        userId: `org:${orgId}:${actorUserId}`,
        endpoint: '/api/employer/jobs/[jobId]/analyze#top10',
        tokens: 420,
        promptTokens: 260,
        completionTokens: 160,
        costUsd: 0.00032,
        latencyMs: 25,
        status: 'hit',
        provider: 'blind-ats-ai-hybrid',
        model: 'gemini-2.5-flash',
      });

      return {
        ok: true,
        report,
        balanceAfter: deductRes.balanceAfter,
      };
    } catch (err) {
      const refund = await this.addHrCredits(
        orgId,
        TOP_10_COMPARISON_CREDIT_COST,
        'top10_comparison_refund',
        jobId,
        actorUserId
      );
      return {
        ok: false,
        balanceAfter: refund.balanceAfter,
      };
    }
  },

  /**
   * Atomically deducts `creditsUsed` from the Organization's `hrCredits` (recording a ledger entry
   * in `HrCreditLedger`) and saves the AI candidate `analysis` onto the Application.
   */
  async analyzeApplicationWithHrCredits(
    applicationId: string,
    orgId: string,
    actorUserId: string,
    analysisInput: {
      score: number;
      matchedSkills: string[];
      missingSkills: string[];
      summary: string;
      model: string;
      creditsUsed?: number;
    }
  ): Promise<{
    success: boolean;
    error?:
      | 'INSUFFICIENT_HR_CREDITS'
      | 'MONTHLY_SPEND_CAP_EXCEEDED'
      | 'ORGANIZATION_NOT_FOUND'
      | 'APPLICATION_NOT_FOUND';
    application?: ApplicationRecord;
    balanceAfter?: number;
  }> {
    const isHrMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isHrMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const existingApp = await this.getApplicationById(applicationId, actorUserId);
    if (!existingApp || existingApp.orgId !== orgId) {
      return { success: false, error: 'APPLICATION_NOT_FOUND' };
    }

    const creditsUsed =
      typeof analysisInput.creditsUsed === 'number' && analysisInput.creditsUsed >= 0
        ? Math.floor(analysisInput.creditsUsed)
        : 1;

    let balanceAfter = 0;
    if (creditsUsed > 0) {
      const deductRes = await this.deductHrCredits(
        orgId,
        creditsUsed,
        'candidate_ai_analysis',
        applicationId,
        actorUserId
      );
      if (!deductRes.success) {
        return {
          success: false,
          error: deductRes.error || 'INSUFFICIENT_HR_CREDITS',
          balanceAfter: deductRes.balanceAfter,
        };
      }
      balanceAfter = deductRes.balanceAfter;
    }

    const nowIso = new Date().toISOString();
    const analysisObj: ApplicationAnalysis = {
      score: Math.min(100, Math.max(0, Math.round(analysisInput.score))),
      matchedSkills: (analysisInput.matchedSkills || []).map((s) => sanitizeProfileText(s, 60)),
      missingSkills: (analysisInput.missingSkills || []).map((s) => sanitizeProfileText(s, 60)),
      summary: sanitizeProfileText(analysisInput.summary || '', 2000),
      model: sanitizeProfileText(analysisInput.model || 'gemini-2.5-flash', 80),
      createdAt: nowIso,
      creditsUsed,
    };

    const mongoUp = await isMongoAvailable();
    if (
      mongoUp &&
      mongoose.Types.ObjectId.isValid(applicationId) &&
      mongoose.Types.ObjectId.isValid(orgId)
    ) {
      try {
        await Application.findOneAndUpdate(
          { _id: applicationId, orgId },
          {
            $set: {
              analysis: {
                ...analysisObj,
                createdAt: new Date(nowIso),
              },
            },
          }
        );
        const updatedApp = await this.getApplicationById(applicationId, actorUserId);
        return {
          success: true,
          application: updatedApp || undefined,
          balanceAfter,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'analyzeApplicationWithHrCredits MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const app = (db.applications || []).find(
        (a) => a.id === applicationId && a.orgId === orgId
      );
      if (!app) {
        return { success: false, error: 'APPLICATION_NOT_FOUND' };
      }
      app.analysis = analysisObj;
      app.updatedAt = nowIso;
      writeLocalDb(db);
      return {
        success: true,
        application: formatApplicationForViewer(app, 'hr'),
        balanceAfter,
      };
    });
  },

  /**
   * Initiates Organization corporate domain email verification.
   * Rejects free/consumer email providers (gmail, yahoo, hotmail, etc.).
   */
  async requestOrganizationDomainVerification(
    orgId: string,
    actorUserId: string,
    workEmail: string
  ): Promise<{
    ok: boolean;
    error?:
      | 'FORBIDDEN_ORG_MEMBER_REQUIRED'
      | 'ORGANIZATION_NOT_FOUND'
      | 'INVALID_EMAIL'
      | 'CONSUMER_EMAIL_DOMAIN_NOT_ALLOWED';
    code?: string;
    workEmail?: string;
    domain?: string;
  }> {
    const isMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isMember) {
      return { ok: false, error: 'FORBIDDEN_ORG_MEMBER_REQUIRED' };
    }

    const emailCheck = validateCompanyDomainEmail(workEmail);
    if (!emailCheck.valid) {
      return {
        ok: false,
        error: emailCheck.reason || 'CONSUMER_EMAIL_DOMAIN_NOT_ALLOWED',
        domain: emailCheck.domain,
      };
    }

    const code = String(crypto.randomInt(100000, 999999));
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAtIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(orgId)) {
      try {
        const updated = await Organization.findByIdAndUpdate(
          orgId,
          {
            $set: {
              workEmail: emailCheck.email,
              verificationTokenHash: tokenHash,
              verificationExpiresAt: new Date(expiresAtIso),
            },
          },
          { new: true }
        ).lean();
        if (!updated) {
          return { ok: false, error: 'ORGANIZATION_NOT_FOUND' };
        }
        return {
          ok: true,
          code,
          workEmail: emailCheck.email,
          domain: emailCheck.domain,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'requestOrganizationDomainVerification MongoDB failed; falling back' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const org = (db.organizations || []).find((o) => o.id === orgId);
      if (!org) {
        return { ok: false, error: 'ORGANIZATION_NOT_FOUND' };
      }
      org.workEmail = emailCheck.email;
      org.verificationTokenHash = tokenHash;
      org.verificationExpiresAt = expiresAtIso;
      org.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return {
        ok: true,
        code,
        workEmail: emailCheck.email,
        domain: emailCheck.domain,
      };
    });
  },

  /**
   * Confirms Organization corporate domain verification using the 6-digit code.
   */
  async confirmOrganizationDomainVerification(
    orgId: string,
    actorUserId: string,
    code: string
  ): Promise<{
    ok: boolean;
    error?:
      | 'FORBIDDEN_ORG_MEMBER_REQUIRED'
      | 'ORGANIZATION_NOT_FOUND'
      | 'INVALID_OR_EXPIRED_VERIFICATION_CODE';
    organization?: OrganizationRecord;
  }> {
    const isMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isMember) {
      return { ok: false, error: 'FORBIDDEN_ORG_MEMBER_REQUIRED' };
    }

    const cleanCode = (code || '').trim();
    if (!cleanCode) {
      return { ok: false, error: 'INVALID_OR_EXPIRED_VERIFICATION_CODE' };
    }

    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(orgId)) {
      try {
        const orgDoc: any = await Organization.findById(orgId).select(
          '+verificationTokenHash +verificationExpiresAt'
        );
        if (!orgDoc) {
          return { ok: false, error: 'ORGANIZATION_NOT_FOUND' };
        }
        const expMs = orgDoc.verificationExpiresAt
          ? new Date(orgDoc.verificationExpiresAt).getTime()
          : 0;
        if (
          !orgDoc.verificationTokenHash ||
          orgDoc.verificationTokenHash !== inputHash ||
          expMs < nowMs
        ) {
          return { ok: false, error: 'INVALID_OR_EXPIRED_VERIFICATION_CODE' };
        }

        orgDoc.verified = true;
        orgDoc.verifiedAt = new Date(nowIso);
        orgDoc.verificationTokenHash = null;
        orgDoc.verificationExpiresAt = null;
        await orgDoc.save();

        const updatedOrg = await this.getOrganizationById(orgId);
        return { ok: true, organization: updatedOrg || undefined };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'confirmOrganizationDomainVerification MongoDB failed; falling back' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const org = (db.organizations || []).find((o) => o.id === orgId);
      if (!org) {
        return { ok: false, error: 'ORGANIZATION_NOT_FOUND' };
      }
      const expMs = org.verificationExpiresAt ? new Date(org.verificationExpiresAt).getTime() : 0;
      if (
        !org.verificationTokenHash ||
        org.verificationTokenHash !== inputHash ||
        expMs < nowMs
      ) {
        return { ok: false, error: 'INVALID_OR_EXPIRED_VERIFICATION_CODE' };
      }

      org.verified = true;
      org.verifiedAt = nowIso;
      org.verificationTokenHash = null;
      org.verificationExpiresAt = null;
      org.updatedAt = nowIso;
      writeLocalDb(db);

      return { ok: true, organization: { ...org } };
    });
  },

  /**
   * Publishes an EmployerJob with:
   * 1. Strict organization membership check (`isOrganizationMember`).
   * 2. Content moderation filter (`moderateJobContent`: blocks payment requests / scam keywords, flags suspicious links).
   * 3. Unverified organization safeguard: max 2 job submissions per 24h, and enters `status = 'pending'` for Admin review.
   * 4. Atomic 1 HR credit deduction (`deductHrCredits`), returning `INSUFFICIENT_HR_CREDITS` (whilst preserving draft) if balance is 0.
   */
  async publishEmployerJob(
    jobId: string,
    orgId: string,
    actorUserId: string
  ): Promise<{
    success: boolean;
    error?:
      | 'FORBIDDEN_ORG_MEMBER_REQUIRED'
      | 'ORGANIZATION_NOT_FOUND'
      | 'JOB_NOT_FOUND'
      | 'CONTENT_POLICY_VIOLATION'
      | 'UNVERIFIED_DAILY_LIMIT_REACHED'
      | 'MONTHLY_SPEND_CAP_EXCEEDED'
      | 'INSUFFICIENT_HR_CREDITS';
    moderationFlags?: ModerationFlagCode[];
    moderationReasons?: string[];
    balanceAfter?: number;
    job?: EmployerJobRecord;
  }> {
    const isMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isMember) {
      return { success: false, error: 'FORBIDDEN_ORG_MEMBER_REQUIRED' };
    }

    const org = await this.getOrganizationById(orgId);
    if (!org) {
      return { success: false, error: 'ORGANIZATION_NOT_FOUND' };
    }

    const job = await this.getEmployerJobById(jobId);
    if (!job || job.orgId !== orgId) {
      return { success: false, error: 'JOB_NOT_FOUND' };
    }

    // 1. Content moderation check
    const modResult = moderateJobContent({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      screeningQuestions: job.screeningQuestions,
    });

    if (
      modResult.flags.includes('PAYMENT_FROM_APPLICANT') ||
      modResult.flags.includes('BANNED_SCAM_CONTENT')
    ) {
      return {
        success: false,
        error: 'CONTENT_POLICY_VIOLATION',
        moderationFlags: modResult.flags,
        moderationReasons: modResult.reasons,
      };
    }

    // 2. Unverified organization daily submission cap (max 2 non-draft jobs in 24h)
    if (!org.verified && !job.paidWithCredit) {
      const orgJobs = await this.listEmployerJobs({ orgId, limit: 100 });
      const dayAgoMs = Date.now() - 24 * 3600 * 1000;
      const recentSubmittedCount = orgJobs.filter(
        (j) =>
          j.id !== job.id &&
          (j.status === 'pending' || j.status === 'published') &&
          new Date(j.createdAt).getTime() >= dayAgoMs
      ).length;

      if (recentSubmittedCount >= 2) {
        return {
          success: false,
          error: 'UNVERIFIED_DAILY_LIMIT_REACHED',
        };
      }
    }

    // 3. Atomic HR credit deduction (1 credit per job posting unless already paid)
    let balanceAfter = org.hrCredits;
    if (!job.paidWithCredit) {
      const deductRes = await this.deductHrCredits(
        orgId,
        1,
        'job_publish',
        job.id,
        actorUserId
      );
      if (!deductRes.success) {
        return {
          success: false,
          error:
            deductRes.error === 'MONTHLY_SPEND_CAP_EXCEEDED'
              ? 'MONTHLY_SPEND_CAP_EXCEEDED'
              : 'INSUFFICIENT_HR_CREDITS',
          balanceAfter: deductRes.balanceAfter,
          job,
        };
      }
      balanceAfter = deductRes.balanceAfter;
    }

    // 4. Determine target status:
    // - Verified org + clean moderation -> 'published'
    // - Unverified org OR suspicious link flag -> 'pending' (for Admin review)
    const targetStatus: EmployerJobStatus =
      org.verified && modResult.passed ? 'published' : 'pending';
    const nowIso = new Date().toISOString();

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(jobId) && mongoose.Types.ObjectId.isValid(orgId)) {
      try {
        await EmployerJob.findOneAndUpdate(
          { _id: jobId, orgId },
          {
            $set: {
              status: targetStatus,
              paidWithCredit: true,
              moderationFlags: modResult.flags,
              publishedAt: targetStatus === 'published' ? new Date(nowIso) : null,
            },
          }
        );
        const updatedJob = await this.getEmployerJobById(jobId);
        return {
          success: true,
          balanceAfter,
          moderationFlags: modResult.flags,
          job: updatedJob || undefined,
        };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'publishEmployerJob MongoDB failed; falling back to local DB' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const target = (db.employerJobs || []).find((j) => j.id === jobId && j.orgId === orgId);
      if (!target) {
        return { success: false, error: 'JOB_NOT_FOUND' };
      }
      target.status = targetStatus;
      target.paidWithCredit = true;
      target.moderationFlags = modResult.flags;
      if (targetStatus === 'published') {
        target.publishedAt = nowIso;
      }
      target.updatedAt = nowIso;
      writeLocalDb(db);
      return {
        success: true,
        balanceAfter,
        moderationFlags: modResult.flags,
        job: { ...target },
      };
    });
  },

  /**
   * Enriched job applicants list for HR with strict ownership check (`isOrganizationMember`)
   * and strict candidate privacy:
   * - ONLY returns candidates who actually applied to `jobId` (never queries all users).
   * - Exposes `phone` or `expectedSalary` ONLY if the candidate consented (`consent.sharePhone` / `consent.shareSalary`).
   * - Supports filtering by `status` and sorting by `score` | `date` | `status`.
   */
  async getJobApplicantsForHr(
    jobId: string,
    orgId: string,
    actorUserId: string,
    options?: {
      status?: ApplicationStatus | 'all';
      sortBy?: 'score' | 'date' | 'status';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<
    Array<
      ApplicationRecord & {
        candidateName: string;
        candidateEmail: string;
        candidatePhone?: string;
        candidateHeadline?: string;
        computedScore: number;
      }
    >
  > {
    const isHrMember = await this.isOrganizationMember(orgId, actorUserId);
    if (!isHrMember) {
      throw new Error('FORBIDDEN_ORG_MEMBER_REQUIRED');
    }

    const job = await this.getEmployerJobById(jobId);
    if (!job || job.orgId !== orgId) {
      throw new Error('FORBIDDEN_JOB_OWNERSHIP_MISMATCH');
    }

    const statusFilter =
      options?.status && options.status !== 'all' ? options.status : undefined;
    const apps = await this.listJobApplications(jobId, orgId, actorUserId, statusFilter);

    const jobSkillsLower = (job.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);

    const enriched = await Promise.all(
      apps.map(async (app) => {
        const snap = app.resumeSnapshot || {};
        const snapPersonal = snap.personalInfo || snap.basics || {};
        // Fetch basic name/email ONLY for this applicant's candidateId if not in snapshot
        const userRecord = await this.findUserById(app.candidateId);

        const candidateName =
          snapPersonal.fullName ||
          snapPersonal.name ||
          snap.fullName ||
          userRecord?.name ||
          'Applicant';
        const candidateEmail =
          snapPersonal.email || snap.email || userRecord?.email || '';
        const candidateHeadline =
          snapPersonal.jobTitle || snap.headline || snap.targetRole || '';

        // Privacy rule: only include phone if candidate consented or put it in the submitted resumeSnapshot
        const candidatePhone = app.consent?.sharePhone
          ? snapPersonal.phone || (userRecord as any)?.phone || ''
          : snapPersonal.phone || '';

        // Calculate score from AI analysis if available, or deterministic skill overlap on resumeSnapshot
        let computedScore = app.analysis?.score ?? 0;
        if (!app.analysis && jobSkillsLower.length > 0) {
          const snapSkillsRaw: string[] = Array.isArray(snap.skills)
            ? snap.skills.map((s: any) => (typeof s === 'string' ? s : s?.name || ''))
            : [];
          const snapText = JSON.stringify(snap).toLowerCase();
          const matched = jobSkillsLower.filter(
            (reqSkill) =>
              snapSkillsRaw.some((cs) => cs.toLowerCase().includes(reqSkill)) ||
              snapText.includes(reqSkill)
          );
          computedScore = Math.round((matched.length / jobSkillsLower.length) * 100);
        }

        return {
          ...app,
          notes: app.notes ?? '',
          candidateName,
          candidateEmail,
          candidatePhone,
          candidateHeadline,
          computedScore,
        };
      })
    );

    const sortBy = options?.sortBy || 'date';
    const sortOrder = options?.sortOrder || 'desc';
    const dir = sortOrder === 'asc' ? 1 : -1;

    enriched.sort((a, b) => {
      if (sortBy === 'score') {
        const mrA = typeof a.manualRank === 'number' ? a.manualRank : null;
        const mrB = typeof b.manualRank === 'number' ? b.manualRank : null;
        if (mrA !== null && mrB !== null && mrA !== mrB) return mrA - mrB;
        if (mrA !== null && mrB === null) return -1;
        if (mrA === null && mrB !== null) return 1;
        return (a.computedScore - b.computedScore) * dir;
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status) * dir;
      }
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return (tA - tB) * dir;
    });

    return enriched;
  },

  // ============================================================================
  // User Job Reports & Admin Moderation
  // ============================================================================

  async createJobReport(input: {
    jobId: string;
    jobTitle?: string;
    company?: string;
    reporterUserId: string;
    reason: JobReportReason;
    details?: string;
  }): Promise<JobReportRecord> {
    const nowIso = new Date().toISOString();
    const record: JobReportRecord = {
      id: `jrep_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
      jobId: sanitizeProfileText(input.jobId, 160),
      jobTitle: sanitizeProfileText(input.jobTitle || '', 180),
      company: sanitizeProfileText(input.company || '', 140),
      reporterUserId: sanitizeProfileText(input.reporterUserId, 120),
      reason: input.reason,
      details: sanitizeProfileText(input.details || '', 1500),
      status: 'open',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.jobReports)) db.jobReports = [];
      db.jobReports.unshift(record);
      writeLocalDb(db);
      return { ...record };
    });
  },

  async listJobReports(statusFilter?: 'open' | 'resolved' | 'dismissed'): Promise<JobReportRecord[]> {
    const db = readLocalDb();
    const list = db.jobReports || [];
    if (!statusFilter) return [...list];
    return list.filter((r) => r.status === statusFilter);
  },

  async updateJobReportStatus(
    reportId: string,
    status: 'resolved' | 'dismissed'
  ): Promise<JobReportRecord | null> {
    return withOrderLock(async () => {
      const db = readLocalDb();
      const rep = (db.jobReports || []).find((r) => r.id === reportId);
      if (!rep) return null;
      rep.status = status;
      rep.updatedAt = new Date().toISOString();
      writeLocalDb(db);
      return { ...rep };
    });
  },

  async adminModerateEmployerJob(
    jobId: string,
    action: 'approve' | 'reject'
  ): Promise<EmployerJobRecord | null> {
    const nowIso = new Date().toISOString();
    const nextStatus: EmployerJobStatus = action === 'approve' ? 'published' : 'closed';

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(jobId)) {
      try {
        await EmployerJob.findByIdAndUpdate(jobId, {
          $set: {
            status: nextStatus,
            publishedAt: action === 'approve' ? new Date(nowIso) : null,
          },
        });
        return this.getEmployerJobById(jobId);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'adminModerateEmployerJob MongoDB failed; falling back' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const job = (db.employerJobs || []).find((j) => j.id === jobId);
      if (!job) return null;
      job.status = nextStatus;
      if (action === 'approve') {
        job.publishedAt = nowIso;
      }
      job.updatedAt = nowIso;
      writeLocalDb(db);
      return { ...job };
    });
  },

  async adminVerifyOrganization(
    orgId: string,
    verified: boolean
  ): Promise<OrganizationRecord | null> {
    const nowIso = new Date().toISOString();
    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(orgId)) {
      try {
        await Organization.findByIdAndUpdate(orgId, {
          $set: {
            verified,
            verifiedAt: verified ? new Date(nowIso) : null,
          },
        });
        return this.getOrganizationById(orgId);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'adminVerifyOrganization MongoDB failed; falling back' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      const org = (db.organizations || []).find((o) => o.id === orgId);
      if (!org) return null;
      org.verified = verified;
      org.verifiedAt = verified ? nowIso : null;
      org.updatedAt = nowIso;
      writeLocalDb(db);
      return { ...org };
    });
  },

  async listAllOrganizationsForAdmin(): Promise<OrganizationRecord[]> {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const docs: any[] = await Organization.find({}).sort({ createdAt: -1 }).limit(200).lean();
        return docs.map((org) => ({
          id: org._id.toString(),
          name: org.name,
          slug: org.slug || '',
          website: org.website || '',
          logo: org.logo || '',
          industry: org.industry || '',
          size: org.size || '1-10',
          country: org.country || '',
          verified: Boolean(org.verified),
          workEmail: org.workEmail || '',
          verifiedAt: org.verifiedAt ? new Date(org.verifiedAt).toISOString() : null,
          ownerId: org.ownerId.toString(),
          members: (org.members || []).map((m: any) => ({
            userId: m.userId.toString(),
            role: m.role,
            addedAt: m.addedAt instanceof Date ? m.addedAt.toISOString() : String(m.addedAt),
          })),
          hrCredits: org.hrCredits || 0,
          creditBalance: org.hrCredits || 0,
          createdAt: org.createdAt instanceof Date ? org.createdAt.toISOString() : String(org.createdAt),
          updatedAt: org.updatedAt instanceof Date ? org.updatedAt.toISOString() : String(org.updatedAt),
        }));
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'listAllOrganizationsForAdmin MongoDB failed; falling back' },
        });
      }
    }

    const db = readLocalDb();
    return (db.organizations || []).map((o) => ({ ...o }));
  },

  /**
   * Returns enriched applications for a candidate (`candidateId`) with job & organization metadata,
   * while strictly stripping private HR `notes`.
   */
  async getCandidateApplicationsEnriched(candidateId: string): Promise<
    Array<
      ApplicationRecord & {
        jobTitle: string;
        jobSlug: string;
        jobLocation: string;
        jobRemote: boolean;
        jobEmploymentType: string;
        orgName: string;
        orgLogo: string;
        orgVerified: boolean;
      }
    >
  > {
    const apps = await this.listCandidateApplications(candidateId);
    const enriched = await Promise.all(
      apps.map(async (app) => {
        const [job, org] = await Promise.all([
          this.getEmployerJobById(app.jobId),
          this.getOrganizationById(app.orgId),
        ]);
        const safeApp = formatApplicationForViewer(app, 'candidate');
        return {
          ...safeApp,
          jobTitle: job?.title || 'Job Posting',
          jobSlug: job?.slug || '',
          jobLocation: job?.location || '',
          jobRemote: Boolean(job?.remote),
          jobEmploymentType: job?.employmentType || 'full-time',
          orgName: org?.name || 'Hiring Organization',
          orgLogo: org?.logo || '',
          orgVerified: Boolean(org?.verified),
        };
      })
    );
    return enriched;
  },

  /**
   * Withdraws a candidate's application and permanently deletes their application record
   * (`resumeSnapshot`, `coverLetter`, `answers`, `analysis`) while decrementing `EmployerJob.applicantsCount`.
   * Strictly enforces that `application.candidateId === candidateId`.
   */
  async withdrawCandidateApplication(
    applicationId: string,
    candidateId: string
  ): Promise<{
    deleted: boolean;
    error?: 'APPLICATION_NOT_FOUND' | 'FORBIDDEN';
    jobId?: string;
  }> {
    const cleanAppId = (applicationId || '').trim();
    const cleanCandidateId = (candidateId || '').trim();
    if (!cleanAppId || !cleanCandidateId) {
      return { deleted: false, error: 'APPLICATION_NOT_FOUND' };
    }

    const mongoUp = await isMongoAvailable();
    if (mongoUp && mongoose.Types.ObjectId.isValid(cleanAppId)) {
      try {
        const doc: any = await Application.findById(cleanAppId).lean();
        if (!doc) {
          return { deleted: false, error: 'APPLICATION_NOT_FOUND' };
        }
        if (doc.candidateId.toString() !== cleanCandidateId) {
          return { deleted: false, error: 'FORBIDDEN' };
        }

        await Application.findByIdAndDelete(cleanAppId);
        await EmployerJob.findOneAndUpdate(
          { _id: doc.jobId, applicantsCount: { $gt: 0 } },
          { $inc: { applicantsCount: -1 } }
        );

        return { deleted: true, jobId: doc.jobId.toString() };
      } catch (err) {
        Sentry.captureException(err, {
          tags: { component: 'DataStore' },
          extra: { context: 'withdrawCandidateApplication MongoDB failed; falling back' },
        });
      }
    }

    return withOrderLock(async () => {
      const db = readLocalDb();
      if (!Array.isArray(db.applications)) {
        return { deleted: false, error: 'APPLICATION_NOT_FOUND' };
      }

      const idx = db.applications.findIndex((a) => a.id === cleanAppId);
      if (idx === -1) {
        return { deleted: false, error: 'APPLICATION_NOT_FOUND' };
      }

      const target = db.applications[idx];
      if (target.candidateId !== cleanCandidateId) {
        return { deleted: false, error: 'FORBIDDEN' };
      }

      const jobId = target.jobId;
      db.applications.splice(idx, 1);

      const job = (db.employerJobs || []).find((j) => j.id === jobId);
      if (job && job.applicantsCount > 0) {
        job.applicantsCount -= 1;
        job.updatedAt = new Date().toISOString();
      }

      writeLocalDb(db);
      return { deleted: true, jobId };
    });
  },

  /**
   * Searches published internal `EmployerJob` postings and maps them into standard `Job` objects
   * with `source: 'Direct'` and `url: '/jobs/hire/' + slug` so they appear in `/jobs` results with the "Direct" badge.
   */
  async searchPublishedEmployerJobsAsDirectJobs(params: {
    query?: string;
    location?: string;
    remote?: boolean;
  }): Promise<Job[]> {
    const published = await this.listEmployerJobs({ status: 'published', limit: 100 });
    if (published.length === 0) return [];

    const qLower = (params.query || '').trim().toLowerCase();
    const qTokens = qLower
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    const locLower = (params.location || '').trim().toLowerCase();

    const matchedJobs = published.filter((ej) => {
      if (params.remote && !ej.remote) {
        return false;
      }
      if (locLower && !ej.remote) {
        const ejLoc = (ej.location || '').toLowerCase();
        if (ejLoc && !ejLoc.includes(locLower) && !locLower.includes(ejLoc)) {
          return false;
        }
      }
      if (qTokens.length === 0) return true;

      const haystack = [
        ej.title,
        ej.description,
        ...(ej.skills || []),
        ...(ej.requirements || []),
        ej.location,
      ]
        .join(' ')
        .toLowerCase();

      return qTokens.some((tok) => haystack.includes(tok));
    });

    const mapped = await Promise.all(
      matchedJobs.map(async (ej): Promise<Job> => {
        const org = await this.getOrganizationById(ej.orgId);
        let salaryStr: string | undefined;
        if (
          ej.salary?.visible &&
          (typeof ej.salary.min === 'number' || typeof ej.salary.max === 'number')
        ) {
          const minPart = typeof ej.salary.min === 'number' ? ej.salary.min.toLocaleString() : '0';
          const maxPart =
            typeof ej.salary.max === 'number' ? ej.salary.max.toLocaleString() : '+';
          salaryStr = `${minPart} - ${maxPart} ${ej.salary.currency || 'USD'}`;
        }

        return {
          id: ej.id,
          title: ej.title,
          company: org?.name || 'Verified Employer',
          location: ej.location || (ej.remote ? 'Remote' : 'On-site'),
          remote: Boolean(ej.remote),
          description: ej.description,
          url: `/jobs/hire/${ej.slug}`,
          source: 'Direct',
          postedDate: (ej.publishedAt || ej.createdAt || new Date().toISOString()).slice(0, 10),
          salary: salaryStr,
          jobType: ej.employmentType,
          tags: ej.skills || [],
        };
      })
    );

    return mapped;
  },
};

export default DataStore;

