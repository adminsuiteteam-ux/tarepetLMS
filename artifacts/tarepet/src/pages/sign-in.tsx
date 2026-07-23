import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link } from "wouter";
import tarepetLogo from "@assets/tarepet__1784835204178.png";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side only, no actual submission
    console.log("Sign in attempted with:", { email, rememberMe });
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left Panel - Brand Identity */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-white p-16 flex-col justify-between relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-5">
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
          <div className="flex items-center gap-3 mb-8">
            <img 
              src={tarepetLogo} 
              alt="Tarepet Montessori School Logo" 
              className="w-16 h-16 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-3xl text-white leading-none tracking-tight">
                Tarepet
              </span>
              <span className="font-sans text-sm uppercase tracking-[0.2em] text-white/80 font-medium mt-1">
                montessori school
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              Welcome back.
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-md">
              Your child's journey continues here. Access grades, attendance, announcements, and stay connected with our community.
            </p>
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
                Tarepet
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
              className="w-full bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg py-3 text-base font-medium shadow-sm"
            >
              Sign In
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-4 my-8">
              <div className="flex-1 border-t border-border"></div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            {/* Request Access Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                New to Tarepet?
              </p>
              <Link 
                href="/admissions" 
                className="inline-flex items-center justify-center text-secondary hover:text-secondary/90 font-medium text-sm hover:underline transition-colors"
              >
                Request Portal Access
              </Link>
            </div>
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
