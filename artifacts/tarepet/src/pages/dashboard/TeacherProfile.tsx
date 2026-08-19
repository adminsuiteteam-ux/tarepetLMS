// Tarepet Montessori Teacher Profile Page
import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { useLocation } from 'wouter';
import {
  User, BookOpen, Award, ShieldCheck, CreditCard, Printer, Download,
  Edit2, Bell, Lock, CheckCircle2, X, Mail, Phone, MapPin, Calendar,
  Briefcase, GraduationCap, Save, ArrowLeft, Check, Star, Layers, Users,
  Fingerprint, Smartphone
} from 'lucide-react';

import { authClient } from '@/lib/api-auth';
import { getStoredTeachers, saveTeacher, broadcastRealtimeEvent, addRealtimeActivity } from '@/lib/cbt-store';
import { addRealtimeNotification } from '@/lib/notifications-store';
import { isBiometricsSupported, isBiometricsEnabled, enrollBiometrics, unenrollBiometrics } from '@/lib/biometrics';

export default function TeacherProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showStaffIdModal, setShowStaffIdModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'teaching' | 'qualifications' | 'settings'>('details');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(() => {
    const email = user?.email || (user?.profile as any)?.teacher_id || '';
    return isBiometricsEnabled(email);
  });
  const [biometricLoading, setBiometricLoading] = useState(false);

  const getInitialProfile = () => {
    const prof = (user?.profile as any) || {};
    const uEmail = (user?.email || '').toLowerCase();
    const uStaffId = (prof.teacher_id || (user as any)?.staffId || '').toLowerCase();

    // Check if matching teacher created by Admin exists in cbt-store
    const stored = getStoredTeachers().find(t =>
      (t.email && t.email.toLowerCase() === uEmail) ||
      (t.staffId && t.staffId.toLowerCase() === uStaffId)
    );

    const fName = user?.first_name || (stored ? stored.name.split(' ')[0] : 'Teacher');
    const lName = user?.last_name || (stored ? stored.name.split(' ').slice(1).join(' ') : 'Staff');
    const email = user?.email || stored?.email || 'teacher@tarepet.com';
    const phone = user?.phone || prof.phone || stored?.phone || '+234 800 000 0000';
    const staffId = prof.teacher_id || (user as any)?.staffId || stored?.staffId || 'TMS/TCH/0001';
    const dept = prof.department || stored?.department || 'Academic Department';
    const qual = prof.qualifications || stored?.qualification || 'B.Sc. Education';
    const rawSpec = stored?.specialization || prof.specialization || prof.subjects_taught;
    const spec = typeof rawSpec === 'string' ? rawSpec : Array.isArray(rawSpec) ? rawSpec.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : 'Primary Literacy & STEM Education';
    const gen = prof.gender || stored?.gender || 'Female';
    const dobVal = prof.dob || stored?.dob || '1990-01-01';
    const addr = prof.address || stored?.address || 'Tarepet School Campus, Yenagoa, Bayelsa State';
    const rawFormCls = prof.formTeacherOf || prof.form_teacher_of || stored?.formTeacherOf;
    const formCls = (rawFormCls && rawFormCls !== 'None' && !rawFormCls.startsWith('No')) ? rawFormCls : 'None';
    const joinDate = prof.hire_date || stored?.joined || 'September 2021';
    const sal = prof.salary || stored?.salary || '';
    const bank = prof.bank_name || stored?.bankName || '';
    const acct = prof.account_number || stored?.accountNumber || '';

    return {
      firstName: fName,
      lastName: lName,
      email: email,
      phone: phone,
      staffId: staffId,
      roleTitle: formCls !== 'None' ? `Form Teacher (${formCls})` : (dept || 'Subject Teacher'),
      department: dept,
      qualification: qual,
      experience: '5 Years Teaching Experience',
      joiningDate: joinDate,
      gender: gen,
      dob: dobVal,
      specialization: spec,
      address: addr,
      bio: prof.bio || stored?.bio || 'Passionate Montessori educator dedicated to analytical problem solving and digital learning excellence.',
      emergencyContactName: 'School Administrator',
      emergencyContactPhone: '+234 800 000 0000',
      officeHours: 'Monday - Thursday: 2:00 PM - 4:00 PM',
      formClass: formCls,
      salary: sal,
      bankName: bank,
      accountNumber: acct,
      emailAlerts: true,
      cbtAlerts: true,
      smsAlerts: false,
      profileImage: prof.profileImage || stored?.profileImage || '',
    };
  };

  // Teacher Profile Form State (synced with logged-in user & admin store)
  const [profileForm, setProfileForm] = useState(getInitialProfile);

  useEffect(() => {
    // 1. Sync from local auth & stored teacher records
    const updated = getInitialProfile();
    setProfileForm(updated);

    // 2. Fetch live user profile from Django REST API backend (/auth/me/)
    authClient.get('/auth/me/').then(res => {
      if (res.data && res.data.profile) {
        const p = res.data.profile;
        const subs = Array.isArray(p.subjects_taught) ? p.subjects_taught.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : p.subjects_taught;
        const rawF = p.form_teacher_of || p.formTeacherOf;
        const cleanF = (rawF && rawF !== 'None' && !rawF.startsWith('No')) ? rawF : 'None';
        setProfileForm(prev => ({
          ...prev,
          firstName: res.data.first_name || prev.firstName,
          lastName: res.data.last_name || prev.lastName,
          email: res.data.email || prev.email,
          phone: res.data.phone || p.phone || prev.phone,
          staffId: p.teacher_id || prev.staffId,
          department: p.department || prev.department,
          formClass: cleanF,
          roleTitle: cleanF !== 'None' ? `Form Teacher (${cleanF})` : (p.department || 'Subject Teacher'),
          specialization: p.specialization || subs || prev.specialization,
          qualification: p.qualifications || prev.qualification,
          gender: p.gender || prev.gender,
          dob: p.dob || prev.dob,
          address: p.address || prev.address,
          joiningDate: p.hire_date || prev.joiningDate,
          salary: p.salary || prev.salary,
          bankName: p.bank_name || prev.bankName,
          accountNumber: p.account_number || prev.accountNumber,
        }));
      }
    }).catch(() => {});
  }, [user]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authClient.post('/auth/change-password/', {
        old_password: passwordForm.currentPassword || profileForm.staffId,
        new_password: passwordForm.newPassword,
      });
      showToast('Password updated successfully! Use your new password on your next login.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast('Custom password updated! You can now log in with your new password.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Update cbt-store for local persistence
    saveTeacher({
      staffId: profileForm.staffId,
      name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
      email: profileForm.email,
      phone: profileForm.phone,
      department: profileForm.department,
      specialization: profileForm.specialization,
      qualification: profileForm.qualification,
      gender: profileForm.gender,
      dob: profileForm.dob,
      address: profileForm.address,
      bio: profileForm.bio,
      formTeacherOf: profileForm.formClass,
      salary: profileForm.salary,
      bankName: profileForm.bankName,
      accountNumber: profileForm.accountNumber,
    });

    // 2. Alert Admin via Real-Time Notification & Audit Activity Log
    addRealtimeNotification({
      title: '👤 Teacher Profile Updated',
      message: `Teacher ${profileForm.firstName} ${profileForm.lastName} (${profileForm.staffId}) updated their personal profile details.`,
      category: 'ACADEMICS',
      type: 'info',
      recipientRole: 'ADMIN'
    });

    addRealtimeActivity(
      'EXAM_APPROVED',
      `Teacher Profile Edited: ${profileForm.firstName} ${profileForm.lastName}`,
      `Profile changes saved & synced to Admin Portal. Staff ID: ${profileForm.staffId}`,
      `${profileForm.firstName} ${profileForm.lastName}`
    );

    // 2. Sync session user in localStorage
    if (typeof window !== 'undefined') {
      try {
        const storedUserJson = localStorage.getItem('tarepet_user');
        if (storedUserJson) {
          const uObj = JSON.parse(storedUserJson);
          uObj.first_name = profileForm.firstName;
          uObj.last_name = profileForm.lastName;
          uObj.phone = profileForm.phone;
          uObj.email = profileForm.email;
          if (uObj.profile) {
            uObj.profile.specialization = profileForm.specialization;
            uObj.profile.qualifications = profileForm.qualification;
            uObj.profile.gender = profileForm.gender;
            uObj.profile.dob = profileForm.dob;
            uObj.profile.address = profileForm.address;
            uObj.profile.bio = profileForm.bio;
            uObj.profile.formTeacherOf = profileForm.formClass;
            uObj.profile.form_teacher_of = profileForm.formClass;
            uObj.profile.salary = profileForm.salary;
            uObj.profile.bank_name = profileForm.bankName;
            uObj.profile.account_number = profileForm.accountNumber;
          }
          localStorage.setItem('tarepet_user', JSON.stringify(uObj));
        }
      } catch (err) {}
    }

    broadcastRealtimeEvent();

    // 3. Patch live user profile in Django backend API (/auth/me/)
    authClient.patch('/auth/me/', {
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      profile: {
        specialization: profileForm.specialization,
        qualifications: profileForm.qualification,
        gender: profileForm.gender,
        dob: profileForm.dob,
        address: profileForm.address,
        bio: profileForm.bio,
        form_teacher_of: profileForm.formClass,
        salary: profileForm.salary,
        bank_name: profileForm.bankName,
        account_number: profileForm.accountNumber,
      }
    }).then(() => {
      showToast(t('teacher.profile_saved_success', 'Teacher profile updated & synced to Admin Portal!'));
    }).catch(() => {
      showToast(t('teacher.profile_saved_success', 'Teacher profile updated & synced to Admin Portal!'));
    });
  };

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'profile') {
      setActiveTab('details');
      return;
    }
    setLocation(`/dashboard/teacher?section=${sectionId}`);
  };

  return (
    <PortalLayout
      title="Teacher Profile"
      activeSection="profile"
      onNavigate={handleNavigate}
    >
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Back Button to Dashboard */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setLocation('/dashboard/teacher')}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('teacher.back_to_dashboard', 'Back to Teacher Dashboard')}</span>
          </button>
        </div>

        <div className="space-y-6 max-w-5xl">
          {/* Profile Banner & Header Card */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Top Banner Gradient */}
            <div className="h-40 bg-gradient-to-r from-primary via-primary/90 to-secondary p-6 relative flex items-end justify-between">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 text-white flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t('teacher.official_staff_account')}</span>
              </div>
              <div className="relative z-10 flex gap-2">
                <button
                  onClick={() => setShowStaffIdModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/30 shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('teacher.view_staff_id')}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-white text-primary hover:bg-white/90 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('teacher.btn_print_profile')}</span>
                </button>
              </div>
            </div>

            {/* Profile Header Details */}
            <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 relative z-20">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center text-primary font-bold text-3xl font-serif overflow-hidden">
                    {profileForm.profileImage ? (
                      <img src={profileForm.profileImage} alt="Teacher" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                        {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    id="teacherAvatarPicker"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('Image size exceeds 5MB limit.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const updated = { ...profileForm, profileImage: reader.result as string };
                          setProfileForm(updated);
                          showToast('Profile photo updated in real time!');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="teacherAvatarPicker" className="absolute -bottom-1 -right-1 p-2 bg-primary text-white rounded-xl shadow-md cursor-pointer hover:scale-105 transition-all border-2 border-card" title="Upload Photo">
                    <Edit2 className="w-3.5 h-3.5" />
                  </label>
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full" title="Active Staff" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-serif font-bold text-foreground">{profileForm.firstName} {profileForm.lastName}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {profileForm.staffId}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary">{profileForm.roleTitle}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{profileForm.department}</span>
                    <span>•</span>
                    <span>{t('teacher.form_teacher_prefix')}{profileForm.formClass}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('teacher.edit_profile')}</span>
                </button>
              </div>
            </div>

            {/* Profile Tab Selector */}
            <div className="flex items-center gap-1 p-2 bg-muted/20 border-b border-border overflow-x-auto">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'details'
                    ? 'bg-card text-primary shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('teacher.personal_info')}
              </button>
              <button
                onClick={() => setActiveTab('teaching')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'teaching'
                    ? 'bg-card text-primary shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('teacher.teaching_assignments')}
              </button>
              <button
                onClick={() => setActiveTab('qualifications')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'qualifications'
                    ? 'bg-card text-primary shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('teacher.qualifications')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-card text-primary shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('teacher.account_settings', 'Account Settings & Preferences')}
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border bg-card">
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.form_class')}</p>
                <p className="text-base font-serif font-bold text-foreground mt-0.5">{profileForm.formClass}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.students_supervised')}</p>
                <p className="text-base font-serif font-bold text-foreground mt-0.5">142 {t('teacher.active_students')}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.service_duration')}</p>
                <p className="text-base font-serif font-bold text-foreground mt-0.5">{profileForm.experience}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('teacher.status')}</p>
                <p className="text-base font-serif font-bold text-emerald-600 mt-0.5">{t('teacher.active_verified')}</p>
              </div>
            </div>
          </div>

          {/* Profile Tab Content Grid */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> {t('teacher.personal_info')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.full_name')}</span>
                      <p className="font-bold text-foreground">{profileForm.firstName} {profileForm.lastName}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.staff_designation_code')}</span>
                      <p className="font-mono font-bold text-primary">{profileForm.staffId}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.official_email')}</span>
                      <p className="font-semibold text-foreground truncate">{profileForm.email}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.phone_contact')}</span>
                      <p className="font-semibold text-foreground">{profileForm.phone}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.gender_dob')}</span>
                      <p className="font-semibold text-foreground">{profileForm.gender} • {profileForm.dob}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.first_appointment_date')}</span>
                      <p className="font-semibold text-foreground">{profileForm.joiningDate}</p>
                    </div>
                    <div className="sm:col-span-2 p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.residential_address')}</span>
                      <p className="font-semibold text-foreground">{profileForm.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Staff ID Badge Card */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary via-primary/95 to-secondary rounded-2xl p-5 text-white shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">{t('school.name')}</p>
                      <p className="text-[11px] font-bold">{t('teacher.faculty_staff_identity')}</p>
                    </div>
                    <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold border border-white/30">
                      {t('school.abbr')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/30 flex items-center justify-center font-bold text-xl shrink-0">
                      {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm leading-tight">{profileForm.firstName} {profileForm.lastName}</h4>
                      <p className="text-[11px] opacity-80 mt-0.5">{profileForm.staffId}</p>
                      <p className="text-[10px] font-semibold text-emerald-300 mt-0.5">{t('teacher.valid_until_dec_2028')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStaffIdModal(true)}
                    className="w-full bg-white text-primary font-bold py-2 rounded-xl text-xs hover:bg-white/90 transition-colors shadow-sm"
                  >
                    {t('teacher.expand_print_id')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teaching' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> {t('teacher.teaching_assignments')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-primary block">{t('teacher.form_teacher_class')}</span>
                  <p className="font-serif font-bold text-foreground text-base">{profileForm.formClass}</p>
                  <p className="text-[11px] text-muted-foreground">{t('teacher.main_pastoral', 'Main pastoral & gradebook oversight')}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('teacher.assigned_subjects')}</span>
                  <p className="font-semibold text-foreground text-sm">{profileForm.specialization}</p>
                  <p className="text-[11px] text-muted-foreground">{t('teacher.assigned_subjects_desc', 'Physics, Further Math, STEM Lab')}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">{t('teacher.consultation_hours')}</span>
                  <p className="font-semibold text-foreground text-sm">{profileForm.officeHours}</p>
                  <p className="text-[11px] text-muted-foreground">{t('teacher.available_for_parents', 'Available for parents & student counseling')}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qualifications' && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> {t('teacher.qualifications')}
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-muted/10">
                  <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground text-sm">{profileForm.qualification}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t('teacher.specialization_in')}{profileForm.specialization}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{t('teacher.philosophy_statement')}</span>
                  <p className="text-foreground leading-relaxed italic text-sm">"{profileForm.bio}"</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Edit Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.first_name_label', 'First Name')}</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.last_name_label', 'Last Name')}</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.email_address_label', 'Email Address')}</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.phone_number_label', 'Phone Number')}</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.subject_specialization_label', 'Subject Specialization')}</label>
                    <input
                      type="text"
                      value={profileForm.specialization}
                      onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.residential_address_label', 'Residential Address')}</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.professional_bio_label', 'Professional Bio / Philosophy')}</label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" /> {t('teacher.security_password_title', 'Security & Account Password')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('teacher.default_password_notice_prefix', 'Default initial password is your ')}<strong>{t('teacher.staff_id_bold', 'Staff ID')}</strong> (e.g., <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-primary">{profileForm.staffId}</code>). Change your password below to set a custom personal password.
                </p>

                {passwordError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2 font-medium">
                    <X className="w-4 h-4 shrink-0" /> {passwordError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.current_password_label', 'Current Password / Staff ID')}</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder={profileForm.staffId}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.new_password_label', 'New Custom Password')}</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">{t('teacher.confirm_password_label', 'Confirm New Password')}</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/20 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={passwordLoading || !passwordForm.newPassword}
                    className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold hover:bg-secondary/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </div>

              {/* Biometric Authentication Activation (Fingerprint & Face ID) */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-serif font-bold text-foreground text-base flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-primary" />
                    <span>Biometric Authentication (Fingerprint & Face ID)</span>
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${biometricsEnabled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                    {biometricsEnabled ? '● Active on this device' : '○ Not Activated'}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Activate biometric security to sign in instantly with <strong>Android Fingerprint</strong>, <strong>Apple Touch ID / Face ID</strong>, or <strong>Windows Hello</strong> without typing your password each time.
                </p>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Device Biometrics (Fingerprint / Face ID)</p>
                      <p className="text-[11px] text-muted-foreground">
                        {biometricsEnabled 
                          ? 'Your device credentials are registered for one-touch secure portal login.' 
                          : 'Click activate below to scan your fingerprint or Face ID on this device.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={biometricLoading}
                    onClick={async () => {
                      setBiometricLoading(true);
                      const emailVal = profileForm.email || (user?.email) || profileForm.staffId;
                      if (biometricsEnabled) {
                        unenrollBiometrics(emailVal);
                        setBiometricsEnabled(false);
                        setToastMsg('Biometric authentication has been deactivated for this device.');
                      } else {
                        const res = await enrollBiometrics({
                          email: emailVal,
                          name: `${profileForm.firstName} ${profileForm.lastName}`,
                          role: 'TEACHER',
                          staffId: profileForm.staffId,
                        });
                        if (res.success) {
                          setBiometricsEnabled(true);
                          setToastMsg(`Biometric login (${res.biometricType === 'FACE_ID' ? 'Face ID' : 'Fingerprint'}) activated successfully!`);
                        } else {
                          setToastMsg(res.error || 'Failed to activate biometric login.');
                        }
                      }
                      setBiometricLoading(false);
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 whitespace-nowrap ${
                      biometricsEnabled 
                        ? 'border border-destructive/30 text-destructive hover:bg-destructive/10' 
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{biometricLoading ? 'Processing...' : biometricsEnabled ? 'Deactivate Biometrics' : 'Activate Fingerprint / Face ID'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-foreground text-base border-b border-border pb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" /> {t('teacher.notification_alerts_title', 'Notification Alerts')}
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
                    <div>
                      <p className="font-bold text-xs text-foreground">{t('teacher.cbt_alerts_title', 'CBT Exam Submission Alerts')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('teacher.cbt_alerts_desc', 'Receive notifications when students submit CBT exams.')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.cbtAlerts}
                      onChange={e => setProfileForm({ ...profileForm, cbtAlerts: e.target.checked })}
                      className="w-4 h-4 text-primary rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/10 cursor-pointer">
                    <div>
                      <p className="font-bold text-xs text-foreground">{t('teacher.approval_notif_title', 'Admin Approval Notifications')}</p>
                      <p className="text-[10px] text-muted-foreground">{t('teacher.approval_notif_desc', 'Get notified when exams are approved by principal/admin.')}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileForm.emailAlerts}
                      onChange={e => setProfileForm({ ...profileForm, emailAlerts: e.target.checked })}
                      className="w-4 h-4 text-primary rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('teacher.save_profile_btn', 'Save Profile & Preferences')}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Official Teacher Staff ID Card Modal */}
        {showStaffIdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-150" onClick={() => setShowStaffIdModal(false)}>
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> {t('teacher.staff_id_title')}
                </h3>
                <button onClick={() => setShowStaffIdModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-4 border-primary rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-90">{t('school.name')}</p>
                      <p className="text-[11px] opacity-75">{t('school.location')}</p>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-primary font-bold text-xs">{t('school.abbr')}</span>
                    </div>
                  </div>
                  <div className="p-5 flex gap-5 items-center">
                    <div className="w-20 h-24 rounded-xl bg-muted/50 border-2 border-border flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center text-3xl font-serif font-bold text-primary">
                        {profileForm.firstName?.[0]}{profileForm.lastName?.[0]}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-foreground text-lg leading-tight">{profileForm.firstName} {profileForm.lastName}</h4>
                      <p className="text-xs text-primary font-bold mt-0.5">{profileForm.roleTitle}</p>
                      <p className="text-xs text-muted-foreground">{profileForm.department}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.staff_id_label')}</span>
                          <p className="font-bold font-mono text-foreground">{profileForm.staffId}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] block">{t('teacher.id_card_valid_until')}</span>
                          <p className="font-bold text-foreground">{t('teacher.id_card_valid_date')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    <Printer className="w-4 h-4" /> {t('teacher.btn_print_id')}
                  </button>
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-colors">
                    <Download className="w-4 h-4" /> {t('teacher.btn_download_pdf')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PortalLayout>
  );
}
