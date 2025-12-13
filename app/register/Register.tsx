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
} from "lucide-react";
import { useState, FormEvent } from "react";

// Typed shape for the (mock) registration response
interface RegisterResponse {
  token?: string;
  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

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
  const [responseData, setResponseData] = useState<RegisterResponse | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResponseData(null);
    setOpenAlert(true);
    console.log("Submitting registration with data:", responseData);

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

    // محاكاة اتصال API
    setTimeout(() => {
      try {
        // محاكاة الرد الناجح
        const mockResponse = {
          token: "mock_jwt_token_" + Math.random().toString(36).substr(2, 9),
          user: {
            id: "mock_user_" + Math.random().toString(36).substr(2, 9),
            name: registerData.name,
            email: registerData.email,
          },
        };

        // Success
        setSuccess(true);
        setResponseData(mockResponse);

        // Save token to localStorage (محتوى تجريبي)
        localStorage.setItem("auth_token", mockResponse.token);
        localStorage.setItem("user", JSON.stringify(mockResponse.user));

        // Reset form
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Show success message for 5 seconds, then redirect
        setTimeout(() => {
          window.location.href = "/auth";
        }, 5000);
      } catch (err) {
        setError("Registration simulation failed. Please try again.");
        console.error("Registration simulation error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 1500); // تأخير لمحاكاة اتصال الشبكة
  };

  // ===========================================================================
  // دوال API الأصلية (معلقة للاستخدام المستقبلي)
  // ===========================================================================
  
  /*
  // Get API URL from environment variable
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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
        window.location.href = "/auth";
      }, 5000);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;

      console.error("Registration error:", error);

      if (error.response) {
        setError(error.response.data?.message || "Registration failed");
      } else if (error.request) {
        setError(
          "Cannot connect to server. Please check if backend is running."
        );
      } else {
        setError(error.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  interface RegisterResponse {
    token?: string;
    user?: {
      _id?: string;
      id?: string;
      name?: string;
      email?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }
  */
  
  // ===========================================================================
  // API functions end here
  // ===========================================================================

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 ">
      <div className="w-full max-w-md">
       

        {/* Success Message */}
        

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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
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
                    aria-label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                    title={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
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
                type="button"
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50"
                aria-label="Sign up with GitHub"
                title="Sign up with GitHub"
              >
                <Github className="w-5 h-5 text-gray-300" />
              </button>

              <button
                type="button"
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50"
                aria-label="Sign up with Twitter"
                title="Sign up with Twitter"
              >
                <Twitter className="w-5 h-5 text-gray-300" />
              </button>

              <button
                type="button"
                disabled={isLoading}
                className="flex items-center justify-center p-3 border border-gray-700 rounded-xl hover:border-gray-500 hover:bg-gray-800 transition-colors disabled:opacity-50"
                aria-label="Sign up with Google"
                title="Sign up with Google"
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
      <div className="fixed bottom-4 right-4 text-gray-500 text-xs">
        &copy; 2024 JobMatch. All rights reserved.
      </div>
      {/* Alert */}
      {success ? (<div className={`${openAlert ? "fixed" : "hidden"} bottom-4 left-4 bg-emerald-700/20 text-sm p-2 rounded-lg border border-emerald-600 text-emerald-300`}>
        Register is successful
      </div>):<div className={`${openAlert ? "fixed" : "hidden"} bottom-4 left-4 bg-red-700/20 text-sm p-2 rounded-lg border border-red-600 text-red-300`}>
        Register is failed , {error}
      </div>}
      {/* error alert */}
      
      
    </main>
  );
}