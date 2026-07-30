import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import tarepetLogo from "@assets/tarepet__1784835204178.png";
import heroImg from "@assets/school_building.jpg";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/api-auth";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Try real Django backend first
      const res = await authClient.post("/auth/login/", { email, password });
      const { access, refresh, user } = res.data;
      login(access, refresh, user);
      setLocation("/dashboard");
    } catch (apiError: any) {
      // If backend is unreachable, offer demo mode
      if (!apiError.response) {
        // Network error — backend not running
        handleDemoLogin(email);
      } else if (apiError.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(apiError.response?.data?.detail || "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    // Determine role from email
    let role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" = "STUDENT";
    let firstName = "Demo";
    let lastName = "User";

    if (demoEmail.includes("admin")) {
      role = "ADMIN"; firstName = "Admin"; lastName = "Tarepet";
    } else if (demoEmail.includes("teacher")) {
      role = "TEACHER"; firstName = "Mrs. Okafor"; lastName = "(Teacher)";
    } else if (demoEmail.includes("student")) {
      role = "STUDENT"; firstName = "Emeka"; lastName = "Obi";
    } else if (demoEmail.includes("parent")) {
      role = "PARENT"; firstName = "Mr. Amadi"; lastName = "(Parent)";
    }

    const demoUser = {
      id: 1,
      email: demoEmail,
      first_name: firstName,
      last_name: lastName,
      role,
    };

    // Use fake tokens for demo mode
    login("demo-access-token", "demo-refresh-token", demoUser);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left Panel - Brand Identity */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Tare Pet Montessori School"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/95 via-[#123922]/90 to-secondary/95 mix-blend-multiply" />
        </div>

        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-5 z-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-8">
            <img 
              src={tarepetLogo} 
              alt="Tarepet Montessori School Logo" 
              className="w-16 h-16 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-3xl text-white leading-none tracking-tight">
                Tare Pet
              </span>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/80 font-semibold mt-1">
                montessori school
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight drop-shadow-sm">
              Welcome to the <span className="text-primary italic font-light">School Portal</span>
            </h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-md font-sans mb-8">
              Access grades, attendance records, CBT exam portal, fee statements, and school announcements for parents, students, and staff.
            </p>

            {/* Quick Demo Role Shortcut Buttons */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-white/70 font-semibold font-sans mb-2">
                Quick Demo Portal Login:
              </p>
              <div className="grid grid-cols-2 gap-2.5 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin@tarepet.edu.ng")}
                  className="px-3.5 py-2.5 rounded-xl glass-button text-white text-xs font-bold uppercase tracking-wider text-left hover:bg-white/20 transition-all flex items-center justify-between"
                >
                  <span>👑 Admin</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("teacher@tarepet.edu.ng")}
                  className="px-3.5 py-2.5 rounded-xl glass-button text-white text-xs font-bold uppercase tracking-wider text-left hover:bg-white/20 transition-all flex items-center justify-between"
                >
                  <span>👩‍🏫 Teacher</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("student@tarepet.edu.ng")}
                  className="px-3.5 py-2.5 rounded-xl glass-button text-white text-xs font-bold uppercase tracking-wider text-left hover:bg-white/20 transition-all flex items-center justify-between"
                >
                  <span>🎓 Student</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("parent@tarepet.edu.ng")}
                  className="px-3.5 py-2.5 rounded-xl glass-button text-white text-xs font-bold uppercase tracking-wider text-left hover:bg-white/20 transition-all flex items-center justify-between"
                >
                  <span>👨‍👩‍👧 Parent</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10"
        >
          <p className="text-white/60 text-sm italic font-serif">
            "Not to Knowledge is Power."
          </p>
          <p className="text-white/80 text-xs mt-2 uppercase tracking-wider">
            Our Guiding Principle
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <img 
              src={tarepetLogo} 
              alt="Tarepet Montessori School Logo" 
              className="w-14 h-14 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl text-primary leading-none tracking-tight">
                Tare Pet
              </span>
              <span className="font-sans text-xs uppercase tracking-[0.15em] text-secondary font-medium mt-1">
                montessori school
              </span>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Sign In</h2>
            <p className="text-muted-foreground">Access your parent or staff portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <span className="text-sm text-foreground">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg py-3 text-base font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center mt-8 border-t border-border pt-8">
            This portal is for enrolled parents and staff only. For admission inquiries, please visit our{" "}
            <Link href="/admissions" className="text-primary hover:underline">
              Admissions page
            </Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
