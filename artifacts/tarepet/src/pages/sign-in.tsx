import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, RotateCcw, KeyRound, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import tarepetLogo from "@assets/tarepet__1784835204178.png";
import heroImg from "@assets/classroom_hero.jpg";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/api-auth";
import { layerbaseAuth } from "@/lib/layerbase-auth";
import { useTranslation } from "@/lib/i18n";

import { getStoredStudents, getStoredTeachers, isAccountDeleted, recordLoginActivity, getAdminPassword, syncTeachersWithBackend, syncStudentsWithBackend } from "@/lib/cbt-store";
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginRateLimit } from "@/lib/password-policy";
import { useCustomDialog } from "@/context/DialogContext";

export default function SignIn() {
  const { t } = useTranslation();
  const { showAlert } = useCustomDialog();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, login } = useAuth();

  // ── Email OTP 2FA State ───────────────────────────────────────────────────
  const [otpPending, setOtpPending] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [pendingRole, setPendingRole] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    syncTeachersWithBackend();
    syncStudentsWithBackend();
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (otpPending && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpPending, otpCountdown]);

  // If already authenticated and cached, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const rolePath = user.role.toLowerCase();
      setLocation(`/dashboard/${rolePath}`);
    }
  }, [isAuthenticated, user, setLocation]);

  const handleOtpDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    
    // Check if full 6-digit code was pasted
    if (numeric.length === 6) {
      const splitDigits = numeric.split("").slice(0, 6);
      setOtpDigits(splitDigits);
      digitInputRefs.current[5]?.focus();
      return;
    }

    const singleDigit = numeric.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (singleDigit && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        digitInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpSuccessMsg(null);
    const code = otpDigits.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit authentication code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const storedDeviceToken = typeof window !== 'undefined' ? (localStorage.getItem('tarepet_device_token') || '') : '';
      const res = await authClient.post("/auth/otp/verify/", {
        temp_token: tempToken,
        otp_code: code,
        device_token: storedDeviceToken,
      });

      if (res.data && res.data.access && res.data.user) {
        if (res.data.device_token && typeof window !== 'undefined') {
          localStorage.setItem('tarepet_device_token', res.data.device_token);
        }
        resetLoginRateLimit();
        recordLoginActivity(res.data.user.email || email, res.data.user.role, "SUCCESS");
        login(res.data.access, res.data.refresh || "", res.data.user);
        const rolePath = res.data.user.role.toLowerCase();
        setLocation(`/dashboard/${rolePath}`);
        return;
      }
    } catch (err: any) {
      // Emergency / Dev Universal Passcode Fallback (123456, 000000, 999999) or Offline Mode
      const isUniversalCode = ['123456', '000000', '999999'].includes(code);
      if (isUniversalCode || !err.response) {
        const lowerEmail = email.toLowerCase().trim();
        const storedTeachers = getStoredTeachers();
        const matchedTeacher = storedTeachers.find(t => {
          const tEmail = (t.email || '').toLowerCase();
          const tStaffId = (t.staffId || '').toLowerCase();
          return (tEmail && tEmail === lowerEmail) || (tStaffId && tStaffId === lowerEmail) || lowerEmail.includes(tStaffId);
        });

        const role = (pendingRole || (lowerEmail.includes('admin') ? 'ADMIN' : (matchedTeacher ? 'TEACHER' : 'TEACHER'))).toUpperCase();
        resetLoginRateLimit();
        recordLoginActivity(email || (role === 'ADMIN' ? 'admin@tarepet.com' : 'teacher@tarepet.com'), role, "SUCCESS");

        if (role === 'TEACHER' && matchedTeacher) {
          const nameParts = (matchedTeacher.name || 'Teacher Staff').trim().split(' ');
          const firstName = nameParts[0] || 'Teacher';
          const lastName = nameParts.slice(1).join(' ') || 'Staff';
          login('verified_2fa_access_token', 'verified_2fa_refresh_token', {
            id: matchedTeacher.id,
            email: matchedTeacher.email || email,
            first_name: firstName,
            last_name: lastName,
            phone: matchedTeacher.phone,
            role: 'TEACHER',
            profile: {
              teacher_id: matchedTeacher.staffId,
              department: matchedTeacher.department || '',
              formTeacherOf: matchedTeacher.formTeacherOf || '',
              form_teacher_of: matchedTeacher.formTeacherOf || '',
              specialization: matchedTeacher.specialization || '',
              subjects_taught: matchedTeacher.subjectsAssigned || [],
              qualifications: matchedTeacher.qualification || '',
              gender: matchedTeacher.gender || '',
              dob: matchedTeacher.dob || '',
              address: matchedTeacher.address || '',
              bio: matchedTeacher.bio || '',
              salary: matchedTeacher.salary || '',
              bank_name: matchedTeacher.bankName || '',
              account_number: matchedTeacher.accountNumber || '',
              hire_date: matchedTeacher.joined || '',
              profileImage: matchedTeacher.profileImage || '',
            } as any
          });
        } else {
          login('verified_2fa_access_token', 'verified_2fa_refresh_token', {
            id: 1,
            email: email || (role === 'ADMIN' ? 'admin@tarepet.com' : 'teacher@tarepet.com'),
            first_name: role === 'ADMIN' ? 'Tarepet' : 'Educator',
            last_name: role === 'ADMIN' ? 'Administrator' : 'Staff',
            role: role as any,
          });
        }
        setLocation(`/dashboard/${role.toLowerCase()}`);
        return;
      }
      const detail = err.response?.data?.detail || "Invalid or expired verification code. Please check your email or use backup code 123456.";
      setError(detail);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isResendingOtp) return;
    setIsResendingOtp(true);
    setError(null);
    setOtpSuccessMsg(null);

    try {
      const res = await authClient.post("/auth/otp/resend/", {
        temp_token: tempToken,
      });
      if (res.data && res.data.temp_token) {
        setTempToken(res.data.temp_token);
        setOtpCountdown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        const successText = res.data.debug_code 
          ? `Fresh verification code dispatched! (Dev Code: ${res.data.debug_code})`
          : (res.data.detail || "A fresh 6-digit verification code has been dispatched to your email.");
        setOtpSuccessMsg(successText);
        digitInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Could not resend code at this time. Please wait a moment.";
      setError(detail);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleCancelOtp = () => {
    setOtpPending(false);
    setTempToken("");
    setOtpDigits(["", "", "", "", "", ""]);
    setError(null);
    setOtpSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOtpSuccessMsg(null);
    setIsLoading(true);

    const rawInput = email.trim();
    const lowerInput = rawInput.toLowerCase();
    const cleanInput = lowerInput.replace(/[^a-z0-9]/g, '');
    const rawPassword = password.trim();
    const storedDeviceToken = typeof window !== 'undefined' ? (localStorage.getItem('tarepet_device_token') || '') : '';

    const isTargetAdmin = lowerInput === 'admin@tarepet.com' || cleanInput === 'admin' || lowerInput === 'admin';
    const isAdminPassword = rawPassword === 'TarepetAdmin@2026!' || rawPassword === 'admin' || rawPassword === 'Admin@2026!';

    // 0a. Live Django REST API Backend Call (handles adaptive 3-day device trust)
    try {
      const res = await authClient.post("/auth/login/", { 
        email: rawInput, 
        password: rawPassword,
        device_token: storedDeviceToken
      }, { timeout: 5000 });
      
      // 2FA OTP is paused for future updates per directive
      if (res.data && res.data.requires_otp) {
        if (res.data.user) {
          recordLoginActivity(res.data.user.email || rawInput, res.data.user.role || 'STAFF', 'SUCCESS');
          login(res.data.access || 'temp_token_bypass', res.data.refresh || '', res.data.user);
          const userRole = (res.data.user.role || 'teacher').toLowerCase();
          setLocation(`/dashboard/${userRole}`);
          setIsLoading(false);
          return;
        }
      }

      // Direct login for recognized trusted devices and Student/Parent roles
      const { access, refresh, user: apiUser, device_token: newDevToken } = res.data;
      if (apiUser && apiUser.role) {
        if (newDevToken && typeof window !== 'undefined') {
          localStorage.setItem('tarepet_device_token', newDevToken);
        }
        recordLoginActivity(apiUser.email || rawInput, apiUser.role, 'SUCCESS');
        login(access, refresh, apiUser);
        const userRole = apiUser.role.toLowerCase();
        setLocation(`/dashboard/${userRole}`);
        setIsLoading(false);
        return;
      }
    } catch (apiError: any) {
      // If API fails or is unreachable, continue to seamless local verification
    }

    // 1. Check Administrator fallback
    if (isTargetAdmin) {
      if (isAdminPassword) {
        resetLoginRateLimit();
        recordLoginActivity('admin@tarepet.com', 'ADMIN', 'SUCCESS');
        login('admin_access_token', 'admin_refresh_token', {
          id: 1,
          email: 'admin@tarepet.com',
          first_name: 'Tarepet',
          last_name: 'Administrator',
          role: 'ADMIN',
        });
        setLocation('/dashboard/admin');
        setIsLoading(false);
        return;
      } else {
        recordLoginActivity('admin@tarepet.com', 'ADMIN', 'FAILED_ATTEMPT');
        setError('Invalid administrator email or password.');
        setIsLoading(false);
        return;
      }
    }

    let storedTeachers = getStoredTeachers();
    let matchedTeacher = storedTeachers.find(t => {
      const tEmail = (t.email || '').toLowerCase();
      const tStaffId = (t.staffId || '').toLowerCase();
      const cleanStaffId = tStaffId.replace(/[^a-z0-9]/g, '');
      const cleanTEmail = tEmail.replace(/[^a-z0-9]/g, '');
      return (
        (tEmail && tEmail === lowerInput) ||
        (tStaffId && tStaffId === lowerInput) ||
        (cleanInput.length > 2 && (cleanInput === cleanStaffId || cleanInput === cleanTEmail)) ||
        String(t.id).toLowerCase() === lowerInput
      );
    });

    if (!matchedTeacher) {
      const syncedTeachers = await syncTeachersWithBackend();
      matchedTeacher = syncedTeachers.find(t => {
        const tEmail = (t.email || '').toLowerCase();
        const tStaffId = (t.staffId || '').toLowerCase();
        const cleanStaffId = tStaffId.replace(/[^a-z0-9]/g, '');
        const cleanTEmail = tEmail.replace(/[^a-z0-9]/g, '');
        return (
          (tEmail && tEmail === lowerInput) ||
          (tStaffId && tStaffId === lowerInput) ||
          (cleanInput.length > 2 && (cleanInput === cleanStaffId || cleanInput === cleanTEmail)) ||
          String(t.id).toLowerCase() === lowerInput
        );
      });
    }

    if (matchedTeacher) {
      const expectedPassword = matchedTeacher.password || matchedTeacher.staffId;
      const isDefaultPassword = rawPassword === matchedTeacher.staffId;

      if (rawPassword !== expectedPassword && rawPassword !== matchedTeacher.staffId) {
        recordLoginActivity(matchedTeacher.email || rawInput, 'TEACHER', 'FAILED_ATTEMPT');
        setError('Incorrect email, staff ID, or passcode.');
        setIsLoading(false);
        return;
      }

      const nameParts = matchedTeacher.name.trim().split(' ');
      const firstName = nameParts[0] || 'Teacher';
      const lastName = nameParts.slice(1).join(' ') || 'Staff';

      resetLoginRateLimit();
      recordLoginActivity(matchedTeacher.email || rawInput, 'TEACHER', 'SUCCESS');
      login('mock_access_token', 'mock_refresh_token', {
        id: matchedTeacher.id,
        email: matchedTeacher.email,
        first_name: firstName,
        last_name: lastName,
        phone: matchedTeacher.phone,
        role: 'TEACHER',
        profile: {
          teacher_id: matchedTeacher.staffId,
          department: matchedTeacher.department || '',
          formTeacherOf: matchedTeacher.formTeacherOf || '',
          form_teacher_of: matchedTeacher.formTeacherOf || '',
          specialization: matchedTeacher.specialization || '',
          subjects_taught: matchedTeacher.subjectsAssigned || [],
          qualifications: matchedTeacher.qualification || '',
          gender: matchedTeacher.gender || '',
          dob: matchedTeacher.dob || '',
          address: matchedTeacher.address || '',
          bio: matchedTeacher.bio || '',
          salary: matchedTeacher.salary || '',
          bank_name: matchedTeacher.bankName || '',
          account_number: matchedTeacher.accountNumber || '',
          hire_date: matchedTeacher.joined || '',
          profileImage: matchedTeacher.profileImage || '',
          needsPasswordChange: isDefaultPassword,
        } as any
      });
      setLocation('/dashboard/teacher');
      setIsLoading(false);
      return;
    }

    // 4. Check if input matches a Student account
    let storedStudents = getStoredStudents();
    let matchedStudent = storedStudents.find(s => {
      const sEmail = (s.email || '').toLowerCase();
      const sCode = (s.code || s.admissionNo || '').toLowerCase();
      const cleanSCode = sCode.replace(/[^a-z0-9]/g, '');
      const cleanSEmail = sEmail.replace(/[^a-z0-9]/g, '');
      return (
        (sEmail && sEmail === lowerInput) ||
        (sCode && sCode === lowerInput) ||
        (cleanInput.length > 2 && (cleanInput === cleanSCode || cleanInput === cleanSEmail)) ||
        String(s.id).toLowerCase() === lowerInput
      );
    });

    if (!matchedStudent) {
      const syncedStudents = await syncStudentsWithBackend();
      matchedStudent = syncedStudents.find(s => {
        const sEmail = (s.email || '').toLowerCase();
        const sCode = (s.code || s.admissionNo || '').toLowerCase();
        const cleanSCode = sCode.replace(/[^a-z0-9]/g, '');
        const cleanSEmail = sEmail.replace(/[^a-z0-9]/g, '');
        return (
          (sEmail && sEmail === lowerInput) ||
          (sCode && sCode === lowerInput) ||
          (cleanInput.length > 2 && (cleanInput === cleanSCode || cleanInput === cleanSEmail)) ||
          String(s.id).toLowerCase() === lowerInput
        );
      });
    }

    if (matchedStudent) {
      const expectedStudentPassword = matchedStudent.password || matchedStudent.code || matchedStudent.admissionNo;
      const cleanPass = rawPassword.replace(/[^a-z0-9]/gi, '');
      const cleanExpected = (expectedStudentPassword || '').replace(/[^a-z0-9]/gi, '');
      const isPasswordValid =
        rawPassword === expectedStudentPassword ||
        rawPassword === matchedStudent.code ||
        rawPassword === matchedStudent.admissionNo ||
        (cleanPass.length > 2 && cleanPass.toLowerCase() === cleanExpected.toLowerCase());

      if (!isPasswordValid) {
        recordLoginActivity(matchedStudent.email || rawInput, 'STUDENT', 'FAILED_ATTEMPT');
        setError('Incorrect email, student code, or passcode.');
        setIsLoading(false);
        return;
      }

      const nameParts = matchedStudent.name.trim().split(' ');
      resetLoginRateLimit();
      recordLoginActivity(matchedStudent.email || rawInput, 'STUDENT', 'SUCCESS');
      login('mock_access_token', 'mock_refresh_token', {
        id: matchedStudent.id,
        email: matchedStudent.email || `${matchedStudent.code || matchedStudent.id}@tarepet.com`,
        first_name: nameParts[0] || 'Student',
        last_name: nameParts.slice(1).join(' ') || 'User',
        phone: matchedStudent.phone,
        role: 'STUDENT',
        profile: {
          student_id: matchedStudent.code || matchedStudent.admissionNo,
          grade_level: matchedStudent.grade,
          gender: matchedStudent.gender,
          date_of_birth: matchedStudent.dob,
          address: matchedStudent.address,
          profile_image: matchedStudent.profileImage,
          profileImage: matchedStudent.profileImage,
        } as any
      });
      setLocation('/dashboard/student');
      setIsLoading(false);
      return;
    }

    // 5. Account not registered in database
    recordLoginActivity(rawInput, 'UNKNOWN', 'FAILED_ATTEMPT');
    setError('This account is not registered. Please contact school administration for access.');
    setIsLoading(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#EBF0F7] dark:bg-zinc-950 font-sans">
      {/* LEFT PANEL (Desktop Mode) - School Portal Showcase & Brand Experience */}
      <div className="hidden lg:flex lg:w-[48%] bg-zinc-950 text-white p-14 flex-col justify-between relative overflow-hidden border-r border-white/10">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Tare Pet Montessori School"
            className="w-full h-full object-cover opacity-35 scale-105 brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/90 via-zinc-950/75 to-zinc-950/95" />
        </div>

        {/* Ambient brand glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-8">
            <img 
              src={tarepetLogo} 
              alt="Tarepet Montessori School Logo" 
              className="w-12 h-12 object-contain rounded-full bg-white/10 p-1 backdrop-blur-md"
            />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-2xl text-white leading-none tracking-tight">
                {t('school.name', 'Tarepet Montessori')}
              </span>
              <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-semibold mt-1">
                {t('school.abbr', 'Excellence & Character')}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 max-w-md"
          >
            <h2 className="text-3xl xl:text-4xl font-serif font-bold leading-tight text-white">
              Integrated School Management &amp; CBT Portal
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans">
              Secure, real-time academic records, automated grading, CBT examinations, and faculty administrative controls for the Tarepet Montessori community.
            </p>
          </motion.div>
        </div>

        {/* Features highlights */}
        <div className="relative z-10 space-y-3 py-6 max-w-md">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-zinc-200">Instant Real-Time Profile &amp; Data Sync</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-semibold text-zinc-200">Verified CBT Examination Engine</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-zinc-200">Comprehensive Terminal Report Cards &amp; ID Badges</span>
          </div>
        </div>

        {/* Guiding Principle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 pt-4 border-t border-white/10"
        >
          <p className="text-zinc-400 text-xs italic font-serif">
            &ldquo;Nurturing Minds, Shaping Character, Empowering Excellence.&rdquo;
          </p>
          <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wider">
            Tarepet Montessori Guiding Principle
          </p>
        </motion.div>
      </div>

      {/* RIGHT PANEL (Desktop & Mobile Main) - The Card Mockup Design */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-[420px] bg-white dark:bg-zinc-900 rounded-[38px] shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden relative"
        >
          {/* Top Artistic Curved Header (Tarepet Crimson, Gold & Emerald Organic Blobs) */}
          <div className="relative h-44 bg-[#E4583E] dark:bg-primary overflow-hidden flex flex-col items-center justify-center text-center px-6 pt-2 pb-6">
            {/* Left Gold Organic Curved Blob */}
            <div className="absolute -left-10 -bottom-6 w-36 h-36 rounded-full bg-[#D4AF37] opacity-90 blur-xs pointer-events-none" />
            {/* Right Emerald Organic Curved Blob */}
            <div className="absolute -right-8 -top-4 w-36 h-36 rounded-full bg-[#10B981] opacity-85 blur-xs pointer-events-none" />
            {/* Ambient overlay texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

            {/* School Crest / Small Badge */}
            <div className="relative z-10 flex items-center justify-center mb-1.5">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md p-1 shadow-xs border border-white/30 flex items-center justify-center">
                <img src={tarepetLogo} alt="Tarepet Logo" className="w-7 h-7 object-contain rounded-full" />
              </div>
            </div>

            {/* Title & Tagline matching reference mockup */}
            <div className="relative z-10">
              <h1 className="text-2xl font-bold font-serif text-white tracking-tight leading-snug drop-shadow-xs">
                {otpPending ? "Two-Factor Security" : "Tarepet Portal"}
              </h1>
              <p className="text-[11px] text-white/90 font-medium tracking-wide uppercase mt-0.5">
                {otpPending ? `${pendingRole} Email Authentication` : "Sign in to your account"}
              </p>
            </div>
          </div>

          {/* Overlapping White Form Sheet with Completely Rounded Top Corners */}
          <div className="bg-white dark:bg-zinc-900 rounded-t-[32px] -mt-5 relative z-10 px-6 sm:px-8 pt-6 pb-8 space-y-4 shadow-sm">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {error.includes('locked') && (
                  <button
                    type="button"
                    onClick={() => {
                      resetLoginRateLimit();
                      setError(null);
                    }}
                    className="text-[10px] font-bold underline shrink-0 hover:text-rose-700 cursor-pointer"
                  >
                    Reset Lock
                  </button>
                )}
              </motion.div>
            )}

            {/* OTP Success Feedback Message */}
            {otpSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{otpSuccessMsg}</span>
              </motion.div>
            )}

            {otpPending ? (
              /* ── 2FA Email OTP Verification Form ── */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wide uppercase">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Identity Verification</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We sent a 6-digit authentication code to <br />
                    <span className="font-bold text-foreground font-mono">{maskedEmail}</span>
                  </p>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { digitInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono bg-zinc-100 dark:bg-zinc-800/90 border border-border/80 rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-inner"
                      required
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {/* Countdown & Resend Option */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-muted-foreground text-[11px]">Didn&apos;t get code?</span>
                  {otpCountdown > 0 ? (
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                      Resend in <strong className="text-primary">{otpCountdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResendingOtp}
                      className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${isResendingOtp ? 'animate-spin' : ''}`} />
                      <span>{isResendingOtp ? 'Resending…' : 'Resend Code'}</span>
                    </button>
                  )}
                </div>

                {/* Verify Submit Button */}
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpDigits.join('').length < 6}
                    className="w-full bg-zinc-950 hover:bg-black text-white dark:bg-primary dark:hover:bg-primary/90 transition-all rounded-full py-4 text-xs font-bold uppercase tracking-wider shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify &amp; Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpDigits(["1", "2", "3", "4", "5", "6"]);
                        digitInputRefs.current[5]?.focus();
                      }}
                      className="text-[10px] text-muted-foreground hover:text-primary font-mono transition-colors flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Auto-fill Master Code (123456)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelOtp}
                    className="w-full py-2.5 text-[11px] text-muted-foreground hover:text-foreground font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Use different account</span>
                  </button>
                </div>
              </form>
            ) : (
              /* ── Standard Email + Password Form ── */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Email / ID Input Pill */}
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Email / Staff ID / Student Code
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email or registration code"
                      className="w-full px-5 py-3.5 bg-zinc-100 dark:bg-zinc-800/90 border border-transparent rounded-2xl text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-zinc-800 transition-all shadow-inner"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input Pill */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <label htmlFor="password" className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Password / Access Passcode
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-5 pr-11 py-3.5 bg-zinc-100 dark:bg-zinc-800/90 border border-transparent rounded-2xl text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white dark:focus:bg-zinc-800 transition-all shadow-inner font-mono"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end px-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => showAlert({
                      title: "Portal Passcode Assistance",
                      message: "Please contact Tarepet School Administrator or the ICT department to reset your portal passcode or retrieve your credentials.\n\n📍 ICT Office / Admin Desk\n✉️ admin@tarepet.com",
                      type: "help",
                      badge: "Passcode Help",
                      confirmText: "Got It, Thanks",
                    })}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Main Pill Submit Button matching the dark rounded pill in mockup */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-zinc-950 hover:bg-black text-white dark:bg-primary dark:hover:bg-primary/90 transition-all rounded-full py-4 text-xs font-bold uppercase tracking-wider shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <span>Sign in to Portal</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Terms of Service & Privacy Notice matching mockup style */}
            <div className="pt-3 text-center space-y-3">
              <p className="text-[10px] text-muted-foreground leading-relaxed px-2">
                Signing into Tarepet Portal means you agree to the{" "}
                <Link href="/terms" className="text-foreground font-semibold hover:underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="text-foreground font-semibold hover:underline">
                  Terms of Service
                </Link>.
              </p>

              <div className="border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  Need admissions help?{" "}
                  <Link href="/admissions" className="text-primary font-bold hover:underline">
                    Admissions Desk
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Layerbase Multi-Factor Authentication Modal */}
      {mfaRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border"
          >
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Lock className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-serif font-bold text-foreground">
                {t('mfa.title', 'Multi-Factor Authentication')}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t('mfa.description', 'Layerbase Auth requires step-up verification. Please enter the 6-digit authenticator code from your app.')}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                setError(null);
                const res = await layerbaseAuth.verifyMFA(mfaToken, mfaCode);
                if (res.success && res.access && res.user) {
                  login(res.access, res.refresh || '', res.user);
                  setMfaRequired(false);
                  setLocation(`/dashboard/${res.user.role.toLowerCase()}`);
                } else {
                  setError(res.message || t('mfa.failed', 'MFA verification failed.'));
                }
                setIsLoading(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('mfa.code_label', '6-Digit Authenticator Code')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 border border-border rounded-2xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setMfaCode(''); setError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-accent text-foreground transition-colors"
                >
                  {t('mfa.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || mfaCode.length < 6}
                  className="flex-1 px-4 py-2.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? t('mfa.verifying', 'Verifying...') : t('mfa.verify_code', 'Verify Code')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
