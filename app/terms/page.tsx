"use client";
import Link from "next/link";
import { Shield, FileText, Lock, AlertTriangle, ChevronRight } from "lucide-react";

export default function TermsOfService() {
  return (
    <main className="min-h-screen  text-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/30 rounded-2xl mb-6 border border-blue-700/50">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-cyan-300">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 md:p-10">
          {/* Introduction */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Welcome to <span className="font-semibold text-blue-300">Resume Analyzer Pro</span>. 
              These Terms of Service (&quot;Terms&quot;) govern your use of our website, services, and applications 
              (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound by 
              these Terms. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          {/* Accounts */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">2. User Accounts</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <p>You must be at least 18 years old to create an account</p>
              </div>
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <p>You are responsible for maintaining the confidentiality of your account and password</p>
              </div>
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <p>You agree to provide accurate and complete information during registration</p>
              </div>
              <div className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                <p>You must notify us immediately of any unauthorized use of your account</p>
              </div>
            </div>
          </section>

          {/* Service Description */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">3. Service Description</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                Our Service provides AI-powered resume analysis and optimization tools. We offer:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-blue-300 mb-2">Resume Analysis</h4>
                  <p className="text-sm">AI-powered review of your resume content and structure</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-blue-300 mb-2">ATS Optimization</h4>
                  <p className="text-sm">Improving compatibility with Applicant Tracking Systems</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-blue-300 mb-2">Content Suggestions</h4>
                  <p className="text-sm">Recommendations for improving your resume content</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-blue-300 mb-2">Formatting Tools</h4>
                  <p className="text-sm">Tools to enhance the visual appeal of your resume</p>
                </div>
              </div>
            </div>
          </section>

          {/* User Content */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">4. User Content</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                You retain all rights to the content you upload to our Service. However, by uploading content:
              </p>
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <p className="text-sm">
                    We do not claim ownership of your resume data or personal information
                  </p>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                  <p className="text-sm">
                    Your data is processed securely and in accordance with our Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-red-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">5. Prohibited Activities</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>You agree not to:</p>
              <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4 mt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                  <p className="text-sm">Use the Service for any illegal purpose</p>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                  <p className="text-sm">Attempt to gain unauthorized access to our systems</p>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                  <p className="text-sm">Upload malicious content or viruses</p>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-1 shrink-0" />
                  <p className="text-sm">Share your account credentials with others</p>
                </div>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">6. Limitation of Liability</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                To the maximum extent permitted by law, Resume Analyzer Pro shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages resulting from your use of the Service.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-xl p-4 mt-4">
                <p className="text-sm text-yellow-200">
                  The Service provides AI-powered suggestions and analysis. While we strive for accuracy, 
                  we do not guarantee job placement or specific outcomes from using our Service.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">7. Changes to Terms</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of significant 
                changes via email or through the Service. Continued use of the Service after changes 
                constitutes acceptance of the new Terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-cyan-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">8. Contact Information</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 max-w-md">
                <p className="font-medium">Email: legal@resumeanalyzer.pro</p>
                <p className="text-sm text-gray-400 mt-1">We typically respond within 2 business days</p>
              </div>
            </div>
          </section>

          {/* Agreement */}
          <div className="mt-12 p-6 bg-linear-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl border border-blue-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-white">Acceptance of Terms</h3>
            </div>
            <p className="text-gray-300">
              By creating an account and using our Service, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Service.
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link 
                href="/auth" 
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                ← Return to Sign Up
              </Link>
              <Link 
                href="/privacy" 
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                Read Privacy Policy
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}