'use client';

import Link from "next/link";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, LogOut, User, LogIn, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3.5 rounded-2xl md:rounded-4xl shadow-2xl mx-3 sm:mx-6 md:mx-10 mt-3 sm:mt-5 transition-all">
      <Logo size="md" />

      <div className="flex items-center gap-1.5 sm:gap-3">
        <Link
          href="/builder"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-100 hover:text-cyan-400 transition-all shadow-md group shrink-0"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="hidden sm:inline">Resume Builder</span>
          <span className="sm:hidden">Builder</span>
          <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            ATS
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs sm:text-sm transition-all"
                title="لوحة تحكم المشرف (Admin)"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="hidden lg:inline">Admin</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold text-xs sm:text-sm transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
              <span className="md:hidden">Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs sm:text-sm font-semibold transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}

        <Link href="/#scanner">
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-105 flex items-center gap-1.5 shrink-0 cursor-pointer">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="hidden sm:inline">Upload CV</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </Link>
      </div>
    </nav>
  );
}
