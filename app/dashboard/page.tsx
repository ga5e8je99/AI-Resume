'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  BarChart3,
  ArrowRight,
  Loader2,
  Clock,
  Award,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SavedResume {
  id: string;
  title: string;
  templateId: string;
  theme: any;
  data: any;
  updatedAt: string;
}

interface SavedAnalysis {
  id: string;
  resumeFileName: string;
  targetRole: string;
  overallScore: number;
  grade: string;
  rankPercentile: string;
  matchLabel: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch user data
  const fetchData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [resumesRes, analysesRes] = await Promise.all([
        fetch('/api/resumes'),
        fetch('/api/analyses'),
      ]);

      if (resumesRes.ok) {
        const rData = await resumesRes.json();
        setResumes(rData.resumes || []);
      }

      if (analysesRes.ok) {
        const aData = await analysesRes.json();
        setAnalyses(aData.analyses || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleDeleteResume = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('Failed to delete resume.');
      }
    } catch (err) {
      alert('Network error while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!window.confirm('Delete this saved ATS scan result?')) return;

    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      alert('Failed to delete scan.');
    }
  };

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cloud Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Manage your saved ATS resumes, edit them in the builder anytime, and view your resume analysis scores.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Resume</span>
              </Link>
              <Link
                href="/#scanner"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>ATS Scanner</span>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400">Saved Resumes</span>
              <p className="text-xl font-bold text-white mt-0.5">{resumes.length}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">ATS Scans</span>
              <p className="text-xl font-bold text-cyan-400 mt-0.5">{analyses.length}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Cloud Storage</span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">MongoDB Connected</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Account Status</span>
              <p className="text-xl font-bold text-white mt-0.5">Active (Free)</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: MY SAVED RESUMES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">My Resumes</h2>
              <span className="text-xs text-slate-400">({resumes.length})</span>
            </div>

            <Link
              href="/builder"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>+ New Resume</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/30">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">No resumes saved yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Build your first high-scoring ATS resume and save it to your cloud account to edit anytime.
              </p>
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Building</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumes.map((resume) => {
                const updatedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <div
                    key={resume.id}
                    className="group rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-cyan-500/5 backdrop-blur-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {resume.templateId}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{updatedDate}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                        {resume.title || 'Untitled Resume'}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {resume.data?.personalInfo?.jobTitle || 'No title set'}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <Link
                        href={`/builder?id=${resume.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all hover:scale-[1.01]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit in Builder</span>
                      </Link>

                      <button
                        type="button"
                        disabled={deletingId === resume.id}
                        onClick={() => handleDeleteResume(resume.id, resume.title)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: SAVED ATS SCAN REVIEWS */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Saved ATS Scan Reviews</h2>
              <span className="text-xs text-slate-400">({analyses.length})</span>
            </div>

            <Link
              href="/review"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>Scan Another CV →</span>
            </Link>
          </div>

          {isLoading ? null : analyses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800/80 p-6 text-center bg-slate-900/20">
              <p className="text-xs text-slate-500">
                No ATS scans saved yet. Head to the ATS review page to scan and save your CV audit score!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyses.map((scan) => {
                const scoreColor =
                  scan.overallScore >= 80
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : scan.overallScore >= 65
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-red-400 bg-red-500/10 border-red-500/30';

                const scanDate = new Date(scan.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={scan.id}
                    className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-bold text-sm shrink-0 ${scoreColor}`}
                      >
                        <span>{scan.overallScore}</span>
                        <span className="text-[9px] uppercase font-normal">{scan.grade}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {scan.resumeFileName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {scan.targetRole}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {scanDate} • {scan.matchLabel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnalysis(scan.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
                      title="Delete scan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
