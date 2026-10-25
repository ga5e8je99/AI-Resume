import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectToDatabase from './db';
import User, { IUser } from '../models/User';
import Resume, { IResume } from '../models/Resume';
import Analysis, { IAnalysis } from '../models/Analysis';
import CoverLetter, { ICoverLetter } from '../models/CoverLetter';
import { CoverLetterService } from './coverLetterService';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
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

interface LocalDatabase {
  users: StoredUser[];
  resumes: StoredResume[];
  analyses: StoredAnalysis[];
  coverLetters?: StoredCoverLetter[];
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
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_002',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      role: 'user',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'usr_003',
      name: 'Omar Mansour',
      email: 'omar.mansour@gmail.com',
      role: 'user',
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

function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.coverLetters) parsed.coverLetters = [];
    return parsed;
  } catch (err) {
    console.error('Error reading local db file, fallback to initial:', err);
    return INITIAL_DB;
  }
}

function writeLocalDb(db: LocalDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db file:', err);
  }
}

// Check if MongoDB is connected, returns boolean without waiting
let isMongoWorking = false;
let lastCheckTime = 0;

export async function isMongoAvailable(): Promise<boolean> {
  const now = Date.now();
  // Cache check result for 10 seconds to avoid repeating failed connection attempts
  if (now - lastCheckTime < 10000 && !isMongoWorking) {
    return false;
  }
  lastCheckTime = now;

  try {
    const conn = await Promise.race([
      connectToDatabase(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]);
    isMongoWorking = !!(conn && conn.connection.readyState === 1);
    return isMongoWorking;
  } catch (err) {
    isMongoWorking = false;
    return false;
  }
}

export const DataStore = {
  // Local direct access
  readDb: readLocalDb,
  writeDb: writeLocalDb,

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
        // Fall back to local
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
        // fallback
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
      } catch (err) {}
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
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        await Promise.all([
          User.findByIdAndDelete(userId),
          Resume.deleteMany({ userId }),
          Analysis.deleteMany({ userId }),
        ]);
      } catch (err) {}
    }

    const db = readLocalDb();
    db.users = db.users.filter((u) => u.id !== userId);
    db.resumes = db.resumes.filter((r) => r.userId !== userId);
    db.analyses = db.analyses.filter((a) => a.userId !== userId);
    writeLocalDb(db);
    return true;
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
      } catch (err) {}
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
          if (u) return { id: (u as any)._id.toString(), name: (u as any).name, email: (u as any).email, role: (u as any).role || 'user', createdAt: (u as any).createdAt };
        }
      } catch (err) {}
    }

    const db = readLocalDb();
    const u = db.users.find((user) => user.id === id);
    if (u) return { id: u.id, name: u.name, email: u.email, role: u.role || 'user', createdAt: u.createdAt };
    return null;
  },

  async findUserByEmail(email: string) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const u = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').lean();
        if (u) return { id: (u as any)._id.toString(), name: (u as any).name, email: (u as any).email, password: (u as any).password, role: (u as any).role || 'user' };
      } catch (err) {}
    }

    const db = readLocalDb();
    const u = db.users.find((user) => user.email.toLowerCase() === email.toLowerCase().trim());
    if (u) return { id: u.id, name: u.name, email: u.email, password: u.password, role: u.role || 'user' };
    return null;
  },

  async createUserAccount(userData: { name: string; email: string; password: string; role?: 'user' | 'admin' }) {
    const mongoUp = await isMongoAvailable();
    if (mongoUp) {
      try {
        const newUser = await User.create({
          name: userData.name.trim(),
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          role: userData.role || 'user',
        });
        return {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        };
      } catch (err) {}
    }

    const db = readLocalDb();
    const newUser: StoredUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeLocalDb(db);
    return { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
  },
};

export default DataStore;
