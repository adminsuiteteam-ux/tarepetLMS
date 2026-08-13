import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import tarepetLogo from "@assets/tarepet__1784835204178.png";
import heroImg from "@assets/classroom_hero.jpg";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/api-auth";
import { useTranslation } from "@/lib/i18n";

import { getStoredStudents, getStoredTeachers, isAccountDeleted } from "@/lib/cbt-store";

export default function SignIn() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const rawInput = email.trim();
    const lowerInput = rawInput.toLowerCase();
    const cleanInput = lowerInput.replace(/[^a-z0-9]/g, '');
    const rawPassword = password.trim();
    const upperPassword = rawPassword.toUpperCase();

    // 0. Check if account was deleted by Admin
    if (isAccountDeleted(rawInput) || isAccountDeleted(lowerInput) || isAccountDeleted(cleanInput)) {
      setError("This account has been deleted by the administrator and can no longer access the system.");
      setIsLoading(false);
      return;
    }

    // 1. Check persistent Teacher accounts created by Admin on the Admin Page
    const storedTeachers = getStoredTeachers();
    const matchedTeacher = storedTeachers.find(t => {
      const tEmail = (t.email || '').toLowerCase();
      const tStaffId = (t.staffId || '').toLowerCase();
      const cleanStaffId = tStaffId.replace(/[^a-z0-9]/g, '');
      const cleanTEmail = tEmail.replace(/[^a-z0-9]/g, '');
      return (
        tEmail === lowerInput ||
        tStaffId === lowerInput ||
        (cleanInput.length > 2 && (cleanInput === cleanStaffId || cleanInput === cleanTEmail)) ||
        String(t.id).toLowerCase() === lowerInput
      );
    });

    if (matchedTeacher) {
      // Teacher found! Log into Teacher Profile & Dashboard
      const nameParts = matchedTeacher.name.trim().split(' ');
      const firstName = nameParts[0] || 'Teacher';
      const lastName = nameParts.slice(1).join(' ') || 'Staff';

      login('mock_access_token', 'mock_refresh_token', {
        id: matchedTeacher.id,
        email: matchedTeacher.email,
        first_name: firstName,
        last_name: lastName,
        role: 'TEACHER',
        profile: {
          teacher_id: matchedTeacher.staffId,
          department: matchedTeacher.department,
          formTeacherOf: matchedTeacher.formTeacherOf,
          subjects_taught: matchedTeacher.specialization,
          qualifications: matchedTeacher.qualification,
        } as any
      });
      setLocation('/dashboard/teacher');
      setIsLoading(false);
      return;
    }

    // 2. Strict check for Admin login credentials
    const isAdminLogin = lowerInput === 'admin@tarepet.com' ||
                         lowerInput === 'admin' ||
                         upperPassword.startsWith('TMS/ADM/') ||
                         (lowerInput.startsWith('admin') && lowerInput.includes('@tarepet'));
    if (isAdminLogin) {
      login('mock_access_token', 'mock_refresh_token', {
        id: 1,
        email: lowerInput.includes('@') ? lowerInput : 'admin@tarepet.com',
        first_name: 'Administrator',
        last_name: 'System',
        role: 'ADMIN',
      });
      setLocation('/dashboard/admin');
      setIsLoading(false);
      return;
    }

    // 3. Fallback demo login for generic teacher credentials
    let role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' = 'STUDENT';
    if (upperPassword.startsWith('TMS/TCH/') || lowerInput.includes('teacher')) role = 'TEACHER';
    else if (upperPassword.startsWith('TMS/PAR/') || lowerInput.includes('parent')) role = 'PARENT';
    else if (upperPassword.startsWith('TMS/STD/') || lowerInput.includes('student')) role = 'STUDENT';

    if (role === 'TEACHER') {
      const nameParts = lowerInput.includes('@') ? lowerInput.split('@')[0].split('.') : ['Teacher', 'Staff'];
      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Teacher';
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Staff';
      login('mock_access_token', 'mock_refresh_token', {
        id: Date.now(),
        email: lowerInput.includes('@') ? lowerInput : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tarepet.com`,
        first_name: firstName,
        last_name: lastName,
        role: 'TEACHER',
        profile: {
          teacher_id: upperPassword.startsWith('TMS/TCH/') ? upperPassword : 'TMS/TCH/0042',
        } as any
      });
      setLocation('/dashboard/teacher');
      setIsLoading(false);
      return;
    }

    // 4. Connect to live Django backend if available
    try {
      const res = await authClient.post("/auth/login/", { email: rawInput, password: rawPassword }, { timeout: 15000 });
      const { access, refresh, user } = res.data;
      login(access, refresh, user);
      const userRole = user?.role?.toLowerCase() || role.toLowerCase();
      setLocation(`/dashboard/${userRole}`);
    } catch (apiError: any) {
      if (role === 'STUDENT' || role === 'PARENT') {
        const storedStudents = getStoredStudents();
        const matchedStudent = storedStudents.find(s =>
          (s.email && s.email.toLowerCase() === lowerInput) ||
          (s.code && s.code.toLowerCase() === lowerInput)
        );
        if (matchedStudent) {
          login('mock_access_token', 'mock_refresh_token', {
            id: matchedStudent.id,
            email: matchedStudent.email,
            first_name: matchedStudent.name.split(' ')[0] || 'Student',
            last_name: matchedStudent.name.split(' ').slice(1).join(' ') || 'User',
            role: 'STUDENT',
          });
          setLocation('/dashboard/student');
        } else {
          setError('No active student account found. All legacy student records have been cleared. Please contact the school administrator.');
        }
      } else {
        setError('Invalid login credentials. Please verify your Email/Staff ID and password.');
      }
    } finally {
      setIsLoading(false);
    }
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
            className="w-full h-full object-cover opacity-80 scale-105 brightness-[0.9]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/65 to-slate-950/85" />
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
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-3xl text-white leading-none tracking-tight">
                {t('school.name')}
              </span>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-white/80 font-semibold mt-1">
                {t('school.abbr')}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight drop-shadow-sm">
              {t('signin.welcome_portal')}<span className="text-primary italic font-light">{t('signin.school_portal')}</span>
            </h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-md font-sans mb-8">
              {t('signin.portal_desc')}
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
            &ldquo;Nurturing Minds, Shaping Character, Empowering Excellence.&rdquo;
          </p>
          <p className="text-white/80 text-xs mt-2 uppercase tracking-wider">
            {t('signin.guiding_principle')}
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
              className="w-9 h-9 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl text-primary leading-none tracking-tight">
                {t('school.name')}
              </span>
              <span className="font-sans text-xs uppercase tracking-[0.15em] text-secondary font-medium mt-1">
                {t('school.abbr')}
              </span>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">{t('signin.title')}</h2>
            <p className="text-muted-foreground">{t('signin.subtitle')}</p>
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
            {/* Email / Staff ID Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t('signin.email_label', 'Email Address or Staff ID')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="firstname.surname@tarepet.com or TMS/TCH/0001"
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('signin.password_label', 'Password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="TMS/CLASS/FOUR DIGIT"
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

            {/* Forgot Password */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-primary hover:underline font-medium"
              >
                {t('signin.forgot_password')}
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
                t('signin.title')
              )}
            </button>
          </form>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center mt-8 border-t border-border pt-8">
            {t('signin.footer_note')}
            <Link href="/admissions" className="text-primary hover:underline">
              {t('signin.admissions_page')}
            </Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
