'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import {
  Users,
  FileText,
  ScanSearch,
  Award,
  TrendingUp,
  ShieldCheck,
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  Download,
  Key,
  CheckCircle2,
  AlertCircle,
  Layout,
  Layers,
  ArrowRight,
  Filter,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';

interface AdminStats {
  metrics: {
    totalUsers: number;
    totalResumes: number;
    totalAnalyses: number;
    newUsers7d: number;
    newResumes7d: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
  };
  templateCounts: Record<string, number>;
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    needsWork: number;
  };
  recentActivity: {
    users: any[];
    resumes: any[];
    analyses: any[];
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  resumeCount: number;
  analysisCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminResume {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  templateId: string;
  theme: any;
  candidateName: string;
  candidateTitle: string;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  projectsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminAnalysis {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
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
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'resumes' | 'analyses'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [resumesList, setResumesList] = useState<AdminResume[]>([]);
  const [analysesList, setAnalysesList] = useState<AdminAnalysis[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [resumeSearch, setResumeSearch] = useState('');
  const [resumeTemplateFilter, setResumeTemplateFilter] = useState('all');
  const [analysisSearch, setAnalysisSearch] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check admin authorization on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdminAuthorized(true);
        } else {
          setIsAdminAuthorized(false);
        }
      } catch (err) {
        setIsAdminAuthorized(false);
      }
    };

    if (!authLoading) {
      checkAuth();
    }
  }, [authLoading, user]);

  // Load Admin Data when authorized
  useEffect(() => {
    if (isAdminAuthorized) {
      loadAllAdminData();
    }
  }, [isAdminAuthorized]);

  const loadAllAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [statsRes, usersRes, resumesRes, analysesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/resumes'),
        fetch('/api/admin/analyses'),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsersList(u.users || []);
      }
      if (resumesRes.ok) {
        const r = await resumesRes.json();
        setResumesList(r.resumes || []);
      }
      if (analysesRes.ok) {
        const a = await analysesRes.json();
        setAnalysesList(a.analyses || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showNotice('حدث خطأ أثناء تحميل البيانات', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    setIsVerifyingKey(true);

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: adminKeyInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminAuthorized(true);
        showNotice('تم تأكيد صلاحيات الأدمن بنجاح! مرحباً بك');
      } else {
        setKeyError(data.error || 'رمز دخول الأدمن غير صحيح');
      }
    } catch (err: any) {
      setKeyError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      currentRole === 'admin'
        ? 'هل أنت متأكد من سحب صلاحية الأدمن من هذا المستخدم؟'
        : 'هل تريد ترقية هذا المستخدم إلى مشرف (Admin)؟';

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showNotice(`تم تعديل صلاحية المستخدم إلى ${newRole === 'admin' ? 'مشرف (Admin)' : 'مستخدم عادي'}`);
      } else {
        const d = await res.json();
        showNotice(d.error || 'فشل تعديل الصلاحية', 'error');
      }
    } catch (err) {
      showNotice('حدث خطأ أثناء تعديل الصلاحية', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`تحذير: هل أنت متأكد تماماً من حذف المستخدم "${userName}"؟\nسيتم حذف حسابه وجميع السير الذاتية وفحوصات الـ ATS التابعة له نهائياً!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        setResumesList((prev) => prev.filter((r) => r.userId !== userId));
        setAnalysesList((prev) => prev.filter((a) => a.userId !== userId));
        if (stats) {
          setStats({
            ...stats,
            metrics: {
              ...stats.metrics,
              totalUsers: Math.max(0, stats.metrics.totalUsers - 1),
            },
          });
        }
        showNotice(`تم حذف المستخدم "${userName}" وبياناته بنجاح`);
      } else {
        const d = await res.json();
        showNotice(d.error || 'فشل حذف المستخدم', 'error');
      }
    } catch (err) {
      showNotice('حدث خطأ أثناء حذف المستخدم', 'error');
    }
  };

  const handleDeleteResume = async (resumeId: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف السيرة الذاتية "${title}"؟`)) return;

    try {
      const res = await fetch(`/api/admin/resumes?id=${resumeId}`, { method: 'DELETE' });
      if (res.ok) {
        setResumesList((prev) => prev.filter((r) => r.id !== resumeId));
        if (stats) {
          setStats({
            ...stats,
            metrics: {
              ...stats.metrics,
              totalResumes: Math.max(0, stats.metrics.totalResumes - 1),
            },
          });
        }
        showNotice('تم حذف السيرة الذاتية بنجاح');
      } else {
        const d = await res.json();
        showNotice(d.error || 'فشل حذف السيرة الذاتية', 'error');
      }
    } catch (err) {
      showNotice('حدث خطأ أثناء حذف السيرة الذاتية', 'error');
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('هل تريد حذف سجل فحص الـ ATS هذا؟')) return;

    try {
      const res = await fetch(`/api/admin/analyses?id=${analysisId}`, { method: 'DELETE' });
      if (res.ok) {
        setAnalysesList((prev) => prev.filter((a) => a.id !== analysisId));
        if (stats) {
          setStats({
            ...stats,
            metrics: {
              ...stats.metrics,
              totalAnalyses: Math.max(0, stats.metrics.totalAnalyses - 1),
            },
          });
        }
        showNotice('تم حذف سجل الفحص');
      } else {
        const d = await res.json();
        showNotice(d.error || 'فشل حذف سجل الفحص', 'error');
      }
    } catch (err) {
      showNotice('حدث خطأ أثناء حذف السجل', 'error');
    }
  };

  const handleExportData = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      stats,
      users: usersList,
      resumes: resumesList,
      analyses: analysesList,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobmatch-admin-full-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('تم تصدير نسخة كاملة من البيانات بنجاح (JSON)');
  };

  // Filtered Users
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered Resumes
  const filteredResumes = resumesList.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.userName.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.candidateName.toLowerCase().includes(resumeSearch.toLowerCase()) ||
      r.candidateTitle.toLowerCase().includes(resumeSearch.toLowerCase());

    const matchesTemplate = resumeTemplateFilter === 'all' || r.templateId === resumeTemplateFilter;
    return matchesSearch && matchesTemplate;
  });

  // Filtered Analyses
  const filteredAnalyses = analysesList.filter(
    (a) =>
      a.targetRole.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.userName.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.resumeFileName.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.grade.toLowerCase().includes(analysisSearch.toLowerCase())
  );

  // If Auth loading
  if (authLoading || isAdminAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-medium">جاري التحقق من صلاحيات المشرف...</p>
        </div>
      </div>
    );
  }

  // If NOT authorized as admin, show Admin Authentication Access Gate
  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-10 h-10" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-2">
            لوحة تحكم المشرف (Admin)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 text-center mb-6 leading-relaxed">
            هذه الصفحة مخصصة لمالك المنصة لمراقبة المستخدمين، السير الذاتية، والإحصائيات الكاملة.
          </p>

          {keyError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{keyError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                مفتاح الدخول السري (Admin Secret Key)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  placeholder="أدخل مفتاح الإدارة أو كلمة المرور السرية"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingKey}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingKey ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة الإدارة</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center flex flex-col gap-2">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              تسجيل الدخول بحساب مسؤول مسجل
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Helper for template badge colors
  const getTemplateBadge = (tpl: string) => {
    switch (tpl) {
      case 'compact':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Compact (Resumeforfree)</span>;
      case 'two-column':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">Two Column</span>;
      case 'ats-friendly':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">ATS Friendly</span>;
      case 'simple':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-600/40">Simple Standard</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">{tpl}</span>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{score}%</span>;
    }
    if (score >= 70) {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">{score}%</span>;
    }
    if (score >= 50) {
      return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{score}%</span>;
    }
    return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">{score}%</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium flex items-center gap-2.5 animate-in slide-in-from-top duration-300 ${
            notification.type === 'error'
              ? 'bg-red-950/95 border-red-800 text-red-200'
              : 'bg-emerald-950/95 border-emerald-800 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Admin Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white">
                  JobMatch <span className="text-cyan-400">Admin</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  لوحة التحكم
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                متابعة شاملة للمستخدمين، السير الذاتية، ومؤشرات الأداء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadAllAdminData}
              disabled={isLoadingData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
              title="تصدير كامل البيانات JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">تصدير كامل البيانات</span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs text-cyan-300 font-medium transition-all"
            >
              <span className="hidden sm:inline">لوحة المستخدم</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Metrics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Users */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي المستخدمين</span>
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.totalUsers ?? usersList.length}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{stats?.metrics.newUsers7d ?? 0} هذا الأسبوع
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">حسابات مسجلة بالمنصة</p>
          </div>

          {/* Card 2: Resumes */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">إجمالي السير الذاتية</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.totalResumes ?? resumesList.length}
              </span>
              <span className="text-[11px] text-cyan-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{stats?.metrics.newResumes7d ?? 0} جديدة
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">سيرة ذاتية تم إنشاؤها وحفظها</p>
          </div>

          {/* Card 3: ATS Scans */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">فحوصات الـ ATS</span>
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <ScanSearch className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.totalAnalyses ?? analysesList.length}
              </span>
              <span className="text-[11px] text-purple-400 font-medium">فحص مكتمل</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">تحليل ومطابقة مع الوظائف</p>
          </div>

          {/* Card 4: Avg Score */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">متوسط درجات المطابقة</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.metrics.avgScore ?? 0}%
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">
                أعلى: {stats?.metrics.maxScore ?? 0}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">معدل توافق السير الذاتية مع ATS</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>نظرة عامة والتحليلات</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمين ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('resumes')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'resumes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>السير الذاتية ({resumesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analyses')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'analyses'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScanSearch className="w-4 h-4" />
            <span>سجل فحص ATS ({analysesList.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Popularity Distribution */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Layout className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-base">القوالب الأكثر استخداماً</h3>
                  </div>
                  <span className="text-xs text-slate-400">إجمالي: {resumesList.length} سيرة</span>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'compact', label: 'Compact (Resumeforfree)', color: 'bg-emerald-500' },
                    { id: 'two-column', label: 'Two Column (Sidebar)', color: 'bg-blue-500' },
                    { id: 'ats-friendly', label: 'ATS Friendly (Structured)', color: 'bg-purple-500' },
                    { id: 'simple', label: 'Simple (Classic Minimal)', color: 'bg-slate-400' },
                  ].map((tpl) => {
                    const count = stats?.templateCounts[tpl.id] || resumesList.filter((r) => r.templateId === tpl.id).length;
                    const total = resumesList.length || 1;
                    const percent = Math.round((count / total) * 100);

                    return (
                      <div key={tpl.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{tpl.label}</span>
                          <span className="text-slate-400 font-semibold">{count} سيرة ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${tpl.color} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score Distribution Breakdown */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">توزيع نتائج مطابقة الـ ATS</h3>
                  </div>
                  <span className="text-xs text-slate-400">إجمالي: {analysesList.length} فحص</span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: 'ممتاز (85% فأعلى) - توافق قوي جداً',
                      count: stats?.scoreDistribution.excellent || analysesList.filter((a) => a.overallScore >= 85).length,
                      color: 'bg-emerald-500',
                      textColor: 'text-emerald-400',
                    },
                    {
                      label: 'جيد (70% - 84%) - يحتاج تحسين بسيط',
                      count: stats?.scoreDistribution.good || analysesList.filter((a) => a.overallScore >= 70 && a.overallScore < 85).length,
                      color: 'bg-cyan-500',
                      textColor: 'text-cyan-400',
                    },
                    {
                      label: 'متوسط (50% - 69%) - نقص في الكلمات المفتاحية',
                      count: stats?.scoreDistribution.average || analysesList.filter((a) => a.overallScore >= 50 && a.overallScore < 70).length,
                      color: 'bg-amber-500',
                      textColor: 'text-amber-400',
                    },
                    {
                      label: 'يحتاج إعادة صياغة (أقل من 50%)',
                      count: stats?.scoreDistribution.needsWork || analysesList.filter((a) => a.overallScore < 50).length,
                      color: 'bg-red-500',
                      textColor: 'text-red-400',
                    },
                  ].map((row, idx) => {
                    const total = analysesList.length || 1;
                    const percent = Math.round((row.count / total) * 100);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`${row.textColor} font-medium`}>{row.label}</span>
                          <span className="text-slate-400 font-semibold">{row.count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.color} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Platform Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest Users */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>أحدث المستخدمين المسجلين</span>
                  </h4>
                  <button onClick={() => setActiveTab('users')} className="text-xs text-cyan-400 hover:underline">
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {usersList.slice(0, 5).map((u) => (
                    <div key={u.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs text-white truncate">{u.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.role === 'admin' ? 'مشرف' : 'مستخدم'}
                      </span>
                    </div>
                  ))}
                  {usersList.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">لا يوجد مستخدمين بعد</p>}
                </div>
              </div>

              {/* Latest Resumes */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>أحدث السير الذاتية المنشأة</span>
                  </h4>
                  <button onClick={() => setActiveTab('resumes')} className="text-xs text-cyan-400 hover:underline">
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {resumesList.slice(0, 5).map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs text-white truncate">{r.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">بواسطة: {r.userName}</div>
                      </div>
                      {getTemplateBadge(r.templateId)}
                    </div>
                  ))}
                  {resumesList.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">لا توجد سير ذاتية بعد</p>}
                </div>
              </div>

              {/* Latest ATS Scans */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <ScanSearch className="w-4 h-4 text-purple-400" />
                    <span>أحدث فحوصات ATS</span>
                  </h4>
                  <button onClick={() => setActiveTab('analyses')} className="text-xs text-cyan-400 hover:underline">
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-2.5">
                  {analysesList.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs text-white truncate">{a.targetRole}</div>
                        <div className="text-[11px] text-slate-400 truncate">{a.userName}</div>
                      </div>
                      <div className="text-left shrink-0">
                        {getScoreBadge(a.overallScore)}
                      </div>
                    </div>
                  ))}
                  {analysesList.length === 0 && <p className="text-xs text-slate-500 py-3 text-center">لا توجد فحوصات بعد</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>دليل المستخدمين المسجلين</span>
                  <span className="text-xs font-normal text-slate-400">({filteredUsers.length} مستخدم)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  إدارة الصلاحيات، عرض عدد السير الذاتية لكل مستخدم، والتحكم بالحسابات
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الإيميل..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4 text-center">الصلاحية</th>
                    <th className="py-3 px-4 text-center">عدد السير الذاتية</th>
                    <th className="py-3 px-4 text-center">فحوصات ATS</th>
                    <th className="py-3 px-4">تاريخ التسجيل</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {u.role === 'admin' ? 'مشرف (Admin)' : 'مستخدم'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                          {u.resumeCount} سيرة
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                          {u.analysisCount} فحص
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleUserRole(u.id, u.role)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                            title={u.role === 'admin' ? 'تنزيل إلى مستخدم عادي' : 'ترقية إلى مشرف'}
                          >
                            {u.role === 'admin' ? <UserX className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="حذف المستخدم وجميع بياناته"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد نتائج مطابقة لبحثك
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ALL RESUMES DIRECTORY */}
        {activeTab === 'resumes' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>جميع السير الذاتية بالمنصة</span>
                  <span className="text-xs font-normal text-slate-400">({filteredResumes.length} سيرة)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تفاصيل كاملة لكل سيرة: صاحب السيرة، القالب المستخدم، الأقسام، وإمكانية المعاينة والتعديل
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={resumeTemplateFilter}
                  onChange={(e) => setResumeTemplateFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">جميع القوالب</option>
                  <option value="compact">Compact (Resumeforfree)</option>
                  <option value="two-column">Two Column (Sidebar)</option>
                  <option value="ats-friendly">ATS Friendly</option>
                  <option value="simple">Simple</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resumeSearch}
                    onChange={(e) => setResumeSearch(e.target.value)}
                    placeholder="بحث بالعنوان أو صاحب السيرة..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Resumes Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">عنوان السيرة الذاتية</th>
                    <th className="py-3 px-4">صاحب الحساب</th>
                    <th className="py-3 px-4">اسم المرشح / المسمى</th>
                    <th className="py-3 px-4 text-center">القالب</th>
                    <th className="py-3 px-4 text-center">محتويات السيرة</th>
                    <th className="py-3 px-4">آخر تحديث</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredResumes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{r.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {r.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{r.userName}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-cyan-300">{r.candidateName}</div>
                        <div className="text-xs text-slate-400">{r.candidateTitle || 'بدون مسمى'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getTemplateBadge(r.templateId)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="عدد الخبرات">
                            💼 {r.experienceCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="عدد المؤهلات">
                            🎓 {r.educationCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="عدد المهارات">
                            ⚡ {r.skillsCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(r.updatedAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/builder?id=${r.id}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 transition-colors"
                            title="فتح ومعاينة في منشئ السيرة"
                            target="_blank"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteResume(r.id, r.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="حذف السيرة الذاتية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredResumes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        لا توجد سير ذاتية مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ATS SCANS HISTORY */}
        {activeTab === 'analyses' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ScanSearch className="w-5 h-5 text-purple-400" />
                  <span>سجل فحوصات وتدقيق الـ ATS</span>
                  <span className="text-xs font-normal text-slate-400">({filteredAnalyses.length} فحص)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  جميع عمليات التحليل ومطابقة السير الذاتية مع التقديرات والدرجات التفصيلية
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={analysisSearch}
                  onChange={(e) => setAnalysisSearch(e.target.value)}
                  placeholder="بحث بالمسمى أو المستخدم..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Analyses Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-700/80">
                  <tr>
                    <th className="py-3 px-4">الوظيفة المستهدفة</th>
                    <th className="py-3 px-4">المستخدم / الملف</th>
                    <th className="py-3 px-4 text-center">الدرجة الكلية</th>
                    <th className="py-3 px-4 text-center">التقدير</th>
                    <th className="py-3 px-4 text-center">المطابقة والتصنيف</th>
                    <th className="py-3 px-4 text-center">تفاصيل الدرجات</th>
                    <th className="py-3 px-4">تاريخ الفحص</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAnalyses.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{a.targetRole}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {a.id.slice(-6)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{a.userName}</div>
                        <div className="text-xs text-slate-400 font-mono">{a.resumeFileName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getScoreBadge(a.overallScore)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {a.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs text-slate-300 font-medium">
                          {a.matchLabel} ({a.rankPercentile})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="الكلمات المفتاحية">
                            🔑 {a.subScores?.keywordsMatch ?? 0}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="التنسيق">
                            📐 {a.subScores?.formatting ?? 0}%
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700" title="الهيكل">
                            🏗️ {a.subScores?.structure ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(a.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteAnalysis(a.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="حذف سجل الفحص"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAnalyses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        لا توجد سجلات فحص مطابقة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
