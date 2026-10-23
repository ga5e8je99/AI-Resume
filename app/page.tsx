"use client";
import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Logo from "./components/Logo";
import { resumes } from "./contents/index";
import ResumeCard from "./components/ResumeCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, Sparkles, ChevronRight, PlayCircle, Zap, Shield, Users, Search, FileCheck, Award, Clock, ArrowRight, Star, AlertCircle } from "lucide-react";
import { extractTextFromFile } from "./lib/pdfExtractor";

export default function Home() {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Smart ATS Analysis",
      description: "Detect missing keywords and optimize your resume for applicant tracking systems"
    },
    {
      icon: <FileCheck className="w-6 h-6" />,
      title: "Job Match Comparison",
      description: "Compare your CV against specific job requirements for perfect alignment"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Ready-to-Use Reports",
      description: "Get detailed improvement reports with actionable recommendations"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Quick Results",
      description: "Receive comprehensive analysis in under 2 minutes"
    }
  ];

  const steps = [
    { number: "01", title: "Upload Your CV", description: "Drag & drop your resume or select from device" },
    { number: "02", title: "Select Job Target", description: "Choose the position you're applying for" },
    { number: "03", title: "Automatic Analysis", description: "Our AI analyzes your resume instantly" },
    { number: "04", title: "Get Full Report", description: "Receive comprehensive ATS optimization report" }
  ];

  const router = useRouter();
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const processSelectedFile = async (file: File) => {
    try {
      setIsProcessingFile(true);
      setFileError(null);
      setUploadedFile(file);

      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 25) {
        throw new Error("Could not extract readable text from this file. Ensure the PDF contains digital text, not only scanned photos.");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("jobmatch_resume_text", text);
        sessionStorage.setItem("jobmatch_resume_filename", file.name);
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setFileError(err.message || "Failed to parse file.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  return (
    <>
      <section className="min-h-screen ">
        <Navbar />
        
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20 text-center">
          <div 
            className="max-w-4xl mx-auto animate-fadeIn delay-200"
          >
            <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 px-4 py-2 rounded-full mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">
                AI-Powered Resume Optimization
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-linear-to-r from-gray-300 to-indigo-700 bg-clip-text text-transparent">
              ATS Resume Builder & Checker
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create professional, ATS-optimized resumes and check your CV for keyword strength, formatting issues, and recruiter-ready quality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Link href={'/builder'} className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/25 flex items-center gap-2 group">
                <Sparkles className="w-5 h-5 text-cyan-200" />
                Build ATS Resume Free
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href={'/auth'} className="border border-slate-700 bg-slate-900/60 text-slate-200 px-8 py-3 rounded-lg font-semibold text-lg hover:border-slate-500 hover:bg-slate-800 transition-all duration-300 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Start Analysis
              </Link>
              <Link href={'#upload'} className="border border-slate-700 bg-slate-900/60 text-slate-200 px-8 py-3 rounded-lg font-semibold text-lg hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Existing CV
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-20">
            {[
              { number: "95%", label: "Success Rate" },
              { number: "50K+", label: "Resumes Analyzed" },
              { number: "98%", label: "Client Satisfaction" },
              { number: "2min", label: "Average Analysis" }
            ].map((stat, idx) => (
              <div 
                key={idx}
                ref={(el) => { sectionRefs.current[idx] = el; }}
                className="p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 border border-slate-800 bg-slate-900/60 backdrop-blur-md hover:border-slate-700"
              >
                <div className="text-3xl font-bold text-indigo-400 mb-2">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Resume Templates Section */}
        <div className="container mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Professional Resume Templates</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose from ATS-friendly templates designed to pass through any applicant tracking system
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {resumes.length > 0 &&
              resumes.map((resume, idx) => (
                <div 
                  key={resume.id}
                  ref={(el) => { sectionRefs.current[4 + idx] = el; }}
                  className="opacity-0"
                >
                  <ResumeCard resume={resume} />
                </div>
              ))}
          </div>
        </div>

        {/* Why Use Our ATS Checker */}
        <div className="py-20 mb-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our ATS Checker?</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Comprehensive analysis tools to ensure your resume stands out
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  ref={(el) => { sectionRefs.current[8 + idx] = el; }}
                  className="border border-slate-800 bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 opacity-0 hover:border-slate-700"
                >
                  <div className=" bg-linear-to-tr from-blue-500 to-pink-500 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                    <div >
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple 4-step process to optimize your resume
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step, idx) => (
              <div 
                key={idx}
                ref={(el) => { sectionRefs.current[12 + idx] = el; }}
                className="relative opacity-0"
              >
                
                <div className="p-8 border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-slate-700">
                  <div className="text-4xl font-bold text-indigo-100 mb-4">{step.number}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Section */}
        <div className="container mx-auto px-6 mb-20" >
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto backdrop-blur-xl shadow-2xl" id="upload">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Upload Your Resume</h2>
              <p className="text-gray-300">Get instant ATS analysis right on this page</p>
            </div>
            
            <div 
              ref={(el) => { sectionRefs.current[16] = el; }}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="bg-slate-950/40 backdrop-blur-sm border-2 border-dashed border-slate-700 hover:border-indigo-500/50 transition-colors rounded-2xl p-8 text-center opacity-0"
            >
              {isProcessingFile ? (
                <div className="py-8 flex flex-col items-center justify-center animate-pulse">
                  <div className="w-12 h-12 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin mb-4" />
                  <h3 className="text-lg font-bold text-white mb-1">Extracting Resume Text...</h3>
                  <p className="text-sm text-cyan-300">Reading ATS sections, skills, and formatting</p>
                </div>
              ) : fileError ? (
                <div className="py-6 animate-fadeIn">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-red-300 mb-2">Error Reading File</h3>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setFileError(null);
                        setUploadedFile(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                    >
                      Upload Another File
                    </button>
                    <Link
                      href="/review"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md"
                    >
                      Paste Text or View Sample →
                    </Link>
                  </div>
                </div>
              ) : uploadedFile ? (
                <div className="animate-fadeIn py-2">
                  <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                    ✓ Resume Text Extracted
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{uploadedFile.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">Ready for genuine ATS & Keyword analysis</p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        setUploadedFile(null);
                        setFileError(null);
                      }}
                      className="text-slate-400 hover:text-white text-sm transition-colors px-4 py-2.5 rounded-xl border border-slate-700"
                    >
                      Change file
                    </button>
                    <Link
                      href={'/review'}
                      className="bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:opacity-95 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Review Real ATS Analytics
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-white/60 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-4">Drag & drop your resume here</h3>
                  <p className="text-gray-300 mb-6">Supports PDF, DOC, DOCX (Max 5MB)</p>
                  <label className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 cursor-pointer transition-colors">
                    Browse Files
                    <input 
                      type="file" 
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                </>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: <Shield />, text: "Secure & Private" },
                { icon: <Zap />, text: "Instant Results" },
                { icon: <Users />, text: "No Registration" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-center gap-3 text-white/80">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="container mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Before & After Optimization</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See the difference our AI-powered optimization makes
            </p>
          </div>
          
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Before Optimization */}
            <div 
              ref={(el) => { sectionRefs.current[17] = el; }}
              className="border border-red-500/20 bg-slate-900/70 backdrop-blur-md p-8 rounded-2xl shadow-lg opacity-0"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="text-2xl font-bold text-gray-100">Before Optimization</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  "Generic job descriptions",
                  "Missing keywords",
                  "Poor formatting",
                  "Low ATS score",
                  "No quantifiable achievements"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-red-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-red-400 mb-2">45%</div>
                  <div className="text-gray-400">Average ATS Score</div>
                </div>
              </div>
            </div>

            {/* After Optimization */}
            <div 
              ref={(el) => { sectionRefs.current[18] = el; }}
              className="border border-emerald-500/20 bg-slate-900/70 backdrop-blur-md p-8 rounded-2xl shadow-lg opacity-0"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-2xl font-bold text-gray-100">After Optimization</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  "Keyword-optimized content",
                  "ATS-friendly formatting",
                  "Quantified achievements",
                  "Proper section structure",
                  "Industry-specific terminology"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-green-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400 mb-2">92%</div>
                  <div className="text-gray-400">Average ATS Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div 
          ref={(el) => { sectionRefs.current[19] = el; }}
          className="container mx-auto px-6 mb-20 opacity-0"
        >
          <div className="rounded-3xl p-12 text-center text-white bg-linear-to-r from-blue-950/40 via-purple-950/40 to-slate-950/60 border border-purple-500/20 backdrop-blur-md shadow-2xl">
            <Sparkles className="w-12 h-12 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Optimize Your Resume?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join 50,000+ professionals who landed interviews with our ATS-optimized resumes
            </p>
            
            <Link href={'/auth'} className="group bg-white text-gray-900 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center gap-3">
              <Star className="w-5 h-5" />
              Start Your Free Analysis Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            
            <div className="mt-8 text-white/70">
              <p>No credit card required • 100% Free Analysis • Results in 2 minutes</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
      <footer className="border-t border-slate-800/80 backdrop-blur-3xl py-10 px-6 sm:px-10 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-right">
            <p>&copy; {new Date().getFullYear()} JobMatch AI. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1">Smart Resume Analysis & ATS Optimization</p>
          </div>
        </div>
      </footer>
    </>
  );
}