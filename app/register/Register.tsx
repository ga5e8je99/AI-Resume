"use client";
import Link from "next/link";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Github,
  Twitter,
  Chrome,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { AxiosError } from "axios";
export default function Register() {
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);

  // Get API URL from environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL
  || "http://localhost:3000/api";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResponseData(null);

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!registerData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!registerData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Send registration request to backend API
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      });

      // Success
      setSuccess(true);
      setResponseData(response.data);

      // Save token to localStorage
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Reset form
      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Show success message for 5 seconds, then redirect
      setTimeout(() => {
        // Redirect to login or dashboard
        window.location.href = "/auth";
      }, 5000);

    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
    
      console.error("Registration error:", error);
    
      if (error.response) {
        // Server responded with error
        setError(error.response.data?.message || "Registration failed");
       
      } else if (error.request) {
        // Request was made but no response
        setError("Cannot connect to server. Please check if backend is running.");
      } else {
        // Other errors
        setError(error.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Test API connection
  const testAPIConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      alert(`API is working!\nStatus: ${response.data.message}\nDatabase: ${response.data.database.connected ? 'Connected' : 'Not connected'}`);
    } catch (error) {
      alert("Cannot connect to API. Make sure backend server is running on port 3000");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 ">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-400">Join our resume analyzer platform</p>
          
        </div>

        {/* Success Message */}
        {success && responseData && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
            <div className="flex items-center gap-3 text-blue-400 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Registration Successful!</span>
            </div>
            <p className="text-blue-300 text-sm mb-3">
              Welcome, {responseData.user?.name}! You will be redirected to login page in 5 seconds...
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Token: {responseData.token?.substring(0, 30)}...</div>
              <div>User ID: {responseData.user?._id || responseData.user?.id}</div>
              <div>Email: {responseData.user?.email}</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-xl">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Registration Failed</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            {responseData && (
              <pre className="mt-2 text-xs text-gray-400 overflow-auto">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, name: e.target.value })
                    }
                    required
                    placeholder="John Doe"
                    disabled={isLoading}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email Field */}
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
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    required
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="pl-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    required
                    placeholder="••••••••"
                    minLength={6}
                    disabled={isLoading}
                    className="pl-10 pr-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Password must be at least 6 characters
                </p>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-10 pr-10 w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-900 rounded disabled:opacity-50"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-300"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>

         
            {/* Social Login Divider */}
            <div className="relative my-8 flex items-center justify-center">
              <div className="w-1/4 border-t border-gray-700"></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800 text-gray-500">
                  Or sign up with
                </span>
              </div>
              <div className="w-1/4 border-t border-gray-700"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Github className="w-5 h-5 text-gray-300" />
              </button>
              <button 
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Twitter className="w-5 h-5 text-gray-300" />
              </button>
              <button 
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Chrome className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-300">
                Already have an account?{" "}
                <Link
                  href="/auth"
                  className="text-blue-500 hover:text-blue-400 font-semibold transition-colors inline-flex items-center"
                >
                  Sign in
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