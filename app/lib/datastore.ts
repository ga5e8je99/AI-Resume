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
import { CoverLetterService } from './coverLetterService';
import { getPlanCredits, JOB_MATCH_FREE_QUOTA, JOB_MATCH_CREDIT_COST } from '@/lib/plans';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
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
  createdAt: string;
  updatedAt: string;
}

export interface StoredOrder {
  id: string;
  userId: string;
  userEmail: string;
  planId: 'pro' | 'payg';
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

export async function withOrderLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = orderLockQueue;
  let release!: () => void;
  orderLockQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
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

            return {
              id: (u as any)._id.toString(),
              name: (u as any).name,
              email: (u as any).email,
              role: (u as any).role || 'user',
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

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
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
          return {
            id: (u as any)._id.toString(),
            name: (u as any).name,
            email: (u as any).email,
            password: (u as any).password,
            role: (u as any).role || 'user',
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
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role || 'user',
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

    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const newUser = await User.create({
          name: userData.name.trim(),
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          role: userData.role || 'user',
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
    planId: 'pro' | 'payg';
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
};

export default DataStore;

