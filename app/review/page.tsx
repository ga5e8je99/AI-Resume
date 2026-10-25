"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Edit,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Search,
  Target,
  Zap,
  Clock,
  Star,
  Copy,
  Sparkles,
  BarChart3,
  Award,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Upload,
  ArrowLeft,
  ChevronDown,
  Check,
  FileCode,
  Cloud,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LogoLoader from "../components/LogoLoader";
import Logo from "../components/Logo";
import {
  analyzeResumeText,
  resumeDataToText,
  ATSAnalysisResult,
} from "../lib/atsAnalyzer";
import { initialSampleData } from "../builder/initialData";
import { extractTextFromFile } from "../lib/pdfExtractor";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

export default function ReviewResultPage() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [targetJobDescription, setTargetJobDescription] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Full-Stack Developer");
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [analysisSaved, setAnalysisSaved] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);
  const [showRawTextModal, setShowRawTextModal] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAnalysis = async () => {
    if (!user) {
      if (window.confirm("Please sign in to save your ATS review to your dashboard. Go to login?")) {
        window.location.href = "/login?returnUrl=/review";
      }
      return;
    }
    if (!analysisResult) return;

    try {
      setIsSavingAnalysis(true);
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeFileName: resumeFileName || "Uploaded_Resume.pdf",
          targetRole,
          targetJobDescription,
          overallScore: analysisResult.overallScore,
          grade: analysisResult.metrics.grade,
          rankPercentile: analysisResult.metrics.rankPercentile,
          matchLabel: analysisResult.metrics.matchLabel,
          subScores: analysisResult.subScores,
          result: analysisResult,
        }),
      });
      if (!res.ok) throw new Error("Failed to save analysis");
      setAnalysisSaved(true);
      setTimeout(() => setAnalysisSaved(false), 3000);
    } catch (err: any) {
      alert(err?.message || "Error saving analysis to cloud.");
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  // Initialize: load from sessionStorage or fallback to sample resume
  useEffect(() => {
    let initialText = "";
    let initialFileName = "";

    if (typeof window !== "undefined") {
      const storedText = sessionStorage.getItem("jobmatch_resume_text");
      const storedName = sessionStorage.getItem("jobmatch_resume_filename");
      if (storedText && storedText.trim().length > 20) {
        initialText = storedText;
        initialFileName = storedName || "Uploaded_Resume.pdf";
      }
    }

    if (!initialText) {
      initialText = resumeDataToText(initialSampleData);
      initialFileName = "Alex_Morgan_Resume_Sample.pdf";
    }

    setResumeText(initialText);
    setResumeFileName(initialFileName);

    // Initial analysis
    const timer = setTimeout(() => {
      const result = analyzeResumeText(initialText, targetRole, targetJobDescription);
      setAnalysisResult(result);
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Re-run analysis when text or JD changes
  const runAnalysis = (text: string, jd?: string, role?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const result = analyzeResumeText(text, role || targetRole, jd !== undefined ? jd : targetJobDescription);
      setAnalysisResult(result);
      setIsLoading(false);
    }, 800);
  };

  // Handle new file upload directly on the review page
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 25) {
        setShowRawTextModal(true);
        alert("This PDF appears to be a scanned image or photo without selectable text. Please paste your resume text in the box to analyze.");
        return;
      }

      setResumeText(text);
      setResumeFileName(file.name);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("jobmatch_resume_text", text);
        sessionStorage.setItem("jobmatch_resume_filename", file.name);
      }
      runAnalysis(text, targetJobDescription);
    } catch (err: any) {
      console.error(err);
      setShowRawTextModal(true);
      alert(err.message || "Could not read text. You can paste your resume text directly to analyze.");
    } finally {
      setIsUploading(false);
    }
  };

  // Load Builder sample data
  const handleLoadSample = () => {
    const text = resumeDataToText(initialSampleData);
    setResumeText(text);
    setResumeFileName("Alex_Morgan_ATS_Sample.pdf");
    runAnalysis(text);
  };

  // Copy keyword helper
  const handleCopyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  // Download PDF Report
  const handleDownloadReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 600);
  };

  if (isLoading || !analysisResult) {
    return (
      <LogoLoader
        text="Analyzing Your Resume..."
        subtext="Scanning keyword frequency, quantifiable metrics & ATS compliance"
        size="lg"
        fullScreen
      />
    );
  }

  const {
    overallScore,
    subScores,
    metrics,
    contactInfo,
    sectionsDetected,
    keywordsDetected,
    missingKeywords,
    strengths,
    weaknesses,
    suggestions,
    actionVerbsFound,
  } = analysisResult;

  // Dynamic score color
  const scoreColor =
    overallScore >= 80
      ? "text-emerald-400 stroke-emerald-500"
      : overallScore >= 70
      ? "text-cyan-400 stroke-cyan-500"
      : overallScore >= 55
      ? "text-amber-400 stroke-amber-500"
      : "text-rose-400 stroke-rose-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 print:bg-white print:text-black">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                ATS Analysis Report
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Real Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {resumeFileName}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 transition-all shadow-sm"
              title="Upload any other PDF resume to test real analytics"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Upload New CV</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <button
              onClick={() => setShowJdModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 transition-all shadow-sm"
              title="Paste Job Description to match against"
            >
              <Target className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="hidden md:inline">Match Job Target</span>
              <span className="md:hidden">Target</span>
            </button>

            <button
              onClick={handleSaveAnalysis}
              disabled={isSavingAnalysis}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                analysisSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-white'
              }`}
              title="Save this analysis report to your cloud dashboard"
            >
              {isSavingAnalysis ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : analysisSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="hidden sm:inline">Save Scan</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>

            <Link
              href="/builder"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white transition-all shadow-sm"
            >
              <Edit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit in Builder</span>
            </Link>
            <button
              onClick={handleDownloadReport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Source Resume Notice Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white">Analyzing: </span>
              <span className="text-cyan-300 font-mono">{resumeFileName}</span>
              <span className="text-slate-400 ml-2">
                ({metrics.wordCount} words detected • {keywordsDetected.length} skills recognized)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawTextModal(true)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              View Extracted Text
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={handleLoadSample}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Load Sample Resume
            </button>
          </div>
        </div>

        {/* Section 1: Top Hero Scores Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Circular ATS Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  ATS Compatibility Score
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
                    {metrics.matchLabel}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Real algorithmic evaluation of contact details, formatting, keywords & metric density
                </p>
              </div>
              <button
                onClick={() => runAnalysis(resumeText)}
                className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-800/40 hover:bg-slate-800 text-slate-300 transition-colors"
                title="Recalculate"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
              {/* Circular Gauge */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    strokeWidth="9"
                    className="stroke-slate-800 fill-transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    strokeWidth="9"
                    strokeLinecap="round"
                    className={`${scoreColor} fill-transparent transition-all duration-1000`}
                    strokeDasharray={263.89}
                    strokeDashoffset={263.89 - (overallScore / 100) * 263.89}
                  />
                </svg>

                <div className="absolute inset-8 rounded-full bg-slate-950/80 border border-slate-800/80 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-4xl font-black text-white tracking-tight">
                    {overallScore}%
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                    Grade {metrics.grade}
                  </span>
                </div>
              </div>

              {/* 4 Pillars Breakdown Progress Bars */}
              <div className="flex-1 w-full space-y-3.5">
                {[
                  {
                    label: "Keywords Match",
                    value: subScores.keywordsMatch,
                    color: "bg-cyan-500",
                    detail: `${keywordsDetected.length} detected skills`,
                  },
                  {
                    label: "Content Quality & Metrics",
                    value: subScores.contentQuality,
                    color: "bg-fuchsia-500",
                    detail: `${metrics.quantifiedMetricsCount} metrics found`,
                  },
                  {
                    label: "Structure & Sections",
                    value: subScores.structure,
                    color: "bg-blue-500",
                    detail: `${sectionsDetected.filter((s) => s.found).length}/6 standard sections`,
                  },
                  {
                    label: "ATS Formatting & Length",
                    value: subScores.formatting,
                    color: "bg-emerald-500",
                    detail: `${metrics.wordCount} words (ideal: 450-900)`,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium text-slate-200">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {item.detail}
                        </span>
                        <span className="font-bold text-white">{item.value}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.2">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 4 Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
              {[
                {
                  icon: <Target className="w-4 h-4 text-cyan-400" />,
                  label: "Job Fit",
                  value: metrics.matchLabel,
                },
                {
                  icon: <Clock className="w-4 h-4 text-fuchsia-400" />,
                  label: "Reading Time",
                  value: metrics.readingTimeString,
                },
                {
                  icon: <Award className="w-4 h-4 text-amber-400" />,
                  label: "Percentile",
                  value: metrics.rankPercentile,
                },
                {
                  icon: <Zap className="w-4 h-4 text-emerald-400" />,
                  label: "Action Verbs",
                  value: `${actionVerbsFound.length} power verbs`,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 text-center"
                >
                  <div className="flex items-center justify-center mb-1">
                    {stat.icon}
                  </div>
                  <div className="text-[11px] text-slate-400">{stat.label}</div>
                  <div className="font-bold text-xs sm:text-sm text-white mt-0.5">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact & Structure Audit Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Contact & Section Audit
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Essential items ATS parsers look for on page 1
              </p>

              {/* Contact Checklist */}
              <div className="space-y-2.5 mb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Contact Information
                </div>
                {[
                  { label: "Email Address", found: contactInfo.hasEmail, val: contactInfo.email },
                  { label: "Phone Number", found: contactInfo.hasPhone, val: contactInfo.phone },
                  { label: "LinkedIn Profile", found: contactInfo.hasLinkedIn, val: contactInfo.hasLinkedIn ? "Found" : "Missing" },
                  { label: "Location / City", found: contactInfo.hasLocation, val: contactInfo.hasLocation ? "Found" : "Missing" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {item.found ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-slate-200">{item.label}</span>
                    </div>
                    <span className={`font-mono ${item.found ? "text-slate-300" : "text-amber-400"}`}>
                      {item.val || "Not found"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Core Sections Checklist */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Core Resume Sections
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {sectionsDetected.map((sec, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                        sec.found
                          ? "bg-slate-950/40 border-slate-800 text-slate-300"
                          : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                      }`}
                    >
                      {sec.found ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 text-rose-400 shrink-0 font-bold">×</span>
                      )}
                      <span className="truncate">{sec.name.split("/")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <Link
                href="/builder"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-center text-cyan-300 hover:text-cyan-200 transition-colors block"
              >
                Edit & Fix in ATS Resume Builder →
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Section 2: Real Keywords Detected & Missing Keywords */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real Keywords Detected */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-400" />
                  Recognized Keywords ({keywordsDetected.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Real skills extracted directly from your resume with exact frequencies
                </p>
              </div>
            </div>

            {keywordsDetected.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                No recognized industry skills detected in this document.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {keywordsDetected.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          kw.importance === "high"
                            ? "bg-cyan-400"
                            : kw.importance === "medium"
                            ? "bg-blue-400"
                            : "bg-slate-500"
                        }`}
                      />
                      <span className="font-semibold text-white">{kw.keyword}</span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        • {kw.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        {kw.count}× found
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          kw.importance === "high"
                            ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {kw.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Missing Keywords Benchmark */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    Missing Target Keywords ({missingKeywords.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-demand benchmark skills missing from your resume
                  </p>
                </div>
                <button
                  onClick={() => setShowJdModal(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  Custom Job Target
                </button>
              </div>

              <div className="space-y-2.5">
                {missingKeywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-rose-950/15 border border-rose-900/40 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="font-semibold text-white">{kw}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyKeyword(kw)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-200 text-xs transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedKeyword === kw ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>
                <strong>ATS Tip:</strong> Adding 2-3 of these missing keywords in your work achievements or projects can boost your compatibility by <strong>15% to 25%</strong>.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Section 3: Real Strengths & Areas for Improvement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths Identified */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <ThumbsUp className="w-5 h-5 text-emerald-400" />
              Verified Strengths ({strengths.length})
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Concrete competitive advantages detected in this resume
            </p>

            <div className="space-y-3">
              {strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-900/40 space-y-1 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2 font-semibold text-emerald-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{str.title}</span>
                  </div>
                  <p className="text-slate-300 pl-6 leading-relaxed">
                    {str.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Areas for Improvement ({weaknesses.length})
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Issues that may trigger ATS filtering or recruiter red flags
            </p>

            <div className="space-y-3">
              {weaknesses.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs sm:text-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{w.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        w.severity === "high"
                          ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {w.severity} priority
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{w.description}</p>
                  <p className="text-cyan-300 font-medium text-xs pt-1 border-t border-slate-800/80">
                    💡 Solution: {w.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Section 4: Actionable Recommendations by Category */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-400" />
              Personalized Improvement Action Plan
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Step-by-step checklist to increase your interview callback rate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions.map((cat, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">
                    {cat.priority}
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-white">
                    {cat.category}
                  </h4>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm">
                  {cat.suggestions.map((s, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm sm:text-base">
                Ready to optimize your CV?
              </h4>
              <p className="text-xs text-slate-400">
                You can apply these updates in the built-in free ATS builder
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/builder"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Open ATS Resume Builder
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Target Job Description Modal */}
      <AnimatePresence>
        {showJdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-fuchsia-400" />
                  Target Job Matching
                </h3>
                <button
                  onClick={() => setShowJdModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs text-slate-300">
                <p className="font-semibold text-white">How Target Job Matching Works:</p>
                <p className="text-slate-400 leading-relaxed">
                  ATS scanners compare applicants directly against specific job postings. 
                  If you only enter a <strong className="text-slate-200">Job Title</strong>, your resume is benchmarked against our general 400+ industry skills catalog. 
                  Pasting a complete <strong className="text-slate-200">Job Description</strong> calculates exact keyword alignment and flags high-priority missing terms.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Need an example?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetRole("Senior Full-Stack Developer");
                      setTargetJobDescription("We are looking for a Senior Full-Stack Developer with 4+ years of experience in React, Next.js, TypeScript, and Node.js. Experience with REST APIs, GraphQL, PostgreSQL, MongoDB, Docker, CI/CD pipelines, and cloud platforms like AWS or GCP is required. The ideal candidate has strong problem-solving skills, understands unit testing with Jest/Playwright, and has proven experience optimizing web application performance and accessibility (WCAG).");
                    }}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    + Load Sample Job Description
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Job Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Job Description Text
                </label>
                <textarea
                  rows={6}
                  value={targetJobDescription}
                  onChange={(e) => setTargetJobDescription(e.target.value)}
                  placeholder="Paste the job requirements, responsibilities, and qualifications here..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowJdModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowJdModal(false);
                    runAnalysis(resumeText, targetJobDescription, targetRole);
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold"
                >
                  Apply & Re-Analyze
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raw Extracted Text Modal */}
      <AnimatePresence>
        {showRawTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  Extracted Resume Text
                </h3>
                <button
                  onClick={() => setShowRawTextModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-400">
                This is the actual text parsed from your file by the ATS parser:
              </p>

              <textarea
                rows={12}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
              />

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">
                  {metrics.wordCount} words • {resumeText.length} characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRawTextModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowRawTextModal(false);
                      runAnalysis(resumeText);
                    }}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Save & Re-Analyze
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Icon helper
function FileCheck2(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m3 15 2 2 4-4" />
    </svg>
  );
}