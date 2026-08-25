import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { authService } from "../../utils/authService";
import { validators } from "../../utils/inputValidation";

const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState({ active: false, seconds: 0, totalSeconds: 0 });
  const [countdownId, setCountdownId] = useState(null);
  const [retryUntil, setRetryUntil] = useState(null);
  const [capsLockOn, setCapsLockOn] = useState(false);
  // Removed localStorage-based remaining requests; backend rate limiting is authoritative

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownId) {
        clearInterval(countdownId);
      }
    };
  }, [countdownId]);

  // Removed localStorage persistence for remaining requests

  // Removed client-side counter reset; backend controls rate limit

  // Removed localStorage check/reset loop

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setRateLimited({ active: false, seconds: 0, totalSeconds: 0 });
    if (countdownId) {
      clearInterval(countdownId);
      setCountdownId(null);
    }

    try {
      // Validate input before sending
      const validation = validators.login(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setIsLoading(false);
        return;
      }

      // Use the auth service to login
      const response = await authService.login(validation.sanitizedData.email, validation.sanitizedData.password);

      // The auth service already stores the tokens and user data
      // Just call the success callback to redirect to dashboard
      if (onLoginSuccess && response.user) {
        onLoginSuccess(response.user);
      }
      
      // Remaining requests handled server-side
      
    } catch (err) {
      if (err.isRateLimited) {
        const seconds = Math.max(1, err.retryAfter || 60);
        setRateLimited({ active: true, seconds, totalSeconds: seconds });
        const until = new Date(Date.now() + seconds * 1000);
        setRetryUntil(until);
        
        // Clear any existing countdown
        if (countdownId) {
          clearInterval(countdownId);
        }
        
        // Start countdown with better formatting
        const id = setInterval(() => {
          setRateLimited((prev) => {
            if (!prev.active) return prev;
            const next = Math.max(0, prev.seconds - 1);
            if (next === 0) {
              clearInterval(id);
              setError(""); // Clear error when countdown ends
              // Counter reset not tracked client-side
              return { active: false, seconds: 0, totalSeconds: 0 };
            }
            
            // Update error message with countdown
            const minutes = Math.floor(next / 60);
            const remainingSeconds = next % 60;
            const timeStr = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
            setError(`⏰ Too many requests. Please wait ${timeStr} before trying again.`);
            
            return { active: true, seconds: next, totalSeconds: prev.totalSeconds };
          });
        }, 1000);
        setCountdownId(id);
        
        // Initial error message
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
        setError(`⏰ Too many requests. Please wait ${timeStr} before trying again.`);
      } else {
        // Extract error message from response
        let errorMessage = err.message || "Login failed. Please check your credentials and try again.";
        
        // Check if we have response data with remaining requests
        if (err.response?.data) {
          const responseData = err.response.data;
          
          // Update error message if provided
          if (responseData.message) {
            errorMessage = responseData.message;
          }
          
          
          // Check if account is locked
          if (responseData.lockedUntil) {
            const lockTime = new Date(responseData.lockedUntil);
            const now = new Date();
            const timeDiff = Math.max(0, Math.ceil((lockTime - now) / 1000));
            
            if (timeDiff > 0) {
              // Show account lockout message
              const minutes = Math.floor(timeDiff / 60);
              const seconds = timeDiff % 60;
              const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
              errorMessage = `🔒 Account locked! Please wait ${timeStr} before trying again.`;
            }
          }
        }
        
        setError(errorMessage);
        console.log('Full error response:', err.response?.data);
        
        // Remaining requests handled server-side
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Detect Caps Lock
  const handleKeyDown = (e) => {
    // Check if Caps Lock is on
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handleKeyUp = (e) => {
    // Check if Caps Lock is on
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-50 p-4 relative overflow-hidden">
      {/* Animated background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Login Card with glassmorphism effect */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative">
          {/* Animated top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>

          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-red-500/5 to-transparent rounded-tr-full"></div>

          <div className="p-8 sm:p-10 relative">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-4 mb-8 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <img
                    src={`${import.meta.env.BASE_URL}1732864917491%20(1).png`}
                    className="w-16 h-16 object-contain relative z-10 transform group-hover:scale-110 transition-transform duration-300"
                    alt="Elsewedy Logo"
                  />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent leading-tight">
                    Elsewedy
                  </p>
                  <p className="text-sm text-gray-600 font-medium leading-tight mt-1">Capstone System</p>
                </div>
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-base">Sign in to your account to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && !rateLimited.active && (
                <div className="bg-gradient-to-r from-red-50 to-red-50/50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm text-red-800 flex-1 font-medium leading-relaxed">{error}</p>
                </div>
              )}

              {/* Rate Limit Banner */}
              {rateLimited.active && (
                <div className="bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 border-2 border-amber-300/50 rounded-xl p-5 space-y-4 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-2 flex-wrap text-amber-900">
                    <span className="text-sm font-semibold">Too many attempts. Please wait</span>
                    <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md ring-2 ring-amber-400/30 animate-pulse">
                      {Math.floor(rateLimited.seconds / 60) > 0 
                        ? `${Math.floor(rateLimited.seconds / 60)}m ${rateLimited.seconds % 60}s`
                        : `${rateLimited.seconds}s`
                      }
                    </div>
                    <span className="text-sm font-semibold">before trying again.</span>
                  </div>
                  <div className="w-full bg-amber-200/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 transition-all duration-1000 ease-linear rounded-full relative overflow-hidden"
                      style={{
                        width: `${Math.round(
                          ((rateLimited.totalSeconds - rateLimited.seconds) /
                            Math.max(1, rateLimited.totalSeconds)) * 100
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  {retryUntil && (
                    <p className="text-xs text-amber-800 text-center font-medium">
                      Until {retryUntil.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2.5">
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-focus-within:via-red-500/10 rounded-xl transition-all duration-300 blur-xl"></div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200 z-10" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-300 hover:shadow-md"
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2.5">
                <label htmlFor="password" className="block text-sm font-bold text-gray-800 tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-focus-within:via-red-500/10 rounded-xl transition-all duration-300 blur-xl"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors duration-200 z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium shadow-sm hover:border-gray-300 hover:shadow-md"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-all duration-200 p-1 rounded-lg hover:bg-red-50 z-10"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {/* Caps Lock Warning */}
                  {capsLockOn && (
                    <div className="mt-2 flex items-center gap-2 text-amber-600 text-xs font-medium animate-in slide-in-from-top-2 duration-200">
                      <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-700 font-bold text-[10px]">!</span>
                      </div>
                      <span>Caps Lock is ON</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || rateLimited.active}
                className="group relative w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl shadow-red-500/40 hover:shadow-2xl hover:shadow-red-600/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-xl disabled:hover:shadow-red-500/40 transform hover:-translate-y-1 disabled:hover:translate-y-0 overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    <span className="relative z-10">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                    <span className="relative z-10">Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-gray-200/60 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <span className="text-red-600 font-semibold cursor-default hover:text-red-700 transition-colors">
                  Contact Administrator
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;

// Note: This component now passes dynamic user data to the Dashboard
// No more hardcoded fallback values
