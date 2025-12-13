"use client";
import Link from "next/link";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  Linkedin,
  Facebook,
} from "lucide-react";
import React, { useState } from "react";

import { useRouter } from "next/navigation";

export default function AuthPageClient() {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const route = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    setTimeout(() => {
      try {
        const mockResponse = {
          token: "mock_jwt_token_" + Math.random().toString(36).substr(2, 9),
          user: {
            id: "mock_user_" + Math.random().toString(36).substr(2, 9),
            name: loginData.email.split("@")[0],
            email: loginData.email,
          },
        };

        // Success
        setSuccess(true);

        localStorage.setItem("auth_token", mockResponse.token);
        localStorage.setItem("user", JSON.stringify(mockResponse.user));

        // Reset form
        setLoginData({ email: "", password: "" });

        // Show success message for 3 seconds, then redirect
      } catch (err) {
        setError("Login failed. Please try again.");
        console.error("Login error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
    setTimeout(() => {
      route.push("/#upload");
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-200 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue your job search journey
          </p>
        </div>

        {/* عرض رسائل الخطأ أو النجاح */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-300 rounded-xl text-sm">
            Login successful! Redirecting...
          </div>
        )}

        <div className=" bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-700 ">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={loginData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="you@example.com"
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300"
                >
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8 flex items-center justify-center">
              <div className="w-1/4 border-t border-gray-300"></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-gray-500">
                  Or continue with
                </span>
              </div>
              <div className="w-1/4 border-t border-gray-300"></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className="flex items-center justify-center p-3 border border-gray-300 rounded-xl hover:text-gray-500 hover:border-gray-500 transition-colors"
                title="Sign in with GitHub"
                aria-label="Sign in with GitHub"
              >
                <Github className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center p-3 border border-gray-300 rounded-xl hover:text-gray-500 hover:border-gray-500 transition-colors"
                title="Sign in with LinkedIn"
                aria-label="Sign in with LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center p-3 border border-gray-300 rounded-xl hover:text-gray-500 hover:border-gray-500 transition-colors"
                title="Sign in with Facebook"
                aria-label="Sign in with Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-300">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors inline-flex items-center"
                >
                  Create account
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
