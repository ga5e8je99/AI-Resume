"use client";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";


interface Keyword {
  keyword: string;
  count: number;
  importance: "high" | "medium" | "low";
}

interface Strength {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Weakness {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
}

interface Suggestion {
  category: string;
  suggestions: string[];
  priority: number;
}

export default function ReviewResultPage() {
  const [atsScore, setAtsScore] = useState(78);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // تم تصحيح اسم المتغير

  // Sample Data
  const keywordsDetected: Keyword[] = [
    { keyword: "React", count: 12, importance: "high" },
    { keyword: "TypeScript", count: 8, importance: "high" },
    { keyword: "Node.js", count: 6, importance: "medium" },
    { keyword: "AWS", count: 4, importance: "medium" },
    { keyword: "JavaScript", count: 10, importance: "high" },
    { keyword: "Redux", count: 3, importance: "low" },
    { keyword: "Git", count: 5, importance: "medium" },
    { keyword: "Docker", count: 2, importance: "low" },
  ];

  const missingKeywords = [
    "Next.js",
    "GraphQL",
    "MongoDB",
    "CI/CD",
    "REST APIs",
    "Agile Methodologies",
  ];

  const strengths: Strength[] = [
    {
      title: "Strong Technical Stack",
      description: "Comprehensive coverage of modern web technologies",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      title: "Quantifiable Achievements",
      description: "Good use of metrics and measurable results",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      title: "Proper Formatting",
      description: "Clean structure with clear section separation",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: "Relevant Keywords",
      description: "Good keyword density for target position",
      icon: <Search className="w-5 h-5" />,
    },
  ];

  const weaknesses: Weakness[] = [
    {
      title: "Missing Target Keywords",
      description: "Some important job-specific keywords are missing",
      severity: "high",
      suggestion:
        "Add keywords like 'Next.js' and 'GraphQL' to match job requirements",
    },
    {
      title: "Action Verbs",
      description: "Could use more powerful action verbs",
      severity: "medium",
      suggestion:
        "Replace passive phrases with verbs like 'Led', 'Developed', 'Optimized'",
    },
    {
      title: "Bullet Point Length",
      description: "Some bullet points are too brief",
      severity: "low",
      suggestion: "Expand brief points to highlight specific achievements",
    },
    {
      title: "Personal Projects",
      description: "Limited showcase of personal projects",
      severity: "medium",
      suggestion: "Add 2-3 relevant personal projects with GitHub links",
    },
  ];

  const suggestions: Suggestion[] = [
    {
      category: "Content",
      suggestions: [
        "Add 3-4 more technical keywords from job description",
        "Include specific metrics in 75% of bullet points",
        "Add a professional summary at the top",
      ],
      priority: 1,
    },
    {
      category: "Formatting",
      suggestions: [
        "Use consistent bullet point formatting",
        "Ensure proper spacing between sections",
        "Use a clean, modern font throughout",
      ],
      priority: 2,
    },
    {
      category: "Structure",
      suggestions: [
        "Reorder sections: Skills > Experience > Education",
        "Combine similar technologies in skills section",
        "Add links to portfolio and GitHub",
      ],
      priority: 3,
    },
  ];

  const handleDownloadReport = () => {
    setLoading(true);
    // Simulate download
    setTimeout(() => {
      setLoading(false);
      alert("Report downloaded successfully!");
    }, 1500);
  };

  const handleUpdateItem = (type: string, index: number) => {
    // In a real app, this would open an edit modal or form
    alert(`Update ${type} at index ${index}`);
  };

  const handleRegenerateAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setAtsScore((prev) => Math.min(prev + 5, 95));
      setLoading(false);
    }, 2000);
  };

  // محاكاة حالة التحميل عند دخول الصفحة
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsLoading(true);
    });
  
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  
    return () => clearTimeout(timer);
  }, []);
  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-64 h-64 mx-auto">
            {/* Loading Animation Placeholder - استخدم Lottie هنا إذا كان متوفرًا */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-8 rounded-full border-4 border-transparent border-b-green-500 animate-spin animation-delay-300"></div>
            <div className="absolute inset-16 rounded-full border-4 border-transparent border-l-purple-500 animate-spin animation-delay-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className="w-16 h-16 text-white/50" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-8">Analyzing Your Resume...</h2>
          <p className="text-gray-400 mt-2">Our AI is checking for ATS compatibility</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="shadow-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-white">
                  Resume Analysis Report
                </h1>
                <p className="text-sm text-gray-400">
                  Senior Frontend Developer Application
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download Full Report (PDF)</span>
                  <span className="sm:hidden">Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Score Card & Main Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* ATS Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ATS Compatibility Score
                </h2>
                <p className="text-gray-400">
                  How well your resume matches applicant tracking systems
                </p>
              </div>
              <button
                onClick={handleRegenerateAnalysis}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Circular Progress */}
              <div className="relative w-40 h-40">
                {/* SVG Circular Progress (no inline styles) */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-40 h-40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" strokeWidth="10" className="stroke-gray-700 fill-transparent" />
                    {/* Foreground arc - strokeDashoffset computed from atsScore */}
                    {/* circumference = 2 * PI * 45 ≈ 282.743 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="stroke-indigo-500 fill-transparent transform -rotate-90 origin-center transition-all"
                      strokeDasharray={282.743}
                      strokeDashoffset={282.743 - (atsScore / 100) * 282.743}
                    />
                  </svg>

                  <div className="absolute inset-8 rounded-full bg-gray-900 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-4xl font-bold text-white">{atsScore}%</span>
                    <span className="text-sm text-gray-400 mt-1">Score</span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="flex-1 space-y-4 w-full">
                {[
                  { label: "Keywords Match", value: 85, color: "bg-green-500" },
                  { label: "Formatting", value: 90, color: "bg-blue-500" },
                  { label: "Structure", value: 75, color: "bg-yellow-500" },
                  {
                    label: "Content Quality",
                    value: 80,
                    color: "bg-purple-500",
                  },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="font-semibold text-white">{item.value}%</span>
                    </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-1000 ${"w-[" + item.value + "%]"}`}
                        />
                      </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Target className="w-5 h-5" />,
                  label: "Job Match",
                  value: "Very Good",
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  label: "Reading Time",
                  value: "6.2s",
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  label: "Overall Grade",
                  value: "B+",
                },
                {
                  icon: <Award className="w-5 h-5" />,
                  label: "Rank",
                  value: "Top 25%",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-900/30 rounded-lg mb-2">
                    <div className="text-indigo-400">{stat.icon}</div>
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  <div className="font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <Sparkles className="w-8 h-8 mb-4" />
              <h3 className="text-xl font-bold mb-2">AI Suggestions</h3>
              <p className="text-blue-200 mb-4">
                Get personalized recommendations to improve your score
              </p>
              <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                View AI Recommendations
              </button>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 shadow-lg">
              <BarChart3 className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Compare with Industry</h3>
              <p className="text-gray-400 text-sm mb-4">
                See how you stack up against similar candidates
              </p>
              <button className="w-full border-2 border-blue-500 text-blue-500 py-2 rounded-lg font-semibold hover:border-blue-400 hover:text-blue-400 transition-colors">
                View Benchmark Data
              </button>
            </div>
          </motion.div>
        </div>

        {/* Keywords Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Keywords Detected */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-green-400" />
                Keywords Detected
                <span className="text-sm font-normal text-gray-400">
                  ({keywordsDetected.length} found)
                </span>
              </h3>
              <button
                onClick={() => handleUpdateItem("keywords", 0)}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Update
              </button>
            </div>

            <div className="space-y-4">
              {keywordsDetected.map((keyword, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        keyword.importance === "high"
                          ? "bg-green-500"
                          : keyword.importance === "medium"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className="font-medium text-white">{keyword.keyword}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {keyword.count}x found
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        keyword.importance === "high"
                          ? "bg-green-900/30 text-green-400 border border-green-800"
                          : keyword.importance === "medium"
                          ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {keyword.importance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Missing Keywords */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Missing Keywords
                <span className="text-sm font-normal text-gray-400">
                  ({missingKeywords.length} missing)
                </span>
              </h3>
              <button
                onClick={() => handleUpdateItem("missingKeywords", 0)}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Update
              </button>
            </div>

            <div className="space-y-3">
              {missingKeywords.map((keyword, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-red-900/20 border border-red-800/50 rounded-lg hover:bg-red-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="font-medium text-white">{keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(keyword);
                        alert(`Copied: ${keyword}`);
                      }}
                      className="p-1 hover:bg-red-800/30 rounded transition-colors"
                      title="Copy keyword"
                    >
                      <Copy className="w-4 h-4 text-red-400 hover:text-red-300" />
                    </button>
                    <button
                      onClick={() => handleUpdateItem("addKeyword", idx)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Add to Resume
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300">
                    <strong>Tip:</strong> Add 2-3 missing keywords to increase
                    your ATS score by 15-20%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-400" />
                Strengths
                <span className="text-sm font-normal text-gray-400">
                  ({strengths.length} identified)
                </span>
              </h3>
              <button
                onClick={() => handleUpdateItem("strengths", 0)}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Update
              </button>
            </div>

            <div className="space-y-4">
              {strengths.map((strength, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-green-900/10 border border-green-800/30 rounded-lg hover:bg-green-900/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-900/30 rounded-lg">
                      <div className="text-green-400">{strength.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">
                        {strength.title}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {strength.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Areas for Improvement
                <span className="text-sm font-normal text-gray-400">
                  ({weaknesses.length} identified)
                </span>
              </h3>
              <button
                onClick={() => handleUpdateItem("weaknesses", 0)}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Update
              </button>
            </div>

            <div className="space-y-4">
              {weaknesses.map((weakness, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-l-4 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 transition-colors ${
                    weakness.severity === "high"
                      ? "border-red-500"
                      : weakness.severity === "medium"
                      ? "border-yellow-500"
                      : "border-gray-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-white">
                      {weakness.title}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        weakness.severity === "high"
                          ? "bg-red-900/30 text-red-400 border border-red-800"
                          : weakness.severity === "medium"
                          ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      {weakness.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    {weakness.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-indigo-400 flex-1">
                      {weakness.suggestion}
                    </p>
                    <button
                      onClick={() => handleUpdateItem("fixWeakness", idx)}
                      className="ml-4 text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                    >
                      Fix
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Suggestions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-400" />
              Actionable Suggestions
              <span className="text-sm font-normal text-gray-400">
                (Priority order)
              </span>
            </h3>
            <button
              onClick={() => handleUpdateItem("suggestions", 0)}
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Update All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions
              .sort((a, b) => a.priority - b.priority)
              .map((category, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/30 border border-gray-700 rounded-xl p-5 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        category.priority === 1
                          ? "border-red-500 text-red-400 bg-red-900/20"
                          : category.priority === 2
                          ? "border-yellow-500 text-yellow-400 bg-yellow-900/20"
                          : "border-blue-500 text-blue-400 bg-blue-900/20"
                      }`}
                    >
                      {category.priority}
                    </div>
                    <h4 className="font-bold text-lg text-white">
                      {category.category}
                    </h4>
                  </div>

                  <ul className="space-y-3">
                    {category.suggestions.map((suggestion, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">
                          {suggestion}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() =>
                      handleUpdateItem(`suggestion-${category.category}`, idx)
                    }
                    className="mt-4 w-full text-center text-indigo-400 hover:text-indigo-300 text-sm font-medium py-2 border border-indigo-700 rounded-lg hover:bg-indigo-900/20 transition-colors"
                  >
                    Apply All Suggestions
                  </button>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className=" border rounded-2xl p-8 text-white"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Ready to improve your resume?
              </h3>
              <p className="text-gray-300">
                Apply all suggestions and regenerate your ATS score
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRegenerateAnalysis}
                disabled={loading}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Apply All & Regenerate
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadReport}
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Report
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Estimated Time", value: "15-20 min" },
                { label: "Score Increase", value: "15-25%" },
                { label: "Interview Chance", value: "+40%" },
                { label: "Last Updated", value: "Just now" },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                  <div className="font-bold text-lg">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}