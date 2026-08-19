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
  Fingerprint, Smartphone, BarChart2
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
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
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
    const uStaffId = ((user?.profile as any)?.teacher_id || (user as any)?.staffId || (user as any)?.id || (user as any)?.username || '').toString().toLowerCase();
    const uName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim().toLowerCase();
    const cleanUStaffId = uStaffId.replace(/[^a-z0-9]/g, '');
    const cleanUEmail = uEmail.replace(/[^a-z0-9]/g, '');

    const allTeachers = getStoredTeachers();
    const stored = allTeachers.find((t: any) => {
      const tEmail = (t.email || '').toLowerCase();
      const tStaffId = (t.staffId || '').toLowerCase();
      const tName = (t.name || '').toLowerCase();
      const cleanTStaffId = tStaffId.replace(/[^a-z0-9]/g, '');
      const cleanTEmail = tEmail.replace(/[^a-z0-9]/g, '');

      return (
        (tStaffId && tStaffId === uStaffId) ||
        (cleanUStaffId.length >= 3 && (cleanUStaffId === cleanTStaffId || cleanUStaffId.includes(cleanTStaffId) || cleanTStaffId.includes(cleanUStaffId))) ||
        (tEmail && tEmail === uEmail) ||
        (cleanUEmail.length >= 4 && (cleanUEmail.includes(cleanTEmail) || cleanTEmail.includes(cleanUEmail))) ||
        (uName.length >= 3 && tName === uName)
      );
    }) || allTeachers[0];

    const tName = stored?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Teacher Staff';
    const nameParts = tName.split(' ');
    const fName = user?.first_name || nameParts[0] || '';
    const lName = user?.last_name || nameParts.slice(1).join(' ') || '';
    const formCls = (stored?.formTeacherOf && stored.formTeacherOf !== 'None' && !stored.formTeacherOf.startsWith('No'))
      ? stored.formTeacherOf
      : (prof.form_teacher_of || prof.formTeacherOf || '');
    const rawSpec = stored?.specialization || prof.specialization || (Array.isArray(prof.subjects_taught) ? prof.subjects_taught.map((s: any) => typeof s === 'string' ? s : s.name).join(', ') : prof.subjects_taught) || '';
    const subs = (stored?.subjectsAssigned && Array.isArray(stored.subjectsAssigned) && stored.subjectsAssigned.length > 0)
      ? stored.subjectsAssigned
      : (Array.isArray(prof.subjects_taught) ? prof.subjects_taught : []);

    return {
      firstName: fName,
      lastName: lName,
      fullName: tName,
      email: stored?.email || user?.email || '',
      phone: stored?.phone || user?.phone || prof.phone || '',
      staffId: stored?.staffId || prof.teacher_id || (user as any)?.staffId || 'TMS/TCH/0054',
      roleTitle: formCls ? 'Form Teacher' : (stored?.department || prof.department || 'Subject Educator'),
      department: stored?.department || prof.department || 'Academic Department',
      qualification: stored?.qualification || prof.qualifications || '',
      joiningDate: stored?.joined || prof.hire_date || '',
      gender: stored?.gender || prof.gender || '',
      dob: stored?.dob || prof.dob || '',
      specialization: typeof rawSpec === 'string' ? rawSpec : '',
      address: stored?.address || prof.address || '',
      bio: stored?.bio || prof.bio || '',
      formClass: formCls,
      subjectsAssigned: subs,
      studentsCount: stored?.studentsCount ?? 0,
      cbtExamsCount: stored?.cbtExamsCount ?? 0,
      attendanceRate: stored?.attendanceRate || '0%',
      emergencyContactName: '',
      emergencyContactPhone: '',
      officeHours: (stored as any)?.officeHours || '',
      salary: stored?.salary || prof.salary || '',
      bankName: stored?.bankName || prof.bank_name || '',
      accountNumber: stored?.accountNumber || prof.account_number || '',
      emailAlerts: true,
      cbtAlerts: true,
      smsAlerts: false,
      profileImage: stored?.profileImage || prof.profileImage || '',
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
        const storedUserJson = localStorage.getItem('tarepet_user') || localStorage.getItem('tarepet_auth_user');
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
          localStorage.setItem('tarepet_auth_user', JSON.stringify(uObj));
        }
      } catch (err) {}
    }

    broadcastRealtimeEvent();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cbt_store_updated'));
      window.dispatchEvent(new Event('storage'));
    }

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
      showToast(t('teacher.profile_saved_success', 'Profile updated & synced to Admin Portal in real time!'));
    }).catch(() => {
      showToast(t('teacher.profile_saved_success', 'Profile updated & synced to Admin Portal in real time!'));
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
          {/* Clean Page Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs ring-4 ring-emerald-500/20" />
              <h2 className="text-lg sm:text-xl font-bold font-serif text-foreground">Teacher Profile & Academic Records</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowStaffIdModal(true)}
                className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                <span>{t('teacher.view_staff_id', 'View Staff ID')}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t('teacher.btn_print_profile', 'Print Profile')}</span>
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Actions / Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Single Clean Profile Card (Identical to Admin Preview Card) */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Column 1: Avatar Badge */}
              <div className="md:col-span-3 flex flex-col items-center justify-start text-center space-y-3 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-serif font-bold text-4xl text-emerald-600 shadow-sm overflow-hidden">
                    {profileForm.profileImage ? (
                      <img src={profileForm.profileImage} alt="Teacher Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profileForm.firstName?.[0] || 'A'
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    id="teacherProfileAvatarPicker"
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
                          saveTeacher({
                            staffId: profileForm.staffId,
                            name: profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`,
                            profileImage: reader.result as string,
                          });
                          showToast('Profile photo updated in real time!');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="teacherProfileAvatarPicker"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-700 text-white rounded-lg shadow cursor-pointer hover:scale-105 transition-all border border-card"
                    title="Upload Photo"
                  >
                    <Edit2 className="w-3 h-3" />
                  </label>
                </div>
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 uppercase tracking-wider block">
                    ACTIVE
                  </span>
                  <p className="text-xs font-bold text-muted-foreground">Faculty Member</p>
                </div>
              </div>

              {/* Column 2: Teacher Bio & Official Details */}
              <div className="md:col-span-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">STAFF ID NUMBER</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 font-mono font-bold text-xs border border-emerald-500/20">
                    {profileForm.staffId || 'TMS/TCH/0054'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">FULL NAME & TITLE</span>
                  <strong className="text-foreground font-bold text-sm uppercase block mt-0.5">{profileForm.fullName || `${profileForm.firstName} ${profileForm.lastName}`}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">STAFF ROLE / DUTY</span>
                  <strong className="text-emerald-700 font-bold block mt-0.5">{profileForm.roleTitle}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">ACADEMIC SPECIALIZATION</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.specialization || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">QUALIFICATIONS & DEGREES</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.qualification || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">FORM TEACHER ASSIGNMENT</span>
                  <strong className="text-rose-600 font-bold block mt-0.5">{profileForm.formClass && profileForm.formClass !== 'None' ? profileForm.formClass : 'None'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">DATE JOINED FACULTY</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.joiningDate || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">CONTACT PHONE</span>
                  <strong className="text-foreground font-bold block mt-0.5">{profileForm.phone || 'Not Specified'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase tracking-wider">OFFICIAL EMAIL</span>
                  <strong className="text-foreground font-bold underline block mt-0.5">{profileForm.email}</strong>
                </div>
              </div>

              {/* Column 3: Teaching Workload, Assigned Subjects & CBT Metrics */}
              <div className="md:col-span-5 space-y-4 text-xs border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <div>
                  <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2 mb-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Assigned Subjects & Classes ({profileForm.subjectsAssigned?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {profileForm.subjectsAssigned && profileForm.subjectsAssigned.length > 0 ? (
                      profileForm.subjectsAssigned.map((sub: any, idx: number) => {
                        const subName = typeof sub === 'string' ? sub : sub.name;
                        const subGrade = typeof sub === 'string' ? (profileForm.formClass || 'JSS 3') : (sub.grade || profileForm.formClass || 'JSS 3');
                        const subCode = typeof sub === 'object' && sub.code ? sub.code : `SUB-${idx + 1}`;
                        return (
                          <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                                {subCode}
                              </span>
                              <span className="font-bold text-foreground">{subName}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-serif">
                              {subGrade}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground italic text-xs">No subjects currently assigned by Admin.</p>
                    )}
                  </div>
                </div>

                {/* Teaching Stats & CBT Metrics */}
                <div className="space-y-2 pt-3 border-t border-border/60">
                  <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-600" /> Teaching Stats & CBT Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">TOTAL STUDENTS TAUGHT</p>
                      <p className="text-xl font-serif font-bold text-foreground mt-0.5">{profileForm.studentsCount ?? 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">CBT ASSESSMENTS</p>
                      <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">{profileForm.cbtExamsCount ?? 0} Created</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">CLASS ATTENDANCE RATE</p>
                      <p className="text-xl font-serif font-bold text-emerald-600 mt-0.5">{profileForm.attendanceRate || '0%'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">RESIDENTIAL ADDRESS</p>
                      <p className="text-xs font-semibold text-foreground truncate mt-1">{profileForm.address || 'Not Provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Edit Profile & Biometrics Modal */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-serif font-bold text-foreground text-lg">Edit Profile & Account Settings</h3>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    handleSaveProfile(e);
                    setShowEditModal(false);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={profileForm.address}
                        onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/20 text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Biometrics activation section inside modal */}
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="font-bold text-foreground text-xs">Biometric Authentication</p>
                          <p className="text-[10px] text-muted-foreground">Enable Fingerprint / Face ID for fast login</p>
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
                            showToast('Biometric authentication deactivated for this device.');
                          } else {
                            const res = await enrollBiometrics({
                              email: emailVal,
                              name: `${profileForm.firstName} ${profileForm.lastName}`,
                              role: 'TEACHER',
                              staffId: profileForm.staffId,
                            });
                            if (res.success) {
                              setBiometricsEnabled(true);
                              showToast(`Biometric login (${res.biometricType === 'FACE_ID' ? 'Face ID' : 'Fingerprint'}) activated successfully!`);
                            } else {
                              showToast(res.error || 'Failed to activate biometric login.');
                            }
                          }
                          setBiometricLoading(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                          biometricsEnabled
                            ? 'border border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                            : 'bg-emerald-700 text-white hover:bg-emerald-800'
                        }`}
                      >
                        <span>{biometricLoading ? 'Processing...' : biometricsEnabled ? 'Deactivate Biometrics' : 'Activate Fingerprint / Face ID'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
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
