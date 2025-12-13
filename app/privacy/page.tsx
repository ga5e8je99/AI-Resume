"use client";
import Link from "next/link";
import { Shield, Lock, Database, EyeOff, Mail, Server, ChevronRight } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen text-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-2xl mb-6 border border-green-700/50">
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-green-400 to-emerald-300">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 md:p-10">
          {/* Introduction */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              At <span className="font-semibold text-green-300">Resume Analyzer Pro</span>, we take your privacy seriously. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our Service. Please read this policy carefully.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                    <span>Name and email address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                    <span>Account credentials (securely hashed)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2"></div>
                    <span>Contact information provided voluntarily</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Resume Data</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                    <span>Resume content you upload for analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                    <span>Analysis results and optimization suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt=2"></div>
                    <span>Job preferences and career goals (if provided)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <EyeOff className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Usage Data</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2"></div>
                    <span>Log data and analytics information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2"></div>
                    <span>Device information and browser type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt=2"></div>
                    <span>Cookies and similar tracking technologies</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">3. How We Use Your Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/30">
                <h4 className="font-semibold text-blue-300 mb-2">Service Operation</h4>
                <p className="text-sm text-gray-300">To provide and maintain our Service</p>
              </div>
              <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-800/30">
                <h4 className="font-semibold text-purple-300 mb-2">Improvement</h4>
                <p className="text-sm text-gray-300">To enhance and optimize our algorithms</p>
              </div>
              <div className="bg-green-900/20 p-4 rounded-xl border border-green-800/30">
                <h4 className="font-semibold text-green-300 mb-2">Communication</h4>
                <p className="text-sm text-gray-300">To send important updates and notifications</p>
              </div>
              <div className="bg-cyan-900/20 p-4 rounded-xl border border-cyan-800/30">
                <h4 className="font-semibold text-cyan-300 mb-2">Security</h4>
                <p className="text-sm text-gray-300">To protect against fraud and abuse</p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-start gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <Lock className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Encryption</h4>
                  <p className="text-sm">All data is encrypted in transit using TLS 1.2+</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <Shield className="w-5 h-5 text-green-400 mt-1 shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Access Control</h4>
                  <p className="text-sm">Strict access controls and authentication mechanisms</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <Server className="w-5 h-5 text-green-400 mt=1 shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Secure Storage</h4>
                  <p className="text-sm">Industry-standard security for data at rest</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">5. Data Sharing & Third Parties</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                We do not sell your personal information to third parties. We may share data with:
              </p>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <p className="text-sm">Service providers who assist in operating our platform</p>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <p className="text-sm">Legal authorities when required by law</p>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <p className="text-sm">Analytics providers (anonymized data only)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">6. Your Rights</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <h4 className="font-semibold text-white mb-2">Access & Correction</h4>
                <p className="text-sm text-gray-300">Access and update your personal information</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <h4 className="font-semibold text-white mb-2">Data Portability</h4>
                <p className="text-sm text-gray-300">Request a copy of your data in standard format</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <h4 className="font-semibold text-white mb-2">Deletion</h4>
                <p className="text-sm text-gray-300">Request deletion of your account and data</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <h4 className="font-semibold text-white mb-2">Opt-Out</h4>
                <p className="text-sm text-gray-300">Opt-out of marketing communications</p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">7. Cookies & Tracking</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                We use cookies and similar technologies to:
              </p>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">Essential</div>
                    <p className="text-xs mt-1">Required for basic functionality</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">Analytics</div>
                    <p className="text-xs mt-1">Help us improve our service</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">Preference</div>
                    <p className="text-xs mt-1">Remember your settings</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                You can control cookies through your browser settings. Disabling essential cookies may affect Service functionality.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-6 bg-green-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-white">8. Contact Us</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>
                For privacy-related questions or to exercise your rights, contact our Data Protection Officer:
              </p>
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 max-w-md">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="font-medium">privacy@resumeanalyzer.pro</p>
                    <p className="text-sm text-gray-400">Response within 72 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Compliance */}
          <div className="mt-12 p-6 bg-linear-to-r from-green-900/30 to-emerald-900/30 rounded-2xl border border-green-700/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold text-white">Compliance & Updates</h3>
            </div>
            <p className="text-gray-300">
              We comply with applicable data protection laws including GDPR and CCPA. 
              This Privacy Policy may be updated periodically. We will notify you of significant changes.
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link 
                href="/terms" 
                className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
              >
                ← View Terms of Service
              </Link>
              <Link 
                href="/auth" 
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                Return to Sign Up
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}