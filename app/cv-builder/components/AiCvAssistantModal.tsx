'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  Loader2,
  Wand2,
  BookOpen,
  Zap,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface AiCvAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  onApplySummary: (summary: string) => void;
  onApplyBullet: (bullet: string) => void;
}

export default function AiCvAssistantModal({
  isOpen,
  onClose,
  jobTitle,
  onApplySummary,
  onApplyBullet,
}: AiCvAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'bullets'>('summary');
  const [targetTitle, setTargetTitle] = useState(jobTitle || 'Senior Software Engineer');
  const [yearsExperience, setYearsExperience] = useState('7+');
  const [keySkillsInput, setKeySkillsInput] = useState('System Design, Cloud, Leadership');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedResult('');

    setTimeout(() => {
      if (activeTab === 'summary') {
        if (language === 'ar') {
          setGeneratedResult(
            `خبير ومحترف في مجالات ${targetTitle} بخبرة تتجاوز ${yearsExperience} سنوات في قيادة المشاريع التقنية المعقدة، وتطوير البنى التحتية السحابية، وابتكار حلول الذكاء الاصطناعي عالية الكفاءة. سجل حافل في تسليم منصات برمجية تخدم ملايين المستخدمين بنسبة توافر 99.9%، وإدارة فرق عمل متعددة التخصصات، وتحقيق وفورات تشغيلية استراتيجية تتجاوز 35%. شغوف بالبحث والتطوير والابتكار المستمر.`
          );
        } else {
          setGeneratedResult(
            `Results-driven ${targetTitle} with ${yearsExperience} years of proven expertise in architecting scalable enterprise systems, cross-functional engineering leadership, and high-performance computing. Proven track record of spearheading mission-critical software initiatives serving millions of users with 99.98% reliability while reducing operational overhead by 40%. Passionate about mentoring engineering talent, driving technology roadmaps, and translating complex business requirements into cutting-edge solutions.`
          );
        }
      } else {
        if (language === 'ar') {
          setGeneratedResult(
            `• قاد عملية إعادة تصميم البنية التحتية لمنظومة البيانات مما أدى إلى خفض زمن الاستجابة بنسبة 65% وتوفير تكاليف سنوية قدرها 120,000 دولار.\n• أشرف على توجيه وتدريب فريق من 12 مهندساً وساهم في رفع الإنتاجية بنسبة 30% وفق معايير Agile وDevOps.\n• طوّر ونشر خدمات سحابية متقدمة تتعامل مع أكثر من 50,000 طلب في الثانية بدقة واعتمادية عالية.`
          );
        } else {
          setGeneratedResult(
            `• Spearheaded end-to-end migration of core services to Kubernetes microservices, slashing API latency by 45% and reducing annual cloud expenses by $180,000.\n• Mentored and empowered a high-velocity team of 14 engineers, establishing automated CI/CD canary deployments that boosted release velocity by 3.5x.\n• Designed and delivered fault-tolerant data pipelines processing 100M+ real-time events daily with zero data loss.`
          );
        }
      }
      setIsGenerating(false);
    }, 600);
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!generatedResult) return;
    if (activeTab === 'summary') {
      onApplySummary(generatedResult);
    } else {
      onApplyBullet(generatedResult);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI CV Writing Assistant</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SMART ATS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Generate high-impact executive summaries and STAR-method accomplishments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Executive CV Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bullets')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bullets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Impact Bullet Points (STAR Method)
          </button>
        </div>

        {/* Form content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Role / Job Title
              </label>
              <input
                type="text"
                value={targetTitle}
                onChange={(e) => setTargetTitle(e.target.value)}
                placeholder="e.g. Senior Machine Learning Engineer"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Years of Experience
              </label>
              <input
                type="text"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="e.g. 8+ years"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Language:</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  language === 'en'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  language === 'ar'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Result Preview Box */}
          {generatedResult && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Generated Content Ready
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p
                className={`text-xs text-slate-200 leading-relaxed whitespace-pre-line ${
                  language === 'ar' ? 'text-right font-sans' : 'text-left'
                }`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {generatedResult}
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to My CV</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
