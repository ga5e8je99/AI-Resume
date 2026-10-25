'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  ShieldCheck,
  Sparkles,
  Upload,
  Menu,
  X,
  FileText,
  FileCheck2,
  Mail,
  User,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 md:px-10 pt-3 sm:pt-4">
      <nav
        aria-label="Main Navigation"
        className="flex justify-between items-center bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-xl transition-all"
      >
        {/* Brand Logo */}
        <Logo size="md" />

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3">
          <Link
            href="/cover-letter"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-xs xl:text-sm font-semibold text-slate-200 hover:text-amber-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all shadow-sm group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Cover Letter</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AI
            </span>
          </Link>

          <Link
            href="/builder"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs xl:text-sm font-semibold text-slate-100 hover:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all shadow-sm group"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Resume Builder</span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ATS
            </span>
          </Link>

          <Link
            href="/cv-builder"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 text-xs xl:text-sm font-semibold text-slate-100 hover:text-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-all shadow-sm group"
          >
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>CV Builder</span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              PRO
            </span>
          </Link>

          <Link
            href="/review"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs xl:text-sm font-semibold text-slate-200 hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>ATS Diagnostic</span>
          </Link>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin</span>
                </Link>
              )}

              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold text-xs sm:text-sm transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.name.split(' ')[0]}</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none transition-colors"
                title="Log Out"
                aria-label="Log Out of your account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs sm:text-sm font-semibold focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Primary CTA (Desktop and Tablet) */}
          <Link
            href="/#upload"
            className="hidden md:inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-3.5 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-all cursor-pointer"
            aria-label="Upload CV to ATS Scanner"
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Upload CV</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="lg:hidden mt-2 p-4 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col gap-2.5 animate-in fade-in transition-all"
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Build & Optimize
          </div>

          <Link
            href="/builder"
            onClick={closeMobileMenu}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sm font-semibold text-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Resume Builder (ATS)</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              ATS
            </span>
          </Link>

          <Link
            href="/cv-builder"
            onClick={closeMobileMenu}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sm font-semibold text-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Full CV Builder (13 Sections)</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PRO
            </span>
          </Link>

          <Link
            href="/cover-letter"
            onClick={closeMobileMenu}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sm font-semibold text-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Cover Letter Generator</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              AI
            </span>
          </Link>

          <Link
            href="/review"
            onClick={closeMobileMenu}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sm font-semibold text-slate-100 transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
            <span>ATS Diagnostic & Score</span>
          </Link>

          <Link
            href="/#upload"
            onClick={closeMobileMenu}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 mt-1"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CV for Instant Scan</span>
          </Link>

          <div className="border-t border-slate-800/80 my-1 pt-2">
            {user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-sm font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                  <span>My Dashboard ({user.name.split(' ')[0]})</span>
                </Link>

                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  className="flex items-center justify-center gap-2 p-2 rounded-xl text-rose-400 hover:bg-rose-950/20 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex-1 text-center py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="flex-1 text-center py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-500 shadow-md"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
